/**
 * 存储助手工具函数
 * 提供统一的本地存储、会话存储、Cookie 操作接口
 */

// 存储键名常量
export const STORAGE_KEYS = {
  // 用户相关
  USER_TOKEN: 'user_token',
  USER_INFO: 'user_info',
  USER_PREFERENCES: 'user_preferences',

  // 工厂相关
  CURRENT_FACTORY_ID: 'current_factory_id',
  FACTORY_LIST: 'factory_list',

  // 权限相关
  USER_PERMISSIONS: 'user_permissions',
  USER_ROLES: 'user_roles',

  // 界面相关
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',

  // 临时数据
  TEMP_DATA_PREFIX: 'temp_',
  PAGE_STATE_PREFIX: 'page_state_',
} as const;

/**
 * LocalStorage 操作
 */
export const localStorage = {
  /**
   * 设置值
   */
  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage 设置失败:', error);
    }
  },

  /**
   * 获取值
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch (error) {
      console.error('LocalStorage 获取失败:', error);
      return defaultValue ?? null;
    }
  },

  /**
   * 删除值
   */
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage 删除失败:', error);
    }
  },

  /**
   * 清空所有数据
   */
  clear(): void {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('LocalStorage 清空失败:', error);
    }
  },

  /**
   * 获取所有键
   */
  keys(): string[] {
    try {
      return Object.keys(window.localStorage);
    } catch (error) {
      console.error('LocalStorage 获取键失败:', error);
      return [];
    }
  },

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    try {
      return window.localStorage.getItem(key) !== null;
    } catch (error) {
      console.error('LocalStorage 检查失败:', error);
      return false;
    }
  },
};

/**
 * SessionStorage 操作
 */
export const sessionStorage = {
  /**
   * 设置值
   */
  set<T>(key: string, value: T): void {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('SessionStorage 设置失败:', error);
    }
  },

  /**
   * 获取值
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch (error) {
      console.error('SessionStorage 获取失败:', error);
      return defaultValue ?? null;
    }
  },

  /**
   * 删除值
   */
  remove(key: string): void {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('SessionStorage 删除失败:', error);
    }
  },

  /**
   * 清空所有数据
   */
  clear(): void {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('SessionStorage 清空失败:', error);
    }
  },

  /**
   * 获取所有键
   */
  keys(): string[] {
    try {
      return Object.keys(window.sessionStorage);
    } catch (error) {
      console.error('SessionStorage 获取键失败:', error);
      return [];
    }
  },

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    try {
      return window.sessionStorage.getItem(key) !== null;
    } catch (error) {
      console.error('SessionStorage 检查失败:', error);
      return false;
    }
  },
};

/**
 * Cookie 操作（需要用户授权）
 */
