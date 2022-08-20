# 前言

该项目学习 vite + vue3 + vuex + router 实现 SSR 服务器渲染 

## 项目需要安装的包

1. vue3
2. vue-router
3. express

## 安装 Vite Vue3

```bash
yarn create vite vite-vue3-vuex-router-ssr # 选择 vue
```

## vue-router
配置路由

安装 vue-router

```bash
yarn add vue-router
```

配置 router

```javascript
import Home from '../view/home.vue'
import Mine from '../view/mine.vue'
import { createRouter, createWebHistory } from "vue-router";

// 路由
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/mine',
    name: 'mine',
    component: Mine
  },
]

export default createRouter({
  routes,
  history: createWebHistory()
})
```

## SSR
SSR 配置

新建服务端客户端入口文件，server文件
```
- index.html
- src/
  - main.js          # 导出环境无关的（通用的）应用代码
  - entry-client.js  # 客户端入口文件，将应用挂载到一个 DOM 元素上
  - entry-server.js  # 服务端入口文件，使用某框架的 SSR API 渲染该应用
- server.js          # 服务器文件
```

### router.js
为了避免内存溢出，所以路由每次都要导出一个新的 router
服务端只可以使用内存路由

```javascript
import { createMemoryHistory, createRouter, createWebHistory } from "vue-router"

// 路由文件 导出修改成这样
export function createSSRRouter() {
  return createRouter({
    routes,
    // 服务端只可以使用内存路由 判断是否是 ssr 选择路由模式
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory()
  })
}
```

### main.js
将 main.js 修改成服务端，客户端通用的代码文件
```javascript
import { createSSRApp } from 'vue'
import { createSSRRouter } from './router/index'
import './style.css'
import App from './App.vue'

export default function (params) {
  const app = createSSRApp(App)
  const router = createSSRRouter()

  app.use(router)

  return { app, router }
}
```

### entry-client.js
客户端入口文件

需要将 index.html 文件中导入的 js 改成 entry-client.js
```html
<script type="module" src="/src/entry-client.js"></script>
```
```javascript
import { createApp } from "./main"

const { app, router } = createApp()

router.isReady().then(() => {
  // 挂载到页面
  app.mount('#app')
})
```

### entry-server.js
服务端入口文件

```javascript
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
```

### server.js
SSR 服务端

需要安装 express 启动服务
```bash
yarn add express -D
```

编写 SSR 渲染服务器
```javascript
const fs = require('fs')
const path = require('path')
const express = require('express')
const { createServer: createViteServer } = require('vite')
async function createServer() {
  const app = express()

  // 以中间件模式创建 Vite 应用，这将禁用 Vite 自身的 HTML 服务逻辑
  // 并让上级服务器接管控制
  //
  // 如果你想使用 Vite 自己的 HTML 服务逻辑（将 Vite 作为
  // 一个开发中间件来使用），那么这里请用 'html'
  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' }
  })
  // 使用 vite 的 Connect 实例作为中间件
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    const url = req.originalUrl
  
    try {
      // 1. 读取 index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'),
        'utf-8'
      )
  
      // 2. 应用 Vite HTML 转换。这将会注入 Vite HMR 客户端，
      //    同时也会从 Vite 插件应用 HTML 转换。
      //    例如：@vitejs/plugin-react-refresh 中的 global preambles
      template = await vite.transformIndexHtml(url, template)
  
      // 3. 加载服务器入口。vite.ssrLoadModule 将自动转换
      //    你的 ESM 源码使之可以在 Node.js 中运行！无需打包
      //    并提供类似 HMR 的根据情况随时失效。
      const { render } = await vite.ssrLoadModule('/src/entry-server.js')
  
      // 4. 渲染应用的 HTML。这假设 entry-server.js 导出的 `render`
      //    函数调用了适当的 SSR 框架 API。
      //    例如 ReactDOMServer.renderToString()
      const appHtml = await render(url)
  
      // 5. 注入渲染后的应用程序 HTML 到模板中。
      const html = template.replace(`<!--ssr-outlet-->`, appHtml)
  
      // 6. 返回渲染后的 HTML。
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      // 如果捕获到了一个错误，让 Vite 来修复该堆栈，这样它就可以映射回
      // 你的实际源码中。
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.message)
    }
  })

  app.listen(3000)
}

createServer()
```

渲染后的 html 文件需要通过 `<!--ssr-outlet-->` 插入到模板文件中
修改 index.html
```html
<div id="app"><!--ssr-outlet--></div>
```

