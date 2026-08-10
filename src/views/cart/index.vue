<template>
  <div class="cart-page section">
    <div class="container">
      <h2 class="section-title">租车购物车</h2>
      <p class="section-subtitle">{{ cartStore.totalCount }} 台车辆，已选 {{ cartStore.selectedCount }} 台</p>

      <!-- 未登录提示 -->
      <EmptyTips v-if="!userStore.isLoggedIn" text="请先登录后查看购物车" show-action action-text="去登录" @action="$router.push({ path: '/login', query: { redirect: '/cart' } })" />
      <!-- 购物车为空 -->
      <EmptyTips v-else-if="!cartStore.items.length" text="购物车为空" show-action action-text="去选车" @action="$router.push('/vehicles')" />
      <div v-else class="cart-content">
        <!-- 购物车列表 -->
        <div class="cart-left">
          <!-- 全选栏 -->
          <div class="cart-select-bar">
            <el-checkbox :model-value="cartStore.isAllSelected" @change="cartStore.toggleSelectAll()">全选</el-checkbox>
            <span class="select-tip">已选 {{ cartStore.selectedCount }} / {{ cartStore.totalCount }} 台</span>
          </div>

          <div v-for="item in cartStore.items" :key="item.carId" class="cart-item" :class="{ active: cartStore.isSelected(item.carId) }">
            <el-checkbox
              :model-value="cartStore.isSelected(item.carId)"
              class="item-check"
              @change="cartStore.toggleSelect(item.carId)"
            />
            <img :src="item.cover" :alt="item.carName" class="item-img" @click="$router.push(`/vehicles/${item.carId}`)" />
            <div class="item-info">
              <h3 class="item-name" @click="$router.push(`/vehicles/${item.carId}`)">{{ item.carName }}</h3>
              <div v-if="item.tags?.length" class="item-tags">
                <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              </div>
              <div class="item-date">
                <el-icon><Calendar /></el-icon>
                <span>{{ item.startDate }} 至 {{ item.endDate }}</span>
                <span class="days-badge">{{ item.days }}天</span>
                <span v-if="priceDetailOf(item.carId)?.durationTier" class="tier-badge">{{ priceDetailOf(item.carId).durationTierName }}·{{ discountPercentOf(item.carId) }}</span>
                <span v-if="priceDetailOf(item.carId)?.holidayDays > 0" class="holiday-badge">含{{ priceDetailOf(item.carId).holidayDays }}天假日/周末</span>
              </div>
              <div class="item-price-row">
                <span class="item-price">￥{{ moneyUtil.format(item.dailyPrice) }}/天</span>
                <template v-if="priceDetailOf(item.carId)">
                  <span class="item-rent">租金 ￥{{ moneyUtil.format(priceDetailOf(item.carId).rentAmount) }}</span>
                </template>
                <span v-else class="item-rent">价格计算中…</span>
              </div>
            </div>
            <div class="item-actions">
              <div class="item-amount" v-if="priceDetailOf(item.carId)">￥{{ moneyUtil.format(priceDetailOf(item.carId).totalAmount) }}</div>
              <div class="item-amount" v-else>—</div>
              <el-button type="danger" text :icon="Delete" @click="handleRemove(item)">移除</el-button>
            </div>
          </div>

          <!-- 服务保障提示 -->
          <div class="service-tips">
            <div class="tip-item"><el-icon><CircleCheckFilled /></el-icon>全保险保障</div>
            <div class="tip-item"><el-icon><CircleCheckFilled /></el-icon>免费取消政策</div>
            <div class="tip-item"><el-icon><CircleCheckFilled /></el-icon>24小时客服</div>
          </div>
        </div>

        <!-- 结算卡片 -->
        <div class="cart-right">
          <div class="summary-card">
            <h3 class="summary-title">费用明细</h3>
            <div class="summary-row"><span>已选车辆</span><span>{{ cartStore.selectedCount }} 台</span></div>
            <div class="summary-row"><span>租金合计</span><span>￥{{ moneyUtil.format(cartStore.totalAmount) }}</span></div>
            <div class="divider"></div>
            <div class="summary-row total"><span>应付总额</span><span>￥{{ moneyUtil.format(cartStore.grandTotal) }}</span></div>
            <el-button type="primary" size="large" class="checkout-btn" :disabled="!cartStore.selectedCount" @click="goCheckout">去结算</el-button>
            <el-button text size="small" class="clear-btn" @click="handleClear">清空购物车</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import { useCartStore, useUserStore } from '@/stores'
import { moneyUtil } from '@/utils'
import { useRouter } from 'vue-router'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

onMounted(() => {
  cartStore.initCart()
})

