<template>
  <div>
    <div style="margin-bottom: 24px">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600">
        데이터 소스 관리
      </h1>
      <p style="margin: 8px 0 0 0; color: #666">
        데이터베이스 연결과 데이터셋을 관리합니다.
      </p>
    </div>

    <a-alert
      v-if="!canConnectDatabase"
      message="접근 권한 없음"
      description="데이터 소스 관리 권한이 없습니다."
      type="warning"
      show-icon
    />

    <a-tabs v-else default-active-key="databases">
      <a-tab-pane tab="데이터베이스" key="databases">
        <a-card
          title="데이터베이스 연결"
        >
          <template #extra>
            <a-button
              type="primary"
              @click="showDatabaseModal"
            >
              <template #icon>
                <PlusOutlined />
              </template>
              데이터베이스 추가
            </a-button>
          </template>

          <a-table
            :dataSource="databases"
            :columns="databaseColumns"
            :loading="loading"
            :rowKey="record => record.id"
            :pagination="{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}개 항목`
            }"
          />
        </a-card>
      </a-tab-pane>

      <a-tab-pane tab="데이터셋" key="datasets">
        <a-card
          title="데이터셋"
        >
          <template #extra>
            <a-button
              type="primary"
              @click="showDatasetModal"
              :disabled="databases.length === 0"
            >
              <template #icon>
                <PlusOutlined />
              </template>
              데이터셋 추가
            </a-button>
          </template>

          <a-alert
            v-if="databases.length === 0"
            message="데이터베이스가 필요합니다"
            description="데이터셋을 생성하려면 먼저 데이터베이스를 연결해야 합니다."
            type="info"
            show-icon
            style="margin-bottom: 16px"
          />

          <a-table
            :dataSource="datasets"
            :columns="datasetColumns"
            :loading="loading"
            :rowKey="record => record.id"
            :pagination="{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}개 항목`
            }"
          />
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 데이터베이스 추가/편집 모달 -->
    <a-modal
      v-model:open="databaseModalVisible"
      :title="editingDatabase ? '데이터베이스 편집' : '데이터베이스 추가'"
      :footer="null"
      width="600px"
      @cancel="closeDatabaseModal"
    >
      <DatabaseForm
        :database="editingDatabase"
        :testing-connection="testingConnection"
        @submit="handleDatabaseSubmit"
        @test="testConnection"
        @cancel="closeDatabaseModal"
      />
    </a-modal>

    <!-- 데이터셋 추가/편집 모달 -->
    <a-modal
      v-model:open="datasetModalVisible"
      :title="editingDataset ? '데이터셋 편집' : '데이터셋 추가'"
      :footer="null"
      width="600px"
      @cancel="closeDatasetModal"
    >
      <DatasetForm
        :dataset="editingDataset"
        :databases="databases"
        @submit="handleDatasetSubmit"
        @cancel="closeDatasetModal"
      />
    </a-modal>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, h } from 'vue'
