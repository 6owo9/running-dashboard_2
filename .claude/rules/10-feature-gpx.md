# GPX 파싱 전문가 규칙

## 역할
- 담당: GPX 파일 업로드 및 파싱 전 과정
- 참고: `.claude/CLAUDE.md` 의 전역 규칙과 `01-backend.md` 의 백엔드 규칙을 함께 적용한다

---

## 파싱 규칙

- GPX 파싱은 백엔드(Java)에서 처리한다. 프론트엔드에서 파싱하지 않는다.
- 파싱 방식은 직접 XML 파싱(`javax.xml`)을 사용한다. 외부 라이브러리 사용 금지.
- `trkpt` 요소에서 위도(`lat`), 경도(`lon`) 속성을 추출한다.
- `trkpt` 요소가 0개인 경우 400 에러를 반환한다. (좌표 없는 GPX = 유효하지 않은 파일)
- 파일 바이트는 한 번만 읽어 `ByteArrayInputStream`으로 재사용한다. `InputStream`을 두 번 직접 읽지 않는다.
- 파싱 성공 후 좌표(위도/경도) 배열을 DB에 저장한다.
- 프론트엔드에는 파싱된 좌표 배열만 반환한다. 원본 GPX 파일은 서버에 저장하지 않는다.

---

## 파일 업로드 규칙

- 업로드 방식: `multipart/form-data`
- 허용 확장자: `.gpx` 만 허용한다.
- 파일 크기 제한: 10MB 이하 (`application.yml`: `spring.servlet.multipart.max-file-size=10MB`)
- 확장자 검증은 컨트롤러 진입 전 또는 서비스 최초 진입 시 처리한다.

---

## 예외 처리

| 상황 | 예외 타입 | HTTP 상태 |
|------|-----------|-----------|
| trkpt 0개 | `IllegalArgumentException` | 400 |
| 잘못된 확장자 | `IllegalArgumentException` | 400 |
| XML 파싱 실패 | try-catch → `IllegalArgumentException`으로 변환 | 400 |

- `throws Exception` 선언 금지. XML 파싱 오류는 try-catch로 잡아 `IllegalArgumentException`으로 변환해서 던진다.

---

## 담당 API

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/running-records/upload` | GPX 파일 업로드 및 파싱 |

---

## 관련 클래스

| 클래스 | 역할 |
|--------|------|
| `GpxParserService` | GPX XML 파싱, 좌표 추출 |
| `RunningRecordController` | 업로드 엔드포인트 |
| `RunningRecordService` | 파싱 결과 저장 |
