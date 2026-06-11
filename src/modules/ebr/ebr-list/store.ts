/**
 * EBR列表模块Zustand Store
 * 管理EBR的本地状态和API调用
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ebrApi } from './api';
import { DEFAULT_EBRS } from './types';
import type {
  Ebr,
  EbrQuery,
  CreateEbrDTO,
  UpdateEbrDTO,
  EbrBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface EbrStore {
  ebrs: Ebr[];
  selectedIds: string[];
  currentEbr: Ebr | null;
  filters: EbrQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: any;

  loadEbrs: (query?: EbrQuery) => Promise<void>;
  loadAllEbrs: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  createEbr: (data: CreateEbrDTO) => Promise<void>;
  updateEbr: (data: UpdateEbrDTO) => Promise<void>;
  batchEbrs: (action: EbrBatchAction) => Promise<void>;
  startEbr: (id: string) => Promise<void>;
  completeEbr: (id: string, actualQty: number, qualifiedQty: number) => Promise<void>;
  closeEbr: (id: string, approver: string) => Promise<void>;
  cancelEbr: (id: string, reason?: string) => Promise<void>;
  approveEbr: (id: string, approver: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  exportEbr: (id: string) => Promise<Blob>;
  generateReport: (id: string) => Promise<Blob>;

  setFilters: (filters: Partial<EbrQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentEbr: (ebr: Ebr | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  deleteEbrs: (ids: string[]) => Promise<void>;
  exportEbrs: (query?: any) => Promise<Blob>;
}

export const useEbrStore = create<EbrStore>()(immer(
  (set, get) => ({
    ebrs: DEFAULT_EBRS,
    selectedIds: [],
    currentEbr: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_EBRS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    loadEbrs: async (query?: EbrQuery) => {
      set({ loading: true, error: null });
      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: EbrQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };
        const result = await ebrApi.getEbrs(finalQuery);
        set({
          ebrs: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载EBR列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllEbrs: async () => {
      try {
        const ebrs = await ebrApi.getAllEbrs();
        set({ ebrs });
      } catch (error: any) {
        console.error('加载所有EBR失败:', error);
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await ebrApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载EBR统计失败:', error);
      }
    },

    createEbr: async (data: CreateEbrDTO) => {
      set({ loading: true, error: null });
      try {
        const newEbr = await ebrApi.createEbr(data);
        set(state => {
          state.ebrs.unshift(newEbr);
          state.pagination.total += 1;
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建EBR失败',
          loading: false,
        });
        throw error;
      }
    },

    updateEbr: async (data: UpdateEbrDTO) => {
      set({ loading: true, error: null });
      try {
        const updatedEbr = await ebrApi.updateEbr(data);
        set(state => {
          const index = state.ebrs.findIndex(ebr => ebr.id === data.id);
          if (index !== -1) {
            state.ebrs[index] = updatedEbr;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新EBR失败',
          loading: false,
        });
        throw error;
      }
    },

    batchEbrs: async (action: EbrBatchAction) => {
      set({ loading: true, error: null });
      try {
        await ebrApi.batchEbrs(action);
        await get().loadEbrs();
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    startEbr: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await ebrApi.startEbr(id);
        set(state => {
          const ebr = state.ebrs.find(e => e.id === id);
          if (ebr) {
            ebr.status = 'IN_PROGRESS';
            ebr.actualStartDate = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '开始EBR失败',
          loading: false,
        });
        throw error;
      }
    },

    completeEbr: async (id: string, actualQty: number, qualifiedQty: number) => {
      set({ loading: true, error: null });
      try {
        await ebrApi.completeEbr(id, actualQty, qualifiedQty);
        set(state => {
          const ebr = state.ebrs.find(e => e.id === id);
          if (ebr) {
            ebr.status = 'COMPLETED';
            ebr.actualQty = actualQty;
            ebr.qualifiedQty = qualifiedQty;
            ebr.actualEndDate = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '完成EBR失败',
          loading: false,
        });
        throw error;
      }
    },

    closeEbr: async (id: string, approver: string) => {
      set({ loading: true, error: null });
      try {
        await ebrApi.closeEbr(id, approver);
        set(state => {
          const ebr = state.ebrs.find(e => e.id === id);
          if (ebr) {
            ebr.status = 'CLOSED';
            ebr.approvedBy = approver;
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '关闭EBR失败',
          loading: false,
        });
        throw error;
      }
    },

    cancelEbr: async (id: string, reason?: string) => {
      set({ loading: true, error: null });
      try {
        await ebrApi.cancelEbr(id, reason);
        set(state => {
          const ebr = state.ebrs.find(e => e.id === id);
          if (ebr) {
            ebr.status = 'CANCELLED';
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '取消EBR失败',
          loading: false,
        });
        throw error;
      }
    },

    approveEbr: async (id: string, approver: string) => {
      set({ loading: true, error: null });
      try {
        await ebrApi.approveEbr(id, approver);
        set(state => {
          const ebr = state.ebrs.find(e => e.id === id);
          if (ebr) {
            ebr.approvedBy = approver;
            ebr.approvalTime = new Date().toISOString();
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '批准EBR失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });
      try {
        await ebrApi.updateStatus(ids, status);
        set(state => {
          state.ebrs.forEach(ebr => {
            if (ids.includes(ebr.id)) {
              ebr.status = status as any;
            }
          });
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '更新状态失败',
          loading: false,
        });
        throw error;
      }
    },

    exportEbr: async (id: string): Promise<Blob> => {
      try {
        return await ebrApi.exportEbr(id);
      } catch (error: any) {
        console.error('导出EBR失败:', error);
        throw error;
      }
    },

    generateReport: async (id: string): Promise<Blob> => {
      try {
        return await ebrApi.generateReport(id);
      } catch (error: any) {
        console.error('生成EBR报告失败:', error);
        throw error;
      }
    },

    setFilters: (filters: Partial<EbrQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1;
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentEbr: (ebr: Ebr | null) => {
      set({ currentEbr: ebr });
    },

    setPagination: (pagination: Partial<PaginationState>) => {
      set(state => {
        state.pagination = { ...state.pagination, ...pagination };
      });
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    reset: () => {
      set({
        ebrs: DEFAULT_EBRS,
        selectedIds: [],
        currentEbr: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_EBRS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    deleteEbrs: async (ids: string[]) => { await get().batchEbrs({ action: 'DELETE', ids } as any); },
    exportEbrs: async (query?: any) => { return new Blob(); },
  })
));
