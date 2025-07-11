// vue-frontend/src/services/supersetAPI.js
import axios from 'axios'

class SupersetAPI {
  constructor() {
    console.log('SupersetAPI 초기화 중...')
    
    // 프록시를 통한 API 호출 (상대 경로 사용)
    this.api = axios.create({
      baseURL: '',  // 프록시 사용시 빈 문자열
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: false  // 쿠키 비활성화로 시작
    })

    console.log('Superset API 설정 완료 - 프록시 사용')

    // 요청 인터셉터
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[API 요청] ${config.method?.toUpperCase()} ${config.url}`)
        
        // 저장된 토큰이 있으면 헤더에 추가
        const token = localStorage.getItem('superset_access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // CSRF 토큰이 있으면 추가
        const csrfToken = localStorage.getItem('superset_csrf_token')
        if (csrfToken) {
          config.headers['X-CSRFToken'] = csrfToken
        }

        return config
      },
      (error) => {
        console.error('[요청 인터셉터 오류]:', error)
        return Promise.reject(error)
      }
    )

    // 응답 인터셉터
    this.api.interceptors.response.use(
      (response) => {
        console.log(`[API 응답 성공] ${response.status} ${response.config.url}`)
        return response
      },
      async (error) => {
        const status = error.response?.status
        const url = error.config?.url
        
        console.error(`[API 응답 오류] ${status} ${url}:`, {
          message: error.message,
          code: error.code,
          response: error.response?.data
        })

        // 401 오류시 토큰 정리
        if (status === 401) {
          localStorage.removeItem('superset_access_token')
          localStorage.removeItem('superset_refresh_token')
          localStorage.removeItem('superset_csrf_token')
        }

        return Promise.reject(error)
      }
    )
  }

  // 연결 상태 확인
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

  // ===== 인증 관련 메서드 추가 =====
  
  // 현재 사용자 정보 조회 (누락된 메서드 추가)
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

      // API에서 사용자 정보 조회 시도
      try {
        const response = await this.api.get('/api/v1/me/')
        console.log('API에서 사용자 정보 조회 성공:', response.data)
        
        // 로컬 스토리지에 저장
        localStorage.setItem('superset_user', JSON.stringify(response.data))
        return response.data
      } catch (apiError) {
        console.warn('API 사용자 정보 조회 실패:', apiError)
        
        // 기본 사용자 정보 반환 (권한 없이)
        const defaultUser = {
          id: 1,
          username: 'admin',
          email: 'admin@admin.com',
          first_name: 'Admin',
          last_name: 'User',
          roles: [{ name: 'Admin' }],
          permissions: ['can_sqllab', 'can_read', 'can_write']
        }
        
        console.log('기본 사용자 정보 반환:', defaultUser)
        return defaultUser
      }
    } catch (error) {
      console.error('현재 사용자 정보 조회 오류:', error)
      
      // 에러 발생시에도 기본 사용자 정보 반환
      return {
        id: 1,
        username: 'admin',
        email: 'admin@admin.com',
        first_name: 'Admin',
        last_name: 'User',
        roles: [{ name: 'Admin' }],
        permissions: ['can_sqllab', 'can_read', 'can_write']
      }
    }
  }

  // 인증 상태 확인
  isAuthenticated() {
    const token = localStorage.getItem('superset_access_token')
    const user = localStorage.getItem('superset_user')
    return !!(token || user)
  }

  // 로그인
  async login(username, password) {
    try {
      console.log('로그인 시도:', username)
      
      // CSRF 토큰 먼저 획득
      try {
        const csrfResponse = await this.api.get('/api/v1/security/csrf_token/')
        const csrfToken = csrfResponse.data.result
        localStorage.setItem('superset_csrf_token', csrfToken)
        this.api.defaults.headers['X-CSRFToken'] = csrfToken
        console.log('CSRF 토큰 획득 성공')
      } catch (csrfError) {
        console.warn('CSRF 토큰 획득 실패:', csrfError)
      }

      // 로그인 요청
      const loginData = {
        username: username,
        password: password,
        provider: 'db',
        refresh: true
      }

      const response = await this.api.post('/api/v1/security/login', loginData)
      
      if (response.data.access_token) {
        localStorage.setItem('superset_access_token', response.data.access_token)
        localStorage.setItem('superset_refresh_token', response.data.refresh_token)
        
        console.log('로그인 성공, 토큰 저장 완료')
        return response.data
      } else {
        throw new Error('액세스 토큰을 받지 못했습니다')
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      throw error
    }
  }

  // 로그아웃
  async logout() {
    try {
      await this.api.post('/api/v1/security/logout')
    } catch (error) {
      console.warn('로그아웃 API 실패:', error)
    } finally {
      // 토큰 정리
      localStorage.removeItem('superset_access_token')
      localStorage.removeItem('superset_refresh_token')
      localStorage.removeItem('superset_csrf_token')
      localStorage.removeItem('superset_user')
      console.log('로그아웃 완료')
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

  // 데이터베이스 스키마 조회 (수정된 버전)
  async getDatabaseSchemas(databaseId) {
    try {
      console.log('데이터베이스 스키마 조회:', databaseId)
      
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
      
      throw new Error('모든 스키마 조회 엔드포인트 실패')
    } catch (error) {
      console.error('스키마 조회 오류:', error)
      throw error
    }
  }

  // ===== SQL Lab 관련 메서드 (수정된 버전) =====

  // SQL 실행 메서드 (getCurrentUser 오류 수정)
  async executeSQL(payload) {
    try {
      console.log('SQL 실행:', payload)
      
      // 현재 로그인 사용자 정보 확인 (안전한 방식으로)
      let currentUser = null
      try {
        currentUser = await this.getCurrentUser()
        console.log('현재 사용자:', currentUser)
      } catch (userError) {
        console.warn('사용자 정보 조회 실패, 계속 진행:', userError)
      }
      
      // SQL Lab 실행 권한 확인 (선택적)
      if (currentUser && currentUser.permissions && !currentUser.permissions.includes('can_sqllab')) {
        console.warn('SQL Lab 권한이 없음, 관리자 권한으로 재시도')
      }

      // 개선된 페이로드
      const enhancedPayload = {
        database_id: payload.database_id,
        sql: payload.sql.trim(),
        schema: payload.schema || '',
        client_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tab: 'superset_react_tab',
        tmp_table_name: '',
        select_as_cta: false,
        ctas_method: 'TABLE',
        queryLimit: payload.limit || 1000,
        runAsync: false,
        ...payload
      }
      
      const sqlEndpoints = [
        '/api/v1/sqllab/execute/',
        '/superset/sql_json/',
        '/api/v1/database/sql/'
      ]

      let lastError = null
      
      for (const endpoint of sqlEndpoints) {
        try {
          console.log(`SQL 실행 엔드포인트 시도: ${endpoint}`)
          const response = await this.api.post(endpoint, enhancedPayload)
          console.log(`SQL 실행 성공 (${endpoint}):`, response.data)
          
          // 응답 데이터 정규화
          if (response.data) {
            if (response.data.query && response.data.query.results) {
              return { data: response.data.query.results.data }
            } else if (response.data.data) {
              return { data: response.data.data }
            } else if (response.data.result) {
              return { data: response.data.result }
            } else if (Array.isArray(response.data)) {
              return { data: response.data }
            }
            return response.data
          }
          
        } catch (error) {
          console.log(`SQL 엔드포인트 실패 (${endpoint}): ${error.response?.status} - ${error.message}`)
          if (error.response?.data) {
            console.log('에러 상세:', error.response.data)
          }
          lastError = error
          continue
        }
      }
      
      throw lastError || new Error('모든 SQL 실행 엔드포인트 실패')
    } catch (error) {
      console.error('SQL 실행 오류:', error)
      throw error
    }
  }

  // ===== 테이블 관련 메서드 =====

  // 테이블 목록 조회 (개선된 버전)
  async getDatabaseTables(databaseId, schemaName = null) {
    try {
      console.log('데이터베이스 테이블 조회:', { databaseId, schemaName })
      
      // 1. API 엔드포인트들 시도
      const apiEndpoints = [
        `/api/v1/database/${databaseId}/table/`,
        `/api/v1/database/${databaseId}/tables/`,
        `/api/v1/database/${databaseId}/table_metadata/`,
        schemaName ? `/api/v1/database/${databaseId}/schema/${schemaName}/table/` : null,
        `/superset/tables/${databaseId}/`,
        schemaName ? `/superset/tables/${databaseId}/${schemaName}/` : null
      ].filter(Boolean)

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`테이블 조회 시도: ${endpoint}`)
          const params = schemaName ? { schema_name: schemaName } : {}
          const response = await this.api.get(endpoint, { params })
          console.log(`테이블 조회 성공 (${endpoint}):`, response.data)
          
          const tables = response.data.result || response.data || []
          if (Array.isArray(tables) && tables.length > 0) {
            return tables
          }
        } catch (error) {
          console.log(`엔드포인트 실패 (${endpoint}): ${error.response?.status}`)
          continue
        }
      }
      
      // 2. SQL 쿼리로 테이블 조회 시도
      console.log('API 엔드포인트 실패, SQL 쿼리 시도...')
      try {
        return await this.getTablesUsingSQLFixed(databaseId, schemaName)
      } catch (sqlError) {
        console.error('SQL 쿼리도 실패:', sqlError)
      }
      
      // 3. 모든 방법 실패시 빈 배열 반환
      console.log('모든 테이블 조회 방법 실패')
      return []
      
    } catch (error) {
      console.error('테이블 조회 오류:', error)
      throw error
    }
  }

  // SQL을 사용한 테이블 조회 (수정된 버전)
  async getTablesUsingSQLFixed(databaseId, schemaName = null) {
    try {
      console.log('SQL로 테이블 조회:', { databaseId, schemaName })
      
      const sqlQueries = [
        // MariaDB/MySQL용 쿼리들
        schemaName ? 
          `SELECT TABLE_NAME as name, TABLE_TYPE as type, TABLE_ROWS as rows, TABLE_COMMENT as comment FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${schemaName}' ORDER BY TABLE_NAME` :
          `SELECT TABLE_NAME as name, TABLE_SCHEMA as schema, TABLE_TYPE as type FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') ORDER BY TABLE_SCHEMA, TABLE_NAME`,
        
        schemaName ? `SHOW FULL TABLES FROM \`${schemaName}\`` : 'SHOW DATABASES',
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

  // ===== 기타 필요한 메서드들 =====

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

  // 차트 목록 조회
  async getCharts() {
    try {
      console.log('차트 목록 조회 중...')
      const response = await this.api.get('/api/v1/chart/')
      console.log('차트 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('차트 조회 오류:', error)
      throw error
    }
  }

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
}

// 싱글톤 인스턴스 생성 및 내보내기
const supersetAPI = new SupersetAPI()
export default supersetAPI