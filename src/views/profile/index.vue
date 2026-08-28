<template>
  <div class="profile-page section">
    <div class="container">
      <h2 class="section-title">个人中心</h2>
      <div class="profile-layout">
        <!-- 侧边菜单 -->
        <aside class="profile-sidebar">
          <div
            class="user-card"
            :class="`level-${levelConfig.cls}`"
            :style="{ background: levelConfig.gradCss }"
          >
            <!-- 卡片装饰：轨道圆环 + 高光扫过 -->
            <div class="card-orbit"></div>
            <div class="card-shine"></div>
            <div class="card-top">
              <div class="card-edition">
                <span class="card-brand">LUX·RENT</span>
                <span class="card-tag">{{ levelName }}</span>
              </div>
              <el-avatar class="card-avatar" :size="54" :src="resolveClientImage(userStore.user?.avatar)">
                {{ userStore.nickname?.charAt(0) }}
              </el-avatar>
            </div>
            <div class="card-main">
              <h3 class="user-name">{{ userStore.nickname }}</h3>
            </div>
            <ul class="card-stats">
              <li class="stat">
                <span>信用积分</span>
                <b>{{ userStore.user?.creditScore ?? '--' }}</b>
              </li>
              <li class="stat">
                <span>租车订单</span>
                <b>{{ userStore.user?.totalOrders ?? 0 }}</b>
              </li>
              <li class="stat">
                <span>累计消费</span>
                <b class="stat-value" :style="{ fontSize: spentFontSize }">{{ spentText }}</b>
              </li>
            </ul>
            <!-- 距下一等级提示（双条件：租赁次数或累计消费任一达标即升级） -->
            <div class="card-next" v-if="nextLevelText">
              <span class="next-text">{{ nextLevelText }}</span>
            </div>
            <p class="card-note">* 租车订单为全部订单数 · 累计消费仅统计已完成订单金额</p>
            <p class="card-no">会员编号 NO.{{ memberNo }}</p>
          </div>
          <el-menu :default-active="activeTab" @select="activeTab = $event">
            <el-menu-item index="info"><el-icon><User /></el-icon><span>个人信息</span></el-menu-item>
            <el-menu-item index="orders"><el-icon><List /></el-icon><span>我的订单</span></el-menu-item>
            <el-menu-item index="appointments"><el-icon><Calendar /></el-icon><span>我的预约</span></el-menu-item>
            <el-menu-item index="reviews">
              <el-icon><EditPen /></el-icon>
              <span>去评价</span>
              <span v-if="reviewableCount > 0" class="menu-count-badge">{{ reviewableCount }}</span>
            </el-menu-item>
            <el-menu-item index="verify"><el-icon><Postcard /></el-icon><span>实名认证</span></el-menu-item>
            <el-menu-item index="coupons"><el-icon><Ticket /></el-icon><span>我的优惠券</span></el-menu-item>
            <el-menu-item index="password"><el-icon><Lock /></el-icon><span>修改密码</span></el-menu-item>
          </el-menu>
        </aside>

        <!-- 内容区 -->
        <div class="profile-content">
          <!-- 个人信息 -->
          <div v-if="activeTab === 'info'" class="tab-panel">
            <h3 class="panel-title">编辑资料</h3>
            <div class="avatar-section">
              <el-upload
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="handleAvatarUpload"
                accept="image/*"
                class="avatar-uploader"
              >
                <div class="avatar-wrap" title="点击更换头像">
                  <el-avatar :size="96" :src="resolveClientImage(form.avatar)">{{ form.nickname?.charAt(0) }}</el-avatar>
                  <div class="avatar-mask">
                    <el-icon :size="22"><Camera /></el-icon>
                    <span>更换头像</span>
                  </div>
                </div>
              </el-upload>
              <div class="avatar-meta">
                <p class="avatar-name">{{ form.nickname || '未设置昵称' }}</p>
                <p class="avatar-hint">支持 JPG / PNG，大小不超过 2MB<br />点击左侧头像即可选择图片更换</p>
              </div>
            </div>
            <el-form :model="form" label-width="80px" class="profile-form">
              <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
              <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
              <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 我的订单：最近 3 单 + 跳转全部 -->
          <div v-else-if="activeTab === 'orders'" class="tab-panel">
            <h3 class="panel-title">我的订单</h3>
            <div v-if="orderLoading" v-loading="true" style="min-height: 200px"></div>
            <template v-else>
              <div v-if="recentOrders.length" class="order-list">
                <div
                  v-for="order in recentOrders"
                  :key="order.id"
                  class="order-card"
                  @click="router.push(`/orders/${order.id}`)"
                >
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <span class="order-status" :class="order.status">{{ order.statusName }}</span>
                  </div>
                  <div class="order-body">
                    <img :src="resolveAdminImage(order.carCover)" :alt="order.carName" class="order-img" />
                    <div class="order-info">
                      <h4>{{ order.carName }}</h4>
                      <p>{{ order.startDate }} 至 {{ order.endDate }}（{{ order.days }}天）</p>
                      <p class="order-store">{{ order.store }}</p>
                    </div>
                    <div class="order-amount">
                      <span class="amount">￥{{ moneyUtil.format(order.totalAmount) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <EmptyTips v-else text="暂无订单" show-action action-text="去租车" @action="router.push('/vehicles')" />
              <div class="view-all-bar">
                <el-button type="primary" text @click="router.push('/orders')">查看全部订单 →</el-button>
              </div>
            </template>
          </div>

          <!-- 去评价：待首评 + 可追评订单 -->
          <div v-else-if="activeTab === 'reviews'" class="tab-panel">
            <h3 class="panel-title">
              去评价
              <span v-if="reviewableCount > 0" class="panel-title-count">{{ reviewableCount }}</span>
            </h3>
            <p class="panel-desc">完成评价是对车主最好的反馈，每单可评价2次（首次评价 + 追加评价）</p>
            <div v-if="reviewLoading" v-loading="true" style="min-height: 200px"></div>
            <template v-else>
              <div v-if="reviewableOrders.length" class="order-list">
                <div
                  v-for="order in reviewableOrders"
                  :key="order.id"
                  class="order-card reviewable-card"
                  @click="router.push(`/orders/${order.id}`)"
                >
                  <div class="order-header">
                    <span class="order-no">订单号：{{ order.orderNo }}</span>
                    <span class="review-tag" :class="order.reviewStatus">
                      {{ order.reviewStatus === 'unreviewed' ? '待评价' : '可追评' }}
                    </span>
                  </div>
                  <div class="order-body">
                    <img :src="resolveAdminImage(order.carCover)" :alt="order.carName" class="order-img" />
                    <div class="order-info">
                      <h4>{{ order.carName }}</h4>
                      <p>{{ order.startDate }} 至 {{ order.endDate }}（{{ order.days }}天）</p>
                      <p class="order-store">{{ order.store }}</p>
                    </div>
                    <div class="order-amount">
                      <span class="amount">￥{{ moneyUtil.format(order.totalAmount) }}</span>
                      <el-button
                        type="primary"
                        size="small"
                        class="review-btn"
                        @click.stop="openReviewDialog(order)"
                      >
                        {{ order.reviewStatus === 'unreviewed' ? '去评价' : '去追评' }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              <EmptyTips v-else text="暂无待评价订单" show-action action-text="去租车" @action="router.push('/vehicles')" />
            </template>
          </div>

          <!-- 实名认证 / 驾驶证 -->
          <div v-else-if="activeTab === 'verify'" class="tab-panel">
            <h3 class="panel-title">实名认证 / 驾驶证</h3>
            <!-- 认证须知：着重提醒 -->
            <div class="verify-notice">
              <el-icon :size="20" class="verify-notice-icon"><WarningFilled /></el-icon>
              <div class="verify-notice-text">
                <b>完成实名与驾驶证信息认证后方可下单租车</b>
                <span>所有信息仅用于核验，不会公开展示。</span>
              </div>
            </div>

            <!-- 当前认证状态 -->
            <div class="verify-status-bar" :class="`st-${verifyStatus}`">
              <el-icon :size="18">
                <CircleCheckFilled v-if="verifyStatus === 'verified'" />
                <Clock v-else-if="verifyStatus === 'pending'" />
                <WarningFilled v-else-if="verifyStatus === 'rejected'" />
                <InfoFilled v-else />
              </el-icon>
              <span>{{ verifyStatusText }}</span>
            </div>

            <!-- 驳回原因 -->
            <el-alert
              v-if="verifyStatus === 'rejected' && userStore.user?.verifyRejectReason"
              class="reject-alert"
              type="error"
              :closable="false"
              show-icon
              :title="`认证被驳回：${userStore.user.verifyRejectReason}`"
              description="请根据驳回原因修改认证资料后重新提交。"
            />

            <!-- 审核中 / 已认证：只读展示已提交资料 -->
            <div v-if="!verifyEditable && hasSubmittedVerifyData" class="verify-readonly">
              <h4 class="form-section-title">已提交的认证资料</h4>
              <el-descriptions :column="2" border class="verify-desc">
                <el-descriptions-item label="真实姓名">{{ readonlyVerify.realName }}</el-descriptions-item>
                <el-descriptions-item label="性别">{{ readonlyVerify.genderText }}</el-descriptions-item>
                <el-descriptions-item label="出生日期">{{ readonlyVerify.birthday }}</el-descriptions-item>
                <el-descriptions-item label="身份证号">{{ readonlyVerify.idCard }}</el-descriptions-item>
                <el-descriptions-item label="驾驶证号">{{ readonlyVerify.driverLicenseNo }}</el-descriptions-item>
                <el-descriptions-item label="准驾车型">{{ readonlyVerify.driverLicenseType || '—' }}</el-descriptions-item>
                <el-descriptions-item label="驾驶证有效期">{{ readonlyVerify.driverLicenseExpireDate || '—' }}</el-descriptions-item>
                <el-descriptions-item label="提交时间">{{ readonlyVerify.submitTime }}</el-descriptions-item>
              </el-descriptions>
              <div class="upload-row readonly-row">
                <div v-for="img in verifyImageList" :key="img.key" class="upload-item">
                  <el-image
                    :src="resolveClientImage(img.url)"
                    :preview-src-list="[resolveClientImage(img.url)]"
                    fit="cover"
                    class="upload-box readonly-box"
                    preview-teleported
                  >
                    <template #error>
                      <div class="upload-placeholder"><span>未上传</span></div>
                    </template>
                  </el-image>
                  <p class="upload-label">{{ img.label }}</p>
                </div>
              </div>
              <p class="readonly-img-tip">点击证件照片可放大查看</p>
              <p v-if="verifyStatus === 'pending'" class="verify-pending-tip">
                工作人员将在 1-2 个工作日内完成审核，审核结果会同步到您的账户，期间认证资料不可修改。
              </p>
            </div>

            <!-- 未认证 / 已驳回：可编辑表单 -->
            <el-form v-if="verifyEditable" :model="verifyForm" label-width="110px" class="verify-form">
              <h4 class="form-section-title">基本信息</h4>
              <el-form-item label="真实姓名">
                <el-input v-model="verifyForm.realName" placeholder="请输入身份证上的姓名" />
              </el-form-item>
              <el-form-item label="性别">
                <el-radio-group v-model="verifyForm.gender">
                  <el-radio :value="1">男</el-radio>
                  <el-radio :value="2">女</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="出生日期">
                <el-date-picker
                  v-model="verifyForm.birthday"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择出生日期"
                  style="width: 100%"
                  :disabled-date="disableFutureDate"
                />
              </el-form-item>
              <el-form-item label="身份证号">
                <el-input v-model="verifyForm.idCard" placeholder="18 位身份证号" maxlength="18" />
              </el-form-item>

              <h4 class="form-section-title">身份证照片</h4>
              <div class="upload-row">
                <div class="upload-item">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(opt) => handleVerifyUpload(opt, 'idCardFrontImg')"
                    accept="image/*"
                    class="verify-uploader"
                  >
                    <div class="upload-box">
                      <img v-if="verifyForm.idCardFrontImg" :src="resolveClientImage(verifyForm.idCardFrontImg)" class="upload-preview" />
                      <div v-if="verifyForm.idCardFrontImg" class="upload-mask">
                        <el-icon :size="20"><Camera /></el-icon>
                        <span>点击更换</span>
                      </div>
                      <div v-else class="upload-placeholder">
                        <el-icon :size="26"><Camera /></el-icon>
                        <span>身份证正面</span>
                        <span class="ph-hint">点击上传</span>
                      </div>
                    </div>
                  </el-upload>
                  <p class="upload-label">身份证正面（人像面）</p>
                </div>
                <div class="upload-item">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(opt) => handleVerifyUpload(opt, 'idCardBackImg')"
                    accept="image/*"
                    class="verify-uploader"
                  >
                    <div class="upload-box">
                      <img v-if="verifyForm.idCardBackImg" :src="resolveClientImage(verifyForm.idCardBackImg)" class="upload-preview" />
                      <div v-if="verifyForm.idCardBackImg" class="upload-mask">
                        <el-icon :size="20"><Camera /></el-icon>
                        <span>点击更换</span>
                      </div>
                      <div v-else class="upload-placeholder">
                        <el-icon :size="26"><Camera /></el-icon>
                        <span>身份证背面</span>
                        <span class="ph-hint">点击上传</span>
                      </div>
                    </div>
                  </el-upload>
                  <p class="upload-label">身份证背面（国徽面）</p>
                </div>
              </div>

              <h4 class="form-section-title">驾驶证信息</h4>
              <el-form-item label="驾驶证号">
                <el-input v-model="verifyForm.driverLicenseNo" placeholder="驾驶证档案编号" />
              </el-form-item>
              <el-form-item label="准驾车型">
                <el-select v-model="verifyForm.driverLicenseType" placeholder="选择准驾车型" style="width: 100%">
                  <el-option label="C1（小型汽车）" value="C1" />
                  <el-option label="C2（小型自动挡汽车）" value="C2" />
                  <el-option label="B1（中型客车）" value="B1" />
                  <el-option label="B2（大型货车）" value="B2" />
                  <el-option label="A1（大型客车）" value="A1" />
                  <el-option label="A2（牵引车）" value="A2" />
                </el-select>
              </el-form-item>
              <el-form-item label="过期日期">
                <el-date-picker
                  v-model="verifyForm.driverLicenseExpireDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="驾驶证过期日期"
                  style="width: 100%"
                  :disabled-date="disablePastDate"
                />
              </el-form-item>

              <h4 class="form-section-title">驾驶证照片</h4>
              <div class="upload-row">
                <div class="upload-item">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(opt) => handleVerifyUpload(opt, 'driverLicenseFrontImg')"
                    accept="image/*"
                    class="verify-uploader"
                  >
                    <div class="upload-box">
                      <img v-if="verifyForm.driverLicenseFrontImg" :src="resolveClientImage(verifyForm.driverLicenseFrontImg)" class="upload-preview" />
                      <div v-if="verifyForm.driverLicenseFrontImg" class="upload-mask">
                        <el-icon :size="20"><Camera /></el-icon>
                        <span>点击更换</span>
                      </div>
                      <div v-else class="upload-placeholder">
                        <el-icon :size="26"><Camera /></el-icon>
                        <span>驾驶证正面</span>
                        <span class="ph-hint">点击上传</span>
                      </div>
                    </div>
                  </el-upload>
                  <p class="upload-label">驾驶证正面（主页）</p>
                </div>
                <div class="upload-item">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="beforeImageUpload"
                    :http-request="(opt) => handleVerifyUpload(opt, 'driverLicenseBackImg')"
                    accept="image/*"
                    class="verify-uploader"
                  >
                    <div class="upload-box">
                      <img v-if="verifyForm.driverLicenseBackImg" :src="resolveClientImage(verifyForm.driverLicenseBackImg)" class="upload-preview" />
                      <div v-if="verifyForm.driverLicenseBackImg" class="upload-mask">
                        <el-icon :size="20"><Camera /></el-icon>
                        <span>点击更换</span>
                      </div>
                      <div v-else class="upload-placeholder">
                        <el-icon :size="26"><Camera /></el-icon>
                        <span>驾驶证背面</span>
                        <span class="ph-hint">点击上传</span>
                      </div>
                    </div>
                  </el-upload>
                  <p class="upload-label">驾驶证背面（副页）</p>
                </div>
              </div>

              <el-form-item>
                <el-button type="primary" :loading="verifySaving" @click="saveVerify">
                  {{ verifyStatus === 'rejected' ? '重新提交认证' : '提交人工审核' }}
                </el-button>
                <span class="verify-submit-hint">提交后进入人工审核，审核期间资料不可修改</span>
              </el-form-item>
            </el-form>
          </div>

          <!-- 我的优惠券 -->
          <div v-else-if="activeTab === 'coupons'" class="tab-panel">
            <h3 class="panel-title">我的优惠券</h3>

            <!-- 状态分组 tabs -->
            <div class="coupon-tabs">
              <button
                v-for="tab in couponTabs"
                :key="tab.value"
                class="coupon-tab"
                :class="{ active: couponStatus === tab.value }"
                @click="switchCouponTab(tab.value)"
              >
                {{ tab.label }}
                <span class="count">{{ couponCountMap[tab.value] || 0 }}</span>
              </button>
            </div>

            <div v-if="couponLoading" v-loading="true" style="min-height: 200px"></div>
            <template v-else>
              <div v-if="coupons.length" class="coupon-list">
                <CouponCard
                  v-for="coupon in coupons"
                  :key="coupon.id"
                  :coupon="coupon"
                  mode="mine"
                  :show-stock="false"
                  @use="goUseCoupon"
                />
              </div>
              <EmptyTips
                v-else
                :text="emptyCouponText"
                show-action
                action-text="去领券"
                @action="router.push('/#coupons')"
              />
            </template>
          </div>
          
          <!-- 我的预约 -->
          <div v-else-if="activeTab === 'appointments'" class="tab-panel">
            <h3 class="panel-title">
              我的预约
              <span class="panel-title-count" v-if="appointmentAllTotal > 0">{{ appointmentAllTotal }}</span>
            </h3>
            <p class="panel-desc">
              提交预约咨询后，客服将尽快与您联系；处理结果（沟通说明、处理人、时间）会同步展示在此
            </p>

            <!-- 状态筛选 tabs -->
            <el-tabs v-model="appointmentStatus" class="appt-tabs" @tab-change="onAppointmentTabChange">
              <el-tab-pane
                v-for="tab in appointmentTabs"
                :key="tab.value"
                :label="tab.label"
                :name="tab.value"
              />
            </el-tabs>

            <div v-if="appointmentLoading" v-loading="true" style="min-height: 200px"></div>
            <template v-else>
              <div v-if="appointments.length" class="appt-list">
                <div
                  v-for="appt in appointments"
                  :key="appt.id"
                  class="appt-card"
                  :class="`appt-${appt.status}`"
                >
                  <div class="appt-header">
                    <span class="appt-no">NO.{{ String(appt.id).padStart(6, '0') }}</span>
                    <span class="appt-status" :class="`st-${appt.status}`">
                      <i class="status-dot"></i>{{ appt.statusName }}
                    </span>
                  </div>
                  <div class="appt-body">
                    <div class="appt-main">
                      <div class="appt-car-row">
                        <span class="appt-car-icon">🚗</span>
                        <span class="appt-car">{{ appt.carType || '车型不限' }}</span>
                        <span v-if="appt.rentDate" class="appt-date-chip">📅 {{ appt.rentDate }} 取车</span>
                      </div>
                      <div class="appt-rows">
                        <div class="appt-row">
                          <span class="appt-label">联系人</span>
                          <span>{{ appt.name }}（{{ appt.phone }}）</span>
                        </div>
                        <div v-if="appt.content" class="appt-row appt-content-row">
                          <span class="appt-label">留言</span>
                          <span
                            class="appt-content"
                            :class="{ 'is-clamped': isLongContent(appt) && !expandedAppts.has(appt.id) }"
                          >{{ appt.content }}</span>
                          <span
                            v-if="isLongContent(appt)"
                            class="appt-content-toggle"
                            @click="toggleApptContent(appt.id)"
                          >{{ expandedAppts.has(appt.id) ? '收起' : '展开' }}</span>
                        </div>
                      </div>
                      <!-- 处理进度时间线 -->
                      <div class="appt-timeline">
                        <div class="tl-item">
                          <i class="tl-dot"></i>
                          <div class="tl-content">
                            <span class="tl-title">提交预约</span>
                            <span class="tl-time">{{ formatTime(appt.createTime) }}</span>
                          </div>
                        </div>
                        <div v-if="appt.status !== 'pending'" class="tl-item">
                          <i class="tl-dot" :class="{ 'tl-dot-done': appt.status === 'handled', 'tl-dot-cancel': appt.status === 'cancelled' }"></i>
                          <div class="tl-content">
                            <span class="tl-title">
                              {{ appt.status === 'cancelled' ? '已取消' : '客服已处理' }}
                              <em v-if="appt.handler" class="tl-handler">{{ appt.handler }}</em>
                            </span>
                            <span class="tl-time">{{ formatTime(appt.processTime) }}</span>
                          </div>
                        </div>
                        <div v-else class="tl-item tl-pending">
                          <i class="tl-dot tl-dot-pending"></i>
                          <div class="tl-content">
                            <span class="tl-title">等待客服处理</span>
                            <span class="tl-time">通常 1 个工作日内响应</span>
                          </div>
                        </div>
                      </div>
                      <!-- 处理说明 -->
                      <div v-if="appt.remark" class="appt-remark">
                        <span class="remark-icon">💬</span>
                        <span class="remark-text">{{ appt.remark }}</span>
                      </div>
                    </div>
                    <div v-if="appt.cancellable" class="appt-actions">
                      <el-button
                        type="danger"
                        size="small"
                        plain
                        :loading="cancellingId === appt.id"
                        @click.stop="cancelAppointment(appt)"
                      >
                        取消预约
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              <EmptyTips
                v-else
                :text="emptyAppointmentText"
                show-action
                action-text="去预约"
                @action="router.push('/#appointment')"
              />
              <!-- 分页 -->
              <div v-if="appointmentTotal > appointmentPageSize" class="appt-pager">
                <el-pagination
                  layout="prev, pager, next"
                  :total="appointmentTotal"
                  :page-size="appointmentPageSize"
                  :current-page="appointmentPage"
                  @current-change="onAppointmentPageChange"
                />
              </div>
            </template>
          </div>

          <!-- 修改密码 -->
          <div v-else-if="activeTab === 'password'" class="tab-panel">
            <h3 class="panel-title">修改密码</h3>
            <p class="panel-desc">为保障账号安全，修改密码后请牢记新密码；下次登录请使用新密码</p>
            <el-form :model="pwdForm" label-width="90px" class="pwd-form">
              <el-form-item label="原密码">
                <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" maxlength="20" />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="6-20 位字母+数字组合" maxlength="20" />
              </el-form-item>
              <el-form-item label="确认新密码">
                <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" maxlength="20" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="pwdSaving" @click="savePassword">确认修改</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 评价弹窗 -->
          <ReviewDialog
            v-model="reviewDialogVisible"
            :order-id="reviewDialogOrderId"
            @success="handleReviewSuccess"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import EmptyTips from '@/components/EmptyTips/index.vue'
import CouponCard from '@/components/CouponCard/index.vue'
import ReviewDialog from '@/components/ReviewDialog/index.vue'
import { useUserStore } from '@/stores'
import { updateProfileApi, updateAvatarApi, uploadImageApi, submitVerifyApi, changePasswordApi } from '@/api/modules/user'
import { getMyCouponsApi } from '@/api/modules/coupon'
import { getOrderListApi, getReviewableOrdersApi } from '@/api/modules/order'
import { getMyAppointmentsApi, cancelAppointmentApi } from '@/api/modules/feedback'
import { moneyUtil, validators } from '@/utils'
import { resolveAdminImage, resolveClientImage } from '@/utils/image'
import { LEVEL_RULES, getLevelRule, getNextLevelInfo } from '@/utils/memberLevel'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
// 支持 /profile?tab=verify 直接定位到指定面板（如认证拦截跳转）
const TAB_KEYS = ['info', 'orders', 'appointments', 'reviews', 'verify', 'coupons', 'password']
const activeTab = ref(TAB_KEYS.includes(route.query.tab) ? route.query.tab : 'info')

// ============ 会员等级主题（user-card 按等级区分样式）============
// 等级规则/颜色统一维护在 utils/memberLevel.js（五档含黑卡，扩展只需在表内插行）

const levelConfig = computed(() => {
  const u = userStore.user || {}
  const key = String(u.level || '').toLowerCase()
  const theme = getLevelRule(key) || LEVEL_RULES[0]
  return {
    cls: theme.key,
    name: theme.name,
    grad: theme.grad,
    gradCss: `linear-gradient(135deg, ${theme.grad[0]} 0%, ${theme.grad[1]} 100%)`
  }
})

// 距下一会员等级（双条件并列：完成租赁次数或累计消费任一达标即升级）
const nextLevelInfo = computed(() => {
  const u = userStore.user || {}
  return getNextLevelInfo(u.completedOrders ?? u.totalOrders ?? 0, u.totalSpent ?? 0)
})

// 距下一等级文案：黑卡已是最高档时展示尊享文案
const nextLevelText = computed(() => {
  const info = nextLevelInfo.value
  if (!info) return ''
  if (!info.next) return '您已是最高等级，尊享黑卡礼遇'
  const ordersPart = `再完成 ${info.ordersGap} 次租赁`
  const spentPart = `或累计消费 ￥${moneyUtil.format(info.spentGap)}`
  return `距 ${info.next.name}：${ordersPart} ${spentPart}`
})

// 等级中文名：直接取后端返回的 levelName（如「普通会员」），与后端注册时写入的口径一致
const levelName = computed(() => userStore.user?.levelName || levelConfig.value.name)

// 会员编号：由会员 id 补零生成，保持唯一展示感
const memberNo = computed(() => {
  const id = Number(userStore.user?.id) || 0
  return String(id).padStart(6, '0')
})

// 累计消费金额：千分位格式化展示
const spentText = computed(() => `￥${moneyUtil.format(userStore.user?.totalSpent ?? 0)}`)
// 金额越长字号越小（不换行，保证「累计消费」标签不被挤出），极端超长时由 ellipsis 兜底
const spentFontSize = computed(() => {
  const len = spentText.value.length
  if (len > 16) return '10px'
  if (len > 13) return '11px'
  if (len > 10) return '12px'
  return '14px'
})

// 评价弹窗
const reviewDialogVisible = ref(false)
const reviewDialogOrderId = ref(null)

function openReviewDialog(order) {
  reviewDialogOrderId.value = order.id
  reviewDialogVisible.value = true
}

// 评价成功后刷新可评价订单列表
async function handleReviewSuccess() {
  await loadReviewableOrders()
}

const form = reactive({
  avatar: userStore.user?.avatar || '',
  nickname: userStore.user?.nickname || '',
  phone: userStore.user?.phone || '',
  email: userStore.user?.email || ''
})

// ============ 我的订单（最近 3 单）============
const recentOrders = ref([])
const orderLoading = ref(false)

async function loadRecentOrders() {
  orderLoading.value = true
  try {
    // noDedup: 避免与订单列表页请求去重冲突
    const res = await getOrderListApi(
      { status: 'all', page: 1, pageSize: 3 },
      { noDedup: true }
    )
    recentOrders.value = res.list || []
  } catch (e) {
    console.error('最近订单加载失败', e)
    recentOrders.value = []
  } finally {
    orderLoading.value = false
  }
}

// ============ 去评价（待首评 + 可追评订单）============
const reviewableOrders = ref([])
const reviewLoading = ref(false)
const reviewableCount = ref(0)

async function loadReviewableOrders() {
  reviewLoading.value = true
  try {
    const res = await getReviewableOrdersApi()
    reviewableOrders.value = res || []
    reviewableCount.value = reviewableOrders.value.length
  } catch (e) {
    console.error('可评价订单加载失败', e)
    reviewableOrders.value = []
    reviewableCount.value = 0
  } finally {
    reviewLoading.value = false
  }
}

// ============ 实名认证 / 驾驶证 ============
// 认证状态机：unverified 未认证 / pending 审核中 / verified 已认证 / rejected 已驳回
const verifyStatus = computed(() => userStore.user?.verifyStatus || 'unverified')
const verifyEditable = computed(() => ['unverified', 'rejected'].includes(verifyStatus.value))
const verifyStatusText = computed(() => {
  const map = {
    unverified: '未认证，完成认证后可享受更快捷的租车服务',
    pending: '认证资料审核中，请耐心等待',
    verified: '已认证通过',
    rejected: '认证被驳回，请修改后重新提交'
  }
  return map[verifyStatus.value] || map.unverified
})

// 只读展示的认证资料（与后端 MemberVO 字段对齐）
const readonlyVerify = computed(() => {
  const u = userStore.user || {}
  return {
    realName: u.realName || '—',
    genderText: u.gender === 1 ? '男' : u.gender === 2 ? '女' : '—',
    birthday: u.birthday || '—',
    idCard: u.idCard || '—',
    driverLicenseNo: u.driverLicenseNo || '—',
    driverLicenseType: u.driverLicenseType || '',
    driverLicenseExpireDate: u.driverLicenseExpireDate || '',
    submitTime: u.verifySubmitTime ? String(u.verifySubmitTime).replace('T', ' ').slice(0, 19) : '—'
  }
})

// 已提交资料是否完整（决定只读态是否展示资料区）
const hasSubmittedVerifyData = computed(() => {
  const u = userStore.user || {}
  return !!(u.realName || u.idCard || u.idCardFrontImg)
})

// 只读态证件图片列表
const verifyImageList = computed(() => {
  const u = userStore.user || {}
  return [
    { key: 'idCardFront', label: '身份证正面（人像面）', url: u.idCardFrontImg || '' },
    { key: 'idCardBack', label: '身份证背面（国徽面）', url: u.idCardBackImg || '' },
    { key: 'driverLicenseFront', label: '驾驶证正面（主页）', url: u.driverLicenseFrontImg || '' },
    { key: 'driverLicenseBack', label: '驾驶证背面（副页）', url: u.driverLicenseBackImg || '' }
  ].filter(img => img.url)
})

const verifyForm = reactive({
  realName: '',
  gender: 0,
  birthday: '',
  idCard: '',
  idCardFrontImg: '',
  idCardBackImg: '',
  driverLicenseNo: '',
  driverLicenseType: '',
  driverLicenseFrontImg: '',
  driverLicenseBackImg: '',
  driverLicenseExpireDate: ''
})
const verifySaving = ref(false)

// 从 userStore 同步实名认证字段到表单
function syncVerifyFormFromUser() {
  const u = userStore.user || {}
  verifyForm.realName = u.realName || ''
  verifyForm.gender = u.gender ?? 0
  verifyForm.birthday = u.birthday || ''
  verifyForm.idCard = u.idCard || ''
  verifyForm.idCardFrontImg = u.idCardFrontImg || ''
  verifyForm.idCardBackImg = u.idCardBackImg || ''
  verifyForm.driverLicenseNo = u.driverLicenseNo || ''
  verifyForm.driverLicenseType = u.driverLicenseType || ''
  verifyForm.driverLicenseFrontImg = u.driverLicenseFrontImg || ''
  verifyForm.driverLicenseBackImg = u.driverLicenseBackImg || ''
  verifyForm.driverLicenseExpireDate = u.driverLicenseExpireDate || ''
}

// 禁用未来日期（出生日期不能晚于今天）
function disableFutureDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}
// 禁用过去日期（驾驶证过期日期应晚于今天）
function disablePastDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

// 图片上传前校验：仅图片，5MB 以内
function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.warning('只能上传图片格式文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.warning('图片大小不能超过 5MB')
    return false
  }
  return true
}

// 实名认证图片上传：调通用上传接口拿 URL，回填到表单对应字段
async function handleVerifyUpload({ file }, field) {
  try {
    const res = await uploadImageApi(file)
    verifyForm[field] = res.url
    ElMessage.success('图片上传成功')
  } catch (e) {
    console.error('图片上传失败', e)
    ElMessage.error('图片上传失败')
  }
}

// 身份证号格式校验（18 位，末位可为 X）
function isValidIdCard(id) {
  return /^\d{17}[\dXx]$/.test(id)
}

async function saveVerify() {
  // 必填校验：姓名/身份证号/驾驶证号 + 4 张证件照片
  if (!verifyForm.realName.trim()) {
    ElMessage.warning('请填写真实姓名')
    return
  }
  if (!isValidIdCard(verifyForm.idCard.trim())) {
    ElMessage.warning('请填写正确的 18 位身份证号')
    return
  }
  if (!verifyForm.driverLicenseNo.trim()) {
    ElMessage.warning('请填写驾驶证号')
    return
  }
  if (!verifyForm.idCardFrontImg || !verifyForm.idCardBackImg) {
    ElMessage.warning('请上传身份证正反面照片')
    return
  }
  if (!verifyForm.driverLicenseFrontImg || !verifyForm.driverLicenseBackImg) {
    ElMessage.warning('请上传驾驶证正副页照片')
    return
  }
  verifySaving.value = true
  try {
    await submitVerifyApi({
      realName: verifyForm.realName.trim(),
      gender: verifyForm.gender || undefined,
      birthDate: verifyForm.birthday || undefined,
      idCard: verifyForm.idCard.trim(),
      driverLicenseNo: verifyForm.driverLicenseNo.trim(),
      driverLicenseType: verifyForm.driverLicenseType || undefined,
      driverLicenseExpireDate: verifyForm.driverLicenseExpireDate || undefined,
      idCardFrontImg: verifyForm.idCardFrontImg,
      idCardBackImg: verifyForm.idCardBackImg,
      driverLicenseFrontImg: verifyForm.driverLicenseFrontImg,
      driverLicenseBackImg: verifyForm.driverLicenseBackImg
    })
    await userStore.fetchUserInfo()
    ElMessage.success('认证资料已提交，等待人工审核')
  } catch (e) {
    // 具体错误信息已由请求层统一弹出，这里只记录日志
    console.error('提交认证失败', e)
  } finally {
    verifySaving.value = false
  }
}

// ============ 我的优惠券（v2：状态分组）============
// v2 状态：unused 未使用 / locked 已锁定 / used 已使用 / expired 已过期
const couponTabs = [
  { value: 'unused', label: '未使用' },
  { value: 'locked', label: '已锁定' },
  { value: 'used', label: '已使用' },
  { value: 'expired', label: '已过期' }
]
const couponCountMap = ref({})
const couponStatus = ref('unused')
const coupons = ref([])
const couponLoading = ref(false)

const emptyCouponText = computed(() => {
  const map = {
    unused: '暂无可用优惠券',
    locked: '暂无锁定中的优惠券',
    used: '暂无已使用的优惠券',
    expired: '暂无已过期的优惠券'
  }
  return map[couponStatus.value] || '暂无优惠券'
})

async function switchCouponTab(status) {
  if (couponStatus.value === status) return
  couponStatus.value = status
  await loadCoupons(status)
}

async function loadCoupons(status) {
  couponLoading.value = true
  try {
    const list = (await getMyCouponsApi()) || []
    const countMap = { unused: 0, locked: 0, used: 0, expired: 0 }
    list.forEach(c => {
      const s = c.status || 'unused'
      if (countMap[s] != null) countMap[s]++
    })
    couponCountMap.value = countMap
    coupons.value = status ? list.filter(c => c.status === status) : list
  } catch (e) {
    console.error('优惠券加载失败', e)
    coupons.value = []
  } finally {
    couponLoading.value = false
  }
}

function goUseCoupon() {
  router.push('/vehicles')
}

// ============ 我的预约 ============
// 状态机（与后台管理系统对齐）：pending 待处理 / handled 已处理 / cancelled 已取消
const appointmentTabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'handled', label: '已处理' },
  { value: 'cancelled', label: '已取消' }
]
const appointmentStatus = ref('all')
const appointments = ref([])
const appointmentTotal = ref(0)
// 全部预约总数（不随状态筛选变化，用于标题计数）
const appointmentAllTotal = ref(0)
const appointmentPage = ref(1)
const appointmentPageSize = 10
const appointmentLoading = ref(false)
const cancellingId = ref(null)

