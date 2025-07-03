<template>
  <a-card title="4단계: 차트 정보" style="margin-bottom: 16px">
    <a-form layout="vertical">
      <a-form-item label="차트 이름" required>
        <a-input
          :value="chartConfig.slice_name"
          placeholder="차트의 이름을 입력하세요"
          @change="(e) => $emit('update', 'slice_name', e.target.value)"
        />
      </a-form-item>

      <a-form-item label="설명">
        <a-textarea
          :value="chartConfig.description"
          :rows="3"
          placeholder="차트에 대한 설명을 입력하세요 (선택사항)"
          @change="(e) => $emit('update', 'description', e.target.value)"
        />
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ChartDetails',
  props: {
    chartConfig: {
      type: Object,
      required: true
    }
  },
  emits: ['update']
})
</script>