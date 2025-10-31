<template>
  <a-form-item 
    :label="option.label" 
    :required="option.required"
    :help="option.description"
  >
    <a-input-number
      :value="value"
      :min="option.min"
      :max="option.max"
      :step="option.step || 1"
      :placeholder="option.placeholder || `${option.label}을 입력하세요`"
      style="width: 100%"
      @change="handleChange"
    />
  </a-form-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'NumberOption',
  props: {
    option: {
      type: Object,
      required: true
    },
    value: {
      type: Number,
      default: null
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const handleChange = (val) => {
      emit('update', val)
    }

    return {
      handleChange
    }
  }
})
</script>