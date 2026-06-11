/**
 * MRB (Material Review Board) 模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import type {
  MRBReview,
  MRBReviewQuery,
  CreateMRBReviewDTO,
  UpdateMRBReviewDTO,
  SubmitReviewResultDTO,
  ReviewerVoteDTO,
  ImplementDispositionDTO,
  CancelReviewDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';
import { mrbApi } from '../api';

/**
 * MRB Store状态接口
 */
export interface MRBState {
  // MRB评审列表状态
  mrbReviews: MRBReview[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: MRBReviewQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedReviewIds: string[];
  selectedReviews: MRBReview[];

  // 详情状态
  currentReview: MRBReview | null;
  showReviewDetail: boolean;

  // 批量操作状态
  batchOperationLoading: boolean;

  // 评审状态
  reviewingReview: MRBReview | null;
  reviewLoading: boolean;

  // UI状态
  activeTab: 'list' | 'detail' | 'review' | 'vote';
  showCreateModal: boolean;
  showEditModal: boolean;
  showReviewModal: boolean;
  showVoteModal: boolean;
  showImplementModal: boolean;

  // Actions
  setMRBReviews: (reviews: MRBReview[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<MRBReviewQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedReviewIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentReview: (review: MRBReview | null) => void;
  setShowReviewDetail: (show: boolean) => void;

  // MRB评审操作
  loadMRBReviews: () => Promise<void>;
  refreshMRBReviews: () => Promise<void>;
  createMRBReview: (data: CreateMRBReviewDTO) => Promise<void>;
  updateMRBReview: (data: UpdateMRBReviewDTO) => Promise<void>;
  deleteMRBReviews: (ids: string[]) => Promise<void>;

  // 评审操作
  startReview: (reviewId: string) => Promise<void>;
  submitReviewResult: (data: SubmitReviewResultDTO) => Promise<void>;
  submitVote: (data: ReviewerVoteDTO) => Promise<void>;
  implementDisposition: (data: ImplementDispositionDTO) => Promise<void>;
  cancelReview: (data: CancelReviewDTO) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'list' | 'detail' | 'review' | 'vote') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowReviewModal: (show: boolean) => void;
  setShowVoteModal: (show: boolean) => void;
  setShowImplementModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * MRB Store
 */
export const useMRBStore = create<MRBState>()(
  persist(
    (set, get) => ({
      // 初始状态
      mrbReviews: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedReviewIds: [],
      selectedReviews: [],
      currentReview: null,
      showReviewDetail: false,
      batchOperationLoading: false,
      reviewingReview: null,
      reviewLoading: false,
      activeTab: 'list',
      showCreateModal: false,
      showEditModal: false,
      showReviewModal: false,
      showVoteModal: false,
      showImplementModal: false,

      /**
       * 设置MRB评审列表数据
       */
      setMRBReviews: (reviews: MRBReview[], total: number) => {
        set({ mrbReviews: reviews, total, error: null });
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
      setQuery: (query: Partial<MRBReviewQuery>) => {
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
       * 设置选中评审单ID列表
       */
      setSelectedReviewIds: (ids: string[]) => {
        const { mrbReviews } = get();
        const selectedReviews = mrbReviews.filter(r => ids.includes(r.id));
        set({ selectedReviewIds: ids, selectedReviews });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedReviewIds: [],
          selectedReviews: [],
        });
      },

      /**
       * 设置当前评审单
       */
      setCurrentReview: (review: MRBReview | null) => {
        set({ currentReview: review });
      },

      /**
       * 显示评审单详情
       */
      setShowReviewDetail: (show: boolean) => {
        set({ showReviewDetail: show });
      },

      /**
       * 加载MRB评审列表
       */
      loadMRBReviews: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await mrbApi.getMrbReviews(query as any);

          if ((response as any).code === 200) {
            set({
              mrbReviews: (response as any).data?.list,
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
       * 刷新MRB评审列表
       */
      refreshMRBReviews: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await mrbApi.getMrbReviews(query as any);

          if ((response as any).code === 200) {
            set({
              mrbReviews: (response as any).data?.list,
              total: (response as any).data?.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '刷新失败',
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
       * 创建MRB评审
       */
      createMRBReview: async (data: CreateMRBReviewDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await mrbApi.createMrbReview(data as any);

          if ((response as any).code === 200) {
            await get().loadMRBReviews();
            set({ showCreateModal: false });
            message.success('MRB评审创建成功！');
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
       * 更新MRB评审
       */
      updateMRBReview: async (data: UpdateMRBReviewDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await mrbApi.updateMrbReview(data);

          if ((response as any).code === 200) {
            await get().loadMRBReviews();
            set({ showEditModal: false });
            message.success('MRB评审更新成功！');
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
       * 删除MRB评审
       */
      deleteMRBReviews: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await mrbApi.batchMrbReviews({
            action: 'delete',
            ids,
          });

          if ((response as any).code === 200) {
            await get().loadMRBReviews();
            get().clearSelection();
            message.success(`成功删除 ${ids.length} 个MRB评审`);
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
       * 开始评审
       */
      startReview: async (reviewId: string) => {
        set({ reviewLoading: true, error: null });

        try {
          const response = await mrbApi.startReview(reviewId, 'current_user');

          if ((response as any).code === 200) {
            await get().loadMRBReviews();
            message.success('评审已开始');
            set({ reviewLoading: false });
          } else {
            set({
              reviewLoading: false,
              error: (response as any).message || '开始评审失败',
            });
          }
        } catch (error: any) {
          set({
            reviewLoading: false,
            error: error.message || '开始评审失败',
          });
        }
      },

      /**
       * 提交评审结果
       */
      submitReviewResult: async (data: SubmitReviewResultDTO) => {
        set({ reviewLoading: true, error: null });

        try {
          const response = await mrbApi.approveReview(
            data.reviewId,
            data.dispositionResult || 'APPROVED',
            data.dispositionRemark || '',
            data.reviewer || 'current_user'
          );

          if ((response as any).code === 200) {
            await get().loadMRBReviews();
            set({ showReviewModal: false });
            message.success('评审结果已提交');
            set({ reviewLoading: false });
          } else {
            set({
              reviewLoading: false,
              error: (response as any).message || '提交失败',
            });
          }
        } catch (error: any) {
          set({
            reviewLoading: false,
            error: error.message || '提交失败',
          });
        }
      },

      /**
       * 提交投票
       */
      submitVote: async (data: ReviewerVoteDTO) => {
        set({ reviewLoading: true, error: null });

        try {
          const response = await mrbApi.addReviewRecord(data.reviewId, {
            reviewerId: data.reviewerId,
            reviewerName: data.reviewerName ?? '',
            vote: data.vote,
            comment: data.comment || '',
            voteDate: new Date().toISOString(),
          } as any);

          if ((response as any).code === 200) {
            await get().loadMRBReviews();
            set({ showVoteModal: false });
            message.success('投票已提交');
            set({ reviewLoading: false });
          } else {
            set({
              reviewLoading: false,
              error: (response as any).message || '提交失败',
            });
          }
        } catch (error: any) {
          set({
            reviewLoading: false,
            error: error.message || '提交失败',
          });
        }
      },

      /**
       * 实施处置措施
       */
      implementDisposition: async (data: ImplementDispositionDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await mrbApi.updateStatus([data.reviewId], 'COMPLETED');

          if ((response as any).code === 200) {
            await get().loadMRBReviews();
            set({ showImplementModal: false });
            message.success('处置措施已实施');
            set({ loading: false });
          } else {
            set({
              loading: false,
              error: (response as any).message || '实施失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '实施失败',
          });
        }
      },

      /**
       * 取消评审
       */
      cancelReview: async (data: CancelReviewDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await mrbApi.closeReview(data.reviewId);

          if ((response as any).code === 200) {
            await get().loadMRBReviews();
            message.success('评审已取消');
            set({ loading: false });
          } else {
            set({
              loading: false,
              error: (response as any).message || '取消失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '取消失败',
          });
        }
      },

      /**
       * 设置活动标签页
       */
      setActiveTab: (tab: 'list' | 'detail' | 'review' | 'vote') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentReview: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示评审弹窗
       */
      setShowReviewModal: (show: boolean) => {
        set({ showReviewModal: show });
      },

      /**
       * 显示投票弹窗
       */
      setShowVoteModal: (show: boolean) => {
        set({ showVoteModal: show });
      },

      /**
       * 显示实施弹窗
       */
      setShowImplementModal: (show: boolean) => {
        set({ showImplementModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          mrbReviews: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedReviewIds: [],
          selectedReviews: [],
          currentReview: null,
          showReviewDetail: false,
          batchOperationLoading: false,
          reviewingReview: null,
          reviewLoading: false,
          activeTab: 'list',
          showCreateModal: false,
          showEditModal: false,
          showReviewModal: false,
          showVoteModal: false,
          showImplementModal: false,
        });
      },
    }),
    {
      name: 'mrb-store',
      // 只持久化核心状态
      partialize: (state) => ({
        mrbReviews: state.mrbReviews,
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useMRBStore;