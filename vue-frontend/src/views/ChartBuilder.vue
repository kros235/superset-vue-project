<!-- vue-frontend/src/views/ChartBuilder.vue -->
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
        <a-space>
          <!-- 🆕 AI 챗봇 버튼 추가 -->
          <a-button 
            v-if="selectedDataset"
            type="primary"
            ghost
            @click="showChatbot = true"
          >
            <template #icon>
              <CommentOutlined />
            </template>
            AI 차트 생성
          </a-button>
          
          <a-button @click="resetForm">
            <template #icon>
              <ReloadOutlined />
            </template>
            새로 시작
          </a-button>
        </a-space>
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

      <!-- 🔥 수정된 단계별 컴포넌트 렌더링 -->
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
            :chartTypes="chartTypes"
            :selectedChartType="chartConfig.viz_type"
            :selectedDataset="selectedDataset"
            :loading="loading"
            @change="handleChartTypeChange"
            @preset-selected="handlePresetSelected"
          />
        </div>

        <!-- 🔥 3단계: 차트 설정 (조건 완화) -->
        <div v-show="currentStep === 2 && selectedDataset && chartConfig.viz_type">
          <a-spin :spinning="columnsLoading">
            <ChartConfiguration
              :chartConfig="chartConfig"
              :datasetColumns="datasetColumns"
              :selectedDataset="selectedDataset"
              @update="updateChartConfig"
              @next="goToNextStep"
              @back="goToPrevStep"
            />
          </a-spin>
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

        <!-- 🔥 디버깅 정보 (개발 환경에서만 표시) -->
        <div v-if="showDebugInfo" style="margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 6px; font-size: 12px">
          <h4>🔧 디버깅 정보</h4>
          <p><strong>현재 단계:</strong> {{ currentStep }} / {{ steps.length - 1 }}</p>
          <p><strong>선택된 데이터셋:</strong> {{ selectedDataset?.table_name || 'None' }}</p>
          <p><strong>차트 타입:</strong> {{ chartConfig.viz_type || 'None' }}</p>
          <p><strong>데이터셋 컬럼 개수:</strong> {{ datasetColumns.length }}</p>
          <p><strong>다음 단계 가능:</strong> {{ canGoNext ? 'Yes' : 'No' }}</p>
          <p><strong>컬럼 로딩 중:</strong> {{ columnsLoading ? 'Yes' : 'No' }}</p>
          <a-button size="small" @click="showDebugInfo = false">디버깅 정보 숨기기</a-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, h, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ReloadOutlined, 
  LeftOutlined, 
  RightOutlined, 
  SaveOutlined,
  CommentOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import supersetAPI from '../services/supersetAPI'
import DatasetSelection from '../components/chart-builder/DatasetSelection.vue'
import ChartTypeSelection from '../components/chart-builder/ChartTypeSelection.vue'
import ChartConfiguration from '../components/chart-builder/ChartConfiguration.vue'
import ChartDetails from '../components/chart-builder/ChartDetails.vue'
import ChartPreview from '../components/chart-builder/ChartPreview.vue'
import ChartChatbot from '../components/ChartChatbot.vue' 

