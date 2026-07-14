import os
from fastapi import UploadFile, HTTPException

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac"}

# 50 MB upload ceiling.
MAX_UPLOAD_SIZE = 50 * 1024 * 1024


def validate_audio_file(file: UploadFile) -> str:

    """Validate an uploaded audio file and return its lower-cased extension."""

    filename = file.filename or ""

    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        )

    return ext


def validate_file_size(file: UploadFile) -> None:

    """Reject oversized uploads before we attempt to read them."""

    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File too large ({size / 1024 / 1024:.1f} MB). "
                f"Maximum allowed is {MAX_UPLOAD_SIZE / 1024 / 1024:.0f} MB."
            )
        )
