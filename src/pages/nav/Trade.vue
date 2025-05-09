<script setup>
import { Check } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth.js'

const { userId } = useAuth()
const stockName = ref()
const loading = ref(false)
const tradeHistory = ref([])
const form = ref({
  symbol: '00001',
  side: 'BUY',
  orderType: 'MARKET',
  price: 0,
  quantity: 100,
})
const safeParseFloat = v => Number.isFinite(+v) ? +v : 0

const cost = computed(() => {
  return (form.value.price || 0) * (form.value.quantity || 0)
})

const userHoldings = ref([
  {
    // symbol: '00001', // 股票代码
    // name: '长和', // 股票名称
    symbol: '', // 股票代码
    name: '', // 股票名称
    quantity: 0, // 总持仓
    available: 0, // 可用数量
    avgPrice: 0, // 平均成本
    currentPrice: 0, // 当前市价（实时更新）
    profit: 0, // 浮动盈亏
  },
])

// 计算持仓市值和盈亏
const holdingValues = computed(() => {
  return userHoldings.value.map((holding) => {
    const currentPrice = Number(holding.currentPrice) || 0
    const avgPrice = Number(holding.avgPrice) || 0
    const quantity = Number(holding.quantity) || 0
    const profit = (currentPrice - avgPrice) * quantity
    // 计算盈亏比例（防止除零）
    const profitRatio = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0
    return {
      ...holding,
      currentPrice,
      avgPrice,
      marketValue: currentPrice * quantity,
      profit,
      profitRatio,
    }
  })
})

// 计算总市值（确保数值安全）
const totalMarketValue = computed(() => {
  return holdingValues.value.reduce((total, holding) => {
    return total + (Number(holding.currentPrice) * Number(holding.quantity))
  }, 0)
})

// 计算总盈亏（确保数值安全）
const totalProfit = computed(() => {
  return holdingValues.value.reduce((total, holding) => {
    return total + (Number(holding.profit) || 0)
  }, 0)
})

const totalProfitRatio = computed(() => {
  const totalCost = holdingValues.value.reduce((total, holding) => {
    return total + (Number(holding.avgPrice) * Number(holding.quantity))
  }, 0)

  return totalCost > 0
    ? (totalProfit.value / totalCost) * 100
    : 0
})

// 获取交易历史
async function fetchTradeHistory() {
  try {
    const response = await axios.get('/api/v1/trade/history', {
      params: {
        page: 0,
        size: 100,
        userId: userId.value,
      },
    })
    if (response.data.code === 200) {
      tradeHistory.value = response.data.data.records.map(record => ({
        time: record.createdAt,
        symbol: record.stockCode,
        side: record.actionType,
        price: record.price,
        quantity: record.quantity,
        status: record.status,
      }))
    }
  }
  catch (error) {
    console.error('获取交易历史失败:', error)
  }
}

// 提交订单
async function submitOrder() {
  if (!form.value.symbol) {
    ElMessage.warning('请选择交易股票')
    return
  }
  // 卖出数量校验
  if (form.value.side === 'SELL') {
    const holding = userHoldings.value.find(
      h => h.symbol === form.value.symbol,
    )
    if (!holding) {
      ElMessage.warning('没有该股票的持仓可卖出')
      return
    }

    const availableQty = holding.available
    if (form.value.quantity > availableQty) {
      ElMessage.warning(`可卖数量不足，当前可用：${availableQty}股`)
      return
    }
  }
  if (form.value.quantity % 100 !== 0) {
    ElMessage.warning(`委托数量必须是100的整数倍`)
    return
  }

  loading.value = true
  try {
    const orderData = {
      userId: userId.value,
      stockCode: form.value.symbol,
      type: form.value.side,
      quantity: form.value.quantity,
      price: form.value.price,
      orderType: form.value.orderType,
    }
    const response = await axios.post('/api/v1/trade/order', orderData)
    if (response.data.code === 200) {
      ElMessage.success('委托提交成功')

      // 刷新交易历史
      await fetchTradeHistory()
      await fetchUserHoldings()
    }
  }
  catch (error) {
    console.error('提交委托失败:', error)
    ElMessage.error(
      error.response?.data?.message
        ? String(error.response.data.message)
        : '提交委托失败',
    )
  }
  finally {
    loading.value = false
  }
}

// 获取股票实时价格&stockName
async function handleSymbolChange(symbol) {
  if (!symbol)
    return
  try {
    const response = await axios.get(`/api/v1/market/getstock/${symbol}`)
    if (response.status === 200) {
      form.value.price = safeParseFloat(response.data[0].price)
      stockName.value = response.data[0].name
    }
  }
  catch (error) {
    console.error('获取股票价格失败:', error)
  }
}