export default defineComponent({
  name: 'ChartBuilderView',
  components: {
    ReloadOutlined,
    LeftOutlined,
    RightOutlined,
    SaveOutlined,
    CommentOutlined,
    DatasetSelection,
    ChartTypeSelection,
    ChartConfiguration,
    ChartDetails,
    ChartPreview,
    ChartChatbot
  },
  setup() {
    const router = useRouter()
    const route = useRoute()

    const currentStep = ref(0)
    const loading = ref(false)
    const columnsLoading = ref(false) // 🔥 추가: 컬럼 로딩 상태
    const datasets = ref([])
    const selectedDataset = ref(null)
    const datasetColumns = ref([])
    const datasetMetrics = ref([])
    const chartData = ref(null)
    const previewLoading = ref(false)
    const showDebugInfo = ref(process.env.NODE_ENV === 'development') // 🔥 개발 환경에서만 표시

    const showChatbot = ref(false)

    const chartTypes = ref([
      { key: 'table', name: '테이블', category: '기본' },
      { key: 'dist_bar', name: '막대 차트', category: '비교' },
      { key: 'line', name: '선 차트', category: '추세' },
      { key: 'pie', name: '파이 차트', category: '비율' },
      { key: 'area', name: '영역 차트', category: '추세' },
      { key: 'scatter', name: '산점도', category: '분포' }
    ])

    const chartConfig = ref({
      datasource_id: null,
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

    // 🔥 단계별 진행 가능 여부 검증 (조건 완화)
    const canGoNext = computed(() => {
      switch (currentStep.value) {
        case 0: // 데이터셋 선택
          return selectedDataset.value !== null
        case 1: // 차트 타입 선택
          return chartConfig.value.viz_type !== ''
        case 2: // 차트 설정 (조건 완화)
          return chartConfig.value.params?.metrics?.length > 0 || Object.keys(chartConfig.value.params || {}).length > 0
        case 3: // 차트 정보
          return chartConfig.value.slice_name?.trim() !== ''
        default:
          return false
      }
    })

    // 🔥 차트 저장 가능 여부 (조건 완화)
    const canSaveChart = computed(() => {
      return selectedDataset.value && 
             chartConfig.value.viz_type && 
             chartConfig.value.slice_name?.trim()
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

    // 🔥 개선된 데이터셋 컬럼 로드
    const loadDatasetColumns = async (datasetId) => {
      columnsLoading.value = true
      try {
        console.log(`컬럼 로드 시작: 데이터셋 ${datasetId}`)
        
        // 컬럼 정보 로드
        const columns = await supersetAPI.getDatasetColumns(datasetId)
        datasetColumns.value = columns || []
        console.log('로드된 컬럼:', columns)
        
        // 메트릭 정보 로드 (실패해도 계속 진행)
        try {
          const metrics = await supersetAPI.getDatasetMetrics(datasetId)
          datasetMetrics.value = metrics || []
          console.log('로드된 메트릭:', metrics)
        } catch (metricError) {
          console.warn('메트릭 로드 중 오류 (무시 가능):', metricError)
          datasetMetrics.value = []
        }
        
        // 기본 차트 설정 초기화
        if (!chartConfig.value.params || Object.keys(chartConfig.value.params).length === 0) {
          chartConfig.value.params = {
            metrics: ['count'], // 기본 메트릭
            groupby: [],
            row_limit: 1000
          }
        }
        
      } catch (error) {
        console.error('컬럼 로드 오류:', error)
        message.error('데이터셋 컬럼을 불러오는 중 오류가 발생했습니다.')
        
        // 오류가 발생해도 기본 구조는 제공
        datasetColumns.value = []
        datasetMetrics.value = []
        chartConfig.value.params = {
          metrics: ['count'],
          groupby: [],
          row_limit: 1000
        }
      } finally {
        columnsLoading.value = false
      }
    }

    // 🔥 단계 직접 설정
    const setCurrentStep = (step) => {
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
        datasource_id: null,
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
      } catch (error) {
        console.error('데이터셋 컬럼 로드 오류:', error)
        message.error('데이터셋 컬럼 정보를 불러오는 중 오류가 발생했습니다.')
      }
    }

    const handleChartTypeChange = (vizType) => {
      chartConfig.value.viz_type = vizType
      console.log('차트 타입 변경됨:', vizType)
      
      // 차트 타입에 따른 기본 파라미터 설정
      const defaultParams = {
        table: { metrics: ['count'], groupby: [], row_limit: 1000 },
        bar: { metrics: ['count'], groupby: [], row_limit: 1000, color_scheme: 'bnbColors' },
        line: { metrics: ['count'], groupby: [], row_limit: 1000, color_scheme: 'bnbColors' },
        pie: { metrics: ['count'], groupby: [], row_limit: 1000, color_scheme: 'bnbColors' },
        area: { metrics: ['count'], groupby: [], row_limit: 1000, color_scheme: 'bnbColors' },
        scatter: { metrics: ['count'], groupby: [], row_limit: 1000, color_scheme: 'bnbColors' }
      }
      
      chartConfig.value.params = { 
        ...chartConfig.value.params, 
        ...(defaultParams[vizType] || defaultParams.table) 
      }
    }

    const updateChartConfig = (updates) => {
      if (typeof updates === 'object') {
        if (updates.params) {
          chartConfig.value.params = {
            ...chartConfig.value.params,
            ...updates.params
          }
          delete updates.params // params는 이미 처리했으므로 제거
        }
        
        // 나머지 필드 병합
        Object.assign(chartConfig.value, updates)
      }
      console.log('차트 설정 업데이트:', chartConfig.value)
    }

    const previewChart = async () => {
      if (!selectedDataset.value || !chartConfig.value.viz_type) {
        message.warning('데이터셋과 차트 타입을 먼저 선택해주세요.')
        return
      }

      // metrics 검증 개선
      if (!chartConfig.value.params?.metrics || chartConfig.value.params.metrics.length === 0) {
        console.error('❌ metrics가 없습니다:', chartConfig.value.params)
        message.warning('최소 하나의 메트릭을 선택해주세요.')
        return
      }

      previewLoading.value = true
      try {
        console.log('🔍 미리보기 시작 - 차트 설정:', chartConfig.value)
        
        // 1차 시도: 정식 차트 API 사용
        try {
          console.log('1️⃣ 정식 차트 API 시도...')
          const preview = await supersetAPI.previewChart(chartConfig.value)
          chartData.value = preview
          message.success('차트 미리보기가 생성되었습니다.')
          return
        } catch (chartApiError) {
          console.warn('❌ 차트 API 실패:', chartApiError.message)
          
          // 2차 시도: SQL Lab을 통한 미리보기
          try {
            console.log('2️⃣ SQL Lab 대안 시도...')
            const sqlPreview = await supersetAPI.previewChartViaSQL(
              chartConfig.value.datasource_id, 
              chartConfig.value
            )
            chartData.value = sqlPreview
            message.success('차트 미리보기가 생성되었습니다. (SQL Lab 사용)')
            return
          } catch (sqlError) {
            console.warn('❌ SQL Lab도 실패:', sqlError.message)
            
            // 3차 시도: 간단한 모의 데이터 미리보기
            try {
              console.log('3️⃣ 모의 데이터 미리보기 시도...')
              const mockPreview = await supersetAPI.simplePreview(
                chartConfig.value.datasource_id,
                chartConfig.value
              )
              chartData.value = mockPreview
              message.success('차트 미리보기가 생성되었습니다. (테스트 모드)', 3)
              message.info('실제 데이터는 차트 저장 후 Superset에서 확인할 수 있습니다.', 5)
              return
            } catch (mockError) {
              console.error('❌ 모의 데이터도 실패:', mockError.message)
              throw chartApiError // 최초 오류를 던짐
            }
          }
        }
        
      } catch (error) {
        console.error('💥 차트 미리보기 최종 실패:', error)
        
        // 상세 오류 정보 표시
        let errorMsg = '차트 미리보기 생성 중 오류가 발생했습니다.'
        if (error.response?.status === 400) {
          errorMsg += '\n잘못된 요청입니다. 차트 설정을 확인해주세요.'
        } else if (error.response?.status === 401) {
          errorMsg += '\n인증이 만료되었습니다. 다시 로그인해주세요.'
        } else if (error.response?.status === 403) {
          errorMsg += '\n데이터 접근 권한이 없습니다.'
        } else if (error.response?.status === 404) {
          errorMsg += '\n데이터셋을 찾을 수 없습니다.'
        } else if (error.response?.status >= 500) {
          errorMsg += '\n서버 오류입니다. 잠시 후 다시 시도해주세요.'
        }
        
        message.error(errorMsg, 8)
        
        // 개발 환경에서는 더 상세한 오류 표시
        if (showDebugInfo.value) {
          console.group('🐛 개발자용 상세 오류 정보')
          console.error('HTTP 상태:', error.response?.status)
          console.error('응답 데이터:', error.response?.data)
          console.error('요청 URL:', error.config?.url)
          console.error('요청 메서드:', error.config?.method)
          console.error('요청 데이터:', error.config?.data)
          console.groupEnd()
        }
        
        // 사용자에게 차트 저장 옵션 제안
        message.info('미리보기가 실패했지만 차트를 저장하면 Superset에서 직접 확인할 수 있습니다.', 6)
        
      } finally {
        previewLoading.value = false
      }
    }

    // === 수정된 코드 (query_context 추가) ===
    const saveChart = async () => {
      if (!canSaveChart.value) {
        message.error('필수 정보를 모두 입력해주세요.')
        return
      }

      try {

        // 저장 전 최종 검증
        console.log('💾 차트 저장 시작')
        console.log('📊 저장할 chartConfig:', chartConfig.value)
        console.log('📊 저장할 params:', chartConfig.value.params)
        console.log('📊 저장할 metrics:', chartConfig.value.params?.metrics)
        console.log('📊 저장할 groupby:', chartConfig.value.params?.groupby)

        // 파이 차트는 metric (단수형) 사용
        const isPieChart = chartConfig.value.viz_type === 'pie'
        const metricsArray = chartConfig.value.params?.metrics || ['count']

        // params 객체를 명시적으로 복사하여 직렬화
        const paramsToSave = {
          datasource: `${chartConfig.value.datasource_id}__table`,
          viz_type: chartConfig.value.viz_type,
          // 파이 차트는 metric (단수), 다른 차트는 metrics (복수)
          ...(isPieChart 
            ? { metric: metricsArray[0] }  // 파이 차트: 첫 번째 메트릭만 사용
            : { metrics: metricsArray }    // 다른 차트: 배열 사용
          ),
          groupby: chartConfig.value.params?.groupby || [],         // ✅ 명시적 설정
          row_limit: chartConfig.value.params?.row_limit || 10000,
          color_scheme: chartConfig.value.params?.color_scheme || 'bnbColors',
          adhoc_filters: chartConfig.value.params?.adhoc_filters || [],
          ...chartConfig.value.params  // ✅ 나머지 params 병합
        }
        
        console.log('📦 직렬화할 params:', paramsToSave)
        
        // 🔥 query_context 생성 - Superset이 차트를 제대로 저장하기 위해 필수
        const queryContext = {
          datasource: {
            id: chartConfig.value.datasource_id,
            type: 'table'
          },
          force: false,
          queries: [{
            filters: chartConfig.value.params?.adhoc_filters || [],
            extras: {
              having: '',
              where: ''
            },
            applied_time_extras: {},
            columns: chartConfig.value.params?.groupby || [],
            metrics: metricsArray,  
            annotation_layers: [],
            row_limit: chartConfig.value.params?.row_limit || 10000,
            series_limit: 0,
            order_desc: true,
            url_params: {},
            custom_params: {},
            custom_form_data: {}
          }],
          form_data: {
            ...paramsToSave,  
            slice_id: null,
            force: false,
            result_format: 'json',
            result_type: 'full'
          },
          result_format: 'json',
          result_type: 'full'
        }

        const payload = {
          slice_name: chartConfig.value.slice_name,
          description: chartConfig.value.description,
          datasource_id: chartConfig.value.datasource_id,
          datasource_type: 'table',
          viz_type: chartConfig.value.viz_type,
          params: JSON.stringify(paramsToSave), // 개선된 params 사용
          query_context: JSON.stringify(queryContext) // 🔥 추가: query_context
        }
        
        console.log('💾 차트 저장 payload:', payload)
        
        await supersetAPI.createChart(payload)
        message.success('차트가 성공적으로 생성되었습니다!')
        router.push('/charts')
      } catch (error) {
        console.error('차트 저장 오류:', error)
        message.error('차트 저장 중 오류가 발생했습니다.')
      }
    }

    // 컴포넌트 마운트 시 데이터 로드
    onMounted(() => {
      if (authService.canCreateChart()) {
        loadDatasets()
      }
    })

     // 🔥 프리셋 핸들러 추가 
    const handlePresetSelected = async (preset) => { 
      if (!preset) {
        console.log('프리셋 선택 해제')
        return
      }

      console.log('✨ 프리셋 선택됨:', preset)
      
      if (preset.configuration) {
        const config = preset.configuration
        
        // 차트 타입 설정
        chartConfig.value.viz_type = preset.chart_type
        
        // 4단계 정보 자동 입력 (차트 제목, 설명)
        chartConfig.value.slice_name = preset.preset_name
        chartConfig.value.description = preset.preset_description || `${preset.preset_name} 프리셋으로 생성된 차트`
        
        const metrics = config.metrics && config.metrics.length > 0 
              ? config.metrics 
              : ['count']  // 기본값: COUNT(*)
            
        const groupby = config.groupby && config.groupby.length > 0
          ? config.groupby
          : []

        // 차트 설정 적용 Object.assign으로 직접 할당 (반응성 유지)
        Object.assign(chartConfig.value, {
          viz_type: preset.chart_type,
          slice_name: preset.preset_name,
          description: preset.preset_description || `${preset.preset_name} 프리셋으로 생성된 차트`,
          params: {
            metrics: metrics,
            groupby: groupby,
            row_limit: config.row_limit || 1000,
            color_scheme: config.color_scheme || 'bnbColors',
            adhoc_filters: config.adhoc_filters || [],
            ...config
          }
        })
            
        console.log('✅ 프리셋 설정 적용:', chartConfig.value)
        console.log('📊 적용된 params:', chartConfig.value.params)
        console.log('📊 적용된 params.metrics:', chartConfig.value.params.metrics)
        console.log('📂 적용된 params.groupby:', chartConfig.value.params.groupby)
        

        // 5단계(저장)로 자동 이동
        currentStep.value = 4
        
        message.success({
          content: `"${preset.preset_name}" 프리셋이 적용되었습니다! 차트를 미리보고 저장할 수 있습니다.`,
          duration: 3
        })
        
        // ✅ nextTick으로 DOM 업데이트 완료 후 미리보기 실행
        await nextTick()
        
        // 미리보기 전 최종 검증 로그
        console.log('🔍 미리보기 직전 chartConfig 전체:', chartConfig.value)
        console.log('🔍 미리보기 직전 params:', chartConfig.value.params)
        console.log('🔍 미리보기 직전 params.metrics:', chartConfig.value.params?.metrics)
        console.log('🔍 미리보기 직전 params.groupby:', chartConfig.value.params?.groupby)
    
        
        // setTimeout 대신 즉시 실행
        previewChart()
      }
    }

    const handleChatbotGenerated = async (chatbotConfig) => {
      console.log('🤖 챗봇에서 생성된 차트 설정:', chatbotConfig)
      
      try {
        // 1️⃣ 차트 타입 설정
        chartConfig.value.viz_type = chatbotConfig.chart_type
        
        // 2️⃣ 파라미터 설정
        chartConfig.value.params = {
          metrics: chatbotConfig.metrics || ['count'],
          groupby: chatbotConfig.groupby || [],
          adhoc_filters: chatbotConfig.filters || [],
          row_limit: chatbotConfig.row_limit || 1000,
          time_range: chatbotConfig.time_range || 'No filter',
          color_scheme: 'bnbColors'
        }
        
        // 3️⃣ 차트 이름 자동 생성
        const chartTypeName = {
          bar: '막대 차트',
          line: '선 차트',
          pie: '파이 차트',
          table: '테이블',
          area: '영역 차트',
          scatter: '산점도'
        }[chatbotConfig.chart_type] || '차트'
        
        chartConfig.value.slice_name = `AI 생성 ${chartTypeName} - ${new Date().toLocaleString()}`
        chartConfig.value.description = 'AI 챗봇으로 생성된 차트입니다.'
        
        console.log('✅ 챗봇 설정 적용 완료:', chartConfig.value)
        
        // 4️⃣ 4단계(정보 입력)로 이동
        currentStep.value = 3
        
        // 5️⃣ 챗봇 모달 닫기
        showChatbot.value = false
        
        message.success({
          content: 'AI가 생성한 차트 설정이 적용되었습니다! 차트 이름을 수정한 후 미리보기를 확인하세요.',
          duration: 5
        })
        
        await nextTick()
        
      } catch (error) {
        console.error('❌ 챗봇 설정 적용 오류:', error)
        message.error('챗봇 설정 적용 중 오류가 발생했습니다.')
      }
    }

    return {
      h,
      currentStep,
      loading,
      columnsLoading,
      datasets,
      selectedDataset,
      datasetColumns,
      datasetMetrics,
      chartData,
      previewLoading,
      chartConfig,
      chartTypes, 
      steps,
      canCreateChart,
      canGoNext,
      canSaveChart,
      showDebugInfo,
      setCurrentStep,
      goToNextStep,
      goToPrevStep,
      resetForm,
      handleDatasetChange,
      handleChartTypeChange,
      updateChartConfig,
      previewChart,
      saveChart,
      handlePresetSelected,
      showChatbot, 
      handleChatbotGenerated
    }
  }
})
</script>

<style scoped>
.ant-steps {
  margin-bottom: 24px;
}

.ant-steps .ant-steps-item {
  cursor: pointer;
}

.ant-steps .ant-steps-item:hover .ant-steps-item-title {
  color: #1890ff;
}

.ant-button {
  border-radius: 6px;
}

.ant-alert {
  border-radius: 6px;
  margin-bottom: 24px;
}

/* 디버깅 정보 스타일 */
.debug-info {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 16px;
  margin-top: 24px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.debug-info h4 {
  margin: 0 0 12px 0;
  color: #1890ff;
}

.debug-info p {
  margin: 4px 0;
  color: #666;
}
</style>