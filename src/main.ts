import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { Button, Toast, Dialog, Field, Icon, Popup, Tabs, Tab, Checkbox, Form, Calendar as VanCalendar } from 'vant'
import 'vant/lib/index.css'
import './styles/index.scss'

// 导入页面组件
import MealRecord from './views/MealRecord.vue'
import Calendar from './views/Calendar.vue'
import Me from './views/Me.vue'
import Settings from './views/Settings.vue'
import Auth from './views/Auth.vue'

// 路由配置
const routes = [
  { path: '/', component: MealRecord },
  { path: '/calendar', component: Calendar },
  { path: '/me', component: Me },
  { path: '/settings', component: Settings },
  { path: '/auth', component: Auth }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 简单路由守卫：未登录跳转到登录/注册
router.beforeEach((to, _from, next) => {
  const publicPaths = ['/auth']
  const token = localStorage.getItem('token')
  if (!publicPaths.includes(to.path) && !token) {
    next('/auth')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.use(Button)
app.use(Toast)
app.use(Dialog)
app.use(Field)
app.use(Icon)
app.use(Popup)
app.use(Tabs)
app.use(Tab)
app.use(Checkbox)
app.use(Form)
app.use(VanCalendar)
app.mount('#app')