// 留言超长折叠：超过阈值时收起为 2 行，点击"展开/收起"切换
const APPT_CONTENT_CLAMP_LEN = 60
const expandedAppts = ref(new Set())
function isLongContent(appt) {
  return (appt.content?.length || 0) > APPT_CONTENT_CLAMP_LEN
}
function toggleApptContent(id) {
  const next = new Set(expandedAppts.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedAppts.value = next
}

const emptyAppointmentText = computed(() => {
  const map = {
    all: '暂无预约记录',
    pending: '暂无待处理的预约',
    handled: '暂无已处理的预约',
    cancelled: '暂无已取消的预约'
  }
  return map[appointmentStatus.value] || '暂无预约记录'
})

async function loadAppointments() {
  appointmentLoading.value = true
  try {
    const params = { page: appointmentPage.value, pageSize: appointmentPageSize }
    if (appointmentStatus.value !== 'all') params.status = appointmentStatus.value
    // 列表请求与"全部总数"请求并行；总数不带 status，保证标题计数始终为全部预约数量
    const [res, allRes] = await Promise.all([
      getMyAppointmentsApi(params),
      getMyAppointmentsApi({ page: 1, pageSize: 1 })
    ])
    appointments.value = res.list || []
    appointmentTotal.value = res.total || 0
    appointmentAllTotal.value = allRes.total || 0
  } catch (e) {
    console.error('预约记录加载失败', e)
    appointments.value = []
    appointmentTotal.value = 0
    appointmentAllTotal.value = 0
  } finally {
    appointmentLoading.value = false
  }
}

// el-tabs 切换：v-model 已更新为最新状态，仅需重置页码并重新加载
function onAppointmentTabChange() {
  appointmentPage.value = 1
  loadAppointments()
}

function onAppointmentPageChange(page) {
  appointmentPage.value = page
  loadAppointments()
}

async function cancelAppointment(appt) {
  try {
    await ElMessageBox.confirm(
      `确定要取消该预约吗？${appt.rentDate ? `原定取车日期 ${appt.rentDate}。` : ''}取消后不可恢复。`,
      '取消预约',
      { confirmButtonText: '确定取消', cancelButtonText: '再想想', type: 'warning' }
    )
  } catch {
    return // 用户放弃
  }
  cancellingId.value = appt.id
  try {
    await cancelAppointmentApi(appt.id)
    ElMessage.success('预约已取消')
    await loadAppointments()
  } catch (e) {
    console.error('取消预约失败', e)
  } finally {
    cancellingId.value = null
  }
}

// 后端时间格式（yyyy-MM-dd HH:mm:ss 或 ISO）→ 展示格式
function formatTime(t) {
  if (!t) return '—'
  return String(t).replace('T', ' ').slice(0, 16)
}

// ============ 修改密码 ============
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdSaving = ref(false)

async function savePassword() {
  if (!pwdForm.oldPassword) return ElMessage.warning('请输入原密码')
  if (!validators.isPassword(pwdForm.newPassword)) return ElMessage.warning('新密码需 6-20 位字母+数字组合')
  if (pwdForm.newPassword !== pwdForm.confirmPassword) return ElMessage.warning('两次输入的新密码不一致')
  if (pwdForm.newPassword === pwdForm.oldPassword) return ElMessage.warning('新密码不能与原密码相同')
  pwdSaving.value = true
  try {
    await changePasswordApi({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    ElMessage.success('密码修改成功，下次登录请使用新密码')
    pwdForm.oldPassword = pwdForm.newPassword = pwdForm.confirmPassword = ''
  } catch (e) {
    console.error('密码修改失败', e)
  } finally {
    pwdSaving.value = false
  }
}

watch(() => userStore.user, (val) => {
  if (val) {
    form.avatar = val.avatar || ''
    form.nickname = val.nickname || ''
    form.phone = val.phone || ''
    form.email = val.email || ''
    syncVerifyFormFromUser()
  }
}, { immediate: true })

watch(activeTab, async (tab) => {
  if (tab === 'orders' && !recentOrders.value.length) {
    await loadRecentOrders()
  }
  if (tab === 'appointments') {
    // 每次进入都拉最新（后台可能已处理预约）
    await loadAppointments()
  }
  if (tab === 'reviews') {
    await loadReviewableOrders()
  }
  if (tab === 'verify') {
    // 每次进入都拉取最新用户信息（同步后台审核结果），再同步表单
    try {
      await userStore.fetchUserInfo()
    } catch (e) {
      console.error('刷新认证状态失败', e)
    }
    syncVerifyFormFromUser()
  }
  if (tab === 'coupons' && !coupons.value.length) {
    await loadCoupons(couponStatus.value)
  }
})

async function saveProfile() {
  try {
    await updateProfileApi(form)
    userStore.updateUserInfo(form)
    ElMessage.success('资料保存成功')
  } catch (e) {
    console.error('保存资料失败', e)
    ElMessage.error('保存失败，请重试')
  }
}

// 头像上传前校验
function beforeAvatarUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.warning('上传图片只能是图片格式！')
    return false
  }
  if (!isLt2M) {
    ElMessage.warning('上传图片大小不能超过 2MB！')
    return false
  }
  return true
}

// 自定义头像上传：调后端接口，文件存储到服务器并同步更新 member.avatar
async function handleAvatarUpload({ file }) {
  try {
    await updateAvatarApi(file)
    await userStore.fetchUserInfo()
    form.avatar = userStore.user?.avatar || ''
    ElMessage.success('头像更新成功')
  } catch (e) {
    console.error('头像上传失败', e)
    ElMessage.error('头像上传失败')
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchUserInfo()
    // 预加载可评价订单数量（用于侧边栏徽标显示）
    loadReviewableOrders()
  }
})
</script>

