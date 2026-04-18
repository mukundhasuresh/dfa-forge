import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Shield, Target, AlertTriangle } from 'lucide-react'

const TACTICS = [
  'Reconnaissance', 'Resource Development', 'Initial Access',
  'Execution', 'Persistence', 'Privilege Escalation',
  'Defense Evasion', 'Credential Access', 'Discovery',
  'Lateral Movement', 'Collection', 'Command and Control',
  'Exfiltration', 'Impact'
]

const CONFIDENCE_COLORS = {
  high: 'bg-purple/20 border-purple text-purple',
  medium: 'bg-warning/20 border-warning text-warning', 
  low: 'bg-muted/20 border-muted text-muted'
}

export function MitreHeatmap({ caseId }) {
  const [ttps, setTtps] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredTtp, setHoveredTtp] = useState(null)

  useEffect(() => {
    if (caseId) {
      fetchTTPs()
    }
  }, [caseId])

  const fetchTTPs = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/ttps`)
      setTtps(response.data.ttps || [])
    } catch (error) {
      console.error('Error fetching TTPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const tacticTtpCount = TACTICS.reduce((acc, tactic) => {
    acc[tactic] = ttps.filter(ttp => 
      ttp.tactic?.toLowerCase().includes(tactic.toLowerCase())
    ).reduce((count, ttp) => {
      count[ttp.confidence] = (count[ttp.confidence] || 0) + 1
      return count
    }, {})
    return acc
  }, {})

  const getDominantConfidence = (tactic) => {
    const counts = tacticTtpCount[tactic]
    if (!counts) return null
    
    const order = ['high', 'medium', 'low']
    for (const conf of order) {
      if (counts[conf] > 0) return conf
    }
    return null
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 h-80">
        {Array(8).fill().map((_, i) => (
          <div key={i} className="bg-surface-2 animate-pulse rounded-xl h-24"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple/20 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple" />
        </div>
        <div>
          <h3 className="font-syne text-xl font-bold">MITRE ATT&CK Coverage</h3>
          <p className="text-muted text-sm">Tactic coverage and confidence levels</p>
        </div>
      </div>

      <div 
        className="relative grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 p-6 bg-surface-2 border-2 border-border/50 rounded-2xl hover:border-purple/30 transition-all cursor-default h-80"
        onMouseLeave={() => setHoveredTtp(null)}
      >
        {TACTICS.map((tactic, index) => {
          const confidence = getDominantConfidence(tactic)
          const count = ttps.filter(ttp => 
            ttp.tactic?.toLowerCase().includes(tactic.toLowerCase())
          ).length
          
          return (
            <div
              key={tactic}
              className={`group relative p-4 rounded-xl border-2 border-transparent transition-all hover:scale-105 hover:z-10 hover:shadow-2xl ${
                confidence ? `hover:border-${confidence}` : 'hover:border-muted opacity-50'
              } ${CONFIDENCE_COLORS[confidence] || ''}`}
              style={{ gridRow: Math.floor(index / 4) + 1 }}
              onMouseEnter={() => {
                if (confidence) {
                  setHoveredTtp({
                    tactic,
                    ttps: ttps.filter(ttp => 
                      ttp.tactic?.toLowerCase().includes(tactic.toLowerCase())
                    )
                  })
                }
              }}
            >
              {/* Tactic label */}
              <div className="font-mono text-xs uppercase tracking-wider text-muted mb-2 truncate">
                {tactic.slice(0, 12)}
              </div>
              
              {/* Count badge */}
              {count > 0 && (
                <div className={`w-full h-16 rounded-xl flex items-center justify-center mb-2 shadow-lg ${
                  confidence ? `bg-${confidence} text-white` : 'bg-muted'
                }`}>
                  <span className="font-bold text-lg">{count}</span>
                </div>
              )}
              
              {/* Confidence indicator */}
              {confidence && (
                <div className="flex items-center gap-1 text-xs font-mono">
                  <div className={`w-2 h-2 rounded-full bg-${confidence}`}></div>
                  <span className="capitalize font-medium">{confidence}</span>
                </div>
              )}
              
              {/* Hover tooltip */}
              {confidence && hoveredTtp?.tactic === tactic && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-surface shadow-2xl border border-border/50 rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full bg-${confidence}`}></div>
                    <span className="font-mono text-sm font-bold capitalize">{confidence} confidence</span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {hoveredTtp.ttps.slice(0, 3).map(ttp => (
                      <div key={ttp.id} className="flex items-center gap-2 text-xs truncate">
                        <Target className="w-3 h-3 text-purple flex-shrink-0" />
                        <span className="font-mono">{ttp.technique_name}</span>
                      </div>
                    ))}
                    {hoveredTtp.ttps.length > 3 && (
                      <div className="text-xs text-muted mt-2">+{hoveredTtp.ttps.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {/* Legend */}
        <div className="md:col-span-8 lg:col-span-8 flex flex-wrap gap-3 p-4 pt-2 border-t border-border/50 items-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <div className="w-3 h-3 bg-purple rounded-full"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <div className="w-3 h-3 bg-muted rounded-full"></div>
            <span>Low/No Coverage</span>
          </div>
          <div className="ml-auto text-xs text-muted font-mono">
            Total TTPs mapped: <span className="font-bold text-accent">{ttps.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

