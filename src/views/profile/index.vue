<template>
  <div class="profile-page section">
    <div class="container">
      <h2 class="section-title">个人中心</h2>
      <div class="profile-layout">
        <!-- 侧边菜单 -->
        <aside class="profile-sidebar">
          <div class="user-card">
            <el-avatar :size="64" :src="resolveClientImage(userStore.user?.avatar)">{{ userStore.nickname?.charAt(0) }}</el-avatar>
            <h3 class="user-name">{{ userStore.nickname }}</h3>
            <p class="user-level">{{ userStore.user?.levelName || '普通会员' }}</p>
          </div>
          <el-menu :default-active="activeTab" @select="activeTab = $event">
            <el-menu-item index="info"><el-icon><User /></el-icon><span>个人信息</span></el-menu-item>
            <el-menu-item index="orders"><el-icon><List /></el-icon><span>我的订单</span></el-menu-item>
            <el-menu-item index="reviews">
              <el-icon><EditPen /></el-icon>
              <span>去评价</span>
              <span v-if="reviewableCount > 0" class="menu-count-badge">{{ reviewableCount }}</span>
            </el-menu-item>
            <el-menu-item index="verify"><el-icon><Postcard /></el-icon><span>实名认证</span></el-menu-item>
            <el-menu-item index="coupons"><el-icon><Ticket /></el-icon><span>我的优惠券</span></el-menu-item>
          </el-menu>
        </aside>

        <!-- 内容区 -->
        <div class="profile-content">
          <!-- 个人信息 -->
          <div v-if="activeTab === 'info'" class="tab-panel">
            <h3 class="panel-title">编辑资料</h3>
            <div class="avatar-section">
              <el-upload
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="handleAvatarUpload"
                accept="image/*"
                class="avatar-uploader"
              >
                <div class="avatar-wrap" title="点击更换头像">
                  <el-avatar :size="96" :src="resolveClientImage(form.avatar)">{{ form.nickname?.charAt(0) }}</el-avatar>
                  <div class="avatar-mask">
                    <el-icon :size="22"><Camera /></el-icon>
                    <span>更换头像</span>
                  </div>
                </div>
              </el-upload>
              <div class="avatar-meta">
                <p class="avatar-name">{{ form.nickname || '未设置昵称' }}</p>
                <p class="avatar-hint">支持 JPG / PNG，大小不超过 2MB<br />点击左侧头像即可选择图片更换</p>
              </div>
            </div>
            <el-form :model="form" label-width="80px" class="profile-form">
              <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
              <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
              <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 我的订单：最近 3 单 + 跳转全部 -->
          <div v-else-if="activeTab === 'orders'" class="tab-panel">
            <h3 class="panel-title">我的订单</h3>
            <div v-if="orderLoading" v-loading="true" style="min-height: 200px"></div>
            <template v-else>
              <div v-if="recentOrders.length" class="order-list">
                <div
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="order-card"
                  @click="router.push(`/orders/${order.id}`)"
                >
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <span class="order-status" :class="order.status">{{ order.statusName }}</span>
                  </div>
                  <div class="order-body">
                    <img :src="resolveAdminImage(order.carCover)" :alt="order.carName" class="order-img" />
                    <div class="order-info">
                      <h4>{{ order.carName }}</h4>
                      <p>{{ order.startDate }} 至 {{ order.endDate }}（{{ order.days }}天）</p>
                      <p class="order-store">{{ order.store }}</p>
                    </div>
                    <div class="order-amount">
                      <span class="amount">￥{{ moneyUtil.format(order.totalAmount) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <EmptyTips v-else text="暂无订单" show-action action-text="去租车" @action="router.push('/vehicles')" />
              <div class="view-all-bar">
                <el-button type="primary" text @click="router.push('/orders')">查看全部订单 →</el-button>
              </div>
            </template>
          </div>

          <!-- 去评价：待首评 + 可追评订单 -->
          <div v-else-if="activeTab === 'reviews'" class="tab-panel">
            <h3 class="panel-title">
              去评价
              <span v-if="reviewableCount > 0" class="panel-title-count">{{ reviewableCount }}</span>
            </h3>
            <p class="panel-desc">完成评价是对车主最好的反馈，每单可评价2次（首次评价 + 追加评价）</p>
            <div v-if="reviewLoading" v-loading="true" style="min-height: 200px"></div>
            <template v-else>
              <div v-if="reviewableOrders.length" class="order-list">
                <div
                  v-for="order in reviewableOrders"
                  :key="order.id"
                  class="order-card reviewable-card"
                  @click="router.push(`/orders/${order.id}`)"
                >
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <span class="review-tag" :class="order.reviewStatus">
                      {{ order.reviewStatus === 'unreviewed' ? '待评价' : '可追评' }}
                    </span>
                  </div>
                  <div class="order-body">
                    <img :src="resolveAdminImage(order.carCover)" :alt="order.carName" class="order-img" />
                    <div class="order-info">
                      <h4>{{ order.carName }}</h4>
                      <p>{{ order.startDate }} 至 {{ order.endDate }}（{{ order.days }}天）</p>
                      <p class="order-store">{{ order.store }}</p>
                    </div>
                    <div class="order-amount">
                      <span class="amount">￥{{ moneyUtil.format(order.totalAmount) }}</span>
                      <el-button
                        type="primary"
                        size="small"
                        class="review-btn"
                        @click.stop="openReviewDialog(order)"
                      >
                        {{ order.reviewStatus === 'unreviewed' ? '去评价' : '去追评' }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              <EmptyTips v-else text="暂无待评价订单" show-action action-text="去租车" @action="router.push('/vehicles')" />
            </template>
          </div>

          <!-- 实名认证 / 驾驶证 -->
          <div v-else-if="activeTab === 'verify'" class="tab-panel">
            <h3 class="panel-title">实名认证 / 驾驶证</h3>
            <p class="panel-desc">完成实名与驾驶证信息认证后方可下单租车，所有信息仅用于核验，不会公开展示。</p>

            <el-form :model="verifyForm" label-width="110px" class="verify-form">
              <h4 class="form-section-title">基本信息</h4>
              <el-form-item label="真实姓名">
                <el-input v-model="verifyForm.realName" placeholder="请输入身份证上的姓名" />
              </el-form-item>
              <el-form-item label="性别">
                <el-radio-group v-model="verifyForm.gender">
                  <el-radio :value="1">男</el-radio>
                  <el-radio :value="2">女</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="出生日期">
                <el-date-picker
                  v-model="verifyForm.birthday"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择出生日期"
                  style="width: 100%"
                  :disabled-date="disableFutureDate"
                />
              </el-form-item>
              <el-form-item label="身份证号">
                <el-input v-model="verifyForm.idCard" placeholder="18 位身份证号" maxlength="18" />
              </el-form-item>

              <h4 class="form-section-title">身份证照片</h4>
              <div class="upload-row">
                <div class="upload-item">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(opt) => handleVerifyUpload(opt, 'idCardFrontImg')"
                    accept="image/*"
                    class="verify-uploader"
                  >
                    <div class="upload-box">
                      <img v-if="verifyForm.idCardFrontImg" :src="resolveClientImage(verifyForm.idCardFrontImg)" class="upload-preview" />
                      <div v-else class="upload-placeholder">
                        <el-icon :size="26"><Camera /></el-icon>
                        <span>身份证正面</span>
                      </div>
                    </div>
                  </el-upload>
                  <p class="upload-label">身份证正面（人像面）</p>
                </div>
                <div class="upload-item">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(opt) => handleVerifyUpload(opt, 'idCardBackImg')"
                    accept="image/*"
                    class="verify-uploader"
                  >
                    <div class="upload-box">
                      <img v-if="verifyForm.idCardBackImg" :src="resolveClientImage(verifyForm.idCardBackImg)" class="upload-preview" />
                      <div v-else class="upload-placeholder">
                        <el-icon :size="26"><Camera /></el-icon>
                        <span>身份证背面</span>
                      </div>
                    </div>
                  </el-upload>
                  <p class="upload-label">身份证背面（国徽面）</p>
                </div>
              </div>

              <h4 class="form-section-title">驾驶证信息</h4>
              <el-form-item label="驾驶证号">
                <el-input v-model="verifyForm.driverLicenseNo" placeholder="驾驶证档案编号" />
              </el-form-item>
              <el-form-item label="准驾车型">
                <el-select v-model="verifyForm.driverLicenseType" placeholder="选择准驾车型" style="width: 100%">
                  <el-option label="C1（小型汽车）" value="C1" />
                  <el-option label="C2（小型自动挡汽车）" value="C2" />
                  <el-option label="B1（中型客车）" value="B1" />
                  <el-option label="B2（大型货车）" value="B2" />
                  <el-option label="A1（大型客车）" value="A1" />
                  <el-option label="A2（牵引车）" value="A2" />
                </el-select>
              </el-form-item>
              <el-form-item label="过期日期">
                <el-date-picker
                  v-model="verifyForm.driverLicenseExpireDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="驾驶证过期日期"
                  style="width: 100%"
                  :disabled-date="disablePastDate"
                />
              </el-form-item>

              <h4 class="form-section-title">驾驶证照片</h4>
              <div class="upload-row">
                <div class="upload-item">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(opt) => handleVerifyUpload(opt, 'driverLicenseFrontImg')"
                    accept="image/*"
                    class="verify-uploader"
                  >
                    <div class="upload-box">
                      <img v-if="verifyForm.driverLicenseFrontImg" :src="resolveClientImage(verifyForm.driverLicenseFrontImg)" class="upload-preview" />
                      <div v-else class="upload-placeholder">
                        <el-icon :size="26"><Camera /></el-icon>
                        <span>驾驶证正面</span>
                      </div>
                    </div>
                  </el-upload>
                  <p class="upload-label">驾驶证正面（主页）</p>
                </div>
                <div class="upload-item">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(opt) => handleVerifyUpload(opt, 'driverLicenseBackImg')"
                    accept="image/*"
                    class="verify-uploader"
                  >
                    <div class="upload-box">
                      <img v-if="verifyForm.driverLicenseBackImg" :src="resolveClientImage(verifyForm.driverLicenseBackImg)" class="upload-preview" />
                      <div v-else class="upload-placeholder">
                        <el-icon :size="26"><Camera /></el-icon>
                        <span>驾驶证背面</span>
                      </div>
                    </div>
                  </el-upload>
                  <p class="upload-label">驾驶证背面（副页）</p>
                </div>
              </div>

              <el-form-item>
                <el-button type="primary" :loading="verifySaving" @click="saveVerify">保存认证信息</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 我的优惠券 -->
          <div v-else-if="activeTab === 'coupons'" class="tab-panel">
            <h3 class="panel-title">我的优惠券</h3>

            <!-- 状态分组 tabs -->
            <div class="coupon-tabs">
              <button
                v-for="tab in couponTabs"
                :key="tab.value"
                class="coupon-tab"
                :class="{ active: couponStatus === tab.value }"
                @click="switchCouponTab(tab.value)"
              >
                {{ tab.label }}
                <span class="count">{{ couponCountMap[tab.value] || 0 }}</span>
              </button>
            </div>

            <div v-if="couponLoading" v-loading="true" style="min-height: 200px"></div>
            <template v-else>
              <div v-if="coupons.length" class="coupon-list">
                <CouponCard
                  v-for="coupon in coupons"
                  :key="coupon.id"
                  :coupon="coupon"
                  mode="mine"
                  :show-stock="false"
                  @use="goUseCoupon"
                />
              </div>
              <EmptyTips
                v-else
                :text="emptyCouponText"
                show-action
                action-text="去领券"
                @action="router.push('/#coupons')"
              />
            </template>
          </div>
          
          <!-- 评价弹窗 -->
          <ReviewDialog
            v-model="reviewDialogVisible"
            :order-id="reviewDialogOrderId"
            @success="handleReviewSuccess"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import EmptyTips from '@/components/EmptyTips/index.vue'
import CouponCard from '@/components/CouponCard/index.vue'
import ReviewDialog from '@/components/ReviewDialog/index.vue'
import { useUserStore } from '@/stores'
import { updateProfileApi, updateAvatarApi, uploadImageApi } from '@/api/modules/user'
import { getMyCouponsApi } from '@/api/modules/coupon'
import { getOrderListApi, getReviewableOrdersApi } from '@/api/modules/order'
import { moneyUtil } from '@/utils'
import { resolveAdminImage, resolveClientImage } from '@/utils/image'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('info')

// 评价弹窗
const reviewDialogVisible = ref(false)
const reviewDialogOrderId = ref(null)

function openReviewDialog(order) {
  reviewDialogOrderId.value = order.id
  reviewDialogVisible.value = true
}

// 评价成功后刷新可评价订单列表
async function handleReviewSuccess() {
  await loadReviewableOrders()
}

const form = reactive({
  avatar: userStore.user?.avatar || '',
  nickname: userStore.user?.nickname || '',
  phone: userStore.user?.phone || '',
  email: userStore.user?.email || ''
})

// ============ 我的订单（最近 3 单）============
const recentOrders = ref([])
const orderLoading = ref(false)

async function loadRecentOrders() {
  orderLoading.value = true
  try {
    // noDedup: 避免与订单列表页请求去重冲突
    const res = await getOrderListApi(
      { status: 'all', page: 1, pageSize: 3 },
      { noDedup: true }
    )
    recentOrders.value = res.list || []
  } catch (e) {
    console.error('最近订单加载失败', e)
    recentOrders.value = []
  } finally {
    orderLoading.value = false
  }
}

// ============ 去评价（待首评 + 可追评订单）============
const reviewableOrders = ref([])
const reviewLoading = ref(false)
const reviewableCount = ref(0)

async function loadReviewableOrders() {
  reviewLoading.value = true
  try {
    const res = await getReviewableOrdersApi()
    reviewableOrders.value = res || []
    reviewableCount.value = reviewableOrders.value.length
  } catch (e) {
    console.error('可评价订单加载失败', e)
    reviewableOrders.value = []
    reviewableCount.value = 0
  } finally {
    reviewLoading.value = false
  }
}

// ============ 实名认证 / 驾驶证 ============
const verifyForm = reactive({
  realName: '',
  gender: 0,
  birthday: '',
  idCard: '',
  idCardFrontImg: '',
  idCardBackImg: '',
  driverLicenseNo: '',
  driverLicenseType: '',
  driverLicenseFrontImg: '',
  driverLicenseBackImg: '',
  driverLicenseExpireDate: ''
})
const verifySaving = ref(false)

// 从 userStore 同步实名认证字段到表单
function syncVerifyFormFromUser() {
  const u = userStore.user || {}
  verifyForm.realName = u.realName || ''
  verifyForm.gender = u.gender ?? 0
  verifyForm.birthday = u.birthday || ''
  verifyForm.idCard = u.idCard || ''
  verifyForm.idCardFrontImg = u.idCardFrontImg || ''
  verifyForm.idCardBackImg = u.idCardBackImg || ''
  verifyForm.driverLicenseNo = u.driverLicenseNo || ''
  verifyForm.driverLicenseType = u.driverLicenseType || ''
  verifyForm.driverLicenseFrontImg = u.driverLicenseFrontImg || ''
  verifyForm.driverLicenseBackImg = u.driverLicenseBackImg || ''
  verifyForm.driverLicenseExpireDate = u.driverLicenseExpireDate || ''
}

// 禁用未来日期（出生日期不能晚于今天）
function disableFutureDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}
// 禁用过去日期（驾驶证过期日期应晚于今天）
function disablePastDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

// 图片上传前校验：仅图片，5MB 以内
function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.warning('只能上传图片格式文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.warning('图片大小不能超过 5MB')
    return false
  }
  return true
}

// 实名认证图片上传：调通用上传接口拿 URL，回填到表单对应字段
async function handleVerifyUpload({ file }, field) {
  try {
    const res = await uploadImageApi(file)
    verifyForm[field] = res.url
    ElMessage.success('图片上传成功')
  } catch (e) {
    console.error('图片上传失败', e)
    ElMessage.error('图片上传失败')
  }
}

async function saveVerify() {
  // 简单必填校验：姓名/身份证号/驾驶证号为关键信息
  if (!verifyForm.realName.trim()) {
    ElMessage.warning('请填写真实姓名')
    return
  }
  if (!verifyForm.idCard.trim()) {
    ElMessage.warning('请填写身份证号')
    return
  }
  if (!verifyForm.driverLicenseNo.trim()) {
    ElMessage.warning('请填写驾驶证号')
    return
  }
  verifySaving.value = true
  try {
    await updateProfileApi({ ...verifyForm })
    await userStore.fetchUserInfo()
    ElMessage.success('认证信息已保存')
  } catch (e) {
    console.error('保存认证信息失败', e)
    ElMessage.error('保存失败，请重试')
  } finally {
    verifySaving.value = false
  }
}

// ============ 我的优惠券（v2：状态分组）============
// v2 状态：unused 未使用 / locked 已锁定 / used 已使用 / expired 已过期
const couponTabs = [
  { value: 'unused', label: '未使用' },
  { value: 'locked', label: '已锁定' },
  { value: 'used', label: '已使用' },
  { value: 'expired', label: '已过期' }
]
const couponCountMap = ref({})
const couponStatus = ref('unused')
const coupons = ref([])
const couponLoading = ref(false)

const emptyCouponText = computed(() => {
  const map = {
    unused: '暂无可用优惠券',
    locked: '暂无锁定中的优惠券',
    used: '暂无已使用的优惠券',
    expired: '暂无已过期的优惠券'
  }
  return map[couponStatus.value] || '暂无优惠券'
})

async function switchCouponTab(status) {
  if (couponStatus.value === status) return
  couponStatus.value = status
  await loadCoupons(status)
}

async function loadCoupons(status) {
  couponLoading.value = true
  try {
    const list = (await getMyCouponsApi()) || []
    const countMap = { unused: 0, locked: 0, used: 0, expired: 0 }
    list.forEach(c => {
      const s = c.status || 'unused'
      if (countMap[s] != null) countMap[s]++
    })
    couponCountMap.value = countMap
    coupons.value = status ? list.filter(c => c.status === status) : list
  } catch (e) {
    console.error('优惠券加载失败', e)
    coupons.value = []
  } finally {
    couponLoading.value = false
  }
}

function goUseCoupon() {
  router.push('/vehicles')
}

watch(() => userStore.user, (val) => {
  if (val) {
    form.avatar = val.avatar || ''
    form.nickname = val.nickname || ''
    form.phone = val.phone || ''
    form.email = val.email || ''
    syncVerifyFormFromUser()
  }
}, { immediate: true })

watch(activeTab, async (tab) => {
  if (tab === 'orders' && !recentOrders.value.length) {
    await loadRecentOrders()
  }
  if (tab === 'reviews') {
    await loadReviewableOrders()
  }
  if (tab === 'verify') {
    // 每次进入都从最新用户信息同步一次，避免本地表单与后端不一致
    syncVerifyFormFromUser()
  }
  if (tab === 'coupons' && !coupons.value.length) {
    await loadCoupons(couponStatus.value)
  }
})

async function saveProfile() {
  try {
    await updateProfileApi(form)
    userStore.updateUserInfo(form)
    ElMessage.success('资料保存成功')
  } catch (e) {
    console.error('保存资料失败', e)
    ElMessage.error('保存失败，请重试')
  }
}

// 头像上传前校验
function beforeAvatarUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.warning('上传图片只能是图片格式！')
    return false
  }
  if (!isLt2M) {
    ElMessage.warning('上传图片大小不能超过 2MB！')
    return false
  }
  return true
}

