/**
 * 应用配置
 * 集中管理应用的各种配置项
 */

/**
 * 应用基本信息
 */
export const APP_INFO = {
  name: 'React MES',
  version: '2.0.0',
  environment: process.env.NODE_ENV || 'development',
  buildTime: process.env.REACT_APP_BUILD_TIME || '',
  gitCommit: process.env.REACT_APP_GIT_COMMIT || '',
  description: '制造执行系统前端应用',
} as const;

/**
 * 环境判断
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

/**
 * API 配置
 */
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
  timeout: isDevelopment ? 30000 : 15000, // 开发环境30秒，生产环境15秒
  retryCount: 3,
  retryDelay: 1000,
  maxConcurrent: 6, // 最大并发请求数
} as const;

/**
 * 文件上传配置
 */
export const UPLOAD_CONFIG = {
  maxSize: isDevelopment ? 100 * 1024 * 1024 : 50 * 1024 * 1024, // 开发环境100MB，生产环境50MB
  chunkSize: 5 * 1024 * 1024, // 5MB 分片上传
  timeout: isDevelopment ? 300000 : 180000, // 开发环境5分钟，生产环境3分钟
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.ms-excel'],
  maxConcurrent: 3, // 最大同时上传数量
} as const;

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: ['10', '20', '50', '100'],
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: true,
  showSizeChangerOptions: true,
} as const;

/**
 * 表格配置
 */
export const TABLE_CONFIG = {
  defaultSize: 'middle', // small | middle | large
  bordered: true,
  showHeader: true,
  showFooter: true,
  scroll: { x: 1200, y: 500 },
  size: 'middle',
} as const;

/**
 * 表单配置
 */
export const FORM_CONFIG = {
  labelCol: { xs: 24, sm: 8, md: 8, lg: 6, xl: 6, xx: 4 },
  wrapperCol: { xs: 24, sm: 16, md: 16, lg: 12, xl: 12, xx: 8 },
  labelAlign: 'right',
  autoComplete: 'off',
  validateTrigger: 'onBlur',
  validateMessages: {
    required: '请输入${label}',
    types: {
      email: '请输入有效的邮箱地址',
      url: '请输入有效的URL地址',
    },
  },
} as const;

/**
 * 日期时间配置
 */
export const DATETIME_CONFIG = {
  dateFormat: 'YYYY-MM-DD',
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  timeFormat: 'HH:mm:ss',
  monthFormat: 'YYYY-MM',
  yearFormat: 'YYYY',
  datePickerPlaceholder: {
    date: '请选择日期',
    datetime: '请选择日期时间',
    month: '请选择月份',
    year: '请选择年份',
    range: ['开始日期', '结束日期'],
  },
} as const;

/**
 * 导出配置
 */
export const EXPORT_CONFIG = {
  defaultFormat: 'excel',
  supportedFormats: ['excel', 'csv'],
  excel: {
    filename: (prefix: string) => `${prefix}_${Date.now()}.xlsx`,
    sheetName: '数据导出',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  csv: {
    filename: (prefix: string) => `${prefix}_${Date.now()}.csv`,
    mimeType: 'text/csv',
    encoding: 'UTF-8 BOM',
  },
} as const;

/**
 * 性能配置
 */
export const PERFORMANCE_CONFIG = {
  enablePerformanceMonitor: isDevelopment,
  enableReactDevTools: isDevelopment,
  enableComponentPerf: false, // 组件性能分析
  enableStrictMode: false, // 严格模式（开发时警告）
  lazyLoadComponents: false, // 组件懒加载
  virtualScrollThreshold: 100, // 虚拟滚动阈值
  debounceDelay: 300, // 防抖延迟
  throttleDelay: 500, // 节流延迟
} as const;

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 默认缓存5分钟
  maxCacheSize: 100, // 最大缓存条目数
  storageKeyPrefix: 'mes_cache_',
  userCacheKeyPrefix: 'mes_user_cache_',
  dataCacheKeyPrefix: 'mes_data_cache_',
} as const;

/**
 * 错误处理配置
 */
export const ERROR_CONFIG = {
  showDetailedError: isDevelopment,
  showErrorInUI: true,
  enableErrorReporting: isProduction,
  errorReportingEndpoint: '/api/errors',
  showFriendlyMessage: true,
  maxErrorStackLines: 10,
} as const;

/**
 * 安全配置
 */
export const SECURITY_CONFIG = {
  enableCSRF: true,
  csrfHeaderName: 'X-CSRF-TOKEN',
  enableXSSProtection: true,
  enableContentSecurityPolicy: true,
  sessionTimeout: 30 * 60 * 1000, // 30分钟
  passwordMinLength: 6,
  passwordMaxLength: 20,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
} as const;

/**
 * 用户界面配置
 */
export const UI_CONFIG = {
  theme: {
    primaryColor: '#1677ff',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#ff4d4f',
    infoColor: '#1677ff',
  },
  layout: {
    siderWidth: 240,
    headerHeight: 64,
    contentPadding: 24,
    breadcrumbMaxWidth: 800,
  },
  animation: {
    enabled: !isProduction, // 生产环境禁用动画
    duration: 300,
    easing: 'cubic-bezier',
  },
  responsive: {
    breakpoint: {
      xs: 480,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1600,
    },
  },
  loading: {
    delay: 500, // 加载延迟
    spinSize: 'large',
    spinTip: '加载中...',
  },
} as const;

