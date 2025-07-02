// frontend/src/services/authService.js
import supersetAPI from './supersetAPI';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userRoles = [];
    this.permissions = [];
  }

  async login(username, password) {
    try {
      const result = await supersetAPI.login(username, password);
      
      // 로그인 성공 후 사용자 정보 가져오기
      await this.loadUserInfo();
      
      return {
        success: true,
        user: this.currentUser,
        message: '로그인 성공'
      };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || '로그인에 실패했습니다.'
      };
    }
  }

  async loadUserInfo() {
    try {
      // 현재 사용자 정보 가져오기
      const users = await supersetAPI.getUsers();
      const roles = await supersetAPI.getRoles();
      const permissions = await supersetAPI.getPermissions();
      
      // 현재 로그인한 사용자 찾기 (임시로 첫 번째 사용자)
      this.currentUser = users[0];
      this.userRoles = roles;
      this.permissions = permissions;
      
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  }

  logout() {
    supersetAPI.logout();
    this.currentUser = null;
    this.userRoles = [];
    this.permissions = [];
  }

  isAuthenticated() {
    return supersetAPI.isAuthenticated() && this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getUserRoles() {
    return this.userRoles;
  }

  hasRole(roleName) {
    return this.userRoles.some(role => role.name === roleName);
  }

  hasPermission(permissionName) {
    return this.permissions.some(permission => permission.name === permissionName);
  }

  // 관리자 권한 체크
  isAdmin() {
    return this.hasRole('Admin');
  }

  // 데이터 접근 권한 체크
  canAccessDataSource(dataSourceId) {
    // 관리자는 모든 데이터 소스 접근 가능
    if (this.isAdmin()) {
      return true;
    }
    
    // 특정 역할에 따른 접근 권한 로직
    // 실제 구현에서는 데이터 소스별 권한 매핑이 필요
    return this.hasRole('Alpha') || this.hasRole('Gamma');
  }

  // 차트 생성 권한 체크
  canCreateChart() {
    return this.isAdmin() || this.hasRole('Alpha');
  }

  // 대시보드 생성 권한 체크
  canCreateDashboard() {
    return this.isAdmin() || this.hasRole('Alpha');
  }

  // 사용자 관리 권한 체크
  canManageUsers() {
    return this.isAdmin();
  }

  // 특정 차트 편집 권한 체크
  canEditChart(chartOwnerId) {
    if (this.isAdmin()) {
      return true;
    }
    
    // 차트 소유자이거나 Alpha 역할인 경우
    return this.currentUser?.id === chartOwnerId || this.hasRole('Alpha');
  }

  // 특정 대시보드 편집 권한 체크
  canEditDashboard(dashboardOwnerId) {
    if (this.isAdmin()) {
      return true;
    }
    
    // 대시보드 소유자이거나 Alpha 역할인 경우
    return this.currentUser?.id === dashboardOwnerId || this.hasRole('Alpha');
  }

  // 데이터베이스 연결 권한 체크
  canConnectDatabase() {
    return this.isAdmin();
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
    ];

    if (this.canCreateChart() || this.canCreateDashboard()) {
      menus.push({
        key: 'charts',
        title: '차트 빌더',
        path: '/charts',
        icon: 'BarChartOutlined',
        available: true
      });
    }

    if (this.canConnectDatabase()) {
      menus.push({
        key: 'datasources',
        title: '데이터 소스',
        path: '/datasources',
        icon: 'DatabaseOutlined',
        available: true
      });
    }

    if (this.canManageUsers()) {
      menus.push({
        key: 'users',
        title: '사용자 관리',
        path: '/users',
        icon: 'UserOutlined',
        available: true
      });
    }

    return menus.filter(menu => menu.available);
  }

  // 사용자 역할 업데이트 (SupersetAPI 사용)
  async updateUserRoles(userId, roleIds) {
    try {
      const result = await supersetAPI.updateUserRoles(userId, roleIds);
      return result;
    } catch (error) {
      console.error('Failed to update user roles:', error);
      throw error;
    }
  }

  // 역할별 대시보드 레이아웃 설정
  getDashboardLayout() {
    if (this.isAdmin()) {
      return {
        showAllCharts: true,
        showSystemMetrics: true,
        showUserActivity: true,
        chartsPerRow: 2
      };
    } else if (this.hasRole('Alpha')) {
      return {
        showAllCharts: true,
        showSystemMetrics: false,
        showUserActivity: false,
        chartsPerRow: 2
      };
    } else {
      return {
        showAllCharts: false,
        showSystemMetrics: false,
        showUserActivity: false,
        chartsPerRow: 1
      };
    }
  }
}

// 싱글톤 인스턴스 생성
const authService = new AuthService();

export default authService;
