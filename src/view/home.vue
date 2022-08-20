<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
const store = useStore()
const count = computed(() => store.state.count)
</script>

<template>
  <div>Hello World!!! {{count}}</div>
</template>

<style scoped>
</style>
