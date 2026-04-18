import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FolderOpen, 
  Clock, 
  Shield, 
  Brain, 
  FileText, 
  Search, 
  Download 
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/artifacts', label: 'Artifacts', icon: FolderOpen },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/iocs', label: 'IOC Enrichment', icon: Shield },
  { path: '/attack-map', label: 'ATT&CK Map', icon: Shield },
  { path: '/ai-report', label: 'AI Report', icon: Brain },
  { path: '/file-search', label: 'File Search', icon: Search },
  { path: '/export', label: 'Export Report', icon: Download }
]

export function Sidebar({ cases = [], activeCase, setActiveCase, startScan }) {
  const location = useLocation()

  return (
    <div style={{width:'220px', minWidth:'220px', background:'#111318', borderRight:'1px solid #1e2330', display:'flex', flexDirection:'column', padding:'16px 0', overflowY:'auto'}}>
      {/* Logo */}
      <div style={{padding:'24px 16px 16px', borderBottom:'1px solid #1e2330'}}>
        <h1 style={{fontFamily:'Syne, sans-serif', fontSize:'20px', fontWeight:700, background:'linear-gradient(to right, #00d4aa, #0099ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 4px 0'}}>
          DFA/forge
        </h1>
        <p style={{color:'#5a6480', fontSize:'12px', margin:0}}>Digital Forensics</p>
      </div>

      {/* Navigation */}
      <nav style={{flex:1, padding:'16px'}}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              style={{
                display:'flex', 
                alignItems:'center', 
                gap:'10px', 
                padding:'8px 16px', 
                cursor:'pointer', 
                color: isActive ? '#e8ecf4' : '#5a6480', 
                background: isActive ? '#181c24' : 'transparent', 
                borderLeft: isActive ? '2px solid #00d4aa' : '2px solid transparent', 
                fontSize:'13px',
                textDecoration:'none',
                borderRadius:'0 8px 8px 0',
                marginBottom:'4px'
              }}
            >
              <Icon style={{width:'20px', height:'20px', flexShrink:0}} />
              <span style={{fontWeight: isActive ? 600 : 400}}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Active Case */}
      {cases?.length > 0 && (
        <div style={{padding:'16px', borderTop:'1px solid #1e2330', marginTop:'auto'}}>
          <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', color:'#5a6480', fontWeight:500, marginBottom:'12px'}}>Active Case</div>
          
          <select 
            value={activeCase?.id || ''} 
            onChange={(e) => {
              const caseId = parseInt(e.target.value)
              const selectedCase = cases.find(c => c.id === caseId)
              setActiveCase(selectedCase)
            }}
            style={{
              width:'100%', 
              background:'#181c24', 
              border:'1px solid #1e2330', 
              borderRadius:'6px', 
              padding:'8px 12px', 
              fontSize:'13px', 
              color:'#e8ecf4', 
              outline:'none',
              cursor:'pointer'
            }}
          >
            {cases.map(caseItem => (
              <option key={caseItem.id} value={caseItem.id} style={{fontSize:'13px'}}>
                {caseItem.name} ({caseItem.status})
              </option>
            ))}
          </select>

          {activeCase && (
            <div style={{display:'flex', gap:'8px', paddingTop:'12px'}}>
              <button
                onClick={() => startScan(activeCase.id)}
                disabled={activeCase.status !== 'pending'}
                style={{
                  flex:1, 
                  background: activeCase.status === 'pending' ? '#00d4aa' : '#5a6480', 
                  color:'#0a0c10', 
                  border:'none', 
                  borderRadius:'6px', 
                  padding:'6px 12px', 
                  fontSize:'12px', 
                  fontWeight:600, 
                  cursor: activeCase.status === 'pending' ? 'pointer' : 'not-allowed', 
                  opacity: activeCase.status === 'pending' ? 1 : 0.6
                }}
              >
                {activeCase.status === 'pending' ? 'Start Scan' : 'Scanning...'}
              </button>
              <button style={{padding:'6px', background:'#181c24', border:'1px solid #1e2330', borderRadius:'6px', cursor:'pointer'}}>
                <Download style={{width:'14px', height:'14px', color:'#5a6480'}} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

