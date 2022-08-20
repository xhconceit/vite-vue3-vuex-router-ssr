import { createApp } from "./main"

const { app, router } = createApp()

router.isReady().then(() => {
  // 挂载到页面
  app.mount('#app')
})