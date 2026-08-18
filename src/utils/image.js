/**
 * 图片 URL 解析工具
 *
 * 数据库统一只存储相对路径（如 /uploads/xxx.jpg）。
 * 前端通过不同前缀路径区分图片来源，由 Vite dev server 的 proxy（开发环境）
 * 或 Nginx 反向代理（生产环境）转发到对应后端静态资源服务。
 *
 * 两个后端服务的静态资源目录相互独立：
 * - 8088 后台管理服务（car_rental_uploads）：车辆封面/相册等管理员上传资源
 * - 8089 前台客户端服务（car_rental_customer_uploads）：轮播图、品牌横幅、
 *   登录/注册背景图、用户头像、评价图片、实名认证图片等
 *
 * 通过区分前缀（/admin-uploads vs /uploads）让 Vite proxy 转发到不同服务，
 * 所有请求保持同源（http://localhost:3000），避免跨域导致的
 * ERR_BLOCKED_BY_ORB（Opaque Response Blocking）问题。
 */

/**
 * 解析后台管理服务图片 URL
 * 用于：车辆封面/相册等管理员上传资源（存储在 8088 服务的 uploads 目录）
 *
 * 将 /uploads/ 前缀替换为 /admin-uploads/，由 Vite proxy 转发到 8088 服务，
 * 并在代理层把 /admin-uploads 重写回 /uploads。
 *
 * @param {string} path 相对路径，如 /uploads/xxx.jpg
 * @returns {string} 带代理前缀的相对路径，如 /admin-uploads/xxx.jpg
 */
export function resolveAdminImage(path) {
  if (!path) return ''
  // 已是完整 URL（http:// 或 https://）直接返回
  if (/^https?:\/\//.test(path)) return path
  // 车辆图片等后台管理服务资源走 /admin-uploads 前缀，由 Vite proxy 转发到 8088
  return path.replace(/^\/uploads\//, '/admin-uploads/')
}

/**
 * 解析客户端服务图片 URL
 * 用于：轮播图、品牌横幅、登录/注册背景图、用户头像、评价图片、实名认证图片等
 * （存储在 8089 服务的 uploads 目录）
 *
 * @param {string} path 相对路径，如 /uploads/banners/xxx.jpg
 * @returns {string} 相对路径，由 Vite proxy 转发到 8089 服务
 */
export function resolveClientImage(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return path
}
