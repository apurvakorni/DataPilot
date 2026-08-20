# DataPilot 🧭

### Autonomous Data Analysis Agent

DataPilot is an AI-powered data analysis application that lets users upload a CSV or Excel dataset and ask questions in natural language.

Instead of requiring users to manually write Python, SQL, or spreadsheet formulas, DataPilot uses a **LangGraph-orchestrated workflow** to inspect the dataset, plan an analysis, generate and execute Python code, recover from execution errors, and summarize the results in plain English.

> **Upload a dataset. Ask a question. Get an analysis.**

---

## What It Does

Given a dataset and a question such as:

> *"What factors are associated with customer churn?"*

DataPilot:

1. **Inspects the dataset**

   * Identifies columns and data types
   * Examines missing values and dataset structure

2. **Creates an analysis plan**

   * Breaks the user's question into a sequence of smaller analytical steps

3. **Generates Python code**

   * Produces Pandas, NumPy, Matplotlib, and Scikit-learn code as needed

4. **Executes the analysis**

   * Runs generated Python in a separate subprocess with a time limit

5. **Recovers from errors**

   * Uses execution tracebacks to automatically attempt to repair failed code

6. **Synthesizes the results**

   * Converts raw outputs into a concise natural-language answer

---

## Architecture

DataPilot uses **LangGraph** to coordinate a stateful analysis workflow.

```text
                      ┌──────────────┐
                      │ User Question│
                      └──────┬───────┘
                             │
                             ▼
                       ┌───────────┐
                       │  Planner  │
                       └─────┬─────┘
                             │
                             ▼
                       ┌───────────┐
                 ┌────▶│  Analyst  │
                 │     └─────┬─────┘
                 │           │
                 │      execution
                 │           │
                 │      ┌────▼────┐
                 │      │Success? │
                 │      └────┬────┘
                 │           │
             retry           ├──────── Yes ───────▶ Next Step
                 │           │
                 │           No
                 │           ▼
                 │     ┌────────────┐
                 └─────│   Repair   │
                       └────────────┘

                             │
                             ▼
                       ┌────────────┐
                       │ Summarizer │
                       └────────────┘
```

### Workflow Components

| Component      | Responsibility                                                          |
| -------------- | ----------------------------------------------------------------------- |
| **Planner**    | Converts the user's question into an ordered analysis plan              |
| **Analyst**    | Generates Python for each analytical step and executes it               |
| **Repair**     | Uses failed code and its traceback to generate a corrected version      |
| **Summarizer** | Converts execution results into a user-facing explanation               |
| **LangGraph**  | Maintains workflow state and controls conditional routing between steps |

The different components share the same underlying language model but use specialized prompts and responsibilities.

---

## Error Recovery

Generated code does not always execute successfully.

Rather than immediately failing the entire analysis, DataPilot includes a bounded repair loop.

When execution fails:

```text
Generated Code
      │
      ▼
Execution Error
      │
      ▼
Code + Traceback
      │
      ▼
Repair Agent
      │
      ▼
Corrected Code
      │
      ▼
Re-execute
```

The repair component receives both the failed code and traceback and attempts to correct the issue.

Retries are limited to prevent infinite loops. If a step still cannot be completed after the allowed repair attempts, DataPilot records the failure and continues with the remaining analysis when possible.

This allows the system to **degrade gracefully instead of terminating the entire workflow because of one failed step**.

---

## Tech Stack

### Backend

* **Python**
* **FastAPI**
* **LangGraph**
* **Anthropic Claude API**
* **Pandas**
* **NumPy**
* **Matplotlib**
* **Scikit-learn**

### Frontend

* **React**
* **Tailwind CSS**
* **Recharts**
* **Vite**

### Execution

Generated Python code is executed in a **separate subprocess with a 15-second timeout**.

The subprocess prevents ordinary generated-code failures from crashing the main FastAPI application and provides a simple execution boundary for the prototype.

