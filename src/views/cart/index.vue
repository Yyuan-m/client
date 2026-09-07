<template>
  <div class="cart-page section">
    <div class="container">
      <h2 class="section-title">购物车</h2>
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
            <img :src="resolveAdminImage(item.cover)" :alt="item.carName" class="item-img" @click="$router.push(`/vehicles/${item.carId}`)" />
            <div class="item-info">
              <h3 class="item-name" @click="$router.push(`/vehicles/${item.carId}`)">{{ item.carName }}</h3>
              <div v-if="item.tags?.length" class="item-tags">
                <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              </div>
              <div class="item-date">
                <!-- 点击日期区域弹出改期弹层（与车辆详情页租车/加购同一套 DateRentPicker 逻辑） -->
                <div class="date-edit" title="点击修改租期" @click="openDateEditor(item)">
                  <el-icon><Calendar /></el-icon>
                  <span class="date-text">{{ item.startDate }} 至 {{ item.endDate }}</span>
                  <el-icon class="edit-hint"><EditPen /></el-icon>
                </div>
                <span class="days-badge">{{ item.days }}天</span>
                <span v-if="occupiedRangesText(item.carId)" class="occupied-badge">已租出：{{ occupiedRangesText(item.carId) }}</span>
                <span v-if="isRangeUnavailable(item.carId, item.startDate, item.endDate)" class="unavailable-badge">所选日期车辆不可租，请改期</span>
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
              <el-button type="danger" text :icon="Delete" class="remove-btn" @click="handleRemove(item)">移除</el-button>
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

      <!-- 修改租期弹层：与车辆详情页租车/加购使用同一 DateRentPicker 组件与校验规则 -->
      <el-dialog
        v-model="dateEditorVisible"
        :title="`修改租期${editTarget ? ' · ' + editTarget.carName : ''}`"
        width="520px"
        destroy-on-close
        append-to-body
      >
        <div v-loading="dateEditorLoading" class="date-editor-body">
          <template v-if="!dateEditorLoading">
            <!-- 已租出/整备期提示 -->
            <el-alert
              v-if="editTarget && occupiedRangesText(editTarget.carId)"
              type="warning"
              :closable="false"
              show-icon
              :title="`该车已租出区间（含2天整备）：${occupiedRangesText(editTarget.carId)}，期间不可选`"
              class="occupied-alert"
            />
            <!-- 所选日期不可租提示（快捷选项可能跨入不可用区间） -->
            <el-alert
              v-if="editTarget && editRange.length === 2 && isRangeUnavailable(editTarget.carId, editRange[0], editRange[1])"
              type="error"
              :closable="false"
              show-icon
              title="所选日期车辆不可租（已租出或整备中），请重新选择"
              class="occupied-alert"
            />
            <!-- 与详情页一致的租期选择器 -->
            <DateRentPicker
              v-model="editRange"
              :min-days="editRule.minDays"
              :max-days="editRule.maxDays"
              :min-date="editRule.availableDate"
              :disabled-date-fn="(date) => isDateUnavailable(editTarget?.carId, toYmd(date))"
              @change="onEditRangeChange"
            />
            <p v-if="editRule.minDays > 1 || editRule.maxDays" class="edit-rule-tip">
              该车起租规则：至少 {{ editRule.minDays }} 天<template v-if="editRule.maxDays">，最多 {{ editRule.maxDays }} 天</template>
            </p>
          </template>
        </div>
        <template #footer>
          <el-button @click="dateEditorVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!editRangeValid" :loading="dateEditorSaving" @click="confirmDateEdit">保存修改</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, reactive, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import DateRentPicker from '@/components/DateRentPicker/index.vue'
import { useCartStore, useUserStore } from '@/stores'
import { getCarAvailabilityApi, getCarDetailApi } from '@/api/modules/car'
import { moneyUtil, dateUtil } from '@/utils'
import { resolveAdminImage } from '@/utils/image'
import { useRouter } from 'vue-router'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

onMounted(() => {
  cartStore.initCart()
  startCartSync()
})

onUnmounted(() => {
  stopCartSync()
})

