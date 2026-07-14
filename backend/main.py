from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from database import engine, Base
from models import Meeting
from routes import meeting


def ensure_schema():
    """Create tables and add any missing columns to existing tables.

    ``create_all`` does not migrate tables that already exist, so when the
    model gains new columns (e.g. audio_path, decisions) an old database would
    raise "no such column". We add the missing columns here so the app keeps
    working without a manual database reset.
    """

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if not inspector.has_table(Meeting.__tablename__):
        return

    existing = {col["name"] for col in inspector.get_columns(Meeting.__tablename__)}

    for column in Meeting.__table__.columns:
        if column.name in existing:
            continue

        with engine.begin() as conn:
            col_type = column.type.compile(dialect=engine.dialect)
            null_sql = "" if column.nullable else " NOT NULL"
            conn.execute(
                text(
                    f"ALTER TABLE {Meeting.__tablename__} "
                    f"ADD COLUMN {column.name} {col_type}{null_sql}"
                )
            )


ensure_schema()

app = FastAPI(
    title="AI Meeting Summarizer API",
    description=(
        "Upload meeting audio and generate a transcript, summary, key "
        "decisions, and action items using local Whisper and a free LLM."
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(meeting.router)


@app.get("/")
def health_check():
    return {"message": "AI Meeting Summarizer API is running"}


@app.get("/api/health")
def api_health():
    return {"status": "ok"}
