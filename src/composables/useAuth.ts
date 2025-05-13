import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// 本地存储的键名常量
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_ID: 'userId',
  USERNAME: 'username',
  LAST_VISITED_PATH: 'lastVisitedPath',
  STOCK_FAVORITES: 'stockFavorites',
} as const

/**
 * 身份验证组合式函数
 * 用于管理登录状态和用户信息
 */
export function useAuth() {
  const router = useRouter()

  // 状态
  const isLoggedIn = ref(false)
  const userId = ref<string | number | null>(null)
  const username = ref('')
  const lastVisitedPath = ref('/')

  /**
   * 初始化登录状态
   */
  const initAuth = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID)
    const storedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME)

    if (token && storedUserId && storedUsername) {
      isLoggedIn.value = true
      userId.value = storedUserId
      username.value = storedUsername
    }
    else {
      isLoggedIn.value = false
      userId.value = null
      username.value = ''
    }
    console.log(isLoggedIn.value)
  }

  /**
   * 设置登录信息
   * @param token - JWT令牌
   * @param id - 用户ID
   * @param name - 用户名
   */
  const setLoginInfo = (token: string, id: string | number, name: string) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER_ID, String(id))
    localStorage.setItem(STORAGE_KEYS.USERNAME, name)

    isLoggedIn.value = true
    userId.value = id
    username.value = name
  }

  /**
   * 清除登录信息
   */
  const clearLoginInfo = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_ID)
    localStorage.removeItem(STORAGE_KEYS.USERNAME)
    localStorage.removeItem(STORAGE_KEYS.LAST_VISITED_PATH)
    localStorage.removeItem(STORAGE_KEYS.STOCK_FAVORITES)

    isLoggedIn.value = false
    userId.value = null
    username.value = ''
  }

  /**
   * 登出
   */
  const logout = () => {
    clearLoginInfo()
    router.push('/login')
  }

  /**
   * 保存上次访问的页面路径
   * @param path - 页面路径（排除登录/注册页）
   */
  const saveLastVisitedPath = (path: string) => {
    if (path !== '/login' && path !== '/register') {
      lastVisitedPath.value = path
      localStorage.setItem(STORAGE_KEYS.LAST_VISITED_PATH, path)
    }
  }

  /**
   * 重定向到登录页
   * @param currentPath - 当前页面路径
   */
  const redirectToLogin = (currentPath: string) => {
    saveLastVisitedPath(currentPath)
    router.push('/login')
  }

  /**
   * 登录后重定向
   */
  const redirectAfterLogin = () => {
    const savedPath = localStorage.getItem(STORAGE_KEYS.LAST_VISITED_PATH)
    router.push(savedPath || '/')
  }

  /**
   * 检查认证状态
   * @param requireAuth - 是否需要登录
   * @returns 是否通过检查
   */
  const checkAuth = (requireAuth = true): boolean => {
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

  // 组件挂载时初始化
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
    initAuth,
  }
}

// 导出类型（供其他文件使用）
export type UseAuthReturn = ReturnType<typeof useAuth>
