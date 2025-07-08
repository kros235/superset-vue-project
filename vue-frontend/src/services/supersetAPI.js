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
      console.log('✓ Superset 연결 성공')
      return { success: true, status: response.status }
    } catch (error) {
      console.error('✗ Superset 연결 실패:', {
        message: error.message,
        code: error.code,
        response: error.response?.status
      })
      return { 
        success: false, 
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status
        }
      }
    }
  }

  // CSRF 토큰 획득 (선택사항)
  async getCsrfToken() {
    try {
      console.log('CSRF 토큰 요청 중...')
      const response = await this.api.get('/api/v1/security/csrf_token/', {
        timeout: 10000
      })
      
      const csrfToken = response.data.result
      localStorage.setItem('superset_csrf_token', csrfToken)
      console.log('✓ CSRF 토큰 획득 성공')
      return csrfToken
    } catch (error) {
      console.warn('CSRF 토큰 획득 실패 (로그인은 계속 시도):', error.message)
      return null
    }
  }

  // 로그인
  async login(username, password) {
    try {
      console.log(`로그인 시도: ${username}`)

      // 1. 연결 상태 먼저 확인
      const connectionCheck = await this.checkConnection()
      if (!connectionCheck.success) {
        throw new Error(`서버에 연결할 수 없습니다: ${connectionCheck.error}`)
      }

      // 2. CSRF 토큰 시도 (실패해도 계속 진행)
      await this.getCsrfToken()

      // 3. 로그인 요청
      const loginData = {
        username: username,
        password: password,
        provider: 'db',
        refresh: true
      }

      console.log('로그인 요청 전송 중...')
      const response = await this.api.post('/api/v1/security/login', loginData)

      if (response.data && response.data.access_token) {
        // 토큰 저장
        localStorage.setItem('superset_access_token', response.data.access_token)
        if (response.data.refresh_token) {
          localStorage.setItem('superset_refresh_token', response.data.refresh_token)
        }

        // 사용자 정보 저장 (기본 정보로 설정)
        const basicUser = {
          username: username,
          first_name: username,
          last_name: 'User',
          email: `${username}@example.com`,
          roles: [{ name: 'Admin' }], // admin 사용자에게 Admin 역할 부여
          active: true
        }
        localStorage.setItem('superset_user', JSON.stringify(basicUser))

        console.log('✓ 로그인 성공')
        return {
          success: true,
          user: basicUser,
          token: response.data.access_token
        }
      } else {
        throw new Error('로그인 응답에 액세스 토큰이 없습니다.')
      }
      
    } catch (error) {
      console.error('로그인 실패:', error)
      
      let errorMessage = '로그인에 실패했습니다.'
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('연결할 수 없습니다')) {
        errorMessage = '서버에 연결할 수 없습니다. Superset 서버가 실행 중인지 확인해주세요.'
      } else if (error.response?.status === 401) {
        errorMessage = '사용자명 또는 비밀번호가 올바르지 않습니다.'
      } else if (error.response?.status === 500) {
        errorMessage = '서버 내부 오류가 발생했습니다.'
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage,
        details: {
          code: error.code,
          status: error.response?.status,
          message: error.message
        }
      }
    }
  }

  // 사용자 정보 조회
  async getUserInfo() {
    try {
      const response = await this.api.get('/api/v1/me/')
      return {
        success: true,
        user: response.data.result
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 로그아웃
  async logout() {
    try {
      await this.api.post('/api/v1/security/logout')
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error)
    } finally {
      // 로컬 스토리지 정리
      localStorage.removeItem('superset_access_token')
      localStorage.removeItem('superset_refresh_token')
      localStorage.removeItem('superset_csrf_token')
    }
  }

  // 인증 상태 확인
  isAuthenticated() {
    return !!localStorage.getItem('superset_access_token')
  }
}

export default new SupersetAPI()