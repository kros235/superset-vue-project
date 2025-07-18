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

      <template v-else>
        <!-- 1단계: 데이터셋 선택 -->
        <DatasetSelection
          v-if="currentStep >= 0"
          :datasets="datasets"
          :selectedDataset="selectedDataset"
          :loading="loading"
          @change="handleDatasetChange"
        />

        <!-- 2단계: 차트 타입 선택 -->
        <ChartTypeSelection
          v-if="selectedDataset && currentStep >= 1"
          :chartConfig="chartConfig"
          @change="handleChartTypeChange"
        />

        <!-- 3단계: 차트 설정 -->
        <ChartConfiguration
          v-if="selectedDataset && chartConfig.viz_type && datasetColumns.length > 0 && currentStep >= 2"
          :chartConfig="chartConfig"
          :datasetColumns="datasetColumns"
          @update="updateChartParams"
        />

        <!-- 4단계: 차트 정보 -->
        <ChartDetails
          v-if="selectedDataset && chartConfig.viz_type && currentStep >= 3"
          :chartConfig="chartConfig"
          @update="updateChartConfig"
        />

        <!-- 5단계: 미리보기 및 저장 -->
        <ChartPreview
          v-if="selectedDataset && chartConfig.viz_type && currentStep >= 4"
          :chartConfig="chartConfig"
          :chartData="chartData"
          :previewLoading="previewLoading"
          @preview="previewChart"
          @save="saveChart"
        />
      </template>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import supersetAPI from '../services/supersetAPI'
import DatasetSelection from '../components/chart-builder/DatasetSelection.vue'
import ChartTypeSelection from '../components/chart-builder/ChartTypeSelection.vue'
import ChartConfiguration from '../components/chart-builder/ChartConfiguration.vue'
import ChartDetails from '../components/chart-builder/ChartDetails.vue'
import ChartPreview from '../components/chart-builder/ChartPreview.vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'ChartBuilderView',
  components: {
    ReloadOutlined,
    DatasetSelection,
    ChartTypeSelection,
    ChartConfiguration,
    ChartDetails,
    ChartPreview
  },
  setup () {

    const router = useRouter()

    const currentStep = ref(0)
    const loading = ref(false)
    const datasets = ref([])
    const selectedDataset = ref(null)
    const datasetColumns = ref([])
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
      } catch (error) {
        console.error('컬럼 로드 오류:', error)
        message.error('데이터셋 컬럼을 불러오는 중 오류가 발생했습니다.')
      }
    }

    const handleDatasetSelect = async (datasetId) => {
      selectedDataset.value = datasets.value.find(d => d.id === datasetId)
      chartConfig.value.datasource = datasetId
      await loadDatasetColumns(datasetId)
      if (currentStep.value === 0) {
        currentStep.value = 1
      }
    }

    const handleChartTypeSelect = (vizType) => {
      chartConfig.value.viz_type = vizType
      if (currentStep.value === 1) {
        currentStep.value = 2
      }
    }

    const handleConfigChange = (config) => {
      chartConfig.value.params = { ...chartConfig.value.params, ...config }
      if (currentStep.value === 2) {
        currentStep.value = 3
      }
    }

    const handleDetailsChange = (details) => {
      chartConfig.value.slice_name = details.slice_name
      chartConfig.value.description = details.description
      if (currentStep.value === 3) {
        currentStep.value = 4
      }
    }

    const previewChart = async () => {
      if (!canCreateChart.value) {
        message.error('차트 생성 권한이 없습니다.')
        return
      }

      previewLoading.value = true
      try {
        const data = await supersetAPI.getChartData(null, {
          datasource_id: chartConfig.value.datasource,
          viz_type: chartConfig.value.viz_type,
          ...chartConfig.value.params
        })
        chartData.value = data
      } catch (error) {
        console.error('차트 미리보기 오류:', error)
        message.error('차트 미리보기를 불러오는 중 오류가 발생했습니다.')
      } finally {
        previewLoading.value = false
      }
    }

    const saveChart = async () => {
      if (!canCreateChart.value) {
        message.error('차트 생성 권한이 없습니다.')
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

    const goToStep = (step) => {
      if (step <= currentStep.value) {
        currentStep.value = step
      }
    }

    const handleDatasetChange = async (datasetId) => {
      const dataset = datasets.value.find(d => d.id === datasetId)
      selectedDataset.value = dataset
      chartConfig.value.datasource_id = datasetId
      
      try {
        await loadDatasetColumns(datasetId)
        console.log('데이터셋 변경됨:', dataset)
      } catch (error) {
        console.error('데이터셋 컬럼 로드 오류:', error)
        message.error('데이터셋 컬럼 정보를 불러오는 중 오류가 발생했습니다.')
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
        const schema = route.query.schema
        
        console.log('쿼리 파라미터로 전달된 데이터셋 정보:', {
          datasetId,
          datasetName,
          schema
        })
    
        // 해당 데이터셋이 목록에 있는지 확인
        const targetDataset = datasets.value.find(d => d.id === datasetId)
        if (targetDataset) {
          // 자동으로 데이터셋 선택
          await handleDatasetChange(datasetId)
          message.success(`${datasetName} 데이터셋이 선택되었습니다.`)
          
          // 1단계에서 2단계로 자동 진행
          if (currentStep.value === 0) {
            currentStep.value = 1
          }
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
      chartConfig,
      chartData,
      previewLoading,
      steps,
      canCreateChart,
      loadDatasets,
      loadDatasetColumns,
      handleDatasetSelect,
      handleChartTypeSelect,
      handleConfigChange,
      handleDetailsChange,
      previewChart,
      saveChart,
      goToStep
    }
  }
})
</script>
