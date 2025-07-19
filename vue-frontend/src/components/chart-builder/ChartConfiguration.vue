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

      <!-- 표시 옵션 -->
      <a-card title="표시 옵션" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="행 제한">
              <a-input-number
                v-model:value="config.row_limit"
                :min="10"
                :max="10000"
                :step="100"
                placeholder="표시할 행 수"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="색상 테마">
              <a-select
                v-model:value="config.color_scheme"
                placeholder="색상 테마를 선택하세요"
                :options="colorSchemeOptions"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 차트별 특수 옵션 -->
        <a-row :gutter="16" v-if="chartConfig.viz_type === 'table'">
          <a-col :span="12">
            <a-form-item label="페이지 크기">
              <a-input-number
                v-model:value="config.page_length"
                :min="10"
                :max="500"
                :step="10"
                placeholder="페이지당 행 수"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item>
              <template #label>
                <span>검색 기능 포함</span>
              </template>
              <a-switch
                v-model:checked="config.include_search"
                checked-children="ON"
                un-checked-children="OFF"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-if="chartConfig.viz_type === 'pie'">
          <a-col :span="12">
            <a-form-item label="라벨 형식">
              <a-select
                v-model:value="config.pie_label_type"
                :options="[
                  { label: '키값', value: 'key' },
                  { label: '퍼센트', value: 'percent' },
                  { label: '키값과 퍼센트', value: 'key_percent' },
                  { label: '키값과 값', value: 'key_value' }
                ]"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-if="['line', 'area', 'scatter'].includes(chartConfig.viz_type)">
          <a-col :span="12">
            <a-form-item>
              <template #label>
                <span>마커 표시</span>
              </template>
              <a-switch
                v-model:checked="config.show_markers"
                checked-children="ON"
                un-checked-children="OFF"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item>
              <template #label>
                <span>범례 표시</span>
              </template>
              <a-switch
                v-model:checked="config.show_legend"
                checked-children="ON"
                un-checked-children="OFF"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- 설정 요약 -->
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
    </a-form>
  </a-card>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, nextTick } from 'vue'
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
    const isInitialized = ref(false) // 🔥 초기화 상태 추적

    // 무한 루프 방지를 위한 플래그
    const isUpdatingFromProps = ref(false)

    // 시계열 차트 여부 확인
    const isTimeSeriesChart = computed(() => {
      return ['line', 'area'].includes(props.chartConfig.viz_type)
    })

    // 설정 유효성 확인
    const isConfigValid = computed(() => {
      return config.value.metrics && config.value.metrics.length > 0
    })

    // 메트릭 옵션 생성
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

      // 4. 문자형 컬럼에 대한 집계 함수들
      const categoricalColumns = props.datasetColumns.filter(col => 
        ['VARCHAR', 'TEXT', 'STRING', 'CHAR'].includes(col.type?.toUpperCase())
      )

      categoricalColumns.forEach(col => {
        options.push({
          label: `COUNT(DISTINCT ${col.column_name})`,
          value: `count_distinct__${col.column_name}`,
          group: '고유값 개수'
        })
      })

      return options
    })

    // 카테고리형 컬럼 옵션
    const categoricalColumnOptions = computed(() => {
      return props.datasetColumns
        .filter(col => !['DATETIME', 'DATE', 'TIMESTAMP'].includes(col.type?.toUpperCase()))
        .map(col => ({
          label: col.column_name,
          value: col.column_name
        }))
    })

    // 날짜 컬럼 옵션
    const dateColumnOptions = computed(() => {
      return props.datasetColumns
        .filter(col => ['DATETIME', 'DATE', 'TIMESTAMP'].includes(col.type?.toUpperCase()))
        .map(col => ({
          label: col.column_name,
          value: col.column_name
        }))
    })

    // 시간 범위 옵션
    const timeRangeOptions = ref([
      { label: '지난 7일', value: 'Last 7 days' },
      { label: '지난 30일', value: 'Last 30 days' },
      { label: '지난 90일', value: 'Last 90 days' },
      { label: '지난 1년', value: 'Last year' },
      { label: '필터 없음', value: 'No filter' }
    ])

    // 색상 테마 옵션
    const colorSchemeOptions = ref([
      { label: '기본', value: 'bnbColors' },
      { label: 'Google', value: 'googleCategory10c' },
      { label: 'D3 Category', value: 'd3Category10' },
      { label: 'Superset', value: 'superset' },
      { label: 'Tableau', value: 'tableau10' },
      { label: 'D3 Categorical', value: 'categoricalD3' }
    ])

    // 검색 필터 함수
    const filterOption = (input, option) => {
      return option.label.toLowerCase().includes(input.toLowerCase())
    }

    // 색상 테마 이름 가져오기
    const getColorSchemeName = () => {
      const scheme = colorSchemeOptions.value.find(s => s.value === config.value.color_scheme)
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

    // 기본값 설정 함수 개선
    const setDefaultValues = () => {
      console.log('setDefaultValues 호출됨, 현재 차트 타입:', props.chartConfig.viz_type)
      
      // 🔥 기본 메트릭으로 COUNT(*) 설정 - 항상 설정되도록 보장
      if (!config.value.metrics || config.value.metrics.length === 0) {
        config.value.metrics = ['count']
        console.log('기본 메트릭 설정:', config.value.metrics)
      }
      
      // 🔥 차트별 기본 설정값 추가
      switch (props.chartConfig.viz_type) {
        case 'table':
          Object.assign(config.value, {
            page_length: 100,
            include_search: true,
            row_limit: 1000
          })
          break
        case 'dist_bar':
        case 'line':
        case 'area':
          Object.assign(config.value, {
            row_limit: 1000,
            color_scheme: 'bnbColors'
          })
          break
        case 'pie':
          Object.assign(config.value, {
            pie_label_type: 'key_value',
            color_scheme: 'bnbColors',
            row_limit: 1000
          })
          break
        case 'scatter':
          Object.assign(config.value, {
            row_limit: 1000,
            color_scheme: 'bnbColors'
          })
          break
      }
      
      console.log('기본값 설정 완료:', config.value)
    }

    // 🔥 무한 루프 방지 개선된 config 변경 감지
    watch(config, (newConfig) => {
      if (!isUpdatingFromProps.value && isInitialized.value) {
        console.log('config 변경됨, 상위 컴포넌트에 전달:', newConfig)
        emit('update', { params: { ...newConfig } })
      }
    }, { deep: true })

    // 🔥 차트 타입 변경 감지 (기본값 재설정)
    watch(() => props.chartConfig.viz_type, (newVizType, oldVizType) => {
      if (newVizType && newVizType !== oldVizType && isInitialized.value) {
        console.log('차트 타입 변경됨:', oldVizType, '→', newVizType)
        setDefaultValues()
      }
    })

    // 🔥 props.chartConfig 변경 감지 - 무한 루프 방지
    watch(() => props.chartConfig, (newConfig) => {
      console.log('props.chartConfig 변경됨:', newConfig)
      
      isUpdatingFromProps.value = true
      
      if (newConfig.params && Object.keys(newConfig.params).length > 0) {
        // 기존 설정이 있으면 로드 (기존 값 보존)
        console.log('기존 설정 로드:', newConfig.params)
        Object.assign(config.value, newConfig.params)
      } else if (isInitialized.value) {
        // 기존 설정이 없고 이미 초기화되었다면 기본값 설정
        console.log('기존 설정 없음, 기본값 설정')
        setDefaultValues()
      }
      
      // 다음 틱에서 플래그 해제
      nextTick(() => {
        isUpdatingFromProps.value = false
      })
    }, { immediate: true, deep: true })

    // 🔥 데이터셋 변경 감지
    watch(() => props.selectedDataset, async (newDataset, oldDataset) => {
      if (newDataset && newDataset.id !== oldDataset?.id) {
        console.log('데이터셋 변경됨:', newDataset)
        await loadDatasetMetrics()
        // 데이터셋이 변경되면 메트릭을 다시 기본값으로 설정
        if (isInitialized.value) {
          config.value.metrics = ['count']
        }
      }
    })

    // 🔥 컴포넌트 마운트 시
    onMounted(async () => {
      console.log('ChartConfiguration 마운트됨')
      await loadDatasetMetrics()
      
      // 초기값 설정
      if (!props.chartConfig.params || Object.keys(props.chartConfig.params).length === 0) {
        setDefaultValues()
      }
      
      isInitialized.value = true
      console.log('초기화 완료')
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