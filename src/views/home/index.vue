<template>
  <div class="home-page">
    <!-- 1. 顶部轮播 -->
    <section class="hero-carousel">
      <el-carousel
        ref="carouselRef"
        height="100vh"
        :autoplay="false"
        arrow="never"
        indicator-position="none"
        @change="onCarouselChange"
      >
        <el-carousel-item v-for="(item) in carousel" :key="item.id">
          <div class="carousel-item" :style="{ backgroundImage: `url(${resolveAdminImage(item.imageUrl)})` }">
            <div class="carousel-overlay"></div>
            <div class="carousel-content">
              <h1 class="carousel-title">{{ item.title }}</h1>
              <p class="carousel-desc">{{ item.description }}</p>
              <!-- <button class="btn-fill carousel-btn" @click="handleCarouselClick(item)">立即体验</button> -->
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>

      <!-- 自定义控制器：默认小圆点；鼠标移到任意圆点即切换并展开为时间条，按 5 秒动态填充进度；悬停期间暂停自动切换 -->
      <div v-if="carousel.length" class="carousel-indicators" @mouseleave="onIndicatorsLeave">
        <button
          v-for="(item, idx) in carousel"
          :key="item.id"
          class="carousel-dot"
          :class="{ 'is-active': idx === activeCarouselIndex, 'is-hover': idx === hoverDotIndex }"
          @mouseenter="onDotEnter(idx)"
          :aria-label="`切换到第 ${idx + 1} 张`"
        >
          <span class="dot-fill" :style="{ width: getDotFillWidth(idx) + '%' }"></span>
        </button>
      </div>

      <div class="scroll-hint">
        <span>向下滚动探索</span>
        <el-icon><ArrowDownBold /></el-icon>
      </div>
    </section>

    <!-- 1.5 我的订单（仅登录用户，租赁中 + 待评价） -->
    <section v-if="userStore.isLoggedIn" class="section my-orders fade-in-up">
      <div class="container">
        <div class="my-orders-head">
          <h2 class="section-title">我的订单</h2>
          <el-button type="primary" text @click="router.push('/orders')">全部订单 →</el-button>
        </div>
        <p class="section-subtitle">进行中的租赁与待评价订单</p>
      </div>
      <div v-if="activeOrders.length" class="orders-scroll-wrapper">
        <button v-show="canScrollLeftOrders" class="scroll-arrow scroll-arrow-left" @click="scrollOrders(-1)" aria-label="向左滚动">
          <el-icon :size="18"><ArrowLeftBold /></el-icon>
        </button>
        <div class="orders-scroll" ref="ordersScrollRef" @scroll="updateOrderScrollState">
          <div
            v-for="order in activeOrders"
            :key="order.id"
            class="my-order-card"
            @click="router.push(`/orders/${order.id}`)"
          >
            <div class="my-order-cover">
              <img :src="resolveAdminImage(order.carCover)" :alt="order.carName" />
              <span class="my-order-status" :class="order.status">
                {{ order.status === 'renting' ? '租赁中' : order.reviewStatusName }}
              </span>
            </div>
            <div class="my-order-info">
              <h3 class="my-order-name">{{ order.carName }}</h3>
              <p class="my-order-date">{{ order.startDate }} 至 {{ order.endDate }}</p>
              <p class="my-order-store">{{ order.store }}</p>
              <div class="my-order-actions">
                <el-button
                  v-if="order.reviewStatus === 'unreviewed'"
                  type="primary"
                  size="small"
                  @click.stop="openReviewDialog(order)"
                >去评价</el-button>
                <el-button v-else size="small" @click.stop="router.push(`/orders/${order.id}`)">查看详情</el-button>
              </div>
            </div>
          </div>
        </div>
        <button v-show="canScrollRightOrders" class="scroll-arrow scroll-arrow-right" @click="scrollOrders(1)" aria-label="向右滚动">
          <el-icon :size="18"><ArrowRightBold /></el-icon>
        </button>
      </div>
      <div v-else class="container">
        <EmptyTips text="暂无进行中的订单" show-action action-text="去租车" @action="router.push('/vehicles')" />
      </div>
    </section>

    <!-- 2. 品牌简介 -->
    <section class="section brand-intro fade-in-up">
      <div class="container brand-grid">
        <div class="brand-text">
          <h2 class="brand-heading">尊享出行<br />极致驾驶体验</h2>
          <p class="brand-desc">
            LUXURY CAR 专注高端汽车租赁服务，汇聚全球顶级品牌车型。
            严格车况准入、全保险保障、专属管家服务，为每一次出行保驾护航。
          </p>
          <div class="brand-stats">
            <div class="stat-item">
              <span class="stat-num">50+</span>
              <span class="stat-label">高端车型</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">10万+</span>
              <span class="stat-label">服务客户</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">4.9</span>
              <span class="stat-label">平均评分</span>
            </div>
          </div>
        </div>
        <div class="brand-image">
          <img :src="resolveClientImage(brandImg)" alt="豪华跑车" />
        </div>
      </div>
    </section>

    <!-- 3. 热门车型推荐 -->
    <section class="section hot-cars fade-in-up">
      <div class="container">
        <h2 class="section-title">热门车型推荐</h2>
        <p class="section-subtitle">精选人气车型，开启您的尊贵旅程</p>
      </div>
      <div class="cars-scroll-wrapper">
        <button v-show="canScrollLeft" class="scroll-arrow scroll-arrow-left" @click="scrollCars(-1)" aria-label="向左滚动">
          <el-icon :size="18"><ArrowLeftBold /></el-icon>
        </button>
        <div class="cars-scroll" ref="carsScrollRef" @scroll="updateScrollState">
          <CarCard
            v-for="car in hotCars"
            :key="car.id"
            :car="car"
            @rent="goCheckout"
          />
        </div>
        <button v-show="canScrollRight" class="scroll-arrow scroll-arrow-right" @click="scrollCars(1)" aria-label="向右滚动">
          <el-icon :size="18"><ArrowRightBold /></el-icon>
        </button>
      </div>
    </section>

    <!-- 4. 服务优势 -->
    <section class="section advantages fade-in-up">
      <div class="container">
        <h2 class="section-title">为什么选择我们</h2>
        <p class="section-subtitle">全方位保障，让您安心出行</p>
        <div class="adv-grid">
          <div v-for="item in advantages" :key="item.id" class="adv-card">
            <el-icon class="adv-icon" :size="40"><component :is="item.icon" /></el-icon>
            <h3 class="adv-title">{{ item.title }}</h3>
            <p class="adv-desc">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. 客户评价 -->
    <section class="section reviews fade-in-up">
      <div class="container">
        <h2 class="section-title">客户真实评价</h2>
        <p class="section-subtitle">超过 10 万客户的信赖之选</p>
      </div>
      <div class="reviews-scroll">
        <div v-for="review in reviews" :key="review.id" class="review-card">
          <div class="review-user">
            <el-avatar :size="40" :src="resolveClientImage(review.avatar) || undefined">
              {{ review.name ? review.name.charAt(0) : '' }}
            </el-avatar>
            <div>
              <p class="review-name">{{ review.name }}</p>
              <p class="review-meta">{{ review.carName }} · {{ review.date }}</p>
            </div>
          </div>
          <div class="review-stars">
            <el-icon v-for="n in review.rating" :key="n" class="star"><StarFilled /></el-icon>
          </div>
          <p
            ref="reviewContentRefs"
            class="review-content"
            :class="{ 'is-expanded': expandedReviewIds.has(review.id) }"
          >"{{ review.content }}"</p>
          <button
            v-if="clampedReviewIds.has(review.id)"
            class="review-toggle"
            @click="toggleReview(review.id)"
          >
            {{ expandedReviewIds.has(review.id) ? '收起' : '展开' }}
            <el-icon class="toggle-icon" :class="{ 'is-expanded': expandedReviewIds.has(review.id) }"><ArrowDownBold /></el-icon>
          </button>
          <div v-if="parseReviewImages(review.images).length" class="review-images">
            <img
              v-for="(img, i) in parseReviewImages(review.images)"
              :key="i"
              :src="resolveClientImage(img)"
              class="review-img"
              loading="lazy"
              @click="previewReviewImages(review.images, i)"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 6. 活动优惠券（横向滚动，hover 展开详情） -->
    <section id="coupons" class="section coupons fade-in-up">
      <div class="container">
        <h2 class="section-title">专享优惠</h2>
        <p class="section-subtitle">限时活动，立享租车优惠 · 悬停查看详情</p>
      </div>
      <div class="coupons-scroll-wrapper">
        <button v-show="canScrollLeftCoupons" class="scroll-arrow scroll-arrow-left" @click="scrollCoupons(-1)" aria-label="向左滚动">
          <el-icon :size="18"><ArrowLeftBold /></el-icon>
        </button>
        <div class="coupons-scroll" ref="couponsScrollRef" @scroll="updateCouponScrollState">
          <CouponCard
            v-for="coupon in activeCoupons"
            :key="coupon.id"
            :coupon="coupon"
            :compact="true"
            :show-action="true"
            :is-logged-in="userStore.isLoggedIn"
            :claimed="claimedCouponIds.includes(coupon.id)"
            :loading="claimingCouponId === coupon.id"
            @use="goVehicles"
            @claim="handleClaimCoupon"
            @login="goLogin"
          />
        </div>
        <button v-show="canScrollRightCoupons" class="scroll-arrow scroll-arrow-right" @click="scrollCoupons(1)" aria-label="向右滚动">
          <el-icon :size="18"><ArrowRightBold /></el-icon>
        </button>
      </div>
    </section>

    <!-- 7. 预约咨询 -->
    <section class="section appointment fade-in-up">
      <div class="container">
        <div class="appointment-card">
          <div class="appointment-left">
            <h2 class="appointment-title">预约咨询</h2>
            <p class="appointment-desc">留下您的信息，专属顾问将主动联系您</p>
            <div class="appointment-phone">
              <el-icon :size="24"><Phone /></el-icon>
              <div>
                <p class="phone-label">服务热线</p>
                <p class="phone-num">{{ config?.phone || '' }}</p>
              </div>
            </div>
          </div>
          <div class="appointment-right">
            <el-form :model="form" label-position="top" @submit.prevent="submitAppointment">
              <el-form-item label="姓名">
                <el-input v-model="form.name" placeholder="请输入您的姓名" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
              </el-form-item>
              <el-form-item label="意向车型">
                <el-select v-model="form.carType" placeholder="选择意向车型" style="width: 100%">
                  <el-option v-for="item in vehicleTypes" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
                </el-select>
              </el-form-item>
              <el-form-item label="取车日期">
                <el-date-picker v-model="form.date" type="date" placeholder="选择取车日期" style="width: 100%" value-format="YYYY-MM-DD" />
              </el-form-item>
              <el-button type="primary" size="large" @click="submitAppointment" :loading="submitting">提交预约</el-button>
            </el-form>
          </div>
        </div>
      </div>
    </section>

    <!-- 评价弹窗 -->
    <ReviewDialog
      v-model="reviewDialogVisible"
      :order-id="reviewDialogOrderId"
      @success="handleReviewSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import CarCard from '@/components/CarCard/index.vue'
