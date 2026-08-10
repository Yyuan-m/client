// 滚动渐显 Hook - 苹果同款轻量化滚动交互
// 用法：在组件中调用 useScrollReveal()，给需要渐显的元素加 class="fade-in-up"
// 数据刷新后可调用返回的 observe() 重新观察新增的 fade-in-up 元素
import { onMounted, onUnmounted } from 'vue'

export function useScrollReveal() {
  let observer = null

  const observe = () => {
    // 先断开旧 observer，避免重复 observe 导致内存泄漏 / 回调重复触发
    if (observer) {
      observer.disconnect()
      observer = null
    }
    const elements = document.querySelectorAll('.fade-in-up:not(.visible)')
    if (!elements.length) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 延迟渐显，制造层次感
            const delay = entry.target.dataset.delay || 0
            setTimeout(() => entry.target.classList.add('visible'), delay)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    elements.forEach((el) => observer.observe(el))
  }

  onMounted(() => {
    // 等待 DOM 渲染完成
    setTimeout(observe, 100)
  })

  onUnmounted(() => {
    if (observer) observer.disconnect()
  })

  return { observe }
}
