// ============================================================
// 优惠券模块 v2 API（对接 customer-server /api/coupon/*）
// 接口对齐后台 CustomerCouponController：
//   可领券列表 / 券详情 / 我的券 / 下单可用券 / 领取 / 锁定 / 取消锁定 / 核销 / 计算优惠 / 已领取ID
// ============================================================
import { get, post } from '@/utils/request'

// 可领券列表（首页领券中心，公开访问）
export const getAvailableCouponsApi = () => get('/api/coupon/available')

// 券详情（含关联车辆）
export const getCouponDetailApi = (id) => get(`/api/coupon/${id}`)

// 我的券（可按状态筛选：unused未使用/locked已锁定/used已使用/expired已过期）
export const getMyCouponsApi = (status) => get('/api/coupon/mine', status ? { status } : {})

// 下单可用券（某车某金额下可用，登录用户）
export const getUsableCouponsApi = (params) => get('/api/coupon/usable', params)

// 领取优惠券，返回领取后的 member_coupon.id
export const receiveCouponApi = (couponId, source = 'manual') =>
  post(`/api/coupon/receive/${couponId}`, { source })

// 锁定优惠券（下单预占，unused → locked）
export const lockCouponApi = (memberCouponId) => post('/api/coupon/lock', { memberCouponId })

// 取消锁定（locked → unused）
export const cancelLockCouponApi = (memberCouponId) => post('/api/coupon/cancel-lock', { memberCouponId })

// 核销（订单完成时调用，locked → used，幂等）
export const verifyCouponApi = (memberCouponId, orderId) =>
  post('/api/coupon/verify', { memberCouponId, orderId })

// 计算优惠金额（下单预览用，不实际核销）
export const calculateCouponDiscountApi = (couponId, amount) =>
  post('/api/coupon/calculate', { couponId, amount })

// 当前用户已领取的优惠券ID列表（含已使用+未使用），用于首页判断领取状态
export const getClaimedCouponIdsApi = () => get('/api/coupon/claimed-ids')

// ============================================================
// 兼容旧 API（home 页面历史调用，逐步迁移）
// ============================================================
// 旧：getCouponListApi({status:'active'}) → 新：getAvailableCouponsApi()
export const getCouponListApi = (params) => get('/api/coupon/available', params)
// 旧：claimCouponApi(couponId) → 新：receiveCouponApi(couponId)
export const claimCouponApi = (couponId) => post(`/api/coupon/receive/${couponId}`, { source: 'manual' })
