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
    
    const prompt = `당신은 데이터 분석 전문가입니다. 다음 요청을 분석하여 차트 설정을 JSON으로 반환하세요.

**중요 규칙:**
1. 사용자 요청: "${userMessage}"
2. 데이터셋: ${dataset.table_name}
3. **컬럼 정보:**
${JSON.stringify(columnSummary, null, 2)}

4. **✅ CRITICAL: groupby와 metrics는 반드시 실제 column의 'name' 필드 값을 사용하세요**
   - ❌ 잘못된 예: "조직코드", "직위", "orgCode", "position" (alias나 description 사용)
   - ✅ 올바른 예: "tpBm3Nm", "positionCode" (실제 name 필드의 값)
   - 사용자가 "조직코드별"이라고 하면, 위 컬럼 정보에서 description이 "조직코드"인 컬럼의 'name' 필드를 사용

5. **메트릭 형식:**
   - 단순 개수: "count"만 사용
   - 컬럼 집계: "SUM(실제컬럼명)", "AVG(실제컬럼명)" 형식 사용
   - ❌ 잘못된 예: "SUM(수주금액)", "COUNT(*)"
   - ✅ 올바른 예: "count", "SUM(mngContractAmount)"

6. **차트 타입 선택:**
   - 시계열 데이터: "line" 사용
   - 카테고리별 비교: "dist_bar" 사용 (bar 대신)
   - 비율: "pie" 사용

**응답 형식 (JSON만):**
{
  "chart_type": "dist_bar",
  "metrics": ["SUM(mngContractAmount)"],
  "groupby": ["tpBm3Nm"],
  "filters": [],
  "row_limit": 1000,
  "time_range": "No filter",
  "confidence": 0.95,
  "explanation": "각 본부별 수주금액 합계를 막대그래프로 표시합니다."
}

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
      
      if (parsedResult.metrics && Array.isArray(parsedResult.metrics)) {
        parsedResult.metrics = parsedResult.metrics.map(metric => {
          // 이미 객체 형식이면 그대로 반환
          if (typeof metric === 'object' && metric !== null) {
            return metric
          }
      
          if (typeof metric === 'string') {
            // ✅ 🆕 수정: COUNT(*) 또는 count → 단순 문자열 "count" 반환
            const countStarMatch = metric.match(/^COUNT\(\s*\*\s*\)$/i)
            if (countStarMatch || metric.toLowerCase() === 'count') {
              console.log(`🔄 메트릭 변환: "${metric}" → "count" (문자열)`)
              return 'count'  // ✅ Adhoc 객체 대신 단순 문자열 반환
            }

            // ✅ 🆕 추가: sum__컬럼명 형식 → Adhoc Metric 객체 변환
            const adhocMetricMatch = metric.match(/^(sum|avg|max|min|count_distinct)__(.+)$/i)
            if (adhocMetricMatch) {
              const aggregateFunc = adhocMetricMatch[1].toUpperCase()
              const columnName = adhocMetricMatch[2]
              
              const column = columns.find(col => 
                col.column_name === columnName || 
                col.verbose_name === columnName
              )
              
              console.log(`✅ adhoc metric 형식 감지: ${metric} → Adhoc Metric 객체 변환`)
              
              return {
                expressionType: 'SIMPLE',
                column: {
                  column_name: columnName,
                  type: column?.type || (aggregateFunc === 'COUNT_DISTINCT' ? 'STRING' : 'DOUBLE')
                },
                aggregate: aggregateFunc,
                label: `${aggregateFunc}(${columnName})`,
                optionName: `metric_${aggregateFunc.toLowerCase()}_${columnName}_${Date.now()}`
              }
            }
            
            // SUM(컬럼명) → Adhoc Metric 객체
            const sumMatch = metric.match(/^SUM\(([^)]+)\)$/i)
            if (sumMatch) {
              const columnName = sumMatch[1].trim()
              const column = columns.find(col => 
                col.column_name === columnName || 
                col.verbose_name === columnName
              )
              
              return {
                expressionType: 'SIMPLE',
                column: {
                  column_name: columnName,
                  type: column?.type || 'DOUBLE'
                },
                aggregate: 'SUM',
                label: `SUM(${columnName})`,
                optionName: `metric_sum_${columnName}_${Date.now()}`
              }
            }
            
            // AVG(컬럼명) → Adhoc Metric 객체
            const avgMatch = metric.match(/^AVG\(([^)]+)\)$/i)
            if (avgMatch) {
              const columnName = avgMatch[1].trim()
              const column = columns.find(col => 
                col.column_name === columnName || 
                col.verbose_name === columnName
              )
              
              return {
                expressionType: 'SIMPLE',
                column: {
                  column_name: columnName,
                  type: column?.type || 'DOUBLE'
                },
                aggregate: 'AVG',
                label: `AVG(${columnName})`,
                optionName: `metric_avg_${columnName}_${Date.now()}`
              }
            }
            
            // MAX(컬럼명) → Adhoc Metric 객체
            const maxMatch = metric.match(/^MAX\(([^)]+)\)$/i)
            if (maxMatch) {
              const columnName = maxMatch[1].trim()
              const column = columns.find(col => 
                col.column_name === columnName || 
                col.verbose_name === columnName
              )
              
              return {
                expressionType: 'SIMPLE',
                column: {
                  column_name: columnName,
                  type: column?.type || 'DOUBLE'
                },
                aggregate: 'MAX',
                label: `MAX(${columnName})`,
                optionName: `metric_max_${columnName}_${Date.now()}`
              }
            }
            
            // MIN(컬럼명) → Adhoc Metric 객체
            const minMatch = metric.match(/^MIN\(([^)]+)\)$/i)
            if (minMatch) {
              const columnName = minMatch[1].trim()
              const column = columns.find(col => 
                col.column_name === columnName || 
                col.verbose_name === columnName
              )
              
              return {
                expressionType: 'SIMPLE',
                column: {
                  column_name: columnName,
                  type: column?.type || 'DOUBLE'
                },
                aggregate: 'MIN',
                label: `MIN(${columnName})`,
                optionName: `metric_min_${columnName}_${Date.now()}`
              }
            }
      
            // COUNT_DISTINCT(컬럼명) → Adhoc Metric 객체
            const countDistinctMatch = metric.match(/^COUNT_DISTINCT\(([^)]+)\)$/i)
            if (countDistinctMatch) {
              const columnName = countDistinctMatch[1].trim()
              const column = columns.find(col => 
                col.column_name === columnName || 
                col.verbose_name === columnName
              )
        
              return {
                expressionType: 'SIMPLE',
                column: {
                  column_name: columnName,
                  type: column?.type || 'STRING'
                },
                aggregate: 'COUNT_DISTINCT',
                label: `COUNT_DISTINCT(${columnName})`,
                optionName: `metric_count_distinct_${columnName}_${Date.now()}`
              }
            }
          }
    
          // 알 수 없는 형식은 그대로 반환
          return metric
        })
      }

      console.log('✅ Adhoc Metric 변환 완료:', parsedResult.metrics)
      
      if (parsedResult.groupby && Array.isArray(parsedResult.groupby)) {
        parsedResult.groupby = parsedResult.groupby.map(groupItem => {
          // 이미 실제 컬럼명이면 그대로 반환
          const directMatch = columns.find(col => col.column_name === groupItem)
          if (directMatch) {
            console.log(`✅ groupby 컬럼명 확인: ${groupItem} (이미 실제 컬럼명)`)
            return groupItem
          }
          
          // alias 또는 verbose_name으로 컬럼 찾기
          const aliasMatch = columns.find(col => 
            (col.alias && col.alias === groupItem) ||
            (col.verbose_name && col.verbose_name === groupItem)
          )
          
          if (aliasMatch) {
            console.log(`🔄 groupby 변환: "${groupItem}" → "${aliasMatch.column_name}"`)
            return aliasMatch.column_name
          }
          
          // 부분 일치 시도 (한글 포함)
          const partialMatch = columns.find(col =>
            (col.alias && col.alias.includes(groupItem)) ||
            (col.verbose_name && col.verbose_name.includes(groupItem)) ||
            (groupItem.includes(col.alias)) ||
            (groupItem.includes(col.verbose_name))
          )
          
          if (partialMatch) {
            console.log(`🔄 groupby 부분 일치 변환: "${groupItem}" → "${partialMatch.column_name}"`)
            return partialMatch.column_name
          }
          
          console.warn(`⚠️ groupby 컬럼을 찾을 수 없음: "${groupItem}" - 원본 사용`)
          return groupItem
        })
      }
      
      console.log('✅ groupby 변환 완료:', parsedResult.groupby)

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