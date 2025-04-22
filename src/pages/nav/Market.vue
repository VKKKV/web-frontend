<script setup>
import axios from 'axios'
import {ElMessage} from 'element-plus'
import {formatTime} from 'element-plus/es/components/countdown/src/utils'
import {dispose, init} from 'klinecharts'
import {computed, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import {useRoute} from 'vue-router'

const route = useRoute()
const chart = shallowRef(null)
const ws = shallowRef(null)
const selectedSymbol = ref('00001') // 当前展示的股票代码
const indicator = ref('')
const isConnected = ref(false) // 添加连接状态变量
const useTestData = ref(true) // 是否使用测试数据
const searchInput = ref('') // 搜索输入
const stockOptions = ref([]) // 可选股票列表
const isLoadingStocks = ref(false) // 加载股票列表状态
const styles = {
  grid: {
    show: true,
    horizontal: {
      show: true,
      size: 1,
      color: '#EDEDED',
      style: 'dashed',
      dashedValue: [2, 2],
    },
    vertical: {
      show: true,
      size: 1,
      color: '#EDEDED',
      style: 'dashed',
      dashedValue: [2, 2],
    },
  },
  candle: {
    // 'candle_solid' | 'candle_stroke' | 'candle_up_stroke' | 'candle_down_stroke' | 'ohlc' | 'area'
    type: 'candle_solid',
    bar: {
      // 'current_open' | 'previous_close'
      compareRule: 'current_open',
      upColor: '#2DC08E',
      downColor: '#F92855',
      noChangeColor: '#888888',
      upBorderColor: '#2DC08E',
      downBorderColor: '#F92855',
      noChangeBorderColor: '#888888',
      upWickColor: '#2DC08E',
      downWickColor: '#F92855',
      noChangeWickColor: '#888888',
    },
    area: {
      lineSize: 2,
      lineColor: '#2196F3',
      smooth: false,
      value: 'close',
      backgroundColor: [{
        offset: 0,
        color: 'rgba(33, 150, 243, 0.01)',
      }, {
        offset: 1,
        color: 'rgba(33, 150, 243, 0.2)',
      }],
      point: {
        show: true,
        color: '#2196F3',
        radius: 4,
        rippleColor: 'rgba(33, 150, 243, 0.3)',
        rippleRadius: 8,
        animation: true,
        animationDuration: 1000,
      },
    },
    priceMark: {
      show: true,
      high: {
        show: true,
        color: '#D9D9D9',
        textMargin: 5,
        textSize: 10,
        textFamily: 'Helvetica Neue',
        textWeight: 'normal',
      },
      low: {
        show: true,
        color: '#D9D9D9',
        textMargin: 5,
        textSize: 10,
        textFamily: 'Helvetica Neue',
        textWeight: 'normal',
      },
      last: {
        show: true,
        // 'current_open' | 'previous_close'
        compareRule: 'current_open',
        upColor: '#2DC08E',
        downColor: '#F92855',
        noChangeColor: '#888888',
        line: {
          show: true,
          // 'solid' | 'dashed'
          style: 'dashed',
          dashedValue: [4, 4],
          size: 1,
        },
        text: {
          show: true,
          // 'fill' | 'stroke' | 'stroke_fill'
          style: 'fill',
          size: 12,
          paddingLeft: 4,
          paddingTop: 4,
          paddingRight: 4,
          paddingBottom: 4,
          // 'solid' | 'dashed'
          borderStyle: 'solid',
          borderSize: 0,
          borderColor: 'transparent',
          borderDashedValue: [2, 2],
          color: '#FFFFFF',
          family: 'Helvetica Neue',
          weight: 'normal',
          borderRadius: 2,
        },
      },
    },
    tooltip: {
      offsetLeft: 4,
      offsetTop: 6,
      offsetRight: 4,
      offsetBottom: 6,
      // 'always' | 'follow_cross' | 'none'
      showRule: 'always',
      // 'standard' | 'rect'
      showType: 'standard',
      // e.g.
      // [{ title: 'time', value: '{time}' }, { title: 'close', value: '{close}' }]
      // [{ title: { text: 'time', color: '#fff' }, value: { text: '{time}', color: '#fff' } }, { title: 'close', value: '{close}' }]
      custom: [
        {title: 'time', value: '{time}'},
        {title: 'open', value: '{open}'},
        {title: 'high', value: '{high}'},
        {title: 'low', value: '{low}'},
        {title: 'close', value: '{close}'},
        {title: 'volume', value: '{volume}'},
      ],
      defaultValue: 'n/a',
      rect: {
        // 'fixed' | 'pointer'
        position: 'fixed',
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 4,
        paddingBottom: 4,
        offsetLeft: 4,
        offsetTop: 4,
        offsetRight: 4,
        offsetBottom: 4,
        borderRadius: 4,
        borderSize: 1,
        borderColor: '#f2f3f5',
        color: '#FEFEFE',
      },
      text: {
        size: 12,
        family: 'Helvetica Neue',
        weight: 'normal',
        color: '#D9D9D9',
        marginLeft: 8,
        marginTop: 4,
        marginRight: 8,
        marginBottom: 4,
      },
    },
  },
  indicator: {
    ohlc: {
      // 'current_open' | 'previous_close'
      compareRule: 'current_open',
      upColor: 'rgba(45, 192, 142, .7)',
      downColor: 'rgba(249, 40, 85, .7)',
      noChangeColor: '#888888',
    },
    bars: [{
      // 'fill' | 'stroke' | 'stroke_fill'
      style: 'fill',
      // 'solid' | 'dashed'
      borderStyle: 'solid',
      borderSize: 1,
      borderDashedValue: [2, 2],
      upColor: 'rgba(45, 192, 142, .7)',
      downColor: 'rgba(249, 40, 85, .7)',
      noChangeColor: '#888888',
    }],
    lines: [
      {
        // 'solid' | 'dashed'
        style: 'solid',
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: '#FF9600',
      },
      {
        style: 'solid',
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: '#935EBD',
      },
      {
        style: 'solid',
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: '#2196F3',
      },
      {
        style: 'solid',
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: '#E11D74',
      },
      {
        style: 'solid',
        smooth: false,
        size: 1,
        dashedValue: [2, 2],
        color: '#01C5C4',
      },
    ],
    circles: [{
      // 'fill' | 'stroke' | 'stroke_fill'
      style: 'fill',
      // 'solid' | 'dashed'
      borderStyle: 'solid',
      borderSize: 1,
      borderDashedValue: [2, 2],
      upColor: 'rgba(45, 192, 142, .7)',
      downColor: 'rgba(249, 40, 85, .7)',
      noChangeColor: '#888888',
    }],
    lastValueMark: {
      show: false,
      text: {
        show: false,
        // 'fill' | 'stroke' | 'stroke_fill'
        style: 'fill',
        color: '#FFFFFF',
        size: 12,
        family: 'Helvetica Neue',
        weight: 'normal',
        // 'solid' | 'dashed'
        borderStyle: 'solid',
        borderSize: 1,
        borderDashedValue: [2, 2],
        paddingLeft: 4,
        paddingTop: 4,
        paddingRight: 4,
        paddingBottom: 4,
        borderRadius: 2,
      },
    },
    tooltip: {
      offsetLeft: 4,
      offsetTop: 6,
      offsetRight: 4,
      offsetBottom: 6,
      // 'always' | 'follow_cross' | 'none'
      showRule: 'always',
      // 'standard' | 'rect'
      showType: 'standard',
      showName: true,
      showParams: true,
      defaultValue: 'n/a',
      text: {
        size: 12,
        family: 'Helvetica Neue',
        weight: 'normal',
        color: '#D9D9D9',
        marginTop: 4,
        marginRight: 8,
        marginBottom: 4,
        marginLeft: 8,
      },
      features: [],
    },
  },
  xAxis: {
    show: true,
    size: 'auto',
    axisLine: {
      show: true,
      color: '#888888',
      size: 1,
    },
    tickText: {
      show: true,
      color: '#D9D9D9',
      family: 'Helvetica Neue',
      weight: 'normal',
      size: 12,
      marginStart: 4,
      marginEnd: 4,
    },
    tickLine: {
      show: true,
      size: 1,
      length: 3,
      color: '#888888',
    },
  },
  yAxis: {
    show: true,
    size: 'auto',
    // 'left' | 'right'
    position: 'right',
    // 'normal' | 'percentage' | 'log'
    type: 'normal',
    inside: false,
    reverse: false,
    axisLine: {
      show: true,
      color: '#888888',
      size: 1,
    },
    tickText: {
      show: true,
      color: '#D9D9D9',
      family: 'Helvetica Neue',
      weight: 'normal',
      size: 12,
      marginStart: 4,
      marginEnd: 4,
    },
    tickLine: {
      show: true,
      size: 1,
      length: 3,
      color: '#888888',
    },
  },
  separator: {
    size: 1,
    color: '#888888',
    fill: true,
    activeBackgroundColor: 'rgba(230, 230, 230, .15)',
  },
  crosshair: {
    show: true,
    horizontal: {
      show: true,
      line: {
        show: true,
        // 'solid' | 'dashed'
        style: 'dashed',
        dashedValue: [4, 2],
        size: 1,
        color: '#888888',
      },
      text: {
        show: true,
        // 'fill' | 'stroke' | 'stroke_fill'
        style: 'fill',
        color: '#FFFFFF',
        size: 12,
        family: 'Helvetica Neue',
        weight: 'normal',
        // 'solid' | 'dashed'
        borderStyle: 'solid',
        borderDashedValue: [2, 2],
        borderSize: 1,
        borderColor: '#686D76',
        borderRadius: 2,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 4,
        paddingBottom: 4,
        backgroundColor: '#686D76',
      },
    },
    vertical: {
      show: true,
      line: {
        show: true,
        // 'solid'|'dashed'
        style: 'dashed',
        dashedValue: [4, 2],
        size: 1,
        color: '#888888',
      },
      text: {
        show: true,
        // 'fill' | 'stroke' | 'stroke_fill'
        style: 'fill',
        color: '#FFFFFF',
        size: 12,
        family: 'Helvetica Neue',
        weight: 'normal',
        // 'solid' | 'dashed'
        borderStyle: 'solid',
        borderDashedValue: [2, 2],
        borderSize: 1,
        borderColor: '#686D76',
        borderRadius: 2,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 4,
        paddingBottom: 4,
        backgroundColor: '#686D76',
      },
    },
  },
  overlay: {
    point: {
      color: '#1677FF',
      borderColor: 'rgba(22, 119, 255, 0.35)',
      borderSize: 1,
      radius: 5,
      activeColor: '#1677FF',
      activeBorderColor: 'rgba(22, 119, 255, 0.35)',
      activeBorderSize: 3,
      activeRadius: 5,
    },
    line: {
      // 'solid' | 'dashed'
      style: 'solid',
      smooth: false,
      color: '#1677FF',
      size: 1,
      dashedValue: [2, 2],
    },
    rect: {
      // 'fill' | 'stroke' | 'stroke_fill'
      style: 'fill',
      color: 'rgba(22, 119, 255, 0.25)',
      borderColor: '#1677FF',
      borderSize: 1,
      borderRadius: 0,
      // 'solid' | 'dashed'
      borderStyle: 'solid',
      borderDashedValue: [2, 2],
    },
    polygon: {
      // 'fill' | 'stroke' | 'stroke_fill'
      style: 'fill',
      color: '#1677FF',
      borderColor: '#1677FF',
      borderSize: 1,
      // 'solid' | 'dashed'
      borderStyle: 'solid',
      borderDashedValue: [2, 2],
    },
    circle: {
      // 'fill' | 'stroke' | 'stroke_fill'
      style: 'fill',
      color: 'rgba(22, 119, 255, 0.25)',
      borderColor: '#1677FF',
      borderSize: 1,
      // 'solid' | 'dashed'
      borderStyle: 'solid',
      borderDashedValue: [2, 2],
    },
    arc: {
      // 'solid' | 'dashed'
      style: 'solid',
      color: '#1677FF',
      size: 1,
      dashedValue: [2, 2],
    },
    text: {
      // 'fill' | 'stroke' | 'stroke_fill'
      style: 'fill',
      color: '#FFFFFF',
      size: 12,
      family: 'Helvetica Neue',
      weight: 'normal',
      // 'solid' | 'dashed'
      borderStyle: 'solid',
      borderDashedValue: [2, 2],
      borderSize: 0,
      borderRadius: 2,
      borderColor: '#1677FF',
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      backgroundColor: '#1677FF',
    },
  },
}

const realtimeData = ref([{
  lotSize: 100.0,
  name: '长和',
  price: 43.3,
  lastPrice: 42.15,
  openPrice: 42.25,
  amount: 10434592.0,
  time: '2025/04/22 16:08:14',
  dtd: 2.73,
  high: 43.5,
  low: 42.2,
},
])

// <el-table-column prop="time" label="时间" />
// <el-table-column prop="volume" label="成交量" />
// <el-table-column prop="price" label="当前价格" />
// <el-table-column prop="lastPrice" label="昨日收盘价格" />
// <el-table-column prop="high" label="当天最高价" />
// <el-table-column prop="low" label="当天最低价" />

// 从后端获取股票列表
async function fetchStockList() {
  isLoadingStocks.value = true
  try {
    // const loadingInstance = ElLoading.service({
    //   target: '.stock-search-container',
    //   text: '加载股票列表...',
    // })

    // 从后端API获取股票列表
    const response = await axios.get('/api/v1/market/stocks')

    // 处理响应数据
    if (response.data && Array.isArray(response.data.stocks)) {
      stockOptions.value = response.data.stocks
    } else {
      // 如果API返回格式不符合预期，使用默认数据
      console.warn('后端返回的股票数据格式不符合预期，使用默认数据')
      stockOptions.value = getDefaultStocks()
    }

    // loadingInstance.close()
  } catch (error) {
    console.error('获取股票列表失败:', error)
    ElMessage.error('获取股票列表失败，使用默认数据')
    // 加载失败时使用默认数据
    stockOptions.value = getDefaultStocks()
  } finally {
    isLoadingStocks.value = false
  }
}

// 默认股票数据（当API请求失败时使用）
function getDefaultStocks() {
  return [
    {value: 'AAPL', label: '苹果 (AAPL)', market: '纳斯达克', industry: '科技'},
    {value: 'MSFT', label: '微软 (MSFT)', market: '纳斯达克', industry: '科技'},
    {value: 'GOOGL', label: '谷歌 (GOOGL)', market: '纳斯达克', industry: '科技'},
    {value: 'AMZN', label: '亚马逊 (AMZN)', market: '纳斯达克', industry: '电商'},
    {value: 'TSLA', label: '特斯拉 (TSLA)', market: '纳斯达克', industry: '汽车'},
    {value: '00001', label: '长和', market: '港股'},
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
  } else {
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
  return stock && stock.market ? `${stock.market} | ${stock.value}` : ''
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
      ElMessage.info('WebSocket连接已建立')
      isConnected.value = true
      reconnectAttempts = 0 // 重置重连计数

      // 增加心跳检测机制
      setInterval(() => {
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
          ws.value.send(JSON.stringify({type: 'ping'}))
        }
      }, 30000)

      // 设置数据模式
      setDataMode(useTestData.value)

      // 订阅股票数据
      subscribeToStock(selectedSymbol.value)
    }

    ws.value.onmessage = ({data}) => {
      try {
        let payload

        // 处理不同类型的数据
        if (data instanceof ArrayBuffer) {
          const decoder = new TextDecoder()
          const jsonStr = decoder.decode(data)
          payload = JSON.parse(jsonStr)
        } else {
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
      } catch (error) {
        ElMessage.error('处理WebSocket消息时出错:', error)
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
  } catch (error) {
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
  chart.value.setStyles(styles)

  const initialData = [
    { // 起始交易日 6/1
      open: 30.50,
      high: 30.80,
      low: 30.20,
      close: 30.60,
      volume: 1584000, // 15.84万股
      timestamp: 1717192800000 // 2024-06-01 16:00:00 GMT+8
    },
    { // 6/2 突破上涨
      open: 30.60,
      high: 31.20,
      low: 30.50,
      close: 31.10, // 收涨1.63%
      volume: 2245000,
      timestamp: 1717279200000
    },
    { // 6/3 带长上影
      open: 31.10,
      high: 31.45,
      low: 30.95,
      close: 31.05, // 冲高回落
      volume: 1892000,
      timestamp: 1717365600000
    },
    { // 6/4 缩量整理
      open: 31.05,
      high: 31.15,
      low: 30.75,
      close: 30.90, // 小跌0.48%
      volume: 1423000,
      timestamp: 1717452000000
    },
    { // 6/5 放量突破
      open: 30.95,
      high: 31.60,
      low: 30.90,
      close: 31.55, // 大涨2.10%
      volume: 2817000,
      timestamp: 1717538400000
    },
    { // 6/6 延续涨势
      open: 31.55,
      high: 32.00,
      low: 31.40,
      close: 31.95, // 收涨1.27%
      volume: 2456000,
      timestamp: 1717624800000
    },
    { // 6/7 高位震荡
      open: 31.95,
      high: 32.15,
      low: 31.60,
      close: 31.75, // 跌0.63%
      volume: 1932000,
      timestamp: 1717711200000
    },
    { // 6/8 十字星变盘信号
      open: 31.75,
      high: 31.95,
      low: 31.55,
      close: 31.75, // 平盘
      volume: 1685000,
      timestamp: 1717797600000
    },
    { // 6/9 技术回调
      open: 31.75,
      high: 31.80,
      low: 31.15,    // 下探支撑位
      close: 31.30, // 跌1.42%
      volume: 2163000,
      timestamp: 1717884000000
    },
    { // 6/10 企稳反弹
      open: 31.30,
      high: 31.65,
      low: 31.20,
      close: 31.55, // 涨0.80%
      volume: 1754000,
      timestamp: 1717970400000
    }
  ];

  // 设置初始数据
  chart.value.applyNewData(initialData)

  // 添加技术指标
  if (indicator.value) {
    addIndicator(indicator.value)
  }
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
      chart.value.createIndicator('MACD', false, {id: 'macd_pane'})
      break
    case 'rsi':
      chart.value.createIndicator('RSI', false, {id: 'rsi_pane'})
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

  initChart()
  // 创建WebSocket连接
  // createWebSocketConnection()
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
                  placeholder="输入股票代码"
                  style="width: 300px"
                  :trigger-on-focus="true"
                  clearable
                  :disabled="isLoadingStocks"
                  @select="handleSelect"
              >
                <template #prefix>
                  <el-icon>
                    <Search/>
                  </el-icon>
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
        <div id="chart-container">
          <div v-if="!chart" class="loading-chart">
            正在初始化图表...
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
              <el-table-column prop="time" label="时间"/>
              <el-table-column prop="amount" label="成交量"/>
              <el-table-column prop="price" label="当前价格"/>
              <el-table-column prop="lastPrice" label="昨日收盘价格"/>
              <el-table-column prop="high" label="当天最高价"/>
              <el-table-column prop="low" label="当天最低价"/>
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
