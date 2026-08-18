// ============================================================
// Axios 统一请求封装
// 特性：自动携带 token / 401 无感刷新 / 重复请求防抖 / 统一错误提示
// ============================================================

import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auth } from './auth'
import router from '@/router'

// 创建实例
const service = axios.create({
  baseURL: '',  // 前端 baseURL 为空，避免 /api 重复前缀
  timeout: 15000
})

// ---------- 请求拦截 ----------
const pendingMap = new Map() // 去重：key = method+url

function getPendingKey(config) {
  const { method, url, params } = config
  return [method, url, JSON.stringify(params || {})].join('&')
}

service.interceptors.request.use(
  (config) => {
    // 自动携带 token
    const token = auth.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // GET 请求去重（相同请求未完成时不重复发起）
    if (config.method === 'get' && !config.noDedup) {
      const key = getPendingKey(config)
      if (pendingMap.has(key)) {
        return Promise.reject({ __canceled: true })
      }
      pendingMap.set(key, true)
      config.__pendingKey = key
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ---------- Token 无感刷新 ----------
// isRefreshing: 是否正在刷新 access token
// pendingQueue: 刷新期间被挂起等待重试的请求
let isRefreshing = false
let pendingQueue = []
// isRedirecting: refresh 失败后是否正在倒计时跳转登录页（避免重复弹窗）
let isRedirecting = false

/**
 * 用 refresh token 换取新的 access + refresh token
 * 成功返回 { token, refreshToken }，失败抛异常
 * 直接用 service 实例发请求（内联，避免与 api/modules/auth 产生循环依赖）
 * skipBusinessError: 刷新失败时由本模块自行处理，不走全局错误提示
 */
async function doRefreshToken() {
  const refreshToken = auth.getRefreshToken()
  if (!refreshToken) {
    throw new Error('无 refresh token')
  }
  // 响应拦截器对 code=200 的响应会解包返回 res.data，即 { token, refreshToken }
  const res = await service.post(
    '/api/auth/refresh-token',
    { refreshToken },
    { skipBusinessError: true }
  )
  auth.setToken(res.token)
  auth.setRefreshToken(res.refreshToken)
  return res
}

/**
 * 重试所有被挂起的请求
 */
function retryPendingQueue(newToken) {
  pendingQueue.forEach((cb) => cb(newToken))
  pendingQueue = []
}

/**
 * 拒绝所有被挂起的请求（刷新失败时调用）
 */
function rejectPendingQueue(error) {
  pendingQueue.forEach((cb) => cb(null, error))
  pendingQueue = []
}

/**
 * 倒计时 3 秒后跳转登录页
 * 期间用户也可点击「立即跳转」按钮
 * @param {Object} options
 * @param {string} [options.title='登录过期'] 弹窗标题
 * @param {string} [options.messagePrefix='登录状态已失效'] 倒计时文案前缀，最终展示为 `${messagePrefix}，${seconds} 秒后自动跳转登录页…`
 */
function showCountdownRedirect(options = {}) {
  if (isRedirecting) return
  isRedirecting = true

  const {
    title = '登录过期',
    messagePrefix = '登录状态已失效'
  } = options

  let seconds = 3
  const updateText = () => `${messagePrefix}，${seconds} 秒后自动跳转登录页…`

  const timer = setInterval(() => {
    seconds--
    if (seconds <= 0) {
      clearInterval(timer)
      ElMessageBox.close()
      doRedirectToLogin()
    } else {
      const msgEl = document.querySelector('.el-message-box__message')
      if (msgEl) msgEl.innerHTML = updateText()
    }
  }, 1000)

  ElMessageBox.alert(updateText(), title, {
    confirmButtonText: '立即跳转',
    showCancelButton: false,
    showClose: false,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    closeOnHashChange: false,
    type: 'warning'
  })
    .then(() => {
      // 用户主动点击「立即跳转」
      if (seconds > 0) {
        clearInterval(timer)
        doRedirectToLogin()
      }
    })
    .catch(() => {
      // ElMessageBox.close() 触发，无需处理
    })
}

function doRedirectToLogin() {
  if (!isRedirecting) return
  auth.clearAll()
  const currentPath = router.currentRoute.value.fullPath
  // 已在登录页则不再跳转
  if (router.currentRoute.value.path === '/login') {
    isRedirecting = false
    return
  }
  // 使用 window.location 强制刷新页面：
  // auth.clearAll() 只清了 localStorage，Pinia store 里的 token ref 仍持有旧值，
  // 若用 router.push 跳转，路由守卫会因 isLoggedIn=true 而把用户从登录页弹回首页。
  // 整页刷新可确保所有内存状态被重置。
  const redirect = encodeURIComponent(currentPath)
  window.location.href = `/login?redirect=${redirect}`
}

// ---------- 响应拦截 ----------
service.interceptors.response.use(
  (response) => {
    // 清理去重标记
    const key = response.config.__pendingKey
    if (key) pendingMap.delete(key)

    // 文件下载直接返回
    if (response.config.responseType === 'blob') {
      return response
    }

    const res = response.data

    // 后端统一返回 { code, msg, data }
    // 成功码 0 或 200
    if (res.code === 200 || res.code === 0) {
      return res.data !== undefined ? res.data : res
    }

    // 业务错误：skipBusinessError 时不弹全局提示，由调用方处理
    if (!response.config.skipBusinessError) {
      ElMessage.error(res.msg || '请求失败')
    }
    return Promise.reject({ code: res.code, msg: res.msg, response })
  },
  async (error) => {
    // 取消的请求静默处理
    if (error.__canceled) {
      return Promise.reject(error)
    }

    const originalConfig = error.config

    // 清理去重标记
    const key = originalConfig && originalConfig.__pendingKey
    if (key) pendingMap.delete(key)

    // 401 未授权：access token 过期 → 尝试无感刷新
    // 排除：刷新接口自身、登出接口（避免与刷新/登出流程竞争）
    const isRefreshReq = originalConfig && /\/api\/auth\/refresh-token/.test(originalConfig.url || '')
    const isLogoutReq = originalConfig && /\/api\/auth\/logout/.test(originalConfig.url || '')

    if (error.response && error.response.status === 401 && !isRefreshReq && !isLogoutReq) {
      // 正在倒计时跳转登录页时，直接拒绝新请求
      if (isRedirecting) {
        return Promise.reject(error)
      }

      // 已有刷新在进行中：挂起当前请求，等刷新完成后用新 token 重试
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((newToken, err) => {
            if (err) {
              reject(err)
              return
            }
            originalConfig.headers.Authorization = `Bearer ${newToken}`
            resolve(service(originalConfig))
          })
        })
      }

      // 发起刷新
      isRefreshing = true
      try {
        const { token: newToken } = await doRefreshToken()
        // 刷新成功：重试被挂起的请求
        retryPendingQueue(newToken)
        // 重试原始请求
        originalConfig.headers.Authorization = `Bearer ${newToken}`
        return service(originalConfig)
      } catch (refreshErr) {
        // 刷新失败：拒绝被挂起的请求，倒计时跳转登录页
        rejectPendingQueue(refreshErr)
        showCountdownRedirect()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // logout 请求的 401 静默处理（避免与 logout 流程的 router.push 竞争）
    if (error.response && error.response.status === 401 && isLogoutReq) {
      return Promise.reject(error)
    }

    // 403 无权限：提示用户并 3 秒后跳转登录页重新登录
    if (error.response && error.response.status === 403) {
      if (!originalConfig?.skipBusinessError && !isRedirecting) {
        showCountdownRedirect({
          title: '暂无权限访问',
          messagePrefix: '暂无权限访问，请重新登录'
        })
      }
      return Promise.reject(error)
    }

    // 网络错误 / 超时
    if (!error.response) {
      ElMessage.error(error.message.includes('timeout') ? '请求超时，请重试' : '网络异常，请检查网络连接')
      return Promise.reject(error)
    }

    // 其他 HTTP 错误
    const status = error.response.status
    const msg = error.response.data?.msg || `请求错误（${status}）`
    console.error(msg)
    return Promise.reject(error)
  }
)

// ---------- 便捷方法 ----------
export const get = (url, params, config = {}) => service.get(url, { params, ...config })
export const post = (url, data, config = {}) => service.post(url, data, config)
export const put = (url, data, config = {}) => service.put(url, data, config)
export const del = (url, config = {}) => service.delete(url, config)

// 文件上传
export const upload = (url, file, config = {}) => {
  const formData = new FormData()
  if (Array.isArray(file)) {
    file.forEach((f) => formData.append('files', f))
  } else {
    formData.append('file', file)
  }
  return service.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config
  })
}

// 文件下载
export const download = (url, params, fileName = 'download') => {
  return service.get(url, { params, responseType: 'blob' }).then((res) => {
    const blob = new Blob([res.data])
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

export default service
