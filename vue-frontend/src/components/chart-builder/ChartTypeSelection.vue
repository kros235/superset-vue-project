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
        <a-button
          type="primary"
          @click="goToNext"
          style="margin-left: 16px"
        >
          다음 단계
          <RightOutlined />
        </a-button>
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
  emits: ['select', 'next'],
  setup(props, { emit }) {
    const chartTypes = ref([
      {
        key: 'table',
        name: '테이블',
        description: '데이터를 표 형태로 표시합니다',
        icon: TableOutlined
      },
      {
        key: 'dist_bar',
        name: '막대 차트',
        description: '카테고리별 값을 막대로 비교합니다',
        icon: BarChartOutlined
      },
      {
        key: 'line',
        name: '선 차트',
        description: '시간에 따른 변화를 선으로 표시합니다',
        icon: LineChartOutlined
      },
      {
        key: 'pie',
        name: '파이 차트',
        description: '전체에서 각 부분의 비율을 표시합니다',
        icon: PieChartOutlined
      },
      {
        key: 'area',
        name: '영역 차트',
        description: '시간에 따른 누적 변화를 표시합니다',
        icon: AreaChartOutlined
      },
      {
        key: 'scatter',
        name: '산점도',
        description: '두 변수 간의 상관관계를 표시합니다',
        icon: DotChartOutlined
      }
    ])

    const selectChartType = (type) => {
      console.log('차트 타입 선택:', type)
      emit('select', type)
    }

    const goToNext = () => {
      console.log('다음 단계로 이동')
      emit('next')
    }

    const getSelectedChartName = () => {
      const selected = chartTypes.value.find(type => type.key === props.selectedType)
      return selected ? selected.name : ''
    }

    const getSelectedChartDescription = () => {
      const selected = chartTypes.value.find(type => type.key === props.selectedType)
      return selected ? selected.description : ''
    }

    return {
      chartTypes,
      selectChartType,
      goToNext,
      getSelectedChartName,
      getSelectedChartDescription
    }
  }
})
</script>

<style scoped>
.selected-chart-type {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.ant-card:hover {
  border-color: #1890ff;
  box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09);
}

.ant-card-body {
  padding: 20px;
}
</style>