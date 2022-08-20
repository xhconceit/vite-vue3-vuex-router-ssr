import { createSSRApp } from 'vue'
import { createSSRRouter } from './router/index'
import { createSSRStore } from './store/index'
import './style.css'
import App from './App.vue'

export function createApp(params) {
  const app = createSSRApp(App)
  const router = createSSRRouter()
  const store = createSSRStore()

  app.use(router)
  app.use(store)

  return { app, router, store }
}
