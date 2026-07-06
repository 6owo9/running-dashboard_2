# 프론트엔드 규칙

## 기술 스택

- React
- TypeScript
- Vite
- Tailwind CSS
- Leaflet
- lucide-react

## 구조

| 위치 | 역할 |
| --- | --- |
| `src/pages/` | 페이지 단위 화면 |
| `src/components/` | 재사용 UI 컴포넌트 |
| `src/api/` | 백엔드/외부 API 호출 래퍼 |
| `src/hooks/` | React 훅 |
| `src/assets/` | 이미지, 아이콘 등 정적 리소스 |

## 구현 규칙

- 기존 컴포넌트와 스타일 방식을 우선 재사용한다.
- API 타입은 백엔드 DTO 필드명과 일치시킨다.
- API 호출은 `src/api/`에 둔다.
- 비로그인 상태에서 필요한 UX는 버튼 비활성화보다 로그인 모달 유도가 우선인지 기존 패턴을 확인한다.
- 지도 관련 로직은 Leaflet 레이어의 생성, 갱신, 제거 타이밍을 명확히 분리한다.

## UI 규칙

- 버튼에는 가능한 경우 lucide 아이콘을 사용한다.
- 모바일 화면에서 모달, 지도, 버튼 텍스트가 겹치지 않는지 확인한다.
- 로딩, 빈 데이터, 에러 상태를 화면에 드러낸다.
- 텍스트가 버튼이나 카드 밖으로 넘치지 않게 한다.

## 검증

```powershell
cd frontend
pnpm run build
pnpm run lint
```

Vite 개발 서버는 기본 `5173`이며, `/api` proxy는 백엔드 포트와 일치해야 한다.
