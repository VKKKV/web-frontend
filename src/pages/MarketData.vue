<script setup>
import axios from 'axios'
import { ElMessage } from 'element-plus'
// 修改pagination事件绑定（新增防抖处理）
import { debounce } from 'lodash-es'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth.js'

const { isLoggedIn } = useAuth()
const inputCodes = ref('')
const stockList = ref([])
const loading = ref(false)

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(8)
const totalStocks = ref(0)
const paginatedStocks = ref([])

const favoriteLoading = ref(false)
const router = useRouter() // 初始化 router

// 处理价格变化
const priceDisplay = computed(() => {
  return (stock) => {
    // price: 股票当前价格
    // lastPrice: 股票昨天收盘价格
    const change = calcPriceChange(stock?.price, stock?.lastPrice)
    return {
      value: change.formatted,
      class: change.status,
    }
  }
})

const allStockCodes = ref([]) // 保存全部股票的代码集合
const displayedCodes = ref('') // 当前页显示的股票代码集合

async function fetchPaginatedStocks() {
  try {
    loading.value = true

    if (allStockCodes.value.length === 0) {
      const allStocksRes = await axios.get('http://localhost:8080/api/v1/market/getstock/all')
      allStockCodes.value = allStocksRes.data
      totalStocks.value = allStockCodes.value.length
    }

    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    const pageCodes = allStockCodes.value.slice(start, end)
    displayedCodes.value = pageCodes.join(',')

    // 3. 调用现有接口获取实际数据
    const response = await axios.get(
      `http://localhost:8080/api/v1/market/getstock/${displayedCodes.value}`,
    )
    // 4. 数据处理匹配分页顺序
    const stockMap = new Map(response.data.map(s => [s.stockCode, s]))
    paginatedStocks.value = pageCodes.map(code => ({
      ...stockMap.get(code),
      stock_code: code,
      price: Number(stockMap.get(code)?.price) || 0,
      lastPrice: Number(stockMap.get(code)?.lastPrice) || 0,
    }))
  }
  catch (err) {
    ElMessage.error(`分页数据加载失败：${err.message}`)
  }
  finally {
    loading.value = false
  }
}
const handlePaginationChange = debounce((newPage) => {
  if (newPage)
    currentPage.value = newPage
  fetchPaginatedStocks()
}, 300)

// 新增跳转到行情图表页面的方法
function viewMarketChart(stockCode) {
  if (stockCode) {
    router.push({ name: '/nav/Market', query: { code: stockCode } })
  }
}

// 价格计算逻辑函数
function calcPriceChange(current, previous) {
  if (!current || !previous || previous === 0) {
    return {
      formatted: '-',
      percentage: 0,
      status: 'neutral',
    }
  }
  const diff = current - previous
  const percentage = (diff / previous) * 100
  const status = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
  return {
    raw: diff,
    percentage,
    formatted: `${diff.toFixed(2)} (${percentage.toFixed(2)}%)`,
    status,
  }
}

const favoriteStocks = ref(loadFavorites())

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem('stockFavorites') || '[]')
  }
  catch {
    return []
  }
}

// 安全类型转换
// 数据清洗与转换
const safeParseFloat = v => Number.isFinite(+v) ? +v : 0
const safeParseInt = v => Math.abs(Number.parseInt(v)) || 0

