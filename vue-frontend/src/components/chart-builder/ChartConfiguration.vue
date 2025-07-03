<template>
  <div>
    <h3>차트 설정</h3>
    <p style="color: #666; margin-bottom: 24px">
      선택한 차트 타입에 맞는 설정을 구성하세요.
    </p>

    <a-form layout="vertical" @finish="handleSubmit">
      <!-- 공통 설정 -->
      <a-card title="기본 설정" style="margin-bottom: 16px">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="메트릭 컬럼">
              <a-select
                v-model:value="config.metrics"
                mode="multiple"
                placeholder="메트릭으로 사용할 컬럼을 선택하세요"
                :options="numericColumnOptions"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="그룹 기준">
              <a-select
                v-model:value="config.groupby"
                mode="multiple"
                placeholder="그룹핑할 컬럼을 선택하세요"
                :options="categoricalColumnOptions"
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
      </a-card>

      <!-- 차트별 세부 설정 -->
      <a-card v-if="chartConfig.viz_type === 'table'" title="테이블 설정">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="페이지 크기">
              <a-input-number
                v-model:value="config.page_length"
                :min="10"
                :max="1000"
                :step="10"
                placeholder="테이블에 표시할 행 수"
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

      <a-card v-if="chartConfig.viz_type === 'dist_bar'" title="막대 차트 설정">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="정렬 방식">
              <a-select
                v-model:value="config.order_desc"
                placeholder="정렬 방식을 선택하세요"
              >
                <a-select-option :value="true">내림차순</a-select-option>
                <a-select-option :value="false">오름차순</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="표시할 개수">
              <a-input-number
                v-model:value="config.row_limit"
                :min="1"
                :max="1000"
                placeholder="막대로 표시할 데이터 개수"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <a-card v-if="chartConfig.viz_type === 'line'" title="선 차트 설정">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item>
              <a-checkbox v-model:checked="config.show_markers">
                데이터 포인트 표시
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

      <a-card v-if="chartConfig.viz_type === 'pie'" title="파이 차트 설정">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="표시할 개수">
              <a-input-number
                v-model:value="config.pie_label_type"
                :min="3"
                :max="20"
                placeholder="파이 조각 개수"
              />
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

      <!-- 공통 스타일 설정 -->
      <a-card title="스타일 설정">
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
          <a-col :span="12">
            <a-form-item label="차트 높이">
              <a-input-number
                v-model:value="config.chart_height"
                :min="200"
                :max="1000"
                :step="50"
                placeholder="차트 높이 (픽셀)"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <div style="margin-top: 24px; text-align: center">
        <a-space>
          <a-button @click="$emit('back')">
            이전
          </a-button>
          <a-button type="primary" @click="handleNext">
            다음 단계
          </a-button>
        </a-space>
      </div>
    </a-form>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'

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
    }
  },
  emits: ['change', 'next', 'back'],
  setup (props, { emit }) {
    const config = ref({
      metrics: [],
      groupby: [],
      granularity_sqla: '',
      time_range: 'Last 30 days',
      page_length: 100,
      include_search: true,
      order_desc: true,
      row_limit: 50,
      show_markers: true,
      show_legend: true,
      pie_label_type: 10,
      color_scheme: 'supersetColors',
      chart_height: 400,
      ...props.chartConfig.params
    })

    const isTimeSeriesChart = computed(() => {
      return ['line', 'area', 'bar'].includes(props.chartConfig.viz_type)
    })

    const numericColumnOptions = computed(() => {
      return props.datasetColumns
        .filter(col => col.type === 'NUMERIC' || col.is_numeric)
        .map(col => ({
          label: col.column_name,
          value: col.column_name
        }))
    })

    const categoricalColumnOptions = computed(() => {
      return props.datasetColumns
        .filter(col => col.type !== 'NUMERIC' || !col.is_numeric)
        .map(col => ({
          label: col.column_name,
          value: col.column_name
        }))
    })

    const dateColumnOptions = computed(() => {
      return props.datasetColumns
        .filter(col => col.type === 'DATETIME' || col.is_dttm)
        .map(col => ({
          label: col.column_name,
          value: col.column_name
        }))
    })

    const timeRangeOptions = ref([
      { label: '지난 1일', value: 'Last 1 day' },
      { label: '지난 7일', value: 'Last 7 days' },
      { label: '지난 30일', value: 'Last 30 days' },
      { label: '지난 90일', value: 'Last 90 days' },
      { label: '지난 1년', value: 'Last 1 year' }
    ])

    const colorSchemeOptions = ref([
      { label: 'Superset 기본', value: 'supersetColors' },
      { label: '블루 계열', value: 'blue' },
      { label: '그린 계열', value: 'green' },
      { label: '오렌지 계열', value: 'orange' },
      { label: '퍼플 계열', value: 'purple' }
    ])

    watch(config, (newConfig) => {
      emit('change', newConfig)
    }, { deep: true })

    const handleNext = () => {
      emit('change', config.value)
      emit('next')
    }

    return {
      config,
      isTimeSeriesChart,
      numericColumnOptions,
      categoricalColumnOptions,
      dateColumnOptions,
      timeRangeOptions,
      colorSchemeOptions,
      handleNext
    }
  }
})
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}

.ant-form-item {
  margin-bottom: 16px;
}
</style>