// 自定义头像上传：调后端接口，文件存储到服务器并同步更新 member.avatar
async function handleAvatarUpload({ file }) {
  try {
    await updateAvatarApi(file)
    await userStore.fetchUserInfo()
    form.avatar = userStore.user?.avatar || ''
    ElMessage.success('头像更新成功')
  } catch (e) {
    console.error('头像上传失败', e)
    ElMessage.error('头像上传失败')
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchUserInfo()
    // 预加载可评价订单数量（用于侧边栏徽标显示）
    loadReviewableOrders()
  }
})
</script>

<style lang="scss" scoped>
.profile-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: $space-xl;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.user-card {
  text-align: center;
  padding: $space-lg;
  background: $color-bg-gray;
  border-radius: $radius-none;
  border: 1px solid $color-border;
  margin-bottom: $space-base;
  .user-name { font-size: $font-size-md; font-weight: $font-weight-medium; margin-top: $space-sm; color: $color-text; }
  .user-level { font-size: $font-size-xs; color: var(--lux-primary-text); }
}

.profile-sidebar {
  // 粘性固定：右侧内容长滚动时，左侧菜单始终可见，用户随时可切换 tab
  // 关键：grid 子项默认 align-items: stretch 会拉满高度导致 sticky 失效，必须 align-self: start
  position: sticky;
  top: $header-height + $space-base; // 顶部固定 header 下方留 16px 呼吸空间
  align-self: start;
  // 防御性：菜单项未来增多时，左侧栏自身也可滚动，不会撑出视口
  max-height: calc(100vh - #{$header-height} - #{$space-md});
  overflow-y: auto;
  // 移动端单列布局：取消 sticky，避免侧边栏占位挡住下方内容
  @include respond-to('md') {
    position: static;
    max-height: none;
    overflow: visible;
  }
  :deep(.el-menu) {
    background: transparent;
    border-right: none;
  }
  :deep(.el-menu-item) {
    color: $color-text-secondary;
    &:hover {
      color: var(--lux-primary-text);
      background: transparent;
    }
    &.is-active {
      color: var(--lux-primary-text);
      background: transparent;
    }
  }
}

.panel-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  margin-bottom: $space-base;
  color: $color-text;
}

