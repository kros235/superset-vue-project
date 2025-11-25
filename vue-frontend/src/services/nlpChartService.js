// ============================================
// 🆕 새로 생성하는 파일
// vue-frontend/src/services/nlpChartService.js
// 자연어 처리 기반 차트 생성 서비스
// ============================================

import axios from 'axios'

class NLPChartService {
  constructor() {
    // 🔥 환경변수에서 Claude API 설정 로드
    this.claudeAPIKey = process.env.VUE_APP_CLAUDE_API_KEY || null
    // 🆕 수정: 프록시 서버 URL 사용 (CORS 우회)
    this.claudeAPIURL = process.env.VUE_APP_CLAUDE_PROXY_URL || 'http://localhost:3001/api/claude/messages'
    this.claudeModel = process.env.VUE_APP_CLAUDE_MODEL || 'claude-sonnet-4-20250514'
    this.fallbackEnabled = process.env.VUE_APP_NLP_FALLBACK_ENABLED !== 'false'
    this.minConfidence = parseFloat(process.env.VUE_APP_NLP_MIN_CONFIDENCE || '0.7')
    
    // 초기화 로깅
    if (this.claudeAPIKey && this.claudeAPIKey !== 'your_claude_api_key_here') {
      console.log('✅ Claude API 키 감지됨 - AI 기능 활성화')
      console.log(`📝 모델: ${this.claudeModel}`)
    } else {
      console.warn('⚠️ Claude API 키 없음 - 키워드 기반 폴백만 사용')
      if (!this.fallbackEnabled) {
        console.error('❌ 폴백도 비활성화됨 - 챗봇 사용 불가')
      }
    }
    
    // 키워드 매핑 (폴백용)
    this.chartTypeKeywords = {
      bar: ['막대', '막대차트', 'bar', '바', '비교', '순위'],
      line: ['선', '선차트', 'line', '추이', '트렌드', '변화', '시계열'],
      pie: ['파이', '원', 'pie', '비율', '구성', '점유율'],
      table: ['테이블', 'table', '표', '목록', '리스트'],
      area: ['영역', 'area', '면적'],
      scatter: ['산점도', 'scatter', '분포', '상관관계']
    }
    
    this.aggregationKeywords = {
      SUM: ['합계', '총', '합', 'sum', '수익', '매출', '금액'],
      AVG: ['평균', 'average', 'avg', '평균값'],
      COUNT: ['개수', '수', 'count', '건수', '갯수'],
      MAX: ['최대', '최고', 'max', '제일 높은', '가장 큰'],
      MIN: ['최소', '최저', 'min', '제일 낮은', '가장 작은']
    }
    
    this.filterKeywords = {
      year: ['년', 'year', '연도'],
      month: ['월', 'month'],
      date: ['일', 'day', 'date', '날짜']
    }
  }

  /**
   * 메인 진입점: Claude API 우선, 실패 시 키워드 폴백
   */
  async parseChartRequest(userMessage, dataset, columns, columnAliases = {}) {
    console.log('🤖 NLP 차트 요청 분석 시작')
    console.log('입력:', userMessage)
    console.log('데이터셋:', dataset?.table_name)
    console.log('컬럼 수:', columns?.length)
    console.log('🆕 컬럼 Aliases:', columnAliases)  // 🆕 추가
    
    // 🆕 Alias를 포함한 컬럼 정보 생성
    const columnsWithAliases = columns.map(col => ({
      ...col,
      alias: columnAliases[col.column_name] || col.verbose_name || null
    }))
    
    try {
      // 1순위: Claude API 사용
      if (this.claudeAPIKey && this.claudeAPIKey !== 'your_claude_api_key_here') {
        console.log('✨ Claude API 사용 시도...')
        const result = await this.parseWithClaudeAPI(userMessage, dataset, columnsWithAliases)  // 🆕 수정
        result.method = 'claude_api'
        
        if (result.confidence >= this.minConfidence) {
          console.log(`✅ Claude API 성공 (신뢰도: ${result.confidence})`)
          return result
        } else {
          console.warn(`⚠️ 신뢰도 낮음 (${result.confidence} < ${this.minConfidence}), 폴백 사용`)
          throw new Error('Low confidence')
        }
      }
    } catch (error) {
      console.warn('⚠️ Claude API 실패, 폴백 사용:', error.message)
    }
    
    // 2순위: 키워드 기반 폴백
    if (this.fallbackEnabled) {
      console.log('🔄 키워드 기반 폴백 사용')
      const result = this.parseWithKeywords(userMessage, dataset, columnsWithAliases)  // 🆕 수정
      result.method = 'keyword_fallback'
      return result
    } else {
      throw new Error('Claude API 실패 및 폴백 비활성화됨')
    }
  }

