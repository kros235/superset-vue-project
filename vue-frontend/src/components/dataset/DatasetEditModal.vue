<template>
  <a-modal
    :open="visible"
    :title="`데이터셋 편집: ${dataset?.table_name || ''}`"
    :width="800"
    :confirmLoading="saving"
    @ok="handleSave"
    @cancel="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>데이터셋 정보를 불러오는 중...</p>
    </div>

    <!-- 🔥 [추가] 탭 구조로 변경 -->
    <a-tabs v-else v-model:activeKey="activeTab">
      <!-- 기본 정보 탭 -->
      <a-tab-pane key="info" tab="기본 정보">
        <a-form
          ref="formRef"
          :model="editForm"
          :rules="formRules"
          layout="vertical"
        >
          <!-- 기본 정보 섹션 -->
          <a-card title="기본 정보" style="margin-bottom: 16px">
            <a-form-item label="테이블명" name="table_name">
              <a-input 
                v-model:value="editForm.table_name" 
                disabled
                addon-before="테이블명은 변경할 수 없습니다"
              />
            </a-form-item>

            <a-form-item label="설명" name="description">
              <a-textarea
                v-model:value="editForm.description"
                placeholder="데이터셋에 대한 설명을 입력하세요"
                :rows="3"
                show-count
                :maxlength="500"
              />
            </a-form-item>

            <a-form-item label="스키마" name="schema">
              <a-input 
                v-model:value="editForm.schema" 
                disabled
                addon-before="스키마는 변경할 수 없습니다"
              />
            </a-form-item>

            <a-form-item label="데이터베이스" name="database">
              <a-input 
                :value="editForm.database_name" 
                disabled
                addon-before="데이터베이스는 변경할 수 없습니다"
              />
            </a-form-item>
          </a-card>

          <!-- 고급 설정 섹션 -->
          <a-card title="고급 설정">
            <a-form-item label="캐시 타임아웃 (초)" name="cache_timeout">
              <a-input-number
                v-model:value="editForm.cache_timeout"
                :min="0"
                :max="86400"
                placeholder="캐시 유지 시간 (0은 무제한)"
                style="width: 100%"
              />
              <div style="margin-top: 4px; color: #666; font-size: 12px">
                0으로 설정하면 캐시가 무제한으로 유지됩니다. 권장값: 3600 (1시간)
              </div>
            </a-form-item>

            <a-form-item label="기본 엔드포인트" name="default_endpoint">
              <a-input
                v-model:value="editForm.default_endpoint"
                placeholder="기본 API 엔드포인트 (선택사항)"
              />
            </a-form-item>

            <a-form-item label="외부 URL" name="external_url">
              <a-input
                v-model:value="editForm.external_url"
                placeholder="외부 참조 URL (선택사항)"
                type="url"
              />
            </a-form-item>

            <a-form-item label="추가 설정 (JSON)" name="extra">
              <a-textarea
                v-model:value="editForm.extra"
                placeholder='{"key": "value"}'
                :rows="4"
                @blur="validateJson"
              />
              <div style="margin-top: 4px; color: #666; font-size: 12px">
                유효한 JSON 형식으로 입력해주세요
              </div>
              <div v-if="jsonError" style="color: #ff4d4f; font-size: 12px; margin-top: 4px">
                {{ jsonError }}
              </div>
            </a-form-item>

            <!-- 소유자 관리 -->
            <a-form-item label="소유자" name="owners">
              <a-select
                v-model:value="editForm.owners"
                mode="multiple"
                placeholder="소유자를 선택하세요"
                :loading="usersLoading"
                style="width: 100%"
                @focus="loadUsers"
              >
                <a-select-option
                  v-for="user in availableUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.first_name }} {{ user.last_name }} ({{ user.username }})
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-card>
        </a-form>

        <!-- 저장된 변경사항 표시 -->
        <a-alert
          v-if="lastSavedTime"
          :message="`마지막 저장: ${lastSavedTime}`"
          type="success"
          show-icon
          style="margin-top: 16px"
        />
      </a-tab-pane>

      <!-- 🔥 [추가] 컬럼 Alias 정보 탭 -->
      <a-tab-pane key="aliases" tab="컬럼 Alias">
        <div v-if="aliasLoading" style="text-align: center; padding: 40px">
          <a-spin size="large" />
          <p style="margin-top: 16px; color: #666">컬럼 정보를 불러오는 중...</p>
        </div>
        <div v-else>
          <a-alert
            message="컬럼 별칭(Alias) 정보"
            description="verbose_name이 설정된 컬럼은 차트에서 해당 별칭으로 표시됩니다."
            type="info"
            show-icon
            style="margin-bottom: 16px"
          />
          <a-table
            :columns="aliasTableColumns"
            :data-source="columnAliases"
            :pagination="{ pageSize: 10 }"
            size="small"
            bordered
            row-key="column_name"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <a-tag :color="getColumnTypeColor(record.type)">
                  {{ record.type }}
                </a-tag>
              </template>
              <template v-if="column.key === 'verbose_name'">
                <span v-if="record.verbose_name" style="color: #1890ff; font-weight: 500">
                  {{ record.verbose_name }}
                </span>
                <span v-else style="color: #999; font-style: italic">
                  (미설정)
                </span>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- 🔥 [추가] 프리셋 정보 탭 -->
      <a-tab-pane key="presets" tab="등록된 프리셋">
        <div v-if="presetsLoading" style="text-align: center; padding: 40px">
          <a-spin size="large" />
          <p style="margin-top: 16px; color: #666">프리셋 정보를 불러오는 중...</p>
        </div>
        <div v-else-if="datasetPresets.length === 0">
          <a-empty description="등록된 프리셋이 없습니다">
            <template #image>
              <FileTextOutlined style="font-size: 64px; color: #ccc" />
            </template>
          </a-empty>
        </div>
        <div v-else>
          <a-alert
            :message="`총 ${datasetPresets.length}개의 프리셋이 등록되어 있습니다.`"
            type="info"
            show-icon
            style="margin-bottom: 16px"
          />
          <a-table
            :columns="presetTableColumns"
            :data-source="datasetPresets"
            :pagination="{ pageSize: 5 }"
            size="small"
            bordered
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'viz_type'">
                <a-tag color="blue">{{ record.viz_type }}</a-tag>
              </template>
              <template v-if="column.key === 'created_on'">
                {{ formatDate(record.created_on) }}
              </template>
              <template v-if="column.key === 'params'">
                <a-tooltip>
                  <template #title>
                    <pre style="max-width: 400px; white-space: pre-wrap;">{{ formatParams(record.params) }}</pre>
                  </template>
                  <a-button type="link" size="small">상세보기</a-button>
                </a-tooltip>
              </template>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>

