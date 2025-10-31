<template>
  <a-form-item 
    :label="option.label" 
    :required="option.required"
    :help="option.description"
  >
    <a-select
      :value="value"
      :mode="option.multi ? 'multiple' : undefined"
      placeholder="컬럼을 선택하세요"
      :filter-option="filterOption"
      show-search
      style="width: 100%"
      @change="handleChange"
    >
      <a-select-option 
        v-for="col in filteredColumns" 
        :key="col.column_name"
        :value="col.column_name"
      >
        {{ col.column_name }} ({{ col.type }})
      </a-select-option>
    </a-select>
  </a-form-item>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'ColumnSelectOption',
  props: {
    option: {
      type: Object,
      required: true
    },
    value: {
      type: [String, Array],
      default: null
    },
    columns: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    // 옵션의 columnFilter 속성에 따라 컬럼 필터링
    const filteredColumns = computed(() => {
      if (!props.option.columnFilter) {
        return props.columns
      }
      
      // 날짜 컬럼만 표시
      if (props.option.columnFilter === 'datetime') {
        return props.columns.filter(col => 
          ['DATE', 'DATETIME', 'TIMESTAMP', 'TIME'].includes(col.type?.toUpperCase())
        )
      }
      
      // 카테고리 컬럼만 표시
      if (props.option.columnFilter === 'categorical') {
        return props.columns.filter(col => 
          ['STRING', 'VARCHAR', 'TEXT', 'CHAR'].includes(col.type?.toUpperCase())
        )
      }
      
      // 숫자 컬럼만 표시
      if (props.option.columnFilter === 'numeric') {
        return props.columns.filter(col => 
          ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL', 'BIGINT', 'DOUBLE'].includes(col.type?.toUpperCase())
        )
      }
      
      return props.columns
    })

    const handleChange = (val) => {
      emit('update', val)
    }

    const filterOption = (input, option) => {
      return option.label?.toLowerCase().includes(input.toLowerCase())
    }

    return {
      filteredColumns,
      handleChange,
      filterOption
    }
  }
})
</script>