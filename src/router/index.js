// 路由配置
import { createRouter, createWebHistory } from 'vue-router'

// 布局
const DefaultLayout = () => import('@/layout/DefaultLayout.vue')

// 路由表
const routes = [
  // ---------- 访客可访问页面（套用默认布局）----------
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'Home', component: () => import('@/views/home/index.vue'), meta: { title: '首页' } },
      { path: 'vehicles', name: 'VehicleList', component: () => import('@/views/vehicle/list.vue'), meta: { title: '车辆列表' } },
      { path: 'vehicles/:id', name: 'VehicleDetail', component: () => import('@/views/vehicle/detail.vue'), meta: { title: '车辆详情' } },
      { path: 'about', name: 'About', component: () => import('@/views/about/index.vue'), meta: { title: '关于我们' } },
      { path: 'contact', name: 'Contact', component: () => import('@/views/contact/index.vue'), meta: { title: '联系客服' } },
      { path: 'cart', name: 'Cart', component: () => import('@/views/cart/index.vue'), meta: { title: '租车购物车' } }
    ]
  },

  // ---------- 独立页面（不套布局：登录/注册/忘记密码）----------
  { path: '/login', name: 'Login', component: () => import('@/views/auth/login.vue'), meta: { title: '登录', guest: true } },
  { path: '/register', name: 'Register', component: () => import('@/views/auth/register.vue'), meta: { title: '注册', guest: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('@/views/auth/forgot-password.vue'), meta: { title: '忘记密码', guest: true } },

  // ---------- 需登录页面（套用默认布局）----------
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'checkout', name: 'Checkout', component: () => import('@/views/order/checkout.vue'), meta: { title: '确认下单', requiresAuth: true } },
      { path: 'profile', name: 'Profile', component: () => import('@/views/profile/index.vue'), meta: { title: '个人中心', requiresAuth: true } },
      { path: 'orders', name: 'OrderList', component: () => import('@/views/order/list.vue'), meta: { title: '我的订单', requiresAuth: true } },
      { path: 'orders/:id', name: 'OrderDetail', component: () => import('@/views/order/detail.vue'), meta: { title: '订单详情', requiresAuth: true } }
    ]
  },

  // ---------- 404 ----------
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: ':pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/error/404.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 优先恢复浏览器记忆的位置（后退/前进）
    if (savedPosition) return savedPosition
    // 支持 hash 锚点跳转（如 /#coupons 滚动到领券中心）
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 80 }
    }
    return { top: 0, behavior: 'smooth' }
  }
})

export default router
