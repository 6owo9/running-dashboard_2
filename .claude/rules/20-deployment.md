# 배포 및 로컬 실행

## 로컬 실행 방법

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

### Backend
```bash
cd backend
gradlew bootRun
```

---

## Ubuntu 로컬 서버 배포

### 서버 정보
| 항목 | 값 |
|------|-----|
| OS | Ubuntu 24.04 LTS (WSL2) |
| 네트워크 | WSL2 Mirrored 모드 (`~/.wslconfig`에 `networkingMode=mirrored` 설정) |
| 네트워크 IP | `10.10.1.129` (Windows WiFi IP와 공유, 재시작 시 바뀔 수 있음) |
| SSH 포트 | 22 |
| HTTP 포트 | 80 |
| 접속 URL (같은 WiFi 기기) | `http://10.10.1.129` |
| 접속 URL (서버 본체 노트북) | `http://localhost` |
| SSH 계정 | `seong` |

### 구성 요소
| 구성요소 | 설정 |
|---------|------|
| 프론트엔드 | nginx → `http://10.10.1.129:80` |
| 백엔드 | Spring Boot JAR → `localhost:8080` (내부 전용) |
| 프록시 | nginx `/api/` → `localhost:8080` |
| dist 경로 | `/home/seong/running-dashboard_2/frontend/dist` |
| nginx 설정 | `/etc/nginx/sites-available/running-dashboard` |
| 백엔드 서비스 | `/etc/systemd/system/running-backend.service` |
| DB 파일 | `/home/seong/data/runningdb.mv.db` |

### 접속 방법
| 환경 | URL |
|------|-----|
| 서버 노트북 (본체) | `http://localhost` |
| 같은 WiFi 기기 (모바일 등) | `http://10.10.1.129` |
| SSH | `ssh seong@10.10.1.129` |

> IP(`10.10.1.129`)는 재시작 시 바뀔 수 있음. 바뀌면 `ip addr show eth0 | grep "inet "` 으로 확인.

### 방화벽
| 포트 | 위치 | 용도 | 상태 |
|------|------|------|------|
| 22/tcp | ufw | SSH | ALLOW |
| 80/tcp | ufw | HTTP | ALLOW |
| 8080/tcp | ufw | 백엔드 내부 통신 | ALLOW (nginx → Spring Boot) |
| 80/tcp | Windows Defender | HTTP (외부 → WSL2) | ALLOW |
| 8080/tcp | Windows Defender | 백엔드 내부 통신 | ALLOW |

### 재배포 절차 (코드 변경 시)

```bash
cd ~/running-dashboard_2
bash deploy.sh
```

> **주의:** WSL2 Mirrored 모드에서 Gradle 데몬 소켓이 차단되어 `./gradlew bootJar`가 동작하지 않음.  
> `deploy.sh`는 `cmd.exe`를 통해 Windows 쪽 Gradle로 빌드 후 JAR을 복사하는 방식으로 우회.

### 서버 관리 명령어

```bash
# 백엔드 상태/로그
sudo systemctl status running-backend
tail -f ~/app.log

# nginx 재시작
sudo systemctl reload nginx

# 방화벽 상태
sudo ufw status
```

### WSL2 외부 접속 설정
WSL2는 기본적으로 가상 네트워크(`172.x.x.x`)에 격리되어 같은 WiFi 기기에서 접속 불가.
Mirrored 모드로 Windows와 네트워크를 공유하면 해결됨.

**설정 파일:** `C:\Users\seong\.wslconfig`
```
[wsl2]
networkingMode=mirrored
```

**Windows 방화벽 규칙 추가** (PowerShell 관리자 권한):
```powershell
New-NetFirewallRule -DisplayName "WSL2 Port 80" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

**WSL2 재시작** (PowerShell):
```powershell
wsl --shutdown
wsl
```

**주의:** IP(`10.10.1.129`)는 재시작 시 바뀔 수 있음. nginx `server_name`은 `_`(catch-all)로 설정되어 있어 IP 변경 영향 없음.

### 트러블슈팅 기록
| 문제 | 원인 | 해결 |
|------|------|------|
| PowerShell heredoc 깨짐 | 멀티라인 붙여넣기 시 줄바꿈 분리 | `sudo nano`로 직접 편집 |
| nginx 500 에러 | `www-data`가 `/home/seong/` 접근 불가 | `chmod o+x /home/seong`, `chmod -R o+r frontend/dist` |
| 같은 WiFi 기기 접속 불가 | WSL2 가상 네트워크 격리 | `.wslconfig` Mirrored 모드 + Windows 방화벽 규칙 추가 |
| 서버 본체(노트북)에서 접속 | 자기 자신이 서버라 IP로 접속 불가 | `http://localhost` 사용 |
| systemd JAR 실행 실패 | `ExecStart`에 `*.jar` 글로브 불가 | 파일명 직접 지정: `running-dashboard-0.0.1-SNAPSHOT.jar` |
| ufw 미설치 | 기본 설치 안 됨 | `sudo apt install -y ufw` |
| WSL2에서 `./gradlew bootJar` 실패 | WSL2 Mirrored 모드가 Gradle 데몬 TCP 소켓 차단 | `deploy.sh`로 Windows Gradle 빌드 후 JAR 복사 |

### 주의사항
- 같은 네트워크에서만 접속 가능 (내부 IP). 외부 접속은 공유기 포트포워딩 필요
- H2 File DB → 재시작해도 데이터 유지됨
- 프론트 빌드 후 nginx 권한 재확인 필요: `chmod -R o+r frontend/dist`
