// 购物车模块：列表 / 数量 / 加入 / 更新 / 移除 / 清空
import { get, post, put, del } from '@/utils/request'

export const getCartListApi = () => get('/api/cart/list', {}, { noDedup: true })
export const getCartCountApi = () => get('/api/cart/count', {}, { noDedup: true })
export const addCartApi = (data) => post('/api/cart/add', data)
export const updateCartApi = (id, data) => put(`/api/cart/update/${id}`, data)
export const removeCartApi = (id) => del(`/api/cart/${id}`)
export const clearCartApi = () => del('/api/cart/clear')
