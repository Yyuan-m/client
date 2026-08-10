<template>
  <div class="vehicle-list-page section">
    <div class="container">
      <h2 class="section-title">车型选择</h2>
      <p class="section-subtitle">找到最适合您的那一台</p>

      <!-- 筛选栏 -->
      <div class="filter-bar fade-in-up">
        <el-select v-model="filters.type" placeholder="车型分类" @change="onFilterChange">
          <el-option label="全部车型" value="all" />
          <el-option v-for="item in vehicleTypes" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
        </el-select>
        <el-select v-model="filters.sort" placeholder="排序方式" @change="onFilterChange">
          <el-option label="热度优先" value="hot" />
          <el-option label="价格从低到高" value="price-asc" />
          <el-option label="价格从高到低" value="price-desc" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="搜索车型名称" clearable style="width: 220px" @clear="onFilterChange" @keyup.enter="onFilterChange" />
        <el-button type="primary" @click="onFilterChange">搜索</el-button>
      </div>

      <!-- 车辆网格 -->
      <PageSkeleton v-if="loading" type="grid" :count="6" />
      <div v-else-if="list.length" class="car-grid">
        <CarCard v-for="car in list" :key="car.id" :car="car" @rent="goDetail" />
      </div>
      <EmptyTips v-else text="没有找到匹配的车型" show-action action-text="重置筛选" @action="resetFilters" />

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CarCard from '@/components/CarCard/index.vue'
import PageSkeleton from '@/components/PageSkeleton/index.vue'
import EmptyTips from '@/components/EmptyTips/index.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { getCarListApi } from '@/api/modules/car'
import { getDictByTypeApi } from '@/api/modules/system'
import { useFilterStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const filterStore = useFilterStore()
useScrollReveal()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 9

// 车型分类字典（从后台 car_rental.sys_dict_data 加载）
const vehicleTypes = ref([])

const filters = reactive({ ...filterStore.filters })

async function loadVehicleTypes() {
  try {
    const list = await getDictByTypeApi('vehicle_type')
    vehicleTypes.value = list || []
    // 字典加载后校验当前 type 是否有效：
    // 旧持久化数据可能是英文 sedan/suv 等（已废弃），不在新字典内则重置为 all
    const validValues = vehicleTypes.value.map((i) => i.dictValue)
    if (filters.type !== 'all' && !validValues.includes(filters.type)) {
      filters.type = 'all'
      filterStore.setFilter('type', 'all')
      onFilterChange()
    }
  } catch (e) {
    console.error('加载车型分类字典失败', e)
    vehicleTypes.value = []
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await getCarListApi({ ...filters, page: page.value, pageSize })
    list.value = res.list || []
    total.value = res.total || 0
    // 同步到全局 store
    Object.assign(filterStore.filters, filters)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filterStore.resetFilters()
  Object.assign(filters, filterStore.filters)
  page.value = 1
  loadList()
}

function onFilterChange() {
  page.value = 1
  loadList()
}

function goDetail(car) {
  router.push(`/vehicles/${car.id}`)
}

watch(() => route.query.type, (newType) => {
  if (newType && newType !== filters.type) {
    filters.type = newType
    page.value = 1
    loadList()
  }
})

onMounted(() => {
  loadVehicleTypes()
  if (route.query.type) {
    filters.type = route.query.type
  }
  loadList()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: $space-base;
  align-items: center;
  margin-bottom: $space-xl;
  flex-wrap: wrap;
}

.car-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-sm;
  @include respond-to('md') { grid-template-columns: repeat(2, 1fr); }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: $space-xl;
}
</style>
