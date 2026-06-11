/**
 * 多工厂状态管理 - Zustand实现
 * 管理多工厂切换、工厂配置、当前工厂等
 */

import { create } from 'zustand';
import type {
  FactoryConfig,
  UserFactoryAuth,
  FactoryStats,
  SwitchFactoryDTO,
} from '../types';

interface FactoryState {
  // 所有工厂列表
  factories: FactoryConfig[];

  // 当前选中的工厂ID
  currentFactoryId: string;

  // 当前选中的工厂配置
  currentFactory: FactoryConfig | null;

  // 用户可访问的工厂列表
  availableFactories: FactoryConfig[];

  // 用户工厂授权信息
  userFactoryAuth: UserFactoryAuth | null;

  // 工厂统计信息
  factoryStats: FactoryStats | null;

  // UI状态
  loading: boolean;
  error: string | null;

  // Actions
  loadFactories: () => Promise<void>;
  setFactories: (factories: FactoryConfig[]) => void;
  switchFactory: (factoryId: string) => Promise<void>;
  setCurrentFactoryId: (factoryId: string) => void;
  getAvailableFactories: (userId: string) => FactoryConfig[];
  getUserDefaultFactoryId: (userId: string) => string;
  loadFactoryStats: (factoryId: string) => Promise<void>;
  setUserFactoryAuth: (auth: UserFactoryAuth) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 兼容别名
  updateFactoryStatus: (id: string, status: string) => Promise<void>;
}

const FACTORIES_KEY = 'mes_factories';
const CURRENT_FACTORY_KEY = 'mes_current_factory';
const USER_FACTORY_AUTH_KEY = 'mes_user_factory_auth';

