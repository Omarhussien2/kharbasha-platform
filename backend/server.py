"""
FastAPI server that serves the Kharbasha frontend and exposes backend RPC functions.

- Serves the built React app from /app/static (injects window.__APP_CONFIG__ into index.html)
- POST /data         -> sync RPC: body { module, func, args } -> JSON result
- POST /data/stream  -> SSE RPC:  body { module, func, args } -> streaming chunks
"""

import os
import json
import importlib
import inspect
import traceback
import uuid
from typing import Any, Dict

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Ensure we can import `main` and `db` as top-level modules
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

STATIC_DIR = os.environ.get("STATIC_DIR", "/app/static")
APP_NAME = os.environ.get("APP_NAME", "kharbasha")
RUN_ID = os.environ.get("RUN_ID") or str(uuid.uuid4())

APP_CONFIG = {
    "appName": APP_NAME,
    "dataEndpoint": "/data",
    "runId": RUN_ID,
}

app = FastAPI(title="Kharbasha Platform")

# CORS — allow the Vercel frontend (and others) to call the API directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _resolve_module(module_path: str):
    """Resolve incoming module path (e.g. 'apps.kharbasha.backend.main') to our local 'main' module."""
    if not module_path:
        module_path = "main"
    # Strip host-platform prefix used by the frontend
    for prefix in ("apps.kharbasha.backend.", "backend."):
        if module_path.startswith(prefix):
            module_path = module_path[len(prefix):]
            break
    try:
        return importlib.import_module(module_path)
    except ImportError as e:
        raise HTTPException(status_code=404, detail=f"Module '{module_path}' not found: {e}")


def _resolve_func(module_path: str, func_name: str):
    mod = _resolve_module(module_path)
    fn = getattr(mod, func_name, None)
    if fn is None or not callable(fn):
        raise HTTPException(status_code=404, detail=f"Function '{func_name}' not found in module")
    return fn


@app.get("/health")
async def health():
    return {"status": "ok", "app": APP_NAME}


@app.post("/data")
async def rpc_data(request: Request):
    try:
        body: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    func_name = body.get("func")
    args = body.get("args") or {}
    module_path = body.get("module") or ""
    if not func_name:
        raise HTTPException(status_code=400, detail="Missing 'func' field")

    fn = _resolve_func(module_path, func_name)
    try:
        result = fn(**args) if args else fn()
        # Non-streaming RPC expects a JSON-serializable result
        if inspect.isgenerator(result):
            # Consume the generator into a list if someone called a streaming fn via /data
            result = list(result)
        return JSONResponse(result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[RPC_ERROR] {func_name}: {e}")
        traceback.print_exc()
        return JSONResponse(
            {"error": str(e), "trace": traceback.format_exc().splitlines()[-5:]},
            status_code=500,
        )


def _sse_format(chunk: Any) -> str:
    try:
        payload = json.dumps(chunk, ensure_ascii=False)
    except (TypeError, ValueError):
        payload = json.dumps({"type": "raw", "content": str(chunk)}, ensure_ascii=False)
    return f"data: {payload}\n\n"


@app.post("/data/stream")
async def rpc_stream(request: Request):
    try:
        body: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    func_name = body.get("func")
    args = body.get("args") or {}
    module_path = body.get("module") or ""
    if not func_name:
        raise HTTPException(status_code=400, detail="Missing 'func' field")

    fn = _resolve_func(module_path, func_name)

    def event_generator():
        try:
            result = fn(**args) if args else fn()
            if inspect.isgenerator(result):
                for chunk in result:
                    yield _sse_format(chunk)
            else:
                yield _sse_format({"type": "done", "result": result, "progress": 100})
        except Exception as e:
            print(f"[STREAM_ERROR] {func_name}: {e}")
            traceback.print_exc()
            yield _sse_format({"type": "error", "error": str(e), "progress": 0})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _render_index() -> HTMLResponse:
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse(
            f"<h1>Frontend not found</h1><p>Looked in: {index_path}</p>",
            status_code=500,
        )
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()
    inject = (
        f'<script>window.__APP_CONFIG__ = {json.dumps(APP_CONFIG)};</script>'
    )
    # Insert just after the opening <head>
    if "<head>" in html:
        html = html.replace("<head>", f"<head>\n    {inject}", 1)
    else:
        html = inject + html
    return HTMLResponse(html)


@app.get("/")
async def index_root():
    return _render_index()


# Serve hashed asset bundles directly from /assets
if os.path.isdir(os.path.join(STATIC_DIR, "assets")):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(STATIC_DIR, "assets")),
        name="assets",
    )


@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    # Serve existing static files (manifest.json, favicon, images, etc.)
    static_file = os.path.join(STATIC_DIR, full_path)
    if os.path.isfile(static_file):
        return FileResponse(static_file)
    # Otherwise SPA routing -> index.html
    return _render_index()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "7860"))
    print(f"[SERVER_START] Kharbasha platform on port {port}")
    print(f"[SERVER_CONFIG] STATIC_DIR={STATIC_DIR} APP_NAME={APP_NAME}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
