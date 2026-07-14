import threading


class TaskRunner:

    """Simple in-process background task runner.

    Whisper transcription and LLM summarization are CPU/IO heavy and can take
    a long time for large audio files. We run them in a separate daemon thread
    so the upload endpoint can return immediately with a ``processing`` status
    while the work continues and the database is updated incrementally.
    """

    _lock = threading.Lock()

    @classmethod
    def submit(cls, func, *args, **kwargs):

        thread = threading.Thread(
            target=cls._safe_run,
            args=(func, args, kwargs),
            daemon=True
        )
        thread.start()
        return thread

    @classmethod
    def _safe_run(cls, func, args, kwargs):

        try:
            func(*args, **kwargs)

        except Exception as exc:  # noqa: BLE001
            # Surface unexpected failures instead of letting them die silently.
            print(f"[TaskRunner] Unhandled error: {exc}")
