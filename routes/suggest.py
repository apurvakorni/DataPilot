# Suggest route: given a session_id, generates a contextual placeholder
# and 4 question chips tailored to the uploaded dataset's schema.
# POST /suggest  body: { session_id }
# Returns: { placeholder: str, suggestions: list[str] }

import json
import re

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.dataset_service import get_schema
from app.services.llm_service import call_llm

router = APIRouter()

SYSTEM_PROMPT = """\
You are a data analyst assistant. Given a dataset schema, return ONLY a JSON \
object with two keys:
- "placeholder": a single example question string tailored to this specific \
  dataset (max 12 words)
- "suggestions": array of exactly 4 question strings tailored to this dataset, \
  each under 15 words, covering different analysis angles \
  (distribution, correlation, outliers, summary)

Return raw JSON only — no markdown fences, no explanation.\
"""

FALLBACK_PLACEHOLDER = "e.g. What are the trends in this dataset?"


class SuggestRequest(BaseModel):
    session_id: str


class SuggestResponse(BaseModel):
    placeholder: str
    suggestions: list[str]


def _strip_fences(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)
    return raw.strip()


@router.post("", response_model=SuggestResponse)
def suggest(request: SuggestRequest):
    try:
        schema = get_schema(request.session_id)
        user_prompt = f"Dataset schema:\n{json.dumps(schema, indent=2)}\n\nReturn the JSON object now."
        raw = call_llm(SYSTEM_PROMPT, user_prompt)
        parsed = json.loads(_strip_fences(raw))
        placeholder = str(parsed["placeholder"])
        suggestions = [str(s) for s in parsed["suggestions"]][:4]
        return SuggestResponse(placeholder=placeholder, suggestions=suggestions)
    except Exception:
        return SuggestResponse(placeholder=FALLBACK_PLACEHOLDER, suggestions=[])
