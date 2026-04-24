# Helpers for locating session datasets and loading schema on demand.

import os
import pandas as pd
from fastapi import HTTPException
from app.tools.schema_tool import profile_dataset

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")


def get_dataset_path(session_id: str) -> str:
    path = os.path.join(UPLOADS_DIR, session_id, "data.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    return path


def get_schema(session_id: str) -> dict:
    path = get_dataset_path(session_id)
    df = pd.read_csv(path)
    return profile_dataset(df)
