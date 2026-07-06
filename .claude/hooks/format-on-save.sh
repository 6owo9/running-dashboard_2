#!/usr/bin/env bash
set -euo pipefail

if [ -f "frontend/package.json" ] && command -v pnpm >/dev/null 2>&1; then
  (
    cd frontend
    pnpm exec prettier --write "src/**/*.{ts,tsx,css}" >/dev/null 2>&1 || true
  )
fi