.panel-desc {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
  margin-bottom: $space-lg;
  padding: $space-sm $space-base;
  background: $color-bg-gray;
  border-left: 2px solid var(--lux-primary-text);
}

.profile-form { max-width: 480px; }

// 头像区域：头像 + 说明文字横向排列
.avatar-section {
  display: flex;
  align-items: center;
  gap: $space-lg;
  padding: $space-base 0 $space-xl;
  margin-bottom: $space-base;
  border-bottom: 1px solid var(--lux-border);
}
.avatar-uploader {
  :deep(.el-upload) { display: block; }
}
.avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: $radius-full;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  :deep(.el-avatar) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: $font-size-xs;
  opacity: 0;
  transition: opacity $transition-fast;
  .el-icon { line-height: 1; }
}
.avatar-wrap:hover .avatar-mask { opacity: 1; }
.avatar-meta {
  .avatar-name {
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    color: var(--lux-text);
    margin-bottom: $space-xs;
  }
  .avatar-hint {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
    line-height: 1.6;
  }
}

// ---------- 我的订单（最近 3 单） ----------
.order-list { display: flex; flex-direction: column; gap: $space-base; }
.order-card {
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-base $space-md;
  cursor: pointer;
  transition: transform $transition-base;
  &:hover { transform: translateY(-2px); }
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $space-base;
  border-bottom: 1px solid $color-divider;
  margin-bottom: $space-base;
  .order-no { font-size: $font-size-sm; color: $color-text-secondary; }
  .order-status {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    &.pending { color: $color-warning; }
    &.renting { color: var(--lux-primary-text); }
    &.completed { color: $color-success; }
    &.cancelled { color: $color-text-tertiary; }
  }
  .review-tag {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    padding: 2px 8px;
    border-radius: $radius-none;
    &.unreviewed { background: rgba(218, 41, 28, 0.12); color: var(--lux-primary-text); }
    &.reviewed { background: rgba(76, 152, 185, 0.15); color: $color-info; }
  }
}

