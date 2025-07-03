<template>
  <a-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    layout="vertical"
    @finish="handleSubmit"
  >
    <a-form-item
      label="사용자명"
      name="username"
    >
      <a-input
        v-model:value="formData.username"
        placeholder="사용자명을 입력하세요"
      />
    </a-form-item>

    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item
          label="이름"
          name="first_name"
        >
          <a-input
            v-model:value="formData.first_name"
            placeholder="이름"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item
          label="성"
          name="last_name"
        >
          <a-input
            v-model:value="formData.last_name"
            placeholder="성"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-form-item
      label="이메일"
      name="email"
    >
      <a-input
        v-model:value="formData.email"
        placeholder="이메일을 입력하세요"
      />
    </a-form-item>

    <a-form-item
      v-if="!user"
      label="비밀번호"
      name="password"
    >
      <a-input-password
        v-model:value="formData.password"
        placeholder="비밀번호를 입력하세요"
      />
    </a-form-item>

    <a-form-item
      label="역할"
      name="roles"
    >
      <a-select
        v-model:value="formData.roles"
        mode="multiple"
        placeholder="사용자 역할을 선택하세요"
      >
        <a-select-option
          v-for="role in roles"
          :key="role.id"
          :value="role.id"
        >
          {{ role.name }}
        </a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item>
      <a-space>
        <a-button type="primary" html-type="submit">
          {{ user ? '업데이트' : '생성' }}
        </a-button>
        <a-button @click="$emit('cancel')">
          취소
        </a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  name: 'UserForm',
  props: {
    user: {
      type: Object,
      default: null
    },
    roles: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'cancel'],
  setup (props, { emit }) {
    const formRef = ref()
    const formData = ref({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      roles: []
    })

    const rules = {
      username: [
        { required: true, message: '사용자명을 입력해주세요', trigger: 'blur' }
      ],
      first_name: [
        { required: true, message: '이름을 입력해주세요', trigger: 'blur' }
      ],
      last_name: [
        { required: true, message: '성을 입력해주세요', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '이메일을 입력해주세요', trigger: 'blur' },
        { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' }
      ],
      password: [
        { required: !props.user, message: '비밀번호를 입력해주세요', trigger: 'blur' }
      ]
    }

    const handleSubmit = (values) => {
      emit('submit', values)
    }

    watch(() => props.user, (newUser) => {
      if (newUser) {
        formData.value = {
          username: newUser.username || '',
          first_name: newUser.first_name || '',
          last_name: newUser.last_name || '',
          email: newUser.email || '',
          password: '',
          roles: newUser.roles?.map(r => r.id) || []
        }
      } else {
        formData.value = {
          username: '',
          first_name: '',
          last_name: '',
          email: '',
          password: '',
          roles: []
        }
      }
    }, { immediate: true })

    return {
      formRef,
      formData,
      rules,
      handleSubmit
    }
  }
})
</script>