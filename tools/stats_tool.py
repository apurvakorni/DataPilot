# Provides quick descriptive statistics for a DataFrame column or the whole frame.
# Used by the analyst agent when it needs a fast numeric summary without LLM overhead.

import pandas as pd


def describe_numeric(df: pd.DataFrame) -> dict:
    """Return describe() output for all numeric columns as a plain dict."""
    numeric_df = df.select_dtypes(include="number")
    if numeric_df.empty:
        return {}
    return numeric_df.describe().to_dict()
