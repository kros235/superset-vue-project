// vue-frontend/src/services/presetAPI.js
// ✅✅✅ 차트 기반 프리셋 저장 + 상세 에러 로깅 ✅✅✅

import axios from 'axios'

class PresetAPI {
  constructor() {
    this.api = axios.create({
      baseURL: '',
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.api.interceptors.request.use(
      (config) => {
        // Access Token 추가
        const token = localStorage.getItem('superset_access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // ✅ CSRF Token 추가
        const csrfToken = localStorage.getItem('superset_csrf_token')
        if (csrfToken) {
          config.headers['X-CSRFToken'] = csrfToken
        }
        
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  async getPresetsByDataset(datasetId) {
    try {
      console.log(`📋 데이터셋 ${datasetId}의 프리셋 조회 중...`)
      
      const response = await this.api.get('/api/v1/chart/', {
        params: {
          q: JSON.stringify({
            filters: [
              {
                col: 'datasource_id',
                opr: 'eq',
                value: datasetId
              }
            ]
          })
        }
      })
      
      if (response.data && response.data.result) {
        const presetCharts = response.data.result.filter(chart => 
          chart.slice_name && chart.slice_name.startsWith('[PRESET]')
        )
        
        const presets = presetCharts.map(chart => this._parsePresetFromChart(chart))
        
        console.log(`✅ ${presets.length}개의 프리셋 발견:`, presets)
        return presets
      }
      
      console.log('ℹ️ 프리셋이 없습니다')
      return []
      
    } catch (error) {
      console.error('프리셋 조회 오류:', error)
      return []
    }
  }

  async getAllPresets() {
    try {
      console.log('📋 전체 프리셋 조회 중...')
      
      const response = await this.api.get('/api/v1/chart/')
      
      if (response.data && response.data.result) {
        const presetCharts = response.data.result.filter(chart => 
          chart.slice_name && chart.slice_name.startsWith('[PRESET]')
        )
        
        const presets = presetCharts.map(chart => this._parsePresetFromChart(chart))
        
        console.log(`✅ 전체 ${presets.length}개의 프리셋 발견`)
        return presets
      }
      
      return []
    } catch (error) {
      console.error('전체 프리셋 조회 오류:', error)
      return []
    }
  }

  async createPreset(presetData) {
    try {
      console.log('✨ 새 프리셋 생성 중...', presetData)
      
      // 유효성 검사
      if (!presetData.dataset_id) throw new Error('데이터셋 ID가 필요합니다')
      if (!presetData.preset_name) throw new Error('프리셋 이름이 필요합니다')
      if (!presetData.chart_type) throw new Error('차트 타입이 필요합니다')
      
      const presetMetadata = {
        preset_name: presetData.preset_name,
        preset_description: presetData.preset_description || '',
        chart_type: presetData.chart_type,
        use_count: 0,
        created_by: presetData.created_by || 'admin',
        created_at: new Date().toISOString(),
        configuration: presetData.configuration || {}
      }
      
      const chartPayload = {
        slice_name: `[PRESET] ${presetData.preset_name}`,
        description: JSON.stringify(presetMetadata),
        viz_type: presetData.chart_type,
        datasource_id: presetData.dataset_id,
        datasource_type: 'table',
        params: JSON.stringify({
          datasource: `${presetData.dataset_id}__table`,
          viz_type: presetData.chart_type,
          metrics: presetData.configuration?.metrics || ['count'],
          groupby: presetData.configuration?.groupby || [],
          adhoc_filters: [],
          row_limit: 10000
        }),
        query_context: JSON.stringify({
          datasource: {
            id: presetData.dataset_id,
            type: 'table'
          },
          queries: [{
            columns: presetData.configuration?.groupby || [],
            metrics: presetData.configuration?.metrics || ['count'],
            filters: [],
            row_limit: 10000
          }]
        })
      }
      
      console.log('💾 프리셋 차트 생성:', chartPayload)
      
      const response = await this.api.post('/api/v1/chart/', chartPayload)
      
      if (response.data && response.data.id) {
        const newPreset = {
          id: response.data.id,
          chart_id: response.data.id,
          ...presetMetadata
        }
        
        console.log('✅ 프리셋 저장 완료! ID:', newPreset.id)
        return newPreset
      }
      
      throw new Error('프리셋 생성 응답이 올바르지 않습니다')
      
    } catch (error) {
      console.error('❌ 프리셋 생성 오류:', error)
      
      // ✅✅✅ 상세 에러 정보 출력 ✅✅✅
      if (error.response) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('📛 에러 상태 코드:', error.response.status)
        console.error('📛 에러 데이터:', error.response.data)
        
        // errors 배열이 있으면 각 에러 출력
        if (error.response.data?.errors) {
          console.error('📛 상세 에러 목록:')
          error.response.data.errors.forEach((err, index) => {
            console.error(`  ${index + 1}. ${JSON.stringify(err, null, 2)}`)
          })
        }
        
        // message가 있으면 출력
        if (error.response.data?.message) {
          console.error('📛 에러 메시지:', error.response.data.message)
        }
        
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }
      // ✅✅✅ 에러 로깅 끝 ✅✅✅
      
      throw error
    }
  }

  async incrementPresetUsage(presetId) {
    try {
      console.log(`📈 프리셋 ${presetId} 사용 기록 중...`)
      
      const chartResponse = await this.api.get(`/api/v1/chart/${presetId}`)
      const chart = chartResponse.data.result
      
      let metadata = {}
      if (chart.description) {
        try {
          metadata = JSON.parse(chart.description)
        } catch (e) {
          console.warn('메타데이터 파싱 실패:', e)
          return false
        }
      }
      
      metadata.use_count = (metadata.use_count || 0) + 1
      
      await this.api.put(`/api/v1/chart/${presetId}`, {
        description: JSON.stringify(metadata)
      })
      
      console.log('✅ 프리셋 사용 횟수 증가 완료')
      return true
      
    } catch (error) {
      console.error('프리셋 사용 기록 오류:', error)
      return false
    }
  }

  async updatePreset(presetId, updateData) {
    try {
      console.log(`🔄 프리셋 ${presetId} 수정 중...`)
      
      const chartResponse = await this.api.get(`/api/v1/chart/${presetId}`)
      const chart = chartResponse.data.result
      
      let metadata = {}
      if (chart.description) {
        try {
          metadata = JSON.parse(chart.description)
        } catch (e) {
          throw new Error('메타데이터 파싱 실패')
        }
      }
      
      Object.assign(metadata, updateData)
      
      const updatePayload = {
        description: JSON.stringify(metadata)
      }
      
      if (updateData.preset_name) {
        updatePayload.slice_name = `[PRESET] ${updateData.preset_name}`
      }
      
      await this.api.put(`/api/v1/chart/${presetId}`, updatePayload)
      
      console.log('✅ 프리셋 수정 완료')
      return true
      
    } catch (error) {
      console.error('프리셋 수정 오류:', error)
      throw error
    }
  }

  async deletePreset(presetId) {
    try {
      console.log(`🗑️ 프리셋 ${presetId} 삭제 중...`)
      
      await this.api.delete(`/api/v1/chart/${presetId}`)
      
      console.log('✅ 프리셋 삭제 완료')
      return true
      
    } catch (error) {
      console.error('프리셋 삭제 오류:', error)
      throw error
    }
  }

  _parsePresetFromChart(chart) {
    let metadata = {
      preset_name: chart.slice_name.replace('[PRESET] ', ''),
      preset_description: '',
      chart_type: chart.viz_type,
      use_count: 0,
      created_by: 'admin',
      created_at: chart.created_on || new Date().toISOString(),
      configuration: {}
    }
    
    if (chart.description) {
      try {
        const parsed = JSON.parse(chart.description)
        metadata = { ...metadata, ...parsed }
      } catch (e) {
        console.warn('차트 description 파싱 실패:', e)
      }
    }
    
    if (chart.params && !metadata.configuration.metrics) {
      try {
        const params = typeof chart.params === 'string' 
          ? JSON.parse(chart.params) 
          : chart.params
        
        metadata.configuration = {
          metrics: params.metrics || ['count'],
          groupby: params.groupby || [],
          row_limit: params.row_limit || 10000,
          adhoc_filters: params.adhoc_filters || [],
          color_scheme: params.color_scheme || 'bnbColors'
        }
      } catch (e) {
        console.warn('params 파싱 실패:', e)
      }
    }
    
    return {
      id: chart.id,
      chart_id: chart.id,
      dataset_id: chart.datasource_id,
      ...metadata
    }
  }
}

const presetAPI = new PresetAPI()
export default presetAPI