// 选中项变化时重新拉取价格（toggleSelect 后触发）
watch(() => cartStore.selectedIds, () => {
  cartStore.refreshPrices()
}, { deep: true })

// 取某车的价格明细
function priceDetailOf(carId) {
  return cartStore.getPriceDetail(carId)
}
// 折扣百分比展示（如 weekly 折扣 0.92 → "8.0折"）
function discountPercentOf(carId) {
  const p = priceDetailOf(carId)
  if (!p || !p.durationFactor) return ''
  const factor = Number(p.durationFactor)
  if (factor >= 1) return ''
  const times10 = factor * 10
  return `${Number.isInteger(times10) ? times10 : times10.toFixed(1)}折`
}

function goCheckout() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: '/checkout' } })
    return
  }
  if (!cartStore.selectedCount) {
    ElMessage.warning('请先选择要结算的车辆')
    return
  }
  router.push('/checkout')
}

async function handleClear() {
  try {
    await ElMessageBox.confirm('确定清空购物车吗？', '清空购物车', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await cartStore.clear()
  ElMessage.success('购物车已清空')
}

// 单项移除：确认后调用 store 移除
async function handleRemove(item) {
  try {
    await ElMessageBox.confirm(`确定从购物车移除「${item.carName}」吗？`, '移除车辆', {
      type: 'warning',
      confirmButtonText: '移除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await cartStore.removeItem(item.carId)
  ElMessage.success('已移除')
}
</script>

<style lang="scss" scoped>
.cart-content {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: $space-xl;
  align-items: start;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.cart-left { display: flex; flex-direction: column; gap: $space-base; }

// 全选栏
.cart-select-bar {
  display: flex;
  align-items: center;
  gap: $space-md;
  padding: $space-sm $space-base;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  .select-tip {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

.cart-item {
  display: flex;
  align-items: flex-start;
  gap: $space-sm;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-base;
  transition: transform $transition-base, border-color $transition-fast;
  &:hover { transform: translateY(-2px); }
  &.active { border-color: $color-primary; background: rgba(218, 41, 28, 0.04); }
  .item-check {
    margin-top: 4px;
    flex-shrink: 0;
  }
}

.item-img {
  width: 140px;
  height: 95px;
  border-radius: $radius-none;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
  .item-name {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    margin-bottom: $space-xs;
    cursor: pointer;
    &:hover { color: var(--lux-primary-text); }
  }
  .item-tags {
    display: flex;
    gap: $space-xs;
    flex-wrap: wrap;
    margin-bottom: $space-xs;
  }
  .item-date {
    display: flex;
    align-items: center;
    gap: $space-xs;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $space-xs;
    flex-wrap: wrap;
    .days-badge {
      background: $color-bg-gray-dark;
      color: var(--lux-primary-text);
      padding: 1px 8px;
      border-radius: $radius-none;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }
    .tier-badge {
      background: rgba(218, 41, 28, 0.1);
      color: var(--lux-primary-text);
      padding: 1px 8px;
      border-radius: $radius-none;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }
    .holiday-badge {
      background: rgba(230, 162, 60, 0.15);
      color: #e6a23c;
      padding: 1px 8px;
      border-radius: $radius-none;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }
  }
  .item-price-row {
    display: flex;
    gap: $space-md;
    flex-wrap: wrap;
    font-size: $font-size-sm;
    .item-price { color: var(--lux-primary-text); font-weight: $font-weight-medium; }
    .item-rent { color: $color-text; }
  }
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  .item-amount {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: var(--lux-primary-text);
  }
}

.service-tips {
  display: flex;
  gap: $space-lg;
  padding: $space-base;
  background: $color-bg-gray-dark;
  border-radius: $radius-none;
  flex-wrap: wrap;
  .tip-item {
    display: flex;
    align-items: center;
    gap: $space-xs;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    .el-icon { color: $color-success; }
  }
}

// ---------- 结算卡片 ----------
.summary-card {
  background: $color-bg-gray;
  border-radius: $radius-none;
  padding: $space-lg;
  position: sticky;
  top: $header-height + $space-base;
}
.summary-title { font-size: $font-size-md; font-weight: $font-weight-medium; margin-bottom: $space-base; }
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: $font-size-sm;
  margin-bottom: $space-sm;
  color: $color-text-secondary;
  &.total {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: var(--lux-primary-text);
    margin-top: $space-sm;
  }
}
.divider { height: 1px; background: $color-border; margin: $space-base 0; }
.checkout-btn { width: 100%; margin-top: $space-base; }
.clear-btn {
  width: 100%;
  margin-top: $space-sm;
  margin-left: 0;
  color: $color-text-tertiary;
  font-size: $font-size-xs;
  &:hover { color: $color-danger; }
}
</style>
