// 系统配置模块：网站配置 / 门店 / 服务优势 / 客户评价 / 字典
import { get } from '@/utils/request'

export const getSystemConfigApi = () => get('/api/system/config')
export const getStoresApi = () => get('/api/system/stores')
export const getAdvantagesApi = () => get('/api/system/advantages')
export const getReviewsApi = () => get('/api/system/reviews')

// 按类型查询字典数据（如 vehicle_type / vehicle_brand）
export const getDictByTypeApi = (dictType) => get(`/api/system/dict/${dictType}`)

