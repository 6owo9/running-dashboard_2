import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, Cctv, Clock, Gauge, Target, Timer, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { kakaoCallback } from '../api/authApi';
import type { Goal } from '../api/goalApi';
import { getGoal } from '../api/goalApi';
import type { RunningRecord } from '../api/runningApi';
import { deleteRecord, getRecords } from '../api/runningApi';
import type { StatsSummary } from '../api/statsApi';
import { getSummary } from '../api/statsApi';
import type { HourlyWeather } from '../api/weatherApi';
import { getHourlySlots } from '../api/weatherApi';
import { wmoIcon } from '../assets/weather/icons';
import AuthModal from '../components/AuthModal';
import GoalModal from '../components/GoalModal';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import ProgressBar from '../components/ProgressBar';
import StatCard from '../components/StatCard';
import UploadModal from '../components/UploadModal';
import { useAuth } from '../hooks/useAuth';

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtPace(p: number) {
  const min = Math.floor(p);
  const sec = Math.round((p - min) * 60);
  return `${min}'${String(sec).padStart(2, '0')}"`;
}

function fmtHour(hour: number): string {
  if (hour === 0) return '오전 12시';
  if (hour < 12) return `오전 ${hour}시`;
  if (hour === 12) return '오후 12시';
  return `오후 ${hour - 12}시`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function Calendar({
  records,
  onClickDate,
}: {
  records: RunningRecord[];
  onClickDate: (r: RunningRecord) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const dateMap = new Map<string, RunningRecord>();
  records.forEach((r) => dateMap.set(r.date, r));

  const todayStr = toLocalDateStr(today);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="px-5 py-4 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-base leading-none"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-foreground">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-base leading-none"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-center gap-y-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="text-[10px] text-muted-foreground pb-1 font-medium">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const record = dateMap.get(dateStr);
          const hasRecord = !!record;

          let cellClass = 'text-muted-foreground/40';
          if (isToday) {
            cellClass = 'bg-primary text-primary-foreground font-bold';
          } else if (hasRecord) {
            cellClass = 'text-foreground hover:bg-accent cursor-pointer';
          }

          return (
            <div
              key={dateStr}
              className="flex flex-col items-center"
              onClick={() => record && onClickDate(record)}
            >
              <span
                className={`text-[11px] w-6 h-6 flex items-center justify-center rounded-full transition-all ${cellClass}`}
              >
                {day}
              </span>
              {hasRecord ? (
                <span className="w-1 h-1 rounded-full mt-0.5 bg-primary" />
              ) : (
                <span className="w-1 h-1 mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RouteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

const TEMP_CCTV = [
  { id: 1, lat: 37.3962, lng: 127.1106, name: '삼평동 판교역 북측' },
  { id: 2, lat: 37.401, lng: 127.1073, name: '삼평동 테크노밸리 A구역' },
  { id: 3, lat: 37.3928, lng: 127.1142, name: '삼평동 판교IC 동측' },
  { id: 4, lat: 37.3988, lng: 127.1148, name: '삼평동 알파돔 인근' },
];

const ROUTE_COLORS = [
  '#155dfc',
  '#0ea5e9',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
];

export default function MainPage() {
  const { token, user, isLoggedIn, login, logout, updateUser } = useAuth();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitTab, setAuthInitTab] = useState<'login' | 'signup'>('login');
  const [profileOpen, setProfileOpen] = useState(false);

  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [allRecords, setAllRecords] = useState<RunningRecord[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [weather, setWeather] = useState<HourlyWeather[]>([]);
  const [cctvOn, setCctvOn] = useState(false);
  const [cctvModalOpen, setCctvModalOpen] = useState(false);
  const [selectedCctvId, setSelectedCctvId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const cctvLayerRef = useRef<L.LayerGroup | null>(null);

  // 카카오 OAuth 콜백 처리
  useEffect(() => {
    if (window.location.pathname !== '/auth/kakao/callback') return;
    const code = new URLSearchParams(window.location.search).get('code');
    // URL 즉시 정리 — StrictMode 이중 실행 시 두 번째는 경로가 '/'라 조기 종료됨
    window.history.replaceState({}, '', '/');
    if (!code) return;
    kakaoCallback(code)
      .then((res) => login(res.token, res.user))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 현재 위치 날씨 조회
  useEffect(() => {
    const load = (lat: number, lon: number) =>
      getHourlySlots(lat, lon)
        .then(setWeather)
        .catch(() => {});

    if (!navigator.geolocation) {
      load(37.3943, 127.1113);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => load(coords.latitude, coords.longitude),
      () => load(37.3943, 127.1113)
    );
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [37.5665, 126.978],
      zoom: 12,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    routeLayersRef.current = L.layerGroup().addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    cctvLayerRef.current = L.layerGroup();
    map.on('zoomend', () => setMapZoom(map.getZoom()));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      routeLayersRef.current = null;
      markerLayerRef.current = null;
      cctvLayerRef.current = null;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [sum, recs, g] = await Promise.all([
        getSummary(token),
        getRecords(token),
        getGoal(token),
      ]);
      setSummary(sum);
      setAllRecords(recs);
      setGoal(g);
    } catch {
      /* silent */
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 폴리라인 렌더링
  useEffect(() => {
    if (!routeLayersRef.current) return;
    routeLayersRef.current.clearLayers();

    const toRender = focusedId !== null ? allRecords.filter((r) => r.id === focusedId) : allRecords;
    const bounds: [number, number][] = [];

    toRender.forEach((r, idx) => {
      if (!r.coordinates?.length) return;
      const color = focusedId !== null ? '#155dfc' : ROUTE_COLORS[idx % ROUTE_COLORS.length];
      L.polyline(r.coordinates, {
        color,
        weight: 3,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeLayersRef.current!);
      bounds.push(...r.coordinates);
    });

    if (bounds.length && mapRef.current) {
      mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    }
  }, [allRecords, focusedId]);

  // 마커 렌더링 — 줌 레벨에 따라 크기 변환
  useEffect(() => {
    if (!markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();

    const toRender = focusedId !== null ? allRecords.filter((r) => r.id === focusedId) : allRecords;
    const s = mapZoom >= 17 ? 1.6 : mapZoom >= 15 ? 1.3 : mapZoom >= 13 ? 1.0 : 0.75;

    const makePin = (
      label: string,
      bg: string,
      border: string,
      textColor: string,
      dotColor: string
    ) => {
      const fs = Math.round(9 * s);
      const pv = Math.round(3 * s);
      const ph = Math.round(8 * s);
      const br = Math.round(6 * s);
      const stemH = Math.round(4 * s);
      const dotD = Math.round(8 * s);
      const badgeH = fs + pv * 2 + 3;
      const totalH = badgeH + stemH + dotD + 4;
      const w = Math.round(fs * 1.2 * 2 + ph * 2);
      return L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.14))">
          <div style="background:${bg};border:1.5px solid ${border};color:${textColor};font-size:${fs}px;font-weight:700;padding:${pv}px ${ph}px;border-radius:${br}px;white-space:nowrap;letter-spacing:0.04em;line-height:1.2">${label}</div>
          <div style="width:1.5px;height:${stemH}px;background:${dotColor}"></div>
          <div style="width:${dotD}px;height:${dotD}px;border-radius:50%;background:${dotColor};border:2px solid #fff"></div>
        </div>`,
        iconAnchor: [w / 2, totalH],
        iconSize: [w, totalH],
      });
    };

    toRender.forEach((r) => {
      if (!r.coordinates?.length) return;
      markerLayerRef.current!.addLayer(
        L.marker(r.coordinates[0], {
          icon: makePin('출발', '#f8fafc', '#e2e8f0', '#475569', '#94a3b8'),
          zIndexOffset: 1000,
        })
      );
      markerLayerRef.current!.addLayer(
        L.marker(r.coordinates[r.coordinates.length - 1], {
          icon: makePin('도착', '#eff6ff', '#bfdbfe', '#2563eb', '#60a5fa'),
          zIndexOffset: 1000,
        })
      );
    });
  }, [allRecords, focusedId, mapZoom]);

  // CCTV 레이어 토글 + active 마커
  useEffect(() => {
    const map = mapRef.current;
    const layer = cctvLayerRef.current;
    if (!map || !layer) return;

    if (cctvOn) {
      layer.clearLayers();
      TEMP_CCTV.forEach(({ id, lat, lng, name }) => {
        const isActive = id === selectedCctvId;
        const bg = isActive ? '#155dfc' : '#94a3b8';
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:${bg};border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97"/>
              <path d="M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z"/>
              <path d="M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15"/>
              <path d="M2 21v-4"/>
              <path d="M7 9h.01"/>
            </svg>
          </div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        L.marker([lat, lng], { icon })
          .bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -8] })
          .on('click', () => {
            setSelectedCctvId(id);
            if (window.innerWidth < 768) setCctvModalOpen(true);
          })
          .addTo(layer);
      });
      layer.addTo(map);
    } else {
      setSelectedCctvId(null);
      layer.remove();
    }
  }, [cctvOn, selectedCctvId]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onUpload={() => setUploadOpen(true)}
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginClick={() => {
          setAuthInitTab('login');
          setAuthOpen(true);
        }}
        onProfileClick={() => setProfileOpen(true)}
        onLogout={() => {
          logout();
          setGoal(null);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 상단: 목표 카드 + 통계 2x2 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 목표 카드 */}
          <section className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary">
                  <Target size={16} />
                </span>
                이번달 목표 달성률
              </h2>
              <button
                onClick={() =>
                  isLoggedIn ? setGoalOpen(true) : (setAuthInitTab('login'), setAuthOpen(true))
                }
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
              value={
                summary?.totalDurationSeconds ? fmtDuration(summary.totalDurationSeconds) : '-'
              }
              icon={Clock}
            />
          </div>
        </div>

        {/* 하단: 지도 + 기록 목록 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 지도 */}
          <section className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary">
                  <RouteIcon />
                </span>
                러닝 경로
              </h2>
              <button
                onClick={() => setFocusedId(null)}
                className={`text-xs px-3 py-1 border rounded-lg px-4 py-2 transition-colors ${
                  focusedId === null
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50  hover:text-foreground'
                }`}
              >
                전체
              </button>
            </div>

            <div className="relative h-[300px] sm:h-[600px] bg-muted">
              <div ref={containerRef} className="absolute inset-0 isolate" />

              {/* CCTV 토글 버튼 — Leaflet 줌 컨트롤 아래 (touch 30px 기준: 10+30+1+30+9gap=80px) */}
              <div className="absolute top-[80px] right-[10px] z-[400]">
                <button
                  onClick={() => setCctvOn((v) => !v)}
                  title={cctvOn ? 'CCTV OFF' : 'CCTV ON'}
                  className={`flex flex-col items-center justify-center gap-[2px] w-[34px] h-10 border-2 border-black/20  rounded-[4px] transition-colors select-none ${
                    cctvOn ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-[#f4f4f4]'
                  }`}
                >
                  <Cctv size={14} />
                  <span className="text-[8px] font-bold leading-none">{cctvOn ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* CCTV 활성 뱃지 */}
              {cctvOn && (
                <div className="absolute top-3 left-3 z-[400] pointer-events-none">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-blue-500 text-white px-2.5 py-1 rounded-full shadow-md">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    CCTV 레이어 활성
                  </span>
                </div>
              )}

              {/* 데스크탑 CCTV 패널 */}
              {cctvOn && selectedCctvId !== null && (
                <div className="absolute top-12 left-3 z-[400] hidden md:block bg-white rounded-lg shadow-lg border border-border w-52 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-foreground truncate">
                        {TEMP_CCTV.find((c) => c.id === selectedCctvId)?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedCctvId(null)}
                      className="ml-2 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="h-28 bg-black/5 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">영상 준비 중</span>
                  </div>
                </div>
              )}

              {allRecords.length === 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[50] pointer-events-none">
                  <span className="text-sm text-muted-foreground bg-card px-4 py-2 rounded-full shadow-sm border border-border whitespace-nowrap">
                    러닝 기록이 없습니다.
                  </span>
                </div>
              )}

              {weather.length === 5 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/30 backdrop-blur-[2px] border border-white/50 rounded-lg shadow-lg px-1 py-1">
                    {weather.map((slot, idx) => (
                      <div
                        key={slot.hour}
                        className={`flex-col items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
                          idx === 0 || idx === 4 ? 'hidden sm:flex' : 'flex'
                        } ${slot.isActive ? 'bg-[rgba(100,160,240,0.9)] shadow-sm' : ''}`}
                      >
                        <span
                          className={`text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${
                            slot.isActive ? 'text-white' : 'text-gray-500/90'
                          }`}
                        >
                          {fmtHour(slot.hour)}
                        </span>
                        <img
                          src={wmoIcon(slot.weatherCode)}
                          alt=""
                          className="w-5 h-5 sm:w-6 sm:h-6"
                        />
                        <span
                          className={`text-xs sm:text-sm font-bold ${slot.isActive ? 'text-white' : 'text-gray-600/70'}`}
                        >
                          {slot.temp}°
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 기록 목록 */}
          <section className="bg-card rounded-xl border border-border shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary">
                  <CalendarIcon />
                </span>
                러닝 기록
              </h2>
            </div>

            <Calendar records={allRecords} onClickDate={(r) => setFocusedId(r.id)} />

            <div className="overflow-y-auto p-4 space-y-2 max-h-[288px]">
              {allRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">기록이 없습니다.</p>
              ) : (
                allRecords.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setFocusedId(r.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                      focusedId === r.id
                        ? 'border-primary bg-accent shadow-sm'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(r.date)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full truncate max-w-24">
                          {r.title}
                        </span>
                        {isLoggedIn && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!window.confirm(`"${r.title}" 기록을 삭제할까요?`)) return;
                              await deleteRecord(r.id, token!);
                              if (focusedId === r.id) setFocusedId(null);
                              await refresh();
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
                          <p className="text-xs font-semibold text-foreground">
                            {r.distanceKm.toFixed(1)} km
                          </p>
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

      {/* 모바일 CCTV 모달 — 768px 이하에서만 표시, 내부는 추후 CCTV 영상 삽입 */}
      {cctvModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col md:hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <Cctv size={16} />
              <span className="text-sm font-semibold">
                {TEMP_CCTV.find((c) => c.id === selectedCctvId)?.name ?? 'CCTV'}
              </span>
            </div>
            <button
              onClick={() => {
                setCctvModalOpen(false);
                setSelectedCctvId(null);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          {/* 추후 CCTV 영상 삽입 */}
          <div className="flex-1" />
        </div>
      )}

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
        onSuccess={(t, u) => {
          login(t, u);
          setAuthOpen(false);
        }}
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
  );
}
