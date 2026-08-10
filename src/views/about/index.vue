<template>
  <div class="about-page">
    <!-- 品牌介绍 -->
    <section class="section about-hero fade-in-up">
      <div class="container">
        <h1 class="about-title">关于 LUXURY CAR</h1>
        <p class="about-subtitle">专注高端出行，定义豪华租车新标准</p>
        <p class="about-desc">
          LUXURY CAR 成立于 2015 年，是国内领先的高端汽车租赁服务商。
          我们汇聚奔驰、宝马、保时捷、路虎等全球顶级品牌车型，
          以严格的车况准入、全保险保障、专属管家服务，
          为个人与企业客户提供尊贵的出行体验。
        </p>
      </div>
    </section>

    <!-- 企业优势 -->
    <section class="section fade-in-up">
      <div class="container">
        <h2 class="section-title">企业优势</h2>
        <div class="adv-grid">
          <div v-for="item in advantages" :key="item.id" class="adv-item">
            <el-icon class="adv-icon" :size="32"><component :is="item.icon" /></el-icon>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 门店分布 -->
    <section class="section stores-section fade-in-up">
      <div class="container">
        <h2 class="section-title">线下门店</h2>
        <p class="section-subtitle">全国核心城市，就近服务</p>
        <div class="stores-grid">
          <div v-for="store in stores" :key="store.id" class="store-card">
            <el-icon class="store-icon" :size="28"><Location /></el-icon>
            <h3 class="store-name">{{ store.name }}</h3>
            <p class="store-address">{{ store.address }}</p>
            <p class="store-phone"><el-icon><Phone /></el-icon>{{ store.phone }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { getStoresApi, getAdvantagesApi } from '@/api/modules/system'

useScrollReveal()

const stores = ref([])
const advantages = ref([])

onMounted(async () => {
  try {
    const [storesRes, advRes] = await Promise.all([
      getStoresApi(),
      getAdvantagesApi()
    ])
    stores.value = storesRes || []
    advantages.value = advRes || []
  } catch (e) {
    console.error('数据加载失败', e)
  }
})
</script>

<style lang="scss" scoped>
.about-hero {
  text-align: center;
  padding-top: $space-2xl;
}
.about-title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-medium;
  margin-bottom: $space-sm;
}
.about-subtitle {
  font-size: $font-size-lg;
  color: $color-text-secondary;
  margin-bottom: $space-lg;
}
.about-desc {
  max-width: 720px;
  margin: 0 auto;
  font-size: $font-size-base;
  color: $color-text-secondary;
  line-height: $line-height-loose;
}

.adv-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-md;
  @include respond-to('md') { grid-template-columns: repeat(2, 1fr); }
}
.adv-item {
  text-align: center;
  padding: $space-lg;
  background: $color-bg-gray;
  border: 1px solid $color-divider;
  border-radius: $radius-none;
  .adv-icon { color: var(--lux-primary-text); margin-bottom: $space-sm; }
  h3 { font-size: $font-size-md; font-weight: $font-weight-medium; margin-bottom: $space-xs; }
  p { font-size: $font-size-sm; color: $color-text-secondary; }
}

.stores-section { background: $color-bg-gray; }
.stores-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-md;
  @include respond-to('md') { grid-template-columns: repeat(2, 1fr); }
}
.store-card {
  background: $color-bg;
  border: 1px solid $color-divider;
  border-radius: $radius-none;
  padding: $space-lg;
  text-align: center;
  .store-icon { color: var(--lux-primary-text); margin-bottom: $space-sm; }
  .store-name { font-size: $font-size-base; font-weight: $font-weight-medium; margin-bottom: $space-xs; }
  .store-address { font-size: $font-size-sm; color: $color-text-secondary; margin-bottom: $space-xs; }
  .store-phone { font-size: $font-size-sm; color: var(--lux-primary-text); display: flex; align-items: center; justify-content: center; gap: 4px; }
}
</style>
