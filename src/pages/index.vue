<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowRight, 
  DataLine, 
  TrendCharts, 
  InfoFilled,
  ShoppingCart,
  Connection
} from '@element-plus/icons-vue'

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
    route: goToMarketPage
  },
  {
    icon: InfoFilled,
    title: '股票信息',
    description: '全面的股票基本信息和公司概况',
    action: '查看信息',
    color: 'from-purple-500 to-purple-600',
    route: goToStockInfoPage
  },
  {
    icon: ShoppingCart,
    title: '便捷交易',
    description: '一键下单，快速执行交易策略',
    action: '立即交易',
    color: 'from-green-500 to-green-600',
    route: goToTradePage
  },
  {
    icon: TrendCharts,
    title: '技术分析',
    description: '专业的技术指标和图表分析工具',
    action: '开始分析',
    color: 'from-orange-500 to-orange-600',
    route: goToMarketPage
  }
]

// 平台优势
const advantages = [
  {
    title: '高性能交易引擎',
    description: '采用低延迟架构，交易执行速度快至毫秒级'
  },
  {
    title: '安全可靠',
    description: '多重安全防护机制，保障资金和数据安全'
  },
  {
    title: '专业图表工具',
    description: '提供丰富的技术指标和分析工具，助您做出明智决策'
  },
  {
    title: '全球市场',
    description: '覆盖全球主要股票市场，提供多元化投资选择'
  }
]
</script>

<template>
  <div class="stock-home bg-gray-900">
    <!-- 主页横幅 -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-800 text-white">
      <div class="container mx-auto px-4 py-20 md:py-32">
        <div class="max-w-3xl">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">专业的股票交易平台</h1>
          <p class="text-xl md:text-2xl mb-8 opacity-90">安全、高效、专业的交易体验，助您把握每一次市场机会</p>
          <div class="flex flex-wrap gap-4">
            <el-button type="primary" size="large" @click="goToMarketPage">
              开始交易
              <el-icon class="ml-2"><ArrowRight /></el-icon>
            </el-button>
            <el-button type="default" size="large" plain>
              了解更多
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 核心功能 -->
    <div class="py-16 bg-gray-900">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-white">核心功能</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            v-for="(feature, index) in features" 
            :key="index" 
            class="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-700"
          >
            <div :class="`bg-gradient-to-r ${feature.color} p-6 text-white`">
              <component :is="feature.icon" class="text-4xl mb-4" />
              <h3 class="text-xl font-semibold mb-2">{{ feature.title }}</h3>
              <p class="opacity-90 mb-4">{{ feature.description }}</p>
            </div>
            <div class="p-4 text-right">
              <el-button type="primary" @click="feature.route">
                {{ feature.action }}
                <el-icon class="ml-1"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 平台介绍 -->
    <div class="py-16 bg-gray-800">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center">
          <div class="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h2 class="text-3xl font-bold mb-6 text-white">为什么选择 StockVision</h2>
            <p class="text-gray-300 mb-6">
              StockVision 是一个专业的股票交易平台，致力于为投资者提供安全、高效、专业的交易体验。
              我们的平台采用先进的技术架构，提供毫秒级的行情推送和交易执行，帮助您把握每一次市场机会。
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(adv, index) in advantages" :key="index" class="border-l-4 border-blue-500 pl-4 py-2">
                <h4 class="font-semibold text-lg text-white">{{ adv.title }}</h4>
                <p class="text-gray-300 text-sm">{{ adv.description }}</p>
              </div>
            </div>
          </div>
          <div class="md:w-1/2">
            <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1470&auto=format&fit=crop" 
                 alt="Trading Platform" 
                 class="rounded-lg shadow-lg w-full border border-gray-700" />
          </div>
        </div>
      </div>
    </div>

    <!-- 开始使用 -->
    <div class="py-16 bg-gradient-to-r from-blue-600 to-indigo-800 text-white text-center">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold mb-6">准备好开始交易了吗？</h2>
        <p class="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          加入 StockVision，体验专业的交易工具和实时行情，把握市场每一次机会
        </p>
        <el-button type="primary" size="large" @click="goToMarketPage">
          立即开始
          <el-icon class="ml-2"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 简化的页脚 -->
    <footer class="bg-gray-800 text-white py-10 border-t border-gray-700">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4">关于我们</h3>
            <p class="text-gray-400">
              StockVision 是一个专业的股票交易平台，致力于为投资者提供安全、高效、专业的交易体验。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">产品服务</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-300 hover:text-white">行情数据</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white">交易系统</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white">量化策略</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white">API接口</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">帮助中心</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-gray-300 hover:text-white">新手指南</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white">常见问题</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white">费用说明</a></li>
              <li><a href="#" class="text-gray-300 hover:text-white">安全保障</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">联系我们</h3>
            <p class="text-gray-300 mb-2">客服电话：400-123-4567</p>
            <p class="text-gray-300 mb-2">邮箱：support@stockvision.com</p>
          </div>
        </div>
        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© 2023 StockVision 股票交易平台 版权所有</p>
          <p class="mt-1">ICP备案号：京ICP备12345678号-1</p>
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

/* 添加过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-button--default.is-plain) {
  color: #e2e8f0;
  border-color: #e2e8f0;
}

:deep(.el-button--default.is-plain:hover) {
  color: #3b82f6;
  border-color: #3b82f6;
}
</style>
