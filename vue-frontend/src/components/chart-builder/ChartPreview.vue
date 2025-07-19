<template>
  <div>
    <a-card 
      title="5단계: 미리보기 및 저장" 
      style="margin-bottom: 24px"
    >
      <!-- 미리보기 액션 버튼 -->
      <template #extra>
        <a-space>
          <a-button 
            @click="handlePreview"
            :loading="previewLoading"
            size="large"
          >
            <template #icon>
              <EyeOutlined />
            </template>
            미리보기 생성
          </a-button>
        </a-space>
      </template>

      <!-- 미리보기 영역 -->
      <div style="min-height: 300px">
        <div v-if="previewLoading" style="text-align: center; padding: 80px 0">
          <a-spin size="large" />
          <p style="margin-top: 16px; color: #666">
            차트 미리보기를 생성하고 있습니다...
          </p>
        </div>

        <div v-else-if="chartData" style="text-align: center; padding: 20px">
          <div style="margin-bottom: 24px">
            <component 
              :is="chartIcons[chartConfig.viz_type]" 
              style="font-size: 48px; color: #52c41a" 
            />
            <h3 style="margin-top: 16px; color: #52c41a">
              미리보기 생성 완료!
            </h3>
          </div>

          <!-- 차트 기본 정보 -->
          <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; margin-bottom: 24px">
            <a-descriptions title="차트 정보" :column="2" size="small">
              <a-descriptions-item label="차트 이름">
                {{ chartConfig.slice_name || '이름 없음' }}
              </a-descriptions-item>
              <a-descriptions-item label="차트 타입">
                {{ getChartTypeName() }}
              </a-descriptions-item>
              <a-descriptions-item label="데이터 행 수">
                {{ chartData.rowcount || 0 }}행
              </a-descriptions-item>
              <a-descriptions-item label="실행 시간">
                {{ chartData.duration || 0 }}ms
              </a-descriptions-item>
            </a-descriptions>

            <p style="margin-top: 16px; color: #666; font-size: 14px">
              실제 차트 렌더링은 Apache Superset에서 이루어집니다.
            </p>

            <!-- 차트 데이터 요약 표시 -->
            <div v-if="chartData" style="margin-top: 16px; text-align: center">
              <a-tag color="blue">
                데이터 {{ chartData.rowcount || 0 }}행
              </a-tag>
              <a-tag color="green">
                컬럼 {{ getColumnCount() }}개
              </a-tag>
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

        <div v-else style="text-align: center; padding: 80px 0">
          <a-empty description="미리보기를 생성하려면 '미리보기 생성' 버튼을 클릭하세요">
            <template #image>
              <BarChartOutlined style="font-size: 64px; color: #d9d9d9" />
            </template>
          </a-empty>
        </div>
      </div>

      <!-- 🔥 개별 저장 버튼 제거 - 상위 컴포넌트의 공통 버튼 사용 -->
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
  TableOutlined,
  AreaChartOutlined,
  DotChartOutlined
} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ChartPreview',
  components: {
    EyeOutlined,
    SaveOutlined,
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    TableOutlined,
    AreaChartOutlined,
    DotChartOutlined
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
  emits: ['preview', 'save', 'back'],
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
      area: AreaChartOutlined,
      scatter: DotChartOutlined
    }

    const getChartTypeName = () => {
      return chartTypeNames[props.chartConfig.viz_type] || props.chartConfig.viz_type
    }

    const getColumnCount = () => {
      if (!props.chartData?.data || !Array.isArray(props.chartData.data) || props.chartData.data.length === 0) {
        return 0
      }
      return Object.keys(props.chartData.data[0] || {}).length
    }

    const handlePreview = () => {
      emit('preview')
    }

    const handleSave = () => {
      emit('save')
    }

    const handleBack = () => {
      emit('back')
    }

    return {
      chartContainer,
      chartIcons,
      getChartTypeName,
      getColumnCount,
      handlePreview,
      handleSave,
      handleBack
    }
  }
})
</script>

<style scoped>
.ant-card-body {
  padding: 24px;
}

.ant-descriptions-item-label {
  font-weight: 500;
}

.ant-tag {
  margin: 0 4px;
}

.ant-collapse {
  background: #fff;
  border: 1px solid #f0f0f0;
}

.ant-collapse-header {
  background: #fafafa !important;
}

/* 미리보기 영역 스타일 */
.preview-container {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.preview-container:hover {
  border-color: #1890ff;
  background: #f0f9ff;
}

/* 로딩 스피너 커스텀 */
.ant-spin-large .ant-spin-dot {
  font-size: 32px;
}

/* 버튼 스타일 */
.ant-btn-large {
  height: 40px;
  padding: 0 20px;
  font-size: 16px;
}

/* 아이콘 스타일 */
.chart-type-icon {
  color: #52c41a;
  font-size: 48px;
  margin-bottom: 16px;
}

/* 성공 메시지 스타일 */
.success-message {
  color: #52c41a;
  font-weight: 600;
  margin-top: 16px;
}
</style>