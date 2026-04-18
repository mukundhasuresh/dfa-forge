import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import axios from 'axios'
import { Sidebar } from './components/Sidebar'
import { Overview } from './pages/Overview'
import { Artifacts } from './pages/Artifacts'
import { TimelinePage } from './pages/TimelinePage'
import { ReportPage } from './pages/ReportPage'

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
      <div style={{minHeight:'100vh', background:'#0a0c10', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:'64px', height:'64px', border:'4px solid #5a6480', borderTop:'4px solid #00d4aa', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px'}}></div>
          <p style={{color:'#5a6480'}}>Loading DFA/forge...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div style={{display:'flex', flexDirection:'column', height:'100vh', background:'#0a0c10', color:'#e8ecf4', fontFamily:'IBM Plex Mono, monospace'}}>
        {/* Topbar */}
        <div style={{height:'48px', background:'#111318', borderBottom:'1px solid #1e2330', display:'flex', alignItems:'center', padding:'0 24px', gap:'16px', flexShrink:0}}>
          <span style={{fontFamily:'Syne, sans-serif', fontSize:'18px', fontWeight:700, color:'#00d4aa'}}>DFA/forge</span>
          {activeCase && <span style={{background:'#181c24', border:'1px solid #1e2330', borderRadius:'6px', padding:'3px 12px', fontSize:'12px', color:'#5a6480'}}>{activeCase.name}</span>}
          <button onClick={() => createCase('New Case', '/demo')} style={{marginLeft:'auto', background:'#00d4aa', color:'#0a0c10', border:'none', borderRadius:'6px', padding:'6px 16px', fontWeight:600, cursor:'pointer', fontSize:'13px'}}>+ New Case</button>
          <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#1e2330', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color:'#e8ecf4'}}>A</div>
        </div>
        {/* Body */}
        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          <Sidebar cases={cases} activeCase={activeCase} setActiveCase={setActiveCase} startScan={startScan} />
          <main style={{flex:1, overflowY:'auto', padding:'24px', background:'#0a0c10'}}>
            <Routes>
              <Route path='/' element={<Overview activeCase={activeCase} />} />
              <Route path='/artifacts' element={<Artifacts activeCase={activeCase} />} />
              <Route path='/timeline' element={<TimelinePage activeCase={activeCase} />} />
              <Route path='/report' element={<ReportPage activeCase={activeCase} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App

