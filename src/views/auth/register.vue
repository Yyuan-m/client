<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧品牌视觉区 -->
      <div class="auth-left" :style="{ background: 'url(' + resolveClientImage('/uploads/banners/register_bg.jpg') + ') center/cover no-repeat' }">
        <div class="auth-left-overlay"></div>
        <div class="auth-left-content">
          <router-link to="/" class="auth-logo">
            <span class="logo-mark">LC</span>
            <span class="logo-text">LUXURY CAR</span>
          </router-link>
          <h2 class="auth-heading">加入尊享俱乐部</h2>
          <p class="auth-subtitle">注册即可开启您的豪华出行之旅</p>
          <ul class="auth-features">
            <li><el-icon><CircleCheckFilled /></el-icon> 新用户首单享8折优惠</li>
            <li><el-icon><CircleCheckFilled /></el-icon> 50+ 高端车型任您挑选</li>
            <li><el-icon><CircleCheckFilled /></el-icon> 7×24 小时专属管家服务</li>
          </ul>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="auth-right">
        <div class="auth-form-wrapper">
          <h3 class="form-title">注册账号</h3>
          <p class="form-desc">使用用户名和密码即可快速注册</p>
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="用户名（3-20位字母数字下划线）" :prefix-icon="User" size="large" clearable />
            </el-form-item>
            <el-form-item prop="nickname">
              <el-input v-model="form.nickname" placeholder="昵称（选填）" :prefix-icon="EditPen" size="large" clearable />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="密码（6-20位字母+数字）" :prefix-icon="Lock" size="large" show-password />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" size="large" show-password @keyup.enter="handleRegister" />
            </el-form-item>
            <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="handleRegister">注 册</el-button>
            <div class="form-footer">
              已有账号？<router-link to="/login" class="link">返回登录</router-link>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, EditPen, CircleCheckFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { validators as v } from '@/utils'
import { resolveClientImage } from '@/utils/image'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ username: '', nickname: '', password: '', confirmPassword: '' })

const validateUsername = (rule, value, callback) => {
  if (!value) callback(new Error('请输入用户名'))
  else if (!v.isUsername(value)) callback(new Error('用户名需3-20位，字母开头，含字母数字下划线'))
  else callback()
}
const validatePassword = (rule, value, callback) => {
  if (!value) callback(new Error('请输入密码'))
  else if (!v.isPassword(value)) callback(new Error('密码需6-20位，含字母和数字'))
  else callback()
}
const validateConfirm = (rule, value, callback) => {
  if (!value) callback(new Error('请再次输入密码'))
  else if (value !== form.password) callback(new Error('两次密码不一致'))
  else callback()
}

const rules = {
  username: [{ required: true, validator: validateUsername, trigger: 'blur' }],
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }]
}

async function handleRegister() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    const { confirmPassword, ...payload } = form
    await userStore.register(payload)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch {
    // 错误已由 request 拦截器统一提示
  } finally {
    loading.value = false
  }
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 960px;
  width: 100%;
  min-height: 600px;
  background: $color-bg;
  border-radius: $radius-none;
  border: 1px solid $color-border;
  overflow: hidden;
  @include respond-to('md') { grid-template-columns: 1fr; min-height: auto; }
}

// ---------- 左侧品牌区 ----------
.auth-left {
  position: relative;
  display: flex;
  align-items: flex-end;
  @include respond-to('md') { display: none; }
}

.auth-left-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(218, 41, 28, 0.55) 0%, rgba(24, 24, 24, 0.92) 100%);
}

.auth-left-content {
  position: relative;
  z-index: 2;
  padding: $space-2xl;
  color: #fff;
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: $space-xs;
  margin-bottom: $space-xl;
  .logo-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px; height: 40px;
    background: $color-primary;
    color: #fff;
    font-size: $font-size-base;
    font-weight: $font-weight-bold;
    border-radius: $radius-sm;
    letter-spacing: 0;
  }
  .logo-text {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1.4px;
  }
}

.auth-heading {
  font-size: $font-size-2xl;
  font-weight: $font-weight-medium;
  margin-bottom: $space-sm;
  color: #fff;
}

.auth-subtitle {
  font-size: $font-size-base;
  opacity: 0.85;
  margin-bottom: $space-xl;
}

.auth-features {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-sm;
  li {
    display: flex;
    align-items: center;
    gap: $space-xs;
    font-size: $font-size-sm;
    opacity: 0.9;
    .el-icon { color: $color-primary-light; }
  }
}

// ---------- 右侧表单区 ----------
.auth-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-2xl;
}

.auth-form-wrapper {
  width: 100%;
  max-width: 360px;
}

.form-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-medium;
  margin-bottom: $space-xs;
  color: $color-text;
}

.form-desc {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  margin-bottom: $space-xl;
}

.submit-btn { width: 100%; border-radius: $radius-none; letter-spacing: 4px; }

.form-footer {
  text-align: center;
  margin-top: $space-lg;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  .link { color: var(--lux-primary-text); }
}
</style>
