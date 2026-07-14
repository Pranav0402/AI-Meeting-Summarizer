import os
import warnings

warnings.filterwarnings("ignore")

# Cache the loaded model so we don't reload it on every request.
_model = None

DEFAULT_MODEL = os.getenv("WHISPER_MODEL", "base")


def get_model():

    global _model

    if _model is None:
        import whisper

        print(f"[Whisper] Loading local model '{DEFAULT_MODEL}'...")
        _model = whisper.load_model(DEFAULT_MODEL)
        print("[Whisper] Model loaded.")

    return _model


def transcribe_audio(file_path: str) -> str:

    """Transcribe an audio file using the local OpenAI Whisper model.

    This runs entirely on the local machine and does NOT use the paid
    OpenAI Whisper API. The ``whisper`` package is the open-source
    implementation published by OpenAI.
    """

    model = get_model()

    result = model.transcribe(
        file_path,
        fp16=False,
        verbose=False
    )

    return result.get("text", "").strip()
