// 售后投诉模块：提交投诉 / 我的投诉记录 / 投诉详情 / 满意度评分
import { get, post } from '@/utils/request'

// 提交投诉（需登录）
export const submitComplaintApi = (data) => post('/api/complaint/submit', data)

// 我的投诉记录（分页，需登录）
export const getMyComplaintsApi = (params) => get('/api/complaint/mine', params)

// 投诉详情（仅本人）
export const getComplaintDetailApi = (id) => get(`/api/complaint/${id}`)

// 对已处理投诉评分（1-5星，仅本人 + 已解决状态）
export const rateComplaintApi = (id, data) => post(`/api/complaint/${id}/rate`, data)
