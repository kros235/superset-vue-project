<template>
  <a-card title="2단계: 차트 타입 선택" style="margin-bottom: 24px">
    <!-- 🔥 프리셋 추천 섹션 (새로 추가됨) -->
    <div v-if="recommendedPresets.length > 0" style="margin-bottom: 32px">
      <a-alert
        message="✨ 추천 프리셋"
        description="이 데이터셋에 대해 미리 저장된 차트 프리셋이 있습니다!"
        type="success"
        show-icon
        style="margin-bottom: 16px"
      />

      <a-row :gutter="[16, 16]">
        <a-col
          v-for="preset in recommendedPresets"
          :key="preset.id"
          :xs="24"
          :sm="12"
          :lg="8"
        >
          <a-card
            hoverable
            :class="{ 'selected-preset': selectedPreset?.id === preset.id }"
            @click="selectPreset(preset)"
            style="cursor: pointer"
          >
            <template #title>
              <div style="display: flex; align-items: center; justify-content: space-between">
                <span>
                  <ThunderboltOutlined style="color: #faad14; margin-right: 8px" />
                  {{ preset.preset_name }}
                </span>
                <a-tag color="orange">프리셋</a-tag>
              </div>
            </template>

            <div style="margin-bottom: 12px">
              <a-tag :color="getChartTypeColor(preset.chart_type)">
                {{ getChartTypeName(preset.chart_type) }}
              </a-tag>
              <a-tag color="blue">
                <FireOutlined /> {{ preset.use_count || 0 }}회 사용
              </a-tag>
            </div>

            <p style="color: #666; font-size: 13px; margin-bottom: 12px">
              {{ preset.preset_description || '프리셋 설명이 없습니다' }}
            </p>

            <div style="background: #f9f9f9; padding: 8px; border-radius: 4px; font-size: 12px">
              <div v-if="preset.configuration?.metrics?.length">
                <strong>메트릭:</strong> {{ preset.configuration.metrics.join(', ') }}
              </div>
              <div v-if="preset.configuration?.groupby?.length" style="margin-top: 4px">
                <strong>그룹핑:</strong> {{ preset.configuration.groupby.join(', ') }}
              </div>
            </div>

            <div v-if="selectedPreset?.id === preset.id" style="margin-top: 12px">
              <a-tag color="green">
                <CheckOutlined /> 선택됨
              </a-tag>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-divider>또는 직접 선택</a-divider>
    </div>

    <!-- 기존 차트 타입 선택 (변경 없음) -->
    <p style="color: #666; margin-bottom: 24px">
      생성하려는 차트의 타입을 선택해주세요.
    </p>

    <a-spin :spinning="loading">
      <a-row :gutter="[16, 16]">
        <a-col
          v-for="chartType in chartTypes"
          :key="chartType.key"
          :xs="12"
          :sm="8"
          :lg="6"
        >
          <a-card
            hoverable
            :class="{ 'selected-chart-type': selectedChartType === chartType.key }"
            @click="selectChartType(chartType.key)"
            style="cursor: pointer; text-align: center"
          >
            <div style="font-size: 32px; margin-bottom: 12px">
              {{ getChartIcon(chartType.key) }}
            </div>
            <div style="font-weight: 600; margin-bottom: 4px">
              {{ chartType.name }}
            </div>
            <div style="font-size: 12px; color: #999">
              {{ chartType.category }}
            </div>

            <div v-if="selectedChartType === chartType.key" style="margin-top: 12px">
              <a-tag color="blue">
                <CheckOutlined /> 선택됨
              </a-tag>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>

    <!-- 🔥 선택된 프리셋 정보 표시 -->
    <div v-if="selectedPreset" style="margin-top: 24px">
      <a-divider />
      <a-alert
        message="✨ 프리셋이 선택되었습니다"
        type="success"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #description>
          <div style="margin-bottom: 12px">
            <strong>'{{ selectedPreset.preset_name }}'</strong> 프리셋의 설정이 자동으로 적용됩니다.
          </div>
          <div style="background: #f6ffed; padding: 12px; border-radius: 4px; border: 1px solid #b7eb8f">
            <div v-if="selectedPreset.configuration?.metrics?.length" style="margin-bottom: 4px">
              <strong>📊 메트릭:</strong> {{ selectedPreset.configuration.metrics.join(', ') }}
            </div>
            <div v-if="selectedPreset.configuration?.groupby?.length">
              <strong>📂 그룹핑:</strong> {{ selectedPreset.configuration.groupby.join(', ') }}
            </div>
          </div>
        </template>
      </a-alert>

      <div style="display: flex; justify-content: space-between; align-items: center">
        <a-button @click="clearPreset" danger>
          프리셋 선택 해제
        </a-button>
        
        <a-button type="primary" size="large" @click="proceedWithPreset">
          <template #icon>
            <ThunderboltOutlined />
          </template>
          이 프리셋으로 차트 만들기
        </a-button>
      </div>
    </div>
    <!-- ✅✅✅ 수정 끝 ✅✅✅ -->
  </a-card>
