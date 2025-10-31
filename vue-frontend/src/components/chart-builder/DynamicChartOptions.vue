<template>
  <div class="dynamic-chart-options">
    <!-- 탭으로 DATA / CUSTOMIZE 구분 -->
    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <!-- DATA 탭 -->
      <a-tab-pane key="DATA" tab="DATA" forceRender>
        <a-form layout="vertical">
          <div v-for="option in dataOptions" :key="option.key" style="margin-bottom: 16px">
            <!-- 옵션 타입별 렌더링 -->
            <component
              :is="getOptionComponent(option.type)"
              :option="option"
              :value="config[option.key]"
              :columns="datasetColumns"
              :metrics="datasetMetrics"
              @update="handleOptionUpdate(option.key, $event)"
            />
          </div>
        </a-form>
      </a-tab-pane>

      <!-- CUSTOMIZE 탭 -->
      <a-tab-pane key="CUSTOMIZE" tab="CUSTOMIZE" forceRender>
        <a-form layout="vertical">
          <div v-for="option in customizeOptions" :key="option.key" style="margin-bottom: 16px">
            <component
              :is="getOptionComponent(option.type)"
              :option="option"
              :value="config[option.key]"
              :columns="datasetColumns"
              @update="handleOptionUpdate(option.key, $event)"
            />
          </div>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { getChartOptions, groupOptionsByTab, getDefaultValues } from '../../utils/chartOptions'

// 옵션 타입별 컴포넌트
import TextOption from './options/TextOption.vue'
import NumberOption from './options/NumberOption.vue'
import SelectOption from './options/SelectOption.vue'
import CheckboxOption from './options/CheckboxOption.vue'
import MetricSelectOption from './options/MetricSelectOption.vue'
import ColumnSelectOption from './options/ColumnSelectOption.vue'
import FilterOption from './options/FilterOption.vue'
import TextareaOption from './options/TextareaOption.vue'

export default defineComponent({
  name: 'DynamicChartOptions',
  components: {
    TextOption,
    NumberOption,
    SelectOption,
    CheckboxOption,
    MetricSelectOption,
    ColumnSelectOption,
    FilterOption,
    TextareaOption
  },
  props: {
    chartConfig: {
      type: Object,
      required: true
    },
    datasetColumns: {
      type: Array,
      default: () => []
    },
    datasetMetrics: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const activeTab = ref('DATA')
    const config = ref({})

    // 차트 타입에 따른 옵션 가져오기
    const chartOptions = computed(() => {
      return getChartOptions(props.chartConfig.viz_type)
    })

    // 탭별로 옵션 그룹화
    const groupedOptions = computed(() => {
      return groupOptionsByTab(chartOptions.value)
    })

    const dataOptions = computed(() => groupedOptions.value.DATA || [])
    const customizeOptions = computed(() => groupedOptions.value.CUSTOMIZE || [])

    // 옵션 타입에 따라 적절한 컴포넌트 반환
    const getOptionComponent = (type) => {
      const componentMap = {
        text: 'TextOption',
        number: 'NumberOption',
        select: 'SelectOption',
        checkbox: 'CheckboxOption',
        metric_select: 'MetricSelectOption',
        column_select: 'ColumnSelectOption',
        filter: 'FilterOption',
        textarea: 'TextareaOption',
        multi_select: 'SelectOption' // multi 속성으로 구분
      }
      return componentMap[type] || 'TextOption'
    }

    // 옵션 값 업데이트
    const handleOptionUpdate = (key, value) => {
      config.value[key] = value
      emit('update', { params: config.value })
    }

    // 탭 변경
    const handleTabChange = (key) => {
      activeTab.value = key
    }

    // 차트 타입 변경 시 기본값 설정
    watch(() => props.chartConfig.viz_type, (newVizType) => {
      if (newVizType) {
        const options = getChartOptions(newVizType)
        const defaults = getDefaultValues(options)
        config.value = { ...defaults, ...config.value }
        emit('update', { params: config.value })
      }
    }, { immediate: true })

    // 기존 설정값 로드
    watch(() => props.chartConfig.params, (newParams) => {
      if (newParams) {
        config.value = { ...config.value, ...newParams }
      }
    }, { immediate: true, deep: true })

    return {
      activeTab,
      config,
      dataOptions,
      customizeOptions,
      getOptionComponent,
      handleOptionUpdate,
      handleTabChange
    }
  }
})
</script>

<style scoped>
.dynamic-chart-options {
  min-height: 400px;
}

.ant-form-item {
  margin-bottom: 16px;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}
</style>