import {
  PlusOutlined,
  DatabaseOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import supersetAPI from '../services/supersetAPI'
import DatabaseForm from '../components/DatabaseForm.vue'
import DatasetForm from '../components/DatasetForm.vue'

export default defineComponent({
  name: 'DataSourceManagerView',
  components: {
    PlusOutlined,
    DatabaseForm,
    DatasetForm
  },
  setup () {
    const databases = ref([])
    const datasets = ref([])
    const loading = ref(false)
    const databaseModalVisible = ref(false)
    const datasetModalVisible = ref(false)
    const editingDatabase = ref(null)
    const editingDataset = ref(null)
    const testingConnection = ref(false)

    const canConnectDatabase = computed(() => authService.canConnectDatabase())

    // 데이터베이스 테이블 컬럼 정의
    const databaseColumns = [
      {
        title: '이름',
        dataIndex: 'database_name',
        key: 'database_name',
        customRender: ({ text }) => h('div', { style: { display: 'flex', alignItems: 'center' } }, [
          h(DatabaseOutlined, { style: { marginRight: '8px' } }),
          h('strong', text)
        ])
      },
      {
        title: 'URI',
        dataIndex: 'sqlalchemy_uri',
        key: 'sqlalchemy_uri',
        ellipsis: true,
        customRender: ({ text }) => h('code', {
          style: {
            fontSize: '12px',
            background: '#f5f5f5',
            padding: '2px 4px'
          }
        }, text)
      },
      {
        title: '상태',
        key: 'status',
        customRender: () => h('a-tag', {
          color: 'green'
        }, {
          icon: () => h(CheckCircleOutlined),
          default: () => '연결됨'
        })
      },
      {
        title: '작업',
        key: 'actions',
        customRender: ({ record }) => h('div', { style: { display: 'flex', gap: '8px' } }, [
          h('a-button', {
            type: 'text',
            size: 'small',
            onClick: () => editDatabase(record)
          }, {
            icon: () => h(EditOutlined),
            default: () => '편집'
          }),
          h('a-popconfirm', {
            title: '정말 삭제하시겠습니까?',
            onConfirm: () => deleteDatabase(record.id),
            okText: '삭제',
            cancelText: '취소'
          }, {
            default: () => h('a-button', {
              type: 'text',
              danger: true,
              size: 'small'
            }, {
              icon: () => h(DeleteOutlined),
              default: () => '삭제'
            })
          })
        ])
      }
    ]

    // 데이터셋 테이블 컬럼 정의
    const datasetColumns = [
      {
        title: '이름',
        dataIndex: 'table_name',
        key: 'table_name',
        customRender: ({ text, record }) => h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          h('strong', text),
          record.sql ? h('a-tag', { color: 'blue' }, 'SQL') : null
        ])
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
        customRender: ({ text }) => text || '-'
      },
      {
        title: '컬럼 수',
        dataIndex: 'columns',
        key: 'columns',
        customRender: ({ text }) => text ? text.length : 0
      },
      {
        title: '작업',
        key: 'actions',
        customRender: ({ record }) => h('div', { style: { display: 'flex', gap: '8px' } }, [
          h('a-button', {
            type: 'text',
            size: 'small',
            onClick: () => editDataset(record)
          }, {
            icon: () => h(EditOutlined),
            default: () => '편집'
          }),
          h('a-popconfirm', {
            title: '정말 삭제하시겠습니까?',
            onConfirm: () => deleteDataset(record.id),
            okText: '삭제',
            cancelText: '취소'
          }, {
            default: () => h('a-button', {
              type: 'text',
              danger: true,
              size: 'small'
            }, {
              icon: () => h(DeleteOutlined),
              default: () => '삭제'
            })
          })
        ])
      }
    ]

    const loadData = async () => {
      loading.value = true
      try {
        const [dbData, dsData] = await Promise.all([
          supersetAPI.getDatabases(),
          supersetAPI.getDatasets()
        ])
        databases.value = dbData
        datasets.value = dsData
      } catch (error) {
        console.error('데이터 로드 오류:', error)
        message.error('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    const showDatabaseModal = () => {
      editingDatabase.value = null
      databaseModalVisible.value = true
    }

    const showDatasetModal = () => {
      editingDataset.value = null
      datasetModalVisible.value = true
    }

    const closeDatabaseModal = () => {
      databaseModalVisible.value = false
      editingDatabase.value = null
    }

    const closeDatasetModal = () => {
      datasetModalVisible.value = false
      editingDataset.value = null
    }

    const editDatabase = (database) => {
      editingDatabase.value = database
      databaseModalVisible.value = true
    }

    const editDataset = (dataset) => {
      editingDataset.value = dataset
      datasetModalVisible.value = true
    }

    const handleDatabaseSubmit = async (values) => {
      try {
        const payload = {
          database_name: values.database_name,
          sqlalchemy_uri: values.sqlalchemy_uri,
          expose_in_sqllab: true,
          allow_ctas: false,
          allow_cvas: false,
          configuration_method: 'sqlalchemy_form'
        }

        if (editingDatabase.value) {
          await supersetAPI.updateDatabase(editingDatabase.value.id, payload)
          message.success('데이터베이스가 업데이트되었습니다.')
        } else {
          await supersetAPI.createDatabase(payload)
          message.success('데이터베이스가 생성되었습니다.')
        }

        closeDatabaseModal()
        loadData()
      } catch (error) {
        console.error('데이터베이스 저장 오류:', error)
        message.error('데이터베이스 저장 중 오류가 발생했습니다.')
      }
    }

    const handleDatasetSubmit = async (values) => {
      try {
        const payload = {
          database: values.database_id,
          schema: values.schema || '',
          table_name: values.table_name,
          sql: values.sql || ''
        }

        if (editingDataset.value) {
          await supersetAPI.updateDataset(editingDataset.value.id, payload)
          message.success('데이터셋이 업데이트되었습니다.')
        } else {
          await supersetAPI.createDataset(payload)
          message.success('데이터셋이 생성되었습니다.')
        }

        closeDatasetModal()
        loadData()
      } catch (error) {
        console.error('데이터셋 저장 오류:', error)
        message.error('데이터셋 저장 중 오류가 발생했습니다.')
      }
    }

    const testConnection = async (values) => {
      testingConnection.value = true
      try {
        const result = await supersetAPI.testDatabaseConnection({
          sqlalchemy_uri: values.sqlalchemy_uri,
          database_name: values.database_name
        })

        if (result.success) {
          message.success('데이터베이스 연결이 성공했습니다!')
        } else {
          message.error('데이터베이스 연결에 실패했습니다.')
        }
      } catch (error) {
        console.error('연결 테스트 오류:', error)
        message.error('연결 테스트 중 오류가 발생했습니다.')
      } finally {
        testingConnection.value = false
      }
    }

    const deleteDatabase = async (id) => {
      try {
        await supersetAPI.deleteDatabase(id)
        message.success('데이터베이스가 삭제되었습니다.')
        loadData()
      } catch (error) {
        console.error('데이터베이스 삭제 오류:', error)
        message.error('데이터베이스 삭제 중 오류가 발생했습니다.')
      }
    }

    const deleteDataset = async (id) => {
      try {
        await supersetAPI.deleteDataset(id)
        message.success('데이터셋이 삭제되었습니다.')
        loadData()
      } catch (error) {
        console.error('데이터셋 삭제 오류:', error)
        message.error('데이터셋 삭제 중 오류가 발생했습니다.')
      }
    }

    onMounted(() => {
      if (canConnectDatabase.value) {
        loadData()
      }
    })

    return {
      databases,
      datasets,
      loading,
      databaseModalVisible,
      datasetModalVisible,
      editingDatabase,
      editingDataset,
      testingConnection,
      canConnectDatabase,
      databaseColumns,
      datasetColumns,
      showDatabaseModal,
      showDatasetModal,
      closeDatabaseModal,
      closeDatasetModal,
      handleDatabaseSubmit,
      handleDatasetSubmit,
      testConnection
    }
  }
})
</script>