/**
 * 业务规则配置
 */
export const BUSINESS_CONFIG = {
  // 生产订单相关
  productionOrder: {
    autoReleaseTimeout: 24 * 60 * 60 * 1000, // 自动释放超时24小时
    maxOpenOrders: 100, // 最大同时开启工单数
    autoAssignWorkOrder: false, // 是否自动分配工单
  },

  // 工单相关
  workOrder: {
    maxInProgress: 20, // 最大进行中工单数
    autoCloseTimeout: 7 * 24 * 60 * 60 * 1000, // 自动关闭超时7天
    enableWorkOrderSplit: true, // 是否启用工单拆分
  },

  // 质量相关
  quality: {
    autoInspection: false, // 是否自动质检
    mrbAutoRoute: false, // MRB自动路由
    maxPendingMRB: 50, // 最大待处理MRB数量
    mrbProcessTimeout: 7 * 24 * 60 * 60 * 1000, // MRB处理超时7天
  },

  // 领料相关
  issuance: {
    autoApproveThreshold: 10000, // 自动批准阈值（元）
    batchApprovalEnabled: true, // 是否启用批量审批
    backflushAutoTrigger: false, // 是否自动触发倒冲
    padIssuanceAutoConfirm: false, // 是否自动确认PDA拣货
  },

  // EBR相关
  ebr: {
    autoSignOff: true, // 是否自动签收
    maxActiveEBR: 50, // 最大激活EBR数量
    ebrAutoArchive: false, // 是否自动归档
  },
} as const;

/**
 * 开发配置
 */
export const DEV_CONFIG = {
  // 日志级别
  logLevel: process.env.REACT_APP_LOG_LEVEL || 'info',
  showConsoleLog: isDevelopment,
  enableDebugMode: false, // 调试模式

  // Mock 数据
  enableMockData: isDevelopment,
  mockDataDelay: 500, // Mock数据延迟

  // 热重载
  enableHotReload: true,
  hmrPort: 3001,

  // 性能分析
  enableProfiler: isDevelopment,
  profilerThreshold: 100, // 性能分析阈值（毫秒）

  // UI 调试
  enableUIDebug: isDevelopment,
  showComponentNames: true,
  enableRenderTracker: false,
} as const;

/**
 * 获取当前环境的配置
 */
export const getEnvironmentConfig = () => {
  return {
    ...APP_INFO,
    ...API_CONFIG,
    ...UPLOAD_CONFIG,
    ...PAGINATION_CONFIG,
    ...TABLE_CONFIG,
    ...FORM_CONFIG,
    ...DATETIME_CONFIG,
    ...EXPORT_CONFIG,
    ...PERFORMANCE_CONFIG,
    ...CACHE_CONFIG,
    ...ERROR_CONFIG,
    ...SECURITY_CONFIG,
    ...UI_CONFIG,
    ...BUSINESS_CONFIG,
    ...DEV_CONFIG,
  };
};

/**
 * 获取API基础URL
 */
export const getApiBaseURL = () => {
  return API_CONFIG.baseURL;
};

/**
 * 获取文件上传配置
 */
export const getUploadConfig = () => {
  return UPLOAD_CONFIG;
};

/**
 * 获取分页配置
 */
export const getPaginationConfig = () => {
  return PAGINATION_CONFIG;
};

/**
 * 获取表格配置
 */
export const getTableConfig = () => {
  return TABLE_CONFIG;
};

/**
 * 获取表单配置
 */
export const getFormConfig = () => {
  return FORM_CONFIG;
};

/**
 * 获取UI配置
 */
export const getUIConfig = () => {
  return UI_CONFIG;
};

/**
 * 判断是否为生产环境
 */
export const isProdEnv = () => {
  return isProduction;
};

/**
 * 判断是否为开发环境
 */
export const isDevEnv = () => {
  return isDevelopment;
};

/**
 * 判断是否为测试环境
 */
export const isTestEnv = () => {
  return isTest;
};

/**
 * 获取应用版本信息
 */
export const getAppInfo = () => {
  return APP_INFO;
};

export default {
  APP_INFO,
  isDevelopment,
  isProduction,
  isTest,
  API_CONFIG,
  UPLOAD_CONFIG,
  PAGINATION_CONFIG,
  TABLE_CONFIG,
  FORM_CONFIG,
  DATETIME_CONFIG,
  EXPORT_CONFIG,
  PERFORMANCE_CONFIG,
  CACHE_CONFIG,
  ERROR_CONFIG,
  SECURITY_CONFIG,
  UI_CONFIG,
  BUSINESS_CONFIG,
  DEV_CONFIG,
  getEnvironmentConfig,
  getApiBaseURL,
  getUploadConfig,
  getPaginationConfig,
  getTableConfig,
  getFormConfig,
  getUIConfig,
  isProdEnv,
  isDevEnv,
  isTestEnv,
  getAppInfo,
};
