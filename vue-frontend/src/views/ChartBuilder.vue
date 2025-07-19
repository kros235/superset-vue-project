<template>
  <div>
    <div style="margin-bottom: 24px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 600">
            차트 빌더
          </h1>
          <p style="margin: 8px 0 0 0; color: #666">
            Apache Superset을 사용하여 차트를 생성하고 관리합니다.
          </p>
        </div>
        <a-button @click="resetForm">
          <template #icon>
            <ReloadOutlined />
          </template>
          새로 시작
        </a-button>
      </div>
    </div>

    <a-alert
      v-if="!canCreateChart"
      message="접근 권한 없음"
      description="차트 생성 권한이 없습니다."
      type="warning"
      show-icon
    />

    <template v-else>
      <!-- 단계 표시기 -->
      <a-steps :current="currentStep" style="margin-bottom: 24px">
        <a-step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description"
          @click="setCurrentStep(index)"
          style="cursor: pointer"
        />
      </a-steps>

      <a-alert
        v-if="datasets.length === 0"
        message="데이터셋이 필요합니다"
        description="차트를 생성하려면 먼저 데이터 소스에서 데이터셋을 생성해야 합니다."
        type="info"
        show-icon
        :action="() => h('a-button', { type: 'primary', onClick: () => $router.push('/datasources') }, '데이터 소스 관리로 이동')"
      />

      <!-- 🔥 핵심 수정: 단계별 컴포넌트를 조건부 렌더링이 아닌 v-show로 제어 -->
      <div v-else>
        <!-- 1단계: 데이터셋 선택 -->
        <div v-show="currentStep === 0">
          <DatasetSelection
            :datasets="datasets"
            :selectedDataset="selectedDataset"
            :loading="loading"
            @change="handleDatasetChange"
          />
        </div>

        <!-- 2단계: 차트 타입 선택 -->
        <div v-show="currentStep === 1 && selectedDataset">
          <ChartTypeSelection
            :selectedType="chartConfig.viz_type"
            @select="handleChartTypeChange"
            @next="goToNextStep"
            @back="goToPrevStep"
          />
        </div>

        <!-- 3단계: 차트 설정 -->
        <div v-show="currentStep === 2 && selectedDataset && chartConfig.viz_type && datasetColumns.length > 0">
          <ChartConfiguration
            :chartConfig="chartConfig"
            :datasetColumns="datasetColumns"
            :selectedDataset="selectedDataset"
            @update="updateChartConfig"
            @next="goToNextStep"
            @back="goToPrevStep"
          />
        </div>

        <!-- 4단계: 차트 정보 -->
        <div v-show="currentStep === 3 && selectedDataset && chartConfig.viz_type">
          <ChartDetails
            :chartConfig="chartConfig"
            :selectedDataset="selectedDataset"
            @update="updateChartConfig"
            @next="goToNextStep"
            @back="goToPrevStep"
          />
        </div>

        <!-- 5단계: 미리보기 및 저장 -->
        <div v-show="currentStep === 4 && selectedDataset && chartConfig.viz_type">
          <ChartPreview
            :chartConfig="chartConfig"
            :chartData="chartData"
            :previewLoading="previewLoading"
            @preview="previewChart"
            @save="saveChart"
            @back="goToPrevStep"
          />
        </div>

        <!-- 🔥 하단 네비게이션 버튼 -->
        <div v-if="datasets.length > 0" style="margin-top: 24px; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 24px">
          <a-space>
            <a-button 
              v-if="currentStep > 0"
              @click="goToPrevStep"
              size="large"
            >
              <template #icon>
                <LeftOutlined />
              </template>
              이전 단계
            </a-button>
            
            <a-button 
              v-if="currentStep < steps.length - 1"
              type="primary"
              @click="goToNextStep"
              :disabled="!canGoNext"
              size="large"
            >
              다음 단계
              <template #icon>
                <RightOutlined />
              </template>
            </a-button>

            <a-button 
              v-if="currentStep === steps.length - 1"
              type="primary" 
              @click="saveChart"
              :disabled="!canSaveChart"
              size="large"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              차트 저장
            </a-button>
          </a-space>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ReloadOutlined, 
  LeftOutlined, 
  RightOutlined, 
  SaveOutlined 
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import supersetAPI from '../services/supersetAPI'
import DatasetSelection from '../components/chart-builder/DatasetSelection.vue'
import ChartTypeSelection from '../components/chart-builder/ChartTypeSelection.vue'
import ChartConfiguration from '../components/chart-builder/ChartConfiguration.vue'
import ChartDetails from '../components/chart-builder/ChartDetails.vue'
import ChartPreview from '../components/chart-builder/ChartPreview.vue'

