# Superset Vue.js Dashboard Project

Apache Superset과 Vue.js를 연동한 대시보드 프로젝트입니다.

## 🚀 프로젝트 개요

이 프로젝트는 Apache Superset의 REST API를 Vue.js 웹 애플리케이션에서 직접 호출하여 사용할 수 있는 커스텀 대시보드를 구축하는 것을 목표로 합니다.

### 주요 기능
- **✅ 데이터 소스 선택 및 관리** (Apache Superset API 호출)
- **✅ 데이터셋 구성** (Apache Superset API 호출)
- **✅ 다양한 차트 타입 지원** (Apache Superset API 호출)
- **✅ 차트 세부 옵션 설정** (Apache Superset API 호출) - 동적 옵션 시스템 완성
- **✅ 대시보드 생성 및 관리** (Apache Superset API 호출)
- **✅ 차트 내보내기 기능** (JSON, CSV, HTML, PNG, iframe)
- **✅ 차트 프리셋 시스템**
- **✅ 🆕 AI를 활용한 차트 생성** (Claude API 기반 NLP)
- **🔄 사용자별 권한 관리** (Apache Superset API 호출)
- **🔄 Row-Level Security (RLS)**

**중요**: 모든 기능은 Apache Superset의 REST API를 호출하여 구현됩니다. Vue.js에서 독립적인 시각화 엔진을 구현하지 않습니다.

---

## 🏗️ 시스템 아키텍처

### **컨테이너 구성도**

```
┌──────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Vue.js    │    │   Apache    │    │   MariaDB   │      │
│  │  Frontend   │◄──►│  Superset   │◄──►│  Database   │      │
│  │  Port:8080  │    │  Port:8088  │    │  Port:3306  │      │
│  └─────────────┘    └──────┬──────┘    └─────────────┘      │
│         │                   │                                │
│         │                   ▼                                │
│         │           ┌─────────────┐                          │
│         │           │    Redis    │                          │
│         │           │   Cache     │                          │
│         │           │  Port:6379  │                          │
│         │           └─────────────┘                          │
│         │                                                    │
│         │ 🆕 AI 차트 생성                                     │
│         ▼                                                    │
│  ┌─────────────┐                                             │
│  │   Claude    │                                             │
│  │     API     │                                             │
│  │  (External) │                                             │
│  └─────────────┘                                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 컨테이너별 역할 및 책임

### **1. Vue.js Frontend (Port: 8080)**

**역할**: 사용자 인터페이스 및 API 클라이언트

**주 담당 기능**:
- Superset REST API 호출 및 응답 처리
- 차트 빌더 UI 제공 (5단계 프로세스)
- AI 챗봇 인터페이스
- 사용자 인증 토큰 관리 (JWT, CSRF)
- 차트 미리보기 렌더링
- 데이터 변환 및 포맷팅

**기술 스택**:
- Vue.js 3 + Composition API
- Axios (HTTP 클라이언트)
- Ant Design Vue (UI 컴포넌트)
- Rison (Superset 쿼리 파라미터 인코딩)

**환경변수**:
```bash
VUE_APP_SUPERSET_URL=http://localhost:8088
VUE_APP_CLAUDE_API_KEY=sk-ant-api03-...
NODE_ENV=development
```

---

### **2. Apache Superset (Port: 8088)**

**역할**: BI 엔진 및 REST API 서버

**주 담당 기능**:
- REST API 엔드포인트 제공
- SQL 쿼리 실행 및 데이터 집계
- 차트 메타데이터 관리
- 사용자 인증 및 권한 검증
- 차트 렌더링 엔진 (서버사이드)
- Row-Level Security (RLS) 필터링

**주요 API 엔드포인트**:
```
인증:
  POST   /api/v1/security/login
  GET    /api/v1/security/csrf_token
  GET    /api/v1/me

데이터베이스:
  GET    /api/v1/database
  POST   /api/v1/database
  GET    /api/v1/database/{id}/schemas
  GET    /api/v1/database/{id}/tables

데이터셋:
  GET    /api/v1/dataset
  POST   /api/v1/dataset
  GET    /api/v1/dataset/{id}
  GET    /api/v1/dataset/{id}/column

