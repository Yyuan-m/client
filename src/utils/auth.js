// ============================================================
// 鉴权工具 - token / refresh token / 用户信息 / 清理缓存
// ============================================================

const TOKEN_KEY = 'lux_customer_token'
const REFRESH_TOKEN_KEY = 'lux_customer_refresh_token'
const USER_KEY = 'lux_customer_user'

export const auth = {
  // ---------- Access Token ----------
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || ''
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },

  // ---------- Refresh Token ----------
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
  },
  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },
  removeRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  // ---------- 用户信息 ----------
  getUser() {
    const raw = localStorage.getItem(USER_KEY)
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  removeUser() {
    localStorage.removeItem(USER_KEY)
  },

  // ---------- 登录状态 ----------
  isLoggedIn() {
    return !!this.getToken()
  },

  // ---------- 清理全部登录缓存 ----------
  // token、refresh token、用户信息、购物车、收藏，避免脏数据残留
  clearAll() {
    this.removeToken()
    this.removeRefreshToken()
    this.removeUser()
    localStorage.removeItem('lux_customer_cart')
    localStorage.removeItem('lux_customer_favorites')
  }
}

// 路由白名单（无需登录可访问）
export const WHITE_LIST = ['/', '/vehicles', '/about', '/contact', '/login', '/register', '/forgot-password']

export const isWhitePath = (path) => {
  return WHITE_LIST.some((p) => path === p || (p !== '/' && path.startsWith(p)))
}
