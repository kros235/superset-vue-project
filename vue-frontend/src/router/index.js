// vue-frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import authService from '../services/authService'
import Layout from '../components/Layout.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import ChartBuilder from '../views/ChartBuilder.vue'
import DataSources from '../views/DataSources.vue'
import UserManagement from '../views/UserManagement.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: 'charts',
        name: 'ChartBuilder',
        component: ChartBuilder,
        meta: {
          requiresAuth: true,
          permission: 'canCreateChart'
        }
      },
      {
        path: 'datasources',
        name: 'DataSources',
        component: DataSources,
        meta: {
          requiresAuth: true,
          permission: 'canConnectDatabase'
        }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
          requiresAuth: true,
          permission: 'canManageUsers'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 라우터 가드 (안전하게 수정)
router.beforeEach((to, from, next) => {
  console.log(`[Router] 이동: ${from.path} → ${to.path}`)
  
  const isAuthenticated = authService.isAuthenticated()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  // 인증이 필요한 페이지인데 로그인하지 않은 경우
  if (requiresAuth && !isAuthenticated) {
    console.log('[Router] 인증 필요 → 로그인 페이지로')
    next('/login')
    return
  }

  // 로그인 페이지인데 이미 로그인한 경우
  if (to.path === '/login' && isAuthenticated) {
    console.log('[Router] 이미 로그인됨 → 대시보드로')
    next('/')
    return
  }

  // 권한 확인 (안전한 체크)
  const permission = to.meta.permission
  if (permission) {
    console.log(`[Router] 권한 체크: ${permission}`)
    
    // 메서드가 존재하는지 확인
    if (typeof authService[permission] === 'function') {
      try {
        const hasPermission = authService[permission]()
        console.log(`[Router] 권한 결과: ${hasPermission}`)
        
        if (!hasPermission) {
          console.log('[Router] 권한 없음 → 대시보드로')
          next('/')
          return
        }
      } catch (error) {
        console.error(`[Router] 권한 체크 오류: ${permission}`, error)
        next('/')
        return
      }
    } else {
      console.error(`[Router] 권한 메서드 없음: ${permission}`)
      // 메서드가 없으면 admin만 접근 허용
      if (!authService.isAdmin()) {
        next('/')
        return
      }
    }
  }

  console.log('[Router] 권한 통과 → 페이지 이동')
  next()
})

export default router