> **Note:** The subprocess is not intended to be a production-grade security sandbox. A production deployment would require stronger isolation such as containerized or ephemeral execution with filesystem, network, CPU, and memory restrictions.

---

## Why LangGraph?

Data analysis is not always a linear workflow.

A generated analysis step may succeed, fail, require repair, or need to be skipped before execution can continue.

LangGraph makes these transitions explicit by maintaining shared state and supporting conditional routing between nodes.

For example:

```text
Analyst
   │
   ├── Success ──▶ Advance
   │
   └── Failure ──▶ Repair
                       │
                       ├── Success ──▶ Advance
                       │
                       └── Failure ──▶ Retry / Skip
```

This makes the workflow easier to reason about than placing planning, execution, debugging, and summarization inside a single LLM call.

---

## Why Separate Planning From Execution?

Instead of asking the model to solve an entire analytical problem at once, DataPilot first decomposes the question into smaller steps.

For example:

```text
Question:
"What factors appear to drive customer churn?"
```

may become:

```text
1. Compare churn rates across categorical variables
2. Compare numerical features between churned and retained customers
3. Examine correlations between numerical variables
4. Identify the strongest differences between the groups
```

Each step can then be executed independently.

This approach provides:

* More interpretable execution
* Smaller and more focused LLM prompts
* Easier debugging
* Step-level error recovery
* Better visibility into how the final result was produced

---

## Example Queries

DataPilot can answer questions such as:

```text
"What drives customer churn?"

"Which contract type has the highest churn rate?"

"Plot monthly charges by churn status."

"What is the average tenure of churned vs retained customers?"

"Which numerical features are most correlated?"

"Find potential anomalies in this dataset."

"Give me three insights supported by the data."
```

---

## Example Workflow

```text
CSV / Excel Dataset
        +
Natural Language Question
        │
        ▼
Dataset Inspection
        │
        ▼
Analysis Planning
        │
        ▼
Python Generation
        │
        ▼
Code Execution
        │
    ┌───┴────┐
 Success   Failure
    │          │
    │          ▼
    │       Repair
    │          │
    └────┬─────┘
         ▼
  Analysis Results
         │
         ▼
    Summarization
         │
         ▼
 Natural Language Answer
```

---

## Getting Started

### Prerequisites

* Python 3.11+
* Node.js 18+
* Anthropic API key

### Clone the Repository

```bash
git clone https://github.com/apurvakorni/DataPilot.git
cd DataPilot
```

### Backend

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Create an environment file and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

### Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

---

## Design Decisions

### Stateful orchestration

LangGraph maintains the state of the analysis across planning, execution, repair, and summarization rather than relying on one large prompt.

### Bounded error recovery

Automatically generated code can fail. Passing both the traceback and failed code to a dedicated repair step allows DataPilot to recover from many execution errors without restarting the entire analysis.

Repair attempts are bounded so the workflow cannot retry indefinitely.

### Separate execution process

Generated Python runs outside the main application process. A timeout prevents long-running generated code from blocking the application indefinitely.

### Graceful degradation

A single unsuccessful analysis step does not necessarily invalidate every other step. When appropriate, the workflow records the failure and continues.

### Specialized agent responsibilities

Planning, code generation, debugging, and summarization use separate workflow nodes. This keeps prompts focused and makes the execution path easier to inspect and modify.

---

## Limitations

DataPilot is currently a prototype and has several important limitations:

* Analysis quality depends on the quality and structure of the uploaded data
* LLM-generated analysis can still contain incorrect assumptions or conclusions
* Generated code execution is not isolated using a production-grade security sandbox
* Long-running analyses may exceed the execution timeout
* Complex machine-learning workflows may require additional validation
* Very large datasets are not currently optimized for distributed processing

---

## Future Improvements

Potential improvements include:

* Containerized code execution with resource restrictions
* Additional validation of generated analyses
* Support for larger datasets and database connections
* Persistent analysis sessions
* Richer visualization generation
* Automated testing of generated code
* More detailed execution traces and observability
* Human approval checkpoints for higher-risk analytical operations

---

## License

MIT
