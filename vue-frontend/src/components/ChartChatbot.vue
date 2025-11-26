<!-- ============================================
🆕 새로 생성하는 파일
vue-frontend/src/components/ChartChatbot.vue
AI 차트 생성 챗봇 UI 컴포넌트
============================================ -->

<template>
  <div class="chart-chatbot">
    <!-- 헤더 -->
    <div class="chatbot-header">
      <div class="header-content">
        <h3>
          <CommentOutlined style="margin-right: 8px" />
          AI 차트 생성 도우미
        </h3>
        <a-tag :color="nlpMethod === 'claude_api' ? 'blue' : 'orange'">
          {{ nlpMethod === 'claude_api' ? 'Claude AI' : '키워드 기반' }}
        </a-tag>
      </div>
      <p class="header-description">
        자연어로 차트를 요청하세요. 예: "2025년 팀별 수익을 막대차트로 만들어줘"
      </p>
    </div>

    <!-- 대화 영역 -->
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.type]"
      >
        <div class="message-content">
          <div class="message-header">
            <component :is="msg.type === 'user' ? UserOutlined : RobotOutlined" />
            <span>{{ msg.type === 'user' ? '사용자' : 'AI 도우미' }}</span>
            <span class="message-time">{{ msg.timestamp }}</span>
          </div>
          <div class="message-text">{{ msg.text }}</div>
          
          <!-- 차트 미리보기 카드 -->
          <div v-if="msg.chartConfig" class="chart-preview-card">
            <a-divider style="margin: 12px 0" />
            <div class="chart-config-preview">
              <h4>
                <CheckCircleOutlined style="color: #52c41a; margin-right: 8px" />
                차트 설정 완료
              </h4>
              
              <a-descriptions :column="1" size="small" bordered>
                <a-descriptions-item label="차트 타입">
                  <a-tag color="blue">{{ getChartTypeName(msg.chartConfig.chart_type) }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="메트릭">
                  <a-tag v-for="(metric, idx) in msg.chartConfig.metrics" :key="idx" color="green">
                    {{ metric }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="그룹화" v-if="msg.chartConfig.groupby?.length > 0">
                  <a-tag v-for="(col, idx) in msg.chartConfig.groupby" :key="idx" color="purple">
                    {{ col }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="필터" v-if="msg.chartConfig.filters?.length > 0">
                  <a-tag v-for="(filter, idx) in msg.chartConfig.filters" :key="idx" color="orange">
                    {{ filter.col }} {{ filter.op }} {{ filter.val }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="행 제한">
                  {{ msg.chartConfig.row_limit || 1000 }}
                </a-descriptions-item>
                <a-descriptions-item label="신뢰도" v-if="msg.chartConfig.confidence">
                  <a-progress 
                    :percent="Math.round(msg.chartConfig.confidence * 100)" 
                    :strokeColor="msg.chartConfig.confidence >= 0.7 ? '#52c41a' : '#faad14'"
                    size="small"
                  />
                </a-descriptions-item>
              </a-descriptions>
              
              <div class="chart-actions">
                <a-button 
                  type="primary" 
                  @click="applyChart(msg.chartConfig)"
                  style="margin-top: 12px"
                >
                  <template #icon>
                    <CheckOutlined />
                  </template>
                  이 설정으로 차트 만들기
                </a-button>
                <a-button 
                  @click="requestModification(msg.chartConfig)"
                  style="margin-top: 12px; margin-left: 8px"
                >
                  <template #icon>
                    <EditOutlined />
                  </template>
                  수정 요청
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 로딩 표시 -->
      <div v-if="loading" class="message ai">
        <div class="message-content">
          <div class="message-header">
            <RobotOutlined />
            <span>AI 도우미</span>
          </div>
          <div class="message-text">
            <a-spin size="small" style="margin-right: 8px" />
            분석 중...
          </div>
        </div>
      </div>
    </div>

    <!-- 입력 영역 -->
    <div class="chat-input">
      <a-textarea
        v-model:value="userInput"
        :rows="3"
        placeholder="예: 2025년 조직팀별 수익을 막대차트로 만들어줘"
        @keydown.ctrl.enter="handleSend"
        :disabled="loading"
      />
      <a-button 
        type="primary" 
        @click="handleSend"
        :loading="loading"
        :disabled="!userInput.trim()"
        style="margin-top: 8px; width: 100%"
      >
        <template #icon>
          <SendOutlined />
        </template>
        차트 생성 요청 (Ctrl+Enter)
      </a-button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, nextTick, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  CommentOutlined,
  UserOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  EditOutlined,
  SendOutlined
} from '@ant-design/icons-vue'
import nlpChartService from '../services/nlpChartService'

export default defineComponent({
  name: 'ChartChatbot',
  components: {
    CommentOutlined,
    UserOutlined,
    RobotOutlined,
    CheckCircleOutlined,
    CheckOutlined,
    EditOutlined,
    SendOutlined
  },
  props: {
    selectedDataset: {
      type: Object,
      required: true
    },
    datasetColumns: {
      type: Array,
      required: true
    },
      // ✅ 🆕 추가: columnAliases props
      columnAliases: {
        type: Object,
        default: () => ({})
      }
  },
  emits: ['chart-generated', 'close'],
  setup(props, { emit }) {
    const userInput = ref('')
    const messages = ref([])
    const loading = ref(false)
    const messagesContainer = ref(null)
    const nlpMethod = ref('claude_api')
    
    const chartTypeNames = {
      bar: '막대 차트',
      line: '선 차트',
      pie: '파이 차트',
      table: '테이블',
      area: '영역 차트',
      scatter: '산점도'
    }
    
    const getChartTypeName = (type) => {
      return chartTypeNames[type] || type
    }
    
    const getCurrentTime = () => {
      const now = new Date()
      return now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
    
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }
    
    const handleSend = async () => {
      if (!userInput.value.trim() || loading.value) return
      
      const userMessage = userInput.value.trim()
      
      // 사용자 메시지 추가
      messages.value.push({
        type: 'user',
        text: userMessage,
        timestamp: getCurrentTime()
      })
      
      userInput.value = ''
      loading.value = true
      scrollToBottom()
      
      try {
        console.log('🤖 NLP 분석 시작:', userMessage)
        console.log('📊 데이터셋:', props.selectedDataset.table_name)
        console.log('📋 컬럼 수:', props.datasetColumns.length)
        
        // NLP 서비스 호출
        const chartConfig = await nlpChartService.parseChartRequest(
          userMessage,
          props.selectedDataset,
          props.datasetColumns,
          props.columnAliases  // ✅ 🆕 추가: columnAliases 전달
        )
        
        console.log('✅ NLP 분석 완료:', chartConfig)
        nlpMethod.value = chartConfig.method || 'keyword_fallback'
        
        // AI 응답 메시지 추가
        const responseText = chartConfig.explanation || 
          `${getChartTypeName(chartConfig.chart_type)}를 생성하겠습니다. 아래 설정을 확인해주세요.`
        
        messages.value.push({
          type: 'ai',
          text: responseText,
          timestamp: getCurrentTime(),
          chartConfig: chartConfig
        })
        
        scrollToBottom()
        
      } catch (error) {
        console.error('❌ NLP 분석 오류:', error)
        
        messages.value.push({
          type: 'ai',
          text: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
          timestamp: getCurrentTime()
        })
        
        message.error('차트 생성 요청 처리 중 오류가 발생했습니다.')
        scrollToBottom()
        
      } finally {
        loading.value = false
      }
    }
    
    const applyChart = (chartConfig) => {
      console.log('✅ 차트 설정 적용:', chartConfig)
      emit('chart-generated', chartConfig)
      message.success('차트 설정이 적용되었습니다!')
    }
    
    const requestModification = (chartConfig) => {
      userInput.value = `이전 설정을 수정해주세요: ${JSON.stringify(chartConfig, null, 2)}`
      message.info('수정 요청을 입력란에 추가했습니다. 원하는 변경사항을 설명해주세요.')
    }
    
    return {
      userInput,
      messages,
      loading,
      messagesContainer,
      nlpMethod,
      getChartTypeName,
      handleSend,
      applyChart,
      requestModification,
      scrollToBottom
    }
  }
})
</script>

<style scoped>
.chart-chatbot {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: #f5f5f5;
  border-radius: 8px;
}

.chatbot-header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  border-radius: 8px 8px 0 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.header-description {
  margin: 8px 0 0 0;
  color: #666;
  font-size: 14px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

.message {
  display: flex;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message.user .message-content {
  background: #1890ff;
  color: white;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
}

.message.user .message-header {
  color: rgba(255, 255, 255, 0.85);
}

.message.ai .message-header {
  color: #666;
}

.message-time {
  margin-left: auto;
  font-weight: normal;
  opacity: 0.7;
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.chart-preview-card {
  margin-top: 12px;
}

.chart-config-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #52c41a;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chat-input {
  padding: 16px;
  background: white;
  border-top: 1px solid #e8e8e8;
  border-radius: 0 0 8px 8px;
}
</style>