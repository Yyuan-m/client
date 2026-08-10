// 筛选条件状态：车辆列表筛选条件全局缓存
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFilterStore = defineStore(
  'filter',
  () => {
    const filters = ref({
      keyword: '',
      type: 'all',       // 车型分类：all 全部 / 或 vehicle_type 字典 dictValue
      city: '',
      minPrice: null,
      maxPrice: null,
      sort: 'hot'        // hot / price-asc / price-desc
    })

    function setFilter(key, value) {
      filters.value[key] = value
    }

    function resetFilters() {
      filters.value = {
        keyword: '',
        type: 'all',
        city: '',
        minPrice: null,
        maxPrice: null,
        sort: 'hot'
      }
    }

    return { filters, setFilter, resetFilters }
  },
  {
    persist: {
      key: 'lux_customer_filter',
      storage: sessionStorage
    }
  }
)
