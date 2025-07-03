<template>
  <a-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    layout="vertical"
    @finish="handleSubmit"
  >
    <a-form-item
      label="데이터베이스 이름"
      name="database_name"
    >
      <a-input 
        v-model:value="formData.database_name"
        placeholder="예: Sample Dashboard DB" 
      />
    </a-form-item>

    <a-form-item
      label="SQLAlchemy URI"
      name="sqlalchemy_uri"
    >
      <a-textarea 
        v-model:value="formData.sqlalchemy_uri"
        placeholder="예: mysql+pymysql://superset:superset123@mariadb:3306/sample_dashboard"
        :rows="3"
      />
    </a-form-item>

    <a-alert
      message="연결 예시"
      type="info"
      show-icon
      style="margin-bottom: 16px"
    >
      <template #description>
        <div>
          <strong>MariaDB/MySQL:</strong> mysql+pymysql://username:password@host:port/database
          <br />
          <strong>PostgreSQL:</strong> postgresql://username:password@host:port/database
          <br />
          <strong>SQLite:</strong> sqlite:///path/to/database.db
        </div>
      </template>
    </a-alert>

    <a-form-item>
      <a-space>
        <a-button 
          @click="handleTest"
          :loading="testingConnection"
        >
          <template #icon>
            <CheckCircleOutlined />
          </template>
          연결 테스트
        </a-button>
        <a-button type="primary" html-type="submit">
          {{ database ? '업데이트' : '생성' }}
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
import { CheckCircleOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'DatabaseForm',
  components: {
    CheckCircleOutlined
  },
  props: {
    database: {
      type: Object,
      default: null
    },
    testingConnection: {
      type: Boolean,
      default: false
    }
  },
  emits: ['submit', 'test', 'cancel'],
  setup(props, { emit }) {
    const formRef = ref()
    const formData = ref({
      database_name: '',
      sqlalchemy_uri: ''
    })
    
    const rules = {
      database_name: [
        { required: true, message: '데이터베이스 이름을 입력해주세요', trigger: 'blur' }
      ],
      sqlalchemy_uri: [
        { required: true, message: 'SQLAlchemy URI를 입력해주세요', trigger: 'blur' }
      ]
    }
    
    const handleSubmit = (values) => {
      emit('submit', values)
    }
    
    const handleTest = () => {
      formRef.value.validateFields().then(values => {
        emit('test', values)
      }).catch(console.error)
    }
    
    // props 변경 감지
    watch(() => props.database, (newDatabase) => {
      if (newDatabase) {
        formData.value = {
          database_name: newDatabase.database_name || '',
          sqlalchemy_uri: newDatabase.sqlalchemy_uri || ''
        }
      } else {
        formData.value = {
          database_name: '',
          sqlalchemy_uri: ''
        }
      }
    }, { immediate: true })
    
    return {
      formRef,
      formData,
      rules,
      handleSubmit,
      handleTest
    }
  }
})
</script>