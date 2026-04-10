# Kharbasha (خربشة) — Project Overview

> Agentic Scraping & Crawling Platform with Egyptian/Saudi Arabic dialect support.

## 1. What it is

Kharbasha is a small web platform with three user-facing features (all in Arabic):

| Feature | Backend RPC | Frontend view |
|---------|-------------|---------------|
| Scrape a single URL → markdown | `scrape_url` | `features/ScraperView.tsx` |
| Crawl a domain with SSE progress updates | `crawl_domain_streaming` | `features/CrawlerView.tsx` |
| Run an agent task with thinking/acting stream | `run_agent_task_streaming` | `features/AgentView.tsx` |
| Job history / delete | `get_history_rpc`, `delete_job_rpc` | `features/HistoryView.tsx` |

The dialect system (Egyptian vs Saudi) changes the user-facing status messages in `backend/main.py:STATUS_MSGS` and is selected via `features/DialectContext.tsx`.

## 2. Architecture

```
┌────────────────────────┐         ┌──────────────────────────┐
│   Vercel (frontend)    │  CORS   │   HF Space (full app)    │
│   kharbasha-platform-  │ ──────> │   omar559-kharbasha-api  │
│   main.vercel.app      │         │   .hf.space              │
│                        │         │                          │
│   React/Vite SPA       │         │  FastAPI (server.py)     │
│   __APP_CONFIG__ ──┐   │         │  ├─ /              SPA   │
│   dataEndpoint =   │   │         │  ├─ /assets/*      static│
│   hf.space/data    │   │         │  ├─ POST /data     RPC   │
│                    └───┼────────►│  └─ POST /data/stream SSE│
└────────────────────────┘         │                          │
                                   │  backend/main.py (RPCs)  │
                                   │  ├─ scrape_url           │
                                   │  ├─ crawl_domain_streaming│
                                   │  ├─ run_agent_task_stream │
                                   │  └─ get_history_rpc       │
                                   │                          │
                                   │  backend/db.py → SQLite  │
                                   │  (/app/data/db/...)      │
                                   │                          │
                                   │  nexttoken SDK →         │
                                   │  LLM + fetch.url()       │
                                   └──────────────────────────┘
```

**Key point:** the frontend expects a global `window.__APP_CONFIG__ = { appName, dataEndpoint, runId }`. If it's missing, `frontend/src/api.ts` crashes with `Cannot read properties of undefined (reading 'appName')`. Two things provide it:

1. `backend/server.py::_render_index()` injects it into `<head>` with a **relative** `/data` endpoint (same-origin, HF Space path).
2. `frontend/index.html` has a fallback block that sets it to the **absolute** HF Space URL — this is what makes the Vercel build work, relying on CORS from the FastAPI middleware.

## 3. Directory layout

```
kharbasha-platform-main/
├── .github/workflows/sync_to_hub.yml   # Push GitHub → HF Space on every commit
├── Dockerfile                          # HF Space build: Python + Playwright + uvicorn
├── README.md                           # HF Space YAML frontmatter (title/emoji/sdk:docker/app_port)
├── vercel.json                         # Vercel build config (builds frontend/)
├── .vercelignore                       # Excludes claude.exe + backend + logs from upload
├── backend/
│   ├── server.py                       # FastAPI — serves SPA + exposes RPCs (added by this session)
│   ├── main.py                         # RPC function library (uses `nexttoken` SDK)
│   ├── db.py                           # SQLite helpers; DB_DIR = /app/data/db
│   ├── requirements.txt                # fastapi, uvicorn[standard], nexttoken, bs4, markdownify
│   └── data/db/kharbasha.db            # Seed SQLite file (committed)
└── frontend/
    ├── index.html                      # Contains the __APP_CONFIG__ fallback script
    ├── package.json                    # react 18, vite 5, tailwind, framer-motion, recharts...
    ├── vite.config.ts                  # base: './' (relative paths — required for subdir serving)
    ├── tailwind.config.js, postcss.config.js
    ├── public/assets/*                 # Images, logos, flags
    ├── dist/                           # Built output (committed — used by Vercel + HF Space)
    └── src/
        ├── main.tsx, App.tsx, index.css
        ├── api.ts                      # rpcCall() + streamCall() — reads __APP_CONFIG__
        ├── useSSE.ts                   # SSE reader for streaming endpoints
        ├── useAgentChat.ts             # Agent chat state machine
        ├── features/
        │   ├── ScraperView.tsx
        │   ├── CrawlerView.tsx
        │   ├── AgentView.tsx
        │   ├── HistoryView.tsx
        │   └── DialectContext.tsx
        ├── components/ui/*.tsx         # shadcn-style primitives (button, card, dialog, ...)
        └── lib/utils.ts                # cn() (clsx + tailwind-merge)
```

