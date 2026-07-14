# AI Meeting Summarizer

> A production-style full-stack application that turns meeting **audio recordings**
> into a **transcript**, **summary**, **key decisions**, and **action items** with
> owners and deadlines — entirely on **free / local models**.

Built for a BTech CSE (AI) assignment. No paid Whisper API, no paid LLM — the
speech-to-text runs on **local OpenAI Whisper** and summarization uses the
**Google Gemini free tier** (or a **local Ollama** model).

---

## Features

- **Local Speech-to-Text** — OpenAI Whisper (`base` recommended) runs on your machine.
- **Structured LLM Summarization** — summary, decisions, and action items as JSON.
- **Free LLM options** — Google Gemini free tier *or* local Ollama (Gemma / Llama 3 / Mistral).
- **Background processing** — uploads return instantly; the pipeline runs in a worker thread.
- **Modern dashboard UI** — dark sidebar, clean white cards, blue/purple accents.
- **4 pages** — Dashboard, Upload, Meeting Result, History.
- **Search, copy, progress animations, empty/error/loading states.**
- **Secure** — `.env` config, file-type + size validation, allowed extensions only.

---

## Architecture

```
┌─────────────┐     upload      ┌──────────────────────────────┐
│   React     │ ──────────────▶ │  FastAPI (backend)           │
│  Dashboard  │                 │  POST /api/meetings/upload   │
│  Upload     │                 │        │                      │
│  Result     │                 │        ▼                      │
│  History    │                 │  file_service (validate)     │
└─────────────┘                 │        │                      │
      │  Axios  ◀───────────────│        ▼                      │
      └────────  GET results     │  whisper_service (local)     │
                                │        │  transcript          │
                                │        ▼                      │
                                │  llm_service (Gemini/Ollama) │
                                │        │  {summary,decisions, │
                                │        │   action_items}      │
                                │        ▼                      │
                                │  SQLAlchemy → SQLite/Postgres │
                                └──────────────────────────────┘
```

**Pipeline:** Audio Upload → Audio Processing → Local Whisper (ASR) → Transcript
→ LLM Processing → Summary + Decisions + Action Items → Database → Frontend Dashboard.

---

## Tech Stack

| Layer      | Technology                                            |
|------------|-------------------------------------------------------|
| Backend    | Python, FastAPI, SQLAlchemy, Pydantic, SQLite/Postgres |
| ASR        | OpenAI Whisper (local, `whisper-base`)                |
| LLM        | Google Gemini free tier **or** Ollama (local)         |
| Frontend   | React + Vite, Tailwind CSS, Axios, React Router       |
| Background | Threaded `TaskRunner` with DB status updates          |

---

## Project Structure

```
AI-Meeting-Summarizer/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── database.py             # SQLAlchemy engine + session
│   ├── models.py               # Meeting table
│   ├── schemas.py              # Pydantic request/response models
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   └── meeting.py          # POST upload, GET meeting(s)
│   ├── services/
│   │   ├── whisper_service.py  # local Whisper transcription
│   │   ├── llm_service.py      # Gemini / Ollama structured output
│   │   └── file_service.py     # extension + size validation
│   ├── utils/
│   │   ├── __init__.py         # DB update helper
│   │   └── background.py       # threaded task runner
│   └── uploads/                # saved audio (gitignored)
└── frontend/
    ├── src/
    │   ├── api.js              # Axios client + polling helpers
    │   ├── App.jsx             # Layout + routes
    │   ├── components/         # Sidebar, MeetingCard, StatusBadge
    │   └── pages/              # Dashboard, Upload, MeetingResult, History
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- **FFmpeg** (required by Whisper): [download](https://ffmpeg.org) and ensure
  `ffmpeg -version` works in your terminal.

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

cp .env.example .env           # then add your GEMINI_API_KEY
```

Edit `.env`:

```ini
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_free_key_here   # https://aistudio.google.com/apikey
WHISPER_MODEL=base
```

> **Prefer 100% offline?** Set `LLM_PROVIDER=ollama`, install
> [Ollama](https://ollama.com), then `ollama pull gemma3`. No API key needed.

Run the API:

```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## API Reference

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | `/api/meetings`           | List all meetings (newest first)     |
| POST   | `/api/meetings/upload`    | Upload audio, returns `{id, status}` |
| GET    | `/api/meetings/{id}`      | Get transcript + summary + items     |

### Upload Response

```json
{ "id": 1, "status": "processing" }
```

### Meeting Response

```json
{
  "id": 1,
  "filename": "standup.mp3",
  "transcript": "…",
  "summary": "…",
  "decisions": ["Deployment moved to Monday"],
  "action_items": [
    { "task": "Prepare report", "owner": "John", "deadline": "15 July" }
  ],
  "status": "completed",
  "duration": null,
  "created_at": "2026-07-13T00:31:46"
}
```

The frontend polls `GET /api/meetings/{id}` until `status` is `completed` or `failed`.

---

## Security

- All secrets live in `.env` (gitignored). Never commit `.env`.
- Uploads are restricted to `.mp3/.wav/.m4a/.ogg/.flac` and **50 MB max**.
- CORS is limited to `http://localhost:5173`.
- Meeting fields are stored as JSON in the database.

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `500 Internal Server Error` | Bug in backend logic | Read the FastAPI terminal traceback |
| `openai.RateLimitError 429` | Paid API credits gone | Use local Whisper + free LLM (this project) |
| `httpx.RemoteProtocolError` | External API down | This app avoids paid APIs; check Gemini/Ollama |
| CORS error | Frontend origin blocked | `CORSMiddleware` already allows `:5173` |
| `ModuleNotFoundError` | Deps not installed | `venv\Scripts\activate` + `pip install -r requirements.txt` |
| `FFmpeg not found` | Missing binary | Install FFmpeg, verify `ffmpeg -version` |
| Upload does nothing | Bad request | Check browser console + backend terminal |

---

## Future Improvements

- Speaker diarization (who said what).
- Live recording from microphone.
- Export to PDF / Notion / Markdown.
- User accounts and multi-tenant storage.
- Deploy backend on Render/Fly + frontend on Vercel.
- Replace threaded runner with Celery/RQ for scale.

---

## License

MIT — free for educational use.
