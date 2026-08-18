<template>
  <div class="checkout-page section">
    <div class="container">
      <h2 class="section-title">确认订单</h2>
      <EmptyTips v-if="!cartStore.selectedCount" text="请先在购物车选择要结算的车辆" show-action action-text="去购物车" @action="$router.push('/cart')" />
      <div v-else class="checkout-content">
        <!-- 订单概览 -->
        <div class="checkout-left">
          <div v-for="item in cartStore.selectedItems" :key="item.carId" class="order-item">
            <img :src="resolveAdminImage(item.cover)" :alt="item.carName" class="item-img" />
            <div class="item-info">
              <h3>{{ item.carName }}</h3>
              <p class="item-date">{{ item.startDate }} 至 {{ item.endDate }}（{{ item.days }}天）</p>
              <p class="item-price">￥{{ moneyUtil.format(item.dailyPrice) }}/天</p>
              <!-- 价格明细摘要：长租折扣 / 节假日 -->
              <p v-if="priceDetailOf(item.carId)" class="item-detail-summary">
                <span v-if="Number(priceDetailOf(item.carId).discountAmount) > 0" class="badge badge-discount">
                  {{ priceDetailOf(item.carId).durationTierName }}折扣 -￥{{ moneyUtil.format(priceDetailOf(item.carId).discountAmount) }}
                </span>
                <span v-if="priceDetailOf(item.carId).holidayDays > 0" class="badge badge-holiday">
                  含{{ priceDetailOf(item.carId).holidayDays }}天假日/周末 +￥{{ moneyUtil.format(priceDetailOf(item.carId).holidaySurchargeAmount) }}
                </span>
              </p>
              <el-button link size="small" class="detail-toggle" @click="toggleItemDetail(item.carId)">
                查看价格明细<el-icon class="toggle-icon" :class="{ expanded: expandedItems.includes(item.carId) }"><ArrowDown /></el-icon>
              </el-button>
              <!-- 价格详情展开区 -->
              <div v-if="expandedItems.includes(item.carId) && priceDetailOf(item.carId)" class="item-price-detail">
                <div class="detail-row"><span>工作日天数</span><span>{{ priceDetailOf(item.carId).normalDays }} 天 × ￥{{ moneyUtil.format(item.dailyPrice) }}</span></div>
                <div class="detail-row" v-if="priceDetailOf(item.carId).holidayDays > 0">
                  <span>假日/周末天数</span>
                  <span>{{ priceDetailOf(item.carId).holidayDays }} 天 × ￥{{ moneyUtil.format(item.dailyPrice) }} × {{ Number(priceDetailOf(item.carId).holidaySurcharge).toFixed(2) }}</span>
                </div>
                <div class="detail-row"><span>折扣前小计</span><span>￥{{ moneyUtil.format(priceDetailOf(item.carId).subtotal) }}</span></div>
                <div class="detail-row" v-if="Number(priceDetailOf(item.carId).discountAmount) > 0">
                  <span>{{ priceDetailOf(item.carId).durationTierName }}折扣</span>
                  <span class="discount-text">-￥{{ moneyUtil.format(priceDetailOf(item.carId).discountAmount) }}</span>
                </div>
                <div class="detail-row"><span>租金</span><span>￥{{ moneyUtil.format(priceDetailOf(item.carId).rentAmount) }}</span></div>
                <div class="detail-row detail-total"><span>小计</span><span>￥{{ moneyUtil.format(priceDetailOf(item.carId).totalAmount) }}</span></div>
              </div>
            </div>
            <div class="item-amount" v-if="priceDetailOf(item.carId)">￥{{ moneyUtil.format(priceDetailOf(item.carId).totalAmount) }}</div>
            <div class="item-amount" v-else>—</div>
          </div>

          <!-- 取还车信息 -->
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="checkout-form">
            <h3 class="form-title">取还车信息</h3>
            <el-form-item label="取车城市" prop="cityId">
              <el-select v-model="form.cityId" placeholder="请选择取车城市" style="width: 100%" @change="onCityChange">
                <el-option v-for="c in cityList" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="取车门店" prop="store">
              <el-select v-model="form.store" placeholder="请选择取车门店" style="width: 100%">
                <el-option v-for="s in availableStores" :key="s.id" :label="s.name" :value="s.name" />
              </el-select>
            </el-form-item>
            <el-form-item label="联系人" prop="name">
              <el-input v-model="form.name" placeholder="请输入联系人姓名" maxlength="20" />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
            <el-form-item label="优惠券">
              <div class="coupon-pick-row">
                <div class="coupon-pick-current" v-if="selectedCoupons.length">
                  <span class="cp-label">{{ selectedCouponLabel }}</span>
                  <el-button text size="small" @click="openCouponDialog">更换</el-button>
                  <el-button text size="small" @click="clearCoupon">不使用</el-button>
                </div>
                <el-button v-else plain size="default" class="coupon-pick-empty" @click="openCouponDialog">
                  {{ coupons.length ? '选择优惠券' : '暂无可用优惠券' }}
                  <span v-if="coupons.length" class="cp-count">{{ coupons.length }} 张可用</span>
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 费用明细 -->
        <div class="checkout-right">
          <div class="summary-card">
            <h3 class="summary-title">费用明细</h3>
            <div class="summary-row"><span>租金合计</span><span>￥{{ moneyUtil.format(cartStore.totalAmount) }}</span></div>
            <div v-if="couponDiscount > 0" class="summary-row discount"><span>优惠券抵扣</span><span>-￥{{ moneyUtil.format(couponDiscount) }}</span></div>
            <div class="divider"></div>
            <div class="summary-row total">
              <span>券后应付</span>
              <span>￥{{ moneyUtil.format(finalTotal) }}</span>
            </div>
            <div v-if="couponDiscount > 0" class="save-tip">已为您节省 ￥{{ moneyUtil.format(couponDiscount) }}</div>
            <el-button type="primary" size="large" class="submit-btn" :loading="submitting" :disabled="cartStore.priceLoading || !cartStore.priceDetails.length" @click="submitOrder">提交订单</el-button>
            <p v-if="cartStore.priceLoading" class="price-tip">价格计算中…</p>
            <p v-else-if="!cartStore.priceDetails.length" class="price-tip">价格加载失败，请刷新重试</p>
          </div>
        </div>
      </div>

      <!-- 优惠券选择弹窗（v3 支持多张可叠加券） -->
      <el-dialog v-model="couponDialogVisible" title="选择优惠券" width="640px" :close-on-click-modal="false">
        <div class="coupon-dialog-body">
          <p class="coupon-tip">单次订单默认使用一张优惠券；标有「可叠加」的优惠券可同时使用多张，时长券不支持叠加。点击优惠券进行勾选/取消。</p>
          <div v-if="coupons.length" class="coupon-pick-list">
            <div
              v-for="c in coupons"
              :key="c.id"
              class="coupon-pick-item"
              :class="{ active: isSelected(c), disabled: isCouponDisabled(c) }"
              @click="toggleCoupon(c)"
            >
              <CouponCard :coupon="c" mode="mine" :show-action="false" :show-stock="false" :show-status="false" />
              <div class="cp-check">
                <el-icon v-if="isSelected(c)" :size="20"><Select /></el-icon>
              </div>
              <span v-if="c.stackable === 1" class="cp-stackable-tag">可叠加</span>
            </div>
          </div>
          <EmptyTips v-else text="暂无可用优惠券" />
        </div>
        <template #footer>
          <el-button @click="skipCoupon">暂不使用</el-button>
          <el-button type="primary" @click="useCouponNow">立即使用</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Select, ArrowDown } from '@element-plus/icons-vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import CouponCard from '@/components/CouponCard/index.vue'
