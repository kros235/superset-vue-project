// vue-frontend/src/services/presetAPI.js
// 🔥 Superset 메타데이터 DB 기반 프리셋 관리

import axios from 'axios'

class PresetAPI {
  constructor() {
    // Superset API를 통해 MariaDB의 프리셋 테이블에 접근
    this.api = axios.create({
      baseURL: '', // 프록시 사용
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 요청 인터셉터 - 토큰 자동 추가
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('superset_access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  // ===== 1️⃣ 프리셋 조회 (SQL을 통해 MariaDB에서 직접 조회) =====
  
  /**
   * 특정 데이터셋의 프리셋 목록 조회
   */
  async getPresetsByDataset(datasetId) {
    try {
      console.log(`📋 데이터셋 ${datasetId}의 프리셋 조회 중...`)
      
      // 🔥 Superset의 SQL Lab API를 사용하여 직접 쿼리
      const sql = `
        SELECT 
          p.id,
          p.dataset_id,
          p.preset_name,
          p.preset_description,
          p.chart_type,
          p.use_count,
          p.is_active,
          p.created_by,
          p.created_at,
          GROUP_CONCAT(
            CONCAT(c.config_key, ':', c.config_value)
            SEPARATOR '||'
          ) as configurations
        FROM chart_presets p
        LEFT JOIN preset_configurations c ON p.id = c.preset_id
        WHERE p.dataset_id = ${datasetId} 
          AND p.is_active = 1
        GROUP BY p.id
        ORDER BY p.use_count DESC, p.created_at DESC
      `
      
      const response = await this.executeSQL(sql)
      
      if (response && response.data && response.data.length > 0) {
        // 결과를 프리셋 객체로 변환
        const presets = response.data.map(row => this._parsePresetRow(row))
        console.log(`✅ ${presets.length}개의 프리셋 발견`)
        return presets
      }
      
      console.log('ℹ️ 프리셋이 없습니다')
      return []
      
    } catch (error) {
      console.error('프리셋 조회 오류:', error)
      return []
    }
  }

  /**
   * 모든 활성 프리셋 조회
   */
  async getAllPresets() {
    try {
      const sql = `
        SELECT 
          p.*,
          GROUP_CONCAT(
            CONCAT(c.config_key, ':', c.config_value)
            SEPARATOR '||'
          ) as configurations
        FROM chart_presets p
        LEFT JOIN preset_configurations c ON p.id = c.preset_id
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `
      
      const response = await this.executeSQL(sql)
      
      if (response && response.data) {
        return response.data.map(row => this._parsePresetRow(row))
      }
      
      return []
    } catch (error) {
      console.error('전체 프리셋 조회 오류:', error)
      return []
    }
  }

  // ===== 2️⃣ 프리셋 생성 (SQL INSERT를 통해 MariaDB에 저장) =====
  
  /**
   * 새 프리셋 생성
   */
  async createPreset(presetData) {
    try {
      console.log('✨ 새 프리셋 생성 중...', presetData)
      
      // 유효성 검사
      if (!presetData.dataset_id) throw new Error('데이터셋 ID가 필요합니다')
      if (!presetData.preset_name) throw new Error('프리셋 이름이 필요합니다')
      if (!presetData.chart_type) throw new Error('차트 타입이 필요합니다')
      
      // 🔥 1. chart_presets 테이블에 기본 정보 삽입
      const insertPresetSQL = `
        INSERT INTO chart_presets 
          (dataset_id, preset_name, preset_description, chart_type, created_by)
        VALUES (
          ${presetData.dataset_id},
          '${this._escapeSQLString(presetData.preset_name)}',
          '${this._escapeSQLString(presetData.preset_description || '')}',
          '${presetData.chart_type}',
          '${presetData.created_by || 'admin'}'
        )
      `
      
      await this.executeSQL(insertPresetSQL)
      
      // 🔥 2. 방금 생성된 프리셋의 ID 조회
      const getIdSQL = `
        SELECT id FROM chart_presets 
        WHERE dataset_id = ${presetData.dataset_id}
          AND preset_name = '${this._escapeSQLString(presetData.preset_name)}'
        ORDER BY created_at DESC 
        LIMIT 1
      `
      
      const idResponse = await this.executeSQL(getIdSQL)
      
      if (!idResponse || !idResponse.data || idResponse.data.length === 0) {
        throw new Error('프리셋 ID를 조회할 수 없습니다')
      }
      
      const presetId = idResponse.data[0].id
      console.log('✅ 프리셋 생성됨, ID:', presetId)
      
      // 🔥 3. 프리셋 설정(configuration) 저장
      if (presetData.configuration && Object.keys(presetData.configuration).length > 0) {
        const configInserts = []
        
        for (const [key, value] of Object.entries(presetData.configuration)) {
          const valueStr = typeof value === 'object' 
            ? JSON.stringify(value) 
            : String(value)
          
          const configType = Array.isArray(value) ? 'array' 
            : typeof value === 'object' ? 'object' 
            : typeof value
          
          configInserts.push(`
            (${presetId}, 
             '${key}', 
             '${this._escapeSQLString(valueStr)}', 
             '${configType}')
          `)
        }
        
        const insertConfigSQL = `
          INSERT INTO preset_configurations 
            (preset_id, config_key, config_value, config_type)
          VALUES ${configInserts.join(', ')}
        `
        
        await this.executeSQL(insertConfigSQL)
        console.log('✅ 프리셋 설정 저장 완료')
      }
      
      return { id: presetId, ...presetData }
      
    } catch (error) {
      console.error('프리셋 생성 오류:', error)
      throw error
    }
  }

  // ===== 3️⃣ 프리셋 사용 횟수 증가 =====
  
  /**
   * 프리셋 사용 횟수 증가
   */
  async incrementPresetUsage(presetId, usageData = {}) {
    try {
      console.log(`📈 프리셋 ${presetId} 사용 기록 중...`)
      
      // 🔥 1. use_count 증가
      const updateSQL = `
        UPDATE chart_presets 
        SET use_count = use_count + 1,
            updated_at = NOW()
        WHERE id = ${presetId}
      `
      
      await this.executeSQL(updateSQL)
      
      // 🔥 2. 사용 이력 기록
      const userName = usageData.user_name || 'anonymous'
      const chartId = usageData.chart_id || 'NULL'
      
      const insertHistorySQL = `
        INSERT INTO preset_usage_history 
          (preset_id, user_name, chart_id)
        VALUES (${presetId}, '${userName}', ${chartId})
      `
      
      await this.executeSQL(insertHistorySQL)
      
      console.log('✅ 프리셋 사용 기록 완료')
      return true
      
    } catch (error) {
      console.error('프리셋 사용 기록 오류:', error)
      return false
    }
  }

  // ===== 4️⃣ 프리셋 수정 =====
  
  /**
   * 프리셋 정보 수정
   */
  async updatePreset(presetId, updateData) {
    try {
      const updates = []
      
      if (updateData.preset_name) {
        updates.push(`preset_name = '${this._escapeSQLString(updateData.preset_name)}'`)
      }
      if (updateData.preset_description !== undefined) {
        updates.push(`preset_description = '${this._escapeSQLString(updateData.preset_description)}'`)
      }
      if (updateData.chart_type) {
        updates.push(`chart_type = '${updateData.chart_type}'`)
      }
      
      if (updates.length === 0) {
        console.log('수정할 내용이 없습니다')
        return true
      }
      
      const updateSQL = `
        UPDATE chart_presets 
        SET ${updates.join(', ')},
            updated_at = NOW()
        WHERE id = ${presetId}
      `
      
      await this.executeSQL(updateSQL)
      console.log('✅ 프리셋 수정 완료')
      return true
      
    } catch (error) {
      console.error('프리셋 수정 오류:', error)
      throw error
    }
  }

  // ===== 5️⃣ 프리셋 삭제 (soft delete) =====
  
  /**
   * 프리셋 삭제 (is_active = 0으로 설정)
   */
  async deletePreset(presetId) {
    try {
      const deleteSQL = `
        UPDATE chart_presets 
        SET is_active = 0,
            updated_at = NOW()
        WHERE id = ${presetId}
      `
      
      await this.executeSQL(deleteSQL)
      console.log('✅ 프리셋 삭제(비활성화) 완료')
      return true
      
    } catch (error) {
      console.error('프리셋 삭제 오류:', error)
      throw error
    }
  }

  // ===== 헬퍼 메서드 =====
  
  /**
   * Superset SQL Lab API를 통해 SQL 실행
   */
  async executeSQL(sql) {
    try {
      // sample_dashboard 데이터베이스 ID 조회 (캐싱 권장)
      const databaseId = await this._getSampleDatabaseId()
      
      const payload = {
        database_id: databaseId,
        sql: sql.trim(),
        schema: 'sample_dashboard',
        runAsync: false,
        limit: 1000
      }
      
      console.log('🔍 SQL 실행:', sql.substring(0, 100) + '...')
      
      const response = await this.api.post('/superset/sql_json/', payload)
      
      return response.data
      
    } catch (error) {
      console.error('SQL 실행 오류:', error)
      throw error
    }
  }

  /**
   * sample_dashboard 데이터베이스 ID 조회 (캐싱)
   */
  async _getSampleDatabaseId() {
    // 로컬 스토리지에서 캐시된 ID 확인
    const cachedId = localStorage.getItem('sample_dashboard_id')
    if (cachedId) {
      return parseInt(cachedId)
    }
    
    try {
      // Superset API로 데이터베이스 목록 조회
      const response = await this.api.get('/api/v1/database/')
      
      if (response.data && response.data.result) {
        const sampleDB = response.data.result.find(
          db => db.database_name === 'sample_dashboard' || 
                db.database_name === 'MariaDB'
        )
        
        if (sampleDB) {
          localStorage.setItem('sample_dashboard_id', sampleDB.id)
          return sampleDB.id
        }
      }
      
      throw new Error('sample_dashboard 데이터베이스를 찾을 수 없습니다')
      
    } catch (error) {
      console.error('데이터베이스 ID 조회 오류:', error)
      throw error
    }
  }

  /**
   * SQL 문자열 이스케이프
   */
  _escapeSQLString(str) {
    if (!str) return ''
    return String(str).replace(/'/g, "''")
  }

  /**
   * 프리셋 row 파싱
   */
  _parsePresetRow(row) {
    const preset = {
      id: row.id,
      dataset_id: row.dataset_id,
      preset_name: row.preset_name,
      preset_description: row.preset_description,
      chart_type: row.chart_type,
      use_count: row.use_count || 0,
      is_active: row.is_active,
      created_by: row.created_by,
      created_at: row.created_at,
      configuration: {}
    }
    
    // configurations 파싱
    if (row.configurations) {
      const configs = row.configurations.split('||')
      configs.forEach(config => {
        const [key, value] = config.split(':')
        if (key && value) {
          try {
            preset.configuration[key] = JSON.parse(value)
          } catch {
            preset.configuration[key] = value
          }
        }
      })
    }
    
    return preset
  }
}

const presetAPI = new PresetAPI()
export default presetAPI