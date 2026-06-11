/**
 * 质量检验模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import type {
  QualityInspection,
  QualityInspectionQuery,
  CreateQualityInspectionDTO,
  UpdateQualityInspectionDTO,
  SubmitInspectionResultDTO,
  ApproveInspectionDTO,
  CancelInspectionDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';
import { inspectionApi } from '../api';

/**
 * QualityInspection Store状态接口
 */
export interface QualityInspectionState {
  // 质量检验列表状态
  qualityInspections: QualityInspection[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: QualityInspectionQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedInspectionIds: string[];
  selectedInspections: QualityInspection[];

  // 详情状态
  currentInspection: QualityInspection | null;
  showInspectionDetail: boolean;

  // 批量操作状态
  batchOperationLoading: boolean;

  // 检验状态
  inspectingInspection: QualityInspection | null;
  inspectionLoading: boolean;

  // UI状态
  activeTab: 'list' | 'detail' | 'inspection';
  showCreateModal: boolean;
  showEditModal: boolean;
  showInspectionModal: boolean;
  showApprovalModal: boolean;

  // Actions
  setQualityInspections: (inspections: QualityInspection[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<QualityInspectionQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedInspectionIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentInspection: (inspection: QualityInspection | null) => void;
  setShowInspectionDetail: (show: boolean) => void;

  // 质量检验操作
  loadQualityInspections: () => Promise<void>;
  refreshQualityInspections: () => Promise<void>;
  createQualityInspection: (data: CreateQualityInspectionDTO) => Promise<void>;
  updateQualityInspection: (data: UpdateQualityInspectionDTO) => Promise<void>;
  deleteQualityInspections: (ids: string[]) => Promise<void>;

  // 检验操作
  startInspection: (inspectionId: string) => Promise<void>;
  submitInspectionResult: (data: SubmitInspectionResultDTO) => Promise<void>;
  approveInspection: (data: ApproveInspectionDTO) => Promise<void>;
  cancelInspection: (data: CancelInspectionDTO) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'list' | 'detail' | 'inspection') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowInspectionModal: (show: boolean) => void;
  setShowApprovalModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * QualityInspection Store
 */
export const useQualityInspectionStore = create<QualityInspectionState>()(
  persist(
    (set, get) => ({
      // 初始状态
      qualityInspections: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedInspectionIds: [],
      selectedInspections: [],
      currentInspection: null,
      showInspectionDetail: false,
      batchOperationLoading: false,
      inspectingInspection: null,
      inspectionLoading: false,
      activeTab: 'list',
      showCreateModal: false,
      showEditModal: false,
      showInspectionModal: false,
      showApprovalModal: false,

      /**
       * 设置质量检验列表数据
       */
      setQualityInspections: (inspections: QualityInspection[], total: number) => {
        set({ qualityInspections: inspections, total, error: null });
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
      setQuery: (query: Partial<QualityInspectionQuery>) => {
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
       * 设置选中检验单ID列表
       */
      setSelectedInspectionIds: (ids: string[]) => {
        const { qualityInspections } = get();
        const selectedInspections = qualityInspections.filter(i => ids.includes(i.id));
        set({ selectedInspectionIds: ids, selectedInspections });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedInspectionIds: [],
          selectedInspections: [],
        });
      },

      /**
       * 设置当前检验单
       */
      setCurrentInspection: (inspection: QualityInspection | null) => {
        set({ currentInspection: inspection });
      },

      /**
       * 显示检验单详情
       */
      setShowInspectionDetail: (show: boolean) => {
        set({ showInspectionDetail: show });
      },

      /**
       * 加载质量检验列表
       */
      loadQualityInspections: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await inspectionApi.getInspections(query as any);

          if ((response as any).code === 200) {
            set({
              qualityInspections: (response as any).data?.list,
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
       * 刷新质量检验列表
       */
      refreshQualityInspections: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await inspectionApi.getInspections(query as any);

          if ((response as any).code === 200) {
            set({
              qualityInspections: (response as any).data?.list,
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
       * 创建质量检验
       */
      createQualityInspection: async (data: CreateQualityInspectionDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await inspectionApi.createInspection(data as any);

          if ((response as any).code === 200) {
            await get().loadQualityInspections();
            set({ showCreateModal: false });
            message.success('质量检验创建成功！');
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
       * 更新质量检验
       */
      updateQualityInspection: async (data: UpdateQualityInspectionDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await inspectionApi.updateInspection(data);

          if ((response as any).code === 200) {
            await get().loadQualityInspections();
            set({ showEditModal: false });
            message.success('质量检验更新成功！');
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
       * 删除质量检验
       */
      deleteQualityInspections: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await inspectionApi.batchInspections({
            action: 'delete',
            ids,
          });

          if ((response as any).code === 200) {
            await get().loadQualityInspections();
            get().clearSelection();
            message.success(`成功删除 ${ids.length} 个质量检验`);
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
       * 开始检验
       */
      startInspection: async (inspectionId: string) => {
        set({ inspectionLoading: true, error: null });

        try {
          const response = await inspectionApi.startInspection(inspectionId, 'current_user');

          if ((response as any).code === 200) {
            await get().loadQualityInspections();
            message.success('检验已开始');
            set({ inspectionLoading: false });
          } else {
            set({
              inspectionLoading: false,
              error: (response as any).message || '开始检验失败',
            });
          }
        } catch (error: any) {
          set({
            inspectionLoading: false,
            error: error.message || '开始检验失败',
          });
        }
      },

      /**
       * 提交检验结果
       */
      submitInspectionResult: async (data: SubmitInspectionResultDTO) => {
        set({ inspectionLoading: true, error: null });

        try {
          const response = await inspectionApi.passInspection(
            data.inspectionId,
            data.resultDetails || ''
          );

          if ((response as any).code === 200) {
            await get().loadQualityInspections();
            set({ showInspectionModal: false });
            message.success('检验结果已提交');
            set({ inspectionLoading: false });
          } else {
            set({
              inspectionLoading: false,
              error: (response as any).message || '提交失败',
            });
          }
        } catch (error: any) {
          set({
            inspectionLoading: false,
            error: error.message || '提交失败',
          });
        }
      },

      /**
       * 审核检验结果
       */
      approveInspection: async (data: ApproveInspectionDTO) => {
        set({ inspectionLoading: true, error: null });

        try {
          const response = await inspectionApi.assignInspector(
            data.inspectionId,
            data.approver || 'current_user'
          );

          if ((response as any).code === 200) {
            await get().loadQualityInspections();
            set({ showApprovalModal: false });
            message.success('检验结果已审核');
            set({ inspectionLoading: false });
          } else {
            set({
              inspectionLoading: false,
              error: (response as any).message || '审核失败',
            });
          }
        } catch (error: any) {
          set({
            inspectionLoading: false,
            error: error.message || '审核失败',
          });
        }
      },

      /**
       * 取消检验
       */
      cancelInspection: async (data: CancelInspectionDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await inspectionApi.updateStatus(
            [data.inspectionId],
            'CANCELLED'
          );

          if ((response as any).code === 200) {
            await get().loadQualityInspections();
            message.success('检验已取消');
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
      setActiveTab: (tab: 'list' | 'detail' | 'inspection') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentInspection: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示检验弹窗
       */
      setShowInspectionModal: (show: boolean) => {
        set({ showInspectionModal: show });
      },

      /**
       * 显示审批弹窗
       */
      setShowApprovalModal: (show: boolean) => {
        set({ showApprovalModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          qualityInspections: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedInspectionIds: [],
          selectedInspections: [],
          currentInspection: null,
          showInspectionDetail: false,
          batchOperationLoading: false,
          inspectingInspection: null,
          inspectionLoading: false,
          activeTab: 'list',
          showCreateModal: false,
          showEditModal: false,
          showInspectionModal: false,
          showApprovalModal: false,
        });
      },
    }),
    {
      name: 'qualityinspection-store',
      // 只持久化核心状态
      partialize: (state) => ({
        qualityInspections: state.qualityInspections,
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useQualityInspectionStore;