<style lang="scss" scoped>
.profile-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: $space-xl;
  @include respond-to('md') { grid-template-columns: 1fr; }
}

.user-card {
  position: relative;
  overflow: hidden;
  margin-bottom: $space-base;
  padding: $space-base;
  color: #fff;
  border-radius: $radius-md;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  // 不同等级通过渐变背景区分（由 JS levelConfig 注入），此处仅提供基调
  background: linear-gradient(135deg, #4b5563, #111827);

  // 旋转轨道圆环装饰
  .card-orbit {
    position: absolute;
    right: -46px;
    top: -46px;
    width: 150px;
    height: 150px;
    border-radius: $radius-full;
    border: 14px solid rgba(255, 255, 255, 0.12);
    pointer-events: none;
  }

  // 斜切高光扫过效果
  .card-shine {
    position: absolute;
    top: -60px;
    left: -80px;
    width: 60%;
    height: 220%;
    transform: rotate(25deg);
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent);
    pointer-events: none;
    transition: left $transition-base;
  }
  &:hover .card-shine { left: 130%; }

  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    .card-edition {
      display: flex;
      flex-direction: column;
      gap: $space-xs;
      .card-brand {
        font-size: $font-size-xs;
        letter-spacing: 3px;
        opacity: 0.85;
      }
      .card-tag {
        display: inline-block;
        align-self: flex-start;
        font-size: 10px;
        font-weight: $font-weight-medium;
        letter-spacing: 1px;
        padding: 2px 8px;
        border-radius: $radius-full;
        background: rgba(255, 255, 255, 0.22);
      }
    }
    .card-avatar {
      border: 2px solid rgba(255, 255, 255, 0.55);
      flex-shrink: 0;
    }
  }

  .card-main {
    margin-top: $space-base;
    .user-name {
      font-size: $font-size-md;
      font-weight: $font-weight-medium;
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // 底部统计（竖向排列）
  .card-stats {
    list-style: none;
    margin: $space-base 0 0;
    padding: $space-xs $space-base;
    background: rgba(255, 255, 255, 0.1);
    border-radius: $radius-md;
    .stat {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      &:not(:last-child) { border-bottom: 1px dashed rgba(255, 255, 255, 0.22); }
      // 标签固定不收缩，保证「信用积分 / 租车订单 / 累计消费」完整展示
      span {
        flex-shrink: 0;
        font-size: $font-size-xs;
        color: rgba(255, 255, 255, 0.78);
      }
      // 数值占满剩余空间：右对齐、不换行，超长时字号缩小（JS 动态控制），极端情况省略号兜底
      b {
        flex: 1;
        min-width: 0;
        margin-left: $space-xxs;
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: $font-size-base;
        font-weight: $font-weight-medium;
        color: #fff;
      }
    }
  }

  // 距下一等级提示：半透明胶囊，浮于卡片渐变上仍清晰可读
  .card-next {
    margin-top: $space-sm;
    padding: 6px 12px;
    border-radius: $radius-full;
    background: rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;

    .next-text {
      font-size: 11px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.02em;
    }
  }

  .card-note {
    margin-top: $space-sm;
    font-size: 10px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.62);
  }

  .card-no {
    margin-top: $space-base;
    font-size: 10px;
    letter-spacing: 1px;
    text-align: right;
    opacity: 0.7;
  }

  // 不同等级仅微调标签底色，主视觉差异来自渐变背景
  &.level-silver .card-tag { background: rgba(100, 116, 139, 0.8); }
  &.level-gold .card-tag { background: rgba(146, 64, 14, 0.85); }
  &.level-diamond .card-tag { background: rgba(30, 27, 75, 0.9); }
}