차트:
  GET    /api/v1/chart
  POST   /api/v1/chart
  PUT    /api/v1/chart/{id}
  DELETE /api/v1/chart/{id}
  POST   /api/v1/chart/data    # 차트 데이터 조회

대시보드:
  GET    /api/v1/dashboard
  POST   /api/v1/dashboard
  PUT    /api/v1/dashboard/{id}
```

**환경변수**:
```bash
SUPERSET_SECRET_KEY=your_secret_key_32_bytes
SQLALCHEMY_DATABASE_URI=mysql+pymysql://superset:superset123@mariadb:3306/superset
REDIS_HOST=redis
REDIS_PORT=6379
```

---

### **3. MariaDB (Port: 3306)**

**역할**: 데이터 저장소 (메타데이터 + 샘플 데이터)

**주 담당 기능**:
- **Superset 메타데이터 저장** (시스템 테이블)
- 샘플 비즈니스 데이터 저장
- 차트 프리셋 정보 저장
- 트랜잭션 관리 및 데이터 무결성

**주요 시스템 테이블** (Superset 메타데이터):

| 테이블명 | 용도 | 주요 컬럼 |
|---------|------|----------|
| **slices** | 차트 메타데이터 | `id`, `slice_name`, `viz_type`, `datasource_id`, `params` (JSON) |
| **dashboards** | 대시보드 메타데이터 | `id`, `dashboard_title`, `position_json`, `json_metadata` |
| **dashboard_slices** | 대시보드-차트 매핑 | `dashboard_id`, `slice_id` |
| **tables** | 데이터셋 메타데이터 | `id`, `table_name`, `schema`, `database_id`, `params` (JSON) |
| **dbs** | 데이터베이스 연결 정보 | `id`, `database_name`, `sqlalchemy_uri`, `extra` (JSON) |
| **ab_user** | 사용자 정보 | `id`, `username`, `email`, `password`, `active` |
| **ab_role** | 역할 정보 | `id`, `name` |
| **ab_permission** | 권한 정보 | `id`, `name` |
| **ab_view_menu** | 메뉴/리소스 정보 | `id`, `name` |
| **ab_permission_view** | 권한-메뉴 매핑 | `permission_id`, `view_menu_id` |
| **ab_permission_view_role** | 역할-권한 매핑 | `permission_view_id`, `role_id` |
| **row_level_security_filters** | RLS 필터 규칙 | `id`, `table_id`, `clause`, `filter_type` |

**차트 정보 저장 구조** (`slices` 테이블):
```json
{
  "id": 1,
  "slice_name": "월별 매출 현황",
  "viz_type": "line",
  "datasource_id": 5,
  "datasource_type": "table",
  "params": {
    "metrics": ["SUM(total_amount)"],
    "groupby": ["sale_date"],
    "time_range": "Last 6 months",
    "color_scheme": "supersetColors",
    "show_legend": true,
    "x_axis_label": "날짜",
    "y_axis_label": "매출액"
  }
}
```

**환경변수**:
```bash
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=sample_dashboard
MYSQL_USER=superset
MYSQL_PASSWORD=superset123
```

---

### **4. Redis (Port: 6379)**

**역할**: 캐시 서버 및 세션 관리

**주 담당 기능**:
- **쿼리 결과 캐싱**: 동일한 쿼리 재실행 방지
- **세션 관리**: 사용자 세션 데이터 저장
- **Celery 메시지 브로커** (비동기 작업 처리)
- **임시 데이터 저장**: API 응답 캐싱

**캐싱 전략**:
```
Key 형식: superset:cache:chart:{chart_id}:{query_hash}
TTL: 1시간 (설정 가능)
```

**환경변수**:
```bash
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 📊 차트 생성 API 호출 Flow

### **전체 프로세스 (5단계)**

