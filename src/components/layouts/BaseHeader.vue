<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toggleDark } from '~/composables'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const { isLoggedIn, username, logout, initAuth } = useAuth()

// 初始化登录状态
onMounted(() => {
  initAuth()
})

// 处理用户菜单点击
function handleUserClick() {
  if (isLoggedIn.value) {
    router.push('/nav/account')
  }
  else {
    router.push('/login')
  }
}
</script>

<template>
  <el-menu class="el-menu-demo" mode="horizontal" :ellipsis="false" router>
    <el-menu-item index="/">
      <div class="flex items-center justify-center gap-2">
        <div class="text-xl" i-ep-element-plus />
        <span>StockVision</span>
      </div>
    </el-menu-item>
    <el-menu-item index="/">
      <template #title>
        <el-icon>
          <home-filled />
        </el-icon>
        <span>首页</span>
      </template>
    </el-menu-item>

    <el-menu-item index="/nav/Market">
      <el-icon>
        <data-analysis />
      </el-icon>
      <span>行情图表</span>
    </el-menu-item>

    <el-menu-item index="/MarketData">
      <el-icon>
        <info-filled />
      </el-icon>
      <span>股票信息</span>
    </el-menu-item>

    <el-menu-item index="/nav/Trade">
      <el-icon>
        <shopping-cart />
      </el-icon>
      <span>交易</span>
    </el-menu-item>

    <!-- 用户入口 - 未登录时点击进入登录页，已登录时点击进入账户页 -->
    <el-menu-item @click="handleUserClick">
      <el-icon>
        <user />
      </el-icon>
      <span v-if="!isLoggedIn">用户登录</span>
      <span v-else>{{ username }}</span>
    </el-menu-item>

    <!-- 已登录状态显示退出按钮 -->
    <el-menu-item v-if="isLoggedIn" @click="logout">
      <el-icon>
        <switch-button />
      </el-icon>
      <span>退出</span>
    </el-menu-item>

    <el-menu-item h="full" @click="toggleDark()">
      <button
        class="w-full cursor-pointer border-none bg-transparent"
        style="height: var(--ep-menu-item-height)"
      >
        <i inline-flex i="dark:ep-moon ep-sunny" />
      </button>
    </el-menu-item>
  </el-menu>
</template>

<style lang="scss">
.el-menu-demo {
  &.ep-menu--horizontal > .ep-menu-item:nth-child(1) {
    margin-right: auto;
  }
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}
</style>