import CouponCard from '@/components/CouponCard/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import ReviewDialog from '@/components/ReviewDialog/index.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useUserStore, useAppStore } from '@/stores'
import { useSystemConfig } from '@/composables/useSystemConfig'
import { getActiveCarouselApi } from '@/api/modules/carousel'
import { getHotCarsApi } from '@/api/modules/car'
import { getAvailableCouponsApi, getClaimedCouponIdsApi, claimCouponApi } from '@/api/modules/coupon'
import { getAdvantagesApi, getReviewsApi, getDictByTypeApi } from '@/api/modules/system'
import { submitFeedbackApi } from '@/api/modules/feedback'
import { getMyActiveOrdersApi } from '@/api/modules/order'
import { resolveAdminImage, resolveClientImage } from '@/utils/image'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const { config, loadConfig } = useSystemConfig()
useScrollReveal()

// 解析评价 images 字段（JSON 数组字符串 → URL 列表）
function parseReviewImages(imagesStr) {
  if (!imagesStr) return []
  try {
    const parsed = JSON.parse(imagesStr)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return imagesStr.split(',').map(s => s.trim()).filter(Boolean)
  }
}

// 图片预览（调用全局 ImagePreview 组件）
function previewReviewImages(imagesStr, index = 0) {
  const list = parseReviewImages(imagesStr).map(resolveClientImage)
  if (list.length) appStore.openImagePreview(list, index)
}

