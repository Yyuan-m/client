<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="currentRound === 2 ? '追加评价' : '订单评价'"
    width="720px"
    top="6vh"
    class="review-dialog"
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <div v-if="dialogLoading" v-loading="true" class="dialog-loading"></div>
    <template v-else-if="order">
      <!-- 订单信息卡片 -->
      <div class="order-info-card">
        <img :src="resolveAdminImage(order.carCover)" :alt="order.carName" class="order-img" />
        <div class="order-meta">
          <h3>{{ order.carName }}</h3>
          <p>{{ order.startDate }} 至 {{ order.endDate }}（{{ order.days }}天）</p>
          <p class="order-store">{{ order.store }}</p>
          <span class="order-no">订单号：{{ order.orderNo }}</span>
        </div>
        <div class="order-amount">
          <span class="amount">￥{{ moneyUtil.format(order.totalAmount) }}</span>
        </div>
      </div>

      <!-- 已有评价（追评时展示首评） -->
      <div v-if="existingReviews.length" class="existing-reviews">
        <h4 class="block-title">已发表的评价</h4>
        <div v-for="rv in existingReviews" :key="rv.id" class="review-history-card">
          <div class="review-history-head">
            <span class="round-tag" :class="rv.reviewRound === 1 ? 'first' : 'append'">
              {{ rv.reviewRound === 1 ? '首次评价' : '追加评价' }}
            </span>
            <div class="review-stars">
              <el-icon v-for="n in rv.rating" :key="n" class="star"><StarFilled /></el-icon>
            </div>
            <span class="review-date">{{ rv.date }}</span>
          </div>
          <p class="review-history-content">{{ rv.content }}</p>
          <div v-if="parseImages(rv.images).length" class="review-images">
            <img v-for="(img, i) in parseImages(rv.images)" :key="i" :src="resolveClientImage(img)" class="review-img" @click="previewImage(parseImages(rv.images).map(resolveClientImage), i)" />
          </div>
        </div>
      </div>

      <!-- 评价表单 -->
      <div class="review-form-card">
        <h4 class="block-title">
          {{ currentRound === 2 ? '写下您的追加评价' : '写下您的评价' }}
          <span class="round-hint">{{ currentRound === 2 ? '（第2次，每单最多2次）' : '（第1次，完成后可追加1次）' }}</span>
        </h4>

        <el-form :model="form" label-position="top" class="review-form">
          <el-form-item label="总体评分">
            <el-rate v-model="form.rating" :max="5" :colors="rateColors" :texts="['很差', '较差', '一般', '满意', '非常满意']" show-text />
          </el-form-item>

          <el-form-item label="评价内容">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="分享您的用车体验、车况、服务感受..."
            />
          </el-form-item>

          <el-form-item label="评价图片（可选，最多9张）">
            <el-upload
              :file-list="fileList"
              list-type="picture-card"
              :http-request="customUpload"
              :on-remove="handleFileRemove"
              :before-upload="beforeImageUpload"
              accept="image/*"
              multiple
              :limit="9"
            >
              <template #default>
                <el-icon :size="24"><Camera /></el-icon>
              </template>
            </el-upload>
            <p class="upload-hint">支持 JPG/PNG，单张不超过 5MB</p>
          </el-form-item>
        </el-form>
      </div>
    </template>
    <EmptyTips v-else text="订单不存在或不可评价" />

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!order || dialogLoading" @click="handleSubmit">
        {{ currentRound === 2 ? '提交追评' : '提交评价' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { StarFilled, Camera } from '@element-plus/icons-vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import { getOrderDetailApi } from '@/api/modules/order'
import { getCanReviewRoundApi, getOrderReviewsApi, submitReviewApi } from '@/api/modules/review'
import { useAppStore } from '@/stores'
import { moneyUtil } from '@/utils'
import { resolveAdminImage, resolveClientImage } from '@/utils/image'
import service from '@/utils/request'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  orderId: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:modelValue', 'success'])

const appStore = useAppStore()

const dialogLoading = ref(false)
const submitting = ref(false)
const order = ref(null)
const currentRound = ref(1) // 1=首评, 2=追评
const existingReviews = ref([])

const form = reactive({
  rating: 5,
  content: ''
})

const rateColors = ['#f13a2c', '#f13a2c', '#da291c']

// 图片上传：使用 el-upload file-list，url 存储上传成功后的完整 URL
const fileList = ref([])
const uploadingCount = ref(0)

// 图片预览（调用全局 ImagePreview 组件）
function previewImage(list, index = 0) {
  appStore.openImagePreview(list, index)
}

// 解析 images 字段
function parseImages(imagesStr) {
  if (!imagesStr) return []
  try {
    const parsed = JSON.parse(imagesStr)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return imagesStr.split(',').map(s => s.trim()).filter(Boolean)
  }
}

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

/**
 * 自定义上传：覆盖 el-upload 默认行为，使用 axios onUploadProgress 实时更新进度
 * @param {Object} options el-upload 传入的选项，含 { file, onProgress, onSuccess, onError }
 */
async function customUpload(options) {
  const { file, onProgress, onSuccess, onError } = options
  if (!beforeImageUpload(file)) {
    onError(new Error('校验失败'))
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  uploadingCount.value++
  try {
    // 直接用 axios 实例发请求，传入 onUploadProgress 回调真实进度
    const res = await service.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          // 调用 el-upload 进度回调，更新文件状态和进度条
          onProgress({ percent })
        }
      }
    })
    // 响应拦截器对 code=200 已解包，res 即 { url: 'http://...' }
    onSuccess(res)
  } catch (e) {
    console.error('评价图片上传失败', e)
    ElMessage.error('图片上传失败，请重试')
    onError(e)
  } finally {
    uploadingCount.value--
  }
}

