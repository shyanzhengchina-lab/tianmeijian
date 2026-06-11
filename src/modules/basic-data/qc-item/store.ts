/**
 * 质检项目模块Zustand Store
 * 管理质检项目的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { qcItemApi } from './api';
import { DEFAULT_QC_ITEMS } from './types';
import type {
  QcItem,
  QcItemQuery,
  CreateQcItemDTO,
  UpdateQcItemDTO,
  QcItemBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface QcItemStore {
  // State
  qcItems: QcItem[];
  selectedIds: string[];
  currentQcItem: QcItem | null;
  filters: QcItemQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    draftCount: number;
    categoryStats: Record<string, number>;
    standardTypeStats: Record<string, number>;
    criticalCount: number;
  } | null;

  // Actions
  loadQcItems: (query?: QcItemQuery) => Promise<void>;
  loadAllQcItems: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  createQcItem: (data: CreateQcItemDTO) => Promise<void>;
  updateQcItem: (data: UpdateQcItemDTO) => Promise<void>;
  deleteQcItems: (ids: string[]) => Promise<void>;
  batchQcItems: (action: QcItemBatchAction) => Promise<void>;
  activateQcItem: (id: string) => Promise<void>;
  deactivateQcItem: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: 'ACTIVE' | 'INACTIVE' | 'DRAFT') => Promise<void>;
  copyQcItem: (id: string, newItemCode: string) => Promise<void>;

  // State setters
  setFilters: (filters: Partial<QcItemQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentQcItem: (qcItem: QcItem | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 创建Zustand Store
export const useQcItemStore = create<QcItemStore>()(
  (set, get) => ({
    // 初始状态
    qcItems: DEFAULT_QC_ITEMS,
    selectedIds: [],
    currentQcItem: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_QC_ITEMS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadQcItems: async (query?: QcItemQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: QcItemQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await qcItemApi.getQcItems(finalQuery);

        set({
          qcItems: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载质检项目列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllQcItems: async () => {
      try {
        const qcItems = await qcItemApi.getAllQcItems();
        set({ qcItems });
      } catch (error: any) {
        console.error('加载所有质检项目失败:', error);
        set({ error: error?.message || '加载质检项目列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await qcItemApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载质检项目统计失败:', error);
      }
    },

    createQcItem: async (data: CreateQcItemDTO) => {
      set({ loading: true, error: null });

      try {
        const newQcItem = await qcItemApi.createQcItem(data);

        set({
          qcItems: [newQcItem, ...get().qcItems],
          pagination: { ...get().pagination, total: get().pagination.total + 1 },
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    updateQcItem: async (data: UpdateQcItemDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedQcItem = await qcItemApi.updateQcItem(data);

        set({
          qcItems: get().qcItems.map(item => item.id === data.id ? updatedQcItem : item),
          loading: false
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteQcItems: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await qcItemApi.deleteQcItems(ids);

        set({
          qcItems: get().qcItems.filter(item => !ids.includes(item.id)),
          pagination: { ...get().pagination, total: get().pagination.total - ids.length },
          selectedIds: [],
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '删除质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    batchQcItems: async (action: QcItemBatchAction) => {
      set({ loading: true, error: null });

      try {
        await qcItemApi.batchQcItems(action);

        // 重新加载列表
        await get().loadQcItems();
        // 重新加载统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    activateQcItem: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await qcItemApi.activateQcItem(id);

        set({
          qcItems: get().qcItems.map(item =>
            item.id === id ? { ...item, status: 'ACTIVE' } : item
          ),
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '启用质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    deactivateQcItem: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await qcItemApi.deactivateQcItem(id);

        set({
          qcItems: get().qcItems.map(item =>
            item.id === id ? { ...item, status: 'INACTIVE' } : item
          ),
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '停用质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: 'ACTIVE' | 'INACTIVE' | 'DRAFT') => {
      set({ loading: true, error: null });

      try {
        await qcItemApi.updateStatus(ids, status);

        set({
          qcItems: get().qcItems.map(qcItem =>
            ids.includes(qcItem.id) ? { ...qcItem, status } : qcItem
          ),
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '更新状态失败',
          loading: false,
        });
        throw error;
      }
    },

    copyQcItem: async (id: string, newItemCode: string) => {
      set({ loading: true, error: null });

      try {
        const newQcItem = await qcItemApi.copyQcItem(id, newItemCode);

        set({
          qcItems: [newQcItem, ...get().qcItems],
          pagination: { ...get().pagination, total: get().pagination.total + 1 },
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '复制质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<QcItemQuery>) => {
      set(state => ({
        filters: { ...get().filters, ...filters },
        pagination: { ...get().pagination, current: 1 }
      }));
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentQcItem: (qcItem: QcItem | null) => {
      set({ currentQcItem: qcItem });
    },

    setPagination: (pagination: Partial<PaginationState>) => {
      set(state => ({
        pagination: { ...get().pagination, ...pagination }
      }));
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    reset: () => {
      set({
        qcItems: DEFAULT_QC_ITEMS,
        selectedIds: [],
        currentQcItem: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_QC_ITEMS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },
  })
);
