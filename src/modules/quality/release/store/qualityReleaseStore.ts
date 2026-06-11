/**
 * 质量放行模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import type {
  QualityRelease,
  QualityReleaseQuery,
  CreateQualityReleaseDTO,
  UpdateQualityReleaseDTO,
  ApproveQualityReleaseDTO,
  RejectQualityReleaseDTO,
  CancelQualityReleaseDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';
import { qualityReleaseApi } from '../api';

/**
 * QualityRelease Store状态接口
 */
export interface QualityReleaseState {
  // 质量放行列表状态
  qualityReleases: QualityRelease[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: QualityReleaseQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedReleaseIds: string[];
  selectedReleases: QualityRelease[];

  // 详情状态
  currentRelease: QualityRelease | null;
  showReleaseDetail: boolean;

  // 批量操作状态
  batchOperationLoading: boolean;

  // 审批状态
  approvingRelease: QualityRelease | null;
  approveLoading: boolean;

  // UI状态
  activeTab: 'list' | 'detail' | 'approval';
  showCreateModal: boolean;
  showEditModal: boolean;
  showApprovalModal: boolean;
  showRejectModal: boolean;

  // Actions
  setQualityReleases: (releases: QualityRelease[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<QualityReleaseQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedReleaseIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentRelease: (release: QualityRelease | null) => void;
  setShowReleaseDetail: (show: boolean) => void;

  // 质量放行操作
  loadQualityReleases: () => Promise<void>;
  refreshQualityReleases: () => Promise<void>;
  createQualityRelease: (data: CreateQualityReleaseDTO) => Promise<void>;
  updateQualityRelease: (data: UpdateQualityReleaseDTO) => Promise<void>;
  deleteQualityReleases: (ids: string[]) => Promise<void>;

  // 审批操作
  approveQualityRelease: (data: ApproveQualityReleaseDTO) => Promise<void>;
  rejectQualityRelease: (data: RejectQualityReleaseDTO) => Promise<void>;
  cancelQualityRelease: (data: CancelQualityReleaseDTO) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'list' | 'detail' | 'approval') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowApprovalModal: (show: boolean) => void;
  setShowRejectModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * QualityRelease Store
 */
export const useQualityReleaseStore = create<QualityReleaseState>()(
  persist(
    (set, get) => ({
      // 初始状态
      qualityReleases: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedReleaseIds: [],
      selectedReleases: [],
      currentRelease: null,
      showReleaseDetail: false,
      batchOperationLoading: false,
      approvingRelease: null,
      approveLoading: false,
      activeTab: 'list',
      showCreateModal: false,
      showEditModal: false,
      showApprovalModal: false,
      showRejectModal: false,

      /**
       * 设置质量放行列表数据
       */
      setQualityReleases: (releases: QualityRelease[], total: number) => {
        set({ qualityReleases: releases, total, error: null });
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
      setQuery: (query: Partial<QualityReleaseQuery>) => {
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
       * 设置选中放行单ID列表
       */
      setSelectedReleaseIds: (ids: string[]) => {
        const { qualityReleases } = get();
        const selectedReleases = qualityReleases.filter(r => ids.includes(r.id));
        set({ selectedReleaseIds: ids, selectedReleases });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedReleaseIds: [],
          selectedReleases: [],
        });
      },

      /**
       * 设置当前放行单
       */
      setCurrentRelease: (release: QualityRelease | null) => {
        set({ currentRelease: release });
      },

      /**
       * 显示放行单详情
       */
      setShowReleaseDetail: (show: boolean) => {
        set({ showReleaseDetail: show });
      },

      /**
       * 加载质量放行列表
       */
      loadQualityReleases: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await qualityReleaseApi.getQualityReleases(query);

          if ((response as any).code === 200) {
            set({
              qualityReleases: (response as any).data?.list,
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
       * 刷新质量放行列表
       */
      refreshQualityReleases: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await qualityReleaseApi.getQualityReleases(query);

          if ((response as any).code === 200) {
            set({
              qualityReleases: (response as any).data?.list,
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
       * 创建质量放行
       */
      createQualityRelease: async (data: CreateQualityReleaseDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await qualityReleaseApi.createQualityRelease(data);

          if ((response as any).code === 200) {
            await get().loadQualityReleases();
            set({ showCreateModal: false });
            message.success('质量放行创建成功！');
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
       * 更新质量放行
       */
      updateQualityRelease: async (data: UpdateQualityReleaseDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await qualityReleaseApi.updateQualityRelease(data);

          if ((response as any).code === 200) {
            await get().loadQualityReleases();
            set({ showEditModal: false });
            message.success('质量放行更新成功！');
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
       * 删除质量放行
       */
      deleteQualityReleases: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await qualityReleaseApi.batchQualityReleases({
            action: 'delete',
            ids,
          });

          if ((response as any).code === 200) {
            await get().loadQualityReleases();
            get().clearSelection();
            message.success(`成功删除 ${ids.length} 个质量放行`);
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
       * 批准质量放行
       */
      approveQualityRelease: async (data: ApproveQualityReleaseDTO) => {
        set({ approveLoading: true, error: null, approvingRelease: get().currentRelease });

        try {
          const response = await qualityReleaseApi.approveRelease(
            data.releaseId,
            data.approver || 'current_user'
          );

          if ((response as any).code === 200) {
            await get().loadQualityReleases();
            message.success('质量放行已批准！');
            set({ approveLoading: false, showApprovalModal: false });
          } else {
            set({
              approveLoading: false,
              error: (response as any).message || '批准失败',
            });
          }
        } catch (error: any) {
          set({
            approveLoading: false,
            error: error.message || '批准失败',
          });
        }
      },

      /**
       * 拒绝质量放行
       */
      rejectQualityRelease: async (data: RejectQualityReleaseDTO) => {
        set({ approveLoading: true, error: null });

        try {
          const response = await qualityReleaseApi.rejectRelease(
            data.releaseId,
            data.rejectReason || '',
            data.approver || 'current_user'
          );

          if ((response as any).code === 200) {
            await get().loadQualityReleases();
            message.success('质量放行已拒绝');
            set({ approveLoading: false, showRejectModal: false });
          } else {
            set({
              approveLoading: false,
              error: (response as any).message || '拒绝失败',
            });
          }
        } catch (error: any) {
          set({
            approveLoading: false,
            error: error.message || '拒绝失败',
          });
        }
      },

      /**
       * 取消质量放行
       */
      cancelQualityRelease: async (data: CancelQualityReleaseDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await qualityReleaseApi.cancelRelease(data.releaseId);

          if ((response as any).code === 200) {
            await get().loadQualityReleases();
            message.success('质量放行已取消');
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
      setActiveTab: (tab: 'list' | 'detail' | 'approval') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentRelease: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示审批弹窗
       */
      setShowApprovalModal: (show: boolean) => {
        set({ showApprovalModal: show });
      },

      /**
       * 显示拒绝弹窗
       */
      setShowRejectModal: (show: boolean) => {
        set({ showRejectModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          qualityReleases: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedReleaseIds: [],
          selectedReleases: [],
          currentRelease: null,
          showReleaseDetail: false,
          batchOperationLoading: false,
          approvingRelease: null,
          approveLoading: false,
          activeTab: 'list',
          showCreateModal: false,
          showEditModal: false,
          showApprovalModal: false,
          showRejectModal: false,
        });
      },
    }),
    {
      name: 'qualityrelease-store',
      // 只持久化核心状态
      partialize: (state) => ({
        qualityReleases: state.qualityReleases,
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useQualityReleaseStore;