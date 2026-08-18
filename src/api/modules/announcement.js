// 公告模块：头部下拉 / 列表分页 / 详情
import { get } from '@/utils/request'

// 头部下拉：3 条优先级高的公告
export const getTopAnnouncementsApi = () => get('/api/announcement/top')

// 公告列表分页
// params: { page, pageSize, onlyHigh }
export const getAnnouncementPageApi = (params, config) =>
  get('/api/announcement/page', params, config)

// 公告详情
export const getAnnouncementDetailApi = (id) => get(`/api/announcement/${id}`)
