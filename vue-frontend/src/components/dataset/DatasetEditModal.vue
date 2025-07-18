<template>
  <a-modal
    v-model:open="visible"
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

    <a-form
      v-else
      ref="formRef"
      :model="editForm"
      :rules="formRules"
      layout="vertical"
      @finish="handleSave"
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
  </a-modal>
</template>

<script>
import { defineComponent, ref, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import supersetAPI from '../../services/supersetAPI'

export default defineComponent({
  name: 'DatasetEditModal',
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

    // Watchers
    watch(() => props.visible, (newVal) => {
      if (newVal && props.dataset) {
        loadDatasetDetail()
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
      
      // 메서드
      loadUsers,
      validateJson,
      handleSave,
      handleClose
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