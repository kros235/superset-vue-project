<template>
  <div>
    <h3>차트 정보</h3>
    <p style="color: #666; margin-bottom: 24px">
      차트의 이름과 설명을 입력하세요.
    </p>

    <a-form layout="vertical" :model="details" @finish="handleSubmit">
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

      <div style="margin-top: 24px; text-align: center">
        <a-space>
          <a-button @click="$emit('back')">
            이전
          </a-button>
          <a-button type="primary" @click="handleNext">
            미리보기
          </a-button>
        </a-space>
      </div>
    </a-form>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

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
  emits: ['change', 'next', 'back'],
  setup (props, { emit }) {
    const store = useStore()

    const details = ref({
      slice_name: props.chartConfig.slice_name || '',
      description: props.chartConfig.description || ''
    })

    const currentUser = computed(() => store.getters.currentUser)

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

    watch(details, (newDetails) => {
      emit('change', newDetails)
    }, { deep: true })

    const handleNext = () => {
      if (!details.value.slice_name.trim()) {
        return
      }
      emit('change', details.value)
      emit('next')
    }

    return {
      details,
      currentUser,
      getChartTypeName,
      handleNext
    }
  }
})
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}

.ant-descriptions {
  background: #fafafa;
}
</style>
