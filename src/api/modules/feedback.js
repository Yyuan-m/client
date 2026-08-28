// 反馈模块：预约咨询 / 留言反馈 / 我的预约
import { get, post } from '@/utils/request'

// 提交预约咨询或留言反馈（type: appointment 预约咨询 / feedback 留言反馈）
export const submitFeedbackApi = (data) => post('/api/feedback/submit', data)

// 我的预约列表（分页 + 状态筛选，需登录）
export const getMyAppointmentsApi = (params, config = {}) =>
  get('/api/feedback/appointments', params, { noDedup: true, ...config })

// 取消预约（仅待处理/已确认状态可取消）
export const cancelAppointmentApi = (id) => post(`/api/feedback/appointments/${id}/cancel`)
