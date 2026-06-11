/**
 * 工序模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import type { Operation, OperationQuery, OperationStatistics, OperationStatusAction } from '../types';
import { operationApi } from '../api/operationApi';

/**
 * 工序Store状态接口
 */
export interface OperationState {
  // 数据状态
  operations: Operation[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: OperationQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedOperations: Operation[];

  // 详情状态
  currentOperation: Operation | null;

  // 统计数据
  statistics: OperationStatistics | null;

  // 分类数据
  categoryTree: Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>;

  // 关联数据
  workshops: Array<{ id: string; name: string; code: string }>;
  workCenters: Array<{ id: string; name: string; code: string }>;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  showCopyModal: boolean;

  // Actions
  loadWorkshops: () => Promise<void>;
  loadWorkCenters: () => Promise<void>;
  setOperations: (operations: Operation[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<OperationQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadOperations: () => Promise<void>;
  refreshOperations: () => Promise<void>;
  createOperation: (data: any) => Promise<void>;
  updateOperation: (data: any) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;
  batchDeleteOperations: (ids: string[]) => Promise<void>;
  batchEnableOperations: (ids: string[]) => Promise<void>;
  batchDisableOperations: (ids: string[]) => Promise<void>;
  updateOperationStatus: (action: OperationStatusAction) => Promise<void>;
  loadOperationById: (id: string) => Promise<Operation | null>;
  copyOperation: (id: string) => Promise<void>;
  checkCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  getAvailableWorkCenters: () => Promise<any[]>;
  getBottleneckOperations: () => Promise<Operation[]>;
  getOperationsBySkillLevel: (skillLevel: string) => Promise<Operation[]>;
  loadCategoryTree: () => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowCopyModal: (show: boolean) => void;
  setCurrentOperation: (operation: Operation | null) => void;
  loadStatistics: () => Promise<void>;
  importOperations: (file: File, validate?: boolean, updateMode?: 'create' | 'update' | 'skip') => Promise<void>;
  exportOperations: (query?: OperationQuery, fileName?: string) => Promise<void>;
  batchUpdateWorkCenter: (ids: string[], workCenterId: string) => Promise<void>;
  reorderSort: (items: Array<{ id: string; sort: number }>) => Promise<void>;
  moveOperationUp: (id: string) => Promise<void>;
  moveOperationDown: (id: string) => Promise<void>;
  reset: () => void;

  // 兼容别名
  pagination: { current: number; pageSize: number; total: number };
  deleteOperations: (ids: string[]) => Promise<void>;
  activateOperation: (id: string) => Promise<void>;
  deactivateOperation: (id: string) => Promise<void>;
  obsoleteOperation: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
}

/**
 * 工序Store
 */
export const useOperationStore = create<OperationState>()(
  persist(
    (set, get) => ({
      // 初始状态
      operations: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedOperations: [],
      currentOperation: null,
      statistics: null,
      categoryTree: [],
      workshops: [],
      workCenters: [],
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      showCopyModal: false,

      /**
       * 设置工序列表数据
       */
      setOperations: (operations: Operation[], total: number) => {
        set({ operations, total, error: null });
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
      setQuery: (query: Partial<OperationQuery>) => {
        set((state) => ({
          query: { ...state.query, ...query, current: 1 }, // 重置到第一页
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
        const { operations } = get();
        const selectedOperations = operations.filter(o => ids.includes(o.id));
        set({ selectedIds: ids, selectedOperations });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedOperations: [] });
      },

      /**
       * 加载工序列表
       */
      loadOperations: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await operationApi.getOperations(query);

          if (response.code === 200) {
            set({
              operations: response.data.list as any,
              total: response.data.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 刷新工序列表
       */
      refreshOperations: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await operationApi.getOperations(query);

          if (response.code === 200) {
            set({
              operations: response.data.list as any,
              total: response.data.total,
              loading: false,
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '刷新失败',
          });
        }
      },

      /**
       * 创建工序
       */
      createOperation: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.createOperation(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
            set({ showCreateModal: false });
          } else {
            set({
              loading: false,
              error: response.message || '创建失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
        }
      },

      /**
       * 更新工序
       */
      updateOperation: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.updateOperation(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
            set({ showEditModal: false, currentOperation: null });
          } else {
            set({
              loading: false,
              error: response.message || '更新失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
        }
      },

      /**
       * 删除工序
       */
      deleteOperation: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.deleteOperation(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
          } else {
            set({
              loading: false,
              error: response.message || '删除失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
        }
      },

      /**
       * 批量删除工序
       */
      batchDeleteOperations: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.deleteOperations(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
            // 清除选择
            set({ selectedIds: [], selectedOperations: [] });
          } else {
            set({
              loading: false,
              error: response.message || '批量删除失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量删除失败',
          });
        }
      },

      /**
       * 批量启用工序
       */
      batchEnableOperations: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.batchEnable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
          } else {
            set({
              loading: false,
              error: response.message || '批量启用失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量启用失败',
          });
        }
      },

      /**
       * 批量禁用工序
       */
      batchDisableOperations: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.batchDisable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
          } else {
            set({
              loading: false,
              error: response.message || '批量禁用失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量禁用失败',
          });
        }
      },

      /**
       * 更新工序状态
       */
      updateOperationStatus: async (action: OperationStatusAction) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.updateStatus(action);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
          } else {
            set({
              loading: false,
              error: response.message || '状态更新失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '状态更新失败',
          });
        }
      },

      /**
       * 根据ID加载工序
       */
      loadOperationById: async (id: string): Promise<Operation | null> => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.getOperationById(id);

          if (response.code === 200) {
            set({
              currentOperation: response.data as any,
              loading: false,
            });
            return response.data as any;
          } else {
            set({
              loading: false,
              error: response.message || '加载失败',
            });
            return null;
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
          return null;
        }
      },

      /**
       * 复制工序
       */
      copyOperation: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.copyOperation(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
            set({ showCopyModal: false });
          } else {
            set({
              loading: false,
              error: response.message || '复制失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '复制失败',
          });
        }
      },

      /**
       * 检查工序编码唯一性
       */
      checkCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await operationApi.checkCodeUnique(code, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 获取可用工作中心列表
       */
      getAvailableWorkCenters: async (): Promise<any[]> => {
        try {
          const response = await operationApi.getAvailableWorkCenters();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用工作中心失败:', error);
          return [];
        }
      },

      /**
       * 获取瓶颈工序列表
       */
      getBottleneckOperations: async (): Promise<Operation[]> => {
        try {
          const response = await operationApi.getBottleneckOperations();
          return response.code === 200 ? response.data as any : [];
        } catch (error: any) {
          console.error('获取瓶颈工序失败:', error);
          return [];
        }
      },

      /**
       * 根据技能等级筛选工序
       */
      getOperationsBySkillLevel: async (skillLevel: string): Promise<Operation[]> => {
        try {
          const response = await operationApi.getOperationsBySkillLevel(skillLevel);
          return response.code === 200 ? response.data as any : [];
        } catch (error: any) {
          console.error('获取工序失败:', error);
          return [];
        }
      },

      /**
       * 加载分类树
       */
      loadCategoryTree: async () => {
        try {
          const response = await operationApi.getCategoryTree();

          if (response.code === 200) {
            set({ categoryTree: response.data });
          }
        } catch (error: any) {
          console.error('加载分类树失败:', error);
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentOperation: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示详情抽屉
       */
      setShowDetailDrawer: (show: boolean) => {
        set({ showDetailDrawer: show });
      },

      /**
       * 显示复制弹窗
       */
      setShowCopyModal: (show: boolean) => {
        set({ showCopyModal: show });
      },

      /**
       * 设置当前工序
       */
      setCurrentOperation: (operation: Operation | null) => {
        set({ currentOperation: operation });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await operationApi.getStatistics();

          if (response.code === 200) {
            set({ statistics: response.data });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入工序
       */
      importOperations: async (
        file: File,
        validate?: boolean,
        updateMode?: 'create' | 'update' | 'skip'
      ) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.importOperations({
            file,
            validate,
            updateMode,
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
          } else {
            set({
              loading: false,
              error: response.message || '导入失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导入失败',
          });
        }
      },

      /**
       * 导出工序
       */
      exportOperations: async (query?: OperationQuery, fileName?: string) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          await operationApi.exportOperations(query || currentQuery, fileName);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 批量更新工作中心
       */
      batchUpdateWorkCenter: async (ids: string[], workCenterId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.batchUpdateWorkCenter(ids, workCenterId);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
          } else {
            set({
              loading: false,
              error: response.message || '批量更新工作中心失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量更新工作中心失败',
          });
        }
      },

      /**
       * 调整排序
       */
      reorderSort: async (items: Array<{ id: string; sort: number }>) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.reorderSort(items);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
          } else {
            set({
              loading: false,
              error: response.message || '排序调整失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '排序调整失败',
          });
        }
      },

      /**
       * 上移工序
       */
      moveOperationUp: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.moveUp(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
            message.success('工序已上移');
          } else {
            set({
              loading: false,
              error: response.message || '上移失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '上移失败',
          });
        }
      },

      /**
       * 下移工序
       */
      moveOperationDown: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await operationApi.moveDown(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadOperations();
            message.success('工序已下移');
          } else {
            set({
              loading: false,
              error: response.message || '下移失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '下移失败',
          });
        }
      },

      /**
       * 重置状态
       */
      loadWorkshops: async () => {
      set({ workshops: [] });
    },
    loadWorkCenters: async () => {
      set({ workCenters: [] });
    },
    reset: () => {
        set({
          operations: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedOperations: [],
          currentOperation: null,
          statistics: null,
          categoryTree: [],
          showCreateModal: false,
          showEditModal: false,
          showDetailDrawer: false,
          showCopyModal: false,
        });
      },

    // 兼容别名
    get pagination() {
      const s = get();
      return { current: (s.query as any).current || 1, pageSize: (s.query as any).pageSize || 15, total: s.total };
    },
    deleteOperations: async (ids: string[]) => { await get().batchDeleteOperations(ids); },
    activateOperation: async (id: string) => { await get().updateOperationStatus({ action: 'activate', ids: [id] } as any); },
    deactivateOperation: async (id: string) => { await get().updateOperationStatus({ action: 'deactivate', ids: [id] } as any); },
    obsoleteOperation: async (id: string) => { await get().updateOperationStatus({ action: 'obsolete', ids: [id] } as any); },
    updateStatus: async (ids: string[], status: string) => { await get().updateOperationStatus({ action: status, ids } as any); },
    }),
    {
      name: 'operation-store',
      // 可选：配置存储选项
      // getStorage: () => localStorage,
      // setStorage: () => localStorage,
      // 持久化选定的字段
      partialize: (state) => ({
        query: state.query,
        filters: state.filters,
      }),
    }
  )
);

export default useOperationStore;