<script>
import { defineComponent, ref, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { FileTextOutlined } from '@ant-design/icons-vue'  
import supersetAPI from '../../services/supersetAPI'
import presetAPI from '../../services/presetAPI' 

export default defineComponent({
  name: 'DatasetEditModal',
  components: {
    FileTextOutlined  // 🔥 [추가]
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dataset: {
      type: Object,
      default: null
    }
  },
  emits: ['update:visible', 'close', 'saved'],
  setup(props, { emit }) {
    // 상태 관리
    const loading = ref(false)
    const saving = ref(false)
    const usersLoading = ref(false)
    const formRef = ref(null)
    const jsonError = ref('')
    const lastSavedTime = ref('')
    const availableUsers = ref([])
    const activeTab = ref('info') 

    // 🔥 [추가] Alias 관련 상태
    const aliasLoading = ref(false)
    const columnAliases = ref([])

    // 🔥 [추가] 프리셋 관련 상태
    const presetsLoading = ref(false)
    const datasetPresets = ref([])

    // 폼 데이터
    const editForm = ref({
      table_name: '',
      description: '',
      schema: '',
      database_name: '',
      cache_timeout: null,
      default_endpoint: '',
      external_url: '',
      extra: '',
      owners: []
    })

    // 폼 검증 규칙
    const formRules = {
      description: [
        { max: 500, message: '설명은 500자를 초과할 수 없습니다' }
      ],
      cache_timeout: [
        { type: 'number', min: 0, max: 86400, message: '0-86400 사이의 값을 입력하세요' }
      ],
      external_url: [
        { type: 'url', message: '유효한 URL을 입력하세요' }
      ]
    }

    // 🔥 [추가] Alias 테이블 컬럼 정의
    const aliasTableColumns = [
      {
        title: '컬럼명',
        dataIndex: 'column_name',
        key: 'column_name',
        width: 200
      },
      {
        title: '타입',
        dataIndex: 'type',
        key: 'type',
        width: 120
      },
      {
        title: '별칭 (Alias)',
        dataIndex: 'verbose_name',
        key: 'verbose_name',
        width: 200
      },
      {
        title: '설명',
        dataIndex: 'description',
        key: 'description'
      }
    ]

    // 🔥 [추가] 프리셋 테이블 컬럼 정의
    const presetTableColumns = [
      {
        title: '프리셋명',
        dataIndex: 'slice_name',
        key: 'slice_name',
        width: 200
      },
      {
        title: '차트 유형',
        dataIndex: 'viz_type',
        key: 'viz_type',
        width: 120
      },
      {
        title: '생성일',
        dataIndex: 'created_on',
        key: 'created_on',
        width: 150
      },
      {
        title: '설정',
        dataIndex: 'params',
        key: 'params',
        width: 100
      }
    ]

    // 메서드
    const loadDatasetDetail = async () => {
      if (!props.dataset?.id) return
      
      loading.value = true
      try {
        const detail = await supersetAPI.getDatasetDetail(props.dataset.id)
        
        // 폼 데이터 설정
        editForm.value = {
          table_name: detail.table_name || '',
          description: detail.description || '',
          schema: detail.schema || 'default',
          database_name: detail.database?.database_name || '',
          cache_timeout: detail.cache_timeout,
          default_endpoint: detail.default_endpoint || '',
          external_url: detail.external_url || '',
          extra: detail.extra ? JSON.stringify(JSON.parse(detail.extra), null, 2) : '',
          owners: detail.owners?.map(owner => owner.id) || []
        }
        
        console.log('편집용 데이터셋 정보 로드:', editForm.value)
      } catch (error) {
        console.error('데이터셋 상세 정보 로드 오류:', error)
        message.error('데이터셋 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    // 🔥 [추가] 컬럼 Alias 정보 로드
    const loadColumnAliases = async () => {
      if (!props.dataset?.id) return
      
      aliasLoading.value = true
      try {
        const detail = await supersetAPI.getDatasetDetail(props.dataset.id)
        
        if (detail.columns && Array.isArray(detail.columns)) {
          columnAliases.value = detail.columns.map(col => ({
            column_name: col.column_name,
            type: col.type || 'VARCHAR',
            verbose_name: col.verbose_name || '',
            description: col.description || ''
          }))
        }
        
        console.log('컬럼 Alias 정보:', columnAliases.value)
      } catch (error) {
        console.error('컬럼 Alias 로드 오류:', error)
        message.warning('컬럼 정보를 불러올 수 없습니다.')
      } finally {
        aliasLoading.value = false
      }
    }

    // 🔥 [추가] 프리셋 정보 로드
    const loadDatasetPresets = async () => {
      if (!props.dataset?.id) return
      
      presetsLoading.value = true
      try {
        // presetAPI를 통해 해당 데이터셋의 프리셋 조회
        const presets = await presetAPI.getPresetsByDataset(props.dataset.id)
        datasetPresets.value = presets || []
        
        console.log('데이터셋 프리셋:', datasetPresets.value)
      } catch (error) {
        console.error('프리셋 로드 오류:', error)
        // 프리셋 API가 없는 경우 빈 배열 유지
        datasetPresets.value = []
      } finally {
        presetsLoading.value = false
      }
    }


    const loadUsers = async () => {
      if (availableUsers.value.length > 0) return // 이미 로드됨
      
      usersLoading.value = true
      try {
        const users = await supersetAPI.getUsers()
        availableUsers.value = users
      } catch (error) {
        console.error('사용자 목록 로드 오류:', error)
        message.warning('사용자 목록을 불러올 수 없습니다.')
      } finally {
        usersLoading.value = false
      }
    }

    const validateJson = () => {
      if (!editForm.value.extra.trim()) {
        jsonError.value = ''
        return true
      }
      
      try {
        JSON.parse(editForm.value.extra)
        jsonError.value = ''
        return true
      } catch (error) {
        jsonError.value = '유효하지 않은 JSON 형식입니다'
        return false
      }
    }

    const handleSave = async () => {
      try {
        // 폼 검증
        await formRef.value.validate()
        
        // JSON 검증
        if (!validateJson()) {
          message.error('JSON 형식을 확인해주세요')
          return
        }

        saving.value = true

        // 업데이트 페이로드 구성
        const updatePayload = {
          description: editForm.value.description || null,
          cache_timeout: editForm.value.cache_timeout || null,
          default_endpoint: editForm.value.default_endpoint || null,
          external_url: editForm.value.external_url || null,
          extra: editForm.value.extra ? editForm.value.extra : null,
          owners: editForm.value.owners || []
        }

        console.log('데이터셋 업데이트 요청:', updatePayload)

        await supersetAPI.updateDataset(props.dataset.id, updatePayload)
        
        lastSavedTime.value = new Date().toLocaleString('ko-KR')
        message.success('데이터셋이 성공적으로 업데이트되었습니다.')
        
        emit('saved', { ...props.dataset, ...updatePayload })
        
        // 잠시 후 모달 닫기
        setTimeout(() => {
          handleClose()
        }, 1500)

      } catch (error) {
        console.error('데이터셋 업데이트 오류:', error)
        if (error.response?.data?.message) {
          const errorMsg = typeof error.response.data.message === 'string' 
            ? error.response.data.message 
            : JSON.stringify(error.response.data.message)
          message.error(`업데이트 실패: ${errorMsg}`)
        } else {
          message.error('데이터셋 업데이트 중 오류가 발생했습니다.')
        }
      } finally {
        saving.value = false
      }
    }

    const handleClose = () => {
      emit('update:visible', false)
      emit('close')
      
      // 상태 초기화
      nextTick(() => {
        editForm.value = {
          table_name: '',
          description: '',
          schema: '',
          database_name: '',
          cache_timeout: null,
          default_endpoint: '',
          external_url: '',
          extra: '',
          owners: []
        }
        jsonError.value = ''
        lastSavedTime.value = ''
        if (formRef.value) {
          formRef.value.resetFields()
        }
      })
    }

    // 🔥 [추가] 컬럼 타입별 색상
    const getColumnTypeColor = (type) => {
      const colorMap = {
        'INTEGER': 'blue',
        'BIGINT': 'blue',
        'INT': 'blue',
        'VARCHAR': 'green',
        'TEXT': 'green',
        'LONGTEXT': 'green',
        'DATETIME': 'purple',
        'DATE': 'purple',
        'TIMESTAMP': 'purple',
        'DECIMAL': 'orange',
        'FLOAT': 'orange',
        'DOUBLE': 'orange',
        'BOOLEAN': 'red',
        'TINYINT': 'cyan'
      }
      return colorMap[type?.toUpperCase()] || 'default'
    }

    // 🔥 [추가] 날짜 포맷팅
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString('ko-KR')
    }

    // 🔥 [추가] 파라미터 포맷팅
    const formatParams = (paramsString) => {
      try {
        const params = typeof paramsString === 'string' 
          ? JSON.parse(paramsString) 
          : paramsString
        return JSON.stringify(params, null, 2)
      } catch {
        return paramsString || '{}'
      }
    }

    // Watchers
    watch(() => props.visible, (newVal) => {
      if (newVal && props.dataset) {
        loadDatasetDetail()
      }
    })

    // 🔥 [추가] 탭 변경 시 데이터 로드
    watch(activeTab, (newTab) => {
      if (newTab === 'aliases' && columnAliases.value.length === 0) {
        loadColumnAliases()
      }
      if (newTab === 'presets' && datasetPresets.value.length === 0) {
        loadDatasetPresets()
      }
    })

    return {
      // 상태
      loading,
      saving,
      usersLoading,
      formRef,
      jsonError,
      lastSavedTime,
      availableUsers,
      editForm,
      formRules,
      activeTab,              
      
      // 🔥 [추가] Alias 관련
      aliasLoading,
      columnAliases,
      aliasTableColumns,
      
      // 🔥 [추가] 프리셋 관련
      presetsLoading,
      datasetPresets,
      presetTableColumns,
      
      // 메서드
      loadUsers,
      validateJson,
      handleSave,
      handleClose,
      getColumnTypeColor,
      formatDate,      
      formatParams    
    }
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-container p {
  margin-top: 16px;
  color: #666;
}
</style>