// ---------- 跨端实时同步（与移动端互相同步购物车增删/改期/清空） ----------
// 机制：购物车页打开期间每 5 秒做一次远程摘要比对（拉列表比较关键字段），
// 不一致时全量刷新；另在窗口重新聚焦/页面重新可见时立即校验一次。
const CART_SYNC_INTERVAL = 5000
let cartSyncTimer = null

function startCartSync() {
  stopCartSync()
  cartSyncTimer = setInterval(() => cartStore.checkRemoteSync(), CART_SYNC_INTERVAL)
  window.addEventListener('focus', checkCartSyncNow)
  document.addEventListener('visibilitychange', onVisibilityChange)
}

function stopCartSync() {
  if (cartSyncTimer) {
    clearInterval(cartSyncTimer)
    cartSyncTimer = null
  }
  window.removeEventListener('focus', checkCartSyncNow)
  document.removeEventListener('visibilitychange', onVisibilityChange)
}

function checkCartSyncNow() {
  cartStore.checkRemoteSync()
}

function onVisibilityChange() {
  // 从后台标签页切回时立即校验（对应移动端 onShow 的同步时机）
  if (document.visibilityState === 'visible') {
    cartStore.checkRemoteSync()
  }
}

// 选中项变化时重新拉取价格（toggleSelect 后触发）
watch(() => cartStore.selectedIds, () => {
  cartStore.refreshPrices()
}, { deep: true })

// 购物车车辆变化时加载可用期（禁用已租出/整备期日期）
watch(() => cartStore.items.map((i) => i.carId).join(','), () => {
  loadAvailability()
})

// ---------- 车辆可用期（已租出/整备期日期禁用） ----------
// carId → { availableDate, unavailableRanges:[{startDate,endDate}] }（闭区间）
const availabilityMap = reactive({})

async function loadAvailability() {
  const ids = [...new Set(cartStore.items.map((i) => i.carId))]
  await Promise.all(
    ids.map(async (carId) => {
      try {
        availabilityMap[carId] = await getCarAvailabilityApi(carId)
      } catch (e) {
        console.error('加载车辆可用期失败', carId, e)
      }
    })
  )
}

function toYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function unavailableRangesOf(carId) {
  return availabilityMap[carId]?.unavailableRanges || []
}

// 已租出/整备区间展示文案（如 "09-03~09-09"）
function occupiedRangesText(carId) {
  return unavailableRangesOf(carId)
    .map((r) => `${r.startDate.slice(5)}~${r.endDate.slice(5)}`)
    .join('、')
}

// 判断某天（YYYY-MM-DD）是否落在不可用区间（已租出/整备期）
function isDateUnavailable(carId, ymd) {
  return unavailableRangesOf(carId).some((r) => r.startDate <= ymd && ymd <= r.endDate)
}

// 判断租期 [start, end)（YYYY-MM-DD 字符串）是否与不可用区间冲突
function isRangeUnavailable(carId, start, end) {
  if (!start || !end) return false
  return unavailableRangesOf(carId).some((r) => start < r.endDate && end > r.startDate)
}

// 取某车的价格明细
function priceDetailOf(carId) {
  return cartStore.getPriceDetail(carId)
}

// ---------- 购物车内改期（弹层 + DateRentPicker，与车辆详情页租车/加购逻辑一致） ----------
const dateEditorVisible = ref(false)
const dateEditorLoading = ref(false)
const dateEditorSaving = ref(false)
const editTarget = ref(null)
const editRange = ref([])
// 选择结果校验（minDays/maxDays 由 DateRentPicker 内部校验并透出）
const editRangeValid = ref(false)
// 车辆起租规则（carId → { minDays, maxDays, availableDate }）
const rentRuleMap = reactive({})

// 当前改期车辆的起租规则（未加载完成时用默认值占位）
const editRule = computed(() => {
  const carId = editTarget.value?.carId
  return rentRuleMap[carId] || { minDays: 1, maxDays: null, availableDate: null }
})

/**
 * 打开改期弹层：拉取车辆详情同步起租规则（minRentDays/maxRentDays/availableDate，
 * 与详情页 DateRentPicker 的入参同源）
 */
