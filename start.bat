@echo off
REM ============================================
REM 🆕 새로 생성하는 파일
REM start.bat - 가장 간단한 시작 스크립트
REM ============================================

echo 🚀 빠른 시작 스크립트
echo ============================================
echo.

REM 환경변수 파일 확인 및 생성
if not exist "vue-frontend\.env.local" (
    echo ⚠️  .env.local 파일 생성 중...
    copy "vue-frontend\.env.local.example" "vue-frontend\.env.local" >nul
    echo ✅ 완료
)

REM Docker 컨테이너 시작
echo 🚢 Docker 컨테이너 시작 중...
docker-compose up -d

REM 대기
echo ⏳ 서비스 시작 대기 중 (30초)...
timeout /t 30 /nobreak >nul

REM 완료
echo.
echo ✅ 시작 완료!
echo.
echo 📍 Vue.js 앱: http://localhost:8080
echo 📍 Superset: http://localhost:8088 (admin/admin)
echo.

REM 브라우저 열기
set /p response="브라우저를 여시겠습니까? (Y/N): "
if /i "%response%"=="Y" start http://localhost:8080

pause