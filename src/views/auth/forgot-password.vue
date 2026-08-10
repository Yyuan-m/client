<template>
  <div class="auth-page">
    <div class="auth-container single">
      <div class="auth-right">
        <h3 class="form-title">重置密码</h3>
        <el-steps :active="step" align-center class="reset-steps">
          <el-step title="验证身份" />
          <el-step title="设置新密码" />
          <el-step title="完成" />
        </el-steps>

        <!-- 第一步：验证手机号 -->
        <el-form v-if="step === 0" ref="form1Ref" :model="form1" :rules="rules1">
          <el-form-item prop="phone">
            <el-input v-model="form1.phone" placeholder="注册手机号" :prefix-icon="Phone" size="large" maxlength="11" />
          </el-form-item>
          <el-form-item prop="code">
            <div class="code-row">
              <el-input v-model="form1.code" placeholder="验证码" size="large" />
              <el-button :disabled="counting > 0" @click="sendCode">{{ counting > 0 ? `${counting}s` : '获取验证码' }}</el-button>
            </div>
          </el-form-item>
          <el-button type="primary" size="large" class="submit-btn" @click="nextStep">下一步</el-button>
        </el-form>

        <!-- 第二步：设置新密码 -->
        <el-form v-else-if="step === 1" ref="form2Ref" :model="form2" :rules="rules2">
          <el-form-item prop="password">
            <el-input v-model="form2.password" type="password" placeholder="新密码（6-20位字母+数字）" :prefix-icon="Lock" size="large" show-password />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="form2.confirmPassword" type="password" placeholder="确认新密码" :prefix-icon="Lock" size="large" show-password />
          </el-form-item>
          <el-button type="primary" size="large" class="submit-btn" @click="resetPassword">确认重置</el-button>
        </el-form>

        <!-- 完成 -->
        <div v-else class="reset-success">
          <el-icon :size="48" color="#03904a"><CircleCheckFilled /></el-icon>
          <p>密码重置成功</p>
          <el-button type="primary" @click="$router.push('/login')">返回登录</el-button>
        </div>

        <div class="form-footer">
          <router-link to="/login" class="link">返回登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Phone, Lock } from '@element-plus/icons-vue'
import { validators as v } from '@/utils'
import { forgotPasswordApi, sendSmsCodeApi } from '@/api/modules/auth'

const step = ref(0)
const counting = ref(0)
const form1Ref = ref()
const form2Ref = ref()

const form1 = reactive({ phone: '', code: '' })
const form2 = reactive({ password: '', confirmPassword: '' })

const rules1 = {
  phone: [{ required: true, validator: (r, val, cb) => v.isPhone(val) ? cb() : cb(new Error('请输入正确的手机号')), trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}
const rules2 = {
  password: [{ required: true, validator: (r, val, cb) => v.isPassword(val) ? cb() : cb(new Error('密码需6-20位，含字母和数字')), trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: (r, val, cb) => val === form2.password ? cb() : cb(new Error('两次密码不一致')), trigger: 'blur' }]
}

let timer = null
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function sendCode() {
  if (!v.isPhone(form1.phone)) return ElMessage.warning('请输入正确的手机号')
  try {
    await sendSmsCodeApi({ phone: form1.phone })
  } catch {
    return
  }
  ElMessage.success('验证码已发送')
  counting.value = 60
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    counting.value--
    if (counting.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

async function nextStep() {
  try {
    await form1Ref.value.validate()
  } catch {
    return
  }
  step.value = 1
}

async function resetPassword() {
  try {
    await form2Ref.value.validate()
  } catch {
    return
  }
  try {
    await forgotPasswordApi({ phone: form1.phone, code: form1.code, password: form2.password })
  } catch {
    return
  }
  step.value = 2
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-bg;
  padding: $space-md;
}
.auth-container {
  max-width: 440px;
  width: 100%;
  background: $color-bg;
  border-radius: $radius-none;
  border: 1px solid $color-border;
}
.auth-right { padding: $space-2xl; }
.form-title { font-size: $font-size-xl; font-weight: $font-weight-medium; margin-bottom: $space-xl; text-align: center; color: $color-text; }
.reset-steps {
  margin-bottom: $space-xl;
  :deep(.el-step__head.is-process),
  :deep(.el-step__head.is-finish) {
    color: var(--lux-primary-text);
    border-color: $color-primary;
    .el-step__icon { color: var(--lux-primary-text); }
  }
  :deep(.el-step__title.is-process),
  :deep(.el-step__title.is-finish) {
    color: var(--lux-primary-text);
  }
}
.code-row {
  display: flex;
  gap: $space-sm;
  width: 100%;
  .el-button { border-radius: $radius-none; flex-shrink: 0; }
}
.submit-btn { width: 100%; margin-top: $space-base; border-radius: $radius-none; }
.reset-success { text-align: center; padding: $space-xl 0; p { font-size: $font-size-md; margin: $space-base 0 $space-lg; color: $color-text; } .el-button { border-radius: $radius-none; } }
.form-footer { text-align: center; margin-top: $space-lg; font-size: $font-size-sm; .link { color: var(--lux-primary-text); } }
</style>
