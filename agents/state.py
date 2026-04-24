# AgentState: shared state dict threaded through every node in the LangGraph pipeline.

from typing import TypedDict


class AgentState(TypedDict):
    question: str
    schema: dict
    session_id: str
    steps: list[str]
    current_step_index: int
    current_code: str
    current_error: str
    repair_attempts: int
    step_outputs: list[str]
    chart_paths: list[str]
    trace: list[dict]  # each entry: {step, status, output, error, chart_paths}
    answer: str
