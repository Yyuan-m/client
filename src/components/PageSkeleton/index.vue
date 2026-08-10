<template>
  <div class="page-skeleton">
    <!-- 车辆列表骨架 -->
    <div v-if="type === 'grid'" class="skeleton-grid">
      <div v-for="n in count" :key="n" class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-line w-80"></div>
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton skeleton-line w-40"></div>
      </div>
    </div>

    <!-- 详情骨架 -->
    <div v-else-if="type === 'detail'" class="skeleton-detail">
      <div class="skeleton skeleton-img-lg"></div>
      <div class="skeleton skeleton-line w-100"></div>
      <div class="skeleton skeleton-line w-60"></div>
      <div class="skeleton skeleton-line w-80"></div>
    </div>

    <!-- 通用行骨架 -->
    <div v-else class="skeleton-list">
      <div v-for="n in count" :key="n" class="skeleton-row">
        <div class="skeleton skeleton-circle"></div>
        <div class="skeleton-lines">
          <div class="skeleton skeleton-line w-100"></div>
          <div class="skeleton skeleton-line w-60"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'list' }, // grid / detail / list
  count: { type: Number, default: 6 }
})
</script>

<style lang="scss" scoped>
// Ferrari: 锐角骨架块（shimmer 已由全局 .skeleton 提供，使用 --lux-bg-gray / --lux-bg-gray-dark）
.skeleton {
  border-radius: $radius-none;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-md;
  @include respond-to('md') { grid-template-columns: repeat(2, 1fr); }
}

.skeleton-card {
  .skeleton-img { width: 100%; height: 180px; }
  .skeleton-line { height: 16px; margin-top: $space-sm; }
}

.skeleton-img-lg { width: 100%; height: 400px; }
.skeleton-detail .skeleton-line { height: 20px; margin-top: $space-base; }

.skeleton-list .skeleton-row {
  display: flex;
  gap: $space-base;
  padding: $space-base 0;
  // 头像占位保留 $radius-full（Ferrari: 徽章/头像专属）
  .skeleton-circle { width: 48px; height: 48px; border-radius: $radius-full; flex-shrink: 0; }
  .skeleton-lines { flex: 1; }
  .skeleton-line { height: 14px; margin-top: $space-sm; }
}

.w-40 { width: 40%; }
.w-60 { width: 60%; }
.w-80 { width: 80%; }
.w-100 { width: 100%; }
</style>
