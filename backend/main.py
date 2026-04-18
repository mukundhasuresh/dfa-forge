from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os

from database import Database
from ingestor import Ingestor
from enrichment import Enricher
from mitre import MITREMapper
from ai_narrative import generate_narrative
from report import generate_html_report

db = Database()

class CreateCaseRequest(BaseModel):
    name: str
    image_path: str

app = FastAPI(title="DFA/forge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def run_scan(case_id: int):
    try:
        ingestor = Ingestor(case_id)
        ingestor.scan()
        Enricher.enrich_artifacts(case_id)
        mapper = MITREMapper()
        mapper.map_case_artifacts(case_id)
        db.update_case_status(case_id, "completed")
    except Exception as e:
        print(f"Scan error for case {case_id}: {e}")
        db.update_case_status(case_id, "failed")

@app.post("/api/cases")
async def create_case(request: CreateCaseRequest):
    case_id = db.create_case(request.name, request.image_path)
    return {"id": case_id, "name": request.name, "status": "pending"}

@app.get("/api/cases")
async def list_cases():
    cases = db.get_cases()
    return {"cases": cases}

@app.get("/api/cases/{case_id}")
async def get_case(case_id: int):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.post("/api/cases/{case_id}/scan")
async def start_scan(case_id: int, background_tasks: BackgroundTasks):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.update_case_status(case_id, "scanning")
    background_tasks.add_task(run_scan, case_id)
    return {"message": "Scan started", "case_id": case_id}

@app.get("/api/cases/{case_id}/progress")
async def get_progress(case_id: int):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    status = case['status']
    progress = int(status.split(':')[1]) if ':' in status else (0 if status == 'pending' else 100)
    return {"progress": progress, "status": status}

@app.get("/api/cases/{case_id}/artifacts")
async def get_artifacts(case_id: int):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"artifacts": db.get_artifacts(case_id)}

@app.get("/api/cases/{case_id}/ttps")
async def get_ttps(case_id: int):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"ttps": db.get_ttps(case_id)}

@app.get("/api/cases/{case_id}/timeline")
async def get_timeline(case_id: int):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"timeline": db.get_timeline(case_id)}

@app.get("/api/cases/{case_id}/narrative")
async def get_narrative(case_id: int):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    narrative = generate_narrative(case_id)
    return {"narrative": narrative}

@app.get("/api/cases/{case_id}/report")
async def get_report(case_id: int):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    os.makedirs("reports", exist_ok=True)
    report_path = f"reports/case_{case_id}_report.html"
    generate_html_report(case_id, report_path)
    return FileResponse(report_path, media_type='text/html', filename=f"dfa_forge_case_{case_id}_report.html")

@app.get("/")
async def root():
    return {"message": "DFA/forge API v1.0.0", "docs": "/docs"}