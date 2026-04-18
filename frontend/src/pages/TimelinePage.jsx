import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Timeline } from '../components/Timeline'
import axios from 'axios'
import { ArrowLeft, Clock, ZoomIn, Filter } from 'lucide-react'

export function TimelinePage({ activeCase, setActiveCase, cases, setCases }) {
  const { caseId } = useParams()
  const [timelineData, setTimelineData] = useState([])
  const [caseData, setCaseData] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'timeline', 'compact'
  const [timeFilter, setTimeFilter] = useState('all') // 'all', '1h', '24h', '7d'
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    types: {},
    timeRange: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (caseId) {
      fetchTimeline()
      fetchCase()
    }
  }, [caseId])

  const fetchTimeline = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/timeline`)
      const events = response.data.timeline || []
      
      // Calculate stats
      const types = events.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      }, {})
      
      setTimelineData(events)
      setStats({
        total: events.length,
        types,
        timeRange: events.length > 0 ? 
          `${new Date(events[0].timestamp).toLocaleDateString()} - ${new Date(events[events.length-1].timestamp).toLocaleDateString()}` 
          : 'No data'
      })
    } catch (error) {
      console.error('Error fetching timeline:', error)
      setTimelineData([])
      setStats({ total: 0, types: {}, timeRange: 'Error loading data' })
    } finally {
      setLoading(false)
    }
  }

  const fetchCase = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}`)
      setCaseData(response.data)
    } catch (error) {
      console.error('Error fetching case:', error)
    }
  }

  const filteredTimeline = timelineData.filter(event => {
    if (searchTerm && !(
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
    )) {
      return false
    }
    return true
  })

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

  if (loading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pulse">
              <Clock className="w-12 h-12 text-muted" />
            </div>
            <h2 className="text-2xl font-bold font-syne mb-2">Loading Timeline...</h2>
            <p className="text-muted">Fetching filesystem events</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">


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
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted font-mono">
              {stats.total} events • {stats.timeRange}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 bg-surface-2 border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search events (path, type, description)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface border border-border/50 rounded-xl px-4 py-3 placeholder-muted focus:border-accent focus:ring-1 focus:ring-accent/50 w-80"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                  viewMode === 'list' 
                    ? 'bg-accent text-background shadow-lg' 
                    : 'hover:bg-surface border border-border/50'
                }`}
                onClick={() => setViewMode('list')}
              >
                List View
              </button>
              <button 
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-accent text-background shadow-lg' 
                    : 'hover:bg-surface border border-border/50'
                }`}
                onClick={() => setViewMode('timeline')}
              >
                Timeline View
              </button>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <div className="text-xs text-muted font-mono">
                Filter: 
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="ml-2 bg-transparent border-none text-accent font-semibold focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="1h">Last 1 Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
              
              <button className="p-2 hover:bg-surface rounded-xl border border-border/50 transition-all">
                <ZoomIn className="w-4 h-4 text-muted" />
              </button>
              <button 
                onClick={fetchTimeline}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-background px-5 py-2 rounded-xl font-mono text-sm font-semibold transition-all shadow-lg"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-surface-2 border border-border/50 rounded-2xl p-6">
              <div className="font-mono text-3xl font-bold text-accent">{stats.total}</div>
              <div className="text-muted text-sm font-mono uppercase tracking-wider mt-1">Total Events</div>
            </div>
            
            <div className="bg-surface-2 border border-border/50 rounded-2xl p-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">Event Types</h4>
              <div className="space-y-1">
                {Object.entries(stats.types).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="font-mono capitalize">{type}</span>
                    <span className="font-mono font-semibold text-accent">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-surface-2 border border-border/50 rounded-2xl p-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-muted mb-2">Time Range</h4>
              <div className="font-mono text-sm">{stats.timeRange}</div>
            </div>
          </div>

          {/* Main Timeline */}
          <div className="bg-surface-2 border border-border/50 rounded-2xl overflow-hidden shadow-xl">
            {viewMode === 'timeline' ? (
              <Timeline caseId={caseId} limit={100} />
            ) : (
              <div className="p-8">
                <Timeline caseId={caseId} limit={filteredTimeline.length} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

