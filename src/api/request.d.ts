/**
 * HTTP 请求工具的类型声明
 */

import { AxiosRequestConfig } from 'axios';

/**
 * API 响应数据
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

/**
 * PUT 请求
 */
export function put<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;

/**
 * 默认导出
 */
declare const _default: {
  get: typeof get;
  post: typeof post;
  put: typeof put;
  del: typeof del;
};

export default _default; 