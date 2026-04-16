#!/bin/bash
set -e

REPO_DIR=~/running-dashboard_2
WIN_BACKEND="C:\Users\seong\Desktop\star\running-dashboard_2\backend"
JAR_SRC="/mnt/c/Users/seong/Desktop/star/running-dashboard_2/backend/build/libs/running-dashboard-0.0.1-SNAPSHOT.jar"
JAR_DEST="$REPO_DIR/backend/build/libs/running-dashboard-0.0.1-SNAPSHOT.jar"

echo "=== git pull ==="
cd "$REPO_DIR"
git pull

echo "=== 프론트엔드 빌드 ==="
cd frontend
pnpm build
chmod -R o+r dist
cd ..

echo "=== 백엔드 빌드 (Windows Gradle) ==="
cmd.exe /c "cd /d $WIN_BACKEND && .\gradlew.bat bootJar"

echo "=== JAR 복사 ==="
cp "$JAR_SRC" "$JAR_DEST"

echo "=== 서비스 재시작 ==="
sudo systemctl restart running-backend
sudo systemctl status running-backend --no-pager -l

echo "=== 배포 완료 ==="
