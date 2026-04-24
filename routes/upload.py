# Upload route: accepts a CSV or Excel file, saves it under /uploads/{session_id}/data.csv,
# returns session_id + 5-row preview + schema.

import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.tools.schema_tool import profile_dataset
from app.models.response_models import UploadResponse

router = APIRouter()

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")

EXCEL_EXTENSIONS = (".xlsx", ".xls", ".xlsm", ".xlsb")


@router.post("", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    filename = file.filename or ""
    is_excel = filename.endswith(EXCEL_EXTENSIONS)
    if not filename.endswith(".csv") and not is_excel:
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")

    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOADS_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)

    contents = await file.read()

    try:
        if is_excel:
            import io
            df = pd.read_excel(io.BytesIO(contents))
        else:
            file_path = os.path.join(session_dir, "data.csv")
            with open(file_path, "wb") as f:
                f.write(contents)
            df = pd.read_csv(file_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse file: {e}")

    # Always persist as CSV so the rest of the pipeline is unchanged
    file_path = os.path.join(session_dir, "data.csv")
    if is_excel:
        df.to_csv(file_path, index=False)

    preview = df.head(5).fillna("").to_dict(orient="records")
    schema_info = profile_dataset(df)

    return UploadResponse(session_id=session_id, preview=preview, schema_info=schema_info)
