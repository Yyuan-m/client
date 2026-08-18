<template>
  <div class="vehicle-detail-page section">
    <div class="container">
      <PageSkeleton v-if="loading" type="detail" />
      <template v-else-if="car">
        <!-- 图片预览 -->
        <div class="detail-gallery fade-in-up">
          <div class="main-image" @click="preview(0)">
            <img :src="resolveAdminImage(car.cover)" :alt="car.name" />
          </div>
          <div class="thumb-list">
            <div v-for="(img, i) in car.imageList" :key="i" class="thumb" @click="preview(i)">
              <img :src="resolveAdminImage(img)" :alt="`${car.name} ${i + 1}`" />
            </div>
          </div>
        </div>

        <!-- 核心信息 -->
        <div class="detail-info fade-in-up">
          <div class="info-left">
            <h1 class="detail-name">
              {{ car.name }}
              <el-tag :type="statusTagType" size="small" effect="dark" round class="status-badge">{{ car.statusName }}</el-tag>
            </h1>
            <div class="detail-tags">
              <el-tag v-if="car.isHot" type="danger" size="small" effect="dark" round>热门</el-tag>
              <el-tag v-if="car.isRecommend" type="warning" size="small" effect="dark" round>推荐</el-tag>
              <el-tag v-for="tag in car.tagList?.slice(0, 3)" :key="tag" size="small" effect="plain" round>{{ tag }}</el-tag>
            </div>
            <div class="detail-meta">
              <span><el-icon><User /></el-icon>{{ car.seats }}座</span>
              <span><el-icon><Lightning /></el-icon>{{ car.displacement }}</span>
              <span v-if="car.year"><el-icon><Calendar /></el-icon>{{ car.year }}款</span>
              <span><el-icon><Star /></el-icon>{{ car.rating }}分</span>
              <span><el-icon><TrendCharts /></el-icon>已租{{ car.rentalCount }}次</span>
            </div>
            <p class="detail-desc">{{ car.description }}</p>

            <!-- 参数配置 -->
            <div class="config-sections">
              <!-- 基本参数 -->
              <div class="config-block">
                <h3 class="config-title"><el-icon><InfoFilled /></el-icon>基本参数</h3>
                <div class="config-table">
                  <div class="config-row"><span>车辆编号</span><span>#{{ String(car.id).padStart(6, '0') }}</span></div>
                  <div class="config-row"><span>品牌</span><span>{{ car.brand }}</span></div>
                  <div class="config-row"><span>车系</span><span>{{ car.series }}</span></div>
                  <div class="config-row"><span>车型分类</span><span>{{ car.typeName }}</span></div>
                  <div class="config-row"><span>座位数</span><span>{{ car.seats }}座</span></div>
                  <div class="config-row"><span>车身颜色</span><span>{{ car.color }}</span></div>
                  <div class="config-row" v-if="car.year"><span>年款</span><span>{{ car.year }}款</span></div>
                  <div class="config-row"><span>行驶里程</span><span>{{ car.mileage }} km</span></div>
                </div>
              </div>

              <!-- 动力配置 -->
              <div class="config-block">
                <h3 class="config-title"><el-icon><Lightning /></el-icon>动力配置</h3>
                <div class="config-table">
                  <div class="config-row"><span>动力</span><span>{{ car.config.power }}</span></div>
                  <div class="config-row"><span>排量</span><span>{{ car.displacement }}</span></div>
                  <div class="config-row"><span>变速箱</span><span>{{ car.config.transmission }}</span></div>
                  <div class="config-row"><span>燃料类型</span><span>{{ car.config.fuel }}</span></div>
                  <div v-if="car.config.rangeKm && car.config.rangeKm !== '-'" class="config-row"><span>续航里程</span><span>{{ car.config.rangeKm }}</span></div>
                </div>
              </div>

              <!-- 内饰与娱乐 -->
              <div class="config-block">
                <h3 class="config-title"><el-icon><House /></el-icon>内饰与娱乐</h3>
                <div class="config-table">
                  <div class="config-row"><span>内饰材质</span><span>{{ car.config.interior }}</span></div>
                  <div class="config-row"><span>娱乐系统</span><span>{{ car.config.entertainment }}</span></div>
                </div>
              </div>

              <!-- 安全配置 -->
              <div class="config-block">
                <h3 class="config-title"><el-icon><CircleCheckFilled /></el-icon>安全配置</h3>
                <div class="config-table">
                  <div class="config-row config-row-full"><span>安全装备</span><span>{{ car.config.safety }}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-right">
            <div class="rent-card">
              <div class="rent-price">
                <!-- 有券后价：原价划线 + 券后价突出（标注起步天数） -->
                <template v-if="hasCouponPrice">
                  <div class="price-original-line">
                    <span class="unit">￥</span>
                    <span class="amount-original">{{ car.dailyPrice }}</span>
                    <span class="unit">/天</span>
                  </div>
                  <div class="price-coupon-line">
                    <span class="coupon-tag">券后价</span>
                    <span class="price-main">
                      <span class="unit">￥</span>
                      <span class="amount">{{ car.couponPrice }}</span>
                      <span class="unit">/天</span>
                    </span>
                    <span v-if="effectiveMinDays >= 1" class="coupon-min-days">{{ effectiveMinDays }}天起</span>
                  </div>
                  <div class="coupon-hint">实际抵扣以结算页为准</div>
                </template>
                <!-- 无券后价：仅显示原价 -->
                <template v-else>
                  <span class="unit">￥</span>
                  <span class="amount">{{ car.dailyPrice }}</span>
                  <span class="unit">/天</span>
                  <span v-if="effectiveMinDays >= 1" class="coupon-min-days standalone">{{ effectiveMinDays }}天起</span>
                </template>
              </div>
              <!-- 长租折扣提示 -->
              <div v-if="discountTip" class="discount-tip">{{ discountTip }}</div>
              <!-- 节假日溢价提示（未选日期时也能看到溢价规则） -->
              <div v-if="holidayTip" class="holiday-tip">{{ holidayTip }}</div>
              <!-- 已出租/已预约车辆的可租提示 -->
              <div v-if="rentedNotice" class="rented-tip">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ rentedNotice }}</span>
              </div>
              <DateRentPicker v-model="dateRange" :min-days="effectiveMinDays" :max-days="20" :min-date="car.availableDate" @change="onDateChange" />
              <div v-if="rentDays > 0" class="rent-summary">
                <!-- 价格加载中 -->
                <div v-if="priceLoading" class="price-loading">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>价格计算中…</span>
                </div>
                <!-- 价格明细（来自后端 PriceService） -->
                <template v-else-if="priceDetail">
                  <div class="summary-row" v-if="priceDetail.holidayDays > 0">
                    <span>假日/周末天数</span>
                    <span class="holiday-text">{{ priceDetail.holidayDays }} 天 × ￥{{ moneyUtil.format(car.dailyPrice) }} × {{ Number(priceDetail.holidaySurcharge).toFixed(2) }}</span>
                  </div>
                  <div class="summary-row"><span>工作日天数</span><span>{{ priceDetail.normalDays }} 天 × ￥{{ moneyUtil.format(car.dailyPrice) }}</span></div>
                  <div class="summary-row" v-if="priceDetail.holidayDays > 0">
                    <span>假日溢价</span>
                    <span class="holiday-text">+￥{{ moneyUtil.format(priceDetail.holidaySurchargeAmount) }}</span>
                  </div>
                  <div class="summary-row"><span>小计（折扣前）</span><span>￥{{ moneyUtil.format(priceDetail.subtotal) }}</span></div>
                  <div class="summary-row" v-if="Number(priceDetail.discountAmount) > 0">
                    <span>{{ priceDetail.durationTierName }}折扣</span>
                    <span class="discount-text">-￥{{ moneyUtil.format(priceDetail.discountAmount) }}</span>
                  </div>
                  <div class="summary-row"><span>租金（{{ rentDays }}天）</span><span>￥{{ moneyUtil.format(priceDetail.rentAmount) }}</span></div>
                  <div class="summary-row total">
                    <span>应付合计</span>
                    <span>￥{{ moneyUtil.format(priceDetail.totalAmount) }}</span>
                  </div>
                </template>
                <!-- 兜底（计算失败） -->
                <div v-else class="summary-row total"><span>应付合计</span><span>—</span></div>
              </div>
              <el-button type="primary" size="large" class="rent-btn" :disabled="priceLoading" @click="goCheckout">{{ rentButtonText }}</el-button>
              <button class="add-cart-btn" :disabled="priceLoading" @click="addToCart">
                <el-icon><ShoppingCart /></el-icon>{{ isRented ? '预约租车' : '加入购物车' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 车辆素材分类照片 -->
        <div class="material-gallery fade-in-up" v-if="imageGroups.length">
          <h3 class="gallery-title"><el-icon><PictureFilled /></el-icon>车辆素材</h3>
          <div v-for="group in imageGroups" :key="group.category" class="image-group">
            <h4 class="group-title">
              {{ group.category }}
              <span class="group-count">{{ group.images.length }}张</span>
            </h4>
            <div class="image-list">
              <div
                v-for="(img, i) in group.images"
                :key="i"
                class="material-image"
                @click="previewMaterial(group.images, i)"
              >
                <img :src="resolveAdminImage(img)" :alt="`${car.name} ${group.category} ${i + 1}`" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <EmptyTips v-else text="车辆信息不存在" show-action action-text="返回列表" @action="$router.push('/vehicles')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, WarningFilled, PictureFilled } from '@element-plus/icons-vue'
import PageSkeleton from '@/components/PageSkeleton/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import DateRentPicker from '@/components/DateRentPicker/index.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { getCarDetailApi, getCarImagesApi } from '@/api/modules/car'
import { calcCarPriceApi } from '@/api/modules/price'
import { useAppStore, useUserStore, useCartStore } from '@/stores'
import { moneyUtil } from '@/utils'
import { resolveAdminImage } from '@/utils/image'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const cartStore = useCartStore()
const { observe } = useScrollReveal()

const loading = ref(true)
const car = ref(null)
const dateRange = ref([])
const rentDays = ref(0)

// 价格明细（来自后端 PriceService，确保与下单一致）
const priceDetail = ref(null)
const priceLoading = ref(false)

// 车辆素材图片（按分类分组，来自 car_rental.car_image 表）
const imageGroups = ref([])

// 券后价：登录且有可用优惠券时由后端返回（仅作起步参考，实际抵扣以结算页为准）
const hasCouponPrice = computed(() => {
  const cp = car.value?.couponPrice
  const dp = car.value?.dailyPrice
  return cp != null && Number(cp) > 0 && Number(cp) < Number(dp)
})

// 实际最小起租天数（车辆级 minRentDays 字段，至少为 1）
const effectiveMinDays = computed(() => {
  if (!car.value) return 1
  return Math.max(1, Number(car.value.minRentDays) || 1)
})

// 长租折扣提示（基于车辆字段展示，未选日期时也能看到）
const discountTip = computed(() => {
  if (!car.value) return ''
  const weekly = Number(car.value.weeklyDiscount || 1)
  const monthly = Number(car.value.monthlyDiscount || 1)
  const parts = []
  if (weekly < 1) parts.push(`7天及以上 ${weeklyToText(weekly)}`)
  if (monthly < 1) parts.push(`30天及以上 ${weeklyToText(monthly)}`)
  return parts.join(' · ')
})
function weeklyToText(factor) {
  const t = factor * 10
  return `${Number.isInteger(t) ? t : t.toFixed(1)}折`
}

// 节假日溢价提示（未选日期时也能看到溢价规则）
const holidayTip = computed(() => {
  if (!car.value) return ''
  const surcharge = Number(car.value.holidaySurcharge || 1)
  if (surcharge <= 1) return ''
  const percent = Math.round((surcharge - 1) * 100)
  return `假日/周末 ×${surcharge.toFixed(2)}（加价 ${percent}%）`
})

// 车辆状态徽章颜色：available=可租(绿)、rented=已出租(红)、其他=维修中(灰)
const statusTagType = computed(() => {
  const s = car.value?.status
  if (s === 'available') return 'success'
  if (s === 'rented') return 'danger'
  return 'info'
})

// 是否已出租/已预约（status === rented 且存在未完成订单）
const isRented = computed(() => car.value?.status === 'rented' || !!car.value?.availableDate)

// 已出租车辆的可租提示文案
const rentedNotice = computed(() => {
  const c = car.value
  if (!c) return ''
  // 仅在有占用订单（availableDate 存在）时提示；纯 status=rented 但无订单数据时不展示
  if (!c.availableDate) return ''
  return `该车已被预约，最早可于 ${c.availableDate} 起租（含 2 天整备期）`
})

// 主按钮文案：已出租 → 预约租车，否则 → 立即租车
const rentButtonText = computed(() => isRented.value ? '预约租车' : '立即租车')

function onDateChange({ days, valid }) {
  rentDays.value = valid ? days : 0
}

// 日期变化时重新拉取价格
watch([() => car.value?.id, rentDays, dateRange], async () => {
  if (!car.value || rentDays.value === 0 || !dateRange.value?.length) {
    priceDetail.value = null
    return
  }
  priceLoading.value = true
  try {
    priceDetail.value = await calcCarPriceApi({
      carId: car.value.id,
      startDate: dateRange.value[0],
      endDate: dateRange.value[1]
    })
  } catch (e) {
    console.error('价格计算失败', e)
    priceDetail.value = null
  } finally {
    priceLoading.value = false
  }
}, { immediate: false })

function preview(index) {
  appStore.openImagePreview(car.value.imageList.map(resolveAdminImage), index)
}

// 预览某分类下的素材图片
function previewMaterial(images, index) {
  if (!images || !images.length) return
  appStore.openImagePreview(images.map(resolveAdminImage), index)
}

async function goCheckout() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再租车')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (rentDays.value === 0) {
    ElMessage.warning('请选择租车日期')
    return
  }
  // 已出租车辆：校验起租日期不早于最早可租日期
  if (!checkAvailableDate()) return
  // 等待价格加载完成，确保下单价格已计算
  if (priceLoading.value) {
    ElMessage.warning('价格计算中，请稍候')
    return
  }
  // 加入购物车后跳转结算，await 确保购物车数据已同步到后端
  const ok = await cartStore.addItem(car.value, dateRange.value[0], dateRange.value[1], rentDays.value)
  if (ok) router.push('/checkout')
}

