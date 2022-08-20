<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
const store = useStore()
const count = computed(() => store.state.count)
onMounted(() => {
  axios.get('/api').then(res => {
  const { count } = res.data
  store.commit('setCount', count)
})
})
</script>

<template>
  <div>Hello World!!! {{count}}</div>
</template>

<style scoped>
</style>