// 计算持仓数据
async function fetchUserHoldings() {
  try {
    // 先获取交易历史
    await fetchTradeHistory()

    // 从交易历史中计算持仓
    const holdingsMap = {}
    tradeHistory.value.forEach((trade) => {
      if (!holdingsMap[trade.symbol]) {
        holdingsMap[trade.symbol] = {
          symbol: trade.symbol,
          name: '',
          quantity: 0,
          available: 0,
          avgPrice: 0,
          totalCost: 0,
          currentPrice: 0,
          profit: 0,
        }
      }
      const holding = holdingsMap[trade.symbol]
      if (trade.side === 'BUY') {
        // 买入操作：增加持仓
        const newQuantity = holding.quantity + trade.quantity
        holding.totalCost = holding.totalCost * holding.quantity + trade.price * trade.quantity
        holding.quantity = newQuantity
        holding.avgPrice = holding.totalCost / newQuantity
      }
      else if (trade.side === 'SELL') {
        // 卖出操作：减少持仓
        holding.quantity -= trade.quantity
        if (holding.quantity <= 0) {
          // 如果全部卖出，则清空平均价格
          holding.avgPrice = 0
          holding.totalCost = 0
        }
      }
    })
    // 过滤掉数量为0的持仓
    userHoldings.value = Object.values(holdingsMap)
      .filter(h => h.quantity > 0)
      .map(h => ({
        ...h,
        available: h.quantity, // 初始情况下可用数量等于总持仓
        currentPrice: 0, // 将在updateHoldingsPrice中更新
        profit: 0, // 将在updateHoldingsPrice中计算
      }))

    // 更新持仓股票的实时价格和盈亏
    await updateHoldingsPrice()
  }
  catch (error) {
    console.error('计算持仓失败:', error)
  }
}

// 更新持仓股票实时价格
async function updateHoldingsPrice() {
  if (!userHoldings.value.length)
    return

  const codes = userHoldings.value.map(h => h.symbol).join(',')
  try {
    const response = await axios.get(`/api/v1/market/getstock/${codes}`)

    if (response.data && response.data.length > 0) {
      userHoldings.value = userHoldings.value.map((holding) => {
        const realtimeData = response.data.find(
          s => s.stockCode === holding.symbol,
        )

        const currentPrice = safeParseFloat(realtimeData?.price) || holding.currentPrice
        return {
          ...holding,
          name: realtimeData.name,
          currentPrice,
          profit: (currentPrice - holding.avgPrice) * holding.quantity,
        }
      })
    }
  }
  catch (error) {
    console.error('更新价格失败:', error)
  }
}

// 卖出操作
function handleSell(symbol) {
  const holding = userHoldings.value.find(h => h.symbol === symbol)
  if (holding) {
    form.value = {
      ...form.value,
      symbol: holding.symbol,
      side: 'SELL',
      price: holding.currentPrice,
      quantity: 100, // 默认100股
    }
    // 可以滚动到交易面板
    document.querySelector('.trade-panel')?.scrollIntoView({ behavior: 'smooth' })
  }
}

// 初始化加载
onMounted(() => {
  fetchTradeHistory()
  fetchUserHoldings()
  handleSymbolChange(form.value.symbol)
  // setInterval(updateHoldingsPrice, 60000) // 刷新价格
})
</script>

