// 订单模块：创建 / 列表 / 详情 / 取消 / 支付 / 完成还车 / 进行中订单 / 可评价订单
import { get, post, put } from '@/utils/request'

export const createOrderApi = (data) => post('/api/order/create', data)
export const getOrderListApi = (params, config = {}) => get('/api/order/list', params, config)
export const getOrderDetailApi = (id) => get(`/api/order/detail/${id}`)
export const cancelOrderApi = (id) => put(`/api/order/cancel/${id}`)
// 订单支付（待支付 → 租赁中）
export const payOrderApi = (id) => put(`/api/order/pay/${id}`)
// 确认还车（租赁中 → 已完成，置评价状态为待评价）
export const completeOrderApi = (id) => put(`/api/order/complete/${id}`)
// 我的进行中订单（首页"我的订单"模块用：租赁中 + 待评价）
export const getMyActiveOrdersApi = (limit = 6) => get('/api/order/active', { limit })
// 可评价订单列表（个人中心"去评价"入口用：待首评 + 可追评）
export const getReviewableOrdersApi = () => get('/api/order/reviewable')
