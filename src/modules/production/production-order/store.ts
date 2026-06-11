/**
 * 生产订单模块Zustand Store
 * 管理生产订单的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { productionOrderApi } from './api';
import { DEFAULT_PRODUCTION_ORDERS } from './types';
import type {
  ProductionOrder,
  ProductionOrderQuery,
  CreateProductionOrderDTO,
  UpdateProductionOrderDTO,
  ProductionOrderBatchAction,
  WorkOrderSummary,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface ProductionOrderStore {
  // State
  productionOrders: ProductionOrder[];
  selectedIds: string[];
  currentProductionOrder: ProductionOrder | null;
  filters: ProductionOrderQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    openCount: number;
    inProgressCount: number;
    completedCount: number;
    closedCount: number;
    priorityStats: Record<string, number>;
  } | null;

  // Actions
  loadProductionOrders: (query?: ProductionOrderQuery) => Promise<void>;
  loadAllProductionOrders: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  getProductionOrderById: (id: string) => Promise<ProductionOrder>;
  getProductionOrderByNo: (orderNo: string) => Promise<ProductionOrder>;
  createProductionOrder: (data: CreateProductionOrderDTO) => Promise<void>;
  updateProductionOrder: (data: UpdateProductionOrderDTO) => Promise<void>;
  deleteProductionOrders: (ids: string[]) => Promise<void>;
  batchProductionOrders: (action: ProductionOrderBatchAction) => Promise<void>;
  releaseProductionOrder: (id: string) => Promise<void>;
  auditProductionOrder: (id: string, auditor: string) => Promise<void>;
  unAuditProductionOrder: (id: string) => Promise<void>;
  closeProductionOrder: (id: string) => Promise<void>;
  reopenProductionOrder: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  updatePriority: (id: string, priority: string) => Promise<void>;
  addLineItem: (orderId: string, item: any) => Promise<void>;
  updateLineItem: (orderId: string, item: any) => Promise<void>;
  deleteLineItem: (orderId: string, itemId: string) => Promise<void>;
  deleteLineItems: (orderId: string, itemIds: string[]) => Promise<void>;
  pushWorkOrder: (id: string) => Promise<void>;
  pushWorkOrders: (ids: string[]) => Promise<void>;
  checkOrderNoExists: (orderNo: string, excludeId?: string) => Promise<boolean>;
  importProductionOrders: (file: File) => Promise<{ success: number; failed: number }>;
  exportProductionOrders: (query: ProductionOrderQuery) => Promise<Blob>;
  getApplicableRoutings: (productCode: string) => Promise<any[]>;
  getWorkOrderSummary: (orderId: string) => Promise<WorkOrderSummary[]>;
  calculateWorkOrders: (orderId: string) => Promise<any>;
  generateWorkOrders: (orderId: string) => Promise<any>;

  // State setters
  setFilters: (filters: Partial<ProductionOrderQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentProductionOrder: (productionOrder: ProductionOrder | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 创建Zustand Store
export const useProductionOrderStore = create<ProductionOrderStore>()(immer(
  (set, get) => ({
    // 初始状态
    productionOrders: DEFAULT_PRODUCTION_ORDERS,
    selectedIds: [],
    currentProductionOrder: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_PRODUCTION_ORDERS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadProductionOrders: async (query?: ProductionOrderQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: ProductionOrderQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await productionOrderApi.getProductionOrders(finalQuery);

        set({
          productionOrders: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载生产订单列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllProductionOrders: async () => {
      try {
        const productionOrders = await productionOrderApi.getAllProductionOrders();
        set({ productionOrders });
      } catch (error: any) {
        console.error('加载所有生产订单失败:', error);
        set({ error: error?.message || '加载生产订单列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await productionOrderApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载生产订单统计失败:', error);
      }
    },

    getProductionOrderById: async (id: string) => {
      set({ loading: true, error: null });

      try {
        const productionOrder = await productionOrderApi.getProductionOrderById(id);
        set({ currentProductionOrder: productionOrder, loading: false });
        return productionOrder;
      } catch (error: any) {
        set({
          error: error?.message || '加载生产订单详情失败',
          loading: false,
        });
        throw error;
      }
    },

    getProductionOrderByNo: async (orderNo: string) => {
      set({ loading: true, error: null });

      try {
        const productionOrder = await productionOrderApi.getProductionOrderByNo(orderNo);
        set({ currentProductionOrder: productionOrder, loading: false });
        return productionOrder;
      } catch (error: any) {
        set({
          error: error?.message || '加载生产订单详情失败',
          loading: false,
        });
        throw error;
      }
    },

    createProductionOrder: async (data: CreateProductionOrderDTO) => {
      set({ loading: true, error: null });

      try {
        const newProductionOrder = await productionOrderApi.createProductionOrder(data);

        set(state => {
          state.productionOrders.unshift(newProductionOrder);
          state.pagination.total += 1;
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateProductionOrder: async (data: UpdateProductionOrderDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedProductionOrder = await productionOrderApi.updateProductionOrder(data);

        set(state => {
          const index = state.productionOrders.findIndex(order => order.id === data.id);
          if (index !== -1) {
            state.productionOrders[index] = updatedProductionOrder;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteProductionOrders: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.deleteProductionOrders(ids);

        set(state => {
          state.productionOrders = state.productionOrders.filter(order => !ids.includes(order.id));
          state.pagination.total -= ids.length;
          state.selectedIds = [];
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '删除生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    batchProductionOrders: async (action: ProductionOrderBatchAction) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.batchProductionOrders(action);

        // 重新加载列表
        await get().loadProductionOrders();
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

    releaseProductionOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.releaseProductionOrder(id);

        set(state => {
          const productionOrder = state.productionOrders.find(order => order.id === id);
          if (productionOrder) {
            productionOrder.status = 'RELEASED';
            productionOrder.releaseDate = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '发布生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    auditProductionOrder: async (id: string, auditor: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.auditProductionOrder(id, auditor);

        set(state => {
          const productionOrder = state.productionOrders.find(order => order.id === id);
          if (productionOrder) {
            productionOrder.isAudited = true;
            productionOrder.auditedBy = auditor;
            productionOrder.auditedAt = new Date().toISOString();
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '审核生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    unAuditProductionOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.unAuditProductionOrder(id);

        set(state => {
          const productionOrder = state.productionOrders.find(order => order.id === id);
          if (productionOrder) {
            productionOrder.isAudited = false;
            productionOrder.auditedBy = undefined;
            productionOrder.auditedAt = undefined;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '反审核生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    closeProductionOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.closeProductionOrder(id);

        set(state => {
          const productionOrder = state.productionOrders.find(order => order.id === id);
          if (productionOrder) {
            productionOrder.status = 'CLOSED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '关闭生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    reopenProductionOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.reopenProductionOrder(id);

        set(state => {
          const productionOrder = state.productionOrders.find(order => order.id === id);
          if (productionOrder) {
            productionOrder.status = 'RELEASED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '重启生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.updateStatus(ids, status as any);

        set(state => {
          state.productionOrders.forEach(productionOrder => {
            if (ids.includes(productionOrder.id)) {
              productionOrder.status = status as any;
            }
          });
          state.loading = false;
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

    updatePriority: async (id: string, priority: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.updatePriority(id, priority as any);

        set(state => {
          const productionOrder = state.productionOrders.find(order => order.id === id);
          if (productionOrder) {
            productionOrder.priority = priority as any;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新优先级失败',
          loading: false,
        });
        throw error;
      }
    },

    addLineItem: async (orderId: string, item: any) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.addLineItem(orderId, item);
        // 重新加载详情
        await get().getProductionOrderById(orderId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加订单明细失败',
          loading: false,
        });
        throw error;
      }
    },

    updateLineItem: async (orderId: string, item: any) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.updateLineItem(orderId, item);
        // 重新加载详情
        await get().getProductionOrderById(orderId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '更新订单明细失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteLineItem: async (orderId: string, itemId: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.deleteLineItem(orderId, itemId);
        // 重新加载详情
        await get().getProductionOrderById(orderId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '删除订单明细失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteLineItems: async (orderId: string, itemIds: string[]) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.deleteLineItems(orderId, itemIds);
        // 重新加载详情
        await get().getProductionOrderById(orderId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '删除订单明细失败',
          loading: false,
        });
        throw error;
      }
    },

    pushWorkOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.pushWorkOrder(id);
        // 重新加载列表
        await get().loadProductionOrders();
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '下推生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    pushWorkOrders: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await productionOrderApi.pushWorkOrders(ids);
        // 重新加载列表
        await get().loadProductionOrders();
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '批量下推生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    checkOrderNoExists: async (orderNo: string, excludeId?: string): Promise<boolean> => {
      try {
        return await productionOrderApi.checkOrderNoExists(orderNo, excludeId);
      } catch (error: any) {
        console.error('检查订单号是否存在失败:', error);
        return false;
      }
    },

    importProductionOrders: async (file: File): Promise<{ success: number; failed: number }> => {
      set({ loading: true, error: null });

      try {
        const result = await productionOrderApi.importProductionOrders(file);
        set({ loading: false });
        // 重新加载列表
        await get().loadProductionOrders();
        return result;
      } catch (error: any) {
        set({
          error: error?.message || '导入生产订单失败',
          loading: false,
        });
        throw error;
      }
    },

    exportProductionOrders: async (query: ProductionOrderQuery): Promise<Blob> => {
      try {
        return await productionOrderApi.exportProductionOrders(query);
      } catch (error: any) {
        console.error('导出生产订单失败:', error);
        throw error;
      }
    },

    getApplicableRoutings: async (productCode: string): Promise<any[]> => {
      try {
        return await productionOrderApi.getApplicableRoutings(productCode);
      } catch (error: any) {
        console.error('获取适用工艺路径失败:', error);
        return [];
      }
    },

    getWorkOrderSummary: async (orderId: string): Promise<WorkOrderSummary[]> => {
      try {
        const result = await productionOrderApi.getWorkOrderSummary(orderId);
        return [result] as WorkOrderSummary[];
      } catch (error: any) {
        console.error('获取工单汇总失败:', error);
        return [];
      }
    },

    calculateWorkOrders: async (orderId: string) => {
      set({ loading: true, error: null });

      try {
        const result = await productionOrderApi.calculateWorkOrders(orderId);
        set({ loading: false });
        return result;
      } catch (error: any) {
        set({
          error: error?.message || '计算工单失败',
          loading: false,
        });
        throw error;
      }
    },

    generateWorkOrders: async (orderId: string) => {
      set({ loading: true, error: null });

      try {
        const result = await productionOrderApi.generateWorkOrders(orderId);
        set({ loading: false });
        // 重新加载详情
        await get().getProductionOrderById(orderId);
        return result;
      } catch (error: any) {
        set({
          error: error?.message || '生成工单失败',
          loading: false,
        });
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<ProductionOrderQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1; // 重置到第一页
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentProductionOrder: (productionOrder: ProductionOrder | null) => {
      set({ currentProductionOrder: productionOrder });
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
        productionOrders: DEFAULT_PRODUCTION_ORDERS,
        selectedIds: [],
        currentProductionOrder: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_PRODUCTION_ORDERS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },
  })
));
