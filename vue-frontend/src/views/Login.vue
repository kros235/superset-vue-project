<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>Superset Dashboard</h2>
        <p>Apache Superset과 연동된 Vue.js 대시보드</p>
      </div>

      <a-form
        ref="formRef"
        :model="formData"
        @finish="handleSubmit"
        layout="vertical"
        class="login-form"
      >
        <a-form-item
          label="사용자명"
          name="username"
          :rules="rules.username"
        >
          <a-input 
            v-model:value="formData.username" 
            placeholder="admin"
            size="large"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          label="비밀번호"
          name="password"
          :rules="rules.password"
        >
          <a-input-password 
            v-model:value="formData.password" 
            placeholder="비밀번호"
            size="large"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button 
            type="primary" 
            html-type="submit" 
            :loading="loading"
            size="large"
            block
          >
            {{ loading ? '로그인 중...' : '로그인' }}
          </a-button>
        </a-form-item>

        <a-form-item>
          <a-button 
            type="dashed" 
            @click="handleQuickLogin"
            size="large"
            block
          >
            빠른 로그인 (admin/admin)
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 오류 메시지 -->
      <a-alert
        v-if="error"
        :message="error"
        type="error"
        show-icon
        closable
        @close="error = ''"
        style="margin-top: 16px;"
      />

      <!-- 계정 정보 -->
      <a-card title="기본 계정 정보" size="small" style="margin-top: 16px;">
        <div style="font-size: 12px; color: #666;">
          <div><strong>관리자:</strong> admin / admin</div>
          <div style="margin-top: 8px;"><strong>주요 기능:</strong></div>
          <ul style="margin: 4px 0 0 16px; padding: 0;">
            <li>데이터 소스 관리</li>
            <li>차트 및 대시보드 생성</li>
            <li>사용자 권한 관리</li>
            <li>실시간 데이터 시각화</li>
          </ul>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'

export default defineComponent({
  name: 'Login',
  components: {
    UserOutlined,
    LockOutlined
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    const formRef = ref()
    const loading = ref(false)
    const error = ref('')

    const formData = ref({
      username: 'admin',
      password: 'admin'
    })

    const rules = {
      username: [
        { required: true, message: '사용자명을 입력해주세요!', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '비밀번호를 입력해주세요!', trigger: 'blur' }
      ]
    }

    const handleSubmit = async (values) => {
      loading.value = true
      error.value = ''

      try {
        console.log('로그인 시도:', values.username)
        
        const result = await store.dispatch('login', {
          username: values.username,
          password: values.password
        })

        if (result.success) {
          message.success('로그인에 성공했습니다!')
          console.log('로그인 성공, 대시보드로 이동')
          router.push('/')
        } else {
          error.value = result.message || '로그인에 실패했습니다.'
          console.error('로그인 실패:', result.message)
        }
      } catch (err) {
        error.value = '로그인 중 오류가 발생했습니다.'
        console.error('Login error:', err)
      } finally {
        loading.value = false
      }
    }

    const handleQuickLogin = async () => {
      formData.value.username = 'admin'
      formData.value.password = 'admin'
      
      // 폼 제출
      try {
        await formRef.value.validateFields()
        await handleSubmit(formData.value)
      } catch (error) {
        console.error('Quick login validation error:', error)
      }
    }

    onMounted(() => {
      // 이미 로그인된 사용자는 대시보드로 리디렉션
      if (authService.isAuthenticated()) {
        console.log('이미 로그인된 사용자, 대시보드로 이동')
        router.push('/')
      }
    })

    return {
      formRef,
      loading,
      error,
      formData,
      rules,
      handleSubmit,
      handleQuickLogin
    }
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  color: #1890ff;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin-top: 24px;
}

/* 반응형 */
@media (max-width: 768px) {
  .login-container {
    padding: 12px;
  }
  
  .login-box {
    padding: 24px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
}
</style>