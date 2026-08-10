# LUXURY CAR Customer Client

> 豪华汽车租赁平台 —— 用户端 Web 应用

基于 Vue 3 + Vite + Element Plus 构建的豪华汽车租赁用户端官网，提供车辆浏览、在线租车、订单管理、优惠券、个人中心等功能。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | Vue 3.5（Composition API + `<script setup>`） |
| 构建工具 | Vite 5 |
| UI 组件库 | Element Plus 2.14 + Element Plus Icons |
| 状态管理 | Pinia 2 + pinia-plugin-persistedstate |
| 路由 | Vue Router 4 |
| HTTP 客户端 | Axios |
| 图表 | ECharts 5 |
| 日期处理 | Day.js |
| 样式 | Sass + CSS 变量 + 设计令牌（variables.scss） |
| 自动导入 | unplugin-auto-import / unplugin-vue-components |

## 功能模块

- **首页**：轮播图、精选车型、优惠活动、领券中心
- **车辆中心**：车辆列表（筛选 / 排序 / 分页）、车辆详情（配置、图片、评价）
- **租车购物车**：多车辆合并下单、租期选择、价格实时计算
- **订单**：确认下单、订单列表、订单详情、取消订单、订单支付
- **认证**：账号注册 / 登录、忘记密码（短信验证码）、双 Token 无感刷新
- **个人中心**：基础资料、头像上传、实名认证、驾驶证上传、密码修改
- **优惠券**：领券中心、我的优惠券
- **客服反馈**：在线提交意见反馈
- **关于我们 / 联系客服**

## 目录结构

```
customer-client/
├── public/                  # 静态资源
├── src/
│   ├── api/                 # API 接口封装
│   │   ├── modules/         # 按业务模块拆分：auth / car / cart / order / coupon / user / price / ...
│   │   └── index.js
│   ├── components/          # 通用组件
│   │   ├── AppHeader/       # 顶部导航
│   │   ├── AppFooter/       # 页脚
│   │   ├── CarCard/         # 车辆卡片
│   │   ├── CouponCard/      # 优惠券卡片
│   │   ├── DateRentPicker/  # 租期选择器
│   │   ├── BackTop/         # 返回顶部
│   │   └── ...
│   ├── composables/         # 组合式函数
│   ├── layout/              # 布局
│   │   └── DefaultLayout.vue
│   ├── router/              # 路由配置 + 全局守卫
│   ├── stores/              # Pinia 状态（user / cart / app / filter）
│   ├── styles/              # 全局样式、变量、动画
│   ├── utils/               # 工具方法
│   │   ├── request.js       # Axios 封装：拦截器 / 401 无感刷新 / 403 提示 / 重复请求去重
│   │   ├── auth.js          # Token / Refresh Token / 用户信息存储
│   │   └── index.js         # 通用工具（金额格式化、价格计算等）
│   ├── views/               # 页面
│   │   ├── home/            # 首页
│   │   ├── vehicle/         # 车辆列表 / 详情
│   │   ├── cart/            # 购物车
│   │   ├── order/           # 结算 / 订单列表 / 订单详情
│   │   ├── auth/            # 登录 / 注册 / 忘记密码
│   │   ├── profile/         # 个人中心
│   │   ├── about/           # 关于我们
│   │   ├── contact/         # 联系客服
│   │   └── error/           # 404
│   ├── App.vue
│   └── main.js
├── .gitignore
├── index.html
├── jsconfig.json
├── package.json
├── vite.config.js
└── README.md
```

## 环境要求

- Node.js >= 18
- npm >= 9（或 pnpm / yarn）

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认端口 3000）
npm run dev

# 3. 生产构建
npm run build

# 4. 预览生产构建
npm run preview
```

开发服务器启动后会自动打开浏览器：http://localhost:3000

## 配置说明

### Vite 配置（`vite.config.js`）

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `server.port` | 3000 | 前端开发端口 |
| `server.proxy /api` | `http://localhost:8089` | 后端接口代理 |
| `server.proxy /uploads` | `http://localhost:8089` | 头像等静态资源代理 |

### 鉴权机制

- **双 Token 无感刷新**：access token 2h + refresh token 7d
- access token 过期时自动用 refresh token 换取新的 token，原请求自动重试，用户无感知
- refresh token 也失效时（超过 7 天未登录），倒计时 3 秒跳转登录页
- 403 仅弹错误提示，不跳登录（token 有效，仅无权限）

## 与后端的关系

本仓库为纯前端项目，依赖 [`customer-server`](../customer-server) 提供接口。请先启动后端服务（默认端口 8089），再启动前端开发服务器。

## License

MIT
