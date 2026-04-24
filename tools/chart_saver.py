# Utility: scans a charts directory and returns relative paths to any PNG files
# created during a session so they can be served via /charts/{session_id}/....

import os
import glob


def list_charts(charts_dir: str, session_id: str) -> list[str]:
    """Return URL-friendly paths for all PNGs in the session charts dir."""
    pattern = os.path.join(charts_dir, "*.png")
    files = sorted(glob.glob(pattern))
    return [f"/charts/{session_id}/{os.path.basename(f)}" for f in files]
