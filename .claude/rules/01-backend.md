# 백엔드 역할 규칙

## 역할
- 담당: Spring Boot 기반 REST API 및 H2 DB 관리
- 참고: `.claude/CLAUDE.md` 반드시 함께 적용한다

## 데이터 영속성 (Data Persistence)
- **H2 DB 설정:** `jdbc:h2:mem:testdb` 사용을 금지한다.
- 반드시 로컬 파일 시스템을 사용하는 `jdbc:h2:file:./data/runningdb` 방식을 사용하도록 `application.yml`을 수정한다.
- 서버 재시작 시에도 테이블 구조와 데이터가 유지되도록 `hibernate.ddl-auto: update` 설정을 적용한다.

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
- 허용 확장자: `.gpx`, `.jpg`, `.png`
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

## 담당 API
| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/running-records/upload` | GPX 파일 업로드 및 파싱 |
| GET | `/api/running-records` | 전체 러닝 기록 조회 |
| GET | `/api/running-records?period=today` | 오늘/일주일 기록 조회 |
| POST | `/api/goals` | 목표 설정 |
| GET | `/api/goals/current` | 현재 목표 및 달성률 조회 |
| GET | `/api/stats/summary` | 전체 통계 요약 |