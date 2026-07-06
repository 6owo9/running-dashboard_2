# Codex 작업 규칙 요약

## 공통

- `rg` 또는 `rg --files`로 빠르게 탐색합니다.
- 수동 편집은 `apply_patch`를 사용합니다.
- 사용자가 요청하지 않으면 커밋하지 않습니다.
- 의존성 추가, DB 스키마 변경, 삭제 작업은 신중히 처리합니다.
- 이미 수정된 파일은 사용자 또는 이전 작업의 변경으로 보고 보존합니다.
- 문서만 요청받은 경우 앱 코드, 설정값, 빌드 결과물을 건드리지 않습니다.
- 답변은 한국어로 짧게 합니다.

## 프론트엔드

- `frontend/src/api/`에서 API 호출을 관리합니다.
- `frontend/src/components/`의 기존 컴포넌트를 우선 재사용합니다.
- Leaflet 레이어는 생성, 갱신, 제거 타이밍을 분리합니다.
- 모바일에서 모달과 지도 컨트롤이 겹치지 않는지 확인합니다.

## 백엔드

- 컨트롤러는 얇게, 로직은 서비스에 둡니다.
- 응답 형식은 `ApiResponse<T>`를 유지합니다.
- 공개 API는 `SecurityConfig`에 명시합니다.
- 외부 API 키는 환경변수로 받습니다.

## 검증

- 프론트 변경: `cd frontend && pnpm run build`
- 백엔드 변경: `cd backend && .\gradlew.bat test`
- 문서만 변경: `git diff --check`

## 현재 작업 트리 주의

- CCTV 연동 관련 변경사항이 작업 트리에 있습니다.
- `.claude`와 `.codex` 문서를 수정하는 동안 CCTV 관련 Java/TypeScript 파일은 변경하지 않습니다.
