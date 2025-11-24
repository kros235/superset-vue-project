<!-- ============================================
🆕 새로 생성하는 파일 (선택사항)
vue-frontend/src/components/NLPSettingsCheck.vue
개발 환경에서 NLP 설정 상태를 확인하는 컴포넌트
============================================ -->

<template>
  <a-alert
    v-if="showAlert"
    :message="alertMessage"
    :description="alertDescription"
    :type="alertType"
    show-icon
    closable
    style="margin-bottom: 16px"
    @close="showAlert = false"
  >
    <template #icon>
      <component :is="alertIcon" />
    </template>
  </a-alert>
</template>

<script>
import { defineComponent, ref, onMounted, h } from 'vue'
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons-vue'
import nlpChartService from '../services/nlpChartService'

export default defineComponent({
  name: 'NLPSettingsCheck',
  components: {
    CheckCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined
  },
  setup() {
    const showAlert = ref(false)
    const alertMessage = ref('')
    const alertDescription = ref('')
    const alertType = ref('info')
    const alertIcon = ref(InfoCircleOutlined)
    
    onMounted(() => {
      // 개발 환경에서만 표시
      if (process.env.NODE_ENV !== 'development') return
      
      const hasClaudeKey = nlpChartService.claudeAPIKey && 
                          nlpChartService.claudeAPIKey !== 'your_claude_api_key_here'
      const hasFallback = nlpChartService.fallbackEnabled
      
      if (hasClaudeKey) {
        showAlert.value = true
        alertType.value = 'success'
        alertIcon.value = CheckCircleOutlined
        alertMessage.value = 'Claude API 활성화됨'
        alertDescription.value = `AI 챗봇 기능이 정상 작동합니다. 모델: ${nlpChartService.claudeModel}`
      } else if (hasFallback) {
        showAlert.value = true
        alertType.value = 'warning'
        alertIcon.value = WarningOutlined
        alertMessage.value = '키워드 기반 폴백 모드'
        alertDescription.value = 'Claude API 키가 설정되지 않았습니다. 기본 키워드 기반 분석만 사용됩니다. .env.local 파일에서 VUE_APP_CLAUDE_API_KEY를 설정하세요.'
      } else {
        showAlert.value = true
        alertType.value = 'error'
        alertIcon.value = WarningOutlined
        alertMessage.value = 'NLP 챗봇 비활성화'
        alertDescription.value = 'Claude API 키가 없고 폴백도 비활성화되어 있습니다.'
      }
    })
    
    return {
      h,
      showAlert,
      alertMessage,
      alertDescription,
      alertType,
      alertIcon
    }
  }
})
</script>