// 评价弹窗
const reviewDialogVisible = ref(false)
const reviewDialogOrderId = ref(null)

function openReviewDialog(order) {
  reviewDialogOrderId.value = order.id
  reviewDialogVisible.value = true
}

// 评价成功后刷新我的订单
async function handleReviewSuccess() {
  if (userStore.isLoggedIn) {
    try {
      activeOrders.value = await getMyActiveOrdersApi(6)
      nextTick(() => updateOrderScrollState())
    } catch (e) {
      activeOrders.value = []
    }
  }
}

// ---------- 轮播控制器 ----------
// 轮播每张间隔时间（毫秒），默认 5 秒
const CAROUSEL_INTERVAL = 5000
const carouselRef = ref(null)
// 当前激活的轮播索引
const activeCarouselIndex = ref(0)
// 鼠标悬停的圆点索引（null 表示未悬停）
const hoverDotIndex = ref(null)
// 当前激活项的播放进度百分比 0-100
const mainProgress = ref(0)
// requestAnimationFrame 句柄
let mainRaf = null
// 当前进度周期起始时间戳
let mainStartTime = 0

// el-carousel change 事件：同步激活索引；仅在未悬停时重启倒计时（悬停态由 onDotEnter 负责）
function onCarouselChange(newIdx) {
  activeCarouselIndex.value = newIdx
  if (hoverDotIndex.value === null) startMainProgress()
}

