# Superset Vue.js Dashboard Project

Apache Superset과 Vue.js를 연동한 대시보드 프로젝트입니다.

## 🚀 프로젝트 개요

이 프로젝트는 Apache Superset의 기능을 Vue.js 웹 애플리케이션에서 직접 호출하여 사용할 수 있는 커스텀 대시보드를 구축하는 것을 목표로 합니다.

### 주요 기능
- 데이터 소스 선택 및 관리 (Apache Superset API 호출)
- 데이터셋 구성 (Apache Superset API 호출)
- 다양한 차트 타입 지원 (Apache Superset API 호출)
- 차트 세부 옵션 설정 (Apache Superset API 호출)
- 대시보드 생성 및 관리 (Apache Superset API 호출)
- 사용자별 권한 관리 (Apache Superset API 호출)
- 역할별 접근 제어 (Apache Superset API 호출)

**중요**: 모든 기능은 Apache Superset의 기능을 API로 호출하여 구현됩니다. Vue.js에서 독립적으로 구현하지 않습니다.

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

## 🛠️ 기술 스택

### Backend
- **Apache Superset**: 데이터 시각화 및 분석 엔진
- **MariaDB**: 메인 데이터베이스
- **Redis**: 캐싱 시스템

### Frontend
- **Vue.js 3**: 사용자 인터페이스 프레임워크
- **Ant Design Vue**: UI 컴포넌트 라이브러리
- **Axios**: HTTP 클라이언트 (Superset API 호출)
- **Vue Router**: 라우팅

### DevOps
- **Docker & Docker Compose**: 컨테이너화
- **Windows 10**: 개발 환경

## 📦 설치 및 실행

### 사전 요구사항
- Docker Desktop for Windows
- Windows 10 환경
- Git (선택사항)

### 실행 방법

1. **저장소 클론**
   ```bash
   git clone https://github.com/[your-username]/superset-vue-project.git
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

## 📁 프로젝트 구조

```
superset-vue-project/
├── docker-compose.yml              # Docker Compose 설정
├── docker/
│   └── superset/
│       └── Dockerfile              # Superset 커스텀 이미지
├── superset_config.py              # Superset 설정 파일
├── database/
│   └── init/
│       └── 01-create-database.sql  # 초기 데이터베이스 스키마 및 샘플 데이터
├── vue-frontend/                   # Vue.js 프론트엔드
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   └── src/
│       ├── App.vue
│       ├── main.js
│       ├── components/
│       │   ├── Dashboard.vue       # 대시보드 메인 컴포넌트
│       │   ├── DataSourceManager.vue  # 데이터 소스 관리
│       │   ├── ChartBuilder.vue    # 차트 빌더 (Superset API 호출)
│       │   ├── UserManagement.vue  # 사용자 관리
│       │   ├── Login.vue           # 로그인
│       │   └── Layout.vue          # 레이아웃
│       ├── services/
│       │   ├── supersetAPI.js      # Superset API 호출 서비스
│       │   └── authService.js      # 인증 서비스
│       └── utils/
│           └── constants.js        # 상수
└── README.md
```

## 🗄️ 샘플 데이터베이스

프로젝트에는 대시보드 구성을 위한 샘플 테이블들이 자동으로 생성됩니다:

### 테이블 구조
- **users**: 사용자 정보 (30개 레코드)
  - id, name, email, department, join_date, salary, position, status
- **sales**: 판매 데이터 (30개 레코드)  
  - id, sale_date, product_name, quantity, unit_price, total_amount, salesperson, region, customer_type
- **web_traffic**: 웹사이트 트래픽 (30개 레코드)
  - id, visit_date, unique_visitors, page_views, bounce_rate, session_duration, traffic_source, device_type
- **customer_satisfaction**: 고객 만족도 (30개 레코드)
  - id, survey_date, rating, category, feedback, customer_age_group, response_time_hours

### 샘플 대시보드 구성
4개의 차트로 구성된 대시보드를 생성할 수 있습니다:
1. **월별 매출 현황** (sales 테이블 기반)
2. **웹사이트 트래픽 분석** (web_traffic 테이블 기반)
3. **부서별 직원 현황** (users 테이블 기반)
4. **고객 만족도 트렌드** (customer_satisfaction 테이블 기반)

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
```

## 🔗 Superset API 연동

Vue.js 앱에서 Superset API를 호출하여 다음 기능들을 구현합니다:

### 주요 API 엔드포인트
- **로그인**: `POST /api/v1/security/login`
- **데이터베이스 목록**: `GET /api/v1/database/`
- **데이터셋 생성**: `POST /api/v1/dataset/`
- **차트 생성**: `POST /api/v1/chart/`
- **대시보드 생성**: `POST /api/v1/dashboard/`
- **SQL 실행**: `POST /api/v1/sqllab/execute/`

### 사용자 권한 관리
- 역할별 접근 권한 설정
- 데이터 소스별 접근 제한
- 차트/대시보드 공유 권한

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
   - superset_config.py에서 CORS 설정 확인
   - Vue.js 앱의 프록시 설정 확인

5. **컨테이너 재시작**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## 📝 개발 로드맵

### Phase 1: 기본 환경 구성 ✅
- [x] Docker 환경 설정
- [x] Superset, Vue.js, MariaDB 컨테이너 구성
- [x] 샘플 데이터베이스 생성

### Phase 2: Vue.js 컴포넌트 개발
- [ ] 로그인/인증 시스템 구현
- [ ] 데이터 소스 관리 컴포넌트
- [ ] 차트 빌더 인터페이스 (Superset API 호출)
- [ ] 대시보드 레이아웃 시스템

### Phase 3: Superset API 연동
- [ ] 모든 차트 생성 과정을 Vue.js에서 조작
- [ ] 데이터셋 구성 기능
- [ ] 차트 옵션 설정 기능
- [ ] 대시보드 구성 기능

### Phase 4: 권한 관리 시스템
- [ ] 사용자별 데이터 소스 접근 권한
- [ ] 역할별 UI 차이
- [ ] 차트/대시보드 공유 기능

### Phase 5: 고도화
- [ ] 실시간 데이터 업데이트
- [ ] 고급 차트 옵션
- [ ] 모바일 반응형 UI
- [ ] 프로덕션 배포 설정

## 🌐 환경별 설정

### 개발 환경 (Windows 10)
- Docker Desktop 사용
- 로컬 개발 서버: Vue.js devserver
- 디버깅 모드 활성화

### 프로덕션 환경
- Nginx 리버스 프록시 설정
- HTTPS 인증서 구성
- 환경 변수 보안 강화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트 링크: [https://github.com/[your-username]/superset-vue-project](https://github.com/[your-username]/superset-vue-project)

---

**주의사항**: 
- 이 프로젝트는 개발 목적으로 만들어졌습니다. 프로덕션 환경에서 사용하기 전에 보안 설정을 강화해야 합니다.
- 모든 차트 및 대시보드 기능은 Apache Superset의 API를 호출하여 구현됩니다.
- Windows 10 환경에서 Docker Desktop을 사용하여 개발되었습니다.