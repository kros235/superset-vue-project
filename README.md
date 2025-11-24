# Superset Vue.js Dashboard Project

Apache Superset과 Vue.js를 연동한 대시보드 프로젝트입니다.

## 🚀 프로젝트 개요

이 프로젝트는 Apache Superset의 기능을 Vue.js 웹 애플리케이션에서 직접 호출하여 사용할 수 있는 커스텀 대시보드를 구축하는 것을 목표로 합니다.

### 주요 기능
- **✅ 데이터 소스 선택 및 관리** (Apache Superset API 호출)
- **✅ 데이터셋 구성** (Apache Superset API 호출)
- **✅ 다양한 차트 타입 지원** (Apache Superset API 호출)
- **✅ 차트 세부 옵션 설정** (Apache Superset API 호출) **← 🆕 동적 옵션 시스템 완성**
- **✅ 대시보드 생성 및 관리** (Apache Superset API 호출)
- **✅ 차트 내보내기 기능** (JSON, CSV, HTML 테이블/차트, PNG, iframe 임베드) **← 🆕 추가**
- **✅ 차트 프리셋 시스템** **← 🆕 추가**
- **🔄 사용자별 권한 관리** (Apache Superset API 호출) **← 진행 중**
- **🔄 역할별 접근 제어** (Apache Superset API 호출) **← 진행 중**
- **🔄 Row-Level Security (RLS)** **← 계획 중**

**중요**: 모든 기능은 Apache Superset의 기능을 API로 호출하여 구현됩니다. Vue.js에서 독립적으로 구현하지 않습니다.

---

## 🏗️ 시스템 아키텍처

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Vue.js    │    │   Apache    │    │   MariaDB   │
│  Frontend   │◄──►│  Superset   │◄──►│  Database   │
│  (Port:8080)│    │ (Port:8088) │    │ (Port:3306) │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │    Redis    │
                   │   (Cache)   │
                   │ (Port:6379) │
                   └─────────────┘
