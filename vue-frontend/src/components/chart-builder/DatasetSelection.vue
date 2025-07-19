<template>
  <a-card title="1단계: 데이터셋 선택" style="margin-bottom: 24px">
    <p style="color: #666; margin-bottom: 24px">
      차트를 생성할 데이터셋을 선택해주세요.
    </p>

    <!-- 🔥 디버깅 정보 추가 (개발 시에만) -->
    <div v-if="false" style="background: #f0f0f0; padding: 8px; margin-bottom: 16px; font-size: 12px;">
      <div>데이터셋 개수: {{ datasets.length }}</div>
      <div>선택된 데이터셋: {{ selectedDataset?.id || 'null' }}</div>
      <div>로딩 상태: {{ loading }}</div>
    </div>

    <a-spin :spinning="loading" tip="데이터셋 목록을 불러오는 중...">
      <a-row :gutter="[16, 16]" v-if="datasets.length > 0">
        <a-col
          v-for="dataset in datasets"
          :key="dataset.id"
          :xs="24"
          :sm="12"
          :lg="8"
        >
          <a-card
            hoverable
            :class="{ 'selected-dataset': selectedDataset?.id === dataset.id }"
            @click="selectDataset(dataset)"
            style="cursor: pointer"
          >
            <template #title>
              <div style="display: flex; align-items: center">
                <DatabaseOutlined style="margin-right: 8px; color: #1890ff" />
                {{ dataset.table_name }}
                
                <!-- 🔥 선택 상태 아이콘 추가 -->
                <CheckCircleOutlined 
                  v-if="selectedDataset?.id === dataset.id"
                  style="margin-left: auto; color: #52c41a; font-size: 18px"
                />
              </div>
            </template>

            <div style="margin-bottom: 12px">
              <a-tag color="blue">
                {{ dataset.database?.database_name || 'Unknown DB' }}
              </a-tag>
              <!-- 🔥 선택됨 태그 추가 -->
              <a-tag v-if="selectedDataset?.id === dataset.id" color="green">
                <CheckOutlined />
                선택됨
              </a-tag>
            </div>

            <p style="color: #666; font-size: 14px; margin-bottom: 8px">
              {{ dataset.description || '설명이 없습니다.' }}
            </p>

            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-size: 12px; color: #999">
                컬럼: {{ dataset.columns?.length || 0 }}개
              </span>
              <span style="font-size: 12px; color: #999">
                {{ formatDate(dataset.created_on) }}
              </span>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-empty v-else-if="!loading" description="사용 가능한 데이터셋이 없습니다">
        <template #description>
          <span>사용 가능한 데이터셋이 없습니다.</span>
          <br />
          <span style="color: #999">데이터 소스 관리에서 데이터셋을 먼저 생성해주세요.</span>
        </template>
      </a-empty>
    </a-spin>

    <!-- 🔥 선택된 데이터셋 정보 표시 -->
    <div v-if="selectedDataset" style="margin-top: 24px">
      <a-divider />
      <div class="selected-info">
        <h4 style="margin: 0 0 8px 0; color: #1890ff">
          <DatabaseOutlined style="margin-right: 8px" />
          선택된 데이터셋: {{ selectedDataset.table_name }}
        </h4>
        <p style="color: #666; margin: 0">
          데이터베이스: {{ selectedDataset.database?.database_name }}
        </p>
        <div style="margin-top: 8px">
          <a-tag color="green" style="margin-right: 8px">
            <CheckOutlined />
            선택 완료
          </a-tag>
          <a-tag color="blue">
            {{ selectedDataset.columns?.length || 0 }}개 컬럼
          </a-tag>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script>
import { defineComponent } from 'vue'
import { 
  DatabaseOutlined, 
  CheckOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'DatasetSelection',
  components: {
    DatabaseOutlined,
    CheckOutlined,
    CheckCircleOutlined
  },
  props: {
    datasets: {
      type: Array,
      default: () => []
    },
    selectedDataset: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  setup (props, { emit }) {
    const selectDataset = (dataset) => {
      console.log('데이터셋 선택됨:', dataset)
      emit('change', dataset.id)
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('ko-KR')
      } catch (error) {
        return ''
      }
    }

    return {
      selectDataset,
      formatDate
    }
  }
})
</script>

<style scoped>
.selected-dataset {
  border: 2px solid #1890ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  transform: translateY(-2px);
}

.ant-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

.ant-card-body {
  padding: 16px;
}

.ant-card-head {
  border-bottom: 1px solid #f0f0f0;
}

.ant-card-head-title {
  font-weight: 600;
}

/* 선택된 데이터셋 정보 박스 스타일 */
.selected-info {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 16px;
}

/* 로딩 스피너 커스터마이징 */
.ant-spin-nested-loading {
  position: relative;
}

.ant-spin-container {
  transition: opacity 0.3s;
}

/* 태그 스타일링 */
.ant-tag {
  margin: 2px 4px 2px 0;
  border-radius: 4px;
}

/* 빈 상태 스타일링 */
.ant-empty-description {
  color: #999;
  font-size: 14px;
}
</style>