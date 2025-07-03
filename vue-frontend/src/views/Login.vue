<template>
  <div :style="{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }">
    <a-card
      :style="{
        width: '400px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px'
      }"
    >
      <template #title>
        <div style="text-align: center">
          <h2 style="margin: 0; color: #1890ff">
            Superset Dashboard
          </h2>
          <p style="margin: 8px 0 0 0; color: #666">
            Apache Superset과 연동된 Vue.js 대시보드
          </p>
        </div>
      </template>

      <a-alert
        v-if="error"
        :message="error"
        type="error"
        show-icon
        style="margin-bottom: 16px"
      />

      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        @finish="handleSubmit"
        layout="vertical"
      >
        <a-form-item
          label="사용자명"
          name="username"
        >
          <a-input
            v-model:value="formData.username"
            size="large"
            placeholder="사용자명을 입력하세요"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          label="비밀번호"
          name="password"
        >
          <a-input-password
            v-model:value="formData.password"
            size="large"
            placeholder="비밀번호를 입력하세요"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item style="margin-bottom: 8px">
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            block
            size="large"
            :style="{ borderRadius: '4px' }"
          >
            <a-spin v-if="loading" size="small" />
            <span v-else>로그인</span>
          </a-button>
        </a-form-item>

        <a-form-item style="margin-bottom: 0">
          <a-button
            type="link"
            block
            @click="handleQuickLogin"
            :style="{ padding: 0, height: 'auto' }"
          >
            개발용 관리자 로그인 (admin/admin)
          </a-button>
        </a-form-item>
      </a-form>

      <div :style="{
        marginTop: '24px',
        padding: '16px',
        background: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }">
        <h4 style="margin: 0 0 8px 0; fontSize: 13px">기본 계정 정보:</h4>
        <div>관리자: admin / admin</div>
        <div style="margin-top: 8px">
          <strong>주요 기능:</strong>
          <ul style="margin: 4px 0 0 16px; padding: 0">
            <li>데이터 소스 관리</li>
            <li>차트 및 대시보드 생성</li>
            <li>사용자 권한 관리</li>
            <li>실시간 데이터 시각화</li>
          </ul>
        </div>
      </div>
    </a-card>
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
  setup () {
    const store = useStore()
    const router = useRouter()

    const formRef = ref()
    const loading = ref(false)
    const error = ref('')

    const formData = ref({
      username: '',
      password: ''
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
        const result = await store.dispatch('login', {
          username: values.username,
          password: values.password
        })

        if (result.success) {
          message.success('로그인에 성공했습니다!')
          router.push('/')
        } else {
          error.value = result.message
        }
      } catch (err) {
        error.value = '로그인 중 오류가 발생했습니다.'
        console.error('Login error:', err)
      } finally {
        loading.value = false
      }
    }

    const handleQuickLogin = () => {
      formData.value.username = 'admin'
      formData.value.password = 'admin'
    }

    onMounted(() => {
      // 이미 로그인된 사용자는 대시보드로 리디렉션
      if (authService.isAuthenticated()) {
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
