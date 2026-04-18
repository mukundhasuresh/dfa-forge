import { Shield, Folder, Clock, Activity } from 'lucide-react'

const ICON_MAP = {
  artifacts: Folder,
  critical: Shield,
  ttps: Shield,
  timeline: Clock,
  progress: Activity
}

const COLOR_MAP = {
  artifacts: 'accent',
  critical: 'danger',
  ttps: 'purple',
  timeline: 'warning',
  progress: 'blue'
}

export function MetricCard({ type, value, label, className = '' }) {
  const Icon = ICON_MAP[type] || Activity
  const color = COLOR_MAP[type] || 'accent'
  
  return (
    <div className={`metric-card bg-surface-2 border border-border p-6 rounded-xl hover:border-${color} hover:shadow-lg transition-all group ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 bg-${color}/10 rounded-xl flex items-center justify-center group-hover:bg-${color}/20 transition-all`}>
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
      </div>
      
      <div className={`text-3xl font-bold font-syne bg-gradient-to-r from-${color} to-text bg-clip-text text-transparent mb-1`}>
        {value}
      </div>
      <div className="text-muted text-sm font-medium uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}

