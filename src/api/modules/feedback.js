// 反馈模块：预约咨询 / 留言反馈
import { post } from '@/utils/request'

// 提交预约咨询或留言反馈（type: appointment 预约咨询 / feedback 留言反馈）
export const submitFeedbackApi = (data) => post('/api/feedback/submit', data)
