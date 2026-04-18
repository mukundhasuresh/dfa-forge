from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import uuid
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager

from backend.database import db
from backend.ingestor import Ingestor
from backend.enrichment import Enricher
from backend.mitre import MITREMapper
from backend.ai_narrative import ai_narrative
from backend.report import generate_html_report

# Pydantic models
class CreateCaseRequest(BaseModel):
    name: str
    image_path: str

app = FastAPI(title="DFA/forge API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background scan task
async def run_scan(case_id: int):
    """Background task to run full forensic scan"""
    try:
        print(f"Starting background scan for case {case_id}")
        
        # 1. Run ingestor
        ingestor = Ingestor(case_id)
        ingestor.scan()
        
        # 2. Enrich artifacts
        Enricher.enrich_artifacts(case_id)
        
        # 3. Map to MITRE ATT&CK
        mapper = MITREMapper()
        mapper.map_case_artifacts(case_id)
        
        # 4. Mark complete
        db.update_case_status(case_id, "completed")
        
    except Exception as e:
        print(f"Scan error for case {case_id}: {e}")
        db.update_case_status(case_id, "failed")

@app.post("/api/cases")
async def create_case(request: CreateCaseRequest):
    """Create new forensic case"""
    case_id = db.create_case(request.name, request.image_path)
    return {"id": case_id, "name": request.name, "status": "pending"}

@app.get("/api/cases")
async def list_cases():
    """List all cases"""
    cases = db.get_cases()
    return {"cases": cases}

@app.get("/api/cases/{case_id}")
async def get_case(case_id: int):
    """Get case details"""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.post("/api/cases/{case_id}/scan")
async def start_scan(case_id: int, background_tasks: BackgroundTasks):
    """Start forensic scan (async)"""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Scan already started or completed")
    
    # Update status to scanning
    db.update_case_status(case_id, "scanning")
    
    # Add background task
    background_tasks.add_task(run_scan, case_id)
    
    return {"message": "Scan started", "case_id": case_id}

@app.get("/api/cases/{case_id}/progress")
async def get_progress(case_id: int):
    """Get scan progress"""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    status = case['status']
    if ':' in status:
        progress = int(status.split(':')[1])
    else:
        progress = 0 if status == 'pending' else 100
    
    return {"progress": progress, "status": status}

@app.get("/api/cases/{case_id}/artifacts")
async def get_artifacts(case_id: int):
    """Get artifacts for case"""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    artifacts = db.get_artifacts(case_id)
    return {"artifacts": artifacts}

@app.get("/api/cases/{case_id}/ttps")
async def get_ttps(case_id: int):
    """Get MITRE TTPs for case"""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    ttps = db.get_ttps(case_id)
    return {"ttps": ttps}

@app.get("/api/cases/{case_id}/timeline")
async def get_timeline(case_id: int):
    """Get timeline for case"""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    timeline = db.get_timeline(case_id)
    return {"timeline": timeline}

@app.get("/api/cases/{case_id}/narrative")
async def get_narrative(case_id: int):
    """Get AI narrative for case"""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    narrative = ai_narrative.generate_narrative(case_id)
    return {"narrative": narrative}

@app.get("/api/cases/{case_id}/report")
async def get_report(case_id: int):
    """Download HTML report"""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    report_path = f"reports/case_{case_id}_report.html"
    os.makedirs("reports", exist_ok=True)
    
    html_content = generate_html_report(case_id, report_path)
    
    return FileResponse(
        report_path,
        media_type='text/html',
        filename=f"dfa_forge_case_{case_id}_report.html"
    )

@app.get("/")
async def root():
    """API documentation"""
    return {"message": "DFA/forge API v1.0.0", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

