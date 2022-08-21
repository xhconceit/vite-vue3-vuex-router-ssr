import { createApp } from "./main"
import { renderToString } from 'vue/server-renderer'

export async function render(url) {
  const { app, store, router } = createApp()
  // 服务端传入 url 通知服务端渲染对应组件。
  await router.push(url)
  // 解析完该路由关联的全部组件，异步输入钩子和异步组件。
  await router.isReady()
  // 获取当前路由关联的全部组件
  const matchedComponents = router.currentRoute.value.matched.flatMap(record => Object.values(record.components))
  const route = router.currentRoute
  // 请求当前路由关联组件的 asyncData 数据
  await Promise.all(matchedComponents.map((Component) => {
    if (Component.asyncData) {
      return Component.asyncData({
        store,
        route
      })
    }
    return Component
  }))
  // 将 vue 渲染成 html 文件
  const appHtml = await renderToString(app)
  const state = store.state
  // 导出 html 同时导出在服务区渲染好的 state 数据
  return { appHtml, state }
}