<template>
  <div class="coupon-card" :class="[cardClass, { 'coupon-compact': compact }]">
    <!-- 紧凑模式：垂直布局，面额在上 -->
    <template v-if="compact">
      <!-- 面额区（默认可见） -->
      <div class="cmp-value-area">
        <!-- 库存领完角标：紧凑模式下面额区右上角，一眼可见 -->
        <span v-if="isSoldOut" class="sold-out-corner">已领完</span>
        <div class="coupon-value" v-if="coupon.type === 'discount'">
          <span class="num">{{ discountText }}</span>
          <span class="unit">折</span>
        </div>
        <div class="coupon-value" v-else-if="coupon.type === 'deduction' || coupon.type === 'reduction'">
          <span class="unit">￥</span>
          <span class="num">{{ deductionText }}</span>
        </div>
        <div class="coupon-value" v-else-if="coupon.type === 'duration'">
          <span class="num">免{{ durationText }}</span>
          <span class="unit">天</span>
        </div>
        <div class="coupon-value" v-else>
          <span class="num">优惠</span>
        </div>
        <div class="coupon-threshold">{{ thresholdText }}</div>
      </div>

      <!-- 名称 + 状态（默认可见） -->
      <div class="cmp-head">
        <h4 class="coupon-name">{{ displayName }}</h4>
        <span v-if="showStatus && statusTag" class="status-tag" :class="statusTagClass">{{ statusTag }}</span>
      </div>

      <!-- 详细信息（hover 展开） -->
      <div class="cmp-extra">
        <div class="cmp-extra-inner">
          <p class="coupon-scope">{{ scopeText }}</p>
          <p class="coupon-time">{{ timeText }}</p>
          <div class="coupon-stock" v-if="showStock">
            <el-progress
              :percentage="stockPercent"
              :stroke-width="3"
              :show-text="false"
              :color="stockColor"
            />
            <span class="stock-text">{{ stockText }}</span>
          </div>
          <!-- 操作按钮区 -->
          <div v-if="showAction" class="coupon-actions">
            <template v-if="isExpired || isSoldOut">
              <span class="status-text">{{ isSoldOut ? '已领完' : '已过期' }}</span>
            </template>
            <template v-else-if="mode === 'mine'">
              <el-button v-if="coupon.status === 'unused'" type="primary" size="small" @click="$emit('use', coupon)">去使用</el-button>
              <el-button v-else-if="coupon.status === 'locked'" size="small" disabled>已锁定</el-button>
              <el-button v-else-if="coupon.status === 'used'" size="small" disabled>已使用</el-button>
              <el-button v-else-if="coupon.status === 'expired'" size="small" disabled>已过期</el-button>
            </template>
            <template v-else>
              <el-button v-if="!isLoggedIn" type="primary" size="small" plain @click="$emit('login')">登录后领取</el-button>
              <el-button v-else-if="claimed" type="success" size="small" @click="$emit('use', coupon)">已领取·去使用</el-button>
              <el-button v-else type="primary" size="small" :loading="loading" @click="$emit('claim', coupon)">立即领取</el-button>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- 经典模式：左右布局（profile/checkout 等页面沿用） -->
    <template v-else>
      <!-- 左侧面额区 -->
      <div class="coupon-left">
        <!-- 库存领完角标：经典模式左侧面额区右上角 -->
        <span v-if="isSoldOut" class="sold-out-corner">已领完</span>
        <div class="coupon-value" v-if="coupon.type === 'discount'">
          <span class="num">{{ discountText }}</span>
          <span class="unit">折</span>
        </div>
        <div class="coupon-value" v-else-if="coupon.type === 'deduction' || coupon.type === 'reduction'">
          <span class="unit">￥</span>
          <span class="num">{{ deductionText }}</span>
        </div>
        <div class="coupon-value" v-else-if="coupon.type === 'duration'">
          <span class="num">免{{ durationText }}</span>
          <span class="unit">天</span>
        </div>
        <div class="coupon-value" v-else>
          <span class="num">优惠</span>
        </div>
        <div class="coupon-threshold">{{ thresholdText }}</div>
      </div>

      <!-- 右侧信息区 -->
      <div class="coupon-right">
        <div class="coupon-header">
          <h4 class="coupon-name">{{ displayName }}</h4>
          <span v-if="showStatus && statusTag" class="status-tag" :class="statusTagClass">{{ statusTag }}</span>
        </div>
        <p class="coupon-scope">{{ scopeText }}</p>
        <p class="coupon-time">{{ timeText }}</p>
        <div class="coupon-stock" v-if="showStock">
          <el-progress
            :percentage="stockPercent"
            :stroke-width="4"
            :show-text="false"
            :color="stockColor"
          />
          <span class="stock-text">{{ stockText }}</span>
        </div>
        <!-- 操作按钮区 -->
        <div v-if="showAction" class="coupon-actions">
          <template v-if="isExpired || isSoldOut">
            <span class="status-text">{{ isSoldOut ? '已领完' : '已过期' }}</span>
          </template>
          <template v-else-if="mode === 'mine'">
            <el-button v-if="coupon.status === 'unused'" type="primary" size="small" @click="$emit('use', coupon)">去使用</el-button>
            <el-button v-else-if="coupon.status === 'locked'" size="small" disabled>已锁定</el-button>
            <el-button v-else-if="coupon.status === 'used'" size="small" disabled>已使用</el-button>
            <el-button v-else-if="coupon.status === 'expired'" size="small" disabled>已过期</el-button>
          </template>
          <template v-else>
            <el-button v-if="!isLoggedIn" type="primary" size="small" plain @click="$emit('login')">登录后领取</el-button>
            <el-button v-else-if="claimed" type="success" size="small" @click="$emit('use', coupon)">已领取·去使用</el-button>
            <el-button v-else type="primary" size="small" :loading="loading" @click="$emit('claim', coupon)">立即领取</el-button>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { moneyUtil } from '@/utils'

