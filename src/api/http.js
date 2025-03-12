/**
 * HTTP 请求工具
 * 基于 fetch API 封装，自动添加 JWT 令牌
 */

import { ElMessage } from 'element-plus'

// API 基础路径
const BASE_URL = ''

/**
 * 封装的 HTTP 请求方法
 * @param {string} url - 请求地址
 * @param {Object} options - 请求选项
 * @returns {Promise} - 返回 Promise
 */
export const http = async (url, options = {}) => {
  // 默认请求头
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // 如果本地存储中有 token，则添加到请求头
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 合并选项
  const config = {
    ...options,
    headers
  }

  try {
    // 发送请求
    const response = await fetch(`${BASE_URL}${url}`, config)
    
    // 如果响应状态码为 401，表示未授权，清除本地存储中的 token，并跳转到登录页
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
      
      ElMessage.error('登录已过期，请重新登录')
      
      // 如果不是登录页，则跳转到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    
    // 解析响应
    const data = await response.json()
    
    // 如果响应码不为 200，表示请求失败
    if (data.code !== 200) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    
    // 返回响应数据
    return data
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
    return Promise.reject(error)
  }
}

/**
 * GET 请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @returns {Promise} - 返回 Promise
 */
export const get = (url, params = {}) => {
  // 将参数转换为查询字符串
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
  
  // 如果有参数，则添加到 URL 中
  const requestUrl = queryString ? `${url}?${queryString}` : url
  
  return http(requestUrl, { method: 'GET' })
}

/**
 * POST 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @returns {Promise} - 返回 Promise
 */
export const post = (url, data = {}) => {
  return http(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * PUT 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @returns {Promise} - 返回 Promise
 */
export const put = (url, data = {}) => {
  return http(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * DELETE 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @returns {Promise} - 返回 Promise
 */
export const del = (url, data = {}) => {
  return http(url, {
    method: 'DELETE',
    body: JSON.stringify(data)
  })
}

export default {
  get,
  post,
  put,
  del
} 