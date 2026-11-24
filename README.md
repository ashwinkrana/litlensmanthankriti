# LitLens

A multi-agent AI literature review assistant: type a research topic and get a cited review built from real arXiv papers, a comparison table, and Q&A over the full-text PDFs.

- What to build: [SRS.md](SRS.md)
- How it's built: [DESIGN.md](DESIGN.md)
- Security rules: [SECURITY.md](SECURITY.md)

**Pipeline:** plan queries → search arXiv → rank with local embeddings → extract facts → write a cited review → verify citations → (background) index the PDFs → answer questions with page-level citations. Every arXiv and LLM call is cached, so repeating a topic costs nothing.

## Prerequisites
- Python **3.14**: `py -3.14 --version` (Windows) / `python3.14 --version` (macOS)
- Node.js LTS (22+): `node --version`
- A Groq API key (free tier) from console.groq.com. A Gemini key (aistudio.google.com) is optional and used only as a fallback.
- About 2 GB free disk (PyTorch CPU build + embedding model).

## 1. Configure secrets (once per machine)
Copy the example env file to `.env` in the **repo root** and fill in your own keys. `.env` is gitignored: never commit it, never share keys.

```powershell
Copy-Item .env.example .env     # Windows
```
```bash
cp .env.example .env            # macOS
```

Set at least `GROQ_API_KEY` and `ARXIV_CONTACT` (your email; arXiv asks API users for a contact). For the Gemini fallback set `GEMINI_API_KEY` and `GEMINI_MODEL` (the current Flash model ID from Google AI Studio).

## 2. Backend

### Windows (PowerShell)
```powershell
cd backend
py -3.14 -m venv .venv                 # create an isolated Python environment in .venv
.\.venv\Scripts\Activate.ps1           # activate it (if blocked: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned)
pip install -r requirements.txt        # install pinned dependencies
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### macOS (zsh)
```bash
cd backend
python3.14 -m venv .venv               # create an isolated Python environment in .venv
source .venv/bin/activate              # activate it
pip install -r requirements.txt        # install pinned dependencies
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Check it: open http://127.0.0.1:8000/api/health. Interactive API docs are at http://127.0.0.1:8000/docs when `ENV=dev`.

The first start downloads the embedding model (about 90 MB) from Hugging Face once; after that it loads from the local cache. On Windows a Hugging Face "symlinks" warning is harmless.

Tests and lint (from `backend/` with the venv active):
```powershell
pytest -q
ruff check . ; ruff format .           # Windows
```
```bash
pytest -q
ruff check . && ruff format .          # macOS
```

## 3. Frontend (both OSes)
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 ; /api is proxied to the backend on :8000
```
Open http://localhost:5173. Keep the backend running in another terminal.

**Mock mode** (no backend needed): copy `frontend/.env.example` to `frontend/.env.local` (sets `VITE_USE_MOCKS=true`) and restart `npm run dev`.

## 4. Demo mode (offline replay)

Pre-warm a few topics while you have internet. This runs each topic for real (including PDF indexing) and records it; `--ask` also caches answers to questions so Q&A works offline. From `backend/` with the venv active:

```bash
python -m scripts.prewarm "crop disease detection using deep learning" "graph neural networks for drug discovery" --ask "Which datasets are used?" --ask "What are the main limitations?"
```

Then set `DEMO_MODE=true` in `.env` and restart the backend. In demo mode:
- the home-screen chips show the pre-warmed topics, and choosing one replays its real run with realistic live timing (about 15–25 s);
- any other topic gets a friendly "Offline demo mode: choose one of the demo topics";
- only pre-warmed questions can be answered;
- **no network calls are made at all.**

Set `DEMO_MODE=false` again for live use. Pre-warmed data lives in `data/` (copy the whole `data/` folder to move it to another laptop).

## 5. Useful scripts (from `backend/`, venv active)

| Command | What it does | Quota |
|---|---|---|
| `python -m scripts.smoke "topic"` | One real end-to-end run with stage timings (`--no-index` skips PDFs) | ~6–10K tokens |
| `python -m scripts.extract "topic"` | Plan → search → rank → extract, prints the table | ~5K tokens |
| `python -m scripts.prewarm "t1" "t2" --ask "q"` | Record topics for demo mode | ~8K tokens/topic |
| `python ../eval/run_eval.py` | Evaluate the 10 topics in `eval/topics.yaml`; writes `eval/results.md` + `.csv` | ~60K tokens first time, free when cached |

### Test the Gemini fallback (SRS FR-53)
With Gemini configured, set `DEBUG_FORCE_GROQ_429=true` (only works with `ENV=dev`), restart the backend and run a new topic. Every Groq call now fails with a 429, so the timeline shows the provider switching to **gemini**. Set it back to `false` afterwards.

## 6. Using the API directly
```powershell
curl.exe -s -X POST http://127.0.0.1:8000/api/reviews -H "Content-Type: application/json" -d '{\"topic\":\"graph neural networks for drug discovery\"}'
```
Returns `{"job_id": "...", "status": "queued"}`. Then:
- live progress: `curl.exe -N http://127.0.0.1:8000/api/reviews/<job_id>/events`
- result: `http://127.0.0.1:8000/api/reviews/<job_id>`
- exports: `.../<job_id>/export?format=md` or `?format=bib`
- question (once indexing is `completed`): `POST .../<job_id>/ask` with `{"question": "..."}`

