# 前言

该项目学习 vite + vue3 + vuex + router 实现 SSR 服务器渲染 

## 项目需要安装的包

1. vue3
2. vue-router
3. express
4. vuex
5. Axios

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

## vuex
vuex

### 安装
```bash
yarn add vuex
```

### 配置 vuex
新建 /src/store/index.js 配置 Store
```javascript
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
```
修改 main.js

```javascript
import { createSSRStore } from './store/index'

export function createApp(params) {
  const app = createSSRApp(App)
  const router = createSSRRouter()
  const store = createSSRStore()

  app.use(router)
  app.use(store)

  return { app, router, store }
}
```
在 home 组件使用
```vue
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
```

### 服务器 Store 数据和 客户端 Store 数据同步

将服务器数据插入到 index.html 文件中，客户端加载成功后，填充到客户端 Store

修改服务端入口文件 entry-server.js
```javascript
export async function render(url) {
  const { app, store, router } = createApp()
  // 服务端传入 url 通知服务端渲染对应组件。
  await router.push(url)
  // 解析完该路由关联的全部组件，异步输入钩子和异步组件。
  await router.isReady()
  // 将 vue 渲染成 html 文件
  const appHtml = await renderToString(app)
  const state = store.state
  // 导出 html 同时导出在服务区渲染好的 state 数据
  return { appHtml, state }
}
```

修改服务器文件 server.js
```javascript
const { appHtml, state } = await render(url)
  
// 5. 注入渲染后的应用程序 HTML 到模板中。
const html = template.replace(`<!--ssr-outlet-->`, appHtml)
// 将 state 数据转成 json 后插入到 html 中
.replace("'<!--vuex-state-->'", JSON.stringify(state))
```

修改模版文件 index.html

```html
<script>
  window.__INITIAL_STATE__ = '<!--vuex-state-->';
</script>
```

修改客户端入口文件 entry-client.js
```javascript
const { app, router, store } = createApp()

// 将服务端插入 index.html 的数据赋用到 Store
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}
```

## Axios
Axios 网络请求库

### 安装
```
yarn add axios
```

### 编写测试接口
修改 server.cjs
```javascript
// 测试接口
app.use('/api', (req, res) => {
  res.json({
    count: Math.floor(Math.random()*100)
  })
})
```

### 使用测试接口
在 home 组件中使用测试接口
修改 home.js
```vue
<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
const store = useStore()
const count = computed(() => store.state.count)
onMounted(() => {
  // 页面挂载完成后调用接口
  axios.get('/api').then(res => {
  const { count } = res.data
  store.commit('setCount', count)
  })
})
</script>
```

## asyncData
服务端请求数据渲染到页面中

### 修改 home 组件
home.vue
```vue
<script>
import { computed, defineAsyncComponent, defineComponent, onMounted } from 'vue'
import { useStore } from 'vuex'
export default defineComponent({
  setup() {
    import axios from 'axios'
    const store = useStore()
    const count = computed(() => store.state.count)
    return {
      count
    }
  },
  asyncData({store, route}) {
    axios.get('/api').then(res => {
      const { count } = res.data
      store.commit('setCount', count)
    })
  }
})
</script>
```

### 修改服务端入口文件
entry-server.js

```javascript
// 解析完该路由关联的全部组件，异步输入钩子和异步组件。
await router.isReady()
// 获取当前路由关联的全部组件
const matchedComponents = router.currentRoute.value.matched.flatMap(record => Object.values(record.components))
// 请求当前路由关联组件的 asyncData 数据
await Promise.all(matchedComponents.forEach((Component) => {
  if (Component.asyncData) {
    return Component.asyncData({
      store,
      route
    })
  }
}))
```

### 修改客户端入口文件
entry-client.js
```javascript
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
```


### 修改 home 组件
```vue
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
```

## 编译

### cross-env
无视平台差异设置环境变量

安装
```bash
yarn add cross-env -D
```

### package.json
编辑 package.json 设置脚本

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    // cross-env NODE_ENV=development 设置 NODE_ENV 环境变量
    // 运行开发环境 SSR
    "dev:ssr": "cross-env NODE_ENV=development node server.cjs ",
    // 运行生产环境 SSR
    "prod:ssr": "node app.cjs ",
    // 编译客户端 SSR
    "build:client": "vite build --outDir dist/client --ssrManifest",
    // 编译服务端 SSR
    "build:server": "vite build --ssr src/entry-server.js --outDir dist/server",
    // 编译 SSR
    "build:ssr": "npm run build:client && npm run build:server"
  },
```

### app.cjs
生产环境服务器

```javascript
const fs = require('fs')
const path = require('path')
const express = require('express')

async function createServer() {
  const app = express()
  const serveStatic = require('serve-static')


  // 测试接口
  app.use('/api', (req, res) => {
    res.json({
      count: Math.floor(Math.random() * 100)
    })
  })

  // 开始静态资源服务 关闭 index 页面默认
  app.use(serveStatic(path.resolve(__dirname, 'dist/client'), { index: false }))
  app.use('*', async (req, res) => {
    const url = req.originalUrl
    try {
      // 1. 读取 index.html 模版
      template = fs.readFileSync(
        path.resolve(__dirname, 'dist/client/index.html'),
        'utf-8'
      )
      
      // 2. 加载服务端渲染页面方法
      const render = (await import('./dist/server/entry-server.js')).render

      // 3. 渲染 html 页面
      const { appHtml, state } = await render(url)

      // 4. 注入渲染后的应用程序 HTML 到模板中。
      const html = template.replace(`<!--ssr-outlet-->`, appHtml)
        // 将 state 数据转成 json 后插入到 html 中
        .replace('\'<!--vuex-state-->\'', JSON.stringify(state))

        // 5. 返回渲染后的 HTML。
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)

    } catch (error) {
      console.log(error);
      res.status(404).set({'Content-Type': 'text/html; charset=utf-8'}).end(`SSR 渲染错误: ${error}`)
    }
  })

  app.listen(3000)
}

createServer()
```

## 运行

```bash
# 克隆本仓库
git clone https://github.com/xhconceit/vite-vue3-vuex-router-ssr.git

# 安装依赖
yarn

# 运行 SSR 开发环境
yarn dev:ssr

# 编译 SSR
yarn build:ssr

# 运行 SSR 生产环境
yarn prod:ssr

```