async function addToCart() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (rentDays.value === 0) {
    if (effectiveMinDays.value > 1) {
      ElMessage.warning(`请选择租车日期，需至少租 ${effectiveMinDays.value} 天起`)
    } else {
      ElMessage.warning('请选择租车日期')
    }
    return
  }
  // 已出租车辆：校验起租日期不早于最早可租日期
  if (!checkAvailableDate()) return
  if (priceLoading.value) {
    ElMessage.warning('价格计算中，请稍候')
    return
  }
  await cartStore.addItem(car.value, dateRange.value[0], dateRange.value[1], rentDays.value)
  ElMessage.success('已加入购物车')
}

// 已出租车辆起租日期校验：用户手动输入可能绕过 disabledDate，需在下单前再次校验
function checkAvailableDate() {
  const available = car.value?.availableDate
  if (!available) return true
  const start = dateRange.value?.[0]
  if (!start) return true
  if (start < available) {
    ElMessage.warning(`该车最早可于 ${available} 起租，请重新选择日期`)
    return false
  }
  return true
}

async function loadDetail() {
  loading.value = true
  imageGroups.value = []
  try {
    const [detail, groups] = await Promise.all([
      getCarDetailApi(route.params.id),
      getCarImagesApi(route.params.id).catch(e => {
        console.error('车辆素材图片加载失败', e)
        return []
      })
    ])
    car.value = detail
    imageGroups.value = groups || []
  } catch (e) {
    console.error('车辆详情加载失败', e)
  } finally {
    loading.value = false
    // 数据加载完成后重新观察 fade-in-up 元素，修复条件渲染导致的渐显失效
    nextTick(() => observe())
  }
}