// 获取自选股实时数据
async function fetchFavoriteStocks() {
  // 检查是否为空
  if (favoriteStocks.value.length === 0 && isLoggedIn.value) {
    ElMessage.warning('当前没有自选股票')
    return
  }
  try {
    favoriteLoading.value = true
    const codes = favoriteStocks.value
      .map(item => encodeURIComponent(item.stock_code))
      .join(',')

    // 请求实时数据
    const response = await axios.get(
      `http://localhost:8080/api/v1/market/getstock/${codes}`,
    )
    // 创建数据映射
    const stockUpdates = new Map(
      response.data.map((apiStock) => {
        return [
          apiStock.stockCode,
          {
            stock_code: apiStock.stockCode,
            name: apiStock.name,
            price: safeParseFloat(apiStock.price),
            // 保留的行情数据（直接挂载在根对象）
            lastPrice: safeParseFloat(apiStock.lastPrice),
            openPrice: safeParseFloat(apiStock.openPrice),
            high: safeParseFloat(apiStock.high),
            low: safeParseFloat(apiStock.low),
            volume: safeParseInt(apiStock.amount),
            timestamp: new Date(apiStock.time).getTime() || Date.now(),
            // 保留原始接口数据结构（可选）
            _raw: apiStock,
          },
        ]
      }),
    )
    // 智能合并逻辑 - 保留本地扩展字段
    favoriteStocks.value = favoriteStocks.value.map((localStock) => {
      const remoteData = stockUpdates.get(localStock.stock_code)
      if (!remoteData) {
        return { ...localStock, _updateFailed: true }
      }
      return {
        // 保留本地数据
        ...localStock,
        // 更新核心字段
        name: remoteData.name || localStock.name,
        price: remoteData.price,
        // 合并行情数据（覆盖式更新）
        lastPrice: remoteData.lastPrice,
        openPrice: remoteData.openPrice,
        high: remoteData.high,
        low: remoteData.low,
        volume: remoteData.volume,
        timestamp: remoteData.timestamp,
        // 保留原始数据
        _raw: remoteData._raw,
        // 状态标记
        _updated: Date.now(),
        _updateFailed: false,
        _dataStale: false,
      }
    })
    // 增加失败数据处理
    const failedItems = favoriteStocks.value.filter(s => s._updateFailed)
    if (failedItems.length > 0) {
      console.warn('以下股票数据更新失败：', failedItems.map(i => i.stock_code))
    }
    // 处理本地时间戳
    addLocalTimestamp(favoriteStocks.value)
  }
  catch (err) {
    // 增强的错误处理
    const errorMessage = err.response
      ? `数据更新失败 (${err.response.status})`
      : '网络连接异常'

    ElMessage.error(`${errorMessage}，显示最后一次缓存数据`)

    // 标记所有项目为数据陈旧
    favoriteStocks.value.forEach((s) => {
      s._dataStale = true
    })
  }
}

// 辅助方法：添加本地时间戳
function addLocalTimestamp(stocks) {
  const now = Date.now()
  stocks.forEach((stock) => {
    stock.localTimestamp = now
  })
}

watch(
  favoriteStocks,
  (newVal) => {
    localStorage.setItem('stockFavorites', JSON.stringify(newVal))
  },
  // 深度监视
  { deep: true },
)

function toggleFavorite(stock) {
  const index = favoriteStocks.value.findIndex(
    s => s.stock_code === stock.stock_code,
  )
  if (index === -1) {
    // 添加收藏
    favoriteStocks.value.push({
      stock_code: stock.stock_code,
      name: stock.name,
      price: stock.price,
      isFavorite: true,
      addedAt: Date.now(),
    })
    ElMessage.success('已添加收藏')
    fetchFavoriteStocks()
  }
  else {
    // 取消收藏
    favoriteStocks.value.splice(index, 1)
    ElMessage.success('已取消收藏')
  }
}

