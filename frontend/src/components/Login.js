// frontend/src/components/Login.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 이미 로그인된 사용자는 대시보드로 리디렉션
    if (authService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');

    try {
      const result = await authService.login(values.username, values.password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 개발용 빠른 로그인 함수
  const handleQuickLogin = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'admin'
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px'
        }}
        title={
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: '#1890ff' }}>
              Superset Dashboard
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              Apache Superset과 연동된 대시보드
            </p>
          </div>
        }
      >
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="사용자명"
            name="username"
            rules={[
              { required: true, message: '사용자명을 입력해주세요!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="사용자명을 입력하세요"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="비밀번호"
            name="password"
            rules={[
              { required: true, message: '비밀번호를 입력해주세요!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호를 입력하세요"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ borderRadius: '4px' }}
            >
              {loading ? <Spin size="small" /> : '로그인'}
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="link"
              block
              onClick={handleQuickLogin}
              style={{ padding: 0, height: 'auto' }}
            >
              개발용 관리자 로그인 (admin/admin)
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>기본 계정 정보:</h4>
          <div>관리자: admin / admin</div>
          <div style={{ marginTop: 8 }}>
            <strong>주요 기능:</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li>데이터 소스 관리</li>
              <li>차트 및 대시보드 생성</li>
              <li>사용자 권한 관리</li>
              <li>실시간 데이터 시각화</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
