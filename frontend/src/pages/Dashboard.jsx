// Dashboard: root page that wires all four panels together.
// Manages shared state: sessionId, loading, analysis results.
// Layout: landing (centered upload) → analysis (left/right two-column).

import { useState } from 'react'
import axios from 'axios'
import UploadPanel from '../components/UploadPanel'
import ChatPanel from '../components/ChatPanel'
import ResultsPanel from '../components/ResultsPanel'
import TracePanel from '../components/TracePanel'

export default function Dashboard() {
  const [sessionId, setSessionId]           = useState(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [answer, setAnswer]                 = useState('')
  const [trace, setTrace]                   = useState([])
  const [chartPaths, setChartPaths]         = useState([])
  const [placeholder, setPlaceholder]       = useState(null)
  const [suggestions, setSuggestions]       = useState(null)
  const [suggestLoading, setSuggestLoading] = useState(false)

  async function fetchSuggestions(id) {
    setSuggestLoading(true)
    try {
      const { data } = await axios.post('/suggest', { session_id: id })
      setPlaceholder(data.placeholder)
      setSuggestions(data.suggestions)
    } catch {
      setPlaceholder('e.g. What are the trends in this dataset?')
      setSuggestions([])
    } finally {
      setSuggestLoading(false)
    }
  }

  function handleUpload(id) {
    setSessionId(id)
    setAnswer('')
    setTrace([])
    setChartPaths([])
    setError('')
    setPlaceholder(null)
    setSuggestions(null)
    fetchSuggestions(id)  // non-blocking
  }

  async function handleAsk(question) {
    setLoading(true)
    setError('')
    setAnswer('')
    setTrace([])
    setChartPaths([])
    try {
      const { data } = await axios.post('/analyze', { session_id: sessionId, question })
      setAnswer(data.answer)
      setTrace(data.trace)
      setChartPaths(data.chart_paths)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={[
      'text-gray-100 flex flex-col',
      sessionId ? 'md:h-screen md:overflow-hidden' : 'min-h-screen',
    ].join(' ')}>

      {/* ── Header ── */}
      <header className="shrink-0 sticky top-0 z-20 border-b border-violet-500/10
                         bg-gray-950/80 backdrop-blur-md
                         shadow-[0_1px_0_rgba(167,139,250,0.08)]">
        <div className="px-6 py-4 flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight
                           bg-gradient-to-r from-violet-300 to-purple-300
                           bg-clip-text text-transparent
                           drop-shadow-[0_0_28px_rgba(196,181,253,0.45)]">
            DataPilot
          </span>
          <span className="hidden sm:block text-gray-500 text-sm font-medium">
            Autonomous Data Analyst 
          </span>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400
                             shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            Live
          </div>
        </div>
      </header>

      {/* ── Landing state: centered upload hero ── */}
      {!sessionId && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl flex flex-col gap-8">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold tracking-tight
                             bg-gradient-to-br from-violet-200 via-purple-300 to-violet-400
                             bg-clip-text text-transparent
                             drop-shadow-[0_0_40px_rgba(167,139,250,0.3)]">
                Ask your data anything.
              </h1>
              <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                Upload a CSV or Excel file and get instant analysis,
                visualizations or answers.
              </p>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-gray-900/60
                            backdrop-blur-sm p-6
                            shadow-[0_0_0_1px_rgba(167,139,250,0.06),0_4px_24px_rgba(0,0,0,0.4)]">
              <UploadPanel collapsed={false} onUpload={handleUpload} />
            </div>
          </div>
        </main>
      )}

      {/* ── Analysis state: two-column workspace ── */}
      {sessionId && (
        <div className="flex-1 flex flex-col md:flex-row md:min-h-0 md:overflow-hidden">

          {/* Left column — controls (sticky on desktop) */}
          <aside className="
            w-full md:w-2/5 md:shrink-0
            md:overflow-y-auto
            flex flex-col
            border-b border-gray-800 md:border-b-0 md:border-r md:border-gray-800
            bg-gray-950/40
          ">
            {/* Collapsed upload bar */}
            <div className="p-5 border-b border-gray-800/50">
              <UploadPanel collapsed={true} onUpload={handleUpload} />
            </div>

            {/* Chat input */}
            <div className="p-5 border-b border-gray-800/50">
              <ChatPanel
                sessionId={sessionId}
                onAsk={handleAsk}
                loading={loading}
                placeholder={placeholder}
                suggestions={suggestions}
                suggestLoading={suggestLoading}
              />
              {error && (
                <p className="mt-3 text-red-400 text-sm flex items-center gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            {/* Agent trace */}
            {trace.length > 0 && (
              <div className="p-5">
                <TracePanel trace={trace} />
              </div>
            )}
          </aside>

          {/* Right column — results (scrollable) */}
          <section className="flex-1 md:overflow-y-auto p-6 flex flex-col gap-6">

            {/* Loading skeleton */}
            {loading && (
              <div className="rounded-2xl border border-violet-500/20 bg-gray-900/60
                              backdrop-blur-sm p-6 space-y-3
                              shadow-[0_0_0_1px_rgba(167,139,250,0.06),0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="h-3.5 shimmer rounded-full w-1/4" />
                <div className="h-3   shimmer rounded-full w-full" />
                <div className="h-3   shimmer rounded-full w-5/6" />
                <div className="h-3   shimmer rounded-full w-3/4" />
              </div>
            )}

            {/* Results */}
            {!loading && (answer || chartPaths.length > 0) && (
              <div className="rounded-2xl border border-violet-500/20 bg-gray-900/60
                              backdrop-blur-sm p-6
                              shadow-[0_0_0_1px_rgba(167,139,250,0.06),0_4px_24px_rgba(0,0,0,0.4)]">
                <ResultsPanel answer={answer} chartPaths={chartPaths} />
              </div>
            )}

            {/* Empty state */}
            {!loading && !answer && chartPaths.length === 0 && !error && (
              <div className="flex-1 flex flex-col items-center justify-center
                              min-h-[40vh] text-center select-none">
                <div className="w-12 h-12 rounded-full border border-violet-500/20
                                bg-violet-500/5 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                       strokeLinejoin="round" className="w-5 h-5 text-violet-400/50">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Ask a question to see your analysis here</p>
                <p className="text-gray-600 text-xs mt-1">Charts and insights will appear in this panel</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
