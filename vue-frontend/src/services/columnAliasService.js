// ============================================
// 🆕 새로 생성하는 파일
// vue-frontend/src/services/columnAliasService.js
// 컬럼 Alias 관리 서비스
// ============================================

class ColumnAliasService {
  constructor() {
    this.storageKey = 'superset_column_aliases'
  }

  /**
   * 데이터셋의 컬럼 Alias 저장
   * @param {number} datasetId - 데이터셋 ID
   * @param {Object} aliases - { column_name: alias } 형태
   */
  saveAliases(datasetId, aliases) {
    try {
      const allAliases = this.getAllAliases()
      allAliases[datasetId] = aliases
      localStorage.setItem(this.storageKey, JSON.stringify(allAliases))
      console.log(`✅ Alias 저장 완료: 데이터셋 ${datasetId}`, aliases)
    } catch (error) {
      console.error('Alias 저장 실패:', error)
    }
  }

  /**
   * 데이터셋의 컬럼 Alias 조회
   * @param {number} datasetId - 데이터셋 ID
   * @returns {Object} - { column_name: alias } 형태
   */
  getAliases(datasetId) {
    try {
      const allAliases = this.getAllAliases()
      return allAliases[datasetId] || {}
    } catch (error) {
      console.error('Alias 조회 실패:', error)
      return {}
    }
  }

  /**
   * 모든 Alias 조회
   */
  getAllAliases() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('전체 Alias 조회 실패:', error)
      return {}
    }
  }

  /**
   * 데이터셋의 Alias 삭제
   */
  deleteAliases(datasetId) {
    try {
      const allAliases = this.getAllAliases()
      delete allAliases[datasetId]
      localStorage.setItem(this.storageKey, JSON.stringify(allAliases))
      console.log(`✅ Alias 삭제 완료: 데이터셋 ${datasetId}`)
    } catch (error) {
      console.error('Alias 삭제 실패:', error)
    }
  }

  /**
   * Alias를 Superset 데이터셋의 verbose_name에 동기화
   * (Superset API를 통해 실제 데이터셋 업데이트)
   */
  async syncToSuperset(datasetId, aliases, supersetAPI) {
    try {
      console.log(`🔄 Superset에 Alias 동기화 중: 데이터셋 ${datasetId}`)
      
      // 현재 데이터셋 정보 조회
      const datasetInfo = await supersetAPI.getDataset(datasetId)
      const currentColumns = datasetInfo.result?.columns || []
      
      // 각 컬럼의 verbose_name 업데이트
      const updatedColumns = currentColumns.map(col => ({
        ...col,
        verbose_name: aliases[col.column_name] || col.verbose_name || col.column_name
      }))
      
      // 데이터셋 업데이트 (Superset API)
      await supersetAPI.api.put(`/api/v1/dataset/${datasetId}`, {
        columns: updatedColumns
      })
      
      console.log(`✅ Superset 동기화 완료`)
      return true
    } catch (error) {
      console.error('Superset 동기화 실패:', error)
      return false
    }
  }
}

// 싱글톤 인스턴스
const columnAliasService = new ColumnAliasService()
export default columnAliasService