import { useState, useEffect, useRef } from 'react'
import { uploadGpx, getRunningRecords } from '../api/runningApi'

interface RunningRecord {
  id: number
  title: string
  runDate: string
  distanceKm: number
  durationSeconds: number | null
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분 ${s}초`
}

function formatPace(distanceKm: number, durationSeconds: number): string {
  const paceSeconds = durationSeconds / distanceKm
  const min = Math.floor(paceSeconds / 60)
  const sec = Math.round(paceSeconds % 60)
  return `${min}'${String(sec).padStart(2, '0')}"`
}

function Calendar({ records, onFocusDate, focusDate }: { records: RunningRecord[]; onFocusDate: (date: string) => void; focusDate?: string | null }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const recordDates = new Set(records.map((r) => r.runDate))
  const todayStr = toLocalDateStr(today)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors text-base leading-none"
        >
          ‹
        </button>
        <span className="text-xs font-semibold text-gray-600">{year}년 {month + 1}월</span>
        <button
          onClick={nextMonth}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors text-base leading-none"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-center gap-y-0.5">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="text-[10px] text-gray-400 pb-1 font-medium">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const hasRecord = recordDates.has(dateStr)
          const isFocused = dateStr === focusDate

          let cellClass = 'text-gray-300'
          if (isToday && isFocused) {
            cellClass = 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 ring-offset-1 cursor-pointer'
          } else if (isToday) {
            cellClass = 'bg-blue-500 text-white font-bold cursor-pointer'
          } else if (isFocused) {
            cellClass = 'bg-blue-100 text-blue-700 font-semibold ring-2 ring-blue-400 ring-offset-1 cursor-pointer'
          } else if (hasRecord) {
            cellClass = 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
          }

          return (
            <div
              key={dateStr}
              className="flex flex-col items-center"
              onClick={() => hasRecord && onFocusDate(dateStr)}
            >
              <span className={`text-[11px] w-6 h-6 flex items-center justify-center rounded-full transition-all ${cellClass}`}>
                {day}
              </span>
              {hasRecord
                ? <span className={`w-1 h-1 rounded-full mt-0.5 ${isFocused ? 'bg-blue-400' : 'bg-green-400'}`} />
                : <span className="w-1 h-1 mt-0.5" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  onFocusDate: (date: string) => void
  focusDate?: string | null
}

export default function UploadPage({ onFocusDate, focusDate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lastUploaded, setLastUploaded] = useState<RunningRecord | null>(null)
  const [records, setRecords] = useState<RunningRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  const loadRecords = async () => {
    setLoadingRecords(true)
    setRecordsError(null)
    try {
      const res = await getRunningRecords()
      setRecords(res.data ?? [])
    } catch (e) {
      setRecordsError(e instanceof Error ? e.message : '기록을 불러오지 못했습니다.')
    } finally {
      setLoadingRecords(false)
    }
  }

  useEffect(() => { loadRecords() }, [])

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setUploadError('GPX 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('파일 크기는 10MB 이하여야 합니다.')
      return
    }
    const titleFromFile = file.name.replace(/\.[^.]+$/, '')
    if (records.some((r) => r.title === titleFromFile)) {
      window.alert(`이미 같은 이름의 기록이 있습니다.\n(${titleFromFile})`)
      return
    }
    setUploading(true)
    setUploadError(null)
    setLastUploaded(null)
    try {
      const res = await uploadGpx(file)
      setLastUploaded(res.data)
      await loadRecords()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const todayStr = toLocalDateStr(new Date())
  const todayCompleted = records.some((r) => r.runDate === todayStr)

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm lg:h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">기록 업로드</h2>
          <p className="text-xs text-gray-400 mt-0.5">GPX 파일로 러닝 기록 추가</p>
        </div>
        <div className="flex items-center gap-2">
          {todayCompleted && (
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              ✓ 오늘 완료
            </span>
          )}
          {/* 업로드 아이콘 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
            }`}
          >
            {uploading ? (
              <>
                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                업로드 중
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                업로드
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {/* 에러 */}
      {uploadError && (
        <div className="flex-shrink-0 mx-4 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs">⚠ {uploadError}</p>
        </div>
      )}

      {/* 업로드 완료 요약 */}
      {lastUploaded && (
        <div className="flex-shrink-0 mx-4 mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700 text-xs font-semibold mb-2">✓ 업로드 완료 · {lastUploaded.runDate}</p>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-white rounded-lg p-1.5 border border-green-100">
              <p className="text-[10px] text-gray-400">거리</p>
              <p className="text-xs font-bold text-gray-800">{lastUploaded.distanceKm.toFixed(2)} km</p>
            </div>
            <div className="bg-white rounded-lg p-1.5 border border-green-100">
              <p className="text-[10px] text-gray-400">시간</p>
              <p className="text-xs font-bold text-gray-800">
                {lastUploaded.durationSeconds != null ? formatDuration(lastUploaded.durationSeconds) : '-'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-1.5 border border-green-100">
              <p className="text-[10px] text-gray-400">페이스</p>
              <p className="text-xs font-bold text-gray-800">
                {lastUploaded.durationSeconds != null && lastUploaded.distanceKm > 0
                  ? `${formatPace(lastUploaded.distanceKm, lastUploaded.durationSeconds)}/km`
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <Calendar records={records} onFocusDate={onFocusDate} focusDate={focusDate} />
      </div>

      {/* 기록 목록 - 스크롤 영역 */}
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">러닝 기록</h3>
          {records.length > 0 && (
            <span className="text-[10px] text-gray-400">{records.length}개</span>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loadingRecords ? (
            <p className="text-gray-400 text-xs">불러오는 중...</p>
          ) : recordsError ? (
            <p className="text-red-500 text-xs">{recordsError}</p>
          ) : records.length === 0 ? (
            <p className="text-gray-400 text-xs">아직 러닝 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-0.5">
              {records.map((r) => (
                <li
                  key={r.id}
                  className={`flex justify-between items-center py-2 px-2 cursor-pointer rounded-lg transition-colors ${
                    r.runDate === focusDate ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onFocusDate(r.runDate)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.runDate === focusDate ? 'bg-blue-400' : 'bg-green-400'}`} />
                    <span className="text-xs font-medium text-gray-600">{r.runDate}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {r.distanceKm.toFixed(2)} km
                    {r.durationSeconds != null && ` · ${formatDuration(r.durationSeconds)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
