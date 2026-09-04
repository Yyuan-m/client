<template>
  <div class="complaint-detail-page section">
    <div class="container">
      <PageSkeleton v-if="loading" :count="3" />
      <template v-else-if="detail">
        <div class="detail-head">
          <h2 class="section-title">投诉详情</h2>
          <span class="status-tag" :class="detail.status">{{ detail.statusName }}</span>
        </div>

        <!-- 基本信息 -->
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">工单号</span>
            <span class="info-value">{{ detail.ticketNo }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">投诉类型</span>
            <span class="info-value">
              <el-tag size="small" class="type-tag">{{ detail.typeName }}</el-tag>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">关联订单</span>
            <span class="info-value">{{ detail.orderNo || '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">提交时间</span>
            <span class="info-value">{{ formatTime(detail.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">处理人员</span>
            <span class="info-value">{{ detail.assignee || '—' }}</span>
          </div>
        </div>

        <!-- 投诉描述 -->
        <div class="block-card">
          <h3 class="block-title">投诉描述</h3>
          <p class="block-desc">{{ detail.description }}</p>

          <div v-if="detail.images && detail.images.length" class="evidence-list">
            <el-image
              v-for="(img, i) in detail.images"
              :key="i"
              :src="resolveClientImage(img)"
              :preview-src-list="detail.images.map(resolveClientImage)"
              :initial-index="i"
              fit="cover"
              class="evidence-img"
              preview-teleported
            />
          </div>
        </div>

        <!-- 处理结果 -->
        <div v-if="detail.solution" class="block-card solution-card">
          <h3 class="block-title">
            <el-icon class="sol-icon"><CircleCheck /></el-icon>
            处理结果
          </h3>
          <p class="block-desc">{{ detail.solution }}</p>
        </div>

        <!-- 满意度评分 -->
        <div v-if="detail.status === 'resolved'" class="block-card rate-card">
          <template v-if="(detail.satisfaction || 0) > 0">
            <h3 class="block-title">您的评分</h3>
            <div class="rate-row">
              <el-rate :model-value="detail.satisfaction" disabled />
              <span class="rate-value">{{ detail.satisfaction }} 星</span>
            </div>
          </template>
          <template v-else>
            <h3 class="block-title">本次处理您满意吗？</h3>
            <div class="rate-row">
              <el-rate v-model="rating" />
              <el-button
                type="primary"
                :loading="ratingSubmitting"
                @click="submitRating"
              >提交评分</el-button>
            </div>
          </template>
        </div>

        <!-- 操作 -->
        <div class="actions">
          <el-button @click="$router.back()">返回</el-button>
          <el-button type="primary" @click="$router.push('/complaint/list')">查看全部投诉</el-button>
        </div>
      </template>
      <EmptyTips v-else text="投诉不存在或已被删除" show-action action-text="返回我的投诉" @action="$router.push('/complaint/list')" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import PageSkeleton from '@/components/PageSkeleton/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import { getComplaintDetailApi, rateComplaintApi } from '@/api/modules/complaint'
import { resolveClientImage } from '@/utils/image'
import { dateUtil } from '@/utils'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref(null)
const rating = ref(0)
const ratingSubmitting = ref(false)

function formatTime(t) {
  if (!t) return '—'
  return dateUtil.format(t, 'YYYY-MM-DD HH:mm')
}

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await getComplaintDetailApi(route.params.id)
    if (detail.value && detail.value.satisfaction > 0) {
      rating.value = detail.value.satisfaction
    }
  } catch (e) {
    console.error('投诉详情加载失败', e)
    detail.value = null
  } finally {
    loading.value = false
  }
}

async function submitRating() {
  if (!rating.value) {
    ElMessage.warning('请先选择评分')
    return
  }
  ratingSubmitting.value = true
  try {
    await rateComplaintApi(detail.value.id, { satisfaction: rating.value })
    ElMessage.success('评分提交成功，感谢您的反馈')
    await loadDetail()
  } catch (e) {
    // 错误提示已由 request.js 统一弹出
    console.error('评分提交失败', e)
  } finally {
    ratingSubmitting.value = false
  }
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.complaint-detail-page {
  .detail-head {
    display: flex;
    align-items: center;
    gap: $space-base;
    margin-bottom: $space-md;

    .status-tag {
      font-size: $font-size-sm;
      padding: 4px 14px;
      border-radius: 999px;
      font-weight: $font-weight-medium;
      &.pending { color: #f59e0b; background: rgba(245, 158, 11, 0.14); }
      &.processing { color: #3b82f6; background: rgba(59, 130, 246, 0.14); }
      &.resolved { color: #10b981; background: rgba(16, 185, 129, 0.14); }
      &.rejected { color: #ef4444; background: rgba(239, 68, 68, 0.14); }
    }
  }

  .info-card,
  .block-card {
    background: $color-bg-gray;
    border: 1px solid $color-divider;
    border-radius: $radius-lg;
    padding: $space-md $space-lg;
    margin-bottom: $space-md;
  }

  .info-row {
    display: flex;
    padding: $space-xs 0;
    border-bottom: 1px solid $color-divider;

    &:last-child { border-bottom: none; }

    .info-label {
      width: 100px;
      flex-shrink: 0;
      color: $color-text-tertiary;
      font-size: $font-size-sm;
    }
    .info-value {
      color: $color-text;
      font-size: $font-size-sm;
    }
  }

  .block-title {
    display: flex;
    align-items: center;
    gap: $space-xxs;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    margin-bottom: $space-sm;
    color: $color-text;
  }

  .block-desc {
    font-size: $font-size-sm;
    color: $color-text;
    line-height: 1.8;
    word-break: break-all;
  }

  .evidence-list {
    display: flex;
    flex-wrap: wrap;
    gap: $space-xs;
    margin-top: $space-md;

    .evidence-img {
      width: 80px;
      height: 80px;
      border-radius: $radius-sm;
      cursor: pointer;
    }
  }

  .solution-card {
    .sol-icon { color: #10b981; }
  }

  .rate-card {
    .rate-row {
      display: flex;
      align-items: center;
      gap: $space-md;
      flex-wrap: wrap;

      :deep(.el-rate__icon) { font-size: 22px; }
    }
    .rate-value {
      color: var(--lux-primary-text);
      font-weight: $font-weight-medium;
    }
  }

  .actions {
    display: flex;
    gap: $space-sm;
    margin-top: $space-lg;
    justify-content: center;
  }
}
</style>
