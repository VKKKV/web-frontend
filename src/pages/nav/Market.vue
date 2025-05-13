<script setup>
import axios from 'axios'
import dayjsBase from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import isoWeekYear from 'dayjs/plugin/isoWeeksInYear'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { ElMessage } from 'element-plus'
import { dispose, init } from 'klinecharts'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { chartStyles } from '~/composables/chartStyles'
// 扩展插件（只需要执行一次）
dayjsBase.extend(isoWeek)
dayjsBase.extend(isoWeekYear)
dayjsBase.extend(utc)
dayjsBase.extend(timezone)
// 创建带中国时区的dayjs实例
const myDayjs = timestamp => dayjsBase(timestamp).utcOffset(8)
const route = useRoute()
const chart = shallowRef(null)
const ws = shallowRef(null)
const selectedSymbol = ref('00001') // 当前展示的股票代码
const searchInput = ref('') // 搜索输入
const isLoadingStocks = ref(false) // 加载股票列表状态
const currentChartType = ref('day') // 默认显示日K
const chartLoading = ref(false)
const chartError = ref(false)
const currentStockName = ref()
const currentStockCode = ref()
const klineLoading = ref(false)
const styles = chartStyles
let initialData = []
const realtimeData = ref([])
const wsReconnectDelay = 5000 // 5 seconds for reconnection attempts
let wsReconnectTimer = null

