/**
 * 质检方案模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QcSchemeQuery, QcSchemeStatistics } from '../types';
import type { QcScheme, QcSchemeStatusAction } from '../api/qcSchemeApi';
import { qcSchemeApi } from '../api/qcSchemeApi';

/**
 * 质检方案Store状态接口
 */
export interface QcSchemeState {
  // 数据状态
  qcSchemes: QcScheme[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: QcSchemeQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedQcSchemes: QcScheme[];

  // 详情状态
  currentQcScheme: QcScheme | null;

  // 统计数据
  statistics: QcSchemeStatistics | null;

  // 分类数据
  categoryTree: Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>;

  // 版本历史
  versionHistory: QcScheme[];

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  showVersionHistoryModal: boolean;
  showCopyModal: boolean;

  // Actions
  setQcSchemes: (qcSchemes: QcScheme[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<QcSchemeQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadQcSchemes: () => Promise<void>;
  refreshQcSchemes: () => Promise<void>;
  createQcScheme: (data: any) => Promise<void>;
  updateQcScheme: (data: any) => Promise<void>;
  deleteQcScheme: (id: string) => Promise<void>;
  batchDeleteQcSchemes: (ids: string[]) => Promise<void>;
  batchEnableQcSchemes: (ids: string[]) => Promise<void>;
  batchDisableQcSchemes: (ids: string[]) => Promise<void>;
  updateQcSchemeStatus: (action: QcSchemeStatusAction) => Promise<void>;
  loadQcSchemeById: (id: string) => Promise<QcScheme | null>;
  checkCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  getAvailableMaterials: () => Promise<any[]>;
  getAvailableOperations: () => Promise<any[]>;
  getAvailableQcItems: () => Promise<any[]>;
  loadCategoryTree: () => Promise<void>;
  getQcSchemesByMaterial: (materialId: string) => Promise<QcScheme[]>;
  getQcSchemesByOperation: (operationId: string) => Promise<QcScheme[]>;
  copyQcScheme: (id: string) => Promise<void>;
  loadVersionHistory: (qcSchemeId: string) => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowVersionHistoryModal: (show: boolean) => void;
  setShowCopyModal: (show: boolean) => void;
  setCurrentQcScheme: (qcScheme: QcScheme | null) => void;
  loadStatistics: () => Promise<void>;
  importQcSchemes: (file: File, validate?: boolean, updateMode?: 'create' | 'update' | 'skip') => Promise<void>;
  exportQcSchemes: (query?: QcSchemeQuery, fileName?: string) => Promise<void>;
  searchQcSchemes: (keyword: string) => Promise<QcScheme[]>;
  reset: () => void;
}

/**
 * 质检方案Store
 */
export const useQcSchemeStore = create<QcSchemeState>()(
  persist(
    (set, get) => ({
      // 初始状态
      qcSchemes: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedQcSchemes: [],
      currentQcScheme: null,
      statistics: null,
      categoryTree: [],
      versionHistory: [],
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      showVersionHistoryModal: false,
      showCopyModal: false,

      /**
       * 设置质检方案列表数据
       */
      setQcSchemes: (qcSchemes: QcScheme[], total: number) => {
        set({ qcSchemes, total, error: null });
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
      setQuery: (query: Partial<QcSchemeQuery>) => {
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
        const { qcSchemes } = get();
        const selectedQcSchemes = qcSchemes.filter(q => ids.includes(q.id));
        set({ selectedIds: ids, selectedQcSchemes });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedQcSchemes: [] });
      },

      /**
       * 加载质检方案列表
       */
      loadQcSchemes: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.getQcSchemes(query);

          if (response.code === 200) {
            set({
              qcSchemes: response.data.list,
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
       * 刷新质检方案列表
       */
      refreshQcSchemes: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.getQcSchemes(query);

          if (response.code === 200) {
            set({
              qcSchemes: response.data.list,
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
       * 创建质检方案
       */
      createQcScheme: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.createQcScheme(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
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
       * 更新质检方案
       */
      updateQcScheme: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.updateQcScheme(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
            set({ showEditModal: false, currentQcScheme: null });
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
       * 删除质检方案
       */
      deleteQcScheme: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.deleteQcScheme(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
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
       * 批量删除质检方案
       */
      batchDeleteQcSchemes: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.deleteQcSchemes(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
            // 清除选择
            set({ selectedIds: [], selectedQcSchemes: [] });
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
       * 批量启用质检方案
       */
      batchEnableQcSchemes: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.batchEnable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
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
       * 批量禁用质检方案
       */
      batchDisableQcSchemes: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.batchDisable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
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
       * 更新质检方案状态
       */
      updateQcSchemeStatus: async (action: QcSchemeStatusAction) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.updateStatus(action);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
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
       * 根据ID加载质检方案
       */
      loadQcSchemeById: async (id: string): Promise<QcScheme | null> => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.getQcSchemeById(id);

          if (response.code === 200) {
            set({
              currentQcScheme: response.data,
              loading: false,
            });
            return response.data;
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
       * 检查质检方案编码唯一性
       */
      checkCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await qcSchemeApi.checkCodeUnique(code, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 获取可用物料列表
       */
      getAvailableMaterials: async (): Promise<any[]> => {
        try {
          const response = await qcSchemeApi.getAvailableMaterials();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用物料失败:', error);
          return [];
        }
      },

      /**
       * 获取可用工序列表
       */
      getAvailableOperations: async (): Promise<any[]> => {
        try {
          const response = await qcSchemeApi.getAvailableOperations();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用工序失败:', error);
          return [];
        }
      },

      /**
       * 获取可用质检项目列表
       */
      getAvailableQcItems: async (): Promise<any[]> => {
        try {
          const response = await qcSchemeApi.getAvailableQcItems();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用质检项目失败:', error);
          return [];
        }
      },

      /**
       * 加载分类树
       */
      loadCategoryTree: async () => {
        try {
          const response = await qcSchemeApi.getCategoryTree();

          if (response.code === 200) {
            set({ categoryTree: response.data });
          }
        } catch (error: any) {
          console.error('加载分类树失败:', error);
        }
      },

      /**
       * 根据物料获取质检方案
       */
      getQcSchemesByMaterial: async (materialId: string): Promise<QcScheme[]> => {
        try {
          const response = await qcSchemeApi.getQcSchemesByMaterial(materialId);
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取质检方案失败:', error);
          return [];
        }
      },

      /**
       * 根据工序获取质检方案
       */
      getQcSchemesByOperation: async (operationId: string): Promise<QcScheme[]> => {
        try {
          const response = await qcSchemeApi.getQcSchemesByOperation(operationId);
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取质检方案失败:', error);
          return [];
        }
      },

      /**
       * 复制质检方案
       */
      copyQcScheme: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.copyQcScheme(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
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
       * 加载版本历史
       */
      loadVersionHistory: async (qcSchemeId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.getVersionHistory(qcSchemeId);

          if (response.code === 200) {
            set({
              versionHistory: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载版本历史失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载版本历史失败',
          });
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentQcScheme: null });
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
       * 显示版本历史弹窗
       */
      setShowVersionHistoryModal: (show: boolean) => {
        set({ showVersionHistoryModal: show });
      },

      /**
       * 显示复制弹窗
       */
      setShowCopyModal: (show: boolean) => {
        set({ showCopyModal: show });
      },

      /**
       * 设置当前质检方案
       */
      setCurrentQcScheme: (qcScheme: QcScheme | null) => {
        set({ currentQcScheme: qcScheme });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await qcSchemeApi.getStatistics();

          if (response.code === 200) {
            set({ statistics: response.data });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入质检方案
       */
      importQcSchemes: async (
        file: File,
        validate?: boolean,
        updateMode?: 'create' | 'update' | 'skip'
      ) => {
        set({ loading: true, error: null });

        try {
          const response = await qcSchemeApi.importQcSchemes({
            file,
            validate,
            updateMode,
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcSchemes();
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
       * 导出质检方案
       */
      exportQcSchemes: async (query?: QcSchemeQuery, fileName?: string) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          await qcSchemeApi.exportQcSchemes(query || currentQuery, fileName);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 搜索质检方案
       */
      searchQcSchemes: async (keyword: string): Promise<QcScheme[]> => {
        try {
          const response = await qcSchemeApi.searchQcSchemes(keyword);
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('搜索质检方案失败:', error);
          return [];
        }
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          qcSchemes: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedQcSchemes: [],
          currentQcScheme: null,
          statistics: null,
          categoryTree: [],
          versionHistory: [],
          showCreateModal: false,
          showEditModal: false,
          showDetailDrawer: false,
          showVersionHistoryModal: false,
          showCopyModal: false,
        });
      },
    }),
    {
      name: 'qc-scheme-store',
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

export default useQcSchemeStore;
