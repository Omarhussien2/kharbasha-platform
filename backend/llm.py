"""
Multi-provider LLM adapter with automatic fallback.

Tries providers in order. Each provider is skipped if its API key env var is
missing, or falls through to the next on any error (rate limit, quota, auth,
network, bad response). Returns the first successful completion.

Providers, in order:
  1. Gemini       (GEMINI_API_KEY)     — fastest, most generous free tier
  2. OpenRouter   (OPENROUTER_API_KEY) — free :free models, OpenAI-compatible
  3. HuggingFace  (HF_TOKEN)           — reliable fallback, already on Space

All calls are non-streaming. Outer generators in main.py handle UI streaming.
Keys MUST come from environment (HF Space Secrets). Never hardcode.
"""
import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Optional, Tuple, Callable


# Model selection per provider. Tune here without touching call sites.
GEMINI_MODEL = "gemini-2.0-flash"
OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free"
HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct"

DEFAULT_TIMEOUT = 30


class ProviderError(Exception):
    """Raised when a provider call fails. Always permits fallback."""
    def __init__(self, provider: str, detail: str):
        self.provider = provider
        self.detail = detail
        super().__init__(f"[{provider}] {detail}")


def _http_post_json(url: str, headers: Dict[str, str], body: Dict, timeout: int = DEFAULT_TIMEOUT) -> Dict:
    """POST JSON, return parsed JSON. Raises ProviderError on any failure."""
    data = json.dumps(body).encode("utf-8")
    merged = {**headers, "Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=merged, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = ""
        try:
            err_body = e.read().decode("utf-8", errors="replace")[:400]
        except Exception:
            pass
        raise ProviderError("http", f"HTTP {e.code}: {err_body}")
    except urllib.error.URLError as e:
        raise ProviderError("http", f"network error: {e.reason}")
    except Exception as e:
        raise ProviderError("http", f"unexpected: {e}")


def _gemini(messages: List[Dict[str, str]]) -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ProviderError("gemini", "GEMINI_API_KEY not set")

    # Gemini splits system from conversation turns and uses role "model" for assistant
    system_text = ""
    contents: List[Dict] = []
    for m in messages:
        role = m.get("role", "user")
        text = m.get("content", "")
        if role == "system":
            system_text += (text + "\n")
        else:
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({"role": gemini_role, "parts": [{"text": text}]})

    # Gemini requires at least one `contents` entry
    if not contents:
        contents = [{"role": "user", "parts": [{"text": system_text or "Hello"}]}]
        system_text = ""

    body: Dict = {"contents": contents}
    if system_text:
        body["systemInstruction"] = {"parts": [{"text": system_text.strip()}]}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={key}"
    try:
        data = _http_post_json(url, headers={}, body=body)
    except ProviderError as e:
        raise ProviderError("gemini", e.detail)

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        raise ProviderError("gemini", f"unexpected response: {json.dumps(data)[:300]}")


def _openrouter(messages: List[Dict[str, str]]) -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise ProviderError("openrouter", "OPENROUTER_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": "https://huggingface.co/spaces/omar559/Kharbasha-api",
        "X-Title": "Kharbasha",
    }
    body = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
    }
    try:
        data = _http_post_json(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            body=body,
        )
    except ProviderError as e:
        raise ProviderError("openrouter", e.detail)

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise ProviderError("openrouter", f"unexpected response: {json.dumps(data)[:300]}")


def _huggingface(messages: List[Dict[str, str]]) -> str:
    token = (
        os.environ.get("HF_TOKEN")
        or os.environ.get("HUGGINGFACE_HUB_TOKEN")
        or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    )
    if not token:
        raise ProviderError("huggingface", "HF_TOKEN not set")

    try:
        from huggingface_hub import InferenceClient
    except ImportError:
        raise ProviderError("huggingface", "huggingface_hub not installed")

    try:
        client = InferenceClient(token=token, timeout=DEFAULT_TIMEOUT)
        result = client.chat_completion(
            messages=messages,
            model=HF_MODEL,
            max_tokens=1024,
        )
        return result.choices[0].message.content
    except Exception as e:
        raise ProviderError("huggingface", str(e)[:300])


# First success wins. Order = priority.
PROVIDERS: List[Tuple[str, Callable[[List[Dict[str, str]]], str]]] = [
    ("gemini", _gemini),
    ("openrouter", _openrouter),
    ("huggingface", _huggingface),
]


def chat_completion(messages: List[Dict[str, str]]) -> Tuple[str, str]:
    """
    Try each provider in order. Return (text, provider_name) on first success.
    Raise the last ProviderError if every provider fails.
    """
    last_error: Optional[ProviderError] = None
    attempted: List[str] = []
    for name, fn in PROVIDERS:
        try:
            text = fn(messages)
            print(f"[LLM] provider={name} ok")
            return text, name
        except ProviderError as e:
            print(f"[LLM] provider={name} failed: {e.detail[:200]}")
            attempted.append(name)
            last_error = e
            continue
    if last_error is None:
        raise ProviderError("all", "no providers configured")
    raise ProviderError("all", f"all providers failed ({', '.join(attempted)}); last: {last_error.detail[:200]}")


def probe_providers() -> Dict[str, Dict[str, object]]:
    """
    Diagnostic: probe each provider individually with a tiny ping message.
    Returns per-provider {ok, env_set, error}. Never raises.
    Use this to verify which providers are actually reachable in the runtime env.
    """
    probe_messages = [{"role": "user", "content": "ping"}]
    report: Dict[str, Dict[str, object]] = {}

    # Also report which env vars are visible (just presence, never values)
    env_visibility = {
        "GEMINI_API_KEY": bool(os.environ.get("GEMINI_API_KEY")),
        "OPENROUTER_API_KEY": bool(os.environ.get("OPENROUTER_API_KEY")),
        "HF_TOKEN": bool(os.environ.get("HF_TOKEN")),
        "HUGGINGFACE_HUB_TOKEN": bool(os.environ.get("HUGGINGFACE_HUB_TOKEN")),
        "HUGGING_FACE_HUB_TOKEN": bool(os.environ.get("HUGGING_FACE_HUB_TOKEN")),
    }

    for name, fn in PROVIDERS:
        entry: Dict[str, object] = {"ok": False, "error": None}
        try:
            text = fn(probe_messages)
            entry["ok"] = True
            entry["sample"] = (text or "")[:120]
        except ProviderError as e:
            entry["error"] = e.detail[:400]
        except Exception as e:
            entry["error"] = f"unexpected: {str(e)[:400]}"
        report[name] = entry

    return {"env": env_visibility, "providers": report}
