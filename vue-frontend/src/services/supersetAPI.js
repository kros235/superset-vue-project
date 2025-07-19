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

    // 🔥 핵심 수정: 요청 인터셉터에서 토큰 헤더 자동 추가
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

    // 🔥 개선된 응답 인터셉터 - 토큰 만료 시 자동 갱신
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
          console.error('응답 데이터:', error.response.data)
          console.error('응답 헤더:', error.response.headers)
          
          // 🔥 401 오류 시 토큰 갱신 시도
          if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            console.warn('🔄 인증 토큰 만료 - 갱신 시도')
            
            const refreshToken = localStorage.getItem('superset_refresh_token')
            if (refreshToken) {
              try {
                const refreshResponse = await this.refreshToken(refreshToken)
                if (refreshResponse.access_token) {
                  localStorage.setItem('superset_access_token', refreshResponse.access_token)
                  console.log('✅ 토큰 갱신 성공')
                  
                  // 원래 요청 재시도
                  originalRequest.headers.Authorization = `Bearer ${refreshResponse.access_token}`
                  return this.api(originalRequest)
                }
              } catch (refreshError) {
                console.error('❌ 토큰 갱신 실패:', refreshError)
                this.logout()
              }
            } else {
              console.warn('❌ 리프레시 토큰 없음 - 로그아웃 처리')
              this.logout()
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
        
        return response.data
      }
      
      throw new Error('토큰을 받지 못했습니다')
      
    } catch (error) {
      console.error('❌ 로그인 오류:', error)
      throw error
    }
  }

  // 🔥 토큰 갱신 메서드 추가
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

  // 🔥 개선된 현재 사용자 정보 조회
  async getCurrentUser() {
    try {
      console.log('현재 사용자 정보 확인 중...')
      
      // 🔥 토큰 존재 여부 먼저 확인
      const token = localStorage.getItem('superset_access_token')
      if (!token) {
        console.warn('⚠️ 인증 토큰이 없습니다')
        return null
      }
      
      console.log('🔑 토큰 확인됨:', token.substring(0, 20) + '...')
      
      // API에서 사용자 정보 조회 (토큰이 자동으로 헤더에 추가됨)
      const response = await this.api.get('/api/v1/me/')
      console.log('✅ 사용자 정보 API 응답:', response.data)
      
      if (response.data) {
        // 사용자 정보 로컬 스토리지에 저장
        localStorage.setItem('superset_user', JSON.stringify(response.data))
        return response.data
      }
      
      return null
      
    } catch (error) {
      console.error('❌ 사용자 정보 확인 오류:', error)
      
      // 401 오류가 아닌 경우에만 로컬 스토리지 확인
      if (error.response?.status !== 401) {
        const localUser = localStorage.getItem('superset_user')
        if (localUser) {
          try {
            const user = JSON.parse(localUser)
            console.log('📁 로컬 스토리지에서 사용자 정보 사용:', user)
            return user
          } catch (parseError) {
            console.warn('❌ 로컬 스토리지 사용자 정보 파싱 오류:', parseError)
          }
        }
      }
      
      return null
    }
  }

  // 🔥 개선된 로그아웃 메서드
  logout() {
    console.log('🚪 로그아웃 처리')
    
    // 모든 인증 관련 정보 제거
    localStorage.removeItem('superset_access_token')
    localStorage.removeItem('superset_refresh_token')
    localStorage.removeItem('superset_user')
    
    console.log('✅ 로그아웃 완료 - 모든 토큰 제거됨')
  }

  // 🔥 인증 상태 확인 메서드
  isAuthenticated() {
    const token = localStorage.getItem('superset_access_token')
    const hasToken = !!token
    console.log('🔐 인증 상태 확인:', hasToken ? '인증됨' : '인증되지 않음')
    return hasToken
  }

  // 토큰 조회
  getAuthToken() {
    return localStorage.getItem('superset_access_token')
  }

  // ===== 데이터베이스 관련 메서드 =====
  
  // 데이터베이스 목록 조회
  async getDatabases() {
    try {
      console.log('데이터베이스 목록 조회 중...')
      const response = await this.api.get('/api/v1/database/')
      console.log('데이터베이스 목록:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('데이터베이스 목록 조회 오류:', error)
      throw error
    }
  }

  // 데이터베이스 생성
  async createDatabase(databaseData) {
    try {
      console.log('데이터베이스 생성 중:', databaseData)
      const response = await this.api.post('/api/v1/database/', databaseData)
      console.log('데이터베이스 생성 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 생성 오류:', error)
      throw error
    }
  }

  // 데이터베이스 연결 테스트
  async testDatabaseConnection(connectionData) {
    try {
      console.log('데이터베이스 연결 테스트 중...')
      const response = await this.api.post('/api/v1/database/test_connection', connectionData)
      console.log('연결 테스트 결과:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터베이스 연결 테스트 오류:', error)
      throw error
    }
  }

  // ===== 데이터셋 관련 메서드 =====
  
  // 데이터셋 목록 조회
  async getDatasets() {
    try {
      console.log('데이터셋 목록 조회 중...')
      const response = await this.api.get('/api/v1/dataset/')
      console.log('데이터셋 목록:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('데이터셋 목록 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋 생성
  async createDataset(datasetData) {
    try {
      console.log('데이터셋 생성 중:', datasetData)
      const response = await this.api.post('/api/v1/dataset/', datasetData)
      console.log('데이터셋 생성 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('데이터셋 생성 오류:', error)
      throw error
    }
  }

  // 데이터셋 컬럼 정보 조회
  async getDatasetColumns(datasetId) {
    try {
      console.log(`데이터셋 ${datasetId} 컬럼 정보 조회 중...`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 상세 정보:', response.data)
      return response.data.result?.columns || []
    } catch (error) {
      console.error('데이터셋 컬럼 조회 오류:', error)
      throw error
    }
  }

  // 데이터셋 메트릭 정보 조회
  async getDatasetMetrics(datasetId) {
    try {
      console.log(`데이터셋 ${datasetId} 메트릭 정보 조회 중...`)
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`)
      console.log('데이터셋 메트릭 정보:', response.data)
      return response.data.result?.metrics || []
    } catch (error) {
      console.error('데이터셋 메트릭 조회 오류:', error)
      return [] // 메트릭은 선택사항이므로 빈 배열 반환
    }
  }

  // ===== 차트 관련 메서드 =====
  
  // 차트 목록 조회
  async getCharts() {
    try {
      console.log('차트 목록 조회 중...')
      const response = await this.api.get('/api/v1/chart/')
      console.log('차트 목록:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('차트 목록 조회 오류:', error)
      throw error
    }
  }

  // 차트 생성
  async createChart(chartData) {
    try {
      console.log('차트 생성 중:', chartData)
      const response = await this.api.post('/api/v1/chart/', chartData)
      console.log('차트 생성 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 생성 오류:', error)
      throw error
    }
  }

  // 차트 미리보기
  async previewChart(chartConfig) {
    try {
      console.log('차트 미리보기 생성 중:', chartConfig)
      
      // Superset 차트 데이터 API 호출
      const response = await this.api.post('/api/v1/chart/data', {
        datasource: {
          id: chartConfig.datasource_id,
          type: 'table'
        },
        queries: [{
          columns: chartConfig.params?.groupby || [],
          metrics: chartConfig.params?.metrics || ['count'],
          orderby: [],
          row_limit: chartConfig.params?.row_limit || 1000,
          time_range: chartConfig.params?.time_range || 'No filter',
          granularity: chartConfig.params?.granularity_sqla || null,
          extras: {
            having: '',
            where: ''
          }
        }]
      })
      
      console.log('차트 미리보기 데이터:', response.data)
      return response.data
    } catch (error) {
      console.error('차트 미리보기 오류:', error)
      throw error
    }
  }

  // ===== 대시보드 관련 메서드 =====
  
  // 대시보드 목록 조회
  async getDashboards() {
    try {
      console.log('대시보드 목록 조회 중...')
      const response = await this.api.get('/api/v1/dashboard/')
      console.log('대시보드 목록:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('대시보드 목록 조회 오류:', error)
      throw error
    }
  }

  // 대시보드 생성
  async createDashboard(dashboardData) {
    try {
      console.log('대시보드 생성 중:', dashboardData)
      const response = await this.api.post('/api/v1/dashboard/', dashboardData)
      console.log('대시보드 생성 성공:', response.data)
      return response.data
    } catch (error) {
      console.error('대시보드 생성 오류:', error)
      throw error
    }
  }

  // ===== 사용자 및 권한 관리 =====
  
  // 사용자 목록 조회
  async getUsers() {
    try {
      console.log('사용자 목록 조회 중...')
      const response = await this.api.get('/api/v1/security/users/')
      console.log('사용자 목록:', response.data)
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
      console.log('역할 목록:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('역할 목록 조회 오류:', error)
      throw error
    }
  }

  // 권한 목록 조회
  async getPermissions() {
    try {
      console.log('권한 목록 조회')
      const response = await this.api.get('/api/v1/security/permissions/')
      console.log('권한 목록 응답:', response.data)
      return response.data.result || []
    } catch (error) {
      console.error('권한 목록 조회 오류:', error)
      throw error
    }
  }

  // ===== SQL 실행 관련 =====
  
  // SQL 쿼리 실행
  async executeQuery(queryData) {
    try {
      console.log('SQL 쿼리 실행 중:', queryData)
      const response = await this.api.post('/api/v1/sqllab/execute/', queryData)
      console.log('쿼리 실행 결과:', response.data)
      return response.data
    } catch (error) {
      console.error('쿼리 실행 오류:', error)
      throw error
    }
  }

  // ===== 유틸리티 메서드 =====
  
  // 사용자 권한 확인
  async hasPermission(permission) {
    try {
      const user = await this.getCurrentUser()
      return user && user.permissions && user.permissions.includes(permission)
    } catch (error) {
      console.error('권한 확인 오류:', error)
      return false
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const supersetAPI = new SupersetAPI()
export default supersetAPI