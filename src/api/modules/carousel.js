// 轮播图模块：首页启用轮播
import { get } from '@/utils/request'

export const getActiveCarouselApi = () => get('/api/carousel/active')
