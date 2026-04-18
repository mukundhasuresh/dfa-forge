import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { Sidebar } from './components/Sidebar'
import { Overview } from './pages/Overview'
import { Artifacts } from './pages/Artifacts'
import { TimelinePage } from './pages/TimelinePage'
import { ReportPage } from './pages/ReportPage'
import { ScanProgress } from './components/ScanProgress'

// API base URL
const API_BASE = 'http://localhost:8000/api'

function App() {
  const [cases, setCases] = useState([])
  const [activeCase, setActiveCase] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cases`)
      setCases(response.data.cases)
      if (response.data.cases.length > 0) {
        setActiveCase(response.data.cases[0])
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCase = async (name, imagePath) => {
    try {
      const response = await axios.post(`${API_BASE}/cases`, { name, image_path: imagePath })
      setActiveCase(response.data)
      fetchCases()
      return response.data.id
    } catch (error) {
      console.error('Error creating case:', error)
    }
  }

  const startScan = async (caseId) => {
    try {
      await axios.post(`${API_BASE}/cases/${caseId}/scan`)
      fetchCases()
    } catch (error) {
      console.error('Error starting scan:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-muted border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading DFA/forge...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
<div style={{background:'#0a0c10', minHeight:'100vh', color:'#e8ecf4'}} className="flex flex-col">
        {/* Topbar */}
        <div className="h-12 bg-surface border-b border-border flex items-center px-6 gap-4">
          <div className="font-syne text-xl font-bold bg-gradient-to-r from-accent to-blue bg-clip-text text-transparent">
            DFA/forge
          </div>
          
          {activeCase && (
            <>
              <div className="flex items-center gap-2 bg-surface-2 px-3 py-1 rounded-lg border border-border">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse-dot"></span>
                <span className="font-medium truncate max-w-[200px]">{activeCase.name}</span>
                <span className="text-xs bg-muted px-2 py-1 rounded-full font-mono">
                  {activeCase.status}
                </span>
              </div>
            </>
          )}
          
          <div className="ml-auto flex items-center gap-2">
            <button 
              onClick={() => createCase('New Case', '/path/to/image.dd')}
              className="px-4 py-1.5 bg-accent text-background rounded-lg font-medium hover:bg-opacity-90 transition-all text-sm"
            >
              + New Case
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-muted to-text rounded-full flex items-center justify-center cursor-pointer">
              <span className="text-xs font-medium">A</span>
            </div>
          </div>
        </div>

        <div style={{display:'flex', height:'calc(100vh - 48px)', overflow:'hidden'}}>
          {/* Sidebar */}
          <Sidebar 
            cases={cases} 
            activeCase={activeCase}
            setActiveCase={setActiveCase}
            startScan={startScan}
          />

          {/* Main content */}
          <main style={{flex:1, overflowY:'auto', padding:'24px', background:'#0a0c10'}}>
            <Routes>
<Route path="/" element={<Overview activeCase={activeCase} setActiveCase={setActiveCase} cases={cases} setCases={setCases} />} />
              <Route path="/artifacts" element={<Artifacts activeCase={activeCase} />} />
              <Route path="/timeline" element={<TimelinePage activeCase={activeCase} />} />
              <Route path="/report" element={<ReportPage activeCase={activeCase} />} />
            </Routes>
          </main>
        </div>

        {/* Global scan progress */}
        {activeCase && activeCase.status?.startsWith('scanning') && (
          <ScanProgress caseId={activeCase.id} />
        )}
      </div>
    </Router>
  )
}

export default App

