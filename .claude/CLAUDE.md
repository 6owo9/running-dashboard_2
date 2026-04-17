# Running Dashboard

## 프로젝트 개요
삼성 헬스 / 런데이 GPX 파일 기반 러닝 기록 대시보드.  
지도에 경로를 시각화하고, 목표 달성률을 추적한다.

## 역할별 규칙
역할별 작업 시 해당 규칙 파일을 추가로 참고한다:
- 전체 워크플로우 통제 → `.claude/rules/00-pm.md`
- 백엔드 작업 → `.claude/rules/01-backend.md`
- 프론트엔드 작업 → `.claude/rules/02-frontend.md`
- QA 작업 → `.claude/rules/03-qa.md`
- GPX 파싱 작업 → `.claude/rules/10-feature-gpx.md`
- 지도 시각화 작업 → `.claude/rules/11-feature-map.md`
- 배포 및 로컬 실행 → `.claude/rules/20-deployment.md`

---

## 대화 스타일
- 사용자와의 모든 대화는 반말로 진행한다.
- 질문, 보고, 확인 요청 모두 한국어로 한다.

---

## 요청 처리 원칙

**가정하지 마라. 혼란을 숨기지 마라. 트레이드오프를 드러내라.**

- 요청을 수행하기 전, 문제가 있거나 재검토가 필요하다고 판단되면 무조건 실행하지 않고 먼저 사용자와 상의한다.
- 상의 없이 진행해도 되는 경우: 명확하고 위험성이 없는 단순 작업.
- 반드시 상의 후 진행하는 경우: 아키텍처 변경, 파괴적 작업, 트레이드오프가 있는 설계 결정, 요청의 의도가 불명확한 경우.
- 여러 해석이 존재하면 조용히 선택하지 말고 제시한다.
- 더 단순한 접근이 있다면 말한다. 필요할 때 반론을 제기한다.

---

## 작업 흐름

- Plan Mode로 계획 먼저 제시한다: `1. [단계] → 검증: [확인 방법]`
- 계획 승인 후 구현을 시작한다.
- 구현 완료 후 변경사항 한 줄 요약 보고한다.
- 커밋 전 반드시 사용자 허락을 받는다.

---

## 단순함 우선

**문제를 해결하는 최소한의 코드. 추측성 코드는 없다.**

- 요청받은 것 이상의 기능 없음.
- 일회성 코드에 추상화 없음.
- 요청하지 않은 "유연성"이나 "설정 가능성" 없음.
- 불가능한 시나리오에 대한 에러 처리 없음.
- 200줄을 50줄로 줄일 수 있다면 다시 써라.

---

## 외과적 변경

**반드시 필요한 것만 건드려라.**

- 인접한 코드, 주석, 포매팅을 "개선"하지 않는다.
- 고장나지 않은 것을 리팩터링하지 않는다.
- 내 변경으로 사용되지 않게 된 import/변수/함수는 제거한다.
- 노이즈는 발견 즉시 제거한다: 주석 처리된 코드, 디버그용 console.log, 자명한 주석.

---

## 금지 행동

- 라이브러리/의존성 임의 추가 금지 → 반드시 사용자 허락 후 추가.
- DB 스키마 임의 변경 금지 → 변경 전 사용자와 상의.
- 기술스택 외 도구 임의 사용 금지.

---

## 에러 처리 보고

- 오류 발생 시 원인 + 해결방법을 함께 제시한다.
- 해결방법이 여러 개면 트레이드오프를 함께 설명한다.
- 해결 불가능한 경우 솔직하게 말하고 대안을 제시한다.

---

## 코드 품질

코드 작성 후 아래 항목을 셀프 체크한다:
- 보안 이슈 (인증, 입력값 검증 등)
- 성능 문제 (불필요한 반복, N+1 쿼리 등)
- 누락된 예외 처리

---

## 네이밍 컨벤션

- URL 경로: `kebab-case` (예: `/running-records`, `/goal-setting`)
- JSON 속성: `camelCase` (예: `distanceKm`, `createdAt`)
- 코드 주석: 한국어 작성

---

## 기술스택

| 구분 | 기술 |
|------|------|
| 언어 | TypeScript |
| 빌드 | Vite |
| 스타일 | Tailwind CSS |
| 패키지 매니저 | pnpm |
| 지도 | Leaflet.js |
| 백엔드 | Java 21, Spring Boot 3.5.0, Spring Data JPA, Spring Security |
| 인증 | JWT (jjwt 0.12.6), BCrypt |
| DB | H2 File (`jdbc:h2:file:/home/seong/data/runningdb`) |
| 빌드 도구 | Gradle |
| 배포 | Ubuntu 24.04 LTS 로컬 서버 (nginx + systemd) |

---

## 프로젝트 구조

```
running-dashboard/
├── .claude/
│   ├── CLAUDE.md
│   └── rules/
├── frontend/                → Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx       → 앱 헤더 (로그인 상태별 버튼 전환)
│   │   │   ├── StatCard.tsx     → 통계 카드
│   │   │   ├── ProgressBar.tsx  → 목표 달성률 바
│   │   │   ├── UploadModal.tsx  → 업로드 Modal (캘린더 포함)
│   │   │   ├── GoalModal.tsx    → 목표 설정 Modal
│   │   │   ├── AuthModal.tsx    → 로그인/회원가입 Modal (탭 전환)
│   │   │   └── ProfileModal.tsx → 프로필 수정/비밀번호 변경 Modal
│   │   ├── pages/
│   │   │   └── MainPage.tsx     → 단일 메인 페이지 (지도·기록·통계 통합)
│   │   ├── api/             → 백엔드 API 호출
│   │   │   ├── runningApi.ts
│   │   │   ├── goalApi.ts
│   │   │   ├── statsApi.ts
│   │   │   └── authApi.ts   → 인증/사용자 API
│   │   └── hooks/
│   │       └── useAuth.ts   → JWT 토큰 관리 (localStorage)
│   └── package.json
└── backend/                 → Spring Boot + H2 + Spring Security
    └── src/main/
        ├── java/com/running/
        │   ├── config/          → SecurityConfig, JwtUtil, JwtAuthFilter, WebConfig
        │   ├── controller/      → REST API
        │   ├── service/         → 비즈니스 로직
        │   ├── repository/      → DB 접근
        │   ├── entity/          → JPA Entity (User, RunningRecord, Goal)
        │   ├── dto/             → 요청/응답 객체
        │   └── exception/       → GlobalExceptionHandler
        └── resources/
            └── application.yml
```

## 주요 화면
라우팅 없음. 단일 경로(`/`)에서 Modal로 화면 전환한다.

| 화면 | 진입 방법 | 설명 |
|------|----------|------|
| 메인 | `/` | 지도·기록 목록·통계·캘린더 통합 화면 |
| 기록 업로드 | 헤더 업로드 버튼 (로그인 필요) | GPX 파일 업로드, 캘린더, 기록 목록 |
| 목표 설정 | 목표 달성률 카드 수정 버튼 (로그인 필요) | 목표 거리 설정 및 달성률 확인 |
| 로그인/회원가입 | 헤더 로그인·회원가입 버튼 | JWT 인증, localStorage 저장 |
| 프로필 수정 | 헤더 닉네임 버튼 (로그인 시) | 닉네임·프로필 이미지 수정, 비밀번호 변경 |


