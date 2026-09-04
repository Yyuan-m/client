<template>
  <div class="complaint-page section">
    <div class="container">
      <h2 class="section-title">售后投诉</h2>
      <p class="page-desc">遇到用车问题或服务不周？请填写以下信息，我们将在 1-3 个工作日内处理并反馈。</p>

      <div class="complaint-card">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px" class="complaint-form">
          <!-- 投诉类型：字典 complaint_type 卡片式单选 -->
          <el-form-item label="投诉类型" prop="type">
            <el-radio-group v-model="form.type" class="type-group">
              <el-radio-button
                v-for="item in typeOptions"
                :key="item.dictValue"
                :value="item.dictValue"
                class="type-option"
              >
                {{ item.dictLabel }}
              </el-radio-button>
            </el-radio-group>
            <div v-if="!typeOptions.length" class="type-empty">投诉类型加载中...</div>
          </el-form-item>

          <!-- 关联订单（必填，从用户自己的订单中选择） -->
          <el-form-item label="关联订单" prop="orderNo">
            <el-select
              v-model="form.orderNo"
              placeholder="请选择要投诉的订单"
              filterable
              style="width: 100%"
              :loading="orderLoading"
              no-data-text="暂无订单，请先下单租车"
            >
              <el-option
                v-for="o in orderOptions"
                :key="o.orderNo"
                :label="`${o.orderNo} · ${o.carName || '车辆'}（${o.statusName || ''}）`"
                :value="o.orderNo"
              />
            </el-select>
          </el-form-item>

          <!-- 投诉描述 -->
          <el-form-item label="投诉描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="5"
              maxlength="1000"
              show-word-limit
              placeholder="请详细描述您遇到的问题，如车况、服务、费用、押金、违章等（必填）"
            />
          </el-form-item>

          <!-- 凭证图片 -->
          <el-form-item label="凭证图片">
            <div class="upload-wrap">
              <el-upload
                v-model:file-list="fileList"
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
              <p class="upload-hint">支持 JPG/PNG 等图片格式，单张不超过 5MB，最多 9 张（选填，可上传合同/车况/费用截图等凭证）</p>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">提交投诉</el-button>
            <el-button size="large" @click="$router.push('/complaint/list')">我的投诉记录</el-button>
          </el-form-item>
        </el-form>

        <div class="complaint-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>提交后可在「个人中心 - 售后投诉」或「我的投诉记录」中查看处理进度与结果。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera, InfoFilled } from '@element-plus/icons-vue'
import { getDictByTypeApi } from '@/api/modules/system'
import { submitComplaintApi } from '@/api/modules/complaint'
import { getOrderListApi } from '@/api/modules/order'
import service from '@/utils/request'

const route = useRoute()
const formRef = ref(null)
const submitting = ref(false)
const typeOptions = ref([])
const orderOptions = ref([])
const orderLoading = ref(false)

const form = reactive({
  type: '',
  orderNo: '',
  description: ''
})

// 凭证图片上传：uploadedUrls 记录上传成功的 URL（与评价上传同一套模式）
const fileList = ref([])
const uploadedUrls = ref([])
const uploadingCount = ref(0)

const rules = {
  orderNo: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  type: [{ required: true, message: '请选择投诉类型', trigger: 'change' }],
  description: [{ required: true, message: '请填写投诉描述', trigger: 'blur' }]
}

onMounted(async () => {
  // 并行加载投诉类型 + 用户自己的订单（用于关联订单下拉）
  await Promise.all([loadTypes(), loadOrders()])
  // 从订单详情进入时自动选中对应订单
  if (route.query.orderNo && orderOptions.value.some((o) => o.orderNo === route.query.orderNo)) {
    form.orderNo = String(route.query.orderNo)
  }
})

/** 加载用户自己的订单（全部状态，供关联订单选择） */
async function loadOrders() {
  orderLoading.value = true
  try {
    const res = await getOrderListApi({ page: 1, pageSize: 100 }, { noDedup: true })
    orderOptions.value = res.list || []
  } catch (e) {
    console.error('加载我的订单失败', e)
    orderOptions.value = []
  } finally {
    orderLoading.value = false
  }
}

async function loadTypes() {
  try {
    typeOptions.value = (await getDictByTypeApi('complaint_type')) || []
    // 默认选中第一项，方便快速提交
    if (!form.type && typeOptions.value.length) {
      form.type = typeOptions.value[0].dictValue
    }
  } catch (e) {
    console.error('加载投诉类型失败', e)
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
    const res = await service.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          onProgress({ percent: Math.round((progressEvent.loaded * 100) / progressEvent.total) })
        }
      }
    })
    if (res?.url) uploadedUrls.value.push(res.url)
    onSuccess(res)
  } catch (e) {
    console.error('凭证图片上传失败', e)
    ElMessage.error('图片上传失败，请重试')
    onError(e)
  } finally {
    uploadingCount.value--
  }
}

function handleFileRemove(file, newFileList) {
  fileList.value = newFileList
  const url = file?.response?.url
  if (url) uploadedUrls.value = uploadedUrls.value.filter((u) => u !== url)
}

async function handleSubmit() {
  await formRef.value.validate()
  if (uploadingCount.value > 0) {
    ElMessage.warning('图片正在上传，请稍候')
    return
  }
  submitting.value = true
  try {
    await submitComplaintApi({
      type: form.type,
      orderNo: form.orderNo || undefined,
      description: form.description,
      images: uploadedUrls.value
    })
    ElMessage.success('投诉提交成功，我们将尽快处理')
    form.type = typeOptions.value[0]?.dictValue || ''
    form.orderNo = ''
    form.description = ''
    fileList.value = []
    uploadedUrls.value = []
  } catch (e) {
    // 错误提示已由 request.js 统一弹出
    console.error('投诉提交失败', e)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.complaint-page {
  .page-desc {
    color: $color-text-secondary;
    font-size: $font-size-sm;
    margin-bottom: $space-lg;
  }

  .complaint-card {
    background: $color-bg-gray;
    border: 1px solid $color-divider;
    border-radius: $radius-lg;
    padding: $space-xl;

    .type-group {
      display: flex;
      flex-wrap: wrap;
      gap: $space-sm;

      :deep(.el-radio-button__inner) {
        border-radius: $radius-md !important;
        padding: 8px 18px;
      }
    }

    .upload-wrap {
      width: 100%;
      .upload-hint {
        font-size: $font-size-xs;
        color: $color-text-tertiary;
        margin-top: $space-xs;
        line-height: 1.6;
      }
    }

    .complaint-tip {
      margin-top: $space-md;
      padding: $space-sm $space-md;
      background: rgba(var(--lux-primary-rgb, 217, 41, 28), 0.06);
      border-radius: $radius-md;
      display: flex;
      align-items: center;
      gap: $space-xs;
      font-size: $font-size-xs;
      color: $color-text-secondary;

      .el-icon {
        color: var(--lux-primary-text);
      }
    }
  }
}
</style>
