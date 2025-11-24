<template>
  <div>
    <a-modal
      :open="visible"
      title="데이터셋 생성"
      width="700px"
      @cancel="handleCancel"
      :maskClosable="false"
    >
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
      >
        <!-- 📊 데이터셋 정보 섹션 -->
        <a-divider orientation="left">
          <span style="font-size: 16px; font-weight: 600">
            📊 데이터셋 정보
          </span>
        </a-divider>

        <!-- 데이터베이스 선택 -->
        <a-form-item label="데이터베이스" name="database_id" required>
          <a-select
            v-model:value="form.database_id"
            placeholder="데이터베이스를 선택하세요"
            @change="handleDatabaseChange"
          >
            <a-select-option
              v-for="db in databases"
              :key="db.id"
              :value="db.id"
            >
              {{ db.database_name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 스키마 선택 -->
        <a-form-item label="스키마">
          <a-select
            v-model:value="form.schema"
            placeholder="모든 스키마"
            allow-clear
            :loading="schemasLoading"
          >
            <a-select-option
              v-for="schema in schemas"
              :key="schema"
              :value="schema"
            >
              {{ schema }}
            </a-select-option>
          </a-select>
          <div style="margin-top: 4px; color: #999; font-size: 12px">
            총 {{ schemas.length }}개의 스키마
          </div>
        </a-form-item>

        <!-- 테이블 선택 -->
        <a-form-item label="테이블" name="table_name" required>
          <a-select
            v-model:value="form.table_name"
            placeholder="테이블을 선택하세요"
            show-search
            :filter-option="filterTableOption"
            :loading="tablesLoading"
            @change="handleTableChange"
          >
            <a-select-option
              v-for="table in availableTables"
              :key="table.value"
              :value="table.value"
            >
              <div style="display: flex; align-items: center; gap: 8px">
                <FileTextOutlined />
                <span>{{ table.label }}</span>
                <a-tag size="small" color="blue">{{ table.schema }}</a-tag>
                <a-tag size="small">{{ table.type }}</a-tag>
              </div>
            </a-select-option>
          </a-select>
          <div style="margin-top: 4px; color: #999; font-size: 12px">
            총 {{ availableTables.length }}개 테이블 로드 완료
          </div>
        </a-form-item>

        <!-- 🆕 컬럼 Alias 설정 섹션 -->
        <a-divider orientation="left" v-if="form.table_name && availableColumns.length > 0">
          <span style="font-size: 14px; font-weight: 600">
            🏷️ 컬럼 별칭 설정 (선택사항)
          </span>
        </a-divider>

        <a-form-item 
          v-if="form.table_name && availableColumns.length > 0"
          label="컬럼 별칭"
        >
          <a-alert
            message="자연어 차트 생성에 활용됩니다"
            description="컬럼에 한글 별칭을 지정하면 AI가 '팀별 수익' 같은 자연어 요청을 더 잘 이해합니다."
            type="info"
            show-icon
            style="margin-bottom: 16px"
          />
          
          <a-table
            :dataSource="columnAliasData"
            :columns="aliasTableColumns"
            :pagination="false"
            size="small"
            :scroll="{ y: 300 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'alias'">
                <a-input
                  v-model:value="record.alias"
                  :placeholder="`${record.column_name}의 별칭`"
                  style="width: 100%"
                  @change="handleAliasChange(record)"
                />
              </template>
              <template v-if="column.key === 'type'">
                <a-tag :color="getColumnTypeColor(record.type)">
                  {{ record.type }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-form-item>

        <!-- 데이터셋 이름 (선택사항) -->
        <a-form-item label="데이터셋 이름 (선택사항)">
          <a-input
            v-model:value="form.dataset_name"
            placeholder="비워두면 테이블명 사용"
          />
        </a-form-item>
      </a-form>

      <!-- 🔥 수정: 푸터 버튼을 a-form 밖으로 이동 -->
      <template #footer>
        <a-space>
          <a-button @click="handleCancel">취소</a-button>
          <a-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
          >
            생성
          </a-button>
        </a-space>
      </template>
    </a-modal>

    <!-- 🔥 프리셋 모달 -->
    <PresetModal
      :visible="showPresetModal"
      :dataset-id="createdDatasetId"
      @close="handlePresetModalClose"
      @success="handlePresetSuccess"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { DatabaseOutlined, DeleteOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import supersetAPI from '@/services/supersetAPI' 
import presetAPI from '@/services/presetAPI'
import PresetModal from './PresetModal.vue'

export default defineComponent({
  name: 'DatasetModal',
  components: {
    DatabaseOutlined,
    DeleteOutlined,
    PlusOutlined,
    FileTextOutlined,
    PresetModal
  },
  props: {
    visible: Boolean,
    databases: {
      type: Array,
      default: () => []
    }
    // 🔥 tables prop 제거 (직접 조회할 것)
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const formRef = ref(null)
    const loading = ref(false)
    const enablePreset = ref(false)
    const tablesLoading = ref(false) 
    const schemasLoading = ref(false)
    const availableTablesRaw = ref([])
    const availableSchemas = ref([]) 
    const availableColumns = ref([])  // 🔥 추가: 선택된 테이블의 컬럼 목록
    const columnsLoading = ref(false) // 🔥 추가: 컬럼 로딩 상태
    // 🔥 추가: 프리셋 모달 관련 state
    const showPresetModal = ref(false)
    const createdDatasetId = ref(null)


    const form = ref({
      database_id: undefined,
      schema: '', 
      table_name: '',
      table_name_display: '',
      presets: []
    })

    const rules = {
      database_id: [{ required: true, message: '데이터베이스를 선택하세요' }],
      table_name: [{ required: true, message: '테이블을 선택하세요' }]
    }

    // 🔥 테이블 목록 계산 수정 (스키마 필터 개선)
    const availableTables = computed(() => {
      if (!form.value.schema) {
        // 스키마가 선택되지 않으면 모든 테이블 표시
        return availableTablesRaw.value
      }
      // 선택된 스키마의 테이블만 표시
      return availableTablesRaw.value.filter(t => 
        t.schema === form.value.schema
      )
    })

    const addPreset = () => {
      form.value.presets.push({
        preset_name: '',
        preset_description: '',
        chart_type: 'bar',
        metricsArray: ['count'], 
        groupbyArray: [], 
        customMetric: '' 
      })
    }

    // 🔥 Select 필터 함수 추가
    const filterOption = (input, option) => {
      return option.value.toLowerCase().includes(input.toLowerCase()) ||
             option.children?.[0]?.children?.toLowerCase().includes(input.toLowerCase())
    }

    const removePreset = (index) => {
      form.value.presets.splice(index, 1)
    }

    // 🔥 데이터베이스 선택 시 테이블 목록 조회 (스키마 목록도 저장)
    const handleDatabaseChange = async (databaseId) => {
      form.value.table_name = ''
      form.value.schema = '' // 🔥 스키마도 초기화
      availableTablesRaw.value = []
      availableSchemas.value = [] // 🔥 추가
      
      if (!databaseId) return
      
      tablesLoading.value = true
      try {
        console.log(`데이터베이스 ${databaseId}의 테이블 조회 시작...`)
        
        // 스키마 목록 조회
        const schemas = await supersetAPI.getDatabaseSchemas(databaseId)
        console.log('스키마 목록:', schemas)
        
        // 시스템 스키마 제외
        const userSchemas = schemas.filter(schema => 
          !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(schema.toLowerCase())
        )
        
        availableSchemas.value = userSchemas // 🔥 스키마 목록 저장
        
        const allTables = []
        
        // 각 스키마의 테이블 조회
        for (const schema of userSchemas) {
          try {
            console.log(`스키마 ${schema} 조회 중...`)
            const tables = await supersetAPI.getDatabaseTables(databaseId, schema)
            
            let tableList = []
            if (Array.isArray(tables)) {
              tableList = tables
            } else if (tables?.result) {
              tableList = tables.result
            } else if (tables?.options) {
              tableList = tables.options
            }
            
            // 🔥 수정 후
            const formattedTables = tableList.map(table => {
              const tableName = table.value || table.label || table.name || table.table_name
              return {
                value: tableName,      // 🔥 추가: select의 value로 사용
                label: tableName,      // 🔥 추가: 화면에 표시될 이름
                name: tableName,       // 🔥 유지: 기존 호환성
                type: table.type || 'table',
                schema: schema,
                database_id: databaseId
              }
            })
            
            allTables.push(...formattedTables)
            console.log(`스키마 ${schema}: ${formattedTables.length}개 테이블 발견`)
            
          } catch (schemaError) {
            console.warn(`스키마 ${schema} 조회 실패:`, schemaError)
          }
        }
        
        // 중복 제거
        const uniqueTables = []
        const seenTables = new Set()
        
        for (const table of allTables) {
          const tableKey = `${table.schema}.${table.name}`
          if (!seenTables.has(tableKey)) {
            seenTables.add(tableKey)
            uniqueTables.push(table)
          }
        }
        
        availableTablesRaw.value = uniqueTables
        console.log(`총 ${uniqueTables.length}개 테이블 로드 완료`)
        console.log(`스키마 목록: ${userSchemas.join(', ')}`) // 🔥 추가
        
        if (uniqueTables.length === 0) {
          message.warning('해당 데이터베이스에서 테이블을 찾을 수 없습니다.')
        } else {
          message.success(`${userSchemas.length}개 스키마에서 ${uniqueTables.length}개의 테이블을 불러왔습니다.`)
        }
        
      } catch (error) {
        console.error('테이블 조회 오류:', error)
        message.error('테이블 목록을 불러오는데 실패했습니다.')
        availableTablesRaw.value = []
        availableSchemas.value = [] // 🔥 추가
      } finally {
        tablesLoading.value = false
      }
    }

    const filterTableOption = (input, option) => {
      return option.value.toLowerCase().includes(input.toLowerCase())
    }

    const getTableTypeColor = (type) => {
      const colors = { table: 'blue', view: 'green', info: 'red' }
      return colors[type] || 'default'
    }

    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        loading.value = true

        console.log('데이터셋 생성 시작:', form.value)

        const payload = {
          database: form.value.database_id,
          schema: form.value.schema || undefined,
          table_name: form.value.table_name,
          owners: []
        }

        console.log('생성 요청 페이로드:', payload)

        // 🔥 데이터셋 생성
        const result = await supersetAPI.createDataset(payload)
        console.log('데이터셋 생성 결과:', result)

        const datasetId = result.id

        if (!datasetId) {
          throw new Error('데이터셋 ID를 가져올 수 없습니다')
        }

        // 🔥 추가: 생성된 데이터셋 ID 저장
        createdDatasetId.value = datasetId

        // 🔥 추가: 현재 모달 닫고 프리셋 모달 열기
        handleCancel()
        showPresetModal.value = true

      } catch (error) {
        console.error('데이터셋 생성 오류:', error)
        
        // 🔥 수정: 더 상세한 에러 메시지 추출
        let errorMsg = error.message
        
        if (error.response?.data?.message) {
          // Superset API 에러 메시지 파싱
          const apiError = error.response.data.message
          if (typeof apiError === 'object') {
            // 객체 형태의 에러 메시지를 문자열로 변환
            errorMsg = JSON.stringify(apiError)
            console.error('상세 에러 정보:', apiError)
          } else {
            errorMsg = apiError
          }
        }
        
        message.error(`데이터셋 생성 실패: ${errorMsg}`)
      } finally {
        loading.value = false
      }
    }

    // 🔥 추가: 프리셋 모달 닫기 핸들러
    const handlePresetModalClose = () => {
      showPresetModal.value = false
      createdDatasetId.value = null
      emit('success')
    }

    // 🔥 추가: 프리셋 생성 성공 핸들러
    const handlePresetSuccess = () => {
      showPresetModal.value = false
      createdDatasetId.value = null
      emit('success')
    }


    // 🔥 메트릭 추천 함수 (숫자형 컬럼 찾기)
    const getRecommendedMetrics = computed(() => {
      const numericColumns = availableColumns.value.filter(col => 
        ['int', 'bigint', 'decimal', 'float', 'double', 'numeric'].some(type => 
          col.type?.toLowerCase().includes(type)
        )
      )
      return ['count', ...numericColumns.map(col => `AVG(${col.name})`)]
    })

    // 🔥 그룹핑 추천 함수 (문자형/날짜형 컬럼 찾기)
    const getRecommendedGroupby = computed(() => {
      return availableColumns.value
        .filter(col => {
          const type = col.type?.toLowerCase() || ''
          return type.includes('char') || 
                 type.includes('text') || 
                 type.includes('date') ||
                 type.includes('enum')
        })
        .map(col => col.name)
    })

    const handleCancel = () => {
      form.value = {
        database_id: undefined,
        schema: 'sample_dashboard',
        table_name: '',
        table_name_display: '',
        presets: []
      }
      enablePreset.value = false
      availableTablesRaw.value = []
      emit('close')
    }

    // 🆕 컬럼 Alias 관련 데이터
    const columnAliasData = ref([])
    const aliasTableColumns = [
      { title: '컬럼명', dataIndex: 'column_name', key: 'column_name', width: '30%' },
      { title: '타입', dataIndex: 'type', key: 'type', width: '20%' },
      { title: '별칭 (한글)', dataIndex: 'alias', key: 'alias', width: '50%' }
    ]

    // 🆕 컬럼 타입별 색상
    const getColumnTypeColor = (type) => {
      const typeStr = (type || '').toLowerCase()
      if (typeStr.includes('int') || typeStr.includes('decimal') || typeStr.includes('float')) {
        return 'blue'
      } else if (typeStr.includes('date') || typeStr.includes('time')) {
        return 'green'
      } else if (typeStr.includes('char') || typeStr.includes('text')) {
        return 'orange'
      }
      return 'default'
    }

    // 🆕 테이블 선택 시 컬럼 로드 (수정된 handleTableChange)
    const handleTableChange = async (tableName) => {
      if (!tableName) return
      
      console.log(`✅ 테이블 선택됨: ${tableName}`)
      
      // 선택된 테이블의 스키마 찾기
      const selectedTable = availableTablesRaw.value.find(t => t.value === tableName)
      const schemaName = selectedTable?.schema || form.value.schema
      
      // 컬럼 정보 로드 시도
      columnsLoading.value = true
      try {
        if (form.value.database_id) {
          const tableMetadata = await supersetAPI.getTableColumns(
            form.value.database_id,
            tableName,
            schemaName
          )
          
          if (tableMetadata?.columns) {
            availableColumns.value = tableMetadata.columns
            
            // 🆕 컬럼 Alias 데이터 초기화
            columnAliasData.value = tableMetadata.columns.map(col => ({
              column_name: col.name || col.column_name,
              type: col.type || 'unknown',
              alias: '' // 사용자가 입력할 별칭
            }))
            
            console.log('컬럼 로드 완료:', availableColumns.value)
          }
        }
      } catch (error) {
        console.warn('컬럼 로드 실패 (계속 진행):', error)
        availableColumns.value = []
        columnAliasData.value = []
      } finally {
        columnsLoading.value = false
      }
    }

    // 🆕 Alias 변경 핸들러
    const handleAliasChange = (record) => {
      console.log('Alias 변경:', record.column_name, '->', record.alias)
      // form에 alias 정보 저장
      if (!form.value.columnAliases) {
        form.value.columnAliases = {}
      }
      form.value.columnAliases[record.column_name] = record.alias
    }

    watch(enablePreset, (newVal) => {
      if (!newVal) form.value.presets = []
    })

    return {
      loading,
      tablesLoading,
      columnsLoading,
      schemasLoading,        
      enablePreset,
      form,
      rules,
      formRef,               
      availableTables,
      availableSchemas, 
      schemas: availableSchemas,  // 🔥 추가 (템플릿에서 schemas 사용)
      availableColumns, 
      getRecommendedMetrics, 
      getRecommendedGroupby,
      addPreset,
      removePreset,
      handleDatabaseChange,
      handleTableChange,
      filterTableOption,
      filterOption, 
      getTableTypeColor,
      handleSubmit,
      handleCancel,
      // 🔥 추가: 프리셋 모달 관련
      showPresetModal,
      createdDatasetId,
      handlePresetModalClose,
      handlePresetSuccess,
      columnAliasData,
      aliasTableColumns,
      getColumnTypeColor,
      handleAliasChange
    }
  }
})
</script>

<style scoped>
.ant-card {
  border-radius: 8px;
}
</style>