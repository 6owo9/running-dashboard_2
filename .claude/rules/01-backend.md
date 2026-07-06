# 백엔드 규칙

## 기술 스택

- Java 21
- Spring Boot 3.5
- Spring Web, Spring Security, Spring Data JPA
- H2
- Gradle

## 패키지 역할

| 패키지 | 역할 |
| --- | --- |
| `controller/` | REST API 엔드포인트 |
| `service/` | 비즈니스 로직과 외부 API 호출 |
| `repository/` | JPA 데이터 접근 |
| `entity/` | JPA 엔티티 |
| `dto/` | 요청/응답 DTO |
| `config/` | 보안, JWT, 웹 설정 |
| `exception/` | 전역 예외 처리 |

## API 규칙

- URL은 kebab-case를 사용한다.
- 응답은 가능한 한 `ApiResponse<T>` 형식을 유지한다.
- 컨트롤러는 얇게 두고 로직은 서비스로 이동한다.
- 공개 API와 인증 필요 API는 `SecurityConfig`에 명확히 분리한다.
- 클라이언트에 스택트레이스나 내부 예외 메시지를 그대로 노출하지 않는다.

## 인증 규칙

- JWT는 `Authorization: Bearer <token>` 헤더로 전달한다.
- 비로그인 허용 GET API는 명시적으로 permit 처리한다.
- 사용자 소유 리소스 삭제/수정은 서버에서 소유권을 검증한다.

## 설정 규칙

- 비밀값은 환경변수로 주입한다.
- 기본값에 운영 비밀키를 넣지 않는다.
- `application-local.yml`처럼 로컬 전용 설정은 프론트 proxy 설정과 포트가 맞는지 확인한다.

## 검증

```powershell
cd backend
.\gradlew.bat test
```

외부 API 연동 기능은 API 키가 없을 때 실패하지 않고 빈 결과 또는 명확한 오류를 반환해야 한다.
