// frontend/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert, Button, Empty } from 'antd';
import { 
  LineChartOutlined, 
  BarChartOutlined, 
  PieChartOutlined,
  ReloadOutlined,
  UserOutlined 
} from '@ant-design/icons';
import supersetAPI from '../services/supersetAPI';
import authService from '../services/authService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [charts, setCharts] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalCharts: 0,
    totalDashboards: 0,
    totalDatasets: 0,
    totalUsers: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // 병렬로 데이터 로드
      const [chartsData, dashboardsData, datasetsData, usersData] = await Promise.allSettled([
        supersetAPI.getCharts(),
        supersetAPI.getDashboards(),
        supersetAPI.getDatasets(),
        authService.canManageUsers() ? supersetAPI.getUsers() : Promise.resolve([])
      ]);

      // 통계 데이터 설정
      setDashboardStats({
        totalCharts: chartsData.status === 'fulfilled' ? chartsData.value.length : 0,
        totalDashboards: dashboardsData.status === 'fulfilled' ? dashboardsData.value.length : 0,
        totalDatasets: datasetsData.status === 'fulfilled' ? datasetsData.value.length : 0,
        totalUsers: usersData.status === 'fulfilled' ? usersData.value.length : 0
      });

      // 차트 데이터 설정 (권한에 따라 필터링)
      if (chartsData.status === 'fulfilled') {
        const userLayout = authService.getDashboardLayout();
        let filteredCharts = chartsData.value;

        if (!userLayout.showAllCharts) {
          // 일반 사용자는 제한된 차트만 표시
          filteredCharts = chartsData.value.slice(0, 4);
        }

        setCharts(filteredCharts);
      }

    } catch (error) {
      console.error('Dashboard loading error:', error);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderStatisticCard = (title, value, icon, color) => (
    <Card hoverable>
      <Statistic
        title={title}
        value={value}
        prefix={React.cloneElement(icon, { style: { color } })}
        valueStyle={{ color }}
      />
    </Card>
  );

  const renderChartCard = (chart) => {
    const chartTypeIcons = {
      'line': <LineChartOutlined />,
      'bar': <BarChartOutlined />,
      'pie': <PieChartOutlined />,
      'table': <BarChartOutlined />
    };

    return (
      <Card
        key={chart.id}
        title={chart.slice_name || chart.chart_name || '제목 없음'}
        extra={
          <Button 
            type="link" 
            size="small"
            onClick={() => loadChartData(chart.id)}
          >
            보기
          </Button>
        }
        hoverable
        style={{ height: '300px' }}
      >
        <div style={{ 
          height: '200px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#666'
        }}>
          {chartTypeIcons[chart.viz_type] || <BarChartOutlined />}
          <div style={{ marginTop: 16, fontSize: '14px' }}>
            차트 유형: {chart.viz_type || '알 수 없음'}
          </div>
          <div style={{ marginTop: 8, fontSize: '12px', textAlign: 'center' }}>
            {chart.description || '설명이 없습니다.'}
          </div>
        </div>
      </Card>
    );
  };

  const loadChartData = async (chartId) => {
    try {
      // 실제 차트 데이터 로드 로직
      console.log('Loading chart data for chart:', chartId);
      // 여기서 실제 차트 렌더링을 구현할 수 있습니다
    } catch (error) {
      console.error('Chart data loading error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="오류"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadDashboardData}>
            다시 시도
          </Button>
        }
      />
    );
  }

  const userLayout = authService.getDashboardLayout();
  const currentUser = authService.getCurrentUser();

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
              대시보드
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              안녕하세요, {currentUser?.first_name || currentUser?.username}님! 
              {authService.isAdmin() && ' (관리자)'}
            </p>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadDashboardData}
            loading={loading}
          >
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드들 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          {renderStatisticCard('총 차트', dashboardStats.totalCharts, <BarChartOutlined />, '#1890ff')}
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {renderStatisticCard('총 대시보드', dashboardStats.totalDashboards, <LineChartOutlined />, '#52c41a')}
        </Col>
        <Col xs={24} sm={12} lg={6}>
          {renderStatisticCard('데이터셋', dashboardStats.totalDatasets, <PieChartOutlined />, '#faad14')}
        </Col>
        {authService.canManageUsers() && (
          <Col xs={24} sm={12} lg={6}>
            {renderStatisticCard('사용자', dashboardStats.totalUsers, <UserOutlined />, '#722ed1')}
          </Col>
        )}
      </Row>

      {/* 차트 그리드 */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
          최근 차트
          {!userLayout.showAllCharts && (
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginLeft: 8 }}>
              (제한된 보기)
            </span>
          )}
        </h2>
      </div>

      {charts.length === 0 ? (
        <Empty 
          description="표시할 차트가 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {authService.canCreateChart() && (
            <Button type="primary" onClick={() => window.location.href = '/charts'}>
              첫 번째 차트 만들기
            </Button>
          )}
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {charts.slice(0, userLayout.showAllCharts ? charts.length : 4).map((chart) => (
            <Col 
              key={chart.id}
              xs={24} 
              sm={12} 
              lg={userLayout.chartsPerRow === 1 ? 24 : 12}
              xl={userLayout.chartsPerRow === 1 ? 24 : 12}
            >
              {renderChartCard(chart)}
            </Col>
          ))}
        </Row>
      )}

      {/* 시스템 메트릭 (관리자만) */}
      {userLayout.showSystemMetrics && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 16 }}>
            시스템 메트릭
          </h2>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                  시스템 메트릭 차트가 여기에 표시됩니다
                  <br />
                  (관리자 전용)
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* 사용자 활동 (관리자만) */}
      {userLayout.showUserActivity && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 16 }}>
            사용자 활동
          </h2>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                  사용자 활동 로그가 여기에 표시됩니다
                  <br />
                  (관리자 전용)
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
