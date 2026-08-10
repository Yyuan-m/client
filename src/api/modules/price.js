// 价格计算模块：调用车后端 PriceService，确保前端展示与后端下单价格完全一致
// - calcCarPriceApi   单辆车价格计算（车辆详情页 / 立即租车）
// - calcCartPriceApi  购物车批量价格计算（购物车 / 结算页）
import { post } from '@/utils/request'

/**
 * 单辆车价格计算
 * @param {Object} payload { carId, startDate, endDate }
 * @returns {Promise<PriceDetailVO>}
 */
export const calcCarPriceApi = (payload) => post('/api/price/car', payload)

/**
 * 购物车批量价格计算
 * @param {Array} items [{ carId, startDate, endDate }, ...]
 * @returns {Promise<PriceDetailVO[]>}
 */
export const calcCartPriceApi = (items) => post('/api/price/cart', { items })
