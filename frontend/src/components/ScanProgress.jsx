import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle,
  Zap, 
  Loader2 
} from 'lucide-react'

const PHASES = [
  { id: 'ingest', name: 'File System Ingest', tool: 'sleuthkit' },
  { id: 'bulk_extract', name: 'Bulk Extraction', tool: 'bulk_extractor' },
  { id: 'enrich', name: 'IOC Enrichment', tool: 'VirusTotal + AbuseIPDB' },
  { id: 'mitre', name: 'MITRE Mapping', tool: 'ATT&CK Rules' },
  { id: 'narrative', name: 'AI Narrative', tool: 'Claude Sonnet' }
]

export function ScanProgress({ caseId }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [currentPhase, setCurrentPhase] = useState(0)

  useEffect(() => {
    if (caseId) {
      const interval = setInterval(fetchProgress, 1000)
      return () => clearInterval(interval)
    }
  }, [caseId])

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/progress`)
      setProgress(response.data.progress || 0)
      setStatus(response.data.status || 'idle')
      setCurrentPhase(response.data.current_phase || 0)
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  }

  const isComplete = status === 'complete' || progress === 100

  return (
    <div style={{
      background:'#111318', 
      border:'1px solid #1e2330', 
      borderRadius:'8px', 
      padding:'16px 20px', 
      display:'flex', 
      alignItems:'center', 
      gap:'16px',
      fontFamily:'IBM Plex Mono, monospace'
    }}>
      <div style={{width:'8px', height:'8px', background:'#00d4aa', borderRadius:'50%', animation:'pulse 1.5s infinite'}}></div>
      <div style={{flex:1}}>
        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
          <div style={{width:'12px', height:'12px', border:'2px solid #00d4aa', borderTop:'2px solid transparent', borderRadius:'50%', animation:'spin 1s linear infinite'}}></div>
          <span style={{fontSize:'14px', fontWeight:600, color:'#e8ecf4'}}>Scanning Case {caseId}</span>
          <span style={{marginLeft:'auto', padding:'2px 8px', background:status === 'complete' ? '#00d4aa' : '#0099ff', color:'#0a0c10', borderRadius:'4px', fontSize:'11px', fontWeight:600}}>
            {progress}%
          </span>
        </div>
        <div style={{height:'4px', background:'#1e2330', borderRadius:'2px', overflow:'hidden'}}>
          <div style={{
            height:'100%', 
            background:'#00d4aa', 
            width:`${progress}%`, 
            transition:'width 0.3s ease',
            borderRadius:'2px'
          }}></div>
        </div>
        <div style={{fontSize:'11px', color:'#5a6480', marginTop:'4px'}}>
          {currentPhase > 0 ? PHASES[currentPhase - 1]?.name || 'Processing...' : 'Initializing...'}
        </div>
      </div>
    </div>
  )
}

