<template>
  <header class="app-header" :class="{ scrolled: isScrolled }">
    <div class="header-inner">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <span class="logo-text">LUXURY CAR</span>
      </router-link>

      <!-- 导航 -->
      <nav class="nav-menu">
        <router-link to="/" class="nav-link" :class="{ active: isActive('/') }">首页</router-link>
        <el-dropdown trigger="hover" @command="goVehicles">
          <span class="nav-link" :class="{ active: isActive('/vehicles') }">车型选择<el-icon class="nav-arrow"><ArrowDown /></el-icon></span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="all">全部车型</el-dropdown-item>
              <el-dropdown-item v-for="item in vehicleTypes" :key="item.dictValue" :command="item.dictValue">{{ item.dictLabel }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 公告下拉：hover 展示 3 条高优先级公告 + 查看全部 -->
        <el-dropdown trigger="hover" popper-class="announcement-popper" @command="onAnnouncementCommand">
          <span class="nav-link" :class="{ active: isActive('/announcements') }">
            <el-icon class="nav-bell"><Bell /></el-icon>公告
            <span v-if="topAnnouncements.length" class="anno-dot">{{ topAnnouncements.length }}</span>
            <el-icon class="nav-arrow"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <template v-if="topAnnouncements.length">
                <el-dropdown-item v-for="item in topAnnouncements" :key="item.id" :command="item.id">
                  <div class="anno-pop-item">
                    <span class="anno-pop-title">{{ item.title }}</span>
                    <span class="anno-pop-date">{{ item.createdAt?.slice(0, 10) }}</span>
                  </div>
                </el-dropdown-item>
              </template>
              <el-dropdown-item v-else disabled>
                <span class="anno-pop-empty">暂无公告</span>
              </el-dropdown-item>
              <el-dropdown-item command="all" divided>
                <span class="anno-pop-all">查看全部公告 →</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <router-link to="/about" class="nav-link" :class="{ active: isActive('/about') }">关于我们</router-link>
        <router-link to="/contact" class="nav-link" :class="{ active: isActive('/contact') }">联系客服</router-link>
      </nav>

      <!-- 右侧操作 -->
      <div class="header-actions">
        <!-- 主题切换 -->
        <button class="action-item theme-toggle" @click="appStore.toggleTheme" :title="appStore.isDark() ? '切换到亮色模式' : '切换到暗色模式'">
          <el-icon :size="20"><Sunny v-if="appStore.isDark()" /><Moon v-else /></el-icon>
        </button>

        <!-- 购物车 -->
        <router-link to="/cart" class="action-item cart-action">
          <el-badge :value="cartStore.totalCount" :hidden="cartStore.totalCount === 0" class="cart-badge">
            <el-icon :size="20"><ShoppingCart /></el-icon>
          </el-badge>
        </router-link>

        <!-- 未登录 -->
        <template v-if="!userStore.isLoggedIn">
          <router-link to="/login" class="btn-outline header-btn">登录</router-link>
          <router-link to="/register" class="btn-fill header-btn">注册</router-link>
        </template>

        <!-- 已登录 -->
        <el-dropdown v-else trigger="hover" @command="handleUserCommand">
          <div class="user-info">
            <el-avatar :size="32" :src="resolveClientImage(userStore.user?.avatar)">{{ userStore.nickname?.charAt(0) }}</el-avatar>
            <span class="user-name">{{ userStore.nickname }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="orders">我的订单</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore, useCartStore, useAppStore } from '@/stores'
import { getDictByTypeApi } from '@/api/modules/system'
import { getTopAnnouncementsApi } from '@/api/modules/announcement'
import { resolveClientImage } from '@/utils/image'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const appStore = useAppStore()
const isScrolled = ref(false)

// 车型分类字典（从后台 car_rental.sys_dict_data 加载）
const vehicleTypes = ref([])

// 头部下拉：3 条高优先级公告
const topAnnouncements = ref([])

const onScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  // 加载车型分类字典，供导航下拉使用
  getDictByTypeApi('vehicle_type')
    .then((list) => { vehicleTypes.value = list || [] })
    .catch((e) => console.error('加载车型分类字典失败', e))
  // 加载头部公告下拉数据
  getTopAnnouncementsApi()
    .then((list) => { topAnnouncements.value = list || [] })
    .catch((e) => console.error('加载公告失败', e))
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

function goVehicles(type) {
  router.push({ path: '/vehicles', query: { type: type === 'all' ? undefined : type } })
}

// 当前页 tab 高亮：首页严格匹配，其余按前缀匹配（含子路由）
function isActive(prefix) {
  const path = route.path
  if (prefix === '/') return path === '/'
  return path === prefix || path.startsWith(prefix + '/')
}

// 公告下拉：点击跳转列表或详情
function onAnnouncementCommand(command) {
  if (command === 'all') {
    router.push('/announcements')
  } else {
    router.push(`/announcements/${command}`)
  }
}

async function handleUserCommand(command) {
  if (command === 'profile') router.push('/profile')
  else if (command === 'orders') router.push('/orders')
  else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出当前账号吗？', '退出登录', {
        type: 'warning',
        confirmButtonText: '退出',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }
    try {
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/')
    } catch (e) {
      console.error('退出登录失败:', e)
    }
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: $z-header;
  height: $header-height;
  background: transparent;
  border-bottom: 1px solid transparent;
  backdrop-filter: blur(0);
  transition: background $transition-base, border-color $transition-base;

  // 滚动后显示背景 + 发丝线分隔（无阴影）
  &.scrolled {
    background: var(--lux-header-bg);
    backdrop-filter: saturate(180%) blur(20px);
    border-bottom-color: $color-border;
  }
}