```
┌─────────────────────────────────────────────────────────────┐
│                   Vue.js Frontend                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
        1️⃣ 데이터셋 선택
                        │
        ┌───────────────▼────────────────┐
        │  GET /api/v1/dataset           │
        │  → 데이터셋 목록 조회           │
        └───────────────┬────────────────┘
                        │
        2️⃣ 차트 타입 선택
                        │
        ┌───────────────▼────────────────┐
        │  사용자가 차트 타입 선택         │
        │  (bar, line, pie, table 등)    │
        └───────────────┬────────────────┘
                        │
        3️⃣ 차트 옵션 설정
                        │
        ┌───────────────▼────────────────┐
        │  GET /api/v1/dataset/{id}/     │
        │      column                    │
        │  → 컬럼 정보 조회               │
        │                                │
        │  사용자가 설정:                 │
        │  - Metrics (집계 함수)          │
        │  - Groupby (그룹화 컬럼)        │
        │  - Filters (필터 조건)          │
        │  - Time Range (시간 범위)       │
        │  - Customization (색상, 레이블) │
        └───────────────┬────────────────┘
                        │
        4️⃣ 미리보기 (데이터 조회)
                        │
        ┌────────────────▼────────────────┐
        │  POST /api/v1/chart/data        │
        │                                 │
        │  Request Body:                  │
        │  {                              │
        │    "datasource": {              │
        │      "id": 5,                   │
        │      "type": "table"            │
        │    },                           │
        │    "queries": [{                │
        │      "columns": ["region"],     │
        │      "metrics": ["SUM(amount)"],│
        │      "filters": [],             │
        │      "row_limit": 10000         │
        │    }],                          │
        │    "result_format": "json"      │
        │  }                              │
        │                                 │
        │  ↓                              │
        │                                 │
        │  Response:                      │
        │  {                              │
        │    "result": [{                 │
        │      "data": [                  │
        │        {"region": "서울",       │
        │         "SUM(amount)": 1500000},│
        │        {"region": "부산",       │
        │         "SUM(amount)": 800000}  │
        │      ],                         │
        │      "colnames": ["region",     │
        │                   "SUM(amount)"],│
        │      "coltypes": [1, 0]         │
        │    }]                           │
        │  }                              │
        └───────────────┬────────────────┘
                        │
        5️⃣ 차트 저장
                        │
        ┌───────────────▼────────────────┐
        │  POST /api/v1/chart            │
        │                                 │
        │  Request Body:                  │
        │  {                              │
        │    "slice_name": "지역별 매출", │
        │    "viz_type": "bar",           │
        │    "datasource_id": 5,          │
        │    "datasource_type": "table",  │
        │    "params": {                  │
        │      "metrics": ["SUM(amount)"],│
        │      "groupby": ["region"],     │
        │      "color_scheme": "bnbColors"│
        │    },                           │
        │    "query_context": {...}       │
        │  }                              │
        │                                 │
        │  ↓                              │
        │                                 │
        │  MariaDB `slices` 테이블에 저장 │
        └─────────────────────────────────┘
```

---

## 🔄 데이터 교환 형식

### **1. 차트 설정 데이터 (Vue.js → Superset)**

Vue.js에서 Superset으로 전송하는 차트 설정 JSON:

```json
{
  "slice_name": "월별 매출 추이",
  "description": "2024년 월별 총 매출액 변화",
  "viz_type": "line",
  "datasource_id": 5,
  "datasource_type": "table",
  "params": {
    "metrics": [
      {
        "aggregate": "SUM",
        "column": {
          "column_name": "total_amount",
          "type": "DOUBLE"
        },
        "expressionType": "SIMPLE",
        "label": "총 매출"
      }
    ],
    "groupby": ["sale_date"],
    "adhoc_filters": [
      {
        "clause": "WHERE",
        "comparator": "2024",
        "expressionType": "SIMPLE",
        "operator": "==",
        "subject": "YEAR(sale_date)"
      }
    ],
    "time_range": "No filter",
    "row_limit": 10000,
    "color_scheme": "supersetColors",
    "show_legend": true,
    "x_axis_label": "월",
    "y_axis_label": "매출액 (원)",
    "x_axis_format": "%Y-%m",
    "y_axis_format": ",.0f"
  },
  "query_context": {
    "datasource": {
      "id": 5,
      "type": "table"
    },
    "force": false,
    "queries": [
      {
        "annotation_layers": [],
        "columns": ["sale_date"],
        "metrics": ["SUM(total_amount)"],
        "filters": [],
        "orderby": [["sale_date", true]],
        "row_limit": 10000
      }
    ],
    "result_format": "json",
    "result_type": "full"
  }
}
```

