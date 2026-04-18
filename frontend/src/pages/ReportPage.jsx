import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { AINarrative } from '../components/AINarrative'
import axios from 'axios'
import { ArrowLeft, Download, Printer, Share2, FileText } from 'lucide-react'

export function ReportPage({ activeCase, setActiveCase, cases, setCases }) {
  const { caseId } = useParams()
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (caseId) {
      fetchReport()
    }
  }, [caseId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/report`)
      setReportData(response.data)
    } catch (error) {
      console.error('Error fetching report:', error)
      setReportData({ error: 'Report generation failed. Ensure scan is complete.' })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const response = await axios.get(`http://localhost:8000/api/cases/${caseId}/report`)
      const htmlContent = response.data.html
      
      // Create downloadable HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dfa_forge_case_${caseId}_report.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGenerating(false)
    }
  }

  const printReport = () => {
    window.print()
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

  if (loading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <FileText className="w-16 h-16 text-muted" />
          </div>
          <h2 className="text-3xl font-bold font-syne mb-4 bg-gradient-to-r from-accent to-blue bg-clip-text text-transparent">
            Report Center
          </h2>
          <p className="text-muted text-lg mb-8">Generating forensic report...</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-muted">
              <div className="w-6 h-6 bg-accent/20 rounded-full animate-ping"></div>
              Rendering AI narrative
            </div>
            <div className="flex items-center gap-3 text-sm text-muted opacity-75">
              <div className="w-5 h-5 bg-blue/20 rounded-full animate-ping delay-500"></div>
              Compiling timeline & artifacts
            </div>
            <div className="flex items-center gap-3 text-sm text-muted opacity-50">
              <div className="w-4 h-4 bg-purple/20 rounded-full animate-ping delay-1000"></div>
              Finalizing layout
            </div>
          </div>
        </div>
      </div>
    )
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
        <div className="h-12 bg-surface border-b border-border px-6 flex items-center justify-between shadow-sm z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-surface-2 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-muted" />
            </button>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-accent to-purple bg-clip-text text-transparent text-xl font-syne font-bold">
              Forensic Report • Case #{caseId}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={printReport}
              className="p-3 hover:bg-surface-2 rounded-2xl border border-border/50 hover:border-accent transition-all flex items-center gap-2 text-muted hover:text-text"
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={generateReport}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-accent to-blue hover:from-accent/90 hover:to-blue/90 text-background px-6 py-3 rounded-2xl font-mono font-semibold shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download HTML Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="flex-1 overflow-auto p-8 max-w-6xl mx-auto">
          {reportData?.error ? (
            <div className="bg-danger/10 border border-danger/30 rounded-2xl p-12 text-center">
              <AlertCircle className="w-20 h-20 text-danger mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-danger mb-4">Report Not Ready</h3>
              <p className="text-lg text-muted mb-8 max-w-lg mx-auto">{reportData.error}</p>
              <div className="inline-flex items-center gap-3 bg-accent/20 text-accent px-6 py-3 rounded-xl font-mono font-semibold hover:bg-accent/30 transition-all">
                <Zap className="w-4 h-4" />
                Run a full scan first
              </div>
            </div>
          ) : (
            <div className="report-preview space-y-12 print:max-w-4xl print:p-0">
              {/* Header */}
              <div className="text-center border-b border-border/50 pb-12 mb-12">
                <h1 className="font-syne text-5xl font-bold bg-gradient-to-r from-accent via-purple to-blue bg-clip-text text-transparent mb-6">
                  Digital Forensics Report
                </h1>
                <div className="bg-surface-2 rounded-xl inline-block px-8 py-4 border border-border/50">
                  <div className="text-2xl font-mono font-bold text-accent mb-2">
                    Case #{caseId}
                  </div>
                  <div className="text-lg font-mono text-muted">
                    Generated {new Date().toLocaleDateString()} • DFA/forge v1.0
                  </div>
                </div>
              </div>

              {/* AI Narrative */}
              {reportData?.narrative && (
                <AINarrative caseId={caseId} />
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-surface-2 border border-border/50 rounded-2xl p-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-2">{reportData?.stats?.artifacts || 0}</div>
                  <div className="text-sm text-muted font-mono uppercase tracking-wider">Artifacts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-danger mb-2">{reportData?.stats?.critical || 0}</div>
                  <div className="text-sm text-muted font-mono uppercase tracking-wider">Critical IOCs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple mb-2">{reportData?.stats?.ttps || 0}</div>
                  <div className="text-sm text-muted font-mono uppercase tracking-wider">TTPs Mapped</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue mb-2">{reportData?.stats?.progress || 0}%</div>
                  <div className="text-sm text-muted font-mono uppercase tracking-wider">Coverage</div>
                </div>
              </div>

              {/* Preview Note */}
              <div className="bg-blue/10 border border-blue/20 rounded-2xl p-8 text-center">
                <Share2 className="w-12 h-12 text-blue mx-auto mb-6 opacity-75" />
                <h4 className="font-syne text-xl font-bold text-blue mb-4">Live Preview</h4>
                <p className="text-muted mb-6 max-w-2xl mx-auto">
                  This is a live preview of your forensic report. Download the full HTML report above 
                  for a self-contained, print-ready version with all artifacts, timeline events, and 
                  complete MITRE ATT&CK coverage.
                </p>
                <div className="inline-flex items-center gap-2 bg-blue/20 text-blue px-6 py-3 rounded-xl font-mono font-semibold hover:bg-blue/30 transition-all">
                  Fully self-contained • No dependencies • Print ready
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

