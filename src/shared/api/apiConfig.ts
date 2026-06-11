/**
 * API配置文件
 * 支持多环境配置
 */

/**
 * 环境类型
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * 当前环境
 */
export const NODE_ENV = (process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV) as Environment;

/**
 * API基础配置
 */
export const API_CONFIG = {
  /**
   * API基础URL
   * 开发环境使用本地mock服务器
   * 生产环境使用真实API地址
   */
  BASE_URL: getBaseUrl(),

  /**
   * API超时时间（毫秒）
   */
  TIMEOUT: getTimeout(),

  /**
   * 请求头配置
   */
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },

  /**
   * 重试配置
   */
  RETRY: {
    maxRetries: 3,
    retryDelay: 1000, // 重试延迟1秒
    retryableStatus: [408, 429, 500, 502, 503, 504], // 可重试的状态码
  },

  /**
   * 请求缓存配置
   */
  CACHE: {
    enabled: NODE_ENV !== Environment.DEVELOPMENT, // 生产环境启用缓存
    ttl: 60000, // 缓存有效期60秒
    maxSize: 100, // 最大缓存数量
  },

  /**
   * 文件上传配置
   */
  UPLOAD: {
    maxSize: 10 * 1024 * 1024, // 10MB
    timeout: 300000, // 5分钟
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.ms-excel'],
  },

  /**
   * 分页配置
   */
  PAGINATION: {
    defaultPageSize: 15,
    pageSizeOptions: [10, 15, 20, 50, 100],
  },

  /**
   * 监控配置
   */
  MONITORING: {
    enabled: NODE_ENV === Environment.PRODUCTION, // 生产环境启用监控
    logLevel: 'INFO', // 日志级别
    slowThreshold: 1000, // 慢接口阈值（1秒）
  },

  /**
   * 功能开关
   */
  FEATURES: {
    enableNewApi: false, // 是否启用新API
    enableApiFallback: false, // 是否启用API降级
    enableDetailedLogs: false, // 是否启用详细日志
  },

  /**
   * 获取认证Token（从 localStorage，key 与 authStore 保持一致）
   */
  getAuthToken(): string | null {
    return localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || null;
  },

  /**
   * 是否是开发环境（供 apiClient.ts 调用）
   */
  isDevelopment(): boolean {
    return NODE_ENV === Environment.DEVELOPMENT || !NODE_ENV;
  },
};

/**
 * 获取API基础URL
 */
function getBaseUrl(): string {
  // 统一使用相对路径 /api，由 nginx 代理到后端 Express 8088
  // 这样无论开发还是生产环境，都通过 nginx 反代，避免跨域问题
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  if (envUrl) return envUrl;
  return '/api';
}

/**
 * 获取API超时时间
 */
function getTimeout(): number {
  const timeout = process.env.REACT_APP_API_TIMEOUT;
  return timeout ? parseInt(timeout) : 30000; // 默认30秒
}

/**
 * 获取认证token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token') || null;
};

/**
 * 设置认证token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

/**
 * 清除认证token
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

/**
 * 检查是否启用新API
 */
export const isNewApiEnabled = (): boolean => {
  return API_CONFIG.FEATURES.enableNewApi || false;
};

/**
 * 是否应该启用详细日志
 */
export const shouldEnableDetailedLogs = (): boolean => {
  return NODE_ENV === Environment.DEVELOPMENT || API_CONFIG.FEATURES.enableDetailedLogs;
};

/**
 * 获取完整的API端点URL
 */
export const getApiEndpoint = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // 移除末尾的斜杠
  const cleanEndpoint = endpoint.replace(/^\//, ''); // 移除开头的斜杠
  return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * 是否是生产环境
 */
export const isProduction = (): boolean => {
  return NODE_ENV === Environment.PRODUCTION;
};

/**
 * 是否是开发环境
 */
export const isDevelopment = (): boolean => {
  return NODE_ENV === Environment.DEVELOPMENT;
};

export default API_CONFIG;
