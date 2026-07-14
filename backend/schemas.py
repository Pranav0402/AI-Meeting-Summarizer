from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ActionItem(BaseModel):

    task: str = Field(..., description="The action to be performed")
    owner: str = Field(default="Unassigned", description="Person responsible")
    deadline: Optional[str] = Field(
        default=None,
        description="Deadline as mentioned in the meeting"
    )


class MeetingAnalysis(BaseModel):

    summary: str = Field(..., description="Concise meeting summary")
    key_decisions: List[str] = Field(
        default_factory=list,
        description="Key decisions made during the meeting"
    )
    action_items: List[ActionItem] = Field(
        default_factory=list,
        description="Actionable tasks with owner and deadline"
    )


class MeetingSummary(BaseModel):

    id: int
    filename: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    decisions: List[str] = []
    action_items: List[ActionItem] = []
    status: str
    duration: Optional[int] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None


class MeetingListItem(BaseModel):

    id: int
    filename: str
    status: str
    duration: Optional[int] = None
    created_at: Optional[datetime] = None


class UploadResponse(BaseModel):

    id: int
    status: str
