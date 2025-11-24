# ============================================
# 🆕 새로 생성하는 파일
# logs.ps1 - Windows PowerShell 로그 모니터링 스크립트
# ============================================

Write-Host "📊 실시간 로그 모니터링" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ctrl+C로 종료할 수 있습니다." -ForegroundColor Yellow
Write-Host ""

# 서비스 선택 메뉴
Write-Host "모니터링할 서비스를 선택하세요:" -ForegroundColor Cyan
Write-Host "1. Vue.js 프론트엔드"
Write-Host "2. Superset"
Write-Host "3. MariaDB"
Write-Host "4. Redis"
Write-Host "5. 모든 서비스"
Write-Host "6. 종료"
Write-Host ""

$choice = Read-Host "번호를 입력하세요 (1-6)"

switch ($choice) {
    "1" {
        Write-Host "🔍 Vue.js 로그 모니터링 시작..." -ForegroundColor Green
        docker-compose logs -f vue-frontend
    }
    "2" {
        Write-Host "🔍 Superset 로그 모니터링 시작..." -ForegroundColor Green
        docker-compose logs -f superset
    }
    "3" {
        Write-Host "🔍 MariaDB 로그 모니터링 시작..." -ForegroundColor Green
        docker-compose logs -f mariadb
    }
    "4" {
        Write-Host "🔍 Redis 로그 모니터링 시작..." -ForegroundColor Green
        docker-compose logs -f redis
    }
    "5" {
        Write-Host "🔍 모든 서비스 로그 모니터링 시작..." -ForegroundColor Green
        docker-compose logs -f
    }
    "6" {
        Write-Host "종료합니다." -ForegroundColor Yellow
    }
    default {
        Write-Host "잘못된 선택입니다. 1-6 사이의 숫자를 선택하세요." -ForegroundColor Red
    }
}