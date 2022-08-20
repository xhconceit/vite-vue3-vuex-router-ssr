import Home from '../view/home.vue'
import Mine from '../view/mine.vue'
import { createRouter, createWebHistory } from "vue-router";

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