onMounted(loadDetail)
</script>

<style lang="scss" scoped>
.detail-gallery {
  margin-bottom: $space-xl;
}
.main-image {
  border-radius: $radius-none;
  overflow: hidden;
  margin-bottom: $space-base;
  cursor: pointer;
  img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
}
.thumb-list {
  display: flex;
  gap: $space-sm;
  .thumb {
    width: 100px; height: 70px;
    border-radius: $radius-none;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color $transition-fast;
    &:hover { border-color: $color-primary; }
    img { width: 100%; height: 100%; object-fit: cover; }
  }
}

.detail-info {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: $space-xl;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.detail-name {
  font-size: $font-size-2xl;
  font-weight: $font-weight-medium;
  margin-bottom: $space-sm;
  display: flex;
  align-items: center;
  gap: $space-sm;
  .status-badge {
    font-size: $font-size-xs;
    flex-shrink: 0;
  }
}

.detail-tags {
  display: flex; gap: $space-xs; flex-wrap: wrap;
  margin-bottom: $space-base;
}

.detail-meta {
  display: flex; gap: $space-md; flex-wrap: wrap;
  margin-bottom: $space-base;
  span { font-size: $font-size-sm; color: $color-text-secondary; display: flex; align-items: center; gap: 4px; }
}

.detail-desc {
  font-size: $font-size-base;
  color: $color-text-secondary;
  line-height: $line-height-loose;
  margin-bottom: $space-lg;
}

// ---------- 参数配置区 ----------
.config-sections {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-md;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.config-block {
  background: $color-bg-gray;
  border-radius: $radius-none;
  padding: $space-base;
}

.config-title {
  display: flex;
  align-items: center;
  gap: $space-xs;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  margin-bottom: $space-sm;
  color: $color-text;
  .el-icon { color: var(--lux-primary-text); }
}

.config-table {
  .config-row {
    display: flex;
    justify-content: space-between;
    padding: $space-sm 0;
    border-bottom: 1px solid $color-divider;
    font-size: $font-size-sm;
    &:last-child { border-bottom: none; }
    span:first-child { color: $color-text-secondary; }
    span:last-child { color: $color-text; font-weight: $font-weight-medium; text-align: right; }
    &.config-row-full {
      flex-direction: column;
      gap: $space-xs;
      span:last-child { text-align: left; line-height: $line-height-loose; }
    }
  }
}

// ---------- 租车卡片 ----------
.rent-card {
  background: $color-bg-gray;
  border-radius: $radius-none;
  padding: $space-lg;
  position: sticky;
  top: $header-height + $space-base;
}

.rent-price {
  color: var(--lux-primary-text);
  margin-bottom: $space-base;
  .unit { font-size: $font-size-sm; }
  .amount { font-size: $font-size-3xl; font-weight: $font-weight-medium; }
  // 券后价样式
  .price-original-line {
    display: flex;
    align-items: baseline;
    gap: 1px;
    color: $color-text-tertiary;
    .amount-original {
      font-size: $font-size-md;
      text-decoration: line-through;
      text-decoration-color: $color-text-tertiary;
    }
  }
  .price-coupon-line {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 2px 4px;
    margin-top: 2px;
    .coupon-tag {
      font-size: 10px;
      font-weight: $font-weight-bold;
      color: #fff;
      background: var(--lux-primary-text);
      padding: 1px 6px;
      border-radius: 2px;
      letter-spacing: 0.5px;
      line-height: 1.4;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .price-main {
      display: inline-flex;
      align-items: baseline;
      gap: 1px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .coupon-min-days {
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      font-weight: $font-weight-bold;
      color: #fff;
      background: $color-warning;
      padding: 2px 8px;
      border-radius: 2px;
      letter-spacing: 0.5px;
      line-height: 1.4;
      white-space: nowrap;
      flex-shrink: 0;
      // 无券后价时独立展示，加左外边距与价格分隔
      &.standalone { margin-left: 6px; }
    }
  }
  .coupon-hint {
    font-size: 10px;
    color: $color-text-tertiary;
    margin-top: 2px;
  }
}

.rent-summary {
  margin-top: $space-base;
  padding-top: $space-base;
  border-top: 1px solid $color-border;
  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: $font-size-sm;
    padding: $space-xs 0;
    border-bottom: 1px solid $color-divider;
    &:last-child { border-bottom: none; }
    &.original {
      color: $color-text-tertiary;
      text-decoration: line-through;
    }
    &.discount {
      color: $color-danger;
    }
    &.total { font-weight: $font-weight-medium; font-size: $font-size-base; color: var(--lux-primary-text); }
    .holiday-text { color: #e6a23c; font-weight: $font-weight-medium; }
    .discount-text { color: $color-success; font-weight: $font-weight-medium; }
  }
  .price-loading {
    display: flex;
    align-items: center;
    gap: $space-xs;
    justify-content: center;
    padding: $space-base 0;
    color: $color-text-secondary;
    font-size: $font-size-sm;
    .el-icon.is-loading { animation: rotating 1.5s linear infinite; }
  }
}

// 长租折扣提示
.discount-tip {
  margin-top: $space-xs;
  margin-bottom: $space-sm;
  font-size: $font-size-xs;
  color: var(--lux-primary-text);
  background: rgba(218, 41, 28, 0.08);
  padding: $space-xs $space-sm;
  border-left: 2px solid var(--lux-primary-text);
  letter-spacing: 0.3px;
}

// 节假日溢价提示
.holiday-tip {
  margin-bottom: $space-sm;
  font-size: $font-size-xs;
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.1);
  padding: $space-xs $space-sm;
  border-left: 2px solid #e6a23c;
  letter-spacing: 0.3px;
}

// 已出租/已预约车辆可租提示
.rented-tip {
  display: flex;
  align-items: center;
  gap: $space-xs;
  margin-bottom: $space-sm;
  font-size: $font-size-xs;
  color: var(--lux-primary-text);
  background: rgba(218, 41, 28, 0.08);
  padding: $space-xs $space-sm;
  border-left: 2px solid var(--lux-primary-text);
  letter-spacing: 0.3px;
  .el-icon { line-height: 1; flex-shrink: 0; }
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rent-btn { width: 100%; margin-top: $space-base; }

.add-cart-btn {
  width: 100%;
  margin-top: $space-sm;
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  background: transparent;
  color: $color-text;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  cursor: pointer;
  transition: all $transition-base;
  &:hover {
    border-color: $color-primary;
    color: var(--lux-primary-text);
  }
}

// ---------- 车辆素材分类照片 ----------
.material-gallery {
  margin-top: $space-xl;
  padding-top: $space-xl;
  border-top: 1px solid $color-divider;
}

.gallery-title {
  display: flex;
  align-items: center;
  gap: $space-xs;
  font-size: $font-size-xl;
  font-weight: $font-weight-medium;
  margin-bottom: $space-lg;
  color: $color-text;
  .el-icon { color: var(--lux-primary-text); }
}

.image-group {
  margin-bottom: $space-lg;
  &:last-child { margin-bottom: 0; }
}

.group-title {
  display: flex;
  align-items: center;
  gap: $space-sm;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  margin-bottom: $space-base;
  color: $color-text;
  padding-left: $space-sm;
  border-left: 3px solid var(--lux-primary-text);
  .group-count {
    font-size: $font-size-xs;
    font-weight: $font-weight-regular;
    color: $color-text-tertiary;
    letter-spacing: 0.5px;
  }
}

.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: $space-base;
  @include respond-to('sm') { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
}

.material-image {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  border-radius: $radius-none;
  cursor: pointer;
  background: $color-bg-gray-dark;
  border: 1px solid $color-border;
  transition: transform $transition-base, border-color $transition-base;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform $transition-slow;
  }
  &:hover {
    transform: translateY(-2px);
    border-color: $color-primary;
    // img { transform: scale(1.05); }
  }
}
</style>
