# LangGraph orchestration: planner → analyst loop (with repair) → summarizer.
# Exports `datapilot_graph` for use in the analyze route.

import os

from langgraph.graph import StateGraph, END

from app.agents.state import AgentState
from app.agents.planner import plan
from app.agents.analyst import analyze_step
from app.agents.repair import repair_code
from app.agents.summarizer import summarize
from app.tools.python_runner import run_code
from app.tools.chart_saver import list_charts

MAX_REPAIR_ATTEMPTS = 2
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")


# ── Nodes ────────────────────────────────────────────────────────────────────

def planner_node(state: AgentState) -> dict:
    steps = plan(state["question"], state["schema"])
    return {
        "steps": steps,
        "current_step_index": 0,
        "repair_attempts": 0,
    }


def analyst_node(state: AgentState) -> dict:
    idx = state["current_step_index"]
    step = state["steps"][idx]

    result = analyze_step(step, state["schema"], state["session_id"])

    if result["success"]:
        return {
            "trace": state["trace"] + [{
                "step": step,
                "status": "done",
                "output": result["output"],
                "error": None,
                "chart_paths": result["chart_paths"],
            }],
            "step_outputs": state["step_outputs"] + [result["output"]],
            "chart_paths": state["chart_paths"] + result["chart_paths"],
            "current_code": "",
            "current_error": "",
            "repair_attempts": 0,
        }
    else:
        return {
            "current_code": result["code"],
            "current_error": result["error"],
            "repair_attempts": 0,
        }


def repair_node(state: AgentState) -> dict:
    idx = state["current_step_index"]
    step = state["steps"][idx]
    session_id = state["session_id"]
    charts_dir = os.path.join(UPLOADS_DIR, session_id)
    dataset_path = os.path.join(UPLOADS_DIR, session_id, "data.csv")

    attempts = state["repair_attempts"] + 1
    fixed_code = repair_code(state["current_code"], state["current_error"])
    repair_result = run_code(fixed_code, dataset_path=dataset_path, charts_dir=charts_dir)

    if repair_result["success"]:
        charts = list_charts(charts_dir, session_id)
        return {
            "trace": state["trace"] + [{
                "step": step,
                "status": "repaired",
                "output": repair_result["output"],
                "error": None,
                "chart_paths": charts,
            }],
            "step_outputs": state["step_outputs"] + [repair_result["output"]],
            "chart_paths": state["chart_paths"] + charts,
            "current_code": fixed_code,
            "current_error": "",
            "repair_attempts": attempts,
        }
    else:
        updates = {
            "current_code": fixed_code,
            "current_error": repair_result["error"],
            "repair_attempts": attempts,
        }
        # On final failed attempt, commit the "failed" trace entry now so the
        # routing functions don't need to do it.
        if attempts >= MAX_REPAIR_ATTEMPTS:
            updates["trace"] = state["trace"] + [{
                "step": step,
                "status": "failed",
                "output": None,
                "error": repair_result["error"],
                "chart_paths": [],
            }]
        return updates


def advance_step_node(state: AgentState) -> dict:
    return {
        "current_step_index": state["current_step_index"] + 1,
        "current_code": "",
        "current_error": "",
        "repair_attempts": 0,
    }


def summarizer_node(state: AgentState) -> dict:
    answer = summarize(state["question"], state["step_outputs"])
    return {"answer": answer}


# ── Conditional routing ───────────────────────────────────────────────────────

def _more_steps(state: AgentState) -> bool:
    return state["current_step_index"] + 1 < len(state["steps"])


def after_planner(state: AgentState) -> str:
    return "analyst" if state["steps"] else "summarizer"


def after_analyst(state: AgentState) -> str:
    if state["current_error"]:
        return "repair"
    return "advance" if _more_steps(state) else "summarizer"


def after_repair(state: AgentState) -> str:
    if not state["current_error"]:
        # Repair succeeded
        return "advance" if _more_steps(state) else "summarizer"
    # Still failing
    if state["repair_attempts"] < MAX_REPAIR_ATTEMPTS:
        return "repair"
    # Exhausted — graceful degradation: skip step and continue
    return "advance" if _more_steps(state) else "summarizer"


# ── Graph assembly ────────────────────────────────────────────────────────────

_workflow = StateGraph(AgentState)

_workflow.add_node("planner", planner_node)
_workflow.add_node("analyst", analyst_node)
_workflow.add_node("repair", repair_node)
_workflow.add_node("advance", advance_step_node)
_workflow.add_node("summarizer", summarizer_node)

_workflow.set_entry_point("planner")

_workflow.add_conditional_edges(
    "planner", after_planner, {"analyst": "analyst", "summarizer": "summarizer"}
)
_workflow.add_conditional_edges(
    "analyst", after_analyst, {"repair": "repair", "advance": "advance", "summarizer": "summarizer"}
)
_workflow.add_conditional_edges(
    "repair", after_repair, {"repair": "repair", "advance": "advance", "summarizer": "summarizer"}
)
_workflow.add_edge("advance", "analyst")
_workflow.add_edge("summarizer", END)

datapilot_graph = _workflow.compile()
