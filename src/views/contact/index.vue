<template>
  <div class="contact-page section">
    <div class="container">
      <h2 class="section-title">联系客服</h2>
      <p class="section-subtitle">我们随时为您提供帮助</p>

      <div class="contact-grid">
        <!-- 联系方式 -->
        <div class="contact-info">
          <div class="contact-item">
            <el-icon :size="28"><Phone /></el-icon>
            <div>
              <h3>服务热线</h3>
              <p>{{ config?.phone || '' }}</p>
              <span class="time">7×24小时</span>
            </div>
          </div>
          <div class="contact-item">
            <el-icon :size="28"><Message /></el-icon>
            <div>
              <h3>邮箱</h3>
              <p>{{ config?.email || '' }}</p>
            </div>
          </div>
          <div class="contact-item">
            <el-icon :size="28"><ChatDotRound /></el-icon>
            <div>
              <h3>在线咨询</h3>
              <p>点击右侧浮窗与客服实时沟通</p>
            </div>
          </div>
          <div class="contact-item">
            <el-icon :size="28"><Location /></el-icon>
            <div>
              <h3>总部地址</h3>
              <p>{{ config?.address || '' }}</p>
            </div>
          </div>
        </div>

        <!-- 留言表单 -->
        <div class="contact-form">
          <h3 class="form-title">留言反馈</h3>
          <el-form :model="form" label-position="top" @submit.prevent="submit">
            <el-form-item label="姓名">
              <el-input v-model="form.name" placeholder="您的姓名" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="手机号" maxlength="11" />
            </el-form-item>
            <el-form-item label="留言内容">
              <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请描述您的问题或建议" />
            </el-form-item>
            <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">提交留言</el-button>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { validators } from '@/utils'
import { useSystemConfig } from '@/composables/useSystemConfig'
import { submitFeedbackApi } from '@/api/modules/feedback'

const { config, loadConfig } = useSystemConfig()
const loading = ref(false)
const form = reactive({ name: '', phone: '', content: '' })

onMounted(loadConfig)

async function submit() {
  if (!form.name || !form.phone || !form.content) return ElMessage.warning('请填写完整信息')
  if (!validators.isPhone(form.phone)) return ElMessage.warning('请输入正确的手机号')
  loading.value = true
  try {
    await submitFeedbackApi({ type: 'feedback', name: form.name, phone: form.phone, content: form.content })
    ElMessage.success('留言提交成功，我们将尽快联系您')
    form.name = form.phone = form.content = ''
  } catch (e) {
    console.error('留言提交失败', e)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-xl;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.contact-item {
  display: flex;
  gap: $space-base;
  padding: $space-base 0;
  border-bottom: 1px solid $color-divider;
  .el-icon { color: var(--lux-primary-text); margin-top: 4px; }
  h3 { font-size: $font-size-sm; color: $color-text-secondary; font-weight: $font-weight-medium; margin-bottom: $space-xs; }
  p { font-size: $font-size-base; font-weight: $font-weight-medium; }
  .time { font-size: $font-size-xs; color: $color-text-tertiary; }
}

.contact-form {
  background: $color-bg-gray;
  border-radius: $radius-none;
  padding: $space-lg;
}
.form-title { font-size: $font-size-md; font-weight: $font-weight-semibold; margin-bottom: $space-base; }
.submit-btn { width: 100%; }
</style>
