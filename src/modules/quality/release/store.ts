/**
 * 质量放行模块Zustand Store
 * 管理质量放行的本地状态和API调用
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { qualityReleaseApi } from './api';
import { DEFAULT_QUALITY_RELEASES } from './types';
import type {
  QualityRelease,
  QualityReleaseQuery,
  CreateQualityReleaseDTO,
  UpdateQualityReleaseDTO,
  QualityReleaseBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface QualityReleaseStore {
  qualityReleases: QualityRelease[];
  selectedIds: string[];
  currentQualityRelease: QualityRelease | null;
  filters: QualityReleaseQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: any;

  loadQualityReleases: (query?: QualityReleaseQuery) => Promise<void>;
  loadAllQualityReleases: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  createQualityRelease: (data: CreateQualityReleaseDTO) => Promise<void>;
  updateQualityRelease: (data: UpdateQualityReleaseDTO) => Promise<void>;
  batchQualityReleases: (action: QualityReleaseBatchAction) => Promise<void>;
  approveRelease: (id: string, approver: string) => Promise<void>;
  rejectRelease: (id: string, reason: string, approver: string) => Promise<void>;
  cancelRelease: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  generateFromInspection: (inspectionId: string) => Promise<QualityRelease>;
  generateCertificate: (id: string) => Promise<Blob>;

  setFilters: (filters: Partial<QualityReleaseQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentQualityRelease: (qualityRelease: QualityRelease | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  deleteQualityReleases: (ids: string[]) => Promise<void>;
  approveQualityRelease: (id: string, approver?: string) => Promise<void>;
  rejectQualityRelease: (id: string, reason?: string, approver?: string) => Promise<void>;
  cancelQualityRelease: (id: string) => Promise<void>;
  exportQualityReleases: (query?: any) => Promise<Blob>;
}

export const useQualityReleaseStore = create<QualityReleaseStore>()(immer(
  (set, get) => ({
    qualityReleases: DEFAULT_QUALITY_RELEASES,
    selectedIds: [],
    currentQualityRelease: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_QUALITY_RELEASES.length,
    },
    loading: false,
    error: null,
    statistics: null,

    loadQualityReleases: async (query?: QualityReleaseQuery) => {
      set({ loading: true, error: null });
      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: QualityReleaseQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };
        const result = await qualityReleaseApi.getQualityReleases(finalQuery);
        set({
          qualityReleases: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载质量放行单列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllQualityReleases: async () => {
      try {
        const qualityReleases = await qualityReleaseApi.getAllQualityReleases();
        set({ qualityReleases });
      } catch (error: any) {
        console.error('加载所有质量放行单失败:', error);
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await qualityReleaseApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载质量放行统计失败:', error);
      }
    },

    createQualityRelease: async (data: CreateQualityReleaseDTO) => {
      set({ loading: true, error: null });
      try {
        const newQualityRelease = await qualityReleaseApi.createQualityRelease(data);
        set(state => {
          state.qualityReleases.unshift(newQualityRelease);
          state.pagination.total += 1;
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建质量放行单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateQualityRelease: async (data: UpdateQualityReleaseDTO) => {
      set({ loading: true, error: null });
      try {
        const updatedQualityRelease = await qualityReleaseApi.updateQualityRelease(data);
        set(state => {
          const index = state.qualityReleases.findIndex(qr => qr.id === data.id);
          if (index !== -1) {
            state.qualityReleases[index] = updatedQualityRelease;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新质量放行单失败',
          loading: false,
        });
        throw error;
      }
    },

    batchQualityReleases: async (action: QualityReleaseBatchAction) => {
      set({ loading: true, error: null });
      try {
        await qualityReleaseApi.batchQualityReleases(action);
        await get().loadQualityReleases();
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    approveRelease: async (id: string, approver: string) => {
      set({ loading: true, error: null });
      try {
        await qualityReleaseApi.approveRelease(id, approver);
        set(state => {
          const qualityRelease = state.qualityReleases.find(qr => qr.id === id);
          if (qualityRelease) {
            qualityRelease.status = 'APPROVED';
            qualityRelease.approver = approver;
            qualityRelease.approvalTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批准放行失败',
          loading: false,
        });
        throw error;
      }
    },

    rejectRelease: async (id: string, reason: string, approver: string) => {
      set({ loading: true, error: null });
      try {
        await qualityReleaseApi.rejectRelease(id, reason, approver);
        set(state => {
          const qualityRelease = state.qualityReleases.find(qr => qr.id === id);
          if (qualityRelease) {
            qualityRelease.status = 'REJECTED';
            qualityRelease.rejectReason = reason;
            qualityRelease.approver = approver;
            qualityRelease.approvalTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '拒绝放行失败',
          loading: false,
        });
        throw error;
      }
    },

    cancelRelease: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await qualityReleaseApi.cancelRelease(id);
        set(state => {
          const qualityRelease = state.qualityReleases.find(qr => qr.id === id);
          if (qualityRelease) {
            qualityRelease.status = 'CANCELLED';
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '取消放行失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });
      try {
        await qualityReleaseApi.updateStatus(ids, status);
        set(state => {
          state.qualityReleases.forEach(qualityRelease => {
            if (ids.includes(qualityRelease.id)) {
              qualityRelease.status = status as any;
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

    generateFromInspection: async (inspectionId: string): Promise<QualityRelease> => {
      set({ loading: true, error: null });
      try {
        const qualityRelease = await qualityReleaseApi.generateFromInspection(inspectionId);
        set({ loading: false });
        await get().loadQualityReleases();
        return qualityRelease;
      } catch (error: any) {
        set({
          error: error?.message || '生成放行单失败',
          loading: false,
        });
        throw error;
      }
    },

    generateCertificate: async (id: string): Promise<Blob> => {
      try {
        return await qualityReleaseApi.generateCertificate(id);
      } catch (error: any) {
        console.error('生成放行证书失败:', error);
        throw error;
      }
    },

    setFilters: (filters: Partial<QualityReleaseQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1;
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentQualityRelease: (qualityRelease: QualityRelease | null) => {
      set({ currentQualityRelease: qualityRelease });
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
        qualityReleases: DEFAULT_QUALITY_RELEASES,
        selectedIds: [],
        currentQualityRelease: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_QUALITY_RELEASES.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    deleteQualityReleases: async (ids: string[]) => { await get().batchQualityReleases({ action: 'DELETE', ids } as any); },
    approveQualityRelease: async (id: string, approver?: string) => { await get().approveRelease(id, approver || ''); },
    rejectQualityRelease: async (id: string, reason?: string, approver?: string) => { await get().rejectRelease(id, reason || '', approver || ''); },
    cancelQualityRelease: async (id: string) => { await get().cancelRelease(id); },
    exportQualityReleases: async (_query?: any) => { return new Blob(); },
  })
));
