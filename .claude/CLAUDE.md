# 러닝 대시보드 에이전트 안내서

이 파일은 Claude Code 호환용 진입점입니다. Codex 에이전트는 루트의 `AGENTS.md`를 우선 읽고, 세부 규칙은 `.claude/rules/`와 `.codex/` 문서를 함께 참고합니다.

## 프로젝트 개요

GPX 기반 러닝 기록 대시보드입니다.

- 프론트엔드: Vite, React, TypeScript, Tailwind CSS, Leaflet
- 백엔드: Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, H2
- 인증: JWT, localStorage 기반 프론트 상태 관리
- 주요 기능: GPX 업로드, 러닝 경로 지도 표시, 통계, 목표 설정, 프로필 관리, CCTV 레이어

## 작업 원칙

- 사용자의 최신 요청을 우선한다.
- 변경 전에 관련 파일을 먼저 읽고 기존 패턴을 따른다.
- 깨진 부분만 고치고, 요청 범위를 벗어난 리팩터링은 하지 않는다.
- 파일 수정 후 가능한 범위에서 빌드, 테스트, 타입 체크 중 하나 이상을 실행한다.
- 사용자가 보지 못한 명령 출력은 최종 응답에 핵심만 요약한다.

## 규칙 문서

- 공통 진행: `.claude/rules/00-pm.md`
- 백엔드: `.claude/rules/01-backend.md`
- 프론트엔드: `.claude/rules/02-frontend.md`
- 컴포넌트: `.claude/rules/01-component.md`
- 스타일: `.claude/rules/02-style.md`
- QA: `.claude/rules/03-qa.md`
- 접근성: `.claude/rules/10-feature-a11y.md`
- GPX: `.claude/rules/10-feature-gpx.md`
- 지도/CCTV: `.claude/rules/11-feature-map.md`
- 배포: `.claude/rules/20-deployment.md`

## Codex 전용 문서

- Codex 진입점: `AGENTS.md`
- Codex 요약 규칙: `.codex/rules.md`
- Codex QA 체크리스트: `.codex/qa-checklist.md`

## 주요 명령

```powershell
cd frontend
pnpm install
pnpm run build
pnpm run lint
```

```powershell
cd backend
.\gradlew.bat test
.\gradlew.bat bootRun
```

프론트 개발 서버는 기본 `5173`, 백엔드는 기본 `8080`을 사용합니다. `application-local.yml`은 `8081`로 설정되어 있으므로 local 프로필 사용 시 Vite proxy와 포트가 맞는지 확인합니다.

## 저장소 구조

```text
frontend/
  src/
    api/
    assets/
    components/
    hooks/
    pages/MainPage.tsx
backend/
  src/main/java/com/running/
    config/
    controller/
    dto/
    entity/
    exception/
    repository/
    service/
  src/main/resources/
.claude/
  rules/
```