### **2. 차트 데이터 (Superset → Vue.js)**

Superset에서 Vue.js로 반환하는 차트 데이터 JSON:

```json
{
  "result": [
    {
      "cache_key": "4f3d2a1b...",
      "cached_dttm": null,
      "cache_timeout": 3600,
      "annotation_data": {},
      "error": null,
      "is_cached": false,
      "query": "SELECT sale_date, SUM(total_amount) AS total FROM sales GROUP BY sale_date",
      "status": "success",
      "stacktrace": null,
      "rowcount": 12,
      "colnames": ["sale_date", "SUM(total_amount)"],
      "coltypes": [2, 0],  // 2=DATE, 0=NUMERIC
      "data": [
        {
          "sale_date": "2024-01-01T00:00:00",
          "SUM(total_amount)": 15000000
        },
        {
          "sale_date": "2024-02-01T00:00:00",
          "SUM(total_amount)": 18500000
        },
        {
          "sale_date": "2024-03-01T00:00:00",
          "SUM(total_amount)": 22000000
        }
      ],
      "from_dttm": null,
      "to_dttm": null
    }
  ]
}
```

### **3. 인증 데이터**

**로그인 요청**:
```json
{
  "username": "admin",
  "password": "admin",
  "provider": "db",
  "refresh": false
}
```

**로그인 응답**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**CSRF 토큰 응답**:
```json
{
  "result": "6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c"
}
```

**인증 헤더 구성**:
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'X-CSRFToken': csrfToken,
  'Content-Type': 'application/json'
}
```

---

## 📤 차트 Export 방식

### **1. JSON 내보내기**

**데이터 형식**:
```json
{
  "chart_metadata": {
    "name": "월별 매출 추이",
    "type": "line",
    "created_at": "2024-11-25T10:30:00Z"
  },
  "data": [
    {"month": "2024-01", "revenue": 15000000},
    {"month": "2024-02", "revenue": 18500000}
  ],
  "config": {
    "metrics": ["SUM(total_amount)"],
    "groupby": ["sale_date"],
    "color_scheme": "supersetColors"
  }
}
```

### **2. CSV 내보내기**

**데이터 변환**:
```
month,revenue
2024-01,15000000
2024-02,18500000
2024-03,22000000
```

**구현 코드**:
```javascript
const csvContent = [
  colnames.join(','),
  ...data.map(row => colnames.map(col => row[col]).join(','))
].join('\n')

const blob = new Blob([csvContent], { type: 'text/csv' })
const url = URL.createObjectURL(blob)
```

### **3. HTML 테이블 내보내기**

**생성된 HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
  </style>
</head>
<body>
  <h2>월별 매출 추이</h2>
  <table>
    <thead>
      <tr><th>month</th><th>revenue</th></tr>
    </thead>
    <tbody>
      <tr><td>2024-01</td><td>15,000,000</td></tr>
      <tr><td>2024-02</td><td>18,500,000</td></tr>
    </tbody>
  </table>
</body>
</html>
```

### **4. HTML 차트 (Chart.js) 내보내기**

**생성된 HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <canvas id="myChart"></canvas>
  <script>
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['2024-01', '2024-02', '2024-03'],
        datasets: [{
          label: '월별 매출',
          data: [15000000, 18500000, 22000000],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: '월별 매출 추이' }
        }
      }
    });
  </script>
</body>
</html>
```

### **5. PNG 이미지 내보내기**

**구현 방식**:
```javascript
// html2canvas 라이브러리 사용
import html2canvas from 'html2canvas'

const chartElement = document.getElementById('chart-preview')
const canvas = await html2canvas(chartElement)
const imgData = canvas.toDataURL('image/png')

