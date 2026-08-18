<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧品牌视觉区 -->
      <div class="auth-left" :style="{ background: 'url(' + resolveClientImage('/uploads/banners/login_bg.jpg') + ') center/cover no-repeat' }">
        <div class="auth-left-overlay"></div>
        <div class="auth-left-content">
          <router-link to="/" class="auth-logo">
            <span class="logo-mark">LC</span>
            <span class="logo-text">LUXURY CAR</span>
          </router-link>
          <h2 class="auth-heading">欢迎回来</h2>
          <p class="auth-subtitle">登录后尊享专属租车服务</p>
          <ul class="auth-features">
            <li><el-icon><CircleCheckFilled /></el-icon> 全球顶级品牌车型</li>
            <li><el-icon><CircleCheckFilled /></el-icon> 全保险保障无忧出行</li>
            <li><el-icon><CircleCheckFilled /></el-icon> 专属管家尊享服务</li>
          </ul>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="auth-right">
        <div class="auth-form-wrapper">
          <h3 class="form-title">账号登录</h3>
          <p class="form-desc">输入您的用户名和密码登录</p>
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" clearable />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password @keyup.enter="handleLogin" />
            </el-form-item>
            <div class="form-options">
              <el-checkbox v-model="remember">记住密码</el-checkbox>
              <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
            </div>
            <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="handleLogin">登录</el-button>
            <div class="form-footer">
              还没有账号？<router-link to="/register" class="link">立即注册</router-link>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, CircleCheckFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { storage } from '@/utils'
import { resolveClientImage } from '@/utils/image'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const remember = ref(storage.get('lux_remember_login', false))

const form = reactive({ username: storage.get('lux_saved_username', ''), password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await userStore.login(form)
    if (remember.value) {
      storage.set('lux_saved_username', form.username)
    } else {
      storage.remove('lux_saved_username')
    }
    storage.set('lux_remember_login', remember.value)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
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
  min-height: 560px;
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

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-lg;
  .forgot-link { font-size: $font-size-sm; color: var(--lux-primary-text); }
}

.submit-btn { width: 100%; border-radius: $radius-none; }

.form-footer {
  text-align: center;
  margin-top: $space-lg;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  .link { color: var(--lux-primary-text); }
}
</style>
