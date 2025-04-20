<script setup>
import { Check, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth.js'

const { userId } = useAuth()

const loading = ref(false)
const stockList = ref([])
const tradeHistory = ref([])

const form = ref({
  symbol: '600004',
  side: 'BUY',
  orderType: 'MARKET',
  price: 10,
  quantity: 100,
})
const cost = computed(() => {
  return (form.value.price || 0) * (form.value.quantity || 0)
})

const userHoldings = ref([])
/*
{
  symbol: "00001",      // 股票代码
  name: "长和",         // 股票名称
  quantity: 1000,       // 总持仓
  available: 800,       // 可用数量
  avgPrice: 42.5,       // 平均成本
  currentPrice: 41.9,   // 当前市价（实时更新）
  profit: -600          // 浮动盈亏
}
*/

// 计算持仓市值
const holdingValues = computed(() => {
  return userHoldings.value.map(holding => ({
    ...holding,
    marketValue: holding.currentPrice * holding.quantity,
    profitRatio: holding.avgPrice > 0
      ? ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100
      : 0,
  }))
})

// TODO
// 获取可交易股票列表
async function fetchStockList() {
  try {
    const response = await axios.get('/api/v1/market/stocks')
    if (response.data.code === 200) {
      stockList.value = response.data.data.map(stock => ({
        value: stock.stockCode,
        label: `${stock.stockName} (${stock.stockCode})`,
      }))
    }
  }
  catch (error) {
    console.error('获取股票列表失败:', error)
  }
}

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
      const pagination = {
        total: response.data.data.total,
        current: response.data.data.current,
        pageSize: response.data.data.size,
      }
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

    const availableQty = holding.quantity - holding.lockedQty
    if (form.value.quantity > availableQty) {
      ElMessage.warning(`可卖数量不足，当前可用：${availableQty}股`)
      return
    }
  }
  // 数量单位校验
  const currentStock = stockList.value.find(
    s => s.value === form.value.symbol,
  )
  if (form.value.quantity % (currentStock?.lotSize || 100) !== 0) {
    ElMessage.warning(`委托数量必须是${currentStock?.lotSize}的整数倍`)
    return
  }
  loading.value = true
  try {
    const orderData = {
      userId: userId.value,
      stockCode: form.value.symbol,
      type: form.value.side,
      quantity: form.value.quantity,
      price: form.value.orderType === 'LIMIT' ? form.value.price : 100,
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
    // console.log('错误详情:', error.response?.data)
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

// 获取股票实时价格
async function handleSymbolChange(symbol) {
  if (!symbol)
    return
  try {
    const response = await axios.get(`/api/v1/market/getstock/${symbol}`)
    if (response.data.code === 200) {
      form.value.price = response.data.data.price
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
          name: stockList.value.find(s => s.value === trade.symbol)?.label.split('(')[0] || trade.symbol,
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
        holding.totalCost = holding.totalPrice * holding.quantity + trade.price * trade.quantity
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
    if (response.data.code === 200) {
      userHoldings.value = userHoldings.value.map((holding) => {
        const realtimeData = response.data.data.find(
          s => s.stockCode === holding.symbol,
        )
        const currentPrice = realtimeData?.lastPrice || holding.currentPrice
        return {
          ...holding,
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

// 初始化加载
onMounted(() => {
  fetchStockList()
  fetchTradeHistory()
  fetchUserHoldings()
  // setInterval(updateHoldingsPrice, 10000) // 每10秒刷新价格
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
          <el-select
            v-model="form.symbol"
            filterable
            placeholder="输入股票代码"
            :loading="!stockList.length"
            @change="handleSymbolChange"
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
            placeholder="自动生成市场价"
          >
            <template v-if="form.orderType === 'MARKET'" #append>
              <el-tooltip content="点击刷新价格">
                <el-icon @click="refreshMarketPrice">
                  <!-- icon -->
                  <Refresh />
                </el-icon>
              </el-tooltip>
            </template>
          </el-input>
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

        <el-form-item label="成本">
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
          <div class="text-xl font-bold">
            股票持仓
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
            width="100"
            fixed
          />
          <el-table-column
            prop="name"
            label="名称"
            min-width="120"
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
            label="价格"
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
