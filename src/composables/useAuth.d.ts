import { ComputedRef, Ref } from 'vue'

/**
 * 身份验证组合式函数的返回值类型
 */
export interface UseAuthReturn {
  /**
   * 是否已登录
   */
  isLoggedIn: ComputedRef<boolean>
  
  /**
   * 用户ID
   */
  userId: ComputedRef<string | null>
  
  /**
   * 用户名
   */
  username: ComputedRef<string>
  
  /**
   * 上次访问的页面路径
   */
  lastVisitedPath: Ref<string>
  
  /**
   * 设置登录信息
   * @param token JWT令牌
   * @param id 用户ID
   * @param name 用户名
   */
  setLoginInfo: (token: string, id: string | number, name: string) => void
  
  /**
   * 清除登录信息
   */
  clearLoginInfo: () => void
  
  /**
   * 登出
   */
  logout: () => void
  
  /**
   * 保存上次访问的页面路径
   * @param path 页面路径
   */
  saveLastVisitedPath: (path: string) => void
  
  /**
   * 重定向到登录页面
   * @param currentPath 当前页面路径
   */
  redirectToLogin: (currentPath: string) => void
  
  /**
   * 登录后重定向
   */
  redirectAfterLogin: () => void
  
  /**
   * 检查是否需要登录
   * @param requireAuth 是否需要登录
   * @returns 是否通过检查
   */
  checkAuth: (requireAuth?: boolean) => boolean
  
  /**
   * 初始化登录状态
   */
  initAuth: () => void
}

/**
 * 身份验证组合式函数
 * 用于管理登录状态和用户信息
 */
export function useAuth(): UseAuthReturn 