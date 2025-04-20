<script setup>
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth.js'

const { userId } = useAuth()
const inputCodes = ref('')
const stockList = ref([])
const loading = ref(false)

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(10)
const totalStocks = ref(0)
const paginatedStocks = ref([])

// 收藏股票数据
const favoriteStocks = ref([
  { stock_code: '00700', name: '腾讯控股', price: 320.0, isFavorite: true },
  { stock_code: '00001', name: '长和', price: 45.6, isFavorite: true },

])

async function fetchFavoriteStocks() {
  try {
    loading.value = true
    const response = await axios.post(
      `/api/v1/market/getFavoriteStocks/`,
      {
        user_id: userId.value,
      },
      {
        timeout: 10000, // 10秒超时
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    )
    if (response.data.code === 200) {
      // 数据转换处理
      favoriteStocks.value = response.data.data.map((stock) => {
        return {
          stock_code: stock.stockCode,
          name: stock.stockName,
          price: stock.currentPrice,
          isFavorite: true,
        }
      })
    }
    else {
      ElMessage.error(`获取失败：${response.data.message}`)
    }
  }
  catch (error) {
    // 错误提示
    const errorMessage = axios.isCancel(error)
      ? '请求超时'
      : error.response?.data?.message || '网络异常，请检查连接'
    ElMessage.error(`收藏股加载失败：${errorMessage}`)
  }
  finally {
    loading.value = false
  }
}

// 模拟分页数据
const allStocks = Array.from({ length: 100 }, (_, i) => ({
  stock_code: String(i + 1).padStart(5, '0'),
  name: `股票${i + 1}`,
  price: (Math.random() * 100).toFixed(2),
  lastPrice: (Math.random() * 100).toFixed(2),
  high: (Math.random() * 100).toFixed(2),
  low: (Math.random() * 100).toFixed(2),
  time: new Date().toISOString(),
})).sort((a, b) => a.stock_code - b.stock_code)

// 获取分页股票
function fetchPaginatedStocks() {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  paginatedStocks.value = allStocks.slice(start, end)
  totalStocks.value = allStocks.length
}

// 典型的操作流程时序
// 用户点击 → 本地立即更新 → 发起请求 → 成功：同步远端数据 / 失败：恢复本地数据

async function cancelFavorite(stockCode) {
  let originalList
  try {
    // 乐观更新：先移除本地数据
    originalList = [...favoriteStocks.value]
    favoriteStocks.value = favoriteStocks.value.filter(
      item => item.stock_code !== stockCode,
    )

    const response = await axios.post(
      '/api/v1/market/favorite/cancel',
      {
        user_id: userId.value,
        stock_code: stockCode,
        // timestamp: Date.now(), // 防重放
      },
      {
        timeout: 5000,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    )
    if (response.data.code !== 200) {
      throw new Error(response.data.message || '操作失败')
    }
    ElMessage.success('取消收藏成功')
    // 主动刷新最新数据
    await fetchFavoriteStocks()
  }
  catch (error) {
    // 错误回退
    favoriteStocks.value = originalList
    console.error('取消收藏失败:', error)
  }
}

// 防抖 防止重复点击
// const debouncedCancelFavorite = debounce(cancelFavorite, 500)

// 防抖函数
// function debounce(fn, delay) {
//   let timer = null
//   return (...args) => {
//     if (timer)
//       clearTimeout(timer)
//     timer = setTimeout(() => fn(...args), delay)
//   }
// }

// 切换收藏状态
async function toggleFavorite(stock) {
  // 先进行本地状态判断
  const existingIndex = favoriteStocks.value.findIndex(
    s => s.stock_code === stock.stock_code,
  )
  // 取消收藏流程
  if (existingIndex > -1) {
    await cancelFavorite(stock.stock_code) // 调用取消收藏函数
    return
  }
  // 新增收藏流程
  try {
    // 乐观更新：先添加本地数据
    favoriteStocks.value.push({
      ...stock,
      isFavorite: true,
      _pending: true, // 标记为请求中状态
    })
    // 调用新增收藏接口
    const response = await axios.post(
      `/api/v1/market/favorite/${userId.value}`,
      {
        stock_code: stock.stock_code,
        name: stock.name,
      },
      {
        timeout: 5000,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      },
    )
    if (response.data.code === 200) {
      // 更新完整数据
      const index = favoriteStocks.value.findIndex(
        s => s.stock_code === stock.stock_code,
      )
      if (index > -1) {
        favoriteStocks.value[index] = {
          ...response.data.data,
          isFavorite: true,
          _pending: false,
        }
      }
    }
  }
  catch (error) {
    console.error('添加收藏失败:', error)
    // 回滚操作：移除未成功添加的项目
    const rollbackIndex = favoriteStocks.value.findIndex(
      s => s.stock_code === stock.stock_code,
    )
    if (rollbackIndex > -1) {
      favoriteStocks.value.splice(rollbackIndex, 1)
    }
    ElMessage.error(`添加收藏失败：${error.response?.data?.message || '未知错误'}`)
  }
}

const formatTime = t => t.replace(/\//g, '-') // 时间格式化

async function fetchStocks() {
  if (!inputCodes.value.trim())
    return
  try {
    loading.value = true
    const response = await axios.get(
      `http://localhost:8080/api/v1/market/getstock/${inputCodes.value}`,
    )
    stockList.value = response.data
  }
  catch (err) {
    ElMessage.error(err.response?.data || '服务异常')
  }
  finally {
    loading.value = false
  }
}

// 添加自动刷新
let refreshTimer = null
onMounted(() => {
  fetchPaginatedStocks()
  fetchFavoriteStocks()
  // 每30秒自动刷新
  refreshTimer = setInterval(fetchFavoriteStocks, 30000)
})

onUnmounted(() => {
  clearInterval(refreshTimer)
})
</script>

<template>
  <div class="stock-container">
    <!-- 分页股票列表 -->
    <div class="list-container">
      <el-card class="stock-list">
        <!-- 搜索框 -->
        <el-input
          v-model="inputCodes" placeholder="输入港股代码 例：00700,00001" style="width:400px; margin-bottom: 20px;"
          clearable
        >
          <template #append>
            <el-button icon="Search" @click="fetchStocks" />
          </template>
        </el-input>
        <!-- 搜索结果表格 -->
        <!--    <el-table v-if="stockList.length > 0" v-loading="loading" :data="stockList" style="margin-top:20px"> -->
        <el-table v-loading="loading" :data="stockList" style="margin-top:20px">
          <!--      <el-table-column prop="stock_code" label="代码" width="120" /> -->
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="price" label="当前价格" />
          <el-table-column prop="lastPrice" label="昨日收盘价格" />
          <el-table-column prop="high" label="当天最高价" />
          <el-table-column prop="low" label="当天最低价" />
          <el-table-column label="更新时间">
            <template #default="{ row }">
              {{ formatTime(row.time) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 分页股票列表 -->
    <div class="list-container">
      <!-- 股票列表 -->
      <el-card class="stock-list">
        <template #header>
          <div class="list-title">
            股票列表
          </div>
        </template>
        <el-table v-loading="loading" :data="paginatedStocks" height="400" style="width: 100%">
          <el-table-column prop="stock_code" label="代码" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="price" label="当前价格" width="120" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                size="small"
                :type="favoriteStocks.some(s => s.stock_code === row.stock_code) ? 'danger' : 'primary'"
                @click="toggleFavorite(row)"
              >
                {{ favoriteStocks.some(s => s.stock_code === row.stock_code) ? '取消收藏' : '收藏' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination" :current-page="currentPage" :page-size="pageSize" :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next" :total="totalStocks"
          @current-change="val => { currentPage.value = val; fetchPaginatedStocks() }"
          @size-change="val => { pageSize.value = val; fetchPaginatedStocks() }"
        />
      </el-card>

      <!-- 自选股票列表 -->
      <el-card class="favorite-list">
        <template #header>
          <div class="list-title">
            自选列表
          </div>
        </template>
        <el-table :data="favoriteStocks" height="400" style="width: 100%" empty-text="暂无收藏股票">
          <el-table-column prop="stock_code" label="代码" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="price" label="最新价格" width="120" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="cancelFavorite(row)">
                取消自选
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.stock-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.list-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.stock-list,
.favorite-list {
  flex: 1;
  min-width: 600px;
}

.list-title {
  font-size: 16px;
  font-weight: bold;
}

.pagination {
  margin-top: 15px;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .list-container {
    flex-wrap: wrap;
  }

  .stock-list,
  .favorite-list {
    min-width: 100%;
  }
}
</style>
