<!-- vue-frontend/src/components/chart-builder/ChartPreview.vue -->
<template>
  <div>
    <a-card 
      title="5단계: 미리보기 및 저장" 
      style="margin-bottom: 24px"
    >
      <!-- 미리보기 액션 버튼 -->
      <template #extra>
        <a-space>
          <a-button 
            @click="handlePreview"
            :loading="previewLoading"
            size="large"
          >
            <template #icon>
              <EyeOutlined />
            </template>
            미리보기 생성
          </a-button>
          
          <!-- ✅ 추가: 익스포트 드롭다운 메뉴 -->
          <a-dropdown v-if="chartData" :trigger="['click']">
            <a-button size="large">
              <template #icon>
                <DownloadOutlined />
              </template>
              결과 보기
              <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleExportMenu">
                <a-menu-item key="json">
                  <FileTextOutlined />
                  JSON 형식으로 보기
                </a-menu-item>
                <a-menu-item key="html-table">
                  <TableOutlined />
                  HTML 테이블로 보기
                </a-menu-item>
                <a-menu-item key="html-chart">
                  <PictureOutlined />
                  HTML 차트로 보기 (시각화)
                </a-menu-item>
                <a-menu-item key="csv">
                  <TableOutlined />
                  CSV 다운로드
                </a-menu-item>
                <a-menu-item key="image">
                  <PictureOutlined />
                  이미지로 보기 (PNG)
                </a-menu-item>
                <a-menu-item key="iframe">
                  <LinkOutlined />
                  iframe으로 보기
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          
          <a-button 
            v-if="chartData"
            @click="refreshPreview"
            size="large"
          >
            <template #icon>
              <ReloadOutlined />
            </template>
            새로고침
          </a-button>
        </a-space>
      </template>

      <!-- 미리보기 영역 -->
      <div style="min-height: 300px">
        <div v-if="previewLoading" style="text-align: center; padding: 80px 0">
          <a-spin size="large" />
          <p style="margin-top: 16px; color: #666">
            차트 미리보기를 생성하고 있습니다...
          </p>
        </div>

        <div v-else-if="chartData" style="padding: 20px">
          <!-- 차트 렌더러 컴포넌트 사용 -->
          <div style="margin-bottom: 24px">
            <a-tabs v-model:activeKey="activeTab" type="card">
              <!-- ✅ 기존 Vue 렌더링 탭 유지 -->
              <a-tab-pane key="vue" tab="Vue.js 렌더링">
                <ChartRenderer
                  :chartConfig="chartConfig"
                  :chartData="chartData"
                  :width="800"
                  :height="400"
                />
              </a-tab-pane>
              
              <!-- ✅ 기존 데이터 정보 탭 유지 -->
              <a-tab-pane key="info" tab="데이터 정보">
                <div style="background: #f8f9fa; padding: 24px; border-radius: 8px">
                  <a-descriptions title="차트 상세 정보" :column="2" size="small" bordered>
                    <a-descriptions-item label="차트 이름">
                      {{ chartConfig.slice_name || '이름 없음' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="차트 타입">
                      {{ getChartTypeName() }}
                    </a-descriptions-item>
                    <a-descriptions-item label="데이터 행 수">
                      {{ chartData.query?.rowcount || 0 }}행
                    </a-descriptions-item>
                    <a-descriptions-item label="실행 시간">
                      {{ chartData.query?.duration || 0 }}ms
                    </a-descriptions-item>
                    <a-descriptions-item label="데이터 컬럼">
                      {{ (chartData.query?.columns || []).join(', ') || 'None' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="메트릭">
                      {{ (chartData.query?.metrics || []).join(', ') }}
                    </a-descriptions-item>
                    <a-descriptions-item label="캐시 상태">
                      {{ chartData.is_cached ? '캐시됨' : '실시간' }}
                    </a-descriptions-item>
                    <a-descriptions-item label="생성 시간">
                      {{ new Date().toLocaleString() }}
                    </a-descriptions-item>
                  </a-descriptions>

                  <div v-if="chartData.data && chartData.data.length > 0" style="margin-top: 24px">
                    <h4>📊 데이터 미리보기 (상위 5개 레코드)</h4>
                    <a-table
                      :dataSource="previewData"
                      :columns="previewColumns"
                      :pagination="false"
                      size="small"
                      bordered
                    />
                  </div>
                </div>
              </a-tab-pane>
              
              <!-- ✅ 기존 Raw 데이터 탭 유지 -->
              <a-tab-pane key="raw" tab="Raw 데이터">
                <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; max-height: 400px; overflow: auto">
                  <pre style="margin: 0; font-size: 12px; line-height: 1.4">{{ JSON.stringify(chartData, null, 2) }}</pre>
                </div>
              </a-tab-pane>

              <!-- ✅✅✅ 여기부터 새로 추가되는 탭들 ✅✅✅ -->
              
              <!-- 🆕 JSON 탭 -->
              <a-tab-pane key="json" tab="JSON 데이터" v-if="exportedData.json">
                <div style="max-height: 500px; overflow: auto;">
                  <pre style="background: #f5f5f5; padding: 16px; border-radius: 4px; font-size: 12px;">{{ JSON.stringify(exportedData.json, null, 2) }}</pre>
                </div>
                <a-button 
                  type="primary" 
                  size="small" 
                  style="margin-top: 8px"
                  @click="copyToClipboard(JSON.stringify(exportedData.json, null, 2))"
                >
                  <template #icon>
                    <CopyOutlined />
                  </template>
                  복사
                </a-button>
              </a-tab-pane>

              <!-- 🆕 HTML 탭 -->
              <a-tab-pane key="html-table" tab="HTML 테이블" v-if="exportedData.html && exportedData.htmlType === 'table'">
                <div style="max-height: 500px; overflow: auto; border: 1px solid #d9d9d9; padding: 16px; background: #fff;">
                  <div v-html="exportedData.html"></div>
                </div>
                <a-space style="margin-top: 8px">
                  <a-button 
                    type="primary" 
                    size="small"
                    @click="copyToClipboard(exportedData.html)"
                  >
                    <template #icon>
                      <CopyOutlined />
                    </template>
                    HTML 복사
                  </a-button>
                  <a-button 
                    size="small"
                    @click="downloadHTML('table')"
                  >
                    <template #icon>
                      <DownloadOutlined />
                    </template>
                    HTML 파일 다운로드
                  </a-button>
                </a-space>
              </a-tab-pane>

              <a-tab-pane key="html-chart" tab="HTML 차트" v-if="exportedData.html && exportedData.htmlType === 'chart'">
                <div style="max-height: 500px; overflow: auto; border: 1px solid #d9d9d9; padding: 16px; background: #fff;">
                  <iframe 
                    :srcdoc="exportedData.html" 
                    style="width: 100%; height: 600px; border: none;"
                    title="Chart HTML Preview"
                  ></iframe>
                </div>
                <a-space style="margin-top: 8px">
                  <a-button 
                    type="primary" 
                    size="small"
                    @click="downloadHTML('chart')"
                  >
                    <template #icon>
                      <DownloadOutlined />
                    </template>
                    HTML 파일 다운로드
                  </a-button>
                  <a-button 
                    size="small"
                    @click="copyToClipboard(exportedData.html)"
                  >
                    <template #icon>
                      <CopyOutlined />
                    </template>
                    HTML 복사
                  </a-button>
                </a-space>
              </a-tab-pane>

              <!-- 🆕 CSV 탭 -->
              <a-tab-pane key="csv" tab="CSV" v-if="exportedData.csv">
                <div style="max-height: 500px; overflow: auto;">
                  <pre style="background: #f5f5f5; padding: 16px; border-radius: 4px; font-size: 12px; white-space: pre-wrap;">{{ exportedData.csv }}</pre>
                </div>
                <a-space style="margin-top: 8px">
                  <a-button 
                    type="primary" 
                    size="small"
                    @click="downloadCSV"
                  >
                    <template #icon>
                      <DownloadOutlined />
                    </template>
                    다운로드
                  </a-button>
                  <a-button 
                    size="small"
                    @click="copyToClipboard(exportedData.csv)"
                  >
                    <template #icon>
                      <CopyOutlined />
                    </template>
                    복사
                  </a-button>
                </a-space>
              </a-tab-pane>

              <!-- 🆕 이미지 탭 -->
              <a-tab-pane key="image" tab="이미지 (PNG)" v-if="exportedData.image">
                <div style="text-align: center; padding: 16px; background: #fafafa; border: 1px dashed #d9d9d9;">
                  <img :src="exportedData.image" style="max-width: 100%; height: auto;" alt="Chart Preview" />
                </div>
                <a-button 
                  type="primary" 
                  size="small" 
                  style="margin-top: 8px"
                  @click="downloadImage"
                >
                  <template #icon>
                    <DownloadOutlined />
                  </template>
                  이미지 다운로드
                </a-button>
              </a-tab-pane>

              <!-- 🆕 iframe 탭 -->
              <a-tab-pane key="iframe" tab="iframe 임베드" v-if="exportedData.iframeUrl">
                <div style="border: 1px solid #d9d9d9; height: 500px; background: #fff;">
                  <iframe 
                    :src="exportedData.iframeUrl" 
                    style="width: 100%; height: 100%; border: none;"
                    title="Superset Chart Embed"
                  ></iframe>
                </div>
                <div style="margin-top: 8px; background: #f5f5f5; padding: 12px; border-radius: 4px;">
                  <p style="margin: 0 0 8px 0; font-weight: 600;">임베드 코드:</p>
                  <pre style="background: #fff; padding: 12px; border-radius: 4px; font-size: 12px; margin: 0;">{{ getIframeCode() }}</pre>
                  <a-button 
                    type="primary" 
                    size="small" 
                    style="margin-top: 8px"
                    @click="copyToClipboard(getIframeCode())"
                  >
                    <template #icon>
                      <CopyOutlined />
                    </template>
                    코드 복사
                  </a-button>
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>

          <!-- 차트 기본 정보 요약 -->
          <div style="background: #e6f7ff; padding: 16px; border-radius: 8px; border: 1px solid #91d5ff">
            <div style="display: flex; align-items: center; margin-bottom: 12px">
              <component 
                :is="chartIcons[chartConfig.viz_type]" 
                style="font-size: 24px; color: #1890ff; margin-right: 12px" 
              />
              <h3 style="margin: 0; color: #1890ff">
                {{ getChartTypeName() }} 미리보기 완료!
              </h3>
            </div>
            
            <a-row :gutter="16">
              <a-col :span="6">
                <a-statistic title="데이터 행 수" :value="chartData.query?.rowcount || 0" />
              </a-col>
              <a-col :span="6">
                <a-statistic title="컬럼 수" :value="(chartData.data && chartData.data.length > 0) ? Object.keys(chartData.data[0]).length : 0" />
              </a-col>
              <a-col :span="6">
                <a-statistic title="실행 시간" :value="chartData.query?.duration || 0" suffix="ms" />
              </a-col>
              <a-col :span="6">
                <a-statistic title="캐시" :value="chartData.is_cached ? '적용' : '미적용'" />
              </a-col>
            </a-row>
            
            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #d9d9d9">
              <p style="margin: 0; font-size: 14px; color: #666">
                ✨ Vue.js에서 실시간으로 렌더링된 차트입니다. 
                차트를 저장하면 Apache Superset에서도 동일하게 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div v-else style="text-align: center; padding: 80px 0">
          <a-empty description="미리보기를 생성하려면 '미리보기 생성' 버튼을 클릭하세요">
            <template #image>
              <BarChartOutlined style="font-size: 64px; color: #d9d9d9" />
            </template>
          </a-empty>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { message } from 'ant-design-vue'  // ✅ 이 줄 추가 (defineComponent import 바로 아래)
import {
  EyeOutlined,
  ReloadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
  AreaChartOutlined,
  DotChartOutlined,
  DownloadOutlined,        // ✅ 추가
  DownOutlined,            // ✅ 추가
  FileTextOutlined,        // ✅ 추가
  CodeOutlined,            // ✅ 추가
  PictureOutlined,         // ✅ 추가
  LinkOutlined,            // ✅ 추가
  CopyOutlined             // ✅ 추가
} from '@ant-design/icons-vue'
import ChartRenderer from '../ChartRenderer.vue'
import supersetAPI from '../../services/supersetAPI'

export default defineComponent({
  name: 'ChartPreview',
  components: {
    EyeOutlined,
    ReloadOutlined,
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    TableOutlined,
    AreaChartOutlined,
    DotChartOutlined,
    DownloadOutlined,        // ✅ 추가
    DownOutlined,            // ✅ 추가
    FileTextOutlined,        // ✅ 추가
    CodeOutlined,            // ✅ 추가
    PictureOutlined,         // ✅ 추가
    LinkOutlined,            // ✅ 추가
    CopyOutlined,            // ✅ 추가
    ChartRenderer
  },
  props: {
    chartConfig: {
      type: Object,
      required: true
    },
    chartData: {
      type: Object,
      default: null
    },
    previewLoading: {
      type: Boolean,
      default: false
    },
    selectedDataset: {
      type: Object,
      default: null
    }
  },
  emits: ['preview', 'save', 'back'],
  setup (props, { emit }) {
    const activeTab = ref('vue')
    
    // ✅✅✅ 여기부터 새로 추가 ✅✅✅
    const exportedData = ref({
      json: null,
      html: null,
      htmlType: null,  // ✅ 추가: 'table' 또는 'chart'
      csv: null,
      image: null,
      iframeUrl: null
    })
    const exportLoading = ref(false)
    // ✅✅✅ 여기까지 새로 추가 ✅✅✅

    const chartTypeNames = {
      table: '테이블',
      dist_bar: '막대 차트',
      line: '선 차트',
      pie: '파이 차트',
      area: '영역 차트',
      scatter: '산점도'
    }

    const chartIcons = {
      table: TableOutlined,
      dist_bar: BarChartOutlined,
      line: LineChartOutlined,
      pie: PieChartOutlined,
      area: AreaChartOutlined,
      scatter: DotChartOutlined
    }

    const getChartTypeName = () => {
      return chartTypeNames[props.chartConfig.viz_type] || props.chartConfig.viz_type
    }

    const handlePreview = () => {
      emit('preview')
    }

    const refreshPreview = () => {
      // ✅ 수정: 익스포트 데이터 초기화 추가
      exportedData.value = {
        json: null,
        html: null,
        htmlType: null,  // ✅ 추가
        csv: null,
        image: null,
        iframeUrl: null
      }
      activeTab.value = 'vue'
      
      emit('preview')
    }

    // ✅✅✅ 여기부터 모든 새로운 함수들 추가 ✅✅✅

    // 익스포트 메뉴 핸들러
    const handleExportMenu = async ({ key }) => {
      if (!props.chartData) {
        message.warning('먼저 차트 미리보기를 생성해주세요.')
        return
      }

      exportLoading.value = true
      activeTab.value = key

      try {
        switch (key) {
          case 'json':
            exportedData.value.json = props.chartData
            message.success('JSON 데이터를 불러왔습니다.')
            break

          case 'html-table':
            exportedData.value.html = convertToHTML(props.chartData, false)
            exportedData.value.htmlType = 'table'
            message.success('HTML 테이블을 생성했습니다.')
            break

          case 'html-chart':
            exportedData.value.html = convertToHTML(props.chartData, true)
            exportedData.value.htmlType = 'chart'
            message.success('HTML 차트를 생성했습니다.')
            break

          case 'csv':
            exportedData.value.csv = convertToCSV(props.chartData)
            message.success('CSV 데이터를 생성했습니다.')
            break

          case 'image':
            if (props.chartConfig.slice_id) {
              try {
                const imageData = await supersetAPI.exportChartAsImage(props.chartConfig.slice_id)
                exportedData.value.image = imageData
                message.success('이미지를 생성했습니다.')
              } catch (error) {
                message.warning('Superset에서 이미지를 가져올 수 없습니다. 차트를 먼저 저장해주세요.')
                console.error('이미지 익스포트 오류:', error)
              }
            } else {
              message.warning('이미지 익스포트는 차트 저장 후 사용할 수 있습니다.')
            }
            break

          case 'iframe':
            if (props.chartConfig.slice_id) {
              exportedData.value.iframeUrl = window.location.origin + 
                supersetAPI.getChartEmbedUrl(props.chartConfig.slice_id)
              message.success('iframe 임베드 코드를 생성했습니다.')
            } else {
              message.warning('iframe 임베드는 차트 저장 후 사용할 수 있습니다.')
            }
            break
        }
      } catch (error) {
        console.error('익스포트 오류:', error)
        message.error(`${key.toUpperCase()} 익스포트 중 오류가 발생했습니다.`)
      } finally {
        exportLoading.value = false
      }
    }

    // ✅ Canvas에서 차트 이미지 추출
    const getChartImageFromCanvas = () => {
      try {
        // ChartRenderer에서 렌더링된 canvas 찾기
        const canvasElements = document.querySelectorAll('canvas')
        
        if (canvasElements.length === 0) {
          console.warn('⚠️ Canvas 요소를 찾을 수 없습니다')
          return null
        }

        // 차트 렌더러의 canvas 찾기 (일반적으로 마지막 canvas)
        let chartCanvas = null
        
        // ChartRenderer 컴포넌트 내부의 canvas 찾기
        canvasElements.forEach(canvas => {
          // 크기가 있는 canvas만 선택 (빈 canvas 제외)
          if (canvas.width > 100 && canvas.height > 100) {
            chartCanvas = canvas
          }
        })

        if (!chartCanvas) {
          console.warn('⚠️ 유효한 차트 canvas를 찾을 수 없습니다')
          return null
        }

        // Canvas를 Base64 이미지로 변환
        const imageData = chartCanvas.toDataURL('image/png')
        console.log('✅ 차트 이미지 추출 완료')
        
        return imageData
      } catch (error) {
        console.error('❌ 차트 이미지 추출 오류:', error)
        return null
      }
    }

    // HTML 변환 함수
    // ✅ HTML 변환 함수 - 차트 시각화 버전 추가
    const convertToHTML = (chartData, includeChart = true) => {
      console.log('🔍 convertToHTML 호출됨, includeChart:', includeChart)
      console.log('📊 전달받은 chartData:', chartData)
      
      // 데이터 구조 확인 및 추출
      let data = []
      
      if (chartData.data && Array.isArray(chartData.data)) {
        data = chartData.data
        console.log('✅ chartData.data에서 데이터 추출:', data.length, '행')
      }
      else if (chartData.result && chartData.result.length > 0 && chartData.result[0].data) {
        data = chartData.result[0].data
        console.log('✅ chartData.result[0].data에서 데이터 추출:', data.length, '행')
      }
      else {
        console.error('❌ 데이터를 찾을 수 없습니다. chartData 구조:', Object.keys(chartData))
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ 데이터 배열이 비어있습니다')
        return '<p style="padding: 20px; text-align: center; color: #999;">데이터가 없습니다.</p>'
      }

      console.log('📋 첫 번째 데이터 행:', data[0])
      const columns = Object.keys(data[0])
      console.log('📊 컬럼 목록:', columns)

      // ✅ 차트 이미지 포함 여부에 따라 다른 HTML 생성
      let html = ''

      // 🆕 차트 시각화를 포함하는 경우
      if (includeChart) {
        // Canvas에서 차트 이미지 추출
        const chartImageData = getChartImageFromCanvas()
        
        html = `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${props.chartConfig.slice_name || '차트'} - Export</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                max-width: 1200px;
                margin: 20px auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .container {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              h1 {
                color: #1890ff;
                margin-bottom: 10px;
              }
              .metadata {
                color: #666;
                font-size: 14px;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e8e8e8;
              }
              .chart-container {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #fafafa;
                border-radius: 4px;
              }
              .chart-image {
                max-width: 100%;
                height: auto;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 30px;
              }
              th {
                background-color: #1890ff;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: 600;
              }
              td {
                padding: 8px 12px;
                border-bottom: 1px solid #e8e8e8;
              }
              tr:nth-child(even) {
                background-color: #f5f5f5;
              }
              tr:hover {
                background-color: #e6f7ff;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e8e8e8;
                color: #999;
                font-size: 12px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${props.chartConfig.slice_name || '차트'}</h1>
              <div class="metadata">
                <p><strong>차트 타입:</strong> ${getChartTypeName()}</p>
                <p><strong>생성 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                <p><strong>데이터 행 수:</strong> ${data.length}개</p>
                ${props.chartConfig.description ? `<p><strong>설명:</strong> ${props.chartConfig.description}</p>` : ''}
              </div>

              ${chartImageData ? `
              <div class="chart-container">
                <h2 style="color: #333; font-size: 18px; margin-bottom: 15px;">📊 차트 시각화</h2>
                <img src="${chartImageData}" alt="Chart Visualization" class="chart-image">
              </div>
              ` : ''}

              <h2 style="color: #333; font-size: 18px; margin: 30px 0 15px 0;">📋 데이터 테이블</h2>
              <table>
                <thead>
                  <tr>
                    ${columns.map(col => `<th>${col}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${data.map(row => `
                    <tr>
                      ${columns.map(col => {
                        const value = row[col]
                        if (col.includes('DATE') && typeof value === 'number' && value > 1000000000000) {
                          const date = new Date(value)
                          return `<td>${date.toLocaleString('ko-KR')}</td>`
                        }
                        return `<td>${value !== null && value !== undefined ? value : 'N/A'}</td>`
                      }).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="footer">
                <p>Generated by Apache Superset Vue.js Integration | ${new Date().toLocaleString('ko-KR')}</p>
              </div>
            </div>
          </body>
          </html>
        `
      }
      // 기존 테이블만 포함하는 경우
      else {
        html = `
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
            <thead>
              <tr style="background-color: #1890ff; color: white;">
                ${columns.map(col => `<th style="padding: 12px; text-align: left;">${col}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map((row, idx) => `
                <tr style="background-color: ${idx % 2 === 0 ? '#f5f5f5' : 'white'};">
                  ${columns.map(col => {
                    const value = row[col]
                    if (col.includes('DATE') && typeof value === 'number' && value > 1000000000000) {
                      const date = new Date(value)
                      return `<td style="padding: 8px;">${date.toLocaleString('ko-KR')}</td>`
                    }
                    return `<td style="padding: 8px;">${value !== null && value !== undefined ? value : 'N/A'}</td>`
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `
      }

      console.log('✅ HTML 생성 완료, 길이:', html.length)
      return html
    }

    // CSV 변환 함수
    const convertToCSV = (chartData) => {
      // ✅ 데이터 구조 확인 및 추출
      let data = []
      
      // 방법 1: chartData.data 직접 접근 (현재 구조)
      if (chartData.data && Array.isArray(chartData.data)) {
        data = chartData.data
      }
      // 방법 2: chartData.result[0].data 구조
      else if (chartData.result && chartData.result.length > 0 && chartData.result[0].data) {
        data = chartData.result[0].data
      }
      
      // 데이터가 없는 경우
      if (data.length === 0) {
        return ''
      }

      const columns = Object.keys(data[0])
      let csv = columns.join(',') + '\n'
      
      data.forEach(row => {
        csv += columns.map(col => {
          const value = row[col]
          if (value === null || value === undefined) {
            return ''
          }
          
          // ✅ 타임스탬프 값을 읽기 쉬운 날짜로 변환
          if (col.includes('DATE') && typeof value === 'number' && value > 1000000000000) {
            const date = new Date(value)
            return `"${date.toLocaleString('ko-KR')}"`
          }
          
          const stringValue = String(value)
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"` 
            : stringValue
        }).join(',') + '\n'
      })

      return csv
    }

    // iframe 코드 생성
    const getIframeCode = () => {
      if (!exportedData.value.iframeUrl) return ''
      
      return `<iframe 
  src="${exportedData.value.iframeUrl}" 
  width="100%" 
  height="600" 
  frameborder="0"
  title="Superset Chart"
></iframe>`
    }

    // 클립보드 복사
    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        message.success('클립보드에 복사되었습니다.')
      } catch (error) {
        console.error('클립보드 복사 오류:', error)
        message.error('클립보드 복사에 실패했습니다.')
      }
    }

    // CSV 다운로드
    const downloadCSV = () => {
      if (!exportedData.value.csv) return

      const blob = new Blob([exportedData.value.csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `chart_${props.chartConfig.slice_name || 'export'}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      message.success('CSV 파일이 다운로드되었습니다.')
    }

    // ✅ HTML 파일 다운로드
    const downloadHTML = (type) => {
      if (!exportedData.value.html) return

      const blob = new Blob([exportedData.value.html], { type: 'text/html;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      const filename = type === 'chart' 
        ? `chart_visualization_${props.chartConfig.slice_name || 'export'}.html`
        : `chart_table_${props.chartConfig.slice_name || 'export'}.html`
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      message.success('HTML 파일이 다운로드되었습니다.')
    }

    // 이미지 다운로드
    const downloadImage = () => {
      if (!exportedData.value.image) return

      const link = document.createElement('a')
      link.href = exportedData.value.image
      link.download = `chart_${props.chartConfig.slice_name || 'export'}.png`
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      message.success('이미지 파일이 다운로드되었습니다.')
    }

    // ✅✅✅ 여기까지 새로운 함수들 ✅✅✅

    // 데이터 미리보기용 처리 (기존 유지)
    const previewData = computed(() => {
      if (!props.chartData?.data || props.chartData.data.length === 0) {
        return []
      }
      
      return props.chartData.data.slice(0, 5).map((row, index) => ({
        key: index,
        ...row
      }))
    })

    const previewColumns = computed(() => {
      if (!props.chartData?.data || props.chartData.data.length === 0) {
        return []
      }
      
      const firstRow = props.chartData.data[0]
      return Object.keys(firstRow).map(key => ({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        dataIndex: key,
        key: key,
        width: 120,
        ellipsis: true
      }))
    })

    return {
      activeTab,
      chartIcons,
      exportedData,              // ✅ 추가
      exportLoading,             // ✅ 추가
      getChartTypeName,
      handlePreview,
      refreshPreview,
      handleExportMenu,          // ✅ 추가
      convertToHTML,             // ✅ 추가
      getChartImageFromCanvas,  // ✅ 추가
      downloadHTML,              // ✅ 추가
      convertToCSV,              // ✅ 추가
      getIframeCode,             // ✅ 추가
      copyToClipboard,           // ✅ 추가
      downloadCSV,               // ✅ 추가
      downloadImage,             // ✅ 추가
      previewData,
      previewColumns
    }
  }
})
</script>

<style scoped>
.ant-descriptions-item-label {
  font-weight: 500;
}

.ant-card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ant-tabs-card .ant-tabs-tab {
  border-radius: 6px 6px 0 0;
}

.ant-statistic-title {
  font-size: 12px;
  color: #666;
}

.ant-statistic-content {
  font-size: 16px;
  font-weight: 600;
}

pre {
  font-family: 'Courier New', Consolas, monospace;
  color: #333;
}

/* 탭 스타일 개선 */
.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
  background: #fafafa;
  border: 1px solid #d9d9d9;
  margin-right: 4px;
}

.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
  background: white;
  border-bottom-color: white;
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .ant-col {
    margin-bottom: 16px;
  }
  
  .ant-descriptions {
    font-size: 12px;
  }
  
  .chart-renderer {
    overflow-x: auto;
  }
}
</style>