// 鼠标进入圆点：切换到该项 + 重启进度（动态填充 5 秒）；因 hoverDotIndex 非空，到 100% 不会自动切换（暂停）
function onDotEnter(idx) {
  hoverDotIndex.value = idx
  carouselRef.value?.setActiveItem(idx)
  startMainProgress()
}

// 鼠标离开整组圆点：恢复自动播放，重启当前项倒计时（到 100% 自动切下一张）
function onIndicatorsLeave() {
  hoverDotIndex.value = null
  startMainProgress()
}

// 圆点填充宽度：仅激活项展示当前播放进度，其余为 0
function getDotFillWidth(idx) {
  if (idx === activeCarouselIndex.value) return mainProgress.value
  return 0
}

// 启动/重启 5 秒进度动画
// - 未悬停时：到 100% 自动切到下一张（由 next 触发 change → onCarouselChange 续播）
// - 悬停时：到 100% 停止且不切换（暂停），进度条满格定格
function startMainProgress() {
  cancelAnimationFrame(mainRaf)
  mainProgress.value = 0
  mainStartTime = performance.now()
  const tick = (now) => {
    const elapsed = now - mainStartTime
    mainProgress.value = Math.min(100, (elapsed / CAROUSEL_INTERVAL) * 100)
    if (mainProgress.value < 100) {
      mainRaf = requestAnimationFrame(tick)
    } else if (hoverDotIndex.value === null) {
      // 未悬停：倒计时结束，自动切下一张
      carouselRef.value?.next()
    }
    // 悬停态到 100%：停止 ticking，不切换（暂停）
  }
  mainRaf = requestAnimationFrame(tick)
}

// 轮播跳转链接：外链新标签打开，内链 router.push，为空回退 /vehicles
function handleCarouselClick(item) {
  const url = item.linkUrl
  if (!url) {
    router.push('/vehicles')
    return
  }
  // 以 http:// 或 https:// 开头视为外链
  if (/^https?:\/\//i.test(url)) {
    window.open(url, '_blank')
    return
  }
  router.push(url)
}

