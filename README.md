# 前言

该项目学习 vite + vue3 + vuex + router 实现 SSR 服务器渲染 

## 项目需要安装的包

1. vue3
2. vue-router

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

