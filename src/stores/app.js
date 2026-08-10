// 全局应用状态：主题切换 / 全局弹窗
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore(
  'app',
  () => {
    const theme = ref('dark') // Ferrari 默认暗色画布
    const loginModalVisible = ref(false) // 全局登录弹窗
    const imagePreviewVisible = ref(false)
    const previewList = ref([])
    const previewIndex = ref(0)

    const isDark = (t = theme.value) => t === 'dark'

    // 将主题应用到 <html> 标签
    // 暗色为默认（:root），亮色需添加 'light' 类
    function applyTheme(t = theme.value) {
      const html = document.documentElement
      if (isDark(t)) {
        html.classList.remove('light')
      } else {
        html.classList.add('light')
      }
    }

    function setTheme(t) {
      theme.value = t
      applyTheme(t)
    }

    // 切换主题
    function toggleTheme() {
      setTheme(isDark() ? 'light' : 'dark')
    }

    function openLoginModal() {
      loginModalVisible.value = true
    }
    function closeLoginModal() {
      loginModalVisible.value = false
    }

    // 图片预览
    function openImagePreview(list, index = 0) {
      previewList.value = list
      previewIndex.value = index
      imagePreviewVisible.value = true
    }
    function closeImagePreview() {
      imagePreviewVisible.value = false
    }

    return {
      theme,
      loginModalVisible,
      imagePreviewVisible,
      previewList,
      previewIndex,
      isDark,
      setTheme,
      toggleTheme,
      applyTheme,
      openLoginModal,
      closeLoginModal,
      openImagePreview,
      closeImagePreview
    }
  },
  {
    persist: {
      key: 'lux_customer_app',
      storage: localStorage,
      // 只持久化主题，弹窗/预览等临时状态不持久化，
      // 避免刷新后 imagePreviewVisible 被恢复为 true 导致全屏大叉叉
      paths: ['theme']
    }
  }
)
