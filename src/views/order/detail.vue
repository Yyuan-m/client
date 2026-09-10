<template>
  <div class="order-detail-page section">
    <div class="container">
      <PageSkeleton v-if="loading" :count="4" />
      <template v-else-if="order">
        <h2 class="section-title">订单详情</h2>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">{{ order.statusName }}</el-descriptions-item>
          <el-descriptions-item v-if="order.status === 'completed'" label="评价状态">
            <span class="review-status-text" :class="order.reviewStatus">{{ order.reviewStatusName }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="车辆数">
            <template v-if="order.items && order.items.length">{{ order.items.length }} 辆</template>
            <template v-else>1 辆</template>
          </el-descriptions-item>
          <el-descriptions-item label="取车门店">{{ order.store }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ order.createTime }}</el-descriptions-item>
        </el-descriptions>

        <!-- 车辆明细（一个订单可含多辆车） -->
        <div v-if="order.items && order.items.length" class="vehicle-block">
          <h3 class="block-title">车辆明细</h3>
          <div v-for="item in order.items" :key="item.id" class="vehicle-card">
            <img :src="resolveAdminImage(item.carCover)" :alt="item.carName" class="v-img" />
            <div class="v-info">
              <h4 class="v-name">{{ item.carName }}</h4>
              <p class="v-date">{{ item.startDate }} 至 {{ item.endDate }}（{{ item.days }}天）</p>
              <p class="v-item">
                日租金 ￥{{ moneyUtil.format(item.dailyPrice) }}/天 · 租金小计 ￥{{ moneyUtil.format(item.rentAmount) }}
              </p>
              <p v-if="item.discountAmount > 0" class="v-discount">优惠 -￥{{ moneyUtil.format(item.discountAmount) }}</p>
              <p class="v-total">小计 ￥{{ moneyUtil.format(item.totalAmount) }}</p>
            </div>
          </div>
        </div>
        <!-- 兼容历史一车一单：无明细时展示主订单首车 -->
        <div v-else class="vehicle-block">
          <div class="vehicle-card">
            <img :src="resolveAdminImage(order.carCover)" :alt="order.carName" class="v-img" />
            <div class="v-info">
              <h4 class="v-name">{{ order.carName }}</h4>
              <p class="v-date">{{ order.startDate }} 至 {{ order.endDate }}（{{ order.days }}天）</p>
              <p class="v-item">日租金 ￥{{ moneyUtil.format(order.dailyPrice) }}/天</p>
              <p class="v-total">小计 ￥{{ moneyUtil.format(order.rentAmount) }}</p>
            </div>
          </div>
        </div>

        <el-descriptions :column="2" border class="amount-block">
          <el-descriptions-item label="日租金">￥{{ moneyUtil.format(order.dailyPrice) }}/天</el-descriptions-item>
          <el-descriptions-item label="租金合计">￥{{ moneyUtil.format(order.rentAmount) }}</el-descriptions-item>
          <el-descriptions-item v-if="order.couponName" label="使用优惠券">{{ order.couponName }}</el-descriptions-item>
          <el-descriptions-item v-if="order.couponDiscount > 0" label="优惠券抵扣"><span class="discount-text">-￥{{ moneyUtil.format(order.couponDiscount) }}</span></el-descriptions-item>
          <el-descriptions-item label="券后应付总额"><span class="price"><span class="amount">￥{{ moneyUtil.format(order.totalAmount) }}</span></span></el-descriptions-item>
        </el-descriptions>
        <div v-if="order.status === 'pending'" class="pay-countdown">
          <el-icon><Timer /></el-icon>
          <span>支付剩余时间：<b class="countdown-text">{{ countdownText }}</b></span>
        </div>
        <div class="actions">
          <el-button @click="$router.back()">返回</el-button>
          <el-button v-if="order.status === 'pending'" type="primary" :disabled="countdownText === '00:00'" @click="handlePay">立即支付</el-button>
          <el-button v-if="order.status === 'renting'" type="primary" @click="handleRenew">续租</el-button>
          <el-button v-if="order.status === 'renting'" type="success" @click="handleComplete">确认还车</el-button>
          <el-button
            v-if="order.status === 'completed' && (order.reviewStatus === 'unreviewed' || order.reviewStatus === 'reviewed')"
            type="primary"
            @click="openReviewDialog"
          >{{ order.reviewStatus === 'unreviewed' ? '去评价' : '去追评' }}</el-button>
          <el-button
            v-if="order.status === 'renting' || order.status === 'completed'"
            @click="router.push({ path: '/complaint', query: { orderNo: order.orderNo } })"
          >投诉</el-button>
          <el-button v-if="order.status === 'pending'" type="danger" @click="handleCancel">取消订单</el-button>
        </div>
      </template>
      <EmptyTips v-else text="订单不存在" show-action action-text="返回订单列表" @action="$router.push('/orders')" />

      <!-- 评价弹窗 -->
      <ReviewDialog
        v-model="reviewDialogVisible"
        :order-id="reviewDialogOrderId"
        @success="handleReviewSuccess"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer } from '@element-plus/icons-vue'
