<template>
  <a-modal
    v-model:open="visible"
    :title="`데이터셋 상세 정보: ${dataset?.table_name || ''}`"
    :width="1000"
    :footer="null"
    @cancel="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>데이터셋 정보를 불러오는 중...</p>
    </div>

    <div v-else-if="datasetDetail">
      <a-tabs v-model:activeKey="activeTab">
        <!-- 기본 정보 탭 -->
        <a-tab-pane key="info" tab="기본 정보">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="테이블명">
              {{ datasetDetail.table_name }}
            </a-descriptions-item>
            <a-descriptions-item label="스키마">
              {{ datasetDetail.schema || 'default' }}
            </a-descriptions-item>
            <a-descriptions-item label="데이터베이스">
              {{ datasetDetail.database?.database_name }}
            </a-descriptions-item>
            <a-descriptions-item label="데이터소스 타입">
              {{ datasetDetail.datasource_type }}
            </a-descriptions-item>
            <a-descriptions-item label="생성자">
              {{ datasetDetail.changed_by_name }}
            </a-descriptions-item>
            <a-descriptions-item label="생성일시">
              {{ formatDate(datasetDetail.changed_on_utc) }}
            </a-descriptions-item>
            <a-descriptions-item label="설명" :span="2">
              {{ datasetDetail.description || '설명 없음' }}
            </a-descriptions-item>
            <a-descriptions-item label="UUID" :span="2">
              <a-typography-text code>{{ datasetDetail.uuid }}</a-typography-text>
            </a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <!-- 컬럼 정보 탭 -->
        <a-tab-pane key="columns" tab="컬럼 정보">
          <div style="margin-bottom: 16px">
            <a-space>
              <a-input
                v-model:value="columnSearchText"
                placeholder="컬럼 검색"
                style="width: 200px"
                @change="handleColumnSearch"
              >
                <template #prefix>
                  <SearchOutlined />
                </template>
              </a-input>
              <a-select
                v-model:value="columnTypeFilter"
                placeholder="타입 필터"
                style="width: 150px"
                allow-clear
                @change="handleColumnFilter"
              >
                <a-select-option
                  v-for="type in availableColumnTypes"
                  :key="type"
                  :value="type"
                >
                  {{ type }}
                </a-select-option>
              </a-select>
            </a-space>
          </div>

          <a-table
            :dataSource="filteredColumns"
            :columns="columnTableColumns"
            :pagination="{ pageSize: 10, showSizeChanger: true }"
            size="small"
            :scroll="{ x: 800 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <a-tag :color="getColumnTypeColor(record.type)">
                  {{ record.type }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'is_dttm'">
                <a-tag v-if="record.is_dttm" color="blue">DateTime</a-tag>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'filterable'">
                <a-tag v-if="record.filterable" color="green">필터 가능</a-tag>
                <a-tag v-else color="red">필터 불가</a-tag>
              </template>
              <template v-else-if="column.key === 'groupby'">
                <a-tag v-if="record.groupby" color="green">그룹화 가능</a-tag>
                <a-tag v-else color="red">그룹화 불가</a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 메트릭 정보 탭 -->
        <a-tab-pane key="metrics" tab="메트릭 정보">
          <a-table
            :dataSource="datasetDetail.metrics || []"
            :columns="metricTableColumns"
            :pagination="{ pageSize: 10 }"
            size="small"
            :scroll="{ x: 600 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'expression'">
                <a-typography-text code>{{ record.expression }}</a-typography-text>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 샘플 데이터 탭 -->
        <a-tab-pane key="sample" tab="샘플 데이터">
          <div style="margin-bottom: 16px">
            <a-space>
              <a-button @click="loadSampleData" :loading="sampleLoading">
                <template #icon>
                  <ReloadOutlined />
                </template>
                샘플 데이터 새로고침
              </a-button>
              <a-input-number
                v-model:value="sampleLimit"
                :min="10"
                :max="1000"
                :step="10"
                placeholder="로우 수"
                style="width: 120px"
              />
            </a-space>
          </div>

          <div v-if="sampleLoading" class="loading-container">
            <a-spin />
            <p>샘플 데이터를 불러오는 중...</p>
          </div>

          <a-table
            v-else-if="sampleData && sampleData.length > 0"
            :dataSource="sampleData"
            :columns="sampleDataColumns"
            :pagination="{ pageSize: 20, showSizeChanger: true }"
            size="small"
            :scroll="{ x: 1200, y: 400 }"
          />

          <a-empty v-else description="샘플 데이터가 없습니다" />
        </a-tab-pane>
      </a-tabs>
    </div>

    <div v-else>
      <a-empty description="데이터셋 정보를 불러올 수 없습니다" />
    </div>
  </a-modal>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import supersetAPI from '../../services/supersetAPI'

export default defineComponent({
  name: 'DatasetDetailModal',
  components: {
    SearchOutlined,
    ReloadOutlined
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dataset: {
      type: Object,
      default: null
    }
  },
  emits: ['update:visible', 'close'],
  setup(props, { emit }) {
    // 상태 관리
    const loading = ref(false)
    const datasetDetail = ref(null)
    const activeTab = ref('info')
    
    // 컬럼 관련 상태
    const columnSearchText = ref('')
    const columnTypeFilter = ref('')
    
    // 샘플 데이터 관련 상태
    const sampleLoading = ref(false)
    const sampleData = ref([])
    const sampleLimit = ref(100)

    // 테이블 컬럼 정의
    const columnTableColumns = [
      {
        title: '컬럼명',
        dataIndex: 'column_name',
        key: 'column_name',
        width: 150,
        fixed: 'left'
      },
      {
        title: '타입',
        dataIndex: 'type',
        key: 'type',
        width: 100
      },
      {
        title: '설명',
        dataIndex: 'description',
        key: 'description',
        width: 200
      },
      {
        title: 'DateTime',
        dataIndex: 'is_dttm',
        key: 'is_dttm',
        width: 100
      },
      {
        title: '필터링',
        dataIndex: 'filterable',
        key: 'filterable',
        width: 100
      },
      {
        title: '그룹화',
        dataIndex: 'groupby',
        key: 'groupby',
        width: 100
      }
    ]

    const metricTableColumns = [
      {
        title: '메트릭명',
        dataIndex: 'metric_name',
        key: 'metric_name',
        width: 150
      },
      {
        title: '표현식',
        dataIndex: 'expression',
        key: 'expression',
        width: 300
      },
      {
        title: '설명',
        dataIndex: 'description',
        key: 'description',
        width: 200
      }
    ]

    // Computed properties
    const availableColumnTypes = computed(() => {
      if (!datasetDetail.value?.columns) return []
      const types = [...new Set(datasetDetail.value.columns.map(col => col.type))]
      return types.sort()
    })

    const filteredColumns = computed(() => {
      if (!datasetDetail.value?.columns) return []
      
      let filtered = datasetDetail.value.columns
      
      if (columnSearchText.value) {
        const searchLower = columnSearchText.value.toLowerCase()
        filtered = filtered.filter(col => 
          col.column_name.toLowerCase().includes(searchLower) ||
          (col.description && col.description.toLowerCase().includes(searchLower))
        )
      }
      
      if (columnTypeFilter.value) {
        filtered = filtered.filter(col => col.type === columnTypeFilter.value)
      }
      
      return filtered
    })

    const sampleDataColumns = computed(() => {
      if (!sampleData.value || sampleData.value.length === 0) return []
      
      const firstRow = sampleData.value[0]
      return Object.keys(firstRow).map(key => ({
        title: key,
        dataIndex: key,
        key: key,
        width: 150,
        ellipsis: true
      }))
    })

    // 메서드
    const loadDatasetDetail = async () => {
      if (!props.dataset?.id) return
      
      loading.value = true
      try {
        const detail = await supersetAPI.getDatasetDetail(props.dataset.id)
        datasetDetail.value = detail
        console.log('데이터셋 상세 정보:', detail)
      } catch (error) {
        console.error('데이터셋 상세 정보 로드 오류:', error)
        message.error('데이터셋 상세 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    const loadSampleData = async () => {
      if (!props.dataset?.id) return
      
      sampleLoading.value = true
      try {
        const result = await supersetAPI.getDatasetSampleData(props.dataset.id, sampleLimit.value)
        if (result && result.result && result.result.length > 0) {
          sampleData.value = result.result[0].data || []
        } else {
          sampleData.value = []
        }
        console.log('샘플 데이터:', sampleData.value)
      } catch (error) {
        console.error('샘플 데이터 로드 오류:', error)
        message.error('샘플 데이터를 불러오는 중 오류가 발생했습니다.')
        sampleData.value = []
      } finally {
        sampleLoading.value = false
      }
    }

    const handleClose = () => {
      emit('update:visible', false)
      emit('close')
      // 상태 초기화
      datasetDetail.value = null
      sampleData.value = []
      activeTab.value = 'info'
      columnSearchText.value = ''
      columnTypeFilter.value = ''
    }

    const handleColumnSearch = () => {
      // 검색은 computed에서 자동으로 처리됨
    }

    const handleColumnFilter = () => {
      // 필터링은 computed에서 자동으로 처리됨
    }

    const getColumnTypeColor = (type) => {
      const colorMap = {
        'INTEGER': 'blue',
        'VARCHAR': 'green',
        'TEXT': 'green',
        'DATETIME': 'purple',
        'DATE': 'purple',
        'TIMESTAMP': 'purple',
        'DECIMAL': 'orange',
        'FLOAT': 'orange',
        'BOOLEAN': 'red'
      }
      return colorMap[type?.toUpperCase()] || 'default'
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString('ko-KR')
    }

    // Watchers
    watch(() => props.visible, (newVal) => {
      if (newVal && props.dataset) {
        loadDatasetDetail()
        // 샘플 데이터 탭이 활성화될 때 자동으로 로드
        if (activeTab.value === 'sample') {
          loadSampleData()
        }
      }
    })

    watch(activeTab, (newTab) => {
      if (newTab === 'sample' && sampleData.value.length === 0) {
        loadSampleData()
      }
    })

    watch(sampleLimit, () => {
      if (activeTab.value === 'sample' && props.visible) {
        loadSampleData()
      }
    })

    return {
      // 상태
      loading,
      datasetDetail,
      activeTab,
      columnSearchText,
      columnTypeFilter,
      sampleLoading,
      sampleData,
      sampleLimit,
      
      // computed
      availableColumnTypes,
      filteredColumns,
      sampleDataColumns,
      
      // 테이블 컬럼
      columnTableColumns,
      metricTableColumns,
      
      // 메서드
      handleClose,
      handleColumnSearch,
      handleColumnFilter,
      loadSampleData,
      getColumnTypeColor,
      formatDate
    }
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-container p {
  margin-top: 16px;
  color: #666;
}
</style>