```

---

## 🛠️ 기술 스택

### Backend
- **Apache Superset 3.1.0**: 데이터 시각화 및 분석 엔진
- **MariaDB 10.6**: 메인 데이터베이스
- **Redis**: 캐싱 시스템

### Frontend
- **Vue.js 3**: 사용자 인터페이스 프레임워크
- **Ant Design Vue**: UI 컴포넌트 라이브러리
- **Axios**: HTTP 클라이언트 (Superset API 호출)
- **Vue Router**: 라우팅
- **Rison**: Superset API 파라미터 인코딩 **← 🆕 추가**

### DevOps
- **Docker & Docker Compose**: 컨테이너화
- **Windows 10**: 개발 환경

---

## 📦 설치 및 실행

### 사전 요구사항
- Docker Desktop for Windows
- Windows 10 환경
- Git (선택사항)

### 실행 방법

1. **저장소 클론**
   ```bash
   git clone https://github.com/kros235/superset-vue-project.git
   cd superset-vue-project
   ```

2. **Docker 컨테이너 실행**
   ```bash
   docker-compose up -d
   ```

3. **초기 Superset 설정**
   ```bash
   # Superset 초기화 (최초 실행시만)
   docker exec -it superset_app superset db upgrade
   docker exec -it superset_app superset fab create-admin \
     --username admin \
     --firstname Superset \
     --lastname Admin \
     --email admin@superset.com \
     --password admin
   docker exec -it superset_app superset init
   ```

4. **서비스 접속**
   - **Vue.js App**: http://localhost:8080
   - **Superset**: http://localhost:8088 (admin/admin)
   - **MariaDB**: localhost:3306

### 데이터베이스 연결 설정

Superset에서 MariaDB 연결:
```
DISPLAY NAME: Sample Dashboard DB
SQLALCHEMY URI: mysql+pymysql://superset:superset123@mariadb:3306/sample_dashboard
```

---

## 📁 프로젝트 구조 **← 🆕 확장됨**

```
superset-vue-project/
├── docker-compose.yml              # Docker Compose 설정
├── Dockerfile.superset             # Superset 커스텀 이미지
├── superset_config.py              # Superset 설정 파일
├── database/
│   └── init/
│       ├── 01-create-database.sql  # 초기 데이터베이스 스키마
│       └── 02-sample-data.sql      # 샘플 데이터 (30개 레코드) **← 🆕 추가**
│       └── 03-rls-test-data.sql    # RLS 테스트 데이터 **← 🆕 추가 (계획)**
├── vue-frontend/                   # Vue.js 프론트엔드
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   └── src/
│       ├── App.vue
│       ├── main.js
│       ├── router/
│       │   └── index.js            # 라우팅 설정
│       ├── views/                  # 페이지 컴포넌트 **← 🆕 추가**
│       │   ├── Dashboard.vue       # 대시보드 메인 페이지
│       │   ├── ChartBuilder.vue    # 차트 빌더 페이지
│       │   ├── DataSources.vue     # 데이터 소스 관리
│       │   ├── UserManagement.vue  # 사용자 관리 페이지
│       │   └── Login.vue           # 로그인 페이지
│       ├── components/
│       │   ├── Layout.vue          # 레이아웃
│       │   ├── chart-builder/      # 차트 빌더 컴포넌트 **← 🆕 추가**
│       │   │   ├── DatasetSelection.vue        # 1단계: 데이터셋 선택
│       │   │   ├── ChartTypeSelection.vue      # 2단계: 차트 타입 선택
│       │   │   ├── ChartConfiguration.vue      # 3단계: 차트 설정
│       │   │   ├── DynamicChartOptions.vue     # 동적 차트 옵션 **← 🆕 핵심**
│       │   │   ├── ChartDetails.vue            # 4단계: 차트 상세 정보
│       │   │   ├── ChartPreview.vue            # 5단계: 미리보기 & 저장
│       │   │   └── options/                    # 옵션 컴포넌트들 **← 🆕**
│       │   │       ├── TextOption.vue
│       │   │       ├── NumberOption.vue
│       │   │       ├── SelectOption.vue
│       │   │       ├── CheckboxOption.vue
│       │   │       ├── MetricSelectOption.vue
│       │   │       ├── ColumnSelectOption.vue
│       │   │       ├── FilterOption.vue
│       │   │       └── TextareaOption.vue
│       │   └── DataSourceManager.vue
│       ├── services/
│       │   ├── supersetAPI.js      # Superset API 호출 서비스 **← 🔧 확장**
│       │   └── authService.js      # 인증 서비스 **← 🔧 확장**
│       └── utils/
│           ├── constants.js        # 상수
│           ├── chartOptions.js     # 차트 옵션 정의 **← 🆕 핵심**
│           └── chartPresets.js     # 차트 프리셋 **← 🆕 추가**
└── README.md
```

---

## 🗄️ 샘플 데이터베이스

프로젝트에는 대시보드 구성을 위한 샘플 테이블들이 자동으로 생성됩니다.

### 테이블 구조

#### 기본 분석용 테이블 (각 30개 레코드)
- **users**: 사용자 정보
  - id, name, email, department, join_date, salary, position, status
- **sales**: 판매 데이터
  - id, sale_date, product_name, quantity, unit_price, total_amount, salesperson, region, customer_type
- **web_traffic**: 웹사이트 트래픽
  - id, visit_date, unique_visitors, page_views, bounce_rate, session_duration, traffic_source, device_type
- **customer_satisfaction**: 고객 만족도
  - id, survey_date, rating, category, feedback, customer_age_group, response_time_hours

#### **🆕 RLS 테스트용 테이블 (계획 중)**
- **employees**: 직원 데이터
  - id, name, email, company, team, position (책임/선임/전임), hire_date
  - 회사: 'KT DS', '알앤비소프트'
  - 팀: 'CRM서비스팀', '데이터분석팀', '인프라팀' 등

### 샘플 대시보드 구성
4개의 차트로 구성된 대시보드를 생성할 수 있습니다:
1. **월별 매출 현황** (sales 테이블 기반)
2. **웹사이트 트래픽 분석** (web_traffic 테이블 기반)
3. **부서별 직원 현황** (users 테이블 기반)
4. **고객 만족도 트렌드** (customer_satisfaction 테이블 기반)

---

## 🎨 차트 빌더 기능 **← 🆕 핵심 기능**

Vue.js 웹페이지 내에서 Apache Superset UI와 동일한 방식으로 차트를 생성할 수 있습니다.

### 5단계 차트 생성 프로세스

```
1. 데이터셋 선택
   ↓
