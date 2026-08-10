// 用户模块：个人信息 / 头像 / 密码 / 收藏 / 实名认证
import { get, post, put, upload } from '@/utils/request'

export const updateProfileApi = (data) => put('/api/user/profile', data)
export const updateAvatarApi = (file) => upload('/api/user/avatar', file)
export const changePasswordApi = (data) => put('/api/user/password', data)
export const getFavoritesApi = () => get('/api/user/favorites')
export const addFavoriteApi = (carId) => post('/api/user/favorite', { carId })
export const removeFavoriteApi = (carId) => post('/api/user/favorite', { carId, action: 'remove' })

// 通用图片上传（身份证/驾驶证等），返回 { url: '/uploads/yyyyMM/xxx.jpg' }
export const uploadImageApi = (file) => upload('/api/upload', file)
