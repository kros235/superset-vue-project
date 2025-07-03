<template>
  <div>
    <div style="margin-bottom: 24px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 600">
            데이터 소스 관리
          </h1>
          <p style="margin: 8px 0 0 0; color: #666">
            데이터베이스 연결 및 데이터셋을 관리합니다.
          </p>
        </div>
        <a-space>
          <a-button @click="loadData" :loading="loading">
            <template #icon>
              <ReloadOutlined />
            </template>
            새로고침
          </a-button>
          <a-button type="primary" @click="showAddDatabase">
            <template #icon>
              <PlusOutlined />
            </template>
            데이터베이스 추가
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 에러 표시 -->
    <a-alert
      v-if="error"
      :message="error"
      type="error"
      show-icon
      style="margin-bottom: 24px"
    />

    <!-- 로딩 스피너 -->
    <div
      v-if="loading"
      style="display: flex; justify-content: center; align-items: center; height: 400px"
    >
      <a-spin size="large" />
    </div>

    <template v-else>
      <!-- 데이터베이스 목록 -->
      <a-card title="데이터베이스" style="margin-bottom: 24px">
        <a-table
          :columns="databaseColumns"
          :data-source="databases"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'database_name'">
              <a-typography-text strong>{{ record.database_name }}</a-typography-text>
            </template>
            <template v-else-if="column.key === 'sqlalchemy_uri'">
              <a-typography-text code style="font-size: 12px">
                {{ maskConnectionString(record.sqlalchemy_uri) }}
              </a-typography-text>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button size="small" @click="testConnection(record)">
                  연결 테스트
                </a-button>
                <a-button size="small" @click="editDatabase(record)">
                  편집
                </a-button>
                <a-popconfirm
                  title="정말 삭제하시겠습니까?"
                  @confirm="deleteDatabase(record.id)"
                >
                  <a-button size="small" danger>
                    삭제
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>

      <!-- 데이터셋 목록 -->
      <a-card title="데이터셋">
        <a-table
          :columns="datasetColumns"
          :data-source="datasets"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'table_name'">
              <a-typography-text strong>{{ record.table_name }}</a-typography-text>
            </template>
            <template v-else-if="column.key === 'database'">
              <a-tag color="blue">{{ record.database?.database_name }}</a-tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button size="small" @click="viewDataset(record)">
                  보기
                </a-button>
                <a-button size="small" @click="editDataset(record)">
                  편집
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </template>

    <!-- 데이터베이스 추가/편집 모달 -->
    <a-modal
      v-model:open="showDatabaseModal"
      title="데이터베이스 연결"
      :width="800"
      @ok="handleDatabaseSubmit"
      @cancel="cancelDatabaseEdit"
    >
      <a-form
        ref="databaseFormRef"
        :model="databaseForm"
        :rules="databaseRules"
        layout="vertical"
      >
        <a-form-item label="데이터베이스 이름" name="database_name">
          <a-input v-model:value="databaseForm.database_name" placeholder="예: MariaDB Production" />
        </a-form-item>

        <a-form-item label="SQLAlchemy URI" name="sqlalchemy_uri">
          <a-input v-model:value="databaseForm.sqlalchemy_uri"
                   placeholder="mysql+pymysql://user:password@host:port/database" />
        </a-form-item>

        <a-form-item>
          <a-button @click="testDatabaseConnection" :loading="testingConnection">
            연결 테스트
          </a-button>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import supersetAPI from '../services/supersetAPI'
import authService from '../services/authService'

