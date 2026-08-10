<template>
  <div class="default-layout">
    <AppHeader />
    <main class="layout-main">
      <router-view />
    </main>
    <AppFooter />
    <BackTop />
    <ImagePreview />
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader/index.vue'
import AppFooter from '@/components/AppFooter/index.vue'
import BackTop from '@/components/BackTop/index.vue'
import ImagePreview from '@/components/ImagePreview/index.vue'
</script>

<style lang="scss" scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-main {
  flex: 1;
  // 顶部固定导航（64px）的占位不在此处用 padding-top 实现，
  // 而是由各页面自身处理：首页轮播图用 margin-top:-64px 覆盖 header 区域，
  // 其他页面根元素带 .section 类，其 padding-top 提供顶部间距。
}
</style>
