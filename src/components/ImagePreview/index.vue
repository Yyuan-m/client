<template>
  <el-image-viewer
    v-if="visible"
    :url-list="list"
    :initial-index="index"
    @close="close"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores'

const appStore = useAppStore()

const visible = computed(() => appStore.imagePreviewVisible)
const list = computed(() => appStore.previewList)
const index = computed(() => appStore.previewIndex)

function close() {
  appStore.closeImagePreview()
}
</script>
