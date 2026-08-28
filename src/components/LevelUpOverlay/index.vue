<template>
  <Teleport to="body">
    <Transition name="levelup-fade">
      <div v-if="visible" class="levelup-overlay" @click="handleClose">
        <!-- 背景光晕（新等级主题色） -->
        <div class="levelup-glow" :style="glowStyle"></div>

        <!-- 上升粒子 -->
        <div class="levelup-particles">
          <span
            v-for="p in particles"
            :key="p.id"
            class="particle"
            :style="p.style"
          ></span>
        </div>

        <!-- 中央内容 -->
        <div class="levelup-stage">
          <!-- 新等级徽章卡片 -->
          <div class="badge-card" :style="badgeStyle">
            <div class="badge-shine"></div>
            <div class="badge-inner">
              <span class="badge-brand">LUX·RENT</span>
              <span class="badge-level">{{ toRule?.name }}</span>
            </div>
          </div>

          <!-- 标题与说明 -->
          <div class="levelup-text">
            <h2 class="levelup-title">
              <span class="title-star">✦</span> 恭喜升级 <span class="title-star">✦</span>
            </h2>
            <p class="levelup-desc">
              <template v-if="fromRule && fromRule.key !== toRule?.key">
                {{ fromRule.name }} → <b class="desc-level">{{ toRule?.name }}</b>
              </template>
              <template v-else>
                您已晋升为 <b class="desc-level">{{ toRule?.name }}</b>
              </template>
            </p>
            <p class="levelup-tip">完成租赁订单或累计消费即可继续晋升更高等级</p>
            <span class="levelup-close-hint">点击任意处继续</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * 会员升级蒙层动画（全局挂载一次，props 驱动，不耦合 store）
 *
 * 通用约定：
 *  - fromRule / toRule 为 utils/memberLevel.js 的 LEVEL_RULES 项
 *  - 徽章/粒子/光晕颜色自动取 toRule.grad 渐变色，与个人中心会员卡片颜色一致
 *  - 4.6s 自动关闭，点击蒙层立即关闭
 */
import { computed, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  /** 是否可见（v-model:visible） */
  visible: { type: Boolean, default: false },
  /** 旧等级规则项（LEVEL_RULES 元素） */
  fromRule: { type: Object, default: null },
  /** 新等级规则项（LEVEL_RULES 元素） */
  toRule: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

/** 自动关闭计时器 */
let autoTimer = null

/** 粒子（随机分布，颜色跟随新等级渐变） */
const particles = computed(() => {
  if (!props.visible || !props.toRule) return []
  const [c1, c2] = props.toRule.grad
  return Array.from({ length: 14 }, (_, i) => {
    const left = 4 + Math.random() * 92
    const delay = Math.random() * 2.2
    const dur = 2.6 + Math.random() * 2
    const size = 4 + Math.random() * 6
    const color = i % 2 === 0 ? c1 : c2
    return {
      id: i,
      style: {
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        animationDelay: `${delay}s`,
        animationDuration: `${dur}s`
      }
    }
  })
})

/** 背景光晕：新等级渐变 */
const glowStyle = computed(() => {
  const [c1, c2] = props.toRule?.grad || ['#6366f1', '#1e1b4b']
  return {
    background: `radial-gradient(ellipse 60% 45% at 50% 42%, ${hexToRgba(c1, 0.4)} 0%, ${hexToRgba(c2, 0.18)} 45%, transparent 70%)`
  }
})

/** 徽章卡片背景：新等级渐变 */
const badgeStyle = computed(() => {
  const [c1, c2] = props.toRule?.grad || ['#6366f1', '#1e1b4b']
  return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }
})

/** hex 转 rgba（grad 为 #rrggbb 格式） */
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function handleClose() {
  clearTimer()
  emit('update:visible', false)
}

function clearTimer() {
  if (autoTimer) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
}

// 可见时启动自动关闭
watch(
  () => props.visible,
  (v) => {
    clearTimer()
    if (v) {
      autoTimer = setTimeout(handleClose, 4600)
    }
  }
)

onBeforeUnmount(clearTimer)
</script>

<style lang="scss" scoped>
.levelup-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  overflow: hidden;
}

// ---------- 背景光晕呼吸 ----------
.levelup-glow {
  position: absolute;
  inset: -20%;
  animation: glow-breath 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes glow-breath {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}

// ---------- 上升粒子 ----------
.levelup-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  bottom: -12px;
  border-radius: 50%;
  opacity: 0;
  animation-name: particle-rise;
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
}

@keyframes particle-rise {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  12% { opacity: 0.9; }
  100% { transform: translateY(-92vh) scale(1.15); opacity: 0; }
}

// ---------- 中央舞台 ----------
.levelup-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 34px;
  animation: stage-in 0.6s cubic-bezier(0.22, 1.4, 0.36, 1) both;
}

@keyframes stage-in {
  from { transform: translateY(36px) scale(0.88); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

// ---------- 等级徽章卡片（与个人中心 user-card 风格呼应） ----------
.badge-card {
  position: relative;
  width: 300px;
  height: 178px;
  border-radius: 18px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.14) inset;
  animation: badge-pop 0.7s cubic-bezier(0.22, 1.5, 0.36, 1) 0.12s both,
             badge-float 3.4s ease-in-out 0.9s infinite;
  overflow: hidden;
}

@keyframes badge-pop {
  from { transform: scale(0.4) rotate(-6deg); opacity: 0; }
  to { transform: scale(1) rotate(0); opacity: 1; }
}

@keyframes badge-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

// 高光扫过
.badge-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.28) 48%, transparent 62%);
  transform: translateX(-120%);
  animation: shine-sweep 2.4s ease-in-out 0.8s infinite;
}

@keyframes shine-sweep {
  0% { transform: translateX(-120%); }
  55%, 100% { transform: translateX(120%); }
}

.badge-inner {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 24px;
}

.badge-brand {
  font-size: 12px;
  letter-spacing: 0.28em;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 500;
}

.badge-level {
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

// ---------- 文案 ----------
.levelup-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: text-in 0.6s ease 0.35s both;
}

@keyframes text-in {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.levelup-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.14em;

  .title-star {
    font-size: 16px;
    opacity: 0.85;
    vertical-align: middle;
    animation: star-blink 1.6s ease-in-out infinite;
  }
}

@keyframes star-blink {
  0%, 100% { opacity: 0.35; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.12); }
}

.levelup-desc {
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: 0.04em;

  .desc-level {
    color: #fff;
    font-size: 17px;
    font-weight: 700;
  }
}

.levelup-tip {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.04em;
}

.levelup-close-hint {
  margin-top: 18px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.1em;
  animation: hint-pulse 2s ease-in-out infinite;
}

@keyframes hint-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.9; }
}

// ---------- 蒙层淡入淡出 ----------
.levelup-fade-enter-active { transition: opacity 0.35s ease; }
.levelup-fade-leave-active { transition: opacity 0.3s ease; }
.levelup-fade-enter-from,
.levelup-fade-leave-to { opacity: 0; }

// 窄屏适配
@media (max-width: 480px) {
  .badge-card { width: 246px; height: 148px; }
  .badge-level { font-size: 24px; }
  .levelup-title { font-size: 20px; }
  .levelup-stage { gap: 24px; }
}
</style>
