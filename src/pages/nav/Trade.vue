<!-- src/views/Trade.vue -->
<template>
  <div class="trade-container">
    <el-card class="max-w-2xl mx-auto">
      <template #header>
        <div class="text-xl font-bold">股票交易</div>
      </template>

      <el-form :model="form" label-width="100px">
        <el-form-item label="股票代码">
          <el-select v-model="form.symbol" filterable placeholder="输入股票代码" @change="handleSymbolChange">
            <el-option v-for="item in stockList" :key="item.value" :label="item.label" :value="item.value" />
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
          <el-input-number v-model="form.price" :precision="2" :min="0.01" :step="0.01" />
        </el-form-item>

        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="100" :step="100" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitOrder" :icon="Check">提交委托
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <!-- 新增交易历史卡片 -->
    <el-card class="max-w-2xl mx-auto history-card">
      <template #header>
        <div class="text-xl font-bold">最近交易记录</div>
      </template>
      <el-table :data="tradeHistory" height="300" stripe>
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
          <template #default="{ row }">${{ row.price.toFixed(2) }}</template>
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
import { ref } from 'vue'
import { Check } from '@element-plus/icons-vue'

const stockList = [
  { label: '阿里巴巴 (BABA)', value: 'BABA' },
  { label: '腾讯控股 (0700)', value: '0700' },
  { label: '贵州茅台 (600519)', value: '600519' }
]

const form = ref({
  symbol: '',
  side: 'BUY',
  orderType: 'LIMIT',
  price: 0,
  quantity: 100
})

const submitOrder = () => {
  console.log('提交委托:', form.value)
  // 这里接入实际交易API
}
// 新增模拟交易历史数据
const tradeHistory = ref([
  {
    time: '2024-02-20 14:30:15',
    symbol: 'AAPL',
    side: 'BUY',
    price: 156.30,
    quantity: 100,
    status: '成交'
  },
  {
    time: '2024-02-20 14:25:45',
    symbol: 'TSLA',
    side: 'SELL',
    price: 210.50,
    quantity: 200,
    status: '已撤单'
  }
])
tradeHistory.value.unshift({
  time: new Date().toLocaleString(),
  symbol: ['AAPL', 'TSLA'][Math.floor(Math.random() * 2)],
  side: ['BUY', 'SELL'][Math.floor(Math.random() * 2)],
  price: Number((Math.random() * 200 + 100).toFixed(2)),
  quantity: Math.ceil(Math.random() * 500 / 100) * 100,
  status: ['成交', '处理中'][Math.floor(Math.random() * 2)]
})

// 模拟实时添加交易记录
// setInterval(() => {
//   tradeHistory.value.unshift({
//     time: new Date().toLocaleString(),
//     symbol: ['AAPL', 'TSLA'][Math.floor(Math.random() * 2)],
//     side: ['BUY', 'SELL'][Math.floor(Math.random() * 2)],
//     price: Number((Math.random() * 200 + 100).toFixed(2)),
//     quantity: Math.ceil(Math.random() * 500 / 100) * 100,
//     status: ['成交', '处理中'][Math.floor(Math.random() * 2)]
//   })
// }, 5000)

</script>