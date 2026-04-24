// UploadPanel: drag-and-drop CSV uploader.
// collapsed=false → full drop zone (landing state)
// collapsed=true  → compact single-line bar with filename + stats + Replace button

import { useState, useRef } from 'react'
import axios from 'axios'

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         className="w-10 h-10">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="w-8 h-8">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SmallCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"
         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
         className="w-3.5 h-3.5">
      <polyline points="13.5 3.5 6 12 2.5 8.5" />
    </svg>
  )
}

export default function UploadPanel({ onUpload, collapsed = false }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [preview, setPreview]   = useState(null)
  const inputRef = useRef()

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }
    setError('')
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await axios.post('/upload', form)
      setPreview({ rows: data.preview, schema: data.schema_info, name: file.name })
      onUpload(data.session_id)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const columns = preview?.rows?.[0] ? Object.keys(preview.rows[0]) : []

  // ── Collapsed bar (analysis state) ──────────────────────────────────────
  if (collapsed) {
    return (
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl
                        border border-emerald-500/20 bg-emerald-500/5">
          {/* Status icon */}
          <span className={loading ? 'shrink-0' : 'text-emerald-400 shrink-0'}>
            {loading
              ? <span className="block w-3.5 h-3.5 rounded-full border-2
                                 border-violet-500/30 border-t-violet-400 animate-spin" />
              : <SmallCheckIcon />
            }
          </span>

          {/* Filename */}
          <span className="flex-1 min-w-0 text-sm font-medium text-gray-200 truncate">
            {preview?.name ?? 'Dataset loaded'}
          </span>

          {/* Stats */}
          {preview && !loading && (
            <span className="text-xs text-gray-500 shrink-0 hidden sm:block">
              {preview.schema.row_count} rows · {preview.schema.column_count} cols
            </span>
          )}

          {/* Replace button */}
          {!loading && (
            <button
              onClick={() => inputRef.current.click()}
              className="text-xs text-violet-400 hover:text-violet-300
                         shrink-0 flex items-center gap-1 transition-colors duration-150"
            >
              Replace
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none"
                   stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                   strokeLinejoin="round" className="w-3 h-3">
                <path d="M2 10 L10 2 M5.5 2 H10 V6.5" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-xs flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  }

  // ── Full drop zone (landing state) ──────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-base font-semibold tracking-tight text-violet-400">
        Upload Dataset
      </h2>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        className={[
          'relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer',
          'transition-all duration-200 group select-none',
          dragging
            ? 'border-violet-400 bg-violet-500/10 shadow-[0_0_24px_rgba(167,139,250,0.2)]'
            : preview
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-violet-500/30 hover:border-violet-400/70 hover:bg-violet-500/5 hover:shadow-[0_0_20px_rgba(167,139,250,0.12)]',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-violet-400">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
            <p className="text-sm font-medium">Uploading…</p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-2 text-emerald-400">
            <CheckIcon />
            <p className="text-sm font-semibold">{preview.name}</p>
            <p className="text-xs text-gray-500">
              {preview.schema.row_count} rows · {preview.schema.column_count} columns
            </p>
            <p className="text-xs text-violet-400/60 mt-1">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500
                          group-hover:text-violet-400 transition-colors duration-200">
            <UploadIcon />
            <div>
              <p className="text-sm font-medium">Drop a CSV file here</p>
              <p className="text-xs mt-0.5">
                or{' '}
                <span className="text-violet-400 underline underline-offset-2">browse files</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400 shrink-0" />
          {error}
        </p>
      )}

      {/* Preview table */}
      {preview && (
        <div className="overflow-x-auto rounded-xl border border-violet-500/15 bg-gray-900/80">
          <table className="w-full text-sm text-left">
            <thead className="bg-violet-950/60 text-violet-300 border-b border-violet-500/15">
              <tr>
                {columns.map((col) => (
                  <th key={col}
                      className="px-3 py-2.5 font-medium truncate max-w-[160px]
                                 text-xs tracking-wide uppercase">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-800/60 hover:bg-violet-500/5 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-gray-300 truncate max-w-[160px] text-xs">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 px-3 py-2.5 border-t border-gray-800/60">
            Showing first 5 rows · {preview.schema.row_count} total rows · {preview.schema.column_count} columns
          </p>
        </div>
      )}
    </div>
  )
}
