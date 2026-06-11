/**
 * 增强型API客户端
 * 添加请求重试、缓存、监控等功能
 * 支持多环境配置和功能开关
 * 性能优化：集成防抖、节流、请求缓存
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import { ApiResponse } from './requestTypes';
import { API_CONFIG, getAuthToken, isDevelopment } from './apiConfig';
import { ApiLogger } from '../utils/apiMonitor';
import { requestCache, performanceMonitor } from '../utils/performanceUtils';

/**
 * 缓存接口
 */
interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * 请求配置接口
 */
interface RequestConfig extends AxiosRequestConfig {
  skipCache?: boolean;
  skipRetry?: boolean;
  useNewApi?: boolean;
  maxRetries?: number;
  showSuccess?: boolean;
  successText?: string;
  showError?: boolean;
  errorText?: string;
}

/**
 * 增强型API客户端
 */
class ApiClient {
  private http: AxiosInstance;
  private cache: Map<string, CacheEntry>;
  private pendingRequests: Map<string, Promise<any>>;

  constructor() {
    this.http = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.cache = new Map();
    this.pendingRequests = new Map();

    this.setupInterceptors();
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.http.interceptors.request.use(
      (config: any) => {
        const requestId = this.generateRequestId();
        config.headers = config.headers || {};
        config.headers['X-Request-ID'] = requestId;

        const token = getAuthToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        config.headers['X-Environment'] = isDevelopment() ? 'development' : 'production';

        const startTime = Date.now();
        config.metadata = { ...config.metadata, startTime };

        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.http.interceptors.response.use(
      (response) => {
        const config = response.config as any;
        const requestId = config.headers?.['X-Request-ID'];
        const url = config.url || 'unknown';
        const method = config.method || 'GET';

        if (requestId) {
          this.pendingRequests.delete(requestId);
        }

        const startTime = config.metadata?.startTime;
        if (startTime) {
          const duration = Date.now() - startTime;
          ApiLogger.logApiCall(method, url, duration, response.status === 200);
        }

        return response;
      },
      (err) => {
        const error = err as AxiosError;
        const config = (error.config || {}) as any;
        const url = config.url || 'unknown';
        const method = config.method || 'GET';

        ApiLogger.logError(error, `${method} ${url}`);

        if (config.headers?.['X-Request-ID']) {
          this.pendingRequests.delete(config.headers['X-Request-ID']);
        }

        // Redirect to login on 401
        if ((error.response?.status === 401) && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 生成缓存key
   */
  private generateCacheKey(method: string | undefined, url: string | undefined, params?: any, data?: any): string {
    const queryString = this.objectToQueryString(params);
    const bodyString = data ? JSON.stringify(data) : '';
    return `${method || 'GET'}:${url || ''}:${queryString}:${bodyString}`;
  }

  /**
   * 对象转查询字符串
   */
  private objectToQueryString(params?: any): string {
    if (!params) return '';
    const keys = Object.keys(params).sort();
    return keys
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  /**
   * GET请求
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const startTime = performance.now();
    try {
      if (!config?.skipCache && API_CONFIG.CACHE.enabled) {
        const cacheKey = this.generateCacheKey('GET', url, config?.params);
        const cached = requestCache.get<T>(cacheKey);
        if (cached) {
          return cached;
        }
        const result = await requestCache.getOrSet(
          cacheKey,
          async () => {
            const response = await this.http.get<T>(url, this.removeInternalFields(config));
            return (response as any).data;
          },
          undefined,
          API_CONFIG.CACHE.ttl
        );
        return result;
      }

      const response = await this.http.get<T>(url, this.removeInternalFields(config));
      const duration = performance.now() - startTime;
      performanceMonitor.record(`GET:${url}`, duration);
      return (response as any).data;
    } catch (error: any) {
      return this.handleRequestError<T>(error, 'GET', url);
    }
  }

  /**
   * POST请求
   */
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.http.post<T>(url, data, this.removeInternalFields(config));
      return (response as any).data;
    } catch (error: any) {
      return this.handleRequestError<T>(error, 'POST', url);
    }
  }

  /**
   * PUT请求
   */
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.http.put<T>(url, data, this.removeInternalFields(config));
      return (response as any).data;
    } catch (error: any) {
      return this.handleRequestError<T>(error, 'PUT', url);
    }
  }

  /**
   * DELETE请求
   */
  async delete<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.http.delete<T>(url, {
        ...this.removeInternalFields(config),
        data,
      });
      return (response as any).data;
    } catch (error: any) {
      return this.handleRequestError<T>(error, 'DELETE', url);
    }
  }

  /**
   * 文件上传
   */
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<T> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.http.post<T>(url, formData, {
        ...this.removeInternalFields(config),
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress?.(percent);
          }
        },
      });

      return (response as any).data;
    } catch (error: any) {
      return this.handleRequestError<T>(error, 'UPLOAD', url);
    }
  }

  /**
   * 批量请求
   */
  async batchRequest<T>(
    url: string,
    data: any[],
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
    config?: RequestConfig
  ): Promise<T> {
    try {
      const response = await this.http.request<T>({
        method,
        url,
        data,
        ...this.removeInternalFields(config),
      });
      return (response as any).data;
    } catch (error: any) {
      return this.handleRequestError<T>(error, method, url);
    }
  }

  /**
   * 统一错误处理
   */
  private handleRequestError<T>(error: any, method: string, url: string): never {
    const statusCode = error?.response?.status || 500;
    const errorMsg = error?.response?.data?.message || error?.message || '请求失败';

    ApiLogger.logError(error, `${method} ${url}`);

    if (statusCode === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    message.error(errorMsg);
    throw error;
  }

  /**
   * 移除Axios内部字段
   */
  private removeInternalFields(config?: RequestConfig): AxiosRequestConfig {
    if (!config) return {};
    const { skipCache, skipRetry, useNewApi, ...rest } = config;
    return rest;
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear();
    ApiLogger.logApiCall('CLEAR', 'cache', 0, true);
  }

  /**
   * 清除特定缓存
   */
  public clearCacheByPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
    keys.forEach(key => this.cache.delete(key));
    ApiLogger.logApiCall('CLEAR', `cache pattern: ${pattern}`, 0, true);
  }

  /**
   * 获取缓存统计
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * 获取性能统计
   */
  public getPerformanceStats(): any {
    return ApiLogger.getPerformanceStats();
  }

  /**
   * 获取错误统计
   */
  public getErrorStats(): any {
    return ApiLogger.getErrorStats();
  }

  /**
   * 分页请求
   */
  async getPage<T>(url: string, query?: any, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.http.get<T>(url, {
        ...this.removeInternalFields(config),
        params: query,
      });
      return (response as any).data;
    } catch (error: any) {
      return this.handleRequestError<T>(error, 'GET', url);
    }
  }

  /**
   * 导出文件
   */
  async export(url: string, options: {
    params?: any;
    fileName?: string;
    type?: 'excel' | 'csv' | 'pdf';
    config?: RequestConfig;
  } = {}): Promise<void> {
    try {
      const { params, fileName, type = 'excel', config } = options;

      const response = await this.http.get(url, {
        ...this.removeInternalFields(config),
        params,
        responseType: 'blob',
      });

      const blob = new Blob([(response as any).data], { type: this.getMimeType(type) });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${fileName || 'export'}${this.getFileExtension(type)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      ApiLogger.logApiCall('EXPORT', url, 0, true);
    } catch (error: any) {
      ApiLogger.logError(error, `EXPORT ${url}`);
      throw error;
    }
  }

  private getMimeType(type: string): string {
    const mimeTypes: Record<string, string> = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf',
    };
    return mimeTypes[type] || 'application/octet-stream';
  }

  private getFileExtension(type: string): string {
    const extensions: Record<string, string> = {
      excel: '.xlsx',
      csv: '.csv',
      pdf: '.pdf',
    };
    return extensions[type] || '.txt';
  }

  /**
   * 清除所有缓存和pending请求
   */
  public clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    ApiLogger.clearLogs();
  }

  /**
   * 导出日志
   */
  public exportLogs(): string {
    return ApiLogger.exportLogs();
  }
}

// 导出单例实例
export const apiClient = new ApiClient();
export { ApiClient };
