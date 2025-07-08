// vue-frontend/src/utils/debugAPI.js
// Superset API 디버깅 도구

import supersetAPI from '../services/supersetAPI'

class APIDebugger {
  constructor() {
    this.results = []
  }

  // 다양한 API 엔드포인트 테스트
  async testDatabaseEndpoints(databaseId) {
    console.log(`=== 데이터베이스 ${databaseId} API 엔드포인트 테스트 ===`)
    
    const testEndpoints = [
      // 기본 정보
      `/api/v1/database/${databaseId}`,
      `/api/v1/database/${databaseId}/`,
      
      // 테이블 관련
      `/api/v1/database/${databaseId}/table/`,
      `/api/v1/database/${databaseId}/tables/`,
      `/api/v1/database/${databaseId}/table_metadata/`,
      `/api/v1/database/${databaseId}/table_names/`,
      
      // 스키마 관련
      `/api/v1/database/${databaseId}/schema/`,
      `/api/v1/database/${databaseId}/schemas/`,
      `/api/v1/database/${databaseId}/schema_names/`,
      
      // 연결 관련
      `/api/v1/database/${databaseId}/test_connection/`,
      `/api/v1/database/${databaseId}/validate_parameters/`,
      `/api/v1/database/${databaseId}/connection/`,
      
      // 레거시 엔드포인트
      `/superset/tables/${databaseId}/`,
      `/superset/schemas/${databaseId}/`,
      `/superset/table_metadata/${databaseId}/`,
    ]

    const results = []

    for (const endpoint of testEndpoints) {
      try {
        console.log(`테스트 중: ${endpoint}`)
        const response = await supersetAPI.api.get(endpoint)
        
        const result = {
          endpoint,
          status: response.status,
          success: true,
          data: response.data,
          dataType: typeof response.data,
          hasResult: !!response.data?.result,
          resultLength: Array.isArray(response.data?.result) ? response.data.result.length : null
        }
        
        console.log(`✅ 성공: ${endpoint}`, result)
        results.push(result)
        
      } catch (error) {
        const result = {
          endpoint,
          status: error.response?.status || 'NETWORK_ERROR',
          success: false,
          error: error.message,
          errorType: error.response?.status === 404 ? 'NOT_FOUND' : 
                   error.response?.status === 403 ? 'FORBIDDEN' :
                   error.response?.status === 500 ? 'SERVER_ERROR' : 'OTHER'
        }
        
        console.log(`❌ 실패: ${endpoint}`, result)
        results.push(result)
      }
    }

    // 결과 요약
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`\n=== 테스트 결과 요약 ===`)
    console.log(`총 ${results.length}개 엔드포인트 테스트`)
    console.log(`성공: ${successful.length}개`)
    console.log(`실패: ${failed.length}개`)
    
    if (successful.length > 0) {
      console.log(`\n✅ 성공한 엔드포인트들:`)
      successful.forEach(r => {
        console.log(`  - ${r.endpoint} (${r.status}) ${r.hasResult ? '- 데이터 있음' : '- 데이터 없음'}`)
      })
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ 실패한 엔드포인트들:`)
      failed.forEach(r => {
        console.log(`  - ${r.endpoint} (${r.status}) - ${r.errorType}`)
      })
    }

    this.results = results
    return results
  }

  // 사용 가능한 API 전체 탐색
  async exploreAPI() {
    console.log('=== Superset API 전체 탐색 ===')
    
    const baseEndpoints = [
      '/api/v1/',
      '/api/v1/openapi.json',
      '/api/v1/_spec/',
      '/swagger.json',
      '/openapi.json'
    ]

    for (const endpoint of baseEndpoints) {
      try {
        const response = await supersetAPI.api.get(endpoint)
        console.log(`API 정보 발견 (${endpoint}):`, response.data)
        
        if (response.data.paths) {
          const paths = Object.keys(response.data.paths)
          const dbPaths = paths.filter(p => p.includes('database'))
          console.log('데이터베이스 관련 API 경로들:', dbPaths)
          return dbPaths
        }
      } catch (error) {
        console.log(`API 탐색 실패 (${endpoint}): ${error.response?.status}`)
      }
    }

    return null
  }

  // 현재 사용자 권한 확인
  async checkPermissions() {
    try {
      const userInfo = await supersetAPI.getUserInfo()
      console.log('현재 사용자 정보:', userInfo)
      
      const roles = await supersetAPI.getRoles()
      console.log('사용 가능한 역할들:', roles)
      
      return { userInfo, roles }
    } catch (error) {
      console.error('권한 확인 오류:', error)
      return null
    }
  }

  // 간단한 SQL 테스트
  async testSQL(databaseId, sql = 'SELECT 1 as test') {
    console.log(`SQL 테스트 (DB ${databaseId}): ${sql}`)
    
    const payload = {
      database_id: databaseId,
      sql: sql,
      schema: '',
      limit: 10
    }

    try {
      const result = await supersetAPI.executeSQL(payload)
      console.log('SQL 실행 성공:', result)
      return result
    } catch (error) {
      console.error('SQL 실행 실패:', error)
      return null
    }
  }

  // 결과를 테이블 형태로 출력
  printResults() {
    if (this.results.length === 0) {
      console.log('테스트 결과가 없습니다.')
      return
    }

    console.table(this.results.map(r => ({
      Endpoint: r.endpoint,
      Status: r.status,
      Success: r.success ? '✅' : '❌',
      HasData: r.hasResult ? '✅' : r.success ? '❓' : '❌',
      Error: r.error || ''
    })))
  }
}

// 전역에서 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  window.debugAPI = new APIDebugger()
}

export default APIDebugger