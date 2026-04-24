# Analyze route: delegates orchestration to the LangGraph pipeline.
# POST /analyze  body: {session_id, question}
# Returns: {answer, trace, chart_paths}

import glob
import os

from fastapi import APIRouter

from app.agents.graph import datapilot_graph
from app.agents.state import AgentState
from app.models.request_models import AnalyzeRequest
from app.models.response_models import AnalyzeResponse, TraceStep
from app.services.dataset_service import get_schema

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")

router = APIRouter()


@router.post("", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    session_id = request.session_id
    question = request.question

    schema = get_schema(session_id)

    # Delete leftover charts from previous requests
    charts_dir = os.path.join(UPLOADS_DIR, session_id)
    for old_chart in glob.glob(os.path.join(charts_dir, "*.png")):
        os.remove(old_chart)

    initial_state: AgentState = {
        "question": question,
        "schema": schema,
        "session_id": session_id,
        "steps": [],
        "current_step_index": 0,
        "current_code": "",
        "current_error": "",
        "repair_attempts": 0,
        "step_outputs": [],
        "chart_paths": [],
        "trace": [],
        "answer": "",
    }

    result = datapilot_graph.invoke(initial_state)

    # Deduplicate chart paths while preserving order
    seen: set[str] = set()
    unique_charts: list[str] = []
    for p in result["chart_paths"]:
        if p not in seen:
            seen.add(p)
            unique_charts.append(p)

    trace = [TraceStep(**entry) for entry in result["trace"]]

    return AnalyzeResponse(answer=result["answer"], trace=trace, chart_paths=unique_charts)
