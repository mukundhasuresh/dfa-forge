import React, { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import { MetricCard } from '../components/MetricCard'
import { ArtifactTable } from '../components/ArtifactTable'
import { MitreHeatmap } from '../components/MitreHeatmap'
import { Timeline } from '../components/Timeline'
import { AINarrative } from '../components/AINarrative'
import { ScanProgress } from '../components/ScanProgress'
import axios from 'axios'

export function Overview({ activeCase, setActiveCase, cases, setCases }) {
  const [stats, setStats] = useState({
    artifacts: 0,
    critical: 0,
    ttps: 0,
    progress: 0
  })

  useEffect(() => {
    fetchStats()
  }, [activeCase])

  const fetchStats = async () => {
  if (!activeCase?.id) {
      return <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="w-24 h-24 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
          <Folder className="w-12 h-12 text-muted" />
        </div>
        <h2 className="text-3xl font-bold font-syne mb-4 bg-gradient-to-r from-muted to-text bg-clip-text text-transparent">
          Create a case to get started
        </h2>
        <p className="text-lg text-muted max-w-md mx-auto mb-8">
          Upload a disk image to begin automated digital forensics analysis. 
          Sleuthkit, bulk_extractor, VirusTotal, and AI-powered reporting ready.
        </p>
      </div>
    }

    try {
      const [artifactsRes, ttpsRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/cases/${activeCase.id}/artifacts`),
        axios.get(`http://localhost:8000/api/cases/${activeCase.id}/ttps`)
      ])
      
      const artifacts = artifactsRes.data.artifacts || []
      const criticalCount = artifacts.filter(a => a.severity === 'critical').length
      
      setStats({
        artifacts: artifacts.length,
        critical: criticalCount,
        ttps: ttpsRes.data.ttps?.length || 0,
        timeline: 0, // Would fetch from /timeline endpoint
        progress: activeCase.status?.includes('scanning:') ? 
          parseInt(activeCase.status.split(':')[1]) || 0 : 100
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
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
      {/* Sidebar */}


      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-12 bg-surface border-b border-border px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {activeCase && (
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm font-mono font-semibold">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                Case {activeCase.id}: {activeCase.name}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted">
              <div className="w-2 h-2 bg-accent rounded-full animate-ping"></div>
              Live
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricCard 
              type="artifacts" 
              value={stats.artifacts.toLocaleString()} 
              label="Total Artifacts"
            />
            <MetricCard 
              type="critical" 
              value={stats.critical} 
              label="Critical IOCs"
            />
            <MetricCard 
              type="ttps" 
              value={stats.ttps} 
              label="TTP Mappings"
            />
            <MetricCard 
              type="progress" 
              value={`${stats.progress}%`} 
              label="Disk Coverage"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <ArtifactTable caseId={activeCase?.id} />
              <ScanProgress caseId={activeCase?.id} />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <MitreHeatmap caseId={activeCase?.id} />
              <Timeline caseId={activeCase?.id} />
              <AINarrative caseId={activeCase?.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

