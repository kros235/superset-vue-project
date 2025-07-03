// vue-frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import authService from '../services/authService'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../components/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'datasources',
        name: 'DataSourceManager',
        component: () => import('../views/DataSourceManager.vue'),
        meta: { requiresPermission: 'canConnectDatabase' }
      },
      {
        path: 'charts',
        name: 'ChartBuilder',
        component: () => import('../views/ChartBuilder.vue'),
        meta: { requiresPermission: 'canCreateChart' }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/UserManagement.vue'),
        meta: { requiresPermission: 'canManageUsers' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 라우터 가드
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const requiresPermission = to.meta.requiresPermission

  if (requiresAuth && !authService.isAuthenticated()) {
    next('/login')
  } else if (requiresPermission && !authService[requiresPermission]()) {
    next('/')
  } else {
    next()
  }
})

export default router