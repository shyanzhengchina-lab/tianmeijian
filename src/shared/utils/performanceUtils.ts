/**
 * 性能优化工具函数
 * 包含防抖、节流、请求缓存等功能
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const lodashDebounce = require('lodash.debounce') as (fn: any, wait?: number) => any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lodashThrottle = require('lodash.throttle') as (fn: any, wait?: number) => any;

/**
 * 防抖函数
 * 延迟执行，重复调用会重置计时器
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  return lodashDebounce(func, wait);
}

/**
 * 节流函数
 * 限制函数执行频率，指定时间内最多执行一次
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  return lodashThrottle(func, wait);
}

/**
 * 请求缓存类
 */
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private pending = new Map<string, Promise<any>>();
  private defaultTTL = 5000; // 默认缓存5秒

  /**
   * 生成缓存key
   */
  private generateKey(key: string, params?: any): string {
    if (!params) return key;
    return `${key}:${JSON.stringify(params)}`;
  }

  /**
   * 获取缓存数据
   */
  get<T>(key: string, params?: any, ttl?: number): T | null {
    const cacheKey = this.generateKey(key, params);
    const cached = this.cache.get(cacheKey);

    if (!cached) return null;

    const now = Date.now();
    const expireTime = ttl || this.defaultTTL;

    if (now - cached.timestamp < expireTime) {
      return cached.data as T;
    }

    // 过期，删除缓存
    this.cache.delete(cacheKey);
    return null;
  }

  /**
   * 设置缓存数据
   */
  set<T>(key: string, data: T, params?: any): void {
    const cacheKey = this.generateKey(key, params);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取或执行请求
   * 如果有缓存的pending请求，返回相同的Promise
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    params?: any,
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.generateKey(key, params);

    // 检查是否有pending请求
    if (this.pending.has(cacheKey)) {
      return this.pending.get(cacheKey) as Promise<T>;
    }

    // 检查缓存
    const cached = this.get<T>(key, params, ttl);
    if (cached !== null) {
      return cached;
    }

    // 执行请求
    const promise = fetcher()
      .then((data) => {
        this.set(key, data, params);
        this.pending.delete(cacheKey);
        return data;
      })
      .catch((error) => {
        this.pending.delete(cacheKey);
        throw error;
      });

    this.pending.set(cacheKey, promise);
    return promise;
  }

  /**
   * 清除指定缓存
   */
  clear(key?: string, params?: any): void {
    if (!key) {
      this.cache.clear();
      this.pending.clear();
      return;
    }

    const cacheKey = this.generateKey(key, params);
    this.cache.delete(cacheKey);
    this.pending.delete(cacheKey);
  }

  /**
   * 清除过期缓存
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 批量清除缓存（按前缀）
   */
  clearByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        this.pending.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; pending: number; keys: string[] } {
    return {
      size: this.cache.size,
      pending: this.pending.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 导出单例
export const requestCache = new RequestCache();

/**
 * 批量请求合并器
 * 将多个相同请求合并为一个
 */
class BatchRequestManager {
  private batches = new Map<string, { requests: any[]; timer: NodeJS.Timeout }>();
  private delay = 50; // 批量延迟50ms

  /**
   * 添加请求到批处理
   */
  add<T>(key: string, request: T): Promise<T[]> {
    return new Promise((resolve) => {
      const batch = this.batches.get(key);

      if (batch) {
        // 已有批处理，添加请求
        batch.requests.push(request);
        resolve(Promise.resolve(batch.requests));
      } else {
        // 创建新的批处理
        const requests = [request];
        const timer = setTimeout(() => {
          this.batches.delete(key);
          resolve(Promise.resolve(requests));
        }, this.delay);

        this.batches.set(key, { requests, timer });
      }
    });
  }
}

// 导出单例
export const batchRequestManager = new BatchRequestManager();

/**
 * 性能监控类
 */
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  /**
   * 记录性能指标
   */
  record(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }

  /**
   * 获取平均性能
   */
  getAverage(name: string): number {
    const durations = this.metrics.get(name);
    if (!durations || durations.length === 0) return 0;

    const sum = durations.reduce((a, b) => a + b, 0);
    return sum / durations.length;
  }

  /**
   * 获取性能统计
   */
  getStats(name?: string) {
    if (name) {
      const durations = this.metrics.get(name);
      return {
        name,
        count: durations?.length || 0,
        average: this.getAverage(name),
        min: durations ? Math.min(...durations) : 0,
        max: durations ? Math.max(...durations) : 0,
      };
    }

    return Array.from(this.metrics.entries()).map(([key, durations]) => ({
      name: key,
      count: durations.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
    }));
  }

  /**
   * 清除性能数据
   */
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// 导出单例
export const performanceMonitor = new PerformanceMonitor();

/**
 * 性能装饰器函数
 */
export function withPerformance<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    if (result instanceof Promise) {
      return result.finally(() => {
        performanceMonitor.record(name, end - start);
      });
    } else {
      performanceMonitor.record(name, end - start);
      return result;
    }
  }) as T;
}