const props = defineProps({
  coupon: { type: Object, required: true },
  // 展示模式：available 领券中心 / mine 我的券
  mode: { type: String, default: 'available' },
  // 是否展示操作按钮
  showAction: { type: Boolean, default: true },
  // 领券中心模式：登录状态
  isLoggedIn: { type: Boolean, default: false },
  // 领券中心模式：是否已领取
  claimed: { type: Boolean, default: false },
  // 领券中心模式：领取中 loading
  loading: { type: Boolean, default: false },
  // 是否展示库存进度条
  showStock: { type: Boolean, default: true },
  // 是否展示状态标签（"未使用/已使用"等），结算弹窗等场景可关闭
  showStatus: { type: Boolean, default: true },
  // 紧凑模式：横向滚动 + hover 展开（首页领券中心）
  compact: { type: Boolean, default: false }
})

defineEmits(['use', 'claim', 'login'])

// ---------- 显示名称 ----------
const displayName = computed(() => props.coupon.couponName || props.coupon.name || '优惠券')

// ---------- 折扣券面额 ----------
const discountText = computed(() => {
  // v2: value=0.88 表示 88 折
  const v = Number(props.coupon.value ?? props.coupon.discountValue ?? 0)
  // 兼容：v2 用 value(0.88)，旧版用 discountValue(0.8)
  const times10 = (v * 10)
  // 整数显示无小数，非整数保留1位
  return Number.isInteger(times10) ? times10 : times10.toFixed(1)
})

// ---------- 满减券面额 ----------
const deductionText = computed(() => {
  const v = Number(props.coupon.value ?? props.coupon.discountValue ?? 0)
  return moneyUtil.format(v)
})

// ---------- 时长券天数 ----------
const durationText = computed(() => {
  const v = Number(props.coupon.value ?? 0)
  return v || 1
})

// ---------- 门槛文案 ----------
const thresholdText = computed(() => {
  const min = Number(props.coupon.minAmount ?? props.coupon.threshold ?? 0)
  if (min > 0) return `满￥${moneyUtil.format(min)}可用`
  return '无门槛'
})

// ---------- 适用范围文案 ----------
const scopeText = computed(() => {
  const scope = props.coupon.applyScope
  if (scope === 'specified') {
    const names = props.coupon.carNames
    if (names && names.length) {
      return names.length <= 2 ? `仅限：${names.join('、')}` : `仅限：${names.slice(0, 2).join('、')} 等${names.length}款`
    }
    return '指定车型可用'
  }
  return '全场通用'
})

// ---------- 时间文案 ----------
const timeText = computed(() => {
  // v2: validStartTime / validEndTime（LocalDateTime）
  // 旧版: validFrom / validTo（LocalDate）
  const start = props.coupon.validStartTime || props.coupon.validFrom
  const end = props.coupon.validEndTime || props.coupon.validTo || props.coupon.expireTime
  if (!start && !end) return ''
  const fmt = (t) => {
    if (!t) return ''
    // 截取到日期部分（兼容 YYYY-MM-DD HH:mm:ss 和 YYYY-MM-DD）
    return String(t).slice(0, 10)
  }
  return `${fmt(start)} ~ ${fmt(end)}`
})

