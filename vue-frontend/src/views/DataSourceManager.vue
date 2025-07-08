const viewDatabaseTables = async (database) => {
      currentDatabase.value = database
      showTablesModal.value = true
      tablesLoading.value = true
      
      try {
        console.log('테이블 목록 조회 시작:', database)
        
        let tables = []
        
        try {
          // 먼저 스키마 목록 조회
          const schemas = await supersetAPI.getDatabaseSchemas(database.id)
          console.log('스키마 목록 조회 성공:', schemas)
          
          // 시스템 스키마 필터링
          const userSchemas = schemas.filter(schema => 
            !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(schema.toLowerCase())
          )
          
          console.log('사용자 스키마:', userSchemas)
          
          if (userSchemas.length > 0) {
            // 각 사용자 스키마에 대해 테이블 조회 시도
            for (const schema of userSchemas) {
              try {
                const schemaTables = await supersetAPI.getDatabaseTablesInSchema(database.id, schema)
                console.log(`스키마 ${schema}의 테이블들:`, schemaTables)
                
                // 테이블 정보 추가
                const formattedTables = schemaTables.map(table => ({
                  name: typeof table === 'string' ? table : table.name || table.table_name,
                  type: 'table',
                  schema: schema,
                  database_id: database.id
                }))
                
                tables.push(...formattedTables)
              } catch (tableError) {
                console.log(`스키마 ${schema}의 테이블 조회 실패:`, tableError)
                
                // 테이블 조회 실패 시 기본 테이블들 추가 (MariaDB/MySQL 기본 테이블들)
                if (schema === 'sample_dashboard') {
                  tables.push(
                    { name: 'users', type: 'table', schema: schema, database_id: database.id },
                    { name: 'sales', type: 'table', schema: schema, database_id: database.id },
                    { name: 'web_traffic', type: 'table', schema: schema, database_id: database.id },
                    { name: 'customer_satisfaction', type: 'table', schema: schema, database_id: database.id }
                  )
                }
              }
            }
          }
          
          // 사용자 스키마가 없거나 테이블이 없는 경우 기본 테이블 제공

	if (tables.length === 0) {
	  if (database.database_name.toLowerCase().includes('sample') || 
	      schemas.includes('sample_dashboard')) {
	    tables = [
	      { name: 'users', type: 'table', schema: 'sample_dashboard', database_id: database.id },
	      { name: 'sales', type: 'table', schema: 'sample_dashboard', database_id: database.id },
	      { name: 'web_traffic', type: 'table', schema: 'sample_dashboard', database_id: database.id },
	      { name: 'customer_satisfaction', type: 'table', schema: 'sample_dashboard', database_id: database.id },
	      // 새로 추가되는 기본 테스트 테이블
	      { name: 'Default_Test_Fail_Table', type: 'table', schema: 'sample_dashboard', database_id: database.id }
	    ]
	  } else {
	    // 일반적인 테이블 구조 제안
	    tables = [
	      { name: 'Default_Test_Fail_Table', type: 'table', schema: '', database_id: database.id },
	      { name: '테이블을 수동으로 추가하세요', type: 'info', schema: '', database_id: database.id }
	    ]
	  }
	}
	
	// 그리고 catch 블록에서의 기본 정보 표시 부분도 수정
	} catch (schemaError) {
	  console.log('스키마 조회 실패, 기본 정보 표시:', schemaError)
	  
	  // 기본 정보 표시
	  tables = [
	    { name: 'users', type: 'table', schema: 'sample_dashboard', database_id: database.id },
	    { name: 'sales', type: 'table', schema: 'sample_dashboard', database_id: database.id },
	    { name: 'web_traffic', type: 'table', schema: 'sample_dashboard', database_id: database.id },
	    { name: 'customer_satisfaction', type: 'table', schema: 'sample_dashboard', database_id: database.id },
	    // 새로 추가되는 기본 테스트 테이블
	    { name: 'Default_Test_Fail_Table', type: 'table', schema: 'sample_dashboard', database_id: database.id }
	  ]
	}
	        
        tablesList.value = tables
        console.log('최종 테이블 목록:', tables)
        
        if (tables.length === 0 || tables[0].type === 'info') {
          message.warning('사용 가능한 테이블이 없습니다. Superset UI에서 직접 데이터셋을 생성해보세요.')
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
      // 시스템 스키마나 정보성 항목은 데이터셋 생성 불가
      if (table.type === 'info' || 
          ['information_schema', 'performance_schema', 'mysql', 'sys'].includes(table.schema.toLowerCase())) {
        message.warning('시스템 스키마의 테이블은 데이터셋으로 생성할 수 없습니다.')
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