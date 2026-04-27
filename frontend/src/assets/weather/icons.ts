import cloudRain from './img_cloud-rain_light_32x32.svg';
import cloudSnow from './img_cloud-snow-05_light_32x32.svg';
import cloudThunder from './img_cloud-thunder_light_32x32.svg';
import cloud from './img_cloud_light_32x32.svg';
import fog from './img_fog_light_32x32.svg';
import rainLess from './img_rain-less_light_32x32.svg';
import rainSnow from './img_rain-snow_light_32x32.svg';
import showerRain from './img_shower-rain_light_32x32.svg';
import snowLess from './img_snow-less_light_32x32.svg';
import sunCloudLess from './img_sun-cloud-less_light_32x32.svg';
import sunCloud from './img_sun-cloud_light_32x32.svg';
import sun from './img_sun_light_32x32.svg';

// WMO 날씨 코드 → 한국어 날씨 설명
export function wmoText(code: number): string {
  if (code === 0) return '맑음';
  if (code === 1) return '구름 조금';
  if (code === 2) return '구름 많음';
  if (code === 3) return '흐림';
  if (code <= 48) return '안개';
  if (code <= 55) return '이슬비';
  if (code <= 57) return '진눈깨비';
  if (code <= 65) return '비';
  if (code <= 67) return '어는비';
  if (code <= 73) return '약한 눈';
  if (code <= 77) return '눈';
  if (code <= 82) return '소나기';
  if (code <= 86) return '눈소나기';
  return '뇌우';
}

// WMO 날씨 코드 → SVG URL
export function wmoIcon(code: number): string {
  if (code === 0) return sun;           // 맑음
  if (code === 1) return sunCloudLess;  // 구름 조금
  if (code === 2) return sunCloud;      // 구름 많음
  if (code === 3) return cloud;         // 흐림
  if (code <= 48) return fog;           // 안개 (45, 48)
  if (code <= 55) return rainLess;      // 이슬비 (51-55)
  if (code <= 57) return rainSnow;      // 진눈깨비 (56-57)
  if (code <= 65) return cloudRain;     // 비 (61-65)
  if (code <= 67) return rainSnow;      // 어는비 (66-67)
  if (code <= 73) return snowLess;      // 약한 눈 (71-73)
  if (code <= 77) return cloudSnow;     // 눈 (75-77)
  if (code <= 82) return showerRain;    // 소나기 (80-82)
  if (code <= 86) return cloudSnow;     // 눈소나기 (85-86)
  return cloudThunder;                   // 뇌우 (95, 96, 99)
}
