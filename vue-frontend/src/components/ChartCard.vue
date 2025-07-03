<template>
  <a-card
    :title="chart.slice_name || chart.chart_name || '제목 없음'"
    hoverable
    style="height: 300px"
  >
    <template #extra>
      <a-button 
        type="link" 
        size="small"
        @click="$emit('view', chart.id)"
      >
        보기
      </a-button>
    </template>
    
    <div style="
      height: 200px; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      flex-direction: column;
      color: #666;
    ">
      <component :is="chartIcon" style="font-size: 32px; margin-bottom: 16px" />
      <div style="font-size: 14px">
        차트 유형: {{ chart.viz_type || '알 수 없음' }}
      </div>
      <div style="margin-top: 8px; font-size: 12px; text-align: center">
        {{ chart.description || '설명이 없습니다.' }}
      </div>
    </div>
  </a-card>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { 
  LineChartOutlined, 
  BarChartOutlined, 
  PieChartOutlined,
  TableOutlined
} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ChartCard',
  components: {
    LineChartOutlined,
    BarChartOutlined,
    PieChartOutlined,
    TableOutlined
  },
  props: {
    chart: {
      type: Object,
      required: true
    }
  },
  emits: ['view'],
  setup(props) {
    const chartTypeIcons = {
      line: LineChartOutlined,
      bar: BarChartOutlined,
      pie: PieChartOutlined,
      table: TableOutlined
    }
    
    const chartIcon = computed(() => {
      return chartTypeIcons[props.chart.viz_type] || BarChartOutlined
    })
    
    return {
      chartIcon
    }
  }
})
</script>