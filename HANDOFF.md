# Kharbasha — Handoff to Next Session

> **Start here.** This document reflects the state of the platform as of 2026-04-10, ready for the upcoming development phase. All major blockers, deployment issues, and core features have been resolved.

---

## 1. Current State & Achievements

| Feature/Component | Status | Description |
|---|---|---|
| **Vercel Frontend** | ✅ Live & Working | Frontend deployed perfectly at `https://kharbasha-platform-main.vercel.app` |
| **HF Space Backend** | ✅ Live & Running | Hugging Face Docker Space `omar559/Kharbasha-api` builds and serves the API |
| **Scraper** | ✅ Fully Functional | Scrapes sites successfully using local BeautifulSoup+markdownify fallback |
| **Smart Agent Badge** | ✅ Updated | Modern "قريباً" (Soon) badge added alongside the Agent to indicate WIP/upcoming updates |
| **End-to-End Test** | ✅ Passed | The frontend communicates flawlessly via CORS to the HF Space Backend |

## 2. Challenges Overcome Log

We faced and successfully solved multiple complex challenges in bringing Kharbasha to life.

1. **HF Space Build Crash (`apt-get` failure)**: 
   - *Challenge*: The Hugging Face Dockerfile was consistently failing (Exit code 1 / 503 Service Unavailable) because of an OS-level package typo (`librandr2`).
   - *Solution*: Corrected the dependency to `libxrandr2`.
   
2. **HF Space `USER` Permissions Failure**:
   - *Challenge*: Hugging Face strictly enforces that Spaces Docker containers *run* as unprivileged `user 1000`. If write permissions are needed on runtime directories like databases or Playwright caches, they fail.
   - *Solution*: Restructured the `Dockerfile` to create `user 1000`, modified `backend/db.py` to use relative paths (`data/db`), and explicitly granted `$HOME/app` ownership to `user`.

3. **Backend API Parsing Bugs for Scraper (404 Not Found)**:
   - *Challenge*: Initially, `NextToken`'s Python SDK was hardcoded to fetch using `api.nexttoken.co/fetch` which returned `404 Not Found`, breaking both Scraper and Crawler.
   - *Solution*: Implemented a robust fallback called `fetch_url_local` using `urllib`, `BeautifulSoup4`, and `markdownify` to locally handle scraping inside the server without relying on the failing external fetching API.

4. **Agent Parameter Mismatch Breakdown**:
   - *Challenge*: The Vercel UI was sending `{ "message": "..." }` whereas `main.py`'s `run_agent_task_streaming` function strictly expected `{ "task": "..." }`, leading to a crash.
   - *Solution*: Renamed the `task` argument to `message` in `main.py` ensuring the RPC wrapper works securely out-of-the-box.

5. **Smart Agent Authentication issue**:
   - *Challenge*: Encountered an error sending the Gemini key (`AIza...`) to the NextToken/LiteLLM handler which expects a specific proxy format (`sk-...`). 
   - *Status*: Logged it below for upcoming development.

## 3. Preparation For Upcoming Development

We are preparing to develop the project further. The following notes should guide the next session:

**File Organization & Workflows**
- `backend/main.py`: Contains the core API logic (`fetch_url_local` performs the robust scraping).
- `backend/server.py`: The FastAPI server enabling CORS and SSE output streaming for our Live-Events UI.
- `frontend/src/App.tsx`: Currently includes the layout. The `قريباً` badge is set.

**Known Roadblocks for Next Iteration**
1. **Agent Setup API Keys:** Fix how `gemini-2.5-flash-lite` interacts with the `NextToken/LiteLLM` layer. We must either change the backend code to instantiate Google's Generative AI SDK natively, or configure the NextToken client locally parameter properly to accept the provided API key.
2. **Crawler Depth Control:** The crawler limits to 5 pages, but isn't checking domain boundaries perfectly or respecting robots.txt yet.
3. **Database Concurrency:** Expand `SQLite` logic with thread-safe decorators (it handles connections fine now, but might lock under heavy load).

## 4. Useful URLs

- Vercel Live Website: https://kharbasha-platform-main.vercel.app
- GitHub repo: https://github.com/Omarhussien2/kharbasha-platform
- HF Space: https://huggingface.co/spaces/omar559/Kharbasha-api

## 5. First Actions for Next Developer

1. Run `git pull` locally.
2. Review `backend/main.py` to restructure the Smart Agent's usage of LiteLLM/Gemini APIs.
3. Remove the "قريباً" badge in `App.tsx` once the Agent function supports the intended logic.
