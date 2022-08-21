<script>
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default defineComponent({
  setup() {
    const store = useStore()
    const count = computed(() => store.state.count)
    return {
      count
    }
  },
  async asyncData({store, route}) {
    await axios.get('http://localhost:3000/api').then(res => {
      const { count } = res.data
      store.commit('setCount', count)
    })
  }
})
</script>

<template>
  <div>Hello World!!! {{ count }} <router-link to="/mine">Mine</router-link></div>
</template>

<style scoped>
</style>
