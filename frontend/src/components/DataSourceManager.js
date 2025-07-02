// frontend/src/components/DataSourceManager.js
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
  Tabs
} from 'antd';
import { 
  PlusOutlined, 
  DatabaseOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import supersetAPI from '../services/supersetAPI';
import authService from '../services/authService';

const { Option } = Select;
const { TabPane } = Tabs;

const DataSourceManager = () => {
  const [databases, setDatabases] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [datasetModalVisible, setDatasetModalVisible] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState(null);
  const [editingDataset, setEditingDataset] = useState(null);
  const [form] = Form.useForm();
  const [datasetForm] = Form.useForm();
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    if (authService.canConnectDatabase()) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbData, dsData] = await Promise.all([
        supersetAPI.getDatabases(),
        supersetAPI.getDatasets()
      ]);
      setDatabases(dbData);
      setDatasets(dsData);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      message.error('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseSubmit = async (values) => {
    try {
      const payload = {
        database_name: values.database_name,
        sqlalchemy_uri: values.sqlalchemy_uri,
        expose_in_sqllab: true,
        allow_ctas: false,
        allow_cvas: false,
        configuration_method: 'sqlalchemy_form'
      };

      if (editingDatabase) {
        await supersetAPI.updateDatabase(editingDatabase.id, payload);
        message.success('데이터베이스가 업데이트되었습니다.');
      } else {
        await supersetAPI.createDatabase(payload);
        message.success('데이터베이스가 생성되었습니다.');
      }

      setModalVisible(false);
      setEditingDatabase(null);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('데이터베이스 저장 오류:', error);
      message.error('데이터베이스 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDatasetSubmit = async (values) => {
    try {
      const payload = {
        database: values.database_id,
        schema: values.schema || '',
        table_name: values.table_name,
        sql: values.sql || ''
      };

      if (editingDataset) {
        await supersetAPI.updateDataset(editingDataset.id, payload);
        message.success('데이터셋이 업데이트되었습니다.');
      } else {
        await supersetAPI.createDataset(payload);
        message.success('데이터셋이 생성되었습니다.');
      }

      setDatasetModalVisible(false);
      setEditingDataset(null);
      datasetForm.resetFields();
      loadData();
    } catch (error) {
      console.error('데이터셋 저장 오류:', error);
      message.error('데이터셋 저장 중 오류가 발생했습니다.');
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const values = form.getFieldsValue();
      const result = await supersetAPI.testDatabaseConnection({
        sqlalchemy_uri: values.sqlalchemy_uri,
        database_name: values.database_name
      });
      
      if (result.success) {
        message.success('데이터베이스 연결이 성공했습니다!');
      } else {
        message.error('데이터베이스 연결에 실패했습니다.');
      }
    } catch (error) {
      console.error('연결 테스트 오류:', error);
      message.error('연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setTestingConnection(false);
    }
  };

  const deleteDatabase = async (id) => {
    try {
      await supersetAPI.deleteDatabase(id);
      message.success('데이터베이스가 삭제되었습니다.');
      loadData();
    } catch (error) {
      console.error('데이터베이스 삭제 오류:', error);
      message.error('데이터베이스 삭제 중 오류가 발생했습니다.');
    }
  };

  const deleteDataset = async (id) => {
    try {
      await supersetAPI.deleteDataset(id);
      message.success('데이터셋이 삭제되었습니다.');
      loadData();
    } catch (error) {
      console.error('데이터셋 삭제 오류:', error);
      message.error('데이터셋 삭제 중 오류가 발생했습니다.');
    }
  };

  // 데이터베이스 테이블 컬럼 정의
  const databaseColumns = [
    {
      title: '이름',
      dataIndex: 'database_name',
      key: 'database_name',
      render: (text, record) => (
        <Space>
          <DatabaseOutlined />
          <strong>{text}</strong>
        </Space>
      )
    },
    {
      title: 'URI',
      dataIndex: 'sqlalchemy_uri',
      key: 'sqlalchemy_uri',
      ellipsis: true,
      render: (text) => (
        <code style={{ fontSize: '12px', background: '#f5f5f5', padding: '2px 4px' }}>
          {text}
        </code>
      )
    },
    {
      title: '상태',
      key: 'status',
      render: () => (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          연결됨
        </Tag>
      )
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
              setEditingDatabase(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            편집
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => deleteDatabase(record.id)}
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

  // 데이터셋 테이블 컬럼 정의
  const datasetColumns = [
    {
      title: '이름',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (text, record) => (
        <Space>
          <strong>{text}</strong>
          {record.sql && <Tag color="blue">SQL</Tag>}
        </Space>
      )
    },
    {
      title: '데이터베이스',
      dataIndex: ['database', 'database_name'],
      key: 'database_name'
    },
    {
      title: '스키마',
      dataIndex: 'schema',
      key: 'schema',
      render: (text) => text || '-'
    },
    {
      title: '컬럼 수',
      dataIndex: 'columns',
      key: 'columns',
      render: (columns) => columns ? columns.length : 0
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
              setEditingDataset(record);
              datasetForm.setFieldsValue({
                ...record,
                database_id: record.database?.id
              });
              setDatasetModalVisible(true);
            }}
          >
            편집
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            onConfirm={() => deleteDataset(record.id)}
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

  if (!authService.canConnectDatabase()) {
    return (
      <Alert
        message="접근 권한 없음"
        description="데이터 소스 관리 권한이 없습니다."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          데이터 소스 관리
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          데이터베이스 연결과 데이터셋을 관리합니다.
        </p>
      </div>

      <Tabs defaultActiveKey="databases">
        <TabPane tab="데이터베이스" key="databases">
          <Card 
            title="데이터베이스 연결"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingDatabase(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                데이터베이스 추가
              </Button>
            }
          >
            <Table
              dataSource={databases}
              columns={databaseColumns}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}개 항목`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="데이터셋" key="datasets">
          <Card 
            title="데이터셋"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingDataset(null);
                  datasetForm.resetFields();
                  setDatasetModalVisible(true);
                }}
                disabled={databases.length === 0}
              >
                데이터셋 추가
              </Button>
            }
          >
            {databases.length === 0 && (
              <Alert
                message="데이터베이스가 필요합니다"
                description="데이터셋을 생성하려면 먼저 데이터베이스를 연결해야 합니다."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            <Table
              dataSource={datasets}
              columns={datasetColumns}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}개 항목`
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 데이터베이스 추가/편집 모달 */}
      <Modal
        title={editingDatabase ? '데이터베이스 편집' : '데이터베이스 추가'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingDatabase(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDatabaseSubmit}
        >
          <Form.Item
            label="데이터베이스 이름"
            name="database_name"
            rules={[{ required: true, message: '데이터베이스 이름을 입력해주세요' }]}
          >
            <Input placeholder="예: Sample Dashboard DB" />
          </Form.Item>

          <Form.Item
            label="SQLAlchemy URI"
            name="sqlalchemy_uri"
            rules={[{ required: true, message: 'SQLAlchemy URI를 입력해주세요' }]}
          >
            <Input.TextArea 
              placeholder="예: mysql+pymysql://superset:superset123@mariadb:3306/sample_dashboard"
              rows={3}
            />
          </Form.Item>

          <Alert
            message="연결 예시"
            description={
              <div>
                <strong>MariaDB/MySQL:</strong> mysql+pymysql://username:password@host:port/database
                <br />
                <strong>PostgreSQL:</strong> postgresql://username:password@host:port/database
                <br />
                <strong>SQLite:</strong> sqlite:///path/to/database.db
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item>
            <Space>
              <Button 
                onClick={testConnection}
                loading={testingConnection}
                icon={<CheckCircleOutlined />}
              >
                연결 테스트
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDatabase ? '업데이트' : '생성'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 데이터셋 추가/편집 모달 */}
      <Modal
        title={editingDataset ? '데이터셋 편집' : '데이터셋 추가'}
        open={datasetModalVisible}
        onCancel={() => {
          setDatasetModalVisible(false);
          setEditingDataset(null);
          datasetForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={datasetForm}
          layout="vertical"
          onFinish={handleDatasetSubmit}
        >
          <Form.Item
            label="데이터베이스"
            name="database_id"
            rules={[{ required: true, message: '데이터베이스를 선택해주세요' }]}
          >
            <Select placeholder="데이터베이스 선택">
              {databases.map(db => (
                <Option key={db.id} value={db.id}>
                  {db.database_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="테이블 이름"
            name="table_name"
            rules={[{ required: true, message: '테이블 이름을 입력해주세요' }]}
          >
            <Input placeholder="예: sales, users, web_traffic" />
          </Form.Item>

          <Form.Item
            label="스키마 (선택사항)"
            name="schema"
          >
            <Input placeholder="예: public, dbo" />
          </Form.Item>

          <Form.Item
            label="SQL 쿼리 (선택사항)"
            name="sql"
            help="테이블 대신 커스텀 SQL 쿼리를 사용하려면 입력하세요"
          >
            <Input.TextArea 
              placeholder="SELECT * FROM table_name WHERE condition"
              rows={4}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingDataset ? '업데이트' : '생성'}
              </Button>
              <Button onClick={() => setDatasetModalVisible(false)}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSourceManager;
