from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Meeting(Base):

    __tablename__ = "meetings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    filename = Column(
        String,
        nullable=False
    )

    audio_path = Column(
        String,
        nullable=True
    )

    transcript = Column(
        Text,
        nullable=True
    )

    summary = Column(
        Text,
        nullable=True
    )

    # Stored as a JSON-encoded string for SQLite compatibility.
    decisions = Column(
        Text,
        nullable=True
    )

    action_items = Column(
        Text,
        nullable=True
    )

    status = Column(
        String,
        default="pending"
    )

    duration = Column(
        Integer,
        nullable=True
    )

    error = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