// 다운로드
const link = document.createElement('a')
link.download = 'chart.png'
link.href = imgData
link.click()
```

### **6. iframe 임베드 코드**

**생성된 코드**:
```html
<iframe
  src="http://localhost:8088/superset/explore/?standalone=true&chart_id=123"
  width="800"
  height="600"
  frameborder="0"
  allowtransparency="true"
></iframe>
```

---

## 🔐 인증 및 보안

### **인증 흐름**

```
1. 로그인
   POST /api/v1/security/login
   → JWT Access Token + Refresh Token 발급

2. CSRF 토큰 획득
   GET /api/v1/security/csrf_token
   → CSRF 토큰 발급

3. API 요청 시 헤더 포함
   Authorization: Bearer {access_token}
   X-CSRFToken: {csrf_token}

4. 토큰 만료 시 Refresh
   POST /api/v1/security/refresh
   → 새로운 Access Token 발급
```

### **권한 관리**

**역할 기반 접근 제어 (RBAC)**:
- **Admin**: 모든 리소스 접근 및 수정
- **Alpha**: 차트/대시보드 생성, 자신의 리소스 관리
- **Gamma**: 할당된 리소스 읽기 전용

**권한 확인 로직**:
```python
# Superset 내부 로직 (Python)
@has_access_api
@permission_name("can_read")
def get_chart(chart_id):
    chart = db.session.query(Slice).filter_by(id=chart_id).first()
    if not security_manager.can_access('chart', 'can_read', chart):
        raise ForbiddenError()
    return chart
```

---

## 🗂️ MariaDB 시스템 테이블 상세

### **핵심 메타데이터 테이블**

#### **1. slices (차트 메타데이터)**

```sql
CREATE TABLE slices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slice_name VARCHAR(250) NOT NULL,      -- 차트 이름
    viz_type VARCHAR(250),                 -- 차트 타입 (bar, line, pie 등)
    datasource_id INT,                     -- 데이터셋 ID
    datasource_type VARCHAR(200),          -- 데이터셋 타입 (table, query 등)
    params TEXT,                           -- 차트 설정 (JSON)
    query_context TEXT,                    -- 쿼리 컨텍스트 (JSON)
    description TEXT,                      -- 차트 설명
    cache_timeout INT,                     -- 캐시 유효 시간 (초)
    perm VARCHAR(1000),                    -- 권한 식별자
    created_by_fk INT,                     -- 생성자 ID
    changed_by_fk INT,                     -- 수정자 ID
    created_on DATETIME,
    changed_on DATETIME,
    FOREIGN KEY (datasource_id) REFERENCES tables(id),
    FOREIGN KEY (created_by_fk) REFERENCES ab_user(id)
);
```

**사용 예시**:
```sql
-- 차트 생성
INSERT INTO slices (slice_name, viz_type, datasource_id, params)
VALUES ('월별 매출', 'line', 5, '{"metrics": ["SUM(amount)"], ...}');

