<template>
  <router-view v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <!-- 会员升级蒙层动画（全局唯一实例，等级突破时由 useLevelUp 触发） -->
  <LevelUpOverlay v-model:visible="visible" :from-rule="fromRule" :to-rule="toRule" />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore, useCartStore } from '@/stores'
import { useLevelUp } from '@/composables/useLevelUp'
import LevelUpOverlay from '@/components/LevelUpOverlay/index.vue'

// 启动时应用持久化的主题 + 初始化购物车
const appStore = useAppStore()
const cartStore = useCartStore()
onMounted(() => {
  appStore.applyTheme()
  cartStore.initCart()
})

// 会员升级动画：watch user store，档位上升且未提示过时触发一次
const { visible, fromRule, toRule } = useLevelUp()
</script>
