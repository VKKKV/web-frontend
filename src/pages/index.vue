<script setup>
import {
  ArrowRight,
  DataLine,
  InfoFilled,
  ShoppingCart,
  TrendCharts,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到实时行情页面
function goToMarketPage() {
  router.push('/nav/test')
}

// 跳转到股票信息页面
function goToStockInfoPage() {
  router.push('/nav/StockInfo')
}

// 跳转到交易页面
function goToTradePage() {
  router.push('/nav/Trade')
}

// 核心功能列表
const features = [
  {
    icon: DataLine,
    title: '实时行情',
    description: '毫秒级行情推送，精准把握市场脉搏',
    action: '查看行情',
    color: 'from-blue-500 to-blue-600',
    route: goToMarketPage,
  },
  {
    icon: InfoFilled,
    title: '股票信息',
    description: '全面的股票基本信息和公司概况',
    action: '查看信息',
    color: 'from-purple-500 to-purple-600',
    route: goToStockInfoPage,
  },
  {
    icon: ShoppingCart,
    title: '便捷交易',
    description: '一键下单，快速执行交易策略',
    action: '立即交易',
    color: 'from-green-500 to-green-600',
    route: goToTradePage,
  },
  {
    icon: TrendCharts,
    title: '技术分析',
    description: '专业的技术指标和图表分析工具',
    action: '开始分析',
    color: 'from-orange-500 to-orange-600',
    route: goToMarketPage,
  },
]

// 平台优势
const advantages = [
  {
    title: '高性能交易引擎',
    description: '采用低延迟架构，交易执行速度快至毫秒级',
  },
  {
    title: '安全可靠',
    description: '多重安全防护机制，保障资金和数据安全',
  },
  {
    title: '专业图表工具',
    description: '提供丰富的技术指标和分析工具，助您做出明智决策',
  },
  {
    title: '全球市场',
    description: '覆盖全球主要股票市场，提供多元化投资选择',
  },
]
</script>

<template>
  <div class="stock-home ">
    <!-- 主页横幅 -->
    <div class="from-blue-600 to-indigo-800 bg-gradient-to-r text-white">
      <div class="mx-auto px-4 py-20 container md:py-32">
        <div class="max-w-3xl">
          <h1 class="mb-6 text-4xl font-bold md:text-5xl">
            专业的股票交易平台
          </h1>
          <p class="mb-8 text-xl opacity-90 md:text-2xl">
            安全、高效、专业的交易体验，助您把握每一次市场机会
          </p>
          <div class="flex flex-wrap gap-4">
            <el-button type="primary" size="large" @click="goToMarketPage">
              开始交易
              <el-icon class="ml-2">
                <ArrowRight />
              </el-icon>
            </el-button>
            <el-button type="default" size="large" plain>
              了解更多
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 核心功能 -->
    <div class=" py-16">
      <div class="mx-auto px-4 container">
        <h2 class="mb-12 text-center text-3xl  font-bold">
          核心功能
        </h2>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-4 md:grid-cols-2">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="overflow-hidden border  shadow-md transition-shadow hover:shadow-lg"
          >
            <div :class="`bg-gradient-to-r ${feature.color} p-6 `">
              <component :is="feature.icon" class="mb-4 text-4xl" />
              <h3 class="mb-2 text-xl font-semibold">
                {{ feature.title }}
              </h3>
              <p class="mb-4 opacity-90">
                {{ feature.description }}
              </p>
            </div>
            <div class="p-4 text-right">
              <el-button type="primary" @click="feature.route">
                {{ feature.action }}
                <el-icon class="ml-1">
                  <ArrowRight />
                </el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 平台介绍 -->
    <div class="py-16">
      <div class="mx-auto px-4 container">
        <div class="flex flex-col items-center md:flex-row">
          <div class="mb-8 md:mb-0 md:w-1/2 md:pr-8">
            <h2 class="mb-6 text-3xl  font-bold">
              为什么选择 StockVision
            </h2>
            <p class="mb-6 ">
              StockVision 是一个专业的股票交易平台，致力于为投资者提供安全、高效、专业的交易体验。
              我们的平台采用先进的技术架构，提供毫秒级的行情推送和交易执行，帮助您把握每一次市场机会。
            </p>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div v-for="(adv, index) in advantages" :key="index" class="border-l-4 border-blue-500 py-2 pl-4">
                <h4 class="text-lg font-semibold">
                  {{ adv.title }}
                </h4>
                <p class="text-sm">
                  {{ adv.description }}
                </p>
              </div>
            </div>
          </div>
          <div class="md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1470&auto=format&fit=crop"
              alt="Trading Platform"
              class="w-full border rounded-lg shadow-lg"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 开始使用 -->
    <div class="from-blue-600 to-indigo-800 bg-gradient-to-r py-16 text-center">
      <div class="mx-auto px-4 container">
        <h2 class="mb-6 text-3xl font-bold">
          准备好开始交易了吗？
        </h2>
        <p class="mx-auto mb-8 max-w-2xl text-xl opacity-90">
          加入 StockVision，体验专业的交易工具和实时行情，把握市场每一次机会
        </p>
        <el-button type="primary" size="large" @click="goToMarketPage">
          立即开始
          <el-icon class="ml-2">
            <ArrowRight />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 简化的页脚 -->
    <footer class="border-t  py-10 ">
      <div class="mx-auto px-4 container">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 class="mb-4 text-lg font-semibold">
              关于我们
            </h3>
            <p>
              StockVision 是一个专业的股票交易平台，致力于为投资者提供安全、高效、专业的交易体验。
            </p>
          </div>
          <div>
            <h3 class="mb-4 text-lg font-semibold">
              产品服务
            </h3>
            <ul class="space-y-2">
              <li><a href="#">行情数据</a></li>
              <li><a href="#">交易系统</a></li>
            </ul>
          </div>
          <div>
            <h3 class="mb-4 text-lg font-semibold">
              帮助中心
            </h3>
            <ul class="space-y-2">
              <li><a href="#">新手指南</a></li>
              <li><a href="#">常见问题</a></li>
            </ul>
          </div>
          <div>
            <h3 class="mb-4 text-lg font-semibold">
              联系我们
            </h3>
            <p class="mb-2">
              客服电话：400-123-4567
            </p>
            <p class="mb-2">
              邮箱：support@stockvision.com
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.stock-home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
