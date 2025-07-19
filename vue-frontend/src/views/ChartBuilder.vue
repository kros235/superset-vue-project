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
          :selectedType="chartConfig.viz_type"
          @select="handleChartTypeChange"
          @next="goToNextStep"
        />

        <!-- 3단계: 차트 설정 -->
        <ChartConfiguration
          v-if="selectedDataset && chartConfig.viz_type && datasetColumns.length > 0 && currentStep >= 2"
          :chartConfig="chartConfig"
          :datasetColumns="datasetColumns"
          :selectedDataset="selectedDataset"
          @update="updateChartParams"
          @next="goToNextStep"
          @back="goToPrevStep"
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
import { useRouter, useRoute } from 'vue-router'
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

    // ✅ 누락된 setCurrentStep 함수 추가
    const setCurrentStep = (step) => {
      // 현재 단계보다 이전 단계나 같은 단계로만 이동 가능
      if (step <= currentStep.value || step === 0) {
        currentStep.value = step
      }
    }

    // ✅ 누락된 resetForm 함수 추가
    const resetForm = () => {
      currentStep.value = 0
      selectedDataset.value = null
      datasetColumns.value = []
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
        // 데이터셋이 선택되면 자동으로 다음 단계로 진행
        if (currentStep.value === 0) {
          currentStep.value = 1
        }
      } catch (error) {
        console.error('데이터셋 컬럼 로드 오류:', error)
        message.error('데이터셋 컬럼 정보를 불러오는 중 오류가 발생했습니다.')
      }
    }

    // ✅ goToPrevStep 함수 추가
    const goToPrevStep = () => {
      if (currentStep.value > 0) {
        currentStep.value -= 1
      }
    }

    // ✅ goToNextStep 함수 추가
    const goToNextStep = () => {
      if (currentStep.value < steps.length - 1) {
        currentStep.value += 1
      }
    }

    // ✅ 누락된 handleChartTypeChange 함수 수정
    const handleChartTypeChange = (vizType) => {
      chartConfig.value.viz_type = vizType
      console.log('차트 타입 변경됨:', vizType)
      // 차트 타입이 선택되면 자동으로 다음 단계로 진행
      if (currentStep.value === 1) {
        currentStep.value = 2
      }
    }

    // ✅ 누락된 updateChartParams 함수 추가
    const updateChartParams = (params) => {
      chartConfig.value.params = { ...chartConfig.value.params, ...params }
      console.log('차트 파라미터 업데이트됨:', params)
      // 설정이 완료되면 자동으로 다음 단계로 진행
      if (currentStep.value === 2) {
        currentStep.value = 3
      }
    }

    // ✅ 누락된 updateChartConfig 함수 추가
    const updateChartConfig = (config) => {
      chartConfig.value.slice_name = config.slice_name
      chartConfig.value.description = config.description
      console.log('차트 정보 업데이트됨:', config)
      // 정보가 입력되면 자동으로 다음 단계로 진행
      if (currentStep.value === 3) {
        currentStep.value = 4
      }
    }

    const previewChart = async () => {
      if (!canCreateChart.value) {
        message.error('차트 생성 권한이 없습니다.')
        return
      }

      if (!selectedDataset.value || !chartConfig.value.viz_type) {
        message.error('데이터셋과 차트 타입을 선택해주세요.')
        return
      }

      if (!chartConfig.value.params.metrics || chartConfig.value.params.metrics.length === 0) {
        message.error('메트릭을 최소 1개 이상 선택해주세요.')
        return
      }

      previewLoading.value = true
      try {
        console.log('=== Superset 정보 확인 ===')
        
        // 1. Superset 버전 확인
        try {
          const healthResponse = await supersetAPI.api.get('/health')
          console.log('Superset Health:', healthResponse.data)
        } catch (e) {
          console.log('Health 체크 실패:', e)
        }

        // 2. 이용 가능한 차트 타입 확인
        try {
          const vizTypesResponse = await supersetAPI.api.get('/api/v1/chart/viz_types')
          console.log('Available Viz Types:', vizTypesResponse.data)
        } catch (e) {
          console.log('Viz Types 조회 실패:', e)
        }

        // 3. 데이터셋 정보 다시 확인
        try {
          const datasetResponse = await supersetAPI.api.get(`/api/v1/dataset/${selectedDataset.value.id}`)
          console.log('Dataset Info:', datasetResponse.data)
        } catch (e) {
          console.log('Dataset 정보 조회 실패:', e)
        }

        console.log('=== SQL Lab API 시도 ===')
        
        // 4. SQL Lab API로 직접 쿼리 시도
        try {
          const sqlPayload = {
            database_id: selectedDataset.value.database?.id,
            sql: `SELECT * FROM ${selectedDataset.value.table_name} LIMIT 10`,
            schema: selectedDataset.value.schema || 'sample_dashboard'
          }
          
          console.log('SQL 요청:', sqlPayload)
          const sqlResponse = await supersetAPI.api.post('/api/v1/sqllab/execute/', sqlPayload)
          console.log('SQL 응답:', sqlResponse.data)
          
          // SQL 결과를 차트 데이터 형식으로 변환
          chartData.value = {
            query: {
              rowcount: sqlResponse.data.rowcount || 0
            },
            data: sqlResponse.data.data || []
          }
          
          message.success('SQL Lab을 통한 데이터 조회 성공!')
          return
          
        } catch (sqlError) {
          console.error('SQL Lab 시도 실패:', sqlError)
        }

        console.log('=== Legacy API 시도 ===')
        
        // 5. 레거시 API 형식 시도
        try {
          const legacyPayload = {
            slice_id: null,
            datasource_id: selectedDataset.value.id,
            datasource_type: 'table',
            viz_type: 'table',
            form_data: JSON.stringify({
              datasource: `${selectedDataset.value.id}__table`,
              viz_type: 'table',
              metrics: ['count'],
              row_limit: 100
            })
          }
          
          console.log('Legacy 요청:', legacyPayload)
          const legacyResponse = await supersetAPI.api.post('/superset/explore_json/', legacyPayload)
          console.log('Legacy 응답:', legacyResponse.data)
          
          chartData.value = legacyResponse.data
          message.success('Legacy API로 데이터 조회 성공!')
          return
          
        } catch (legacyError) {
          console.error('Legacy API 실패:', legacyError)
        }

        console.log('=== 심플 테스트 ===')
        
        // 6. 아주 간단한 GET 요청으로 테스트
        try {
          const simpleResponse = await supersetAPI.api.get(`/api/v1/dataset/${selectedDataset.value.id}/samples`)
          console.log('Simple samples 응답:', simpleResponse.data)
          
          // 샘플 데이터를 차트 형식으로 변환
          chartData.value = {
            query: {
              rowcount: simpleResponse.data?.length || 0
            },
            data: simpleResponse.data || []
          }
          
          message.success('Dataset samples 조회 성공!')
          return
          
        } catch (simpleError) {
          console.error('Simple test 실패:', simpleError)
        }

        // 모든 방법 실패
        throw new Error('모든 API 접근 방법이 실패했습니다.')
        
      } catch (error) {
        console.error('차트 미리보기 오류:', error)
        message.error(`차트 미리보기를 불러오는 중 오류가 발생했습니다: ${error.message}`)
      } finally {
        previewLoading.value = false
      }
    }

    const saveChart = async () => {
      if (!canCreateChart.value) {
        message.error('차트 생성 권한이 없습니다.')
        return
      }

      // 필수 필드 검증
      if (!chartConfig.value.slice_name.trim()) {
        message.error('차트 이름을 입력해주세요.')
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
      // ✅ 누락된 함수들을 return에 추가
      setCurrentStep,
      resetForm,
      handleDatasetChange,
      handleChartTypeChange,
      updateChartParams,
      updateChartConfig,
      previewChart,
      saveChart,
      goToNextStep,
      goToPrevStep,
      h
    }
  }
})
</script>

<style scoped>
.ant-steps-item {
  cursor: pointer;
}

.ant-steps-item:hover {
  background-color: #f5f5f5;
}
</style>