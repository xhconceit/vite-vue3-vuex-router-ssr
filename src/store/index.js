import { createStore } from "vuex"

export function createSSRStore () {
  // 避免内存泄漏 所以每次都要导出新的 store
  return createStore({
    state: {
      count: 0
    },
    mutations: {
      setCount(state, payload) {
        state.count = payload
        return state.count
      }
    }
  })
}