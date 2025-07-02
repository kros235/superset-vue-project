// frontend/src/components/UserManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Card, 
  Alert, 
  Space, 
  Tag,
  Popconfirm,
  message,
  Tabs,
  Badge,
  Avatar,
  Descriptions,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  CrownOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import supersetAPI from '../services/supersetAPI';
import authService from '../services/authService';

const { Option } = Select;
const { TabPane } = Tabs;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  useEffect(() => {
    if (authService.canManageUsers()) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, permissionsData] = await Promise.all([
        supersetAPI.getUsers(),
        supersetAPI.getRoles(),
        supersetAPI.getPermissions()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      message.error('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (values) => {
    try {
      const payload = {
        username: values.username,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        active: values.active !== false,
        roles: values.roles || []
      };

      if (!editingUser && values.password) {
        payload.password = values.password;
      }

      if (editingUser) {
        await supersetAPI.updateUser(editingUser.id, payload);
        message.success('사용자가 업데이트되었습니다.');
      } else {
        await supersetAPI.createUser(payload);
        message.success('사용자가 생성되었습니다.');
      }

      setUserModalVisible(false);
      setEditingUser(null);
      userForm.resetFields();
      loadData();
    } catch (error) {
      console.error('사용자 저장 오류:', error);
      message.error('사용자 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteUser = async (userId) => {
    try {
      await supersetAPI.deleteUser(userId);
      message.success('사용자가 삭제되었습니다.');
      loadData();
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      message.error('사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await supersetAPI.updateUser(userId, { active: !currentStatus });
      message.success(`사용자가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
      loadData();
    } catch (error) {
      console.error('사용자 상태 변경 오류:', error);
      message.error('사용자 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const updateUserRoles = async (userId, roleIds) => {
    try {
      await authService.updateUserRoles(userId, roleIds);
      message.success('사용자 역할이 업데이트되었습니다.');
      loadData();
    } catch (error) {
      console.error('역할 업데이트 오류:', error);
      message.error('역할 업데이트 중 오류가 발생했습니다.');
    }
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'Admin': 'red',
      'Alpha': 'orange', 
      'Gamma': 'blue',
      'Public': 'green',
      'sql_lab': 'purple'
    };
    return colors[roleName] || 'default';
  };

  const getRoleIcon = (roleName) => {
    const icons = {
      'Admin': <CrownOutlined />,
      'Alpha': <SafetyOutlined />,
      'Gamma': <UserOutlined />,
      'Public': <TeamOutlined />
    };
    return icons[roleName] || <UserOutlined />;
  };

  // 사용자 테이블 컬럼 정의
  const userColumns = [
    {
      title: '사용자',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            size="small" 
            icon={<UserOutlined />} 
            style={{ backgroundColor: record.active ? '#1890ff' : '#d9d9d9' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.first_name} {record.last_name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              @{record.username}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '역할',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => (
        <Space wrap>
          {roles?.map(role => (
            <Tag 
              key={role.id} 
              color={getRoleColor(role.name)}
              icon={getRoleIcon(role.name)}
            >
              {role.name}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '상태',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Badge 
          status={active ? "success" : "error"} 
          text={active ? "활성" : "비활성"} 
        />
      )
    },
    {
      title: '마지막 로그인',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '작업',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record);
              userForm.setFieldsValue({
                ...record,
                roles: record.roles?.map(r => r.id)
              });
              setUserModalVisible(true);
            }}
          >
            편집
          </Button>
          
          <Button
            type="text"
            icon={record.active ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => toggleUserStatus(record.id, record.active)}
          >
            {record.active ? '비활성화' : '활성화'}
          </Button>
          
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => deleteUser(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 역할 테이블 컬럼 정의
  const roleColumns = [
    {
      title: '역할',
      key: 'role',
      render: (_, record) => (
        <Space>
          {getRoleIcon(record.name)}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {record.id}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-'
    },
    {
      title: '권한 수',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <Badge count={permissions?.length || 0} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '사용자 수',
      key: 'user_count',
      render: (_, record) => {
        const userCount = users.filter(user => 
          user.roles?.some(role => role.id === record.id)
        ).length;
        return <Badge count={userCount} style={{ backgroundColor: '#1890ff' }} />;
      }
    }
  ];

  if (!authService.canManageUsers()) {
    return (
      <Alert
        message="접근 권한 없음"
        description="사용자 관리 권한이 없습니다."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          사용자 관리
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          시스템 사용자와 권한을 관리합니다.
        </p>
      </div>

      <Tabs defaultActiveKey="users">
        <TabPane tab={`사용자 (${users.length})`} key="users">
          <Card 
            title="사용자 목록"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingUser(null);
                  userForm.resetFields();
                  setUserModalVisible(true);
                }}
              >
                사용자 추가
              </Button>
            }
          >
            <Table
              dataSource={users}
              columns={userColumns}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}명의 사용자`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={`역할 (${roles.length})`} key="roles">
          <Card title="역할 및 권한">
            <Table
              dataSource={roles}
              columns={roleColumns}
              loading={loading}
              rowKey="id"
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px 0' }}>
                    <Descriptions title="역할 세부정보" size="small" column={1}>
                      <Descriptions.Item label="역할 이름">
                        {record.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="설명">
                        {record.description || '설명 없음'}
                      </Descriptions.Item>
                      <Descriptions.Item label="권한">
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {record.permissions?.map((perm, index) => (
                            <Tag key={index} style={{ marginBottom: 4 }}>
                              {perm.name}
                            </Tag>
                          ))}
                        </div>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                ),
                rowExpandable: (record) => record.permissions?.length > 0
              }}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `총 ${total}개의 역할`
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 사용자 추가/편집 모달 */}
      <Modal
        title={editingUser ? '사용자 편집' : '사용자 추가'}
        open={userModalVisible}
        onCancel={() => {
          setUserModalVisible(false);
          setEditingUser(null);
          userForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleUserSubmit}
        >
          <Form.Item
            label="사용자명"
            name="username"
            rules={[{ required: true, message: '사용자명을 입력해주세요' }]}
          >
            <Input placeholder="사용자명을 입력하세요" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="이름"
                name="first_name"
                rules={[{ required: true, message: '이름을 입력해주세요' }]}
              >
                <Input placeholder="이름" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="성"
                name="last_name"
                rules={[{ required: true, message: '성을 입력해주세요' }]}
              >
                <Input placeholder="성" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="이메일"
            name="email"
            rules={[
              { required: true, message: '이메일을 입력해주세요' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다' }
            ]}
          >
            <Input placeholder="이메일을 입력하세요" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="비밀번호"
              name="password"
              rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
            >
              <Input.Password placeholder="비밀번호를 입력하세요" />
            </Form.Item>
          )}

          <Form.Item
            label="역할"
            name="roles"
          >
            <Select
              mode="multiple"
              placeholder="사용자 역할을 선택하세요"
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  <Space>
                    {getRoleIcon(role.name)}
                    {role.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? '업데이트' : '생성'}
              </Button>
              <Button onClick={() => setUserModalVisible(false)}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