// 数据
const carousel = ref([])
const hotCars = ref([])
const advantages = ref([])
const reviews = ref([])
// 评价展开状态管理
const reviewContentRefs = ref([])
const expandedReviewIds = ref(new Set())
const clampedReviewIds = ref(new Set())
const toggleReview = (id) => {
  const next = new Set(expandedReviewIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedReviewIds.value = next
}
// 检测哪些评价内容被截断（需要显示展开按钮）
const detectClampedReviews = () => {
  const clamped = new Set()
  reviewContentRefs.value.forEach((el, idx) => {
    const review = reviews.value[idx]
    if (el && review && el.scrollHeight > el.clientHeight + 1) {
      clamped.add(review.id)
    }
  })
  clampedReviewIds.value = clamped
}
const activeCoupons = ref([])
// 我的订单（登录用户：租赁中 + 待评价）
const activeOrders = ref([])
// 车型分类字典（预约咨询表单意向车型下拉用）
const vehicleTypes = ref([])
// 已领取的优惠券ID列表（登录时加载，用于判断领取状态）
const claimedCouponIds = ref([])
// 当前正在领取的优惠券ID（按钮 loading 状态）
const claimingCouponId = ref(null)

// 热门车型横向滚动控制
const carsScrollRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollState() {
  const el = carsScrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 10
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

function scrollCars(direction) {
  const el = carsScrollRef.value
  if (!el) return
  const cardWidth = 320 + 24 // 卡片宽度 + 间距
  el.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' })
}

// 优惠券横向滚动控制
const couponsScrollRef = ref(null)
const canScrollLeftCoupons = ref(false)
const canScrollRightCoupons = ref(false)

function updateCouponScrollState() {
  const el = couponsScrollRef.value
  if (!el) return
  canScrollLeftCoupons.value = el.scrollLeft > 10
  canScrollRightCoupons.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

function scrollCoupons(direction) {
  const el = couponsScrollRef.value
  if (!el) return
  const cardWidth = 260 + 24 // 紧凑卡片宽度 + 间距
  el.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' })
}

// 我的订单横向滚动控制
const ordersScrollRef = ref(null)
const canScrollLeftOrders = ref(false)
const canScrollRightOrders = ref(false)

function updateOrderScrollState() {
  const el = ordersScrollRef.value
  if (!el) return
  canScrollLeftOrders.value = el.scrollLeft > 10
  canScrollRightOrders.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

function scrollOrders(direction) {
  const el = ordersScrollRef.value
  if (!el) return
  const cardWidth = 280 + 24 // 订单卡片宽度 + 间距
  el.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' })
}

// 品牌简介图片（本地静态资源，通过后端 /uploads 提供）
const brandImg = '/uploads/banners/brand.jpg'

// 预约表单
const form = ref({ name: '', phone: '', carType: '', date: '' })
const submitting = ref(false)
const loading = ref(true)

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const promises = [
      getActiveCarouselApi(),
      getHotCarsApi(),
      getAdvantagesApi(),
      getReviewsApi(),
      getAvailableCouponsApi(),
      loadConfig(),
      getDictByTypeApi('vehicle_type').catch(() => [])
    ]
    // 登录用户额外加载已领取的优惠券ID
    if (userStore.isLoggedIn) {
      promises.push(getClaimedCouponIdsApi().catch(() => []))
    }
    const results = await Promise.all(promises)
    carousel.value = results[0] || []
    // 轮播数据就绪后初始化激活索引并启动主进度（与自动切换同步）
    activeCarouselIndex.value = 0
    if (carousel.value.length) {
      nextTick(() => startMainProgress())
    }
    hotCars.value = results[1] || []
    advantages.value = results[2] || []
    reviews.value = results[3] || []
    // 评价渲染后检测哪些内容被截断（用于显示展开按钮）
    nextTick(() => detectClampedReviews())
    activeCoupons.value = results[4] || []
    vehicleTypes.value = results[6] || []
    // 第8个结果（登录时为已领取ID列表，未登录时为 undefined）
    if (userStore.isLoggedIn && results[7]) {
      claimedCouponIds.value = results[7]
    }
    // 登录用户额外加载进行中订单（租赁中 + 待评价）
    if (userStore.isLoggedIn) {
      try {
        activeOrders.value = await getMyActiveOrdersApi(6)
      } catch (e) {
        activeOrders.value = []
      }
      nextTick(() => updateOrderScrollState())
    }
    // 热门车型加载后初始化滚动箭头状态
    nextTick(() => {
      updateScrollState()
      updateCouponScrollState()
    })
  } catch (e) {
    console.error('首页数据加载失败', e)
    ElMessage.error('数据加载失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

// 领取优惠券
async function handleClaimCoupon(coupon) {
  if (!userStore.isLoggedIn) {
    goLogin()
    return
  }
  claimingCouponId.value = coupon.id
  try {
    await claimCouponApi(coupon.id)
    // 领取成功，更新已领取列表
    if (!claimedCouponIds.value.includes(coupon.id)) {
      claimedCouponIds.value.push(coupon.id)
    }
    // 本地递增已领取数，让库存进度条/剩余量立即响应式更新
    // 不重新拉 getAvailableCouponsApi()，避免列表 DOM 重建导致滚动位置跳动
    if (coupon.totalCount !== -1 && coupon.totalCount != null) {
      coupon.receivedCount = (coupon.receivedCount || 0) + 1
      if (coupon.remainCount != null) {
        coupon.remainCount = Math.max(0, coupon.remainCount - 1)
      }
    }
    ElMessage.success('优惠券领取成功，可在选车结算时使用')
  } catch (e) {
    console.error('优惠券领取失败', e)
  } finally {
    claimingCouponId.value = null
  }
}

// 跳转登录页
function goLogin() {
  router.push({ path: '/login', query: { redirect: '/' } })
}

function goCheckout(car) {
  // 校验登录状态，未登录跳转登录页
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再租车')
    router.push({ path: '/login', query: { redirect: `/vehicles/${car.id}` } })
    return
  }
  router.push(`/vehicles/${car.id}`)
}

function goVehicles() {
  router.push('/vehicles')
}

async function submitAppointment() {
  if (!form.value.name || !form.value.phone) {
    ElMessage.warning('请填写姓名和手机号')
    return
  }
  submitting.value = true
  try {
    await submitFeedbackApi({
      type: 'appointment',
      name: form.value.name,
      phone: form.value.phone,
      carType: form.value.carType,
      rentDate: form.value.date
    })
    ElMessage.success('预约成功，客服将尽快联系您')
    form.value = { name: '', phone: '', carType: '', date: '' }
  } catch (e) {
    console.error('预约提交失败', e)
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)

// 组件卸载前清理时间条动画，避免内存泄漏
onBeforeUnmount(() => {
  if (mainRaf) cancelAnimationFrame(mainRaf)
})
</script>

<style lang="scss" scoped>
.home-page {
  // overflow-x: hidden 会裁切横向溢出（如横向滚动容器的 padding 溢出）。
  // 注意：overflow-x: hidden 会让 overflow-y 被强制计算为 auto，使 .home-page
  // 成为纵向滚动容器。必须确保内部无任何纵向溢出（scrollHeight === clientHeight），
  // 否则 wheel 事件会被 .home-page 捕获导致滚动卡顿。下方 .appointment 的
  // transform 复位即为消除最后一个 section 的 30px 纵向偏移。
  overflow-x: hidden;
}

// 最后一个 section（预约咨询）：取消 .fade-in-up 的初始 transform:translateY(30px)。
// 否则该 section 在变成 .visible 之前会向下偏移 30px，导致 .home-page 的
// scrollHeight 比 clientHeight 多 30px，配合 overflow-x:hidden → overflow-y:auto
// 的副作用，.home-page 会成为可滚动容器并捕获 wheel 事件，引发：
// 1) 滚一下卡住、需移动鼠标才能继续滚动；2) 内容区出现多余滚动条。
// 取消 transform 后该 section 仅保留 opacity 淡入效果，视觉上仍为渐显。
.appointment.fade-in-up {
  transform: translateY(0);
}

// ---------- 1. 轮播（Full-bleed cinematic hero）----------
// 轮播图占满整个视口（100vh），从视口顶部开始（layout-main 已无 padding-top）。
// 首屏恰好 100vh，向下滚动即进入下一模块，不会出现轮播区域内多余的滚动空隙。
.hero-carousel {
  position: relative;
  height: 100vh;
  // 裁剪 scroll-hint bounce 动画向下溢出的部分，避免触发多余滚动
  overflow: hidden;
  :deep(.el-carousel) { height: 100%; }
  :deep(.el-carousel__container) { height: 100%; }
}

.carousel-item {
  width: 100%; height: 100%;
  // cover + no-repeat + center：图片占满一行，不重复、不叠排
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  will-change: transform;
}

// 电影级渐变：顶部透明 → 底部融入暗色画布
.carousel-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.35) 45%, var(--lux-bg) 100%);
}

.carousel-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: $color-text;
  width: 100%;
  max-width: $content-max-width;
  padding: 0 $space-md $space-2xl;
  animation: fadeInUp 1s ease;
}

.carousel-title {
  font-size: $font-size-4xl;
  font-weight: $font-weight-medium;
  letter-spacing: -0.02em;
  line-height: $line-height-tight;
  margin-bottom: $space-sm;
  @include respond-to('md') { font-size: $font-size-2xl; }
}

.carousel-desc {
  font-size: $font-size-lg;
  font-weight: $font-weight-light;
  margin-bottom: $space-xl;
  opacity: 0.9;
  @include respond-to('md') { font-size: $font-size-base; }
}

.carousel-btn {
  padding: 14px 40px;
}

// ---------- 轮播自定义控制器 ----------
// 默认一排小圆点（居中底部）；仅激活项鼠标悬停时展开为横向时间条，
// 其 .dot-fill 宽度由 JS 按 5 秒动态填充 0%→100%
.carousel-indicators {
  position: absolute;
  bottom: $space-xl;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: $space-sm;
  // 仅需高于轮播图内部层（carousel-content 为 z-index:2），
  // 必须低于 fixed header（$z-header=100），否则滚动时圆点会盖住导航栏
  z-index: 10;
  margin-bottom: $space-sm;
}

.carousel-dot {
  // 默认圆点形态
  width: 10px;
  height: 10px;
  padding: 0;
  border: none;
  border-radius: 9999px;
  // 用 --lux-text 适配双主题：暗色主题=白点，亮色主题=黑点，
  // 始终与 overlay 底部融入的 --lux-bg 背景形成最大对比
  background: color-mix(in srgb, var(--lux-text) 45%, transparent);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: width 0.35s ease, height 0.35s ease, background-color 0.25s ease;
  // 高亮态：当前激活
  &.is-active { background: var(--lux-text); }
  // 鼠标悬停任意圆点即展开为时间条（宽度变大、压扁为条状），轨道用低透明度文字色
  &.is-hover {
    width: 64px;
    height: 4px;
    background: color-mix(in srgb, var(--lux-text) 25%, transparent);
  }
}

// 时间条内部填充层：宽度由 getDotFillWidth 动态驱动
// 用品牌红实色，双主题下均醒目
.dot-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0;
  background: $color-primary;
  border-radius: inherit;
  // 非悬停态下不展示填充，保持纯圆点视觉
  .carousel-dot:not(.is-hover) & {
    display: none;
  }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-hint {
  position: absolute;
  bottom: $space-xs;
  left: 50%;
  transform: translateX(-50%);
  color: $color-text;
  font-size: $font-size-xs;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-xs;
  opacity: 0.7;
  animation: bounce 2s infinite;
  z-index: 3;
}
@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(10px); }
}

