<template>
  <a-card
    hoverable
    :loading="loading"
    :style="{ height: '400px' }"
  >
    <template #title>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>{{ chart.slice_name || '제목 없음' }}</span>
        
        <!-- 액션 버튼 -->
        <a-dropdown v-if="showActions" :trigger="['click']">
          <template #overlay>
            <a-menu @click="handleAction">
              <a-menu-item key="edit" v-if="canEdit">
                <EditOutlined /> 편집
              </a-menu-item>
              <a-menu-item key="refresh">
                <ReloadOutlined /> 새로고침
              </a-menu-item>
              <a-menu-item key="fullscreen">
                <FullscreenOutlined /> 전체화면
              </a-menu-item>
              <a-menu-divider v-if="canDelete" />
              <a-menu-item key="delete" v-if="canDelete" danger>
                <DeleteOutlined /> 삭제
              </a-menu-item>
            </a-menu>
          </template>
          <a-button type="text" size="small">
            <MoreOutlined />
          </a-button>
        </a-dropdown>
      </div>
    </template>

    <!-- 🔥 메인 컨텐츠 영역 - 조건문 순서 수정 -->
    <div style="height: 300px; display: flex; align-items: center; justify-content: center">
      <!-- 에러 상태 -->
      <div v-if="error" style="text-align: center; color: #ff4d4f;">
        <ExclamationCircleOutlined style="font-size: 48px; margin-bottom: 16px;" />
        <p>{{ error }}</p>
      </div>
      
      <!-- 로딩 상태 -->
      <div v-else-if="loading" style="text-align: center;">
        <a-spin size="large" />
        <p style="margin-top: 16px; color: #999;">데이터 로딩 중...</p>
      </div>
      
      <!-- 데이터가 없는 경우 -->
      <div v-else-if="!chartData || !chartData.data" style="text-align: center; color: #999;">
        <InboxOutlined style="font-size: 48px; margin-bottom: 16px;" />
        <p>표시할 데이터가 없습니다</p>
        <a-button type="primary" size="small" @click="$emit('refresh', chart.id)">
          <ReloadOutlined /> 데이터 불러오기
        </a-button>
      </div>
      
      <!-- 데이터가 있는 경우 -->
      <div v-else style="width: 100%; height: 100%;">
        <!-- 🔥 우선순위 1: 썸네일 이미지 (Blob URL) -->
        <div v-if="thumbnailBlobUrl && !useFallbackThumbnail" 
             style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fafafa;">
          <img 
            :src="thumbnailBlobUrl"
            :alt="chart.slice_name"
            style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;"
          />
        </div>

        <!-- 🔥 우선순위 2: iframe 미리보기 (썸네일 실패 시) -->
        <div v-else-if="useIframePreview" 
             style="width: 100%; height: 100%; position: relative;">
          <iframe 
            :src="getChartEmbedUrl()"
            style="width: 100%; height: 100%; border: none; border-radius: 4px;"
            @load="handleIframeLoad"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>

        <!-- 🔥 우선순위 3: 대체 UI (모든 방법 실패 시) -->
        <div v-else style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fafafa;">
          <div style="text-align: center; padding: 20px;">
            <BarChartOutlined style="font-size: 48px; color: #1890ff; margin-bottom: 12px;" />
            <p style="margin: 0; font-size: 14px; color: #666;">{{ chart.viz_type }} 차트</p>
            <p style="margin: 8px 0; font-size: 12px; color: #999;">
              데이터셋: {{ chart.datasource_name || 'N/A' }}
            </p>
            <a-button 
              type="link" 
              size="small" 
              @click="openInSuperset"
              style="margin-top: 8px;"
            >
              Superset에서 열기 <RightOutlined />
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 차트 설명 -->
    <template #extra v-if="chart.description">
      <a-tooltip :title="chart.description">
        <InfoCircleOutlined style="color: #999" />
      </a-tooltip>
    </template>
  </a-card>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  MoreOutlined,
  EditOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  RightOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import axios from 'axios' // 🔥 추가