.profile-sidebar {
  // 粘性固定：右侧内容长滚动时，左侧菜单始终可见，用户随时可切换 tab
  // 关键：grid 子项默认 align-items: stretch 会拉满高度导致 sticky 失效，必须 align-self: start
  position: sticky;
  top: $header-height + $space-base; // 顶部固定 header 下方留 16px 呼吸空间
  align-self: start;
  // 防御性：菜单项未来增多时，左侧栏自身也可滚动，不会撑出视口
  max-height: calc(100vh - #{$header-height} - #{$space-md});
  overflow-y: auto;
  // 移动端单列布局：取消 sticky，避免侧边栏占位挡住下方内容
  @include respond-to('md') {
    position: static;
    max-height: none;
    overflow: visible;
  }
  :deep(.el-menu) {
    background: transparent;
    border-right: none;
  }
  :deep(.el-menu-item) {
    color: $color-text-secondary;
    &:hover {
      color: var(--lux-primary-text);
      background: transparent;
    }
    &.is-active {
      color: var(--lux-primary-text);
      background: transparent;
    }
  }
}

.panel-title {
  display: flex;
  align-items: center;
  gap: $space-xxs;
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  margin-bottom: $space-base;
  color: $color-text;
}

.panel-desc {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.6;
  margin-bottom: $space-lg;
  padding: $space-sm $space-base;
  background: $color-bg-gray;
  border-left: 2px solid var(--lux-primary-text);
}

.profile-form { max-width: 480px; }

// 头像区域：头像 + 说明文字横向排列
.avatar-section {
  display: flex;
  align-items: center;
  gap: $space-lg;
  padding: $space-base 0 $space-xl;
  margin-bottom: $space-base;
  border-bottom: 1px solid var(--lux-border);
}
.avatar-uploader {
  :deep(.el-upload) { display: block; }
}
.avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: $radius-full;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  :deep(.el-avatar) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: $font-size-xs;
  opacity: 0;
  transition: opacity $transition-fast;
  .el-icon { line-height: 1; }
}
.avatar-wrap:hover .avatar-mask { opacity: 1; }
.avatar-meta {
  .avatar-name {
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    color: var(--lux-text);
    margin-bottom: $space-xs;
  }
  .avatar-hint {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
    line-height: 1.6;
  }
}