// ---------- 库存信息 ----------
const stockPercent = computed(() => {
  if (props.coupon.totalCount == null) return 0
  if (props.coupon.totalCount === -1) return 0 // 无限库存不展示进度
  const received = props.coupon.receivedCount || 0
  if (props.coupon.totalCount === 0) return 100
  return Math.min(100, Math.round((received / props.coupon.totalCount) * 100))
})
const stockText = computed(() => {
  if (props.coupon.totalCount == null) return ''
  if (props.coupon.totalCount === -1) return '不限量'
  const remain = props.coupon.remainCount != null
    ? props.coupon.remainCount
    : Math.max(0, props.coupon.totalCount - (props.coupon.receivedCount || 0))
  return `剩余 ${remain}/${props.coupon.totalCount}`
})
const stockColor = computed(() => {
  const p = stockPercent.value
  if (p >= 90) return '#f56c6c' // 库存紧张
  if (p >= 70) return '#e6a23c'
  return '#67c23a'
})

// ---------- 状态标签（我的券模式）----------
const statusTag = computed(() => {
  if (props.mode !== 'mine') return ''
  const s = props.coupon.status
  if (s === 'unused') return '未使用'
  if (s === 'locked') return '已锁定'
  if (s === 'used') return '已使用'
  if (s === 'expired') return '已过期'
  return ''
})
const statusTagClass = computed(() => {
  const s = props.coupon.status
  if (s === 'unused') return 'tag-unused'
  if (s === 'locked') return 'tag-locked'
  if (s === 'used') return 'tag-used'
  if (s === 'expired') return 'tag-expired'
  return ''
})

// ---------- 卡片样式 ----------
const cardClass = computed(() => {
  const cls = []
  if (props.mode === 'mine') {
    const s = props.coupon.status
    if (s === 'used' || s === 'expired') cls.push('disabled')
  } else {
    // 领券中心：已过期/已领完置灰
    if (isExpired.value || isSoldOut.value) cls.push('disabled')
  }
  return cls.join(' ')
})

// ---------- 状态判断 ----------
const isExpired = computed(() => {
  // 领券中心：根据 v2 status + 有效期判断
  if (props.coupon.status === 'offline' || props.coupon.status === 'expired') return true
  const end = props.coupon.validEndTime
  if (!end) return false
  return new Date(end).getTime() < Date.now()
})
const isSoldOut = computed(() => {
  if (props.coupon.totalCount == null || props.coupon.totalCount === -1) return false
  const received = props.coupon.receivedCount || 0
  return received >= props.coupon.totalCount
})
</script>

<style lang="scss" scoped>
// ============================================================
// 公共样式（两种模式共用）
// ============================================================
.coupon-card {
  position: relative;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  overflow: hidden;
  background: $color-bg-gray;
  transition: transform $transition-base, border-color $transition-base, box-shadow $transition-base;

  &:hover {
    border-color: $color-primary;
  }
  &.disabled {
    opacity: 0.55;
    &:hover { transform: none; border-color: $color-border; }
  }
}

.coupon-value {
  display: flex;
  align-items: baseline;
  color: var(--lux-primary-text);
  .num {
    font-size: $font-size-xl;
    font-weight: $font-weight-medium;
    line-height: 1;
  }
  .unit { font-size: $font-size-sm; margin-left: 2px; }
}

.coupon-threshold {
  font-size: $font-size-xs;
  margin-top: $space-xs;
  color: $color-text-secondary;
  letter-spacing: 0.3px;
}

