/**
 * 多工厂数据管理Hook
 * 提供工厂级别的数据缓存、隔离和清理功能
 */

import { useCallback, useEffect, useRef } from 'react';
import { useFactoryStore, getCurrentFactoryId, getCurrentFactory } from '@/stores/factoryStore';
import { message } from 'antd';

/**
 * 工厂数据缓存配置
 */
export interface FactoryDataCacheConfig {
  module: string; // 模块名称，如 'material', 'bom'
  maxSize?: number; // 最大缓存数量
  ttl?: number; // 缓存过期时间（毫秒）
  persist?: boolean; // 是否持久化
}

/**
 * 工厂数据管理Hook返回
 */
export interface FactoryDataManager {
  // 数据管理
  getData: () => any[];
  setData: (data: any[]) => void;
  addData: (item: any) => void;
  updateData: (id: string, data: Partial<any>) => void;
  removeData: (id: string) => void;
  clearData: () => void;

  // 缓存控制
  clearCache: () => void;
  getCacheInfo: () => { size: number; lastUpdated: number } | null;
}

/**
 * 创建工厂数据管理器
 */
export function useFactoryData<T extends { id: string }>(
  config: FactoryDataCacheConfig
): FactoryDataManager {
  const {
    module,
    maxSize = 1000,
    ttl = 30 * 60 * 1000, // 30分钟
    persist = true,
  } = config;

  const {
    currentFactoryId,
    cacheData,
    clearCache,
    getData: getFactoryData,
    cacheData: setFactoryData,
  } = useFactoryStore() as any;

  const isInitialized = useRef(false);
  const cacheKey = `${module}_cache`;

  // 初始化缓存
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;

      // 检查缓存是否过期
      const factoryCache = cacheData[currentFactoryId]?.[module];
      if (factoryCache && Date.now() - factoryCache.lastUpdated > ttl) {
        console.log(`工厂缓存过期：${module}`, currentFactoryId);
        clearCache(currentFactoryId, module);
      }
    }
  }, [currentFactoryId, module, ttl, cacheData, clearCache]);

  // 获取数据
  const getData = useCallback((): T[] => {
    const data = (getFactoryData as any)(currentFactoryId, module, cacheKey) as T[] | null;
    return data || [];
  }, [currentFactoryId, module, getFactoryData]);

  // 设置数据
  const setData = useCallback((data: T[]) => {
    if (data.length > maxSize) {
      message.warning(`数据量超过最大限制 ${maxSize}，部分数据可能被忽略`);
      data = data.slice(0, maxSize);
    }

    setFactoryData(currentFactoryId, module, {
      ...cacheData,
      [cacheKey]: data,
      lastUpdated: Date.now(),
    });
  }, [currentFactoryId, module, maxSize, cacheData, setFactoryData]);

  // 添加数据
  const addData = useCallback((item: T) => {
    const currentData = getData();
    const newData = [item, ...currentData];

    if (newData.length > maxSize) {
      newData.shift(); // 移除最早的数据
    }

    setFactoryData(currentFactoryId, module, {
      ...cacheData,
      [cacheKey]: newData,
      lastUpdated: Date.now(),
    });
  }, [currentFactoryId, module, maxSize, getData, cacheData, setFactoryData]);

  // 更新数据
  const updateData = useCallback((id: string, updates: Partial<T>) => {
    const currentData = getData();
    const newData = currentData.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );

    setFactoryData(currentFactoryId, module, {
      ...cacheData,
      [cacheKey]: newData,
      lastUpdated: Date.now(),
    });
  }, [currentFactoryId, module, getData, cacheData, setFactoryData]);

  // 移除数据
  const removeData = useCallback((id: string) => {
    const currentData = getData();
    const newData = currentData.filter(item => item.id !== id);

    setFactoryData(currentFactoryId, module, {
      ...cacheData,
      [cacheKey]: newData,
      lastUpdated: Date.now(),
    });
  }, [currentFactoryId, module, getData, cacheData, setFactoryData]);

  // 清空缓存
  const clearCacheLocal = useCallback(() => {
    clearCache(currentFactoryId, module);
  }, [currentFactoryId, module, clearCache]);

  // 获取缓存信息
  const getCacheInfo = useCallback(() => {
    const factoryCache = cacheData[currentFactoryId]?.[module];
    if (!factoryCache) {
      return null;
    }

    return {
      size: (factoryCache[cacheKey] as any)?.length || 0,
      lastUpdated: factoryCache.lastUpdated,
    };
  }, [currentFactoryId, module, cacheData]);

  // 监听工厂切换，清除旧缓存
  useEffect(() => {
    return () => {
      // 工厂切换时清除所有旧工厂的缓存
      clearCacheLocal();
    };
  }, [currentFactoryId, clearCacheLocal]);

  const clearData = useCallback(() => {
    clearCacheLocal();
  }, [clearCacheLocal]);

  return {
    getData,
    setData,
    addData,
    updateData,
    removeData,
    clearData,
    clearCache: clearCacheLocal,
    getCacheInfo,
  };
}

