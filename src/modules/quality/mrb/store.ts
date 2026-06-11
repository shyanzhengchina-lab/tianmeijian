/**
 * MRB评审模块Zustand Store
 * 管理MRB评审的本地状态和API调用
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { mrbApi } from './api';
import { DEFAULT_MRB_REVIEWS } from './types';
import type {
  MrbReview,
  MrbReviewQuery,
  CreateMrbReviewDTO,
  UpdateMrbReviewDTO,
  MrbReviewBatchAction,
  MrbReviewRecord,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface MrbStore {
  mrbReviews: MrbReview[];
  reviewRecords: MrbReviewRecord[];
  selectedIds: string[];
  currentMrbReview: MrbReview | null;
  filters: MrbReviewQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: any;

  loadMrbReviews: (query?: MrbReviewQuery) => Promise<void>;
  loadAllMrbReviews: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  createMrbReview: (data: CreateMrbReviewDTO) => Promise<void>;
  updateMrbReview: (data: UpdateMrbReviewDTO) => Promise<void>;
  batchMrbReviews: (action: MrbReviewBatchAction) => Promise<void>;
  startReview: (id: string, reviewer: string) => Promise<void>;
  approveReview: (id: string, dispositionResult: string, dispositionRemark: string, approver: string) => Promise<void>;
  rejectReview: (id: string, reason: string, approver: string) => Promise<void>;
  closeReview: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  getReviewRecords: (mrbId: string) => Promise<MrbReviewRecord[]>;
  addReviewRecord: (mrbId: string, record: Omit<MrbReviewRecord, 'id' | 'mrbId'>) => Promise<void>;

  setFilters: (filters: Partial<MrbReviewQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentMrbReview: (mrbReview: MrbReview | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  deleteMrbReviews: (ids: string[]) => Promise<void>;
  startMrbReview: (id: string) => Promise<void>;
  approveMrbReview: (id: string, approver?: string) => Promise<void>;
  rejectMrbReview: (id: string, reason?: string) => Promise<void>;
  closeMrbReview: (id: string) => Promise<void>;
  exportMrbReviews: (query?: any) => Promise<Blob>;
}

export const useMrbStore = create<MrbStore>()(immer(
  (set, get) => ({
    mrbReviews: DEFAULT_MRB_REVIEWS,
    reviewRecords: [],
    selectedIds: [],
    currentMrbReview: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_MRB_REVIEWS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    loadMrbReviews: async (query?: MrbReviewQuery) => {
      set({ loading: true, error: null });
      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: MrbReviewQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };
        const result = await mrbApi.getMrbReviews(finalQuery);
        set({
          mrbReviews: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载MRB评审单列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllMrbReviews: async () => {
      try {
        const mrbReviews = await mrbApi.getAllMrbReviews();
        set({ mrbReviews });
      } catch (error: any) {
        console.error('加载所有MRB评审单失败:', error);
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await mrbApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载MRB评审统计失败:', error);
      }
    },

    createMrbReview: async (data: CreateMrbReviewDTO) => {
      set({ loading: true, error: null });
      try {
        const newMrbReview = await mrbApi.createMrbReview(data);
        set(state => {
          state.mrbReviews.unshift(newMrbReview);
          state.pagination.total += 1;
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建MRB评审单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateMrbReview: async (data: UpdateMrbReviewDTO) => {
      set({ loading: true, error: null });
      try {
        const updatedMrbReview = await mrbApi.updateMrbReview(data);
        set(state => {
          const index = state.mrbReviews.findIndex(mrb => mrb.id === data.id);
          if (index !== -1) {
            state.mrbReviews[index] = updatedMrbReview;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新MRB评审单失败',
          loading: false,
        });
        throw error;
      }
    },

    batchMrbReviews: async (action: MrbReviewBatchAction) => {
      set({ loading: true, error: null });
      try {
        await mrbApi.batchMrbReviews(action);
        await get().loadMrbReviews();
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    startReview: async (id: string, reviewer: string) => {
      set({ loading: true, error: null });
      try {
        await mrbApi.startReview(id, reviewer);
        set(state => {
          const mrbReview = state.mrbReviews.find(mrb => mrb.id === id);
          if (mrbReview) {
            mrbReview.status = 'IN_REVIEW';
            mrbReview.reviewer = reviewer;
            mrbReview.reviewTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '开始评审失败',
          loading: false,
        });
        throw error;
      }
    },

    approveReview: async (id: string, dispositionResult: string, dispositionRemark: string, approver: string) => {
      set({ loading: true, error: null });
      try {
        await mrbApi.approveReview(id, dispositionResult, dispositionRemark, approver);
        set(state => {
          const mrbReview = state.mrbReviews.find(mrb => mrb.id === id);
          if (mrbReview) {
            mrbReview.status = 'APPROVED';
            mrbReview.dispositionResult = dispositionResult as any;
            mrbReview.dispositionRemark = dispositionRemark;
            mrbReview.approver = approver;
            mrbReview.completeTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批准评审失败',
          loading: false,
        });
        throw error;
      }
    },

    rejectReview: async (id: string, reason: string, approver: string) => {
      set({ loading: true, error: null });
      try {
        await mrbApi.rejectReview(id, reason, approver);
        set(state => {
          const mrbReview = state.mrbReviews.find(mrb => mrb.id === id);
          if (mrbReview) {
            mrbReview.status = 'REJECTED';
            mrbReview.dispositionRemark = reason;
            mrbReview.approver = approver;
            mrbReview.completeTime = new Date().toISOString();
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '拒绝评审失败',
          loading: false,
        });
        throw error;
      }
    },

    closeReview: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await mrbApi.closeReview(id);
        set(state => {
          const mrbReview = state.mrbReviews.find(mrb => mrb.id === id);
          if (mrbReview) {
            mrbReview.status = 'CLOSED';
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '关闭评审失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });
      try {
        await mrbApi.updateStatus(ids, status);
        set(state => {
          state.mrbReviews.forEach(mrbReview => {
            if (ids.includes(mrbReview.id)) {
              mrbReview.status = status as any;
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

    getReviewRecords: async (mrbId: string): Promise<MrbReviewRecord[]> => {
      try {
        const reviewRecords = await mrbApi.getReviewRecords(mrbId);
        set({ reviewRecords });
        return reviewRecords;
      } catch (error: any) {
        console.error('获取评审记录失败:', error);
        return [];
      }
    },

    addReviewRecord: async (mrbId: string, record: Omit<MrbReviewRecord, 'id' | 'mrbId'>) => {
      set({ loading: true, error: null });
      try {
        await mrbApi.addReviewRecord(mrbId, record);
        await get().getReviewRecords(mrbId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加评审记录失败',
          loading: false,
        });
        throw error;
      }
    },

    setFilters: (filters: Partial<MrbReviewQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1;
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentMrbReview: (mrbReview: MrbReview | null) => {
      set({ currentMrbReview: mrbReview });
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
        mrbReviews: DEFAULT_MRB_REVIEWS,
        reviewRecords: [],
        selectedIds: [],
        currentMrbReview: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_MRB_REVIEWS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    deleteMrbReviews: async (ids: string[]) => { await get().batchMrbReviews({ action: 'DELETE', ids } as any); },
    startMrbReview: async (id: string) => { await get().batchMrbReviews({ action: 'START', ids: [id] } as any); },
    approveMrbReview: async (id: string, _approver?: string) => { await get().batchMrbReviews({ action: 'APPROVE', ids: [id] } as any); },
    rejectMrbReview: async (id: string, _reason?: string) => { await get().batchMrbReviews({ action: 'REJECT', ids: [id] } as any); },
    closeMrbReview: async (id: string) => { await get().batchMrbReviews({ action: 'CLOSE', ids: [id] } as any); },
    exportMrbReviews: async (_query?: any) => { return new Blob(); },
  })
));
