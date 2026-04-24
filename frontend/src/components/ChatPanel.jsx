// ChatPanel: text input for the user's analysis question + suggested question chips.
// Disabled until a CSV has been uploaded (sessionId is set).

import { useState, useRef } from 'react'

const STATIC_PLACEHOLDER = 'e.g. What are the trends in this dataset?'

export default function ChatPanel({
  sessionId,
  onAsk,
  loading,
  placeholder,
  suggestions,     // null = not fetched yet, [] = fetched but empty/failed, [...] = ready
  suggestLoading,
}) {
  const [inputValue, setInputValue]   = useState('')
  const [chipsVisible, setChipsVisible] = useState(true)
  const inputRef = useRef(null)

  function submitQuestion(q) {
    const trimmed = q.trim()
    if (!trimmed) return
    setChipsVisible(false)
    setInputValue('')
    onAsk(trimmed)
  }

  function handleSubmit(e) {
    e.preventDefault()
    submitQuestion(inputValue)
  }

  function handleChipClick(q) {
    submitQuestion(q)
  }

  function handleInputChange(e) {
    setInputValue(e.target.value)
    // Hide chips once the user starts typing manually
    if (e.target.value.length > 0) setChipsVisible(false)
    if (e.target.value.length === 0) setChipsVisible(true)
  }

  const active = !!sessionId && !loading

  // Decide which placeholder string to show
  const inputPlaceholder =
    loading    ? 'Analyzing…'
    : sessionId ? (placeholder ?? STATIC_PLACEHOLDER)
    : 'Upload a CSV first…'

  // Show the chip area when: a session is active, not analyzing, and chips haven't
  // been dismissed by a click or manual typing.
  const showChipArea = !!sessionId && !loading && chipsVisible

  // Reset chip visibility whenever a new session starts or loading finishes
  // (handled by key prop on the chip row keyed to sessionId)

  return (
    <div className="flex flex-col gap-4">
      {/* Unified pill bar: input + button as one component */}
      <form onSubmit={handleSubmit}>
        <div className={[
          'flex items-center rounded-full border transition-all duration-200 bg-gray-800/70',
          active
            ? 'border-violet-500/40 focus-within:border-violet-400/80 focus-within:shadow-[0_0_0_3px_rgba(167,139,250,0.12)]'
            : 'border-gray-700/60 opacity-60',
        ].join(' ')}>

          {/* Leading search icon */}
          <span className="pl-4 pr-2 text-gray-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                 className="w-4 h-4">
              <path fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                    clipRule="evenodd" />
            </svg>
          </span>

          <input
            ref={inputRef}
            name="question"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            disabled={!active}
            placeholder={inputPlaceholder}
            className="flex-1 bg-transparent py-3 text-sm placeholder-gray-500
                       focus:outline-none disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!active}
            className="m-1 px-5 py-2 rounded-full text-sm font-semibold shrink-0
                       bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150 shadow-md shadow-violet-900/40"
          >
            {loading
              ? <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2
                                   border-violet-300/30 border-t-white animate-spin" />
                  Analyzing
                </span>
              : 'Analyze'
            }
          </button>
        </div>
      </form>

      {/* ── Suggestion chips ── */}
      {showChipArea && (
        <div key={sessionId} className="flex flex-wrap gap-2">
          {/* Skeleton pills while the /suggest call is in flight */}
          {suggestLoading && Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-7 rounded-full bg-gray-800 border border-gray-700/60 shimmer"
              style={{ width: `${[130, 160, 145, 120][i]}px` }}
            />
          ))}

          {/* Real chips once loaded */}
          {!suggestLoading && suggestions && suggestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleChipClick(q)}
              className="px-3 py-1 rounded-full text-xs font-medium
                         bg-gray-800 border border-gray-700
                         text-indigo-400 hover:bg-gray-700 hover:border-gray-600
                         transition-colors duration-150 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
