<template>
  <div class="complaint-list-page section">
    <div class="container">
      <h2 class="section-title">我的投诉</h2>

      <!-- 去投诉入口 -->
      <div class="complaint-entry" @click="$router.push('/complaint')">
        <div class="entry-icon"><el-icon :size="22"><Service /></el-icon></div>
        <div class="entry-main">
          <span class="entry-title">遇到用车问题？</span>
          <span class="entry-desc">车况、服务、费用、押金、违章等，均可提交投诉，我们将在 1-3 个工作日内处理</span>
        </div>
        <el-button type="primary" size="small" class="entry-btn">去投诉</el-button>
      </div>

      <PageSkeleton v-if="loading" :count="3" />
      <template v-else>
        <div v-if="list.length" class="complaint-list">
          <div v-for="item in list" :key="item.id" class="complaint-card" @click="goDetail(item)">
            <!-- 头部：工单号 + 状态 -->
            <div class="card-header">
              <span class="ticket-no">工单号：{{ item.ticketNo }}</span>
              <span class="status-tag" :class="item.status">{{ item.statusName }}</span>
            </div>

            <!-- 标签区：类型 + 关联订单 -->
            <div class="card-tags">
              <el-tag size="small" class="type-tag">{{ item.typeName }}</el-tag>
              <span v-if="item.orderNo" class="order-no">关联订单：{{ item.orderNo }}</span>
            </div>

            <!-- 描述 -->
            <p class="complaint-desc">{{ item.description }}</p>

            <!-- 凭证图片 -->
            <div v-if="item.images && item.images.length" class="evidence-list" @click.stop>
              <el-image
                v-for="(img, i) in item.images"
                :key="i"
                :src="resolveClientImage(img)"
                :preview-src-list="item.images.map(resolveClientImage)"
                :initial-index="i"
                fit="cover"
                class="evidence-img"
                preview-teleported
              />
            </div>

            <!-- 处理结果 + 处理人员 -->
            <div v-if="item.solution" class="solution-block">
              <div class="sol-row">
                <span class="sol-label">处理结果：</span>
                <span class="sol-text">{{ item.solution }}</span>
              </div>
              <div v-if="item.assignee" class="sol-assignee">处理人员：{{ item.assignee }}</div>
            </div>

            <!-- 满意度评分：已解决且未评分 → 可打分；已评分 → 只读展示 -->
            <div v-if="item.status === 'resolved'" class="rate-block" @click.stop>
              <template v-if="(item.satisfaction || 0) > 0">
                <span class="rate-label">您的评分：</span>
                <el-rate :model-value="item.satisfaction" disabled class="rate-stars" />
                <span class="rate-value">{{ item.satisfaction }} 星</span>
              </template>
              <template v-else>
                <span class="rate-label">本次处理您满意吗？</span>
                <el-rate v-model="ratingMap[item.id]" class="rate-stars" />
                <el-button
                  size="small"
                  type="primary"
                  class="rate-btn"
                  :loading="ratingSubmittingId === item.id"
                  @click="submitRating(item)"
                >提交评分</el-button>
              </template>
            </div>

            <!-- 底部：提交时间 -->
            <div class="card-footer">
              <span class="create-time">提交于 {{ formatTime(item.createdAt) }}</span>
              <span class="view-detail">查看详情 ›</span>
            </div>
          </div>
        </div>
        <EmptyTips
          v-else
          text="暂无投诉记录"
          show-action
          action-text="去投诉"
          @action="$router.push('/complaint')"
        />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Service } from '@element-plus/icons-vue'
import PageSkeleton from '@/components/PageSkeleton/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import { getMyComplaintsApi, rateComplaintApi } from '@/api/modules/complaint'
import { resolveClientImage } from '@/utils/image'
import { dateUtil } from '@/utils'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10

// 满意度评分：每个工单待选星级 + 提交中状态
const ratingMap = reactive({})
const ratingSubmittingId = ref(null)

function formatTime(t) {
  if (!t) return '—'
  return dateUtil.format(t, 'YYYY-MM-DD HH:mm')
}

function goDetail(item) {
  router.push(`/complaint/${item.id}`)
}

