<template>
  <a-modal
    :visible="visible"
    title="차트 프리셋 생성 (선택사항)"
    width="800px"
    @cancel="handleSkip"
    :maskClosable="false"
  >
    <!-- 🔥 안내 메시지 -->
    <a-alert
      message="이 데이터셋으로 자주 만들 차트 유형을 미리 설정할 수 있습니다"
      type="info"
      show-icon
      style="margin-bottom: 20px"
    />

    <!-- 🔥 로딩 상태 -->
    <a-spin :spinning="loading" tip="컬럼 정보를 불러오는 중...">
      
      <!-- 🔥 컬럼 정보 로드 성공 시 -->
      <div v-if="!loading && columns.length > 0">
        
        <!-- 프리셋 목록 -->
        <div v-for="(preset, index) in presets" :key="index" style="margin-bottom: 20px">
          <a-card :title="`프리셋 #${index + 1}`" size="small">
            <template #extra>
              <a-button 
                type="link" 
                danger 
                size="small"
                @click="removePreset(index)"
              >
                삭제
              </a-button>
            </template>

            <a-form layout="vertical">
              <!-- 프리셋 이름 -->
              <a-form-item label="프리셋 이름" required>
                <a-input 
                  v-model:value="preset.preset_name" 
                  placeholder="예: 월별 매출 분석"
                />
              </a-form-item>

              <!-- 차트 타입 -->
              <a-form-item label="차트 타입" required>
                <a-select v-model:value="preset.chart_type">
                  <a-select-option value="table">테이블</a-select-option>
                  <a-select-option value="pie">파이 차트</a-select-option>
                  <a-select-option value="bar">막대 차트</a-select-option>
                  <a-select-option value="line">선 차트</a-select-option>
                  <a-select-option value="area">영역 차트</a-select-option>
                  <a-select-option value="dist_bar">분포 막대 차트</a-select-option>
                </a-select>
              </a-form-item>

              <!-- 메트릭 선택 -->
              <a-form-item label="메트릭 (집계)">
                <a-select
                  v-model:value="preset.metricsArray"
                  mode="multiple"
                  placeholder="메트릭을 선택하세요"
                >
                  <a-select-option value="count">COUNT(*)</a-select-option>
                  <a-select-option 
                    v-for="col in numericColumns" 
                    :key="`sum_${col.name}`"
                    :value="`sum__${col.name}`"
                  >
                    SUM({{ col.name }})
                  </a-select-option>
                  <a-select-option 
                    v-for="col in numericColumns" 
                    :key="`avg_${col.name}`"
                    :value="`avg__${col.name}`"
                  >
                    AVG({{ col.name }})
                  </a-select-option>
                </a-select>
              </a-form-item>

              <!-- 그룹핑 컬럼 -->
              <a-form-item label="그룹핑 (Group By)">
                <a-select
                  v-model:value="preset.groupbyArray"
                  mode="multiple"
                  placeholder="그룹핑할 컬럼을 선택하세요"
                >
                  <a-select-option 
                    v-for="col in columns" 
                    :key="col.name"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>

              <!-- 설명 -->
              <a-form-item label="설명 (선택)">
                <a-textarea 
                  v-model:value="preset.preset_description"
                  placeholder="이 프리셋에 대한 설명"
                  :rows="2"
                />
              </a-form-item>
            </a-form>
          </a-card>
        </div>

        <!-- 프리셋 추가 버튼 -->
        <a-button 
          type="dashed" 
          block 
          @click="addPreset"
          style="margin-bottom: 20px"
        >
          <template #icon><PlusOutlined /></template>
          프리셋 추가
        </a-button>

      </div>

      <!-- 🔥 컬럼 정보 없음 -->
      <a-empty 
        v-else-if="!loading && columns.length === 0"
        description="컬럼 정보를 불러올 수 없습니다"
      />

    </a-spin>

    <!-- 🔥 푸터 버튼 -->
    <template #footer>
      <a-space>
        <a-button @click="handleSkip">
          건너뛰기 (데이터셋만 생성)
        </a-button>
        <a-button 
          type="primary" 
          @click="handleSubmit"
          :loading="submitting"
          :disabled="presets.length === 0"
        >
          프리셋 생성
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import supersetAPI from '@/services/supersetAPI'