  /**
   * Claude API를 사용한 고급 자연어 처리
   */
  async parseWithClaudeAPI(userMessage, dataset, columns) {
    console.log('🧠 Claude API 호출 중...')
    
    // 🆕 Alias 정보 포함
    const columnSummary = columns.map(col => ({
      name: col.column_name,
      type: col.type_generic === 0 ? 'numeric' : 'text',
      description: col.verbose_name || col.column_name,
      alias: col.alias || null  // 🆕 추가
    }))
    
    const prompt = `당신은 데이터 분석 전문가입니다. 사용자의 자연어 요청을 분석하여 차트 생성 파라미터를 추출해주세요.

**데이터셋 정보:**
- 데이터셋: ${dataset.table_name}
- 데이터베이스: ${dataset.database?.database_name || 'Unknown'}
- 사용 가능한 컬럼: ${JSON.stringify(columnSummary, null, 2)}

**🆕 컬럼 별칭 안내:**
사용자가 "팀별", "수익" 등의 한글 표현을 사용하면, 위 컬럼 목록에서 alias 또는 description이 일치하는 컬럼을 매칭하세요.
예: "팀별" → team 컬럼, "수익" → revenue 컬럼

**사용자 요청:**
"${userMessage}"

**중요 규칙:**
1. 반드시 사용 가능한 컬럼 중에서만 선택
2. 숫자형 컬럼은 집계 함수와 함께 사용 (예: SUM(revenue), AVG(age))
// ⚠️ 기존 라인 삭제
// 3. 필터는 실제 컬럼명을 사용
// 4. 응답은 **오직 JSON만** 출력 (다른 텍스트 없이)
// 🆕 수정된 규칙 추가
3. **단순 개수 집계는 "count"만 사용** (COUNT(*) 사용 금지)
   - ✅ 올바른 예: "count"
   - ❌ 잘못된 예: "COUNT(*)", "COUNT(1)"
4. 특정 컬럼 집계는 함수명과 컬럼명을 사용 (예: COUNT(user_id), SUM(amount))
5. 필터는 실제 컬럼명을 사용
6. 응답은 **오직 JSON만** 출력 (다른 텍스트 없이)

**응답 형식 (JSON만):**
{
  "chart_type": "bar",
  // 🆕 수정: 단순 카운트는 "count", 특정 컬럼 집계는 함수(컬럼) 형식
  "metrics": ["count"],  
  "groupby": ["team"],
  "filters": [
    {"col": "year", "op": "==", "val": "2025"}
  ],
  "row_limit": 1000,
  "time_range": "No filter",
  "confidence": 0.95,
  "explanation": "2025년 팀별 총 수익을 막대 차트로 표시합니다."
}

// 🆕 추가 예시
**메트릭 예시:**
- 단순 개수: "count"
- 특정 컬럼 집계: "SUM(revenue)", "AVG(age)", "COUNT(user_id)"
- 여러 메트릭: ["count", "SUM(revenue)"]

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.`

    try {
      // 🆕 수정: 프록시 서버를 통해 호출 (API 키는 서버에서 관리)
      const response = await axios.post(
        this.claudeAPIURL,
        {
          model: this.claudeModel,
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
            // 🆕 API 키와 anthropic-version은 프록시 서버에서 추가
          },
          timeout: 60000  // 🆕 60초 타임아웃 추가
        }
      )
      
      console.log('✅ Claude API 응답 수신')
      
      let responseText = response.data.content[0].text
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      console.log('파싱할 텍스트:', responseText)
      
      const parsedResult = JSON.parse(responseText)
      
      if (!parsedResult.chart_type || !parsedResult.metrics) {
        throw new Error('Claude API 응답이 불완전합니다')
      }
      
      // 🆕 메트릭 후처리: COUNT(*) → count 변환
      if (parsedResult.metrics && Array.isArray(parsedResult.metrics)) {
        parsedResult.metrics = parsedResult.metrics.map(metric => {
          // COUNT(*) 또는 COUNT(1) 같은 형식을 'count'로 변환
          if (typeof metric === 'string') {
            const countStarMatch = metric.match(/^COUNT\(\s*\*\s*\)$/i)
            const countOneMatch = metric.match(/^COUNT\(\s*1\s*\)$/i)
            
            if (countStarMatch || countOneMatch) {
              console.log(`🔄 메트릭 변환: "${metric}" → "count"`)
              return 'count'
            }
          }
          return metric
        })
      }
      
      console.log('✅ Claude API 파싱 완료:', parsedResult)
      return parsedResult
      
    } catch (error) {
      console.error('❌ Claude API 오류:', error)
      
      if (error.response) {
        console.error('API 응답 오류:', error.response.status, error.response.data)
      } else if (error.request) {
        console.error('API 요청 오류 (응답 없음)')
      } else {
        console.error('API 설정 오류:', error.message)
      }
      
      throw error
    }
  }

  /**
   * 키워드 기반 폴백 분석
   */
  parseWithKeywords(userMessage, dataset, columns) {
    console.log('🔍 키워드 기반 분석 시작')
    
    const message = userMessage.toLowerCase()
    
    const chartType = this.extractChartType(message)
    const metrics = this.extractMetrics(message, columns)
    const groupby = this.extractGroupBy(message, columns)
    const filters = this.extractFilters(message, columns)
    const rowLimit = this.extractRowLimit(message)
    
    return {
      chart_type: chartType,
      metrics: metrics.length > 0 ? metrics : ['count'],
      groupby: groupby,
      filters: filters,
      row_limit: rowLimit,
      time_range: 'No filter',
      confidence: 0.6,
      explanation: `키워드 기반으로 ${this.getChartTypeName(chartType)}를 생성합니다.`,
      method: 'keyword_fallback'
    }
  }

  extractChartType(message) {
    for (const [type, keywords] of Object.entries(this.chartTypeKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return type
      }
    }
    return 'bar' // 기본값
  }

  extractMetrics(message, columns) {
    const metrics = []
    const numericColumns = columns.filter(col => col.type_generic === 0)
    
    for (const [aggFunc, keywords] of Object.entries(this.aggregationKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        for (const col of numericColumns) {
          if (message.includes(col.column_name.toLowerCase())) {
            metrics.push(`${aggFunc}(${col.column_name})`)
            break
          }
        }
        if (metrics.length > 0) break
      }
    }
    
    return metrics
  }

  extractGroupBy(message, columns) {
    const groupby = []
    const patterns = ['별', 'by', '기준', '그룹']
    
    if (patterns.some(pattern => message.includes(pattern))) {
      // 🆕 한글 키워드로 Alias 매칭
      const koreanKeywords = ['팀', '부서', '지역', '월', '연도', '제품', '고객', '직급', '회사', '조직']
      
      for (const keyword of koreanKeywords) {
        if (message.includes(keyword)) {
          const matchedCol = this.findColumnByAlias(keyword, columns)
          if (matchedCol) {
            groupby.push(matchedCol.column_name)
            console.log(`🆕 Alias 매칭: "${keyword}" → ${matchedCol.column_name}`)
          }
        }
      }
      
      // 기존 방식: 컬럼명 직접 매칭
      for (const col of columns) {
        if (message.includes(col.column_name.toLowerCase()) && !groupby.includes(col.column_name)) {
          groupby.push(col.column_name)
        }
      }
    }
    
    return groupby
  }

  // 🆕 Alias로 컬럼 찾기
  findColumnByAlias(alias, columns) {
    if (!alias) return null
    const aliasLower = alias.toLowerCase()
    
    // 1. alias 필드에서 정확히 일치하는 컬럼 찾기
    let matched = columns.find(col => {
      if (col.alias && col.alias.toLowerCase().includes(aliasLower)) return true
      return false
    })
    
    if (matched) return matched
    
    // 2. verbose_name에서 찾기
    matched = columns.find(col => {
      if (col.verbose_name && col.verbose_name.toLowerCase().includes(aliasLower)) return true
      return false
    })
    
    if (matched) return matched
    
    // 3. column_name에서 찾기
    matched = columns.find(col => {
      if (col.column_name && col.column_name.toLowerCase().includes(aliasLower)) return true
      return false
    })
    
    return matched || null
  }
  extractFilters(message, columns) {
    const filters = []
    const yearMatch = message.match(/(\d{4})년/)
    
    if (yearMatch) {
      const yearColumn = columns.find(col => 
        col.column_name.toLowerCase().includes('year') ||
        col.column_name.toLowerCase().includes('연도')
      )
      
      if (yearColumn) {
        filters.push({
          col: yearColumn.column_name,
          op: '==',
          val: yearMatch[1]
        })
      }
    }
    
    return filters
  }

  extractRowLimit(message) {
    const limitMatch = message.match(/(\d+)개/)
    return limitMatch ? parseInt(limitMatch[1]) : 1000
  }

  getChartTypeName(type) {
    const names = {
      bar: '막대 차트',
      line: '선 차트',
      pie: '파이 차트',
      table: '테이블',
      area: '영역 차트',
      scatter: '산점도'
    }
    return names[type] || type
  }

  /**
   * Claude API 키 런타임 설정
   */
  setClaudeAPIKey(apiKey) {
    this.claudeAPIKey = apiKey
    console.log('✅ Claude API 키 런타임 설정 완료')
    console.log('ℹ️  보안을 위해 .env.local 파일 사용을 권장합니다')
  }
}

// 싱글톤 인스턴스
const nlpChartService = new NLPChartService()
export default nlpChartService