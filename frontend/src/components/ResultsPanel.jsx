// ResultsPanel: shows the plain-English answer and renders any generated charts.

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function ResultsPanel({ answer, chartPaths }) {
  const [bust, setBust] = useState(() => Date.now())

  useEffect(() => {
    setBust(Date.now())
  }, [chartPaths])

  if (!answer && chartPaths.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-base font-semibold tracking-tight text-violet-400">
        Results
      </h2>

      {answer && (
        /* Left accent bar + subtle inner glow */
        <div className="relative rounded-xl border border-violet-500/20 bg-gray-900/80 overflow-hidden
                        shadow-[inset_0_0_24px_rgba(167,139,250,0.04)]">
          <div className="absolute inset-y-0 left-0 w-0.5
                          bg-gradient-to-b from-violet-400 to-purple-500" />
          <div className="pl-5 pr-4 py-4 text-sm text-gray-200 leading-relaxed
                          prose prose-invert prose-sm max-w-none
                          prose-headings:text-violet-300 prose-strong:text-gray-100
                          prose-code:text-violet-300 prose-code:bg-violet-950/60
                          prose-code:px-1 prose-code:rounded prose-code:text-xs">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </div>
      )}

      {chartPaths.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartPaths.map((path) => {
            const filename = path.split('/').pop() || 'chart.png'
            return (
              <div key={path}
                   className="group rounded-xl border border-violet-500/15 overflow-hidden bg-gray-900/60
                              shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                              transition-transform duration-200
                              hover:scale-[1.015] hover:shadow-[0_12px_40px_rgba(167,139,250,0.15)]">
                <div className="relative">
                  <img
                    src={`${path}?t=${bust}`}
                    alt="Generated chart"
                    className="w-full object-contain"
                    onError={(e) => { e.target.parentElement.style.display = 'none' }}
                  />
                  {/* Download button — fades in on hover */}
                  <a
                    href={`${path}?t=${bust}`}
                    download={filename}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 flex items-center gap-1.5
                               px-3 py-1.5 rounded-lg text-xs font-medium
                               bg-gray-900/80 border border-gray-700/60 text-gray-300
                               hover:bg-violet-600 hover:border-violet-500 hover:text-white
                               opacity-0 group-hover:opacity-100
                               transition-all duration-150 backdrop-blur-sm
                               shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                         className="w-3.5 h-3.5">
                      <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
                      <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
                    </svg>
                    Download
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
