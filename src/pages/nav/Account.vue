<!-- src/views/Account.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const symbol = ref(route.params.symbol) // 获取路由参数

// 模拟实时价格
const currentPrice = ref(156.32)
const priceClass = computed(() => ({
  up: currentPrice.value > 150,
  down: currentPrice.value <= 150,
}))

// TODO: 从接口获取数据
// const fetchStockData = async () => {
  // 使用symbol参数请求接口
  // const res = await fetch(`/api/stock/${symbol.value}`)
// }
</script>

<template>
  <div class="stock-container">
    <h2>{{ symbol }} 股票详情</h2>
    <!-- 显示股票实时数据 -->
    <div class="price-display">
      <span :class="priceClass">${{ currentPrice }}</span>
    </div>
  </div>
</template>
