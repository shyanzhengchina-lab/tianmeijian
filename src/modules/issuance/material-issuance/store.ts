/**
 * 领料管理模块Zustand Store
 * 管理领料管理的本地状态和API调用
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { materialIssuanceApi } from './api';
import { DEFAULT_ISSUANCES } from './types';
import type {
  MaterialIssuance,
  IssuanceQuery,
  CreateIssuanceDTO,
  UpdateIssuanceDTO,
  IssuanceBatchAction,
  IssuanceItem,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface MaterialIssuanceStore {
  issuances: MaterialIssuance[];
  issuanceItems: IssuanceItem[];
  selectedIds: string[];
  currentIssuance: MaterialIssuance | null;
  filters: IssuanceQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: any;

  loadIssuances: (query?: IssuanceQuery) => Promise<void>;
  loadAllIssuances: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  createIssuance: (data: CreateIssuanceDTO) => Promise<void>;
  updateIssuance: (data: UpdateIssuanceDTO | string, extra?: any) => Promise<void>;
  batchIssuances: (action: IssuanceBatchAction) => Promise<void>;
  submitIssuance: (id: string) => Promise<void>;
  approveIssuance: (id: string, approver?: string) => Promise<void>;
  rejectIssuance: (id: string, reason?: string, approver?: string) => Promise<void>;
  issueMaterial: (id: string, issuedBy: string, items: { itemId: string; qty: number; batchNo?: string }[]) => Promise<void>;
  cancelIssuance: (id: string, reason?: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  getIssuanceItems: (issuanceId: string) => Promise<IssuanceItem[]>;
  generateFromWO: (workOrderId: string) => Promise<MaterialIssuance>;

  setFilters: (filters: Partial<IssuanceQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentIssuance: (issuance: MaterialIssuance | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  deleteIssuances: (ids: string[]) => Promise<void>;
  issuePartialIssuance: (id: string, items?: any) => Promise<void>;
  exportIssuances: (query?: any) => Promise<Blob>;
}

export const useMaterialIssuanceStore = create<MaterialIssuanceStore>()(immer(
  (set, get) => ({
    issuances: DEFAULT_ISSUANCES,
    issuanceItems: [],
    selectedIds: [],
    currentIssuance: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_ISSUANCES.length,
    },
    loading: false,
    error: null,
    statistics: null,

    loadIssuances: async (query?: IssuanceQuery) => {
      set({ loading: true, error: null });
      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: IssuanceQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };
        const result = await materialIssuanceApi.getIssuances(finalQuery);
        set({
          issuances: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载领料单列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllIssuances: async () => {
      try {
        const issuances = await materialIssuanceApi.getAllIssuances();
        set({ issuances });
      } catch (error: any) {
        console.error('加载所有领料单失败:', error);
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await materialIssuanceApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载领料单统计失败:', error);
      }
    },

    createIssuance: async (data: CreateIssuanceDTO) => {
      set({ loading: true, error: null });
      try {
        const newIssuance = await materialIssuanceApi.createIssuance(data);
        set(state => {
          state.issuances.unshift(newIssuance);
          state.pagination.total += 1;
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建领料单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateIssuance: async (data: UpdateIssuanceDTO | string, extra?: any) => {
      if (typeof data === 'string') {
        data = { id: data, ...extra } as UpdateIssuanceDTO;
      }
      set({ loading: true, error: null });
      try {
        const updatedIssuance = await materialIssuanceApi.updateIssuance(data as UpdateIssuanceDTO);
        set(state => {
          const index = state.issuances.findIndex(issuance => issuance.id === (data as UpdateIssuanceDTO).id);
          if (index !== -1) {
            state.issuances[index] = updatedIssuance;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新领料单失败',
          loading: false,
        });
        throw error;
      }
    },

    batchIssuances: async (action: IssuanceBatchAction) => {
      set({ loading: true, error: null });
      try {
        await materialIssuanceApi.batchIssuances(action);
        await get().loadIssuances();
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    submitIssuance: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await materialIssuanceApi.submitIssuance(id);
        set(state => {
          const issuance = state.issuances.find(issuance => issuance.id === id);
          if (issuance) {
            issuance.status = 'SUBMITTED';
            issuance.submitTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '提交领料单失败',
          loading: false,
        });
        throw error;
      }
    },

    approveIssuance: async (id: string, approver: string = '') => {
      set({ loading: true, error: null });
      try {
        await materialIssuanceApi.approveIssuance(id, approver);
        set(state => {
          const issuance = state.issuances.find(issuance => issuance.id === id);
          if (issuance) {
            issuance.status = 'APPROVED';
            issuance.approvedBy = approver;
            issuance.approveTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批准领料单失败',
          loading: false,
        });
        throw error;
      }
    },

    rejectIssuance: async (id: string, reason: string = '', approver: string = '') => {
      set({ loading: true, error: null });
      try {
        await materialIssuanceApi.rejectIssuance(id, reason, approver);
        set(state => {
          const issuance = state.issuances.find(issuance => issuance.id === id);
          if (issuance) {
            issuance.status = 'CANCELLED';
            issuance.approvedBy = approver;
            issuance.approveTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '拒绝领料单失败',
          loading: false,
        });
        throw error;
      }
    },

    issueMaterial: async (id: string, issuedBy: string, items: { itemId: string; qty: number; batchNo?: string }[]) => {
      set({ loading: true, error: null });
      try {
        await materialIssuanceApi.issueMaterial(id, issuedBy, items);
        set(state => {
          const issuance = state.issuances.find(issuance => issuance.id === id);
          if (issuance) {
            issuance.issuedBy = issuedBy;
            issuance.completeTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '发料失败',
          loading: false,
        });
        throw error;
      }
    },

    cancelIssuance: async (id: string, reason?: string) => {
      set({ loading: true, error: null });
      try {
        await materialIssuanceApi.cancelIssuance(id, reason);
        set(state => {
          const issuance = state.issuances.find(issuance => issuance.id === id);
          if (issuance) {
            issuance.status = 'CANCELLED';
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '取消领料单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });
      try {
        await materialIssuanceApi.updateStatus(ids, status);
        set(state => {
          state.issuances.forEach(issuance => {
            if (ids.includes(issuance.id)) {
              issuance.status = status as any;
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

    getIssuanceItems: async (issuanceId: string): Promise<IssuanceItem[]> => {
      try {
        const issuanceItems = await materialIssuanceApi.getIssuanceItems(issuanceId);
        set({ issuanceItems });
        return issuanceItems;
      } catch (error: any) {
        console.error('获取领料明细失败:', error);
        return [];
      }
    },

    generateFromWO: async (workOrderId: string): Promise<MaterialIssuance> => {
      set({ loading: true, error: null });
      try {
        const issuance = await materialIssuanceApi.generateFromWO(workOrderId);
        set({ loading: false });
        await get().loadIssuances();
        return issuance;
      } catch (error: any) {
        set({
          error: error?.message || '生成领料单失败',
          loading: false,
        });
        throw error;
      }
    },

    setFilters: (filters: Partial<IssuanceQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1;
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentIssuance: (issuance: MaterialIssuance | null) => {
      set({ currentIssuance: issuance });
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
        issuances: DEFAULT_ISSUANCES,
        issuanceItems: [],
        selectedIds: [],
        currentIssuance: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_ISSUANCES.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    deleteIssuances: async (ids: string[]) => { await get().batchIssuances({ action: 'DELETE', ids } as any); },
    issuePartialIssuance: async (_id: string, _items?: any) => {},
    exportIssuances: async (_query?: any) => { return new Blob(); },
  })
));
