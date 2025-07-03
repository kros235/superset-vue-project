<template>
  <div>
    <div style="margin-bottom: 24px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 600">
            사용자 관리
          </h1>
          <p style="margin: 8px 0 0 0; color: #666">
            시스템 사용자 및 권한을 관리합니다.
          </p>
        </div>
        <a-space>
          <a-button @click="loadUsers" :loading="loading">
            <template #icon>
              <ReloadOutlined />
            </template>
            새로고침
          </a-button>
          <a-button type="primary" @click="showAddUser">
            <template #icon>
              <PlusOutlined />
            </template>
            사용자 추가
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

    <!-- 사용자 목록 -->
    <a-card v-else>
      <a-table
        :columns="userColumns"
        :data-source="users"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'username'">
            <a-typography-text strong>{{ record.username }}</a-typography-text>
          </template>
          <template v-else-if="column.key === 'first_name'">
            {{ record.first_name }} {{ record.last_name }}
          </template>
          <template v-else-if="column.key === 'email'">
            <a-typography-text type="secondary">{{ record.email }}</a-typography-text>
          </template>
          <template v-else-if="column.key === 'roles'">
            <a-space>
              <a-tag
                v-for="role in record.roles"
                :key="role.id"
                :color="getRoleColor(role.name)"
              >
                {{ role.name }}
              </a-tag>
            </a-space>
          </template>
          <template v-else-if="column.key === 'active'">
            <a-tag :color="record.active ? 'green' : 'red'">
              {{ record.active ? '활성' : '비활성' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="editUser(record)">
                편집
              </a-button>
              <a-button
                size="small"
                :type="record.active ? 'danger' : 'primary'"
                @click="toggleUserStatus(record)"
              >
                {{ record.active ? '비활성화' : '활성화' }}
              </a-button>
              <a-popconfirm
                title="정말 삭제하시겠습니까?"
                @confirm="deleteUser(record.id)"
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

    <!-- 사용자 추가/편집 모달 -->
    <a-modal
      v-model:open="showUserModal"
      :title="editingUser ? '사용자 편집' : '사용자 추가'"
      :width="600"
      @ok="handleUserSubmit"
      @cancel="cancelUserEdit"
    >
      <a-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="사용자명" name="username">
              <a-input
                v-model:value="userForm.username"
                :disabled="!!editingUser"
                placeholder="사용자명 입력"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="이메일" name="email">
              <a-input v-model:value="userForm.email" placeholder="이메일 입력" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="이름" name="first_name">
              <a-input v-model:value="userForm.first_name" placeholder="이름 입력" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="성" name="last_name">
              <a-input v-model:value="userForm.last_name" placeholder="성 입력" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item v-if="!editingUser" label="비밀번호" name="password">
          <a-input-password v-model:value="userForm.password" placeholder="비밀번호 입력" />
        </a-form-item>

        <a-form-item label="역할" name="roles">
          <a-select
            v-model:value="userForm.roles"
            mode="multiple"
            placeholder="역할 선택"
            :options="roleOptions"
          />
        </a-form-item>

        <a-form-item>
          <a-checkbox v-model:checked="userForm.active">
            활성 사용자
          </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import supersetAPI from '../services/supersetAPI'
import authService from '../services/authService'

export default defineComponent({
  name: 'UserManagement',
  components: {
    ReloadOutlined,
    PlusOutlined
  },
  setup () {
    const loading = ref(false)
    const error = ref('')
    const users = ref([])
    const roles = ref([])
    const showUserModal = ref(false)
    const editingUser = ref(null)
    const userFormRef = ref()

    const userForm = ref({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      roles: [],
      active: true
    })

    const userRules = computed(() => ({
      username: [
        { required: true, message: '사용자명을 입력해주세요!' },
        { min: 3, message: '사용자명은 최소 3자 이상이어야 합니다!' }
      ],
      email: [
        { required: true, message: '이메일을 입력해주세요!' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다!' }
      ],
      first_name: [
        { required: true, message: '이름을 입력해주세요!' }
      ],
      password: editingUser.value
        ? []
        : [
          { required: true, message: '비밀번호를 입력해주세요!' },
          { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다!' }
        ],
      roles: [
        { required: true, message: '최소 하나의 역할을 선택해주세요!' }
      ]
    }))

    const userColumns = [
      {
        title: '사용자명',
        dataIndex: 'username',
        key: 'username'
      },
      {
        title: '이름',
        dataIndex: 'first_name',
        key: 'first_name'
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email'
      },
      {
        title: '역할',
        dataIndex: 'roles',
        key: 'roles'
      },
      {
        title: '상태',
        dataIndex: 'active',
        key: 'active'
      },
      {
        title: '생성일',
        dataIndex: 'created_on',
        key: 'created_on'
      },
      {
        title: '작업',
        key: 'actions',
        width: 250
      }
    ]

    const roleOptions = computed(() => {
      return roles.value.map(role => ({
        label: role.name,
        value: role.id
      }))
    })

    const getRoleColor = (roleName) => {
      const colors = {
        Admin: 'red',
        Alpha: 'orange',
        Gamma: 'blue',
        sql_lab: 'green'
      }
      return colors[roleName] || 'default'
    }

    const loadUsers = async () => {
      if (!authService.canManageUsers()) {
        error.value = '사용자 관리 권한이 없습니다.'
        return
      }

      loading.value = true
      error.value = ''

      try {
        const [usersData, rolesData] = await Promise.all([
          supersetAPI.getUsers(),
          supersetAPI.getRoles()
        ])

        users.value = usersData
        roles.value = rolesData
      } catch (err) {
        console.error('사용자 데이터 로드 오류:', err)
        error.value = '사용자 데이터를 불러오는 중 오류가 발생했습니다.'
      } finally {
        loading.value = false
      }
    }

    const showAddUser = () => {
      editingUser.value = null
      userForm.value = {
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        roles: [],
        active: true
      }
      showUserModal.value = true
    }

    const editUser = (user) => {
      editingUser.value = user
      userForm.value = {
        username: user.username,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '',
        roles: user.roles ? user.roles.map(role => role.id) : [],
        active: user.active !== false
      }
      showUserModal.value = true
    }

    const handleUserSubmit = async () => {
      try {
        await userFormRef.value.validate()

        const userData = {
          username: userForm.value.username,
          email: userForm.value.email,
          first_name: userForm.value.first_name,
          last_name: userForm.value.last_name,
          roles: userForm.value.roles,
          active: userForm.value.active
        }

        if (!editingUser.value && userForm.value.password) {
          userData.password = userForm.value.password
        }

        if (editingUser.value) {
          await supersetAPI.updateUser(editingUser.value.id, userData)
          message.success('사용자 정보가 수정되었습니다!')
        } else {
          await supersetAPI.createUser(userData)
          message.success('새 사용자가 추가되었습니다!')
        }

        showUserModal.value = false
        loadUsers()
      } catch (error) {
        console.error('사용자 저장 오류:', error)
        message.error('사용자 저장 중 오류가 발생했습니다.')
      }
    }

    const cancelUserEdit = () => {
      showUserModal.value = false
      editingUser.value = null
      userForm.value = {
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        roles: [],
        active: true
      }
    }

    const toggleUserStatus = async (user) => {
      try {
        const newStatus = !user.active
        await supersetAPI.updateUser(user.id, { active: newStatus })
        message.success(`사용자가 ${newStatus ? '활성화' : '비활성화'}되었습니다!`)
        loadUsers()
      } catch (error) {
        console.error('사용자 상태 변경 오류:', error)
        message.error('사용자 상태 변경에 실패했습니다.')
      }
    }

    const deleteUser = async (userId) => {
      try {
        await supersetAPI.deleteUser(userId)
        message.success('사용자가 삭제되었습니다!')
        loadUsers()
      } catch (error) {
        console.error('사용자 삭제 오류:', error)
        message.error('사용자 삭제에 실패했습니다.')
      }
    }

    onMounted(() => {
      loadUsers()
    })

    return {
      loading,
      error,
      users,
      roles,
      showUserModal,
      editingUser,
      userFormRef,
      userForm,
      userRules,
      userColumns,
      roleOptions,
      getRoleColor,
      loadUsers,
      showAddUser,
      editUser,
      handleUserSubmit,
      cancelUserEdit,
      toggleUserStatus,
      deleteUser
    }
  }
})
</script>
