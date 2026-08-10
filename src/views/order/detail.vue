<template>
  <div class="order-detail-page section">
    <div class="container">
      <PageSkeleton v-if="loading" :count="4" />
      <template v-else-if="order">
        <h2 class="section-title">订单详情</h2>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">{{ order.statusName }}</el-descriptions-item>
          <el-descriptions-item label="车辆">{{ order.carName }}</el-descriptions-item>
          <el-descriptions-item label="租期">{{ order.startDate }} 至 {{ order.endDate }}（{{ order.days }}天）</el-descriptions-item>
          <el-descriptions-item label="取车门店">{{ order.store }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ order.createTime }}</el-descriptions-item>
          <el-descriptions-item label="日租金">￥{{ order.dailyPrice }}/天</el-descriptions-item>
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
          <el-button v-if="order.status === 'pending'" type="danger" @click="handleCancel">取消订单</el-button>
        </div>
      </template>
      <EmptyTips v-else text="订单不存在" show-action action-text="返回订单列表" @action="$router.push('/orders')" />
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
import { getOrderDetailApi, cancelOrderApi, payOrderApi } from '@/api/modules/order'
import { moneyUtil } from '@/utils'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const order = ref(null)

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

onMounted(loadDetail)
onBeforeUnmount(stopCountdown)
</script>

<style lang="scss" scoped>
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
