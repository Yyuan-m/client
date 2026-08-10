// ============================================================
// 全局工具函数库 - 配套 dayjs，满足租车业务场景
// ============================================================

import dayjs from 'dayjs'

// ---------- 1. 本地存储封装 ----------
export const storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  get(key, defaultValue = null) {
    const raw = localStorage.getItem(key)
    try {
      return raw ? JSON.parse(raw) : defaultValue
    } catch {
      return defaultValue
    }
  },
  remove(key) {
    localStorage.removeItem(key)
  },
  clear() {
    localStorage.clear()
  }
}

// ---------- 2. 时间工具 ----------
export const dateUtil = {
  // 格式化日期
  format(date, fmt = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return ''
    return dayjs(date).format(fmt)
  },
  // 计算两个日期间隔天数（含起止日）
  daysBetween(start, end) {
    if (!start || !end) return 0
    const diff = dayjs(end).diff(dayjs(start), 'day')
    return Math.max(0, diff)
  },
  // 获取未来某天
  addDays(date, days) {
    return dayjs(date).add(days, 'day').format('YYYY-MM-DD')
  },
  // 今天
  today() {
    return dayjs().format('YYYY-MM-DD')
  },
  // 租期规则校验：是否满足最少/最长租期
  validateRentDays(start, end, minDays = 1, maxDays = 30) {
    const days = this.daysBetween(start, end)
    if (days < minDays) return { valid: false, msg: `最少租期 ${minDays} 天` }
    if (days > maxDays) return { valid: false, msg: `最长租期 ${maxDays} 天` }
    return { valid: true, days }
  }
}

// ---------- 3. 金额工具 ----------
export const moneyUtil = {
  // 千分位格式化
  format(amount) {
    if (amount == null || isNaN(amount)) return '0.00'
    return Number(amount).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  },
  // 租金总价 = 日租金 × 天数
  calcRent(dailyPrice, days) {
    return Number(dailyPrice || 0) * Number(days || 0)
  },
  // 优惠券抵扣计算（v2 模型，与后端 CouponService.doCalculate 对齐）
  // coupon 字段：
  //   type: 'discount'折扣 / 'deduction'满减 / 'duration'时长
  //   value: 折扣填0.88/满减填金额/时长填天数
  //   minAmount: 最低消费门槛
  //   discountCap: 折扣券封顶优惠金额（仅 discount 有效，NULL=不封顶）
  calcCouponDiscount(amount, coupon) {
    if (!coupon || !amount) return 0
    const value = Number(coupon.value ?? 0)
    const minAmount = Number(coupon.minAmount ?? 0)
    // 门槛校验
    if (minAmount > 0 && amount < minAmount) return 0
    let discount = 0
    if (coupon.type === 'discount') {
      // 折扣值 0.88 表示88折，优惠 = 原价 * (1 - 0.88)
      discount = +(amount * (1 - value)).toFixed(2)
      // 封顶校验
      if (coupon.discountCap != null && discount > Number(coupon.discountCap)) {
        discount = Number(coupon.discountCap)
      }
    } else if (coupon.type === 'deduction') {
      // 满减券：直接减 value（门槛已校验）
      discount = value
    } else if (coupon.type === 'duration') {
      // 时长券不抵扣金额（由订单层处理加天数）
      discount = 0
    } else if (coupon.type === 'reduction') {
      // 兼容旧模型：reduction 类型，value 字段可能存的是减免金额
      discount = value
    }
    // 优惠不能超过原价
    return Math.min(discount, amount)
  },
  // 最终应付 = 租金 - 优惠券抵扣
  calcTotal(rent, couponDiscount = 0) {
    return Math.max(0, rent - couponDiscount)
  }
}

// ---------- 4. 图片工具 ----------
export const imageUtil = {
  // 图片懒加载：给 img 加 data-src，进入视口后赋值给 src
  lazyLoad() {
    const imgs = document.querySelectorAll('img[data-src]')
    if (!imgs.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        })
      },
      { rootMargin: '50px' }
    )
    imgs.forEach((img) => observer.observe(img))
  },
  // 拼接图片地址（补全 base url）
  resolve(url, baseUrl = '') {
    if (!url) return this.placeholder()
    if (url.startsWith('http')) return url
    return baseUrl + url
  },
  // 默认兜底图（SVG 占位，避免外部依赖）
  placeholder(text = '暂无图片') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f5f5f7"/><text x="50%" y="50%" font-size="14" fill="#aeaeb2" text-anchor="middle" dy=".3em">${text}</text></svg>`
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  }
}

// ---------- 5. 表单校验正则 ----------
export const validators = {
  phone: /^1[3-9]\d{9}$/,
  // 用户名：3-20 位，字母开头，字母数字下划线
  username: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
  // 18 位身份证（含校验位）
  idCard: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
  // 密码：6-20 位，字母+数字
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/,
  // 邮箱
  email: /^[\w.-]+@[\w-]+(\.[\w-]+)+$/,
  isPhone(val) { return this.phone.test(val) },
  isUsername(val) { return this.username.test(val) },
  isIdCard(val) { return this.idCard.test(val) },
  isPassword(val) { return this.password.test(val) },
  isEmail(val) { return this.email.test(val) }
}

// ---------- 6. 浏览器工具 ----------
export const browserUtil = {
  // 复制文本到剪贴板
  copyText(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text)
    }
    return new Promise((resolve, reject) => {
      const input = document.createElement('textarea')
      input.value = text
      document.body.appendChild(input)
      input.select()
      try {
        document.execCommand('copy')
        resolve()
      } catch (e) {
        reject(e)
      }
      document.body.removeChild(input)
    })
  },
  // 平滑滚动到顶部
  scrollTop(behavior = 'smooth') {
    window.scrollTo({ top: 0, behavior })
  },
  // 防抖
  debounce(fn, delay = 300) {
    let timer = null
    return function (...args) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => fn.apply(this, args), delay)
    }
  },
  // 节流
  throttle(fn, delay = 300) {
    let last = 0
    return function (...args) {
      const now = Date.now()
      if (now - last >= delay) {
        last = now
        fn.apply(this, args)
      }
    }
  }
}

// 统一导出
export default {
  storage,
  dateUtil,
  moneyUtil,
  imageUtil,
  validators,
  browserUtil
}