import { useCartStore, useUserStore } from '@/stores'
import { moneyUtil, validators } from '@/utils'
import { resolveAdminImage } from '@/utils/image'
import { createOrderApi } from '@/api/modules/order'
import { getStoresApi, getCitiesApi } from '@/api/modules/system'
import { getUsableCouponsApi } from '@/api/modules/coupon'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const formRef = ref(null)
const submitting = ref(false)
// 优惠券弹窗：进入页面有可用券时弹窗提醒
const couponDialogVisible = ref(false)
// 展开价格明细的车辆ID列表
const expandedItems = ref([])
const form = reactive({
  cityId: '',
  city: '',
  store: '',
  name: userStore.user?.nickname || userStore.user?.realName || '',
  phone: userStore.user?.phone || '',
  // v3: 选中用户优惠券实例ID列表（member_coupon.id），支持多张可叠加券
  couponUserIds: []
})

// 取某车的价格明细（来自 cartStore.priceDetails）
function priceDetailOf(carId) {
  return cartStore.getPriceDetail(carId)
}
// 展开/折叠某车的价格明细
function toggleItemDetail(carId) {
  const idx = expandedItems.value.indexOf(carId)
  if (idx > -1) {
    expandedItems.value.splice(idx, 1)
  } else {
    expandedItems.value.push(carId)
  }
}

