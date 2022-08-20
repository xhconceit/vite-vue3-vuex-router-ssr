import Home from '../view/home.vue'
import Mine from '../view/mine.vue'
import { createMemoryHistory, createRouter, createWebHistory } from "vue-router";

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

export function createSSRRouter() {
  return createRouter({
    routes,
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory()
  })
}