// ---------- 我的订单（最近 3 单） ----------
.order-list { display: flex; flex-direction: column; gap: $space-base; }
.order-card {
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-radius: $radius-none;
  padding: $space-base $space-md;
  cursor: pointer;
  transition: transform $transition-base;
  &:hover { transform: translateY(-2px); }
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $space-base;
  border-bottom: 1px solid $color-divider;
  margin-bottom: $space-base;
  .order-no { font-size: $font-size-sm; color: $color-text-secondary; }
  .order-status {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    &.pending { color: $color-warning; }
    &.renting { color: var(--lux-primary-text); }
    &.completed { color: $color-success; }
    &.cancelled { color: $color-text-tertiary; }
  }
  .review-tag {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    padding: 2px 8px;
    border-radius: $radius-none;
    &.unreviewed { background: rgba(218, 41, 28, 0.12); color: var(--lux-primary-text); }
    &.reviewed { background: rgba(76, 152, 185, 0.15); color: $color-info; }
  }
}

// 侧边栏菜单项右侧计数胶囊（行内元素，垂直居中）
.menu-count-badge {
  margin-left: auto;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  line-height: 1;
  color: #fff;
  background: var(--lux-primary-text);
  border-radius: $radius-full;
}

// 面板标题计数：中性色，跟随主题，与标题垂直居中
.panel-title-count {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  line-height: 1;
  color: var(--lux-text-secondary);
  background: var(--lux-bg-gray);
  padding: 4px 8px;
  border-radius: $radius-full;
}

