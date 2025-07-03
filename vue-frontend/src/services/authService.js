// vue-frontend/src/services/authService.js
import supersetAPI from './supersetAPI'

class AuthService {
  constructor() {
    this.tokenKey = 'superset_access_token'
    this.userKey = 'superset_user'
    this.refreshTokenKey = 'superset_refresh_token'
  }

  async login(username, password) {
    try {
      console.log('로그인 시도:', { username })
      
      const response = await supersetAPI.login(username, password)
      
      if (response.access_token) {
        // 토큰 저장
        localStorage.setItem(this.tokenKey, response.access_token)
        if (response.refresh_token) {
          localStorage.setItem(this.refreshTokenKey, response.refresh_token)
        }
        
        // 사용자 정보 가져오기
        try {
          const userInfo = await supersetAPI.getUserInfo()
          localStorage.setItem(this.userKey, JSON.stringify(userInfo))
          
          console.log('로그인 성공:', userInfo)
          return { success: true, user: userInfo }
        } catch (userError) {
          console.error('사용자 정보 로드 실패:', userError)
          // 토큰은 있지만 사용자 정보를 가져올 수 없는 경우
          // 기본 사용자 정보로 설정
          const basicUser = {
            username: username,
            first_name: username,
            roles: [{ name: 'Admin' }]
          }
          localStorage.setItem(this.userKey, JSON.stringify(basicUser))
          return { success: true, user: basicUser }
        }
      } else {
        return { success: false, message: '로그인에 실패했습니다.' }
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        
        if (status === 401) {
          return { success: false, message: '사용자명 또는 비밀번호가 잘못되었습니다.' }
        } else if (status === 400) {
          return { success: false, message: data.message || '잘못된 요청입니다.' }
        } else {
          return { success: false, message: `서버 오류: ${status}` }
        }
      } else if (error.request) {
        return { success: false, message: '서버에 연결할 수 없습니다.' }
      } else {
        return { success: false, message: '로그인 중 오류가 발생했습니다.' }
      }
    }
  }

  async logout() {
    try {
      const token = this.getToken()
      if (token) {
        await supersetAPI.logout()
      }
    } catch (error) {
      console.error('로그아웃 API 오류:', error)
    } finally {
      // 로컬 스토리지 정리
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.userKey)
      localStorage.removeItem(this.refreshTokenKey)
    }
  }

  isAuthenticated() {
    const token = this.getToken()
    const user = this.getCurrentUser()
    return !!(token && user)
  }

  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey)
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.userKey)
      let user = userStr ? JSON.parse(userStr) : null
      
      // 임시 해결책: admin 사용자에게 강제로 Admin 역할 부여
      if (user && user.username === 'admin') {
        if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
          user.roles = [{ name: 'Admin' }]
          localStorage.setItem(this.userKey, JSON.stringify(user))
          console.log('admin 사용자에게 강제로 Admin 역할 부여됨:', user)
        }
      }
      
      return user
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error)
      return null
    }
  }

  getUserRole() {
    const user = this.getCurrentUser()
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return null
    }
    
    // 첫 번째 역할 반환
    return user.roles[0]?.name || null
  }

  hasRole(roleName) {
    const user = this.getCurrentUser()
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false
    }
    
    return user.roles.some(role => role.name === roleName)
  }

  isAdmin() {
    return this.hasRole('Admin')
  }

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

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('리프레시 토큰이 없습니다.')
      }

      const response = await supersetAPI.refreshToken(refreshToken)
      
      if (response.access_token) {
        localStorage.setItem(this.tokenKey, response.access_token)
        if (response.refresh_token) {
          localStorage.setItem(this.refreshTokenKey, response.refresh_token)
        }
        return response.access_token
      } else {
        throw new Error('토큰 갱신 실패')
      }
    } catch (error) {
      console.error('토큰 갱신 오류:', error)
      this.logout()
      throw error
    }
  }
}

export default new AuthService()