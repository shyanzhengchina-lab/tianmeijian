/**
 * 质检方案模块Zustand Store
 * 管理质检方案的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { qcSchemeApi } from './api';
import { DEFAULT_QC_SCHEMES } from './types';
import type {
  QcScheme,
  QcSchemeQuery,
  CreateQcSchemeDTO,
  UpdateQcSchemeDTO,
  QcSchemeBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface QcSchemeStore {
  // State
  qcSchemes: QcScheme[];
  selectedIds: string[];
  currentQcScheme: QcScheme | null;
  filters: QcSchemeQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    draftCount: number;
    activeCount: number;
    inactiveCount: number;
    typeStats: Record<string, number>;
  } | null;

  // Actions
  loadQcSchemes: (query?: QcSchemeQuery) => Promise<void>;
  loadAllQcSchemes: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  createQcScheme: (data: CreateQcSchemeDTO) => Promise<void>;
  updateQcScheme: (data: UpdateQcSchemeDTO) => Promise<void>;
  deleteQcSchemes: (ids: string[]) => Promise<void>;
  batchQcSchemes: (action: QcSchemeBatchAction) => Promise<void>;
  activateQcScheme: (id: string) => Promise<void>;
  deactivateQcScheme: (id: string) => Promise<void>;
  approveQcScheme: (id: string, approver: string) => Promise<void>;
  updateStatus: (ids: string[], status: 'DRAFT' | 'ACTIVE' | 'INACTIVE') => Promise<void>;
  copyQcScheme: (id: string, newSchemeCode: string) => Promise<void>;

  // State setters
  setFilters: (filters: Partial<QcSchemeQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentQcScheme: (qcScheme: QcScheme | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 创建Zustand Store
export const useQcSchemeStore = create<QcSchemeStore>()(
  (set, get) => ({
    // 初始状态
    qcSchemes: DEFAULT_QC_SCHEMES,
    selectedIds: [],
    currentQcScheme: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_QC_SCHEMES.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadQcSchemes: async (query?: QcSchemeQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: QcSchemeQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await qcSchemeApi.getQcSchemes(finalQuery);

        set({
          qcSchemes: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载质检方案列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllQcSchemes: async () => {
      try {
        const qcSchemes = await qcSchemeApi.getAllQcSchemes();
        set({ qcSchemes });
      } catch (error: any) {
        console.error('加载所有质检方案失败:', error);
        set({ error: error?.message || '加载质检方案列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await qcSchemeApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载质检方案统计失败:', error);
      }
    },

    createQcScheme: async (data: CreateQcSchemeDTO) => {
      set({ loading: true, error: null });

      try {
        const newQcScheme = await qcSchemeApi.createQcScheme(data);

        set({
          qcSchemes: [newQcScheme, ...get().qcSchemes],
          pagination: { ...get().pagination, total: get().pagination.total + 1 },
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建质检方案失败',
          loading: false,
        });
        throw error;
      }
    },

    updateQcScheme: async (data: UpdateQcSchemeDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedQcScheme = await qcSchemeApi.updateQcScheme(data);

        set({
          qcSchemes: get().qcSchemes.map(scheme => scheme.id === data.id ? updatedQcScheme : scheme),
          loading: false
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新质检方案失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteQcSchemes: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await qcSchemeApi.deleteQcSchemes(ids);

        set({
          qcSchemes: get().qcSchemes.filter(scheme => !ids.includes(scheme.id)),
          pagination: { ...get().pagination, total: get().pagination.total - ids.length },
          selectedIds: [],
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '删除质检方案失败',
          loading: false,
        });
        throw error;
      }
    },

    batchQcSchemes: async (action: QcSchemeBatchAction) => {
      set({ loading: true, error: null });

      try {
        await qcSchemeApi.batchQcSchemes(action);

        // 重新加载列表
        await get().loadQcSchemes();
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

    activateQcScheme: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await qcSchemeApi.activateQcScheme(id);

        set({
          qcSchemes: get().qcSchemes.map(scheme =>
            scheme.id === id ? { ...scheme, status: 'ACTIVE' } : scheme
          ),
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '启用质检方案失败',
          loading: false,
        });
        throw error;
      }
    },

    deactivateQcScheme: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await qcSchemeApi.deactivateQcScheme(id);

        set({
          qcSchemes: get().qcSchemes.map(scheme =>
            scheme.id === id ? { ...scheme, status: 'INACTIVE' } : scheme
          ),
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '停用质检方案失败',
          loading: false,
        });
        throw error;
      }
    },

    approveQcScheme: async (id: string, approver: string) => {
      set({ loading: true, error: null });

      try {
        await qcSchemeApi.approveQcScheme(id, approver);

        set({
          qcSchemes: get().qcSchemes.map(scheme =>
            scheme.id === id ? { ...scheme, status: 'ACTIVE', approvedBy: approver } : scheme
          ),
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批准质检方案失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: 'DRAFT' | 'ACTIVE' | 'INACTIVE') => {
      set({ loading: true, error: null });

      try {
        await qcSchemeApi.updateStatus(ids, status);

        set({
          qcSchemes: get().qcSchemes.map(qcScheme =>
            ids.includes(qcScheme.id) ? { ...qcScheme, status } : qcScheme
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

    copyQcScheme: async (id: string, newSchemeCode: string) => {
      set({ loading: true, error: null });

      try {
        const newQcScheme = await qcSchemeApi.copyQcScheme(id, newSchemeCode);

        set({
          qcSchemes: [newQcScheme, ...get().qcSchemes],
          pagination: { ...get().pagination, total: get().pagination.total + 1 },
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '复制质检方案失败',
          loading: false,
        });
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<QcSchemeQuery>) => {
      set(state => ({
        filters: { ...get().filters, ...filters },
        pagination: { ...get().pagination, current: 1 }
      }));
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentQcScheme: (qcScheme: QcScheme | null) => {
      set({ currentQcScheme: qcScheme });
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
        qcSchemes: DEFAULT_QC_SCHEMES,
        selectedIds: [],
        currentQcScheme: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_QC_SCHEMES.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },
  })
);