function handleFileRemove(file, newFileList) {
  fileList.value = newFileList
}

// 重置表单状态
function resetState() {
  order.value = null
  existingReviews.value = []
  currentRound.value = 1
  form.rating = 5
  form.content = ''
  fileList.value = []
  uploadingCount.value = 0
}

async function loadData(orderId) {
  dialogLoading.value = true
  try {
    const [orderData, roundRes, reviews] = await Promise.all([
      getOrderDetailApi(orderId),
      getCanReviewRoundApi(orderId),
      getOrderReviewsApi(orderId).catch(() => [])
    ])
    order.value = orderData
    existingReviews.value = reviews || []
    const round = roundRes?.canReviewRound
    if (round === 1 || round === 2) {
      currentRound.value = round
    } else {
      ElMessage.warning('该订单当前不可评价')
      emit('update:modelValue', false)
      return
    }
  } catch (e) {
    console.error('评价弹窗数据加载失败', e)
    ElMessage.error('数据加载失败')
    emit('update:modelValue', false)
  } finally {
    dialogLoading.value = false
  }
}

async function handleSubmit() {
  if (!form.rating) {
    ElMessage.warning('请选择评分')
    return
  }
  if (!form.content.trim()) {
    ElMessage.warning('请填写评价内容')
    return
  }
  if (uploadingCount.value > 0) {
    ElMessage.warning('图片正在上传，请稍候')
    return
  }
  // 收集已上传成功的图片完整 URL
  const urls = fileList.value.filter(f => f.response?.url).map(f => f.response.url)
  const imagesStr = urls.length ? JSON.stringify(urls) : null

  submitting.value = true
  try {
    await submitReviewApi({
      orderId: Number(props.orderId),
      rating: form.rating,
      content: form.content.trim(),
      images: imagesStr
    })
    ElMessage.success(currentRound.value === 2 ? '追评提交成功' : '评价提交成功')
    emit('success', Number(props.orderId))
    emit('update:modelValue', false)
  } catch (e) {
    console.error('评价提交失败', e)
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}

// 监听弹窗打开 + orderId 变化，自动加载数据
watch(
  () => [props.modelValue, props.orderId],
  ([visible, orderId]) => {
    if (visible && orderId) {
      resetState()
      loadData(orderId)
    }
  },
  { immediate: false }
)
</script>

<style lang="scss" scoped>
.dialog-loading {
  min-height: 320px;
}

// 订单信息卡片（紧凑）
.order-info-card {
  display: flex;
  gap: $space-base;
  align-items: center;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-xs $space-base;
  margin-bottom: $space-base;
  .order-img { width: 100px; height: 68px; object-fit: cover; border-radius: $radius-none; flex-shrink: 0; }
  .order-meta {
    flex: 1;
    h3 { font-size: $font-size-base; font-weight: $font-weight-medium; margin-bottom: 4px; color: $color-text; }
    p { font-size: $font-size-xs; color: $color-text-secondary; margin-bottom: 2px; }
    .order-store { font-size: $font-size-xs; color: $color-text-tertiary; margin-top: 2px; }
    .order-no { display: block; font-size: $font-size-xs; color: $color-text-tertiary; margin-top: 4px; }
  }
  .order-amount {
    .amount { font-size: $font-size-md; font-weight: $font-weight-medium; color: var(--lux-primary-text); }
  }
}

// 标题（紧凑）
.block-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $color-text;
  margin-bottom: $space-xs;
  padding-left: $space-xs;
  border-left: 3px solid var(--lux-primary-text);
  .round-hint {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
    font-weight: $font-weight-regular;
    // margin-left: $space-xs;
  }
}

