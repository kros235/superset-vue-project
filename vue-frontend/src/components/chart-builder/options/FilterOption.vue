<template>
  <a-form-item 
    :label="option.label"
    :help="option.description"
  >
    <a-space direction="vertical" style="width: 100%">
      <div 
        v-for="(filter, index) in filters" 
        :key="index" 
        style="display: flex; gap: 8px; align-items: center;"
      >
        <a-select
          v-model:value="filter.column"
          placeholder="컬럼 선택"
          style="width: 150px"
        >
          <a-select-option 
            v-for="col in columns" 
            :key="col.column_name"
            :value="col.column_name"
          >
            {{ col.column_name }}
          </a-select-option>
        </a-select>

        <a-select
          v-model:value="filter.operator"
          placeholder="조건"
          style="width: 120px"
        >
          <a-select-option value="==">=</a-select-option>
          <a-select-option value="!=">!=</a-select-option>
          <a-select-option value=">">></a-select-option>
          <a-select-option value="<"><</a-select-option>
          <a-select-option value=">=">>=</a-select-option>
          <a-select-option value="<="><=</a-select-option>
          <a-select-option value="LIKE">LIKE</a-select-option>
          <a-select-option value="IN">IN</a-select-option>
        </a-select>

        <a-input
          v-model:value="filter.value"
          placeholder="값"
          style="flex: 1"
        />

        <a-button 
          type="text" 
          danger 
          @click="removeFilter(index)"
        >
          <template #icon><DeleteOutlined /></template>
        </a-button>
      </div>

      <a-button type="dashed" block @click="addFilter">
        <template #icon><PlusOutlined /></template>
        필터 추가
      </a-button>
    </a-space>
  </a-form-item>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'FilterOption',
  components: {
    PlusOutlined,
    DeleteOutlined
  },
  props: {
    option: {
      type: Object,
      required: true
    },
    value: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const filters = ref([])

    // 초기값 설정
    watch(() => props.value, (newValue) => {
      if (newValue && newValue.length > 0) {
        filters.value = [...newValue]
      }
    }, { immediate: true })

    const addFilter = () => {
      filters.value.push({
        column: '',
        operator: '==',
        value: ''
      })
      emitUpdate()
    }

    const removeFilter = (index) => {
      filters.value.splice(index, 1)
      emitUpdate()
    }

    const emitUpdate = () => {
      emit('update', filters.value.filter(f => f.column && f.value))
    }

    // 필터 변경 감지
    watch(filters, () => {
      emitUpdate()
    }, { deep: true })

    return {
      filters,
      addFilter,
      removeFilter
    }
  }
})
</script>