## 4. Deployment surfaces

| Surface | URL | Role | Status |
|---------|-----|------|--------|
| GitHub repo | github.com/Omarhussien2/kharbasha-platform | Source of truth, branch `main` | ✅ Up to date |
| Vercel (frontend only) | kharbasha-platform-main.vercel.app | Static SPA — calls HF backend via CORS | ✅ Deployed, config fixed |
| HF Space (full stack) | huggingface.co/spaces/omar559/Kharbasha-api → omar559-kharbasha-api.hf.space | Docker container = FastAPI + frontend + backend | ✅ Deployed and Running |

## 5. How to build / run locally

```bash
# Frontend dev
cd frontend
npm install
npm run dev        # http://localhost:5173

# Frontend prod build (what Vercel and HF Space both serve)
npm run build      # outputs to frontend/dist

# Backend locally (once HF Space sync works)
cd backend
pip install -r requirements.txt
STATIC_DIR=../frontend/dist python server.py   # http://localhost:7860
```

## 6. Env / secrets

- **GitHub repo secret `HF_TOKEN`** — used by `.github/workflows/sync_to_hub.yml` to push to HF Space. It *is* valid (the workflow verified `whoami-v2` returns 200) but the `git push` itself is still failing — see `HANDOFF.md`.
- **HF Space secrets** — whatever `nexttoken` SDK needs (API key for the LLM + fetch service). Set them in HF Space settings, not in code.
- **Vercel team**: `samawahs-projects` (`team_CPrxylwRcjjRd3nCtrblNKjk`). The `kharbasha-platform` project under `omarhussien2s-projects` is linked to GitHub but all its builds fail — our CLI deploy created a *different* project `kharbasha-platform-main` under `samawahs-projects` which is what we're actually using.

## 7. Deliberately unusual things to know

- **Every file in the repo was originally committed as base64-encoded text.** Every `.py`, `.tsx`, `.json`, `.html`, `.js`, the Dockerfile, `vercel.json`, `README.md` — all base64. This is what broke both Vercel builds and the HF Space. All files have been decoded locally and pushed, but the history on both GitHub and HF Space still contains the broken commits.
- **`claude.exe` (230 MB)** sits at the project root. It's in `.vercelignore` so Vercel doesn't upload it; it is *not* tracked by git. Leave it alone unless the user asks otherwise.
- **`backend/main.py` import path** used to be `from apps.kharbasha.backend.db import ...` — that's a legacy path from a different host platform. It has been rewritten to `from db import ...` so the Dockerfile layout (`/app/backend/main.py` + `/app/backend/db.py`) works with `sys.path` including the backend directory (set up in `server.py`).
- **`DB_DIR`** was originally `apps/kharbasha/backend/data/db` (same legacy convention). Fixed to `/app/data/db` and the Dockerfile pre-creates it with `chmod 777`.

## 8. Tech reference

- **Frontend:** React 18, Vite 5, TailwindCSS 3, Framer Motion, Recharts, Radix/shadcn-style components, react-markdown + remark-gfm
- **Backend:** Python 3.11, FastAPI + uvicorn[standard], nexttoken SDK, BeautifulSoup4, markdownify, Playwright + browser-use (installed via Dockerfile for the agent task)
- **Deployment:** Dockerfile (HF Space, SDK=docker, app_port=7860), Vercel static SPA
- **Storage:** SQLite (3 tables: `jobs`, `results`, `agent_sessions`)
