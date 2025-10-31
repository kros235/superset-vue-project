<template>
  <a-form-item 
    :label="option.label" 
    :required="option.required"
    :help="option.description"
  >
    <!-- 🔍 디버깅 정보 (개발 중에만 표시) -->
    <div v-if="showDebug" style="margin-bottom: 8px; padding: 8px; background: #f0f0f0; font-size: 12px;">
      <div>총 컬럼 수: {{ columns.length }}</div>
      <div>숫자 컬럼 수: {{ numericColumns.length }}</div>
      <div v-if="numericColumns.length > 0">
        숫자 컬럼 예시: {{ numericColumns[0].column_name }} ({{ numericColumns[0].type }})
      </div>
    </div>

    <a-select
      :value="value"
      :mode="option.multi ? 'multiple' : undefined"
      placeholder="메트릭을 선택하세요"
      :filter-option="filterOption"
      show-search
      style="width: 100%"
      @change="handleChange"
    >
      <!-- 기본 집계 -->
      <a-select-opt-group label="기본 집계">
        <a-select-option value="count">COUNT(*)</a-select-option>
      </a-select-opt-group>
      
      <!-- 데이터셋 메트릭 -->
      <a-select-opt-group v-if="metrics && metrics.length > 0" label="데이터셋 메트릭">
        <a-select-option 
          v-for="metric in metrics" 
          :key="metric.id || metric.metric_name"
          :value="metric.metric_name || metric.id"
        >
          {{ metric.metric_name || metric.label }}
        </a-select-option>
      </a-select-opt-group>

      <!-- 숫자 컬럼 집계 -->
      <a-select-opt-group v-if="numericColumns.length > 0" label="숫자 컬럼 집계">
        <!-- SUM -->
        <a-select-option 
          v-for="col in numericColumns" 
          :key="`sum_${col.column_name}`"
          :value="`sum__${col.column_name}`"
        >
          SUM({{ col.column_name }})
        </a-select-option>
        <!-- AVG -->
        <a-select-option 
          v-for="col in numericColumns" 
          :key="`avg_${col.column_name}`"
          :value="`avg__${col.column_name}`"
        >
          AVG({{ col.column_name }})
        </a-select-option>
        <!-- MAX -->
        <a-select-option 
          v-for="col in numericColumns" 
          :key="`max_${col.column_name}`"
          :value="`max__${col.column_name}`"
        >
          MAX({{ col.column_name }})
        </a-select-option>
        <!-- MIN -->
        <a-select-option 
          v-for="col in numericColumns" 
          :key="`min_${col.column_name}`"
          :value="`min__${col.column_name}`"
        >
          MIN({{ col.column_name }})
        </a-select-option>
        <!-- COUNT DISTINCT -->
        <a-select-option 
          v-for="col in numericColumns" 
          :key="`count_distinct_${col.column_name}`"
          :value="`count_distinct__${col.column_name}`"
        >
          COUNT_DISTINCT({{ col.column_name }})
        </a-select-option>
      </a-select-opt-group>

      <!-- 숫자 컬럼이 없을 때 안내 -->
      <a-select-opt-group v-else label="숫자 컬럼 집계">
        <a-select-option disabled value="">
          숫자 타입 컬럼이 없습니다
        </a-select-option>
      </a-select-opt-group>
    </a-select>
  </a-form-item>
</template>

<script>
import { defineComponent, computed, watch } from 'vue'

export default defineComponent({
  name: 'MetricSelectOption',
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
    },
    metrics: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    // 개발 중 디버깅 표시 여부
    const showDebug = false // 필요시 true로 변경

    // 숫자 타입 컬럼 필터링 (더 넓은 범위로)
    const numericColumns = computed(() => {
      console.log('🔍 전체 컬럼 목록:', props.columns)
      
      const filtered = props.columns.filter(col => {
        const colType = col.type?.toUpperCase() || col.type_generic?.toString() || ''
        console.log(`컬럼: ${col.column_name}, 타입: ${col.type}, 타입제네릭: ${col.type_generic}`)
        
        // 다양한 숫자 타입 매칭
        const numericTypes = [
          'INTEGER', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT',
          'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'REAL',
          'NUMBER', 'MONEY', 'CURRENCY'
        ]
        
        // type 또는 type_generic에서 숫자 타입 확인
        const isNumeric = numericTypes.some(type => colType.includes(type))
        
        // type_generic이 1이면 숫자형 (Superset의 컬럼 타입 분류)
        const isNumericGeneric = col.type_generic === 1
        
        return isNumeric || isNumericGeneric
      })
      
      console.log('✅ 필터링된 숫자 컬럼:', filtered)
      return filtered
    })

    const handleChange = (val) => {
      emit('update', val)
    }

    const filterOption = (input, option) => {
      return option.label?.toLowerCase().includes(input.toLowerCase())
    }

    // 컬럼 변경 감지
    watch(() => props.columns, (newColumns) => {
      console.log('📊 MetricSelectOption - 받은 컬럼:', newColumns)
    }, { immediate: true })

    return {
      showDebug,
      numericColumns,
      handleChange,
      filterOption
    }
  }
})
</script>