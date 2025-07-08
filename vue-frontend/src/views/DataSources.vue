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
              <div style="display: flex; align-items: center; gap: 8px">
                <a-typography-text strong>{{ record.database_name }}</a-typography-text>
                <a-tag :color="getStatusColor(record)">{{ getStatusText(record) }}</a-tag>
              </div>
            </template>
            <template v-else-if="column.key === 'backend'">
              <a-tag color="blue">{{ record.backend || 'Unknown' }}</a-tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button 
                  size="small" 
                  @click="checkDatabaseConnection(record)"
                  :loading="record.checking"
                >
                  상태 확인
                </a-button>
                <a-button size="small" @click="editDatabase(record)">
                  편집
                </a-button>
                <a-button size="small" @click="viewDatabaseTables(record)">
                  테이블 보기
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
            <template v-else-if="column.key === 'schema'">
              <a-typography-text code>{{ record.schema || 'default' }}</a-typography-text>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button size="small" @click="viewDataset(record)">
                  보기
                </a-button>
                <a-button size="small" @click="editDataset(record)">
                  편집
                </a-button>
                <a-button size="small" @click="createChartFromDataset(record)">
                  차트 생성
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
          <div style="margin-top: 8px">
            <a-typography-text type="secondary" style="font-size: 12px">
              예시: mysql+pymysql://superset:superset123@mariadb:3306/sample_dashboard
            </a-typography-text>
          </div>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button @click="testDatabaseConnection" :loading="testingConnection" type="primary">
              연결 테스트
            </a-button>
            <a-typography-text type="secondary">
              새 데이터베이스만 연결 테스트가 가능합니다
            </a-typography-text>
          </a-space>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 테이블 목록 모달 -->
    <a-modal
      v-model:open="showTablesModal"
      title="데이터베이스 테이블 및 스키마"
      :width="800"
      :footer="null"
    >
      <div v-if="tablesLoading" style="text-align: center; padding: 40px">
        <a-spin size="large" tip="테이블 목록을 불러오는 중..." />
      </div>
      <div v-else-if="tablesList.length > 0">
        <a-alert
          message="데이터셋 생성 안내"
          description="아래 테이블들에서 데이터셋을 생성할 수 있습니다. 시스템 스키마(information_schema 등)는 제외됩니다."
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />
        
        <a-list
          :data-source="tablesList"
          size="small"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #avatar>
                  <a-avatar 
                    :style="{ backgroundColor: item.type === 'table' ? '#1890ff' : '#faad14' }"
                  >
                    {{ item.type === 'table' ? 'T' : item.type === 'info' ? 'I' : 'S' }}
                  </a-avatar>
                </template>
                <template #title>
                  <div style="display: flex; align-items: center; gap: 8px">
                    <a-typography-text strong>{{ item.name }}</a-typography-text>
                    <a-tag :color="item.type === 'table' ? 'blue' : item.type === 'info' ? 'red' : 'orange'">
                      {{ item.type === 'table' ? '테이블' : item.type === 'info' ? '정보' : '스키마' }}
                    </a-tag>
                    <a-tag v-if="item.schema" color="green">{{ item.schema }}</a-tag>
                  </div>
                </template>
                <template #description>
                  <span v-if="item.type === 'table'">
                    스키마: {{ item.schema || 'default' }} | 데이터베이스 ID: {{ item.database_id }}
                  </span>
                  <span v-else-if="item.type === 'info'" style="color: #999">
                    {{ item.description || item.name }}
                  </span>
                  <span v-else>
                    스키마 정보
                  </span>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a 
                  v-if="item.type === 'table'"
                  @click="createDatasetFromTable(currentDatabase, item)"
                  style="color: #1890ff"
                >
                  데이터셋 생성
                </a>
                <span v-else style="color: #999">
                  생성 불가
                </span>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </div>
      <a-empty v-else description="사용 가능한 테이블이 없습니다">
        <template #description>
          <span>
            테이블이 없거나 접근할 수 없습니다.<br>
            Superset UI에서 직접 데이터셋을 생성해보세요.
          </span>
        </template>
        <a-button 
          type="primary" 
          @click="() => window.open('http://localhost:8088/tablemodelview/list/', '_blank')"
        >
          Superset에서 데이터셋 생성
        </a-button>
      </a-empty>
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
    const showTablesModal = ref(false)
    const testingConnection = ref(false)
    const tablesLoading = ref(false)
    const databaseFormRef = ref()
    const tablesList = ref([])
    const currentDatabase = ref(null)

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
        title: '백엔드',
        dataIndex: 'backend',
        key: 'backend'
      },
      {
        title: '생성일',
        dataIndex: 'changed_on',
        key: 'changed_on',
        customRender: ({ text }) => {
          return text ? new Date(text).toLocaleDateString() : '-'
        }
      },
      {
        title: '작업',
        key: 'actions',
        width: 300
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
        title: '스키마',
        dataIndex: 'schema',
        key: 'schema'
      },
      {
        title: '작업',
        key: 'actions',
        width: 200
      }
    ]

    const getStatusColor = (database) => {
      if (database.expose_in_sqllab) return 'green'
      return 'orange'
    }

    const getStatusText = (database) => {
      if (database.expose_in_sqllab) return '활성'
      return '비활성'
    }

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

        console.log('데이터베이스 목록:', databasesData)
        console.log('데이터셋 목록:', datasetsData)

        databases.value = databasesData.map(db => ({
          ...db,
          checking: false // 상태 확인 로딩 상태 추가
        }))
        datasets.value = datasetsData
      } catch (err) {
        console.error('데이터 로드 오류:', err)
        error.value = '데이터를 불러오는 중 오류가 발생했습니다.'
      } finally {
        loading.value = false
      }
    }

    const showAddDatabase = () => {
      databaseForm.value = {
        database_name: '',
        sqlalchemy_uri: ''
      }
      showDatabaseModal.value = true
    }

    // 기존 데이터베이스의 연결 상태 확인 (여러 방법 시도)
    const checkDatabaseConnection = async (database) => {
      console.log('데이터베이스 상태 확인:', database)
      
      const dbIndex = databases.value.findIndex(db => db.id === database.id)
      if (dbIndex !== -1) {
        databases.value[dbIndex].checking = true
      }

      try {
        // 먼저 API 엔드포인트 탐지
        const endpoints = await supersetAPI.discoverAPIEndpoints()
        console.log('사용 가능한 API 엔드포인트들:', endpoints)
        
        // 헬스 체크 시도
        const healthResult = await supersetAPI.checkDatabaseHealth(database.id)
        console.log('데이터베이스 헬스 체크 결과:', healthResult)
        
        if (healthResult.success) {
          message.success(`${database.database_name}이(가) 정상적으로 연결되어 있습니다`)
        } else {
          message.warning(`${database.database_name} 상태를 확인했지만 결과가 불확실합니다`)
        }
      } catch (error) {
        console.error('데이터베이스 상태 확인 오류:', error)
        
        // 대안으로 단순히 데이터베이스 정보 조회 시도
        try {
          const dbInfo = await supersetAPI.api.get(`/api/v1/database/${database.id}`)
          console.log('데이터베이스 정보 조회 성공:', dbInfo.data)
          message.success(`${database.database_name} 정보 조회 성공 (연결 상태 양호)`)
        } catch (infoError) {
          console.error('데이터베이스 정보 조회도 실패:', infoError)
          message.error(`${database.database_name} 연결 상태를 확인할 수 없습니다`)
        }
      } finally {
        if (dbIndex !== -1) {
          databases.value[dbIndex].checking = false
        }
      }
    }

    // 새 데이터베이스 추가 시 연결 테스트 (모달에서)
    const testDatabaseConnection = async () => {
      testingConnection.value = true
      try {
        console.log('새 데이터베이스 연결 테스트:', databaseForm.value)
        
        const result = await supersetAPI.testDatabaseConnection({
          sqlalchemy_uri: databaseForm.value.sqlalchemy_uri,
          database_name: databaseForm.value.database_name
        })

        if (result.success) {
          message.success('연결 테스트가 성공했습니다!')
        } else {
          message.error(`연결 테스트에 실패했습니다: ${result.message}`)
        }
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

        const payload = {
          database_name: databaseForm.value.database_name,
          sqlalchemy_uri: databaseForm.value.sqlalchemy_uri,
          expose_in_sqllab: true,
          allow_ctas: false,
          allow_cvas: false,
          configuration_method: 'sqlalchemy_form'
        }

        if (databaseForm.value.id) {
          await supersetAPI.updateDatabase(databaseForm.value.id, payload)
          message.success('데이터베이스가 수정되었습니다!')
        } else {
          await supersetAPI.createDatabase(payload)
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
      databaseForm.value = { 
        ...database,
        sqlalchemy_uri: '' // 보안상 URI는 비워둠
      }
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

    const viewDatabaseTables = async (database) => {
      currentDatabase.value = database
      showTablesModal.value = true
      tablesLoading.value = true
      
      try {
        console.log('테이블 목록 조회 시작:', database)
        
        let tables = []
        
        try {
          // 1단계: 스키마 목록 조회
          const schemas = await supersetAPI.getDatabaseSchemas(database.id)
          console.log('스키마 목록 조회 성공:', schemas)
          
          // 시스템 스키마 필터링
          const userSchemas = schemas.filter(schema => 
            !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(schema.toLowerCase())
          )
          
          console.log('사용자 스키마:', userSchemas)
          
          if (userSchemas.length > 0) {
            // 2단계: 각 사용자 스키마에 대해 테이블 조회
            for (const schema of userSchemas) {
              console.log(`스키마 ${schema}의 테이블 조회 시작...`)
              
              try {
                // API로 테이블 조회 시도
                const schemaTables = await supersetAPI.getDatabaseTablesInSchema(database.id, schema)
                console.log(`API로 스키마 ${schema}의 테이블 조회 성공:`, schemaTables)
                
                if (schemaTables && schemaTables.length > 0) {
                  const formattedTables = schemaTables.map(table => ({
                    name: typeof table === 'string' ? table : (table.name || table.table_name),
                    type: 'table',
                    schema: schema,
                    database_id: database.id
                  }))
                  
                  tables.push(...formattedTables)
                }
              } catch (apiError) {
                console.log(`API 테이블 조회 실패, SQL로 시도: ${schema}`, apiError)
                
                // SQL 직접 쿼리로 테이블 조회
                try {
                  console.log(`SQL로 스키마 ${schema}의 테이블 조회 시도...`)
                  
                  const sqlQueries = [
                    `SHOW TABLES FROM \`${schema}\``,
                    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${schema}' AND TABLE_TYPE = 'BASE TABLE'`,
                    `SHOW FULL TABLES FROM \`${schema}\` WHERE Table_type = 'BASE TABLE'`
                  ]
                  
                  let sqlSuccess = false
                  
                  for (const sqlQuery of sqlQueries) {
                    try {
                      console.log(`SQL 쿼리 실행: ${sqlQuery}`)
                      
                      const sqlResult = await supersetAPI.executeSQL({
                        database_id: database.id,
                        sql: sqlQuery,
                        schema: schema,
                        limit: 100
                      })
                      
                      console.log(`SQL 쿼리 결과:`, sqlResult)
                      
                      if (sqlResult && sqlResult.data && sqlResult.data.length > 0) {
                        const tableNames = sqlResult.data.map(row => {
                          // 다양한 결과 형태 처리
                          const values = Object.values(row)
                          return values[0] // 첫 번째 컬럼이 테이블명
                        }).filter(name => name && typeof name === 'string')
                        
                        console.log(`SQL로 발견된 테이블들:`, tableNames)
                        
                        if (tableNames.length > 0) {
                          const formattedTables = tableNames.map(tableName => ({
                            name: tableName,
                            type: 'table',
                            schema: schema,
                            database_id: database.id
                          }))
                          
                          tables.push(...formattedTables)
                          sqlSuccess = true
                          break // 성공하면 다른 쿼리 시도하지 않음
                        }
                      }
                    } catch (sqlError) {
                      console.log(`SQL 쿼리 실패: ${sqlQuery}`, sqlError)
                      continue
                    }
                  }
                  
                  if (!sqlSuccess) {
                    console.log(`스키마 ${schema}에서 테이블을 찾을 수 없음`)
                  }
                  
                } catch (sqlError) {
                  console.error(`SQL 테이블 조회도 실패: ${schema}`, sqlError)
                }
              }
            }
          }
          
          // 3단계: 테이블을 찾지 못한 경우 전체 데이터베이스에서 조회
          if (tables.length === 0) {
            console.log('스키마별 조회 실패, 전체 데이터베이스 테이블 조회 시도...')
            
            try {
              const globalSqlQueries = [
                'SHOW TABLES',
                'SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = "BASE TABLE" AND TABLE_SCHEMA NOT IN ("information_schema", "performance_schema", "mysql", "sys")'
              ]
              
              for (const sqlQuery of globalSqlQueries) {
                try {
                  console.log(`전체 테이블 조회 SQL: ${sqlQuery}`)
                  
                  const sqlResult = await supersetAPI.executeSQL({
                    database_id: database.id,
                    sql: sqlQuery,
                    schema: '',
                    limit: 100
                  })
                  
                  console.log(`전체 테이블 조회 결과:`, sqlResult)
                  
                  if (sqlResult && sqlResult.data && sqlResult.data.length > 0) {
                    const globalTables = sqlResult.data.map(row => {
                      const values = Object.values(row)
                      if (values.length === 1) {
                        // SHOW TABLES 결과
                        return {
                          name: values[0],
                          type: 'table',
                          schema: userSchemas[0] || 'default',
                          database_id: database.id
                        }
                      } else {
                        // TABLE_NAME, TABLE_SCHEMA 결과
                        return {
                          name: values[0],
                          type: 'table',
                          schema: values[1],
                          database_id: database.id
                        }
                      }
                    }).filter(table => table.name && typeof table.name === 'string')
                    
                    if (globalTables.length > 0) {
                      tables.push(...globalTables)
                      break
                    }
                  }
                } catch (globalSqlError) {
                  console.log(`전체 테이블 조회 SQL 실패: ${sqlQuery}`, globalSqlError)
                  continue
                }
              }
            } catch (globalError) {
              console.error('전체 테이블 조회 실패:', globalError)
            }
          }
          
        } catch (schemaError) {
          console.log('스키마 조회 실패:', schemaError)
        }
        
        // 4단계: 여전히 테이블이 없으면 샘플 데이터베이스인 경우 기본 테이블 제공
        if (tables.length === 0) {
          console.log('모든 조회 방법 실패, 기본 테이블 정보 제공')
          
          // 데이터베이스명이나 연결 정보로 샘플 DB 여부 판단
          const isSampleDB = database.database_name?.toLowerCase().includes('sample') ||
                            database.database_name?.toLowerCase().includes('dashboard') ||
                            database.database_name?.toLowerCase().includes('biforce')
          
          if (isSampleDB) {
            tables = [
              { name: 'users', type: 'table', schema: 'sample_dashboard', database_id: database.id },
              { name: 'sales', type: 'table', schema: 'sample_dashboard', database_id: database.id },
              { name: 'web_traffic', type: 'table', schema: 'sample_dashboard', database_id: database.id },
              { name: 'customer_satisfaction', type: 'table', schema: 'sample_dashboard', database_id: database.id }
            ]
            
            message.info('테이블 자동 조회에 실패하여 예상 테이블 목록을 표시합니다.')
          } else {
            tables = [
              { 
                name: '테이블을 찾을 수 없습니다', 
                type: 'info', 
                schema: '', 
                database_id: database.id,
                description: 'SQL Lab에서 직접 확인하거나 Superset UI를 사용하세요'
              }
            ]
          }
        }
        
        // 중복 제거
        const uniqueTables = tables.filter((table, index, self) => 
          index === self.findIndex(t => t.name === table.name && t.schema === table.schema)
        )
        
        tablesList.value = uniqueTables
        console.log('최종 테이블 목록:', uniqueTables)
        
        if (uniqueTables.length === 0 || uniqueTables[0].type === 'info') {
          message.warning('사용 가능한 테이블이 없습니다. Superset UI에서 직접 데이터셋을 생성해보세요.')
        } else {
          message.success(`${uniqueTables.length}개의 테이블을 발견했습니다.`)
        }
        
      } catch (error) {
        console.error('테이블 목록 조회 오류:', error)
        message.error('테이블 목록을 불러오는데 실패했습니다.')
        tablesList.value = []
      } finally {
        tablesLoading.value = false
      }
    }

    const createDatasetFromTable = async (database, table) => {
      // 정보성 항목은 데이터셋 생성 불가
      if (table.type === 'info') {
        message.warning('이 항목은 데이터셋으로 생성할 수 없습니다.')
        return
      }
      
      try {
        console.log('데이터셋 생성 시도:', { database, table })
        
        const payload = {
          database: database.id || database.database_id,
          schema: table.schema || '',
          table_name: table.name
        }
        
        console.log('데이터셋 생성 페이로드:', payload)
        
        // 테이블 존재 여부 먼저 확인
        try {
          const tableInfo = await supersetAPI.getTableInfo(payload.database, payload.table_name, payload.schema)
          console.log('테이블 정보 확인:', tableInfo)
        } catch (tableInfoError) {
          console.log('테이블 정보 확인 실패 (계속 진행):', tableInfoError)
        }
        
        const result = await supersetAPI.createDataset(payload)
        console.log('데이터셋 생성 결과:', result)
        
        message.success(`테이블 ${table.name}에서 데이터셋이 생성되었습니다!`)
        showTablesModal.value = false
        loadData() // 데이터셋 목록 새로고침
        
      } catch (error) {
        console.error('데이터셋 생성 오류:', error)
        
        // 에러 메시지 상세 분석
        const errorMsg = error.response?.data?.message || error.message
        console.error('상세 에러 메시지:', errorMsg)
        
        if (error.response?.status === 422) {
          if (typeof errorMsg === 'object') {
            const detailMsg = Object.values(errorMsg).flat().join(', ')
            message.error(`데이터셋 생성 실패: ${detailMsg}`)
          } else {
            message.error(`데이터셋 생성 실패: 테이블 정보가 유효하지 않습니다. (${errorMsg})`)
          }
        } else {
          message.error('데이터셋 생성에 실패했습니다.')
        }
      }
    }

    const viewDataset = (dataset) => {
      console.log('View dataset:', dataset)
      message.info('데이터셋 상세 보기 기능은 구현 예정입니다.')
    }

    const editDataset = (dataset) => {
      console.log('Edit dataset:', dataset)
      message.info('데이터셋 편집 기능은 구현 예정입니다.')
    }

    const createChartFromDataset = (dataset) => {
      console.log('Create chart from dataset:', dataset)
      message.info('차트 생성 기능은 구현 예정입니다.')
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
      showTablesModal,
      testingConnection,
      tablesLoading,
      databaseFormRef,
      databaseForm,
      databaseRules,
      databaseColumns,
      datasetColumns,
      tablesList,
      currentDatabase,
      getStatusColor,
      getStatusText,
      loadData,
      showAddDatabase,
      checkDatabaseConnection,
      testDatabaseConnection,
      handleDatabaseSubmit,
      cancelDatabaseEdit,
      editDatabase,
      deleteDatabase,
      viewDatabaseTables,
      createDatasetFromTable,
      viewDataset,
      editDataset,
      createChartFromDataset
    }
  }
})
</script>

<style scoped>
.ant-typography {
  margin-bottom: 0;
}

.ant-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ant-btn {
  border-radius: 6px;
}

.ant-table-tbody > tr:hover > td {
  background-color: #f5f5f5;
}
</style>