</template>

<script>
import { defineComponent, ref, watch, onMounted } from 'vue'
import {
  CheckOutlined,
  ThunderboltOutlined,
  FireOutlined
} from '@ant-design/icons-vue'
import presetAPI from '@/services/presetAPI'

export default defineComponent({
  name: 'ChartTypeSelection',
  components: {
    CheckOutlined,
    ThunderboltOutlined, // 🔥 추가
    FireOutlined // 🔥 추가
  },
  props: {
    chartTypes: {
      type: Array,
      default: () => []
    },
    selectedChartType: {
      type: String,
      default: ''
    },
    selectedDataset: { // 🔥 추가
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change', 'preset-selected', 'proceed-with-preset'], // 🔥 'preset-selected' 추가
  setup(props, { emit }) {
    // 🔥 프리셋 관련 state 추가
    const recommendedPresets = ref([])
    const selectedPreset = ref(null)

    const chartTypeNames = {
      table: '테이블',
      bar: '막대 차트',
      line: '선 차트',
      pie: '파이 차트',
      area: '영역 차트',
      scatter: '산점도',
      dist_bar: '분포 막대 차트'
    }

    const chartTypeColors = {
      table: 'blue',
      bar: 'green',
      line: 'purple',
      pie: 'orange',
      area: 'cyan',
      scatter: 'magenta'
    }

    const getChartIcon = (type) => {
      const icons = {
        table: '📊',
        bar: '📊',
        line: '📈',
        pie: '🥧',
        area: '📉',
        scatter: '⚫',
        dist_bar: '📊'
      }
      return icons[type] || '📊'
    }

    const getChartTypeName = (type) => {
      return chartTypeNames[type] || type
    }

    const getChartTypeColor = (type) => {
      return chartTypeColors[type] || 'default'
    }

    // 🔥 프리셋 불러오기 (새로 추가됨)
    const loadPresets = async () => {
      if (!props.selectedDataset?.id) {
        console.log('⚠️ 선택된 데이터셋이 없어 프리셋을 불러올 수 없습니다')
        return
      }

      try {
        console.log(`🔍 데이터셋 ${props.selectedDataset.id}의 프리셋 조회 중...`)
        const presets = await presetAPI.getPresetsByDataset(props.selectedDataset.id)
        recommendedPresets.value = presets
        console.log(`✅ ${presets.length}개의 프리셋 발견`)
      } catch (error) {
        console.error('프리셋 조회 오류:', error)
        recommendedPresets.value = []
      }
    }

    const selectChartType = (chartType) => {
      console.log('차트 타입 선택:', chartType)
      selectedPreset.value = null
      emit('change', chartType)
    }

    // 🔥 프리셋 선택 (새로 추가됨)
    const selectPreset = async (preset) => {
      console.log('프리셋 선택:', preset)
      selectedPreset.value = preset
      
      emit('change', preset.chart_type)
      emit('preset-selected', preset) // 🔥 부모에게 프리셋 정보 전달
      
      try {
        await presetAPI.incrementPresetUsage(preset.id)
      } catch (error) {
        console.error('프리셋 사용 기록 오류:', error)
      }
    }

    // 🔥 프리셋 선택 해제
    const clearPreset = () => {
      selectedPreset.value = null
      emit('preset-selected', null)
    }

    // ✅✅✅ 프리셋으로 진행 ✅✅✅
    const proceedWithPreset = () => {
      if (selectedPreset.value) {
        console.log('✨ 프리셋으로 차트 생성 진행:', selectedPreset.value.preset_name)
        // 부모 컴포넌트에 프리셋이 선택되었음을 알리고 다음 단계로 진행
        emit('preset-selected', selectedPreset.value)
        emit('proceed-with-preset') // 새로운 이벤트 추가
      }
    }

    // 🔥 데이터셋 변경 시 프리셋 다시 로드
    watch(() => props.selectedDataset, (newDataset) => {
      if (newDataset) {
        loadPresets()
      } else {
        recommendedPresets.value = []
      }
    }, { immediate: true })

    onMounted(() => {
      loadPresets()
    })

    return {
      recommendedPresets, 
      selectedPreset,
      getChartIcon,
      getChartTypeName,
      getChartTypeColor,
      selectChartType,
      selectPreset,
      clearPreset,
      proceedWithPreset
    }
  }
})
</script>

<style scoped>
.selected-chart-type {
  border: 2px solid #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  transform: translateY(-2px);
}

/* 🔥 프리셋 선택 스타일 */
.selected-preset {
  border: 2px solid #faad14 !important;
  box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
  transform: translateY(-2px);
}

.ant-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  transition: all 0.3s ease;
}
</style>