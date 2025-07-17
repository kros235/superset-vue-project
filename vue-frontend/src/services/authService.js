// vue-frontend/src/services/authService.js
import supersetAPI from './supersetAPI'

class AuthService {
  constructor() {
    console.log('AuthService 초기화')
    this.currentUser = null
    this.userRoles = []
    this.permissions = []
  }

  async login(username, password) {
    try {
      console.log('AuthService 로그인 시도:', username)
      
      // credentials 객체 형태로 전달
      const credentials = {
        username: username,
        password: password
      }
    
      const result = await supersetAPI.login(credentials)
    
      if (result && result.access_token) {
        // 사용자 정보 가져오기 시도
        try {
          const userInfo = await supersetAPI.getCurrentUser()
          this.currentUser = userInfo
          console.log('사용자 정보 로드 성공:', userInfo)
        } catch (userError) {
          console.warn('사용자 정보 로드 실패, 기본값 설정:', userError)
          // 기본 사용자 정보 설정
          this.currentUser = {
            id: 1,
            username: username,
            first_name: username === 'admin' ? 'Admin' : 'User',
            last_name: 'User',
            email: `${username}@example.com`,
            roles: username === 'admin' ? [{ id: 1, name: 'Admin' }] : [{ id: 2, name: 'Public' }]
          }
        }
      
        // 기본 역할 설정
        if (username === 'admin') {
          this.userRoles = [{ id: 1, name: 'Admin' }]
        } else {
          this.userRoles = [{ id: 2, name: 'Public' }]
        }
      
        // 기본 권한 설정
        this.permissions = []
      
        return {
          success: true,
          user: this.currentUser,
          message: '로그인 성공'
        }
      }
    
      return {
        success: false,
        message: '로그인에 실패했습니다.'
      }
    } catch (error) {
      console.error('AuthService login failed:', error)
    
      // 에러 메시지 개선
      let errorMessage = '로그인에 실패했습니다.'
    
      if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
    
      return {
        success: false,
        message: errorMessage
      }
    }
  }

  logout() {
    supersetAPI.logout()
    this.currentUser = null
    this.userRoles = []
    this.permissions = []
  }

  isAuthenticated() {
    return supersetAPI.isAuthenticated() && this.currentUser
  }

  getCurrentUser() {
    return this.currentUser
  }

  getUserRoles() {
    return this.userRoles
  }

  hasRole(roleName) {
    return this.userRoles.some(role => role.name === roleName)
  }

  hasPermission(permissionName) {
    return this.permissions.some(permission => permission.name === permissionName)
  }

  // 관리자 권한 체크
  isAdmin() {
    return this.hasRole('Admin')
  }

  // 데이터 접근 권한 체크
  canAccessDataSource(dataSourceId) {
    if (this.isAdmin()) {
      return true
    }
    return this.hasRole('Alpha') || this.hasRole('Gamma')
  }

  // 차트 생성 권한 체크
  canCreateChart() {
    return this.isAdmin() || this.hasRole('Alpha')
  }

  // 대시보드 생성 권한 체크
  canCreateDashboard() {
    return this.isAdmin() || this.hasRole('Alpha')
  }

  // 사용자 관리 권한 체크
  canManageUsers() {
    return this.isAdmin()
  }

  // 특정 차트 편집 권한 체크
  canEditChart(chartOwnerId) {
    if (this.isAdmin()) {
      return true
    }
    return this.currentUser?.id === chartOwnerId || this.hasRole('Alpha')
  }

  // 특정 대시보드 편집 권한 체크
  canEditDashboard(dashboardOwnerId) {
    if (this.isAdmin()) {
      return true
    }
    return this.currentUser?.id === dashboardOwnerId || this.hasRole('Alpha')
  }

  // 데이터베이스 연결 권한 체크
  canConnectDatabase() {
    return this.isAdmin()
  }

  // 사용자 역할에 따른 메뉴 필터링
  getAvailableMenus() {
    const menus = [
      {
        key: 'dashboard',
        title: '대시보드',
        path: '/',
        icon: 'DashboardOutlined',
        available: true
      }
    ]

    if (this.canCreateChart() || this.canCreateDashboard()) {
      menus.push({
        key: 'charts',
        title: '차트 빌더',
        path: '/charts',
        icon: 'BarChartOutlined',
        available: true
      })
    }

    if (this.canConnectDatabase()) {
      menus.push({
        key: 'datasources',
        title: '데이터 소스',
        path: '/datasources',
        icon: 'DatabaseOutlined',
        available: true
      })
    }

    if (this.canManageUsers()) {
      menus.push({
        key: 'users',
        title: '사용자 관리',
        path: '/users',
        icon: 'UserOutlined',
        available: true
      })
    }

    return menus.filter(menu => menu.available)
  }

  // 역할별 대시보드 레이아웃 설정
  getDashboardLayout() {
    if (this.isAdmin()) {
      return {
        showAllCharts: true,
        showSystemMetrics: true,
        showUserActivity: true,
        chartsPerRow: 2
      }
    } else if (this.hasRole('Alpha')) {
      return {
        showAllCharts: true,
        showSystemMetrics: false,
        showUserActivity: false,
        chartsPerRow: 2
      }
    } else {
      return {
        showAllCharts: false,
        showSystemMetrics: false,
        showUserActivity: false,
        chartsPerRow: 1
      }
    }
  }

  // 사용자 역할 업데이트 (SupersetAPI 사용)
  async updateUserRoles(userId, roleIds) {
    try {
      const result = await supersetAPI.updateUserRoles(userId, roleIds)
      return result
    } catch (error) {
      console.error('Failed to update user roles:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 생성
const authService = new AuthService()

export default authService