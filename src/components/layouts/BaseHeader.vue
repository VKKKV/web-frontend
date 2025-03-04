<script lang="ts" setup>
import { repository } from '~/../package.json'

import { toggleDark } from '~/composables'
</script>

<template>
  <el-menu class="el-menu-demo" mode="horizontal" :ellipsis="false" router>
    <el-menu-item index="/">
      <div class="flex items-center justify-center gap-2">
        <div class="text-xl" i-ep-element-plus/>
        <span>Element Plus</span>
      </div>
    </el-menu-item>
    <el-menu-item index="/">
      <template #title>
        <el-icon>
          <home-filled/>
        </el-icon>
        <span>首页</span>
      </template>
    </el-menu-item>

    <el-menu-item index="/nav/Market">
      <el-icon>
        <data-analysis/>
      </el-icon>
      <span>行情中心</span>
    </el-menu-item>

    <el-menu-item index="/nav/Trade">
      <el-icon>
        <shopping-cart/>
      </el-icon>
      <span>交易</span>
    </el-menu-item>

    <el-menu-item index="/nav/account">
      <el-icon>
        <user/>
      </el-icon>
      <span>我的账户</span>
    </el-menu-item>

    <el-menu-item h="full" @click="toggleDark()">
      <button
        class="w-full cursor-pointer border-none bg-transparent"
        style="height: var(--ep-menu-item-height)"
      >
        <i inline-flex i="dark:ep-moon ep-sunny"/>
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
