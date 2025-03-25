/**
 * HTTP 请求工具
 * 基于 axios 封装，自动添加 JWT 令牌
 */

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '', // API 基础路径
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 如果本地存储中有 token，则添加到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 如果响应码不为 200，表示请求失败
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')

      // 如果响应码为 401，表示未授权，清除本地存储中的 token，并跳转到登录页
      if (res.code === 401) {
        handleUnauthorized()
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error) => {
    console.error('响应错误:', error)

    // 如果响应状态码为 401，表示未授权
    if (error.response && error.response.status === 401) {
      handleUnauthorized()
    }
    else {
      ElMessage.error('网络错误，请稍后重试')
    }

    return Promise.reject(error)
  },
)

/**
 * 处理未授权情况
 */
function handleUnauthorized() {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('username')

  ElMessage.error('登录已过期，请重新登录')

  // 如果不是登录页，则跳转到登录页
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

/**
 * GET 请求
 * @param url - 请求地址
 * @param params - 请求参数
 * @param config - 请求配置
 * @returns Promise
 */
export function get<T = any>(url: string, params = {}, config: AxiosRequestConfig = {}): Promise<T> {
  return service.get(url, { params, ...config })
}

/**
 * POST 请求
 * @param url - 请求地址
 * @param data - 请求数据
 * @param config - 请求配置
 * @returns Promise
 */
export function post<T = any>(url: string, data = {}, config: AxiosRequestConfig = {}): Promise<T> {
  return service.post(url, data, config)
}

/**
 * PUT 请求
 * @param url - 请求地址
 * @param data - 请求数据
 * @param config - 请求配置
 * @returns Promise
 */
export function put<T = any>(url: string, data = {}, config: AxiosRequestConfig = {}): Promise<T> {
  return service.put(url, data, config)
}

/**
 * DELETE 请求
 * @param url - 请求地址
 * @param data - 请求数据
 * @param config - 请求配置
 * @returns Promise
 */
export function del<T = any>(url: string, data = {}, config: AxiosRequestConfig = {}): Promise<T> {
  return service.delete(url, { data, ...config })
}

export default {
  get,
  post,
  put,
  del,
}
