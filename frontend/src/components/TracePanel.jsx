// TracePanel: shows each agent step as a timeline with colored status dots.

const DOT = {
  planning: 'bg-yellow-400  shadow-[0_0_8px_rgba(250,204,21,0.6)]',
  running:  'bg-gray-400    shadow-[0_0_8px_rgba(156,163,175,0.4)] animate-pulse',
  done:     'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
  repaired: 'bg-amber-400   shadow-[0_0_8px_rgba(251,191,36,0.6)]',
  failed:   'bg-red-400     shadow-[0_0_8px_rgba(248,113,113,0.6)]',
}

const BADGE = {
  planning: 'bg-yellow-900/60  text-yellow-300  border border-yellow-500/30',
  running:  'bg-gray-800/80    text-gray-300    border border-gray-600/30',
  done:     'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30',
  repaired: 'bg-amber-900/60   text-amber-300   border border-amber-500/30',
  failed:   'bg-red-900/60     text-red-300     border border-red-500/30',
}

export default function TracePanel({ trace }) {
  if (!trace || trace.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-base font-semibold tracking-tight text-violet-400">
        Agent Trace
      </h2>

      <ol className="flex flex-col">
        {trace.map((entry, i) => {
          const isLast = i === trace.length - 1
          return (
            <li key={i} className="relative flex gap-4">
              {/* Timeline column */}
              <div className="flex flex-col items-center" style={{ width: '20px', minWidth: '20px' }}>
                {/* Colored status dot */}
                <div className={`mt-0.5 w-3 h-3 rounded-full shrink-0
                                 ${DOT[entry.status] ?? 'bg-gray-600'}`} />
                {/* Vertical connector to next item */}
                {!isLast && (
                  <div className="flex-1 w-px bg-gradient-to-b from-gray-600/60 to-gray-700/20
                                  mt-1 min-h-[1.5rem]" />
                )}
              </div>

              {/* Step content */}
              <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-200 leading-snug pt-0.5">
                    <span className="text-gray-500 mr-1.5 tabular-nums">{i + 1}.</span>
                    {entry.step}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5
                                    ${BADGE[entry.status] ?? 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                    {entry.status}
                  </span>
                </div>

                {entry.output && (
                  <pre className="mt-2 text-xs text-gray-400 bg-gray-950/80
                                  border border-gray-800/60 rounded-lg p-3
                                  overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {entry.output}
                  </pre>
                )}
                {entry.error && (
                  <pre className="mt-2 text-xs text-red-300 bg-red-950/30
                                  border border-red-500/20 rounded-lg p-3
                                  overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {entry.error}
                  </pre>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
