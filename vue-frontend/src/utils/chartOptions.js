// vue-frontend/src/utils/chartOptions.js

/**
 * Superset 차트 옵션 스키마 정의
 * 각 차트 타입별로 사용 가능한 모든 옵션을 정의합니다
 */

export const CHART_OPTION_TYPES = {
  SELECT: 'select',
  TEXT: 'text',
  NUMBER: 'number',
  CHECKBOX: 'checkbox',
  SLIDER: 'slider',
  COLOR_PICKER: 'color_picker',
  MULTI_SELECT: 'multi_select',
  METRIC_SELECT: 'metric_select',
  COLUMN_SELECT: 'column_select',
  FILTER: 'filter',
  DATE_PICKER: 'date_picker',
  TEXTAREA: 'textarea',
  RADIO: 'radio',
  SWITCH: 'switch'
}

// 공통 차트 옵션
export const COMMON_CHART_OPTIONS = {
  // DATA 탭 옵션
  metrics: {
    type: CHART_OPTION_TYPES.METRIC_SELECT,
    label: '메트릭',
    category: 'data',
    tab: 'DATA',
    required: true,
    multi: true,
    description: '측정할 지표를 선택하세요'
  },
  groupby: {
    type: CHART_OPTION_TYPES.COLUMN_SELECT,
    label: '그룹 기준',
    category: 'data',
    tab: 'DATA',
    multi: true,
    description: '데이터를 그룹화할 컬럼을 선택하세요'
  },
  adhoc_filters: {
    type: CHART_OPTION_TYPES.FILTER,
    label: '필터',
    category: 'data',
    tab: 'DATA',
    multi: true,
    description: '데이터를 필터링합니다'
  },
  row_limit: {
    type: CHART_OPTION_TYPES.NUMBER,
    label: '행 제한',
    category: 'data',
    tab: 'DATA',
    default: 10000,
    min: 1,
    max: 100000,
    description: '조회할 최대 행 수'
  },
  
  // CUSTOMIZE 탭 옵션
  color_scheme: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '색상 테마',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 'supersetColors',
    options: [
      { label: 'Superset 기본', value: 'supersetColors' },
      { label: 'Lyft 컬러', value: 'lyftColors' },
      { label: '구글 카테고리', value: 'googleCategory20c' },
      { label: 'D3 카테고리 10', value: 'd3Category10' },
      { label: 'D3 카테고리 20', value: 'd3Category20' },
      { label: 'D3 카테고리 20b', value: 'd3Category20b' },
      { label: 'D3 카테고리 20c', value: 'd3Category20c' }
    ]
  },
  show_legend: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '범례 표시',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: true
  },
  show_labels: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '레이블 표시',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  },
  show_values: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '값 표시',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  }
}

// 시계열 차트 전용 옵션
export const TIMESERIES_OPTIONS = {
  granularity_sqla: {
    type: CHART_OPTION_TYPES.COLUMN_SELECT,
    label: '시간 컬럼',
    category: 'data',
    tab: 'DATA',
    required: true,
    description: '시간 기준으로 사용할 컬럼'
  },
  time_range: {
    type: CHART_OPTION_TYPES.TEXT,
    label: '시간 범위',
    category: 'data',
    tab: 'DATA',
    default: 'Last 30 days',
    description: '조회할 시간 범위'
  },
  time_grain_sqla: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '시간 단위',
    category: 'data',
    tab: 'DATA',
    options: [
      { label: '초', value: 'PT1S' },
      { label: '분', value: 'PT1M' },
      { label: '시간', value: 'PT1H' },
      { label: '일', value: 'P1D' },
      { label: '주', value: 'P1W' },
      { label: '월', value: 'P1M' },
      { label: '분기', value: 'P3M' },
      { label: '년', value: 'P1Y' }
    ]
  },
  resample_method: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '리샘플링 방법',
    category: 'data',
    tab: 'DATA',
    options: [
      { label: '없음', value: '' },
      { label: '선형 보간', value: 'linear' },
      { label: '제로 패딩', value: 'zero' },
      { label: '앞쪽 값 채우기', value: 'ffill' },
      { label: '뒤쪽 값 채우기', value: 'bfill' },
      { label: '중간값', value: 'median' },
      { label: '평균값', value: 'mean' },
      { label: '합계', value: 'sum' }
    ]
  }
}

