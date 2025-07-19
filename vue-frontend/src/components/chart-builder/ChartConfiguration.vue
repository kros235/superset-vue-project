<template>
  <a-card title="3단계: 차트 설정" style="margin-bottom: 24px">
    <p style="color: #666; margin-bottom: 24px">
      선택한 차트 타입에 맞는 설정을 구성하세요.
    </p>

    <a-form layout="vertical">
      <!-- 기본 설정 -->
      <a-card title="기본 설정" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="메트릭 (Metrics)" required>
              <a-select
                v-model:value="config.metrics"
                mode="multiple"
                placeholder="측정할 메트릭을 선택하세요"
                :options="metricOptions"
                :loading="metricsLoading"
                show-search
                :filter-option="filterOption"
              >
                <template #notFoundContent>
                  <a-empty description="사용 가능한 메트릭이 없습니다" />
                </template>
              </a-select>
              <div style="margin-top: 8px; color: #666; font-size: 12px">
                메트릭이 없으면 기본 집계 함수를 사용합니다
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="그룹 기준 (Group By)">
              <a-select
                v-model:value="config.groupby"
                mode="multiple"
                placeholder="그룹핑할 컬럼을 선택하세요"
                :options="categoricalColumnOptions"
                show-search
                :filter-option="filterOption"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 시계열 차트 전용 설정 -->
        <a-row :gutter="16" v-if="isTimeSeriesChart">
          <a-col :span="12">
            <a-form-item label="시간 컬럼">
              <a-select
                v-model:value="config.granularity_sqla"
                placeholder="시간 기준 컬럼을 선택하세요"
                :options="dateColumnOptions"
                show-search
                :filter-option="filterOption"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="시간 범위">
              <a-select
                v-model:value="config.time_range"
                placeholder="분석할 시간 범위를 선택하세요"
                :options="timeRangeOptions"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 행 제한 설정 -->
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="행 제한">
              <a-input-number
                v-model:value="config.row_limit"
                :min="1"
                :max="50000"
                :step="100"
                placeholder="조회할 최대 행 수"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="정렬">
              <a-select
                v-model:value="config.order_desc"
                placeholder="정렬 방향을 선택하세요"
              >
                <a-select-option value="desc">내림차순</a-select-option>
                <a-select-option value="asc">오름차순</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <!-- 차트별 세부 설정 -->
      <a-card v-if="chartConfig.viz_type === 'table'" title="테이블 설정" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="페이지 크기">
              <a-input-number
                v-model:value="config.page_length"
                :min="10"
                :max="1000"
                :step="10"
                placeholder="테이블에 표시할 행 수"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item>
              <a-checkbox v-model:checked="config.include_search">
                검색 기능 포함
              </a-checkbox>
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
                placeholder="라벨 표시 방식을 선택하세요"
              >
                <a-select-option :value="'key'">키만</a-select-option>
                <a-select-option :value="'value'">값만</a-select-option>
                <a-select-option :value="'percent'">퍼센트만</a-select-option>
                <a-select-option :value="'key_value'">키와 값</a-select-option>
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

      <!-- 버튼 -->
      <div style="text-align: center">
        <a-space>
          <a-button @click="goToPrevious">
            이전
          </a-button>
          <a-button type="primary" @click="handleNext" :disabled="!isConfigValid">
            다음 단계
          </a-button>
        </a-space>
      </div>
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

      // 3. 숫자형 컬럼에 대한 집계 함수
      const numericColumns = props.datasetColumns.filter(col => 
        ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL', 'DOUBLE', 'REAL', 'BIGINT'].includes(col.type?.toUpperCase())
      )

      numericColumns.forEach(col => {
        options.push(
          {
            label: `SUM(${col.column_name})`,
            value: `sum__${col.column_name}`,
            group: '집계 함수'
          },
          {
            label: `AVG(${col.column_name})`,
            value: `avg__${col.column_name}`,
            group: '집계 함수'
          },
          {
            label: `MAX(${col.column_name})`,
            value: `max__${col.column_name}`,
            group: '집계 함수'
          },
          {
            label: `MIN(${col.column_name})`,
            value: `min__${col.column_name}`,
            group: '집계 함수'
          }
        )
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

    // 다음 단계로 이동
    const handleNext = () => {
      if (!isConfigValid.value) {
        message.warning('메트릭을 최소 1개 이상 선택해주세요.')
        return
      }
      
      emit('update', config.value)
      emit('next')
    }

    // 이전 단계로 이동
    const goToPrevious = () => {
      emit('back')
    }

    // 기본값 설정
    const setDefaultValues = () => {
      // 기본 메트릭으로 COUNT(*) 설정
      if (config.value.metrics.length === 0) {
        config.value.metrics = ['count']
      }
    }

    // config 변경 감지
    watch(config, (newConfig) => {
      emit('update', newConfig)
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
      getColorSchemeName,
      handleNext,
      goToPrevious
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
}
</style>