// 安全数值转换逻辑
function safeParse(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

// 监听股票代码变化
watch(currentStockCode, async (newVal) => {
  if (newVal) {
    await loadChartData()
  }
})

// 处理菜单切换
function handleChartTypeChange(type) {
  currentChartType.value = type
}

// 加载数据逻辑
async function loadChartData() {
  try {
    chartLoading.value = true
    chartError.value = false

    const fetchMap = {
      'time': fetchTimeData,
      'day': fetchDayKLine,
      '5day': fetchFiveDayKLine,
      'week': fetchWeekKLine,
      'year': fetchYearKLine,
    }

    const fetchMethod = fetchMap[currentChartType.value]
    const klineData = await fetchMethod(currentStockCode.value)

    // 根据图表类型设置特定样式
    if (chart.value) { // 确保 chart 实例存在
      const specificStyles = JSON.parse(JSON.stringify(styles))
      if (currentChartType.value === 'time') {
        specificStyles.candle.type = 'area'
        // 自定义分时图 tooltip
        specificStyles.candle.tooltip.custom = [
          { title: '时间', value: '{time}' }, // klinecharts 会根据 timestamp 格式化
          { title: '价格', value: '{close}' },
          { title: '成交量', value: '{volume}' },
        ]
        specificStyles.yAxis.type = 'normal' // 分时图Y轴通常为普通类型
      }
      else {
        // 恢复为默认K线样式
        specificStyles.candle.type = styles.candle.type || 'candle_solid'
        specificStyles.candle.tooltip.custom = styles.candle.tooltip.custom // 恢复默认tooltip
        specificStyles.yAxis.type = styles.yAxis.type || 'normal' // 恢复默认Y轴类型
      }
      chart.value.setStyles(specificStyles)
    }

    chart.value.applyNewData(klineData)
  }
  catch (err) {
    chartError.value = true
    ElMessage.error('图表加载失败:', err)
  }
  finally {
    chartLoading.value = false
  }
}

// 监听图表类型变化
watch(currentChartType, loadChartData)

// 新增防抖函数
function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 修改后的输入处理逻辑
const handleCodeInput = debounce(async (value) => {
  if (!value) {
    currentStockCode.value = ''
    currentStockName.value = '未选择股票'
    initialData.value = []
    return
  }
  try {
    isLoadingStocks.value = true

    // 这里可以添加股票代码格式校验
    if (!/^(?:\d{5}|HSI)$/i.test(value)) {
      ElMessage.warning('请输入5位数字股票代码')
      return
    }
    currentStockCode.value = value.toUpperCase()
    // 如果是HSI，直接设置名称，否则查询
    if (currentStockCode.value === 'HSI') {
      currentStockName.value = '恒生指数'
    }
    else {
      currentStockName.value = await fetchStockName(currentStockCode.value)
    }
    await loadChartData()
    await fetchStocks()
  }
  catch (err) {
    ElMessage.error(`加载失败: ${err.message}`)
  }
  finally {
    isLoadingStocks.value = false
  }
}, 500)

// 使用安全字符过滤
function sanitizeName(name) {
  if (!name)
    return ''
  return name.replace(/[<>&"']/g, '') // 过滤特殊字符防止XSS
}

// 安全类型转换
// 数据清洗与转换
const safeParseFloat = v => Number.isFinite(+v) ? +v : 0
const safeParseInt = v => Math.abs(Number.parseInt(v)) || 0

async function fetchStocks() {
  if (!searchInput.value.trim())
    return
  try {
    const response = await axios.get(
      `http://localhost:8080/api/v1/market/getstock/${searchInput.value}`,
    )
    console.error(response)
    // 对API返回的数据进行转换，以确保字段统一和数据类型正确
    realtimeData.value = response.data.map(stock => ({
      ...stock, // 保留原始API返回的其他字段
      stock_code: stock.stockCode, // 将 stockCode 映射为 stock_code
      name: stock.name, // 确保 name 字段存在
      price: safeParseFloat(stock.price),
      lastPrice: safeParseFloat(stock.lastPrice),
      openPrice: safeParseFloat(stock.openPrice),
      high: safeParseFloat(stock.high),
      low: safeParseFloat(stock.low),
      volume: safeParseInt(stock.amount),
      time: stock.time, // Assuming backend sends time
    }))
  }
  catch (err) {
    ElMessage.error(err.response?.data || '服务异常')
  }
}

async function fetchStockName(stockCode) {
  // 新增参数验证环节
  if (!stockCode || typeof stockCode !== 'string') {
    ElMessage.error('股票代码参数不合法')
    return ''
  }

  try {
    const encodedCode = encodeURIComponent(stockCode)
    const response = await axios.get(
      `http://localhost:8080/api/v1/market/getstock/${encodedCode}`,
    )

    // 优化数据校验逻辑
    const isValidResponse = Array.isArray(response?.data)
      && response.data.length > 0
      && response.data[0]?.stockCode === stockCode

    if (!isValidResponse) {
      ElMessage.warning('接口返回数据异常', response.data)
      return ''
    }
    return sanitizeName(response.data[0].name) || ''
  }
  catch (err) {
    // 分级错误处理
    const errorType = err.code === 'ECONNABORTED'
      ? '请求超时'
      : err.response
        ? `服务器错误 (${err.response.status})`
        : '网络异常'
    ElMessage.error(`股票名称查询失败(${errorType})`, err)
    return ''
  }
}

async function fetchTimeData(stockCode) {
  if (!stockCode) {
    ElMessage.error('股票代码不能为空')
    return []
  }
  try {
    chartLoading.value = true
    const response = await axios.get(
      `http://localhost:8080/api/v1/market/timekline/${encodeURIComponent(stockCode)}`,
    )

    const responseData = response.data[0]
    const { date, timeValues } = responseData
    const year = date.substring(0, 4)
    const month = date.substring(4, 6) // dayjs 月份是 1-indexed
    const dayOfMonth = date.substring(6, 8)

    const formattedData = timeValues.map((item) => {
      const hour = item.time.substring(0, 2)
      const minute = item.time.substring(2, 4)
      const dateTimeString = `${year}-${month}-${dayOfMonth} ${hour}:${minute}:00`
      // 将北京时间字符串解析为 UTC 时间戳
      const timestamp = dayjsBase.tz(dateTimeString, 'Asia/Shanghai').valueOf()
      const price = Number.parseFloat(item.price)
      const volume = Number.parseInt(item.volume, 10)

      return {
        timestamp,
        open: price,
        high: price,
        low: price,
        close: price,
        volume,
      }
    })

    formattedData.sort((a, b) => a.timestamp - b.timestamp)
    initialData = formattedData // 更新 initialData
    return formattedData
  }
  catch (err) {
    ElMessage.error(`加载分时数据失败: ${err.message || '未知错误'}`)
    return []
  }
  finally {
    chartLoading.value = false
  }
}

async function fetchKLineData(stockCode) {
  if (!stockCode) {
    ElMessage.error('股票代码不能为空')
    return []
  }
  try {
    klineLoading.value = true
    const response = await axios.get(
      `http://localhost:5000/daykline/${encodeURIComponent(stockCode)}`,
    )
    const rawData = response.data.data?.[stockCode] || []

    // 数据处理流水线
    const processedData = rawData.map((item) => {
      const [dateStr, open, close, high, low, volume] = item
      const parseDate = (dateStr) => {
        const datePatterns = [
          'yyyy-MM-dd', // 常规格式
        ]
        let timestamp = Date.parse(dateStr)
        // 尝试多种格式解析
        if (Number.isNaN(timestamp)) {
          for (const pattern of datePatterns) {
            const fmtDate = window.dayjs(dateStr, pattern)
            if (fmtDate.isValid()) {
              timestamp = fmtDate.valueOf()
              break
            }
          }
        }
        return timestamp || Date.now()
      }
      return {
        open: safeParse(open),
        high: safeParse(high),
        low: safeParse(low),
        close: safeParse(close),
        volume: safeParse(volume),
        timestamp: parseDate(dateStr),
      }
    }).filter(Boolean) // 过滤无效数据

    // 按时间升序排列
    processedData.sort((a, b) => a.timestamp - b.timestamp)
    return processedData
  }
  catch (err) {
    // 异常处理
    const errorMessage = err.response
      ? `服务器错误 (${err.response.status})`
      : err.message.includes('Network')
        ? '网络连接异常'
        : '数据解析失败'
    ElMessage.error(`K线数据加载失败：${errorMessage}`)
    return []
  }
  finally {
    klineLoading.value = false
  }
}

async function fetchDayKLine(stockCode) {
  const processedData = await fetchKLineData(stockCode)
  initialData = processedData
  return processedData
}

// 五日K线 (fetchFiveDayKLine):
//
// 每5个交易日作为一个周期
// 开盘价取周期第一个交易日的开盘价
// 收盘价取周期最后一个交易日的收盘价
// 最高价取周期内所有交易日的最高价
// 最低价取周期内所有交易日的最低价
// 成交量取周期内所有交易日的总和
async function fetchFiveDayKLine(stockCode) {
  const dayData = await fetchKLineData(stockCode)
  if (!dayData.length)
    return []
  const fiveDayData = []
  let tempData = []

  // 按照5天一个周期分组
  for (let i = 0; i < dayData.length; i++) {
    tempData.push(dayData[i])

    if (tempData.length === 5 || i === dayData.length - 1) {
      const open = tempData[0].open
      const close = tempData[tempData.length - 1].close
      const high = Math.max(...tempData.map(item => item.high))
      const low = Math.min(...tempData.map(item => item.low))
      const volume = tempData.reduce((sum, item) => sum + item.volume, 0)
      const timestamp = tempData[0].timestamp

      fiveDayData.push({ open, high, low, close, volume, timestamp })
      tempData = []
    }
  }
  initialData = fiveDayData
  return fiveDayData
}

// 周K线 (fetchWeekKLine):
//
// 使用ISO周标准（周一为一周的第一天）
// 按照每年的周数进行分组
// 开盘价取周第一个交易日的开盘价
// 收盘价取周最后一个交易日的收盘价
// 其他指标计算方式与五日K线类似
function getYearWeekKey(timestamp) {
  // ISO标准处理跨年周
  const date = myDayjs(timestamp)
  return `${date.isoWeekYear()}-W${date.isoWeek().toString().padStart(2, '0')}`
}

async function fetchWeekKLine(stockCode) {
  try {
    const dayData = await fetchKLineData(stockCode)
    if (!dayData?.length)
      return []

    const weekGroups = new Map()

    // 生成周分组（保留时间顺序）
    dayData.sort((a, b) => a.timestamp - b.timestamp)
      .forEach((item) => {
        const weekKey = getYearWeekKey(item.timestamp)

        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, [])
        }
        weekGroups.get(weekKey).push(item)
      })

    // 转换为周K线数据
    const weekData = Array.from(weekGroups.values())
      .filter(group => group.length > 0)
      .map(group => ({
        open: group[0].open,
        close: group[group.length - 1].close,
        high: Math.max(...group.map(i => i.high)),
        low: Math.min(...group.map(i => i.low)),
        volume: group.reduce((sum, i) => sum + i.volume, 0),
        timestamp: group[0].timestamp,
      }))
    initialData = weekData
    return weekData
  }
  catch (error) {
    ElMessage.error('周K线处理异常:', {
      stockCode,
      error: error.message,
      stack: error.stack,
    })
    return []
  }
}

// 年K线 (fetchYearKLine):
//
// 按照年份分组
// 开盘价取年第一个交易日的开盘价
// 收盘价取年最后一个交易日的收盘价
// 其他指标计算方式与五日K线类似
async function fetchYearKLine(stockCode) {
  const dayData = await fetchKLineData(stockCode)
  if (!dayData.length)
    return []
  const yearData = []
  let currentYear = null
  let tempYearData = []

  // 确保按时间排序
  dayData.sort((a, b) => a.timestamp - b.timestamp)

  // 按照年分组
  for (const item of dayData) {
    const year = new Date(item.timestamp).getFullYear()

    if (year !== currentYear) {
      if (tempYearData.length > 0) {
        const open = tempYearData[0].open
        const close = tempYearData[tempYearData.length - 1].close
        const high = Math.max(...tempYearData.map(d => d.high))
        const low = Math.min(...tempYearData.map(d => d.low))
        const volume = tempYearData.reduce((sum, d) => sum + d.volume, 0)
        const timestamp = tempYearData[0].timestamp

        yearData.push({ open, high, low, close, volume, timestamp })
      }
      tempYearData = [item]
      currentYear = year
    }
    else {
      tempYearData.push(item)
    }
  }

  // 处理最后一年数据
  if (tempYearData.length > 0) {
    const open = tempYearData[0].open
    const close = tempYearData[tempYearData.length - 1].close
    const high = Math.max(...tempYearData.map(item => item.high))
    const low = Math.min(...tempYearData.map(item => item.low))
    const volume = tempYearData.reduce((sum, item) => sum + item.volume, 0)
    const timestamp = tempYearData[0].timestamp

    yearData.push({ open, high, low, close, volume, timestamp })
  }
  initialData = yearData
  return yearData
}

// 初始化图表并设置基本配置
function initChart() {
  const container = document.getElementById('chart-container')
  if (!container) {
    ElMessage.error('找不到图表容器')
    return
  }
  chart.value = init('chart-container')
  const emptyInitialData = [] // 初始化时使用空数据，由 loadChartData 加载
  chart.value.applyNewData(emptyInitialData)
}

function connectWebSocket() {
  if (ws.value && (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING))
    return

  ws.value = new WebSocket('ws://localhost:8080/ws/v1/market/subscribe')

  ws.value.onopen = () => {
    ElMessage.success('实时数据连接成功!')
    console.log('WebSocket connected')
    // Clear any reconnection timer
    if (wsReconnectTimer) {
      clearTimeout(wsReconnectTimer)
      wsReconnectTimer = null
    }
    // Subscribe to the current stock if it exists
    if (currentStockCode.value) {
      subscribeToStock(currentStockCode.value)
    }
  }

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      // Assuming data is an array of stock objects, matching realtimeData structure
      if (Array.isArray(data)) {
        realtimeData.value = data
      }
      else {
        console.warn('Received WebSocket data is not an array:', data)
      }
    }
    catch (error) {
      console.error('Error parsing WebSocket message:', error)
      ElMessage.error('实时数据格式错误')
    }
  }

  ws.value.onclose = (event) => {
    console.log('WebSocket disconnected:', event.code, event.reason)
    if (!event.wasClean) {
      ElMessage.warning(`实时数据连接断开，${wsReconnectDelay / 1000}秒后尝试重连...`)
      if (wsReconnectTimer)
        clearTimeout(wsReconnectTimer)

      wsReconnectTimer = setTimeout(() => {
        connectWebSocket() // Attempt to reconnect
      }, wsReconnectDelay)
    }
    else {
      ElMessage.info('实时数据连接已关闭')
    }
  }

  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error)
    ElMessage.error('实时数据连接错误')
    // onclose will likely be called after this, handling reconnection
  }
}

