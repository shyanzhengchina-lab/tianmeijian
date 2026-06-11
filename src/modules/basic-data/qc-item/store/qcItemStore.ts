/**
 * 质检项目模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QcItemQuery, QcItemStatistics } from '../types';
import type { QcItem, QcItemStatusAction } from '../api/qcItemApi';
import { qcItemApi } from '../api/qcItemApi';

/**
 * 质检项目Store状态接口
 */
export interface QcItemState {
  // 数据状态
  qcItems: QcItem[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: QcItemQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedQcItems: QcItem[];

  // 详情状态
  currentQcItem: QcItem | null;

  // 统计数据
  statistics: QcItemStatistics | null;

  // 分类数据
  categoryTree: Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>;

  // 版本历史
  versionHistory: QcItem[];

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  showVersionHistoryModal: boolean;

  // Actions
  setQcItems: (qcItems: QcItem[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<QcItemQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadQcItems: () => Promise<void>;
  refreshQcItems: () => Promise<void>;
  createQcItem: (data: any) => Promise<void>;
  updateQcItem: (data: any) => Promise<void>;
  deleteQcItem: (id: string) => Promise<void>;
  batchDeleteQcItems: (ids: string[]) => Promise<void>;
  batchEnableQcItems: (ids: string[]) => Promise<void>;
  batchDisableQcItems: (ids: string[]) => Promise<void>;
  updateQcItemStatus: (action: QcItemStatusAction) => Promise<void>;
  loadQcItemById: (id: string) => Promise<QcItem | null>;
  checkCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  getAvailableUnits: () => Promise<any[]>;
  loadCategoryTree: () => Promise<void>;
  getQcItemsByType: (type: string) => Promise<QcItem[]>;
  getQcItemsByCriticalLevel: (criticalLevel: string) => Promise<QcItem[]>;
  copyQcItem: (id: string) => Promise<void>;
  loadVersionHistory: (qcItemId: string) => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowVersionHistoryModal: (show: boolean) => void;
  setCurrentQcItem: (qcItem: QcItem | null) => void;
  loadStatistics: () => Promise<void>;
  importQcItems: (file: File, validate?: boolean, updateMode?: 'create' | 'update' | 'skip') => Promise<void>;
  exportQcItems: (query?: QcItemQuery, fileName?: string) => Promise<void>;
  searchQcItems: (keyword: string) => Promise<QcItem[]>;
  reset: () => void;
}

/**
 * 质检项目Store
 */
export const useQcItemStore = create<QcItemState>()(
  persist(
    (set, get) => ({
      // 初始状态
      qcItems: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedQcItems: [],
      currentQcItem: null,
      statistics: null,
      categoryTree: [],
      versionHistory: [],
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      showVersionHistoryModal: false,

      /**
       * 设置质检项目列表数据
       */
      setQcItems: (qcItems: QcItem[], total: number) => {
        set({ qcItems, total, error: null });
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
      setQuery: (query: Partial<QcItemQuery>) => {
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
        const { qcItems } = get();
        const selectedQcItems = qcItems.filter(q => ids.includes(q.id));
        set({ selectedIds: ids, selectedQcItems });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedQcItems: [] });
      },

      /**
       * 加载质检项目列表
       */
      loadQcItems: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.getQcItems(query);

          if (response.code === 200) {
            set({
              qcItems: response.data.list,
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
       * 刷新质检项目列表
       */
      refreshQcItems: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.getQcItems(query);

          if (response.code === 200) {
            set({
              qcItems: response.data.list,
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
       * 创建质检项目
       */
      createQcItem: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.createQcItem(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
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
       * 更新质检项目
       */
      updateQcItem: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.updateQcItem(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
            set({ showEditModal: false, currentQcItem: null });
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
       * 删除质检项目
       */
      deleteQcItem: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.deleteQcItem(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
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
       * 批量删除质检项目
       */
      batchDeleteQcItems: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.deleteQcItems(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
            // 清除选择
            set({ selectedIds: [], selectedQcItems: [] });
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
       * 批量启用质检项目
       */
      batchEnableQcItems: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.batchEnable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
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
       * 批量禁用质检项目
       */
      batchDisableQcItems: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.batchDisable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
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
       * 更新质检项目状态
       */
      updateQcItemStatus: async (action: QcItemStatusAction) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.updateStatus(action);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
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
       * 根据ID加载质检项目
       */
      loadQcItemById: async (id: string): Promise<QcItem | null> => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.getQcItemById(id);

          if (response.code === 200) {
            set({
              currentQcItem: response.data,
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
       * 检查质检项目编码唯一性
       */
      checkCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await qcItemApi.checkCodeUnique(code, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 获取可用单位列表
       */
      getAvailableUnits: async (): Promise<any[]> => {
        try {
          const response = await qcItemApi.getAvailableUnits();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用单位失败:', error);
          return [];
        }
      },

      /**
       * 加载分类树
       */
      loadCategoryTree: async () => {
        try {
          const response = await qcItemApi.getCategoryTree();

          if (response.code === 200) {
            set({ categoryTree: response.data });
          }
        } catch (error: any) {
          console.error('加载分类树失败:', error);
        }
      },

      /**
       * 根据检验类型筛选质检项目
       */
      getQcItemsByType: async (type: string): Promise<QcItem[]> => {
        try {
          const response = await qcItemApi.getQcItemsByType(type);
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取质检项目失败:', error);
          return [];
        }
      },

      /**
       * 根据关键等级筛选质检项目
       */
      getQcItemsByCriticalLevel: async (criticalLevel: string): Promise<QcItem[]> => {
        try {
          const response = await qcItemApi.getQcItemsByCriticalLevel(criticalLevel);
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取质检项目失败:', error);
          return [];
        }
      },

      /**
       * 复制质检项目
       */
      copyQcItem: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.copyQcItem(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
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
      loadVersionHistory: async (qcItemId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.getVersionHistory(qcItemId);

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
        set({ showCreateModal: show, currentQcItem: null });
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
       * 设置当前质检项目
       */
      setCurrentQcItem: (qcItem: QcItem | null) => {
        set({ currentQcItem: qcItem });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await qcItemApi.getStatistics();

          if (response.code === 200) {
            set({ statistics: response.data });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入质检项目
       */
      importQcItems: async (
        file: File,
        validate?: boolean,
        updateMode?: 'create' | 'update' | 'skip'
      ) => {
        set({ loading: true, error: null });

        try {
          const response = await qcItemApi.importQcItems({
            file,
            validate,
            updateMode,
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadQcItems();
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
       * 导出质检项目
       */
      exportQcItems: async (query?: QcItemQuery, fileName?: string) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          await qcItemApi.exportQcItems(query || currentQuery, fileName);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 搜索质检项目
       */
      searchQcItems: async (keyword: string): Promise<QcItem[]> => {
        try {
          const response = await qcItemApi.searchQcItems(keyword);
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('搜索质检项目失败:', error);
          return [];
        }
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          qcItems: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedQcItems: [],
          currentQcItem: null,
          statistics: null,
          categoryTree: [],
          versionHistory: [],
          showCreateModal: false,
          showEditModal: false,
          showDetailDrawer: false,
          showVersionHistoryModal: false,
        });
      },
    }),
    {
      name: 'qc-item-store',
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

export default useQcItemStore;
