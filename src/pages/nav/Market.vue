<script setup>
import { dispose, init } from 'klinecharts'
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  const chart = init('chart')

  chart.applyNewData([
    { close: 4976.16, high: 4977.99, low: 4970.12, open: 4972.89, timestamp: 1587660000000, volume: 204 },
    { close: 4977.33, high: 4979.94, low: 4971.34, open: 4973.20, timestamp: 1587660060000, volume: 194 },
    { close: 4977.93, high: 4977.93, low: 4974.20, open: 4976.53, timestamp: 1587660120000, volume: 197 },
    { close: 4966.77, high: 4968.53, low: 4962.20, open: 4963.88, timestamp: 1587660180000, volume: 28 },
    { close: 4961.56, high: 4972.61, low: 4961.28, open: 4961.28, timestamp: 1587660240000, volume: 184 },
    { close: 4964.19, high: 4964.74, low: 4961.42, open: 4961.64, timestamp: 1587660300000, volume: 191 },
    { close: 4968.93, high: 4972.70, low: 4964.55, open: 4966.96, timestamp: 1587660360000, volume: 105 },
    { close: 4979.31, high: 4979.61, low: 4973.99, open: 4977.06, timestamp: 1587660420000, volume: 35 },
    { close: 4977.02, high: 4981.66, low: 4975.14, open: 4981.66, timestamp: 1587660480000, volume: 135 },
    { close: 4985.09, high: 4988.62, low: 4980.30, open: 4986.72, timestamp: 1587660540000, volume: 76 },
  ])
})

onUnmounted(() => {
  dispose('chart')
})
</script>

<template>
  <div class="p-4">
<!--    <div id="chart"  style="width:600px;height:600px" />-->
    <div id="chart"  class="h-[600px] w-full"/>
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
</template>

<style>
/* 自定义图表工具提示 */
.tv-lightweight-charts {
  --tooltip-background: rgba(26, 29, 36, 0.9);
  --tooltip-border-color: #2b2f3a;
}
</style>
