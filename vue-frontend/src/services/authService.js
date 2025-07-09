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
        
        // 사용자 정보 설정 (간단한 정보로 시작)
        const user = {
          id: 1,
          username: username,
          email: `${username}@admin.com`,
          first_name: username === 'admin' ? 'Admin' : 'User',
          last_name: 'User',
          roles: username === 'admin' ? [{ name: 'Admin' }] : [{ name: 'Public' }]
        }
        
        // localStorage에 사용자 정보 저장
        localStorage.setItem('superset_user', JSON.stringify(user))
        
        return {
          success: true,
          user: user,
          message: '로그인 성공'
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

  // 사용자 정보 조회
  async getUserInfo() {
    try {
      return await supersetAPI.getUserInfo()
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
      localStorage.removeItem('superset_user')
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
    return supersetAPI.isAuthenticated() && this.getCurrentUser()
  }

  // 현재 사용자 정보 조회
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('superset_user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error)
      return null
    }
  }

  // 사용자 역할 조회
  getUserRole() {
    const user = this.getCurrentUser()
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return null
    }
    return user.roles[0]?.name || null
  }

  // 특정 역할 확인
  hasRole(roleName) {
    const user = this.getCurrentUser()
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false
    }
    return user.roles.some(role => role.name === roleName)
  }

  // 관리자 여부 확인
  isAdmin() {
    return this.hasRole('Admin')
  }

  // 권한 확인 메서드들
  canManageUsers() {
    return this.isAdmin()
  }

  canCreateCharts() {
    return this.isAdmin() || this.hasRole('Alpha') || this.hasRole('Gamma')
  }

  canCreateDashboards() {
    return this.isAdmin() || this.hasRole('Alpha') || this.hasRole('Gamma')
  }

  canManageDataSources() {
    return this.isAdmin() || this.hasRole('Alpha')
  }

  canAccessSQLLab() {
    return this.isAdmin() || this.hasRole('Alpha') || this.hasRole('sql_lab')
  }

  // 사용자 권한에 따른 메뉴 구성
  getAvailableMenus() {
    const baseMenus = [
      {
        key: 'dashboard',
        title: '대시보드',
        path: '/',
        icon: 'DashboardOutlined',
        roles: ['Admin', 'Alpha', 'Gamma', 'Public']
      }
    ]

    const adminMenus = [
      {
        key: 'charts',
        title: '차트 관리',
        path: '/charts',
        icon: 'BarChartOutlined',
        roles: ['Admin', 'Alpha', 'Gamma']
      },
      {
        key: 'datasources',
        title: '데이터 소스',
        path: '/datasources',
        icon: 'DatabaseOutlined',
        roles: ['Admin', 'Alpha']
      },
      {
        key: 'users',
        title: '사용자 관리',
        path: '/users',
        icon: 'UserOutlined',
        roles: ['Admin']
      }
    ]

    const allMenus = [...baseMenus, ...adminMenus]
    const currentUserRole = this.getUserRole()

    // 사용자 역할에 따라 접근 가능한 메뉴만 필터링
    return allMenus.filter(menu => {
      if (!menu.roles) return true
      return menu.roles.includes(currentUserRole) || this.isAdmin()
    })
  }

  // 대시보드 레이아웃 설정 (사용자 권한에 따라)
  getDashboardLayout() {
    if (this.isAdmin()) {
      return {
        showAllCharts: true,
        showStatistics: true,
        showUserManagement: true,
        showAdvancedFeatures: true
      }
    }
    
    if (this.hasRole('Alpha')) {
      return {
        showAllCharts: true,
        showStatistics: true,
        showUserManagement: false,
        showAdvancedFeatures: true
      }
    }
    
    return {
      showAllCharts: false,
      showStatistics: false,
      showUserManagement: false,
      showAdvancedFeatures: false
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const authService = new AuthService()
export default authService