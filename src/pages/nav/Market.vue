<script setup>
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElLoading, ElMessage } from 'element-plus'
import { dispose, init } from 'klinecharts'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const chart = shallowRef(null)
const ws = shallowRef(null)
const selectedSymbol = ref('AAPL') // 当前展示的股票代码
const indicator = ref('') // 添加缺失的indicator变量
const realtimeData = ref([]) // 添加缺失的realtimeData变量
const isConnected = ref(false) // 添加连接状态变量
const useTestData = ref(true) // 是否使用测试数据
const searchInput = ref('') // 搜索输入
const stockOptions = ref([]) // 可选股票列表
const isLoadingStocks = ref(false) // 加载股票列表状态

// 从后端获取股票列表
async function fetchStockList() {
  isLoadingStocks.value = true
  try {
    // 显示加载动画
    const loadingInstance = ElLoading.service({
      target: '.stock-search-container',
      text: '加载股票列表...',
    })

    // 从后端API获取股票列表
    const response = await axios.get('/api/v1/stocks')

    // 处理响应数据
    if (response.data && Array.isArray(response.data.stocks)) {
      stockOptions.value = response.data.stocks
    }
    else {
      // 如果API返回格式不符合预期，使用默认数据
      console.warn('后端返回的股票数据格式不符合预期，使用默认数据')
      stockOptions.value = getDefaultStocks()
    }

    loadingInstance.close()
  }
  catch (error) {
    console.error('获取股票列表失败:', error)
    ElMessage.error('获取股票列表失败，使用默认数据')
    // 加载失败时使用默认数据
    stockOptions.value = getDefaultStocks()
  }
  finally {
    isLoadingStocks.value = false
  }
}

// 默认股票数据（当API请求失败时使用）
function getDefaultStocks() {
  return [
    { value: 'AAPL', label: '苹果 (AAPL)', market: '纳斯达克', industry: '科技' },
    { value: 'MSFT', label: '微软 (MSFT)', market: '纳斯达克', industry: '科技' },
    { value: 'GOOGL', label: '谷歌 (GOOGL)', market: '纳斯达克', industry: '科技' },
    { value: 'AMZN', label: '亚马逊 (AMZN)', market: '纳斯达克', industry: '电商' },
    { value: 'TSLA', label: '特斯拉 (TSLA)', market: '纳斯达克', industry: '汽车' },
  ]
}

// 搜索过滤
function filterStocks(queryString) {
  if (queryString) {
    const lowercaseQuery = queryString.toLowerCase()
    return stockOptions.value.filter(
      stock => stock.value.toLowerCase().includes(lowercaseQuery)
        || stock.label.toLowerCase().includes(lowercaseQuery)
        || (stock.industry && stock.industry.toLowerCase().includes(lowercaseQuery))
        || (stock.market && stock.market.toLowerCase().includes(lowercaseQuery)),
    )
  }
  return stockOptions.value
}

// 处理搜索结果
function handleSelect(item) {
  if (typeof item === 'string') {
    // 如果直接输入了股票代码
    const stock = stockOptions.value.find(s => s.value === item.toUpperCase())
    if (stock) {
      switchStock(stock.value)
    }
  }
  else {
    // 如果选择了下拉菜单中的项目
    switchStock(item.value)
  }
  searchInput.value = '' // 清空搜索框
}

// 远程搜索处理
function querySearch(queryString, cb) {
  const results = filterStocks(queryString)
  cb(results)
}

// 获取当前股票名称
const currentStockName = computed(() => {
  const stock = stockOptions.value.find(s => s.value === selectedSymbol.value)
  return stock ? stock.label : selectedSymbol.value
})

// 获取当前股票信息
const currentStockInfo = computed(() => {
  const stock = stockOptions.value.find(s => s.value === selectedSymbol.value)
  return stock && stock.market ? `${stock.market} | ${stock.industry}` : ''
})

let reconnectAttempts = 0
let reconnectTimer = null