// 创建Zustand Store
export const useFactoryStore = create<FactoryState>()(
  (set, get) => ({
    // 初始化：从localStorage加载（所有初始状态在 IIFE 里统一设置）
    ...(() => {
      const savedFactories = localStorage.getItem(FACTORIES_KEY);
      const savedCurrentFactory = localStorage.getItem(CURRENT_FACTORY_KEY);
      const savedUserFactoryAuth = localStorage.getItem(USER_FACTORY_AUTH_KEY);

      let factories: FactoryConfig[] = [];
      let currentFactoryId = '';
      let userFactoryAuth: UserFactoryAuth | null = null;

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
        // 默认选择第一个工厂
        currentFactoryId = factories[0].id;
      }

      if (savedUserFactoryAuth) {
        try {
          userFactoryAuth = JSON.parse(savedUserFactoryAuth) as UserFactoryAuth;
        } catch {
          userFactoryAuth = null;
        }
      }

      const currentFactory = factories.find(f => f.id === currentFactoryId) || null;

      return {
        factories,
        currentFactoryId,
        currentFactory,
        userFactoryAuth,
        availableFactories: factories,
        factoryStats: null as any,
        loading: false,
        error: null as string | null,
      };
    })(),

    // Actions
    loadFactories: async () => {
      set({ loading: true, error: null });

      try {
        // 这里调用真实的API获取工厂列表
        // const response = await apiClient.get<FactoryConfig[]>('/api/system/factories');
        // const factories = response.data;

        // 模拟工厂数据（开发阶段）
        const mockFactories: FactoryConfig[] = [
          {
            id: 'F001',
            code: 'JN',
            name: '济宁工厂',
            nameEn: 'Jining Factory',
            country: '中国',
            province: '山东省',
            city: '济宁市',
            timezone: 'Asia/Shanghai',
            currency: 'CNY',
            language: 'zh-CN',
            status: 'ACTIVE',
            sortOrder: 1,
            contactPerson: '张经理',
            contactPhone: '13800138001',
            contactEmail: 'jn.manager@example.com',
            description: '济宁医疗器械生产基地',
            createTime: '2024-01-01T00:00:00Z',
            updateTime: '2024-05-02T00:00:00Z',
            creatorId: 'admin',
            creatorName: '系统管理员',
          },
          {
            id: 'F002',
            code: 'ID',
            name: '印尼工厂',
            nameEn: 'Indonesia Factory',
            country: '印度尼西亚',
            province: '雅加达',
            city: '雅加达',
            timezone: 'Asia/Jakarta',
            currency: 'IDR',
            language: 'id-ID',
            status: 'ACTIVE',
            sortOrder: 2,
            contactPerson: 'Mr. Budi',
            contactPhone: '+62 21 1234 5678',
            contactEmail: 'budi.manager@example.com',
            description: '印尼医疗器械生产基地',
            createTime: '2024-01-15T00:00:00Z',
            updateTime: '2024-05-02T00:00:00Z',
            creatorId: 'admin',
            creatorName: '系统管理员',
          },
          {
            id: 'F003',
            code: 'SZ',
            name: '苏州工厂',
            nameEn: 'Suzhou Factory',
            country: '中国',
            province: '江苏省',
            city: '苏州市',
            timezone: 'Asia/Shanghai',
            currency: 'CNY',
            language: 'zh-CN',
            status: 'ACTIVE',
            sortOrder: 3,
            contactPerson: '李经理',
            contactPhone: '13900139001',
            contactEmail: 'sz.manager@example.com',
            description: '苏州医疗器械研发生产基地',
            createTime: '2024-02-01T00:00:00Z',
            updateTime: '2024-05-02T00:00:00Z',
            creatorId: 'admin',
            creatorName: '系统管理员',
          },
          {
            id: 'F004',
            code: 'JP',
            name: '东京工厂',
            nameEn: 'Tokyo Factory',
            country: '日本',
            province: '东京都',
            city: '东京',
            timezone: 'Asia/Tokyo',
            currency: 'JPY',
            language: 'ja-JP',
            status: 'INACTIVE',
            sortOrder: 4,
            contactPerson: '田中さん',
            contactPhone: '+81 3 1234 5678',
            contactEmail: 'tanaka.manager@example.com',
            description: '东京医疗器械生产基地（建设中）',
            createTime: '2024-03-01T00:00:00Z',
            updateTime: '2024-05-02T00:00:00Z',
            creatorId: 'admin',
            creatorName: '系统管理员',
          },
        ];

        // 保存到localStorage
        localStorage.setItem(FACTORIES_KEY, JSON.stringify(mockFactories));

        // 更新状态
        set({
          factories: mockFactories,
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
        set({ loading: false, error: '加载工厂列表失败' });
      }
    },

    setFactories: (factories: FactoryConfig[]) => {
      localStorage.setItem(FACTORIES_KEY, JSON.stringify(factories));
      set({ factories, availableFactories: factories });
    },

    switchFactory: async (factoryId: string) => {
      try {
        // 调用API切换工厂
        // await apiClient.post('/api/system/factory/switch', { factoryId });

        const { factories } = get();
        const factory = factories.find(f => f.id === factoryId);

        if (factory) {
          localStorage.setItem(CURRENT_FACTORY_KEY, factoryId);
          set({
            currentFactoryId: factoryId,
            currentFactory: factory,
            error: null,
          });

          // 触发工厂切换事件（供其他模块监听）
          window.dispatchEvent(new CustomEvent('factoryChanged', {
            detail: { factoryId, factory },
          }));
        } else {
          set({ error: '工厂不存在' });
        }
      } catch (error) {
        console.error('切换工厂失败:', error);
        set({ error: '切换工厂失败' });
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
      const { factories, userFactoryAuth } = get();

      // 如果没有用户授权信息，返回所有工厂（管理员）
      if (!userFactoryAuth) {
        return factories.filter(f => f.status === 'ACTIVE');
      }

      // 根据用户权限过滤工厂
      return factories.filter(f =>
        userFactoryAuth.factoryIds.includes(f.id) && f.status === 'ACTIVE'
      );
    },

    getUserDefaultFactoryId: (userId: string) => {
      const { userFactoryAuth, factories } = get();

      if (userFactoryAuth) {
        return userFactoryAuth.defaultFactoryId;
      }

      // 如果没有授权信息，返回第一个工厂
      return factories.length > 0 ? factories[0].id : '';
    },

    loadFactoryStats: async (factoryId: string) => {
      try {
        // 调用API获取工厂统计信息
        // const response = await apiClient.get<FactoryStats>(`/api/system/factory/${factoryId}/stats`);
        // const stats = response.data;

        // 模拟统计数据
        const mockStats: FactoryStats = {
          factoryId,
          factoryName: get().currentFactory?.name || '',
          workshopCount: 12,
          workCenterCount: 48,
          teamCount: 96,
          employeeCount: 480,
          equipmentCount: 120,
          productionOrderCount: 24,
          workOrderCount: 156,
          todayProduction: 8640,
        };

        set({ factoryStats: mockStats });
      } catch (error) {
        console.error('加载工厂统计失败:', error);
        set({ error: '加载工厂统计失败' });
      }
    },

    setUserFactoryAuth: (auth: UserFactoryAuth) => {
      localStorage.setItem(USER_FACTORY_AUTH_KEY, JSON.stringify(auth));
      set({ userFactoryAuth: auth });

      // 重新计算可用工厂列表
      const { factories } = get();
      const availableFactories = factories.filter(f =>
        auth.factoryIds.includes(f.id) && f.status === 'ACTIVE'
      );
      set({ availableFactories });
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    // 兼容别名
    updateFactoryStatus: async (_id: string, _status: string) => {
      await get().loadFactories();
    },
  })
);

// 导出便捷函数
export const loadFactories = () => useFactoryStore.getState().loadFactories();
export const switchFactory = (factoryId: string) => useFactoryStore.getState().switchFactory(factoryId);
export const getCurrentFactory = () => useFactoryStore.getState().currentFactory;
export const getCurrentFactoryId = () => useFactoryStore.getState().currentFactoryId;
export const getAvailableFactories = (userId: string) => useFactoryStore.getState().getAvailableFactories(userId);
export const loadFactoryStats = (factoryId: string) => useFactoryStore.getState().loadFactoryStats(factoryId);