function subscribeToStock(stockCode) {
  if (ws.value && ws.value.readyState === WebSocket.OPEN && stockCode) {
    const message = JSON.stringify({
      action: 'subscribe',
      stock_codes: [stockCode],
    })
    ws.value.send(message)
    console.log('Subscribed to:', stockCode)
  }
}

function unsubscribeFromStock(stockCode) {
  if (ws.value && ws.value.readyState === WebSocket.OPEN && stockCode) {
    const message = JSON.stringify({
      action: 'unsubscribe',
      stock_codes: [stockCode],
    })
    ws.value.send(message)
    console.log('Unsubscribed from:', stockCode)
  }
}

// 从URL参数获取股票代码
onMounted(async () => {
  // 检查URL参数 - 保留URL参数功能，但优先设置默认HSI
  const codeParam = route.query.code
  let initialCode = 'HSI' // 默认恒生指数
  if (codeParam && typeof codeParam === 'string' && /^(\d{5}|HSI)$/i.test(codeParam)) {
    initialCode = codeParam.toUpperCase()
  }
  else {
    // 如果URL没有有效代码，确保searchInput也反映默认值
    searchInput.value = 'HSI'
  }

  // 设置初始股票代码和名称
  currentStockCode.value = initialCode
  if (initialCode === 'HSI') {
    currentStockName.value = '恒生指数'
    searchInput.value = 'HSI' // 同步输入框
  }
  else {
    // 如果通过URL加载了其他代码，尝试获取其名称
    currentStockName.value = await fetchStockName(initialCode)
    searchInput.value = initialCode // 同步输入框
  }

  initChart()
  await loadChartData() // 加载默认或URL指定的股票数据
  connectWebSocket() // Connect WebSocket
})