// 创建WebSocket连接
function createWebSocketConnection() {
  try {
    // 关闭现有连接
    if (ws.value && ws.value.readyState !== WebSocket.CLOSED) {
      ws.value.close()
    }
    // 创建新连接
    ws.value = new WebSocket(`ws://${window.location.host}/ws/v1/market/subscribe`)

    // 二进制传输格式
    ws.value.binaryType = 'arraybuffer'

    ws.value.onopen = () => {
      console.log('WebSocket连接已建立')
      isConnected.value = true
      reconnectAttempts = 0 // 重置重连计数

      // 增加心跳检测机制
      setInterval(() => {
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
          ws.value.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)

      // 设置数据模式
      setDataMode(useTestData.value)

      // 订阅股票数据
      subscribeToStock(selectedSymbol.value)
    }

    ws.value.onmessage = ({ data }) => {
      try {
        let payload

        // 处理不同类型的数据
        if (data instanceof ArrayBuffer) {
          const decoder = new TextDecoder()
          const jsonStr = decoder.decode(data)
          payload = JSON.parse(jsonStr)
        }
        else {
          payload = JSON.parse(data)
        }

        // 只处理当前选中的股票
        const targetData = payload[selectedSymbol.value]
        if (!targetData)
          return

        // 更新图表数据
        updateChartData({
          timestamp: targetData.timestamp,
          open: +targetData.open.toFixed(2),
          close: +targetData.close.toFixed(2),
          high: +targetData.high.toFixed(2),
          low: +targetData.low.toFixed(2),
          volume: targetData.volume,
        })

        // 更新实时数据表格
        realtimeData.value.unshift({
          time: new Date(targetData.timestamp).toLocaleTimeString(),
          price: targetData.close.toFixed(2),
          volume: targetData.volume,
        })

        // 限制表格数据量
        if (realtimeData.value.length > 10) {
          realtimeData.value = realtimeData.value.slice(0, 10)
        }
      }
      catch (error) {
        console.error('处理WebSocket消息时出错:', error)
      }
    }

    ws.value.onclose = (event) => {
      isConnected.value = false

      // 尝试重连
      if (reconnectAttempts < 5) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000)

        reconnectTimer = setTimeout(() => {
          reconnectAttempts++
          createWebSocketConnection()
        }, delay)
      }
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }
  }
  catch (error) {
    console.error('创建WebSocket连接时出错:', error)
  }
}

// 设置数据模式
function setDataMode(useTestData) {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    const message = {
      action: 'setDataMode',
      useTestData,
    }
    ws.value.send(JSON.stringify(message))
  }
}

// 切换数据模式
function toggleDataMode() {
  useTestData.value = !useTestData.value
  const newMode = useTestData.value
  setDataMode(newMode)
}

// 订阅股票数据
function subscribeToStock(symbol) {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    const subscription = {
      action: 'subscribe',
      stock_codes: [symbol],
    }
    ws.value.send(JSON.stringify(subscription))
  }
}

// 切换股票时的处理
function switchStock(symbol) {
  if (symbol === selectedSymbol.value)
    return

  selectedSymbol.value = symbol
  // 清空当前数据
  realtimeData.value = []

  // 重新初始化图表
  dispose('chart-container')
  setTimeout(() => {
    initChart()
  }, 100)

  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    // 取消订阅当前股票
    const msg = {
      action: 'unsubscribe',
      stock_codes: [selectedSymbol.value],
    }
    ws.value.send(JSON.stringify(msg))

    // 订阅新股票
    subscribeToStock(symbol)
  }
}

function updateChartData(kLine) {
  if (!chart.value)
    return

  // 添加时区转换逻辑（根据需要）
  const adjustedTimestamp = kLine.timestamp /* + 时区偏移量 */

  chart.value.updateData({
    ...kLine,
    timestamp: adjustedTimestamp,
    turnover: kLine.volume * kLine.close,
  })
}

// 初始化图表并设置基本配置
function initChart() {
  // 确保容器存在
  const container = document.getElementById('chart-container')
  if (!container) {
    console.error('找不到图表容器')
    return
  }

  // 初始化图表
  chart.value = init('chart-container')

  // 设置图表样式
  chart.value.setStyles({
    grid: {
      show: true,
      horizontal: {
        show: true,
        size: 1,
        color: '#EDEDED',
        style: 'solid',
      },
      vertical: {
        show: true,
        size: 1,
        color: '#EDEDED',
        style: 'solid',
      },
    },
    candle: {
      type: 'candle_solid',
      bar: {
        upColor: '#26A69A',
        downColor: '#EF5350',
        noChangeColor: '#888888',
      },
      area: {
        lineSize: 2,
        lineColor: '#2196F3',
        value: 'close',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
      },
    },
  })

  // 创建一些初始数据，以便图表能够显示
  const timestamp = Date.now()
  const basePrice = getBasePrice(selectedSymbol.value)

  const initialData = []
  for (let i = 0; i < 20; i++) {
    const time = timestamp - (20 - i) * 60 * 1000
    const open = basePrice + Math.random() * 5 - 2.5
    const close = basePrice + Math.random() * 5 - 2.5
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2

    initialData.push({
      timestamp: time,
      open,
      high,
      low,
      close,
      volume: 10000 + Math.random() * 5000,
      turnover: (10000 + Math.random() * 5000) * close,
    })
  }

  // 设置初始数据
  chart.value.applyNewData(initialData)

  // 添加技术指标
  if (indicator.value) {
    addIndicator(indicator.value)
  }
}

// 根据股票代码获取基础价格
function getBasePrice(symbol) {
  const priceMap = {
    AAPL: 185,
    MSFT: 420,
    GOOGL: 170,
    AMZN: 180,
    TSLA: 250,
    META: 500,
    NVDA: 120,
    NFLX: 630,
    PYPL: 65,
    INTC: 35,
    AMD: 160,
    BABA: 85,
    BIDU: 105,
    JD: 28,
    PDD: 140,
    NIO: 5,
    XPEV: 8,
    LI: 35,
    JPM: 195,
    V: 275,
    MA: 450,
    DIS: 90,
    KO: 60,
    PEP: 170,
  }

  return priceMap[symbol] || 100 // 默认价格为100
}