-- 차트 조회
SELECT * FROM slices WHERE datasource_id = 5;
```

#### **2. tables (데이터셋 메타데이터)**

```sql
CREATE TABLE tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(250) NOT NULL,      -- 테이블/데이터셋 이름
    main_dttm_col VARCHAR(250),            -- 주요 시간 컬럼
    default_endpoint TEXT,
    database_id INT NOT NULL,              -- 데이터베이스 ID
    offset INT,
    cache_timeout INT,
    schema VARCHAR(255),                   -- 스키마 이름
    sql TEXT,                              -- 커스텀 SQL
    params TEXT,                           -- 추가 설정 (JSON)
    perm VARCHAR(1000),
    filter_select_enabled BOOLEAN,
    fetch_values_predicate VARCHAR(1000),
    is_managed_externally BOOLEAN DEFAULT FALSE,
    external_url TEXT,
    created_by_fk INT,
    changed_by_fk INT,
    created_on DATETIME,
    changed_on DATETIME,
    FOREIGN KEY (database_id) REFERENCES dbs(id)
);
```

#### **3. dashboards (대시보드 메타데이터)**

```sql
CREATE TABLE dashboards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dashboard_title VARCHAR(500),          -- 대시보드 제목
    position_json TEXT,                    -- 차트 배치 정보 (JSON)
    json_metadata TEXT,                    -- 메타데이터 (JSON)
    slug VARCHAR(255) UNIQUE,              -- URL 슬러그
    published BOOLEAN DEFAULT FALSE,
    css TEXT,                              -- 커스텀 CSS
    certified_by TEXT,
    certification_details TEXT,
    created_by_fk INT,
    changed_by_fk INT,
    created_on DATETIME,
    changed_on DATETIME
);
```

**position_json 구조 예시**:
```json
{
  "CHART-1": {
    "type": "CHART",
    "id": 1,
    "meta": {
      "width": 6,
      "height": 4,
      "chartId": 123
    },
    "children": []
  },
  "CHART-2": {
    "type": "CHART",
    "id": 2,
    "meta": {
      "width": 6,
      "height": 4,
      "chartId": 124
    },
    "children": []
  }
}
```

#### **4. dashboard_slices (대시보드-차트 매핑)**

```sql
CREATE TABLE dashboard_slices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dashboard_id INT NOT NULL,
    slice_id INT NOT NULL,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    FOREIGN KEY (slice_id) REFERENCES slices(id) ON DELETE CASCADE,
    UNIQUE KEY unique_dashboard_slice (dashboard_id, slice_id)
);
```

#### **5. row_level_security_filters (RLS 필터)**

```sql
CREATE TABLE row_level_security_filters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_id INT NOT NULL,                 -- 데이터셋 ID
    clause TEXT NOT NULL,                  -- 필터 SQL 구문
    group_key VARCHAR(255),                -- 그룹 키
    filter_type VARCHAR(255),              -- 필터 타입 (Regular, Base)
    name VARCHAR(255),                     -- 필터 이름
    description TEXT,
    created_by_fk INT,
    changed_by_fk INT,
    created_on DATETIME,
    changed_on DATETIME,
    FOREIGN KEY (table_id) REFERENCES tables(id)
);
```

**RLS 필터 예시**:
```sql
-- CRM팀 팀장용 RLS 필터
INSERT INTO row_level_security_filters (table_id, clause, name)
VALUES (
  5,
  "company = 'KT DS' AND team = 'CRM서비스팀'",
  "CRM팀 팀장 필터"
);
```

---

## 🧪 차트 생성 예시 (실전)

### **Vue.js 코드**

```javascript
// vue-frontend/src/services/supersetAPI.js
import axios from 'axios'
import rison from 'rison'

class SupersetAPI {
  async createChart(chartConfig) {
    // 1. CSRF 토큰 획득
    const csrfToken = await this.getCSRFToken()
    
    // 2. 차트 생성 API 호출
    const response = await this.api.post('/api/v1/chart/', {
      slice_name: chartConfig.name,
      description: chartConfig.description,
      viz_type: chartConfig.vizType,
      datasource_id: chartConfig.datasetId,
      datasource_type: 'table',
      params: {
        metrics: chartConfig.metrics,
        groupby: chartConfig.groupby,
        adhoc_filters: chartConfig.filters,
        row_limit: 10000,
        color_scheme: 'supersetColors'
      },
      query_context: {
        datasource: {
          id: chartConfig.datasetId,
          type: 'table'
        },
        force: false,
        queries: [{
          columns: chartConfig.groupby,
          metrics: chartConfig.metrics,
          filters: chartConfig.filters,
          row_limit: 10000
        }],
        result_format: 'json',
        result_type: 'full'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json'
      }
    })
    
    return response.data
  }
  
