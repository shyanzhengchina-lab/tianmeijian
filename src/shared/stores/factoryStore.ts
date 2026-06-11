/**
 * 多工厂状态管理 - Zustand实现
 * 管理多工厂切换、工厂配置、当前工厂等
 */
import { create } from 'zustand';
import { FactoryConfig } from './rbacStore';

export interface FactoryState {
  // 所有工厂列表
  factories: FactoryConfig[];

  // 当前选中的工厂ID
  currentFactoryId: string;

  // 当前选中的工厂配置
  currentFactory: FactoryConfig | null;

  // 用户可访问的工厂列表
  availableFactories: FactoryConfig[];

  // UI状态
  loading: boolean;

  // Actions
  loadFactories: () => Promise<void>;
  setFactories: (factories: FactoryConfig[]) => void;
  switchFactory: (factoryId: string) => void;
  setCurrentFactoryId: (factoryId: string) => void;
  getAvailableFactories: (userId: string) => FactoryConfig[];
  setLoading: (loading: boolean) => void;
}

const FACTORIES_KEY = 'mes_factories';
const CURRENT_FACTORY_KEY = 'mes_current_factory';

// 从 localStorage 读取初始状态
function loadInitialState(): Pick<FactoryState, 'factories' | 'currentFactoryId' | 'currentFactory' | 'availableFactories'> {
  const savedFactories = localStorage.getItem(FACTORIES_KEY);
  const savedCurrentFactory = localStorage.getItem(CURRENT_FACTORY_KEY);

  let factories: FactoryConfig[] = [];
  let currentFactoryId = '';

  if (savedFactories) {
    try {
      factories = JSON.parse(savedFactories) as FactoryConfig[];
    } catch {
      factories = [];
    }
  }

  if (savedCurrentFactory) {
    currentFactoryId = savedCurrentFactory;
  } else if (factories.length > 0) {
    currentFactoryId = factories[0].id;
  }

  const currentFactory = factories.find(f => f.id === currentFactoryId) || null;

  return { factories, currentFactoryId, currentFactory, availableFactories: factories };
}

const initialState = loadInitialState();

// 创建Zustand Store
export const useFactoryStore = create<FactoryState>()(
  (set, get) => ({
    // 初始状态（从localStorage加载）
    ...initialState,
    loading: false,

    // Actions
    loadFactories: async () => {
      set({ loading: true });

      try {
        // 这里调用真实的API获取工厂列表
        // const response = await apiClient.get<FactoryConfig[]>('/factories');
        // const factories = response.data;

        // 模拟工厂数据（开发阶段）
        const mockFactories: FactoryConfig[] = [
          {
            id: 'F001',
            code: 'JN',
            name: '济宁工厂',
            nameEn: 'Jining Factory',
            country: '中国',
            timezone: 'Asia/Shanghai',
            currency: 'CNY',
            language: 'zh-CN',
            status: 'ACTIVE',
            sortOrder: 1,
          },
          {
            id: 'F002',
            code: 'ID',
            name: '印尼工厂',
            nameEn: 'Indonesia Factory',
            country: '印度尼西亚',
            timezone: 'Asia/Jakarta',
            currency: 'IDR',
            language: 'id-ID',
            status: 'ACTIVE',
            sortOrder: 2,
          },
          {
            id: 'F003',
            code: 'SZ',
            name: '苏州工厂',
            nameEn: 'Suzhou Factory',
            country: '中国',
            timezone: 'Asia/Shanghai',
            currency: 'CNY',
            language: 'zh-CN',
            status: 'ACTIVE',
            sortOrder: 3,
          },
        ];

        // 保存到localStorage
        localStorage.setItem(FACTORIES_KEY, JSON.stringify(mockFactories));

        // 更新状态
        set({
          factories: mockFactories,
          availableFactories: mockFactories,
          loading: false,
        });

        // 如果当前工厂不在新列表中，重新选择
        const { currentFactoryId } = get();
        const currentFactory = mockFactories.find(f => f.id === currentFactoryId);
        if (!currentFactory && mockFactories.length > 0) {
          set({
            currentFactoryId: mockFactories[0].id,
            currentFactory: mockFactories[0],
          });
          localStorage.setItem(CURRENT_FACTORY_KEY, mockFactories[0].id);
        }
      } catch (error) {
        console.error('加载工厂列表失败:', error);
        set({ loading: false });
      }
    },

    setFactories: (factories: FactoryConfig[]) => {
      localStorage.setItem(FACTORIES_KEY, JSON.stringify(factories));
      set({ factories, availableFactories: factories });
    },

    switchFactory: (factoryId: string) => {
      const { factories } = get();
      const factory = factories.find(f => f.id === factoryId);

      if (factory) {
        localStorage.setItem(CURRENT_FACTORY_KEY, factoryId);
        set({
          currentFactoryId: factoryId,
          currentFactory: factory,
        });

        // 触发工厂切换事件（供其他模块监听）
        window.dispatchEvent(new CustomEvent('factoryChanged', {
          detail: { factoryId, factory },
        }));
      }
    },

    setCurrentFactoryId: (factoryId: string) => {
      const { factories } = get();
      const factory = factories.find(f => f.id === factoryId);

      if (factory) {
        localStorage.setItem(CURRENT_FACTORY_KEY, factoryId);
        set({
          currentFactoryId: factoryId,
          currentFactory: factory,
        });
      }
    },

    getAvailableFactories: (userId: string) => {
      const { factories } = get();

      // 这里可以根据用户权限过滤工厂
      // 暂时返回所有工厂
      return factories;
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },
  })
);

// 导出便捷函数
export const loadFactories = () => useFactoryStore.getState().loadFactories();
export const switchFactory = (factoryId: string) => useFactoryStore.getState().switchFactory(factoryId);
export const getCurrentFactory = () => useFactoryStore.getState().currentFactory;
export const getCurrentFactoryId = () => useFactoryStore.getState().currentFactoryId;
export const getAvailableFactories = () => useFactoryStore.getState().availableFactories;