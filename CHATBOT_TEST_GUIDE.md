# 🤖 AI 챗봇 테스트 가이드

## 📋 사전 준비

### 1. 환경 설정 확인
```bash
# vue-frontend/.env.local 파일이 있는지 확인
ls vue-frontend/.env.local

# 없다면 생성
cp vue-frontend/.env.local.example vue-frontend/.env.local
```

### 2. Claude API 키 설정 (선택)

`.env.local` 파일을 열고:
```bash
# Claude API 키 입력 (있는 경우)
VUE_APP_CLAUDE_API_KEY=sk-ant-api03-your_actual_key_here

# 없다면 키워드 기반 폴백만 사용
VUE_APP_CLAUDE_API_KEY=your_claude_api_key_here
VUE_APP_NLP_FALLBACK_ENABLED=true
```

### 3. 컨테이너 재시작
```bash
docker-compose restart vue-frontend
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 기본 막대 차트 생성

**단계:**
1. http://localhost:8080 접속
2. 로그인 (admin / admin)
3. "차트 빌더" 메뉴 클릭
4. 1단계에서 데이터셋 선택 (예: `sales`)
5. "AI 차트 생성" 버튼 클릭
6. 챗봇에 입력: **"판매량을 막대차트로 보여줘"**

**예상 결과:**
- ✅ 차트 타입: `bar`
- ✅ 메트릭: `SUM(quantity)` 또는 `count`
- ✅ 그룹화: 자동 추론
- ✅ "이 설정으로 차트 만들기" 버튼 표시

---

### 시나리오 2: 필터 포함 복잡한 요청

**입력 예시:**
```
2025년 지역별 총 매출을 선 차트로 만들어줘
```

**예상 결과:**
- ✅ 차트 타입: `line`
- ✅ 메트릭: `SUM(total_amount)`
- ✅ 그룹화: `region`
- ✅ 필터: `year == 2025`

---

### 시나리오 3: 파이 차트

**입력 예시:**
```
고객 유형별 비율을 파이차트로
```

**예상 결과:**
- ✅ 차트 타입: `pie`
- ✅ 메트릭: `COUNT(*)`
- ✅ 그룹화: `customer_type`

---

### 시나리오 4: 차트 적용 및 수정

**단계:**
1. 챗봇으로 차트 생성
2. "이 설정으로 차트 만들기" 클릭
3. 4단계(차트 정보)로 이동 확인
4. 차트 이름 수정
5. "다음 단계" → 미리보기 확인
6. "차트 저장"

**예상 결과:**
- ✅ 자동으로 4단계로 이동
- ✅ 차트 설정이 정확히 적용됨
- ✅ 미리보기 정상 작동
- ✅ Superset에 차트 저장 성공

---

## 🔍 디버깅 체크리스트

### 브라우저 콘솔 확인사항
```javascript
// 1. NLP 서비스 초기화 로그
✅ Claude API 키 감지됨 - AI 기능 활성화
// 또는
⚠️ Claude API 키 없음 - 키워드 기반 폴백만 사용

// 2. 차트 요청 분석 로그
🤖 NLP 차트 요청 분석 시작
✨ Claude API 사용 시도...
// 또는
🔄 키워드 기반 폴백 사용

// 3. 파싱 결과
✅ Claude API 파싱 완료: { chart_type: 'bar', metrics: [...], ... }
```

### 네트워크 탭 확인

**Claude API 사용 시:**
```
POST https://api.anthropic.com/v1/messages
Status: 200 OK
```

**Superset API 호출:**
```
GET /api/v1/dataset/{id}/column
Status: 200 OK
```

---

## ❌ 문제 해결

### 1. "Claude API 키 없음" 경고

**원인:** `.env.local` 파일이 없거나 API 키가 설정되지 않음

**해결:**
```bash
cd vue-frontend
cp .env.local.example .env.local
# .env.local 파일 편집하여 키 입력
docker-compose restart vue-frontend
```

---

### 2. 챗봇 모달이 열리지 않음

**원인:** 데이터셋 미선택

**해결:**
- 1단계에서 반드시 데이터셋을 먼저 선택

---

### 3. "차트 설정 적용" 후 아무 변화 없음

**원인:** `handleChatbotGenerated` 이벤트 미처리

**해결:**
- `ChartBuilder.vue`의 `@chart-generated` 핸들러 확인
- 브라우저 콘솔에서 에러 로그 확인

---

### 4. 키워드 기반 분석이 부정확함

**원인:** 제한적인 키워드 매칭

**해결:**
- Claude API 키를 설정하여 AI 기능 활성화
- 또는 더 구체적인 키워드 사용
  - ❌ "차트 만들어줘"
  - ✅ "매출 합계를 막대차트로"

---

## 📊 테스트 결과 기록

| 시나리오 | 입력 | 차트 타입 | 메트릭 | 결과 | 비고 |
|---------|------|----------|--------|------|------|
| 1 | "판매량을 막대차트로" | bar | SUM(quantity) | ✅ | - |
| 2 | "2025년 지역별 매출" | line | SUM(total_amount) | ✅ | 필터 적용 |
| 3 | "고객 유형별 비율" | pie | COUNT(*) | ✅ | - |
| ... | ... | ... | ... | ... | ... |

---

## 🎯 다음 개선 사항

- [ ] 다중 메트릭 지원
- [ ] 복잡한 필터 조건 (AND/OR)
- [ ] 시계열 차트 자동 감지
- [ ] 차트 스타일 옵션 추론
- [ ] 대화 컨텍스트 유지

---

## 📞 문제 발생 시

1. 브라우저 콘솔 로그 캡처
2. 네트워크 탭 HAR 파일 저장
3. `.env.local` 설정 확인 (API 키 제외)
4. GitHub Issue에 보고