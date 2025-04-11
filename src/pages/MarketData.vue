<script setup>
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { stocks } from 'stock-api'
import { computed, ref } from 'vue'

// 可用数据源配置
const availableSources = [
  { value: 'netease', label: '网易财经' },
  { value: 'tencent', label: '腾讯股票' },
]

// 响应式数据
const currentSource = ref('netease')
const stockCodes = ref('SH510500')
const stockResults = ref([])
const loading = ref(false)

// 当前数据源标签
const currentSourceLabel = computed(() =>
  availableSources.find(s => s.value === currentSource.value)?.label,
)

// 处理搜索
async function handleSearch() {
  if (!stockCodes.value) {
    ElMessage.warning('请输入股票代码')
    return
  }

  try {
    loading.value = true
    const codes = stockCodes.value.split(',').map(c => c.trim())
    const result = await stocks[currentSource.value].getStock(codes)
    stockResults.value = result
  }
  catch (error) {
    ElMessage.error(`搜索失败: ${error.message}`)
  }
  finally {
    loading.value = false
  }
}

// 获取单个股票数据
async function fetchStockData() {
  if (!stockCodes.value) {
    ElMessage.warning('请输入股票代码')
    return
  }

  try {
    loading.value = true
    const code = stockCodes.value.split(',')[0].trim() // 取第一个代码
    const result = await stocks[currentSource.value].getStock(code)
    stockResults.value = [result]
  }
  catch (error) {
    ElMessage.error(`获取数据失败: ${error.message}`)
  }
  finally {
    loading.value = false
  }
}

// 获取组数据
async function fetchGroupData() {
  if (!stockCodes.value) {
    ElMessage.warning('请输入股票代码')
    return
  }

  try {
    loading.value = true
    const codes = stockCodes.value.split(',').map(c => c.trim())
    const result = await stocks[currentSource.value].getStocks(codes)
    stockResults.value = result
  }
  catch (error) {
    ElMessage.error(`获取组数据失败: ${error.message}`)
  }
  finally {
    loading.value = false
  }
}

// 价格颜色样式
function priceColor(current, yesterday) {
  if (current > yesterday)
    return 'text-success'
  if (current < yesterday)
    return 'text-danger'
  return ''
}

// 涨跌幅颜色样式
function percentColor(percent) {
  if (percent > 0)
    return 'text-success'
  if (percent < 0)
    return 'text-danger'
  return ''
}
</script>

<template>
  <div class="stock-container">
    <el-card shadow="hover" class="query-card">
      <!-- 数据源选择 -->
      <div class="data-source">
        <el-select v-model="currentSource" placeholder="选择数据源">
          <el-option
            v-for="source in availableSources"
            :key="source.value"
            :label="source.label"
            :value="source.value"
          />
        </el-select>
      </div>

      <!-- 查询输入区域 -->
      <div class="query-input">
        <el-input
          v-model="stockCodes"
          placeholder="输入股票代码，多个代码用逗号分隔"
          clearable
        >
          <template #append>
            <el-button
              :icon="Search"
              :loading="loading"
              @click="handleSearch"
            >
              搜索
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          :loading="loading"
          @click="fetchStockData"
        >
          获取实时数据
        </el-button>
        <el-button
          type="success"
          :loading="loading"
          @click="fetchGroupData"
        >
          获取组数据
        </el-button>
      </div>
    </el-card>

    <!-- 查询结果展示 -->
    <el-card shadow="hover" class="result-card">
      <el-table
        v-loading="loading"
        :data="stockResults"
        stripe
        height="500"
      >
        <el-table-column prop="code" label="代码" width="120" fixed />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column label="当前价格" width="120">
          <template #default="{ row }">
            <span :class="priceColor(row.now, row.yesterday)">{{ row.now }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="percent" label="涨跌幅" width="120">
          <template #default="{ row }">
            <span :class="percentColor(row.percent)">
              {{ (row.percent * 100).toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="low" label="最低" width="120" />
        <el-table-column prop="high" label="最高" width="120" />
        <el-table-column prop="yesterday" label="昨收" width="120" />
        <el-table-column label="数据源">
          <template #default>
            {{ currentSourceLabel }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.stock-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.query-card {
  margin-bottom: 20px;
}

.data-source {
  margin-bottom: 15px;
}

.query-input {
  margin-bottom: 15px;
}

.action-buttons {
  margin-top: 15px;
}

.result-card {
  margin-top: 20px;
}

</style>
