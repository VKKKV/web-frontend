<script setup>
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'


useRoute()
const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const stockList = ref([])
const errorMessage = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取股票列表
async function fetchStockList() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await axios.get('/api/v1/market/stocks', {
      params: {
        page: currentPage.value - 1,
        size: pageSize.value,
        keyword: searchQuery.value,
      },
    })

    if (response.data.code === 200) {
      stockList.value = response.data.data.records
      total.value = response.data.data.total
    }
    else {
      throw new Error(response.data.message || '获取股票列表失败')
    }
  }
  catch (error) {
    console.error('获取股票列表出错:', error)
    errorMessage.value = error.message
    stockList.value = []
  }
  finally {
    loading.value = false
  }
}

// 处理页码变化
function handlePageChange(page) {
  currentPage.value = page
  fetchStockList()
}

// 处理搜索
function handleSearch() {
  currentPage.value = 1
  fetchStockList()
}

// 跳转到K线页面
function navigateToKLine(stockCode) {
  router.push(`/nav/test?code=${stockCode}`)
}

// 初始化加载
onMounted(() => {
  fetchStockList()
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <div class="flex-grow p-4">
      <div class="mx-auto container">
        <!-- 页面标题 -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold">
            股票列表
          </h1>
        </div>

        <!-- 搜索栏 -->
        <div class="mb-6 border rounded-lg p-4 shadow-md">
          <div class="flex items-center">
            <el-input
              v-model="searchQuery"
              placeholder="搜索股票代码或名称"
              class="mr-4 w-64"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
            <el-button
              type="primary"
              :loading="loading"
              @click="handleSearch"
            >
              搜索
            </el-button>
          </div>
        </div>

        <!-- 错误提示 -->
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          class="mb-6"
        />

        <!-- 股票列表 -->
        <div class="overflow-hidden border rounded-lg shadow-md">
          <div v-if="loading" class="p-6">
            <el-skeleton :rows="5" animated />
          </div>

          <!-- 股票数据 -->
          <div v-else>
            <el-table
              :data="stockList"
              style="width: 100%"
              stripe
              highlight-current-row
              @row-click="(row) => navigateToKLine(row.stockCode)"
            >
              <!-- 股票代码 -->
              <el-table-column
                prop="stockCode"
                label="股票代码"
                min-width="140"
                sortable
              />

              <!-- 股票名称 -->
              <el-table-column
                prop="stockName"
                label="股票名称"
                min-width="180"
                show-overflow-tooltip
              />

              <!-- 市场 -->
              <el-table-column
                prop="market"
                label="市场"
                min-width="120"
              >
                <template #default="{ row }">
                  <el-tag
                    :type="row.market === '沪深' ? 'success' : 'warning'"
                    class="mx-auto"
                  >
                    {{ row.market }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 操作 -->
              <el-table-column
                fixed="right"
                label="操作"
                min-width="140"
                header-align="left"
              >
                <template #default="{ row }">
                  <div class="flex justify-inherit">
                    <!-- 按钮容器居中 -->
                    <el-button
                      type="primary"
                      link
                      class="px-4"
                      @click.stop="navigateToKLine(row.stockCode)"
                    >
                      <el-icon class="mr-1">
                        <TrendCharts />
                      </el-icon>
                      查看K线
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <!-- 分页 -->
            <div class="flex justify-end p-4">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next"
                @size-change="fetchStockList"
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
