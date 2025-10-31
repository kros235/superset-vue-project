<template>
  <a-form-item 
    :label="option.label" 
    :required="option.required"
    :help="option.description"
  >
    <a-select
      :value="value"
      :mode="option.multi ? 'multiple' : undefined"
      :placeholder="option.placeholder || `${option.label}을 선택하세요`"
      :options="option.options"
      :filter-option="filterOption"
      show-search
      style="width: 100%"
      @change="handleChange"
    />
  </a-form-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SelectOption',
  props: {
    option: {
      type: Object,
      required: true
    },
    value: {
      type: [String, Number, Array],
      default: null
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const handleChange = (val) => {
      emit('update', val)
    }

    const filterOption = (input, option) => {
      return option.label.toLowerCase().includes(input.toLowerCase())
    }

    return {
      handleChange,
      filterOption
    }
  }
})
</script>