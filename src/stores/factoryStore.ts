/**
 * 多工厂状态管理Store
 * 支持多工厂环境下的数据隔离和切换
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 工厂配置
 */
export interface FactoryConfig {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  timeZone: string;
  language: string;
  currency: string;
  logo?: string;
  address?: string;
  contact?: string;
  phone?: string;
}

/**
 * 工厂用户配置
 */
export interface FactoryUserConfig {
  factoryId: string;
  userId: string;
  role: string;
  permissions: string[];
  departmentId?: string;
  teamId?: string;
}

/**
 * 工厂数据缓存
 */
export interface FactoryDataCache {
  [factoryId: string]: {
    [key: string]: any; // 缓存的模块数据
    lastUpdated: number; // 最后更新时间
  };
}

/**
 * Factory Store状态接口
 */
export interface FactoryState {
  // 当前选中的工厂
  currentFactoryId: string;
  currentFactory: FactoryConfig | null;

  // 工厂列表
  factories: FactoryConfig[];
  loadingFactories: boolean;

  // 用户在各工厂的配置
  userConfigs: FactoryUserConfig[];

  // 数据缓存
  dataCache: FactoryDataCache;

  // UI状态
  switchModalVisible: boolean;
  switchPending: boolean;

  // Actions
  setCurrentFactoryId: (factoryId: string) => void;
  setCurrentFactory: (factory: FactoryConfig | null) => void;
  loadFactories: () => Promise<void>;
  switchFactory: (factoryId: string) => Promise<void>;
  addUserConfig: (config: FactoryUserConfig) => void;
  removeUserConfig: (factoryId: string, userId: string) => void;
  cacheData: (factoryId: string, module: string, data: any) => void;
  clearCache: (factoryId?: string, module?: string) => void;
  getData: <T>(factoryId: string, module: string, key: string) => T | null;
  setShowSwitchModal: (show: boolean) => void;
}

/**
 * 默认工厂配置（用于开发和测试）
 */
const DEFAULT_FACTORIES: FactoryConfig[] = [
  {
    id: 'factory-001',
    name: '主工厂',
    code: 'MAIN',
    description: '主要生产基地',
    isActive: true,
    timeZone: 'Asia/Shanghai',
    language: 'zh-CN',
    currency: 'CNY',
  },
  {
    id: 'factory-002',
    name: '分工厂A',
    code: 'BRANCH_A',
    description: '分生产基地A',
    isActive: false,
    timeZone: 'Asia/Shanghai',
    language: 'zh-CN',
    currency: 'CNY',
  },
  {
    id: 'factory-003',
    name: '分工厂B',
    code: 'BRANCH_B',
    description: '分生产基地B',
    isActive: false,
    timeZone: 'Asia/Shanghai',
    language: 'zh-CN',
    currency: 'CNY',
  },
];

/**
 * 工厂Store
 */
