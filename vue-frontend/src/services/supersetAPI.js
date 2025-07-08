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

  // 2. 데이터베이스 관련
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