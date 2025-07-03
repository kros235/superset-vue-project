// vue-frontend/src/utils/constants.js

// 차트 타입 정의
export const CHART_TYPES = {
  TABLE: 'table',
  BAR: 'dist_bar',
  LINE: 'line',
  PIE: 'pie',
  AREA: 'area',
  SCATTER: 'scatter'
}

// 차트 타입 메타데이터
export const CHART_TYPE_METADATA = {
  [CHART_TYPES.TABLE]: {
    name: '테이블',
    description: '데이터를 표 형태로 표시합니다',
    category: 'basic',
    requiresMetrics: false,
    supportsGroupBy: true,
    supportsTimeSeries: false
  },
  [CHART_TYPES.BAR]: {
    name: '막대 차트',
    description: '카테고리별 값을 막대로 비교합니다',
    category: 'comparison',
    requiresMetrics: true,
    supportsGroupBy: true,
    supportsTimeSeries: false
  },
  [CHART_TYPES.LINE]: {
    name: '선 차트',
    description: '시간에 따른 변화를 선으로 표시합니다',
    category: 'trend',
    requiresMetrics: true,
    supportsGroupBy: true,
    supportsTimeSeries: true
  },
  [CHART_TYPES.PIE]: {
    name: '파이 차트',
    description: '전체에서 각 부분의 비율을 표시합니다',
    category: 'proportion',
    requiresMetrics: true,
    supportsGroupBy: true,
    supportsTimeSeries: false
  },
  [CHART_TYPES.AREA]: {
    name: '영역 차트',
    description: '시간에 따른 누적 변화를 표시합니다',
    category: 'trend',
    requiresMetrics: true,
    supportsGroupBy: true,
    supportsTimeSeries: true
  },
  [CHART_TYPES.SCATTER]: {
    name: '산점도',
    description: '두 변수 간의 상관관계를 표시합니다',
    category: 'correlation',
    requiresMetrics: true,
    supportsGroupBy: false,
    supportsTimeSeries: false
  }
}

// 사용자 역할
export const USER_ROLES = {
  ADMIN: 'Admin',
  ALPHA: 'Alpha',
  GAMMA: 'Gamma',
  SQL_LAB: 'sql_lab'
}

// 시간 범위 옵션
export const TIME_RANGE_OPTIONS = [
  { label: '지난 1시간', value: 'Last 1 hour' },
  { label: '지난 1일', value: 'Last 1 day' },
  { label: '지난 7일', value: 'Last 7 days' },
  { label: '지난 30일', value: 'Last 30 days' },
  { label: '지난 90일', value: 'Last 90 days' },
  { label: '지난 1년', value: 'Last 1 year' },
  { label: '올해', value: 'Current year' },
  { label: '지난해', value: 'Previous year' }
]

// 색상 스키마 옵션
export const COLOR_SCHEMES = [
  { label: 'Superset 기본', value: 'supersetColors' },
  { label: '블루 계열', value: 'bnbColors' },
  { label: '구글 계열', value: 'googleCategory20c' },
  { label: '카테고리 20', value: 'd3Category20' },
  { label: '카테고리 20b', value: 'd3Category20b' },
  { label: '카테고리 20c', value: 'd3Category20c' }
]

// 집계 함수
export const AGGREGATION_FUNCTIONS = [
  { label: '합계', value: 'SUM' },
  { label: '평균', value: 'AVG' },
  { label: '개수', value: 'COUNT' },
  { label: '최댓값', value: 'MAX' },
  { label: '최솟값', value: 'MIN' },
  { label: '고유 개수', value: 'COUNT_DISTINCT' }
]

// 데이터 타입
export const DATA_TYPES = {
  NUMERIC: 'NUMERIC',
  STRING: 'STRING',
  DATETIME: 'DATETIME',
  BOOLEAN: 'BOOLEAN'
}

// 메뉴 항목 설정
export const MENU_ITEMS = {
  DASHBOARD: {
    key: 'dashboard',
    title: '대시보드',
    path: '/',
    icon: 'DashboardOutlined',
    permissions: []
  },
  CHARTS: {
    key: 'charts',
    title: '차트 빌더',
    path: '/charts',
    icon: 'BarChartOutlined',
    permissions: ['canCreateChart']
  },
  DATASOURCES: {
    key: 'datasources',
    title: '데이터 소스',
    path: '/datasources',
    icon: 'DatabaseOutlined',
    permissions: ['canConnectDatabase']
  },
  USERS: {
    key: 'users',
    title: '사용자 관리',
    path: '/users',
    icon: 'UserOutlined',
    permissions: ['canManageUsers']
  }
}

// API 엔드포인트
export const API_ENDPOINTS = {
  // 인증
  LOGIN: '/api/v1/security/login',
  LOGOUT: '/api/v1/security/logout',
  REFRESH: '/api/v1/security/refresh',
  ME: '/api/v1/me/',
  CSRF_TOKEN: '/api/v1/security/csrf_token/',

  // 차트
  CHARTS: '/api/v1/chart/',
  CHART_DATA: '/api/v1/chart/data',
  VIZ_TYPES: '/api/v1/chart/viz_types',

  // 대시보드
  DASHBOARDS: '/api/v1/dashboard/',

  // 데이터셋
  DATASETS: '/api/v1/dataset/',
  DATASET_COLUMNS: (id) => `/api/v1/dataset/${id}/column`,

  // 데이터베이스
  DATABASES: '/api/v1/database/',
  DATABASE_TEST: '/api/v1/database/test_connection',

  // 사용자 관리
  USERS: '/api/v1/security/users/',
  ROLES: '/api/v1/security/roles/',
  PERMISSIONS: '/api/v1/security/permissions/',

  // 헬스 체크
  HEALTH: '/health'
}

// 페이지네이션 기본값
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
  SHOW_TOTAL: (total, range) => `${range[0]}-${range[1]} / 총 ${total}개`
}

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  LOGIN_FAILED: '로그인에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.',
  UNAUTHORIZED: '권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
}

// 성공 메시지
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '로그인에 성공했습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  SAVE_SUCCESS: '저장되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.',
  UPDATE_SUCCESS: '수정되었습니다.',
  CREATE_SUCCESS: '생성되었습니다.'
}

// 로딩 메시지
export const LOADING_MESSAGES = {
  LOADING: '로딩 중...',
  SAVING: '저장 중...',
  DELETING: '삭제 중...',
  UPDATING: '수정 중...',
  CREATING: '생성 중...',
  CONNECTING: '연결 중...',
  TESTING: '테스트 중...'
}
