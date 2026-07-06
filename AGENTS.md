# 러닝 대시보드 Codex 에이전트 안내서

## 가장 먼저 읽을 파일

이 저장소는 `.claude/` 디렉터리를 공통 에이전트 규칙 저장소로 사용합니다. Codex는 이 `AGENTS.md`를 최우선 진입점으로 읽고, 작업 영역에 맞는 세부 규칙을 함께 확인합니다.

## 적용 우선순위

1. 사용자의 최신 요청
2. 이 파일(`AGENTS.md`)
3. `.codex/README.md`, `.codex/rules.md`
4. 작업 영역과 관련된 `.claude/rules/*.md`
5. 기존 코드 구조와 현재 작업 트리 상태

`.claude/settings.json`, `.claude/hooks/`, `.claude/commands/`는 Claude Code 호환용 설정입니다. Codex가 자동으로 적용하는 설정이 아니므로, Codex 작업에서는 문서성 참고 자료로만 봅니다.

## 작업별 참조 문서

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

## 프로젝트 요약

GPX 기반 러닝 기록 대시보드입니다.

- 프론트엔드: React, TypeScript, Vite, Tailwind CSS, Leaflet
- 백엔드: Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, H2
- 인증: JWT
- 빌드 도구: 프론트엔드는 pnpm, 백엔드는 Gradle
- 주요 기능: GPX 업로드, 러닝 경로 지도 표시, 통계, 목표 설정, 프로필 관리, CCTV 레이어

## Codex 작업 원칙

- 파일을 수정하기 전에 관련 파일을 먼저 읽습니다.
- 사용자의 요청 범위 안에서만 변경합니다.
- 작업 트리에 이미 있는 사용자 변경사항을 보존합니다.
- 검색은 가능하면 `rg` 또는 `rg --files`를 사용합니다.
- 수동 파일 편집은 `apply_patch`를 사용합니다.
- 사용자가 요청하기 전에는 커밋하지 않습니다.
- 변경 후 가장 작은 의미 있는 검증 명령을 실행합니다.
- 사용자는 한국어 응답을 기대합니다. 짧고 직접적으로 보고합니다.
- 불명확한 요청은 먼저 코드와 변경사항을 보고 추론한 뒤, 위험하거나 되돌리기 어려운 경우에만 질문합니다.
- 현재 작업 트리에 CCTV 연동 변경사항이 있으므로, 해당 작업과 무관한 문서 수정 중에는 건드리지 않습니다.

## 주요 명령

```powershell
cd frontend
pnpm run build
pnpm run lint
```

```powershell
cd backend
.\gradlew.bat test
.\gradlew.bat bootRun
```

## 실행 환경 메모

- 프론트 개발 서버 기본 포트: `5173`
- 백엔드 기본 포트: `8080`
- Vite `/api` 프록시 대상: `http://localhost:8080`
- `backend/src/main/resources/application-local.yml`은 `8081`을 사용하므로 local 프로필 실행 시 프록시 포트 일치를 확인합니다.

## Codex 전용 보조 문서

`.codex/` 디렉터리는 Codex가 바로 참고할 수 있는 축약 규칙과 체크리스트를 담습니다.

- `.codex/README.md`: Codex 전용 사용 안내
- `.codex/rules.md`: 작업 규칙 요약
- `.codex/qa-checklist.md`: 검증 체크리스트
