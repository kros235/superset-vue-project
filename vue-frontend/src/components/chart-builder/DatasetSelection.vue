<template>
  <div>
    <h3>데이터셋 선택</h3>
    <p style="color: #666; margin-bottom: 24px">
      차트를 생성할 데이터셋을 선택해주세요.
    </p>

    <a-row :gutter="[16, 16]">
      <a-col
        v-for="dataset in datasets"
        :key="dataset.id"
        :xs="24"
        :sm="12"
        :lg="8"
      >
        <a-card
          hoverable
          :class="{ 'selected-dataset': selectedDataset?.id === dataset.id }"
          @click="selectDataset(dataset)"
          style="cursor: pointer"
        >
          <template #title>
            <div style="display: flex; align-items: center">
              <DatabaseOutlined style="margin-right: 8px; color: #1890ff" />
              {{ dataset.table_name }}
            </div>
          </template>

          <div style="margin-bottom: 12px">
            <a-tag color="blue">
              {{ dataset.database?.database_name || 'Unknown DB' }}
            </a-tag>
          </div>

          <p style="color: #666; font-size: 14px; margin-bottom: 8px">
            {{ dataset.description || '설명이 없습니다.' }}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center">
            <span style="font-size: 12px; color: #999">
              컬럼: {{ dataset.columns?.length || 0 }}개
            </span>
            <span style="font-size: 12px; color: #999">
              {{ formatDate(dataset.created_on) }}
            </span>
          </div>

          <div v-if="selectedDataset?.id === dataset.id" style="margin-top: 12px">
            <a-tag color="green">
              <CheckOutlined />
              선택됨
            </a-tag>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-empty v-if="!datasets.length && !loading" description="사용 가능한 데이터셋이 없습니다" />

    <div v-if="selectedDataset" style="margin-top: 24px">
      <a-divider />
      <h4>선택된 데이터셋: {{ selectedDataset.table_name }}</h4>
      <p style="color: #666">
        데이터베이스: {{ selectedDataset.database?.database_name }}
      </p>

      <a-button
        type="primary"
        @click="$emit('next')"
        style="margin-top: 16px"
      >
        다음 단계
      </a-button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { DatabaseOutlined, CheckOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'DatasetSelection',
  components: {
    DatabaseOutlined,
    CheckOutlined
  },
  props: {
    datasets: {
      type: Array,
      default: () => []
    },
    selectedDataset: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select', 'next'],
  setup (props, { emit }) {
    const selectDataset = (dataset) => {
      emit('select', dataset.id)
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR')
    }

    return {
      selectDataset,
      formatDate
    }
  }
})
</script>

<style scoped>
.selected-dataset {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.ant-card:hover {
  border-color: #1890ff;
  box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09);
}
</style>
