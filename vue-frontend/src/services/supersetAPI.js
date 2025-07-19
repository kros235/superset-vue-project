// vue-frontend/src/services/supersetAPI.js
import axios from 'axios'

class SupersetAPI {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.VUE_APP_SUPERSET_URL || 'http://localhost:8088',
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    // 요청 인터셉터 - 모든 요청 로깅
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[API 요청] ${config.method?.toUpperCase()} ${config.url}`)
        console.log('요청 헤더:', config.headers)
        if (config.data) {
          console.log('요청 데이터:', config.data)
        }
        return config
      },
      (error) => {
        console.error('[API 요청 오류]', error)
        return Promise.reject(error)
      }
    )

    // 응답 인터셉터 - 모든 응답 로깅
    this.api.interceptors.response.use(
      (response) => {
        console.log(`[API 응답 성공] ${response.status} ${response.config.url}`)
        console.log('응답 데이터:', response.data)
        return response
      },
      (error) => {
        console.error(`[API 응답 오류] ${error.response?.status || 'Network Error'} ${error.config?.url}:`)
        
        if (error.response) {
          console.error('응답 상태:', error.response.status)
          console.error('응답 데이터:', error.response.data)
          console.error('응답 헤더:', error.response.headers)
          
          // 인증 에러 처리
          if (error.response.status === 401) {
            console.warn('인증 토큰 만료 또는 무효')
            // 필요시 로그아웃 처리
          }
        } else if (error.request) {
          console.error('요청 실패:', error.request)
        } else {
          console.error('오류 설정:', error.message)
        }
        
        return Promise.reject(error)
      }
    )
  }

  // ===== 연결 상태 확인 =====
  async checkConnection() {
    try {
      console.log('Superset 연결 상태 확인 중...')
      const response = await this.api.get('/health', { timeout: 10000 })
      console.log('Superset 연결 성공:', response.status)
      return true
    } catch (error) {
      console.error('Superset 연결 실패:', error.message)
      return false
    }
  }

  // ===== 인증 관련 메서드 =====
  
  // 로그인
  async login(credentials) {
    try {
      console.log('로그인 시도:', { username: credentials.username })
      
      const loginPayload = {
        username: credentials.username,
        password: credentials.password,
        provider: 'db',
        refresh: true
      }
      
      const response = await this.api.post('/api/v1/security/login', loginPayload)
      console.log('로그인 응답:', response.data)
      
      if (response.data.access_token) {
        // 토큰 저장
        localStorage.setItem('superset_access_token', response.data.access_token)
        if (response.data.refresh_token) {
          localStorage.setItem('superset_refresh_token', response.data.refresh_token)
        }
        
        console.log('로그인 성공 - 토큰 저장됨')
        return response.data
      }
      
      throw new Error('토큰을 받지 못했습니다')
      
    } catch (error) {
      console.error('로그인 오류:', error)
      throw error
    }
  }

  // 현재 사용자 정보 조회
  async getCurrentUser() {
    try {
      console.log('현재 사용자 정보 조회 중...')
      
      // 로컬 스토리지에서 사용자 정보 확인
      const localUser = localStorage.getItem('superset_user')
      if (localUser) {
        try {
          const user = JSON.parse(localUser)
          console.log('로컬 스토리지에서 사용자 정보 발견:', user)
          return user
        } catch (parseError) {
          console.warn('로컬 스토리지 사용자 정보 파싱 오류:', parseError)
        }
      }
      
      // API에서 사용자 정보 조회
      const response = await this.api.get('/api/v1/me/')
      console.log('사용자 정보 API 응답:', response.data)
      
      if (response.data) {
        // 사용자 정보 로컬 스토리지에 저장
        localStorage.setItem('superset_user', JSON.stringify(response.data))
        return response.data
      }
      
      return null
      
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error)
      // 401 오류인 경우 로그인이 필요한 상태
      if (error.response?.status === 401) {
        localStorage.removeItem('superset_user')
        return null
      }
      throw error
    }
  }

  // 로그아웃
  async logout() {
    try {
      console.log('로그아웃 요청...')
      await this.api.post('/api/v1/security/logout')
      
      // 로컬 스토리지 정리
      localStorage.removeItem('superset_access_token')
      localStorage.removeItem('superset_refresh_token')
      localStorage.removeItem('superset_csrf_token')
      localStorage.removeItem('superset_user')
      
      console.log('로그아웃 완료')
      return true
      
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 에러가 발생해도 로컬 토큰은 정리
      localStorage.removeItem('superset_access_token')
      localStorage.removeItem('superset_refresh_token')
      localStorage.removeItem('superset_csrf_token')
      localStorage.removeItem('superset_user')
      throw error
    }
  }

  // ===== 데이터베이스 관련 메서드 =====
  
  // 데이터베이스 목록 조회
  async getDatabases() {
    try {
      console.log('데이터베이스 목록 조회 중...')
      const response = await this.api.get('/api/v1/database/')
      console.log('데이터베이스 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('데이터베이스 조회 오류:', error)
      throw error
    }
  }

  // 데이터베이스 생성
  async createDatabase(payload) {
    try {
      console.log('데이터베이스 생성 요청:', payload)
      const response = await this.api.post('/api/v1/database/', payload)
      console.log('데이터베이스 생성 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 생성 오류:', error)
      throw error
    }
  }

  // 데이터베이스 업데이트
  async updateDatabase(databaseId, payload) {
    try {
      console.log('데이터베이스 업데이트:', databaseId, payload)
      const response = await this.api.put(`/api/v1/database/${databaseId}`, payload)
      console.log('데이터베이스 업데이트 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 업데이트 오류:', error)
      throw error
    }
  }

  // 데이터베이스 삭제
  async deleteDatabase(databaseId) {
    try {
      console.log('데이터베이스 삭제:', databaseId)
      const response = await this.api.delete(`/api/v1/database/${databaseId}`)
      console.log('데이터베이스 삭제 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 삭제 오류:', error)
      throw error
    }
  }

  // 데이터베이스 연결 테스트
  async testDatabaseConnection(payload) {
    try {
      console.log('데이터베이스 연결 테스트:', payload)
      const response = await this.api.post('/api/v1/database/test_connection', payload)
      console.log('연결 테스트 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('연결 테스트 오류:', error)
      throw error
    }
  }

  // SQL 실행 메서드 (개선된 버전)
  async executeSQL(payload) {
    try {
      console.log('SQL 실행 요청:', payload)
    
      // 페이로드 검증 및 정리
      const cleanPayload = {
        database_id: parseInt(payload.database_id),
        sql: payload.sql.trim(),
        schema: payload.schema || '',
        client_id: `vue_client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        limit: payload.limit || 1000,
        expand_data: true,
        select_as_cta: false,
        ctas_method: 'TABLE'
      }
    
      console.log('정리된 SQL 페이로드:', cleanPayload)
    
      // SQL Lab API 호출
      const response = await this.api.post('/api/v1/sqllab/execute/', cleanPayload)
      console.log('SQL 실행 응답:', response.data)
    
      return response.data
    
    } catch (error) {
      console.error('SQL 실행 오류:', error)
    
      // 에러 정보 상세 분석
      if (error.response) {
        console.error('SQL 실행 HTTP 상태:', error.response.status)
        console.error('SQL 실행 응답 데이터:', error.response.data)
      
        // 권한 오류인 경우 더 자세한 메시지
        if (error.response.status === 403) {
          throw new Error('SQL 실행 권한이 없습니다. 관리자에게 문의하세요.')
        } else if (error.response.status === 400) {
          const errorMsg = error.response.data?.message || '잘못된 SQL 쿼리입니다.'
          throw new Error(`SQL 오류: ${errorMsg}`)
        }
      }
    
      throw error
    }
  }

  // 테이블 목록 조회 (SQL을 통한 방법)
  async getTablesSQL(databaseId, schemaName = '') {
    try {
      console.log('SQL 테이블 조회:', databaseId, schemaName)
      
      // 다양한 SQL 쿼리 시도
      const sqlQueries = [
        // 1. INFORMATION_SCHEMA 사용 (가장 표준적)
        schemaName ? 
          `SELECT TABLE_NAME as name, TABLE_TYPE as type, TABLE_ROWS as rows, TABLE_COMMENT as comment FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${schemaName}' ORDER BY TABLE_NAME` :
          `SELECT TABLE_NAME as name, TABLE_SCHEMA as schema, TABLE_TYPE as type FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') ORDER BY TABLE_SCHEMA, TABLE_NAME`,
        
        // 2. SHOW TABLES 사용 (MySQL 특화)
        schemaName ? `SHOW FULL TABLES FROM \`${schemaName}\`` : 'SHOW DATABASES',
        
        // 3. 간단한 SHOW TABLES
        schemaName ? `SHOW TABLES FROM \`${schemaName}\`` : 'SHOW DATABASES'
      ]
      
      for (const sql of sqlQueries) {
        try {
          console.log('실행할 SQL:', sql)
          
          const sqlPayload = {
            database_id: databaseId,
            sql: sql,
            schema: schemaName || '',
            limit: 1000
          }
          
          const result = await this.executeSQL(sqlPayload)
          console.log('SQL 테이블 조회 결과:', result)
          
          if (result && result.data && Array.isArray(result.data)) {
            // 결과를 표준화된 형태로 변환
            return result.data.map(row => {
              if (typeof row === 'string') {
                return { name: row, type: 'table' }
              } else if (typeof row === 'object') {
                return {
                  name: row.name || row.TABLE_NAME || row.Name || Object.values(row)[0],
                  type: row.type || row.TABLE_TYPE || 'table',
                  schema: row.schema || row.TABLE_SCHEMA || schemaName || 'default',
                  rows: row.rows || row.TABLE_ROWS || null,
                  comment: row.comment || row.TABLE_COMMENT || ''
                }
              }
              return { name: String(row), type: 'table' }
            })
          }
          
        } catch (sqlError) {
          console.log(`SQL 쿼리 실패: ${sql}`, sqlError)
          continue
        }
      }
      
      throw new Error('모든 SQL 쿼리 실패')
    } catch (error) {
      console.error('SQL 테이블 조회 오류:', error)
      throw error
    }
  }

  // ===== 데이터셋 관련 메서드 =====
  
  // 데이터셋 목록 조회
  async getDatasets() {
    try {
      console.log('데이터셋 목록 조회 중...')
      const response = await this.api.get('/api/v1/dataset/')
      console.log('데이터셋 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('데이터셋 조회 오류:', error)
      throw error
    }
  }


// 데이터셋 생성 (올바른 API 스키마 사용)
  async createDataset(payload) {
    try {
      console.log('데이터셋 생성 요청:', payload)
      
      // 최소한의 필수 필드만 사용 (Superset API 스키마에 맞춤)
      const minimalPayload = {
        database: parseInt(payload.database),
        schema: payload.schema || null,
        table_name: payload.table_name
      }
      
      console.log('최소 페이로드:', minimalPayload)
      
      const response = await this.api.post('/api/v1/dataset/', minimalPayload)
      console.log('데이터셋 생성 응답:', response.data)
      return response.data
      
    } catch (error) {
      console.error('데이터셋 생성 오류:', error)
      
      // 에러 정보 상세 분석
      if (error.response) {
        console.error('응답 상태:', error.response.status)
        console.error('응답 데이터:', error.response.data)
        console.error('응답 헤더:', error.response.headers)
        
        // 상세 에러 메시지 추출
        const errorMessage = error.response.data?.message
        if (errorMessage && typeof errorMessage === 'object') {
          console.error('필드별 에러:', errorMessage)
          
          // 필드별 에러 메시지 구성
          const fieldErrors = []
          Object.entries(errorMessage).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`)
            } else {
              fieldErrors.push(`${field}: ${errors}`)
            }
          })
          
          const detailedError = new Error(`데이터셋 생성 실패: ${fieldErrors.join('; ')}`)
          detailedError.details = errorMessage
          throw detailedError
        }
      }
      
      throw error
    }
  }

  // 데이터셋 업데이트
  async updateDataset(datasetId, payload) {
    try {
      console.log(`데이터셋 업데이트: ${datasetId}`, payload)
      const response = await this.api.put(`/api/v1/dataset/${datasetId}`, payload)
      console.log('데이터셋 업데이트 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 업데이트 오류:', error)
      throw error
    }
  }

  // 데이터셋 업데이트
  async updateDataset(datasetId, payload) {
    try {
      console.log('데이터셋 업데이트:', datasetId, payload)
      const response = await this.api.put(`/api/v1/dataset/${datasetId}`, payload)
      console.log('데이터셋 업데이트 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 업데이트 오류:', error)
      throw error
    }
  }

  // 데이터셋 삭제
  async deleteDataset(datasetId) {
    try {
      console.log(`데이터셋 삭제: ${datasetId}`)
      const response = await this.api.delete(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 삭제 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 삭제 오류:', error)
      throw error
    }
  }

  // 데이터셋 샘플 데이터 조회
  async getDatasetSampleData(datasetId, limit = 100) {
    try {
      console.log(`데이터셋 샘플 데이터 조회: ${datasetId}`)
      const payload = {
        datasource: `${datasetId}__table`,
        viz_type: 'table',
        form_data: {
          query_mode: 'raw',
          all_columns: [],
          row_limit: limit,
          order_desc: true
        }
      }
      
      const response = await this.api.post('/api/v1/chart/data', payload)
      console.log('샘플 데이터 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('샘플 데이터 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋으로부터 차트 생성 (차트 빌더로 리다이렉트를 위한 URL 생성)
  getChartBuilderUrl(datasetId) {
    const baseUrl = process.env.VUE_APP_SUPERSET_URL || 'http://localhost:8088'
    return `${baseUrl}/explore/?datasource_type=table&datasource_id=${datasetId}`
  }

  // 특정 데이터셋 상세 조회
  async getDataset(datasetId) {
    try {
      console.log('데이터셋 상세 조회:', datasetId)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 상세 응답:', response.data)
      return response.data.result
    } catch (error) {
      console.error('데이터셋 상세 조회 오류:', error)
      throw error
    }
  }

  // ===== 데이터셋 상세 조회 및 관리 =====
  
  // 데이터셋 상세 정보 조회
  async getDatasetDetail(datasetId) {
    try {
      console.log(`데이터셋 상세 정보 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 상세 정보:', response.data)
      return response.data.result
    } catch (error) {
      console.error('데이터셋 상세 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋 컬럼 정보 조회
  async getDatasetColumns(datasetId) {
    try {
      console.log(`데이터셋 컬럼 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 컬럼 정보:', response.data.result.columns)
      return response.data.result.columns || []
    } catch (error) {
      console.error('데이터셋 컬럼 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋 메트릭 정보 조회
  async getDatasetMetrics(datasetId) {
    try {
      console.log(`데이터셋 메트릭 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 메트릭 정보:', response.data.result.metrics)
      return response.data.result.metrics || []
    } catch (error) {
      console.error('데이터셋 메트릭 조회 오류:', error)
      throw error
    }
  }

  // 테이블 정보 조회 메서드 개선
  async getTableInfo(databaseId, tableName, schemaName = '') {
    try {
      console.log('테이블 정보 조회:', databaseId, tableName, schemaName)
      
      // URL 구성
      const schemaPath = schemaName ? `/${encodeURIComponent(schemaName)}` : ''
      const url = `/api/v1/database/${databaseId}/table/${encodeURIComponent(tableName)}${schemaPath}/`
      
      const response = await this.api.get(url)
      console.log('테이블 정보 응답:', response.data)
      return response.data
      
    } catch (error) {
      console.error('테이블 정보 조회 오류:', error)
      
      // 대체 방법: SQL로 컬럼 정보 조회
      try {
        console.log('SQL로 컬럼 정보 조회 시도')
        const sql = schemaName 
          ? `DESCRIBE \`${schemaName}\`.\`${tableName}\``
          : `DESCRIBE \`${tableName}\``
        
        const result = await this.executeSQL({
          database_id: databaseId,
          sql: sql,
          schema: schemaName || '',
          limit: 1000
        })
        
        if (result && result.data) {
          // DESCRIBE 결과를 컬럼 정보로 변환
          const columns = result.data.map(row => ({
            name: row.Field || row.field,
            type: row.Type || row.type,
            is_dttm: (row.Type || row.type || '').toLowerCase().includes('timestamp') || 
                     (row.Type || row.type || '').toLowerCase().includes('datetime'),
            description: null,
            python_date_format: null
          }))
          
          return { columns }
        }
        
      } catch (sqlError) {
        console.error('SQL 컬럼 조회도 실패:', sqlError)
      }
      
      throw error
    }
  }

  // ===== 차트 관련 메서드 확장 =====
  
  // 차트 목록 조회 (필터링 지원)
  async getCharts(filters = {}) {
    try {
      console.log('차트 목록 조회:', filters)
      const params = new URLSearchParams()
      
      if (filters.page) params.append('q', `(page:${filters.page})`)
      if (filters.page_size) params.append('q', `(page_size:${filters.page_size})`)
      if (filters.datasource_id) {
        params.append('q', `(filters:!((col:datasource_id,opr:eq,value:${filters.datasource_id})))`)
      }
      
      const response = await this.api.get(`/api/v1/chart/?${params.toString()}`)
      console.log('차트 목록 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('차트 목록 조회 오류:', error)
      throw error
    }
  }

  // 차트 생성
  async createChart(payload) {
    try {
      console.log('차트 생성 요청:', payload)
      
      // 차트 생성에 필요한 최소한의 payload 구성
      const chartPayload = {
        slice_name: payload.slice_name || '새 차트',
        description: payload.description || '',
        viz_type: payload.viz_type || 'table',
        datasource_id: payload.datasource_id,
        datasource_type: 'table',
        params: JSON.stringify(payload.params || {}),
        query_context: JSON.stringify(payload.query_context || {}),
        cache_timeout: payload.cache_timeout || null
      }
      
      console.log('차트 생성 페이로드:', chartPayload)
      
      const response = await this.api.post('/api/v1/chart/', chartPayload)
      console.log('차트 생성 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 생성 오류:', error)
      if (error.response) {
        console.error('응답 상태:', error.response.status)
        console.error('응답 데이터:', error.response.data)
      }
      throw error
    }
  }

  // 차트 업데이트
  async updateChart(chartId, payload) {
    try {
      console.log('차트 업데이트:', chartId, payload)
      const response = await this.api.put(`/api/v1/chart/${chartId}`, payload)
      console.log('차트 업데이트 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 업데이트 오류:', error)
      throw error
    }
  }

  // 차트 삭제
  async deleteChart(chartId) {
    try {
      console.log('차트 삭제:', chartId)
      const response = await this.api.delete(`/api/v1/chart/${chartId}`)
      console.log('차트 삭제 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 삭제 오류:', error)
      throw error
    }
  }


// ===== 데이터셋 상세 조회 및 관리 =====
  
  // 데이터셋 상세 정보 조회
  async getDatasetDetail(datasetId) {
    try {
      console.log(`데이터셋 상세 정보 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 상세 정보:', response.data)
      return response.data.result
    } catch (error) {
      console.error('데이터셋 상세 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋 컬럼 정보 조회
  async getDatasetColumns(datasetId) {
    try {
      console.log(`데이터셋 컬럼 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 컬럼 정보:', response.data.result.columns)
      return response.data.result.columns || []
    } catch (error) {
      console.error('데이터셋 컬럼 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋 메트릭 정보 조회
  async getDatasetMetrics(datasetId) {
    try {
      console.log(`데이터셋 메트릭 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 메트릭 정보:', response.data.result.metrics)
      return response.data.result.metrics || []
    } catch (error) {
      console.error('데이터셋 메트릭 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋 업데이트
  async updateDataset(datasetId, payload) {
    try {
      console.log(`데이터셋 업데이트: ${datasetId}`, payload)
      const response = await this.api.put(`/api/v1/dataset/${datasetId}`, payload)
      console.log('데이터셋 업데이트 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 업데이트 오류:', error)
      throw error
    }
  }

  // 데이터셋 삭제
  async deleteDataset(datasetId) {
    try {
      console.log(`데이터셋 삭제: ${datasetId}`)
      const response = await this.api.delete(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 삭제 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 삭제 오류:', error)
      throw error
    }
  }

  // 데이터셋 샘플 데이터 조회
  async getDatasetSampleData(datasetId, limit = 100) {
    try {
      console.log(`데이터셋 샘플 데이터 조회: ${datasetId}`)
      const payload = {
        datasource: `${datasetId}__table`,
        viz_type: 'table',
        form_data: {
          query_mode: 'raw',
          all_columns: [],
          row_limit: limit,
          order_desc: true
        }
      }
      
      const response = await this.api.post('/api/v1/chart/data', payload)
      console.log('샘플 데이터 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('샘플 데이터 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋으로부터 차트 생성 (차트 빌더로 리다이렉트를 위한 URL 생성)
  getChartBuilderUrl(datasetId) {
    const baseUrl = process.env.VUE_APP_SUPERSET_URL || 'http://localhost:8088'
    return `${baseUrl}/explore/?datasource_type=table&datasource_id=${datasetId}`
  }

  // ===== 차트 관련 메서드 확장 =====
  
  // 차트 목록 조회 (필터링 지원)
  async getCharts(filters = {}) {
    try {
      console.log('차트 목록 조회:', filters)
      const params = new URLSearchParams()
      
      if (filters.page) params.append('q', `(page:${filters.page})`)
      if (filters.page_size) params.append('q', `(page_size:${filters.page_size})`)
      if (filters.datasource_id) {
        params.append('q', `(filters:!((col:datasource_id,opr:eq,value:${filters.datasource_id})))`)
      }
      
      const response = await this.api.get(`/api/v1/chart/?${params.toString()}`)
      console.log('차트 목록 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('차트 목록 조회 오류:', error)
      throw error
    }
  }

  // 차트 생성
  async createChart(payload) {
    try {
      console.log('차트 생성 요청:', payload)
      
      // 차트 생성에 필요한 최소한의 payload 구성
      const chartPayload = {
        slice_name: payload.slice_name || '새 차트',
        description: payload.description || '',
        viz_type: payload.viz_type || 'table',
        datasource_id: payload.datasource_id,
        datasource_type: 'table',
        params: JSON.stringify(payload.params || {}),
        query_context: JSON.stringify(payload.query_context || {}),
        cache_timeout: payload.cache_timeout || null
      }
      
      console.log('차트 생성 페이로드:', chartPayload)
      
      const response = await this.api.post('/api/v1/chart/', chartPayload)
      console.log('차트 생성 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 생성 오류:', error)
      if (error.response) {
        console.error('응답 상태:', error.response.status)
        console.error('응답 데이터:', error.response.data)
      }
      throw error
    }
  }

  // 차트 데이터 조회
 async getChartData(chartId = null, formData = {}) {
    try {
      let payload;
      
      if (chartId) {
        // 기존 차트 ID로 조회하는 경우
        payload = {
          chart_id: chartId
        }
      } else {
        // 새로운 차트 데이터 조회하는 경우 - Superset UI가 실제로 보내는 형식
        payload = {
          datasource: `${formData.datasource_id}__table`,
          viz_type: formData.viz_type || 'table',
          form_data: {
            datasource: `${formData.datasource_id}__table`,
            viz_type: formData.viz_type || 'table',
            metrics: formData.metrics || ['count'],
            groupby: formData.groupby || [],
            adhoc_filters: [],
            row_limit: formData.row_limit || 1000,
            order_desc: formData.order_desc === 'desc',
            color_scheme: formData.color_scheme || 'bnbColors',
            ...(formData.granularity_sqla && {
              granularity_sqla: formData.granularity_sqla,
              time_range: formData.time_range || 'Last 30 days'
            })
          }
        }
      }
      
      console.log('차트 데이터 요청:', payload)
      const response = await this.api.post('/api/v1/chart/data', payload)
      console.log('차트 데이터 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 데이터 조회 오류:', error)
      if (error.response) {
        console.error('응답 상태:', error.response.status)
        console.error('응답 데이터:', error.response.data)
        console.error('응답 헤더:', error.response.headers)
      }
      throw error
    }
  }

  // 차트 타입 목록 조회
  async getVizTypes() {
    try {
      console.log('차트 타입 목록 조회')
      const response = await this.api.get('/api/v1/chart/viz_types')
      console.log('차트 타입 목록:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 타입 조회 오류:', error)
      throw error
    }
  }

  // ===== 대시보드 관련 메서드 =====
  
  // 대시보드 목록 조회
  async getDashboards() {
    try {
      console.log('대시보드 목록 조회 중...')
      const response = await this.api.get('/api/v1/dashboard/')
      console.log('대시보드 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('대시보드 조회 오류:', error)
      throw error
    }
  }

  // 대시보드 생성
  async createDashboard(payload) {
    try {
      console.log('대시보드 생성 요청:', payload)
      const response = await this.api.post('/api/v1/dashboard/', payload)
      console.log('대시보드 생성 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('대시보드 생성 오류:', error)
      throw error
    }
  }

  // 대시보드 업데이트
  async updateDashboard(dashboardId, payload) {
    try {
      console.log('대시보드 업데이트:', dashboardId, payload)
      const response = await this.api.put(`/api/v1/dashboard/${dashboardId}`, payload)
      console.log('대시보드 업데이트 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('대시보드 업데이트 오류:', error)
      throw error
    }
  }

  // 대시보드 삭제
  async deleteDashboard(dashboardId) {
    try {
      console.log('대시보드 삭제:', dashboardId)
      const response = await this.api.delete(`/api/v1/dashboard/${dashboardId}`)
      console.log('대시보드 삭제 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('대시보드 삭제 오류:', error)
      throw error
    }
  }

  // ===== 데이터베이스 스키마 및 테이블 관련 메서드 =====

  // 데이터베이스 스키마 목록 조회 (누락된 핵심 메서드)
  async getDatabaseSchemas(databaseId) {
    try {
      console.log('데이터베이스 스키마 조회:', databaseId)
      
      // 다양한 API 엔드포인트 시도
      const possibleEndpoints = [
        `/api/v1/database/${databaseId}/schemas/`,
        `/api/v1/database/${databaseId}/schema/`,
        `/superset/schemas/${databaseId}/`
      ]

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`스키마 조회 시도: ${endpoint}`)
          const response = await this.api.get(endpoint)
          console.log(`스키마 조회 성공 (${endpoint}):`, response.data)
          return response.data.result || response.data || []
        } catch (error) {
          console.log(`스키마 엔드포인트 실패 (${endpoint}): ${error.response?.status}`)
          continue
        }
      }
      
      // 모든 엔드포인트 실패시 SQL로 스키마 조회 시도
      try {
        console.log('API 실패, SQL로 스키마 조회 시도...')
        const result = await this.executeSQL({
          database_id: databaseId,
          sql: 'SHOW DATABASES',
          schema: '',
          limit: 100
        })
        
        if (result && result.data && Array.isArray(result.data)) {
          const schemas = result.data.map(row => {
            return typeof row === 'string' ? row : 
                   typeof row === 'object' ? Object.values(row)[0] : 
                   String(row)
          })
          console.log('SQL로 스키마 조회 성공:', schemas)
          return schemas
        }
      } catch (sqlError) {
        console.log('SQL 스키마 조회도 실패:', sqlError)
      }
      
      // 최후의 방법: 기본 스키마 반환
      console.log('기본 스키마 목록 반환')
      return ['sample_dashboard', 'public', 'default']
      
    } catch (error) {
      console.error('스키마 조회 오류:', error)
      // 오류 발생시 기본 스키마 반환
      return ['sample_dashboard', 'public', 'default']
    }
  }

  // 특정 스키마의 테이블 목록 조회 (누락된 핵심 메서드)
  async getDatabaseTablesInSchema(databaseId, schemaName) {
    try {
      console.log('스키마 테이블 조회:', databaseId, schemaName)
      
      // 1. API 엔드포인트 시도
      const possibleEndpoints = [
        `/api/v1/database/${databaseId}/tables/?q=(filters:!((col:schema,opr:eq,value:'${schemaName}')))`,
        `/api/v1/database/${databaseId}/tables/${schemaName}/`,
        `/api/v1/database/${databaseId}/table_metadata/?schema=${schemaName}`,
        `/superset/tables/${databaseId}/${schemaName}/`
      ]

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`테이블 조회 시도: ${endpoint}`)
          const response = await this.api.get(endpoint)
          console.log(`테이블 조회 성공 (${endpoint}):`, response.data)
          
          const tables = response.data.result || response.data.tables || response.data || []
          if (Array.isArray(tables) && tables.length > 0) {
            return tables.map(table => ({
              name: table.name || table.table_name || table,
              type: table.type || table.table_type || 'table',
              schema: schemaName,
              rows: table.rows || table.table_rows || null,
              comment: table.comment || table.table_comment || ''
            }))
          }
        } catch (error) {
          console.log(`테이블 엔드포인트 실패 (${endpoint}): ${error.response?.status}`)
          continue
        }
      }
      
      // 2. SQL로 테이블 조회 시도
      return await this.getTablesSQL(databaseId, schemaName)
      
    } catch (error) {
      console.error('스키마 테이블 조회 오류:', error)
      throw error
    }
  }

  // 데이터베이스의 모든 테이블 조회 (추가 메서드)
  async getDatabaseTables(databaseId, schemaName = '') {
    try {
      console.log('데이터베이스 테이블 조회:', databaseId, schemaName)
      
      if (schemaName) {
        // 특정 스키마의 테이블 조회
        return await this.getDatabaseTablesInSchema(databaseId, schemaName)
      } else {
        // 모든 스키마의 테이블 조회
        const schemas = await this.getDatabaseSchemas(databaseId)
        const allTables = []
        
        for (const schema of schemas) {
          if (!['information_schema', 'performance_schema', 'mysql', 'sys'].includes(schema.toLowerCase())) {
            try {
              const schemaTables = await this.getDatabaseTablesInSchema(databaseId, schema)
              allTables.push(...schemaTables)
            } catch (schemaError) {
              console.log(`스키마 ${schema} 테이블 조회 실패:`, schemaError)
            }
          }
        }
        
        return allTables
      }
    } catch (error) {
      console.error('데이터베이스 테이블 조회 오류:', error)
      throw error
    }
  }

  // 테이블 메타데이터 조회 (추가 메서드)
  async getTableMetadata(databaseId, tableName, schemaName = '') {
    try {
      console.log('테이블 메타데이터 조회:', databaseId, tableName, schemaName)
      
      const url = schemaName 
        ? `/api/v1/database/${databaseId}/table/${tableName}/${schemaName}/`
        : `/api/v1/database/${databaseId}/table/${tableName}/`
      
      const response = await this.api.get(url)
      console.log('테이블 메타데이터 응답:', response.data)
      return response.data
      
    } catch (error) {
      console.error('테이블 메타데이터 조회 오류:', error)
      throw error
    }
  }

  // ===== 권한/보안 관련 메서드 =====
  
  // 사용자 정보 조회 (getUserInfo 메서드)
  async getUserInfo() {
    try {
      console.log('사용자 정보 조회 중...')
      const response = await this.api.get('/api/v1/me/')
      console.log('사용자 정보:', response.data)
      return response.data
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error)
      throw error
    }
  }

  // 사용자 목록 조회
  async getUsers() {
    try {
      console.log('사용자 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/users/')
      console.log('사용자 목록 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
      throw error
    }
  }

  // 역할 목록 조회
  async getRoles() {
    try {
      console.log('역할 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/roles/')
      console.log('역할 목록 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('역할 목록 조회 오류:', error)
      throw error
    }
  }

  // 권한 목록 조회
  async getPermissions() {
    try {
      console.log('권한 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/permissions/')
      console.log('권한 목록 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('권한 목록 조회 오류:', error)
      throw error
    }
  }

  // ===== 유틸리티 메서드 =====
  
  // 인증 상태 확인
  isAuthenticated() {
    const token = localStorage.getItem('superset_access_token')
    return !!token
  }

  // 토큰 조회
  getAuthToken() {
    return localStorage.getItem('superset_access_token')
  }

  // 사용자 권한 확인 (예시)
  async hasPermission(permission) {
    try {
      const user = await this.getCurrentUser()
      return user && user.permissions && user.permissions.includes(permission)
    } catch (error) {
      console.error('권한 확인 오류:', error)
      return false
    }
  }

  // API 스키마 확인을 위한 유틸리티 메서드들
  
  // 데이터셋 API 스키마 확인
  async getDatasetSchema() {
    try {
      console.log('데이터셋 API 스키마 확인 중...')
      const response = await this.api.get('/api/v1/dataset/_info')
      console.log('데이터셋 스키마:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 스키마 확인 오류:', error)
      return null
    }
  }
  
  // 현재 사용자 정보 확인
  async getCurrentUser() {
    try {
      console.log('현재 사용자 정보 확인 중...')
      const response = await this.api.get('/api/v1/me/')
      console.log('현재 사용자:', response.data)
      return response.data
    } catch (error) {
      console.error('사용자 정보 확인 오류:', error)
      return null
    }
  }
  
  // 권한 확인
  async checkPermissions() {
    try {
      console.log('권한 확인 중...')
      const response = await this.api.get('/api/v1/security/permissions')
      console.log('사용자 권한:', response.data)
      return response.data
    } catch (error) {
      console.error('권한 확인 오류:', error)
      return null
    }
  }
  
  // 간단한 데이터셋 생성 테스트
  async testDatasetCreation() {
    try {
      console.log('데이터셋 생성 테스트 시작...')
      
      // 스키마 확인
      const schema = await this.getDatasetSchema()
      if (schema && schema.add_columns) {
        console.log('데이터셋 생성 시 사용 가능한 필드:', Object.keys(schema.add_columns))
      }
      
      // 사용자 정보 확인
      const user = await this.getCurrentUser()
      if (user) {
        console.log('현재 사용자 권한:', user.roles)
      }
      
      return {
        schema: schema,
        user: user,
        canCreateDataset: user && user.roles && user.roles.some(role => 
          role.name === 'Admin' || role.name === 'Alpha' || role.name === 'sql_lab'
        )
      }
      
    } catch (error) {
      console.error('데이터셋 생성 테스트 오류:', error)
      return null
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const supersetAPI = new SupersetAPI()
export default supersetAPI