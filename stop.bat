@echo off
REM ============================================
REM 🆕 새로 생성하는 파일
REM stop.bat - 컨테이너 중지 스크립트
REM ============================================

echo 🛑 컨테이너 중지 중...
docker-compose down

echo.
echo ✅ 모든 컨테이너가 중지되었습니다.
echo.

pause