export default {
  name: 'PresetModal',
  components: {
    PlusOutlined
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    datasetId: {
      type: Number,
      required: false,  
      default: null     
    }
  },
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const loading = ref(false)
    const submitting = ref(false)
    const columns = ref([])
    const presets = ref([])

    // 🔥 숫자형 컬럼만 필터링
    const numericColumns = computed(() => {
      return columns.value.filter(col => {
        const type = (col.type || '').toUpperCase()
        return type.includes('INT') || 
               type.includes('DECIMAL') || 
               type.includes('FLOAT') || 
               type.includes('DOUBLE') || 
               type.includes('NUMERIC')
      })
    })

    // 🔥 데이터셋 컬럼 정보 로드
    const loadColumns = async () => {
      if (!props.datasetId) return

      loading.value = true
      try {
        console.log('✅ 데이터셋 컬럼 조회 시작:', props.datasetId)
        
        const dataset = await supersetAPI.getDataset(props.datasetId)
        console.log('데이터셋 상세:', dataset)

        if (dataset.result?.columns) {
          columns.value = dataset.result.columns.map(col => ({
            name: col.column_name,
            type: col.type,
            description: col.description || ''
          }))
          
          console.log(`✅ ${columns.value.length}개 컬럼 로드 완료`)
        } else {
          throw new Error('컬럼 정보를 찾을 수 없습니다')
        }

      } catch (error) {
        console.error('컬럼 로드 실패:', error)
        message.error('컬럼 정보를 불러올 수 없습니다')
      } finally {
        loading.value = false
      }
    }

    // 🔥 모달이 열릴 때 컬럼 로드
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        loadColumns()
        // 기본 프리셋 1개 추가
        if (presets.value.length === 0) {
          addPreset()
        }
      }
    })

    // 🔥 프리셋 추가
    const addPreset = () => {
      presets.value.push({
        preset_name: '',
        preset_description: '',
        chart_type: 'table',
        metricsArray: ['count'],
        groupbyArray: []
      })
    }

    // 🔥 프리셋 삭제
    const removePreset = (index) => {
      presets.value.splice(index, 1)
    }

    // 🔥 건너뛰기
    const handleSkip = () => {
      emit('close')
      message.success('데이터셋이 생성되었습니다')
    }

    // 🔥 프리셋 생성 제출
    const handleSubmit = async () => {
      // 유효성 검사
      for (const preset of presets.value) {
        if (!preset.preset_name) {
          message.warning('모든 프리셋에 이름을 입력해주세요')
          return
        }
      }

      submitting.value = true
      try {
        console.log('프리셋 생성 시작...')

        for (const preset of presets.value) {
          const metrics = preset.metricsArray || ['count']
          const groupby = preset.groupbyArray || []

          const chartPayload = {
            slice_name: preset.preset_name,
            description: preset.preset_description || '',
            viz_type: preset.chart_type,
            datasource_id: props.datasetId,
            datasource_type: 'table',
            params: JSON.stringify({
              datasource: `${props.datasetId}__table`,
              viz_type: preset.chart_type,
              metrics: metrics,
              groupby: groupby,
              adhoc_filters: [],
              row_limit: 10000
            }),
            query_context: JSON.stringify({
              datasource: {
                id: props.datasetId,
                type: 'table'
              },
              queries: [{
                columns: groupby,
                metrics: metrics,
                filters: [],
                row_limit: 10000
              }]
            })
          }

          console.log('차트 생성 페이로드:', chartPayload)
          await supersetAPI.createChart(chartPayload)
          console.log(`✅ 프리셋 "${preset.preset_name}" 생성 완료`)
        }

        message.success('프리셋 차트가 생성되었습니다')
        emit('success')

      } catch (error) {
        console.error('프리셋 생성 오류:', error)
        message.error('프리셋 생성에 실패했습니다')
      } finally {
        submitting.value = false
      }
    }

    return {
      loading,
      submitting,
      columns,
      numericColumns,
      presets,
      addPreset,
      removePreset,
      handleSkip,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}
</style>