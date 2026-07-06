#!/usr/bin/env bash
set -euo pipefail

input="${1:-}"

if echo "$input" | grep -Eiq "(JWT_SECRET|KAKAO_CLIENT_SECRET|ITS_API_KEY|ENCRYPTION_KEY).*=.+[A-Za-z0-9]{12,}"; then
  echo "비밀값으로 보이는 문자열이 감지되었습니다. 환경변수 또는 커밋하지 않는 로컬 파일을 사용하세요." >&2
  exit 1
fi
