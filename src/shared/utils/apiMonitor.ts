/**
 * API监控工具
 * 用于记录API调用日志和错误
 */

/**
 * API日志记录器
 */
export class ApiLogger {
  private static logs: Array<{ timestamp: number; level: string; message: string; data?: any }> = [];

  /**
   * 记录API调用
   */
  static logApiCall(method: string, url: string, duration: number, success: boolean): void {
    console.log(`[API] ${method} ${url} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
    ApiLogger.logs.push({ timestamp: Date.now(), level: success ? 'SUCCESS' : 'FAILED', message: `${method} ${url}`, data: { duration } });
  }

  /**
   * 记录错误
   */
  static logError(error: any, context?: string): void {
    console.error(`[API Error] ${context || ''}:`, error);
    ApiLogger.logs.push({ timestamp: Date.now(), level: 'ERROR', message: context || 'Error', data: error });
  }

  /**
   * 记录警告
   */
  static logWarning(message: string, data?: any): void {
    console.warn(`[API Warning] ${message}:`, data);
  }

  /**
   * 记录信息
   */
  static logInfo(message: string, data?: any): void {
    console.log(`[API Info] ${message}:`, data);
  }

  /**
   * 清空日志
   */
  static clearLogs(): void {
    ApiLogger.logs = [];
  }

  /**
   * 导出日志
   */
  static exportLogs(): string {
    return JSON.stringify(ApiLogger.logs, null, 2);
  }

  /**
   * 获取性能统计
   */
  static getPerformanceStats(): any {
    const successLogs = ApiLogger.logs.filter(l => l.level === 'SUCCESS');
    const durations = successLogs.map(l => l.data?.duration || 0);
    return {
      total: ApiLogger.logs.length,
      success: successLogs.length,
      failed: ApiLogger.logs.filter(l => l.level === 'FAILED').length,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    };
  }

  /**
   * 获取错误统计
   */
  static getErrorStats(): any {
    const errors = ApiLogger.logs.filter(l => l.level === 'ERROR');
    return {
      total: errors.length,
      errors: errors.slice(-10),
    };
  }
}

/**
 * API监控器
 */
export class ApiMonitor {
  private static instance: ApiMonitor;
  private logs: Array<{ timestamp: number; level: string; message: string; data?: any }> = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): ApiMonitor {
    if (!ApiMonitor.instance) {
      ApiMonitor.instance = new ApiMonitor();
    }
    return ApiMonitor.instance;
  }

  /**
   * 记录日志
   */
  log(level: string, message: string, data?: any): void {
    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data,
    });

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * 获取日志
   */
  getLogs(): Array<{ timestamp: number; level: string; message: string; data?: any }> {
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 获取统计信息
   */
  getStats(): { total: number; success: number; failed: number; avgDuration: number } {
    const total = this.logs.length;
    const success = this.logs.filter(log => log.level === 'SUCCESS').length;
    const failed = this.logs.filter(log => log.level === 'FAILED').length;
    return { total, success, failed, avgDuration: 0 };
  }
}

export const apiMonitor = ApiMonitor.getInstance();
