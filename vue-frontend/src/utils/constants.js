// vue-frontend/src/utils/constants.js

// API 엔드포인트
export const API_ENDPOINTS = {
  // 인증
  LOGIN: '/api/v1/security/login',
  LOGOUT: '/api/v1/security/logout',
  REFRESH: '/api/v1/security/refresh',
  CSRF_TOKEN: '/api/v1/security/csrf_token/',
  
  // 데이터베이스
  DATABASES: '/api/v1/database/',
  DATABASE_TEST: '/api/v1/database/test_connection',
  
  // 데이터셋
  DATASETS: '/api/v1/dataset/',
  
  // 차트
  CHARTS: '/api/v1/chart/',
  CHART_DATA: '/api/v1/chart/data',
  
  // 대시보드
  DASHBOARDS: '/api/v1/dashboard/',
  
  // 사용자 및 권한
  USERS: '/api/v1/security/users/',
  ROLES: '/api/v1/security/roles/',
  PERMISSIONS: '/api/v1/security/permissions/'
}

// 차트 타입 정의
export const CHART_TYPES = {
  TABLE: {
    key: 'table',
    name: '테이블',
    description: '데이터를 표 형태로 표시',
    icon: 'table',
    category: 'basic'
  },
  BAR: {
    key: 'bar',
    name: '막대 차트',
    description: '카테고리별 수치 비교',
    icon: 'bar-chart',
    category: 'chart'
  },
  LINE: {
    key: 'line',
    name: '선 차트',
    description: '시간에 따른 변화 추이',
    icon: 'line-chart',
    category: 'chart'
  },
  PIE: {
    key: 'pie',
    name: '파이 차트',
    description: '비율 및 구성 표시',
    icon: 'pie-chart',
    category: 'chart'
  },
  AREA: {
    key: 'area',
    name: '영역 차트',
    description: '누적 데이터 표시',
    icon: 'area-chart',
    category: 'chart'
  },
  SCATTER: {
    key: 'scatter',
    name: '산점도',
    description: '두 변수 간의 상관관계',
    icon: 'dot-chart',
    category: 'chart'
  }
}

// 데이터 타입 매핑
export const DATA_TYPES = {
  STRING: ['STRING', 'VARCHAR', 'TEXT', 'CHAR'],
  NUMERIC: ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL', 'DOUBLE', 'REAL'],
  DATE: ['DATE', 'DATETIME', 'TIMESTAMP', 'TIME'],
  BOOLEAN: ['BOOLEAN', 'BOOL']
}

// 집계 함수
export const AGGREGATION_FUNCTIONS = {
  SUM: 'sum',
  AVG: 'avg',
  COUNT: 'count',
  MIN: 'min',
  MAX: 'max',
  COUNT_DISTINCT: 'count_distinct'
}

// 색상 테마
export const COLOR_SCHEMES = {
  bnbColors: '기본',
  googleCategory10c: 'Google',
  d3Category10: 'D3 Category',
  superset: 'Superset',
  tableau10: 'Tableau',
  categoricalD3: 'D3 Categorical'
}

// 사용자 역할
export const USER_ROLES = {
  ADMIN: {
    name: 'Admin',
    description: '모든 권한을 가진 관리자',
    color: 'red',
    permissions: ['all']
  },
  ALPHA: {
    name: 'Alpha',
    description: '차트 및 대시보드 생성 가능',
    color: 'orange',
    permissions: ['create_chart', 'create_dashboard', 'edit_own']
  },
  GAMMA: {
    name: 'Gamma',
    description: '제한된 보기 권한',
    color: 'blue',
    permissions: ['view_chart', 'view_dashboard']
  },
  PUBLIC: {
    name: 'Public',
    description: '공개 콘텐츠만 접근 가능',
    color: 'green',
    permissions: ['view_public']
  }
}

// 데이터베이스 연결 템플릿
export const DATABASE_TEMPLATES = {
  MYSQL: {
    name: 'MySQL',
    uri_template: 'mysql+pymysql://username:password@host:port/database',
    default_port: 3306,
    example: 'mysql+pymysql://superset:password@localhost:3306/sample_dashboard'
  },
  POSTGRESQL: {
    name: 'PostgreSQL',
    uri_template: 'postgresql://username:password@host:port/database',
    default_port: 5432,
    example: 'postgresql://superset:password@localhost:5432/sample_dashboard'
  },
  SQLITE: {
    name: 'SQLite',
    uri_template: 'sqlite:///path/to/database.db',
    default_port: null,
    example: 'sqlite:///var/lib/superset/superset.db'
  },
  MSSQL: {
    name: 'Microsoft SQL Server',
    uri_template: 'mssql+pyodbc://username:password@host:port/database?driver=ODBC+Driver+17+for+SQL+Server',
    default_port: 1433,
    example: 'mssql+pyodbc://sa:password@localhost:1433/sample_dashboard?driver=ODBC+Driver+17+for+SQL+Server'
  }
}

// 메시지 및 텍스트
export const MESSAGES = {
  LOGIN_SUCCESS: '로그인에 성공했습니다.',
  LOGIN_FAILED: '로그인에 실패했습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  CHART_SAVED: '차트가 저장되었습니다.',
  CHART_DELETED: '차트가 삭제되었습니다.',
  DATABASE_CONNECTED: '데이터베이스 연결에 성공했습니다.',
  DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다.',
  DATASET_CREATED: '데이터셋이 생성되었습니다.',
  USER_CREATED: '사용자가 생성되었습니다.',
  PERMISSION_DENIED: '권한이 없습니다.',
  LOADING: '로딩 중...',
  NO_DATA: '데이터가 없습니다.',
  ERROR_OCCURRED: '오류가 발생했습니다.'
}

// 샘플 데이터 테이블 정보
export const SAMPLE_TABLES = {
  USERS: {
    name: 'users',
    description: '사용자 정보',
    columns: ['id', 'username', 'email', 'department', 'hire_date', 'salary', 'status']
  },
  SALES: {
    name: 'sales',
    description: '판매 데이터',
    columns: ['id', 'product_name', 'category', 'quantity', 'unit_price', 'total_amount', 'sale_date', 'region', 'salesperson']
  },
  WEB_TRAFFIC: {
    name: 'web_traffic',
    description: '웹사이트 트래픽',
    columns: ['id', 'date', 'page_views', 'unique_visitors', 'bounce_rate', 'avg_session_duration', 'traffic_source', 'device_type']
  },
  CUSTOMER_SATISFACTION: {
    name: 'customer_satisfaction',
    description: '고객 만족도',
    columns: ['id', 'survey_date', 'rating', 'category', 'feedback', 'customer_age_group', 'response_time_hours']
  }
}

export default {
  API_ENDPOINTS,
  CHART_TYPES,
  DATA_TYPES,
  AGGREGATION_FUNCTIONS,
  COLOR_SCHEMES,
  USER_ROLES,
  DATABASE_TEMPLATES,
  MESSAGES,
  SAMPLE_TABLES
}