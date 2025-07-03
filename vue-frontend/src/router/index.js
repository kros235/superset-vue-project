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

// 라우터 가드
router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  // 인증이 필요한 페이지인데 로그인하지 않은 경우
  if (requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // 로그인 페이지인데 이미 로그인한 경우
  if (to.path === '/login' && isAuthenticated) {
    next('/')
    return
  }

  // 권한 확인
  const permission = to.meta.permission
  if (permission && !authService[permission]()) {
    // 권한이 없는 경우 대시보드로 리디렉션
    next('/')
    return
  }

  next()
})

export default router