async function submitRating(item) {
  const score = ratingMap[item.id]
  if (!score) {
    ElMessage.warning('请先选择评分')
    return
  }
  ratingSubmittingId.value = item.id
  try {
    await rateComplaintApi(item.id, { satisfaction: score })
    ElMessage.success('评分提交成功，感谢您的反馈')
    await loadList()
  } catch (e) {
    // 错误提示已由 request.js 统一弹出
    console.error('评分提交失败', e)
  } finally {
    ratingSubmittingId.value = null
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await getMyComplaintsApi({ page: page.value, pageSize }, { noDedup: true })
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) {
    console.error('我的投诉加载失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(loadList)
</script>

<style lang="scss" scoped>
.complaint-list-page {
  // 去投诉入口
  .complaint-entry {
    display: flex;
    align-items: center;
    gap: $space-base;
    padding: $space-base $space-md;
    margin-bottom: $space-lg;
    background: linear-gradient(135deg, rgba(217, 41, 28, 0.1), rgba(217, 41, 28, 0.03));
    border: 1px solid rgba(217, 41, 28, 0.2);
    border-radius: $radius-lg;
    cursor: pointer;
    transition: transform $transition-fast, box-shadow $transition-fast;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    }

    .entry-icon {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: $radius-md;
      color: #fff;
      background: var(--lux-primary-text);
    }

    .entry-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .entry-title {
        font-size: $font-size-base;
        font-weight: $font-weight-medium;
        color: $color-text;
      }
      .entry-desc {
        font-size: $font-size-xs;
        color: $color-text-secondary;
      }
    }

    .entry-btn {
      flex-shrink: 0;
    }
  }

  // 投诉卡片
  .complaint-card {
    background: $color-bg-gray;
    border: 1px solid $color-divider;
    border-radius: $radius-lg;
    padding: $space-lg;
    margin-bottom: $space-md;
    cursor: pointer;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:hover {
      border-color: var(--lux-primary-text);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $space-xs;

      .ticket-no {
        font-size: $font-size-sm;
        color: $color-text-secondary;
        font-weight: $font-weight-medium;
      }
    }

    .status-tag {
      font-size: $font-size-xs;
      padding: 3px 12px;
      border-radius: 999px;
      font-weight: $font-weight-medium;
      &.pending { color: #f59e0b; background: rgba(245, 158, 11, 0.14); }
      &.processing { color: #3b82f6; background: rgba(59, 130, 246, 0.14); }
      &.resolved { color: #10b981; background: rgba(16, 185, 129, 0.14); }
      &.rejected { color: #ef4444; background: rgba(239, 68, 68, 0.14); }
    }

    .card-tags {
      display: flex;
      align-items: center;
      gap: $space-md;
      margin-bottom: $space-sm;

      .order-no {
        font-size: $font-size-xs;
        color: $color-text-tertiary;
      }
    }

    .complaint-desc {
      font-size: $font-size-sm;
      color: $color-text;
      line-height: 1.7;
      margin-bottom: $space-md;
      word-break: break-all;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .evidence-list {
      display: flex;
      flex-wrap: wrap;
      gap: $space-xs;
      margin-bottom: $space-md;

      .evidence-img {
        width: 72px;
        height: 72px;
        border-radius: $radius-sm;
        cursor: pointer;
      }
    }

    .solution-block {
      padding: $space-sm $space-md;
      background: rgba(16, 185, 129, 0.08);
      border-radius: $radius-md;
      margin-bottom: $space-sm;

      .sol-row {
        font-size: $font-size-sm;
        line-height: 1.7;
        .sol-label {
          color: #10b981;
          font-weight: $font-weight-medium;
        }
        .sol-text {
          color: $color-text;
        }
      }
      .sol-assignee {
        margin-top: $space-xxs;
        font-size: $font-size-xs;
        color: $color-text-secondary;
      }
    }

    .rate-block {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: $space-xs;
      margin-bottom: $space-sm;
      padding: $space-sm $space-md;
      background: rgba(217, 41, 28, 0.05);
      border: 1px dashed rgba(217, 41, 28, 0.25);
      border-radius: $radius-md;

      .rate-label {
        font-size: $font-size-sm;
        color: $color-text-secondary;
      }
      .rate-stars {
        :deep(.el-rate__icon) {
          font-size: 18px;
        }
      }
      .rate-value {
        font-size: $font-size-sm;
        color: var(--lux-primary-text);
        font-weight: $font-weight-medium;
      }
      .rate-btn {
        margin-left: auto;
      }
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: $space-xs;
      padding-top: $space-xs;
      border-top: 1px solid $color-divider;

      .create-time {
        font-size: $font-size-xs;
        color: $color-text-tertiary;
      }
      .view-detail {
        font-size: $font-size-xs;
        color: var(--lux-primary-text);
        font-weight: $font-weight-medium;
      }
    }
  }
}
</style>