<template>
  <div class="trade-container">
    <!-- 交易面板 -->
    <el-card class="trade-panel">
      <template #header>
        <div class="text-xl font-bold">
          股票交易
        </div>
      </template>

      <el-form :model="form" label-width="100px">
        <el-form-item label="股票代码">
          <el-input
            v-model="form.symbol"
            placeholder="输入港股代码"
            @change="handleSymbolChange"
          />
        </el-form-item>

        <el-form-item label="股票名称">
          <span>{{ stockName }}</span>
        </el-form-item>

        <el-form-item label="买卖方向">
          <el-radio-group v-model="form.side">
            <el-radio-button label="BUY">
              买入
            </el-radio-button>
            <el-radio-button label="SELL">
              卖出
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="委托类型">
          <el-select
            v-model="form.orderType"
            placeholder="请选择委托类型"
            title="市价委托立即成交，限价委托需指定价格"
            @change="handleOrderTypeChange"
          >
            <el-option label="市价委托" value="MARKET" />
            <el-option label="限价委托" value="LIMIT" />
          </el-select>
          <div class="mt-1 text-xs text-gray-500">
            * 市价委托：按当前市场最优价立即成交
            <br>
            * 限价委托：设置期望成交价格等待匹配
          </div>
        </el-form-item>

        <el-form-item
          label="委托价格"
          :rules="priceRules"
          prop="price"
        >
          <el-input
            v-model="form.price"
            :disabled="form.orderType === 'MARKET'"
            :readonly="form.orderType === 'MARKET'"
            placeholder="市场价"
          />
        </el-form-item>

        <el-form-item v-if="form.orderType === 'LIMIT'" label="价格">
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

        <el-form-item :label="form.side === 'BUY' ? '成本' : '所得金额'">
          <span>{{ cost }}</span>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            :icon="Check"
            @click="submitOrder"
          >
            提交委托
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!--    股票持仓 -->
    <div class="data-container">
      <el-card class="data-panel holding-panel">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="text-xl font-bold">
              股票持仓
            </div>
            <div class="flex gap-4 text-sm">
              <div>
                总市值: <span class="font-mono">{{ totalMarketValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
              </div>
              <div :class="{ 'text-green-500': totalProfit >= 0, 'text-red-500': totalProfit < 0 }">
                浮动盈亏:
                <span class="font-mono">
                  {{ totalProfit >= 0 ? '+' : '' }}{{ totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}
                </span>
              </div>
              <div :class="{ 'text-green-500': totalProfitRatio >= 0, 'text-red-500': totalProfitRatio < 0 }">
                收益率:
                <span class="font-mono">
                  {{ totalProfitRatio >= 0 ? '+' : '' }}{{ totalProfitRatio.toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>
        </template>
        <el-table
          v-loading="loading"
          :data="holdingValues"
          stripe
          style="width: 100%"
          empty-text="暂无持仓数据"
        >
          <el-table-column
            prop="symbol"
            label="代码"
            width="90"
            fixed
          />
          <el-table-column
            prop="name"
            label="名称"
            min-width="80"
          />
          <el-table-column
            label="持仓/可用"
            width="120"
          >
            <template #default="{ row }">
              <div>{{ row.quantity.toLocaleString() }}</div>
              <div class="text-xs text-gray-500">
                {{ row.available.toLocaleString() }}可用
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="成本价"
            width="120"
          >
            <template #default="{ row }">
              {{ row.avgPrice.toFixed(2) }}
            </template>
          </el-table-column>

          <el-table-column
            label="现价"
            width="120"
          >
            <template #default="{ row }">
              {{ row.currentPrice.toFixed(2) }}
            </template>
          </el-table-column>

          <el-table-column
            label="盈亏"
            width="160"
          >
            <template #default="{ row }">
              <div class="flex flex-col">
                <span :class="{ 'text-green-500': row.profit >= 0, 'text-red-500': row.profit < 0 }">
                  {{ row.profit >= 0 ? '+' : '' }}{{ row.profit.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}
                </span>
                <span
                  class="text-xs"
                  :class="{ 'text-green-500': row.profitRatio >= 0, 'text-red-500': row.profitRatio < 0 }"
                >
                  {{ row.profitRatio >= 0 ? '+' : '' }}{{ row.profitRatio.toFixed(2) }}%
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            width="120"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                size="small"
                type="danger"
                plain
                :disabled="row.available <= 0"
                @click="handleSell(row.symbol)"
              >
                卖出
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 交易历史 -->
      <el-card class="data-panel history-panel">
        <template #header>
          <div class="text-xl font-bold">
            最近交易记录
          </div>
        </template>
        <el-table
          v-loading="loading"
          :data="tradeHistory"
          height="300"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="time"
            label="时间"
            sortable
            min-width="180"
          />
          <el-table-column
            prop="symbol"
            label="代码"
            min-width="120"
          />
          <el-table-column
            label="方向"
            min-width="120"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.side === 'BUY' ? 'success' : 'danger'"
                class="justify-center"
              >
                {{ row.side === 'BUY' ? '买入' : '卖出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="price"
            label="买入价"
            min-width="140"
          >
            <template #default="{ row }">
              {{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="数量"
            min-width="140"
          />
          <el-table-column
              label="总买入"
              min-width="140"
          >
            <template #default="{ row }">
              {{ (row.price * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.trade-container {
  @apply p-4 max-w-7xl mx-auto space-y-4;
}

.trade-panel {
  /* 交易面板样式 */
  @apply w-full;
  min-width: 400px;
}

.data-container {
  @apply flex flex-wrap gap-4;
  /* 兼容小屏幕下的堆叠效果 */
}

.data-panel {
  @apply flex-1;
  min-width: 400px; /* 保持最小宽度 */
  height: 520px; /* 统一高度 */
}

.holding-panel {
  /* 持仓面板弹性布局 */
  flex: 1.2; /* 持仓面板稍宽 */
  min-width: 550px;
}

.history-panel {
  /* 交易记录面板 */
  flex: 1;
  min-width: 450px;
}

/* 响应式处理 */
@media (max-width: 1400px) {
  .holding-panel {
    min-width: 480px;
  }

  .history-panel {
    min-width: 400px;
  }
}

@media (max-width: 1024px) {
  .data-panel {
    flex-basis: 100%; /* 小屏幕下垂直排列 */
    min-width: 100%;
    height: auto; /* 自动高度 */
  }
}

/* 统一表格高度 */
.el-table {
  height: calc(520px - 54px - 20px) !important; /* header高度 + 内边距 */
}

@media (max-width: 1024px) {
  .el-table {
    height: auto !important;
  }
}

/* 交易表单样式微调 */
:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  @apply font-medium text-gray-600;
}
</style>
