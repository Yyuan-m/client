// 购物车状态：登录时同步数据库，未登录时用 localStorage
// 价格计算统一走后端 /api/price/cart 接口（确保选车→购物车→结算→下单全流程价格一致）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { auth } from '@/utils/auth'
import {
  getCartListApi,
  addCartApi,
  updateCartApi,
  removeCartApi,
  clearCartApi
} from '@/api/modules/cart'
import { calcCartPriceApi } from '@/api/modules/price'

export const useCartStore = defineStore(
  'cart',
  () => {
    // 购物车项：{ id?, carId, carName, cover, dailyPrice, tags, startDate, endDate, days }
    const items = ref([])
    // 选中的车辆ID集合（用于结算时勾选）
    const selectedIds = ref([])

    // 价格明细列表（来自后端 PriceService，结构对齐 PriceDetailVO）
    // 仅包含 selectedItems 对应的明细，顺序与 selectedItems 一致
    const priceDetails = ref([])
    // 价格加载中标记（结算页禁用提交按钮防抖）
    const priceLoading = ref(false)

    const totalCount = computed(() => items.value.length)
    // 选中的商品项
    const selectedItems = computed(() =>
      items.value.filter((i) => selectedIds.value.includes(i.carId))
    )
    const selectedCount = computed(() => selectedItems.value.length)
    const isAllSelected = computed(
      () => items.value.length > 0 && selectedIds.value.length === items.value.length
    )

    // ---------- 金额计算（基于后端返回的 priceDetails） ----------
    // 租金合计 = Σ priceDetails.rentAmount
    const totalAmount = computed(() =>
      priceDetails.value.reduce((sum, p) => sum + Number(p.rentAmount || 0), 0)
    )
    // 应付合计（未扣优惠券）= Σ priceDetails.totalAmount
    const grandTotal = computed(() =>
      priceDetails.value.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)
    )

    // ---------- 勾选操作 ----------
    function toggleSelect(carId) {
      const idx = selectedIds.value.indexOf(carId)
      if (idx > -1) {
        selectedIds.value.splice(idx, 1)
      } else {
        selectedIds.value.push(carId)
      }
    }
    function toggleSelectAll() {
      if (isAllSelected.value) {
        selectedIds.value = []
      } else {
        selectedIds.value = items.value.map((i) => i.carId)
      }
    }
    function isSelected(carId) {
      return selectedIds.value.includes(carId)
    }

    // ---------- 后端 Cart → 前端 item 映射 ----------
    function mapFromApi(cart) {
      return {
        id: cart.id,
        carId: cart.carId,
        carName: cart.carName,
        cover: cart.carCover,
        dailyPrice: Number(cart.dailyPrice),
        tags: cart.tagList || [],
        startDate: cart.startDate,
        endDate: cart.endDate,
        days: cart.days
      }
    }

    // ---------- 价格刷新（核心：从后端 PriceService 获取） ----------
    // 调用时机：购物车初始化后 / 选中项变化 / 租期变化
    async function refreshPrices() {
      const selected = selectedItems.value
      if (!selected.length) {
        priceDetails.value = []
        return
      }
      const reqItems = selected.map((i) => ({
        carId: i.carId,
        startDate: i.startDate,
        endDate: i.endDate
      }))
      priceLoading.value = true
      try {
        const list = await calcCartPriceApi(reqItems)
        priceDetails.value = list || []
      } catch (e) {
        console.error('价格计算失败', e)
        // 失败时清空明细，避免展示与后端不一致的旧价格
        priceDetails.value = []
      } finally {
        priceLoading.value = false
      }
    }

    // ---------- 初始化购物车 ----------
    async function initCart() {
      if (!auth.isLoggedIn()) return
      try {
        const list = await getCartListApi()
        const backendItems = (list || []).map(mapFromApi)
        const backendCarIds = backendItems.map((i) => i.carId)
        const localOnly = items.value.filter((i) => !backendCarIds.includes(i.carId))
        items.value = [...backendItems, ...localOnly]
        // 新加载的商品默认全选
        const newIds = backendItems.map((i) => i.carId).filter((id) => !selectedIds.value.includes(id))
        selectedIds.value = [...selectedIds.value.filter((id) => backendCarIds.includes(id) || localOnly.some((i) => i.carId === id)), ...newIds]
        // 初始化后立即拉取一次价格
        await refreshPrices()
      } catch (e) {
        console.error('购物车初始化失败', e)
      }
    }

    // ---------- 加入购物车 ----------
    async function addItem(car, startDate, endDate, days) {
      if (!auth.isLoggedIn()) {
        ElMessage.warning('请先登录')
        return false
      }

      try {
        await addCartApi({ carId: car.id, startDate, endDate, days })
        await initCart()
        // 新加入的商品默认选中
        if (!selectedIds.value.includes(car.id)) {
          selectedIds.value.push(car.id)
        }
        await refreshPrices()
        return true
      } catch (e) {
        console.error('购物车同步失败', e)
        return false
      }
    }

    // ---------- 移除单项 ----------
    // 提示由调用方（组件层）负责，避免与组件内的成功提示重复弹窗
    async function removeItem(carId) {
      const item = items.value.find((i) => i.carId === carId)
      items.value = items.value.filter((i) => i.carId !== carId)
      selectedIds.value = selectedIds.value.filter((id) => id !== carId)

      if (auth.isLoggedIn() && item?.id) {
        try {
          await removeCartApi(item.id)
        } catch (e) {
          console.error('移除购物车失败', e)
          if (item) items.value.push(item)
        }
      }
      await refreshPrices()
    }

    // ---------- 更新某车租期 ----------
    async function updateItem(carId, startDate, endDate, days) {
      const item = items.value.find((i) => i.carId === carId)
      if (item) {
        item.startDate = startDate
        item.endDate = endDate
        item.days = days
        if (auth.isLoggedIn() && item.id) {
          try {
            await updateCartApi(item.id, { startDate, endDate, days })
          } catch (e) {
            console.error('更新购物车失败', e)
          }
        }
        // 租期变化后必须重新计算价格
        await refreshPrices()
      }
    }

    // ---------- 清空已选中（下单后调用，无逐条提示） ----------
    async function clearSelected() {
      const toRemove = selectedItems.value
      if (!toRemove.length) return
      const prevItems = [...items.value]
      const prevSelected = [...selectedIds.value]
      // 乐观更新：先从本地移除
      const removeCarIds = new Set(toRemove.map((i) => i.carId))
      items.value = items.value.filter((i) => !removeCarIds.has(i.carId))
      selectedIds.value = selectedIds.value.filter((id) => !removeCarIds.has(id))
      // 同步后端
      if (auth.isLoggedIn()) {
        try {
          await Promise.all(
            toRemove
              .filter((i) => i.id)
              .map((i) => removeCartApi(i.id).catch((e) => console.error('移除购物车项失败', e)))
          )
        } catch (e) {
          console.error('批量移除购物车失败', e)
          // 回滚
          items.value = prevItems
          selectedIds.value = prevSelected
        }
      }
      await refreshPrices()
    }

    // ---------- 清空 ----------
    // 提示由调用方（组件层）负责，避免与组件内的成功提示重复弹窗
    async function clear() {
      const prev = [...items.value]
      items.value = []
      selectedIds.value = []
      priceDetails.value = []
      if (auth.isLoggedIn()) {
        try {
          await clearCartApi()
        } catch (e) {
          console.error('清空购物车失败', e)
          items.value = prev
          throw e
        }
      }
    }

    // ---------- 判断是否已在购物车 ----------
    function isInCart(carId) {
      return items.value.some((i) => i.carId === carId)
    }

    // ---------- 获取某车的价格明细（结算页展示用） ----------
    function getPriceDetail(carId) {
      return priceDetails.value.find((p) => p.carId === carId) || null
    }

    return {
      items,
      selectedIds,
      priceDetails,
      priceLoading,
      totalCount,
      selectedItems,
      selectedCount,
      isAllSelected,
      totalAmount,
      grandTotal,
      initCart,
      addItem,
      removeItem,
      updateItem,
      clear,
      clearSelected,
      isInCart,
      toggleSelect,
      toggleSelectAll,
      isSelected,
      refreshPrices,
      getPriceDetail
    }
  },
  {
    persist: {
      key: 'lux_customer_cart',
      storage: localStorage
    }
  }
)
