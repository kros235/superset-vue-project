<template>
  <div id="app">
    <a-config-provider :locale="locale">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import koKR from 'ant-design-vue/es/locale/ko_KR'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

export default defineComponent({
  name: 'App',
  setup () {
    return {
      locale: koKR
    }
  }
})
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

* {
  box-sizing: border-box;
}

.ant-layout {
  min-height: 100vh;
}
</style>