// 可评价订单卡片
.reviewable-card .review-btn {
  margin-top: $space-xs;
}
.order-body {
  display: flex;
  gap: $space-base;
  align-items: center;
  .order-img { width: 100px; height: 70px; border-radius: $radius-none; object-fit: cover; }
  .order-info {
    flex: 1;
    h4 { font-size: $font-size-base; font-weight: $font-weight-medium; margin-bottom: $space-xs; }
    p { font-size: $font-size-sm; color: $color-text-secondary; }
    .order-store { font-size: $font-size-xs; color: $color-text-tertiary; }
  }
  .order-amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    .amount { font-size: $font-size-lg; font-weight: $font-weight-medium; color: var(--lux-primary-text); }
  }
}
.view-all-bar {
  display: flex;
  justify-content: center;
  margin-top: $space-lg;
}

// ---------- 实名认证 / 驾驶证 ----------
// 认证须知：着重提醒（醒目警示横幅）
.verify-notice {
  display: flex;
  align-items: flex-start;
  gap: $space-sm;
  padding: $space-base $space-md;
  margin-bottom: $space-base;
  background: rgba(230, 162, 60, 0.1);
  border: 1px solid rgba(230, 162, 60, 0.45);
  border-left: 4px solid $color-warning;
  border-radius: $radius-none;
  .verify-notice-icon {
    flex-shrink: 0;
    color: $color-warning;
    margin-top: 2px;
  }
  .verify-notice-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.6;
    b {
      font-size: $font-size-base;
      font-weight: 600;
      color: #b45309;
    }
    span {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }
  }
}

