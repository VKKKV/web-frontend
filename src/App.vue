<template>
  <el-config-provider namespace="ep">
    <BaseHeader />
    <div class="main-container flex">
      <div w="full" py="4">
        <RouterView />
      </div>
    </div>
  </el-config-provider>
</template>

<style>
.main-container {
  height: calc(100vh - var(--ep-menu-item-height) - 4px);
  padding-top: var(--ep-menu-item-height);
}
</style>
