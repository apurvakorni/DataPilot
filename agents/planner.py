# Planner agent: given a user question and dataset schema, asks the LLM
# to decompose the analysis into an ordered list of steps.
# Returns a list of step description strings.

import json
from app.services.llm_service import call_llm

SYSTEM_PROMPT = """\
You are a senior data analyst. Given a user question and a dataset schema, \
produce a concise ordered list of analysis steps needed to answer the question.

Rules:
- Return ONLY a JSON array of strings. No markdown fences, no extra text.
- Each string describes one discrete, executable step (e.g. "Calculate mean sales by region").
- Maximum 6 steps. Prefer fewer if sufficient.
- Steps should be achievable with pandas, numpy, matplotlib, and scikit-learn.
- The dataset is already loaded as a pandas DataFrame called `df`.
"""


def plan(question: str, schema: dict) -> list[str]:
    user_prompt = f"""User question: {question}

Dataset schema:
{json.dumps(schema, indent=2)}

Return the JSON array of analysis steps now."""

    raw = call_llm(SYSTEM_PROMPT, user_prompt)

    # Strip any accidental markdown fences
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    steps = json.loads(raw)
    if not isinstance(steps, list):
        raise ValueError(f"Planner returned non-list: {raw}")
    return [str(s) for s in steps]