// 已有评价（紧凑）
.existing-reviews {
  margin-bottom: $space-base;
}
.review-history-card {
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-xs $space-base;
  margin-bottom: $space-xs;
  &:last-child { margin-bottom: 0; }
}
.review-history-head {
  display: flex;
  align-items: center;
  gap: $space-base;
  margin-bottom: $space-xxs;
  .round-tag {
    font-size: $font-size-xs;
    padding: 2px 8px;
    border-radius: $radius-none;
    font-weight: $font-weight-medium;
    &.first { background: rgba(218, 41, 28, 0.12); color: var(--lux-primary-text); }
    &.append { background: rgba(76, 152, 185, 0.15); color: $color-info; }
  }
  .review-stars .star { color: var(--lux-primary-text); font-size: $font-size-sm; }
  .review-date { font-size: $font-size-xs; color: $color-text-tertiary; margin-left: auto; }
}
.review-history-content {
  font-size: $font-size-sm;
  color: $color-text;
  line-height: $line-height-base;
  margin-bottom: $space-xxs;
}
.review-images {
  display: flex;
  gap: $space-xs;
  flex-wrap: wrap;
  .review-img {
    width: 72px; height: 72px; object-fit: cover; border-radius: $radius-none;
    cursor: pointer; border: 1px solid $color-border;
    transition: opacity $transition-fast;
    &:hover { opacity: 0.8; }
  }
}

// 评价表单（紧凑）
.review-form-card {
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-base;
}
.review-form {
  :deep(.el-form-item) {
    margin-bottom: $space-base;
    &:last-child { margin-bottom: 0; }
  }
  :deep(.el-rate) {
    --el-rate-fill-color: #{$color-primary};
    --el-rate-active-color: #{$color-primary};
  }
  :deep(.el-upload--picture-card) {
    width: 88px; height: 88px; border-radius: $radius-none; background: transparent;
    border: 1px dashed $color-border;
    &:hover { border-color: var(--lux-primary-text); }
  }
  :deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 88px; height: 88px; border-radius: $radius-none;
  }
}
.upload-hint {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin: $space-xxs $space-xxs;
}
</style>

<style lang="scss">
// 弹窗非 scoped 样式：暗色主题适配 + 紧凑间距
.review-dialog {
  .el-dialog__header {
    margin-right: 0;
    padding-bottom: $space-xs;
    border-bottom: 1px solid var(--lux-border);
  }
  .el-dialog__title {
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    color: var(--lux-text);
  }
  .el-dialog__body {
    padding: $space-base $space-md;
    max-height: calc(100vh - 220px);
    overflow-y: auto;
  }
  .el-dialog__footer {
    padding-top: $space-xs;
  }
}
</style>
