<template>
  <a-card title="2단계: 차트 타입 선택" style="margin-bottom: 24px">
    <p style="color: #666; margin-bottom: 24px">
      생성할 차트의 시각화 타입을 선택해주세요.
    </p>

    <a-row :gutter="[16, 16]">
      <a-col
        v-for="chartType in chartTypes"
        :key="chartType.key"
        :xs="24"
        :sm="12"
        :lg="8"
      >
        <a-card
          hoverable
          :class="{ 'selected-chart-type': selectedType === chartType.key }"
          @click="selectChartType(chartType.key)"
          style="cursor: pointer; text-align: center"
        >
          <div style="font-size: 48px; color: #1890ff; margin-bottom: 16px">
            <component :is="chartType.icon" />
          </div>

          <h4 style="margin-bottom: 8px">{{ chartType.name }}</h4>
          <p style="color: #666; font-size: 14px">
            {{ chartType.description }}
          </p>

          <div v-if="selectedType === chartType.key" style="margin-top: 12px">
            <a-tag color="green">
              <CheckOutlined />
              선택됨
            </a-tag>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <div v-if="selectedType" style="margin-top: 24px">
      <a-divider />
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div>
          <h4 style="margin: 0">선택된 차트 타입: {{ getSelectedChartName() }}</h4>
          <p style="color: #666; margin: 4px 0 0 0">{{ getSelectedChartDescription() }}</p>
        </div>
        
        <!-- 🔥 네비게이션 버튼 제거 - 하단 공통 버튼 사용 -->
        <!-- 
        <a-space>
          <a-button @click="goToPrevious">
            이전
          </a-button>
          <a-button
            type="primary"
            @click="goToNext"
            style="margin-left: 16px"
          >
            다음 단계
            <RightOutlined />
          </a-button>
        </a-space>
        -->
      </div>
    </div>
  </a-card>
</template>

<script>
import { defineComponent, ref } from 'vue'
import {
  TableOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  DotChartOutlined,
  CheckOutlined,
  RightOutlined
} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ChartTypeSelection',
  components: {
    TableOutlined,
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    AreaChartOutlined,
    DotChartOutlined,
    CheckOutlined,
    RightOutlined
  },
  props: {
    selectedType: {
      type: String,
      default: ''
    }
  },
  emits: ['select', 'next', 'back'],
  setup(props, { emit }) {
    const chartTypes = ref([
      {
        key: 'table',
        name: '테이블',
        description: '데이터를 표 형태로 표시',
        icon: 'TableOutlined'
      },
      {
        key: 'dist_bar',
        name: '막대 차트',
        description: '카테고리별 값을 막대로 비교',
        icon: 'BarChartOutlined'
      },
      {
        key: 'line',
        name: '선 차트',
        description: '시간에 따른 트렌드 표시',
        icon: 'LineChartOutlined'
      },
      {
        key: 'pie',
        name: '파이 차트',
        description: '전체에서 각 부분의 비율 표시',
        icon: 'PieChartOutlined'
      },
      {
        key: 'area',
        name: '영역 차트',
        description: '시간별 누적 데이터 표시',
        icon: 'AreaChartOutlined'
      },
      {
        key: 'scatter',
        name: '산점도',
        description: '두 변수간의 상관관계 표시',
        icon: 'DotChartOutlined'
      }
    ])

    const selectChartType = (chartType) => {
      emit('select', chartType)
    }

    const getSelectedChartName = () => {
      const chart = chartTypes.value.find(type => type.key === props.selectedType)
      return chart ? chart.name : ''
    }

    const getSelectedChartDescription = () => {
      const chart = chartTypes.value.find(type => type.key === props.selectedType)
      return chart ? chart.description : ''
    }

    // 🔥 제거된 네비게이션 함수들 (상위 컴포넌트에서 처리)
    /*
    const goToNext = () => {
      emit('next')
    }

    const goToPrevious = () => {
      emit('back')
    }
    */

    return {
      chartTypes,
      selectChartType,
      getSelectedChartName,
      getSelectedChartDescription
    }
  }
})
</script>

<style scoped>
.selected-chart-type {
  border: 2px solid #1890ff !important;
  box-shadow: 0 0 10px rgba(24, 144, 255, 0.3);
}

.ant-card:hover {
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

.ant-tag {
  margin-right: 8px;
}
</style>