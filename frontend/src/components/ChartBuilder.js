// frontend/src/components/ChartBuilder.js
import React, { useState, useEffect } from 'react';
import { 
  Steps, 
  Card, 
  Select, 
  Form, 
  Button, 
  Input, 
  Space, 
  Alert, 
  message, 
  Row, 
  Col,
  Divider,
  Tag,
  Spin,
  Empty,
  Checkbox,
  InputNumber,
  Switch
} from 'antd';
import { 
  DatabaseOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
  AreaChartOutlined,
  DotChartOutlined,
  SaveOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import supersetAPI from '../services/supersetAPI';
import authService from '../services/authService';

const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

const ChartBuilder = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetColumns, setDatasetColumns] = useState([]);
  const [chartConfig, setChartConfig] = useState({
    datasource: '',
    viz_type: 'table',
    slice_name: '',
    description: '',
    params: {}
  });
  const [chartData, setChartData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (authService.canCreateChart()) {
      loadDatasets();
    }
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const data = await supersetAPI.getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error('데이터셋 로드 오류:', error);
      message.error('데이터셋을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadDatasetColumns = async (datasetId) => {
    try {
      const columns = await supersetAPI.getDatasetColumns(datasetId);
      setDatasetColumns(columns);
    } catch (error) {
      console.error('컬럼 로드 오류:', error);
      message.error('데이터셋 컬럼을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleDatasetChange = async (datasetId) => {
    const dataset = datasets.find(d => d.id === datasetId);
    setSelectedDataset(dataset);
    setChartConfig(prev => ({
      ...prev,
      datasource: `${datasetId}__table`
    }));
    await loadDatasetColumns(datasetId);
  };

  const handleChartTypeChange = (vizType) => {
    setChartConfig(prev => ({
      ...prev,
      viz_type: vizType,
      params: getDefaultParams(vizType)
    }));
  };

  const getDefaultParams = (vizType) => {
    const defaults = {
      table: {
        query_mode: 'aggregate',
        groupby: [],
        metrics: [],
        all_columns: [],
        row_limit: 1000
      },
      bar: {
        query_mode: 'aggregate',
        groupby: [],
        metrics: [],
        row_limit: 1000,
        color_scheme: 'bnbColors'
      },
      line: {
        query_mode: 'aggregate',
        groupby: [],
        metrics: [],
        row_limit: 1000,
        color_scheme: 'bnbColors'
      },
      pie: {
        query_mode: 'aggregate',
        groupby: [],
        metrics: [],
        row_limit: 1000,
        color_scheme: 'bnbColors'
      },
      area: {
        query_mode: 'aggregate',
        groupby: [],
        metrics: [],
        row_limit: 1000,
        color_scheme: 'bnbColors'
      },
      scatter: {
        query_mode: 'aggregate',
        groupby: [],
        metrics: [],
        row_limit: 1000,
        color_scheme: 'bnbColors'
      }
    };
    return defaults[vizType] || defaults.table;
  };

  const updateChartParams = (key, value) => {
    setChartConfig(prev => ({
      ...prev,
      params: {
        ...prev.params,
        [key]: value
      }
    }));
  };

  const previewChart = async () => {
    if (!selectedDataset || !chartConfig.viz_type) {
      message.warning('데이터셋과 차트 타입을 선택해주세요.');
      return;
    }

    setPreviewLoading(true);
    try {
      const payload = {
        datasource: chartConfig.datasource,
        viz_type: chartConfig.viz_type,
        form_data: chartConfig.params
      };

      const result = await supersetAPI.getChartData(payload);
      setChartData(result);
      message.success('차트 미리보기가 생성되었습니다.');
    } catch (error) {
      console.error('차트 미리보기 오류:', error);
      message.error('차트 미리보기 생성 중 오류가 발생했습니다.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveChart = async () => {
    if (!chartConfig.slice_name) {
      message.warning('차트 이름을 입력해주세요.');
      return;
    }

    try {
      const payload = {
        slice_name: chartConfig.slice_name,
        description: chartConfig.description,
        viz_type: chartConfig.viz_type,
        datasource_id: selectedDataset.id,
        datasource_type: 'table',
        params: JSON.stringify(chartConfig.params)
      };

      await supersetAPI.createChart(payload);
      message.success('차트가 성공적으로 저장되었습니다.');
      
      // 폼 리셋
      resetForm();
    } catch (error) {
      console.error('차트 저장 오류:', error);
      message.error('차트 저장 중 오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setSelectedDataset(null);
    setDatasetColumns([]);
    setChartConfig({
      datasource: '',
      viz_type: 'table',
      slice_name: '',
      description: '',
      params: {}
    });
    setChartData(null);
    form.resetFields();
  };

  const renderDatasetSelection = () => (
    <Card title="1단계: 데이터셋 선택" style={{ marginBottom: 16 }}>
      <Form layout="vertical">
        <Form.Item label="데이터셋">
          <Select
            placeholder="차트에 사용할 데이터셋을 선택하세요"
            loading={loading}
            onChange={handleDatasetChange}
            value={selectedDataset?.id}
          >
            {datasets.map(dataset => (
              <Option key={dataset.id} value={dataset.id}>
                <Space>
                  <DatabaseOutlined />
                  {dataset.table_name}
                  <Tag color="blue">{dataset.database?.database_name}</Tag>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedDataset && (
          <Alert
            message={`선택된 데이터셋: ${selectedDataset.table_name}`}
            description={`데이터베이스: ${selectedDataset.database?.database_name} | 컬럼 수: ${datasetColumns.length}`}
            type="success"
            showIcon
          />
        )}
      </Form>
    </Card>
  );

  const renderChartTypeSelection = () => {
    const chartTypes = [
      { key: 'table', icon: <TableOutlined />, title: '테이블', description: '데이터를 표 형태로 표시' },
      { key: 'bar', icon: <BarChartOutlined />, title: '막대 차트', description: '카테고리별 수치 비교' },
      { key: 'line', icon: <LineChartOutlined />, title: '선 차트', description: '시간에 따른 변화 추이' },
      { key: 'pie', icon: <PieChartOutlined />, title: '파이 차트', description: '비율 및 구성 표시' },
      { key: 'area', icon: <AreaChartOutlined />, title: '영역 차트', description: '누적 데이터 표시' },
      { key: 'scatter', icon: <DotChartOutlined />, title: '산점도', description: '두 변수 간의 상관관계' }
    ];

    return (
      <Card title="2단계: 차트 타입 선택" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {chartTypes.map(type => (
            <Col xs={24} sm={12} md={8} key={type.key}>
              <Card
                hoverable
                className={chartConfig.viz_type === type.key ? 'selected-chart-type' : ''}
                onClick={() => handleChartTypeChange(type.key)}
                style={{ 
                  border: chartConfig.viz_type === type.key ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: 8 }}>
                    {type.icon}
                  </div>
                  <h4>{type.title}</h4>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    {type.description}
                  </p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  const renderChartConfiguration = () => {
    const numericColumns = datasetColumns.filter(col => 
      ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL'].includes(col.type?.toUpperCase())
    );
    const categoricalColumns = datasetColumns.filter(col => 
      ['STRING', 'VARCHAR', 'TEXT'].includes(col.type?.toUpperCase())
    );
    const dateColumns = datasetColumns.filter(col => 
      ['DATE', 'DATETIME', 'TIMESTAMP'].includes(col.type?.toUpperCase())
    );

    return (
      <Card title="3단계: 차트 설정" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="그룹화 기준 (Group By)">
                <Select
                  mode="multiple"
                  placeholder="그룹화할 컬럼을 선택하세요"
                  value={chartConfig.params.groupby || []}
                  onChange={(value) => updateChartParams('groupby', value)}
                >
                  {[...categoricalColumns, ...dateColumns].map(col => (
                    <Option key={col.column_name} value={col.column_name}>
                      {col.column_name} ({col.type})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="측정값 (Metrics)">
                <Select
                  mode="multiple"
                  placeholder="측정할 컬럼을 선택하세요"
                  value={chartConfig.params.metrics || []}
                  onChange={(value) => updateChartParams('metrics', value)}
                >
                  {numericColumns.map(col => (
                    <Option key={`sum__${col.column_name}`} value={`sum__${col.column_name}`}>
                      SUM({col.column_name})
                    </Option>
                  ))}
                  {numericColumns.map(col => (
                    <Option key={`avg__${col.column_name}`} value={`avg__${col.column_name}`}>
                      AVG({col.column_name})
                    </Option>
                  ))}
                  {datasetColumns.map(col => (
                    <Option key={`count__${col.column_name}`} value={`count__${col.column_name}`}>
                      COUNT({col.column_name})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {chartConfig.viz_type === 'table' && (
            <Form.Item label="표시할 컬럼 (All Columns)">
              <Select
                mode="multiple"
                placeholder="표시할 모든 컬럼을 선택하세요"
                value={chartConfig.params.all_columns || []}
                onChange={(value) => updateChartParams('all_columns', value)}
              >
                {datasetColumns.map(col => (
                  <Option key={col.column_name} value={col.column_name}>
                    {col.column_name} ({col.type})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="행 제한">
                <InputNumber
                  min={1}
                  max={10000}
                  value={chartConfig.params.row_limit || 1000}
                  onChange={(value) => updateChartParams('row_limit', value)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            {chartConfig.viz_type !== 'table' && (
              <Col span={12}>
                <Form.Item label="색상 테마">
                  <Select
                    value={chartConfig.params.color_scheme || 'bnbColors'}
                    onChange={(value) => updateChartParams('color_scheme', value)}
                  >
                    <Option value="bnbColors">기본</Option>
                    <Option value="googleCategory10c">Google</Option>
                    <Option value="d3Category10">D3 Category</Option>
                    <Option value="superset">Superset</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Card>
    );
  };

  const renderChartDetails = () => (
    <Card title="4단계: 차트 정보" style={{ marginBottom: 16 }}>
      <Form layout="vertical">
        <Form.Item
          label="차트 이름"
          required
        >
          <Input
            placeholder="차트의 이름을 입력하세요"
            value={chartConfig.slice_name}
            onChange={(e) => setChartConfig(prev => ({ ...prev, slice_name: e.target.value }))}
          />
        </Form.Item>

        <Form.Item label="설명">
          <TextArea
            rows={3}
            placeholder="차트에 대한 설명을 입력하세요 (선택사항)"
            value={chartConfig.description}
            onChange={(e) => setChartConfig(prev => ({ ...prev, description: e.target.value }))}
          />
        </Form.Item>
      </Form>
    </Card>
  );

  const renderPreview = () => (
    <Card 
      title="5단계: 미리보기 및 저장" 
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={previewChart}
            loading={previewLoading}
          >
            미리보기
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={saveChart}
          >
            차트 저장
          </Button>
        </Space>
      }
    >
      {chartData ? (
        <div style={{ 
          padding: 20, 
          border: '1px solid #d9d9d9', 
          borderRadius: 6,
          background: '#fafafa',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: 16 }}>
            <Tag color="green">미리보기 생성 완료</Tag>
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            차트 타입: {chartConfig.viz_type.toUpperCase()}
            <br />
            데이터 행 수: {chartData.query?.rowcount || 0}
            <br />
            실행 시간: {chartData.query?.duration || 0}ms
          </div>
          <div style={{ marginTop: 16, fontSize: '12px', color: '#999' }}>
            실제 차트는 Superset에서 렌더링됩니다
          </div>
        </div>
      ) : (
        <Empty description="미리보기를 생성하려면 '미리보기' 버튼을 클릭하세요" />
      )}
    </Card>
  );

  const steps = [
    { title: '데이터셋', description: '데이터 선택' },
    { title: '차트 타입', description: '시각화 유형' },
    { title: '설정', description: '차트 구성' },
    { title: '정보', description: '이름 및 설명' },
    { title: '저장', description: '미리보기 및 저장' }
  ];

  if (!authService.canCreateChart()) {
    return (
      <Alert
        message="접근 권한 없음"
        description="차트 생성 권한이 없습니다."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
              차트 빌더
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              Apache Superset을 사용하여 차트를 생성하고 관리합니다.
            </p>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={resetForm}
          >
            새로 시작
          </Button>
        </div>
      </div>

      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step 
            key={index} 
            title={step.title} 
            description={step.description}
            onClick={() => setCurrentStep(index)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </Steps>

      {datasets.length === 0 ? (
        <Alert
          message="데이터셋이 필요합니다"
          description="차트를 생성하려면 먼저 데이터 소스에서 데이터셋을 생성해야 합니다."
          type="info"
          showIcon
          action={
            <Button type="primary" onClick={() => window.location.href = '/datasources'}>
              데이터 소스 관리로 이동
            </Button>
          }
        />
      ) : (
        <>
          {renderDatasetSelection()}
          {selectedDataset && renderChartTypeSelection()}
          {selectedDataset && chartConfig.viz_type && datasetColumns.length > 0 && renderChartConfiguration()}
          {selectedDataset && chartConfig.viz_type && renderChartDetails()}
          {selectedDataset && chartConfig.viz_type && renderPreview()}
        </>
      )}
    </div>
  );
};

export default ChartBuilder;
