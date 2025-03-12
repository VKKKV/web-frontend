import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * 身份验证组合式函数
 * 用于管理登录状态和用户信息
 */
export function useAuth() {
  const router = useRouter()
  
  // 登录状态
  const isLoggedIn = ref(false)
  
  // 用户信息
  const userId = ref(null)
  const username = ref('')
  
  // 上次访问的页面，用于登录后重定向
  const lastVisitedPath = ref('/')
  
  // 初始化登录状态
  const initAuth = () => {
    const token = localStorage.getItem('token')
    const storedUserId = localStorage.getItem('userId')
    const storedUsername = localStorage.getItem('username')
    
    if (token && storedUserId && storedUsername) {
      isLoggedIn.value = true
      userId.value = storedUserId
      username.value = storedUsername
    } else {
      isLoggedIn.value = false
      userId.value = null
      username.value = ''
    }
  }
  
  // 设置登录信息
  const setLoginInfo = (token, id, name) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userId', id)
    localStorage.setItem('username', name)
    
    isLoggedIn.value = true
    userId.value = id
    username.value = name
  }
  
  // 清除登录信息
  const clearLoginInfo = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    
    isLoggedIn.value = false
    userId.value = null
    username.value = ''
  }
  
  // 登出
  const logout = () => {
    clearLoginInfo()
    router.push('/login')
  }
  
  // 保存上次访问的页面
  const saveLastVisitedPath = (path) => {
    // 不保存登录和注册页面
    if (path !== '/login' && path !== '/register') {
      lastVisitedPath.value = path
    }
  }
  
  // 重定向到登录页面
  const redirectToLogin = (currentPath) => {
    saveLastVisitedPath(currentPath)
    router.push('/login')
  }
  
  // 登录后重定向
  const redirectAfterLogin = () => {
    router.push(lastVisitedPath.value || '/')
  }
  
  // 检查是否需要登录
  const checkAuth = (requireAuth = true) => {
    if (requireAuth && !isLoggedIn.value) {
      redirectToLogin(router.currentRoute.value.path)
      return false
    }
    
    if (!requireAuth && isLoggedIn.value) {
      router.push('/')
      return false
    }
    
    return true
  }
  
  // 初始化
  onMounted(() => {
    initAuth()
  })
  
  return {
    isLoggedIn: computed(() => isLoggedIn.value),
    userId: computed(() => userId.value),
    username: computed(() => username.value),
    lastVisitedPath,
    setLoginInfo,
    clearLoginInfo,
    logout,
    saveLastVisitedPath,
    redirectToLogin,
    redirectAfterLogin,
    checkAuth,
    initAuth
  }
} 