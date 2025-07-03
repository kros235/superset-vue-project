<template>
  <a-card title="3단계: 차트 설정" style="margin-bottom: 16px">
    <a-form layout="vertical">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="그룹화 기준 (Group By)">
            <a-select
              :value="chartConfig.params.groupby || []"
              mode="multiple"
              placeholder="그룹화할 컬럼을 선택하세요"
              @change="(value) => $emit('update', 'groupby', value)"
            >
              <a-select-option
                v-for="col in categoricalAndDateColumns"
                :key="col.column_name"
                :value="col.column_name"
              >
                {{ col.column_name }} ({{ col.type }})
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :span="12">
          <a-form-item label="측정값 (Metrics)">
            <a-select
              :value="chartConfig.params.metrics || []"
              mode="multiple"
              placeholder="측정할 컬럼을 선택하세요"
              @change="(value) => $emit('update', 'metrics', value)"
            >
              <a-select-opt-group label="합계">
                <a-select-option
                  v-for="col in numericColumns"
                  :key="`sum__${col.column_name}`"
                  :value="`sum__${col.column_name}`"
                >
                  SUM({{ col.column_name }})
                </a-select-option>
              </a-select-opt-group>
              <a-select-opt-group label="평균">
                <a-select-option
                  v-for="col in numericColumns"
                  :key="`avg__${col.column_name}`"
                  :value="`avg__${col.column_name}`"
                >
                  AVG({{ col.column_name }})
                </a-select-option>
              </a-select-opt-group>
              <a-select-opt-group label="개수">
                <a-select-option
                  v-for="col in datasetColumns"
                  :key="`count__${col.column_name}`"
                  :value="`count__${col.column_name}`"
                >
                  COUNT({{ col.column_name }})
                </a-select-option>
              </a-select-opt-group>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item
        v-if="chartConfig.viz_type === 'table'"
        label="표시할 컬럼 (All Columns)"
      >
        <a-select
          :value="chartConfig.params.all_columns || []"
          mode="multiple"
          placeholder="표시할 모든 컬럼을 선택하세요"
          @change="(value) => $emit('update', 'all_columns', value)"
        >
          <a-select-option
            v-for="col in datasetColumns"
            :key="col.column_name"
            :value="col.column_name"
          >
            {{ col.column_name }} ({{ col.type }})
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="행 제한">
            <a-input-number
              :value="chartConfig.params.row_limit || 1000"
              :min="1"
              :max="10000"
              style="width: 100%"
              @change="(value) => $emit('update', 'row_limit', value)"
            />
          </a-form-item>
        </a-col>

        <a-col v-if="chartConfig.viz_type !== 'table'" :span="12">
          <a-form-item label="색상 테마">
            <a-select
              :value="chartConfig.params.color_scheme || 'bnbColors'"
              @change="(value) => $emit('update', 'color_scheme', value)"
            >
              <a-select-option value="bnbColors">기본</a-select-option>
              <a-select-option value="googleCategory10c">Google</a-select-option>
              <a-select-option value="d3Category10">D3 Category</a-select-option>
              <a-select-option value="superset">Superset</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-card>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'ChartConfiguration',
  props: {
    chartConfig: {
      type: Object,
      required: true
    },
    datasetColumns: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update'],
  setup (props) {
    const numericColumns = computed(() =>
      props.datasetColumns.filter(col =>
        ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL'].includes(col.type?.toUpperCase())
      )
    )

    const categoricalColumns = computed(() =>
      props.datasetColumns.filter(col =>
        ['STRING', 'VARCHAR', 'TEXT'].includes(col.type?.toUpperCase())
      )
    )

    const dateColumns = computed(() =>
      props.datasetColumns.filter(col =>
        ['DATE', 'DATETIME', 'TIMESTAMP'].includes(col.type?.toUpperCase())
      )
    )

    const categoricalAndDateColumns = computed(() => [
      ...categoricalColumns.value,
      ...dateColumns.value
    ])

    return {
      numericColumns,
      categoricalColumns,
      dateColumns,
      categoricalAndDateColumns
    }
  }
})
</script>