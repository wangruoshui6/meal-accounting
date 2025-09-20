import { createApp } from 'vue'
import App from './App.vue'
import { Button, Toast } from 'vant'
import 'vant/lib/index.css'
import './styles/index.scss'

const app = createApp(App)
app.use(Button)
app.use(Toast)
app.mount('#app')
