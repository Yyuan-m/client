# LUXURY CAR Customer Client

> 大圣玩车平台 —— 用户端 Web 应用

基于 Vue 3 + Vite + Element Plus 构建的大圣玩车用户端官网，提供车辆浏览、在线租车、订单管理、预约咨询、售后投诉、优惠券、个人中心等功能，并与多端应用（uni-app）共享同一后端，支持**购物车跨端实时同步**。

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

- **首页**：全屏轮播 Hero、品牌简介、热门车型、服务优势、客户评价、活动优惠券、预约咨询表单
- **车辆中心**：车辆列表（筛选 / 排序 / 分页）、车辆详情（配置、图片分组、评价）
- **租车购物车**：多车辆合并下单、租期弹层改期（与详情页逻辑一致）、价格实时计算、**跨端实时同步**
- **订单**：确认下单、订单列表、订单详情、取消订单、订单支付
- **认证**：账号注册 / 登录、忘记密码（短信验证码）、双 Token 无感刷新
- **个人中心**：基础资料、头像上传、实名认证、驾驶证上传、修改密码、我的预约、我的投诉、优惠券、评价
- **客服中心**：联系客服（服务热线/邮箱/地址）、留言反馈、预约咨询、售后投诉
- **关于我们**

## 目录结构

```
customer-client/
├── public/                  # 静态资源
├── src/
│   ├── api/                 # API 接口封装
│   │   ├── modules/         # 按业务模块拆分：auth / car / cart / order / coupon / user / price / feedback / complaint / ...
│   │   └── index.js
│   ├── components/          # 通用组件
│   │   ├── AppHeader/       # 顶部导航
│   │   ├── AppFooter/       # 页脚
│   │   ├── CarCard/         # 车辆卡片
│   │   ├── CouponCard/      # 优惠券卡片
│   │   ├── DateRentPicker/  # 租期选择器（详情页与购物车改期共用）
│   │   ├── ImagePreview/    # 图片大图预览
│   │   ├── LevelUpOverlay/  # 会员升级动画
│   │   ├── ReviewDialog/    # 评价弹窗
│   │   ├── EmptyTips/       # 空状态
│   │   ├── PageSkeleton/    # 骨架屏
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
│   │   ├── cart/            # 购物车（跨端同步 + 改期弹层）
│   │   ├── order/           # 结算 / 订单列表 / 订单详情
│   │   ├── auth/            # 登录 / 注册 / 忘记密码
│   │   ├── profile/         # 个人中心（含我的预约 / 投诉 / 改密）
│   │   ├── complaint/       # 售后投诉（列表 / 详情 / 提交）
│   │   ├── announcement/    # 公告
│   │   ├── contact/         # 联系客服
│   │   ├── about/           # 关于我们
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

# 2. 启动开发服务器
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
| `server.proxy /uploads` | `http://localhost:8089` | 客户端静态资源代理 |

### 鉴权机制

- **双 Token 无感刷新**：access token 2h + refresh token 7d
- access token 过期时自动用 refresh token 换取新的 token，原请求自动重试，用户无感知
- refresh token 也失效时（超过 7 天未登录），倒计时 3 秒跳转登录页
- 403 仅弹错误提示，不跳登录（token 有效，仅无权限）

## 关键业务说明

### 购物车跨端实时同步

与多端 App（`customer-client-app`）共用同一后端，同账号登录时购物车实时互相同步（增删 / 改租期 / 清空）：

- 购物车页面打开期间每 5 秒执行一次 `checkRemoteSync()`，拉取远程列表与本地做摘要比对，不一致才全量刷新
- 页面重新聚焦 / `visibilitychange` 切回时立即校验一次
- 配合移动端 onShow 轮询，实现双端互相实时刷新

### 购物车商品手动勾选

- 商品默认**不自动勾选**，需用户手动勾选（或「全选」）后才可去结算
- 跨端同步、新增商品均不会自动选中，仅保留用户已手动选中且仍存在的项

### 购物车租期修改（弹层）

- 点击日期区域弹出「修改租期」弹层，内嵌与车辆详情页租车/加购**同一套** `DateRentPicker` 组件
- 入参同源：车辆级 `minRentDays` / `maxRentDays` / `availableDate` + 已租出/整备期禁用
- 选择器内部校验最短/最长租期，保存前再校验与已租出区间冲突（后端二次兜底）

### 预约咨询 / 我的预约（个人中心）

- 首页「预约咨询」表单提交后，登录用户可在**个人中心 - 我的预约**查看处理进度
- 状态机：待处理 → 已处理（展示后台处理人 / 处理说明 / 时间）；用户可在待处理时取消
- 联系客服页服务热线读取 `config.phone`（后端同时输出 `phone` 与 `hotline` 兜底）

### 售后投诉（个人中心 / complaint 页面）

- 提交投诉（关联订单、上传凭证、投诉类型来自字典）
- 我的投诉记录：状态跟踪、投诉详情、对已处理的投诉打分（满意度 1-5 星）

### 服务热线

后端 `SystemService` 同时输出 `phone` 与 `hotline` 字段（同值），Web 端联系客服读取 `phone`，移动端读取 `hotline`，避免字段不匹配导致号码为空。

## 与后端的关系

本仓库为纯前端项目，依赖 [`customer-server`](../customer-server) 提供接口。请先启动后端服务（默认端口 8089），再启动前端开发服务器。

## License

MIT