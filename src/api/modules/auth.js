// 认证模块：登录 / 注册 / 获取用户信息 / 退出
import { get, post } from '@/utils/request'

export const loginApi = (data) => post('/api/auth/login', data)
export const registerApi = (data) => post('/api/auth/register', data)
export const getUserInfoApi = () => get('/api/auth/user-info')
// 登出：携带 refresh token 以便后端一并失效
export const logoutApi = (refreshToken) =>
  post('/api/auth/logout', refreshToken ? { refreshToken } : {}, { skipBusinessError: true })
export const sendSmsCodeApi = (data) => post('/api/auth/sms-code', data)
export const forgotPasswordApi = (data) => post('/api/auth/forgot-password', data)
