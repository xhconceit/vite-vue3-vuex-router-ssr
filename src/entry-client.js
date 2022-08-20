import { createApp } from "./main"

const { app, router, store } = createApp()

// 将服务端插入 index.html 的数据赋用到 Store
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

router.isReady().then(() => {
  // 挂载到页面
  app.mount('#app')
})