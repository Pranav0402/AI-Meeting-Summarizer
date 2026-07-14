from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Defaults to SQLite. Set DATABASE_URL to a PostgreSQL connection string
# (e.g. postgresql://user:pass@localhost:5432/meetings) to use Postgres.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./meetings.db")

connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
