# DFA/forge

Digital Forensics Automation Tool for SOC analysts.

## Quick Start

1. Clone the repo
2. Copy `.env.example` to `.env` and add your API keys
3. Backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload`
4. Frontend: `cd frontend && npm install && npm run dev`
5. Open http://localhost:5173

## Features

- Automated disk image analysis with sleuthkit + bulk_extractor
- IOC enrichment (VirusTotal, AbuseIPDB)
- MITRE ATT&CK TTP mapping
- AI-powered forensic narratives (Anthropic Claude)
- Interactive dashboard with timeline, heatmap, artifacts table
- Self-contained HTML reports

