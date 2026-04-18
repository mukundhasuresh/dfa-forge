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

export function Sidebar({ cases, activeCase, setActiveCase, startScan }) {
  const location = useLocation()

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="font-syne text-2xl font-bold bg-gradient-to-r from-accent to-blue bg-clip-text text-transparent">
          DFA/forge
        </h1>
        <p className="text-muted text-sm mt-1">Digital Forensics</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              location.pathname === path
                ? 'bg-accent/10 border border-accent text-accent'
                : 'hover:bg-surface-2 border border-transparent hover:border-muted text-muted hover:text-text'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Active Case */}
      {cases.length > 0 && (
        <div className="p-4 border-t border-border space-y-3">
          <div className="text-xs uppercase tracking-wider text-muted font-medium">Active Case</div>
          
          <select 
            value={activeCase?.id || ''}
            onChange={(e) => {
              const caseId = parseInt(e.target.value)
              const selectedCase = cases.find(c => c.id === caseId)
              setActiveCase(selectedCase)
            }}
            className="w-full bg-surface-2 border border-border rounded-lg p-3 text-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          >
            {cases.map(caseItem => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.name} ({caseItem.status})
              </option>
            ))}
          </select>

          {activeCase && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => startScan(activeCase.id)}
                disabled={activeCase.status !== 'pending'}
                className="flex-1 bg-accent/90 hover:bg-accent text-background px-3 py-2 rounded-lg text-xs font-medium disabled:bg-muted disabled:cursor-not-allowed transition-all"
              >
                {activeCase.status === 'pending' ? 'Start Scan' : 'Scanning...'}
              </button>
              <button className="p-2 bg-surface-2 hover:bg-surface border border-border rounded-lg transition-all">
                <Download className="w-4 h-4 text-muted" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

