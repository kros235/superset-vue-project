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

  // 1. 인증 관련
  async login(username, password) {
    try {
      console.log('로그인 시도:', { username })
      
      const response = await this.api.post('/api/v1/security/login', {
        username,
        password,
        provider: 'db',
        refresh: true
      })

      console.log('로그인 응답:', response.data)

      // 토큰 저장
      if (response.data.access_token) {
        localStorage.setItem('superset_access_token', response.data.access_token)
        console.log('Access token 저장됨')
      }

      if (response.data.refresh_token) {
        localStorage.setItem('superset_refresh_token', response.data.refresh_token)
        console.log('Refresh token 저장됨')
      }

      // CSRF 토큰 가져오기
      await this.getCSRFToken()

      return response.data
    } catch (error) {
      console.error('로그인 오류:', error.response?.data || error.message)
      throw error
    }
  }

  async getCSRFToken() {
    try {
      console.log('CSRF 토큰 요청 중...')
      const response = await this.api.get('/api/v1/security/csrf_token/')
      
      if (response.data?.result) {
        localStorage.setItem('superset_csrf_token', response.data.result)
        console.log('CSRF 토큰 저장됨')
        return response.data.result
      }
    } catch (error) {
      console.error('CSRF 토큰 오류:', error)
      // CSRF 토큰 실패해도 계속 진행
    }
  }

  async refreshAccessToken() {
    try {
      const refreshToken = localStorage.getItem('superset_refresh_token')
      if (!refreshToken) {
        throw new Error('Refresh token이 없습니다')
      }

      const response = await this.api.post('/api/v1/security/refresh', {
        refresh_token: refreshToken
      })

      if (response.data.access_token) {
        localStorage.setItem('superset_access_token', response.data.access_token)
      }

      return response.data.access_token
    } catch (error) {
      console.error('토큰 갱신 오류:', error)
      this.logout()
      throw error
    }
  }

  logout() {
    console.log('로그아웃 - 토큰 정리')
    localStorage.removeItem('superset_access_token')
    localStorage.removeItem('superset_refresh_token')
    localStorage.removeItem('superset_csrf_token')
  }

  isAuthenticated() {
    return !!localStorage.getItem('superset_access_token')
  }

  // 2. 데이터베이스 관련 (개선된 버전)
  async getDatabases() {
    try {
      console.log('데이터베이스 목록 조회 중...')
      
      // 더 상세한 정보를 가져오기 위해 쿼리 파라미터 추가
      const response = await this.api.get('/api/v1/database/', {
        params: {
          q: JSON.stringify({
            columns: [
              'id',
              'database_name', 
              'sqlalchemy_uri',
              'sqlalchemy_uri_decrypted',
              'expose_in_sqllab',
              'allow_ctas',
              'allow_cvas',
              'created_on',
              'changed_on',
              'created_by',
              'changed_by'
            ]
          })
        }
      })
      
      console.log('데이터베이스 응답:', response.data)
      
      const databases = response.data.result || []
      
      // 각 데이터베이스에 대해 상세 정보 조회 시도
      const enrichedDatabases = await Promise.all(
        databases.map(async (db) => {
          try {
            // 개별 데이터베이스 상세 정보 조회
            const detailResponse = await this.api.get(`/api/v1/database/${db.id}`)
            console.log(`데이터베이스 ${db.id} 상세 정보:`, detailResponse.data)
            
            return {
              ...db,
              ...detailResponse.data.result,
              // 다양한 URI 필드 중 사용 가능한 것 확인
              sqlalchemy_uri: detailResponse.data.result?.sqlalchemy_uri || 
                             detailResponse.data.result?.sqlalchemy_uri_decrypted ||
                             db.sqlalchemy_uri ||
                             db.sqlalchemy_uri_decrypted
            }
          } catch (detailError) {
            console.warn(`데이터베이스 ${db.id} 상세 정보 조회 실패:`, detailError)
            return db
          }
        })
      )
      
      console.log('강화된 데이터베이스 목록:', enrichedDatabases)
      return enrichedDatabases
      
    } catch (error) {
      console.error('데이터베이스 조회 오류:', error)
      
      // 기본 방법으로 폴백
      try {
        console.log('기본 방법으로 데이터베이스 조회 시도...')
        const fallbackResponse = await this.api.get('/api/v1/database/')
        console.log('폴백 응답:', fallbackResponse.data)
        return fallbackResponse.data.result || []
      } catch (fallbackError) {
        console.error('폴백 조회도 실패:', fallbackError)
        throw error
      }
    }
  }

 // 2-1. 데이터베이스 테이블 조회 (수정된 버전)
  async getDatabaseTables(databaseId, schemaName = null) {
    try {
      console.log('데이터베이스 테이블 조회:', { databaseId, schemaName })
      
      // 여러 가능한 엔드포인트 시도
      const possibleEndpoints = [
        `/api/v1/database/${databaseId}/table_metadata/`,
        `/api/v1/database/${databaseId}/tables/`,
        `/api/v1/database/${databaseId}/table/`,
        `/api/v1/database/${databaseId}/schema/${schemaName || ''}/table/`,
        `/superset/tables/${databaseId}/`,
        `/superset/tables/${databaseId}/${schemaName || 'null'}/`
      ]

      let lastError = null
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`테이블 조회 시도: ${endpoint}`)
          const response = await this.api.get(endpoint)
          console.log(`테이블 조회 성공 (${endpoint}):`, response.data)
          return response.data.result || response.data || []
        } catch (error) {
          console.log(`엔드포인트 실패 (${endpoint}): ${error.response?.status}`)
          lastError = error
          continue
        }
      }
      
      // 모든 엔드포인트 실패 시, 스키마 조회로 대체 시도
      console.log('테이블 조회 실패, 스키마 조회로 대체 시도...')
      try {
        const schemas = await this.getDatabaseSchemas(databaseId)
        console.log('스키마 조회 성공:', schemas)
        return schemas.map(schema => ({ name: schema, type: 'schema' }))
      } catch (schemaError) {
        console.error('스키마 조회도 실패:', schemaError)
        throw lastError
      }
      
    } catch (error) {
      console.error('테이블 조회 오류:', error)
      throw error
    }
  }

  // 2-2. 데이터베이스 스키마 조회 (수정된 버전)
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

  // 2-3. 데이터베이스 연결 상태 확인 (대안 방법)
  async checkDatabaseHealth(databaseId) {
    try {
      console.log('데이터베이스 헬스 체크:', databaseId)
      
      // 가능한 헬스 체크 엔드포인트들
      const healthEndpoints = [
        `/api/v1/database/${databaseId}/validate_parameters/`,
        `/api/v1/database/${databaseId}/`,
        `/api/v1/database/${databaseId}/connection/`,
        `/superset/validate_sql_json/`
      ]

      for (const endpoint of healthEndpoints) {
        try {
          console.log(`헬스 체크 시도: ${endpoint}`)
          const response = await this.api.get(endpoint)
          console.log(`헬스 체크 성공 (${endpoint}):`, response.data)
          return { success: true, data: response.data }
        } catch (error) {
          console.log(`헬스 체크 실패 (${endpoint}): ${error.response?.status}`)
          continue
        }
      }

      // SQL Lab에서 간단한 쿼리 실행으로 연결 확인
      try {
        console.log('SQL 실행으로 연결 확인 시도...')
        const sqlResult = await this.executeSQL({
          database_id: databaseId,
          sql: 'SELECT 1 as test_connection',
          schema: '',
          limit: 1
        })
        console.log('SQL 실행 성공:', sqlResult)
        return { success: true, data: sqlResult }
      } catch (sqlError) {
        console.error('SQL 실행도 실패:', sqlError)
        throw new Error('데이터베이스 연결 상태를 확인할 수 없습니다')
      }

    } catch (error) {
      console.error('데이터베이스 헬스 체크 오류:', error)
      throw error
    }
  }

  // 2-4. SQL Lab 실행 (기존에 있었지만 개선)
  async executeSQL(payload) {
    try {
      console.log('SQL 실행:', payload)
      
      const possibleEndpoints = [
        '/api/v1/sqllab/execute/',
        '/superset/sql_json/',
        '/api/v1/database/sql/'
      ]

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`SQL 실행 시도: ${endpoint}`)
          const response = await this.api.post(endpoint, payload)
          console.log(`SQL 실행 성공 (${endpoint}):`, response.data)
          return response.data
        } catch (error) {
          console.log(`SQL 엔드포인트 실패 (${endpoint}): ${error.response?.status}`)
          continue
        }
      }
      
      throw new Error('모든 SQL 실행 엔드포인트 실패')
    } catch (error) {
      console.error('SQL 실행 오류:', error)
      throw error
    }
  }

  // 2-5. 사용 가능한 API 엔드포인트 탐지
  async discoverAPIEndpoints() {
    try {
      console.log('API 엔드포인트 탐지 중...')
      
      // OpenAPI 스펙 조회 시도
      const specEndpoints = [
        '/api/v1/openapi.json',
        '/api/v1/_spec/',
        '/swagger.json',
        '/openapi.json'
      ]

      for (const endpoint of specEndpoints) {
        try {
          const response = await this.api.get(endpoint)
          console.log(`API 스펙 발견 (${endpoint}):`, response.data)
          
          // 데이터베이스 관련 엔드포인트 추출
          if (response.data.paths) {
            const dbEndpoints = Object.keys(response.data.paths)
              .filter(path => path.includes('database'))
            console.log('데이터베이스 관련 엔드포인트들:', dbEndpoints)
            return dbEndpoints
          }
        } catch (error) {
          console.log(`API 스펙 조회 실패 (${endpoint}): ${error.response?.status}`)
          continue
        }
      }

      return []
    } catch (error) {
      console.error('API 엔드포인트 탐지 오류:', error)
      return []
    }
  }

 // 2-6. 특정 스키마의 테이블 조회 (개선된 버전)
  async getDatabaseTablesInSchema(databaseId, schemaName) {
    try {
      console.log('스키마별 테이블 조회:', { databaseId, schemaName })
      
      // 다양한 API 엔드포인트 시도
      const possibleEndpoints = [
        `/api/v1/database/${databaseId}/table/?q=(filters:!((col:schema,opr:eq,value:'${schemaName}')))`,
        `/api/v1/database/${databaseId}/tables/?schema_name=${encodeURIComponent(schemaName)}`,
        `/api/v1/database/${databaseId}/table/${encodeURIComponent(schemaName)}/`,
        `/api/v1/database/${databaseId}/schema/${encodeURIComponent(schemaName)}/table/`,
        `/superset/tables/${databaseId}/${encodeURIComponent(schemaName)}/`
      ]

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`스키마별 테이블 조회 시도: ${endpoint}`)
          const response = await this.api.get(endpoint)
          console.log(`스키마별 테이블 조회 성공 (${endpoint}):`, response.data)
          
          const result = response.data.result || response.data || []
          if (Array.isArray(result) && result.length > 0) {
            return result
          }
        } catch (error) {
          console.log(`스키마별 테이블 엔드포인트 실패 (${endpoint}): ${error.response?.status}`)
          continue
        }
      }
      
      console.log('모든 API 엔드포인트 실패, SQL 직접 실행으로 폴백')
      throw new Error('API 엔드포인트로 테이블 조회 실패')
      
    } catch (error) {
      console.error('스키마별 테이블 조회 오류:', error)
      throw error
    }
  }

  // SQL Lab 실행 개선 (다양한 응답 형태 처리)
  async executeSQL(payload) {
    try {
      console.log('SQL 실행:', payload)
      
      // SQL Lab API 시도
      const sqlLabEndpoints = [
        '/api/v1/sqllab/execute/',
        '/superset/sql_json/',
        '/api/v1/sqllab/'
      ]
      
      for (const endpoint of sqlLabEndpoints) {
        try {
          console.log(`SQL 실행 시도: ${endpoint}`)
          
          // 엔드포인트별 페이로드 조정
          let requestPayload = { ...payload }
          
          if (endpoint.includes('sql_json')) {
            requestPayload = {
              database_id: payload.database_id,
              sql: payload.sql,
              schema: payload.schema || '',
              limit: payload.limit || 1000,
              select_as_cta: false,
              tmp_table_name: '',
              client_id: `client_${Date.now()}`
            }
          }
          
          console.log(`SQL 요청 페이로드 (${endpoint}):`, requestPayload)
          
          const response = await this.api.post(endpoint, requestPayload)
          console.log(`SQL 실행 성공 (${endpoint}):`, response.data)
          
          // 응답 데이터 정규화
          let normalizedData = null
          
          if (response.data.data) {
            normalizedData = response.data.data
          } else if (response.data.result) {
            normalizedData = response.data.result
          } else if (Array.isArray(response.data)) {
            normalizedData = response.data
          } else if (response.data.rows) {
            normalizedData = response.data.rows
          }
          
          if (normalizedData) {
            return {
              data: normalizedData,
              columns: response.data.columns || response.data.column_names || [],
              query: response.data.query || payload.sql,
              success: true
            }
          }
          
        } catch (sqlError) {
          console.log(`SQL 엔드포인트 실패 (${endpoint}): ${sqlError.response?.status}`, sqlError.message)
          continue
        }
      }
      
      throw new Error('모든 SQL 실행 엔드포인트 실패')
    } catch (error) {
      console.error('SQL 실행 오류:', error)
      throw error
    }
  }

  // 2-7. 테이블 정보 조회
  async getTableInfo(databaseId, tableName, schemaName = '') {
    try {
      console.log('테이블 정보 조회:', { databaseId, tableName, schemaName })
      
      const possibleEndpoints = [
        `/api/v1/database/${databaseId}/table_metadata/?table_name=${tableName}&schema_name=${schemaName}`,
        `/api/v1/database/${databaseId}/table/${tableName}/${schemaName}/`,
        `/api/v1/database/${databaseId}/table/${tableName}/`,
        `/superset/table/${databaseId}/${tableName}/${schemaName}/`
      ]

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`테이블 정보 조회 시도: ${endpoint}`)
          const response = await this.api.get(endpoint)
          console.log(`테이블 정보 조회 성공 (${endpoint}):`, response.data)
          return response.data.result || response.data
        } catch (error) {
          console.log(`테이블 정보 엔드포인트 실패 (${endpoint}): ${error.response?.status}`)
          continue
        }
      }
      
      // SQL로 테이블 구조 조회
      try {
        console.log('SQL로 테이블 구조 조회 시도...')
        const sqlResult = await this.executeSQL({
          database_id: databaseId,
          sql: `DESCRIBE ${schemaName ? `\`${schemaName}\`.` : ''}\`${tableName}\``,
          schema: schemaName || '',
          limit: 100
        })
        
        console.log('SQL로 테이블 구조 조회 성공:', sqlResult)
        return sqlResult
      } catch (sqlError) {
        console.error('SQL 테이블 구조 조회도 실패:', sqlError)
      }
      
      throw new Error('테이블 정보를 가져올 수 없습니다')
    } catch (error) {
      console.error('테이블 정보 조회 오류:', error)
      throw error
    }
  }

 // SQL을 사용한 테이블 조회
  async getTablesUsingSQL(databaseId, schemaName = null) {
    try {
      console.log('SQL로 테이블 조회:', { databaseId, schemaName })
      
      let sql = 'SHOW TABLES'
      if (schemaName && schemaName !== 'default') {
        sql = `SHOW TABLES FROM \`${schemaName}\``
      }
      
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
        // SHOW TABLES 결과에서 테이블명 추출
        const tableNames = result.data.map(row => {
          // row는 보통 { Tables_in_schema: "table_name" } 형태
          const values = Object.values(row)
          return values[0] // 첫 번째 값이 테이블명
        })
        
        console.log('추출된 테이블명들:', tableNames)
        return tableNames
      }
      
      return []
    } catch (error) {
      console.error('SQL 테이블 조회 오류:', error)
      throw error
    }
  }

  // 전체 데이터베이스 테이블 조회
  async getAllDatabaseTables(databaseId) {
    try {
      console.log('전체 데이터베이스 테이블 조회:', databaseId)
      
      // 방법 1: 기본 SQL 시도
      try {
        return await this.getTablesUsingSQL(databaseId)
      } catch (basicSQLError) {
        console.log('기본 SHOW TABLES 실패, 정보 스키마 조회 시도:', basicSQLError)
        
        // 방법 2: information_schema 쿼리
        try {
          const infoSchemaSQL = `
            SELECT table_name, table_schema 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name
          `
          
          const result = await this.executeSQL({
            database_id: databaseId,
            sql: infoSchemaSQL,
            schema: '',
            limit: 1000
          })
          
          if (result && result.data && Array.isArray(result.data)) {
            return result.data.map(row => ({
              name: row.table_name || row.TABLE_NAME,
              schema: row.table_schema || row.TABLE_SCHEMA || 'default'
            }))
          }
        } catch (infoSchemaError) {
          console.log('information_schema 조회도 실패:', infoSchemaError)
        }
      }
      
      return []
    } catch (error) {
      console.error('전체 데이터베이스 테이블 조회 오류:', error)
      throw error
    }
  }

  // 개선된 SQL 실행 (더 견고한 에러 처리)
  async executeSQL(payload) {
    try {
      console.log('SQL 실행 시도:', payload)
      
      // SQL Lab API 시도
      const sqlLabEndpoints = [
        '/api/v1/sqllab/execute/',
        '/superset/sql_json/',
        '/api/v1/database/sql/'
      ]

      let lastError = null
      
      for (const endpoint of sqlLabEndpoints) {
        try {
          console.log(`SQL 실행 엔드포인트 시도: ${endpoint}`)
          const response = await this.api.post(endpoint, payload)
          console.log(`SQL 실행 성공 (${endpoint}):`, response.data)
          
          // 응답 데이터 정규화
          if (response.data) {
            if (response.data.data) {
              return { data: response.data.data }
            } else if (response.data.result) {
              return { data: response.data.result }
            } else if (Array.isArray(response.data)) {
              return { data: response.data }
            } else {
              return response.data
            }
          }
          
          return response.data
        } catch (error) {
          console.log(`SQL 엔드포인트 실패 (${endpoint}): ${error.response?.status} - ${error.message}`)
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

  // 3. 개선된 데이터셋 생성
  async createDataset(payload) {
    try {
      console.log('데이터셋 생성:', payload)
      
      // 페이로드 검증 및 정리
      const cleanPayload = {
        database: parseInt(payload.database),
        schema: payload.schema || '',
        table_name: payload.table_name
      }
      
      // 빈 스키마 처리
      if (!cleanPayload.schema) {
        delete cleanPayload.schema
      }
      
      console.log('정리된 페이로드:', cleanPayload)
      
      const response = await this.api.post('/api/v1/dataset/', cleanPayload)
      console.log('데이터셋 생성 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 생성 오류:', error)
      console.error('오류 응답:', error.response?.data)
      throw error
    }
  }

  // SQL Lab 실행 개선
  async executeSQL(payload) {
    try {
      console.log('SQL 실행:', payload)
      
      // 기본 SQL Lab 엔드포인트 시도
      try {
        const response = await this.api.post('/api/v1/sqllab/execute/', payload)
        console.log('SQL Lab 실행 성공:', response.data)
        return response.data
      } catch (sqlLabError) {
        console.log('SQL Lab 실패, 대안 시도:', sqlLabError)
        
        // 대안 SQL 실행 엔드포인트
        const alternativePayload = {
          database_id: payload.database_id,
          sql: payload.sql,
          schema: payload.schema || '',
          limit: payload.limit || 1000
        }
        
        const altResponse = await this.api.post('/superset/sql_json/', alternativePayload)
        console.log('대안 SQL 실행 성공:', altResponse.data)
        return altResponse.data
      }
    } catch (error) {
      console.error('SQL 실행 오류:', error)
      throw error
    }
  }

  async testDatabaseConnection(payload) {
    try {
      console.log('데이터베이스 연결 테스트:', payload)
      
      const response = await this.api.post('/api/v1/database/test_connection/', payload)
      
      console.log('연결 테스트 응답:', response.data)
      
      if (response.status === 200) {
        return { success: true, message: response.data.message || 'Connection successful' }
      } else {
        return { success: false, message: response.data.message || 'Connection failed' }
      }
    } catch (error) {
      console.error('연결 테스트 오류:', error)
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Connection test failed'
      
      return { success: false, message: errorMessage }
    }
  }

  async createDatabase(payload) {
    try {
      console.log('데이터베이스 생성:', payload)
      const response = await this.api.post('/api/v1/database/', payload)
      console.log('데이터베이스 생성 응답:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 생성 오류:', error)
      throw error
    }
  }

  async updateDatabase(id, payload) {
    try {
      console.log('데이터베이스 업데이트:', id, payload)
      const response = await this.api.put(`/api/v1/database/${id}`, payload)
      return response.data
    } catch (error) {
      console.error('데이터베이스 업데이트 오류:', error)
      throw error
    }
  }

  async deleteDatabase(id) {
    try {
      console.log('데이터베이스 삭제:', id)
      const response = await this.api.delete(`/api/v1/database/${id}`)
      return response.data
    } catch (error) {
      console.error('데이터베이스 삭제 오류:', error)
      throw error
    }
  }

  // 3. 데이터셋 관련
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

  async createDataset(payload) {
    try {
      console.log('데이터셋 생성:', payload)
      const response = await this.api.post('/api/v1/dataset/', payload)
      return response.data
    } catch (error) {
      console.error('데이터셋 생성 오류:', error)
      throw error
    }
  }

  async updateDataset(id, payload) {
    try {
      console.log('데이터셋 업데이트:', id, payload)
      const response = await this.api.put(`/api/v1/dataset/${id}`, payload)
      return response.data
    } catch (error) {
      console.error('데이터셋 업데이트 오류:', error)
      throw error
    }
  }

  async deleteDataset(id) {
    try {
      console.log('데이터셋 삭제:', id)
      const response = await this.api.delete(`/api/v1/dataset/${id}`)
      return response.data
    } catch (error) {
      console.error('데이터셋 삭제 오류:', error)
      throw error
    }
  }

  // 4. 차트 관련
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

  async createChart(payload) {
    try {
      console.log('차트 생성:', payload)
      const response = await this.api.post('/api/v1/chart/', payload)
      return response.data
    } catch (error) {
      console.error('차트 생성 오류:', error)
      throw error
    }
  }

  async updateChart(id, payload) {
    try {
      console.log('차트 업데이트:', id, payload)
      const response = await this.api.put(`/api/v1/chart/${id}`, payload)
      return response.data
    } catch (error) {
      console.error('차트 업데이트 오류:', error)
      throw error
    }
  }

  async deleteChart(id) {
    try {
      console.log('차트 삭제:', id)
      const response = await this.api.delete(`/api/v1/chart/${id}`)
      return response.data
    } catch (error) {
      console.error('차트 삭제 오류:', error)
      throw error
    }
  }

  // 5. 대시보드 관련
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

  async createDashboard(payload) {
    try {
      console.log('대시보드 생성:', payload)
      const response = await this.api.post('/api/v1/dashboard/', payload)
      return response.data
    } catch (error) {
      console.error('대시보드 생성 오류:', error)
      throw error
    }
  }

  async updateDashboard(id, payload) {
    try {
      console.log('대시보드 업데이트:', id, payload)
      const response = await this.api.put(`/api/v1/dashboard/${id}`, payload)
      return response.data
    } catch (error) {
      console.error('대시보드 업데이트 오류:', error)
      throw error
    }
  }

  async deleteDashboard(id) {
    try {
      console.log('대시보드 삭제:', id)
      const response = await this.api.delete(`/api/v1/dashboard/${id}`)
      return response.data
    } catch (error) {
      console.error('대시보드 삭제 오류:', error)
      throw error
    }
  }

  // 6. 사용자 관리 관련
  async getUsers() {
    try {
      console.log('사용자 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/users/')
      console.log('사용자 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('사용자 조회 오류:', error)
      throw error
    }
  }

  async createUser(payload) {
    try {
      console.log('사용자 생성:', payload)
      const response = await this.api.post('/api/v1/security/users/', payload)
      return response.data
    } catch (error) {
      console.error('사용자 생성 오류:', error)
      throw error
    }
  }

  async updateUser(id, payload) {
    try {
      console.log('사용자 업데이트:', id, payload)
      const response = await this.api.put(`/api/v1/security/users/${id}`, payload)
      return response.data
    } catch (error) {
      console.error('사용자 업데이트 오류:', error)
      throw error
    }
  }

  async deleteUser(id) {
    try {
      console.log('사용자 삭제:', id)
      const response = await this.api.delete(`/api/v1/security/users/${id}`)
      return response.data
    } catch (error) {
      console.error('사용자 삭제 오류:', error)
      throw error
    }
  }

  // 7. 권한 관련
  async getRoles() {
    try {
      console.log('역할 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/roles/')
      return response.data.result || []
    } catch (error) {
      console.error('역할 조회 오류:', error)
      throw error
    }
  }

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

  // 8. 차트 데이터 조회
  async getChartData(id, formData) {
    try {
      console.log('차트 데이터 조회:', id, formData)
      const response = await this.api.post(`/api/v1/chart/data`, {
        datasource: {
          id: formData.datasource,
          type: 'table'
        },
        queries: [{
          ...formData
        }]
      })
      return response.data
    } catch (error) {
      console.error('차트 데이터 조회 오류:', error)
      throw error
    }
  }

  // 9. 테이블 메타데이터 조회
  async getTableMetadata(databaseId, tableName, schemaName = '') {
    try {
      console.log('테이블 메타데이터 조회:', { databaseId, tableName, schemaName })
      
      let url = `/api/v1/database/${databaseId}/table/${tableName}/`
      if (schemaName) {
        url += `${schemaName}/`
      }
      
      const response = await this.api.get(url)
      return response.data
    } catch (error) {
      console.error('테이블 메타데이터 조회 오류:', error)
      throw error
    }
  }

  // 10. SQL Lab 관련
  async executeSQL(payload) {
    try {
      console.log('SQL 실행:', payload)
      const response = await this.api.post('/api/v1/sqllab/execute/', payload)
      return response.data
    } catch (error) {
      console.error('SQL 실행 오류:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const supersetAPI = new SupersetAPI()
export default supersetAPI