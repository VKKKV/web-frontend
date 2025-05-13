import { ElMessage } from 'element-plus'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes' // 自动导入的路由

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 获取登录状态
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  // 保存上次访问的页面，用于登录后重定向
  if (from.path !== '/login' && from.path !== '/register') {
    localStorage.setItem('lastVisitedPath', from.path)
  }

  // 需要登录的页面 meta 标记
  if (to.meta.requiresAuth && !isLoggedIn) {
    ElMessage.warning('请先登录')
    return next('/Login')
  }

  // 已登录时禁止访问登录/注册页
  if ((to.path === '/Login' || to.path === '/Register') && isLoggedIn) {
    ElMessage.warning('您已登录')
    return next('/')
  }
  next()
})

export default router