watch(currentStockCode, async (newVal, oldVal) => {
  if (oldVal) {
    unsubscribeFromStock(oldVal) // Unsubscribe from old stock
  }
  if (newVal) {
    subscribeToStock(newVal) // Subscribe to new stock
    // If you want to clear realtimeData immediately on stock change:
    realtimeData.value = []
    // However, backend might send initial data upon subscription or periodically update.
  }
  // loadChartData is already called by another watcher if chart type doesn't change
  // or handled by direct calls when necessary.
})

onUnmounted(() => {
  dispose('chart-container')

  // 清除重连定时器
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer)
    wsReconnectTimer = null
  }
  // 关闭WebSocket连接
  if (ws.value) {
    // 发送取消订阅请求 for the last known stock
    if (ws.value.readyState === WebSocket.OPEN && currentStockCode.value) {
      unsubscribeFromStock(currentStockCode.value)
    }
    ws.value.close(1000, 'Component unmounted') // Clean close
  }
})

async function switchToHSI() {
  currentStockCode.value = 'HSI'
  currentStockName.value = '恒生指数' // 直接设置名称
  searchInput.value = 'HSI' // 更新输入框显示
  await loadChartData() // 重新加载图表数据
}
</script>

<template>
  <div class="list-container">
    <div class="flex-grow p-4">
      <!-- 股票搜索模块 -->
      <div class="stock-search-container mb-4">
        <el-card v-loading="isLoadingStocks">
          <div class="flex flex-col md:flex-row md:items-center">
            <div class="flex-1">
              <div class="mb-2 text-xl font-bold">
                {{ currentStockName || '未选择股票' }}
              </div>
              <div class="text-gray-500">
                {{
                  currentStockCode ? `股票代码：${currentStockCode} | 即时行情`
                  : '输入股票代码查看详情'
                }}
              </div>
            </div>
            <div class="mt-3 flex items-center md:ml-4 md:mt-0">
              <span class="mr-2 font-medium">股票代码:</span>
              <el-input
                v-model="searchInput"
                placeholder="输入股票代码 (如: 00001)"
                style="width: 300px"
                :trigger-on-focus="true"
                clearable
                :disabled="isLoadingStocks"
                @input="handleCodeInput"
              >
                <template #prefix>
                  <el-icon>
                    <Search />
                  </el-icon>
                </template>
              </el-input>
              <el-button type="primary" class="ml-2" @click="switchToHSI">
                恒生指数
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- K线图容器 -->
      <div class="chart-wrapper mb-4">
        <!-- 横向导航菜单 -->
        <el-menu
          mode="horizontal"
          class="chart-menu"
          :default-active="currentChartType"
          @select="handleChartTypeChange"
        >
          <el-menu-item index="time">
            分时图
          </el-menu-item>
          <el-menu-item index="day">
            日K
          </el-menu-item>
          <el-menu-item index="5day">
            五日K
          </el-menu-item>
          <el-menu-item index="week">
            周K
          </el-menu-item>
          <el-menu-item index="year">
            年K
          </el-menu-item>
        </el-menu>
        <div class="chart-title text-xl font-bold" />
        <div id="chart-container">
          <div v-if="!currentStockCode" class="chart-prompt">
            请输入股票代码加载图表
          </div>
          <div v-else class="chart-content">
            <template v-if="chartLoading">
              <el-skeleton :rows="3" animated />
            </template>
            <template v-else>
              <div v-if="chartError" class="chart-error">
                图表加载失败，请重试
              </div>
            </template>
          </div>
        </div>
      </div>
      <el-row :gutter="20" class="mt-4">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="font-bold">
                实时数据
              </div>
            </template>

            <el-table :data="realtimeData" height="200">
              <el-table-column prop="time" label="时间" />
              <el-table-column prop="volume" label="成交量" />
              <el-table-column prop="price" label="当前价格" />
              <el-table-column prop="lastPrice" label="昨日收盘价格" />
              <el-table-column prop="high" label="当天最高价" />
              <el-table-column prop="low" label="当天最低价" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style>
.list-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
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

.flex-grow {
  flex-grow: 1;
}

/* 股票搜索容器 */
.stock-search-container {
  position: relative;
  min-height: 100px;
}

.chart-menu {
  margin-bottom: 20px;
  border-bottom: none;

  :deep(.el-menu-item) {
    font-size: 14px;
    padding: 0 20px;
    transition: all 0.3s;

    &:hover {
      background: #f5f7fa;
    }

    &.is-active {
      color: #409eff;
      border-bottom: 2px solid #409eff;
    }
  }
}

.chart-title {
  padding: 0 0 15px 10px;
  color: #333;
}

.chart-prompt,
.loading-chart {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.chart-error {
  color: #f56c6c;
  padding: 20px;
  text-align: center;
}
</style>
