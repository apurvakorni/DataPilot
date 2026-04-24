# Summarizer agent: takes all step outputs and the original question,
# then asks the LLM to write a clear plain-English answer.

from app.services.llm_service import call_llm

SYSTEM_PROMPT = """\
You are a data analyst writing for a non-technical audience. \
Given a user question and the outputs from a series of analysis steps, \
write a concise, clear, plain-English summary that directly answers the question.

Rules:
- Lead with the direct answer in 1-2 sentences.
- Use bullet points for supporting evidence where helpful.
- Mention specific numbers and trends from the outputs.
- Do not include any code.
- Keep the total response under 300 words.
"""


def summarize(question: str, step_outputs: list[str]) -> str:
    combined_outputs = "\n\n".join(
        f"Step {i + 1} output:\n{output}" for i, output in enumerate(step_outputs) if output
    )

    user_prompt = f"""User question: {question}

Analysis outputs:
{combined_outputs}

Write the plain-English summary now."""

    return call_llm(SYSTEM_PROMPT, user_prompt)
