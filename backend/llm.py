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


# Model fallback lists. Each provider tries its models in order; first success wins.
# Verified live 2026-04-11 against the current account keys.
# Gemini 1.5-* models were removed from v1beta API. Only 2.0-flash/lite remain;
# they share the same free-tier quota, so adding more is mostly futile — listed
# for completeness in case one clears while the other is throttled.
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]
# OpenRouter: big :free models (llama-3.3-70b, qwen-72b, deepseek) are upstream
# rate-limited at the provider pool level. Google's Gemma 3 :free variants are
# reliably reachable today. Llama-3.3-70b kept as opportunistic first attempt
# in case the rate limit clears; Gemma 3 12B is the dependable best-quality pick.
OPENROUTER_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-12b-it:free",
    "google/gemma-3-4b-it:free",
    "google/gemma-3n-e4b-it:free",
    "google/gemma-3n-e2b-it:free",
]
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

    # Try each model in order. Free-tier quotas are per-model so 429 on one
    # leaves others available. First success wins.
    attempts: List[str] = []
    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        try:
            data = _http_post_json(url, headers={}, body=body)
        except ProviderError as e:
            attempts.append(f"{model}: {e.detail[:150]}")
            print(f"[LLM][gemini] model={model} failed: {e.detail[:150]}")
            continue

        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            print(f"[LLM][gemini] model={model} ok")
            return text
        except (KeyError, IndexError, TypeError):
            attempts.append(f"{model}: unexpected response")
            print(f"[LLM][gemini] model={model} unexpected response")
            continue

    raise ProviderError("gemini", " | ".join(attempts) or "no models attempted")


def _openrouter(messages: List[Dict[str, str]]) -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise ProviderError("openrouter", "OPENROUTER_API_KEY not set")

    headers = {
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": "https://huggingface.co/spaces/omar559/Kharbasha-api",
        "X-Title": "Kharbasha",
    }

    # OpenRouter :free models come and go. Try each; first success wins.
    attempts: List[str] = []
    for model in OPENROUTER_MODELS:
        body = {"model": model, "messages": messages}
        try:
            data = _http_post_json(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                body=body,
            )
        except ProviderError as e:
            attempts.append(f"{model}: {e.detail[:120]}")
            print(f"[LLM][openrouter] model={model} failed: {e.detail[:150]}")
            continue

        # OpenRouter returns 200 with {"error": {...}} when upstream provider fails
        if isinstance(data, dict) and data.get("error"):
            err_msg = data["error"].get("message", "upstream error") if isinstance(data["error"], dict) else str(data["error"])
            attempts.append(f"{model}: {err_msg[:120]}")
            print(f"[LLM][openrouter] model={model} upstream error: {err_msg[:150]}")
            continue

        try:
            text = data["choices"][0]["message"]["content"]
            if not text:
                attempts.append(f"{model}: empty content")
                print(f"[LLM][openrouter] model={model} empty content")
                continue
            print(f"[LLM][openrouter] model={model} ok")
            return text
        except (KeyError, IndexError, TypeError):
            attempts.append(f"{model}: unexpected response")
            print(f"[LLM][openrouter] model={model} unexpected response")
            continue

    raise ProviderError("openrouter", " | ".join(attempts) or "no models attempted")


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
