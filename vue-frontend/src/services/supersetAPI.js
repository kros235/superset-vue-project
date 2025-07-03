// vue-frontend/src/services/supersetAPI.js
import axios from 'axios'

// 컨테이너 환경에 따른 URL 설정
const getBaseURL = () => {
  // 브라우저 환경에서는 localhost 사용
  if (typeof window !== 'undefined') {
    return process.env.VUE_APP_SUPERSET_URL || 'http://localhost:8088'
  }

  // Node.js 환경 (서버사이드)에서는 컨테이너 이름 사용
  return 'http://superset:8088'
}

class SupersetAPI {
  constructor () {
    // 프록시를 통한 API 호출 (상대 경로 사용)
    this.baseURL = '' // 프록시 사용시 빈 문자열

    console.log('Superset API Base URL:', this.baseURL || '프록시 사용')

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      },
      // CORS 설정
      withCredentials: false
    })

    // 요청 인터셉터
    this.api.interceptors.request.use(
      (config) => {
        console.log('API 요청:', config.method?.toUpperCase(), config.url, 'Base:', config.baseURL)

        const token = localStorage.getItem('superset_access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // CSRF 토큰이 있다면 추가
        const csrfToken = this.getCsrfToken()
        if (csrfToken) {
          config.headers['X-CSRFToken'] = csrfToken
        }

        return config
      },
      (error) => {
        console.error('요청 인터셉터 오류:', error)
        return Promise.reject(error)
      }
    )

    // 응답 인터셉터
    this.api.interceptors.response.use(
      (response) => {
        console.log('API 응답 성공:', response.status, response.config.url)
        return response
      },
      async (error) => {
        console.error('API 응답 오류:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          code: error.code
        })

        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('superset_refresh_token')
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken)
              localStorage.setItem('superset_access_token', response.access_token)

              // 원래 요청 재시도
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            console.error('토큰 갱신 실패:', refreshError)
            // 리프레시 토큰도 만료된 경우
            localStorage.removeItem('superset_access_token')
            localStorage.removeItem('superset_refresh_token')
            localStorage.removeItem('superset_user')
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // CSRF 토큰 가져오기
  getCsrfToken () {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    return token || localStorage.getItem('superset_csrf_token')
  }

  // CSRF 토큰 설정 - 간소화된 버전
  async setCsrfToken () {
    try {
      console.log('CSRF 토큰 요청 중...')
      const response = await axios.get('/api/v1/security/csrf_token/', {
        timeout: 10000
      })
      const csrfToken = response.data.result
      localStorage.setItem('superset_csrf_token', csrfToken)
      console.log('CSRF 토큰 설정 완료')
      return csrfToken
    } catch (error) {
      console.warn('CSRF 토큰 가져오기 실패 (선택사항):', error.message)
      return null
    }
  }

  // 인증 관련 API
  async login (username, password) {
    try {
      console.log('로그인 시도:', { username, baseURL: this.baseURL || '프록시 사용' })

      // CSRF 토큰 시도 (실패해도 계속 진행)
      try {
        await this.setCsrfToken()
      } catch (csrfError) {
        console.warn('CSRF 토큰 설정 건너뜀:', csrfError.message)
      }

      const response = await this.api.post('/api/v1/security/login', {
        username,
        password,
        provider: 'db',
        refresh: true
      })

      console.log('로그인 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('로그인 API 오류:', error)

      // 상세 오류 정보 로깅
      if (error.response) {
        console.error('HTTP 응답 오류:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url
        })
      } else if (error.request) {
        console.error('네트워크 요청 오류:', {
          message: error.message,
          code: error.code,
          url: error.config?.url
        })
      } else {
        console.error('설정 오류:', error.message)
      }

      throw error
    }
  }

  async logout () {
    try {
      await this.api.post('/api/v1/security/logout')
    } catch (error) {
      console.error('로그아웃 API 오류:', error)
      throw error
    }
  }

  async refreshToken (refreshToken) {
    try {
      const response = await this.api.post('/api/v1/security/refresh', {
        refresh_token: refreshToken
      })
      return response.data
    } catch (error) {
      console.error('토큰 갱신 오류:', error)
      throw error
    }
  }

  async getUserInfo () {
    try {
      const response = await this.api.get('/api/v1/me/')
      return response.data.result
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error)
      throw error
    }
  }

  // 차트 관련 API
  async getCharts () {
    try {
      const response = await this.api.get('/api/v1/chart/')
      return response.data.result || []
    } catch (error) {
      console.error('차트 목록 로드 오류:', error)
      return []
    }
  }

  async getChart (chartId) {
    try {
      const response = await this.api.get(`/api/v1/chart/${chartId}`)
      return response.data.result
    } catch (error) {
      console.error('차트 상세 정보 로드 오류:', error)
      throw error
    }
  }

  async createChart (chartData) {
    try {
      const response = await this.api.post('/api/v1/chart/', chartData)
      return response.data.result
    } catch (error) {
      console.error('차트 생성 오류:', error)
      throw error
    }
  }

  async updateChart (chartId, chartData) {
    try {
      const response = await this.api.put(`/api/v1/chart/${chartId}`, chartData)
      return response.data.result
    } catch (error) {
      console.error('차트 수정 오류:', error)
      throw error
    }
  }

  async deleteChart (chartId) {
    try {
      await this.api.delete(`/api/v1/chart/${chartId}`)
      return true
    } catch (error) {
      console.error('차트 삭제 오류:', error)
      throw error
    }
  }

  // 대시보드 관련 API
  async getDashboards () {
    try {
      const response = await this.api.get('/api/v1/dashboard/')
      return response.data.result || []
    } catch (error) {
      console.error('대시보드 목록 로드 오류:', error)
      return []
    }
  }

  async getDashboard (dashboardId) {
    try {
      const response = await this.api.get(`/api/v1/dashboard/${dashboardId}`)
      return response.data.result
    } catch (error) {
      console.error('대시보드 상세 정보 로드 오류:', error)
      throw error
    }
  }

  async createDashboard (dashboardData) {
    try {
      const response = await this.api.post('/api/v1/dashboard/', dashboardData)
      return response.data.result
    } catch (error) {
      console.error('대시보드 생성 오류:', error)
      throw error
    }
  }

  // 데이터셋 관련 API
  async getDatasets () {
    try {
      const response = await this.api.get('/api/v1/dataset/')
      return response.data.result || []
    } catch (error) {
      console.error('데이터셋 목록 로드 오류:', error)
      return []
    }
  }

  async getDataset (datasetId) {
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      return response.data.result
    } catch (error) {
      console.error('데이터셋 상세 정보 로드 오류:', error)
      throw error
    }
  }

  async getDatasetColumns (datasetId) {
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}/column`)
      return response.data.result || []
    } catch (error) {
      console.error('데이터셋 컬럼 로드 오류:', error)
      return []
    }
  }

  // 데이터베이스 관련 API
  async getDatabases () {
    try {
      const response = await this.api.get('/api/v1/database/')
      return response.data.result || []
    } catch (error) {
      console.error('데이터베이스 목록 로드 오류:', error)
      return []
    }
  }

  async testDatabaseConnection (connectionData) {
    try {
      const response = await this.api.post('/api/v1/database/test_connection', connectionData)
      return response.data
    } catch (error) {
      console.error('데이터베이스 연결 테스트 오류:', error)
      throw error
    }
  }

  // 사용자 관리 API
  async getUsers () {
    try {
      const response = await this.api.get('/api/v1/security/users/')
      return response.data.result || []
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error)
      return []
    }
  }

  async createUser (userData) {
    try {
      const response = await this.api.post('/api/v1/security/users/', userData)
      return response.data.result
    } catch (error) {
      console.error('사용자 생성 오류:', error)
      throw error
    }
  }

  async updateUser (userId, userData) {
    try {
      const response = await this.api.put(`/api/v1/security/users/${userId}`, userData)
      return response.data.result
    } catch (error) {
      console.error('사용자 수정 오류:', error)
      throw error
    }
  }

  async deleteUser (userId) {
    try {
      await this.api.delete(`/api/v1/security/users/${userId}`)
      return true
    } catch (error) {
      console.error('사용자 삭제 오류:', error)
      throw error
    }
  }

  async getRoles () {
    try {
      const response = await this.api.get('/api/v1/security/roles/')
      return response.data.result || []
    } catch (error) {
      console.error('역할 목록 로드 오류:', error)
      return []
    }
  }

  async getPermissions () {
    try {
      const response = await this.api.get('/api/v1/security/permissions/')
      return response.data.result || []
    } catch (error) {
      console.error('권한 목록 로드 오류:', error)
      return []
    }
  }

  // 데이터베이스 관리 API 추가
  async createDatabase (databaseData) {
    try {
      const response = await this.api.post('/api/v1/database/', databaseData)
      return response.data.result
    } catch (error) {
      console.error('데이터베이스 생성 오류:', error)
      throw error
    }
  }

  async updateDatabase (databaseId, databaseData) {
    try {
      const response = await this.api.put(`/api/v1/database/${databaseId}`, databaseData)
      return response.data.result
    } catch (error) {
      console.error('데이터베이스 수정 오류:', error)
      throw error
    }
  }

  async deleteDatabase (databaseId) {
    try {
      await this.api.delete(`/api/v1/database/${databaseId}`)
      return true
    } catch (error) {
      console.error('데이터베이스 삭제 오류:', error)
      throw error
    }
  }

  async createDataset (datasetData) {
    try {
      const response = await this.api.post('/api/v1/dataset/', datasetData)
      return response.data.result
    } catch (error) {
      console.error('데이터셋 생성 오류:', error)
      throw error
    }
  }

  async updateDataset (datasetId, datasetData) {
    try {
      const response = await this.api.put(`/api/v1/dataset/${datasetId}`, datasetData)
      return response.data.result
    } catch (error) {
      console.error('데이터셋 수정 오류:', error)
      throw error
    }
  }

  // 차트 데이터 조회 API
  async getChartData (chartId, formData = {}) {
    try {
      const response = await this.api.post('/api/v1/chart/data', {
        datasource: {
          id: formData.datasource_id,
          type: formData.datasource_type || 'table'
        },
        queries: [{
          ...formData,
          result_format: 'json',
          result_type: 'full'
        }]
      })
      return response.data.result[0]
    } catch (error) {
      console.error('차트 데이터 로드 오류:', error)
      throw error
    }
  }

  // 쿼리 실행 API
  async executeQuery (query) {
    try {
      const response = await this.api.post('/api/v1/sqllab/execute/', {
        sql: query.sql,
        database_id: query.database_id,
        schema: query.schema,
        runAsync: false
      })
      return response.data
    } catch (error) {
      console.error('쿼리 실행 오류:', error)
      throw error
    }
  }

  // CSV 업로드 API
  async uploadCSV (formData) {
    try {
      const response = await this.api.post('/api/v1/dataset/upload_csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('CSV 업로드 오류:', error)
      throw error
    }
  }

  // 메타데이터 관련 API
  async getVizTypes () {
    try {
      const response = await this.api.get('/api/v1/chart/viz_types')
      return response.data.result || []
    } catch (error) {
      console.error('시각화 타입 로드 오류:', error)
      return []
    }
  }

  async getFormData (sliceId) {
    try {
      const response = await this.api.get(`/api/v1/chart/${sliceId}/form_data`)
      return response.data.result
    } catch (error) {
      console.error('폼 데이터 로드 오류:', error)
      throw error
    }
  }

  // 헬스 체크
  async healthCheck () {
    try {
      const response = await this.api.get('/health')
      return response.data
    } catch (error) {
      console.error('헬스 체크 오류:', error)
      throw error
    }
  }
}

export default new SupersetAPI()
