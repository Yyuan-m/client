import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import { setupRouterGuard } from './router/guard'
import App from './App.vue'

// ElMessage / ElMessageBox 是服务式组件（通过 JS 调用，不在模板中出现），
// ElementPlusResolver 不会为它们自动注入样式，需手动导入
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

// Element Plus 暗色模式 CSS 变量
import 'element-plus/theme-chalk/dark/css-vars.css'

// 全局样式
import './styles/global.scss'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPersist)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus, { size: 'default' })

// 注册路由守卫（需在 pinia、router 安装后调用）
setupRouterGuard(router)

app.mount('#app')

// 移除首屏加载占位
const loading = document.getElementById('app-loading')
if (loading) {
  loading.classList.add('hide')
  setTimeout(() => loading.remove(), 500)
}
