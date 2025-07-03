<template>
  <div>
    <h3>차트 미리보기</h3>
    <p style="color: #666; margin-bottom: 24px">
      생성된 차트를 미리보고 저장하세요.
    </p>

    <a-card title="차트 미리보기">
      <template #extra>
        <a-space>
          <a-button @click="handlePreview" :loading="previewLoading">
            <template #icon>
              <EyeOutlined />
            </template>
            미리보기 새로고침
          </a-button>
          <a-button type="primary" @click="handleSave">
            <template #icon>
              <SaveOutlined />
            </template>
            차트 저장
          </a-button>
        </a-space>
      </template>

      <div style="min-height: 400px">
        <!-- 로딩 상태 -->
        <div
          v-if="previewLoading"
          style="display: flex; justify-content: center; align-items: center; height: 400px"
        >
          <a-spin size="large" />
          <span style="margin-left: 16px">차트를 생성하는 중...</span>
        </div>

        <!-- 차트 데이터가 없는 경우 -->
        <div
          v-else-if="!chartData"
          style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 400px; color: #666"
        >
          <EyeOutlined style="font-size: 48px; margin-bottom: 16px" />
          <h4>차트 미리보기</h4>
          <p>미리보기 버튼을 클릭하여 차트를 확인하세요.</p>
          <a-button type="primary" @click="handlePreview">
            미리보기 생성
          </a-button>
        </div>

        <!-- 차트 렌더링 영역 -->
        <div v-else>
          <!-- 차트 정보 표시 -->
          <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 4px">
            <h4 style="margin: 0 0 8px 0">{{ chartConfig.slice_name }}</h4>
            <p style="margin: 0; color: #666; font-size: 14px">
              {{ chartConfig.description || '설명이 없습니다.' }}
            </p>
          </div>

          <!-- 실제 차트 컨테이너 -->
          <div
            ref="chartContainer"
            style="width: 100%; height: 400px; border: 1px solid #d9d9d9; border-radius: 4px; padding: 16px"
          >
            <!-- 테이블 차트 -->
            <div v-if="chartConfig.viz_type === 'table'">
              <a-table
                :columns="tableColumns"
                :data-source="tableData"
                :pagination="{ pageSize: 10 }"
                size="small"
              />
            </div>

            <!-- 기타 차트 타입들 -->
            <div
              v-else
              style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #999"
            >
              <component :is="getChartIcon()" style="font-size: 48px; margin-bottom: 16px" />
              <h4>{{ getChartTypeName() }} 차트</h4>
              <p style="text-align: center">
                이 차트 타입의 미리보기는 아직 지원되지 않습니다.<br>
                저장 후 Superset에서 확인할 수 있습니다.
              </p>

              <!-- 차트 데이터 요약 표시 -->
              <div v-if="chartData" style="margin-top: 16px; text-align: center">
                <a-tag color="blue">
                  데이터 {{ chartData.rowcount || 0 }}행
                </a-tag>
                <a-tag color="green">
                  컬럼 {{ Object.keys(chartData.data?.[0] || {}).length }}개
                </a-tag>
              </div>
            </div>
          </div>

          <!-- 차트 설정 요약 -->
          <a-collapse style="margin-top: 16px">
            <a-collapse-panel key="settings" header="차트 설정 상세">
              <a-descriptions :column="2" size="small">
                <a-descriptions-item label="데이터셋">
                  {{ selectedDataset?.table_name }}
                </a-descriptions-item>
                <a-descriptions-item label="차트 타입">
                  {{ getChartTypeName() }}
                </a-descriptions-item>
                <a-descriptions-item label="메트릭" :span="2">
                  <span v-if="chartConfig.params?.metrics?.length">
                    {{ chartConfig.params.metrics.join(', ') }}
                  </span>
                  <span v-else style="color: #999">설정되지 않음</span>
                </a-descriptions-item>
                <a-descriptions-item label="그룹 기준" :span="2">
                  <span v-if="chartConfig.params?.groupby?.length">
                    {{ chartConfig.params.groupby.join(', ') }}
                  </span>
                  <span v-else style="color: #999">설정되지 않음</span>
                </a-descriptions-item>
              </a-descriptions>
            </a-collapse-panel>
          </a-collapse>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import {
  EyeOutlined,
  SaveOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined
} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ChartPreview',
  components: {
    EyeOutlined,
    SaveOutlined,
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    TableOutlined
  },
  props: {
    chartConfig: {
      type: Object,
      required: true
    },
    chartData: {
      type: Object,
      default: null
    },
    previewLoading: {
      type: Boolean,
      default: false
    },
    selectedDataset: {
      type: Object,
      default: null
    }
  },
  emits: ['preview', 'save'],
  setup (props, { emit }) {
    const chartContainer = ref()

    const chartTypeNames = {
      table: '테이블',
      dist_bar: '막대 차트',
      line: '선 차트',
      pie: '파이 차트',
      area: '영역 차트',
      scatter: '산점도'
    }

    const chartIcons = {
      table: TableOutlined,
      dist_bar: BarChartOutlined,
      line: LineChartOutlined,
      pie: PieChartOutlined,
      area: LineChartOutlined,
      scatter: BarChartOutlined
    }

    const getChartTypeName = () => {
      return chartTypeNames[props.chartConfig.viz_type] || props.chartConfig.viz_type
    }

    const getChartIcon = () => {
      return chartIcons[props.chartConfig.viz_type] || BarChartOutlined
    }

    // 테이블 데이터 처리
    const tableColumns = computed(() => {
      if (!props.chartData?.data?.length) return []

      const firstRow = props.chartData.data[0]
      return Object.keys(firstRow).map(key => ({
        title: key,
        dataIndex: key,
        key,
        ellipsis: true
      }))
    })

    const tableData = computed(() => {
      if (!props.chartData?.data) return []

      return props.chartData.data.map((row, index) => ({
        key: index,
        ...row
      }))
    })

    const handlePreview = () => {
      emit('preview')
    }

    const handleSave = () => {
      emit('save')
    }

    return {
      chartContainer,
      getChartTypeName,
      getChartIcon,
      tableColumns,
      tableData,
      handlePreview,
      handleSave
    }
  }
})
</script>

<style scoped>
.ant-card-body {
  padding: 24px;
}

.ant-table-small .ant-table-tbody > tr > td {
  padding: 4px 8px;
}
</style>
