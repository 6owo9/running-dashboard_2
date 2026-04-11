import { useEffect, useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Header from '../components/Header'
import { getRecords, uploadFile } from '../api/runningApi'
import type { RunningRecord } from '../api/runningApi'

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

function formatPace(p: number) {
  const min = Math.floor(p)
  const sec = Math.round((p - min) * 60)
  return `${min}'${String(sec).padStart(2, '0')}"`
}

// 달력 컴포넌트
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

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const toDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setView(new Date(year, month - 1))} className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold">
          {year}년 {month + 1}월
        </span>
        <button onClick={() => setView(new Date(year, month + 1))} className="p-1 hover:bg-gray-100 rounded-full">
          <ChevronRight size={16} />
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
          const dateStr = toDateStr(day)
          const hasRecord = recordDates.has(dateStr)
          const isSelected = selected === dateStr

          return (
            <button
              key={i}
              onClick={() => hasRecord && onSelect(dateStr)}
              className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-black text-white'
                  : hasRecord
                  ? 'hover:bg-gray-100 font-medium'
                  : 'text-gray-400 cursor-default'
              }`}
            >
              {day}
              {hasRecord && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function UploadPage() {
  const [records, setRecords] = useState<RunningRecord[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<RunningRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadRecords = () => {
    setListLoading(true)
    getRecords()
      .then(setRecords)
      .catch(() => {})
      .finally(() => setListLoading(false))
  }

  useEffect(() => { loadRecords() }, [])

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
      loadRecords()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const filteredRecords = selectedDate
    ? records.filter(r => r.date === selectedDate)
    : records

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="p-4 grid grid-cols-12 gap-4">
        {/* 좌: 달력 + 기록 목록 */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <Calendar records={records} selected={selectedDate} onSelect={setSelectedDate} />

          <div className="bg-card rounded-2xl p-5 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {selectedDate ? selectedDate : '전체 기록'}
              </p>
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="text-xs text-gray-400 hover:text-black">
                  전체 보기
                </button>
              )}
            </div>

            {listLoading ? (
              <p className="text-sm text-gray-400">불러오는 중...</p>
            ) : filteredRecords.length === 0 ? (
              <p className="text-sm text-gray-400">아직 러닝 기록이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {filteredRecords.map(r => (
                  <li key={r.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-black">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{r.distanceKm.toFixed(1)} km</p>
                      {r.paceMinPerKm && (
                        <p className="text-xs text-gray-400">{formatPace(r.paceMinPerKm)}/km</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 우: 업로드 */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
          {/* 드래그 앤 드롭 */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`bg-card rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors border-2 border-dashed ${
              dragging ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ minHeight: 220 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".gpx,.jpg,.png"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              disabled={uploading}
            />
            <Upload size={32} className={dragging ? 'text-primary' : 'text-gray-300'} />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                {uploading ? '업로드 중...' : '파일을 드래그하거나 클릭해서 선택'}
              </p>
              <p className="text-xs text-gray-400 mt-1">.gpx, .jpg, .png / 최대 10MB</p>
            </div>
          </div>

          {/* 결과 */}
          {error && (
            <div className="bg-card rounded-2xl p-5 shadow-sm flex items-start gap-3">
              <AlertCircle size={20} className="text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-card rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-primary" />
                <span className="text-sm font-semibold text-black">업로드 완료</span>
              </div>
              <p className="text-sm font-medium text-black mb-4">{result.title}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-black">{result.distanceKm.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">km</p>
                </div>
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-black">
                    {result.durationSeconds ? formatDuration(result.durationSeconds) : '-'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">시간</p>
                </div>
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-black">
                    {result.paceMinPerKm ? formatPace(result.paceMinPerKm) : '-'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">페이스</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
