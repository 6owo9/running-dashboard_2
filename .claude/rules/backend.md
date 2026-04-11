# 백엔드 역할 규칙

## 역할
- 담당: Spring Boot 기반 REST API 및 H2 DB 관리
- 참고: `.claude/CLAUDE.md` 의 전역 규칙을 함께 적용한다

---

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

---

## 응답 기준 (반드시 준수)

| 상황 | HTTP 상태 | data 값 |
|------|-----------|---------|
| 단건 조회 성공 | 200 | 객체 |
| 단건 조회 - 리소스 없음 | 404 | 없음 (에러 응답) |
| 목록 조회 성공 | 200 | 배열 |
| 목록 조회 - 결과 없음 | 200 | 빈 배열 `[]` |
| 생성/수정 성공 | 200 | 저장된 객체 |
| 잘못된 요청 | 400 | 없음 (에러 응답) |
| 서버 오류 | 500 | 없음 (에러 응답) |

- 목록 조회에서 데이터가 없을 때 404를 반환하지 않는다. 반드시 빈 배열 + 200을 반환한다.
- 단건 조회에서 리소스가 없을 때 null + 200을 반환하지 않는다. 반드시 404를 반환한다.

---

## DB 관련
- DB는 H2 In-Memory를 사용한다.
- 스키마는 `resources/schema.sql` 에서 관리한다.
- 초기 샘플 데이터는 `resources/data.sql` 에 작성한다.
- 서버 재시작 시 data.sql이 자동으로 로드되도록 설정한다.
- DB 스키마 변경 시 반드시 사용자 허락을 받는다.

---

## GPX 파싱 관련
- GPX 파일 파싱은 백엔드에서 처리한다.
- 파싱 후 좌표(위도/경도) 배열을 DB에 저장한다.
- 프론트엔드에는 파싱된 좌표 배열만 반환한다.
- GPX 파싱은 직접 XML 파싱(javax.xml)으로 처리한다.
- `trkpt` 요소가 0개인 경우 400 에러를 반환한다. (좌표 없는 GPX는 유효하지 않은 파일로 처리)
- 파일 바이트는 한 번만 읽어 `ByteArrayInputStream`으로 재사용한다. InputStream을 두 번 직접 읽지 않는다.

---

## 파일 업로드 관련
- 파일 업로드는 `multipart/form-data` 방식으로 처리한다.
- 허용 확장자: `.gpx` 만 허용한다. (jpg/png 업로드 기능은 현재 미구현)
- 파일 크기 제한: 10MB 이하 (application.yml에서 `spring.servlet.multipart.max-file-size=10MB` 설정)
- 업로드된 파일은 파싱 후 원본을 서버에 저장하지 않는다.

---

## 예외 처리 관련
- `@ControllerAdvice` 로 전역 예외 처리를 적용한다.
- 존재하지 않는 리소스 요청 시 404를 반환한다.
- 예외 발생 시 로그에 원인을 기록한다.
- 클라이언트에 스택트레이스를 노출하지 않는다.
- service 메서드에 `throws Exception` 선언을 금지한다. 구체적인 예외 타입만 선언한다.
  - GPX 파싱 오류: `IllegalArgumentException`
  - 리소스 없음: `NoSuchElementException`
  - XML 파싱: `throws Exception` 대신 try-catch로 `IllegalArgumentException`으로 변환하여 던진다.

---

## DTO 관련 (필드명 동기화 필수)
- Response DTO 필드명은 프론트엔드 `src/api/` 의 소비 코드와 반드시 일치해야 한다.
- DTO 필드명을 변경할 경우, 해당 PR에서 프론트엔드 API 파일도 함께 수정한다.
- 변경 전 프론트 코드에서 해당 필드를 참조하는 곳을 Grep으로 먼저 확인한다.

---

## 패키지 / 폴더 규칙

| 폴더 | 역할 |
|------|------|
| `controller/` | REST API 엔드포인트 |
| `service/` | 비즈니스 로직 |
| `repository/` | DB 접근 (JPA) |
| `entity/` | JPA Entity 클래스 |
| `dto/` | 요청/응답 객체 |

- 클래스명은 PascalCase, 역할 suffix 붙인다. (예: `RunningRecordController`, `GoalService`)
- 메서드명은 camelCase, 동사로 시작한다. (예: `getRunningRecords`, `saveGoal`)

---

## 담당 API

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/running-records/upload` | GPX 파일 업로드 및 파싱 |
| GET | `/api/running-records` | 전체 러닝 기록 조회 |
| GET | `/api/running-records?period=today` | 오늘/일주일 기록 조회 |
| POST | `/api/goals` | 목표 설정 |
| GET | `/api/goals/current` | 현재 목표 및 달성률 조회 |
| GET | `/api/stats/summary` | 전체 통계 요약 |