export default defineComponent({
  name: 'DataSources',
  components: {
    ReloadOutlined,
    PlusOutlined
  },
  setup () {
    const loading = ref(false)
    const error = ref('')
    const databases = ref([])
    const datasets = ref([])
    const showDatabaseModal = ref(false)
    const testingConnection = ref(false)
    const databaseFormRef = ref()

    const databaseForm = ref({
      database_name: '',
      sqlalchemy_uri: ''
    })

    const databaseRules = {
      database_name: [
        { required: true, message: '데이터베이스 이름을 입력해주세요!' }
      ],
      sqlalchemy_uri: [
        { required: true, message: 'SQLAlchemy URI를 입력해주세요!' }
      ]
    }

    const databaseColumns = [
      {
        title: '데이터베이스 이름',
        dataIndex: 'database_name',
        key: 'database_name'
      },
      {
        title: '연결 문자열',
        dataIndex: 'sqlalchemy_uri',
        key: 'sqlalchemy_uri'
      },
      {
        title: '생성일',
        dataIndex: 'created_on',
        key: 'created_on'
      },
      {
        title: '작업',
        key: 'actions',
        width: 200
      }
    ]

    const datasetColumns = [
      {
        title: '테이블 이름',
        dataIndex: 'table_name',
        key: 'table_name'
      },
      {
        title: '데이터베이스',
        dataIndex: 'database',
        key: 'database'
      },
      {
        title: '생성일',
        dataIndex: 'created_on',
        key: 'created_on'
      },
      {
        title: '작업',
        key: 'actions',
        width: 150
      }
    ]

    const loadData = async () => {
      if (!authService.canManageDataSources()) {
        error.value = '데이터 소스 관리 권한이 없습니다.'
        return
      }

      loading.value = true
      error.value = ''

      try {
        const [databasesData, datasetsData] = await Promise.all([
          supersetAPI.getDatabases(),
          supersetAPI.getDatasets()
        ])

        databases.value = databasesData
        datasets.value = datasetsData
      } catch (err) {
        console.error('데이터 로드 오류:', err)
        error.value = '데이터를 불러오는 중 오류가 발생했습니다.'
      } finally {
        loading.value = false
      }
    }

    const maskConnectionString = (uri) => {
      if (!uri) return ''
      // 비밀번호 부분을 마스킹
      return uri.replace(/:([^:@]+)@/, ':****@')
    }

    const showAddDatabase = () => {
      databaseForm.value = {
        database_name: '',
        sqlalchemy_uri: ''
      }
      showDatabaseModal.value = true
    }

    const testConnection = async (database) => {
      try {
        await supersetAPI.testDatabaseConnection({
          sqlalchemy_uri: database.sqlalchemy_uri
        })
        message.success('데이터베이스 연결이 성공했습니다!')
      } catch (error) {
        console.error('연결 테스트 오류:', error)
        message.error('데이터베이스 연결에 실패했습니다.')
      }
    }

    const testDatabaseConnection = async () => {
      testingConnection.value = true
      try {
        await supersetAPI.testDatabaseConnection({
          sqlalchemy_uri: databaseForm.value.sqlalchemy_uri
        })
        message.success('연결 테스트가 성공했습니다!')
      } catch (error) {
        console.error('연결 테스트 오류:', error)
        message.error('연결 테스트에 실패했습니다.')
      } finally {
        testingConnection.value = false
      }
    }

    const handleDatabaseSubmit = async () => {
      try {
        await databaseFormRef.value.validate()

        if (databaseForm.value.id) {
          await supersetAPI.updateDatabase(databaseForm.value.id, databaseForm.value)
          message.success('데이터베이스가 수정되었습니다!')
        } else {
          await supersetAPI.createDatabase(databaseForm.value)
          message.success('데이터베이스가 추가되었습니다!')
        }

        showDatabaseModal.value = false
        loadData()
      } catch (error) {
        console.error('데이터베이스 저장 오류:', error)
        message.error('데이터베이스 저장에 실패했습니다.')
      }
    }

    const cancelDatabaseEdit = () => {
      showDatabaseModal.value = false
      databaseForm.value = {
        database_name: '',
        sqlalchemy_uri: ''
      }
    }

    const editDatabase = (database) => {
      databaseForm.value = { ...database }
      showDatabaseModal.value = true
    }

    const deleteDatabase = async (databaseId) => {
      try {
        await supersetAPI.deleteDatabase(databaseId)
        message.success('데이터베이스가 삭제되었습니다!')
        loadData()
      } catch (error) {
        console.error('데이터베이스 삭제 오류:', error)
        message.error('데이터베이스 삭제에 실패했습니다.')
      }
    }

    const viewDataset = (dataset) => {
      // 데이터셋 상세 보기 구현
      console.log('View dataset:', dataset)
      message.info('데이터셋 상세 보기 기능은 구현 예정입니다.')
    }

    const editDataset = (dataset) => {
      // 데이터셋 편집 구현
      console.log('Edit dataset:', dataset)
      message.info('데이터셋 편집 기능은 구현 예정입니다.')
    }

    onMounted(() => {
      loadData()
    })

    return {
      loading,
      error,
      databases,
      datasets,
      showDatabaseModal,
      testingConnection,
      databaseFormRef,
      databaseForm,
      databaseRules,
      databaseColumns,
      datasetColumns,
      loadData,
      maskConnectionString,
      showAddDatabase,
      testConnection,
      testDatabaseConnection,
      handleDatabaseSubmit,
      cancelDatabaseEdit,
      editDatabase,
      deleteDatabase,
      viewDataset,
      editDataset
    }
  }
})
</script>
