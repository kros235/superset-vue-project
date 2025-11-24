# ============================================
# 🆕 새로 생성하는 파일
# test-chatbot.ps1 - Windows PowerShell 테스트 스크립트
# ============================================

Write-Host "🧪 챗봇 기능 테스트 시작" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# 1. 컨테이너 상태 확인
Write-Host ""
Write-Host "1️⃣ 컨테이너 상태 확인..." -ForegroundColor Yellow

$containers = docker ps --format "{{.Names}}"
if ($containers -notcontains "vue_frontend") {
    Write-Host "❌ Vue.js 컨테이너가 실행 중이 아닙니다." -ForegroundColor Red
    Write-Host "   다음 명령으로 시작하세요: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Vue.js 컨테이너 실행 중" -ForegroundColor Green

# 2. 환경변수 확인
Write-Host ""
Write-Host "2️⃣ 환경변수 확인..." -ForegroundColor Yellow

if (-Not (Test-Path "vue-frontend\.env.local")) {
    Write-Host "❌ .env.local 파일이 없습니다." -ForegroundColor Red
    exit 1
}

# Claude API 키 확인
$envContent = Get-Content "vue-frontend\.env.local" -Raw
if ($envContent -match "your_claude_api_key_here") {
    Write-Host "⚠️  Claude API 키가 설정되지 않음 → 키워드 기반 폴백 사용" -ForegroundColor Yellow
} else {
    Write-Host "✅ Claude API 키 설정됨 → AI 기능 활성화" -ForegroundColor Green
}

# 3. 필수 파일 확인
Write-Host ""
Write-Host "3️⃣ 필수 파일 확인..." -ForegroundColor Yellow

$files = @(
    "vue-frontend\src\components\ChartChatbot.vue",
    "vue-frontend\src\services\nlpChartService.js",
    "vue-frontend\src\views\ChartBuilder.vue"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ 파일 존재: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ 파일 없음: $file" -ForegroundColor Red
        $allExist = $false
    }
}

if (-Not $allExist) {
    Write-Host ""
    Write-Host "❌ 필수 파일이 누락되었습니다." -ForegroundColor Red
    exit 1
}

# 4. 웹 서비스 접근 테스트
Write-Host ""
Write-Host "4️⃣ 웹 서비스 접근 테스트..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Vue.js 앱 접근 가능" -ForegroundColor Green
} catch {
    Write-Host "❌ Vue.js 앱에 접근할 수 없습니다." -ForegroundColor Red
    exit 1
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8088/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Superset 접근 가능" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Superset에 접근할 수 없습니다." -ForegroundColor Yellow
}

# 5. 로그 확인
Write-Host ""
Write-Host "5️⃣ Vue.js 컨테이너 최근 로그..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
docker logs --tail=20 vue_frontend
Write-Host "----------------------------------------"

# 6. 테스트 가이드
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ 모든 사전 확인 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 다음 단계로 수동 테스트를 진행하세요:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 브라우저에서 http://localhost:8080 접속"
Write-Host "2. 로그인 (admin / admin)"
Write-Host "3. '차트 빌더' 메뉴 클릭"
Write-Host "4. 1단계에서 데이터셋 선택 (예: sales)"
Write-Host "5. 'AI 차트 생성' 버튼 클릭 (데이터셋 선택 후 나타남)"
Write-Host "6. 챗봇에 입력 예시:"
Write-Host "   - '판매량을 막대차트로 보여줘'"
Write-Host "   - '2025년 지역별 총 매출을 선 차트로'"
Write-Host "   - '고객 유형별 비율을 파이차트로'"
Write-Host ""
Write-Host "🔍 문제 발생 시:" -ForegroundColor Cyan
Write-Host "   - 브라우저 콘솔(F12) 확인"
Write-Host "   - docker logs -f vue_frontend"
Write-Host "   - CHATBOT_TEST_GUIDE.md 참고"
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

# 브라우저 자동 열기 (선택)
$response = Read-Host "브라우저를 자동으로 여시겠습니까? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Start-Process "http://localhost:8080"
}