export const cookie = {
  /**
   * 设置 Cookie
   */
  set(name: string, value: string, days: number = 7, path: string = '/'): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=${path}`;
  },

  /**
   * 获取 Cookie
   */
  get(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  },

  /**
   * 删除 Cookie
   */
  remove(name: string, path: string = '/'): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  },
};

/**
 * IndexedDB 操作（异步）
 */
export const indexedDB = {
  DB_NAME: 'MES_DB',
  DB_VERSION: 1,
  STORE_NAME: 'app_store',

  /**
   * 打开数据库
   */
  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('IndexedDB 打开失败'));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  },

  /**
   * 添加数据
   */
  async add<T>(storeName: string, data: T): Promise<number> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(new Error('IndexedDB 添加失败'));
    });
  },

  /**
   * 获取数据
   */
  async get<T>(storeName: string, id: number): Promise<T | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('IndexedDB 获取失败'));
    });
  },

  /**
   * 更新数据
   */
  async update<T>(storeName: string, data: T & { id: number }): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('IndexedDB 更新失败'));
    });
  },

  /**
   * 删除数据
   */
  async delete(storeName: string, id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('IndexedDB 删除失败'));
    });
  },

  /**
   * 清空存储
   */
  async clearStore(storeName: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('IndexedDB 清空失败'));
    });
  },
};

/**
 * 临时数据存储（带过期时间）
 */
export const tempStorage = {
  /**
   * 设置临时数据（带过期时间）
   */
  set<T>(key: string, value: T, ttl: number = 600000): void {
    const data = {
      value,
      expires: Date.now() + ttl, // 默认10分钟
    };
    localStorage.set(`${STORAGE_KEYS.TEMP_DATA_PREFIX}${key}`, data);
  },

  /**
   * 获取临时数据
   */
  get<T>(key: string, defaultValue?: T): T | null {
    const data = localStorage.get<{ value: T; expires: number }>(`${STORAGE_KEYS.TEMP_DATA_PREFIX}${key}`);
    if (!data) {
      return defaultValue ?? null;
    }

    // 检查是否过期
    if (data.expires && Date.now() > data.expires) {
      localStorage.remove(`${STORAGE_KEYS.TEMP_DATA_PREFIX}${key}`);
      return defaultValue ?? null;
    }

    return data.value;
  },

  /**
   * 删除临时数据
   */
  remove(key: string): void {
    localStorage.remove(`${STORAGE_KEYS.TEMP_DATA_PREFIX}${key}`);
  },

  /**
   * 清理所有过期数据
   */
  cleanExpired(): void {
    const keys = localStorage.keys();
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEYS.TEMP_DATA_PREFIX)) {
        const data = localStorage.get<{ expires: number }>(key);
        if (data && data.expires && now > data.expires) {
          localStorage.remove(key);
        }
      }
    });
  },
};

/**
 * 页面状态存储（用于保持页面状态）
 */
export const pageStateStorage = {
  /**
   * 保存页面状态
   */
  set<T>(pageName: string, state: T): void {
    const key = `${STORAGE_KEYS.PAGE_STATE_PREFIX}${pageName}`;
    localStorage.set(key, state);
  },

  /**
   * 获取页面状态
   */
  get<T>(pageName: string, defaultValue?: T): T | null {
    const key = `${STORAGE_KEYS.PAGE_STATE_PREFIX}${pageName}`;
    return localStorage.get<T>(key, defaultValue) ?? defaultValue ?? null;
  },

  /**
   * 删除页面状态
   */
  remove(pageName: string): void {
    const key = `${STORAGE_KEYS.PAGE_STATE_PREFIX}${pageName}`;
    localStorage.remove(key);
  },

  /**
   * 保存搜索条件
   */
  setSearchFilter<T>(pageName: string, filters: T): void {
    this.set(pageName, { filters });
  },

  /**
   * 获取搜索条件
   */
  getSearchFilter<T>(pageName: string): T | undefined {
    const state = this.get<{ filters: T }>(pageName);
    return state?.filters;
  },
};

/**
 * 存储容量检查
 */
export const storage = {
  /**
   * 检查存储是否可用
   */
  isAvailable(): boolean {
    try {
      window.localStorage.setItem('__test__', '__test__');
      window.localStorage.removeItem('__test__');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 获取存储使用情况
   */
  getUsage(): { used: number; total: number } {
    try {
      let used = 0;
      const keys = localStorage.keys();
      keys.forEach(key => {
        used += (window.localStorage.getItem(key) ?? '').length;
      });

      // 假设每个域的存储限制为 5MB
      const total = 5 * 1024 * 1024; // 5MB

      return { used, total };
    } catch (error) {
      console.error('获取存储使用情况失败:', error);
      return { used: 0, total: 5 * 1024 * 1024 };
    }
  },

  /**
   * 格式化存储大小
   */
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const m = 1024 * 1024;
    const g = 1024 * 1024 * 1024;

    if (bytes < k) {
      return `${bytes} B`;
    } else if (bytes < m) {
      return `${(bytes / k).toFixed(2)} KB`;
    } else if (bytes < g) {
      return `${(bytes / m).toFixed(2)} MB`;
    } else {
      return `${(bytes / g).toFixed(2)} GB`;
    }
  },
};

/**
 * 安全存储（自动加密敏感数据）
 */
export const secureStorage = {
  /**
   * 简单加密（仅用于演示，生产环境应使用专业加密库）
   */
  encrypt: (data: string): string => {
    // Base64 编码（仅用于防止简单的明文存储）
    return btoa(encodeURIComponent(data));
  },

  /**
   * 解密
   */
  decrypt: (encryptedData: string): string => {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch {
      return '';
    }
  },

  /**
   * 安全存储
   */
  setSecure: (key: string, value: string): void => {
    const encrypted = secureStorage.encrypt(value);
    window.localStorage.setItem(key, encrypted);
  },

  /**
   * 安全获取
   */
  getSecure: (key: string): string | null => {
    const encrypted = window.localStorage.getItem(key);
    if (!encrypted) {
      return null;
    }
    return secureStorage.decrypt(encrypted);
  },
};

/**
 * 存储事件监听
 */
export const storageEvents = {
  /**
   * 监听存储变化
   */
  onChange: (callback: (event: StorageEvent) => void) => {
    const handler = (event: StorageEvent) => callback(event);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('storage', handler);
    };
  },

  /**
   * 监听 localStorage 变化
   */
  onLocalStorageChange: (callback: (event: StorageEvent) => void) => {
    return storageEvents.onChange(callback);
  },

  /**
   * 监听 sessionStorage 变化
   */
  onSessionStorageChange: (callback: (event: StorageEvent) => void) => {
    return storageEvents.onChange(callback);
  },
};

export default {
  localStorage,
  sessionStorage,
  cookie,
  indexedDB,
  tempStorage,
  pageStateStorage,
  storage,
  secureStorage,
  storageEvents,
  STORAGE_KEYS,
};
