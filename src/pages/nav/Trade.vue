<script setup>
import { Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useTrade } from '~/composables/useTrade'
import request from '~/utils/request'

const { userId } = useAuth()
const { loading: submitting, submitOrder } = useTrade()

// 响应式数据
const stockList = ref([])
const tradeHistory = ref([])
const currentMarketPrice = ref(100.00)
const priceInterval = ref(null)

const form = ref({
  symbol: '600004',
  side: 'BUY',
  orderType: 'MARKET',
  price: null,
  quantity: 100,
})

// 计算属性
const isMarketOrder = computed(() => form.value.orderType === 'MARKET')
const priceRules = computed(() => [
  {
    required: !isMarketOrder.value,
    message: '限价委托必须输入价格',
    trigger: 'blur',
  },
  {
    validator: (_, value) => value > 0,
    message: '价格必须大于0',
    trigger: ['blur', 'change'],
  },
])

// 数据获取
async function fetchInitialData() {
  try {
    // const [stocks, history] = await Promise.all([
    // request.get('/market/stocks'),
    //   request.get('/trade/history', {
    //     params: {
    //       page: 0,
    //       size: 10,
    //       userId: userId.value,
    //     },
    //   }),
    // ])
    //
    // stockList.value = stocks.map(s => ({
    //   value: s.stockCode,
    //   label: `${s.stockName} (${s.stockCode})`,
    // }))
    const history = await Promise.all([
      request.get('/trade/history', {
        params: {
          page: 0,
          size: 10,
          userId: userId.value,
        },
      }),
    ])

    tradeHistory.value = history.records.map(record => ({
      ...record,
      price: Number(record.price),
      time: record.createdAt,
    }))
  }
  catch (error) {
    ElMessage.error('初始化数据加载失败')
  }
}

// 价格处理
function generateMarketPrice() {
  const fluctuation = currentMarketPrice.value * 0.02
  return Number(
    (currentMarketPrice.value + (Math.random() * fluctuation * 2 - fluctuation))
      .toFixed(2),
  )
}

function updateMarketPrice() {
  if (isMarketOrder.value) {
    form.value.price = generateMarketPrice()
  }
}

// 事件处理
async function handleSymbolChange(symbol) {
  if (!symbol)
    return

  try {
    const { price } = await request.get(`/market/stocks/${symbol}/price`)
    currentMarketPrice.value = price
    updateMarketPrice()
  }
  catch {
    ElMessage.error('获取实时价格失败')
  }
}

async function handleSubmit() {
  if (!form.value.symbol) {
    return ElMessage.warning('请选择交易股票')
  }

  try {
    await submitOrder({
      userId: userId.value,
      stockCode: form.value.symbol,
      type: form.value.side,
      quantity: form.value.quantity,
      price: isMarketOrder.value ? currentMarketPrice.value : form.value.price,
      orderType: form.value.orderType,
    })

    ElMessage.success('委托提交成功')
    await fetchInitialData()
  }
  catch (error) {
    ElMessage.error(error.message || '提交委托失败')
  }
}

// 生命周期
onMounted(() => {
  fetchInitialData()
  priceInterval.value = setInterval(updateMarketPrice, 5000)
})

onBeforeUnmount(() => {
  clearInterval(priceInterval.value)
})
</script>

<template>
  <div class="mx-auto max-w-2xl p-4 space-y-4">
    <el-card>
      <template #header>
        <h2 class="text-xl font-bold">
          股票交易
        </h2>
      </template>

      <el-form :model="form" label-width="100px" @submit.prevent="handleSubmit">
        <!-- 优化后的表单结构 -->
        <el-form-item label="股票代码" prop="symbol" required>
          <el-select
            v-model="form.symbol"
            filterable
            placeholder="输入股票代码"
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

        <el-form-item label="委托类型">
          <el-select
            v-model="form.orderType"
            class="w-full"
            @change="updateMarketPrice"
          >
            <el-option label="市价委托" value="MARKET" />
            <el-option label="限价委托" value="LIMIT" />
          </el-select>
        </el-form-item>

        <el-form-item :label="`${isMarketOrder ? '市价' : '限价'}委托`" prop="price" :rules="priceRules">
          <el-input-number
            v-model="form.price"
            :precision="2"
            :min="0.01"
            :disabled="isMarketOrder"
            class="w-full"
          >
            <template v-if="isMarketOrder" #append>
              <el-icon title="刷新价格" @click="updateMarketPrice">
                <Refresh />
              </el-icon>
            </template>
          </el-input-number>
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
            native-type="submit"
            :loading="submitting"
            :icon="Check"
          >
            提交委托
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 交易历史 -->
    <el-card class="history-card mx-auto mt-4 max-w-2xl">
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
