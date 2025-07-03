<template>
  <a-layout style="min-height: 100vh">
    <!-- 사이드바 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      :style="{
        background: '#fff',
        boxShadow: '2px 0 6px rgba(0,21,41,.35)'
      }"
    >
      <!-- 로고 영역 -->
      <div :style="{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0',
        background: '#001529'
      }">
        <div v-if="!collapsed" :style="{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }">
          Superset Dashboard
        </div>
        <div v-else :style="{ color: '#fff', fontSize: '20px' }">
          S
        </div>
      </div>

      <!-- 메뉴 -->
      <a-menu
        :selected-keys="[selectedKey]"
        mode="inline"
        :style="{ borderRight: 0, marginTop: '16px' }"
        @click="handleMenuClick"
      >
        <a-menu-item 
          v-for="menu in menuItems" 
          :key="menu.key"
        >
          <component :is="menu.iconComponent" />
          <span>{{ menu.label }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- 헤더 -->
      <a-layout-header :style="{
        background: '#001529',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }">
        <!-- 메뉴 토글 버튼 -->
        <a-button
          type="text"
          :icon="collapsed ? h(MenuUnfoldOutlined) : h(MenuFoldOutlined)"
          @click="collapsed = !collapsed"
          :style="{ color: '#fff', fontSize: '16px' }"
        />

        <!-- 페이지 제목 -->
        <div :style="{ color: '#fff', fontSize: '18px', fontWeight: '500' }">
          {{ currentPageTitle }}
        </div>

        <!-- 사용자 정보 -->
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <a-space :style="{ color: '#fff', cursor: 'pointer' }">
            <a-avatar :icon="h(UserOutlined)" />
            <span>{{ currentUser?.first_name || currentUser?.username }}</span>
            <span :style="{ fontSize: '12px', opacity: 0.8 }">
              ({{ userRoleText }})
            </span>
          </a-space>
          <template #overlay>
            <a-menu @click="handleUserMenuClick">
              <a-menu-item key="profile">
                <UserOutlined />
                프로필
              </a-menu-item>
              <a-menu-item key="settings">
                <SettingOutlined />
                설정
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout">
                <LogoutOutlined />
                로그아웃
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-layout-header>

      <!-- 컨텐츠 -->
      <a-layout-content
        :style="{
          margin: '24px 16px',
          padding: '24px',
          minHeight: '280px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)'
        }"
      >
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script>
import { defineComponent, ref, computed, onMounted, h } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { 
  MenuUnfoldOutlined, 
  MenuFoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  BarChartOutlined,
  DatabaseOutlined
} from '@ant-design/icons-vue'
import authService from '../services/authService'

export default defineComponent({
  name: 'Layout',
  components: {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    DashboardOutlined,
    BarChartOutlined,
    DatabaseOutlined
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    
    const collapsed = ref(false)
    
    const currentUser = computed(() => store.getters.currentUser)
    const availableMenus = computed(() => {
      const menus = store.getters.availableMenus
      console.log('Layout에서 가져온 메뉴들:', menus)
      return menus
    })
    
    const userRoleText = computed(() => {
      const user = currentUser.value
      console.log('현재 사용자 정보:', user)
      
      if (authService.isAdmin()) return '관리자'
      if (authService.hasRole('Alpha')) return '분석가'
      return '일반 사용자'
    })
    
    const menuItems = computed(() => {
      const iconComponents = {
        DashboardOutlined: DashboardOutlined,
        BarChartOutlined: BarChartOutlined,
        DatabaseOutlined: DatabaseOutlined,
        UserOutlined: UserOutlined
      }
      
      const items = availableMenus.value.map(menu => ({
        key: menu.key,
        iconComponent: iconComponents[menu.icon] || UserOutlined,
        label: menu.title
      }))
      
      console.log('변환된 메뉴 아이템들:', items)
      return items
    })
    
    const selectedKey = computed(() => {
      const menu = availableMenus.value.find(menu => 
        route.path === menu.path || 
        (menu.path !== '/' && route.path.startsWith(menu.path))
      )
      return menu?.key || 'dashboard'
    })
    
    const currentPageTitle = computed(() => {
      const menu = availableMenus.value.find(m => m.key === selectedKey.value)
      return menu?.title || '대시보드'
    })
    
    const handleMenuClick = ({ key }) => {
      const menu = availableMenus.value.find(m => m.key === key)
      if (menu) {
        router.push(menu.path)
      }
    }
    
    const handleUserMenuClick = async ({ key }) => {
      if (key === 'logout') {
        await store.dispatch('logout')
        router.push('/login')
      }
      // 다른 메뉴 항목들은 추후 구현
    }
    
    onMounted(async () => {
      // 인증 확인
      if (!authService.isAuthenticated()) {
        router.push('/login')
        return
      }
      
      // 메뉴 새로고침
      await store.dispatch('refreshMenus')
      console.log('Layout 마운트 완료, 최종 메뉴:', availableMenus.value)
    })
    
    return {
      collapsed,
      currentUser,
      availableMenus,
      userRoleText,
      menuItems,
      selectedKey,
      currentPageTitle,
      handleMenuClick,
      handleUserMenuClick,
      h,
      MenuUnfoldOutlined,
      MenuFoldOutlined,
      UserOutlined,
      SettingOutlined,
      LogoutOutlined
    }
  }
})
</script>