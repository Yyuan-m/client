<template>
  <div class="date-rent-picker">
    <el-date-picker
      v-model="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="取车日期"
      end-placeholder="还车日期"
      :disabled-date="disabledDate"
      :shortcuts="shortcuts"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      class="rent-date-picker"
      style="width: 100%"
      @change="onChange"
    />
    <div v-if="days > 0" class="rent-info">
      <span class="days">租期 <strong>{{ days }}</strong> 天</span>
      <span v-if="error" class="error">{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { dateUtil } from '@/utils'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  minDays: { type: Number, default: 1 },
  maxDays: { type: Number, default: 30 },
  // 最早可租日期（YYYY-MM-DD 字符串或 Date）：用于已出租/已预约车辆，禁用该日期之前的所有日期
  minDate: { type: [String, Date], default: null }
})

const emit = defineEmits(['update:modelValue', 'change'])

const dateRange = ref(props.modelValue)
const days = ref(0)
const error = ref('')

// 解析 minDate 为当天 0 点的 Date；无效时返回 null
function parseMinDate() {
  if (!props.minDate) return null
  const d = props.minDate instanceof Date ? props.minDate : new Date(props.minDate)
  if (isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

// 禁用今天之前的日期 + minDate 之前的日期（已出租车辆的最早起租日限制）
const disabledDate = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // 禁用今天之前的日期
  if (date.getTime() < today.getTime()) return true
  // 禁用最早可租日期之前的日期
  const min = parseMinDate()
  if (min && date.getTime() < min.getTime()) return true
  return false
}

// 快捷选项（起点尊重 minDate：已出租车辆从最早可租日开始计算）
const shortcuts = [
  {
    text: '3天',
    value: () => {
      const s = parseMinDate() || new Date()
      const e = new Date(s)
      e.setDate(s.getDate() + 3)
      return [s, e]
    }
  },
  {
    text: '7天',
    value: () => {
      const s = parseMinDate() || new Date()
      const e = new Date(s)
      e.setDate(s.getDate() + 7)
      return [s, e]
    }
  },
  {
    text: '15天',
    value: () => {
      const s = parseMinDate() || new Date()
      const e = new Date(s)
      e.setDate(s.getDate() + 15)
      return [s, e]
    }
  }
]

function onChange(val) {
  if (!val || val.length < 2) {
    days.value = 0
    error.value = ''
    emit('update:modelValue', [])
    emit('change', { days: 0, startDate: '', endDate: '', valid: false })
    return
  }
  const [start, end] = val
  const result = dateUtil.validateRentDays(start, end, props.minDays, props.maxDays)
  days.value = result.days || 0
  error.value = result.valid ? '' : result.msg
  emit('update:modelValue', val)
  emit('change', {
    days: days.value,
    startDate: start,
    endDate: end,
    valid: result.valid
  })
}

watch(() => props.modelValue, (val) => {
  dateRange.value = val
})
</script>

<style lang="scss" scoped>
.date-rent-picker {
  width: 100%;
}
// daterange 选择器默认有 min-width，强制限制在容器宽度内
:deep(.rent-date-picker) {
  width: 100% !important;
  max-width: 100% !important;
  .el-range-editor {
    width: 100% !important;
    max-width: 100% !important;
  }
}
.rent-info {
  margin-top: $space-sm;
  display: flex;
  align-items: center;
  gap: $space-base;
  .days { font-size: $font-size-sm; color: $color-text-secondary; strong { color: var(--lux-primary-text); font-size: $font-size-base; } }
  .error { font-size: $font-size-xs; color: $color-danger; }
}
</style>
