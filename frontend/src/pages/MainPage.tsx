import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Hls from 'hls.js';
import { Activity, Cctv, Clock, Gauge, Target, Timer, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { kakaoCallback } from '../api/authApi';
import type { CctvItem } from '../api/cctvApi';
import {
  getCctvHlsUrl,
  getCctvImageUrl,
  getCctvList,
  getCctvStreamProxyUrl,
  getCctvStreamUrl,
} from '../api/cctvApi';
import type { Goal } from '../api/goalApi';
import { getGoal } from '../api/goalApi';
import type { RunningRecord } from '../api/runningApi';
import { deleteRecord, getRecords } from '../api/runningApi';
import type { StatsSummary } from '../api/statsApi';
import { getSummary } from '../api/statsApi';
import type { CurrentWeather } from '../api/weatherApi';
import { getCityName, getCurrentWeather } from '../api/weatherApi';
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

const BUNDANG_CENTER: [number, number] = [37.3943, 127.1113];
const CCTV_EXPAND_EVENT = 'running-dashboard:cctv-expand';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });
}

function hasCctvCoord(item: CctvItem) {
  return Number.isFinite(item.coordx) && Number.isFinite(item.coordy);
}

function nearestCctvItems(
  items: CctvItem[],
  center: L.LatLng,
  limit = 40,
  filter: (item: CctvItem) => boolean = hasCctvCoord
) {
  return items
    .filter(filter)
    .sort((a, b) => {
      const da = (a.coordx - center.lng) ** 2 + (a.coordy - center.lat) ** 2;
      const db = (b.coordx - center.lng) ** 2 + (b.coordy - center.lat) ** 2;
      return da - db;
    })
    .slice(0, limit);
}

type HlsVideoElement = HTMLVideoElement & { __hls?: Hls };

function attachHlsVideo(video: HTMLVideoElement, src: string) {
  const target = video as HlsVideoElement;
  target.__hls?.destroy();
  target.__hls = undefined;
  video.dataset.hlsAttached = '1';

  if (Hls.isSupported()) {
    const hls = new Hls({
      liveDurationInfinity: true,
      liveSyncDurationCount: 3,
      lowLatencyMode: false,
    });
    hls.on(Hls.Events.ERROR, (_, data) => {
      video.dataset.hlsError = `${data.type}:${data.details}`;
    });
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      video.dataset.hlsMediaAttached = '1';
      if (!video.dataset.hlsSourceLoaded) {
        video.dataset.hlsSourceLoaded = '1';
        hls.loadSource(src);
      }
    });
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.dataset.hlsManifest = '1';
    });
    hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
      if (video.dataset.hlsStarted) return;
      const fragments = data.details.fragments;
      const startFragment = fragments[Math.max(0, fragments.length - 3)];
      const startPosition = startFragment?.start ?? 0;

      video.dataset.hlsStarted = '1';
      video.dataset.hlsStart = String(startPosition);
      hls.startLoad(startPosition);
      void video.play().catch(() => {});
    });
    hls.on(Hls.Events.FRAG_LOADING, (_, data) => {
      video.dataset.hlsFragment = data.frag.url.split('/').pop() ?? data.frag.url;
    });
    hls.on(Hls.Events.FRAG_LOADED, () => {
      video.dataset.hlsFragmentLoaded = '1';
    });
    hls.attachMedia(video);
    if (!video.dataset.hlsSourceLoaded) {
      video.dataset.hlsSourceLoaded = '1';
      hls.loadSource(src);
    }
    target.__hls = hls;
    video.dataset.hlsMode = 'hlsjs';
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src;
    video.dataset.hlsMode = 'native';
  } else {
    video.src = src;
    video.dataset.hlsMode = 'direct';
  }

  void video.play().catch(() => {});
}

function detachHlsVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  const target = video as HlsVideoElement;
  target.__hls?.destroy();
  target.__hls = undefined;
  video.removeAttribute('src');
  video.load();
}

