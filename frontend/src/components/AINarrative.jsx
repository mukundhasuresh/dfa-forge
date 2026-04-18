import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bot, Brain, Copy, RefreshCw } from 'lucide-react'

export function AINarrative({ caseId }) {
  const [narrative, setNarrative] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (caseId) {
      fetchNarrative()
    }
  }, [caseId])

  const fetchNarrative = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/narrative`)
      setNarrative(response.data.narrative)
    } catch (error) {
      console.error('Error fetching AI narrative:', error)
      setNarrative({
        executive_summary: 'AI analysis not available. Run a full scan first.',
        confidence_level: 'low'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="narrative space-y-4 p-8 border-2 border-dashed border-border/50 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-muted/20 rounded-2xl flex items-center justify-center animate-spin">
            <Brain className="w-6 h-6 text-muted" />
          </div>
          <div>
            <h3 className="font-syne text-xl font-bold text-accent">AI Analysis</h3>
            <p className="text-muted text-sm">Generating forensic narrative...</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-muted/30 rounded-lg animate-pulse"></div>
          <div className="h-4 bg-muted/20 rounded-lg w-3/4 animate-pulse"></div>
          <div className="h-4 bg-muted/30 rounded-lg w-1/2 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!narrative) {
    return (
      <div className="narrative border-dashed border-2 border-accent/30 p-8 text-center">
        <Bot className="w-20 h-20 text-accent/50 mx-auto mb-6" />
        <h3 className="font-syne text-2xl font-bold text-accent mb-2">AI Forensic Analyst</h3>
        <p className="text-muted mb-6 max-w-md mx-auto">
          No analysis available. Complete a scan to generate the forensic narrative.
        </p>
        <button 
          onClick={fetchNarrative}
          className="inline-flex items-center gap-2 bg-accent text-background px-6 py-3 rounded-xl font-semibold hover:bg-opacity-90 transition-all"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          Regenerate
        </button>
      </div>
    )
  }

  return (
    <div className="narrative relative group">
      {/* AI Badge */}
      <div className="absolute -top-3 left-6 bg-accent text-background px-4 py-1.5 rounded-full text-xs font-bold font-mono shadow-lg flex items-center gap-1 z-10">
        <Bot className="w-3.5 h-3.5" />
        AI Generated
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-purple to-accent rounded-2xl flex items-center justify-center shadow-xl">
            <Brain className="w-7 h-7 text-background/90" />
          </div>
          <div>
            <h3 className="font-syne text-2xl font-bold bg-gradient-to-r from-accent via-purple to-blue bg-clip-text text-transparent mb-1">
              Forensic Narrative
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold bg-${narrative.confidence_level}/20 text-${narrative.confidence_level}`}>
                Confidence: {narrative.confidence_level?.toUpperCase()}
              </span>
              <span className="text-muted font-mono text-xs">Case #{caseId}</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => copyToClipboard(JSON.stringify(narrative, null, 2))}
            className="p-2 hover:bg-accent/10 rounded-xl border border-border/50 hover:border-accent/30 transition-all"
            title="Copy JSON"
          >
            {copied ? (
              <span className="w-5 h-5 text-accent">✓</span>
            ) : (
              <Copy className="w-5 h-5 text-muted" />
            )}
          </button>
          <button
            onClick={fetchNarrative}
            className="p-2 hover:bg-purple/10 rounded-xl border border-border/50 hover:border-purple/30 transition-all"
            title="Regenerate"
          >
            <RefreshCw className="w-5 h-5 text-muted" />
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      {narrative.executive_summary && (
        <div className="mb-8">
          <h4 className="font-syne font-bold text-lg mb-4 text-accent flex items-center gap-2">
            📋 Executive Summary
          </h4>
          <p className="text-lg leading-relaxed max-w-4xl">{narrative.executive_summary}</p>
        </div>
      )}

      {/* Attack Narrative */}
      {narrative.attack_narrative && (
        <div className="mb-8">
          <h4 className="font-syne font-bold text-lg mb-4 flex items-center gap-2 bg-purple/10 text-purple px-4 py-2 rounded-xl">
            🔗 Attack Chain
          </h4>
          <div className="prose prose-invert max-w-none leading-relaxed text-lg">
            <p>{narrative.attack_narrative}</p>
          </div>
        </div>
      )}

      {/* Structured Findings */}
      {narrative.key_findings?.length > 0 && (
        <div className="mb-8">
          <h4 className="font-syne font-bold text-lg mb-6 flex items-center gap-2">
            🎯 Key Findings ({narrative.key_findings.length})
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {narrative.key_findings.map((finding, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-surface-2 border border-border/50 rounded-xl hover:border-accent/30 transition-all group">
                <div className="w-8 h-8 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent font-bold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text">{finding}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {narrative.recommended_actions?.length > 0 && (
        <div className="mb-8">
          <h4 className="font-syne font-bold text-lg mb-6 flex items-center gap-2 text-warning">
            ⚠️ Recommended Actions
          </h4>
          <ul className="space-y-3">
            {narrative.recommended_actions.map((action, index) => (
              <li key={index} className="flex items-start gap-3 p-4 bg-warning/5 border-l-4 border-warning rounded-r-xl hover:bg-warning/10 transition-all">
                <div className="w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-warning text-sm">
                  {index + 1}
                </div>
                <span className="text-text">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {narrative.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4">
          {narrative.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-surface-2 border border-border/50 rounded-full text-xs font-mono hover:bg-accent/10 hover:border-accent transition-all cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

