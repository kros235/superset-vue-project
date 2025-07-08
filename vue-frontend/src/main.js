// vue-frontend/src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// Vue 경고 메시지 숨기기
const app = createApp(App)

// Feature flags 설정
app.config.globalProperties.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false

app.use(Antd)
app.use(router)
app.use(store)

// 앱 마운트 전에 인증 상태 초기화
async function initializeApp() {
  try {
    console.log('앱 초기화 시작...')
    
    // 스토어의 initializeAuth 액션 호출
    await store.dispatch('initializeAuth')
    
    console.log('앱 초기화 완료')
  } catch (error) {
    console.error('앱 초기화 중 오류:', error)
  } finally {
    // 오류가 발생해도 앱은 마운트
    app.mount('#app')
  }
}

// 앱 초기화 실행
initializeApp()