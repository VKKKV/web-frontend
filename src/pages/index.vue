<script setup>
import {
  ArrowRight,
  DataLine,
  InfoFilled,
  ShoppingCart,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到实时行情页面 (Market)
function goToMarketPage() {
  router.push('/nav/Market')
}

// 跳转到交易页面
function goToTradePage() {
  router.push('/nav/Trade')
}

// 跳转到股票信息页面
function goToMarketDataPage() {
  router.push('/MarketData')
}

// 跳转到Login or Register or Account
function goToLogin() {
  router.push('/Login')
}

// 核心功能列表
const features = [
  {
    icon: DataLine,
    title: '实时行情',
    description: '毫秒级行情推送，精准把握市场脉搏',
    action: '查看行情',
    color: 'text-blue-500',
    route: goToMarketPage,
  },
  {
    icon: InfoFilled,
    title: '行情数据',
    description: '全面的股票行情数据',
    action: '查看数据',
    color: 'text-purple-500',
    route: goToMarketDataPage,
  },
  {
    icon: ShoppingCart,
    title: '便捷交易',
    description: '一键下单，快速执行交易',
    action: '立即交易',
    color: 'text-green-500',
    route: goToTradePage,
  },
]
</script>

<template>
  <div class="stock-home">
    <!-- Hero Section -->
    <section class="relative from-blue-600 to-indigo-700 bg-gradient-to-r py-10 sm:py-14">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center space-y-3">
          <h1 class="text-2xl text-white font-bold tracking-tight sm:text-3xl">
            专业的股票交易平台
          </h1>
          <p class="text-sm text-white leading-5 opacity-90">
            安全、高效、专业的交易体验，助您把握每一次市场机会。
          </p>
          <div class="pt-3 space-x-2">
            <el-button type="primary" size="large" @click="goToMarketPage">
              开始交易
              <el-icon class="ml-2">
                <ArrowRight />
              </el-icon>
            </el-button>
            <el-button type="success" size="large" @click="goToLogin">
              立即注册
              <el-icon class="ml-2">
                <ArrowRight />
              </el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto mb-8 max-w-2xl text-center lg:mb-12">
          <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
            核心功能
          </h2>
          <p class="mt-2 text-base leading-7">
            探索我们平台提供的强大功能，助您在市场中领先一步。
          </p>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <el-card
            v-for="(feature, index) in features"
            :key="index"
            shadow="hover"
            class="feature-card border-t-4"
            :style="{ borderTopColor: feature.color.replace('text-', '').split('-')[0] }"
          >
            <template #header>
              <div class="flex items-center">
                <component :is="feature.icon" :class="`mr-3 h-8 w-8 ${feature.color}`" />
                <h3 class="text-xl font-semibold">
                  {{ feature.title }}
                </h3>
              </div>
            </template>
            <p class="mb-6">
              {{ feature.description }}
            </p>
            <div class="text-right">
              <el-button type="primary" plain @click="feature.route">
                {{ feature.action }}
                <el-icon class="ml-1">
                  <ArrowRight />
                </el-icon>
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </section>

    <!-- Platform Introduction Section -->
    <section class="py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
              为什么选择 StockVision
            </h2>
            <p class="mt-4 text-base leading-7">
              StockVision 致力于为投资者提供安全、高效、专业的交易体验。我们的平台采用先进的技术架构，提供毫秒级的行情推送和交易执行，助您把握每一次市场机遇。
            </p>
            <ul class="mt-6 space-y-3">
              <li class="flex items-start">
                <el-icon class="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-blue-600">
                  <DataLine />
                </el-icon>
                <span><strong class="font-semibold">高性能引擎:</strong> 低延迟架构，交易执行快至毫秒级。</span>
              </li>
              <li class="flex items-start">
                <el-icon class="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-blue-600">
                  <InfoFilled />
                </el-icon>
                <span><strong class="font-semibold">安全可靠:</strong> 多重安全防护，保障资金数据安全。</span>
              </li>
            </ul>
          </div>
          <div class="flex justify-center">
            <img
              class="max-w-md w-full rounded-lg object-cover shadow-xl"
              src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Trading Platform Visualization"
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="from-blue-600 to-indigo-700 bg-gradient-to-r py-12 text-white sm:py-16">
      <div class="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
          准备好开始交易了吗？
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-base leading-7 opacity-90">
          立即加入 StockVision，体验专业的交易工具和实时行情，把握市场机遇。
        </p>
        <div class="mt-8">
          <el-button type="primary" size="large" @click="goToTradePage">
            立即开始
            <el-icon class="ml-2">
              <ArrowRight />
            </el-icon>
          </el-button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t py-6">
      <div class="mx-auto max-w-7xl px-6 text-center text-gray-600 lg:px-8">
        <p class="text-sm leading-6">
          &copy; {{ new Date().getFullYear() }} StockVision. 保留所有权利。
        </p>
        <p class="mt-2 text-xs leading-5">
          投资有风险，入市需谨慎。本平台信息仅供参考，不构成投资建议。
        </p>
      </div>
    </footer>
  </div>
</template>

  <style scoped>
    .stock-home {
  /* 改为自动高度 */
  min-height: auto;
  display: flex;
  flex-direction: column;
}

.feature-card {
  /* 减小卡片的悬停移动距离 */
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.feature-card:hover {
  transform: translateY(-3px);
}

section img {
  /* 调整图片比例 */
  aspect-ratio: 16 / 9;
  max-height: 400px;
}

.footer {
  /* 确保footer不会有过大间距 */
  margin-top: auto;
}
</style>