function CctvVideo({ src, className }: { src: string; className: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    attachHlsVideo(video, getCctvHlsUrl(src));
    return () => detachHlsVideo(video);
  }, [src]);

  return <video ref={videoRef} className={className} autoPlay muted playsInline controls />;
}

function CctvVideoEE({ cctvIp, className }: { cctvIp: string; className: string }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchUrl = useCallback(() => {
    setStatus('loading');
    setStreamUrl(null);
    getCctvStreamUrl(cctvIp)
      .then((url) => {
        if (url) {
          setStreamUrl(getCctvStreamProxyUrl(url));
          setStatus('done');
        } else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [cctvIp]);

  useEffect(() => {
    fetchUrl();
  }, [fetchUrl]);

  if (status === 'loading') return <div className="text-white/50 text-sm">영상 로딩 중...</div>;
  if (status === 'error' || !streamUrl)
    return <div className="text-white/50 text-sm">영상 없음</div>;
  return (
    <video
      ref={videoRef}
      src={streamUrl}
      className={className}
      autoPlay
      muted
      playsInline
      controls
      onEnded={fetchUrl}
    />
  );
}

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
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [cctvOn, setCctvOn] = useState(false);
  const [cctvModalOpen, setCctvModalOpen] = useState(false);
  const [selectedCctvId, setSelectedCctvId] = useState<string | null>(null);
  const [cctvData, setCctvData] = useState<CctvItem[]>([]);

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
      .catch((err) => alert(`카카오 로그인 실패: ${err.message}`));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 현재 위치 날씨 조회
  useEffect(() => {
    const load = async (lat: number, lon: number) => {
      const cityName = await getCityName(lat, lon);
      getCurrentWeather(lat, lon, cityName)
        .then(setWeather)
        .catch(() => {});
    };

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
      center: BUNDANG_CENTER,
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

  const loadCctvData = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const center = map.getCenter();
    const data = await getCctvList(
      bounds.getWest(),
      bounds.getEast(),
      bounds.getSouth(),
      bounds.getNorth()
    );
    setCctvData(nearestCctvItems(data, center, 80, hasCctvCoord));
  }, []);

  // CCTV ON/OFF 시 API 호출 or 레이어 제거
  useEffect(() => {
    const map = mapRef.current;
    const layer = cctvLayerRef.current;
    if (!map || !layer) return;

    if (!cctvOn) {
      setSelectedCctvId(null);
      setCctvModalOpen(false);
      setCctvData([]);
      layer.remove();
      return;
    }

    loadCctvData().catch(() => setCctvData([]));
  }, [cctvOn, loadCctvData]);

  // CCTV ON 상태에서 지도 이동 후 debounce 재조회
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cctvOn) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onMoveEnd = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        loadCctvData().catch(() => setCctvData([]));
      }, 500);
    };

    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      if (timer) clearTimeout(timer);
    };
  }, [cctvOn, loadCctvData]);

  // CCTV ON 상태에서 3분마다 자동 갱신 (영상 재생 중에는 건너뜀)
  const selectedCctvIdRef = useRef(selectedCctvId);
  const cctvModalOpenRef = useRef(cctvModalOpen);
  useEffect(() => {
    selectedCctvIdRef.current = selectedCctvId;
  }, [selectedCctvId]);
  useEffect(() => {
    cctvModalOpenRef.current = cctvModalOpen;
  }, [cctvModalOpen]);

  useEffect(() => {
    if (!cctvOn) return;
    const id = setInterval(
      () => {
        if (selectedCctvIdRef.current || cctvModalOpenRef.current) return;
        loadCctvData().catch(() => setCctvData([]));
      },
      3 * 60 * 1000
    );
    return () => clearInterval(id);
  }, [cctvOn, loadCctvData]);

  useEffect(() => {
    if (!cctvOn) return;
    setSelectedCctvId(null);
    setCctvModalOpen(false);
  }, [cctvOn, focusedId]);

  useEffect(() => {
    if (cctvModalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [cctvModalOpen]);

  const openCctvModal = useCallback((cctvname: string) => {
    setSelectedCctvId(cctvname);
    setCctvModalOpen(true);
  }, []);

  useEffect(() => {
    const handleExpand = (event: Event) => {
      const encodedName = (event as CustomEvent<string>).detail;
      if (!encodedName) return;
      openCctvModal(decodeURIComponent(encodedName));
    };

    window.addEventListener(CCTV_EXPAND_EVENT, handleExpand);
    return () => window.removeEventListener(CCTV_EXPAND_EVENT, handleExpand);
  }, [openCctvModal]);

  // CCTV 마커 렌더링
  useEffect(() => {
    const map = mapRef.current;
    const layer = cctvLayerRef.current;
    if (!map || !layer || !cctvOn) return;

    layer.clearLayers();
    cctvData.forEach(({ cctvname, cctvurl, cctvimageurl, coordx, coordy }) => {
      const safeName = escapeHtml(cctvname);
      const hlsUrl = getCctvHlsUrl(cctvurl);
      const safeHlsUrl = escapeHtml(hlsUrl);
      const cctvIp = cctvimageurl?.startsWith('utic-ee://')
        ? cctvimageurl.slice('utic-ee://'.length)
        : null;
      const safeBaseUrl = !cctvIp && cctvimageurl ? escapeHtml(getCctvImageUrl(cctvimageurl)) : '';
      const encodedName = encodeURIComponent(cctvname);
      const isActive = cctvname === selectedCctvId;
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
      const hasVideo = !!safeHlsUrl;
      const popupHtml = `<div style="min-width:192px">
        <div style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid #e5e7eb">
          <span style="width:8px;height:8px;border-radius:50%;background:${hasVideo ? '#3b82f6' : '#9ca3af'};display:inline-block;flex-shrink:0"></span>
          <span style="font-size:11px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">${safeName}</span>
        </div>
        ${
          hasVideo
            ? `<video data-hls-src="${safeHlsUrl}" autoplay muted playsinline controls
            style="width:192px;height:108px;object-fit:cover;display:block;background:#111827">
          </video>`
            : ''
        }
        ${
          safeBaseUrl
            ? `<img src="${safeBaseUrl}&t=${Date.now()}" alt="${safeName}" data-base-src="${safeBaseUrl}"
          onload="if(this.previousElementSibling.style.display==='none'){this.style.display='block'};this.nextElementSibling.style.display='none';if(!this.dataset.timer){this.dataset.timer='1';setInterval(()=>{this.src=this.dataset.baseSrc+'&t='+Date.now()},1000)}"
          onerror="if(!this.dataset.timer){this.dataset.timer='1';setInterval(()=>{this.src=this.dataset.baseSrc+'&t='+Date.now()},1000)};this.style.display='none';this.nextElementSibling.style.display='flex'"
          style="width:192px;height:108px;object-fit:cover;display:none;background:#111827">`
            : ''
        }
        ${
          cctvIp
            ? `<div data-utic-ee-ip="${escapeHtml(cctvIp)}" style="height:108px;background:#f9fafb;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px">
              <span style="font-size:12px;color:#6b7280">영상 로딩 중...</span>
            </div>`
            : `<div style="height:108px;background:#f9fafb;display:${hasVideo || safeBaseUrl ? 'none' : 'flex'};align-items:center;justify-content:center;flex-direction:column;gap:4px">
              <span style="font-size:12px;color:#9ca3af">영상 없음</span>
              <span style="font-size:10px;color:#d1d5db">도시도로 CCTV</span>
            </div>`
        }
        <button type="button" data-cctv-name="${encodedName}"
          onclick="window.dispatchEvent(new CustomEvent('${CCTV_EXPAND_EVENT}',{detail:this.dataset.cctvName}))"
          style="width:100%;height:30px;border:0;border-top:1px solid #e5e7eb;background:#fff;color:#155dfc;font-size:12px;font-weight:700;cursor:pointer">
          확대보기
        </button>
      </div>`;
      const m = L.marker([coordy, coordx], { icon, zIndexOffset: 3000 })
        .bindPopup(popupHtml, { closeButton: false, className: 'cctv-popup', offset: [0, -11] })
        .bindTooltip(cctvname, { permanent: false, direction: 'top', offset: [0, -8] })
        .on('popupopen', (event) => {
          window.setTimeout(async () => {
            const popupEl = event.popup.getElement();

            const video = popupEl?.querySelector('video[data-hls-src]');
            const fallback = popupEl?.querySelector('img[data-base-src]');
            const hlsSrc = video?.getAttribute('data-hls-src');
            if (video instanceof HTMLVideoElement && hlsSrc) {
              attachHlsVideo(video, hlsSrc);
              window.setTimeout(() => {
                if (video.readyState === 0 && !video.dataset.hlsManifest) {
                  video.style.display = 'none';
                  if (fallback instanceof HTMLImageElement) {
                    fallback.style.display = 'block';
                  } else {
                    const noVideoEl = video.nextElementSibling as HTMLElement | null;
                    if (noVideoEl) noVideoEl.style.display = 'flex';
                  }
                }
              }, 5000);
            }

            // 경기도 UTIC EE: 팝업 열릴 때 스트림 URL 조회 후 동적으로 비디오 주입
            const eeLoader = popupEl?.querySelector('[data-utic-ee-ip]');
            if (eeLoader instanceof HTMLElement) {
              const ip = eeLoader.getAttribute('data-utic-ee-ip');
              if (ip) {
                try {
                  const streamUrl = await getCctvStreamUrl(ip);
                  if (streamUrl && eeLoader.isConnected) {
                    const videoEl = document.createElement('video');
                    videoEl.autoplay = true;
                    videoEl.muted = true;
                    videoEl.controls = true;
                    videoEl.setAttribute('playsinline', '');
                    videoEl.style.cssText =
                      'width:192px;height:108px;object-fit:cover;display:block;background:#111827';
                    videoEl.src = getCctvStreamProxyUrl(streamUrl);
                    // 클립 끝나면 새 URL로 갱신
                    videoEl.onended = async () => {
                      const fresh = await getCctvStreamUrl(ip).catch(() => null);
                      if (fresh && videoEl.isConnected) {
                        videoEl.src = getCctvStreamProxyUrl(fresh);
                        videoEl.play().catch(() => {});
                      }
                    };
                    eeLoader.replaceWith(videoEl);
                  } else if (eeLoader.isConnected) {
                    eeLoader.innerHTML =
                      '<span style="font-size:12px;color:#9ca3af">영상 없음</span><span style="font-size:10px;color:#d1d5db">경기도 CCTV</span>';
                  }
                } catch {
                  if (eeLoader.isConnected) {
                    eeLoader.innerHTML =
                      '<span style="font-size:12px;color:#9ca3af">영상 없음</span><span style="font-size:10px;color:#d1d5db">경기도 CCTV</span>';
                  }
                }
              }
            }
          }, 0);
        })
        .on('popupclose', (event) => {
          const hlsVideo = event.popup.getElement()?.querySelector('video[data-hls-src]');
          if (hlsVideo instanceof HTMLVideoElement) {
            detachHlsVideo(hlsVideo);
          }
          const eeVideo = event.popup.getElement()?.querySelector('video:not([data-hls-src])');
          if (eeVideo instanceof HTMLVideoElement) {
            eeVideo.pause();
            eeVideo.src = '';
            eeVideo.load();
          }
        })
        .on('click', () => {
          setSelectedCctvId(cctvname);
          if (window.innerWidth < 768) openCctvModal(cctvname);
        })
        .addTo(layer);
      if (cctvname === selectedCctvId && window.innerWidth >= 768) m.openPopup();
    });
    layer.addTo(map);
  }, [cctvData, selectedCctvId, cctvOn, openCctvModal]);

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
              <div ref={containerRef} className="running-map absolute inset-0 z-0 isolate" />

              {/* CCTV 토글 버튼 — Leaflet 줌 컨트롤 아래 (touch 30px 기준: 10+30+1+30+9gap=80px) */}
              <div className="absolute top-[80px] right-[10px] z-[100]">
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
                <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[90] pointer-events-none sm:top-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-blue-500 text-white px-2.5 py-1 rounded-full shadow-md">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    CCTV 활성
                  </span>
                </div>
              )}

              {allRecords.length === 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[30] pointer-events-none">
                  <span className="text-sm text-muted-foreground bg-card px-4 py-2 rounded-full shadow-sm border border-border whitespace-nowrap">
                    러닝 기록이 없습니다.
                  </span>
                </div>
              )}

              {weather && (
                <div className="absolute top-3 left-3 right-[58px] z-[90] pointer-events-none sm:right-auto">
                  <div className="flex w-fit max-w-full items-center gap-2 bg-[#fcfcfc] border border-[#d6d6d6] rounded-lg px-3 py-2 shadow-sm whitespace-nowrap sm:gap-4 sm:px-5 sm:py-2.5">
                    <img src={wmoIcon(weather.weatherCode)} alt="" className="w-8 h-8 shrink-0" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-0.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M8 2C10.7614 2 13 4.23858 13 7C13 8.12561 12.6277 9.16434 12 10C11.0878 11.2144 9.49993 13.0001 8 15C6.50007 13.0001 4.91223 11.2144 4 10C3.37231 9.16434 3 8.12561 3 7C3 4.23858 5.23858 2 8 2ZM8 5C6.89543 5 6 5.89543 6 7C6 8.10457 6.89543 9 8 9C9.10457 9 10 8.10457 10 7C10 5.89543 9.10457 5 8 5Z"
                              fill="#303030"
                            />
                          </svg>
                          <span className="text-[14px] text-[#303030]">{weather.cityName}</span>
                        </div>
                        <div className="flex items-end gap-0.5">
                          <span className="text-[18px] font-bold text-[#303030] leading-5">
                            {weather.temp}
                          </span>
                          <span className="text-[13px] text-[#616161]">℃</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#616161]">습도</span>
                          <div className="flex items-end gap-0.5 text-[14px]">
                            <span className="font-medium text-[#303030]">{weather.humidity}</span>
                            <span className="text-[#616161]">%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#616161]">풍속</span>
                          <div className="flex items-end gap-0.5 text-[14px]">
                            <span className="font-medium text-[#303030]">{weather.windSpeed}</span>
                            <span className="text-[#616161]">m/s</span>
                          </div>
                        </div>
                      </div>
                    </div>
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

      {/* CCTV 확대보기 모달 */}
      {cctvModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <Cctv size={16} />
              <span className="text-sm font-semibold">{selectedCctvId ?? 'CCTV'}</span>
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
          <div className="flex-1 flex items-center justify-center p-4">
            {(() => {
              const cctv = cctvData.find((c) => c.cctvname === selectedCctvId);
              if (!cctv) return <span className="text-white/50 text-sm">영상 없음</span>;
              const eeIp = cctv.cctvimageurl?.startsWith('utic-ee://')
                ? cctv.cctvimageurl.slice('utic-ee://'.length)
                : null;
              if (eeIp) {
                return (
                  <CctvVideoEE
                    key={eeIp}
                    cctvIp={eeIp}
                    className="w-full max-w-5xl max-h-full object-contain bg-black"
                  />
                );
              }
              if (cctv.cctvurl) {
                return (
                  <CctvVideo
                    key={cctv.cctvurl}
                    src={cctv.cctvurl}
                    className="w-full max-w-5xl max-h-full object-contain bg-black"
                  />
                );
              }
              return <span className="text-white/50 text-sm">영상 없음</span>;
            })()}
          </div>
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
