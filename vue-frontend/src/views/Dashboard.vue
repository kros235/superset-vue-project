<template>
  <div>
    <!-- 헤더 -->
    <div style="margin-bottom: 24px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 600">
            대시보드
          </h1>
          <p style="margin: 8px 0 0 0; color: #666">
            안녕하세요, {{ currentUser?.first_name || currentUser?.username }}님! 
            <span v-if="isAdmin">(관리자)</span>
          </p>
        </div>
        <a-button 
          @click="loadDashboardData"
          :loading="loading"
        >
          <template #icon>
            <ReloadOutlined />
          </template>
          새로고침
        </a-button>
      </div>
    </div>

    <!-- 에러 표시 -->
    <a-alert
      v-if="error"
      :message="error"
      type="error"
      show-icon
      style="margin-bottom: 24px"
      :action="() => h('a-button', { size: 'small', onClick: loadDashboardData }, '다시 시도')"
    />

    <!-- 로딩 스피너 -->
    <div 
      v-if="loading"
      style="display: flex; justify-content: center; align-items: center; height: 400px"
    >
      <a-spin size="large" />
    </div>

    <template v-else>
      <!-- 통계 카드들 -->
      <a-row :gutter="[16, 16]" style="margin-bottom: 24px">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card hoverable>
            <a-statistic
              title="총 차트"
              :value="dashboardStats.totalCharts"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <BarChartOutlined style="color: #1890ff" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card hoverable>
            <a-statistic
              title="총 대시보드"
              :value="dashboardStats.totalDashboards"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <LineChartOutlined style="color: #52c41a" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card hoverable>
            <a-statistic
              title="데이터셋"
              :value="dashboardStats.totalDatasets"
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix>
                <PieChartOutlined style="color: #faad14" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        
        <a-col v-if="canManageUsers" :xs="24" :sm="12" :lg="6">
          <a-card hoverable>
            <a-statistic
              title="사용자"
              :value="dashboardStats.totalUsers"
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <UserOutlined style="color: #722ed1" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <!-- 차트 그리드 -->
      <div style="margin-bottom: 16px">
        <h2 style="font-size: 18px; font-weight: 600">
          최근 차트
          <span v-if="!userLayout.showAllCharts" style="font-size: 14px; color: #666; font-weight: normal; margin-left: 8px">
            (제한된 보기)
          </span>
        </h2>
      </div>

      <a-empty 
        v-if="charts.length === 0"
        description="표시할 차트가 없습니다"
        :image="Simple"
      >
        <a-button v-if="canCreateChart" type="primary" @click="$router.push('/charts')">
          첫 번째 차트 만들기
        </a-button>
      </a-empty>
      
      <a-row v-else :gutter="[16, 16]">
        <a-col 
          v-for="chart in displayedCharts"
          :key="chart.id"
          :xs="24" 
          :sm="12" 
          :lg="userLayout.chartsPerRow === 1 ? 24 : 12"
          :xl="userLayout.chartsPerRow === 1 ? 24 : 12"
        >
          <ChartCard :chart="chart" @view="loadChartData" />
        </a-col>
      </a-row>

      <!-- 시스템 메트릭 (관리자만) -->
      <div v-if="userLayout.showSystemMetrics" style="margin-top: 32px">
        <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px">
          시스템 메트릭
        </h2>
        <a-row :gutter="[16, 16]">
          <a-col span="24">
            <a-card>
              <div style="text-align: center; padding: 40px 0; color: #666">
                시스템 메트릭 차트가 여기에 표시됩니다
                <br />
                (관리자 전용)
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>

      <!-- 사용자 활동 (관리자만) -->
      <div v-if="userLayout.showUserActivity" style="margin-top: 32px">
        <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px">
          사용자 활동
        </h2>
        <a-row :gutter="[16, 16]">
          <a-col span="24">
            <a-card>
              <div style="text-align: center; padding: 40px 0; color: #666">
                사용자 활동 로그가 여기에 표시됩니다
                <br />
                (관리자 전용)
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, h } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { 
  ReloadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { Empty, message } from 'ant-design-vue'
import authService from '../services/authService'
import supersetAPI from '../services/supersetAPI'
import ChartCard from '../components/ChartCard.vue'

export default defineComponent({
  name: 'Dashboard',
  components: {
    ReloadOutlined,
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    UserOutlined,
    ChartCard
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const loading = ref(true)
    const error = ref('')
    const charts = ref([])
    const dashboardStats = ref({
      totalCharts: 0,
      totalDashboards: 0,
      totalDatasets: 0,
      totalUsers: 0
    })
    
    const currentUser = computed(() => store.getters.currentUser)
    const isAdmin = computed(() => store.getters.isAdmin)
    const canManageUsers = computed(() => authService.canManageUsers())
    const canCreateChart = computed(() => authService.canCreateChart())
    const userLayout = computed(() => authService.getDashboardLayout())
    
    const displayedCharts = computed(() => {
      if (userLayout.value.showAllCharts) {
        return charts.value
      }
      return charts.value.slice(0, 4)
    })
    
    const Simple = Empty.PRESENTED_IMAGE_SIMPLE
    
    const loadDashboardData = async () => {
      loading.value = true
      error.value = ''

      try {
        // 병렬로 데이터 로드
        const promises = [
          supersetAPI.getCharts(),
          supersetAPI.getDashboards(),
          supersetAPI.getDatasets()
        ]
        
        if (authService.canManageUsers()) {
          promises.push(supersetAPI.getUsers())
        } else {
          promises.push(Promise.resolve([]))
        }

        const [chartsData, dashboardsData, datasetsData, usersData] = await Promise.allSettled(promises)

        // 통계 데이터 설정
        dashboardStats.value = {
          totalCharts: chartsData.status === 'fulfilled' ? chartsData.value.length : 0,
          totalDashboards: dashboardsData.status === 'fulfilled' ? dashboardsData.value.length : 0,
          totalDatasets: datasetsData.status === 'fulfilled' ? datasetsData.value.length : 0,
          totalUsers: usersData.status === 'fulfilled' ? usersData.value.length : 0
        }

        // 차트 데이터 설정
        if (chartsData.status === 'fulfilled') {
          let filteredCharts = chartsData.value

          if (!userLayout.value.showAllCharts) {
            // 일반 사용자는 제한된 차트만 표시
            filteredCharts = chartsData.value.slice(0, 4)
          }

          charts.value = filteredCharts
        }

      } catch (err) {
        console.error('Dashboard loading error:', err)
        error.value = '대시보드 데이터를 불러오는 중 오류가 발생했습니다.'
      } finally {
        loading.value = false
      }
    }
    
    const loadChartData = async (chartId) => {
      try {
        // 실제 차트 데이터 로드 로직
        console.log('Loading chart data for chart:', chartId)
        message.info('차트 데이터를 로딩 중입니다...')
        // 여기서 실제 차트 렌더링을 구현할 수 있습니다
      } catch (err) {
        console.error('Chart data loading error:', err)
        message.error('차트 데이터 로딩 중 오류가 발생했습니다.')
      }
    }
    
    onMounted(() => {
      loadDashboardData()
    })
    
    return {
      loading,
      error,
      charts,
      dashboardStats,
      currentUser,
      isAdmin,
      canManageUsers,
      canCreateChart,
      userLayout,
      displayedCharts,
      Simple,
      loadDashboardData,
      loadChartData,
      h
    }
  }
})
</script>