// frontend/src/components/Layout.js
import React, { useEffect, useState } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const { Header, Sider, Content } = AntLayout;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableMenus, setAvailableMenus] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 인증 확인
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // 사용자 정보 및 메뉴 로드
    loadUserData();
  }, [navigate]);

  const loadUserData = () => {
    const user = authService.getCurrentUser();
    const menus = authService.getAvailableMenus();
    
    setCurrentUser(user);
    setAvailableMenus(menus);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleMenuClick = ({ key }) => {
    const menu = availableMenus.find(m => m.key === key);
    if (menu) {
      navigate(menu.path);
    }
  };

  // 아이콘 매핑
  const iconMap = {
    DashboardOutlined: <DashboardOutlined />,
    BarChartOutlined: <BarChartOutlined />,
    DatabaseOutlined: <DatabaseOutlined />,
    UserOutlined: <UserOutlined />
  };

  // 메뉴 아이템 생성
  const menuItems = availableMenus.map(menu => ({
    key: menu.key,
    icon: iconMap[menu.icon],
    label: menu.title
  }));

  // 사용자 드롭다운 메뉴
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '프로필',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '설정',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: handleLogout
    }
  ];

  // 현재 선택된 메뉴 키
  const selectedKey = availableMenus.find(menu => 
    location.pathname === menu.path || 
    (menu.path !== '/' && location.pathname.startsWith(menu.path))
  )?.key || 'dashboard';

  if (!authService.isAuthenticated()) {
    return null; // 인증되지 않은 경우 아무것도 렌더링하지 않음
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#fff',
          boxShadow: '2px 0 6px rgba(0,21,41,.35)'
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: '#001529'
        }}>
          {!collapsed ? (
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
              Superset
            </div>
          ) : (
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              S
            </div>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            borderRight: 0,
            height: 'calc(100vh - 64px)',
            paddingTop: '16px'
          }}
        />
      </Sider>

      <AntLayout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#001529',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                color: '#fff'
              }}
            />
            
            <div style={{ color: '#fff', fontSize: '16px', marginLeft: '16px' }}>
              {availableMenus.find(m => m.key === selectedKey)?.title || '대시보드'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {currentUser && (
              <Dropdown 
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <Space style={{ color: '#fff', cursor: 'pointer', padding: '0 8px' }}>
                  <Avatar 
                    size="small" 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  <span>{currentUser.first_name || currentUser.username || '사용자'}</span>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {authService.isAdmin() ? '관리자' : 
                     authService.hasRole('Alpha') ? '분석가' : '일반 사용자'}
                  </div>
                </Space>
              </Dropdown>
            )}
          </div>
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)'
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
