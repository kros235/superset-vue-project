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

    const handleDatasetChange = async (datasetId) => {
      const dataset = datasets.value.find(d => d.id === datasetId)
      selectedDataset.value = dataset
      chartConfig.value.datasource = `${datasetId}__table`
      await loadDatasetColumns(datasetId)
    }

    const handleChartTypeChange = (vizType) => {
      chartConfig.value.viz_type = vizType
      chartConfig.value.params = getDefaultParams(vizType)
    }

    const getDefaultParams = (vizType) => {
      const defaults = {
        table: {
          query_mode: 'aggregate',
          groupby: [],
          metrics: [],
          all_columns: [],
          row_limit: 1000
        },
        bar: {
          query_mode: 'aggregate',
          groupby: [],
          metrics: [],
          row_limit: 1000,
          color_scheme: 'bnbColors'
        },
        line: {
          query_mode: 'aggregate',
          groupby: [],
          metrics: [],
          row_limit: 1000,
          color_scheme: 'bnbColors'
        },
        pie: {
          query_mode: 'aggregate',
          groupby: [],
          metrics: [],
          row_limit: 1000,
          color_scheme: 'bnbColors'
        }
      }
      return defaults[vizType] || defaults.table
    }

    const updateChartParams = (key, value) => {
      chartConfig.value.params = {
        ...chartConfig.value.params,
        [key]: value
      }
    }

    const updateChartConfig = (key, value) => {
      chartConfig.value[key] = value
    }

    const setCurrentStep = (step) => {
      currentStep.value = step
    }

    const previewChart = async () => {
      if (!selectedDataset.value || !chartConfig.value.viz_type) {
        message.warning('데이터셋과 차트 타입을 선택해주세요.')
        return
      }

      previewLoading.value = true
      try {
        const payload = {
          datasource: chartConfig.value.datasource,
          viz_type: chartConfig.value.viz_type,
          form_data: chartConfig.value.params
        }

        const result = await supersetAPI.getChartData(payload)
        chartData.value = result
        message.success('차트 미리보기가 생성되었습니다.')
      } catch (error) {
        console.error('차트 미리보기 오류:', error)
        message.error('차트 미리보기 생성 중 오류가 발생했습니다.')
      } finally {
        previewLoading.value = false
      }
    }

    const saveChart = async () => {
      if (!chartConfig.value.slice_name) {
        message.warning('차트 이름을 입력해주세요.')
        return
      }

      try {
        const payload = {
          slice_name: chartConfig.value.slice_name,
          description: chartConfig.value.description,
          viz_type: chartConfig.value.viz_type,
          datasource_id: selectedDataset.value.id,
          datasource_type: 'table',
          params: JSON.stringify(chartConfig.value.params)
        }

        await supersetAPI.createChart(payload)
        message.success('차트가 성공적으로 저장되었습니다.')
        resetForm()
      } catch (error) {
        console.error('차트 저장 오류:', error)
        message.error('차트 저장 중 오류가 발생했습니다.')
      }
    }

    const resetForm = () => {
      currentStep.value = 0
      selectedDataset.value = null
      datasetColumns.value = []
      chartConfig.value = {
        datasource: '',
        viz_type: 'table',
        slice_name: '',
        description: '',
        params: {}
      }
      chartData.value = null
    }

    onMounted(() => {
      if (canCreateChart.value) {
        loadDatasets()
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
      handleDatasetChange,
      handleChartTypeChange,
      updateChartParams,
      updateChartConfig,
      setCurrentStep,
      previewChart,
      saveChart,
      resetForm,
      h
    }
  }
})
</script>