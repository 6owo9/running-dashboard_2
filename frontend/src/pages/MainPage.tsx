import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import UploadModal from '../components/UploadModal'
import GoalModal from '../components/GoalModal'
import { getRecords } from '../api/runningApi'
import type { RunningRecord } from '../api/runningApi'
import { getGoal } from '../api/goalApi'
import type { Goal } from '../api/goalApi'
import { getSummary } from '../api/statsApi'
import type { StatsSummary } from '../api/statsApi'

type Period = 'today' | 'week'

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

export default function MainPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [period, setPeriod] = useState<Period>('week')

  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [allRecords, setAllRecords] = useState<RunningRecord[]>([])
  const [periodRecords, setPeriodRecords] = useState<RunningRecord[]>([])
  const [goal, setGoal] = useState<Goal | null>(null)
  const [mapLoading, setMapLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLayersRef = useRef<L.LayerGroup | null>(null)

  // 지도 초기화
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: [37.5665, 126.978], zoom: 12 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    routeLayersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      routeLayersRef.current = null
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [sum, recs, g] = await Promise.all([getSummary(), getRecords(), getGoal()])
      setSummary(sum)
      setAllRecords(recs)
      setGoal(g)
    } catch { /* silent */ }
  }, [])

  // 초기 로드
  useEffect(() => { refresh() }, [refresh])

  // 기간별 기록
  useEffect(() => {
    setMapLoading(true)
    setError(null)
    getRecords(period)
      .then(setPeriodRecords)
      .catch(e => setError(e.message))
      .finally(() => setMapLoading(false))
  }, [period])

  // 경로 렌더링
  useEffect(() => {
    if (!routeLayersRef.current) return
    routeLayersRef.current.clearLayers()
    const allBounds: [number, number][] = []

    periodRecords.forEach(r => {
      if (!r.coordinates?.length) return
      L.polyline(r.coordinates, { color: '#3b82f6', weight: 4, smoothFactor: 1 })
        .addTo(routeLayersRef.current!)
      L.circleMarker(r.coordinates[0], {
        radius: 6, fillColor: '#3b82f6', color: '#fff', weight: 2, fillOpacity: 1,
      }).addTo(routeLayersRef.current!)
      allBounds.push(...r.coordinates)
    })

    if (allBounds.length && mapRef.current) {
      mapRef.current.fitBounds(L.latLngBounds(allBounds))
    }
  }, [periodRecords])

  return (
    <div className="min-h-screen bg-bg">
      <Header onUpload={() => setUploadOpen(true)} onGoal={() => setGoalOpen(true)} />

      <main className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-12">

          {/* 통계 — 모바일: 2x2, 데스크톱: col-span-4 */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:content-start">
            <StatCard
              label="총 거리"
              value={summary ? summary.totalDistanceKm.toFixed(1) : '-'}
              unit="km"
            />
            <StatCard
              label="평균 페이스"
              value={summary?.averagePaceMinPerKm ? fmtPace(summary.averagePaceMinPerKm) : '-'}
              unit="/km"
            />
            <StatCard
              label="총 시간"
              value={summary?.totalDurationSeconds ? fmtDuration(summary.totalDurationSeconds) : '-'}
            />
            <StatCard label="러닝 횟수" value={summary ? summary.totalCount : '-'} unit="회" />
          </div>

          {/* 지도 — col-span-5 */}
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden lg:col-span-5">
            <div className="flex gap-2 p-3 border-b border-gray-100">
              {(['today', 'week'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    period === p ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {p === 'today' ? '오늘' : '일주일'}
                </button>
              ))}
            </div>

            <div className="relative h-64 sm:h-80 lg:h-[420px]">
              {/* isolate: Leaflet 내부 z-index를 이 컨테이너 안으로 스코프 격리 */}
              <div ref={containerRef} className="absolute inset-0 isolate" />

              {/* overlay는 isolate 컨테이너 바깥 → z-[50]으로 확실하게 위에 */}
              {mapLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[50] pointer-events-none">
                  <span className="text-sm text-gray-400">불러오는 중...</span>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[50] pointer-events-none">
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}
              {!mapLoading && !error && periodRecords.length === 0 && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[50] pointer-events-none">
                  <span className="text-sm text-gray-400">이 기간의 러닝 기록이 없습니다.</span>
                </div>
              )}
            </div>
          </div>

          {/* 목표 + 최근 기록 — col-span-3 */}
          <div className="flex flex-col gap-3 lg:col-span-3">
            <div className="bg-card rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">목표 달성률</p>
              {goal ? (
                <ProgressBar
                  value={goal.progressRate}
                  label={`${goal.progressRate.toFixed(1)}%`}
                  achieved={`${goal.achievedDistanceKm.toFixed(1)} km`}
                  target={`${goal.targetDistanceKm} km`}
                />
              ) : (
                <p className="text-sm text-gray-400">
                  목표가 없습니다.{' '}
                  <button onClick={() => setGoalOpen(true)} className="text-black underline">설정하기</button>
                </p>
              )}
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">최근 기록</p>
              {allRecords.length === 0 ? (
                <p className="text-sm text-gray-400">기록이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {allRecords.slice(0, 3).map(r => (
                    <li
                      key={r.id}
                      className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-xl px-2 py-1 -mx-2 transition-colors"
                      onClick={() => {
                        if (r.coordinates?.length && mapRef.current) {
                          mapRef.current.fitBounds(L.latLngBounds(r.coordinates))
                        }
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium text-black truncate max-w-28">{r.title}</p>
                        <p className="text-xs text-gray-400">{r.date}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{r.distanceKm.toFixed(1)} km</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </main>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={refresh}
        records={allRecords}
      />
      <GoalModal
        isOpen={goalOpen}
        onClose={() => setGoalOpen(false)}
        goal={goal}
        onSaved={refresh}
      />
    </div>
  )
}
