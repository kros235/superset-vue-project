<template>
  <a-form-item 
    :label="option.label" 
    :required="option.required"
    :help="option.description"
  >
    <a-textarea
      :value="value"
      :rows="4"
      :placeholder="option.placeholder || `${option.label}을 입력하세요`"
      @change="handleChange"
    />
  </a-form-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TextareaOption',
  props: {
    option: {
      type: Object,
      required: true
    },
    value: {
      type: String,
      default: ''
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const handleChange = (e) => {
      emit('update', e.target.value)
    }

    return {
      handleChange
    }
  }
})
</script>