// 系统配置共享 composable：模块级缓存 + Promise 复用，避免多组件并发请求被去重机制取消
import { ref } from 'vue'
import { getSystemConfigApi } from '@/api/modules/system'

const config = ref(null)
let loaded = false
let pendingPromise = null

export function useSystemConfig() {
  async function loadConfig() {
    // 已加载完成，直接返回缓存
    if (loaded) return config.value
    // 正在请求中，复用同一个 Promise（避免触发 request.js 的 GET 去重导致请求被取消）
    if (pendingPromise) return pendingPromise
    pendingPromise = getSystemConfigApi()
      .then((res) => {
        config.value = res
        loaded = true
        return config.value
      })
      .catch((e) => {
        // 被去重机制取消的请求静默处理，不算错误
        if (!e?.__canceled) {
          console.error('系统配置加载失败', e)
        }
        return config.value
      })
      .finally(() => {
        pendingPromise = null
      })
    return pendingPromise
  }
  return { config, loadConfig }
}