export default defineComponent({
  name: 'ChartCard',
  components: {
    MoreOutlined,
    EditOutlined,
    ReloadOutlined,
    FullscreenOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    InboxOutlined,
    BarChartOutlined,
    InfoCircleOutlined,
    RightOutlined
  },
  props: {
    chart: {
      type: Object,
      required: true
    },
    chartData: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    showActions: {
      type: Boolean,
      default: true
    }
  },
  emits: ['edit', 'delete', 'refresh'],
  setup (props, { emit }) {
    const barChartRef = ref()
    const lineChartRef = ref()
    const pieChartRef = ref()

    // 🔥 추가: 썸네일 대체 방법 - 차트 미리보기 직접 렌더링
    const useFallbackThumbnail = ref(true) // 썸네일 실패 시 대체 UI 사용
    const thumbnailBlobUrl = ref(null) // 🔥 추가: Blob URL 저장
    const thumbnailLoading = ref(false) // 🔥 추가: 썸네일 로딩 상태
    const useIframePreview = ref(false) // 🔥 추가: iframe 사용 여부
    
    // 🔥 차트 소유자 ID를 파라미터로 전달
    const canEdit = computed(() => authService.canEditChart(props.chart.changed_by?.id))
    const canDelete = computed(() => authService.canDeleteChart(props.chart.changed_by?.id))

    // 테이블 데이터 처리
    const tableColumns = computed(() => {
      if (!props.chartData || !props.chartData.data || !props.chartData.data.length) {
        return []
      }

      const firstRow = props.chartData.data[0]
      return Object.keys(firstRow).map(key => ({
        title: key,
        dataIndex: key,
        key,
        ellipsis: true
      }))
    })

    const tableData = computed(() => {
      if (!props.chartData || !props.chartData.data) {
        return []
      }

      return props.chartData.data.map((row, index) => ({
        key: index,
        ...row
      }))
    })

    const handleAction = ({ key }) => {
      switch (key) {
      case 'edit':
        emit('edit', props.chart)
        break
      case 'refresh':
        emit('refresh', props.chart)
        break
      case 'fullscreen':
        // 전체화면 로직 구현
        message.info('전체화면 기능은 구현 예정입니다')
        break
      case 'delete':
        emit('delete', props.chart)
        break
      }
    }

    // 🔥 썸네일 로드 (404면 iframe으로 대체)
     const loadThumbnailWithAuth = async () => {
      if (!props.chart.thumbnail_url) {
        console.warn('썸네일 URL 없음 → iframe 사용')
        useIframePreview.value = true
        return
      }

      try {
        thumbnailLoading.value = true
        const supersetUrl = 'http://localhost:8088'
        const thumbnailUrl = `${supersetUrl}${props.chart.thumbnail_url}`
        
        const token = localStorage.getItem('access_token')
        const csrfToken = localStorage.getItem('csrf_token')
        
        console.log('🖼️ 썸네일 로드 시도:', thumbnailUrl)
        
        const response = await axios.get(thumbnailUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-CSRFToken': csrfToken
          },
          responseType: 'blob'
        })

        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/png' })
        thumbnailBlobUrl.value = URL.createObjectURL(blob)
        
        console.log('✅ 썸네일 로드 성공:', props.chart.id)
        useFallbackThumbnail.value = false
        useIframePreview.value = false
      } catch (error) {
        console.error('❌ 썸네일 로드 실패 → iframe으로 대체:', props.chart.id, error)
        useFallbackThumbnail.value = true
        useIframePreview.value = true // 🔥 썸네일 실패 시 iframe 사용
      } finally {
        thumbnailLoading.value = false
      }
    }

    // 차트 렌더링 함수들
    const renderBarChart = () => {
      if (!barChartRef.value || !props.chartData) return

      // 바 차트 렌더링 로직
      // D3.js나 Chart.js 등을 사용하여 구현
      console.log('Rendering bar chart:', props.chartData)
    }

    const renderLineChart = () => {
      if (!lineChartRef.value || !props.chartData) return

      // 라인 차트 렌더링 로직
      console.log('Rendering line chart:', props.chartData)
    }

    const renderPieChart = () => {
      if (!pieChartRef.value || !props.chartData) return

      // 파이 차트 렌더링 로직
      console.log('Rendering pie chart:', props.chartData)
    }

    // 차트 데이터 변경 시 재렌더링
    watch(() => props.chartData, () => {
      nextTick(() => {
        if (props.chart.viz_type === 'dist_bar') {
          renderBarChart()
        } else if (props.chart.viz_type === 'line') {
          renderLineChart()
        } else if (props.chart.viz_type === 'pie') {
          renderPieChart()
        }
      })
    }, { deep: true })

    onMounted(() => {
      // 🔥 썸네일 로드
      loadThumbnailWithAuth()

      // 컴포넌트 마운트 시 차트 렌더링
      nextTick(() => {
        if (props.chartData) {
          if (props.chart.viz_type === 'dist_bar') {
            renderBarChart()
          } else if (props.chart.viz_type === 'line') {
            renderLineChart()
          } else if (props.chart.viz_type === 'pie') {
            renderPieChart()
          }
        }
      })
    })

    // 🔥 컴포넌트 언마운트 시 Blob URL 해제
    const cleanupBlobUrl = () => {
      if (thumbnailBlobUrl.value) {
        URL.revokeObjectURL(thumbnailBlobUrl.value)
        thumbnailBlobUrl.value = null
      }
    }

    watch(() => props.chart.id, () => {
      cleanupBlobUrl()
      loadThumbnailWithAuth()
    })

    // iframe으로 차트 임베드 URL 생성
    const getChartEmbedUrl = () => {
      // Superset 서버 URL
      const supersetUrl = 'http://localhost:8088'
      
      // standalone 모드로 차트만 표시 (헤더/사이드바 제외)
      const embedUrl = `${supersetUrl}/superset/explore/?standalone=3&slice_id=${props.chart.id}`
      
      console.log('차트 임베드 URL:', embedUrl)
      return embedUrl
    }

    // iframe 로드 완료 핸들러
    const handleIframeLoad = () => {
      console.log('차트 iframe 로드 완료:', props.chart.id)
    }

    // 🔥 썸네일 URL 생성
    // === 수정된 코드 (인증 토큰 포함) ===
    const getChartThumbnailUrl = () => {
      // 🔥 수정: Superset 썸네일은 인증이 필요하므로 직접 표시 불가능
      // 대신 차트 ID로 임시 미리보기 이미지 생성
      const supersetUrl = 'http://localhost:8088'
      const token = localStorage.getItem('access_token')
      
      if (!props.chart.thumbnail_url) {
        return null
      }
      
      // 🔥 옵션 1: 인증 토큰을 포함한 URL (브라우저에서 직접 접근 시 권한 문제 발생 가능)
      const thumbnailUrl = `${supersetUrl}${props.chart.thumbnail_url}`
      console.log('차트 썸네일 URL:', thumbnailUrl)
      
      return thumbnailUrl
    }

    
    // 🔥 이미지 로드 실패 핸들러
    const handleImageError = (e) => {
      console.error('썸네일 이미지 로드 실패:', props.chart.thumbnail_url)
      e.target.style.display = 'none'
    }

    // 🔥 Superset에서 직접 열기
    const openInSuperset = () => {
      const supersetUrl = 'http://localhost:8088'
      const chartUrl = `${supersetUrl}/superset/explore/?slice_id=${props.chart.id}`
      window.open(chartUrl, '_blank')
    }

    return {
      barChartRef,
      lineChartRef,
      pieChartRef,
      canEdit,
      canDelete,
      tableColumns,
      tableData,
      handleAction,
      getChartEmbedUrl,    // 🔥 추가
      handleIframeLoad,     // 🔥 추가
      getChartThumbnailUrl,  // 🔥 추가
      handleImageError,      // 🔥 추가
      openInSuperset,         // 🔥 추가
      useFallbackThumbnail,
      thumbnailBlobUrl, // 🔥 추가
      thumbnailLoading,  // 🔥 추가
      cleanupBlobUrl,     // 🔥 추가
      useIframePreview // 🔥 추가
    }
  },
  // 🔥 컴포넌트 언마운트 시 정리
  beforeUnmount() {
    this.cleanupBlobUrl()
  }
})
</script>

<style scoped>
.ant-card-body {
  padding: 16px;
  height: calc(100% - 57px);
}

.ant-table-tbody > tr > td {
  padding: 4px 8px;
}
</style>