2. 차트 타입 선택 (테이블, 막대, 선, 파이, 에어리어, 산점도)
   ↓
3. 차트 옵션 설정 (동적 옵션 시스템)
   ↓
4. 차트 상세 정보 입력 (제목, 설명)
   ↓
5. 미리보기 & 저장
```

### **🆕 동적 차트 옵션 시스템**

차트 타입별로 사용 가능한 모든 옵션을 자동으로 렌더링합니다.

#### 지원하는 옵션 타입:
- **Text**: 텍스트 입력
- **Number**: 숫자 입력
- **Select**: 드롭다운 선택
- **Checkbox**: 체크박스
- **MetricSelect**: 메트릭 선택 (집계 함수 포함: SUM, AVG, COUNT, MAX, MIN)
- **ColumnSelect**: 컬럼 선택
- **Filter**: 필터 조건 설정
- **Textarea**: 긴 텍스트 입력

#### 차트별 옵션 예시:

**테이블 차트**
- DATA 탭: 메트릭, 그룹 기준, 행 제한, 필터
- CUSTOMIZE 탭: 페이지 크기, 검색 포함, 셀 막대 표시, 조건부 서식

**막대 차트**
- DATA 탭: 메트릭, 그룹 기준, 행 제한
- CUSTOMIZE 탭: 색상 테마, 범례 표시, 축 레이블, 막대 방향

**선 차트**
- DATA 탭: 메트릭, 시계열 컬럼, 그룹 기준
- CUSTOMIZE 탭: 보간 방법, 마커 표시, 범례 위치, Y축 범위

**파이 차트**
- DATA 탭: 메트릭, 그룹 기준
- CUSTOMIZE 탭: 도넛 차트, 레이블 표시, 색상 테마

### **🆕 차트 프리셋 시스템**

자주 사용하는 차트 설정을 프리셋으로 저장하여 빠르게 적용할 수 있습니다.

**기본 제공 프리셋:**
- 📊 **월별 매출 차트**: 선 차트 기반, 시계열 그룹화
- 📈 **부서별 판매 순위**: 막대 차트 기반, 정렬 적용
- 🥧 **지역별 매출 비율**: 파이 차트 기반, 비율 표시
- 📋 **상세 데이터 테이블**: 테이블 차트 기반, 검색 및 정렬

### **🆕 차트 내보내기 기능**

생성된 차트를 다양한 형식으로 내보낼 수 있습니다.

#### 지원 형식:
1. **JSON** 형식 내보내기
   - 차트 데이터와 설정을 JSON으로 저장
   
2. **CSV** 형식 내보내기
   - 차트의 원본 데이터를 CSV로 다운로드
   
3. **HTML 테이블** 내보내기
   - 스타일이 적용된 HTML 테이블로 변환
   - 클립보드 복사 또는 HTML 파일 다운로드
   
4. **HTML 차트** 내보내기
   - Chart.js 기반의 독립 실행 가능한 HTML 파일
   - 외부 의존성 없이 웹 브라우저에서 바로 실행
   
5. **PNG 이미지** 내보내기
   - 차트를 PNG 이미지로 캡처하여 다운로드
   
6. **iframe 임베드** 코드
   - Superset 네이티브 차트를 임베드할 수 있는 iframe 코드 생성
   - 복사하여 외부 웹페이지에 붙여넣기

---

## 🔗 Superset API 연동

Vue.js 앱에서 Superset API를 호출하여 다음 기능들을 구현합니다.

### 주요 API 엔드포인트

#### 인증
- `POST /api/v1/security/login` - 로그인
- `GET /api/v1/me/` - 현재 사용자 정보
- `GET /api/v1/security/csrf_token/` - CSRF 토큰

#### 차트
- `GET /api/v1/chart/` - 차트 목록 조회
- `POST /api/v1/chart/` - 차트 생성
- `PUT /api/v1/chart/{id}` - 차트 수정
- `DELETE /api/v1/chart/{id}` - 차트 삭제
- `POST /api/v1/chart/data` - 차트 데이터 조회 (Rison 인코딩 필요) **← 🆕 구현**

#### 데이터셋
- `GET /api/v1/dataset/` - 데이터셋 목록
- `POST /api/v1/dataset/` - 데이터셋 생성
- `GET /api/v1/dataset/{id}` - 데이터셋 상세 조회
- `GET /api/v1/dataset/{id}/column` - 데이터셋 컬럼 조회 **← 🆕 구현**

#### 데이터베이스
- `GET /api/v1/database/` - 데이터베이스 목록
- `POST /api/v1/database/` - 데이터베이스 연결
- `POST /api/v1/database/test_connection` - 연결 테스트

#### 대시보드
- `GET /api/v1/dashboard/` - 대시보드 목록
- `POST /api/v1/dashboard/` - 대시보드 생성
- `PUT /api/v1/dashboard/{id}` - 대시보드 수정

#### **🆕 사용자 관리**
- `GET /api/v1/security/user/` - 사용자 목록
- `POST /api/v1/security/user/` - 사용자 생성
- `PUT /api/v1/security/user/{id}` - 사용자 수정
- `GET /api/v1/security/roles/` - 역할 목록

### **🔄 사용자 권한 관리 (진행 중)**

#### 역할(Role) 시스템
- **Admin**: 모든 권한
- **Alpha**: 차트 및 대시보드 생성/수정 가능
- **Gamma**: 읽기 전용, 할당된 리소스만 접근

#### 구현된 기능
- ✅ 역할별 메뉴 표시 제어
- ✅ 차트 생성/수정 권한 체크
- ✅ 데이터베이스 연결 권한 체크
- ✅ 사용자 관리 UI

#### **🔄 계획 중: Row-Level Security (RLS)**

사용자별로 데이터 접근 범위를 제한하는 기능입니다.

**예시 시나리오:**
- **C 유저 (회사 회장)**: 전체 회사 데이터 조회 가능
- **D 유저 (CRM서비스팀 팀장)**: CRM서비스팀 소속 데이터만 조회
- **F 유저 (알앤비소프트 이사)**: 알앤비소프트 회사 데이터만 조회

**구현 방법:**
1. Superset의 RLS 필터 설정
2. 데이터셋에 필터 조건 추가
3. 사용자별 필터 규칙 매핑

---

## 🔧 개발 환경 설정

### Vue.js Frontend 개발
```bash
cd vue-frontend
npm install
npm run serve
```

### 컨테이너 로그 확인
```bash
# 전체 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f superset
docker-compose logs -f vue-frontend
docker-compose logs -f mariadb
```

### 데이터베이스 직접 접속
```bash
# MariaDB 컨테이너 접속
docker exec -it superset_mariadb mysql -u superset -p
# 패스워드: superset123

