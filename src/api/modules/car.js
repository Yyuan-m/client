// 车辆模块：列表筛选 / 详情 / 热门推荐 / 推荐配置
import { get, put } from '@/utils/request'

export const getCarListApi = (params) => get('/api/car/list', params)
export const getCarDetailApi = (id) => get(`/api/car/detail/${id}`)
export const getHotCarsApi = () => get('/api/car/hot')
// 查询车辆素材图片（按分类分组，用于详情页展示）
export const getCarImagesApi = (id) => get(`/api/car/${id}/images`)
// 切换车型推荐状态（后台管理配置）
export const toggleCarRecommendApi = (id, isRecommend) => put(`/api/car/recommend/${id}`, null, { params: { isRecommend } })
