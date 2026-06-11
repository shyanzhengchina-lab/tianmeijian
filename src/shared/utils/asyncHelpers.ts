/**
 * 异步助手工具函数
 * 提供常用的异步操作工具函数
 */

/**
 * 延迟函数
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 防抖函数
 * 在指定时间内只执行最后一次函数调用
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: any[]) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * 节流函数
 * 在指定时间内只执行一次函数调用
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: any[]) => void) => {
  let inThrottle: boolean;
  let lastFunc: ReturnType<typeof setTimeout> | null = null;

  return (...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      lastFunc = setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 异步重试包装器
 * 在异步操作失败时自动重试
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay: initialDelay = 1000,
    backoff = true,
    onRetry,
  } = options;

  let retryDelay = initialDelay;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        onRetry?.(lastError, attempt);

        if (backoff) {
          retryDelay *= 2; // 指数退避
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
};

/**
 * 异步并发控制
 * 限制同时执行的异步操作数量
 */
interface QueueItem<T = any> {
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export class AsyncPool {
  private concurrency: number;
  private running: number = 0;
  private queue: Array<QueueItem> = [];

  constructor(concurrency: number = 5) {
    this.concurrency = concurrency;
  }

  /**
   * 添加异步任务到队列
   */
  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.runNext();
    });
  }

  /**
   * 执行下一个任务
   */
  private async runNext(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;

    const { task, resolve, reject } = this.queue.shift()!;

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.runNext();
    }
  }

  /**
   * 清空队列并等待所有任务完成
   */
  async waitAll(): Promise<void> {
    while (this.queue.length > 0 || this.running > 0) {
      await delay(100);
    }
  }

  /**
   * 取消所有待执行任务
   */
  cancel(): void {
    this.queue = [];
    this.running = 0;
  }

  /**
   * 获取队列状态
   */
  get status() {
    return {
      pending: this.queue.length,
      running: this.running,
      total: this.queue.length + this.running,
    };
  }
}

/**
 * 异步缓存
 * 缓存异步操作结果，避免重复计算
 */
export class AsyncCache<T> {
  private cache: Map<string, { data: T; expires: number }>;
  private defaultTTL: number; // 默认缓存5分钟

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttl ?? this.defaultTTL),
    });
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let activeCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    return {
      total: this.cache.size,
      active: activeCount,
      expired: expiredCount,
    };
  }
}

/**
 * 异步队列
 * 先进先出的异步任务队列
 */
export class AsyncQueue {
  private queue: Array<QueueItem> = [];
  private processing: boolean = false;

  /**
   * 添加任务
   */
  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  /**
   * 处理队列
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift()!;

      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * 获取队列状态
   */
  get status() {
    return {
      length: this.queue.length,
      processing: this.processing,
    };
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
    this.processing = false;
  }
}

/**
 * 批处理异步操作
 * 将多个异步操作合并为一个批次操作
 */
export const batchProcess = async <T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item, index) => processor(item, i + index))
    );
    results.push(...batchResults);
  }

  return results;
};

/**
 * 并行处理异步操作
 * 使用 Promise.all 并行执行多个异步操作
 */
export const parallelProcess = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let completed = 0;
  let currentIndex = 0;

  const processNext = (): Promise<void> => {
    if (currentIndex >= items.length) {
      return Promise.resolve();
    }

    const index = currentIndex++;
    const item = items[index];

    return processor(item)
      .then((result) => {
        results[index] = result;
        completed++;
        return processNext();
      })
      .catch((error) => {
        results[index] = error as any;
        completed++;
        return processNext();
      });
  };

  // 启动并发任务并等待全部完成
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency && i < items.length; i++) {
    workers.push(processNext());
  }
  await Promise.all(workers);
  return results;
};

/**
 * 串行处理异步操作
 * 按顺序依次执行异步操作
 */
export const serialProcess = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];

  for (const item of items) {
    const result = await processor(item);
    results.push(result);
  }

  return results;
};

/**
 * 异步超时包装器
 * 为异步操作添加超时限制
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = '操作超时'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
};

/**
 * 取消令牌
 * 用于取消正在进行的异步操作
 */
export class CancellationToken {
  private cancelled: boolean = false;

  /**
   * 取消操作
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * 检查是否已取消
   */
  isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * 检查取消状态，如果已取消则抛出错误
   */
  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new Error('Operation was cancelled');
    }
  }

  /**
   * 创建包装函数
   */
  wrap<T>(asyncFn: () => Promise<T>): () => Promise<T> {
    return async () => {
      this.throwIfCancelled();
      return await asyncFn();
    };
  }
}

/**
 * 请求加载管理器
 * 管理多个同时进行的请求，避免重复请求
 */
export class RequestManager {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * 请求资源
   * @param key 请求的唯一标识
   * @param requestFn 请求函数
   */
  async request<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // 如果已有相同请求，直接返回该 Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * 取消请求
   */
  cancel(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * 取消所有请求
   */
  cancelAll(): void {
    this.pendingRequests.clear();
  }

  /**
   * 获取进行中的请求数量
   */
  get pendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * 获取进行中的请求键列表
   */
  get pendingKeys(): string[] {
    return Array.from(this.pendingRequests.keys());
  }
}

/**
 * 文件上传进度跟踪
 */
export class UploadProgressTracker {
  private uploads: Map<string, {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: Error;
  }> = new Map();

  /**
   * 开始上传
   */
  start(file: File): string {
    const fileId = `file_${Date.now()}_${Math.random()}`;
    this.uploads.set(fileId, {
      file,
      progress: 0,
      status: 'pending',
    });
    return fileId;
  }

  /**
   * 更新进度
   */
  updateProgress(fileId: string, progress: number): void {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.progress = progress;
      upload.status = progress >= 100 ? 'completed' : 'uploading';
    }
  }

  /**
   * 标记为完成
   */
  complete(fileId: string): void {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.progress = 100;
      upload.status = 'completed';
    }
  }

  /**
   * 标记为失败
   */
  error(fileId: string, error: Error): void {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.status = 'error';
      upload.error = error;
    }
  }

  /**
   * 移除上传记录
   */
  remove(fileId: string): void {
    this.uploads.delete(fileId);
  }

  /**
   * 获取上传状态
   */
  getProgress(fileId: string) {
    return this.uploads.get(fileId) || null;
  }

  /**
   * 获取所有上传状态
   */
  getAllProgress() {
    return Array.from(this.uploads.entries()).map(([id, upload]) => ({
      id,
      fileName: upload.file.name,
      progress: upload.progress,
      status: upload.status,
      error: upload.error,
    }));
  }
}

/**
 * 创建默认配置的异步工具实例
 */
export const createAsyncPool = (concurrency?: number) => {
  return new AsyncPool(concurrency);
};

export const createAsyncCache = <T>(defaultTTL?: number) => {
  return new AsyncCache<T>(defaultTTL);
};

export const createAsyncQueue = () => {
  return new AsyncQueue();
};

export const createRequestManager = () => {
  return new RequestManager();
};

export const createUploadProgressTracker = () => {
  return new UploadProgressTracker();
};

export default {
  delay,
  debounce,
  throttle,
  withRetry,
  AsyncPool,
  AsyncCache,
  AsyncQueue,
  batchProcess,
  parallelProcess,
  serialProcess,
  withTimeout,
  CancellationToken,
  RequestManager,
  UploadProgressTracker,
  createAsyncPool,
  createAsyncCache,
  createAsyncQueue,
  createRequestManager,
  createUploadProgressTracker,
};
