# Analyst agent: given one analysis step, generates Python code via LLM,
# runs it in the sandbox, and returns stdout + any chart paths.

import json
import os
import re
from app.services.llm_service import call_llm
from app.tools.python_runner import run_code
from app.tools.chart_saver import list_charts

SYSTEM_PROMPT = """\
You are a Python data analyst. Given a single analysis step and a dataset schema, \
write executable Python code to carry out that step.

Rules:
- The DataFrame is already loaded as `df`.
- `dataset_path` (str) and `charts_dir` (str) are already defined.
- To save a chart: use plt.savefig(os.path.join(charts_dir, 'chart_<name>.png'), bbox_inches='tight') then plt.close().
- Always import `os` if you use it.
- Print any numeric results or insights with print().
- Return ONLY the Python code. No markdown fences, no explanation.
"""

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")


def analyze_step(step: str, schema: dict, session_id: str) -> dict:
    """
    Returns:
        {output: str, chart_paths: list[str], code: str}
    """
    charts_dir = os.path.join(UPLOADS_DIR, session_id)
    dataset_path = os.path.join(UPLOADS_DIR, session_id, "data.csv")

    user_prompt = f"""Step to execute: {step}

Dataset schema:
{json.dumps(schema, indent=2)}

Write the Python code now."""

    code = call_llm(SYSTEM_PROMPT, user_prompt)
    code = _strip_fences(code)

    result = run_code(code, dataset_path=dataset_path, charts_dir=charts_dir)

    charts = list_charts(charts_dir, session_id) if result["success"] else []

    return {
        "output": result["output"],
        "error": result["error"],
        "success": result["success"],
        "code": code,
        "chart_paths": charts,
    }


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        # Remove closing fence
        text = re.sub(r"\n?```$", "", text)
    return text.strip()
