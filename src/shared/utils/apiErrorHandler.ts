/**
 * API 错误处理工具
 * 统一处理 Axios 错误，提供标准化错误对象和友好提示
 */
import { AxiosError } from 'axios';

/**
 * 标准化 API 错误对象
 */
export interface ApiError {
  code: number;
  message: string;
  originalError?: any;
  isNetworkError: boolean;
  isAuthError: boolean;
  isServerError: boolean;
}

/**
 * API 错误处理器
 */
export class ApiErrorHandler {
  /**
   * 将 Axios 错误转换为标准化 ApiError
   */
  static createApiError(error: any, context?: string): ApiError {
    // 网络层错误（无 response，服务不可达）
    if (!error.response) {
      return {
        code: 0,
        message: '网络连接失败，请检查后端服务是否启动（端口8080）',
        originalError: error,
        isNetworkError: true,
        isAuthError: false,
        isServerError: false,
      };
    }

    const status = error.response?.status ?? 500;
    const serverMessage =
      error.response?.data?.message || error.message || '操作失败';

    const isAuthError = status === 401 || status === 403;
    const isServerError = status >= 500;

    let message: string;
    switch (status) {
      case 400: message = serverMessage || '请求参数有误'; break;
      case 401: message = '登录已过期，请重新登录'; break;
      case 403: message = '没有操作权限'; break;
      case 404: message = '请求的资源不存在'; break;
      case 409: message = serverMessage || '数据冲突，请刷新后重试'; break;
      case 422: message = serverMessage || '数据校验失败'; break;
      case 429: message = '操作过于频繁，请稍后再试'; break;
      case 500: message = serverMessage || '服务器内部错误，请联系管理员'; break;
      case 502: message = '服务暂时不可用（502）'; break;
      case 503: message = '服务维护中，请稍后重试'; break;
      default:  message = serverMessage || `请求失败（${status}）`;
    }

    return {
      code: status,
      message,
      originalError: error,
      isNetworkError: false,
      isAuthError,
      isServerError,
    };
  }

  /**
   * 判断是否需要跳转到登录页
   */
  static shouldRedirectToLogin(error: ApiError): boolean {
    return error.isAuthError && error.code === 401;
  }

  /**
   * 获取面向用户展示的错误提示文案
   */
  static getDisplayMessage(error: ApiError): string {
    return error.message;
  }
}

export default ApiErrorHandler;
