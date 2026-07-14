import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:latest")

SYSTEM_PROMPT = (
    "You are an expert AI meeting assistant. "
    "You read meeting transcripts and produce a concise summary, "
    "the key decisions made, and a list of actionable items. "
    "Be factual and only use information present in the transcript. "
    "If an owner or deadline is not mentioned, use \"Unassigned\" "
    "for the owner and null for the deadline."
)

USER_PROMPT_TEMPLATE = """Analyze the following meeting transcript.

Return ONLY a JSON object with exactly this structure:

{{
  "summary": "A concise 3-5 sentence overview of the meeting",
  "key_decisions": [
    "Decision 1",
    "Decision 2"
  ],
  "action_items": [
    {{
      "task": "What needs to be done",
      "owner": "Person responsible (or Unassigned)",
      "deadline": "Deadline mentioned (or null)"
    }}
  ]
}}

Meeting Transcript:
\"\"\"
{transcript}
\"\"\"
"""


def _strip_code_fences(text: str) -> str:

    text = text.strip()

    # Remove ```json ... ``` or ``` ... ``` fences if the model wrapped output.
    match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)

    if match:
        text = match.group(1).strip()

    return text


def _parse_json(text: str) -> dict:

    text = _strip_code_fences(text)

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        # Fallback: extract the first balanced {...} block.
        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end + 1])

        raise


def _call_gemini(transcript: str) -> dict:

    import google.generativeai as genai

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Get a free key at "
            "https://aistudio.google.com/apikey"
        )

    genai.configure(api_key=GEMINI_API_KEY)

    model = genai.GenerativeModel(
        GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT
    )

    response = model.generate_content(
        USER_PROMPT_TEMPLATE.format(transcript=transcript),
        generation_config={
            "response_mime_type": "application/json"
        }
    )

    return _parse_json(response.text)


def _call_ollama(transcript: str) -> dict:

    import requests

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": (
            SYSTEM_PROMPT + "\n\n" +
            USER_PROMPT_TEMPLATE.format(transcript=transcript)
        ),
        "format": "json",
        "stream": False,
        "options": {"temperature": 0.3}
    }

    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=300
        )
        resp.raise_for_status()

    except requests.ConnectionError as exc:
        raise RuntimeError(
            "Could not connect to Ollama. Make sure 'ollama serve' is "
            "running and the model is pulled (e.g. `ollama pull gemma3`)."
        ) from exc

    data = resp.json()
    return _parse_json(data.get("response", ""))


def analyze_meeting(transcript: str) -> dict:

    """Run the configured free LLM and return a structured analysis dict.

    Returns: {"summary": str, "key_decisions": [str], "action_items": [...]}
    """

    if not transcript or not transcript.strip():
        return {
            "summary": "No transcript was generated for this audio.",
            "key_decisions": [],
            "action_items": []
        }

    if LLM_PROVIDER == "ollama":
        data = _call_ollama(transcript)

    else:
        try:
            data = _call_gemini(transcript)
        except Exception as primary_err:  # noqa: BLE001
            # Gemini can fail with quota/key/network errors. If Ollama is
            # available locally, fall back to it so the pipeline still works.
            try:
                data = _call_ollama(transcript)
            except Exception as ollama_err:
                # Surface the actionable local error instead of the Gemini one.
                raise RuntimeError(
                    f"Gemini failed and Ollama fallback also failed: {ollama_err}"
                ) from primary_err

    return {
        "summary": data.get("summary", ""),
        "key_decisions": data.get("key_decisions", []) or [],
        "action_items": data.get("action_items", []) or []
    }
