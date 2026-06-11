/**
 * 基础API服务类
 * 为所有业务模块API服务提供统一的基类
 * 包含通用的CRUD操作和错误处理
 */

import { ApiClient } from './apiClient';
import { PageQuery, PageResult, ApiResponse } from './requestTypes';
import { message } from 'antd';

/**
 * 基础API服务基类
 * 所有业务模块API服务都应继承此基类
 */
export abstract class BaseApiService {
  protected apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * 处理API请求错误
   */
  protected handleApiError<T>(
    error: any,
    operation: string,
    errorMsg: string = operation + '失败'
  ): Promise<T> {
    console.error(`API请求失败: ${operation}`, error);
    message.error(errorMsg);
    return Promise.reject(error);
  }

  /**
   * 处理API响应
   */
  protected handleApiResponse<T>(
    response: any,
    operation: string
  ): T {
    if (response && response.code === 200) {
      return (response as any).data;
    } else {
      const errMsg = (response && response.message) || operation + '失败';
      const error = new Error(errMsg);
      (error as any).code = response && response.code;
      throw error;
    }
  }

  /**
   * 分页查询
   */
  protected buildPageQuery(
    baseQuery: Partial<PageQuery> | Record<string, any>,
    additionalParams?: Record<string, any>
  ): Record<string, any> {
    return {
      ...baseQuery,
      ...additionalParams,
      current: (baseQuery as any).current || 1,
      pageSize: (baseQuery as any).pageSize || 15,
    };
  }

  /**
   * GET请求
   */
  protected async get<T>(
    url: string,
    query?: Record<string, any>,
    additionalParams?: Record<string, any>
  ): Promise<T> {
    try {
      const params = query ? { ...query, ...additionalParams } : additionalParams;
      const response = await this.apiClient.get<ApiResponse<T>>(
        url,
        params ? { params } : undefined
      );

      return this.handleApiResponse<T>(response, '加载数据');
    } catch (error: any) {
      await this.handleApiError(error, '加载数据', '加载数据失败');
      throw error;
    }
  }

  /**
   * POST请求
   */
  protected async post<T>(
    url: string,
    data: any,
    skipRetry?: boolean
  ): Promise<T> {
    try {
      const response = await this.apiClient.post<ApiResponse<T>>(
        url,
        data,
        { skipRetry }
      );

      return this.handleApiResponse<T>(response, '创建数据');
    } catch (error: any) {
      await this.handleApiError(error, '创建数据', '创建数据失败');
      throw error;
    }
  }

  /**
   * PUT请求
   */
  protected async put<T>(
    url: string,
    data: any,
    skipRetry?: boolean
  ): Promise<T> {
    try {
      const response = await this.apiClient.put<ApiResponse<T>>(
        url,
        data,
        { skipRetry }
      );

      return this.handleApiResponse<T>(response, '更新数据');
    } catch (error: any) {
      await this.handleApiError(error, '更新数据', '更新数据失败');
      throw error;
    }
  }

  /**
   * DELETE请求
   */
  protected async delete<T>(
    url: string,
    data?: any,
    skipRetry?: boolean
  ): Promise<void> {
    try {
      const response = await this.apiClient.delete<ApiResponse<T>>(
        url,
        data,
        { skipRetry }
      );

      return this.handleApiResponse<void>(response, '删除数据');
    } catch (error: any) {
      await this.handleApiError(error, '删除数据', '删除数据失败');
      throw error;
    }
  }

  /**
   * 批量操作
   */
  protected async batch<T>(
    url: string,
    data: any,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
    skipRetry?: boolean
  ): Promise<T> {
    try {
      const response = await this.apiClient.post<ApiResponse<T>>(url, data, { skipRetry });
      return this.handleApiResponse<T>(response, '批量操作');
    } catch (error: any) {
      await this.handleApiError(error, '批量操作', '批量操作失败');
      throw error;
    }
  }

  /**
   * 文件上传
   */
  protected async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    try {
      const response = await this.apiClient.uploadFile<ApiResponse<T>>(
        url,
        file,
        onProgress
      );

      return this.handleApiResponse<T>(response, '文件上传');
    } catch (error: any) {
      await this.handleApiError(error, '文件上传', '文件上传失败');
      throw error;
    }
  }

  /**
   * 显示成功消息
   */
  protected showSuccess(msg: string): void {
    message.success(msg);
  }

  /**
   * 显示错误消息
   */
  protected showError(msg: string): void {
    message.error(msg);
  }
}

// 导出用于导入
export default BaseApiService;
