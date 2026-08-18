<template>
  <div class="announcement-page section">
    <div class="container">
      <!-- 头部 -->
      <div class="page-header fade-in-up">
        <div class="header-text">
          <h1 class="page-title">公告</h1>
          <p class="page-subtitle">了解最新动态与重要通知</p>
        </div>
        <button class="btn-outline filter-btn" @click="toggleOnlyHigh">
          {{ onlyHigh ? '查看全部' : '只看高优先级公告' }}
        </button>
      </div>

      <!-- 列表 -->
      <PageSkeleton v-if="loading" :count="4" />
      <template v-else>
        <div v-if="list.length" class="announcement-list">
          <div
            v-for="item in list"
            :key="item.id"
            class="announcement-card fade-in-up"
            @click="goDetail(item.id)"
          >
            <div class="card-top">
              <span class="priority-tag" :class="item.priority">{{ priorityLabel(item.priority) }}</span>
              <span class="card-date">{{ item.createdAt }}</span>
            </div>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-content">{{ item.content }}</p>
            <span class="card-more">查看详情 →</span>
          </div>
        </div>
        <EmptyTips v-else text="暂无公告" />
        <div v-if="total > pageSize" class="pagination-wrap">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="loadList"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import PageSkeleton from '@/components/PageSkeleton/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { getAnnouncementPageApi } from '@/api/modules/announcement'

const router = useRouter()
const { observe } = useScrollReveal()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const onlyHigh = ref(false)

const PRIORITY_MAP = {
  high: '高优先级',
  normal: '常规',
  low: '低优先级'
}
function priorityLabel(priority) {
  return PRIORITY_MAP[priority] || '常规'
}

async function loadList() {
  loading.value = true
  try {
    const res = await getAnnouncementPageApi(
      { page: page.value, pageSize, onlyHigh: onlyHigh.value },
      { noDedup: true }
    )
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) {
    console.error('公告列表加载失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
    nextTick(() => observe())
  }
}

function toggleOnlyHigh() {
  onlyHigh.value = !onlyHigh.value
  page.value = 1
  loadList()
}

function goDetail(id) {
  router.push(`/announcements/${id}`)
}

onMounted(loadList)
</script>

<style lang="scss" scoped>
.announcement-page {
  padding-top: $space-2xl;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: $space-lg;
  gap: $space-md;
}

.page-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-medium;
  letter-spacing: -0.36px;
  margin-bottom: $space-xxs;
}

.page-subtitle {
  font-size: $font-size-md;
  color: $color-text-secondary;
}

.filter-btn {
  height: 40px;
  padding: 0 20px;
  flex-shrink: 0;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: $space-base;
}

.announcement-card {
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-md;
  cursor: pointer;
  transition: transform $transition-base, border-color $transition-base;
  &:hover {
    transform: translateY(-2px);
    border-color: var(--lux-primary-text);
  }
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-xs;
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

.card-date {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.card-title {
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  margin-bottom: $space-xxs;
}

.card-content {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: $line-height-base;
  @include ellipsis-multi(2);
  margin-bottom: $space-xs;
}

.card-more {
  font-size: $font-size-sm;
  color: var(--lux-primary-text);
  font-weight: $font-weight-medium;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: $space-xl;
}

@include respond-to('md') {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-sm;
  }
  .page-title { font-size: $font-size-xl; }
}
</style>