  async getChartData(chartId) {
    // Rison 인코딩을 사용한 차트 데이터 조회
    const params = rison.encode({
      form_data: {
        slice_id: chartId
      }
    })
    
    const response = await this.api.post(
      `/api/v1/chart/data?q=${params}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    return response.data.result[0]
  }
}
```

---

## 📦 설치 및 실행

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

---

## 🚨 문제 해결

### 일반적인 문제들

1. **CORS 오류**
   - `superset_config.py`에서 CORS 설정 확인
   ```python
   ENABLE_CORS = True
   CORS_OPTIONS = {
       'origins': ['http://localhost:8080'],
       'supports_credentials': True
   }
   ```

2. **인증 오류 (401)**
   - Access Token 만료 확인
   - CSRF 토큰 재발급

3. **차트 데이터 조회 실패**
   - Rison 파라미터 인코딩 확인
   - 쿼리 파라미터 구조 검증

4. **데이터베이스 연결 실패**
   - MariaDB 컨테이너 상태 확인
   - SQLAlchemy URI 검증

---

## 📝 개발 로드맵

### **Phase 1: 기본 환경 구성 ✅ 완료**
- [x] Docker 환경 설정
- [x] Superset, Vue.js, MariaDB, Redis 컨테이너 구성
- [x] 초기 인증 시스템 구현

### **Phase 2: Vue.js 컴포넌트 개발 ✅ 완료**
- [x] 로그인/인증 시스템
- [x] 차트 빌더 인터페이스 (5단계)
- [x] 대시보드 레이아웃

### **Phase 3: Superset API 연동 ✅ 완료**
- [x] 모든 차트 생성 과정 API 통합
- [x] 동적 옵션 시스템
- [x] 차트 프리셋 시스템
- [x] 다중 내보내기 기능
- [x] AI 기반 차트 생성

### **Phase 4: 권한 관리 시스템 🔄 진행 중**
- [x] 역할별 UI 제어
- [x] 사용자 관리 UI
- [x] Row-Level Security (RLS) 구현

### **Phase 5: 고도화 🔮 계획**
- [ ] 실시간 데이터 업데이트
- [ ] 모바일 반응형 UI
- [ ] 프로덕션 배포 설정

---

---

#### **2. ★ Vue.js에서 RLS 관리 UI 추가 권장**

**현재 상태:**
- RLS 필터는 **Superset Web UI에서만 설정 가능**
- Vue.js 프론트엔드에서는 RLS 관리 기능이 없음

**추가 권장 (선택사항):**
Superset API를 통한 RLS 관리 기능을 Vue.js에서 제공하려면:
```
파일 위치: vue-frontend/src/components/
추가 파일: RLSManager.vue (Row-Level Security 관리 컴포넌트)

파일 위치: vue-frontend/src/services/
추가 파일: rlsService.js (RLS API 호출 서비스)
```

**관련 Superset API:**
```
GET    /api/v1/rowlevelsecurity/
POST   /api/v1/rowlevelsecurity/
PUT    /api/v1/rowlevelsecurity/{id}
DELETE /api/v1/rowlevelsecurity/{id}
```

---

#### **3. ★ 데이터베이스 초기화 스크립트 파일 정리 권장**

**현재 상태:**
프로젝트 지식에서 두 개의 초기화 스크립트가 확인됨:
- `database/init/01-create-database.sql` (권한 분리용)
- `database/init/01-create-sample-database.sql` (샘플 데이터용)

**권장 사항:**
파일명이 충돌할 수 있으므로 다음과 같이 **순서 정리 필요**:
```
database/init/
├── 01-create-database.sql          ← 테이블 생성 (현재 유지)
├── 02-insert-sample-data.sql       ← 샘플 데이터 INSERT (분리 권장)
└── 03-create-views-indexes.sql     ← 뷰 및 인덱스 생성 (분리 권장)
```

---

#### **4. ★ 환경변수 설정 파일 확인**

**확인 필요:**
```
vue-frontend/.env.local 파일에서:
- VUE_APP_CLAUDE_API_KEY 설정 여부
- VUE_APP_NLP_FALLBACK_ENABLED 설정 여부

## ⚠️ 주의사항

- 모든 차트 기능은 **Apache Superset REST API 호출**로 구현됩니다.
- **하드코딩 금지**: 모든 설정은 환경 변수로 관리됩니다.
- MariaDB의 **시스템 테이블을 직접 수정하지 마세요** (API 사용).
- Redis 캐시는 쿼리 성능 향상에 중요하므로 항상 실행 상태 유지.

---

**마지막 업데이트**: 2025-11-25  
**프로젝트 상태**: 🟢 Active Development  
**프로젝트 링크**: [https://github.com/kros235/superset-vue-project](https://github.com/kros235/superset-vue-project)