// 라인 차트 전용 옵션
export const LINE_CHART_OPTIONS = {
  ...COMMON_CHART_OPTIONS,
  ...TIMESERIES_OPTIONS,
  line_interpolation: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '선 보간 방식',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 'linear',
    options: [
      { label: '선형', value: 'linear' },
      { label: '기본', value: 'basis' },
      { label: '카디널', value: 'cardinal' },
      { label: '단조', value: 'monotone' },
      { label: '계단', value: 'step-before' },
      { label: '계단 (후)', value: 'step-after' }
    ]
  },
  show_markers: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '마커 표시',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  },
  marker_size: {
    type: CHART_OPTION_TYPES.NUMBER,
    label: '마커 크기',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 6,
    min: 1,
    max: 20,
    depends_on: 'show_markers'
  },
  y_axis_format: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'Y축 형식',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: '.3s',
    description: 'D3 형식 문자열'
  },
  y_axis_bounds: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'Y축 범위',
    category: 'customize',
    tab: 'CUSTOMIZE',
    description: '[최소값, 최대값]'
  },
  x_axis_label: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'X축 레이블',
    category: 'customize',
    tab: 'CUSTOMIZE'
  },
  y_axis_label: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'Y축 레이블',
    category: 'customize',
    tab: 'CUSTOMIZE'
  },
  comparison_type: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '비교 유형',
    category: 'data',
    tab: 'DATA',
    options: [
      { label: '없음', value: '' },
      { label: '값', value: 'values' },
      { label: '백분율', value: 'percentage' },
      { label: '절대차', value: 'difference' }
    ]
  }
}

// 바 차트 전용 옵션
export const BAR_CHART_OPTIONS = {
  ...COMMON_CHART_OPTIONS,
  bar_stacked: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '누적 막대',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  },
  show_bar_value: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '막대 값 표시',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  },
  bar_orientation: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '막대 방향',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 'vertical',
    options: [
      { label: '세로', value: 'vertical' },
      { label: '가로', value: 'horizontal' }
    ]
  },
  reduce_x_ticks: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: 'X축 눈금 줄이기',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  },
  y_axis_format: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'Y축 형식',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: '.3s'
  },
  y_axis_bounds: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'Y축 범위',
    category: 'customize',
    tab: 'CUSTOMIZE'
  },
  x_axis_label: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'X축 레이블',
    category: 'customize',
    tab: 'CUSTOMIZE'
  },
  y_axis_label: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'Y축 레이블',
    category: 'customize',
    tab: 'CUSTOMIZE'
  }
}

// 파이 차트 전용 옵션
export const PIE_CHART_OPTIONS = {
  ...COMMON_CHART_OPTIONS,
  pie_label_type: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '레이블 유형',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 'key_value',
    options: [
      { label: '키', value: 'key' },
      { label: '값', value: 'value' },
      { label: '백분율', value: 'percent' },
      { label: '키와 값', value: 'key_value' },
      { label: '키와 백분율', value: 'key_percent' },
      { label: '값과 백분율', value: 'value_percent' },
      { label: '키, 값, 백분율', value: 'key_value_percent' }
    ]
  },
  donut: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '도넛 차트',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  },
  show_labels_threshold: {
    type: CHART_OPTION_TYPES.NUMBER,
    label: '레이블 표시 임계값',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 5,
    min: 0,
    max: 100,
    description: '이 백분율 이상인 조각만 레이블 표시'
  },
  labels_outside: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '외부 레이블',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: true
  },
  outerRadius: {
    type: CHART_OPTION_TYPES.NUMBER,
    label: '외부 반지름',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 70,
    min: 10,
    max: 100,
    description: '백분율 (%)로 지정'
  },
  innerRadius: {
    type: CHART_OPTION_TYPES.NUMBER,
    label: '내부 반지름',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 30,
    min: 0,
    max: 100,
    description: '백분율 (%)로 지정, 도넛 차트 활성화 시 사용'
  },
  number_format: {
    type: CHART_OPTION_TYPES.TEXT,
    label: '숫자 형식',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 'SMART_NUMBER'
  }
}

