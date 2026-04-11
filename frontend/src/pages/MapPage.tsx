import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import ProgressBar from '../components/ProgressBar'
import { getRecords } from '../api/runningApi'
import type { RunningRecord } from '../api/runningApi'
import { getGoal } from '../api/goalApi'
import type { Goal } from '../api/goalApi'
import { getSummary } from '../api/statsApi'
import type { StatsSummary } from '../api/statsApi'

type Period = 'today' | 'week'

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatPace(p: number) {
  const min = Math.floor(p)
  const sec = Math.round((p - min) * 60)
  return `${min}'${String(sec).padStart(2, '0')}"`
}

export default function MapPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [records, setRecords] = useState<RunningRecord[]>([])
  const [allRecords, setAllRecords] = useState<RunningRecord[]>([])
  const [summary, setSummary] = useState<StatsSummary | null>(null)
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

  // 초기 데이터 로드
  useEffect(() => {
    Promise.all([getSummary(), getRecords(), getGoal()])
      .then(([sum, all, g]) => {
        setSummary(sum)
        setAllRecords(all)
        setGoal(g)
      })
      .catch(e => setError(e.message))
  }, [])

  // 기간별 기록 로드
  useEffect(() => {
    setMapLoading(true)
    setError(null)
    getRecords(period)
      .then(setRecords)
      .catch(e => setError(e.message))
      .finally(() => setMapLoading(false))
  }, [period])

  // 지도 경로 렌더링
  useEffect(() => {
    if (!routeLayersRef.current) return
    routeLayersRef.current.clearLayers()

    const allBounds: [number, number][] = []

    records.forEach(r => {
      if (!r.coordinates?.length) return
      const latlngs = r.coordinates

      L.polyline(latlngs, { color: '#3b82f6', weight: 4, smoothFactor: 1 })
        .addTo(routeLayersRef.current!)
      L.circleMarker(latlngs[0], {
        radius: 6, fillColor: '#3b82f6', color: '#fff', weight: 2, fillOpacity: 1,
      }).addTo(routeLayersRef.current!)

      allBounds.push(...latlngs)
    })

    if (allBounds.length && mapRef.current) {
      mapRef.current.fitBounds(L.latLngBounds(allBounds))
    }
  }, [records])

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="p-4 grid grid-cols-12 gap-4">
        {/* 좌: 통계 */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3 content-start">
          <StatCard label="총 거리" value={summary ? summary.totalDistanceKm.toFixed(1) : '-'} unit="km" />
          <StatCard
            label="평균 페이스"
            value={summary?.averagePaceMinPerKm ? formatPace(summary.averagePaceMinPerKm) : '-'}
            unit="/km"
          />
          <StatCard
            label="총 시간"
            value={summary?.totalDurationSeconds ? formatDuration(summary.totalDurationSeconds) : '-'}
          />
          <StatCard label="러닝 횟수" value={summary ? summary.totalCount : '-'} unit="회" />
        </div>

        {/* 중앙: 지도 */}
        <div className="col-span-12 lg:col-span-5 bg-card rounded-2xl shadow-sm overflow-hidden">
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

          <div className="relative" style={{ height: 420 }}>
            {mapLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <span className="text-sm text-gray-400">불러오는 중...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}
            {!mapLoading && !error && records.length === 0 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <span className="text-sm text-gray-400">이 기간의 러닝 기록이 없습니다.</span>
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
          </div>
        </div>

        {/* 우: 목표 + 최근 기록 */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
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
              <p className="text-sm text-gray-400">목표가 설정되지 않았습니다.</p>
            )}
          </div>

          <div className="bg-card rounded-2xl p-5 shadow-sm flex-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">최근 기록</p>
            {allRecords.length === 0 ? (
              <p className="text-sm text-gray-400">기록이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {allRecords.slice(0, 3).map(r => (
                  <li key={r.id} className="flex justify-between items-center">
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
    </div>
  )
}