// 侧边栏菜单项右侧计数胶囊（行内元素，垂直居中）
.menu-count-badge {
  margin-left: auto;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  line-height: 1;
  color: #fff;
  background: var(--lux-primary-text);
  border-radius: $radius-full;
}

// 面板标题计数
.panel-title-count {
  display: inline-block;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: var(--lux-primary-text);
  background: rgba(218, 41, 28, 0.12);
  padding: 1px 8px;
  border-radius: $radius-full;
  margin-left: $space-xs;
}

// 可评价订单卡片
.reviewable-card .review-btn {
  margin-top: $space-xs;
}
.order-body {
  display: flex;
  gap: $space-base;
  align-items: center;
  .order-img { width: 100px; height: 70px; border-radius: $radius-none; object-fit: cover; }
  .order-info {
    flex: 1;
    h4 { font-size: $font-size-base; font-weight: $font-weight-medium; margin-bottom: $space-xs; }
    p { font-size: $font-size-sm; color: $color-text-secondary; }
    .order-store { font-size: $font-size-xs; color: $color-text-tertiary; }
  }
  .order-amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    .amount { font-size: $font-size-lg; font-weight: $font-weight-medium; color: var(--lux-primary-text); }
  }
}
.view-all-bar {
  display: flex;
  justify-content: center;
  margin-top: $space-lg;
}