// 必填校验规则
const rules = {
  cityId: [{ required: true, message: '请选择取车城市', trigger: 'change' }],
  store: [{ required: true, message: '请选择取车门店', trigger: 'change' }],
  name: [{ required: true, message: '请填写联系人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请填写联系电话', trigger: 'blur' },
    { validator: (rule, value, cb) => validators.isPhone(value) ? cb() : cb(new Error('请输入正确的手机号')), trigger: 'blur' }
  ]
}

// 城市/门店列表：分别从 customer_city、customer_store 拉取，通过 cityId 关联
const cityList = ref([])
const storeList = ref([])
// 当前城市下可选门店（按 store.cityId === form.cityId 过滤）
const availableStores = computed(() =>
  storeList.value.filter((s) => form.cityId && s.cityId === form.cityId)
)

// ============ 优惠券（v3 支持多张可叠加券）============
// coupons 列表：getUsableCouponsApi 返回的 member_coupon 列表，每项 id 为用户券实例ID
// 字段：id(member_coupon.id) / couponId / couponName / couponType / couponValue / minAmount / discountCap / applyScope / stackable / status / expireTime
const coupons = ref([])
// 选中的优惠券对象列表（基于 form.couponUserIds）
const selectedCoupons = computed(() =>
  coupons.value.filter((c) => form.couponUserIds.includes(c.id))
)
// 当前选中券的展示文案（多张用顿号分隔）
const selectedCouponLabel = computed(() => {
  if (!selectedCoupons.value.length) return ''
  return selectedCoupons.value.map((c) => {
    const name = c.couponName || c.name || '优惠券'
    const val = couponFaceValue(c)
    return `${name}（${val}）`
  }).join('、')
})

// 优惠券面额展示
function couponFaceValue(c) {
  if (!c) return ''
  const type = c.couponType || c.type
  const v = Number(c.couponValue ?? c.value ?? 0)
  if (type === 'discount') {
    const t = v * 10
    return `${Number.isInteger(t) ? t : t.toFixed(1)}折`
  }
  if (type === 'deduction' || type === 'reduction') return `减￥${moneyUtil.format(v)}`
  if (type === 'duration') return `免${v || 1}天`
  return '优惠'
}

// 优惠券是否真正可用（门槛校验，避免选了不可用的券）
function isCouponUsable(c) {
  if (!c) return false
  const rent = cartStore.totalAmount
  return moneyUtil.calcCouponDiscount(rent, normalizeCoupon(c)) > 0 || (c.couponType === 'duration')
}

// 将 member_coupon 字段归一化为 coupon 模板字段（供 moneyUtil.calcCouponDiscount 使用）
function normalizeCoupon(c) {
  return {
    type: c.couponType || c.type,
    value: c.couponValue ?? c.value,
    minAmount: c.minAmount,
    discountCap: c.discountCap
  }
}

