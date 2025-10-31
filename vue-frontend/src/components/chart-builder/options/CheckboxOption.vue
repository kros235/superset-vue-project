<template>
  <a-form-item :help="option.description">
    <a-checkbox
      :checked="value"
      @change="handleChange"
    >
      {{ option.label }}
    </a-checkbox>
  </a-form-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'CheckboxOption',
  props: {
    option: {
      type: Object,
      required: true
    },
    value: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const handleChange = (e) => {
      emit('update', e.target.checked)
    }

    return {
      handleChange
    }
  }
})
</script>