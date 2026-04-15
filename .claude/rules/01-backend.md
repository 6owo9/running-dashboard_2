# 백엔드 역할 규칙

## 역할
- 담당: Spring Boot 기반 REST API 및 H2 DB 관리
- 참고: `.claude/CLAUDE.md` 반드시 함께 적용한다

## 데이터 영속성 (Data Persistence)
- H2 In-Memory(`jdbc:h2:mem:runningdb;DB_CLOSE_DELAY=-1`) 사용. Render.com 파일시스템이 ephemeral이라 File 모드와 동일하게 재시작 시 초기화됨.
- `hibernate.ddl-auto: create-drop` 적용.

## 🔄 API 데이터 정합성
- 프론트엔드에서 새로고침 시 `GET` 요청을 보낼 때, DB에서 최신 데이터를 정확히 가져오는지 쿼리 로그를 확인한다.

## API 설계 관련
- REST API 원칙을 따른다.
- URL 경로는 kebab-case를 사용한다. (예: `/running-records`, `/goal-setting`)
- 응답 형식은 항상 아래 구조를 따른다:
```json
  {
    "success": true,
    "data": {},
    "message": ""
  }
```
- 에러 응답 시 적절한 HTTP 상태코드를 반환한다. (200 / 400 / 404 / 500)

## 파일 업로드 관련
- 파일 업로드는 `multipart/form-data` 방식으로 처리한다.
- 허용 확장자: `.gpx`만 허용 (확장자 체크 없이 XML 파싱으로 GPX 여부 검증)
- 파일 크기 제한: 10MB 이하
- 업로드된 파일은 파싱 후 원본을 서버에 저장하지 않는다.

## 예외 처리 관련
- `@ControllerAdvice` 로 전역 예외 처리를 적용한다.
- 존재하지 않는 리소스 요청 시 404를 반환한다.
- 클라이언트에 스택트레이스를 노출하지 않는다.

## 패키지 / 폴더 규칙
| 폴더 | 역할 |
|------|------|
| `controller/` | REST API 엔드포인트 |
| `service/` | 비즈니스 로직 |
| `repository/` | DB 접근 (JPA) |
| `entity/` | JPA Entity 클래스 |
| `dto/` | 요청/응답 객체 |

## 인증 관련
- JWT 토큰을 `Authorization: Bearer <token>` 헤더로 전달받아 검증한다.
- `SecurityConfig`에서 공개/인증 필요 경로를 분리한다.
- 공개 경로: `GET /api/running-records/**`, `GET /api/stats/**`, `GET /api/goals/current`, `POST /api/auth/**`
- 인증 필요 경로: `POST /api/running-records/upload`, `DELETE /api/running-records/{id}`, `POST /api/goals`, `/api/users/**`
- `GET /api/goals/current`는 공개이지만, 인증 토큰이 있을 때만 해당 유저의 목표를 반환하고 없으면 null을 반환한다.

## 담당 API
| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| POST | `/api/auth/signup` | 불필요 | 회원가입 (JWT 즉시 발급) |
| POST | `/api/auth/login` | 불필요 | 로그인 (JWT 발급) |
| GET | `/api/users/me` | 필요 | 내 프로필 조회 |
| PUT | `/api/users/me` | 필요 | 닉네임·프로필 이미지 수정 |
| PUT | `/api/users/me/password` | 필요 | 비밀번호 변경 |
| POST | `/api/running-records/upload` | 필요 | GPX 파일 업로드 및 파싱 |
| GET | `/api/running-records` | 불필요 | 전체 러닝 기록 조회 (모든 사용자) |
| GET | `/api/running-records?period=today\|week` | 불필요 | 오늘/일주일 기록 조회 |
| DELETE | `/api/running-records/{id}` | 필요 | 러닝 기록 삭제 (본인 기록만) |
| POST | `/api/goals` | 필요 | 목표 설정 |
| GET | `/api/goals/current` | 선택 | 현재 목표 및 달성률 조회 (토큰 있으면 유저 목표, 없으면 null) |
| GET | `/api/stats/summary` | 불필요 | 전체 통계 요약 |