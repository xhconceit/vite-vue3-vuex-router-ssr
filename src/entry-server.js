import { createApp } from "./main"
import { renderToString } from 'vue/server-renderer'

export async function render(url) {
  const { app, router } = createApp()
  // 服务端传入 url 通知服务端渲染对应组件。
  await router.push(url)
  // 解析完该路由关联的全部组件，异步输入钩子和异步组件。
  await router.isReady()
  // 将 vue 渲染成 html 文件
  const html = await renderToString(app)
  return html
}