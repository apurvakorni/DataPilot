# Pydantic request models for DataPilot API endpoints.

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    session_id: str
    question: str
