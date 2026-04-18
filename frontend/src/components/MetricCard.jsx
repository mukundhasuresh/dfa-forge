import React from 'react'
import { Shield, Folder, Clock, Activity, Zap } from 'lucide-react'

const ICON_MAP = {
  artifacts: Folder,
  critical: Shield,
  ttps: Shield,
  timeline: Clock,
  progress: Activity
}

const COLOR_MAP = {
  artifacts: '#00d4aa',
  critical: '#ef4444',
  ttps: '#8b5cf6',
  timeline: '#f59e0b',
  progress: '#0099ff'
}

export function MetricCard({ type, value, label }) {
  const Icon = ICON_MAP[type] || Activity
  const color = COLOR_MAP[type] || '#00d4aa'
  
  return (
    <div style={{
      background:'#111318', 
      border:'1px solid #1e2330', 
      borderRadius:'8px', 
      padding:'16px',
      minHeight:'100px',
      display:'flex', 
      flexDirection:'column', 
      justifyContent:'space-between'
    }}>
      <div style={{fontSize:'10px', color:'#5a6480', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px'}}>
        {label}
      </div>
      <div style={{
        fontSize:'24px', 
        fontWeight:700, 
        fontFamily:'Syne,sans-serif', 
        color: color,
        marginBottom:'4px'
      }}>
        {value ?? 0}
      </div>
      <div style={{fontSize:'11px', color:'#5a6480', marginTop:'4px'}}>
        {type === 'progress' ? 'Complete' : 'Found'}
      </div>
    </div>
  )
}

