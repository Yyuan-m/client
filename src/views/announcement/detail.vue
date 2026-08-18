<template>
  <div class="announcement-detail-page section">
    <div class="container">
      <!-- 返回 -->
      <button class="back-btn" @click="$router.push('/announcements')">
        <el-icon><ArrowLeft /></el-icon> 返回公告列表
      </button>

      <PageSkeleton v-if="loading" :count="1" />

      <template v-else-if="detail">
        <article class="detail-card fade-in-up">
          <div class="detail-meta">
            <span class="priority-tag" :class="detail.priority">{{ priorityLabel(detail.priority) }}</span>
            <span class="detail-date">{{ detail.createdAt }}</span>
          </div>
          <h1 class="detail-title">{{ detail.title }}</h1>
          <div class="detail-content">{{ detail.content }}</div>
        </article>
      </template>

      <EmptyTips v-else text="公告不存在或已下架" show-action action-text="返回列表" @action="$router.push('/announcements')" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import PageSkeleton from '@/components/PageSkeleton/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { getAnnouncementDetailApi } from '@/api/modules/announcement'

const route = useRoute()
const { observe } = useScrollReveal()
const loading = ref(false)
const detail = ref(null)

const PRIORITY_MAP = {
  high: '高优先级',
  normal: '常规',
  low: '低优先级'
}
function priorityLabel(priority) {
  return PRIORITY_MAP[priority] || '常规'
}

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await getAnnouncementDetailApi(route.params.id)
  } catch (e) {
    console.error('公告详情加载失败', e)
    detail.value = null
  } finally {
    loading.value = false
    nextTick(() => observe())
  }
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.announcement-detail-page {
  padding-top: $space-2xl;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-xxxs;
  background: none;
  border: none;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  cursor: pointer;
  padding: 0;
  margin-bottom: $space-md;
  transition: color $transition-fast;
  &:hover { color: var(--lux-primary-text); }
}

.detail-card {
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-lg $space-md;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: $space-xs;
  margin-bottom: $space-sm;
}

.priority-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: $radius-full;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: var(--lux-bg-gray-dark);
  color: $color-text-secondary;
  &.high {
    background: rgba(218, 41, 28, 0.15);
    color: $color-primary;
  }
  &.low {
    color: $color-text-tertiary;
  }
}

.detail-date {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.detail-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-medium;
  letter-spacing: -0.3px;
  margin-bottom: $space-md;
  line-height: $line-height-tight;
}

.detail-content {
  font-size: $font-size-base;
  color: $color-text;
  line-height: $line-height-loose;
  white-space: pre-wrap;
}

@include respond-to('md') {
  .detail-title { font-size: $font-size-lg; }
  .detail-card { padding: $space-md $space-base; }
}
</style>
