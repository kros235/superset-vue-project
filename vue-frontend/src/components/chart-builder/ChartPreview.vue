<template>
  <a-card title="5단계: 미리보기 및 저장" style="margin-bottom: 16px">
    <template #extra>
      <a-space>
        <a-button :loading="previewLoading" @click="$emit('preview')">
          <template #icon>
            <EyeOutlined />
          </template>
          미리보기
        </a-button>
        <a-button type="primary" @click="$emit('save')">
          <template #icon>
            <SaveOutlined />
          </template>
          차트 저장
        </a-button>
      </a-space>
    </template>

    <div v-if="chartData" class="preview-container">
      <div style="margin-bottom: 16px">
        <a-tag color="green">미리보기 생성 완료</a-tag>
      </div>
      <div class="preview-info">
        차트 타입: {{ chartConfig.viz_type.toUpperCase() }}
        <br />
        데이터 행 수: {{ chartData.query?.rowcount || 0 }}
        <br />
        실행 시간: {{ chartData.query?.duration || 0 }}ms
      </div>
      <div class="preview-note">
        실제 차트는 Superset에서 렌더링됩니다
      </div>
    </div>

    <a-empty
      v-else
      description="미리보기를 생성하려면 '미리보기' 버튼을 클릭하세요"
    />
  </a-card>
</template>

<script>
import { defineComponent } from 'vue'
import { EyeOutlined, SaveOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ChartPreview',
  components: {
    EyeOutlined,
    SaveOutlined
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
    }
  },
  emits: ['preview', 'save']
})
</script>

<style scoped>
.preview-container {
  padding: 20px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  text-align: center;
}

.preview-info {
  font-size: 14px;
  color: #666;
  margin-top: 16px;
}

.preview-note {
  margin-top: 16px;
  font-size: 12px;
  color: #999;
}
</style>