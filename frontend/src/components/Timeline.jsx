import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Clock, 
  FileText, 
  Activity, 
  AlertCircle,
  Shield 
} from 'lucide-react'

const EVENT_ICONS = {
  file: FileText,
  process: Activity,
  network: Shield,
  registry: Clock
}

const EVENT_COLORS = {
  file: 'accent',
  process: 'blue',
  network: 'purple', 
  registry: 'warning'
}

export function Timeline({ caseId, limit = 10 }) {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (caseId) {
      fetchTimeline()
    }
  }, [caseId])

  const fetchTimeline = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/timeline`)
      setTimeline(response.data.timeline.slice(0, limit) || [])
    } catch (error) {
      console.error('Error fetching timeline:', error)
      setTimeline(Array(limit).fill({}).map((_, i) => ({
        timestamp: 'Pending...',
        event_type: 'scan',
        description: 'Analysis in progress',
        path: 'disk.img'
      })))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(limit).fill().map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-surface-2 border border-border rounded-xl animate-pulse">
            <div className="w-12 h-12 bg-muted/30 rounded-xl flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted/30 rounded w-32"></div>
              <div className="h-3 bg-muted/20 rounded w-64"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-warning/20 p-1.5 rounded-xl">
          <Clock className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="font-syne text-xl font-bold">Recent Activity</h3>
          <p className="text-muted text-sm">{timeline.length} events</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {timeline.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted">No timeline events available</p>
            <p className="text-xs text-muted/70 mt-1">Run a scan to generate timeline</p>
          </div>
        ) : (
          timeline.map((event, index) => {
            const Icon = EVENT_ICONS[event.event_type] || FileText
            const color = EVENT_COLORS[event.event_type] || 'muted'
            
            return (
              <div 
                key={`${event.id}-${index}`}
                className="group flex items-start gap-4 p-4 bg-surface-2 border border-border/50 rounded-xl hover:bg-surface hover:border-border hover:shadow-md transition-all cursor-pointer"
              >
                {/* Event icon */}
                <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-${color}/10 border-2 border-${color}/20 group-hover:border-${color}/40 transition-all`}>
                  <Icon className={`w-6 h-6 text-${color}`} />
                </div>
                
                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-text truncate">
                      {event.path?.split('/').pop() || 'Unknown'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-${color}/20 text-${color}`}>
                      {event.event_type}
                    </span>
                  </div>
                  
                  <p className="text-muted text-sm mb-2 line-clamp-2">
                    {event.description || 'File system event'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted font-mono">
                    <span>{event.timestamp?.slice(11, 19) || 'Pending'}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full font-medium">
                        NEWEST
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {timeline.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <button 
            onClick={fetchTimeline}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-2 border-2 border-dashed border-border/50 rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-muted hover:text-accent group"
          >
            <Clock className="w-4 h-4 group-hover:rotate-180 transition-transform" />
            Load More Timeline Events
          </button>
        </div>
      )}
    </div>
  )
}