// 判断某张券在当前多选场景下是否被禁用（不可点击）
// 规则：
//   - 不可用（门槛/范围不满足）→ 禁用
//   - 已选中的券始终可点击（用于取消选中）
//   - 未选中时：若当前已选中有不可叠加券，或当前已选中有券且该券 stackable≠1，则禁用
function isCouponDisabled(c) {
  if (!isCouponUsable(c)) return true
  if (isSelected(c)) return false // 已选中的可点击取消
  // 未选中时校验叠加规则
  if (form.couponUserIds.length === 0) return false
  // 已有选中券：要新增必须当前券可叠加且已选券全部可叠加，且当前券不是时长券
  if ((c.couponType || c.type) === 'duration') return true
  if (c.stackable !== 1) return true
  // 已选券中若存在不可叠加券或时长券，则不能再选
  for (const id of form.couponUserIds) {
    const sc = coupons.value.find((x) => x.id === id)
    if (!sc) continue
    if ((sc.couponType || sc.type) === 'duration') return true
    if (sc.stackable !== 1) return true
  }
  return false
}

// 是否选中
function isSelected(c) {
  return form.couponUserIds.includes(c.id)
}

// 切换选中/取消选中（带叠加规则校验）
function toggleCoupon(c) {
  if (isCouponDisabled(c)) {
    if (!isCouponUsable(c)) {
      ElMessage.warning('该优惠券不满足使用条件')
    } else {
      ElMessage.warning('该优惠券不可与已选优惠券叠加使用')
    }
    return
  }
  const idx = form.couponUserIds.indexOf(c.id)
  if (idx > -1) {
    form.couponUserIds.splice(idx, 1)
  } else {
    form.couponUserIds.push(c.id)
  }
}

// 优惠券抵扣金额（v3 批量叠加算法，与后端 CouponService.calculateDiscountForOrderBatch 对齐）
const couponDiscount = computed(() => {
  if (!form.couponUserIds.length) return 0
  const selected = selectedCoupons.value
  if (!selected.length) return 0
  const rent = cartStore.totalAmount
  // 过滤掉时长券（不抵扣金额）
  const amountCoupons = selected.filter((c) => (c.couponType || c.type) !== 'duration')
  if (!amountCoupons.length) return 0
  return moneyUtil.calcCouponDiscountBatch(rent, amountCoupons.map(normalizeCoupon))
})
const finalTotal = computed(() => Math.max(0, cartStore.grandTotal - couponDiscount.value))

function onCityChange(cityId) {
  // 同步城市名（订单 city 字段存名称，与后端 RentalOrder 一致）
  const c = cityList.value.find((x) => x.id === cityId)
  form.city = c?.name || ''
  form.store = ''
}

watch(() => userStore.user, (u) => {
  if (u) {
    if (!form.name) form.name = u.nickname || u.realName || ''
    if (!form.phone) form.phone = u.phone || ''
  }
}, { immediate: true })

// 加载可用优惠券（按首车 + 总金额查询后端可用券列表）
async function loadCoupons() {
  if (!cartStore.selectedCount) {
    coupons.value = []
    return
  }
  // 多车下单场景简化：用首辆车 carId 和购物车总租金查询
  const firstItem = cartStore.selectedItems[0]
  try {
    const list = await getUsableCouponsApi({
      carId: firstItem?.carId,
      amount: cartStore.totalAmount
    })
    coupons.value = list || []
  } catch (e) {
    console.error('可用优惠券加载失败', e)
    coupons.value = []
  }
}