// ---------- 2. 品牌简介 ----------
.brand-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2xl;
  align-items: center;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.brand-heading {
  font-size: $font-size-3xl;
  font-weight: $font-weight-medium;
  line-height: $line-height-tight;
  margin-bottom: $space-md;
  letter-spacing: -0.02em;
  color: $color-text;
}

.brand-desc {
  font-size: $font-size-base;
  color: $color-text-secondary;
  line-height: $line-height-loose;
  margin-bottom: $space-xl;
}

.brand-stats {
  display: flex;
  gap: 0;
  border-top: 1px solid $color-divider;
  padding-top: $space-lg;
}
.stat-item {
  display: flex;
  flex-direction: column;
  padding-right: $space-xl;
  margin-right: $space-xl;
  border-right: 1px solid $color-divider;
  &:last-child { border-right: none; margin-right: 0; padding-right: 0; }
  .stat-num { font-size: $font-size-3xl; font-weight: $font-weight-medium; color: var(--lux-primary-text); line-height: 1; white-space: nowrap; }
  .stat-label { font-size: $font-size-xs; color: $color-text-secondary; margin-top: $space-xs; text-transform: uppercase; letter-spacing: 0.65px; white-space: nowrap; }
}

.brand-image {
  border-radius: $radius-none;
  overflow: hidden;
  border: 1px solid $color-border;
  img { width: 100%; display: block; }
}

