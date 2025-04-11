<script setup>
import {Check} from '@element-plus/icons-vue'
import axios from 'axios'
import {ElMessage} from 'element-plus'
import {computed, onMounted, ref} from 'vue'
import {useAuth} from '~/composables/useAuth.js'

const {userId} = useAuth()

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

let cost = computed(() => {
  return (form.value.price || 0) * (form.value.quantity || 0)
})

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
        size: 10,
        userId: userId.value,
      },
    })
    if (response.data.code === 200) {
      tradeHistory.value = response.data.data.records.map(record => ({
        time: record.createdAt,
        // 使用股票ID作为值
        symbol: record.stockId,
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
      userId: userId.value, // 确保解包 ref
      stockCode: form.value.symbol,
      type: form.value.side,
      quantity: form.value.quantity,
      price: form.value.orderType === 'LIMIT' ? form.value.price : 100, // 根据接口需求调整
      orderType: form.value.orderType,
    }

    // console.log('提交数据:', JSON.stringify(orderData)) // 调试日志

    const response = await axios.post('/api/v1/trade/order', orderData)
    if (response.data.code === 200) {
      ElMessage.success('委托提交成功')
      // 刷新交易历史
      await fetchTradeHistory()
    }
  } catch (error) {
    console.error('提交委托失败:', error)
    // console.log('错误详情:', error.response?.data)
    ElMessage.error(
        error.response?.data?.message
            ? String(error.response.data.message)
            : '提交委托失败',
    )
  } finally {
    loading.value = false
  }
}

// 获取股票实时价格
async function handleSymbolChange(symbol) {
  if (!symbol)
    return

  try {
    const response = await axios.get(`/api/v1/market/stocks/${symbol}/price`)
    if (response.data.code === 200) {
      form.value.price = response.data.data.price
    }
  } catch (error) {
    console.error('获取股票价格失败:', error)
  }
}

const refreshMarketPrice = () => {
  // 刷新价格
  console.log('刷新市场价格');
}

// 初始化加载
onMounted(() => {
  fetchStockList()
  fetchTradeHistory()
})
</script>

<template>
  <div class="trade-container">
    <el-card class="mx-auto max-w-2xl">
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
            <el-option label="市价委托" value="MARKET"/>
            <el-option label="限价委托" value="LIMIT"/>
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
                  <Refresh/>
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
</template>