const formatTime = t => t.replace(/\//g, '-')

async function fetchStocks() {
  if (!inputCodes.value.trim())
    return
  try {
    loading.value = true
    const response = await axios.get(
      `http://localhost:8080/api/v1/market/getstock/${inputCodes.value}`,
    )
    // 对API返回的数据进行转换，以确保字段统一和数据类型正确
    stockList.value = response.data.map(stock => ({
      ...stock, // 保留原始API返回的其他字段
      stock_code: stock.stockCode, // 将 stockCode 映射为 stock_code
      name: stock.name, // 确保 name 字段存在
      price: safeParseFloat(stock.price),
      lastPrice: safeParseFloat(stock.lastPrice),
      openPrice: safeParseFloat(stock.openPrice),
      high: safeParseFloat(stock.high),
      low: safeParseFloat(stock.low),
      volume: safeParseInt(stock.amount),
    }))
  }
  catch (err) {
    ElMessage.error(err.response?.data || '服务异常')
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPaginatedStocks()
  fetchFavoriteStocks()
  // 监听storage事件实现多标签页同步
  window.addEventListener('storage', (e) => {
    if (e.key === 'stockFavorites') {
      favoriteStocks.value = JSON.parse(e.newValue || '[]')
    }
  })
})
</script>

<template>
  <div class="stock-container">
    <!-- 分页股票列表 -->
    <div class="list-container">
      <el-card class="stock-list">
        <!-- 搜索框 -->
        <el-input
          v-model="inputCodes" placeholder="输入代码 例：00700,00001" style="width:400px; margin-bottom: 20px;"
          clearable
        >
          <template #append>
            <el-button icon="Search" @click="fetchStocks" />
          </template>
        </el-input>
        <el-table v-loading="loading" :data="stockList" style="margin-top:20px">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="price" label="当前价格" />
          <el-table-column prop="lastPrice" label="昨日收盘价格" />
          <el-table-column label="日涨跌幅" width="150">
            <template #default="{ row }">
              <span :class="priceDisplay(row).class">
                {{ priceDisplay(row).value }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="high" label="当天最高价" />
          <el-table-column prop="low" label="当天最低价" />
          <el-table-column label="更新时间">
            <template #default="{ row }">
              {{ formatTime(row.time) }}
            </template>
          </el-table-column>
          <el-table-column label="" width="200">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                style="margin-right: 5px;"
                @click="viewMarketChart(row.stock_code)"
              >
                查看行情
              </el-button>
              <el-button
                size="small"
                :type="favoriteStocks.some(s => s.stock_code === row.stock_code) ? 'danger' : 'primary'"
                @click="toggleFavorite(row)"
              >
                {{ favoriteStocks.some(s => s.stock_code === row.stock_code) ? '取消自选' : '添加自选' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

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
          <el-table-column prop="price" label="当前价格" width="120">
            <template #default="{ row }">
              <span>
                {{ row.price }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="日涨跌幅" width="150">
            <template #default="{ row }">
              <span :class="priceDisplay(row).class">
                {{ priceDisplay(row).value }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                style="margin-right: 5px;"
                @click="viewMarketChart(row.stock_code)"
              >
                查看行情
              </el-button>
              <el-button
                size="small"
                :type="favoriteStocks.some(s => s.stock_code === row.stock_code) ? 'danger' : 'primary'"
                @click="toggleFavorite(row)"
              >
                {{ favoriteStocks.some(s => s.stock_code === row.stock_code) ? '取消自选' : '添加自选' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="pagination"
          size="small"
          background
          pager-count="4"
          :current-page="currentPage"
          :total="totalStocks"
          layout="prev, pager, next"
          @current-change="val => { handlePaginationChange(val) }"
        />
      </el-card>

      <!-- 自选股票列表 -->
      <el-card
        v-show="isLoggedIn" v-loading="favoriteLoading"
        class="favorite-list"
      >
        <template #header>
          <div class="list-title">
            自选列表
          </div>
        </template>
        <el-table :data="favoriteStocks" height="400" style="width: 100%" empty-text="暂无收藏股票">
          <el-table-column prop="stock_code" label="代码" width="80" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="price" label="最新价格" width="120" />
          <el-table-column label="日涨跌幅" width="150">
            <template #default="{ row }">
              <span :class="priceDisplay(row).class">
                {{ priceDisplay(row).value }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                style="margin-right: 5px;"
                @click="viewMarketChart(row.stock_code)"
              >
                查看行情
              </el-button>
              <el-button
                size="small"
                :type="favoriteStocks.some(s => s.stock_code === row.stock_code) ? 'danger' : 'primary'"
                @click="toggleFavorite(row)"
              >
                {{ favoriteStocks.some(s => s.stock_code === row.stock_code) ? '取消自选' : '添加自选' }}
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
  @apply p-4 max-w-7xl mx-auto space-y-4;
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

/* 价格变化样式 */
.up {
  color: #00b865;
}

.down {
  color: #ff4444;
}

.neutral {
  color: #999;
}

.price-cell {
  display: flex;
  flex-direction: column;
}

.current-price {
  font-weight: 600;
}

.price-change {
  font-size: 0.85em;
  margin-top: 2px;
}
</style>
