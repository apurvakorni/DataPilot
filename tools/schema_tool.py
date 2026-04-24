# Profiles a pandas DataFrame: column names, dtypes, missing counts, and basic stats.
# Returns a clean schema dict consumed by the planner and analyst agents.

import pandas as pd
from typing import Any


def profile_dataset(df: pd.DataFrame) -> dict:
    schema = {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "columns": [],
    }

    for col in df.columns:
        series = df[col]
        col_info: dict[str, Any] = {
            "name": col,
            "dtype": str(series.dtype),
            "missing": int(series.isna().sum()),
            "missing_pct": round(series.isna().mean() * 100, 2),
        }

        if pd.api.types.is_numeric_dtype(series):
            col_info["min"] = _safe(series.min())
            col_info["max"] = _safe(series.max())
            col_info["mean"] = _safe(series.mean())
            col_info["std"] = _safe(series.std())
        else:
            col_info["unique"] = int(series.nunique())
            top = series.value_counts().head(3).to_dict()
            col_info["top_values"] = {str(k): int(v) for k, v in top.items()}

        schema["columns"].append(col_info)

    return schema


def _safe(val):
    """Convert numpy scalars to plain Python types."""
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    if hasattr(val, "item"):
        return val.item()
    return val
