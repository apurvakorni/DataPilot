# Pydantic response models for DataPilot API endpoints.

from pydantic import BaseModel
from typing import Any, List, Optional


class UploadResponse(BaseModel):
    session_id: str
    preview: List[dict]
    schema_info: dict


class TraceStep(BaseModel):
    step: str
    status: str  # planning | running | done | repaired | failed
    output: Optional[str] = None
    error: Optional[str] = None
    chart_paths: List[str] = []


class AnalyzeResponse(BaseModel):
    answer: str
    trace: List[TraceStep]
    chart_paths: List[str]
