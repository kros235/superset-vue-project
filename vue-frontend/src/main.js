// vue-frontend/src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Ant Design Vue
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// 커스텀 CSS
import './assets/css/main.css'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(Antd)

// 앱 초기화 시 인증 상태 확인
store.dispatch('initializeAuth').then(() => {
  app.mount('#app')
})
