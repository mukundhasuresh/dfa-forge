import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Filter, 
  Search, 
  Download, 
  AlertCircle,
  ShieldCheck 
} from 'lucide-react'

const SEVERITY_COLORS = {
  critical: 'bg-danger text-white',
  high: 'bg-warning text-white', 
  medium: 'bg-blue text-white',
  low: 'bg-muted text-text'
}

const TYPE_COLORS = {
  ip: 'bg-danger/20 text-danger border-danger/30',
  url: 'bg-warning/20 text-warning border-warning/30',
  hash: 'bg-blue/20 text-blue border-blue/30',
  email: 'bg-warning/20 text-warning border-warning/30',
  file: 'bg-accent/20 text-accent border-accent/30'
}

export function ArtifactTable({ caseId }) {
  const [artifacts, setArtifacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredArtifacts, setFilteredArtifacts] = useState([])

  useEffect(() => {
    if (caseId) {
      fetchArtifacts()
    }
  }, [caseId])

  useEffect(() => {
    filterArtifacts()
  }, [artifacts, filterSeverity, searchTerm])

  const fetchArtifacts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/artifacts`)
      setArtifacts(response.data.artifacts || [])
    } catch (error) {
      console.error('Error fetching artifacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterArtifacts = () => {
    let filtered = artifacts
    
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === filterSeverity)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.source.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredArtifacts(filtered)
  }

  const severityStats = artifacts.reduce((acc, artifact) => {
    acc[artifact.severity] = (acc[artifact.severity] || 0) + 1
    return acc
  }, {})

  const exportArtifacts = () => {
    const csv = [
      ['Type', 'Value', 'Severity', 'Source', 'Defanged'],
      ...filteredArtifacts.map(a => [a.type, a.value, a.severity, a.source, a.defanged_value])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `artifacts_case_${caseId}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted animate-pulse">
          <div className="w-6 h-6 bg-muted/50 rounded-full"></div>
          <span>Loading artifacts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            <span className="font-syne text-xl font-bold">Artifacts ({artifacts.length})</span>
          </div>
          
          {/* Severity stats */}
          <div className="flex items-center gap-1 text-xs">
            {Object.entries(severityStats).map(([severity, count]) => (
              <div key={severity} className={`px-2 py-1 rounded-full bg-${severity}/10 text-${severity}`}>
                {severity}: {count}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-surface-2 border border-border px-3 py-2 rounded-lg">
            <Search className="w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm placeholder-muted w-48"
            />
          </div>
          
          <button
            onClick={exportArtifacts}
            className="p-2 hover:bg-surface-2 border border-border rounded-lg hover:border-muted transition-all"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-surface-2 border border-border p-4 rounded-xl">
        <label className="flex items-center gap-2 text-sm text-muted">
          <Filter className="w-4 h-4" />
          Severity:
        </label>
        <div className="flex gap-1">
          {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterSeverity === sev
                  ? `bg-${sev} text-white shadow-md`
                  : 'bg-surface hover:bg-surface-2 text-muted border border-border hover:border-muted'
              }`}
            >
              {sev === 'all' ? 'All' : sev.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="ml-auto text-sm text-muted">
          Showing {filteredArtifacts.length} of {artifacts.length} artifacts
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden shadow-lg bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted font-medium">
                  Type
                </th>
                <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted font-medium min-w-[300px]">
                  Value
                </th>
                <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted font-medium">
                  Severity
                </th>
                <th className="text-left p-4 font-mono text-xs uppercase tracking-wider text-muted font-medium">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredArtifacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
                    <div className="text-muted">
                      {searchTerm || filterSeverity !== 'all' 
                        ? 'No artifacts match the current filters'
                        : 'No artifacts found for this case. Start a scan to analyze a disk image.'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredArtifacts.map((artifact, index) => (
                  <tr 
                    key={`${artifact.id}-${index}`}
                    className="border-b border-border/50 hover:bg-surface-2 transition-all"
                  >
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-medium ${TYPE_COLORS[artifact.type]}`}>
                        {artifact.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 max-w-[300px] truncate">
                      <code className="text-sm font-mono bg-muted/20 px-2 py-1 rounded break-all">
                        {artifact.defanged_value || artifact.value}
                      </code>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${SEVERITY_COLORS[artifact.severity]}`}>
                        {artifact.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted/30 rounded text-xs font-mono">
                        {artifact.source}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

