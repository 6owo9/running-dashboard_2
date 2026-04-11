import { useEffect, useRef, useState } from 'react'
import { X, Upload, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { uploadFile } from '../api/runningApi'
import type { RunningRecord } from '../api/runningApi'

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}
function fmtPace(p: number) {
  const min = Math.floor(p)
  const sec = Math.round((p - min) * 60)
  return `${min}'${String(sec).padStart(2, '0')}"`
}

function Calendar({
  records,
  selected,
  onSelect,
}: {
  records: RunningRecord[]
  selected: string | null
  onSelect: (date: string) => void
}) {
  const [view, setView] = useState(new Date())
  const year = view.getFullYear()
  const month = view.getMonth()
  const recordDates = new Set(records.map(r => r.date))
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const toStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setView(new Date(year, month - 1))} className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold">{year}년 {month + 1}월</span>
        <button onClick={() => setView(new Date(year, month + 1))} className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <span key={d} className="text-xs text-gray-400">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = toStr(day)
          const has = recordDates.has(dateStr)
          const sel = selected === dateStr
          return (
            <button
              key={i}
              onClick={() => has && onSelect(dateStr)}
              className={`relative flex flex-col items-center justify-center h-8 rounded-lg text-sm transition-colors ${
                sel ? 'bg-black text-white' : has ? 'hover:bg-gray-100 font-medium' : 'text-gray-300 cursor-default'
              }`}
            >
              {day}
              {has && <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${sel ? 'bg-white' : 'bg-primary'}`} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onUploaded: () => void
  records: RunningRecord[]
}

export default function UploadModal({ isOpen, onClose, onUploaded, records }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<RunningRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleFile = async (file: File) => {
    if (uploading) return
    const title = file.name.replace(/\.[^.]+$/, '')
    if (records.some(r => r.title === title)) {
      window.alert(`이미 존재하는 기록입니다: ${title}`)
      return
    }
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      const uploaded = await uploadFile(file)
      setResult(uploaded)
      onUploaded()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const filtered = selectedDate ? records.filter(r => r.date === selectedDate) : records

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-card w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-card z-10">
          <h2 className="font-semibold">기록 업로드</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* 업로드 영역 */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 cursor-pointer rounded-2xl border-2 border-dashed py-10 transition-colors ${
              dragging ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".gpx,.jpg,.png"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              disabled={uploading}
            />
            <Upload size={28} className={dragging ? 'text-primary' : 'text-gray-300'} />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                {uploading ? '업로드 중...' : '드래그하거나 클릭해서 선택'}
              </p>
              <p className="text-xs text-gray-400 mt-1">.gpx · .jpg · .png · 최대 10MB</p>
            </div>
          </div>

          {/* 결과 */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
              <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{error}</p>
            </div>
          )}
          {result && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-primary" />
                <span className="text-sm font-semibold">{result.title}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: result.distanceKm.toFixed(2), unit: 'km' },
                  { val: result.durationSeconds ? fmtDuration(result.durationSeconds) : '-', unit: '시간' },
                  { val: result.paceMinPerKm ? fmtPace(result.paceMinPerKm) : '-', unit: '페이스' },
                ].map(({ val, unit }) => (
                  <div key={unit} className="bg-bg rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-black">{val}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{unit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 달력 + 기록 목록 */}
          <div className="border-t border-gray-100 pt-4">
            <Calendar records={records} selected={selectedDate} onSelect={setSelectedDate} />
          </div>

          {/* 기록 목록 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {selectedDate ?? '전체 기록'}
              </p>
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="text-xs text-gray-400 hover:text-black">
                  전체 보기
                </button>
              )}
            </div>
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400">기록이 없습니다.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100">
                {filtered.map(r => (
                  <li
                    key={r.id}
                    className="flex justify-between items-center py-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 -mx-2 transition-colors"
                    onClick={() => setSelectedDate(r.date)}
                  >
                    <div>
                      <p className="text-sm font-medium text-black">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{r.distanceKm.toFixed(1)} km</p>
                      {r.paceMinPerKm && <p className="text-xs text-gray-400">{fmtPace(r.paceMinPerKm)}/km</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
