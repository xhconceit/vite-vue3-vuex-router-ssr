import { createApp } from "./main"

const { app, router, store } = createApp()

// 将服务端插入 index.html 的数据赋用到 Store
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

router.isReady().then(() => {
  router.beforeEach((to, form, next) => {
    const toComponents = router.resolve(to).matched.flatMap(record => Object.values(record.components))
    const formComponents = router.resolve(form).matched.flatMap(record => Object.values(record.components))
    const actived = toComponents.filter((c, i) => {
      return formComponents[i] !== c
    })
    const route = router.currentRoute
    // 请求当前路由关联组件的 asyncData 数据
    Promise.all(actived.map((Component) => {
      if (Component.asyncData) {
        return Component.asyncData({
          store,
          route
        })
      }
      return Component
    })).then(() => {
      next()
    })
  })
  // 挂载到页面
  app.mount('#app')
})