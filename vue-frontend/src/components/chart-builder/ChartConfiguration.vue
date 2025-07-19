<template>
  <a-card title="3단계: 차트 설정" style="margin-bottom: 24px">
    <a-form layout="vertical">
      <!-- 기본 메트릭 설정 -->
      <a-card title="데이터 설정" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="메트릭 *" required>
              <a-select
                v-model:value="config.metrics"
                mode="multiple"
                placeholder="측정할 메트릭을 선택하세요"
                :loading="metricsLoading"
                :options="metricOptions"
                :filter-option="filterOption"
                show-search
                style="width: 100%"
              >
                <template #optionRender="{ option }">
                  <div>
                    <strong>{{ option.label }}</strong>
                    <div style="font-size: 12px; color: #666">{{ option.group }}</div>
                  </div>
                </template>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="그룹 기준">
              <a-select
                v-model:value="config.groupby"
                mode="multiple"
                placeholder="그룹화할 컬럼을 선택하세요"
                :options="categoricalColumnOptions"
                :filter-option="filterOption"
                show-search
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-if="isTimeSeriesChart">
          <a-col :span="12">
            <a-form-item label="시간 컬럼">
              <a-select
                v-model:value="config.granularity_sqla"
                placeholder="시간 기준 컬럼을 선택하세요"
                :options="dateColumnOptions"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="시간 범위">
              <a-select
                v-model:value="config.time_range"
                placeholder="시간 범위를 선택하세요"
                :options="timeRangeOptions"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- 테이블 차트 설정 -->
      <a-card v-if="chartConfig.viz_type === 'table'" title="테이블 설정" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="페이지 크기">
              <a-input-number
                v-model:value="config.page_length"
                :min="10"
                :max="1000"
                :step="10"
                placeholder="페이지당 행 수"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item>
              <a-checkbox v-model:checked="config.include_search">
                검색 기능 포함
              </a-checkbox>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="정렬 순서">
              <a-select
                v-model:value="config.order_desc"
                style="width: 100%"
              >
                <a-select-option value="desc">내림차순</a-select-option>
                <a-select-option value="asc">오름차순</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- 일반 데이터 제한 설정 -->
      <a-card title="데이터 제한" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="행 제한">
              <a-input-number
                v-model:value="config.row_limit"
                :min="1"
                :max="50000"
                :step="100"
                placeholder="최대 행 수"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- 파이 차트 설정 -->
      <a-card v-if="chartConfig.viz_type === 'pie'" title="파이 차트 설정" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="라벨 타입">
              <a-select
                v-model:value="config.pie_label_type"
                style="width: 100%"
              >
                <a-select-option value="key">키만</a-select-option>
                <a-select-option value="value">값만</a-select-option>
                <a-select-option value="key_value">키와 값</a-select-option>
                <a-select-option value="percent">백분율</a-select-option>
                <a-select-option value="key_percent">키와 백분율</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item>
              <a-checkbox v-model:checked="config.show_legend">
                범례 표시
              </a-checkbox>
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- 선형 차트 설정 -->
      <a-card v-if="['line', 'area'].includes(chartConfig.viz_type)" title="선형 차트 설정" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item>
              <a-checkbox v-model:checked="config.show_markers">
                마커 표시
              </a-checkbox>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item>
              <a-checkbox v-model:checked="config.show_legend">
                범례 표시
              </a-checkbox>
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- 스타일 설정 -->
      <a-card title="스타일 설정" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="색상 테마">
              <a-select
                v-model:value="config.color_scheme"
                placeholder="색상 테마를 선택하세요"
                :options="colorSchemeOptions"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="chartConfig.viz_type !== 'table'">
            <a-form-item label="차트 높이">
              <a-input-number
                v-model:value="config.chart_height"
                :min="200"
                :max="1000"
                :step="50"
                placeholder="차트 높이 (픽셀)"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- 설정 미리보기 -->
      <a-card title="설정 요약" style="margin-bottom: 16px">
        <a-descriptions :column="2" size="small">
          <a-descriptions-item label="메트릭">
            <span v-if="config.metrics?.length">
              {{ config.metrics.length }}개 선택됨
            </span>
            <span v-else style="color: #ff4d4f">선택 필요</span>
          </a-descriptions-item>
          <a-descriptions-item label="그룹 기준">
            <span v-if="config.groupby?.length">
              {{ config.groupby.length }}개 선택됨
            </span>
            <span v-else style="color: #999">선택 안됨</span>
          </a-descriptions-item>
          <a-descriptions-item label="행 제한">
            {{ config.row_limit || 1000 }}행
          </a-descriptions-item>
          <a-descriptions-item label="색상 테마">
            {{ getColorSchemeName() }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 🔥 개별 버튼 제거 - 상위 컴포넌트의 공통 버튼 사용 -->
    </a-form>
  </a-card>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import supersetAPI from '../../services/supersetAPI'

export default defineComponent({
  name: 'ChartConfiguration',
  props: {
    chartConfig: {
      type: Object,
      required: true
    },
    datasetColumns: {
      type: Array,
      default: () => []
    },
    selectedDataset: {
      type: Object,
      default: null
    }
  },
  emits: ['update', 'next', 'back'],
  setup(props, { emit }) {
    const config = ref({
      metrics: [],
      groupby: [],
      granularity_sqla: '',
      time_range: 'Last 30 days',
      page_length: 100,
      include_search: true,
      order_desc: 'desc',
      row_limit: 1000,
      show_markers: true,
      show_legend: true,
      pie_label_type: 'key_value',
      color_scheme: 'bnbColors',
      chart_height: 400
    })

    const metricsLoading = ref(false)
    const datasetMetrics = ref([])

    // 시계열 차트 여부 확인
    const isTimeSeriesChart = computed(() => {
      return ['line', 'area'].includes(props.chartConfig.viz_type)
    })

    // 설정 유효성 확인
    const isConfigValid = computed(() => {
      return config.value.metrics && config.value.metrics.length > 0
    })

    // 메트릭 옵션 생성 (핵심 부분!)
    const metricOptions = computed(() => {
      const options = []

      // 1. 기본 집계 함수 (COUNT(*) 등)
      options.push({
        label: 'COUNT(*)',
        value: 'count',
        group: '기본 집계'
      })

      // 2. 데이터셋에 정의된 메트릭이 있다면 추가
      if (datasetMetrics.value && datasetMetrics.value.length > 0) {
        datasetMetrics.value.forEach(metric => {
          options.push({
            label: metric.metric_name || metric.label,
            value: metric.metric_name || metric.id,
            group: '데이터셋 메트릭'
          })
        })
      }

      // 3. 숫자형 컬럼에 대한 집계 함수들
      const numericColumns = props.datasetColumns.filter(col => 
        ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL', 'BIGINT', 'DOUBLE', 'REAL'].includes(col.type?.toUpperCase())
      )

      numericColumns.forEach(col => {
        options.push({
          label: `SUM(${col.column_name})`,
          value: `sum__${col.column_name}`,
          group: '합계 함수'
        })
        options.push({
          label: `AVG(${col.column_name})`,
          value: `avg__${col.column_name}`,
          group: '평균 함수'
        })
        options.push({
          label: `MAX(${col.column_name})`,
          value: `max__${col.column_name}`,
          group: '최대값 함수'
        })
        options.push({
          label: `MIN(${col.column_name})`,
          value: `min__${col.column_name}`,
          group: '최소값 함수'
        })
      })

      // 4. 모든 컬럼에 대한 COUNT
      props.datasetColumns.forEach(col => {
        options.push({
          label: `COUNT(${col.column_name})`,
          value: `count__${col.column_name}`,
          group: '카운트 함수'
        })
      })

      return options
    })

    // 카테고리형 컬럼 옵션
    const categoricalColumnOptions = computed(() => {
      return props.datasetColumns
        .filter(col => 
          ['STRING', 'VARCHAR', 'TEXT', 'CHAR'].includes(col.type?.toUpperCase()) ||
          ['DATE', 'DATETIME', 'TIMESTAMP'].includes(col.type?.toUpperCase())
        )
        .map(col => ({
          label: `${col.column_name} (${col.type})`,
          value: col.column_name
        }))
    })

    // 날짜형 컬럼 옵션
    const dateColumnOptions = computed(() => {
      return props.datasetColumns
        .filter(col => 
          ['DATE', 'DATETIME', 'TIMESTAMP', 'TIME'].includes(col.type?.toUpperCase())
        )
        .map(col => ({
          label: `${col.column_name}`,
          value: col.column_name
        }))
    })

    // 시간 범위 옵션
    const timeRangeOptions = [
      { label: '최근 1일', value: 'Last 1 day' },
      { label: '최근 7일', value: 'Last 7 days' },
      { label: '최근 30일', value: 'Last 30 days' },
      { label: '최근 90일', value: 'Last 90 days' },
      { label: '최근 1년', value: 'Last 1 year' },
      { label: '전체', value: 'No filter' }
    ]

    // 색상 테마 옵션
    const colorSchemeOptions = [
      { label: 'Superset 기본', value: 'bnbColors' },
      { label: 'Google', value: 'googleCategory10c' },
      { label: 'D3 Category', value: 'd3Category10' },
      { label: 'Tableau', value: 'tableau10' },
      { label: 'Categorical D3', value: 'categoricalD3' }
    ]

    // 필터 옵션 함수
    const filterOption = (input, option) => {
      return option.label.toLowerCase().includes(input.toLowerCase())
    }

    // 색상 테마 이름 가져오기
    const getColorSchemeName = () => {
      const scheme = colorSchemeOptions.find(opt => opt.value === config.value.color_scheme)
      return scheme ? scheme.label : '기본'
    }

    // 데이터셋 메트릭 로드
    const loadDatasetMetrics = async () => {
      if (!props.selectedDataset?.id) return

      metricsLoading.value = true
      try {
        const metrics = await supersetAPI.getDatasetMetrics(props.selectedDataset.id)
        datasetMetrics.value = metrics || []
        console.log('데이터셋 메트릭:', metrics)
      } catch (error) {
        console.error('메트릭 로드 오류:', error)
        // 에러가 나도 기본 집계 함수는 사용할 수 있으므로 치명적이지 않음
        datasetMetrics.value = []
      } finally {
        metricsLoading.value = false
      }
    }

    // 기본값 설정
    const setDefaultValues = () => {
      // 기본 메트릭으로 COUNT(*) 설정
      if (config.value.metrics.length === 0) {
        config.value.metrics = ['count']
      }
    }

    // config 변경 감지하여 상위 컴포넌트에 전달
    watch(config, (newConfig) => {
      emit('update', { params: newConfig })
    }, { deep: true })

    // 컴포넌트 마운트 시
    onMounted(async () => {
      await loadDatasetMetrics()
      setDefaultValues()
    })

    // 데이터셋 변경 감지
    watch(() => props.selectedDataset, async (newDataset) => {
      if (newDataset) {
        await loadDatasetMetrics()
      }
    })

    return {
      config,
      metricsLoading,
      isTimeSeriesChart,
      isConfigValid,
      metricOptions,
      categoricalColumnOptions,
      dateColumnOptions,
      timeRangeOptions,
      colorSchemeOptions,
      filterOption,
      getColorSchemeName
    }
  }
})
</script>

<style scoped>
.ant-select-selector {
  min-height: 32px;
}

.ant-descriptions-item-label {
  font-weight: 500;
}

.ant-card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

.ant-card-head-title {
  font-weight: 600;
}

.ant-form-item-label > label {
  font-weight: 500;
}

/* 필수 입력 필드 스타일 */
.ant-form-item-required::before {
  color: #ff4d4f;
}
</style>