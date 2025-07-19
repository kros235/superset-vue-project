<template>
  <a-card title="4단계: 차트 정보" style="margin-bottom: 24px">
    <a-form layout="vertical">
      <!-- 기본 정보 입력 -->
      <a-row :gutter="16">
        <a-col :span="24">
          <a-form-item label="차트 이름 *" required>
            <a-input
              v-model:value="details.slice_name"
              placeholder="차트의 이름을 입력하세요"
              size="large"
              :maxlength="100"
              show-count
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="24">
          <a-form-item label="차트 설명">
            <a-textarea
              v-model:value="details.description"
              placeholder="차트에 대한 설명을 입력하세요 (선택사항)"
              :rows="4"
              :maxlength="500"
              show-count
            />
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 차트 정보 요약 -->
      <a-card title="차트 설정 요약" style="margin-bottom: 16px">
        <a-descriptions :column="2" size="small">
          <a-descriptions-item label="데이터셋">
            {{ selectedDataset?.table_name || '선택 안됨' }}
          </a-descriptions-item>
          <a-descriptions-item label="차트 타입">
            {{ getChartTypeName() }}
          </a-descriptions-item>
          <a-descriptions-item label="작성자">
            {{ currentUser?.first_name }} {{ currentUser?.last_name }}
          </a-descriptions-item>
          <a-descriptions-item label="생성일">
            {{ new Date().toLocaleDateString('ko-KR') }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 검증 상태 표시 -->
      <a-card title="입력 검증" style="margin-bottom: 16px">
        <a-space direction="vertical" style="width: 100%">
          <div>
            <a-tag :color="details.slice_name ? 'green' : 'red'">
              {{ details.slice_name ? '✓' : '✗' }}
            </a-tag>
            차트 이름 {{ details.slice_name ? '입력완료' : '입력 필요' }}
          </div>
          <div>
            <a-tag :color="chartConfig.params?.metrics?.length ? 'green' : 'red'">
              {{ chartConfig.params?.metrics?.length ? '✓' : '✗' }}
            </a-tag>
            메트릭 {{ chartConfig.params?.metrics?.length ? '설정완료' : '설정 필요' }}
          </div>
          <div>
            <a-tag :color="selectedDataset ? 'green' : 'red'">
              {{ selectedDataset ? '✓' : '✗' }}
            </a-tag>
            데이터셋 {{ selectedDataset ? '선택완료' : '선택 필요' }}
          </div>
          <div>
            <a-tag :color="chartConfig.viz_type ? 'green' : 'red'">
              {{ chartConfig.viz_type ? '✓' : '✗' }}
            </a-tag>
            차트 타입 {{ chartConfig.viz_type ? '선택완료' : '선택 필요' }}
          </div>
        </a-space>
      </a-card>

      <!-- 🔥 개별 버튼 제거 - 상위 컴포넌트의 공통 버튼 사용 -->
    </a-form>
  </a-card>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import authService from '../../services/authService'

export default defineComponent({
  name: 'ChartDetails',
  props: {
    chartConfig: {
      type: Object,
      required: true
    },
    selectedDataset: {
      type: Object,
      default: null
    }
  },
  emits: ['update', 'next', 'back'],
  setup(props, { emit }) {
    const details = ref({
      slice_name: '',
      description: ''
    })

    const currentUser = computed(() => authService.getCurrentUser()?.result)

    // 차트 타입 이름 매핑
    const chartTypeNames = {
      table: '테이블',
      dist_bar: '막대 차트',
      line: '선 차트',
      pie: '파이 차트',
      area: '영역 차트',
      scatter: '산점도'
    }

    const getChartTypeName = () => {
      return chartTypeNames[props.chartConfig.viz_type] || props.chartConfig.viz_type
    }

    // 입력 검증
    const isValid = computed(() => {
      return details.value.slice_name && 
             details.value.slice_name.trim() && 
             props.chartConfig.params?.metrics?.length > 0 &&
             props.selectedDataset &&
             props.chartConfig.viz_type
    })

    // 기존 설정 값으로 폼 초기화
    watch(() => props.chartConfig, (newConfig) => {
      if (newConfig.slice_name) {
        details.value.slice_name = newConfig.slice_name
      }
      if (newConfig.description) {
        details.value.description = newConfig.description
      }
    }, { immediate: true })

    // 실시간으로 부모 컴포넌트에 변경사항 전달
    watch(details, (newDetails) => {
      emit('update', newDetails)
    }, { deep: true })

    return {
      details,
      currentUser,
      getChartTypeName,
      isValid
    }
  }
})
</script>

<style scoped>
.ant-descriptions-item-label {
  font-weight: 500;
}

.ant-card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ant-tag {
  margin-right: 8px;
}

.ant-input,
.ant-textarea {
  border-radius: 6px;
}

.ant-form-item-label > label {
  font-weight: 500;
}

/* 필수 입력 필드 스타일 */
.ant-form-item-required::before {
  color: #ff4d4f;
}

/* 검증 상태 카드 스타일 */
.ant-space > .ant-space-item {
  padding: 8px 0;
}
</style>