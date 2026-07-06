# 배포 규칙

## 기본 원칙

- 배포 설정 변경 전 현재 실행 방식과 포트를 확인한다.
- 운영 비밀값은 환경변수로만 주입한다.
- 프론트 빌드 결과와 백엔드 정적 리소스 서빙 방식이 맞는지 확인한다.

## 주요 설정

- 백엔드 기본 포트: `8080`
- 프론트 개발 포트: `5173`
- Vite proxy: `/api` -> `http://localhost:8080`
- local 프로필 포트가 다르면 proxy도 함께 확인한다.

## 배포 전 체크

```powershell
cd frontend
pnpm run build
```

```powershell
cd backend
.\gradlew.bat test
.\gradlew.bat bootJar
```

## 운영 확인

- `/`가 프론트 앱을 반환하는지 확인한다.
- `/api/running-records` 같은 공개 API가 정상 응답하는지 확인한다.
- 인증 필요 API는 토큰 없이 차단되는지 확인한다.
- 외부 API 키가 필요한 기능은 키 누락 시에도 앱 전체가 깨지지 않는지 확인한다.
