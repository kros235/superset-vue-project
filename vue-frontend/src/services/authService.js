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
      
      if (result.success) {
        console.log('[AuthService] 로그인 성공')
        return result
      } else {
        console.error('[AuthService] 로그인 실패:', result.error)
        return result
      }
    } catch (error) {
      console.error('[AuthService] 로그인 처리 중 오류:', error)
      return {
        success: false,
        error: error.message || '로그인 처리 중 오류가 발생했습니다.'
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

  // 현재 사용자 정보 조회
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('superset_user')
      let user = userStr ? JSON.parse(userStr) : null
      
      // admin 사용자에게 강제로 Admin 역할 부여 (임시 해결책)
      if (user && user.username === 'admin') {
        if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
          user.roles = [{ name: 'Admin' }]
          localStorage.setItem('superset_user', JSON.stringify(user))
          console.log('admin 사용자에게 강제로 Admin 역할 부여됨:', user)
        }
      }
      
      return user
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

  canCreateChart() {
    return this.isAdmin() || this.hasRole('Alpha') || this.hasRole('Gamma')
  }

  canEditChart() {
    return this.isAdmin() || this.hasRole('Alpha')
  }

  canDeleteChart() {
    return this.isAdmin()
  }

  canManageDataSources() {
    return this.isAdmin() || this.hasRole('Alpha')
  }

  canConnectDatabase() {
    return this.isAdmin() || this.hasRole('Alpha')
  }

  // 사용 가능한 메뉴 조회
  getAvailableMenus() {
    const menus = []
    
    // 대시보드는 모든 사용자가 접근 가능
    menus.push({
      key: 'dashboard',
      title: '대시보드',
      path: '/',
      icon: 'DashboardOutlined'
    })
    
    // 차트 빌더는 차트 생성 권한이 있는 사용자만 접근 가능
    if (this.canCreateChart()) {
      menus.push({
        key: 'chart-builder',
        title: '차트 빌더',
        path: '/charts',
        icon: 'BarChartOutlined'
      })
    }
    
    // 데이터 소스 관리는 관리자와 Alpha 역할만 접근 가능
    if (this.canManageDataSources()) {
      menus.push({
        key: 'data-sources',
        title: '데이터 소스',
        path: '/datasources',
        icon: 'DatabaseOutlined'
      })
    }
    
    // 사용자 관리는 관리자만 접근 가능
    if (this.canManageUsers()) {
      menus.push({
        key: 'user-management',
        title: '사용자 관리',
        path: '/users',
        icon: 'UserOutlined'
      })
    }
    
    return menus
  }

  // 대시보드 레이아웃 설정
  getDashboardLayout() {
    const role = this.getUserRole()
    
    switch (role) {
      case 'Admin':
        return {
          showAllCharts: true,
          canEdit: true,
          canDelete: true,
          showUserManagement: true
        }
      case 'Alpha':
        return {
          showAllCharts: true,
          canEdit: true,
          canDelete: false,
          showUserManagement: false
        }
      case 'Gamma':
        return {
          showAllCharts: false,
          canEdit: false,
          canDelete: false,
          showUserManagement: false
        }
      default:
        return {
          showAllCharts: false,
          canEdit: false,
          canDelete: false,
          showUserManagement: false
        }
    }
  }

  // 저장된 토큰으로 초기화
  initializeFromStorage() {
    return this.isAuthenticated()
  }
}

export default new AuthService()