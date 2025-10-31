// vue-frontend/src/services/supersetAPI.js
import axios from 'axios'
import rison from 'rison';  // 추가

class SupersetAPI {
  constructor() {
    // 🔥 Axios 인스턴스 설정 개선
    this.api = axios.create({
      baseURL: '',  // 프록시 사용을 위해 빈 문자열
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    // 🔥 요청 인터셉터 개선
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[API 요청] ${config.method?.toUpperCase()} ${config.url}`)
        
        // 🔥 저장된 토큰을 헤더에 자동 추가
        const token = localStorage.getItem('superset_access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('🔑 토큰 헤더 추가됨:', `Bearer ${token.substring(0, 20)}...`)
        } else {
          console.warn('⚠️ 토큰이 없습니다')
        }
        
        // 🔥 CSRF 토큰 추가 (있다면)
        const csrfToken = localStorage.getItem('superset_csrf_token')
        if (csrfToken) {
          config.headers['X-CSRFToken'] = csrfToken
          console.log('🔐 CSRF 토큰 추가됨')
        }
        
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

    // 🔥 응답 인터셉터 개선
    this.api.interceptors.response.use(
      (response) => {
        console.log(`[API 응답 성공] ${response.status} ${response.config.url}`)
        console.log('응답 데이터:', response.data)
        return response
      },
      async (error) => {
        const originalRequest = error.config
        
        console.error(`[API 응답 오류] ${error.response?.status || 'Network Error'} ${error.config?.url}:`)
        
        if (error.response) {
          console.error('응답 상태:', error.response.status)
          console.error('응답 헤더:', error.response.headers)
          console.error('응답 데이터:', error.response.data)
          
          // 🔥 401 오류 시 토큰 갱신 시도
          if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            
            const refreshToken = localStorage.getItem('superset_refresh_token')
            if (refreshToken) {
              try {
                console.log('🔄 토큰 갱신 시도...')
                const newToken = await this.refreshToken(refreshToken)
                if (newToken) {
                  localStorage.setItem('superset_access_token', newToken.access_token)
                  originalRequest.headers.Authorization = `Bearer ${newToken.access_token}`
                  return this.api(originalRequest)
                }
              } catch (refreshError) {
                console.error('토큰 갱신 실패:', refreshError)
                this.logout()
              }
            }
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

  // 🔥 Superset 연결 상태 확인
  async checkConnection() {
    try {
      console.log('Superset 연결 상태 확인 중...')
      const response = await this.api.get('/health')
      console.log('Superset 연결 성공:', response.status)
      return true
    } catch (error) {
      console.error('Superset 연결 실패:', error.message)
      return false
    }
  }

  // ===== 인증 관련 메서드 =====
  
  // 🔥 개선된 로그인 메서드
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
        // 🔥 토큰 저장 개선
        localStorage.setItem('superset_access_token', response.data.access_token)
        if (response.data.refresh_token) {
          localStorage.setItem('superset_refresh_token', response.data.refresh_token)
        }
        
        console.log('✅ 로그인 성공 - 토큰 저장됨')
        console.log('🔑 Access Token:', response.data.access_token.substring(0, 20) + '...')
        
        // CSRF 토큰 가져오기 시도
        try {
          await this.getCSRFToken()
        } catch (csrfError) {
          console.warn('CSRF 토큰 가져오기 실패 (계속 진행):', csrfError.message)
        }
        
        return response.data
      }
      
      throw new Error('토큰을 받지 못했습니다')
      
    } catch (error) {
      console.error('❌ 로그인 오류:', error)
      throw error
    }
  }

  // 🔥 CSRF 토큰 가져오기 (옵션)
  async getCSRFToken() {
    try {
      console.log('CSRF 토큰 요청 중...')
      const response = await this.api.get('/api/v1/security/csrf_token/')
      if (response.data.result) {
        localStorage.setItem('superset_csrf_token', response.data.result)
        console.log('✅ CSRF 토큰 저장됨')
        return response.data.result
      }
    } catch (error) {
      console.warn('CSRF 토큰 가져오기 실패:', error.message)
      // CSRF 토큰이 없어도 진행 가능하도록 오류를 던지지 않음
      return null
    }
  }

  // 🔥 토큰 갱신 메서드
  async refreshToken(refreshToken) {
    try {
      console.log('🔄 토큰 갱신 시도')
      const response = await this.api.post('/api/v1/security/refresh', {
        refresh_token: refreshToken
      })
      console.log('✅ 토큰 갱신 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ 토큰 갱신 실패:', error)
      throw error
    }
  }

  // 🔥 현재 사용자 정보 조회
  async getCurrentUser() {
    try {
      console.log('현재 사용자 정보 조회 중...')
      const response = await this.api.get('/api/v1/me/')
      console.log('사용자 정보:', response.data)
      return response.data
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error)
      throw error
    }
  }

  // 🔥 로그아웃
  logout() {
    console.log('로그아웃 처리 중...')
    localStorage.removeItem('superset_access_token')
    localStorage.removeItem('superset_refresh_token')
    localStorage.removeItem('superset_csrf_token')
    console.log('✅ 토큰 삭제 완료')
  }

  // 🔥 인증 상태 확인
  isAuthenticated() {
    const token = localStorage.getItem('superset_access_token')
    return !!token
  }

  // ===== 데이터베이스 관련 메서드 =====

  // 🔥 데이터베이스 목록 조회
  async getDatabases() {
    try {
      console.log('데이터베이스 목록 조회 중...')
      const response = await this.api.get('/api/v1/database/')
      console.log('데이터베이스 목록:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('데이터베이스 목록 조회 오류:', error)
      throw error
    }
  }

  // 🔥 데이터베이스 연결 테스트 - 개선된 버전
  async testDatabaseConnection(payload) {
    try {
      console.log('데이터베이스 연결 테스트 중...')
      console.log('테스트 페이로드:', payload)
      
      // URL 끝에 슬래시 추가하여 리다이렉트 방지
      const response = await this.api.post('/api/v1/database/test_connection/', payload)
      
      console.log('연결 테스트 응답:', response.data)
      
      // 응답 처리 개선
      if (response.data.message === 'OK' || response.status === 200) {
        return { 
          success: true, 
          message: '데이터베이스 연결 성공',
          data: response.data 
        }
      } else {
        return { 
          success: false, 
          message: response.data.message || '연결 테스트 실패',
          data: response.data 
        }
      }
    } catch (error) {
      console.error('데이터베이스 연결 테스트 오류:', error)
      console.error('오류 응답:', error.response?.data)
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || '연결 테스트 실패',
        error: error.response?.data || error.message
      }
    }
  }

  // 🔥 데이터베이스 생성
  async createDatabase(payload) {
    try {
      console.log('데이터베이스 생성 중...')
      console.log('생성 페이로드:', payload)
      
      const response = await this.api.post('/api/v1/database/', payload)
      console.log('데이터베이스 생성 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 생성 오류:', error)
      throw error
    }
  }

  // 🔥 데이터베이스 상세 조회
  async getDatabase(databaseId) {
    try {
      console.log(`데이터베이스 상세 조회: ${databaseId}`)
      const response = await this.api.get(`/api/v1/database/${databaseId}`)
      console.log('데이터베이스 상세 정보:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 상세 조회 오류:', error)
      throw error
    }
  }

  // ===== 데이터베이스 스키마 및 테이블 관련 메서드 =====

  // 🔥 데이터베이스 스키마 목록 조회
  async getDatabaseSchemas(databaseId) {
    try {
      console.log(`데이터베이스 스키마 목록 조회: ${databaseId}`)
      const response = await this.api.get(`/api/v1/database/${databaseId}/schemas/`)
      console.log('스키마 목록:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('스키마 목록 조회 오류:', error)
      throw error
    }
  }

  // 테이블 목록 조회 (Rison 형식 사용)
  async getDatabaseTables(databaseId, schemaName) {
    console.log('테이블 목록 조회: 데이터베이스', databaseId, '스키마', schemaName);
  
    try {
      // Rison 형식으로 쿼리 파라미터 인코딩
      const params = rison.encode({ schema_name: schemaName });
      const response = await this.api.get(`/api/v1/database/${databaseId}/tables/?q=${params}`);
    
      // 🔥 상세 로그 추가
      console.log('=== 테이블 API 응답 구조 분석 ===');
      console.log('전체 응답:', response.data);
      console.log('response.data.result:', response.data.result);
      console.log('response.data.options:', response.data.options);
      console.log('response.data 타입:', typeof response.data);
      console.log('===========================');
      
      return response.data;
    } catch (error) {
      console.error('테이블 목록 조회 오류:', error);
      throw error;
    }
  }

  // 🔥 테이블 컬럼 정보 조회
  async getTableColumns(databaseId, tableName, schemaName = null) {
    try {
      console.log(`테이블 컬럼 조회: ${tableName}`)
      
      const params = {
        table_name: tableName
      }
      if (schemaName) {
        params.schema_name = schemaName
      }
      
      const response = await this.api.get(`/api/v1/database/${databaseId}/table_metadata/`, {
        params
      })
      console.log('테이블 컬럼:', response.data)
      return response.data
    } catch (error) {
      console.error('테이블 컬럼 조회 오류:', error)
      throw error
    }
  }

  // 🔥 테이블 미리보기 데이터 조회
  async getTablePreview(databaseId, tableName, schemaName = null) {
    try {
      console.log(`테이블 미리보기: ${tableName}`)
      
      const payload = {
        table_name: tableName
      }
      if (schemaName) {
        payload.schema_name = schemaName
      }
      
      const response = await this.api.post(`/api/v1/database/${databaseId}/select_star/`, payload)
      console.log('테이블 미리보기:', response.data)
      return response.data
    } catch (error) {
      console.error('테이블 미리보기 오류:', error)
      throw error
    }
  }

  // ===== 데이터셋 관련 메서드 =====

  // 🔥 데이터셋 목록 조회
  async getDatasets() {
    try {
      console.log('데이터셋 목록 조회 중...')
      const response = await this.api.get('/api/v1/dataset/')
      console.log('데이터셋 목록:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('데이터셋 목록 조회 오류:', error)
      throw error
    }
  }

  // 🔥 데이터셋 생성 - 완전한 버전
  async createDataset(payload) {
    try {
      console.log('데이터셋 생성 중...')
      console.log('생성 페이로드:', payload)
      
      // 기본 필수 필드 검증
      const requiredFields = ['database', 'table_name']
      for (const field of requiredFields) {
        if (!payload[field]) {
          throw new Error(`필수 필드가 누락되었습니다: ${field}`)
        }
      }
      
      const response = await this.api.post('/api/v1/dataset/', payload)
      console.log('데이터셋 생성 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 생성 오류:', error)
      throw error
    }
  }

  // 🔥 데이터셋 상세 조회
  async getDataset(datasetId) {
    try {
      console.log(`데이터셋 상세 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 상세 정보:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 상세 조회 오류:', error)
      throw error
    }
  }

  // 🔥 데이터셋 컬럼 정보 조회
  async getDatasetColumns(datasetId) {
    try {
      console.log(`데이터셋 컬럼 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      
      // 데이터셋 상세 정보에서 컬럼 추출
      const dataset = response.data.result
      const columns = dataset.columns || []
      
      console.log('데이터셋 컬럼:', columns)
      return columns
    } catch (error) {
      console.error('데이터셋 컬럼 조회 오류:', error)
      
      // 백업 방법: 데이터베이스에서 직접 테이블 정보 조회
      try {
        console.log('백업 방법으로 테이블 메타데이터 조회 시도...')
        const dataset = await this.getDataset(datasetId)
        if (dataset.result?.database?.id && dataset.result?.table_name) {
          const tableInfo = await this.getTableColumns(
            dataset.result.database.id, 
            dataset.result.table_name, 
            dataset.result.schema
          )
          return tableInfo.columns || []
        }
      } catch (backupError) {
        console.error('백업 방법도 실패:', backupError)
      }
      
      throw error
    }
  }

  // 🔥 데이터셋 메트릭 조회
  async getDatasetMetrics(datasetId) {
    try {
      console.log(`데이터셋 메트릭 조회: ${datasetId}`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      
      // 데이터셋 상세 정보에서 메트릭 추출
      const dataset = response.data.result
      const metrics = dataset.metrics || []
      
      console.log('데이터셋 메트릭:', metrics)
      return metrics
    } catch (error) {
      console.error('데이터셋 메트릭 조회 오류:', error)
      // 메트릭이 없어도 기본 집계 함수는 사용 가능하므로 빈 배열 반환
      return []
    }
  }

  // 🔥 차트 미리보기 (null 필터링 추가)
  async previewChart(formData) {
    try {
      console.log('차트 미리보기 생성 중...')
      console.log('입력 폼 데이터:', formData)
      
      // 🔥 메트릭에서 null, undefined, 빈 문자열 제거
      const cleanMetrics = (formData.params.metrics || ['count'])
        .filter(m => m !== null && m !== undefined && m !== '')
      
      console.log('원본 메트릭:', formData.params.metrics)
      console.log('정제된 메트릭:', cleanMetrics)
      
      if (cleanMetrics.length === 0) {
        throw new Error('유효한 메트릭이 없습니다. 최소 하나의 메트릭을 선택해주세요.')
      }
      
      // Superset의 chart/data API 사용
      const payload = {
        datasource: {
          id: formData.datasource_id,
          type: 'table'
        },
        queries: [{
          annotation_layers: [],
          applied_time_extras: {},
          columns: formData.params.groupby || [],
          filters: formData.params.adhoc_filters || [],
          metrics: cleanMetrics, // 🔥 정제된 메트릭 사용
          orderby: [],
          row_limit: formData.params.row_limit || 10000,
          timeseries_limit: 0,
          order_desc: true,
          extras: {
            having: '',
            where: ''
          },
          time_range: formData.params.time_range || 'No filter'
        }],
        result_format: 'json',
        result_type: 'full'
      }
      
      console.log('API 요청 페이로드:', JSON.stringify(payload, null, 2))
      
      const response = await this.api.post('/api/v1/chart/data', payload)
      
      console.log('=== Superset API 응답 분석 ===')
      console.log('전체 응답:', response.data)
      console.log('result 구조:', response.data.result)
      
      // Superset 응답 구조 파싱
      if (response.data.result && response.data.result.length > 0) {
        const queryResult = response.data.result[0]
        
        console.log('쿼리 결과:', queryResult)
        console.log('실제 데이터:', queryResult.data)
        console.log('컬럼 정보:', queryResult.colnames)
        console.log('데이터 타입:', queryResult.coltypes)
        
        // 데이터 정규화
        const normalizedData = {
          data: queryResult.data || [],
          colnames: queryResult.colnames || [],
          coltypes: queryResult.coltypes || [],
          rowcount: queryResult.rowcount || 0,
          query: queryResult.query || '',
          status: response.data.status || 'success',
          from_dttm: queryResult.from_dttm,
          to_dttm: queryResult.to_dttm
        }
        
        console.log('✅ 정규화된 데이터:', normalizedData)
        return normalizedData
      }
      
      throw new Error('응답에 데이터가 없습니다')
      
    } catch (error) {
      console.error('차트 미리보기 상세 오류:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      })
      throw error
    }
  }

  // 🔥 대안: SQL Lab을 통한 미리보기 (수정됨)
  async previewChartViaSQL(datasetId, chartConfig) {
    try {
      console.log('SQL Lab을 통한 차트 미리보기 시작...')
      
      // 데이터셋 정보 조회
      const dataset = await this.getDataset(datasetId)
      const databaseId = dataset.result?.database?.id
      const tableName = dataset.result?.table_name
      const schemaName = dataset.result?.schema
      
      if (!databaseId || !tableName) {
        throw new Error('데이터셋 정보가 불완전합니다')
      }
      
      console.log('데이터셋 정보:', { databaseId, tableName, schemaName })
      
      // 🔥 메트릭 정제
      const rawMetrics = chartConfig.params?.metrics || ['count']
      const metrics = rawMetrics.filter(m => m !== null && m !== undefined && m !== '')
      
      if (metrics.length === 0) {
        metrics.push('count') // 기본값
      }
      
      const groupby = chartConfig.params?.groupby || []
      const rowLimit = chartConfig.params?.row_limit || 1000
      
      let sql = `SELECT `
      
      // GROUP BY 컬럼 추가
      if (groupby.length > 0) {
        sql += groupby.join(', ') + ', '
      }
      
      // 🔥 메트릭 SQL 생성 개선
      const metricClauses = metrics.map(metric => {
        if (metric === 'count') {
          return 'COUNT(*) as count'
        }
        
        // sum__컬럼명 형식 파싱
        const sumMatch = metric.match(/^sum__(.+)$/)
        if (sumMatch) {
          return `SUM(${sumMatch[1]}) as sum_${sumMatch[1]}`
        }
        
        // avg__컬럼명 형식 파싱
        const avgMatch = metric.match(/^avg__(.+)$/)
        if (avgMatch) {
          return `AVG(${avgMatch[1]}) as avg_${avgMatch[1]}`
        }
        
        // max__컬럼명 형식 파싱
        const maxMatch = metric.match(/^max__(.+)$/)
        if (maxMatch) {
          return `MAX(${maxMatch[1]}) as max_${maxMatch[1]}`
        }
        
        // min__컬럼명 형식 파싱
        const minMatch = metric.match(/^min__(.+)$/)
        if (minMatch) {
          return `MIN(${minMatch[1]}) as min_${minMatch[1]}`
        }
        
        // 기본: 그대로 사용
        return metric
      })
      
      sql += metricClauses.join(', ')
      
      // FROM 절
      sql += ` FROM ${schemaName ? schemaName + '.' : ''}${tableName}`
      
      // GROUP BY 절
      if (groupby.length > 0) {
        sql += ` GROUP BY ${groupby.join(', ')}`
      }
      
      // LIMIT 절
      sql += ` LIMIT ${rowLimit}`
      
      console.log('✅ 생성된 SQL:', sql)
      
      // SQL 실행
      const result = await this.executeSQL(databaseId, sql, schemaName)
      
      console.log('SQL 실행 결과:', result)
      return result
      
    } catch (error) {
      console.error('SQL 미리보기 오류:', error)
      throw error
    }
  }

  // 🔥 간단한 테스트용 미리보기 (수정됨)
  async simplePreview(datasetId, chartConfig) {
    try {
      console.log('간단한 미리보기 테스트 시작...')
      console.log('데이터셋 ID:', datasetId)
      console.log('차트 설정:', chartConfig)
      
      let actualRowCount = 642 // 기본값
      
      // 🔥 실제 데이터 조회 시도는 스킵하고 바로 모의 데이터 생성
      console.log('⚠️ 모의 데이터 모드 - 실제 API 호출 없이 샘플 데이터 생성')
      
      // 🔥 올바른 Superset 응답 구조로 모의 데이터 생성
      const groupbyColumn = chartConfig.params?.groupby?.[0] || 'category'
      
      const mockData = {
        // 🔥 Superset 응답 형식: 2차원 배열
        data: [
          ['SYSTEM', 642],
          ['/api/fb-insertbi/azure-info-insert-service.TStainerService', 2],
          ['/api/fb-insertbi/kdds.bizservice.TStainerService', 1],
          ['/api/fb-insertbi/R&BFRand BF-zztest-service.TStainerService', 1],
          ['/api/fb-insertbi/Rnb-kt-service.TStainerService', 1]
        ],
        colnames: [groupbyColumn, 'count'], // 🔥 컬럼명
        coltypes: [1, 0], // 🔥 1=문자열, 0=숫자
        rowcount: 5,
        query: `SELECT ${groupbyColumn}, COUNT(*) as count FROM table GROUP BY ${groupbyColumn} LIMIT 5`,
        status: 'success',
        from_dttm: null,
        to_dttm: null
      }
      
      console.log('✅ 생성된 모의 데이터 (Superset 형식):', mockData)
      return mockData
      
    } catch (error) {
      console.error('간단한 미리보기 오류:', error)
      
      // 🔥 오류 발생 시에도 기본 구조 제공
      return {
        data: [
          ['샘플 1', 100],
          ['샘플 2', 80],
          ['샘플 3', 60],
          ['샘플 4', 40],
          ['샘플 5', 20]
        ],
        colnames: ['name', 'value'],
        coltypes: [1, 0],
        rowcount: 5,
        query: 'SELECT name, COUNT(*) FROM table LIMIT 5',
        status: 'success'
      }
    }
  }

  // 🔥 데이터셋 삭제
  async deleteDataset(datasetId) {
    try {
      console.log(`데이터셋 삭제: ${datasetId}`)
      const response = await this.api.delete(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 삭제 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 삭제 오류:', error)
      throw error
    }
  }

  // ===== 테이블 관련 유틸리티 메서드 =====

  // 🔥 테이블 목록 조회 (기존 메서드와 호환성 유지)
  async getTables(databaseId, schemaName = null) {
    return this.getDatabaseTables(databaseId, schemaName)
  }

  // 🔥 데이터베이스 연결 정보 검증
  async validateDatabaseConnection(databaseId) {
    try {
      console.log(`데이터베이스 연결 검증: ${databaseId}`)
      const response = await this.api.get(`/api/v1/database/${databaseId}/validate_parameters/`)
      console.log('연결 검증 결과:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 연결 검증 오류:', error)
      throw error
    }
  }

  // ===== 차트 관련 메서드 - 확장 =====

  // 🔥 차트 목록 조회
  async getCharts() {
    try {
      console.log('차트 목록 조회 중...')
      const response = await this.api.get('/api/v1/chart/')
      console.log('차트 목록:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('차트 목록 조회 오류:', error)
      throw error
    }
  }

  // 🔥 차트 생성 - 완전한 버전
  async createChart(payload) {
    try {
      console.log('차트 생성 중...')
      console.log('생성 페이로드:', payload)
      
      // 기본 필수 필드 검증
      const requiredFields = ['slice_name', 'datasource_id', 'datasource_type', 'viz_type']
      for (const field of requiredFields) {
        if (!payload[field]) {
          throw new Error(`필수 필드가 누락되었습니다: ${field}`)
        }
      }
      
      const response = await this.api.post('/api/v1/chart/', payload)
      console.log('차트 생성 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 생성 오류:', error)
      throw error
    }
  }

  // 🔥 차트 상세 조회
  async getChart(chartId) {
    try {
      console.log(`차트 상세 조회: ${chartId}`)
      const response = await this.api.get(`/api/v1/chart/${chartId}`)
      console.log('차트 상세 정보:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 상세 조회 오류:', error)
      throw error
    }
  }

  // 🔥 차트 업데이트
  async updateChart(chartId, payload) {
    try {
      console.log(`차트 업데이트: ${chartId}`)
      console.log('업데이트 페이로드:', payload)
      
      const response = await this.api.put(`/api/v1/chart/${chartId}`, payload)
      console.log('차트 업데이트 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 업데이트 오류:', error)
      throw error
    }
  }

  // 🔥 차트 삭제
  async deleteChart(chartId) {
    try {
      console.log(`차트 삭제: ${chartId}`)
      const response = await this.api.delete(`/api/v1/chart/${chartId}`)
      console.log('차트 삭제 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 삭제 오류:', error)
      throw error
    }
  }

  // 🔥 차트 데이터 조회
  async getChartData(chartId, formData = {}) {
    try {
      console.log(`차트 데이터 조회: ${chartId}`)
      const response = await this.api.post(`/api/v1/chart/${chartId}/data/`, {
        form_data: formData
      })
      console.log('차트 데이터:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 데이터 조회 오류:', error)
      throw error
    }
  }

  // ===== 대시보드 관련 메서드 - 확장 =====

  // 🔥 대시보드 목록 조회
  async getDashboards() {
    try {
      console.log('대시보드 목록 조회 중...')
      const response = await this.api.get('/api/v1/dashboard/')
      console.log('대시보드 목록:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('대시보드 목록 조회 오류:', error)
      throw error
    }
  }

  // 🔥 대시보드 생성 - 완전한 버전
  async createDashboard(payload) {
    try {
      console.log('대시보드 생성 중...')
      console.log('생성 페이로드:', payload)
      
      // 기본 필수 필드 검증
      if (!payload.dashboard_title) {
        throw new Error('대시보드 제목이 필요합니다')
      }
      
      const response = await this.api.post('/api/v1/dashboard/', payload)
      console.log('대시보드 생성 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('대시보드 생성 오류:', error)
      throw error
    }
  }

  // 🔥 대시보드 상세 조회
  async getDashboard(dashboardId) {
    try {
      console.log(`대시보드 상세 조회: ${dashboardId}`)
      const response = await this.api.get(`/api/v1/dashboard/${dashboardId}`)
      console.log('대시보드 상세 정보:', response.data)
      return response.data
    } catch (error) {
      console.error('대시보드 상세 조회 오류:', error)
      throw error
    }
  }

  // 🔥 대시보드 업데이트
  async updateDashboard(dashboardId, payload) {
    try {
      console.log(`대시보드 업데이트: ${dashboardId}`)
      console.log('업데이트 페이로드:', payload)
      
      const response = await this.api.put(`/api/v1/dashboard/${dashboardId}`, payload)
      console.log('대시보드 업데이트 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('대시보드 업데이트 오류:', error)
      throw error
    }
  }

  // 🔥 대시보드 삭제
  async deleteDashboard(dashboardId) {
    try {
      console.log(`대시보드 삭제: ${dashboardId}`)
      const response = await this.api.delete(`/api/v1/dashboard/${dashboardId}`)
      console.log('대시보드 삭제 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('대시보드 삭제 오류:', error)
      throw error
    }
  }

  // 🔥 대시보드에 차트 추가
  async addChartToDashboard(dashboardId, chartId, position = {}) {
    try {
      console.log(`대시보드에 차트 추가: Dashboard ${dashboardId}, Chart ${chartId}`)
      
      // 먼저 현재 대시보드 정보를 가져옴
      const dashboard = await this.getDashboard(dashboardId)
      
      // position_json 업데이트
      const positionJson = dashboard.position_json || {}
      const newSliceId = `CHART-${chartId}`
      
      // 새 차트 위치 설정
      positionJson[newSliceId] = {
        children: [],
        id: newSliceId,
        meta: {
          chartId: chartId,
          height: position.height || 50,
          sliceName: position.sliceName || `Chart ${chartId}`,
          width: position.width || 4
        },
        type: "CHART"
      }
      
      const payload = {
        position_json: positionJson
      }
      
      const response = await this.updateDashboard(dashboardId, payload)
      console.log('대시보드에 차트 추가 성공:', response)
      return response
    } catch (error) {
      console.error('대시보드에 차트 추가 오류:', error)
      throw error
    }
  }

  // ===== SQL 실행 관련 메서드 =====

  // 🔥 SQL 쿼리 실행 (수정됨)
  async executeSQL(databaseId, sql, schemaName = null) {
    console.log('SQL 쿼리 실행 중...')
    console.log('데이터베이스 ID:', databaseId)
    console.log('SQL:', sql)
    console.log('스키마:', schemaName)
    
    if (!sql || sql === 'undefined') {
      throw new Error('SQL 쿼리가 유효하지 않습니다')
    }
    
    const payload = {
      database_id: databaseId, // 🔥 객체가 아닌 숫자 ID
      sql: sql,
      schema: schemaName || undefined, // null 대신 undefined
      limit: 1000,
      select_as_cta: false,
      tmp_table_name: '',
      client_id: `client_${Date.now()}`,
    }

    console.log('✅ 쿼리 페이로드:', payload)

    try {
      const response = await this.api.post('/api/v1/sqllab/execute/', payload)
      
      console.log('✅ SQL 실행 결과:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ SQL 실행 오류:', error)
      console.error('오류 응답:', error.response?.data)
      throw error
    }
  }

  // ===== 사용자 및 권한 관리 =====

  // 🔥 사용자 목록 조회
  async getUsers() {
    try {
      console.log('사용자 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/users/')
      console.log('사용자 목록:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
      throw error
    }
  }

  // 🔥 역할 목록 조회
  async getRoles() {
    try {
      console.log('역할 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/roles/')
      console.log('역할 목록:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('역할 목록 조회 오류:', error)
      throw error
    }
  }

  // 🔥 권한 목록 조회
  async getPermissions() {
    try {
      console.log('권한 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/permissions/')
      console.log('권한 목록:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('권한 목록 조회 오류:', error)
      throw error
    }
  }

  // ===== 유틸리티 및 메타데이터 메서드 =====

  // 🔥 사용 가능한 차트 타입 조회
  async getAvailableChartTypes() {
    try {
      console.log('사용 가능한 차트 타입 조회 중...')
      
      // Superset에서 지원하는 기본 차트 타입들
      const chartTypes = [
        { key: 'table', name: '테이블', category: 'Table' },
        { key: 'big_number', name: '큰 숫자', category: 'Number' },
        { key: 'big_number_total', name: '총합 큰 숫자', category: 'Number' },
        { key: 'line', name: '선 차트', category: 'Evolution' },
        { key: 'bar', name: '막대 차트', category: 'Ranking' },
        { key: 'area', name: '영역 차트', category: 'Evolution' },
        { key: 'pie', name: '파이 차트', category: 'Part of a Whole' },
        { key: 'dist_bar', name: '분포 막대 차트', category: 'Distribution' },
        { key: 'histogram', name: '히스토그램', category: 'Distribution' },
        { key: 'box_plot', name: '박스 플롯', category: 'Distribution' },
        { key: 'scatter', name: '산점도', category: 'Correlation' },
        { key: 'bubble', name: '버블 차트', category: 'Correlation' },
        { key: 'heatmap', name: '히트맵', category: 'Correlation' },
        { key: 'world_map', name: '세계 지도', category: 'Map' },
        { key: 'country_map', name: '국가 지도', category: 'Map' }
      ]
      
      console.log('사용 가능한 차트 타입:', chartTypes)
      return chartTypes
    } catch (error) {
      console.error('차트 타입 조회 오류:', error)
      throw error
    }
  }

  // 🔥 데이터베이스 기능 조회
  async getDatabaseFunctions(databaseId) {
    try {
      console.log(`데이터베이스 기능 조회: ${databaseId}`)
      const response = await this.api.get(`/api/v1/database/${databaseId}/function_names/`)
      console.log('데이터베이스 기능:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('데이터베이스 기능 조회 오류:', error)
      throw error
    }
  }

  // 🔥 차트 데이터 새로고침
  async refreshChartData(chartId, force = false) {
    try {
      console.log(`차트 데이터 새로고침: ${chartId}`)
      const response = await this.api.post(`/api/v1/chart/${chartId}/cache/`, {
        force: force
      })
      console.log('차트 데이터 새로고침 완료:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 데이터 새로고침 오류:', error)
      throw error
    }
  }

  // 🔥 API 상태 확인
  async getApiInfo() {
    try {
      console.log('API 정보 조회 중...')
      const response = await this.api.get('/api/v1/openapi.json')
      console.log('API 정보:', response.data.info)
      return response.data
    } catch (error) {
      console.error('API 정보 조회 오류:', error)
      throw error
    }
  }

  // 🔥 서버 상태 확인
  async getHealth() {
    try {
      console.log('서버 상태 확인 중...')
      const response = await this.api.get('/health')
      console.log('서버 상태:', response.data)
      return response.data
    } catch (error) {
      console.error('서버 상태 확인 오류:', error)
      throw error
    }
  }

  // 🔥 현재 사용자의 즐겨찾기 조회
  async getUserFavorites() {
    try {
      console.log('사용자 즐겨찾기 조회 중...')
      const response = await this.api.get('/api/v1/me/favorites/')
      console.log('사용자 즐겨찾기:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('사용자 즐겨찾기 조회 오류:', error)
      throw error
    }
  }

  // 🔥 즐겨찾기 추가/제거
  async toggleFavorite(objectType, objectId) {
    try {
      console.log(`즐겨찾기 토글: ${objectType} ${objectId}`)
      const response = await this.api.post('/api/v1/me/favorites/', {
        object_type: objectType,
        object_id: objectId
      })
      console.log('즐겨찾기 토글 결과:', response.data)
      return response.data
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error)
      throw error
    }
  }

  // 🔥 최근 활동 조회
  async getRecentActivity() {
    try {
      console.log('최근 활동 조회 중...')
      const response = await this.api.get('/api/v1/log/')
      console.log('최근 활동:', response.data.result)
      return response.data.result
    } catch (error) {
      console.error('최근 활동 조회 오류:', error)
      throw error
    }
  }

  // ===== 차트 메타데이터 및 스키마 조회 =====

  // 🔥 특정 차트 타입의 옵션 스키마 조회
  async getChartFormData(vizType) {
    try {
      console.log(`차트 타입 "${vizType}"의 폼 데이터 조회 중...`)
      
      // Superset의 viz_types 엔드포인트를 통해 차트 메타데이터 조회
      const response = await this.api.get(`/api/v1/chart/form_data`, {
        params: { viz_type: vizType }
      })
      
      console.log(`"${vizType}" 차트 폼 데이터:`, response.data)
      return response.data
    } catch (error) {
      console.error(`차트 폼 데이터 조회 오류 (${vizType}):`, error)
      
      // API 엔드포인트가 없을 경우 대체 방법: /superset/explore_json/ 활용
      try {
        const exploreResponse = await this.api.get('/superset/explore_json/', {
          params: {
            form_data: JSON.stringify({ viz_type: vizType }),
            force: 'false'
          }
        })
        console.log(`Explore JSON을 통한 폼 데이터:`, exploreResponse.data)
        return exploreResponse.data
      } catch (secondError) {
        console.error('대체 방법도 실패:', secondError)
        throw error
      }
    }
  }

  // 🔥 모든 사용 가능한 차트 타입과 해당 옵션 조회
  async getAllChartSchemas() {
    try {
      console.log('모든 차트 스키마 조회 중...')
      
      const chartTypes = await this.getAvailableChartTypes()
      const schemas = {}
      
      // 각 차트 타입에 대한 스키마 조회
      for (const chartType of chartTypes) {
        try {
          schemas[chartType.key] = await this.getChartFormData(chartType.key)
        } catch (error) {
          console.warn(`"${chartType.key}" 스키마 조회 실패, 기본값 사용`)
          schemas[chartType.key] = null
        }
      }
      
      console.log('모든 차트 스키마:', schemas)
      return schemas
    } catch (error) {
      console.error('차트 스키마 조회 오류:', error)
      throw error
    }
  }

  // 🔥 차트 타입별 컨트롤(옵션) 정보 조회
  async getChartControls(vizType) {
    try {
      console.log(`"${vizType}" 차트 컨트롤 정보 조회 중...`)
      
      // Superset의 Viz Plugin API 활용
      const response = await this.api.get('/api/v1/chart/viz_types')
      
      if (response.data && response.data.result) {
        const vizInfo = response.data.result.find(v => v.key === vizType)
        if (vizInfo && vizInfo.controls) {
          console.log(`"${vizType}" 컨트롤 정보:`, vizInfo.controls)
          return vizInfo.controls
        }
      }
      
      console.warn(`"${vizType}" 컨트롤 정보를 찾을 수 없습니다`)
      return null
    } catch (error) {
      console.error(`차트 컨트롤 조회 오류 (${vizType}):`, error)
      return null
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const supersetAPI = new SupersetAPI()
export default supersetAPI