async function openDateEditor(item) {
  editTarget.value = item
  editRange.value = [item.startDate, item.endDate]
  editRangeValid.value = true
  dateEditorVisible.value = true

  // 已有规则直接复用；无则拉车辆详情（详情接口返回 minRentDays/maxRentDays/availableDate）
  if (!rentRuleMap[item.carId]) {
    dateEditorLoading.value = true
    try {
      const car = await getCarDetailApi(item.carId)
      rentRuleMap[item.carId] = {
        minDays: Math.max(1, Number(car?.minRentDays) || 1),
        maxDays: car?.maxRentDays ? Number(car.maxRentDays) : null,
        availableDate: car?.availableDate || null
      }
    } catch (e) {
      console.error('加载车辆起租规则失败', e)
      // 兜底：默认规则（至少1天，不限上限，不限首租日）
      rentRuleMap[item.carId] = { minDays: 1, maxDays: null, availableDate: null }
    } finally {
      dateEditorLoading.value = false
    }
  }

  // 可用期未加载时兜底拉一次（弹层禁用规则依赖）
  if (!availabilityMap[item.carId]) {
    try {
      availabilityMap[item.carId] = await getCarAvailabilityApi(item.carId)
    } catch (e) {
      console.error('加载车辆可用期失败', item.carId, e)
    }
  }
}

// 选择器回调：记录校验结果（valid 由组件按 minDays/maxDays 判定）
function onEditRangeChange({ valid }) {
  editRangeValid.value = valid
}

// 保存改期：区间冲突拦截 + 调 store 更新（同步后端 + 重算价格）
async function confirmDateEdit() {
  const item = editTarget.value
  if (!item || editRange.value.length < 2 || !editRangeValid.value) return
  const [start, end] = editRange.value
  // 日期未变化则直接关闭
  if (start === item.startDate && end === item.endDate) {
    dateEditorVisible.value = false
    return
  }
  // 所选租期落在已租出/整备期则拒绝（后端 updateCart 也会二次校验）
  if (isRangeUnavailable(item.carId, start, end)) {
    ElMessage.warning('该车在所选日期已被租出或在整备中，请更换租期')
    return
  }
  const days = dateUtil.daysBetween(start, end)
  dateEditorSaving.value = true
  try {
    await cartStore.updateItem(item.carId, start, end, days)
    ElMessage.success(`租期已更新为 ${days} 天，价格已刷新`)
    dateEditorVisible.value = false
  } catch (e) {
    console.error('购物车改期失败', e)
  } finally {
    dateEditorSaving.value = false
  }
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
    // 日期区域：可点击打开改期弹层，hover 有编辑提示
    .date-edit {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 2px 6px;
      margin-left: -6px;
      border-bottom: 1px dashed transparent;
      transition: color $transition-fast, border-color $transition-fast;
      &:hover {
        color: var(--lux-primary-text);
        border-bottom-color: var(--lux-primary-text);
        .edit-hint { opacity: 1; }
      }
      .edit-hint {
        font-size: $font-size-xs;
        opacity: 0;
        transition: opacity $transition-fast;
      }
    }
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
    .occupied-badge {
      background: rgba(245, 158, 11, 0.14);
      color: #f59e0b;
      padding: 1px 8px;
      border-radius: $radius-none;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
    }
    .unavailable-badge {
      background: rgba(239, 68, 68, 0.14);
      color: #ef4444;
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

// 移除按钮：text 类型 danger 默认色偏淡，在卡片背景(#242424 / #f5f5f5)上易混淆
// 显式用 danger 色作文字色，hover/active 用主题品牌红文字变量 + 淡红背景增强对比与反馈
.remove-btn {
  color: $color-danger !important;
  --el-button-text-color: #{$color-danger} !important;
  font-weight: $font-weight-medium;
  &:hover {
    color: var(--lux-primary-text) !important;
    --el-button-hover-text-color: var(--lux-primary-text) !important;
    background: rgba(241, 58, 44, 0.12) !important;
  }
  &:active {
    color: $color-primary-active !important;
    --el-button-active-text-color: #{$color-primary-active} !important;
    background: rgba(241, 58, 44, 0.18) !important;
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

// ---------- 修改租期弹层 ----------
.date-editor-body {
  min-height: 120px;
}
.occupied-alert {
  margin-bottom: $space-base;
}
.edit-rule-tip {
  margin-top: $space-sm;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}
</style>
