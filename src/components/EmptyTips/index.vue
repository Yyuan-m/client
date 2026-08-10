<template>
  <div class="empty-tips">
    <el-icon class="empty-icon" :size="64"><Box /></el-icon>
    <p class="empty-text">{{ text }}</p>
    <button v-if="showAction" class="btn-outline empty-action" @click="$emit('action')">{{ actionText }}</button>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: '暂无数据' },
  showAction: { type: Boolean, default: false },
  actionText: { type: String, default: '去逛逛' }
})
defineEmits(['action'])
</script>

<style lang="scss" scoped>
.empty-tips {
  padding: $space-2xl $space-md;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-base;
}

.empty-icon {
  color: $color-text-tertiary;
}

.empty-text {
  font-size: $font-size-base;
  color: $color-text-secondary;
}

.empty-action {
  cursor: pointer;
}
</style>