On macOS use `curl` instead of `curl.exe` and plain quotes: `-d '{"topic":"..."}'`.

Reviews are saved in `data/reviews/`, PDFs in `data/pdfs/`, the vector index in `data/chroma/` and the cache in `data/cache.sqlite`. `data/` is only a cache and can be deleted at any time.

## 7. Moving to the Mac (demo laptop)

**Apple Silicon (M1 or newer) only.** PyTorch no longer ships builds for Intel Macs, so `pip install` fails there. Check with  → About This Mac: "Chip: Apple M…" is fine.

1. **Install the tools once.** Python 3.14 from python.org (the macOS installer gives you `python3.14`) or `brew install python@3.14`; Node.js LTS from nodejs.org or `brew install node`. Check with `python3.14 --version` and `node --version`.
2. **Get the code:** `git clone <repo-url>` (or `git pull` if it is already there).
3. **Copy what git doesn't carry** (by USB drive or AirDrop, never through git or chat):
   - the repo-root `.env` with your keys (or make a new one: `cp .env.example .env`);
   - for demo mode, the whole `data/` folder from the Windows laptop, into the repo root. Reviews, cache and indexes are plain files and work on both OSes.
4. **Backend:** the macOS commands in section 2. The first start downloads the embedding model (~90 MB) once.
5. **Frontend:** `cd frontend && npm install && npm run dev`. Use `npm install`, not `npm ci --omit=optional`, so the Mac-native build tools get installed.
6. **Run `pytest -q`** in `backend/` and open http://localhost:5173.

Embeddings always run on the CPU (not the Mac GPU), so rankings match the Windows laptop exactly and pre-warmed demo data replays the same.

## 8. Pre-demo checklist (SECURITY §11)
Do these the day **before** the demo:
- [ ] `git pull` on the demo laptop; `pip install -r requirements.txt` and `npm install` succeed
- [ ] `.env` is not tracked: `git ls-files | findstr .env` (Windows) / `git ls-files | grep .env` (macOS) shows only `.env.example` files
- [ ] Secret scan of the history is clean: `git log -p | findstr gsk_` / `git log -p | grep gsk_` prints nothing
- [ ] `pytest -q` passes on the demo laptop
- [ ] Pre-warm 3–5 demo topics (section 4) and test `DEMO_MODE=true` with Wi-Fi switched **off**
- [ ] Gemini fallback tested once with `DEBUG_FORCE_GROQ_429=true`, then set back to `false`
- [ ] For the demo run: `ENV=prod` (hides `/docs`), `HOST=127.0.0.1`, `DEBUG_FORCE_GROQ_429=false`
- [ ] College Wi-Fi reaches `api.groq.com` and `arxiv.org` (otherwise use demo mode or a phone hotspot)
- [ ] `pip-audit` / `npm audit`: no unfixed high/critical issues
- [ ] Rendering check: a title containing `<script>alert(1)</script>` shows as plain text

On demo morning: **don't** run the eval or pre-warm (keep the daily quota for live topics).

## Repo layout
See [DESIGN.md §8](DESIGN.md). The API contract lives in three places that must stay in sync: `backend/app/models/schemas.py`, `frontend/src/api/types.ts` and `frontend/src/mocks/*.json`. `backend/tests/test_mocks_match_schemas.py` checks the mocks against the backend models.
