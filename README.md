# DataPilot- Autonomous Data Analyst Agent 

DataPilot lets you upload any CSV and ask questions in plain English — getting back charts, insights, and evidence-backed analysis generated autonomously by a multi-agent AI pipeline.

> "Upload a CSV. Ask a question. Get answers."

---

## What It Does

Most data analysis tools require you to know SQL, Python, or Excel formulas. DataPilot removes that barrier entirely.

You upload a dataset, type a question like *"What drives customer churn?"* or *"Plot revenue by month"*, and DataPilot:

1. **Inspects** your dataset — column types, missing values, schema
2. **Plans** a multi-step analysis strategy
3. **Writes and executes** Python code against your data
4. **Recovers** from any code errors automatically
5. **Returns** plain English insights + charts

---

## Architecture

DataPilot uses a custom multi-agent orchestration loop — no LangChain or LangGraph. Four specialized agents work in sequence:
```
User Question
      │
      ▼
 ┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌───────────┐
 │ Planner │────▶│ Analyst  │────▶│ Repair Agent│────▶│Summarizer │
 └─────────┘     └──────────┘     └─────────────┘     └───────────┘
      │                │                  │                  │
  Makes a plan    Writes + runs       Fixes broken      Plain English
                  Python code           code             answer + charts
```

| Agent | Role |
|---|---|
| **Planner** | Turns your question into an ordered analysis plan |
| **Analyst** | Writes Python code and executes it against your data |
| **Repair Agent** | Reads tracebacks and rewrites broken code automatically |
| **Summarizer** | Translates raw outputs into business-facing insights |

---

## Tech Stack

**Backend**
- FastAPI + Python 3.11
- Pandas, NumPy, Matplotlib, Scikit-learn
- Anthropic API (Claude Sonnet)
- Subprocess sandbox with 15s timeout for safe code execution
- SQLite via SQLAlchemy for session history

**Frontend**
- React 18 + Tailwind CSS
- Recharts for chart rendering
- Vite dev server

---

## Project Structure
```
datapilot/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── upload.py
│   │   │   └── analyze.py
│   │   ├── agents/
│   │   │   ├── planner.py
│   │   │   ├── analyst.py
│   │   │   ├── repair.py
│   │   │   └── summarizer.py
│   │   ├── tools/
│   │   │   ├── schema_tool.py
│   │   │   ├── python_runner.py
│   │   │   ├── chart_saver.py
│   │   │   └── stats_tool.py
│   │   └── services/
│   │       ├── llm_service.py
│   │       └── dataset_service.py
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── UploadPanel.jsx
        │   ├── ChatPanel.jsx
        │   ├── ResultsPanel.jsx
        │   └── TracePanel.jsx
        └── pages/
            └── Dashboard.jsx
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your key: ANTHROPIC_API_KEY=sk-ant-...
py -3.11 -m uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Example Queries

- `"What drives customer churn?"`
- `"Which contract type has the highest churn rate?"`
- `"Plot monthly charges by churn status"`
- `"What is the average tenure of churned vs retained customers?"`
- `"Which features are most correlated with churn?"`
- `"Find any anomalies in the data"`
- `"Give me 3 business insights supported by numbers"`

---

## Sample Datasets

| Dataset | Source | Good for |
|---|---|---|
| Telco Customer Churn | Kaggle | Classification, feature importance |
| Superstore Sales | Kaggle | Trend analysis, revenue insights |
| Airbnb NYC Listings | Inside Airbnb | Geographic, pricing analysis |

---

## Key Design Decisions

**Why custom orchestration instead of LangChain?**
Building the agent loop from scratch makes every step explainable and debuggable. The plan → generate → execute → repair → summarize sequence is explicit code, not framework magic.

**Why subprocess for code execution?**
Generated code runs in an isolated subprocess with a 15-second timeout. It can only access the uploaded file and if it crashes, the main server keeps running.

**Why Claude Sonnet?**
Claude performs particularly well on structured code generation tasks — it reliably produces clean Pandas/Matplotlib code without extensive prompt engineering.

---

## Roadmap

**V2**
- [ ] Multi-turn conversation with memory
- [ ] Automatic EDA summary on upload
- [ ] Automatic chart type selection
- [ ] Downloadable analysis report

**V3**
- [ ] LangGraph migration for persistence and streaming
- [ ] Anomaly detection pipeline
- [ ] Time series forecasting
- [ ] Multi-dataset support
- [ ] SQL mode for relational tables

---

## Limitations

- CSV files only
- Analysis quality depends on data cleanliness
- Complex models may hit the 15s sandbox timeout
- No authentication — designed for local use at MVP stage

---

## License

MIT

---

*Built as a portfolio project demonstrating autonomous agent design, LLM tool use, and full-stack AI engineering.*
