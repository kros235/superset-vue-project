# ============================================
# 🆕 새로 생성하는 파일
# deploy.ps1 - Windows PowerShell 배포 스크립트
# ============================================

Write-Host "🚀 Apache Superset + Vue.js 챗봇 배포 시작" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# 1단계: 환경 확인
Write-Host ""
Write-Host "📋 1단계: 환경 확인 중..." -ForegroundColor Yellow

if (-Not (Test-Path "vue-frontend\.env.local")) {
    Write-Host "⚠️  .env.local 파일이 없습니다. 생성 중..." -ForegroundColor Yellow
    Copy-Item "vue-frontend\.env.local.example" "vue-frontend\.env.local"
    Write-Host "✅ .env.local 파일 생성 완료 (기본값 사용)" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local 파일 존재 확인" -ForegroundColor Green
}

# 2단계: 기존 컨테이너 정리
Write-Host ""
Write-Host "🧹 2단계: 기존 컨테이너 정리 중..." -ForegroundColor Yellow
docker-compose down
Write-Host "✅ 기존 컨테이너 종료 완료" -ForegroundColor Green

# 3단계: Docker 이미지 빌드
Write-Host ""
Write-Host "🔨 3단계: Docker 이미지 빌드 중..." -ForegroundColor Yellow
docker-compose build --no-cache vue-frontend
Write-Host "✅ Vue.js 프론트엔드 이미지 빌드 완료" -ForegroundColor Green

# 4단계: 컨테이너 시작
Write-Host ""
Write-Host "🚢 4단계: 컨테이너 시작 중..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✅ 모든 컨테이너 시작 완료" -ForegroundColor Green

# 5단계: 헬스체크
Write-Host ""
Write-Host "🏥 5단계: 서비스 헬스체크 중..." -ForegroundColor Yellow
Write-Host "   MariaDB 대기 중..."
Start-Sleep -Seconds 10

Write-Host "   Superset 대기 중..."
$supersetReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8088/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Superset 준비 완료" -ForegroundColor Green
            $supersetReady = $true
            break
        }
    } catch {
        Write-Host "   ⏳ Superset 시작 대기 중... ($i/30)"
        Start-Sleep -Seconds 2
    }
}

if (-Not $supersetReady) {
    Write-Host "   ⚠️  Superset 응답 없음 (계속 진행)" -ForegroundColor Yellow
}

Write-Host "   Vue.js 대기 중..."
$vueReady = $false
for ($i = 1; $i -le 20; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Vue.js 준비 완료" -ForegroundColor Green
            $vueReady = $true
            break
        }
    } catch {
        Write-Host "   ⏳ Vue.js 시작 대기 중... ($i/20)"
        Start-Sleep -Seconds 2
    }
}

if (-Not $vueReady) {
    Write-Host "   ⚠️  Vue.js 응답 없음 (계속 진행)" -ForegroundColor Yellow
}

# 6단계: 완료
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✨ 배포 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 접속 주소:" -ForegroundColor Cyan
Write-Host "   - Vue.js 앱:  http://localhost:8080"
Write-Host "   - Superset:   http://localhost:8088 (admin/admin)"
Write-Host ""
Write-Host "🔍 실시간 로그 보기:" -ForegroundColor Cyan
Write-Host "   docker-compose logs -f vue-frontend"
Write-Host ""
Write-Host "🛑 중지하기:" -ForegroundColor Cyan
Write-Host "   docker-compose down"
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

# 브라우저 자동 열기 (선택)
$response = Read-Host "브라우저를 자동으로 여시겠습니까? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Start-Process "http://localhost:8080"
}

# 로그 확인 (선택)
$response = Read-Host "실시간 로그를 보시겠습니까? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    docker-compose logs -f vue-frontend
}