// 评价模块：提交评价 / 订单评价列表 / 可评价轮次查询
import { get, post } from '@/utils/request'

// 提交评价（首评/追评，由订单 reviewStatus 自动判定轮次，每单最多2次）
export const submitReviewApi = (data) => post('/api/review/submit', data)
// 查询订单评价列表（首评 + 追评，按轮次升序）
export const getOrderReviewsApi = (orderId) => get(`/api/review/order/${orderId}`)
// 查询订单可评价轮次（canReviewRound: 1=可首评, 2=可追评, null=不可评价）
export const getCanReviewRoundApi = (orderId) => get(`/api/review/can-review/${orderId}`)
