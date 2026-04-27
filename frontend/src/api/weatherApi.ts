export interface HourlyWeather {
  hour: number;
  temp: number;
  weatherCode: number;
  isActive: boolean;
}

export async function getHourlySlots(lat: number, lon: number): Promise<HourlyWeather[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,weathercode` +
    `&past_days=1&forecast_days=2&timezone=Asia%2FSeoul`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('날씨 조회 실패');
  const data = await res.json();

  const times: string[] = data.hourly.time;
  const temps: number[] = data.hourly.temperature_2m;
  const codes: number[] = data.hourly.weathercode;

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const currentTarget = `${today}T${String(now.getHours()).padStart(2, '0')}:00`;
  const currentIdx = times.findIndex((t) => t === currentTarget);
  if (currentIdx < 0) return [];

  return [-2, -1, 0, 1, 2].map((offset) => {
    const i = currentIdx + offset;
    const inRange = i >= 0 && i < times.length;
    return {
      hour: inRange ? parseInt(times[i].slice(11, 13), 10) : 0,
      temp: inRange ? Math.round(temps[i] ?? 0) : 0,
      weatherCode: inRange ? (codes[i] ?? 0) : 0,
      isActive: offset === 0,
    };
  });
}
