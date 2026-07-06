# QA 명령

변경 후 아래 순서로 확인한다.

1. `git diff --check`
2. 프론트 변경 시 `cd frontend && pnpm run build`
3. 백엔드 변경 시 `cd backend && .\gradlew.bat test`
4. 지도/CCTV 변경 시 데스크톱과 모바일 화면에서 마커, 팝업, 모달을 확인
5. 최종 응답에 실행한 명령과 결과를 요약

검증을 실행하지 못하면 이유를 명확히 남긴다.
