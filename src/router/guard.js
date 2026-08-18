// 全局路由守卫：登录鉴权 / 标题设置 / 访客路由重定向
import { useUserStore } from '@/stores/user'

export function setupRouterGuard(router) {
  router.beforeEach((to, from, next) => {
    // 设置页面标题
    document.title = to.meta.title ? `${to.meta.title} · LUXURY CAR` : 'LUXURY CAR · 大圣玩车'

    const userStore = useUserStore()

    // 需要登录但未登录 → 跳登录页，记录来源
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    // 已登录访问登录/注册页 → 重定向首页
    if (to.meta.guest && userStore.isLoggedIn) {
      next({ path: '/' })
      return
    }

    next()
  })
}
