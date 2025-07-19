<template>
  <a-card title="4단계: 차트 정보" style="margin-bottom: 24px">
    <p style="color: #666; margin-bottom: 24px">
      차트의 이름과 설명을 입력하세요.
    </p>

    <a-form layout="vertical" :model="details">
      <a-card title="차트 정보">
        <a-form-item
          label="차트 이름"
          name="slice_name"
          :rules="[{ required: true, message: '차트 이름을 입력해주세요!' }]"
        >
          <a-input
            v-model:value="details.slice_name"
            placeholder="차트의 이름을 입력하세요"
            size="large"
          />
        </a-form-item>

        <a-form-item
          label="차트 설명"
          name="description"
        >
          <a-textarea
            v-model:value="details.description"
            placeholder="차트에 대한 설명을 입력하세요 (선택사항)"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="소유자">
          <a-input
            :value="currentUser?.first_name || currentUser?.username"
            disabled
          />
        </a-form-item>
      </a-card>

      <a-card title="차트 요약" style="margin-top: 16px">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="데이터셋">
            {{ selectedDataset?.table_name || '선택되지 않음' }}
          </a-descriptions-item>
          <a-descriptions-item label="차트 타입">
            {{ getChartTypeName() }}
          </a-descriptions-item>
          <a-descriptions-item label="메트릭">
            <a-tag
              v-for="metric in chartConfig.params?.metrics || []"
              :key="metric"
              color="blue"
            >
              {{ metric }}
            </a-tag>
            <span v-if="!chartConfig.params?.metrics?.length" style="color: #999">
              설정되지 않음
            </span>
          </a-descriptions-item>
          <a-descriptions-item label="그룹 기준">
            <a-tag
              v-for="group in chartConfig.params?.groupby || []"
              :key="group"
              color="green"
            >
              {{ group }}
            </a-tag>
            <span v-if="!chartConfig.params?.groupby?.length" style="color: #999">
              설정되지 않음
            </span>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 입력 검증 -->
      <a-card title="준비 상태" style="margin-top: 16px">
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
        </a-space>
      </a-card>

      <div style="margin-top: 24px; text-align: center">
        <a-space>
          <a-button @click="goToPrevious">
            이전
          </a-button>
          <a-button 
            type="primary" 
            @click="handleNext"
            :disabled="!isValid"
          >
            미리보기
          </a-button>
        </a-space>
      </div>
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
             props.chartConfig.params?.metrics?.length > 0
    })

    // 다음 단계로 이동
    const handleNext = () => {
      if (!isValid.value) {
        return
      }
      
      emit('update', details.value)
      emit('next')
    }

    // 이전 단계로 이동
    const goToPrevious = () => {
      emit('back')
    }

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
      isValid,
      handleNext,
      goToPrevious
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
</style>