export default defineComponent({
  name: 'ChartBuilderView',
  components: {
    ReloadOutlined,
    LeftOutlined,
    RightOutlined,
    SaveOutlined,
    DatasetSelection,
    ChartTypeSelection,
    ChartConfiguration,
    ChartDetails,
    ChartPreview
  },
  setup() {
    const router = useRouter()
    const route = useRoute()

    const currentStep = ref(0)
    const loading = ref(false)
    const datasets = ref([])
    const selectedDataset = ref(null)
    const datasetColumns = ref([])
    const datasetMetrics = ref([])
    const chartData = ref(null)
    const previewLoading = ref(false)

    const chartConfig = ref({
      datasource: '',
      viz_type: 'table',
      slice_name: '',
      description: '',
      params: {}
    })

    const steps = [
      { title: '데이터셋', description: '데이터 선택' },
      { title: '차트 타입', description: '시각화 유형' },
      { title: '설정', description: '차트 구성' },
      { title: '정보', description: '이름 및 설명' },
      { title: '저장', description: '미리보기 및 저장' }
    ]

    const canCreateChart = computed(() => authService.canCreateChart())

    // 🔥 단계별 진행 가능 여부 검증
    const canGoNext = computed(() => {
      switch (currentStep.value) {
        case 0: // 데이터셋 선택
          return selectedDataset.value !== null
        case 1: // 차트 타입 선택
          return chartConfig.value.viz_type !== ''
        case 2: // 차트 설정
          return chartConfig.value.params?.metrics?.length > 0
        case 3: // 차트 정보
          return chartConfig.value.slice_name?.trim() !== ''
        default:
          return false
      }
    })

    // 🔥 차트 저장 가능 여부
    const canSaveChart = computed(() => {
      return selectedDataset.value && 
             chartConfig.value.viz_type && 
             chartConfig.value.slice_name?.trim() &&
             chartConfig.value.params?.metrics?.length > 0
    })

    const loadDatasets = async () => {
      loading.value = true
      try {
        const data = await supersetAPI.getDatasets()
        datasets.value = data
      } catch (error) {
        console.error('데이터셋 로드 오류:', error)
        message.error('데이터셋을 불러오는 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    const loadDatasetColumns = async (datasetId) => {
      try {
        const columns = await supersetAPI.getDatasetColumns(datasetId)
        datasetColumns.value = columns
        console.log('데이터셋 컬럼:', columns)
        
        // 메트릭도 함께 로드
        try {
          const metrics = await supersetAPI.getDatasetMetrics(datasetId)
          datasetMetrics.value = metrics || []
          console.log('데이터셋 메트릭:', metrics)
        } catch (metricError) {
          console.warn('메트릭 로드 중 오류 (무시 가능):', metricError)
          datasetMetrics.value = []
        }
      } catch (error) {
        console.error('컬럼 로드 오류:', error)
        message.error('데이터셋 컬럼을 불러오는 중 오류가 발생했습니다.')
      }
    }

    // 🔥 단계 직접 설정 (클릭으로 이동)
    const setCurrentStep = (step) => {
      // 이전 단계나 현재 단계로만 이동 가능
      if (step <= currentStep.value || step === 0) {
        currentStep.value = step
      }
    }

    // 🔥 다음 단계로 이동
    const goToNextStep = () => {
      if (canGoNext.value && currentStep.value < steps.length - 1) {
        currentStep.value++
        console.log('다음 단계로 이동:', currentStep.value)
      }
    }

    // 🔥 이전 단계로 이동
    const goToPrevStep = () => {
      if (currentStep.value > 0) {
        currentStep.value--
        console.log('이전 단계로 이동:', currentStep.value)
      }
    }

    // 폼 초기화
    const resetForm = () => {
      currentStep.value = 0
      selectedDataset.value = null
      datasetColumns.value = []
      datasetMetrics.value = []
      chartData.value = null
      chartConfig.value = {
        datasource: '',
        viz_type: 'table',
        slice_name: '',
        description: '',
        params: {}
      }
      message.success('폼이 초기화되었습니다.')
    }

    const handleDatasetChange = async (datasetId) => {
      const dataset = datasets.value.find(d => d.id === datasetId)
      selectedDataset.value = dataset
      chartConfig.value.datasource_id = datasetId
      
      try {
        await loadDatasetColumns(datasetId)
        console.log('데이터셋 변경됨:', dataset)
        // 데이터셋이 선택되면 자동으로 다음 단계로 진행하지 않음 (수동 조작)
      } catch (error) {
        console.error('데이터셋 컬럼 로드 오류:', error)
        message.error('데이터셋 컬럼 정보를 불러오는 중 오류가 발생했습니다.')
      }
    }

    const handleChartTypeChange = (vizType) => {
      chartConfig.value.viz_type = vizType
      console.log('차트 타입 변경됨:', vizType)
    }

    const updateChartConfig = (updates) => {
      if (typeof updates === 'object') {
        Object.assign(chartConfig.value, updates)
        if (updates.params) {
          chartConfig.value.params = { ...chartConfig.value.params, ...updates.params }
        }
      }
      console.log('차트 설정 업데이트:', chartConfig.value)
    }

    const previewChart = async () => {
      if (!selectedDataset.value || !chartConfig.value.viz_type) {
        message.warning('데이터셋과 차트 타입을 먼저 선택해주세요.')
        return
      }

      previewLoading.value = true
      try {
        const preview = await supersetAPI.previewChart(chartConfig.value)
        chartData.value = preview
        message.success('차트 미리보기가 생성되었습니다.')
      } catch (error) {
        console.error('차트 미리보기 오류:', error)
        message.error('차트 미리보기 생성 중 오류가 발생했습니다.')
      } finally {
        previewLoading.value = false
      }
    }

    const saveChart = async () => {
      if (!canSaveChart.value) {
        message.error('필수 정보를 모두 입력해주세요.')
        return
      }

      try {
        await supersetAPI.createChart(chartConfig.value)
        message.success('차트가 성공적으로 생성되었습니다!')
        router.push('/')
      } catch (error) {
        console.error('차트 저장 오류:', error)
        message.error('차트 저장 중 오류가 발생했습니다.')
      }
    }

    onMounted(async () => {
      if (!canCreateChart.value) {
        message.error('차트 생성 권한이 없습니다.')
        return
      }
    
      // 데이터셋 목록 로드
      await loadDatasets()
    
      // URL 쿼리 파라미터에서 데이터셋 정보 확인
      if (route.query.datasetId) {
        const datasetId = parseInt(route.query.datasetId)
        const datasetName = route.query.datasetName
        
        console.log('쿼리 파라미터로 전달된 데이터셋 정보:', {
          datasetId,
          datasetName
        })
    
        // 해당 데이터셋이 목록에 있는지 확인
        const targetDataset = datasets.value.find(d => d.id === datasetId)
        if (targetDataset) {
          // 자동으로 데이터셋 선택
          await handleDatasetChange(datasetId)
          message.success(`${datasetName} 데이터셋이 선택되었습니다.`)
        } else {
          message.warning(`데이터셋 ID ${datasetId}를 찾을 수 없습니다.`)
        }
      }
    })

    return {
      currentStep,
      loading,
      datasets,
      selectedDataset,
      datasetColumns,
      datasetMetrics,
      chartConfig,
      chartData,
      previewLoading,
      steps,
      canCreateChart,
      canGoNext,
      canSaveChart,
      setCurrentStep,
      goToNextStep,
      goToPrevStep,
      resetForm,
      handleDatasetChange,
      handleChartTypeChange,
      updateChartConfig,
      previewChart,
      saveChart,
      h
    }
  }
})
</script>

<style scoped>
.ant-steps-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.ant-steps-item:hover {
  background-color: #f5f5f5;
  border-radius: 6px;
}

/* 단계별 컨테이너 스타일 */
div[v-show] {
  transition: opacity 0.3s ease;
}

/* 네비게이션 버튼 영역 */
.ant-space {
  gap: 16px !important;
}

/* 하단 네비게이션 스타일 */
.ant-btn-large {
  height: 48px;
  padding: 0 24px;
  font-size: 16px;
}
</style>