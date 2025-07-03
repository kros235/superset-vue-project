<template>
  <a-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    layout="vertical"
    @finish="handleSubmit"
  >
    <a-form-item
      label="데이터베이스"
      name="database_id"
    >
      <a-select 
        v-model:value="formData.database_id"
        placeholder="데이터베이스 선택"
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

    <a-form-item
      label="테이블 이름"
      name="table_name"
    >
      <a-input 
        v-model:value="formData.table_name"
        placeholder="예: sales, users, web_traffic" 
      />
    </a-form-item>

    <a-form-item
      label="스키마 (선택사항)"
      name="schema"
    >
      <a-input 
        v-model:value="formData.schema"
        placeholder="예: public, dbo" 
      />
    </a-form-item>

    <a-form-item
      label="SQL 쿼리 (선택사항)"
      name="sql"
    >
      <a-textarea 
        v-model:value="formData.sql"
        placeholder="SELECT * FROM table_name WHERE condition"
        :rows="4"
      />
      <template #help>
        테이블 대신 커스텀 SQL 쿼리를 사용하려면 입력하세요
      </template>
    </a-form-item>

    <a-form-item>
      <a-space>
        <a-button type="primary" html-type="submit">
          {{ dataset ? '업데이트' : '생성' }}
        </a-button>
        <a-button @click="$emit('cancel')">
          취소
        </a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  name: 'DatasetForm',
  props: {
    dataset: {
      type: Object,
      default: null
    },
    databases: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const formRef = ref()
    const formData = ref({
      database_id: undefined,
      table_name: '',
      schema: '',
      sql: ''
    })
    
    const rules = {
      database_id: [
        { required: true, message: '데이터베이스를 선택해주세요', trigger: 'change' }
      ],
      table_name: [
        { required: true, message: '테이블 이름을 입력해주세요', trigger: 'blur' }
      ]
    }
    
    const handleSubmit = (values) => {
      emit('submit', values)
    }
    
    // props 변경 감지
    watch(() => props.dataset, (newDataset) => {
      if (newDataset) {
        formData.value = {
          database_id: newDataset.database?.id,
          table_name: newDataset.table_name || '',
          schema: newDataset.schema || '',
          sql: newDataset.sql || ''
        }
      } else {
        formData.value = {
          database_id: undefined,
          table_name: '',
          schema: '',
          sql: ''
        }
      }
    }, { immediate: true })
    
    return {
      formRef,
      formData,
      rules,
      handleSubmit
    }
  }
})
</script>