// 状态横幅：四种认证状态通过左侧色条 + 背景色区分
.verify-status-bar {
  display: flex;
  align-items: center;
  gap: $space-xs;
  padding: $space-sm $space-base;
  margin-bottom: $space-base;
  font-size: $font-size-sm;
  border-radius: $radius-none;
  border-left: 3px solid transparent;

  &.st-verified {
    color: $color-success;
    background: rgba(103, 194, 58, 0.08);
    border-left-color: $color-success;
  }
  &.st-pending {
    color: $color-warning;
    background: rgba(230, 162, 60, 0.1);
    border-left-color: $color-warning;
  }
  &.st-rejected {
    color: var(--lux-primary-text);
    background: rgba(218, 41, 28, 0.06);
    border-left-color: var(--lux-primary-text);
  }
  &.st-unverified {
    color: $color-text-secondary;
    background: $color-bg-gray;
    border-left-color: $color-text-tertiary;
  }
}

.reject-alert {
  margin-bottom: $space-base;
}

// 只读资料区
.verify-readonly {
  max-width: 640px;
  margin-bottom: $space-base;
}
.verify-desc {
  margin-bottom: $space-base;
  @include respond-to('sm') {
    :deep(.el-descriptions__body .el-descriptions__table) { table-layout: fixed; }
  }
}
.readonly-row {
  margin-bottom: 0;
}
.readonly-box {
  cursor: zoom-in;
}
.verify-pending-tip {
  margin-top: $space-base;
  padding: $space-sm $space-base;
  font-size: $font-size-xs;
  line-height: 1.6;
  color: $color-text-secondary;
  background: $color-bg-gray;
  border-left: 2px solid $color-warning;
}

