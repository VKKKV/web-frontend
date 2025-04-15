import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 需要登录才能访问的路由
const authRoutes = [
  '/nav/account',
  '/nav/trade',
  '/classManage/class',
  '/classManage/student',
  '/problemManage/cnki',
  '/problemManage/wf',
  '/problemManage/springerlink',
  '/problemManage/scopus',
  '/problemManage/ebsco'
]

// 无需登录即可访问的路由
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/nav/stockinfo',
  '/nav/market',
  '/nav/marketData',
  '/nav/test',
]

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 获取登录状态
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  // 保存上次访问的页面，用于登录后重定向
  if (from.path !== '/login' && from.path !== '/register') {
    localStorage.setItem('lastVisitedPath', from.path)
  }

  // 如果访问的是需要登录的页面，但未登录，则重定向到登录页
  if (authRoutes.some(path => to.path.startsWith(path)) && !isLoggedIn) {
    return next('/login')
  }

  // 如果已登录，但访问的是登录或注册页，则重定向到首页
  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return next('/')
  }

  // 其他情况正常放行
  next()
})

export default router