### **🆕 Claude API 키 설정 (AI 챗봇 기능용)**

AI 차트 생성 챗봇 기능을 사용하려면 Claude API 키가 필요합니다.

#### 1. Claude API 키 발급

1. [Anthropic Console](https://console.anthropic.com)에 접속
2. 계정 생성 또는 로그인
3. "API Keys" 메뉴에서 새 API 키 생성
4. 생성된 키 복사 (형식: `sk-ant-api03-...`)

#### 2. 환경변수 파일 생성
```bash
# vue-frontend 디렉토리로 이동
cd vue-frontend

# .env.local.example을 복사하여 .env.local 생성
cp .env.local.example .env.local
```

#### 3. API 키 설정

`.env.local` 파일을 열고 다음과 같이 설정:
```bash
# Claude API 설정
VUE_APP_CLAUDE_API_KEY=sk-ant-api03-your_actual_api_key_here
VUE_APP_CLAUDE_API_URL=https://api.anthropic.com/v1/messages
VUE_APP_CLAUDE_MODEL=claude-sonnet-4-20250514

# NLP 챗봇 설정
VUE_APP_NLP_FALLBACK_ENABLED=true
VUE_APP_NLP_MIN_CONFIDENCE=0.7
```

#### 4. 컨테이너 재시작
```bash
# 프로젝트 루트 디렉토리에서
docker-compose restart vue-frontend
```

#### ⚠️ 주의사항

- **`.env.local` 파일은 절대 Git에 커밋하지 마세요!** (이미 .gitignore에 포함됨)
- API 키는 외부에 노출되지 않도록 주의하세요
- 키워드 기반 폴백 기능은 API 키 없이도 작동합니다
- 프로덕션 환경에서는 환경변수를 서버 설정으로 관리하세요

#### 📊 기능 비교

| 기능 | Claude API | 키워드 기반 폴백 |
|------|------------|-----------------|
| 자연어 이해 | ⭐⭐⭐⭐⭐ 매우 우수 | ⭐⭐⭐ 보통 |
| 복잡한 요청 처리 | ✅ 가능 | ⚠️ 제한적 |
| 컨텍스트 이해 | ✅ 우수 | ❌ 없음 |
| API 키 필요 | ✅ 필수 | ❌ 불필요 |
| 비용 | 💰 유료 | 🆓 무료 |

### Vue.js Frontend 개발
```bash
cd vue-frontend
npm install
npm run serve
```

---

## 🚨 문제 해결

### 일반적인 문제들

1. **MySQL 드라이버 오류**
   ```bash
   docker exec -it superset_app pip install PyMySQL
   docker-compose restart superset
   ```

2. **Vue.js 앱이 시작되지 않는 경우**
   ```bash
   docker-compose restart vue-frontend
   ```

3. **데이터베이스 연결 실패**
   - MariaDB 컨테이너가 정상 실행 중인지 확인
   - 연결 URI가 올바른지 확인: `mysql+pymysql://superset:superset123@mariadb:3306/sample_dashboard`

4. **CORS 오류**
   - `superset_config.py`에서 CORS 설정 확인
   - Vue.js 앱의 프록시 설정 확인

5. **차트 데이터 조회 실패** **← 🆕 추가**
   - Rison 파라미터 인코딩 확인
   - 데이터셋 ID와 컬럼명 정확성 확인
   - 브라우저 콘솔에서 API 응답 확인

6. **컨테이너 재시작**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## 📝 개발 로드맵

### **Phase 1: 기본 환경 구성 ✅ 완료**
- [x] Docker 환경 설정
- [x] Superset, Vue.js, MariaDB 컨테이너 구성
- [x] 샘플 데이터베이스 생성
- [x] 초기 인증 시스템 구현

### **Phase 2: Vue.js 컴포넌트 개발 ✅ 완료**
- [x] 로그인/인증 시스템 구현
- [x] 데이터 소스 관리 컴포넌트
- [x] 차트 빌더 인터페이스 (5단계 프로세스)
- [x] 대시보드 레이아웃 시스템

### **Phase 3: Superset API 연동 ✅ 완료**
- [x] 모든 차트 생성 과정을 Vue.js에서 조작
- [x] 데이터셋 구성 기능
- [x] 차트 옵션 설정 기능 (동적 옵션 시스템)
- [x] 대시보드 구성 기능
- [x] 차트 프리셋 시스템 **← 🆕**
- [x] 다중 내보내기 기능 **← 🆕**

### **Phase 4: 권한 관리 시스템 🔄 진행 중**
- [x] 사용자별 데이터 소스 접근 권한 (기본 구현)
- [x] 역할별 UI 차이
- [x] 차트/대시보드 공유 기능
- [ ] Row-Level Security (RLS) 구현 **← 🎯 다음 단계**
- [ ] 세밀한 권한 제어 (데이터셋, 스키마, 테이블 레벨)

### **Phase 5: 고도화 🔮 계획**
- [ ] 실시간 데이터 업데이트
- [ ] 고급 차트 옵션 (커스텀 SQL, 파라미터)
- [ ] 모바일 반응형 UI
- [ ] 프로덕션 배포 설정
- [ ] 성능 최적화 (캐싱, 레이지 로딩)

---

## 🌐 환경별 설정

### 개발 환경 (Windows 10)
- Docker Desktop 사용
- 로컬 개발 서버: Vue.js devserver
- 디버깅 모드 활성화
- Hot Module Replacement (HMR) 지원

### 프로덕션 환경
- Nginx 리버스 프록시 설정
- HTTPS 인증서 구성
- 환경 변수 보안 강화
- 컨테이너 리소스 최적화

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 📞 연락처

프로젝트 링크: [https://github.com/kros235/superset-vue-project](https://github.com/kros235/superset-vue-project)

---

## 🔍 주요 업데이트 이력

### **2025-01-XX** **← 🆕 최신 업데이트**
- ✅ 동적 차트 옵션 시스템 구현 완료
- ✅ 차트 프리셋 기능 추가
- ✅ 다중 내보내기 기능 추가 (JSON, CSV, HTML, PNG, iframe)
- ✅ 사용자 관리 UI 구현
- 🔄 Row-Level Security (RLS) 구현 준비 중

### 2025-01-15
- ✅ 5단계 차트 빌더 프로세스 완성
- ✅ 기본 권한 관리 시스템 구현

### 2025-01-10
- ✅ Docker 환경 구성 완료
- ✅ 샘플 데이터베이스 생성

---

## ⚠️ 주의사항

- 이 프로젝트는 **개발 목적**으로 만들어졌습니다. 프로덕션 환경에서 사용하기 전에 보안 설정을 강화해야 합니다.
- 모든 차트 및 대시보드 기능은 **Apache Superset의 API를 호출하여 구현**됩니다.
- Windows 10 환경에서 Docker Desktop을 사용하여 개발되었습니다.
- **Superset 버전 3.1.0**을 사용합니다. 다른 버전 사용 시 API 호환성을 확인하세요.
- **하드코딩 금지**: 모든 설정은 환경 변수 또는 설정 파일을 통해 관리됩니다.

---

## 🎯 프로젝트 목표 달성도

```
✅ 완료: ████████████████████ 75%
🔄 진행: ████░░░░░░░░░░░░░░░░ 20%
🔮 계획: █░░░░░░░░░░░░░░░░░░░  5%
```

**주요 마일스톤:**
- ✅ Docker 환경 구성
- ✅ 차트 빌더 5단계 프로세스
- ✅ 동적 옵션 시스템
- ✅ 차트 내보내기 기능
- 🔄 권한 관리 시스템
- 🔮 Row-Level Security (RLS)
- 🔮 프로덕션 배포

---

**마지막 업데이트**: 2025-01-XX  
**프로젝트 상태**: 🟢 Active Development