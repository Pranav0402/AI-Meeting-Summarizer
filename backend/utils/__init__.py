from database import SessionLocal
from models import Meeting


def update_meeting(
    meeting_id: int,
    **fields
):

    db = SessionLocal()

    try:
        meeting = db.query(
            Meeting
        ).filter(
            Meeting.id == meeting_id
        ).first()

        if meeting is None:
            return None

        for key, value in fields.items():
            setattr(meeting, key, value)

        db.commit()
        db.refresh(meeting)
        return meeting

    finally:
        db.close()
