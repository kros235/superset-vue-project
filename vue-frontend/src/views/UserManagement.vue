<template>
  <div>
    <div style="margin-bottom: 24px">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600">
        사용자 관리
      </h1>
      <p style="margin: 8px 0 0 0; color: #666">
        시스템 사용자와 권한을 관리합니다.
      </p>
    </div>

    <a-alert
      v-if="!canManageUsers"
      message="접근 권한 없음"
      description="사용자 관리 권한이 없습니다."
      type="warning"
      show-icon
    />

    <a-tabs v-else default-active-key="users">
      <a-tab-pane :tab="`사용자 (${users.length})`" key="users">
        <a-card title="사용자 목록">
          <template #extra>
            <a-button type="primary" @click="showUserModal">
              <template #icon>
                <PlusOutlined />
              </template>
              사용자 추가
            </a-button>
          </template>

          <a-table
            :dataSource="users"
            :columns="userColumns"
            :loading="loading"
            :rowKey="record => record.id"
            :pagination="{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}명의 사용자`
            }"
          />
        </a-card>
      </a-tab-pane>

      <a-tab-pane :tab="`역할 (${roles.length})`" key="roles">
        <a-card title="역할 및 권한">
          <a-table
            :dataSource="roles"
            :columns="roleColumns"
            :loading="loading"
            :rowKey="record => record.id"
            :pagination="{
              pageSize: 10,
              showTotal: (total) => `총 ${total}개의 역할`
            }"
          />
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 사용자 추가/편집 모달 -->
    <a-modal
      v-model:open="userModalVisible"
      :title="editingUser ? '사용자 편집' : '사용자 추가'"
      :footer="null"
      width="600px"
      @cancel="closeUserModal"
    >
      <UserForm
        :user="editingUser"
        :roles="roles"
        @submit="handleUserSubmit"
        @cancel="closeUserModal"
      />
    </a-modal>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, h } from 'vue'