.header-inner {
  @include content-container;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-text {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $color-text;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: $space-lg;
}

.nav-link {
  @include nav-link-type;
  color: $color-text;
  display: inline-flex;
  align-items: center;
  gap: $space-xxxs;
  transition: color $transition-fast;
  cursor: pointer;
  &:hover { color: var(--lux-primary-text); }
  // 当前页高亮
  &.active { color: var(--lux-primary-text); }
}

.nav-arrow { font-size: $font-size-xs; }
.nav-bell { font-size: $font-size-base; }

// 公告高优先级数量徽章
.anno-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  margin-left: 2px;
  border-radius: $radius-full;
  background: $color-primary;
  color: #fff;
  font-size: 10px;
  font-weight: $font-weight-bold;
  line-height: 1;
  letter-spacing: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: $space-sm;
}

.action-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  width: 36px;
  color: $color-text;
  cursor: pointer;
  border-radius: $radius-none;
  text-decoration: none;
  transition: color $transition-fast, background-color $transition-fast;
  &:hover { color: var(--lux-primary-text); background: var(--lux-bg-gray); }
}

.theme-toggle {
  background: none;
  border: none;
  padding: 0;
}

// 修复 el-badge 导致购物车图标偏上
.cart-badge {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
}

.header-btn {
  padding: 6px 20px;
  font-size: $font-size-sm;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.user-name {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  max-width: 100px;
  @include ellipsis;
}

@include respond-to('md') {
  .nav-menu { gap: $space-md; }
  .nav-link { font-size: $font-size-xs; }
  .user-name { display: none; }
}
</style>

<!-- 公告下拉面板：popper 被 teleport 到 body，使用非 scoped + popper-class 定制 -->
<style lang="scss">
.announcement-popper.el-dropdown__popper {
  // 面板宽度
  .el-dropdown-menu {
    min-width: 320px;
    max-width: 360px;
    padding: 0;
  }

  .el-dropdown-menu__item {
    padding: 10px 16px;
    line-height: 1.4;
  }

  // 高优先级公告条目
  .anno-pop-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }
  .anno-pop-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--lux-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .anno-pop-date {
    font-size: 11px;
    color: var(--lux-text-tertiary);
  }

  // 空状态
  .anno-pop-empty {
    font-size: 13px;
    color: var(--lux-text-tertiary);
  }

  // 查看全部
  .anno-pop-all {
    width: 100%;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: $color-primary;
  }
}
</style>
