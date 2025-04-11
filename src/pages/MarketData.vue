<script setup>
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const inputCodes = ref('')
const stockList = ref([])
const loading = ref(false)

const formatTime = t => t.replace(/\//g, '-') // 时间格式化

async function fetchStocks() {
  if (!inputCodes.value.trim())
    return
  try {
    loading.value = true
    const response = await axios.get(
      `http://localhost:8080/api/v1/market/getstock/${inputCodes.value}`,
    )
    stockList.value = response.data
  }
  catch (err) {
    ElMessage.error(err.response?.data || '服务异常')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="stock-container">
    <el-input
      v-model="inputCodes"
      placeholder="输入港股代码 例：00700,00001"
      style="width:400px"
      clearable
    >
      <template #append>
        <el-button icon="Search" @click="fetchStocks" />
      </template>
    </el-input>

    <el-table v-loading="loading" :data="stockList" style="margin-top:20px">
<!--      <el-table-column prop="stock_code" label="代码" width="120" />-->
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="price" label="当前价格" align="right" />
      <el-table-column prop="lastPrice" label="昨日收盘价格" align="right" />
      <el-table-column prop="high" label="当天最高价" align="right" />
      <el-table-column prop="low" label="当天最低价" align="right" />
      <el-table-column label="更新时间">
        <template #default="{ row }">
          {{ formatTime(row.time) }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.stock-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
