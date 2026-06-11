/**
 * 全局常量定义
 */

// LocalStorage 键名前缀
export const STORAGE_PREFIX = 'mes_';

// LocalStorage 键名
export const STORAGE_KEYS = {
  TOKEN: `${STORAGE_PREFIX}token`,
  USER: `${STORAGE_PREFIX}user`,
  CURRENT_FACTORY: `${STORAGE_PREFIX}current_factory`,
  USER_SETTINGS: `${STORAGE_PREFIX}user_settings`,
  THEME: `${STORAGE_PREFIX}theme`,
  LANGUAGE: `${STORAGE_PREFIX}language`,
} as const;

// API 状态码
export const API_STATUS = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

// HTTP 状态码描述
export const HTTP_STATUS_DESC: Record<number, string> = {
  200: '请求成功',
  201: '创建成功',
  204: '删除成功',
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '没有操作权限',
  404: '资源不存在',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
  504: '请求超时',
};

// 分页默认配置
export const PAGINATION_DEFAULTS = {
  pageSize: 15,
  pageSizeOptions: [15, 30, 50, 100],
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
} as const;

// 表格默认配置
export const TABLE_DEFAULTS = {
  size: 'middle' as const,
  bordered: false,
  scroll: { x: 'max-content' },
} as const;

// 表单默认配置
export const FORM_DEFAULTS = {
  layout: 'vertical' as const,
  autoComplete: 'off',
} as const;

// Modal 默认配置
export const MODAL_DEFAULTS = {
  width: 600,
  centered: true,
  destroyOnClose: true,
  maskClosable: false,
} as const;

// 常用正则表达式
export const REGEX = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  NUMBER: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
  CHINESE: /^[\u4e00-\u9fa5]+$/,
} as const;

// 常用时间格式
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY',
} as const;

// 主题配置
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// 语言配置
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
} as const;

// 响应式断点
export const BREAKPOINTS = {
  XS: 480,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1600,
} as const;

// 动画持续时间
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;