.coupon-name {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $color-text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.coupon-scope {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-time {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-bottom: $space-xs;
}

.coupon-stock {
  display: flex;
  align-items: center;
  gap: $space-sm;
  margin-bottom: $space-sm;
  :deep(.el-progress) { flex: 1; max-width: 140px; }
  .stock-text {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
    white-space: nowrap;
  }
}

.coupon-actions {
  margin-top: auto;
  :deep(.el-button) {
    border-radius: $radius-none;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    font-weight: $font-weight-bold;
    font-size: $font-size-base;
  }
}

.status-text {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  letter-spacing: 1px;
  text-transform: uppercase;
}

// "已领完/已过期" 状态文案：在 actions 区显示时增强对比，避免与背景混淆
// 用 danger 色文字 + 淡红背景块，明显于普通灰色辅助文字
.coupon-actions > .status-text {
  display: inline-block;
  padding: 4px 12px;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-danger;
  background: rgba(241, 58, 44, 0.12);
  border-radius: $radius-none;
  letter-spacing: 1.2px;
}

// 库存领完角标：面额区右上角，紧凑/经典模式共用
// danger 色实心块 + 白字，确保在深色面额区上一眼可见
.sold-out-corner {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  padding: 3px 10px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  letter-spacing: 1.2px;
  color: #fff;
  background: $color-danger;
  border-bottom-left-radius: $radius-xs;
}

.status-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: $radius-full;
  letter-spacing: 1px;
  font-weight: $font-weight-semibold;
  white-space: nowrap;
  flex-shrink: 0;
  &.tag-unused { background: rgba(218, 41, 28, 0.12); color: var(--lux-primary-text); }
  &.tag-locked { background: rgba(230, 162, 60, 0.15); color: #e6a23c; }
  &.tag-used { background: $color-bg-gray-dark; color: $color-text-tertiary; }
  &.tag-expired { background: $color-bg-gray-dark; color: $color-text-tertiary; }
}

// ============================================================
// 经典模式（左右布局）
// ============================================================
.coupon-card:not(.coupon-compact) {
  display: flex;

  &:hover {
    transform: translateY(-2px);
  }

  .coupon-left {
    width: 130px;
    padding: $space-base $space-sm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: $color-bg-gray-dark;
    color: $color-text;
    border-right: 1px dashed $color-border;
    position: relative;

    // 左右两侧的半圆缺口
    &::before, &::after {
      content: '';
      position: absolute;
      right: -4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--lux-bg, #fff);
    }
    &::before { top: -4px; }
    &::after { bottom: -4px; }
  }

  .coupon-right {
    flex: 1;
    padding: $space-base $space-md;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .coupon-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $space-xs;
    gap: $space-sm;
  }
}

// ============================================================
// 紧凑模式（垂直布局 + hover 浮层展开）
// - 默认仅展示：面额 / 门槛 / 名称 / 状态（固定高度，不撑高容器）
// - hover 时展开浮层：适用范围 / 有效期 / 库存 / 操作按钮
//   浮层使用 absolute 定位，不会影响横向滚动容器的高度，
//   也不会被 overflow-x:auto 裁切（因为卡片自身 overflow: visible）
// - 卡片宽度 260px，适合横向滚动展示
// ============================================================
.coupon-compact {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  // 卡片本身不裁切，让浮层可以溢出
  overflow: visible;
  // 固定基础高度，避免 hover 展开时撑高滚动容器
  height: 168px;
  will-change: transform;
  transition: transform $transition-base, border-color $transition-base;

  &:hover {
    transform: translateY(-4px);
    border-color: $color-primary;
    // 提升层叠顺序，确保浮层覆盖相邻卡片
    z-index: 10;
  }
  &.disabled {
    &:hover { transform: none; z-index: auto; }
  }

  // 顶部面额区：深色提升层 + 法拉利红强调
  .cmp-value-area {
    position: relative; // 锚定已领完角标
    padding: $space-base $space-md $space-sm;
    background: $color-bg-gray-dark;
    border-bottom: 1px dashed $color-border;
    text-align: left;
    flex-shrink: 0;

    .coupon-value .num {
      font-size: 36px;
      font-weight: $font-weight-medium;
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .coupon-value .unit {
      font-size: $font-size-base;
    }
    .coupon-threshold {
      margin-top: 6px;
      font-size: $font-size-xs;
      letter-spacing: 0.4px;
    }
  }

  // 名称行：默认可见
  .cmp-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-xs;
    padding: $space-sm $space-md;
    flex: 1;
    min-height: 0;

    .coupon-name {
      font-size: $font-size-md;
      font-weight: $font-weight-medium;
    }
  }

  // 详细信息浮层：absolute 定位，紧贴卡片底部展开
  // 默认不可见（opacity:0 + translateY），hover 时滑入
  .cmp-extra {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    background: $color-bg-gray;
    border: 1px solid $color-primary;
    border-top: none;
    opacity: 0;
    transform: translateY(-8px);
    pointer-events: none;
    transition: opacity $transition-base, transform $transition-base;
    z-index: 10;
    // 防止内容过多时浮层过高
    max-height: 280px;
    overflow: hidden;
  }

  // hover 时展开浮层
  &:hover .cmp-extra {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .cmp-extra-inner {
    padding: $space-sm $space-md $space-base;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  // 操作按钮在紧凑模式下占满宽度
  .coupon-actions {
    margin-top: $space-xs;
    :deep(.el-button) {
      width: 100%;
    }
  }
}
</style>
