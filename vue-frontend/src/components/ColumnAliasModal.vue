<template>
  <a-modal
    :open="visible"
    title="🏷️ 컬럼 별칭 설정 (선택사항)"
    width="800px"
    :maskClosable="false"
    @cancel="handleSkip"
  >
    <a-spin :spinning="loading">
      <a-alert
        message="AI 차트 생성에 활용됩니다"
        description="컬럼에 한글 별칭을 지정하면 AI가 '팀별 수익' 같은 자연어 요청을 더 잘 이해합니다. 이 단계는 건너뛸 수 있습니다."
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />

      <a-table
        v-if="columns.length > 0"
        :dataSource="columns"
        :columns="tableColumns"
        :pagination="false"
        size="small"
        :scroll="{ y: 400 }"
        rowKey="column_name"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'alias'">
            <a-input
              v-model:value="record.alias"
              :placeholder="`${record.column_name}의 한글 별칭`"
              style="width: 100%"
              @change="handleAliasChange(record)"
            />
          </template>
          <template v-if="column.key === 'type'">
            <a-tag :color="getColumnTypeColor(record.type)">
              {{ record.type }}
            </a-tag>
          </template>
          <template v-if="column.key === 'column_name'">
            <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">
              {{ record.column_name }}
            </code>
          </template>
        </template>
      </a-table>

      <a-empty v-else description="컬럼 정보를 불러오는 중..." />
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="handleSkip">
          건너뛰기 (Preset 설정으로)
        </a-button>
        <a-button
          type="primary"
          :loading="saving"
          :disabled="!hasAnyAlias"
          @click="handleSave"
        >
          별칭 저장 후 계속
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import supersetAPI from '@/services/supersetAPI'
import columnAliasService from '@/services/columnAliasService'

export default {
  name: 'ColumnAliasModal',
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
  emits: ['close', 'next'],
  setup(props, { emit }) {
    const loading = ref(false)
    const saving = ref(false)
    const columns = ref([])

    const tableColumns = [
      { title: '컬럼명', dataIndex: 'column_name', key: 'column_name', width: '30%' },
      { title: '타입', dataIndex: 'type', key: 'type', width: '20%' },
      { title: '별칭 (한글)', dataIndex: 'alias', key: 'alias', width: '50%' }
    ]

    // 🔥 별칭이 하나라도 입력되었는지 확인
    const hasAnyAlias = computed(() => {
      return columns.value.some(col => col.alias && col.alias.trim() !== '')
    })

    // 🔥 컬럼 타입별 색상
    const getColumnTypeColor = (type) => {
      const typeStr = (type || '').toLowerCase()
      if (typeStr.includes('int') || typeStr.includes('decimal') || typeStr.includes('float') || typeStr.includes('double')) {
        return 'blue'
      } else if (typeStr.includes('date') || typeStr.includes('time')) {
        return 'green'
      } else if (typeStr.includes('char') || typeStr.includes('text')) {
        return 'orange'
      }
      return 'default'
    }

    // 🔥 데이터셋 컬럼 정보 로드
    const loadColumns = async () => {
      if (!props.datasetId) return

      loading.value = true
      try {
        console.log('📊 데이터셋 컬럼 조회 시작:', props.datasetId)
        
        const dataset = await supersetAPI.getDataset(props.datasetId)
        console.log('데이터셋 상세:', dataset)

        if (dataset.result?.columns) {
          columns.value = dataset.result.columns.map(col => ({
            column_name: col.column_name,
            type: col.type || 'VARCHAR',
            verbose_name: col.verbose_name || '',
            alias: col.verbose_name || '' // 기존 verbose_name을 alias로 사용
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

    // 🔥 Alias 변경 핸들러
    const handleAliasChange = (record) => {
      console.log('Alias 변경:', record.column_name, '->', record.alias)
    }

    // 🔥 건너뛰기 (Preset 모달로 이동)
    const handleSkip = () => {
      emit('next')
    }

    // 🔥 별칭 저장
    const handleSave = async () => {
      saving.value = true
      try {
        console.log('💾 컬럼 별칭 저장 시작...')

        // 1. localStorage에 저장 (빠른 접근용)
        const aliasMap = {}
        columns.value.forEach(col => {
          if (col.alias && col.alias.trim() !== '') {
            aliasMap[col.column_name] = col.alias.trim()
          }
        })
        
        columnAliasService.saveAliases(props.datasetId, aliasMap)
        console.log('✅ localStorage 저장 완료:', aliasMap)

        // 2. Superset API를 통해 verbose_name 업데이트
        try {
          const dataset = await supersetAPI.getDataset(props.datasetId)
          const currentColumns = dataset.result?.columns || []
          
          const updatedColumns = currentColumns.map(col => {
            const alias = aliasMap[col.column_name]
            return {
              ...col,
              verbose_name: alias || col.verbose_name || col.column_name
            }
          })

          await supersetAPI.updateDataset(props.datasetId, {
            columns: updatedColumns
          })
          
          console.log('✅ Superset verbose_name 업데이트 완료')
        } catch (apiError) {
          console.warn('⚠️ Superset API 업데이트 실패 (localStorage는 저장됨):', apiError)
        }

        message.success(`${Object.keys(aliasMap).length}개의 별칭이 저장되었습니다`)
        emit('next')

      } catch (error) {
        console.error('❌ 별칭 저장 오류:', error)
        message.error('별칭 저장에 실패했습니다')
      } finally {
        saving.value = false
      }
    }

    // 🔥 모달이 열릴 때 컬럼 로드
    watch(() => props.visible, (newVal) => {
      if (newVal && props.datasetId) {
        loadColumns()
      }
    })

    return {
      loading,
      saving,
      columns,
      tableColumns,
      hasAnyAlias,
      getColumnTypeColor,
      handleAliasChange,
      handleSkip,
      handleSave
    }
  }
}
</script>

<style scoped>
.ant-table {
  border-radius: 8px;
}
</style>