<template>
  <router-view v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore, useCartStore } from '@/stores'

// 启动时应用持久化的主题 + 初始化购物车
const appStore = useAppStore()
const cartStore = useCartStore()
onMounted(() => {
  appStore.applyTheme()
  cartStore.initCart()
})
</script>