// ---------- 实名认证 / 驾驶证 ----------
.verify-form { max-width: 640px; }
.form-section-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $color-text;
  margin: $space-lg 0 $space-base;
  padding-left: $space-xs;
  border-left: 3px solid var(--lux-primary-text);
}
.upload-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-base;
  margin-bottom: $space-lg;
  @include respond-to('sm') { grid-template-columns: 1fr; }
}
.upload-item {
  text-align: center;
}
.verify-uploader {
  :deep(.el-upload) { display: block; width: 100%; }
}
.upload-box {
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px dashed $color-border;
  border-radius: $radius-none;
  background: $color-bg-gray;
  overflow: hidden;
  cursor: pointer;
  transition: border-color $transition-fast;
  &:hover { border-color: var(--lux-primary-text); }
}
.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  color: $color-text-tertiary;
  font-size: $font-size-xs;
  .el-icon { color: $color-text-secondary; }
}
.upload-label {
  margin-top: $space-xs;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.coupon-list { display: flex; flex-direction: column; gap: $space-base; }

// 状态分组 tabs
.coupon-tabs {
  display: flex;
  gap: $space-xs;
  margin-bottom: $space-lg;
  border-bottom: 1px solid $color-divider;
  flex-wrap: wrap;
}
.coupon-tab {
  position: relative;
  padding: $space-sm $space-md;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  display: flex;
  align-items: center;
  gap: $space-xs;
  transition: color $transition-fast;
  &:hover { color: $color-text; }
  &.active {
    color: var(--lux-primary-text);
    &::after {
      content: '';
      position: absolute;
      left: $space-md;
      right: $space-md;
      bottom: -1px;
      height: 2px;
      background: var(--lux-primary-text);
    }
  }
  .count {
    font-size: $font-size-xs;
    padding: 1px 8px;
    background: $color-bg-gray-dark;
    color: $color-text-tertiary;
    border-radius: $radius-full;
    min-width: 20px;
    text-align: center;
  }
  &.active .count {
    background: rgba(218, 41, 28, 0.12);
    color: var(--lux-primary-text);
  }
}
</style>
