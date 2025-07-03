// vue-frontend/src/store/index.js
import { createStore } from 'vuex'
import authService from '../services/authService'

const store = createStore({
  state: {
    user: null,
    isAuthenticated: false,
    availableMenus: []
  },
  
  mutations: {
    SET_USER(state, user) {
      state.user = user
      state.isAuthenticated = !!user
    },
    
    SET_AVAILABLE_MENUS(state, menus) {
      state.availableMenus = menus
    },
    
    CLEAR_USER(state) {
      state.user = null
      state.isAuthenticated = false
      state.availableMenus = []
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        const result = await authService.login(credentials.username, credentials.password)
        
        if (result.success) {
          const user = authService.getCurrentUser()
          const menus = authService.getAvailableMenus()
          
          console.log('로그인 성공 - 사용자:', user)
          console.log('로그인 성공 - 메뉴:', menus)
          
          commit('SET_USER', user)
          commit('SET_AVAILABLE_MENUS', menus)
          
          return { success: true }
        } else {
          return { success: false, message: result.message }
        }
      } catch (error) {
        console.error('Login action error:', error)
        return { success: false, message: '로그인 중 오류가 발생했습니다.' }
      }
    },
    
    async logout({ commit }) {
      try {
        await authService.logout()
        commit('CLEAR_USER')
        return { success: true }
      } catch (error) {
        console.error('Logout action error:', error)
        commit('CLEAR_USER') // 오류가 있어도 로컬 상태는 초기화
        return { success: false, message: '로그아웃 중 오류가 발생했습니다.' }
      }
    },
    
    async initializeAuth({ commit }) {
      try {
        if (authService.isAuthenticated()) {
          const user = authService.getCurrentUser()
          const menus = authService.getAvailableMenus()
          
          console.log('Auth 초기화 - 사용자:', user)
          console.log('Auth 초기화 - 메뉴:', menus)
          
          commit('SET_USER', user)
          commit('SET_AVAILABLE_MENUS', menus)
          
          return { success: true }
        }
        return { success: false }
      } catch (error) {
        console.error('Initialize auth error:', error)
        commit('CLEAR_USER')
        return { success: false }
      }
    },
    
    // 메뉴 새로고침 액션 추가
    refreshMenus({ commit }) {
      try {
        const menus = authService.getAvailableMenus()
        console.log('메뉴 새로고침:', menus)
        commit('SET_AVAILABLE_MENUS', menus)
        return menus
      } catch (error) {
        console.error('Refresh menus error:', error)
        return []
      }
    }
  },
  
  getters: {
    currentUser: (state) => state.user,
    isAuthenticated: (state) => state.isAuthenticated,
    availableMenus: (state) => state.availableMenus,
    isAdmin: (state) => {
      if (!state.user) return false
      return authService.isAdmin()
    },
    userRole: (state) => {
      if (!state.user) return null
      return authService.getUserRole()
    }
  }
})

export default store