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

const STATUS_ICONS = {
  pending: Loader2,
  running: Zap,
  success: CheckCircle,
  failed: AlertCircle,
  paused: Pause
}

export function ScanProgress({ caseId }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseStatuses, setPhaseStatuses] = useState(PHASES.map(() => 'pending'))

  useEffect(() => {
    if (caseId) {
      const interval = setInterval(() => {
        fetchProgress()
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [caseId])

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/progress`)
      const { progress: p, status: s, current_phase, phase_statuses } = response.data
      
      setProgress(p)
      setStatus(s)
      if (current_phase !== undefined) setCurrentPhase(current_phase)
      if (phase_statuses) setPhaseStatuses(phase_statuses)
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  }

  const isComplete = status === 'complete' || progress === 100
  const Icon = STATUS_ICONS[status] || Loader2

  return (
    <div className="scan-progress bg-gradient-to-r from-accent/5 to-blue/5 border-2 border-accent/30 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ${
            isComplete 
              ? 'bg-accent/20 border-4 border-accent' 
              : 'bg-accent/10 border-2 border-accent/50 animate-pulse'
          }`}>
            <Icon className={`w-8 h-8 ${isComplete ? 'text-accent' : 'text-accent animate-spin'}`} />
          </div>
          <div>
            <h3 className="font-syne text-2xl font-bold bg-gradient-to-r from-accent to-blue bg-clip-text text-transparent">
              Scan Progress
            </h3>
            <p className="text-muted text-lg font-mono font-semibold">{progress}%</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-full text-sm font-mono font-bold capitalize ${
          status === 'complete' 
            ? 'bg-accent/20 text-accent border border-accent/30' 
            : status === 'failed' 
              ? 'bg-danger/20 text-danger border border-danger/30'
              : 'bg-blue/20 text-blue border border-blue/30'
        }`}>
          {status}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="w-full bg-surface-2 rounded-full h-4 border-2 border-border/50 shadow-inner overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r from-accent to-blue rounded-full shadow-lg transition-all duration-1000 relative overflow-hidden ${
              isComplete ? 'animate-pulse' : ''
            }`}
            style={{ width: `${progress}%` }}
          >
            {progress > 0 && (
              <div 
                className="absolute inset-0 bg-gradient-to-r from-accent via-accent/70 to-transparent animate-shimmer"
                style={{ 
                  backgroundSize: '200% 100%',
                  animationDuration: '2s'
                }}
              />
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs font-mono text-muted mt-2">
          <span>0%</span>
          <span>{progress}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Phase Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {PHASES.map((phase, index) => {
          const phaseStatus = phaseStatuses[index] || 'pending'
          const isCurrent = index === currentPhase && !isComplete
          const Icon = STATUS_ICONS[phaseStatus] || Loader2
          
          return (
            <div key={phase.id} className={`phase-item p-4 rounded-xl border-2 transition-all ${
              phaseStatus === 'success' 
                ? 'border-accent/40 bg-accent/5 shadow-lg' 
                : phaseStatus === 'failed'
                  ? 'border-danger/40 bg-danger/5 shadow-lg' 
                  : isCurrent 
                    ? 'border-accent animate-pulse bg-accent/10 shadow-accent/25 shadow-lg' 
                    : 'border-border/50 hover:border-border'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  phaseStatus === 'success' ? 'bg-accent/20' :
                  phaseStatus === 'failed' ? 'bg-danger/20' :
                  isCurrent ? 'bg-accent/30' : 'bg-surface-2'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    phaseStatus === 'success' ? 'text-accent' :
                    phaseStatus === 'failed' ? 'text-danger' :
                    isCurrent ? 'text-accent' : 'text-muted'
                  } ${isCurrent || phaseStatus === 'running' ? 'animate-spin' : ''}`} />
                </div>
              </div>
              
              <h4 className="font-mono text-sm font-bold mb-1 truncate">{phase.name}</h4>
              <p className="text-xs text-muted font-mono uppercase tracking-wider mb-2">{phase.tool}</p>
              <div className={`w-full h-1.5 bg-surface-2 rounded-full overflow-hidden ${
                phaseStatus === 'success' ? 'bg-accent' :
                phaseStatus === 'failed' ? 'bg-danger' :
                isCurrent ? 'bg-accent/40 animate-pulse' : ''
              }`} />
              
              <div className="text-xs font-mono text-muted mt-2 capitalize">{phaseStatus}</div>
            </div>
          )
        })}
      </div>

      {/* Bottom controls */}
      {!isComplete && (
        <div className="flex gap-4 mt-8 pt-8 border-t border-border/50">
          <button className="flex-1 flex items-center justify-center gap-2 bg-surface-2 hover:bg-accent/10 border border-border/50 hover:border-accent text-accent px-6 py-3 rounded-xl font-mono font-semibold transition-all group">
            <Play className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Start Scan
          </button>
          <button className="px-6 py-3 bg-surface-2 hover:bg-muted/20 border border-border/50 rounded-xl font-mono text-sm transition-all">
            Pause
          </button>
        </div>
      )}
    </div>
  )
}

