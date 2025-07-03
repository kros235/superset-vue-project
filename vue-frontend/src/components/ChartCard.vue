<template>
  <a-card
    hoverable
    :loading="loading"
    :style="{ height: '400px' }"
  >
    <template #title>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>{{ chart.slice_name || '제목 없음' }}</span>
        <a-dropdown v-if="showActions" :trigger="['click']">
          <a-button type="text" size="small">
            <template #icon>
              <MoreOutlined />
            </template>
          </a-button>
          <template #overlay>
            <a-menu @click="handleAction">
              <a-menu-item key="edit" v-if="canEdit">
                <EditOutlined />
                편집
              </a-menu-item>
              <a-menu-item key="refresh">
                <ReloadOutlined />
                새로고침
              </a-menu-item>
              <a-menu-item key="fullscreen">
                <FullscreenOutlined />
                전체화면
              </a-menu-item>
              <a-menu-divider v-if="canDelete" />
              <a-menu-item key="delete" v-if="canDelete" style="color: red">
                <DeleteOutlined />
                삭제
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </template>

    <div style="height: 300px; display: flex; align-items: center; justify-content: center">
      <!-- 로딩 상태 -->
      <div v-if="loading" style="text-align: center">
        <a-spin size="large" />
        <div style="margin-top: 16px; color: #666">
          차트를 불러오는 중...
        </div>
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="error" style="text-align: center; color: #ff4d4f">
        <ExclamationCircleOutlined style="font-size: 48px; margin-bottom: 16px" />
        <div>{{ error }}</div>
        <a-button style="margin-top: 8px" @click="$emit('refresh')">
          다시 시도
        </a-button>
      </div>

      <!-- 데이터가 없는 경우 -->
      <div v-else-if="!chartData || !chartData.data" style="text-align: center; color: #999">
        <InboxOutlined style="font-size: 48px; margin-bottom: 16px" />
        <div>표시할 데이터가 없습니다</div>
      </div>

      <!-- 차트 렌더링 영역 -->
      <div v-else style="width: 100%; height: 100%">
        <!-- 테이블 차트 -->
        <div v-if="chart.viz_type === 'table'" style="height: 100%; overflow: auto">
          <a-table
            :columns="tableColumns"
            :data-source="tableData"
            :pagination="false"
            size="small"
            :scroll="{ y: 250 }"
          />
        </div>

        <!-- 바 차트 -->
        <div v-else-if="chart.viz_type === 'dist_bar'" ref="barChartRef" style="width: 100%; height: 100%">
          <!-- 바 차트 구현 -->
        </div>

        <!-- 라인 차트 -->
        <div v-else-if="chart.viz_type === 'line'" ref="lineChartRef" style="width: 100%; height: 100%">
          <!-- 라인 차트 구현 -->
        </div>

        <!-- 파이 차트 -->
        <div v-else-if="chart.viz_type === 'pie'" ref="pieChartRef" style="width: 100%; height: 100%">
          <!-- 파이 차트 구현 -->
        </div>

        <!-- 기타 차트 타입 -->
        <div v-else style="text-align: center; color: #999">
          <BarChartOutlined style="font-size: 48px; margin-bottom: 16px" />
          <div>{{ chart.viz_type }} 차트</div>
          <div style="font-size: 12px; margin-top: 8px">
            이 차트 타입은 아직 지원되지 않습니다
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

    const canEdit = computed(() => authService.canEditChart())
    const canDelete = computed(() => authService.canDeleteChart())

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

    return {
      barChartRef,
      lineChartRef,
      pieChartRef,
      canEdit,
      canDelete,
      tableColumns,
      tableData,
      handleAction
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
