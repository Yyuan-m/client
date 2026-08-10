<template>
  <div class="home-page">
    <!-- 1. 顶部轮播 -->
    <section class="hero-carousel">
      <el-carousel height="100vh" :interval="5000" arrow="never" indicator-position="none">
        <el-carousel-item v-for="item in carousel" :key="item.id">
          <div class="carousel-item" :style="{ backgroundImage: `url(${item.imageUrl})` }">
            <div class="carousel-overlay"></div>
            <div class="carousel-content">
              <h1 class="carousel-title">{{ item.title }}</h1>
              <p class="carousel-desc">{{ item.description }}</p>
              <router-link :to="item.linkUrl || '/vehicles'" class="btn-fill carousel-btn">立即体验</router-link>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
      <div class="scroll-hint">
        <span>向下滚动探索</span>
        <el-icon><ArrowDownBold /></el-icon>
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
          <img :src="brandImg" alt="豪华跑车" />
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
          <div class="review-stars">
            <el-icon v-for="n in review.rating" :key="n" class="star"><StarFilled /></el-icon>
          </div>
          <p class="review-content">"{{ review.content }}"</p>
          <div class="review-user">
            <el-avatar :size="40">{{ review.name.charAt(0) }}</el-avatar>
            <div>
              <p class="review-name">{{ review.name }}</p>
              <p class="review-meta">{{ review.carName }} · {{ review.date }}</p>
            </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import CarCard from '@/components/CarCard/index.vue'
import CouponCard from '@/components/CouponCard/index.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useUserStore } from '@/stores'
import { useSystemConfig } from '@/composables/useSystemConfig'
import { getActiveCarouselApi } from '@/api/modules/carousel'
import { getHotCarsApi } from '@/api/modules/car'
import { getAvailableCouponsApi, getClaimedCouponIdsApi, claimCouponApi } from '@/api/modules/coupon'
import { getAdvantagesApi, getReviewsApi, getDictByTypeApi } from '@/api/modules/system'
import { submitFeedbackApi } from '@/api/modules/feedback'

const router = useRouter()
const userStore = useUserStore()
const { config, loadConfig } = useSystemConfig()
useScrollReveal()

// 数据
const carousel = ref([])
const hotCars = ref([])
const advantages = ref([])
const reviews = ref([])
const activeCoupons = ref([])
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
    hotCars.value = results[1] || []
    advantages.value = results[2] || []
    reviews.value = results[3] || []
    activeCoupons.value = results[4] || []
    vehicleTypes.value = results[6] || []
    // 第8个结果（登录时为已领取ID列表，未登录时为 undefined）
    if (userStore.isLoggedIn && results[7]) {
      claimedCouponIds.value = results[7]
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
</script>

<style lang="scss" scoped>
.home-page { overflow-x: hidden; }

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
  background-size: cover;
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

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-hint {
  position: absolute;
  bottom: $space-md;
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

.review-stars {
  .star { color: var(--lux-primary-text); font-size: $font-size-base; }
  margin-bottom: $space-base;
}

.review-content {
  font-size: $font-size-base;
  line-height: $line-height-loose;
  color: $color-text;
  margin-bottom: $space-md;
  font-style: italic;
}

.review-user {
  display: flex;
  align-items: center;
  gap: $space-sm;
  .review-name { font-size: $font-size-sm; font-weight: $font-weight-medium; color: $color-text; }
  .review-meta { font-size: $font-size-xs; color: $color-text-tertiary; margin-top: 2px; }
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
