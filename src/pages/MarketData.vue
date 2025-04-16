<script setup>
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

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

// 切换收藏状态
function toggleFavorite(stock) {
  const index = favoriteStocks.value.findIndex(s => s.stock_code === stock.stock_code)
  if (index === -1) {
    favoriteStocks.value.push({ ...stock, isFavorite: true })
  }
  else {
    favoriteStocks.value.splice(index, 1)
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

// 初始化加载分页数据
onMounted(() => {
  fetchPaginatedStocks()
})
</script>

<template>
  <div class="stock-container">
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
    <el-table v-if="stockList.length > 0" v-loading="loading" :data="stockList" style="margin-top:20px">
<!--      <el-table-column prop="stock_code" label="代码" width="120" />-->
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

    <!-- 分页股票列表 -->
    <div class="list-container">
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

      <!-- 收藏股票列表 -->
      <el-card class="favorite-list">
        <template #header>
          <div class="list-title">
            收藏列表
          </div>
        </template>
        <el-table :data="favoriteStocks" height="400" style="width: 100%" empty-text="暂无收藏股票">
          <el-table-column prop="stock_code" label="代码" width="120" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="price" label="最新价格" width="120" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="toggleFavorite(row)">
                取消收藏
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
