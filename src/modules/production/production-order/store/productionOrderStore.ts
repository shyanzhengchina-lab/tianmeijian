/**
 * 生产订单模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import { productionOrderApi } from '../api';
import type {
  ProductionOrder,
  ProductionOrderQuery,
  CreateProductionOrderDTO,
  UpdateProductionOrderDTO,
  SubmitForApprovalDTO,
  ApproveOrderDTO,
  StartProductionDTO,
  CompleteOrderDTO,
  CancelOrderDTO,
  ChangeOrderDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';

/**
 * ProductionOrder Store状态接口
 */
export interface ProductionOrderState {
  // 生产订单列表状态
  productionOrders: ProductionOrder[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: ProductionOrderQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedOrderIds: string[];
  selectedOrders: ProductionOrder[];

  // 详情状态
  currentOrder: ProductionOrder | null;
  showOrderDetail: boolean;

  // 批量操作状态
  batchOperationLoading: boolean;

  // 操作状态
  operatingOrder: ProductionOrder | null;
  operationLoading: boolean;

  // UI状态
  activeTab: 'list' | 'detail' | 'production';
  showCreateModal: boolean;
  showEditModal: boolean;
  showApprovalModal: boolean;
  showChangeModal: boolean;

  // Actions
  setProductionOrders: (orders: ProductionOrder[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<ProductionOrderQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedOrderIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentOrder: (order: ProductionOrder | null) => void;
  setShowOrderDetail: (show: boolean) => void;

  // 生产订单操作
  loadProductionOrders: () => Promise<void>;
  refreshProductionOrders: () => Promise<void>;
  createProductionOrder: (data: CreateProductionOrderDTO) => Promise<void>;
  updateProductionOrder: (data: UpdateProductionOrderDTO) => Promise<void>;
  deleteProductionOrders: (ids: string[]) => Promise<void>;

  // 订单流程操作
  submitForApproval: (data: SubmitForApprovalDTO) => Promise<void>;
  approveOrder: (data: ApproveOrderDTO) => Promise<void>;
  startProduction: (data: StartProductionDTO) => Promise<void>;
  completeOrder: (data: CompleteOrderDTO) => Promise<void>;
  cancelOrder: (data: CancelOrderDTO) => Promise<void>;

  // 订单变更操作
  changeOrder: (data: ChangeOrderDTO) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'list' | 'detail' | 'production') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowApprovalModal: (show: boolean) => void;
  setShowChangeModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * ProductionOrder Store
 */
export const useProductionOrderStore = create<ProductionOrderState>()(
  persist(
    (set, get) => ({
      // 初始状态
      productionOrders: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedOrderIds: [],
      selectedOrders: [],
      currentOrder: null,
      showOrderDetail: false,
      batchOperationLoading: false,
      operatingOrder: null,
      operationLoading: false,
      activeTab: 'list',
      showCreateModal: false,
      showEditModal: false,
      showApprovalModal: false,
      showChangeModal: false,

      /**
       * 设置生产订单列表数据
       */
      setProductionOrders: (orders: ProductionOrder[], total: number) => {
        set({ productionOrders: orders, total, error: null });
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
      setQuery: (query: Partial<ProductionOrderQuery>) => {
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
       * 设置选中订单ID列表
       */
      setSelectedOrderIds: (ids: string[]) => {
        const { productionOrders } = get();
        const selectedOrders = productionOrders.filter(o => ids.includes(o.id));
        set({ selectedOrderIds: ids, selectedOrders });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedOrderIds: [],
          selectedOrders: [],
        });
      },

      /**
       * 设置当前订单
       */
      setCurrentOrder: (order: ProductionOrder | null) => {
        set({ currentOrder: order });
      },

      /**
       * 显示订单详情
       */
      setShowOrderDetail: (show: boolean) => {
        set({ showOrderDetail: show });
      },

      /**
       * 加载生产订单列表
       */
      loadProductionOrders: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const result = await productionOrderApi.getProductionOrders(query);
          set({
            productionOrders: result.list,
            total: result.total,
            loading: false,
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 刷新生产订单列表
       */
      refreshProductionOrders: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const result = await productionOrderApi.getProductionOrders(query);
          set({
            productionOrders: result.list,
            total: result.total,
            loading: false,
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '刷新失败',
          });
        }
      },

      /**
       * 创建生产订单
       */
      createProductionOrder: async (data: CreateProductionOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await productionOrderApi.createProductionOrder(data);
          await get().loadProductionOrders();
          set({ showCreateModal: false });
          message.success('生产订单创建成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
          throw error;
        }
      },

      /**
       * 更新生产订单
       */
      updateProductionOrder: async (data: UpdateProductionOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await productionOrderApi.updateProductionOrder(data as any);
          await get().loadProductionOrders();
          set({ showEditModal: false });
          message.success('生产订单更新成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
          throw error;
        }
      },

      /**
       * 删除生产订单
       */
      deleteProductionOrders: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          await productionOrderApi.deleteProductionOrders(ids);
          await get().loadProductionOrders();
          get().clearSelection();
          message.success(`成功删除 ${ids.length} 个生产订单`);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
          throw error;
        }
      },

      /**
       * 提交审核
       */
      submitForApproval: async (data: SubmitForApprovalDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await productionOrderApi.auditProductionOrder(data.id!, data.auditor!);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '提交失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 审核订单
       */
      approveOrder: async (data: ApproveOrderDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await productionOrderApi.auditProductionOrder(data.id!, data.auditor!);
          await get().loadProductionOrders();
          set({ showApprovalModal: false });
          message.success('订单审核完成');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '审核失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 开始生产
       */
      startProduction: async (data: StartProductionDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await productionOrderApi.releaseProductionOrder(data.id!);
          await get().loadProductionOrders();
          message.success('生产已开始');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '开始生产失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 完成订单
       */
      completeOrder: async (data: CompleteOrderDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await productionOrderApi.closeProductionOrder(data.id!);
          await get().loadProductionOrders();
          message.success('订单已完成');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '完成订单失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 取消订单
       */
      cancelOrder: async (data: CancelOrderDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await productionOrderApi.closeProductionOrder(data.id!);
          await get().loadProductionOrders();
          message.success('订单已取消');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '取消订单失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 订单变更
       */
      changeOrder: async (data: ChangeOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await productionOrderApi.updateProductionOrder(data as any);
          await get().loadProductionOrders();
          set({ showChangeModal: false });
          message.success('订单变更成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '变更失败',
          });
          throw error;
        }
      },

      /**
       * 设置活动标签页
       */
      setActiveTab: (tab: 'list' | 'detail' | 'production') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentOrder: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示审核弹窗
       */
      setShowApprovalModal: (show: boolean) => {
        set({ showApprovalModal: show });
      },

      /**
       * 显示变更弹窗
       */
      setShowChangeModal: (show: boolean) => {
        set({ showChangeModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          productionOrders: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedOrderIds: [],
          selectedOrders: [],
          currentOrder: null,
          showOrderDetail: false,
          batchOperationLoading: false,
          operatingOrder: null,
          operationLoading: false,
          activeTab: 'list',
          showCreateModal: false,
          showEditModal: false,
          showApprovalModal: false,
          showChangeModal: false,
        });
      },
    }),
    {
      name: 'productionorder-store',
      // 只持久化核心状态
      partialize: (state) => ({
        productionOrders: state.productionOrders,
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useProductionOrderStore;