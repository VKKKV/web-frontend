<script setup>
import { dispose, init } from 'klinecharts'
import { onMounted, onUnmounted, shallowRef } from 'vue'

const chart = shallowRef(null)
const ws = shallowRef(null)
const selectedSymbol = ref('AAPL') // 当前展示的股票代码

onMounted(async () => {
  chart.value = init('chart-container')

  // TODO: add token
  ws.value = new WebSocket('ws://localhost:8080/ws/v1/market/subscribe')

  // 二进制传输格式
  ws.value.binaryType = 'arraybuffer'

  ws.value.onmessage = ({ data }) => {
    const decoder = new TextDecoder()
    const jsonStr = decoder.decode(data)
    const payload = JSON.parse(jsonStr)

    // 只处理当前选中的股票
    const targetData = payload[selectedSymbol.value]
    if (!targetData)
      return

    updateChartData({
      timestamp: targetData.timestamp,
      open: +targetData.open.toFixed(2),
      close: +targetData.close.toFixed(2),
      high: +targetData.high.toFixed(2),
      low: +targetData.low.toFixed(2),
      volume: targetData.volume,
    })
  }

  ws.value.onopen = () => {
    // 增加心跳检测机制
    setInterval(() => {
      if (ws.value.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    // 优化订阅格式，增加容错
    const subscription = {
      action: 'subscribe',
      stock_codes: [selectedSymbol.value], // 只订阅当前展示的股票
    }
    ws.value.send(JSON.stringify(subscription))
  }
})

// 切换股票时的处理
function switchStock(symbol) {
  selectedSymbol.value = symbol
  if (ws.value?.readyState === WebSocket.OPEN) {
    const msg = {
      action: 'unsubscribe',
      stock_codes: [/* 原股票代码 */],
    }
    ws.value.send(JSON.stringify(msg))

    const newSubscribe = {
      action: 'subscribe',
      stock_codes: [symbol],
    }
    ws.value.send(JSON.stringify(newSubscribe))
  }
}

function updateChartData(kLine) {
  // 添加时区转换逻辑（根据需要）
  const adjustedTimestamp = kLine.timestamp /* + 时区偏移量 */

  chart.value.updateData({
    ...kLine,
    timestamp: adjustedTimestamp,
    turnover: kLine.volume * kLine.close,
  })
}

onUnmounted(() => {
  dispose('chart-container')
  if (ws.value) {
    // 发送取消订阅请求
    const unsubscribe = {
      action: 'unsubscribe',
      stock_codes: [selectedSymbol.value],
    }
    ws.value.send(JSON.stringify(unsubscribe))
    ws.value.close()
  }
})
</script>

<template>
  <div class="p-4">
    <!--    <div id="chart"  style="width:600px;height:600px" /> -->
    <div id="chart-container" class="h-[600px] w-full"/>
    <el-row :gutter="20" class="mt-4">
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="font-bold">
              指标选择
            </div>
          </template>
          <el-select v-model="indicator" placeholder="选择技术指标">
            <el-option label="MACD" value="macd"/>
            <el-option label="RSI" value="rsi"/>
            <el-option label="布林带" value="boll"/>
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
            <el-table-column prop="time" label="时间"/>
            <el-table-column prop="price" label="价格"/>
            <el-table-column prop="volume" label="成交量"/>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style>
/* 自定义图表工具提示 */
.tv-lightweight-charts {
  --tooltip-background: rgba(26, 29, 36, 0.9);
  --tooltip-border-color: #2b2f3a;
}
</style>
