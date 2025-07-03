// vue-frontend/src/store/index.js
import { createStore } from 'vuex'
import authService from '../services/authService'
import supersetAPI from '../services/supersetAPI'

export default createStore({
  state: {
    user: null,
    loading: false,
    charts: [],
    dashboards: [],
    datasets: [],
    databases: []
  },
  
  getters: {
    isAuthenticated: state => !!state.user,
    currentUser: state => state.user,
    isAdmin: state => state.user && authService.isAdmin(),
    availableMenus: state => authService.getAvailableMenus()
  },
  
  mutations: {
    SET_USER(state, user) {
      state.user = user
    },
    
    SET_LOADING(state, status) {
      state.loading = status
    },
    
    SET_CHARTS(state, charts) {
      state.charts = charts
    },
    
    SET_DASHBOARDS(state, dashboards) {
      state.dashboards = dashboards
    },
    
    SET_DATASETS(state, datasets) {
      state.datasets = datasets
    },
    
    SET_DATABASES(state, databases) {
      state.databases = databases
    },
    
    CLEAR_USER(state) {
      state.user = null
      state.charts = []
      state.dashboards = []
      state.datasets = []
      state.databases = []
    }
  },
  
  actions: {
    async login({ commit }, { username, password }) {
      commit('SET_LOADING', true)
      try {
        const result = await authService.login(username, password)
        if (result.success) {
          commit('SET_USER', result.user)
          return result
        }
        throw new Error(result.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async logout({ commit }) {
      authService.logout()
      commit('CLEAR_USER')
    },
    
    async loadCharts({ commit }) {
      try {
        const charts = await supersetAPI.getCharts()
        commit('SET_CHARTS', charts)
        return charts
      } catch (error) {
        console.error('차트 로드 실패:', error)
        throw error
      }
    },
    
    async loadDashboards({ commit }) {
      try {
        const dashboards = await supersetAPI.getDashboards()
        commit('SET_DASHBOARDS', dashboards)
        return dashboards
      } catch (error) {
        console.error('대시보드 로드 실패:', error)
        throw error
      }
    },
    
    async loadDatasets({ commit }) {
      try {
        const datasets = await supersetAPI.getDatasets()
        commit('SET_DATASETS', datasets)
        return datasets
      } catch (error) {
        console.error('데이터셋 로드 실패:', error)
        throw error
      }
    },
    
    async loadDatabases({ commit }) {
      try {
        const databases = await supersetAPI.getDatabases()
        commit('SET_DATABASES', databases)
        return databases
      } catch (error) {
        console.error('데이터베이스 로드 실패:', error)
        throw error
      }
    }
  }
})