// ---------- 3. 热门车型 ----------
.cars-scroll-wrapper {
  position: relative;
}

.cars-scroll {
  display: flex;
  gap: $space-md;
  padding: $space-base max($space-md, calc((100vw - #{$content-max-width}) / 2)) $space-lg;
  overflow-x: auto;
  // 使用 proximity 而非 mandatory，避免动态 padding 导致左侧弹跳抽搐
  scroll-snap-type: x proximity;
  scroll-behavior: smooth;
  // 防止内容撑高导致纵向滚动
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  .car-card { min-width: 320px; flex-shrink: 0; }
}

// 滚动箭头：暗色提升层 / 发丝线 / 锐角 / 白色图标
.scroll-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: $z-dropdown;
  width: 44px;
  height: 44px;
  border-radius: $radius-none;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color $transition-fast, border-color $transition-fast;
  color: $color-text;
  &:hover {
    background: $color-bg-gray-dark;
    border-color: $color-text-tertiary;
  }
  &.scroll-arrow-left { left: $space-sm; }
  &.scroll-arrow-right { right: $space-sm; }
}

// ---------- 1.5 我的订单 ----------
.my-orders-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.orders-scroll-wrapper {
  position: relative;
}
.orders-scroll {
  display: flex;
  gap: $space-md;
  padding: $space-base max($space-md, calc((100vw - #{$content-max-width}) / 2)) $space-lg;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-behavior: smooth;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.my-order-card {
  min-width: 280px;
  max-width: 280px;
  flex-shrink: 0;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  overflow: hidden;
  cursor: pointer;
  transition: transform $transition-base, border-color $transition-fast;
  &:hover {
    transform: translateY(-2px);
    border-color: $color-text-tertiary;
  }
}
.my-order-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
}
.my-order-status {
  position: absolute;
  top: $space-xs;
  right: $space-xs;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  padding: 2px 8px;
  border-radius: $radius-none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  &.renting { background: rgba(218, 41, 28, 0.85); }
  &.completed { background: rgba(3, 144, 74, 0.85); }
}
.my-order-info {
  padding: $space-base $space-md;
  .my-order-name {
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    color: $color-text;
    margin-bottom: $space-xs;
    @include ellipsis;
  }
  .my-order-date {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: 2px;
  }
  .my-order-store {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
  }
  .my-order-actions {
    margin-top: $space-sm;
  }
}

// ---------- 4. 服务优势 ----------
.adv-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-md;
  @include respond-to('md') { grid-template-columns: repeat(2, 1fr); }
}

// 优势卡片：暗色提升层 / 发丝线 / 锐角
.adv-card {
  text-align: center;
  padding: $space-lg $space-md;
  border-radius: $radius-none;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  transition: background-color $transition-fast, border-color $transition-fast;
  &:hover { background: $color-bg-gray-dark; }
}

.adv-icon {
  color: var(--lux-primary-text);
  margin-bottom: $space-base;
}

.adv-title {
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  margin-bottom: $space-xs;
  color: $color-text;
}

.adv-desc {
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

// ---------- 5. 客户评价 ----------
.reviews-scroll {
  display: flex;
  gap: $space-md;
  padding: 0 max($space-md, calc((100vw - #{$content-max-width}) / 2));
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

// 评价卡片：暗色提升层 / 发丝线 / 锐角
.review-card {
  min-width: 360px;
  max-width: 360px;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-lg;
}

.review-user {
  display: flex;
  align-items: center;
  gap: $space-sm;
  margin-bottom: $space-md;
  .review-name { font-size: $font-size-sm; font-weight: $font-weight-medium; color: $color-text; }
  .review-meta { font-size: $font-size-xs; color: $color-text-tertiary; margin-top: 2px; }
}

.review-stars {
  .star { color: var(--lux-primary-text); font-size: $font-size-base; }
  margin-bottom: $space-base;
}

.review-content {
  font-size: $font-size-base;
  line-height: $line-height-loose;
  color: $color-text;
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: -webkit-line-clamp 0.2s ease;
  &.is-expanded {
    -webkit-line-clamp: unset;
    overflow: visible;
  }
}

.review-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: $space-sm;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  transition: color 0.2s ease;
  &:hover { color: $color-primary; }
  .toggle-icon {
    transition: transform 0.2s ease;
    &.is-expanded { transform: rotate(180deg); }
  }
}

// 评价图片：小图展示，宽高自适应，可预览
.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: $space-xs;
  margin-top: $space-sm;
}
.review-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: $radius-none;
  border: 1px solid $color-border;
  cursor: pointer;
  transition: opacity $transition-fast, border-color $transition-fast;
  &:hover {
    opacity: 0.8;
    border-color: var(--lux-primary-text);
  }
}

// ---------- 6. 优惠券（横向滚动，hover 浮层展开） ----------
// 卡片默认高度 168px（与组件内 .coupon-compact height 一致）
$coupon-card-height: 168px;
// hover 浮层向下展开所需预留空间
$coupon-popover-space: 220px;

.coupons-scroll-wrapper {
  position: relative;

  // 滚动箭头：居中于默认卡片区域，而非整个滚动容器
  // 容器因 padding-bottom 预留浮层空间而变高，top:50% 会偏下，
  // 改为基于卡片高度计算（上 padding + 卡片高度的一半）
  .scroll-arrow {
    top: calc(#{$space-base} + #{$coupon-card-height} / 2);
  }
}

.coupons-scroll {
  display: flex;
  gap: $space-md;
  // 底部预留浮层展开空间；overflow-x:auto 会强制 overflow-y 为 auto，
  // 不预留则浮层会被裁切
  padding: $space-base max($space-md, calc((100vw - #{$content-max-width}) / 2)) $coupon-popover-space;
  overflow-x: auto;
  // 不使用 scroll-snap，避免初始吸附到容器边缘，与热门车型左侧对齐
  scroll-behavior: smooth;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

// ---------- 7. 预约咨询 ----------
.appointment-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2xl;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-xl;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.appointment-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-medium;
  margin-bottom: $space-sm;
  color: $color-text;
}

.appointment-desc {
  font-size: $font-size-base;
  color: $color-text-secondary;
  margin-bottom: $space-xl;
}

.appointment-phone {
  display: flex;
  align-items: center;
  gap: $space-base;
  color: var(--lux-primary-text);
  .phone-label { font-size: $font-size-xs; color: $color-text-secondary; }
  .phone-num { font-size: $font-size-xl; font-weight: $font-weight-medium; margin-top: 2px; }
}
</style>