// 添加技术指标
function addIndicator(type) {
  if (!chart.value)
    return

  // 移除现有指标
  const panes = chart.value.getPanes()
  panes.forEach((pane) => {
    if (pane.id !== 'candle_pane') {
      chart.value.removePane(pane.id)
    }
  })

  // 添加新指标
  switch (type) {
    case 'macd':
      chart.value.createIndicator('MACD', false, { id: 'macd_pane' })
      break
    case 'rsi':
      chart.value.createIndicator('RSI', false, { id: 'rsi_pane' })
      break
    case 'boll':
      chart.value.createIndicator('BOLL', true)
      break
    default:
      break
  }
}

// 监听指标变化
watch(indicator, (newValue) => {
  if (newValue) {
    addIndicator(newValue)
  }
})

// 从URL参数获取股票代码
onMounted(async () => {
  // 获取股票列表
  await fetchStockList()

  // 检查URL参数
  const codeParam = route.query.code
  if (codeParam && typeof codeParam === 'string') {
    selectedSymbol.value = codeParam
  }

  // 初始化图表
  initChart()

  // 创建WebSocket连接
  createWebSocketConnection()
})

onUnmounted(() => {
  dispose('chart-container')

  // 清除重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }

  // 关闭WebSocket连接
  if (ws.value) {
    // 发送取消订阅请求
    if (ws.value.readyState === WebSocket.OPEN) {
      const unsubscribe = {
        action: 'unsubscribe',
        stock_codes: [selectedSymbol.value],
      }
      ws.value.send(JSON.stringify(unsubscribe))
    }
    ws.value.close()
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- 连接状态指示器 -->
    <div class="mx-auto flex items-center justify-end px-4 py-2 container">
      <span class="mr-2 text-gray-600">WebSocket状态:</span>
      <el-tag :type="isConnected ? 'success' : 'danger'" size="small">
        {{ isConnected ? '已连接' : '未连接' }}
      </el-tag>
    </div>

    <div class="flex-grow p-4">
      <!-- 搜索股票 -->
      <div class="stock-search-container mb-4">
        <el-card v-loading="isLoadingStocks">
          <div class="flex flex-col md:flex-row md:items-center">
            <div class="flex-1">
              <div class="mb-2 text-xl font-bold">
                {{ currentStockName }}
              </div>
              <div class="text-gray-500">
                {{ currentStockInfo }}
              </div>
            </div>
            <div class="mt-3 flex items-center md:ml-4 md:mt-0">
              <span class="mr-2 font-medium">搜索股票:</span>
              <el-autocomplete
                v-model="searchInput"
                :fetch-suggestions="querySearch"
                placeholder="输入股票代码、名称、行业或市场"
                style="width: 300px"
                :trigger-on-focus="true"
                clearable
                :disabled="isLoadingStocks"
                @select="handleSelect"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #default="{ item }">
                  <div class="flex flex-col">
                    <div class="flex items-center justify-between">
                      <span class="font-medium">{{ item.label }}</span>
                      <el-tag size="small" type="info">
                        {{ item.value }}
                      </el-tag>
                    </div>
                    <div v-if="item.market" class="mt-1 text-xs text-gray-500">
                      {{ item.market }} | {{ item.industry }}
                    </div>
                  </div>
                </template>
              </el-autocomplete>
            </div>
          </div>
        </el-card>
      </div>

      <!-- K线图容器 -->
      <div class="chart-wrapper mb-4">
        <div id="chart-container" />
      </div>

      <el-row :gutter="20" class="mt-4">
        <el-col :span="8">
          <el-card>
            <template #header>
              <div class="font-bold">
                指标选择
              </div>
            </template>
            <el-select v-model="indicator" placeholder="选择技术指标">
              <el-option label="MACD" value="macd" />
              <el-option label="RSI" value="rsi" />
              <el-option label="布林带" value="boll" />
            </el-select>
          </el-card>
        </el-col>

        <el-col :span="16">
          <el-card>
            <template #header>
              <div class="font-bold">
                实时数据
              </div>
            </template>
            <el-table :data="realtimeData" height="200">
              <el-table-column prop="time" label="时间" />
              <el-table-column prop="price" label="价格" />
              <el-table-column prop="volume" label="成交量" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style>
/* 自定义图表工具提示 */
.tv-lightweight-charts {
  --tooltip-background: rgba(26, 29, 36, 0.9);
  --tooltip-border-color: #2b2f3a;
}

/* 确保图表容器有足够的高度和宽度 */
#chart-container {
  width: 100%;
  height: 600px;
  margin: 0 auto;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  overflow: hidden;
}

/* 修复可能的布局问题 */
.min-h-screen {
  min-height: 100vh;
}

.flex-grow {
  flex-grow: 1;
}

/* 股票搜索容器 */
.stock-search-container {
  position: relative;
  min-height: 100px;
}
</style>