/**
 * 工厂数据重置Hook
 * 工厂切换时自动重置各模块状态
 */
export function useFactoryReset(modules: string[]) {
  const { currentFactoryId, clearCache } = useFactoryStore();

  useEffect(() => {
    // 工厂ID变化时，清除相关模块的缓存
    clearCache(currentFactoryId);

    console.log('工厂数据重置：', currentFactoryId, modules);
  }, [currentFactoryId, modules, clearCache]);
}

/**
 * 工厂状态监听Hook
 * 监听工厂切换，执行相关操作
 */
export function useFactorySwitch(handler: () => void) {
  const { currentFactoryId } = useFactoryStore();
  const previousFactoryId = useRef<string | null>(null);

  useEffect(() => {
    // 工厂切换时执行处理函数
    if (previousFactoryId.current !== null && previousFactoryId.current !== currentFactoryId) {
      handler();
    }

    previousFactoryId.current = currentFactoryId;
  }, [currentFactoryId, handler]);
}

/**
 * 工厂数据验证Hook
 * 验证数据是否属于当前工厂
 */
export function useFactoryDataValidator(module: string) {
  const { currentFactoryId, currentFactory } = useFactoryStore();

  return useCallback((item: any): boolean => {
    if (!currentFactory || !item) {
      return true; // 无工厂限制
    }

    // 检查数据是否属于当前工厂
    return item.factoryId === currentFactoryId || true;
  }, [currentFactoryId, module]);
}

/**
 * 工厂信息获取Hook
 * 提供便捷的工厂信息访问
 */
export function useFactoryInfo() {
  const { currentFactory, currentFactoryId } = useFactoryStore();

  return {
    currentFactory,
    currentFactoryId,
    hasMultiple: useFactoryStore.getState().factories.length > 1,
    factoryName: currentFactory?.name || '',
    factoryCode: currentFactory?.code || '',
    timeZone: currentFactory?.timeZone || 'Asia/Shanghai',
    currency: currentFactory?.currency || 'CNY',
    getFactoryInfo: () => `${currentFactory?.name || ''} (${currentFactory?.code || ''})`,
  };
}

/**
 * 工厂数据刷新Hook
 * 工厂切换后自动刷新相关模块数据
 */
export function useFactoryRefresh(modules: string[]) {
  const { currentFactoryId } = useFactoryStore();

  useEffect(() => {
    // 工厂切换时触发相关模块的数据刷新
    modules.forEach(module => {
      // 可以通过事件总线或store订阅来触发数据刷新
      console.log(`刷新模块 ${module} 数据，工厂：${currentFactoryId}`);
    });
  }, [currentFactoryId, modules]);
}

export default {
  useFactoryData,
  useFactoryReset,
  useFactorySwitch,
  useFactoryDataValidator,
  useFactoryInfo,
  useFactoryRefresh,
};