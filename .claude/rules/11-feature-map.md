# 지도 / CCTV 기능 규칙

## 지도

- Leaflet 지도 인스턴스는 `useRef`로 관리한다.
- 레이어는 기능별로 분리하고 unmount 시 제거한다.
- 경로 표시, 현재 위치, CCTV 마커가 서로 불필요하게 덮어쓰지 않게 한다.
- `fitBounds`는 사용자의 수동 이동을 과도하게 방해하지 않도록 조건을 둔다.

## CCTV

- 프론트 API 래퍼: `frontend/src/api/cctvApi.ts`
- 백엔드 컨트롤러: `backend/src/main/java/com/running/controller/CctvController.java`
- 백엔드 서비스: `backend/src/main/java/com/running/service/CctvService.java`
- API 키 설정: `ITS_API_KEY`

## CCTV 구현 규칙

- API 키가 없으면 서버가 실패하지 않고 빈 목록을 반환한다.
- 외부 ITS API 호출 실패는 로그를 남기고 프론트에는 안정적인 응답을 준다.
- 지도 bounds 기준으로 CCTV를 조회한다.
- 지도 이동 후 재조회가 필요한 경우 debounce를 적용한다.
- `cctvurl`, `cctvname`, `coordx`, `coordy` 필드는 프론트 타입과 백엔드 DTO가 일치해야 한다.

## QA 시나리오

- CCTV 토글 ON/OFF
- API 키 없음
- 외부 API 실패
- 모바일에서 CCTV 마커 클릭 후 모달 표시
- 데스크톱에서 팝업 영상 표시
