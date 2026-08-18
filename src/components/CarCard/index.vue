<template>
  <div class="car-card" :class="{ 'is-unavailable': car.status !== 'available' }" @click="goDetail">
    <!-- 车辆图片 -->
    <div class="card-image">
      <img :src="resolveAdminImage(car.cover)" :alt="car.name" loading="lazy" />
      <span v-if="car.isHot" class="card-badge badge-hot">热门</span>
      <span v-else-if="car.isRecommend" class="card-badge badge-rec">推荐</span>
      <span v-if="car.couponBadge" class="card-badge badge-coupon">{{ car.couponBadge }}</span>
      <el-tooltip
        :disabled="!car.rentReason && !car.availableDate"
        :content="rentStatusTip"
        placement="top"
        :show-after="150"
      >
        <span class="card-status" :class="car.status">{{ car.statusName }}</span>
      </el-tooltip>
    </div>

    <!-- 车辆信息 -->
    <div class="card-body">
      <h3 class="card-name">{{ car.name }}</h3>
      <div class="card-tags">
        <el-tag v-for="tag in car.tagList?.slice(0, 3)" :key="tag" size="small" effect="plain" round>{{ tag }}</el-tag>
      </div>
      <div class="card-meta">
        <span class="meta-item"><el-icon><User /></el-icon>{{ car.seats }}座</span>
        <span class="meta-item"><el-icon><Lightning /></el-icon>{{ car.displacement }}</span>
      </div>
      <div class="card-footer">
        <div class="card-price">
          <!-- 有券后价：划线原价 + 突出券后价 -->
          <template v-if="hasCouponPrice">
            <div class="price-original">
              <span class="unit">￥</span>
              <span class="amount-original">{{ car.dailyPrice }}</span>
              <span class="unit">/天</span>
            </div>
            <div class="price-coupon">
              <span class="coupon-tag">券后价</span>
              <span class="unit">￥</span>
              <span class="amount">{{ car.couponPrice }}</span>
              <span class="unit">/天起</span>
            </div>
          </template>
          <!-- 无券后价：仅显示原价 -->
          <template v-else>
            <span class="unit">￥</span>
            <span class="amount">{{ car.dailyPrice }}</span>
            <span class="unit">/天起</span>
          </template>
        </div>
        <div class="card-actions">
          <el-button
            type="primary"
            size="small"
            :disabled="car.status !== 'available'"
            @click.stop="goRent"
          >{{ rentBtnText }}</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { resolveAdminImage } from '@/utils/image'

const props = defineProps({
  car: { type: Object, required: true }
})

const emit = defineEmits(['rent'])

const router = useRouter()

// 券后价是否有效：存在且小于原价
const hasCouponPrice = computed(() => {
  const cp = props.car.couponPrice
  const dp = props.car.dailyPrice
  return cp != null && Number(cp) > 0 && Number(cp) < Number(dp)
})

// 被租状态提示文案：原因 + 最早可租日期
const rentStatusTip = computed(() => {
  const car = props.car
  const parts = []
  if (car.rentReason) parts.push(`原因：${car.rentReason}`)
  if (car.availableDate) parts.push(`最早可租：${car.availableDate}`)
  return parts.join('　')
})

// 租车按钮文案：按状态区分
const rentBtnText = computed(() => {
  const s = props.car.status
  if (s === 'rented') return '已租出'
  if (s === 'maintenance') return '维修中'
  return '立即租车'
})

function goDetail() {
  router.push(`/vehicles/${props.car.id}`)
}

function goRent() {
  emit('rent', props.car)
}
</script>

<style lang="scss" scoped>
.car-card {
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  overflow: hidden;
  cursor: pointer;
  transition: transform $transition-base, border-color $transition-base;

  &:hover {
    transform: translateY(-4px);
    border-color: $color-primary;
  }

  &.is-unavailable {
    opacity: 0.65;
    &:hover { transform: none; border-color: $color-border; }
  }
}

.card-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: $color-bg-gray-dark;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform $transition-slow;
  }
  .car-card:hover & img { transform: scale(1.05); }
}

.card-badge {
  position: absolute;
  top: $space-sm; left: $space-sm;
  padding: 4px 12px;
  border-radius: $radius-full;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: #fff;
}
.badge-hot { background: $color-accent; }
.badge-rec { background: $color-primary; }
.badge-coupon { background: #ff6b35; top: 40px; }

.card-status {
  position: absolute;
  top: $space-sm; right: $space-sm;
  padding: 4px 12px;
  border-radius: $radius-full;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  background: rgba(24, 24, 24, 0.7);
  backdrop-filter: blur(4px);
  &.available { color: $color-success; }
  &.rented { color: $color-danger; }
  &.maintenance { color: $color-warning; }
}

.card-body {
  padding: $space-base;
}

.card-name {
  font-size: $font-size-md;
  font-weight: $font-weight-medium;
  margin-bottom: $space-sm;
  @include ellipsis;
}

.card-tags {
  display: flex;
  gap: $space-xs;
  margin-bottom: $space-sm;
  flex-wrap: wrap;
  :deep(.el-tag) {
    border-radius: $radius-full;
  }
}

.card-meta {
  display: flex;
  gap: $space-md;
  margin-bottom: $space-base;
  .meta-item {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-price {
  color: var(--lux-primary-text);

  // 券后价模式：原价划线 + 券后价突出
  .price-original {
    display: flex;
    align-items: baseline;
    gap: 1px;
    color: $color-text-tertiary;
    .unit { font-size: $font-size-xs; }
    .amount-original {
      font-size: $font-size-sm;
      text-decoration: line-through;
      text-decoration-color: $color-text-tertiary;
    }
  }

  .price-coupon {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-top: 2px;
    .coupon-tag {
      font-size: 10px;
      font-weight: $font-weight-bold;
      color: #fff;
      background: var(--lux-primary-text);
      padding: 1px 6px;
      border-radius: 2px;
      margin-right: 4px;
      letter-spacing: 0.5px;
      line-height: 1.4;
    }
    .unit { font-size: $font-size-xs; }
    .amount {
      font-size: $font-size-xl;
      font-weight: $font-weight-medium;
    }
  }

  // 无券后价模式：仅原价
  .amount {
    font-size: $font-size-xl;
    font-weight: $font-weight-medium;
  }
}

.card-actions {
  :deep(.el-button) {
    border-radius: $radius-none;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    font-weight: $font-weight-bold;
    font-size: $font-size-base;

    &.is-disabled,
    &:disabled.is-disabled {
      background: $color-bg-gray-dark;
      color: $color-text-tertiary;
      border-color: $color-border;
      opacity: 1;
    }
  }
}
</style>
