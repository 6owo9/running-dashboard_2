# 프론트엔드 역할 규칙

## 역할
- 담당: Vite + TypeScript 기반 UI 구현
- 참고: `.claude/CLAUDE.md` 의 전역 규칙을 함께 적용한다

---

## 스타일 관련
- Tailwind CSS 클래스만 사용한다. 인라인 스타일 금지.
- 모바일 친화적으로 구현한다.
- 반응형 디자인을 적용한다. (Tailwind breakpoint 기준: sm / md / lg)
- 컬러코드는 Figma MCP를 참고한다.

---

## 컴포넌트 관련
- 재사용 가능한 컴포넌트는 반드시 분리한다.
- 페이지는 페이지당 하나의 파일로 관리한다.
- 공통 컴포넌트는 `src/components/common/` 폴더에 정리한다.

---

## 지도 관련
- 상세 규칙은 `11-feature-map.md` 를 참고한다.

---

## 접근성 / UX 관련
- 데이터 로딩 중에는 반드시 로딩 화면을 표시한다.
- 에러 발생 시 에러 화면을 표시한다.
- 데이터가 없을 경우 빈 화면 대신 안내 메시지를 표시한다.

---

## 파일 / 폴더 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `MapPage.tsx`, `GoalCard.tsx` |
| 공통 요소 폴더 | kebab-case | `common/`, `running-card/` |
| 일반 유틸/훅 | camelCase | `useGoal.ts`, `formatDate.ts` |
| API 호출 파일 | camelCase | `runningApi.ts`, `goalApi.ts` |

---

## API 통신 관련
- 백엔드 API 호출은 `src/api/` 폴더에서 관리한다.
- API 호출 실패 시 에러를 콘솔에만 남기지 말고 사용자에게 노출한다.
- `res.ok`가 false인 경우 응답 body의 `message` 필드를 에러 메시지로 사용한다. 파싱 실패 시 기본 메시지로 fallback한다.
- 업로드 전 동일 title(파일명 확장자 제거 기준)의 기록이 이미 존재하면 `window.alert`를 표시하고 업로드를 중단한다.

---

## DTO 관련
- 백엔드 Response DTO 필드명과 프론트엔드 인터페이스 필드명을 반드시 일치시킨다.
- DTO 필드명이 변경되면 해당 필드를 참조하는 모든 컴포넌트도 함께 수정한다.
- 변경 전 Grep으로 프론트 코드에서 해당 필드 사용처를 먼저 확인한다.

---

## 담당 화면

| 화면 | 파일 | 주요 기능 |
|------|------|----------|
| 지도 | `MapPage.tsx` | GPX 경로 지도 표출, 오늘/일주일 토글 |
| 기록 업로드 | `UploadPage.tsx` | 캘린더, 파일 업로드, 기록 요약 |
| 목표치 | `GoalPage.tsx` | 목표 설정, 프로그레스 바 |