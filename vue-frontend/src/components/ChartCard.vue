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
      <div v-else style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fafafa;">
        <!-- 🔥 Superset 차트 썸네일 이미지 -->
        <div v-if="chart.thumbnail_url" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
          <img 
            :src="getChartThumbnailUrl()"
            :alt="chart.slice_name"
            style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;"
            @error="handleImageError"
          />
        </div>
        
        <!-- 썸네일 없거나 로드 실패 시 -->
        <div v-else style="text-align: center; color: #999;">
          <BarChartOutlined style="font-size: 48px; color: #1890ff; margin-bottom: 16px;" />
          <p>{{ chart.viz_type }} 차트</p>
          <p style="font-size: 12px;">
            데이터 행 수: {{ chartData.data?.rowcount || 0 }}
          </p>
          <!-- Superset에서 직접 보기 버튼 -->
          <a-button 
            type="link" 
            size="small" 
            @click="openInSuperset"
            style="margin-top: 8px;"
          >
            Superset에서 보기 →
          </a-button>
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
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'

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
    InfoCircleOutlined
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
    const getChartThumbnailUrl = () => {
      const supersetUrl = 'http://localhost:8088'
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
      openInSuperset         // 🔥 추가
    }
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
