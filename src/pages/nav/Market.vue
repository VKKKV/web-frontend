<script setup>
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { dispose, init } from 'klinecharts'
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const chart = shallowRef(null)
const ws = shallowRef(null)
const selectedSymbol = ref('00001') // 当前展示的股票代码
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
        { title: 'time', value: '{time}' },
        { title: 'open', value: '{open}' },
        { title: 'high', value: '{high}' },
        { title: 'low', value: '{low}' },
        { title: 'close', value: '{close}' },
        { title: 'volume', value: '{volume}' },
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

const currentStockName = ref()
const currentStockCode = ref()

let reconnectAttempts = 0
let reconnectTimer = null
let initialData = [
  { open: 30.50, high: 30.80, low: 30.20, close: 30.60, volume: 1584000, timestamp: 1717192800000 },
  { open: 30.60, high: 31.20, low: 30.50, close: 31.10, volume: 2245000, timestamp: 1717279200000 },
  { open: 31.10, high: 31.45, low: 30.95, close: 31.05, volume: 1892000, timestamp: 1717365600000 },
  { open: 31.05, high: 31.15, low: 30.75, close: 30.90, volume: 1423000, timestamp: 1717452000000 },
  { open: 30.95, high: 31.60, low: 30.90, close: 31.55, volume: 2817000, timestamp: 1717538400000 },
  { open: 31.55, high: 32.00, low: 31.40, close: 31.95, volume: 2456000, timestamp: 1717624800000 },
  { open: 31.95, high: 32.15, low: 31.60, close: 31.75, volume: 1932000, timestamp: 1717711200000 },
  { open: 31.75, high: 31.95, low: 31.55, close: 31.75, volume: 1685000, timestamp: 1717797600000 },
  { open: 31.75, high: 31.80, low: 31.15, close: 31.30, volume: 2163000, timestamp: 1717884000000 },
  { open: 31.30, high: 31.65, low: 31.20, close: 31.55, volume: 1754000, timestamp: 1717970400000 },
  { open: 31.55, high: 32.20, low: 31.50, close: 32.15, volume: 3521000, timestamp: 1718056800000 },
  { open: 32.15, high: 32.95, low: 32.10, close: 32.80, volume: 4218000, timestamp: 1718143200000 },
  { open: 32.80, high: 33.10, low: 32.45, close: 32.50, volume: 3852000, timestamp: 1718229600000 },
  { open: 32.50, high: 32.70, low: 31.90, close: 32.00, volume: 2845000, timestamp: 1718316000000 },
  { open: 32.00, high: 32.65, low: 31.95, close: 32.30, volume: 2162000, timestamp: 1718402400000 },
  { open: 32.30, high: 32.60, low: 31.85, close: 31.90, volume: 2981000, timestamp: 1718488800000 },
  { open: 31.90, high: 32.00, low: 31.20, close: 31.35, volume: 3725000, timestamp: 1718575200000 },
  { open: 31.35, high: 31.80, low: 31.10, close: 31.65, volume: 2564000, timestamp: 1718661600000 },
  { open: 31.65, high: 31.90, low: 31.50, close: 31.75, volume: 2300000, timestamp: 1718748000000 }, // 19日 反弹受阻
  { open: 31.75, high: 31.80, low: 31.20, close: 31.30, volume: 2800000, timestamp: 1718834400000 }, // 20日 二次探底
  { open: 31.30, high: 31.50, low: 31.10, close: 31.45, volume: 2200000, timestamp: 1718920800000 }, // 21日 锤头线止跌
  { open: 31.45, high: 31.60, low: 31.30, close: 31.45, volume: 1500000, timestamp: 1719007200000 }, // 22日 缩量盘整
  { open: 31.45, high: 32.00, low: 31.40, close: 31.90, volume: 3500000, timestamp: 1719093600000 }, // 23日 放量突破
  { open: 31.90, high: 32.30, low: 31.85, close: 32.25, volume: 3000000, timestamp: 1719180000000 }, // 24日 量价齐升
  { open: 32.25, high: 32.40, low: 32.00, close: 32.05, volume: 2500000, timestamp: 1719266400000 }, // 25日 抛压显现
  { open: 32.05, high: 32.10, low: 31.95, close: 32.00, volume: 1800000, timestamp: 1719352800000 }, // 26日 十字星变盘
  { open: 32.00, high: 32.50, low: 31.98, close: 32.45, volume: 4000000, timestamp: 1719439200000 }, // 27日 利好
]
const klineLoading = ref(false)

// 新增防抖函数
function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
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

