/**
 * 工艺路径模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import type {
  ProcessRouting,
  ProcessRoutingQuery,
  CreateProcessRoutingDTO,
  UpdateProcessRoutingDTO,
  ProcessRoutingBatchAction,
  CopyProcessRoutingDTO,
  PublishProcessRoutingDTO,
  ProcessRoutingStatistics,
} from '../types';
import { processRoutingApi } from '../api';

/**
 * ProcessRouting Store状态接口
 */
export interface ProcessRoutingState {
  // 数据状态
  processRoutings: ProcessRouting[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: ProcessRoutingQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedRoutings: ProcessRouting[];

  // 详情状态
  currentRouting: ProcessRouting | null;

  // 统计数据
  statistics: ProcessRoutingStatistics | null;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  showCopyModal: boolean;
  showPublishModal: boolean;

  // Actions
  setProcessRoutings: (routings: ProcessRouting[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<ProcessRoutingQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadProcessRoutings: () => Promise<void>;
  refreshProcessRoutings: () => Promise<void>;
  createProcessRouting: (data: CreateProcessRoutingDTO) => Promise<void>;
  updateProcessRouting: (data: UpdateProcessRoutingDTO) => Promise<void>;
  deleteProcessRoutings: (ids: string[]) => Promise<void>;
  batchProcessRoutings: (action: ProcessRoutingBatchAction) => Promise<void>;
  copyProcessRouting: (data: CopyProcessRoutingDTO) => Promise<void>;
  publishProcessRouting: (data: PublishProcessRoutingDTO) => Promise<void>;
  obsoleteProcessRouting: (id: string) => Promise<void>;
  enableProcessRouting: (id: string) => Promise<void>;
  disableProcessRouting: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: 'DRAFT' | 'PUBLISHED' | 'OBSOLETE' | 'DISABLED') => Promise<void>;
  loadProcessRoutingById: (id: string) => Promise<ProcessRouting | null>;
  checkRoutingCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  loadStatistics: () => Promise<void>;
  importProcessRoutings: (file: File) => Promise<void>;
  exportProcessRoutings: (query?: ProcessRoutingQuery) => Promise<void>;
  getAvailableOperations: () => Promise<any[]>;
  getAvailableWorkCenters: () => Promise<any[]>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowCopyModal: (show: boolean) => void;
  setShowPublishModal: (show: boolean) => void;
  setCurrentRouting: (routing: ProcessRouting | null) => void;
  reset: () => void;
}

/**
 * 工艺路径Store
 */
export const useProcessRoutingStore = create<ProcessRoutingState>()(
  persist(
    (set, get) => ({
      // 初始状态
      processRoutings: [],
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
      statistics: null,
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      showCopyModal: false,
      showPublishModal: false,

      /**
       * 设置工艺路径列表数据
       */
      setProcessRoutings: (routings: ProcessRouting[], total: number) => {
        set({ processRoutings: routings, total, error: null });
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
      setQuery: (query: Partial<ProcessRoutingQuery>) => {
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
        const { processRoutings } = get();
        const selectedRoutings = processRoutings.filter(r => ids.includes(r.id));
        set({ selectedIds: ids, selectedRoutings });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedRoutings: [] });
      },

      /**
       * 加载工艺路径列表
       */
      loadProcessRoutings: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.getProcessRoutings(query);

          if ((response as any).code === 200) {
            set({
              processRoutings: (response as any).data?.list,
              total: (response as any).data?.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
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
       * 刷新工艺路径列表
       */
      refreshProcessRoutings: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.getProcessRoutings(query);

          if ((response as any).code === 200) {
            set({
              processRoutings: (response as any).data?.list,
              total: (response as any).data?.total,
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
       * 创建工艺路径
       */
      createProcessRouting: async (data: CreateProcessRoutingDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.createProcessRouting(data);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            set({ showCreateModal: false });
            message.success('工艺路径创建成功！');
          } else {
            set({
              loading: false,
              error: (response as any).message || '创建失败',
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
       * 更新工艺路径
       */
      updateProcessRouting: async (data: UpdateProcessRoutingDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.updateProcessRouting(data);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            set({ showEditModal: false, currentRouting: null });
            message.success('工艺路径更新成功！');
          } else {
            set({
              loading: false,
              error: (response as any).message || '更新失败',
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
       * 删除工艺路径
       */
      deleteProcessRoutings: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.batchProcessRoutings({
            action: 'delete',
            ids,
          });

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            get().clearSelection();
            message.success(`成功删除 ${ids.length} 个工艺路径`);
          } else {
            set({
              loading: false,
              error: (response as any).message || '删除失败',
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
       * 批量操作工艺路径
       */
      batchProcessRoutings: async (action: ProcessRoutingBatchAction) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.batchProcessRoutings(action);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            get().clearSelection();
            message.success('批量操作成功！');
          } else {
            set({
              loading: false,
              error: (response as any).message || '批量操作失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量操作失败',
          });
        }
      },

      /**
       * 复制工艺路径
       */
      copyProcessRouting: async (data: CopyProcessRoutingDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.copyProcessRouting(data);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            set({ showCopyModal: false });
            message.success('工艺路径复制成功！');
          } else {
            set({
              loading: false,
              error: (response as any).message || '复制失败',
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
       * 发布工艺路径
       */
      publishProcessRouting: async (data: PublishProcessRoutingDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.publishProcessRouting(data);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            set({ showPublishModal: false });
            message.success('工艺路径发布成功！');
          } else {
            set({
              loading: false,
              error: (response as any).message || '发布失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '发布失败',
          });
        }
      },

      /**
       * 作废工艺路径
       */
      obsoleteProcessRouting: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.obsoleteProcessRouting(id);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            message.success('工艺路径已作废');
          } else {
            set({
              loading: false,
              error: (response as any).message || '作废失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '作废失败',
          });
        }
      },

      /**
       * 启用工艺路径
       */
      enableProcessRouting: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.enableProcessRouting(id);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            message.success('工艺路径已启用');
          } else {
            set({
              loading: false,
              error: (response as any).message || '启用失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '启用失败',
          });
        }
      },

      /**
       * 禁用工艺路径
       */
      disableProcessRouting: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.disableProcessRouting(id);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            message.success('工艺路径已禁用');
          } else {
            set({
              loading: false,
              error: (response as any).message || '禁用失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '禁用失败',
          });
        }
      },

      /**
       * 更新工艺路径状态
       */
      updateStatus: async (ids: string[], status: 'DRAFT' | 'PUBLISHED' | 'OBSOLETE' | 'DISABLED') => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.updateStatus(ids, status);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            message.success('状态更新成功！');
          } else {
            set({
              loading: false,
              error: (response as any).message || '状态更新失败',
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
       * 根据ID加载工艺路径
       */
      loadProcessRoutingById: async (id: string): Promise<ProcessRouting | null> => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.getProcessRoutingById(id);

          if ((response as any).code === 200) {
            set({
              currentRouting: (response as any).data,
              loading: false,
            });
            return (response as any).data;
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
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
       * 检查工艺路径编码唯一性
       */
      checkRoutingCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await processRoutingApi.checkRoutingCodeExists(code, excludeId);
          return (response as any).code === 200 && !(response as any).data;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await processRoutingApi.getStatistics();

          if ((response as any).code === 200) {
            set({ statistics: (response as any).data });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入工艺路径
       */
      importProcessRoutings: async (file: File) => {
        set({ loading: true, error: null });

        try {
          const response = await processRoutingApi.importProcessRoutings(file);

          if ((response as any).code === 200) {
            await get().loadProcessRoutings();
            message.success(`成功导入 ${((response as any).data as any).success} 条数据`);
            if (((response as any).data as any).failed > 0) {
              message.warning(`有 ${((response as any).data as any).failed} 条数据导入失败`);
            }
          } else {
            set({
              loading: false,
              error: (response as any).message || '导入失败',
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
       * 导出工艺路径
       */
      exportProcessRoutings: async (query?: ProcessRoutingQuery) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          const blob = await processRoutingApi.exportProcessRoutings(query || currentQuery);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `工艺路径_${new Date().getTime()}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          set({ loading: false });
          message.success('导出成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 获取可用工序列表
       */
      getAvailableOperations: async (): Promise<any[]> => {
        try {
          return await processRoutingApi.getAvailableOperations();
        } catch (error: any) {
          console.error('获取可用工序失败:', error);
          return [];
        }
      },

      /**
       * 获取可用工作中心列表
       */
      getAvailableWorkCenters: async (): Promise<any[]> => {
        try {
          return await processRoutingApi.getAvailableWorkCenters();
        } catch (error: any) {
          console.error('获取可用工作中心失败:', error);
          return [];
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
       * 显示发布弹窗
       */
      setShowPublishModal: (show: boolean) => {
        set({ showPublishModal: show });
      },

      /**
       * 设置当前工艺路径
       */
      setCurrentRouting: (routing: ProcessRouting | null) => {
        set({ currentRouting: routing });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          processRoutings: [],
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
          statistics: null,
          showCreateModal: false,
          showEditModal: false,
          showDetailDrawer: false,
          showCopyModal: false,
          showPublishModal: false,
        });
      },
    }),
    {
      name: 'processrouting-store',
      // 只持久化核心状态
      partialize: (state) => ({
        query: state.query,
        filters: state.filters,
      }),
    }
  )
);

export default useProcessRoutingStore;
