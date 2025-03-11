<!-- src/views/Trade.vue -->
<template>
  <div class="trade-container">
    <el-card class="max-w-2xl mx-auto">
      <template #header>
        <div class="text-xl font-bold">股票交易</div>
      </template>

      <el-form :model="form" label-width="100px">
        <el-form-item label="股票代码">
          <el-select 
            v-model="form.symbol" 
            filterable 
            placeholder="输入股票代码" 
            @change="handleSymbolChange"
            :loading="!stockList.length"
          >
            <el-option 
              v-for="item in stockList" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="买卖方向">
          <el-radio-group v-model="form.side">
            <el-radio-button label="BUY">买入</el-radio-button>
            <el-radio-button label="SELL">卖出</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="委托类型">
          <el-select v-model="form.orderType">
            <el-option label="限价单" value="LIMIT" />
            <el-option label="市价单" value="MARKET" />
          </el-select>
        </el-form-item>

        <el-form-item label="价格" v-if="form.orderType === 'LIMIT'">
          <el-input-number 
            v-model="form.price" 
            :precision="2" 
            :min="0.01" 
            :step="0.01"
            :controls="false"
          />
        </el-form-item>

        <el-form-item label="数量">
          <el-input-number 
            v-model="form.quantity" 
            :min="100" 
            :step="100"
            :controls="false"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitOrder" 
            :loading="loading"
            :icon="Check"
          >
            提交委托
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 交易历史 -->
    <el-card class="max-w-2xl mx-auto history-card mt-4">
      <template #header>
        <div class="text-xl font-bold">最近交易记录</div>
      </template>
      <el-table 
        :data="tradeHistory" 
        height="300" 
        stripe
        v-loading="loading"
      >
        <el-table-column prop="time" label="时间" width="180" sortable />
        <el-table-column prop="symbol" label="代码" width="100" />
        <el-table-column label="方向" width="100">
          <template #default="{ row }">
            <el-tag :type="row.side === 'BUY' ? 'success' : 'danger'">
              {{ row.side === 'BUY' ? '买入' : '卖出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="120">
          <template #default="{ row }">
            {{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '成交' ? '' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Check } from '@element-plus/icons-vue'
import axios from 'axios'

const loading = ref(false)
const stockList = ref([])
const tradeHistory = ref([])

const form = ref({
  symbol: '',
  side: 'BUY',
  orderType: 'LIMIT',
  price: 0,
  quantity: 100
})

// 获取可交易股票列表
async function fetchStockList() {
  try {
    const response = await axios.get('/api/v1/market/stocks/tradable')
    if (response.data.code === 200) {
      stockList.value = response.data.data.map(stock => ({
        value: stock.stockCode,
        label: `${stock.stockName} (${stock.stockCode})`
      }))
    }
  } catch (error) {
    console.error('获取股票列表失败:', error)
  }
}

// 获取交易历史
async function fetchTradeHistory() {
  try {
    const response = await axios.get('/api/v1/trade/history', {
      params: {
        page: 0,
        size: 10
      }
    })
    if (response.data.code === 200) {
      tradeHistory.value = response.data.data.content.map(trade => ({
        time: new Date(trade.tradeTime).toLocaleString(),
        symbol: trade.stockCode,
        side: trade.side,
        price: trade.price,
        quantity: trade.quantity,
        status: trade.status
      }))
    }
  } catch (error) {
    console.error('获取交易历史失败:', error)
  }
}

// 提交订单
async function submitOrder() {
  if (!form.value.symbol) {
    ElMessage.warning('请选择交易股票')
    return
  }
  
  loading.value = true
  try {
    const orderData = {
      stockCode: form.value.symbol,
      side: form.value.side,
      orderType: form.value.orderType,
      price: form.value.orderType === 'LIMIT' ? form.value.price : null,
      quantity: form.value.quantity
    }
    
    const response = await axios.post('/api/v1/trade/orders', orderData)
    
    if (response.data.code === 200) {
      ElMessage.success('委托提交成功')
      // 刷新交易历史
      fetchTradeHistory()
    }
  } catch (error) {
    console.error('提交委托失败:', error)
    ElMessage.error(error.response?.data?.message || '提交委托失败')
  } finally {
    loading.value = false
  }
}

// 获取股票实时价格
async function handleSymbolChange(symbol) {
  if (!symbol) return
  
  try {
    const response = await axios.get(`/api/v1/market/stocks/${symbol}/price`)
    if (response.data.code === 200) {
      form.value.price = response.data.data.price
    }
  } catch (error) {
    console.error('获取股票价格失败:', error)
  }
}

// 初始化加载
onMounted(() => {
  fetchStockList()
  fetchTradeHistory()
})
</script>

<style scoped>
.trade-container {
  padding: 20px;
}
.history-card {
  margin-top: 20px;
}
</style>