onMounted(async () => {
  try {
    const [citiesRes, storesRes] = await Promise.all([
      getCitiesApi(),
      getStoresApi(),
      loadCoupons(),
      // 确保进入结算页时价格明细已加载（覆盖直接从详情页跳转的场景）
      cartStore.refreshPrices()
    ])
    cityList.value = citiesRes || []
    storeList.value = storesRes || []
    // 有可用优惠券且用户未选择时，弹窗提醒使用，并自动预选最优优惠券
    if (coupons.value.length && !form.couponUserIds.length) {
      const best = pickBestCoupon()
      if (best) {
        form.couponUserIds = [best.id]
        couponDialogVisible.value = true
      }
    }
  } catch (e) {
    console.error('门店/优惠券加载失败', e)
  }
})

// 选择最优优惠券（抵扣金额最高，时长券优先级最低）
function pickBestCoupon() {
  if (!coupons.value.length) return null
  const rent = cartStore.totalAmount
  let best = null
  let bestDiscount = 0
  for (const c of coupons.value) {
    const type = c.couponType || c.type
    // 时长券不参与金额抵扣对比
    if (type === 'duration') continue
    const d = moneyUtil.calcCouponDiscount(rent, normalizeCoupon(c))
    if (d > bestDiscount) {
      bestDiscount = d
      best = c
    }
  }
  // 若无金额抵扣券，回退选第一张时长券
  if (!best && coupons.value.length) {
    best = coupons.value.find((c) => (c.couponType || c.type) === 'duration') || null
  }
  return best
}

// 优惠券弹窗操作
function openCouponDialog() {
  couponDialogVisible.value = true
}
function clearCoupon() {
  form.couponUserIds = []
}
function skipCoupon() {
  form.couponUserIds = []
  couponDialogVisible.value = false
}
// 立即使用：确认当前选中券并关闭弹窗
function useCouponNow() {
  if (!form.couponUserIds.length) {
    const best = pickBestCoupon()
    if (best == null) {
      ElMessage.warning('暂无可用优惠券')
      return
    }
    form.couponUserIds = [best.id]
  }
  couponDialogVisible.value = false
  ElMessage.success('优惠券使用成功')
}

async function submitOrder() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  if (!cartStore.selectedCount) {
    return
  }
  // 守卫：价格未加载完成不允许提交，避免前端展示与后端下单价格不一致
  if (cartStore.priceLoading) {
    ElMessage.warning('价格计算中，请稍候')
    return
  }
  if (!cartStore.priceDetails.length) {
    ElMessage.warning('价格加载失败，请刷新重试')
    return
  }

  submitting.value = true
  let res
  try {
    // v3: 下单传 couponUserIds（member_coupon.id 列表），后端负责批量锁定+叠加计算+回写
    // 价格由后端 PriceService 重新计算（与前端展示一致），避免篡改
    res = await createOrderApi({ ...form, items: cartStore.selectedItems })
  } catch (e) {
    console.error('下单失败', e)
    submitting.value = false
    return
  }
  ElMessage.success('下单成功')
  // 订单已创建成功，清空购物车失败不应阻塞跳转
  try {
    // 仅清空已选中的商品（已生成订单的）
    await cartStore.clearSelected()
  } catch (e) {
    console.error('清理已下单商品失败', e)
  }
  router.push(`/orders/${res.id}`)
  submitting.value = false
}
</script>