import {
  PlusOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  CrownOutlined,
  SafetyOutlined,
  TeamOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import supersetAPI from '../services/supersetAPI'
import UserForm from '../components/UserForm.vue'

export default defineComponent({
  name: 'UserManagementView',
  components: {
    PlusOutlined,
    UserForm
  },
  setup () {
    const users = ref([])
    const roles = ref([])
    const loading = ref(false)
    const userModalVisible = ref(false)
    const editingUser = ref(null)

    const canManageUsers = computed(() => authService.canManageUsers())

    const getRoleColor = (roleName) => {
      const colors = {
        Admin: 'red',
        Alpha: 'orange',
        Gamma: 'blue',
        Public: 'green',
        sql_lab: 'purple'
      }
      return colors[roleName] || 'default'
    }

    const getRoleIcon = (roleName) => {
      const icons = {
        Admin: CrownOutlined,
        Alpha: SafetyOutlined,
        Gamma: UserOutlined,
        Public: TeamOutlined
      }
      return icons[roleName] || UserOutlined
    }

    // 사용자 테이블 컬럼
    const userColumns = [
      {
        title: '사용자',
        key: 'user',
        customRender: ({ record }) => h('div', { style: { display: 'flex', alignItems: 'center' } }, [
          h('a-avatar', {
            size: 'small',
            style: { backgroundColor: record.active ? '#1890ff' : '#d9d9d9', marginRight: '8px' }
          }, {
            icon: () => h(UserOutlined)
          }),
          h('div', [
            h('div', { style: { fontWeight: '500' } }, `${record.first_name} ${record.last_name}`),
            h('div', { style: { fontSize: '12px', color: '#666' } }, `@${record.username}`)
          ])
        ])
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email'
      },
      {
        title: '역할',
        dataIndex: 'roles',
        key: 'roles',
        customRender: ({ text }) => h('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } },
          text?.map(role => h('a-tag', {
            key: role.id,
            color: getRoleColor(role.name)
          }, {
            icon: () => h(getRoleIcon(role.name)),
            default: () => role.name
          }))
        )
      },
      {
        title: '상태',
        dataIndex: 'active',
        key: 'active',
        customRender: ({ text }) => h('a-badge', {
          status: text ? 'success' : 'error',
          text: text ? '활성' : '비활성'
        })
      },
      {
        title: '작업',
        key: 'actions',
        customRender: ({ record }) => h('div', { style: { display: 'flex', gap: '8px' } }, [
          h('a-button', {
            type: 'text',
            size: 'small',
            onClick: () => editUser(record)
          }, {
            icon: () => h(EditOutlined),
            default: () => '편집'
          }),
          h('a-button', {
            type: 'text',
            size: 'small',
            onClick: () => toggleUserStatus(record.id, record.active)
          }, {
            icon: () => h(record.active ? LockOutlined : UnlockOutlined),
            default: () => record.active ? '비활성화' : '활성화'
          }),
          h('a-popconfirm', {
            title: '정말 삭제하시겠습니까?',
            onConfirm: () => deleteUser(record.id),
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

    // 역할 테이블 컬럼
    const roleColumns = [
      {
        title: '역할',
        key: 'role',
        customRender: ({ record }) => h('div', { style: { display: 'flex', alignItems: 'center' } }, [
          h(getRoleIcon(record.name), { style: { marginRight: '8px' } }),
          h('div', [
            h('div', { style: { fontWeight: '500' } }, record.name),
            h('div', { style: { fontSize: '12px', color: '#666' } }, `ID: ${record.id}`)
          ])
        ])
      },
      {
        title: '설명',
        dataIndex: 'description',
        key: 'description',
        customRender: ({ text }) => text || '-'
      },
      {
        title: '권한 수',
        dataIndex: 'permissions',
        key: 'permissions',
        customRender: ({ text }) => h('a-badge', {
          count: text?.length || 0,
          style: { backgroundColor: '#52c41a' }
        })
      },
      {
        title: '사용자 수',
        key: 'user_count',
        customRender: ({ record }) => {
          const userCount = users.value.filter(user =>
            user.roles?.some(role => role.id === record.id)
          ).length
          return h('a-badge', {
            count: userCount,
            style: { backgroundColor: '#1890ff' }
          })
        }
      }
    ]

    const loadData = async () => {
      loading.value = true
      try {
        const [usersData, rolesData] = await Promise.all([
          supersetAPI.getUsers(),
          supersetAPI.getRoles()
        ])
        users.value = usersData
        roles.value = rolesData
      } catch (error) {
        console.error('데이터 로드 오류:', error)
        message.error('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        loading.value = false
      }
    }

    const showUserModal = () => {
      editingUser.value = null
      userModalVisible.value = true
    }

    const closeUserModal = () => {
      userModalVisible.value = false
      editingUser.value = null
    }

    const editUser = (user) => {
      editingUser.value = user
      userModalVisible.value = true
    }

    const handleUserSubmit = async (values) => {
      try {
        const payload = {
          username: values.username,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          active: values.active !== false,
          roles: values.roles || []
        }

        if (!editingUser.value && values.password) {
          payload.password = values.password
        }

        if (editingUser.value) {
          await supersetAPI.updateUser(editingUser.value.id, payload)
          message.success('사용자가 업데이트되었습니다.')
        } else {
          await supersetAPI.createUser(payload)
          message.success('사용자가 생성되었습니다.')
        }

        closeUserModal()
        loadData()
      } catch (error) {
        console.error('사용자 저장 오류:', error)
        message.error('사용자 저장 중 오류가 발생했습니다.')
      }
    }

    const toggleUserStatus = async (userId, currentStatus) => {
      try {
        await supersetAPI.updateUser(userId, { active: !currentStatus })
        message.success(`사용자가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`)
        loadData()
      } catch (error) {
        console.error('사용자 상태 변경 오류:', error)
        message.error('사용자 상태 변경 중 오류가 발생했습니다.')
      }
    }

    const deleteUser = async (userId) => {
      try {
        await supersetAPI.deleteUser(userId)
        message.success('사용자가 삭제되었습니다.')
        loadData()
      } catch (error) {
        console.error('사용자 삭제 오류:', error)
        message.error('사용자 삭제 중 오류가 발생했습니다.')
      }
    }

    onMounted(() => {
      if (canManageUsers.value) {
        loadData()
      }
    })

    return {
      users,
      roles,
      loading,
      userModalVisible,
      editingUser,
      canManageUsers,
      userColumns,
      roleColumns,
      showUserModal,
      closeUserModal,
      handleUserSubmit
    }
  }
})
</script>