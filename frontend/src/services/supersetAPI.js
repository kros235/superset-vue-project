// frontend/src/services/supersetAPI.js
import axios from 'axios';

const SUPERSET_BASE_URL = process.env.REACT_APP_SUPERSET_URL || 'http://localhost:8088';

class SupersetAPI {
  constructor() {
    this.token = null;
    this.refreshToken = null;
    this.csrfToken = null;
    
    // Axios 인스턴스 생성
    this.api = axios.create({
      baseURL: SUPERSET_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 생성자에서 저장된 토큰 로드
    this.loadStoredTokens();

    // 요청 인터셉터
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        if (this.csrfToken) {
          config.headers['X-CSRFToken'] = this.csrfToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            await this.refreshAccessToken();
            return this.api.request(error.config);
          } catch (refreshError) {
            this.logout();
            throw refreshError;
          }
        }
        throw error;
      }
    );
  }

  // 토큰 저장/로드 메서드
  loadStoredTokens() {
    this.token = localStorage.getItem('superset_auth_token');
    this.refreshToken = localStorage.getItem('superset_refresh_token');
    this.csrfToken = localStorage.getItem('superset_csrf_token');
  }

  setTokens(accessToken, refreshToken = null, csrfToken = null) {
    this.token = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    if (csrfToken) {
      this.csrfToken = csrfToken;
    }

    // localStorage에 저장
    if (accessToken) {
      localStorage.setItem('superset_auth_token', accessToken);
    } else {
      localStorage.removeItem('superset_auth_token');
    }
    
    if (refreshToken) {
      localStorage.setItem('superset_refresh_token', refreshToken);
    }
    
    if (csrfToken) {
      localStorage.setItem('superset_csrf_token', csrfToken);
    }
  }

  // 1. 인증 관련
  async login(username, password) {
    try {
      const response = await this.api.post('/api/v1/security/login', {
        username,
        password,
        provider: 'db',
        refresh: true
      });
      
      // 토큰들 저장
      this.setTokens(
        response.data.access_token,
        response.data.refresh_token
      );
      
      // CSRF 토큰 가져오기
      await this.getCSRFToken();
      
      console.log('Login successful, tokens saved');
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getCSRFToken() {
    try {
      const response = await this.api.get('/api/v1/security/csrf_token/');
      this.setTokens(this.token, this.refreshToken, response.data.result);
      return this.csrfToken;
    } catch (error) {
      console.error('CSRF token error:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    const response = await this.api.post('/api/v1/security/refresh', {
      refresh_token: this.refreshToken
    });
    this.setTokens(response.data.access_token, this.refreshToken, this.csrfToken);
    return this.token;
  }

  logout() {
    this.token = null;
    this.refreshToken = null;
    this.csrfToken = null;
    localStorage.removeItem('superset_auth_token');
    localStorage.removeItem('superset_refresh_token');
    localStorage.removeItem('superset_csrf_token');
  }

  // 2. 데이터베이스 관련
  async getDatabases() {
    try {
      const response = await this.api.get('/api/v1/database/');
      return response.data.result;
    } catch (error) {
      console.error('Get databases error:', error);
      throw error;
    }
  }

  async testDatabaseConnection(payload) {
    try {
      console.log('Testing connection with payload:', payload);
      console.log('Using token:', this.token ? 'Token present' : 'No token');
      
      // URL 끝에 슬래시 추가하여 리다이렉트 방지
      const response = await this.api.post('/api/v1/database/test_connection/', payload);
      
      console.log('Connection test response:', response.data);
      
      // 응답 처리 개선
      if (response.data.message === 'OK' || response.status === 200) {
        return { success: true, message: 'Connection successful' };
      } else {
        return { success: false, message: response.data.message || 'Connection failed' };
      }
    } catch (error) {
      console.error('Test connection error:', error);
      console.error('Error response:', error.response?.data);
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Connection failed' 
      };
    }
  }

  async createDatabase(payload) {
    try {
      const response = await this.api.post('/api/v1/database/', payload);
      return response.data;
    } catch (error) {
      console.error('Create database error:', error);
      throw error;
    }
  }

  // 3. 데이터셋 관련
  async getDatasets() {
    try {
      const response = await this.api.get('/api/v1/dataset/');
      return response.data.result;
    } catch (error) {
      console.error('Get datasets error:', error);
      throw error;
    }
  }

  async createDataset(payload) {
    try {
      const response = await this.api.post('/api/v1/dataset/', payload);
      return response.data;
    } catch (error) {
      console.error('Create dataset error:', error);
      throw error;
    }
  }

  async getDatasetColumns(datasetId) {
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`);
      return response.data.result.columns;
    } catch (error) {
      console.error('Get dataset columns error:', error);
      throw error;
    }
  }

  async getTableSchema(databaseId, tableName) {
    try {
      const response = await this.api.get(`/api/v1/database/${databaseId}/table/${tableName}/`);
      return response.data;
    } catch (error) {
      console.error('Get table schema error:', error);
      throw error;
    }
  }

  // 4. 차트 관련
  async getCharts() {
    try {
      const response = await this.api.get('/api/v1/chart/');
      return response.data.result;
    } catch (error) {
      console.error('Get charts error:', error);
      throw error;
    }
  }

  async createChart(payload) {
    try {
      const response = await this.api.post('/api/v1/chart/', payload);
      return response.data;
    } catch (error) {
      console.error('Create chart error:', error);
      throw error;
    }
  }

  async updateChart(chartId, payload) {
    try {
      const response = await this.api.put(`/api/v1/chart/${chartId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update chart error:', error);
      throw error;
    }
  }

  async deleteChart(chartId) {
    try {
      const response = await this.api.delete(`/api/v1/chart/${chartId}`);
      return response.data;
    } catch (error) {
      console.error('Delete chart error:', error);
      throw error;
    }
  }

  // 5. 차트 데이터 조회
  async getChartData(payload) {
    try {
      const response = await this.api.post('/api/v1/chart/data', payload);
      return response.data;
    } catch (error) {
      console.error('Get chart data error:', error);
      throw error;
    }
  }

  // 6. 대시보드 관련
  async getDashboards() {
    try {
      const response = await this.api.get('/api/v1/dashboard/');
      return response.data.result;
    } catch (error) {
      console.error('Get dashboards error:', error);
      throw error;
    }
  }

  async createDashboard(payload) {
    try {
      const response = await this.api.post('/api/v1/dashboard/', payload);
      return response.data;
    } catch (error) {
      console.error('Create dashboard error:', error);
      throw error;
    }
  }

  async getDashboard(dashboardId) {
    try {
      const response = await this.api.get(`/api/v1/dashboard/${dashboardId}`);
      return response.data.result;
    } catch (error) {
      console.error('Get dashboard error:', error);
      throw error;
    }
  }

  async updateDashboard(dashboardId, payload) {
    try {
      const response = await this.api.put(`/api/v1/dashboard/${dashboardId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update dashboard error:', error);
      throw error;
    }
  }

  // 7. 사용자 관리
  async getUsers() {
    try {
      const response = await this.api.get('/api/v1/security/users/');
      return response.data.result;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  async createUser(payload) {
    try {
      const response = await this.api.post('/api/v1/security/users/', payload);
      return response.data;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async getRoles() {
    try {
      const response = await this.api.get('/api/v1/security/roles/');
      return response.data.result;
    } catch (error) {
      console.error('Get roles error:', error);
      throw error;
    }
  }

  // 8. 권한 관리
  async getPermissions() {
    try {
      const response = await this.api.get('/api/v1/security/permissions/');
      return response.data.result;
    } catch (error) {
      console.error('Get permissions error:', error);
      throw error;
    }
  }

  async updateDataset(datasetId, payload) {
    try {
      const response = await this.api.put(`/api/v1/dataset/${datasetId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update dataset error:', error);
      throw error;
    }
  }

  async deleteDataset(datasetId) {
    try {
      const response = await this.api.delete(`/api/v1/dataset/${datasetId}`);
      return response.data;
    } catch (error) {
      console.error('Delete dataset error:', error);
      throw error;
    }
  }

  async updateDatabase(databaseId, payload) {
    try {
      const response = await this.api.put(`/api/v1/database/${databaseId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update database error:', error);
      throw error;
    }
  }

  async deleteDatabase(databaseId) {
    try {
      const response = await this.api.delete(`/api/v1/database/${databaseId}`);
      return response.data;
    } catch (error) {
      console.error('Delete database error:', error);
      throw error;
    }
  }

  async updateUser(userId, payload) {
    try {
      const response = await this.api.put(`/api/v1/security/users/${userId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await this.api.delete(`/api/v1/security/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  async updateUserRoles(userId, roleIds) {
    try {
      const response = await this.api.put(`/api/v1/security/users/${userId}`, {
        roles: roleIds
      });
      return response.data;
    } catch (error) {
      console.error('Update user roles error:', error);
      throw error;
    }
  }

  // 9. 유틸리티 메서드
  isAuthenticated() {
    return !!this.token;
  }

  getAuthToken() {
    return this.token;
  }
}

// 싱글톤 인스턴스 생성
const supersetAPI = new SupersetAPI();

export default supersetAPI;