<template>
  <a-card title="2단계: 차트 타입 선택" style="margin-bottom: 16px">
    <a-row :gutter="[16, 16]">
      <a-col
        v-for="type in chartTypes"
        :key="type.key"
        :xs="24"
        :sm="12"
        :md="8"
      >
        <a-card
          hoverable
          :class="chartConfig.viz_type === type.key ? 'selected-chart-type' : ''"
          :style="{
            border: chartConfig.viz_type === type.key ? '2px solid #1890ff' : '1px solid #d9d9d9',
            cursor: 'pointer'
          }"
          @click="$emit('change', type.key)"
        >
          <div style="text-align: center">
            <div style="font-size: 24px; margin-bottom: 8px">
              <component :is="type.icon" />
            </div>
            <h4>{{ type.title }}</h4>
            <p style="font-size: 12px; color: #666">
              {{ type.description }}
            </p>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </a-card>
</template>

<script>
import { defineComponent } from 'vue'
import {
  TableOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  DotChartOutlined
} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ChartTypeSelection',
  components: {
    TableOutlined,
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    AreaChartOutlined,
    DotChartOutlined
  },
  props: {
    chartConfig: {
      type: Object,
      required: true
    }
  },
  emits: ['change'],
  setup () {
    const chartTypes = [
      {
        key: 'table',
        icon: TableOutlined,
        title: '테이블',
        description: '데이터를 표 형태로 표시'
      },
      {
        key: 'bar',
        icon: BarChartOutlined,
        title: '막대 차트',
        description: '카테고리별 수치 비교'
      },
      {
        key: 'line',
        icon: LineChartOutlined,
        title: '선 차트',
        description: '시간에 따른 변화 추이'
      },
      {
        key: 'pie',
        icon: PieChartOutlined,
        title: '파이 차트',
        description: '비율 및 구성 표시'
      },
      {
        key: 'area',
        icon: AreaChartOutlined,
        title: '영역 차트',
        description: '누적 데이터 표시'
      },
      {
        key: 'scatter',
        icon: DotChartOutlined,
        title: '산점도',
        description: '두 변수 간의 상관관계'
      }
    ]

    return {
      chartTypes
    }
  }
})
</script>

<style scoped>
.selected-chart-type {
  background-color: #f0f8ff;
}
</style>