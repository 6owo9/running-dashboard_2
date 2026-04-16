import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Activity, Target, Timer, Clock, Gauge, Trash2 } from 'lucide-react'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import UploadModal from '../components/UploadModal'
import GoalModal from '../components/GoalModal'
import AuthModal from '../components/AuthModal'
import ProfileModal from '../components/ProfileModal'
import { getRecords, deleteRecord } from '../api/runningApi'
import type { RunningRecord } from '../api/runningApi'
import { getGoal } from '../api/goalApi'
import type { Goal } from '../api/goalApi'
import { getSummary } from '../api/statsApi'
import type { StatsSummary } from '../api/statsApi'
import { useAuth } from '../hooks/useAuth'

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtPace(p: number) {
  const min = Math.floor(p)
  const sec = Math.round((p - min) * 60)
  return `${min}'${String(sec).padStart(2, '0')}"`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function Calendar({ records, onClickDate }: { records: RunningRecord[]; onClickDate: (r: RunningRecord) => void }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const dateMap = new Map<string, RunningRecord>()
  records.forEach(r => dateMap.set(r.date, r))

  const todayStr = toLocalDateStr(today)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="px-5 py-4 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-base leading-none"
        >‹</button>
        <span className="text-sm font-semibold text-foreground">{year}년 {month + 1}월</span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-base leading-none"
        >›</button>
      </div>
      <div className="grid grid-cols-7 text-center gap-y-1">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <div key={d} className="text-[10px] text-muted-foreground pb-1 font-medium">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const record = dateMap.get(dateStr)
          const hasRecord = !!record

          let cellClass = 'text-muted-foreground/40'
          if (isToday) {
            cellClass = 'bg-primary text-primary-foreground font-bold'
          } else if (hasRecord) {
            cellClass = 'text-foreground hover:bg-accent cursor-pointer'
          }

          return (
            <div
              key={dateStr}
              className="flex flex-col items-center"
              onClick={() => record && onClickDate(record)}
            >
              <span className={`text-[11px] w-6 h-6 flex items-center justify-center rounded-full transition-all ${cellClass}`}>
                {day}
              </span>
              {hasRecord
                ? <span className="w-1 h-1 rounded-full mt-0.5 bg-primary" />
                : <span className="w-1 h-1 mt-0.5" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RouteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  )
}

export default function MainPage() {
  const { token, user, isLoggedIn, login, logout, updateUser } = useAuth()

  const [uploadOpen, setUploadOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authInitTab, setAuthInitTab] = useState<'login' | 'signup'>('login')
  const [profileOpen, setProfileOpen] = useState(false)

  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [allRecords, setAllRecords] = useState<RunningRecord[]>([])
  const [goal, setGoal] = useState<Goal | null>(null)
  const [focusedId, setFocusedId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLayersRef = useRef<L.LayerGroup | null>(null)
  const focusLayerRef = useRef<L.LayerGroup | null>(null)

  // 지도 초기화
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [37.5665, 126.978],
      zoom: 12,
      zoomControl: false,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    routeLayersRef.current = L.layerGroup().addTo(map)
    focusLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      routeLayersRef.current = null
      focusLayerRef.current = null
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [sum, recs, g] = await Promise.all([getSummary(token), getRecords(token), getGoal(token)])
      setSummary(sum)
      setAllRecords(recs)
      setGoal(g)
    } catch { /* silent */ }
  }, [token])

  useEffect(() => { refresh() }, [refresh])

  // 경로 렌더링
  useEffect(() => {
    if (!routeLayersRef.current) return
    routeLayersRef.current.clearLayers()
    const allBounds: [number, number][] = []

    allRecords.forEach(r => {
      if (!r.coordinates?.length) return
      L.polyline(r.coordinates, {
        color: '#155dfc',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeLayersRef.current!)
      L.circleMarker(r.coordinates[0], {
        radius: 7,
        fillColor: '#155dfc',
        color: '#1040c7',
        weight: 2,
        fillOpacity: 1,
      }).addTo(routeLayersRef.current!)
      allBounds.push(...r.coordinates)
    })

    if (allBounds.length && mapRef.current) {
      mapRef.current.fitBounds(L.latLngBounds(allBounds), { padding: [50, 50] })
    }
  }, [allRecords])

  const zoomToRecord = (r: RunningRecord) => {
    if (!r.coordinates?.length || !mapRef.current || !focusLayerRef.current) return
    focusLayerRef.current.clearLayers()
    L.polyline(r.coordinates, {
      color: '#155dfc',
      weight: 5,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(focusLayerRef.current)
    mapRef.current.fitBounds(L.latLngBounds(r.coordinates), { padding: [50, 50] })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onUpload={() => setUploadOpen(true)}
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginClick={() => { setAuthInitTab('login'); setAuthOpen(true) }}
        onSignupClick={() => { setAuthInitTab('signup'); setAuthOpen(true) }}
        onProfileClick={() => setProfileOpen(true)}
        onLogout={() => { logout(); setGoal(null) }}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* 상단: 목표 카드 + 통계 2x2 */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* 목표 카드 */}
          <section className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary"><Target size={16} /></span>
                목표 달성률
              </h2>
              <button
                onClick={() => isLoggedIn ? setGoalOpen(true) : (setAuthInitTab('login'), setAuthOpen(true))}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors"
              >
                {goal ? '수정' : '설정'}
              </button>
            </div>
            {goal ? (
              <ProgressBar
                value={goal.progressRate}
                label={`${goal.achievedDistanceKm.toFixed(1)} km 달성`}
                achieved={`${goal.achievedDistanceKm.toFixed(1)} km`}
                target={`${goal.targetDistanceKm} km`}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                목표를 설정하면 달성률을 확인할 수 있어요.
              </p>
            )}
          </section>

          {/* 통계 카드 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="총 거리"
              value={summary ? summary.totalDistanceKm.toFixed(1) : '-'}
              unit="km"
              icon={Activity}
            />
            <StatCard
              label="러닝 횟수"
              value={summary ? summary.totalCount : '-'}
              unit="회"
              icon={Gauge}
            />
            <StatCard
              label="평균 페이스"
              value={summary?.averagePaceMinPerKm ? fmtPace(summary.averagePaceMinPerKm) : '-'}
              unit="/km"
              icon={Timer}
            />
            <StatCard
              label="총 시간"
              value={summary?.totalDurationSeconds ? fmtDuration(summary.totalDurationSeconds) : '-'}
              icon={Clock}
            />
          </div>
        </div>

        {/* 하단: 지도 + 기록 목록 */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* 지도 */}
          <section className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary"><RouteIcon /></span>
                러닝 경로
              </h2>
            </div>

            <div className="relative h-[300px] sm:h-[600px] bg-muted">
              <div ref={containerRef} className="absolute inset-0 isolate" />

              {allRecords.length === 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[50] pointer-events-none">
                  <span className="text-sm text-muted-foreground bg-card px-4 py-2 rounded-full shadow-sm border border-border whitespace-nowrap">
                    러닝 기록이 없습니다.
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* 기록 목록 */}
          <section className="bg-card rounded-xl border border-border shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary"><CalendarIcon /></span>
                러닝 기록
              </h2>
            </div>

            <Calendar records={allRecords} onClickDate={(r) => { zoomToRecord(r); setFocusedId(r.id) }} />

            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[640px]">
              {allRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">기록이 없습니다.</p>
              ) : (
                allRecords.map(r => (
                  <div
                    key={r.id}
                    onClick={() => { zoomToRecord(r); setFocusedId(r.id) }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                      focusedId === r.id
                        ? 'border-primary bg-accent shadow-sm'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{formatDate(r.date)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full truncate max-w-24">
                          {r.title}
                        </span>
                        {isLoggedIn && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!window.confirm(`"${r.title}" 기록을 삭제할까요?`)) return
                              await deleteRecord(r.id, token!)
                              if (focusedId === r.id) setFocusedId(null)
                              await refresh()
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-muted text-primary">
                          <Activity size={11} />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">거리</p>
                          <p className="text-xs font-semibold text-foreground">{r.distanceKm.toFixed(1)} km</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-muted text-primary">
                          <Clock size={11} />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">시간</p>
                          <p className="text-xs font-semibold text-foreground">
                            {r.durationSeconds ? fmtDuration(r.durationSeconds) : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded bg-muted text-primary flex items-center justify-center">
                          <span className="text-[10px] font-bold">P</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">페이스</p>
                          <p className="text-xs font-semibold text-foreground">
                            {r.paceMinPerKm ? fmtPace(r.paceMinPerKm) : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={refresh}
        records={allRecords}
        token={token!}
      />
      {isLoggedIn && (
        <GoalModal
          isOpen={goalOpen}
          onClose={() => setGoalOpen(false)}
          goal={goal}
          onSaved={refresh}
          token={token!}
        />
      )}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(t, u) => { login(t, u); setAuthOpen(false) }}
        initialTab={authInitTab}
      />
      {isLoggedIn && user && (
        <ProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          token={token!}
          user={user}
          onUpdated={updateUser}
        />
      )}
    </div>
  )
}
