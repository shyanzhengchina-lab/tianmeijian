/**
 * 工艺路线主数据模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RoutingMaster,
  RoutingMasterQuery,
  CreateRoutingMasterDTO,
  UpdateRoutingMasterDTO,
  CopyRoutingMasterDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';
import { message } from 'antd';

/**
 * RoutingMaster Store状态接口
 */
export interface RoutingMasterState {
  // 工艺路线列表状态
  routings: RoutingMaster[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: RoutingMasterQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedRoutings: RoutingMaster[];

  // 详情状态
  currentRouting: RoutingMaster | null;
  showDetailDrawer: boolean;

  // 操作状态
  operationLoading: boolean;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showCopyModal: boolean;

  // Actions
  setRoutings: (routings: RoutingMaster[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<RoutingMasterQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentRouting: (routing: RoutingMaster | null) => void;
  setShowDetailDrawer: (show: boolean) => void;

  // 工艺路线操作
  loadRoutings: () => Promise<void>;
  refreshRoutings: () => Promise<void>;
  createRouting: (data: CreateRoutingMasterDTO) => Promise<void>;
  updateRouting: (data: UpdateRoutingMasterDTO) => Promise<void>;
  deleteRoutings: (ids: string[]) => Promise<void>;
  updateStatus: (ids: string[], status: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  copyRouting: (data: CopyRoutingMasterDTO) => Promise<void>;

  // 版本操作
  setDefaultRouting: (id: string) => Promise<void>;
  activateRouting: (id: string) => Promise<void>;
  deactivateRouting: (id: string) => Promise<void>;

  // UI操作
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowCopyModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * RoutingMaster Store
 */
export const useRoutingMasterStore = create<RoutingMasterState>()(
  persist(
    (set, get) => ({
      // 初始状态
      routings: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedRoutings: [],
      currentRouting: null,
      showDetailDrawer: false,
      operationLoading: false,
      showCreateModal: false,
      showEditModal: false,
      showCopyModal: false,

      /**
       * 设置工艺路线列表数据
       */
      setRoutings: (routingList: RoutingMaster[], total: number) => {
        set({ routings: routingList, total, error: null });
      },

      /**
       * 设置加载状态
       */
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      /**
       * 设置错误状态
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * 设置查询参数
       */
      setQuery: (query: Partial<RoutingMasterQuery>) => {
        set((state) => ({
          query: { ...state.query, ...query, current: 1 },
        }));
      },

      /**
       * 设置筛选条件
       */
      setFilters: (filters: Record<string, any>) => {
        set({ filters });
      },

      /**
       * 设置选中ID列表
       */
      setSelectedIds: (ids: string[]) => {
        const { routings } = get();
        const selectedRoutings = routings.filter(r => ids.includes(r.id));
        set({ selectedIds: ids, selectedRoutings });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedIds: [],
          selectedRoutings: [],
        });
      },

      /**
       * 设置当前工艺路线
       */
      setCurrentRouting: (routing: RoutingMaster | null) => {
        set({ currentRouting: routing });
      },

      /**
       * 显示详情抽屉
       */
      setShowDetailDrawer: (show: boolean) => {
        set({ showDetailDrawer: show });
      },

      /**
       * 加载工艺路线列表
       */
      loadRoutings: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载工艺路线数据
          // const response = await routingMasterApi.getRoutings(query);

          // if (response.code === 200) {
          //   set({
          //     routings: response.data.list,
          //     total: response.data.total,
          //     loading: false,
          //   });
          // }

          // 暂时使用空数据
          setTimeout(() => {
            set({
              routings: [],
              total: 0,
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 刷新工艺路线列表
       */
      refreshRoutings: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API刷新工艺路线数据
          // const response = await routingMasterApi.refreshRoutings(query);

          // if (response.code === 200) {
          //   set({
          //     routings: response.data.list,
          //     total: response.data.total,
          //     loading: false,
          //   });
          // }

          // 模拟刷新过程
          setTimeout(() => {
            set({
              routings: [],
              total: 0,
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '刷新失败',
          });
        }
      },

      /**
       * 创建工艺路线
       */
      createRouting: async (data: CreateRoutingMasterDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API创建工艺路线
          // const response = await routingMasterApi.createRouting(data);

          // if (response.code === 200) {
          //   await get().loadRoutings();
          //   set({ showCreateModal: false });
          //   message.success('工艺路线创建成功！');
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '创建失败',
          //   });
          // }

          // 模拟创建过程
          setTimeout(() => {
            message.success('工艺路线创建成功！');
            set({ loading: false, showCreateModal: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
        }
      },

      /**
       * 更新工艺路线
       */
      updateRouting: async (data: UpdateRoutingMasterDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新工艺路线
          // const response = await routingMasterApi.updateRouting(data);

          // if (response.code === 200) {
          //   await get().loadRoutings();
          //   set({ showEditModal: false });
          //   message.success('工艺路线更新成功！');
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '更新失败',
          //   });
          // }

          // 模拟更新过程
          setTimeout(() => {
            message.success('工艺路线更新成功！');
            set({ loading: false, showEditModal: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
        }
      },

      /**
       * 删除工艺路线
       */
      deleteRoutings: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API删除工艺路线
          // const response = await routingMasterApi.deleteRoutings(ids);

          // if (response.code === 200) {
          //   await get().loadRoutings();
          //   get().clearSelection();
          //   message.success(`成功删除 ${ids.length} 个工艺路线`);
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '删除失败',
          //   });
          // }

          // 模拟删除过程
          setTimeout(() => {
            message.success(`成功删除 ${ids.length} 个工艺路线`);
            set({ loading: false });
            get().clearSelection();
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
        }
      },

      /**
       * 更新工艺路线状态
       */
      updateStatus: async (ids: string[], status: 'ACTIVE' | 'INACTIVE') => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新工艺路线状态
          // const response = await routingMasterApi.updateStatus(ids, status);

          // if (response.code === 200) {
          //   await get().loadRoutings();
          //   message.success(`成功${status === 'ACTIVE' ? '生效' : '停用'} ${ids.length} 个工艺路线`);
          // }

          // 模拟更新过程
          setTimeout(() => {
            message.success(`成功${status === 'ACTIVE' ? '生效' : '停用'} ${ids.length} 个工艺路线`);
            set({ loading: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '状态更新失败',
          });
        }
      },

      /**
       * 复制工艺路线
       */
      copyRouting: async (data: CopyRoutingMasterDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API复制工艺路线
          // const response = await routingMasterApi.copyRouting(data);

          // if (response.code === 200) {
          //   await get().loadRoutings();
          //   set({ showCopyModal: false });
          //   message.success('工艺路线复制成功！');
          // }

          // 模拟复制过程
          setTimeout(() => {
            message.success('工艺路线复制成功！');
            set({ loading: false, showCopyModal: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '复制失败',
          });
        }
      },

      /**
       * 设置默认工艺路线
       */
      setDefaultRouting: async (id: string) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API设置默认工艺路线
          // const response = await routingMasterApi.setDefaultRouting(id);

          // if (response.code === 200) {
          //   await get().loadRoutings();
          //   message.success('已设置为默认工艺路线！');
          // }

          // 模拟设置过程
          setTimeout(() => {
            message.success('已设置为默认工艺路线！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '设置失败',
          });
        }
      },

      /**
       * 生效工艺路线
       */
      activateRouting: async (id: string) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API生效工艺路线
          // const response = await routingMasterApi.activateRouting(id);

          // if (response.code === 200) {
          //   await get().loadRoutings();
          //   message.success('工艺路线已生效！');
          // }

          // 模拟生效过程
          setTimeout(() => {
            message.success('工艺路线已生效！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '生效失败',
          });
        }
      },

      /**
       * 停用工艺路线
       */
      deactivateRouting: async (id: string) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API停用工艺路线
          // const response = await routingMasterApi.deactivateRouting(id);

          // if (response.code === 200) {
          //   await get().loadRoutings();
          //   message.success('工艺路线已停用！');
          // }

          // 模拟停用过程
          setTimeout(() => {
            message.success('工艺路线已停用！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '停用失败',
          });
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentRouting: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示复制弹窗
       */
      setShowCopyModal: (show: boolean) => {
        set({ showCopyModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          routings: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedRoutings: [],
          currentRouting: null,
          showDetailDrawer: false,
          operationLoading: false,
          showCreateModal: false,
          showEditModal: false,
          showCopyModal: false,
        });
      },
    }),
    {
      name: 'routing-master-store',
      // 只持久化核心状态
      partialize: (state) => ({
        routings: state.routings,
        query: state.query,
        filters: state.filters,
      }),
    }
  )
);

export default useRoutingMasterStore;