<template>
  <transition name="fade">
    <div v-show="visible" class="back-top" @click="scrollTop">
      <el-icon :size="20"><Top /></el-icon>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { browserUtil } from '@/utils'

const visible = ref(false)

const onScroll = () => {
  visible.value = window.scrollY > 400
}

function scrollTop() {
  browserUtil.scrollTop()
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style lang="scss" scoped>
.back-top {
  position: fixed;
  right: $space-lg;
  bottom: $space-xl;
  z-index: $z-backtop;
  width: 44px;
  height: 44px;
  border-radius: $radius-none;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $color-text-secondary;
  transition: color $transition-base, border-color $transition-base, transform $transition-base;

  &:hover {
    color: var(--lux-primary-text);
    border-color: $color-primary;
    transform: translateY(-2px);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity $transition-fast;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
