export interface CurrentWeather {
  temp: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  cityName: string;
}

export async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'ko' } }
    );
    if (!res.ok) return '현재 위치';
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.county ||
      data.address?.town ||
      data.address?.village ||
      '현재 위치'
    );
  } catch {
    return '현재 위치';
  }
}

export async function getCurrentWeather(
  lat: number,
  lon: number,
  cityName: string
): Promise<CurrentWeather> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&timezone=Asia%2FSeoul`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('날씨 조회 실패');
  const data = await res.json();
  const c = data.current;
  return {
    temp: Math.round(c.temperature_2m),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m * 10) / 10,
    weatherCode: c.weather_code,
    cityName,
  };
}
