// 用户状态：token / 用户信息 / 登录登出
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi, getUserInfoApi, logoutApi } from '@/api/modules/auth'
import { auth } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(auth.getToken())
  const user = ref(auth.getUser())

  const isLoggedIn = computed(() => !!token.value)
  const nickname = computed(() => user.value?.nickname || user.value?.phone || '游客')

  // 登录
  async function login(loginData) {
    const res = await loginApi(loginData)
    token.value = res.token
    user.value = res.user
    auth.setToken(res.token)
    auth.setRefreshToken(res.refreshToken)
    auth.setUser(res.user)
    // 登录成功后从后端拉取购物车
    try {
      const { useCartStore } = await import('./cart')
      const cartStore = useCartStore()
      await cartStore.initCart()
    } catch (e) {
      console.error('登录后购物车初始化失败', e)
    }
    return res
  }

  // 注册
  async function register(registerData) {
    return await registerApi(registerData)
  }

  // 拉取最新用户信息
  async function fetchUserInfo() {
    if (!token.value) return null
    const res = await getUserInfoApi()
    user.value = res
    auth.setUser(res)
    return res
  }

  // 更新本地用户信息（编辑资料后同步）
  function updateUserInfo(partial) {
    user.value = { ...user.value, ...partial }
    auth.setUser(user.value)
  }

  // 退出登录
  // 先调后端登出接口（让 access token 进黑名单、refresh token 失效），无论成败都清理本地状态，
  // 确保用户隐私：本地不留任何残留数据
  async function logout() {
    // 1. 先通知后端登出，失败不阻断本地清理
    try {
      await logoutApi(auth.getRefreshToken())
    } catch (e) {
      console.error('退出登录请求失败', e)
    }
    // 2. 清空内存中的登录态与用户信息
    token.value = ''
    user.value = null
    // 3. 清空购物车内存数据（必须在 clearAll 之前重置，避免 persist 插件回写脏数据）
    try {
      const { useCartStore } = await import('./cart')
      const cartStore = useCartStore()
      cartStore.items = []
    } catch (e) {
      console.error('清理购物车失败', e)
    }
    // 4. 清理 localStorage 中所有用户相关缓存
    auth.clearAll()
  }

  return {
    token,
    user,
    isLoggedIn,
    nickname,
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    logout
  }
})