export const useFactoryStore = create<FactoryState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentFactoryId: 'factory-001',
      currentFactory: DEFAULT_FACTORIES[0],
      factories: DEFAULT_FACTORIES,
      loadingFactories: false,
      userConfigs: [],
      dataCache: {},
      switchModalVisible: false,
      switchPending: false,

      /**
       * 设置当前工厂ID
       */
      setCurrentFactoryId: (factoryId: string) => {
        const factory = DEFAULT_FACTORIES.find(f => f.id === factoryId);
        set({ currentFactoryId: factoryId, currentFactory: factory || null });
      },

      /**
       * 设置当前工厂
       */
      setCurrentFactory: (factory: FactoryConfig | null) => {
        set({ currentFactory: factory });
      },

      /**
       * 加载工厂列表
       */
      loadFactories: async () => {
        set({ loadingFactories: true });

        try {
          // TODO: 调用API获取工厂列表
          // const response = await factoryApi.getFactories();

          // if (response.code === 200) {
          //   set({
          //     factories: response.data,
          //     loadingFactories: false,
          //   });
          // }

          // 暂时使用默认数据
          setTimeout(() => {
            set({
              factories: DEFAULT_FACTORIES,
              loadingFactories: false,
            });
          }, 500);
        } catch (error: any) {
          console.error('加载工厂列表失败:', error);
          set({
            factories: DEFAULT_FACTORIES,
            loadingFactories: false,
          });
        }
      },

      /**
       * 切换工厂
       */
      switchFactory: async (factoryId: string) => {
        const { currentFactoryId: currentCurrentFactoryId } = get();

        // 如果已经在切换中，不重复处理
        if (currentCurrentFactoryId === factoryId) {
          return;
        }

        set({ switchPending: true });

        try {
          // TODO: 调用API进行工厂切换
          // await factoryApi.switchFactory(factoryId);

          // 模拟切换过程
          await new Promise(resolve => setTimeout(resolve, 1000));

          // 切换成功，更新当前工厂
          const factory = DEFAULT_FACTORIES.find(f => f.id === factoryId);
          set({ currentFactoryId: factoryId, currentFactory: factory || null });

          // 清空当前工厂的数据缓存
          set(state => ({
            dataCache: {},
          }));

          // 显示切换成功提示
          console.log(`已切换到 ${DEFAULT_FACTORIES.find(f => f.id === factoryId)?.name}`);
        } catch (error: any) {
          console.error('切换工厂失败:', error);
        } finally {
          set({ switchPending: false });
        }
      },

      /**
       * 添加用户配置
       */
      addUserConfig: (config: FactoryUserConfig) => {
        set((state) => ({
          userConfigs: [...state.userConfigs.filter(
            c => !(c.factoryId === config.factoryId && c.userId === config.userId)
          ), config],
        }));
      },

      /**
       * 移除用户配置
       */
      removeUserConfig: (factoryId: string, userId: string) => {
        set((state) => ({
          userConfigs: state.userConfigs.filter(
            c => !(c.factoryId === factoryId && c.userId === userId)
          ),
        }));
      },

      /**
       * 缓存数据
       */
      cacheData: (factoryId: string, module: string, data: any) => {
        set((state) => ({
          dataCache: {
            ...state.dataCache,
            [factoryId]: {
              ...state.dataCache[factoryId],
              [module]: data,
              lastUpdated: Date.now(),
            },
          },
        }));
      },

      /**
       * 清空缓存
       */
      clearCache: (factoryId?: string, module?: string) => {
        const state = useFactoryStore.getState();
        let newDataCache = { ...state.dataCache };

        if (factoryId && module) {
          if (newDataCache[factoryId]) {
            newDataCache[factoryId] = { ...newDataCache[factoryId] };
            delete newDataCache[factoryId][module];
          }
        } else if (factoryId) {
          delete newDataCache[factoryId];
        } else if (module) {
          Object.keys(newDataCache).forEach(fId => {
            if (newDataCache[fId]) {
              newDataCache[fId] = { ...newDataCache[fId] };
              delete newDataCache[fId][module];
            }
          });
        } else {
          newDataCache = {};
        }

        set({ dataCache: newDataCache });
      },

      /**
       * 获取缓存的模块数据
       */
      getData: <T>(factoryId: string, module: string, key: string) => {
        const { dataCache } = get();

        if (!dataCache[factoryId]) {
          return null;
        }

        const factoryCache = dataCache[factoryId];
        if (!factoryCache[module]) {
          return null;
        }

        return (factoryCache[module] as any)?.[key] || null;
      },

      /**
       * 显示工厂切换弹窗
       */
      setShowSwitchModal: (show: boolean) => {
        set({ switchModalVisible: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          currentFactoryId: 'factory-001',
          currentFactory: DEFAULT_FACTORIES[0],
          factories: DEFAULT_FACTORIES,
          loadingFactories: false,
          userConfigs: [],
          dataCache: {},
          switchModalVisible: false,
          switchPending: false,
        });
      },
    }),
    {
      name: 'factory-store',
      // 只持久化核心状态
      partialize: (state) => ({
        currentFactoryId: state.currentFactoryId,
        currentFactory: state.currentFactory,
        factories: state.factories,
        userConfigs: state.userConfigs,
      }),
    }
  )
);

/**
 * 工厂工具函数
 */

/**
 * 获取当前工厂配置
 */
export const getCurrentFactory = (): FactoryConfig | null => {
  return useFactoryStore.getState().currentFactory;
};

/**
 * 获取当前工厂ID
 */
export const getCurrentFactoryId = (): string => {
  return useFactoryStore.getState().currentFactoryId;
};

/**
 * 检查是否有多工厂权限
 */
export const hasMultiFactoryAccess = (): boolean => {
  const factories = useFactoryStore.getState().factories;
  return factories.length > 1;
};

/**
 * 格式化工厂信息
 */
export const formatFactoryInfo = (factory: FactoryConfig): string => {
  return `${factory.name} (${factory.code})`;
};

/**
 * 获取工厂时区
 */
export const getFactoryTimeZone = (): string => {
  const factory = getCurrentFactory();
  return factory?.timeZone || 'Asia/Shanghai';
};

/**
 * 获取工厂货币
 */
export const getFactoryCurrency = (): string => {
  const factory = getCurrentFactory();
  return factory?.currency || 'CNY';
};

export default useFactoryStore;