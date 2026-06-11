/**
 * 领料管理模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import { materialIssuanceApi } from '../api/materialIssuanceApi';
import type {
  MaterialIssuance,
  IssuanceQuery,
  CreateIssuanceDTO,
  UpdateIssuanceDTO,
  IssuanceOperationDTO,
  ReturnMaterialDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';

/**
 * Issuance Store状态接口
 */
export interface IssuanceState {
  // 领料单列表状态
  issuances: MaterialIssuance[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: IssuanceQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIssuanceIds: string[];
  selectedIssuances: MaterialIssuance[];

  // 详情状态
  currentIssuance: MaterialIssuance | null;
  showIssuanceDetail: boolean;

  // 批量操作状态
  batchOperationLoading: boolean;

  // 操作状态
  operatingIssuance: MaterialIssuance | null;
  operationLoading: boolean;

  // UI状态
  activeTab: 'list' | 'detail' | 'items' | 'return';
  showCreateModal: boolean;
  showEditModal: boolean;
  showReturnModal: boolean;
  showApproveModal: boolean;

  // Actions
  setIssuances: (issuances: MaterialIssuance[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<IssuanceQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIssuanceIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentIssuance: (issuance: MaterialIssuance | null) => void;
  setShowIssuanceDetail: (show: boolean) => void;

  // 领料单操作
  loadIssuances: () => Promise<void>;
  refreshIssuances: () => Promise<void>;
  createIssuance: (data: CreateIssuanceDTO) => Promise<void>;
  updateIssuance: (data: UpdateIssuanceDTO) => Promise<void>;
  deleteIssuances: (ids: string[]) => Promise<void>;

  // 领料操作
  approveIssuance: (data: IssuanceOperationDTO) => Promise<void>;
  rejectIssuance: (data: IssuanceOperationDTO) => Promise<void>;
  issueMaterial: (data: IssuanceOperationDTO) => Promise<void>;
  completeIssuance: (data: IssuanceOperationDTO) => Promise<void>;
  cancelIssuance: (data: IssuanceOperationDTO) => Promise<void>;

  // 退料操作
  returnMaterial: (data: ReturnMaterialDTO) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'list' | 'detail' | 'items' | 'return') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowReturnModal: (show: boolean) => void;
  setShowApproveModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * Issuance Store
 */
export const useIssuanceStore = create<IssuanceState>()(
  persist(
    (set, get) => ({
      // 初始状态
      issuances: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIssuanceIds: [],
      selectedIssuances: [],
      currentIssuance: null,
      showIssuanceDetail: false,
      batchOperationLoading: false,
      operatingIssuance: null,
      operationLoading: false,
      activeTab: 'list',
      showCreateModal: false,
      showEditModal: false,
      showReturnModal: false,
      showApproveModal: false,

      /**
       * 设置领料单列表数据
       */
      setIssuances: (issuances: MaterialIssuance[], total: number) => {
        set({ issuances, total, error: null });
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
      setQuery: (query: Partial<IssuanceQuery>) => {
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
       * 设置选中领料单ID列表
       */
      setSelectedIssuanceIds: (ids: string[]) => {
        const { issuances } = get();
        const selectedIssuances = issuances.filter(i => ids.includes(i.id));
        set({ selectedIssuanceIds: ids, selectedIssuances });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedIssuanceIds: [],
          selectedIssuances: [],
        });
      },

      /**
       * 设置当前领料单
       */
      setCurrentIssuance: (issuance: MaterialIssuance | null) => {
        set({ currentIssuance: issuance });
      },

      /**
       * 显示领料单详情
       */
      setShowIssuanceDetail: (show: boolean) => {
        set({ showIssuanceDetail: show });
      },

      /**
       * 加载领料单列表
       */
      loadIssuances: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await materialIssuanceApi.getIssuances(query);

          if ((response as any).code === 200) {
            set({
              issuances: (response as any).data?.list,
              total: (response as any).data?.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
            });
            message.error((response as any).message || '加载失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
          message.error(error.message || '加载失败');
        }
      },

      /**
       * 刷新领料单列表
       */
      refreshIssuances: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API刷新领料单数据
          // const response = await issuanceApi.refreshIssuances(query);

          // if ((response as any).code === 200) {
          //   set({
          //     issuances: (response as any).data?.list,
          //     total: (response as any).data?.total,
          //     loading: false,
          //   });
          // }

          // 模拟刷新过程
          setTimeout(() => {
            set({
              issuances: [],
              total: 0,
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '刷新失败',
          });
        }
      },

      /**
       * 创建领料单
       */
      createIssuance: async (data: CreateIssuanceDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API创建领料单
          // const response = await issuanceApi.createIssuance(data);

          // if ((response as any).code === 200) {
          //   await get().loadIssuances();
          //   set({ showCreateModal: false });
          //   message.success('领料单创建成功！');
          // } else {
          //   set({
          //     loading: false,
          //     error: (response as any).message || '创建失败',
          //   });
          // }

          // 模拟创建过程
          setTimeout(() => {
            message.success('领料单创建成功！');
            set({ loading: false, showCreateModal: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
        }
      },

      /**
       * 更新领料单
       */
      updateIssuance: async (data: UpdateIssuanceDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新领料单
          // const response = await issuanceApi.updateIssuance(data);

          // if ((response as any).code === 200) {
          //   await get().loadIssuances();
          //   set({ showEditModal: false });
          //   message.success('领料单更新成功！');
          // } else {
          //   set({
          //     loading: false,
          //     error: (response as any).message || '更新失败',
          //   });
          // }

          // 模拟更新过程
          setTimeout(() => {
            message.success('领料单更新成功！');
            set({ loading: false, showEditModal: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
        }
      },

      /**
       * 删除领料单
       */
      deleteIssuances: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API删除领料单
          // const response = await issuanceApi.deleteIssuances(ids);

          // if ((response as any).code === 200) {
          //   await get().loadIssuances();
          //   get().clearSelection();
          //   message.success(`成功删除 ${ids.length} 个领料单`);
          // } else {
          //   set({
          //     loading: false,
          //     error: (response as any).message || '删除失败',
          //   });
          // }

          // 模拟删除过程
          setTimeout(() => {
            message.success(`成功删除 ${ids.length} 个领料单`);
            set({ loading: false });
            get().clearSelection();
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
        }
      },

      /**
       * 审批领料单
       */
      approveIssuance: async (data: IssuanceOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await materialIssuanceApi.approveIssuance({
            issuanceId: data.issuanceId,
            operatorId: data.operatorId || 'current-user',
            operatorName: data.operatorName || '当前用户',
            operationType: 'APPROVE',
            operationTime: new Date().toISOString(),
            remark: data.remark,
          });

          if ((response as any).code === 200) {
            await get().loadIssuances();
            message.success('领料单已审批！');
            set({ operationLoading: false, showApproveModal: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '审批失败',
            });
            message.error((response as any).message || '审批失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '审批失败',
          });
          message.error(error.message || '审批失败');
        }
      },

      /**
       * 拒绝领料单
       */
      rejectIssuance: async (data: IssuanceOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API拒绝领料单
          // const response = await issuanceApi.rejectIssuance(data);

          // if ((response as any).code === 200) {
          //   await get().loadIssuances();
          //   message.success('领料单已拒绝！');
          // }

          // 模拟拒绝过程
          setTimeout(() => {
            message.success('领料单已拒绝！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '拒绝失败',
          });
        }
      },

      /**
       * 领料
       */
      issueMaterial: async (data: IssuanceOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await materialIssuanceApi.issueMaterial({
            issuanceId: data.issuanceId,
            operatorId: data.operatorId || 'current-user',
            operatorName: data.operatorName || '当前用户',
            operationType: 'ISSUE',
            operationTime: new Date().toISOString(),
            actualQuantity: data.actualQuantity,
            remark: data.remark,
          });

          if ((response as any).code === 200) {
            await get().loadIssuances();
            message.success('领料操作已完成！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '领料失败',
            });
            message.error((response as any).message || '领料失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '领料失败',
          });
          message.error(error.message || '领料失败');
        }
      },

      /**
       * 完成领料
       */
      completeIssuance: async (data: IssuanceOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API完成领料
          // const response = await issuanceApi.completeIssuance(data);

          // if ((response as any).code === 200) {
          //   await get().loadIssuances();
          //   message.success('领料已完成！');
          // }

          // 模拟完成过程
          setTimeout(() => {
            message.success('领料已完成！');
            set({ operationLoading: false });
          }, 1000);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '完成失败',
          });
        }
      },

      /**
       * 取消领料单
       */
      cancelIssuance: async (data: IssuanceOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API取消领料单
          // const response = await issuanceApi.cancelIssuance(data);

          // if ((response as any).code === 200) {
          //   await get().loadIssuances();
          //   message.success('领料单已取消！');
          // }

          // 模拟取消过程
          setTimeout(() => {
            message.success('领料单已取消！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '取消失败',
          });
        }
      },

      /**
       * 退料
       */
      returnMaterial: async (data: ReturnMaterialDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API退料
          // const response = await issuanceApi.returnMaterial(data);

          // if ((response as any).code === 200) {
          //   await get().loadIssuances();
          //   set({ showReturnModal: false });
          //   message.success('退料操作已完成！');
          // }

          // 模拟退料过程
          setTimeout(() => {
            message.success('退料操作已完成！');
            set({ loading: false, showReturnModal: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '退料失败',
          });
        }
      },

      /**
       * 设置活动标签页
       */
      setActiveTab: (tab: 'list' | 'detail' | 'items' | 'return') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentIssuance: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示退料弹窗
       */
      setShowReturnModal: (show: boolean) => {
        set({ showReturnModal: show });
      },

      /**
       * 显示审批弹窗
       */
      setShowApproveModal: (show: boolean) => {
        set({ showApproveModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          issuances: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIssuanceIds: [],
          selectedIssuances: [],
          currentIssuance: null,
          showIssuanceDetail: false,
          batchOperationLoading: false,
          operatingIssuance: null,
          operationLoading: false,
          activeTab: 'list',
          showCreateModal: false,
          showEditModal: false,
          showReturnModal: false,
          showApproveModal: false,
        });
      },
    }),
    {
      name: 'issuance-store',
      // 只持久化核心状态
      partialize: (state) => ({
        issuances: state.issuances,
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useIssuanceStore;