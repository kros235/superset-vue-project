# Superset React Dashboard Project

Apache Superset과 React를 연동한 대시보드 프로젝트입니다.

## 🚀 프로젝트 개요

이 프로젝트는 Apache Superset의 기능을 React 웹 애플리케이션에서 직접 호출하여 사용할 수 있는 커스텀 대시보드를 구축하는 것을 목표로 합니다.

### 주요 기능
- 데이터 소스 선택 및 관리
- 데이터셋 구성
- 다양한 차트 타입 지원
- 차트 세부 옵션 설정
- 대시보드 생성 및 관리
- 사용자별 권한 관리
- 역할별 접근 제어

## 🏗️ 시스템 아키텍처

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │    │   Apache    │    │   MariaDB   │
│  Frontend   │◄──►│  Superset   │◄──►│  Database   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │    Redis    │
                   │   (Cache)   │
                   └─────────────┘
```

## 🛠️ 기술 스택

### Backend
- **Apache Superset**: 데이터 시각화 및 분석
- **MariaDB**: 메인 데이터베이스
- **Redis**: 캐싱 시스템

### Frontend
- **React 18**: 사용자 인터페이스
- **Ant Design**: UI 컴포넌트 라이브러리
- **Axios**: HTTP 클라이언트
- **React Router**: 라우팅

### DevOps
- **Docker & Docker Compose**: 컨테이너화
- **macOS Big Sur**: 개발 환경

## 📦 설치 및 실행

### 사전 요구사항
- Docker Desktop
- macOS Big Sur 버전 11.7.10 이상

### 실행 방법

1. **저장소 클론**
   ```bash
   git clone https://github.com/[your-username]/superset-react-project.git
   cd superset-react-project
   ```

2. **Docker 컨테이너 실행**
   ```bash
   docker-compose up -d
   ```

3. **서비스 접속**
   - **Superset**: http://localhost:8088 (admin/admin)
   - **React App**: http://localhost:3000
   - **MariaDB**: localhost:3306

### 초기 데이터베이스 연결 설정

Superset에서 MariaDB 연결:
```
DISPLAY NAME: Sample Dashboard DB
SQLALCHEMY URI: mysql+pymysql://superset:superset123@mariadb:3306/sample_dashboard
```

## 📁 프로젝트 구조

```
superset-react-project/
├── docker-compose.yml           # Docker Compose 설정
├── Dockerfile.superset          # Superset 커스텀 이미지
├── database/
│   └── init/
│       └── 01-create-database.sql   # 초기 데이터베이스 스키마
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   └── src/
│       ├── App.js
│       ├── components/
│       │   ├── Dashboard.js
│       │   ├── DataSourceManager.js
│       │   ├── ChartBuilder.js
│       │   ├── UserManagement.js
│       │   ├── Login.js
│       │   └── Layout.js
│       ├── services/
│       │   ├── supersetAPI.js
│       │   └── authService.js
│       └── utils/
│           └── constants.js
└── README.md
```

## 🗄️ 데이터베이스 스키마

프로젝트에는 다음 샘플 테이블들이 포함되어 있습니다:

- **users**: 사용자 정보 (30개 레코드)
- **sales**: 판매 데이터 (30개 레코드)
- **web_traffic**: 웹사이트 트래픽 (30개 레코드)
- **customer_satisfaction**: 고객 만족도 (30개 레코드)

## 🔧 개발 환경 설정

### Frontend 개발
```bash
cd frontend
npm install
npm start
```

### 컨테이너 로그 확인
```bash
# 전체 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f superset
docker-compose logs -f frontend
```

## 🚨 문제 해결

### 일반적인 문제들

1. **MySQL 드라이버 오류**
   ```bash
   docker exec -it superset_app pip install PyMySQL
   docker-compose restart superset
   ```

2. **React 앱이 시작되지 않는 경우**
   ```bash
   docker-compose restart frontend
   ```

3. **데이터베이스 연결 실패**
   - MariaDB 컨테이너가 정상 실행 중인지 확인
   - 연결 URI가 올바른지 확인

## 📝 다음 단계

- [ ] React 컴포넌트 완성
- [ ] Superset API 연동 완료
- [ ] 사용자 권한 시스템 구현
- [ ] 차트 빌더 UI 개발
- [ ] 대시보드 레이아웃 시스템
- [ ] 프로덕션 배포 설정

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트 링크: [https://github.com/[your-username]/superset-react-project](https://github.com/[your-username]/superset-react-project)

---

**주의**: 이 프로젝트는 개발 목적으로 만들어졌습니다. 프로덕션 환경에서 사용하기 전에 보안 설정을 강화해야 합니다.