<style lang="scss" scoped>
.checkout-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: $space-xl;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.order-item {
  display: flex;
  gap: $space-base;
  padding: $space-base 0;
  border-bottom: 1px solid $color-divider;
  .item-img { width: 120px; height: 80px; border-radius: $radius-none; object-fit: cover; }
  .item-info {
    flex: 1;
    min-width: 0;
    h3 { font-size: $font-size-base; font-weight: $font-weight-medium; margin-bottom: $space-xs; }
    .item-date, .item-price { font-size: $font-size-sm; color: $color-text-secondary; }
    .item-detail-summary {
      margin: $space-xs 0;
      display: flex;
      gap: $space-xs;
      flex-wrap: wrap;
      .badge {
        font-size: $font-size-xs;
        padding: 1px 8px;
        border-radius: $radius-none;
        font-weight: $font-weight-medium;
      }
      .badge-discount { background: rgba(103, 194, 58, 0.12); color: $color-success; }
      .badge-holiday { background: rgba(230, 162, 60, 0.15); color: #e6a23c; }
    }
    .detail-toggle {
      padding: 0;
      height: auto;
      font-size: $font-size-xs;
      color: var(--lux-primary-text);
      :deep(.el-icon) { margin-left: 2px; transition: transform $transition-fast; }
      .toggle-icon.expanded { transform: rotate(180deg); }
    }
    .item-price-detail {
      margin-top: $space-sm;
      padding: $space-sm $space-base;
      background: $color-bg-gray;
      border-left: 2px solid var(--lux-primary-text);
      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: $font-size-xs;
        padding: 4px 0;
        color: $color-text-secondary;
        .discount-text { color: $color-success; font-weight: $font-weight-medium; }
      }
      .detail-total {
        margin-top: 4px;
        padding-top: $space-xs;
        border-top: 1px dashed $color-border;
        color: var(--lux-primary-text);
        font-weight: $font-weight-medium;
        font-size: $font-size-sm;
      }
    }
  }
  .item-amount { font-weight: $font-weight-medium; color: var(--lux-primary-text); }
}

// 价格提示
.price-tip {
  margin-top: $space-sm;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  text-align: center;
}

.checkout-form {
  margin-top: $space-xl;
  .form-title { font-size: $font-size-md; font-weight: $font-weight-medium; margin-bottom: $space-base; }
}

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
  &.discount {
    color: $color-danger;
  }
  &.total { font-size: $font-size-lg; font-weight: $font-weight-medium; color: var(--lux-primary-text); }
}
.save-tip {
  margin-top: $space-xs;
  font-size: $font-size-xs;
  color: $color-danger;
  text-align: right;
}
.divider { height: 1px; background: $color-border; margin: $space-base 0; }
.submit-btn { width: 100%; margin-top: $space-base; }

// 优惠券选择入口（form-item 内）
.coupon-pick-row {
  width: 100%;
}
.coupon-pick-current {
  display: flex;
  align-items: center;
  gap: $space-sm;
  padding: $space-sm $space-base;
  background: rgba(218, 41, 28, 0.06);
  border: 1px solid var(--lux-primary-text);
  border-radius: $radius-none;
  .cp-label {
    flex: 1;
    font-size: $font-size-sm;
    color: var(--lux-primary-text);
    font-weight: $font-weight-medium;
  }
}
.coupon-pick-empty {
  width: 100%;
  justify-content: space-between;
  .cp-count {
    font-size: $font-size-xs;
    color: var(--lux-primary-text);
    margin-left: $space-xs;
  }
}

// 优惠券弹窗
.coupon-dialog-body {
  .coupon-tip {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $space-base;
  }
}
.coupon-pick-list {
  display: flex;
  flex-direction: column;
  gap: $space-base;
  max-height: 480px;
  overflow-y: auto;
  padding-right: $space-xs;
}
.coupon-pick-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: $radius-none;
  transition: border-color $transition-fast;
  &:hover { border-color: $color-primary-light; }
  &.active { border-color: var(--lux-primary-text); }
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover { border-color: transparent; }
  }
  // CouponCard 占满容器
  :deep(.coupon-card) {
    border: none;
    &:hover { transform: none; border-color: transparent; }
  }
  // 让出右上角选择框空间，避免长券名被 .cp-check 压住
  :deep(.coupon-header) {
    padding-right: 32px;
  }
  .cp-check {
    position: absolute;
    top: $space-sm;
    right: $space-sm;
    width: 24px;
    height: 24px;
    border-radius: $radius-full;
    background: var(--lux-primary-text);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cp-stackable-tag {
    position: absolute;
    bottom: $space-sm;
    right: $space-sm;
    font-size: $font-size-xs;
    color: #ff6b35;
    border: 1px solid #ff6b35;
    border-radius: $radius-full;
    padding: 1px 8px;
    background: rgba(255, 107, 53, 0.08);
  }
}
</style>