.verify-submit-hint {
  margin-left: $space-sm;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.verify-form { max-width: 640px; }
.form-section-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $color-text;
  margin: $space-base 0 $space-sm;
  padding-left: $space-xs;
  border-left: 3px solid var(--lux-primary-text);
}
.upload-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-base;
  margin-bottom: $space-base;
  @include respond-to('sm') { grid-template-columns: 1fr; }
}
.upload-item {
  text-align: center;
}
.verify-uploader {
  :deep(.el-upload) { display: block; width: 100%; }
}
.upload-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px dashed $color-border;
  border-radius: $radius-none;
  background: $color-bg-gray;
  overflow: hidden;
  cursor: pointer;
  transition: border-color $transition-fast;
  &:hover { border-color: var(--lux-primary-text); }
}
.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
// 已上传图片的悬停遮罩：提示可点击更换（与头像更换遮罩同风格）
.upload-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: $font-size-xs;
  opacity: 0;
  transition: opacity $transition-fast;
  pointer-events: none;
  .el-icon { line-height: 1; }
}
.upload-box:hover .upload-mask { opacity: 1; }
.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-xs;
  color: $color-text-tertiary;
  font-size: $font-size-xs;
  .el-icon { color: $color-text-secondary; }
  .ph-hint {
    font-size: 10px;
    color: $color-text-tertiary;
  }
}
.readonly-img-tip {
  margin-top: $space-xs;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  text-align: center;
}
.upload-label {
  margin-top: $space-xs;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.coupon-list { display: flex; flex-direction: column; gap: $space-base; }

// 状态分组 tabs
.coupon-tabs {
  display: flex;
  gap: $space-xs;
  margin-bottom: $space-lg;
  border-bottom: 1px solid $color-divider;
  flex-wrap: wrap;
}
.coupon-tab {
  position: relative;
  padding: $space-sm $space-md;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  display: flex;
  align-items: center;
  gap: $space-xs;
  transition: color $transition-fast;
  &:hover { color: $color-text; }
  &.active {
    color: var(--lux-primary-text);
    &::after {
      content: '';
      position: absolute;
      left: $space-md;
      right: $space-md;
      bottom: -1px;
      height: 2px;
      background: var(--lux-primary-text);
    }
  }
  .count {
    font-size: $font-size-xs;
    padding: 1px 8px;
    background: $color-bg-gray-dark;
    color: $color-text-tertiary;
    border-radius: $radius-full;
    min-width: 20px;
    text-align: center;
  }
  &.active .count {
    background: rgba(218, 41, 28, 0.12);
    color: var(--lux-primary-text);
  }
}

// ---------- 我的预约 ----------
.appt-list { display: flex; flex-direction: column; gap: 12px; }

// 我的预约状态筛选 el-tabs：紧凑化，贴合面板内容区
.appt-tabs {
  margin-bottom: 0;
  :deep(.el-tabs__header) {
    margin: 0 0 $space-base;
  }
  :deep(.el-tabs__item) {
    // padding: 0 $space-md;
    height: 40px;
    line-height: 40px;
    font-size: $font-size-sm;
  }
}
.appt-card {
  position: relative;
  background: $color-bg-gray;
  border: 1px solid $color-border;
  border-left: 4px solid $color-text-tertiary;
  border-radius: 10px;
  padding: 12px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow $transition-base, transform $transition-base;
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
  // 状态色条
  &.appt-pending { border-left-color: $color-warning; }
  &.appt-handled { border-left-color: $color-success; }
  &.appt-cancelled { border-left-color: $color-text-tertiary; opacity: 0.75; }
}
.appt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid $color-divider;
  margin-bottom: 12px;
  .appt-no {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
    letter-spacing: 1px;
    font-family: monospace;
  }
  .appt-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    padding: 3px 12px;
    border-radius: $radius-full;
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    // 暗色为默认主题（:root），文字提亮保证对比度；亮色在下方 html.light 覆盖
    &.st-pending { color: #e8a33d; background: rgba(230, 162, 60, 0.14); }
    &.st-handled { color: #5ad17c; background: rgba(103, 194, 58, 0.14); }
    &.st-cancelled { color: $color-text-tertiary; background: $color-bg-gray-dark; }
  }
}
// 亮色主题：状态徽章用深字浅底
html.light .appt-status {
  &.st-pending { color: #b45309; }
  &.st-handled { color: #15803d; }
}
.appt-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.appt-main { flex: 1; min-width: 0; }
// 车型行：图标 + 车型名 + 取车日期胶囊
.appt-car-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  .appt-car-icon { font-size: 16px; }
  .appt-car {
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    color: var(--lux-text);
  }
  .appt-date-chip {
    display: inline-flex;
    align-items: center;
    font-size: $font-size-xs;
    color: #7ab5ff;
    background: rgba(64, 158, 255, 0.1);
    padding: 2px 10px;
    border-radius: $radius-full;
  }
}
// 亮色主题：取车日期胶囊用深蓝
html.light .appt-date-chip { color: #1e50a2; }
.appt-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}
.appt-row {
  display: flex;
  font-size: $font-size-sm;
  color: $color-text;
  .appt-label {
    flex-shrink: 0;
    width: 48px;
    color: $color-text-tertiary;
    font-size: $font-size-xs;
  }
  span:last-child { word-break: break-all; }
}
// 留言行：内容超长折叠为 2 行，可展开/收起
.appt-content-row { align-items: flex-start; }
.appt-content {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  line-height: 1.6;
  &.is-clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}
.appt-content-toggle {
  flex-shrink: 0;
  margin-left: $space-xxs;
  font-size: $font-size-xs;
  color: var(--lux-primary-text);
  cursor: pointer;
  user-select: none;
  &:hover { opacity: 0.8; }
}
// 处理进度时间线
.appt-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0 10px 4px;
  margin-bottom: 8px;
  // 竖向连接线
  &::before {
    content: '';
    position: absolute;
    left: 9px;
    top: 18px;
    bottom: 18px;
    width: 1px;
    background: $color-divider;
  }
}
.tl-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.tl-dot {
  position: relative;
  z-index: 1;
  width: 11px;
  height: 11px;
  margin-top: 4px;
  border-radius: 50%;
  background: $color-success;
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.2);
  &.tl-dot-done { background: $color-success; }
  &.tl-dot-cancel { background: $color-text-tertiary; box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06); }
  &.tl-dot-pending {
    background: #fff;
    border: 2px solid $color-warning;
    box-shadow: none;
    animation: tl-pulse 2s ease infinite;
  }
}
@keyframes tl-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.35); }
  50% { box-shadow: 0 0 0 5px rgba(230, 162, 60, 0.12); }
}
.tl-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .tl-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text;
    .tl-handler {
      margin-left: 6px;
      font-size: $font-size-xs;
      font-style: normal;
      font-weight: normal;
      // 暗色默认提亮；亮色用主题 info 色
      color: #7cc0de;
      background: rgba(76, 152, 185, 0.12);
      padding: 1px 8px;
      border-radius: $radius-full;
      html.light & { color: $color-info; }
    }
  }
  .tl-time {
    font-size: $font-size-xs;
    color: $color-text-tertiary;
  }
}
.tl-pending .tl-title { color: $color-text-secondary; }
// 处理说明气泡
.appt-remark {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(103, 194, 58, 0.06);
  border: 1px solid rgba(103, 194, 58, 0.25);
  border-radius: 8px;
  .remark-icon { font-size: 14px; line-height: 1.4; }
  .remark-text {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.6;
    word-break: break-all;
  }
}
.appt-cancelled .appt-remark {
  background: $color-bg-gray;
  border-color: $color-divider;
}
.appt-actions {
  flex-shrink: 0;
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.appt-pager {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
.pwd-form { max-width: 480px; }
</style>
