# Entry point for the DataPilot FastAPI application.
# Registers all routes and configures CORS for the React frontend.

from dotenv import load_dotenv
load_dotenv()  # loads .env from the working directory (backend/)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routes.upload import router as upload_router
from app.routes.analyze import router as analyze_router
from app.routes.suggest import router as suggest_router

app = FastAPI(title="DataPilot", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/charts", StaticFiles(directory=UPLOADS_DIR), name="charts")

app.include_router(upload_router, prefix="/upload", tags=["upload"])
app.include_router(analyze_router, prefix="/analyze", tags=["analyze"])
app.include_router(suggest_router, prefix="/suggest", tags=["suggest"])


@app.get("/health")
def health():
    return {"status": "ok"}
