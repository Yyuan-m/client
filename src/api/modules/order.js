// 订单模块：创建 / 列表 / 详情 / 取消
import { get, post, put } from '@/utils/request'

export const createOrderApi = (data) => post('/api/order/create', data)
export const getOrderListApi = (params, config = {}) => get('/api/order/list', params, config)
export const getOrderDetailApi = (id) => get(`/api/order/detail/${id}`)
export const cancelOrderApi = (id) => put(`/api/order/cancel/${id}`)
// 订单支付（待支付 → 租赁中）
export const payOrderApi = (id) => put(`/api/order/pay/${id}`)
