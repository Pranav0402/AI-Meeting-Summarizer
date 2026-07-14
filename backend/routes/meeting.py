import os
import json
import uuid

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Meeting
from schemas import (
    UploadResponse,
    MeetingSummary,
    MeetingListItem,
    ActionItem
)
from services.file_service import (
    validate_audio_file,
    validate_file_size
)
from services.whisper_service import transcribe_audio
from services.llm_service import analyze_meeting
from utils import update_meeting
from utils.background import TaskRunner

UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _process_meeting(meeting_id: int, file_path: str):

    try:
        update_meeting(meeting_id, status="transcribing")

        transcript = transcribe_audio(file_path)

        update_meeting(
            meeting_id,
            transcript=transcript,
            status="summarizing"
        )

        analysis = analyze_meeting(transcript)

        update_meeting(
            meeting_id,
            summary=analysis.get("summary", ""),
            decisions=json.dumps(analysis.get("key_decisions", [])),
            action_items=json.dumps(analysis.get("action_items", [])),
            status="completed"
        )

    except Exception as exc:  # noqa: BLE001
        update_meeting(
            meeting_id,
            status="failed",
            error=str(exc)
        )


@router.post("/upload", response_model=UploadResponse)
async def upload_meeting(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    ext = validate_audio_file(file)
    validate_file_size(file)

    # Avoid filename collisions with a unique prefix.
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, stored_name)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    meeting = Meeting(
        filename=file.filename,
        audio_path=file_path,
        status="pending"
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    TaskRunner.submit(_process_meeting, meeting.id, file_path)

    return UploadResponse(id=meeting.id, status="processing")


@router.get("", response_model=list[MeetingListItem])
def list_meetings(
    db: Session = Depends(get_db)
):

    meetings = db.query(Meeting).order_by(
        Meeting.created_at.desc()
    ).all()

    return [
        MeetingListItem(
            id=m.id,
            filename=m.filename,
            status=m.status,
            duration=m.duration,
            created_at=m.created_at
        )
        for m in meetings
    ]


@router.get("/{meeting_id}", response_model=MeetingSummary)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db)
):

    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id
    ).first()

    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    decisions = []
    action_items = []

    if meeting.decisions:
        try:
            decisions = json.loads(meeting.decisions)
        except json.JSONDecodeError:
            decisions = []

    if meeting.action_items:
        try:
            action_items = [
                ActionItem(**item)
                for item in json.loads(meeting.action_items)
            ]
        except (json.JSONDecodeError, TypeError):
            action_items = []

    return MeetingSummary(
        id=meeting.id,
        filename=meeting.filename,
        transcript=meeting.transcript,
        summary=meeting.summary,
        decisions=decisions,
        action_items=action_items,
        status=meeting.status,
        duration=meeting.duration,
        error=meeting.error,
        created_at=meeting.created_at
    )
