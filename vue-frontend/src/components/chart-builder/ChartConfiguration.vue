<template>
  <a-card title="3단계: 차트 설정" style="margin-bottom: 16px">
    <a-alert
      message="차트 타입별 모든 옵션"
      description="Apache Superset에서 제공하는 모든 차트 옵션을 동적으로 표시합니다. 차트 타입에 따라 사용 가능한 옵션이 자동으로 변경됩니다."
      type="info"
      show-icon
      style="margin-bottom: 16px"
    />

    <!-- 🔍 디버깅: 컬럼 정보 확인 -->
    <a-alert
      v-if="datasetColumns.length === 0"
      message="경고"
      description="데이터셋 컬럼 정보가 없습니다. 이전 단계에서 데이터셋을 선택했는지 확인하세요."
      type="warning"
      show-icon
      closable
      style="margin-bottom: 16px"
    />

    <!-- 동적 차트 옵션 컴포넌트 -->
    <DynamicChartOptions
      v-if="chartConfig.viz_type"
      :chart-config="chartConfig"
      :dataset-columns="datasetColumns"
      :dataset-metrics="datasetMetrics"
      @update="handleUpdate"
    />

    <a-empty 
      v-else
      description="먼저 차트 타입을 선택해주세요"
      style="margin: 40px 0"
    />

    <!-- 설정 요약 카드 -->
    <a-card 
      v-if="chartConfig.viz_type && chartConfig.params"
      title="설정 요약" 
      size="small"
      style="margin-top: 24px"
    >
      <a-descriptions :column="2" size="small">
        <a-descriptions-item label="차트 타입">
          {{ getChartTypeName(chartConfig.viz_type) }}
        </a-descriptions-item>
        <a-descriptions-item label="데이터셋 컬럼 수">
          {{ datasetColumns.length }}개
        </a-descriptions-item>
        <a-descriptions-item label="메트릭">
          <span v-if="chartConfig.params.metrics?.length">
            {{ chartConfig.params.metrics.length }}개 선택됨
          </span>
          <span v-else style="color: #ff4d4f">선택 필요</span>
        </a-descriptions-item>
        <a-descriptions-item label="그룹 기준">
          <span v-if="chartConfig.params.groupby?.length">
            {{ chartConfig.params.groupby.length }}개 선택됨
          </span>
          <span v-else style="color: #999">선택 안됨</span>
        </a-descriptions-item>
        <a-descriptions-item label="행 제한">
          {{ chartConfig.params.row_limit || 10000 }}행
        </a-descriptions-item>
        <a-descriptions-item label="색상 테마">
          {{ chartConfig.params.color_scheme || '기본' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </a-card>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import DynamicChartOptions from './DynamicChartOptions.vue'
import supersetAPI from '../../services/supersetAPI'

export default defineComponent({
  name: 'ChartConfiguration',
  components: {
    DynamicChartOptions
  },
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
    const datasetMetrics = ref([])
    const metricsLoading = ref(false)

    const chartTypeNames = {
      table: '테이블',
      dist_bar: '막대 차트',
      bar: '막대 차트',
      line: '선 차트',
      pie: '파이 차트',
      area: '영역 차트',
      scatter: '산점도'
    }

    const getChartTypeName = (vizType) => {
      return chartTypeNames[vizType] || vizType
    }

    const handleUpdate = (updateData) => {
      emit('update', updateData)
    }

    // 데이터셋 메트릭 로드
    const loadDatasetMetrics = async () => {
      if (!props.selectedDataset?.id) {
        console.warn('선택된 데이터셋이 없습니다')
        return
      }

      metricsLoading.value = true
      try {
        const metrics = await supersetAPI.getDatasetMetrics(props.selectedDataset.id)
        datasetMetrics.value = metrics || []
        console.log('✅ 데이터셋 메트릭 로드 완료:', metrics)
      } catch (error) {
        console.error('❌ 메트릭 로드 오류:', error)
        datasetMetrics.value = []
      } finally {
        metricsLoading.value = false
      }
    }

    // 🔍 컬럼 데이터 디버깅
    watch(() => props.datasetColumns, (newColumns) => {
      console.log('📊 데이터셋 컬럼 정보:', newColumns)
      console.log('📊 컬럼 개수:', newColumns.length)
      if (newColumns.length > 0) {
        console.log('📊 첫 번째 컬럼 예시:', newColumns[0])
      }
    }, { immediate: true })

    onMounted(() => {
      loadDatasetMetrics()
    })

    return {
      datasetMetrics,
      metricsLoading,
      getChartTypeName,
      handleUpdate
    }
  }
})
</script>

<style scoped>
.ant-card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>