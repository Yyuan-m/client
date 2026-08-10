<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-grid">
        <!-- 品牌 -->
        <div class="footer-col footer-brand">
          <h3 class="footer-logo">LUXURY CAR</h3>
          <p class="footer-desc">专注高端出行，尊享极致驾驶体验</p>
        </div>

        <!-- 导航链接 -->
        <div class="footer-col">
          <h4 class="footer-title">车型浏览</h4>
          <ul>
            <li><router-link to="/vehicles">全部车型</router-link></li>
            <li v-for="item in vehicleTypes" :key="item.dictValue">
              <router-link :to="{ path: '/vehicles', query: { type: item.dictValue } }">{{ item.dictLabel }}</router-link>
            </li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-title">关于我们</h4>
          <ul>
            <li><router-link to="/about">品牌介绍</router-link></li>
            <li><router-link to="/contact">联系客服</router-link></li>
            <li><router-link to="/vehicles">车型列表</router-link></li>
          </ul>
        </div>

        <!-- 联系方式 -->
        <div class="footer-col">
          <h4 class="footer-title">联系我们</h4>
          <ul>
            <li class="footer-contact">
              <a v-if="config?.phone" :href="'tel:' + config.phone"><el-icon><Phone /></el-icon> {{ config.phone }}</a>
              <span v-else><el-icon><Phone /></el-icon> 暂无</span>
            </li>
            <li class="footer-contact">
              <a v-if="config?.email" :href="'mailto:' + config.email"><el-icon><Message /></el-icon> {{ config.email }}</a>
              <span v-else><el-icon><Message /></el-icon> 暂无</span>
            </li>
            <li class="footer-contact">
              <router-link to="/contact"><el-icon><Location /></el-icon> {{ config?.address || '查看门店与客服' }}</router-link>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© {{ new Date().getFullYear() }} {{ config?.siteName || 'LUXURY CAR' }} {{ config?.siteSubtitle || '豪华汽车租赁' }}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSystemConfig } from '@/composables/useSystemConfig'
import { getDictByTypeApi } from '@/api/modules/system'

const { config, loadConfig } = useSystemConfig()
// 车型分类字典（从后台 car_rental.sys_dict_data 加载）
const vehicleTypes = ref([])

onMounted(() => {
  loadConfig()
  getDictByTypeApi('vehicle_type')
    .then((list) => { vehicleTypes.value = list || [] })
    .catch((e) => console.error('加载车型分类字典失败', e))
})
</script>

<style lang="scss" scoped>
.app-footer {
  background: $color-bg;
  padding: $space-2xl 0 $space-lg;
  margin-top: $space-2xl;
}

.footer-inner {
  @include content-container;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: $space-xl;
  padding-bottom: $space-xl;

  @include respond-to('md') {
    grid-template-columns: 1fr 1fr;
    gap: $space-lg;
  }
}

.footer-logo {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $color-text;
  margin-bottom: $space-sm;
}

.footer-desc {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: $line-height-loose;
}

.footer-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: $color-text;
  margin-bottom: $space-base;

  @include respond-to('md') {
    margin-top: $space-md;
  }
}

.footer-col ul li {
  margin-bottom: $space-sm;
  a, span {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    display: flex;
    align-items: center;
    gap: $space-xs;
    transition: color $transition-fast;
    text-decoration: none;
  }
  a:hover { color: var(--lux-primary-text); }
}

.footer-bottom {
  padding-top: $space-lg;
  border-top: 1px solid $color-divider;
  text-align: center;
  p {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
  }
}
</style>
