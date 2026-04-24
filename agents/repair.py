# Repair agent: given broken code and its error message, asks the LLM to fix it.
# Returns the corrected code string.

import re
from app.services.llm_service import call_llm

SYSTEM_PROMPT = """\
You are a Python debugging expert. You will be given Python code that failed with an error. \
Fix the code so it runs correctly.

Rules:
- Return ONLY the corrected Python code. No markdown fences, no explanation.
- Preserve the original intent of the code.
- Assume `df` (pandas DataFrame), `dataset_path`, and `charts_dir` are pre-defined.
"""


def repair_code(broken_code: str, error_message: str) -> str:
    user_prompt = f"""Broken code:
```python
{broken_code}
```

Error:
{error_message}

Return the fixed Python code now."""

    fixed = call_llm(SYSTEM_PROMPT, user_prompt)
    return _strip_fences(fixed)


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return text.strip()