// 테이블 차트 전용 옵션
export const TABLE_CHART_OPTIONS = {
  ...COMMON_CHART_OPTIONS,
  table_timestamp_format: {
    type: CHART_OPTION_TYPES.TEXT,
    label: '타임스탬프 형식',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: '%Y-%m-%d %H:%M:%S'
  },
  page_length: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '페이지 크기',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 25,
    options: [
      { label: '10', value: 10 },
      { label: '25', value: 25 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
      { label: '250', value: 250 }
    ]
  },
  include_search: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '검색 포함',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: true
  },
  show_cell_bars: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '셀 막대 표시',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: true
  },
  align_pn: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: '양수/음수 정렬',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  },
  conditional_formatting: {
    type: CHART_OPTION_TYPES.TEXTAREA,
    label: '조건부 서식',
    category: 'customize',
    tab: 'CUSTOMIZE',
    description: 'JSON 형식의 조건부 서식 규칙'
  }
}

// 에어리어 차트 전용 옵션
export const AREA_CHART_OPTIONS = {
  ...LINE_CHART_OPTIONS,
  stacked_style: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '스택 스타일',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 'stack',
    options: [
      { label: '스택', value: 'stack' },
      { label: '스트림', value: 'stream' },
      { label: '확장', value: 'expand' }
    ]
  },
  show_brush: {
    type: CHART_OPTION_TYPES.SELECT,
    label: '브러시 표시',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 'auto',
    options: [
      { label: '자동', value: 'auto' },
      { label: '예', value: 'yes' },
      { label: '아니오', value: 'no' }
    ]
  }
}

// 산점도 전용 옵션
export const SCATTER_CHART_OPTIONS = {
  ...COMMON_CHART_OPTIONS,
  entity: {
    type: CHART_OPTION_TYPES.COLUMN_SELECT,
    label: '엔티티',
    category: 'data',
    tab: 'DATA',
    required: true,
    description: '각 점을 식별할 컬럼'
  },
  x: {
    type: CHART_OPTION_TYPES.METRIC_SELECT,
    label: 'X축 메트릭',
    category: 'data',
    tab: 'DATA',
    required: true
  },
  y: {
    type: CHART_OPTION_TYPES.METRIC_SELECT,
    label: 'Y축 메트릭',
    category: 'data',
    tab: 'DATA',
    required: true
  },
  size: {
    type: CHART_OPTION_TYPES.METRIC_SELECT,
    label: '크기 메트릭',
    category: 'data',
    tab: 'DATA',
    description: '점의 크기를 결정할 메트릭'
  },
  max_bubble_size: {
    type: CHART_OPTION_TYPES.NUMBER,
    label: '최대 버블 크기',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: 25,
    min: 5,
    max: 100
  },
  x_axis_label: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'X축 레이블',
    category: 'customize',
    tab: 'CUSTOMIZE'
  },
  y_axis_label: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'Y축 레이블',
    category: 'customize',
    tab: 'CUSTOMIZE'
  },
  x_axis_format: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'X축 형식',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: '.3s'
  },
  y_axis_format: {
    type: CHART_OPTION_TYPES.TEXT,
    label: 'Y축 형식',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: '.3s'
  },
  x_log_scale: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: 'X축 로그 스케일',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  },
  y_log_scale: {
    type: CHART_OPTION_TYPES.CHECKBOX,
    label: 'Y축 로그 스케일',
    category: 'customize',
    tab: 'CUSTOMIZE',
    default: false
  }
}

// 차트 타입별 옵션 매핑
export const CHART_OPTIONS_MAP = {
  line: LINE_CHART_OPTIONS,
  dist_bar: BAR_CHART_OPTIONS,
  bar: BAR_CHART_OPTIONS,
  pie: PIE_CHART_OPTIONS,
  table: TABLE_CHART_OPTIONS,
  area: AREA_CHART_OPTIONS,
  scatter: SCATTER_CHART_OPTIONS
}

/**
 * 특정 차트 타입의 옵션 스키마를 반환
 */
export function getChartOptions(vizType) {
  return CHART_OPTIONS_MAP[vizType] || COMMON_CHART_OPTIONS
}

/**
 * 옵션을 탭별로 그룹화
 */
export function groupOptionsByTab(options) {
  const grouped = {
    DATA: [],
    CUSTOMIZE: []
  }
  
  Object.entries(options).forEach(([key, option]) => {
    const tab = option.tab || 'DATA'
    if (!grouped[tab]) {
      grouped[tab] = []
    }
    grouped[tab].push({ key, ...option })
  })
  
  return grouped
}

/**
 * 옵션의 기본값 추출
 */
export function getDefaultValues(options) {
  const defaults = {}
  
  Object.entries(options).forEach(([key, option]) => {
    if (option.default !== undefined) {
      defaults[key] = option.default
    }
  })
  
  return defaults
}