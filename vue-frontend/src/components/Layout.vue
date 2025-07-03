<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider 
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      :style="{
        background: '#fff',
        boxShadow: '2px 0 6px rgba(0,21,41,.35)'
      }"
    >
      <div :style="{ 
        height: '64px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderBottom: '1px solid #f0f0f0',
        background: '#001529'
      }">
        <div v-if="!collapsed" style="color: #fff; fontSize: 18px; fontWeight: bold">
          Superset
        </div>
        <div v-else style="color: #fff; fontSize: 16px; fontWeight: bold">
          S
        </div>
      </div>
      
      <a-menu
        mode="inline"
        :selected-keys="[selectedKey]"
        :items="menuItems"
        @click="handleMenuClick"
        :style="{ 
          borderRight: 0,
          height: 'calc(100vh - 64px)',
          paddingTop: '16px'
        }"
      />
    </a-layout-sider>

    <a-layout>
      <a-layout-header :style="{ 
        padding: '0 24px', 
        background: '#001529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }">
        <div style="display: flex; align-items: center">
          <a-button
            type="text"
            @click="collapsed = !collapsed"
            :style="{
              fontSize: '16px',
              width: '64px',
              height: '64px',
              color: '#fff'
            }"
          >
            <template #icon>
              <MenuUnfoldOutlined v-if="collapsed" />
              <MenuFoldOutlined v-else />
            </template>
          </a-button>
          
          <div style="color: #fff; fontSize: 16px; marginLeft: 16px">
            {{ currentPageTitle }}
          </div>
        </div>

        <div style="display: flex; align-items: center">
          <a-dropdown 
            :trigger="['click']"
            placement="bottomRight"
          >
            <a-space style="color: #fff; cursor: pointer; padding: 0 8px">
              <a-avatar 
                size="small" 
                :style="{ backgroundColor: '#1890ff' }"
              >
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span>{{ currentUser?.first_name || currentUser?.username || '사용자' }}</span>
              <div style="fontSize: 12px; opacity: 0.8">
                {{ userRoleText }}
              </div>
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
        </div>
      </a-layout-header>

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
import { defineComponent, ref, computed, onMounted } from 'vue'
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

const iconMap = {
  DashboardOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  UserOutlined
}

export default defineComponent({
  name: 'Layout',
  components: {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    
    const collapsed = ref(false)
    
    const currentUser = computed(() => store.getters.currentUser)
    const availableMenus = computed(() => store.getters.availableMenus)
    
    const userRoleText = computed(() => {
      if (authService.isAdmin()) return '관리자'
      if (authService.hasRole('Alpha')) return '분석가'
      return '일반 사용자'
    })
    
    const menuItems = computed(() => {
      return availableMenus.value.map(menu => ({
        key: menu.key,
        icon: () => iconMap[menu.icon] ? iconMap[menu.icon]() : UserOutlined(),
        label: menu.title
      }))
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
    
    onMounted(() => {
      // 인증 확인
      if (!authService.isAuthenticated()) {
        router.push('/login')
      }
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
      handleUserMenuClick
    }
  }
})
</script>