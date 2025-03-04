<!-- src/views/Trade.vue -->
<template>
  <el-card class="max-w-2xl mx-auto">
    <template #header>
      <div class="text-xl font-bold">股票委托</div>
    </template>

    <el-form :model="form" label-width="100px">
      <el-form-item label="股票代码">
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

      <el-form-item label="买卖方向">
        <el-radio-group v-model="form.side">
          <el-radio-button label="BUY">买入</el-radio-button>
          <el-radio-button label="SELL">卖出</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="委托类型">
        <el-select v-model="form.orderType">
          <el-option label="限价单" value="LIMIT"/>
          <el-option label="市价单" value="MARKET"/>
        </el-select>
      </el-form-item>

      <el-form-item label="价格" v-if="form.orderType === 'LIMIT'">
        <el-input-number
            v-model="form.price"
            :precision="2"
            :min="0.01"
            :step="0.01"
        />
      </el-form-item>

      <el-form-item label="数量">
        <el-input-number
            v-model="form.quantity"
            :min="100"
            :step="100"
        />
      </el-form-item>

      <el-form-item>
        <el-button
            type="primary"
            @click="submitOrder"
            :icon="Check"
        >提交委托
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import {ref} from 'vue'
import {Check} from '@element-plus/icons-vue'

const stockList = [
  {label: '阿里巴巴 (BABA)', value: 'BABA'},
  {label: '腾讯控股 (0700)', value: '0700'},
  {label: '贵州茅台 (600519)', value: '600519'}
]

const form = ref({
  symbol: '',
  side: 'BUY',
  orderType: 'LIMIT',
  price: 0,
  quantity: 100
})

const submitOrder = () => {
  console.log('提交委托:', form.value)
  // 这里接入实际交易API
}
</script>