import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { ArtifactTable } from '../components/ArtifactTable'
import axios from 'axios'
import { ArrowLeft, Filter, Download } from 'lucide-react'

export function Artifacts({ activeCase, setActiveCase, cases, setCases }) {
  const { caseId } = useParams()
  const [caseData, setCaseData] = useState(null)
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    source: 'all'
  })

  useEffect(() => {
    if (caseId) {
      fetchCaseData()
    }
  }, [caseId])

  const fetchCaseData = async () => {
    try {
      const [caseRes, artifactsRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/cases/${caseId}`),
        axios.get(`http://localhost:8000/api/cases/${caseId}/artifacts`)
      ])
      
      setCaseData(caseRes.data)
      const artifacts = artifactsRes.data.artifacts || []
      
      // Calculate stats
      const severityStats = artifacts.reduce((acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1
        return acc
      }, {})
      
      const typeStats = artifacts.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1
        return acc
      }, {})
      
      setStats({ severity: severityStats, type: typeStats, total: artifacts.length })
    } catch (error) {
      console.error('Error fetching case data:', error)
    }
  }

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const startScan = async (caseId) => {
    try {
      await axios.post(`http://localhost:8000/api/cases/${caseId}/scan`)
      fetchCases()
    } catch (error) {
      console.error('Error starting scan:', error)
    }
  }

  const fetchCases = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/cases')
      setCases(response.data.cases)
    } catch (error) {
      console.error('Error fetching cases:', error)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        cases={cases}
        activeCase={activeCase}
        setActiveCase={setActiveCase}
        startScan={startScan}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-12 bg-surface border-b border-border px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-surface-2 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-muted" />
            </button>
            {caseData && (
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm font-mono font-semibold">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                Case {caseId}: {caseData.name}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted font-mono">
              {stats.total || 0} artifacts found
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8">
          {/* Stats Header */}
          {stats.total > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-surface-2 border border-border/50 rounded-xl p-6">
                <h3 className="font-mono text-sm uppercase tracking-wider text-muted mb-4">By Severity</h3>
                <div className="space-y-2">
                  {Object.entries(stats.severity || {}).map(([sev, count]) => (
                    <div key={sev} className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${sev === 'critical' ? 'bg-danger/20 text-danger' : 'bg-muted/30 text-muted'}`}>
                        {sev.toUpperCase()}
                      </span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-surface-2 border border-border/50 rounded-xl p-6">
                <h3 className="font-mono text-sm uppercase tracking-wider text-muted mb-4">By Type</h3>
                <div className="space-y-2">
                  {Object.entries(stats.type || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue/20 text-blue border border-blue/30">
                        {type.toUpperCase()}
                      </span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-surface-2 border border-border/50 rounded-xl p-6 md:col-span-3">
                <div className="flex items-center gap-3 mb-6">
                  <Filter className="w-5 h-5 text-muted" />
                  <h3 className="font-mono uppercase tracking-wider text-muted">Advanced Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select 
                    value={filters.severity}
                    onChange={(e) => updateFilter('severity', e.target.value)}
                    className="bg-surface border border-border/50 rounded-xl p-3 focus:border-accent focus:ring-1 focus:ring-accent/50"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <select 
                    value={filters.type}
                    onChange={(e) => updateFilter('type', e.target.value)}
                    className="bg-surface border border-border/50 rounded-xl p-3 focus:border-accent focus:ring-1 focus:ring-accent/50"
                  >
                    <option value="all">All Types</option>
                    <option value="ip">IP Addresses</option>
                    <option value="url">URLs</option>
                    <option value="hash">Hashes</option>
                    <option value="email">Emails</option>
                    <option value="file">Files</option>
                  </select>
                  
                  <select 
                    value={filters.source}
                    onChange={(e) => updateFilter('source', e.target.value)}
                    className="bg-surface border border-border/50 rounded-xl p-3 focus:border-accent focus:ring-1 focus:ring-accent/50"
                  >
                    <option value="all">All Sources</option>
                    <option value="sleuthkit">Sleuthkit</option>
                    <option value="bulk_extractor">Bulk Extractor</option>
                    <option value="virustotal">VirusTotal</option>
                    <option value="abuseipdb">AbuseIPDB</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Main Table */}
          <div className="bg-surface-2 border border-border/50 rounded-2xl p-1">
            <div className="sticky top-0 bg-surface-2 border-b border-border/50 px-8 py-6 flex items-center justify-between rounded-t-2xl -mt-1 z-10">
              <h2 className="font-syne text-2xl font-bold text-text">All Artifacts</h2>
              <button className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-background px-6 py-3 rounded-xl font-mono font-semibold transition-all shadow-lg hover:shadow-accent/25">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            
            <ArtifactTable caseId={caseId} filters={filters} />
          </div>
        </div>
      </div>
    </div>
  )
}

