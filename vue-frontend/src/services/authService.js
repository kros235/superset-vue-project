// vue-frontend/src/services/authService.js
import supersetAPI from './supersetAPI'

class AuthService {
  constructor() {
    console.log('AuthService 초기화')
  }

  // 연결 상태 확인
  async checkConnection() {
    return await supersetAPI.checkConnection()
  }

  // 로그인
  async login(username, password) {
    try {
      console.log(`[AuthService] 로그인 시도: ${username}`)
      const result = await supersetAPI.login(username, password)
      
      // supersetAPI.login()이 성공하면 토큰이 포함된 응답을 반환
      // access_token이 있으면 로그인 성공으로 처리
      if (result && result.access_token) {
        console.log('[AuthService] 로그인 성공 - 토큰 확인됨')
        
        // 사용자 정보를 supersetAPI를 통해 조회
        try {
          const user = await supersetAPI.getCurrentUser()
          console.log('[AuthService] 사용자 정보 조회 성공:', user)
          
          return {
            success: true,
            user: user,
            message: '로그인 성공'
          }
        } catch (userError) {
          console.warn('[AuthService] 사용자 정보 조회 실패, 기본 정보 사용:', userError)
          
          // 사용자 정보 조회 실패시 기본 정보 사용
          const defaultUser = {
            id: 1,
            username: username,
            email: `${username}@admin.com`,
            first_name: username === 'admin' ? 'Admin' : 'User',
            last_name: 'User',
            roles: username === 'admin' ? [{ name: 'Admin' }] : [{ name: 'Public' }],
            permissions: ['can_sqllab', 'can_read', 'can_write']
          }
          
          // localStorage에 사용자 정보 저장
          localStorage.setItem('superset_user', JSON.stringify(defaultUser))
          
          return {
            success: true,
            user: defaultUser,
            message: '로그인 성공'
          }
        }
      } else {
        console.error('[AuthService] 로그인 실패 - 토큰 없음')
        return {
          success: false,
          error: '로그인에 실패했습니다.'
        }
      }
    } catch (error) {
      console.error('[AuthService] 로그인 처리 중 오류:', error)
      return {
        success: false,
        error: error.response?.data?.message || error.message || '로그인 처리 중 오류가 발생했습니다.'
      }
    }
  }

  // 사용자 정보 조회 (supersetAPI 사용)
  async getUserInfo() {
    try {
      return await supersetAPI.getCurrentUser()
    } catch (error) {
      console.error('[AuthService] 사용자 정보 조회 실패:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 로그아웃
  async logout() {
    try {
      await supersetAPI.logout()
      console.log('[AuthService] 로그아웃 완료')
      
      // 페이지 리다이렉트
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('[AuthService] 로그아웃 처리 중 오류:', error)
    }
  }

  // 인증 상태 확인
  isAuthenticated() {
    return supersetAPI.isAuthenticated()
  }

  // 현재 사용자 정보 조회 (동기식 - 로컬 스토리지에서)
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('superset_user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('[AuthService] 로컬 사용자 정보 파싱 오류:', error)
      return null
    }
  }

  // 현재 사용자 정보 조회 (비동기식 - API 호출)
  async getCurrentUserAsync() {
    try {
      return await supersetAPI.getCurrentUser()
    } catch (error) {
      console.error('[AuthService] 비동기 사용자 정보 조회 실패:', error)
      return this.getCurrentUser() // fallback to local storage
    }
  }

  // 사용자 권한 확인
  hasPermission(permission) {
    const user = this.getCurrentUser()
    if (!user || !user.permissions) {
      return false
    }
    return user.permissions.includes(permission)
  }

  // 사용자 역할 확인
  hasRole(roleName) {
    const user = this.getCurrentUser()
    if (!user || !user.roles) {
      return false
    }
    return user.roles.some(role => role.name === roleName)
  }

  // 관리자 여부 확인
  isAdmin() {
    return this.hasRole('Admin') || this.hasRole('admin')
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const authService = new AuthService()
export default authService