// 使用安全字符过滤
function sanitizeName(name) {
  if (!name)
    return ''
  return name.replace(/[<>&"']/g, '') // 过滤特殊字符防止XSS
}

async function fetchStockName(stockCode) {
  // 新增参数验证环节
  if (!stockCode || typeof stockCode !== 'string') {
    console.error('股票代码参数不合法')
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
      console.warn('接口返回数据异常', response.data)
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
    console.error(`股票名称查询失败(${errorType})`, err)
    return ''
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
    if (!/^\d{5}$/.test(value)) {
      ElMessage.warning('请输入5位数字股票代码')
      return
    }
    // 新修改点：直接使用输入值
    currentStockCode.value = value.toUpperCase()
    currentStockName.value = await fetchStockName(currentStockCode.value)
    await Promise.all([
      fetchDayKLine(value),
    ])
    // 更新图表
    if (chart.value) {
      chart.value.applyNewData(initialData)
    }
    else {
      initChart()
    }
  }
  catch (err) {
    ElMessage.error(`加载失败: ${err.message}`)
  }
  finally {
    isLoadingStocks.value = false
  }
}, 500) // 500毫秒防抖

// 搜索过滤
function filterStocks(queryString) {
  if (queryString) {
    const lowercaseQuery = queryString.toLowerCase()
    return stockOptions.value.filter(
      stock => stock.value.toLowerCase().includes(lowercaseQuery)
        || stock.label.toLowerCase().includes(lowercaseQuery)
        || (stock.value && stock.value.toLowerCase().includes(lowercaseQuery))
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

// 安全数值转换逻辑
function safeParse(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

async function fetchKLineData(stockCode) {
  if (!stockCode) {
    console.error('股票代码不能为空')
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

// 五日K线 (fetchFiveDayKLine):
//
// 每5个交易日作为一个周期
// 开盘价取周期第一个交易日的开盘价
// 收盘价取周期最后一个交易日的收盘价
// 最高价取周期内所有交易日的最高价
// 最低价取周期内所有交易日的最低价
// 成交量取周期内所有交易日的总和
async function fetchDayKLine(stockCode) {
  const processedData = await fetchKLineData(stockCode)
  initialData = processedData
  return processedData
}

// 周K线 (fetchWeekKLine):
//
// 使用ISO周标准（周一为一周的第一天）
// 按照每年的周数进行分组
// 开盘价取周第一个交易日的开盘价
// 收盘价取周最后一个交易日的收盘价
// 其他指标计算方式与五日K线类似
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

async function fetchWeekKLine(stockCode) {
  const dayData = await fetchKLineData(stockCode)
  if (!dayData.length)
    return []
  const weekData = []
  let currentWeek = null
  let tempWeekData = []

  // 按照周分组
  for (const item of dayData) {
    const date = new Date(item.timestamp)
    // ISO标准中周一是1，周日是7
    const weekNumber = window.dayjs(item.timestamp).isoWeek()
    const year = window.dayjs(item.timestamp).isoWeekYear()
    const weekKey = `${year}-${weekNumber}`

    if (weekKey !== currentWeek) {
      if (tempWeekData.length > 0) {
        const open = tempWeekData[0].open
        const close = tempWeekData[tempWeekData.length - 1].close
        const high = Math.max(...tempWeekData.map(item => item.high))
        const low = Math.min(...tempWeekData.map(item => item.low))
        const volume = tempWeekData.reduce((sum, item) => sum + item.volume, 0)
        const timestamp = tempWeekData[0].timestamp

        weekData.push({ open, high, low, close, volume, timestamp })
      }
      tempWeekData = [item]
      currentWeek = weekKey
    }
    else {
      tempWeekData.push(item)
    }
  }
  // 处理最后一周数据
  if (tempWeekData.length > 0) {
    const open = tempWeekData[0].open
    const close = tempWeekData[tempWeekData.length - 1].close
    const high = Math.max(...tempWeekData.map(item => item.high))
    const low = Math.min(...tempWeekData.map(item => item.low))
    const volume = tempWeekData.reduce((sum, item) => sum + item.volume, 0)
    const timestamp = tempWeekData[0].timestamp

    weekData.push({ open, high, low, close, volume, timestamp })
  }
  initialData = weekData
  return weekData
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

  // 按照年分组
  for (const item of dayData) {
    const year = new Date(item.timestamp).getFullYear()

    if (year !== currentYear) {
      if (tempYearData.length > 0) {
        const open = tempYearData[0].open
        const close = tempYearData[tempYearData.length - 1].close
        const high = Math.max(...tempYearData.map(item => item.high))
        const low = Math.min(...tempYearData.map(item => item.low))
        const volume = tempYearData.reduce((sum, item) => sum + item.volume, 0)
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
  const container = document.getElementById('chart-container')
  if (!container) {
    console.error('找不到图表容器')
    return
  }
  chart.value = init('chart-container')
  chart.value.setStyles(styles)
  const initialData = []
  chart.value.applyNewData(initialData)
}

// 从URL参数获取股票代码
onMounted(async () => {
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
                {{ currentStockCode ? `${currentStockCode} 即时行情` : '输入股票代码查看详情' }}
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
            </div>
          </div>
        </el-card>
      </div>

      <!-- K线图容器 -->
      <div class="chart-wrapper mb-4">
        <div class="chart-title text-xl font-bold">
          日K线图
        </div>
        <div id="chart-container">
          <div v-if="!currentStockCode" class="chart-prompt">
            请输入股票代码加载图表
          </div>
          <div v-else-if="!chart" class="loading-chart">
            正在加载{{ currentStockCode }}的K线数据...
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
              <el-table-column prop="amount" label="成交量" />
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
</style>
