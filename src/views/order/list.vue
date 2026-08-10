<template>
  <div class="order-list-page section">
    <div class="container">
      <h2 class="section-title">我的订单</h2>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待支付" name="pending" />
        <el-tab-pane label="租赁中" name="renting" />
        <el-tab-pane label="已完成" name="completed" />
        <el-tab-pane label="已取消" name="cancelled" />
      </el-tabs>

      <PageSkeleton v-if="loading" :count="3" />
      <template v-else>
        <div v-if="list.length" class="order-list">
          <div v-for="order in list" :key="order.id" class="order-card fade-in-up" @click="$router.push(`/orders/${order.id}`)">
            <div class="order-header">
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-status" :class="order.status">{{ order.statusName }}</span>
            </div>
            <div class="order-body">
              <img :src="order.carCover" :alt="order.carName" class="order-img" />
              <div class="order-info">
                <h3>{{ order.carName }}</h3>
                <p>{{ order.startDate }} 至 {{ order.endDate }}（{{ order.days }}天）</p>
                <p class="order-store">{{ order.store }}</p>
              </div>
              <div class="order-amount">
                <span class="amount">￥{{ moneyUtil.format(order.totalAmount) }}</span>
                <el-button
                  v-if="order.status === 'pending'"
                  type="danger"
                  size="small"
                  class="cancel-btn"
                  @click.stop="handleCancel(order)"
                >取消订单</el-button>
              </div>
            </div>
          </div>
        </div>
        <EmptyTips v-else text="暂无订单" show-action action-text="去租车" @action="$router.push('/vehicles')" />
        <div v-if="total > pageSize" class="pagination-wrap">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="loadList"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSkeleton from '@/components/PageSkeleton/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { getOrderListApi, cancelOrderApi } from '@/api/modules/order'
import { moneyUtil } from '@/utils'

const { observe } = useScrollReveal()

const loading = ref(false)
const list = ref([])
const activeTab = ref('all')
const total = ref(0)
const page = ref(1)
const pageSize = 10

async function loadList() {
  loading.value = true
  try {
    // noDedup: 禁用 GET 去重，避免 tab 切换时请求被误取消
    const res = await getOrderListApi(
      { status: activeTab.value, page: page.value, pageSize },
      { noDedup: true }
    )
    // request.js 响应拦截器已解包 res.data，res 即 PageResult {list,total,page,pageSize}
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) {
    console.error('订单列表加载失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
    // 数据刷新后重新观察新增的 fade-in-up 元素，修复 tab 切换后元素占位但不可见的问题
    nextTick(() => observe())
  }
}

// @tab-change 在 v-model 更新后触发，此时 activeTab 已是新值
function onTabChange() {
  page.value = 1
  loadList()
}

// 取消订单：先确认再调接口刷新列表
async function handleCancel(order) {
  try {
    await ElMessageBox.confirm('确定取消该订单吗？', '取消订单', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await cancelOrderApi(order.id)
    ElMessage.success('订单已取消')
    await loadList()
  } catch (e) {
    console.error('取消订单失败', e)
  }
}

onMounted(loadList)
</script>

<style lang="scss" scoped>
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
}

.order-body {
  display: flex;
  gap: $space-base;
  align-items: center;
  .order-img { width: 100px; height: 70px; border-radius: $radius-none; object-fit: cover; }
  .order-info { flex: 1; h3 { font-size: $font-size-base; font-weight: $font-weight-medium; margin-bottom: $space-xs; } p { font-size: $font-size-sm; color: $color-text-secondary; } }
  .order-amount .amount { font-size: $font-size-lg; font-weight: $font-weight-medium; color: var(--lux-primary-text); }
  .order-amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $space-xs;
  }
  .cancel-btn { margin-left: 0; }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: $space-xl;
}
</style>
