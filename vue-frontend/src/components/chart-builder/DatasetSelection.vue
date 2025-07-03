<template>
  <a-card title="1단계: 데이터셋 선택" style="margin-bottom: 16px">
    <a-form layout="vertical">
      <a-form-item label="데이터셋">
        <a-select
          :value="selectedDataset?.id"
          placeholder="차트에 사용할 데이터셋을 선택하세요"
          :loading="loading"
          @change="$emit('change', $event)"
        >
          <a-select-option
            v-for="dataset in datasets"
            :key="dataset.id"
            :value="dataset.id"
          >
            <a-space>
              <DatabaseOutlined />
              {{ dataset.table_name }}
              <a-tag color="blue">{{ dataset.database?.database_name }}</a-tag>
            </a-space>
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-alert
        v-if="selectedDataset"
        :message="`선택된 데이터셋: ${selectedDataset.table_name}`"
        :description="`데이터베이스: ${selectedDataset.database?.database_name}`"
        type="success"
        show-icon
      />
    </a-form>
  </a-card>
</template>

<script>
import { defineComponent } from 'vue'
import { DatabaseOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'DatasetSelection',
  components: {
    DatabaseOutlined
  },
  props: {
    datasets: Array,
    selectedDataset: Object,
    loading: Boolean
  },
  emits: ['change']
})
</script>