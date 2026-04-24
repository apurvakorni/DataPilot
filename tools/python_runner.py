# Executes LLM-generated Python code in a subprocess with a 15-second timeout.
# Injects dataset_path so generated code can load the CSV as `df`.
# Returns {success, output, error}.

import subprocess
import sys
import textwrap
import os

TIMEOUT_SECONDS = 15

PREAMBLE = """\
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings('ignore')

dataset_path = {dataset_path!r}
charts_dir = {charts_dir!r}
df = pd.read_csv(dataset_path)
"""


def run_code(code: str, dataset_path: str, charts_dir: str) -> dict:
    os.makedirs(charts_dir, exist_ok=True)
    full_code = PREAMBLE.format(dataset_path=dataset_path, charts_dir=charts_dir) + "\n" + code

    try:
        result = subprocess.run(
            [sys.executable, "-c", full_code],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
        )
        if result.returncode == 0:
            return {"success": True, "output": result.stdout.strip(), "error": ""}
        else:
            return {"success": False, "output": result.stdout.strip(), "error": result.stderr.strip()}
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": f"Execution timed out after {TIMEOUT_SECONDS}s"}
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}