import PageSkeleton from '@/components/PageSkeleton/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import ReviewDialog from '@/components/ReviewDialog/index.vue'
import { getOrderDetailApi, cancelOrderApi, payOrderApi, completeOrderApi } from '@/api/modules/order'
import { resolveAdminImage } from '@/utils/image'
import { moneyUtil } from '@/utils'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const order = ref(null)

// 评价弹窗
const reviewDialogVisible = ref(false)
const reviewDialogOrderId = ref(null)

function openReviewDialog() {
  reviewDialogOrderId.value = order.value?.id
  reviewDialogVisible.value = true
}

// 评价成功后刷新订单详情
async function handleReviewSuccess() {
  await loadDetail()
}

// ---------- 支付倒计时（5分钟）----------
const PAY_TIMEOUT = 5 * 60 * 1000 // 5分钟，单位毫秒
const remainingMs = ref(0)
let countdownTimer = null

const countdownText = computed(() => {
  const total = Math.max(0, Math.floor(remainingMs.value / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
})

function startCountdown() {
  stopCountdown()
  if (!order.value || order.value.status !== 'pending' || !order.value.createTime) return
  const created = new Date(order.value.createTime).getTime()
  const expired = created + PAY_TIMEOUT
  const update = () => {
    remainingMs.value = expired - Date.now()
    if (remainingMs.value <= 0) {
      stopCountdown()
      ElMessage.warning('支付超时，订单已自动取消')
      loadDetail()
    }
  }
  update()
  countdownTimer = setInterval(update, 1000)
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

async function loadDetail() {
  loading.value = true
  try {
    order.value = await getOrderDetailApi(route.params.id)
    startCountdown()
  } catch (e) {
    console.error('订单详情加载失败', e)
  } finally {
    loading.value = false
  }
}

async function handlePay() {
  try {
    await ElMessageBox.confirm('确认支付该订单吗？', '订单支付', {
      type: 'warning',
      confirmButtonText: '确认支付',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await payOrderApi(order.value.id)
    ElMessage.success('支付成功')
    stopCountdown()
    await loadDetail()
  } catch (e) {
    console.error('支付失败', e)
  }
}

function handleRenew() {
  // 续租跳转到车辆详情页重新下单
  if (order.value?.carId) {
    router.push(`/vehicles/${order.value.carId}`)
  }
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定取消该订单吗？', '取消订单', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await cancelOrderApi(order.value.id)
    ElMessage.success('订单已取消')
    stopCountdown()
    await loadDetail()
  } catch (e) {
    console.error('取消订单失败', e)
  }
}

// 确认还车：租赁中 → 已完成，置评价状态为待评价
async function handleComplete() {
  try {
    await ElMessageBox.confirm('确认已归还车辆吗？确认后订单将变为已完成，可进行评价。', '确认还车', {
      type: 'warning',
      confirmButtonText: '确认还车',
      cancelButtonText: '再想想'
    })
  } catch {
    return
  }
  try {
    await completeOrderApi(order.value.id)
    ElMessage.success('还车成功，欢迎评价本次服务')
    await loadDetail()
    // 订单完成会触发后端重算会员等级，刷新用户信息以便升级动画及时感知
    try {
      await useUserStore().fetchUserInfo()
    } catch (e) {
      console.error('刷新用户信息失败', e)
    }
  } catch (e) {
    console.error('确认还车失败', e)
  }
}

onMounted(loadDetail)
onBeforeUnmount(stopCountdown)
</script>

<style lang="scss" scoped>
// 评价状态文字
.review-status-text {
  font-weight: $font-weight-medium;
  &.unreviewed { color: $color-warning; }
  &.reviewed { color: $color-info; }
  &.final_reviewed { color: $color-success; }
}

.pay-countdown {
  margin-top: $space-lg;
  text-align: center;
  font-size: $font-size-base;
  color: $color-warning;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  .countdown-text {
    font-size: $font-size-lg;
    color: $color-danger;
    font-variant-numeric: tabular-nums;
  }
}

// 车辆明细区块（一个订单可含多辆车）
.vehicle-block {
  margin-top: $space-lg;
  display: flex;
  flex-direction: column;
  gap: $space-base;

  .block-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: var(--lux-primary-text);
    margin-bottom: $space-xs;
  }

  .vehicle-card {
    display: flex;
    gap: $space-base;
    padding: $space-base;
    border: 1px solid var(--lux-border);
    border-radius: 8px;
    background: var(--lux-bg-gray);

    .v-img {
      width: 160px;
      height: 110px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .v-info {
      flex: 1;
      min-width: 0;
    }

    .v-name {
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      color: var(--lux-primary-text);
      margin-bottom: $space-xs;
    }

    .v-date,
    .v-item {
      font-size: $font-size-sm;
      color: $color-text-secondary;
      margin-bottom: 4px;
    }

    .v-discount {
      font-size: $font-size-sm;
      color: $color-success;
    }

    .v-total {
      margin-top: 6px;
      font-weight: $font-weight-medium;
      color: var(--lux-primary-text);
    }
  }
}

// 抵扣红色 + 应付突出
:deep(.discount-text) {
  color: $color-danger;
}
:deep(.price .amount) {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: var(--lux-primary-text);
}

.actions {
  margin-top: $space-xl;
  display: flex;
  gap: $space-base;
  justify-content: center;
}
</style>
