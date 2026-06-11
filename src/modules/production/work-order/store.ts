/**
 * 生产工单模块Zustand Store
 * 管理生产工单的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { workOrderApi } from './api';
import { DEFAULT_WORK_ORDERS } from './types';
import type {
  WorkOrder,
  WorkOrderQuery,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO,
  WorkOrderBatchAction,
  WOStep,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface WorkOrderStore {
  // State
  workOrders: WorkOrder[];
  selectedIds: string[];
  currentWorkOrder: WorkOrder | null;
  currentSteps: WOStep[];
  filters: WorkOrderQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    draftCount: number;
    releasedCount: number;
    inProgressCount: number;
    completedCount: number;
    closedCount: number;
    suspendedCount: number;
    typeStats: Record<string, number>;
  } | null;

  // Actions
  loadWorkOrders: (query?: WorkOrderQuery) => Promise<void>;
  loadAllWorkOrders: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  getWorkOrderById: (id: string) => Promise<WorkOrder>;
  getWorkOrderByNo: (woNo: string) => Promise<WorkOrder>;
  createWorkOrder: (data: CreateWorkOrderDTO) => Promise<void>;
  updateWorkOrder: (data: UpdateWorkOrderDTO) => Promise<void>;
  deleteWorkOrders: (ids: string[]) => Promise<void>;
  batchWorkOrders: (action: WorkOrderBatchAction) => Promise<void>;
  releaseWorkOrder: (id: string) => Promise<void>;
  suspendWorkOrder: (id: string) => Promise<void>;
  resumeWorkOrder: (id: string) => Promise<void>;
  closeWorkOrder: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  updateQuantity: (id: string, actualQty: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number) => Promise<void>;
  addStep: (woId: string, step: Omit<WOStep, 'id' | 'woId'>) => Promise<void>;
  updateStep: (woId: string, step: WOStep) => Promise<void>;
  deleteStep: (woId: string, stepId: string) => Promise<void>;
  deleteSteps: (woId: string, stepIds: string[]) => Promise<void>;
  startStep: (woId: string, stepId: string) => Promise<void>;
  completeStep: (woId: string, stepId: string, quantity: number) => Promise<void>;
  suspendStep: (woId: string, stepId: string) => Promise<void>;
  resumeStep: (woId: string, stepId: string) => Promise<void>;
  allocateWorkcenter: (id: string, workcenterId: string, teamId?: string) => Promise<void>;
  allocateOperator: (id: string, operator: string) => Promise<void>;
  checkWoNoExists: (woNo: string, excludeId?: string) => Promise<boolean>;
  importWorkOrders: (file: File) => Promise<{ success: number; failed: number }>;
  exportWorkOrders: (query: WorkOrderQuery) => Promise<Blob>;
  getStepExecution: (woId: string) => Promise<WOStep[]>;
  generateFromPO: (poId: string) => Promise<WorkOrder[]>;
  getAvailableWorkcenters: (productCode: string) => Promise<any[]>;
  getAvailableTeams: (workcenterId: string) => Promise<any[]>;

  // State setters
  setFilters: (filters: Partial<WorkOrderQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentWorkOrder: (workOrder: WorkOrder | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  resetFilters: () => void;
  deleteWorkOrder: (id: string) => Promise<void>;
  batchRelease: (ids: string[]) => Promise<void>;
  batchSuspend: (ids: string[]) => Promise<void>;
  batchResume: (ids: string[]) => Promise<void>;
  batchClose: (ids: string[]) => Promise<void>;
  exportData: (query?: WorkOrderQuery) => Promise<Blob>;
  showDetail: boolean;
  showCreateForm: boolean;
  showEditForm: boolean;
  setShowDetail: (show: boolean) => void;
  setShowCreateForm: (show: boolean) => void;
  setShowEditForm: (show: boolean) => void;
}

// 创建Zustand Store
export const useWorkOrderStore = create<WorkOrderStore>()(immer(
  (set, get) => ({
    // 初始状态
    workOrders: DEFAULT_WORK_ORDERS,
    selectedIds: [],
    currentWorkOrder: null,
    currentSteps: [],
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_WORK_ORDERS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadWorkOrders: async (query?: WorkOrderQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: WorkOrderQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await workOrderApi.getWorkOrders(finalQuery);

        set({
          workOrders: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载生产工单列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllWorkOrders: async () => {
      try {
        const workOrders = await workOrderApi.getAllWorkOrders();
        set({ workOrders });
      } catch (error: any) {
        console.error('加载所有生产工单失败:', error);
        set({ error: error?.message || '加载生产工单列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await workOrderApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载生产工单统计失败:', error);
      }
    },

    getWorkOrderById: async (id: string) => {
      set({ loading: true, error: null });

      try {
        const workOrder = await workOrderApi.getWorkOrderById(id);
        set({ currentWorkOrder: workOrder, loading: false });
        return workOrder;
      } catch (error: any) {
        set({
          error: error?.message || '加载生产工单详情失败',
          loading: false,
        });
        throw error;
      }
    },

    getWorkOrderByNo: async (woNo: string) => {
      set({ loading: true, error: null });

      try {
        const workOrder = await workOrderApi.getWorkOrderByNo(woNo);
        set({ currentWorkOrder: workOrder, loading: false });
        return workOrder;
      } catch (error: any) {
        set({
          error: error?.message || '加载生产工单详情失败',
          loading: false,
        });
        throw error;
      }
    },

    createWorkOrder: async (data: CreateWorkOrderDTO) => {
      set({ loading: true, error: null });

      try {
        const newWorkOrder = await workOrderApi.createWorkOrder(data);

        set(state => {
          state.workOrders.unshift(newWorkOrder);
          state.pagination.total += 1;
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateWorkOrder: async (data: UpdateWorkOrderDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedWorkOrder = await workOrderApi.updateWorkOrder(data);

        set(state => {
          const index = state.workOrders.findIndex(wo => wo.id === data.id);
          if (index !== -1) {
            state.workOrders[index] = updatedWorkOrder;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteWorkOrders: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.deleteWorkOrders(ids);

        set(state => {
          state.workOrders = state.workOrders.filter(wo => !ids.includes(wo.id));
          state.pagination.total -= ids.length;
          state.selectedIds = [];
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '删除生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    batchWorkOrders: async (action: WorkOrderBatchAction) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.batchWorkOrders(action);

        // 重新加载列表
        await get().loadWorkOrders();
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

    releaseWorkOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.releaseWorkOrder(id);

        set(state => {
          const workOrder = state.workOrders.find(wo => wo.id === id);
          if (workOrder) {
            workOrder.status = 'RELEASED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '发布生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    suspendWorkOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.suspendWorkOrder(id);

        set(state => {
          const workOrder = state.workOrders.find(wo => wo.id === id);
          if (workOrder) {
            workOrder.status = 'SUSPENDED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '暂停生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    resumeWorkOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.resumeWorkOrder(id);

        set(state => {
          const workOrder = state.workOrders.find(wo => wo.id === id);
          if (workOrder) {
            workOrder.status = 'IN_PROGRESS';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '恢复生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    closeWorkOrder: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.closeWorkOrder(id);

        set(state => {
          const workOrder = state.workOrders.find(wo => wo.id === id);
          if (workOrder) {
            workOrder.status = 'CLOSED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '关闭生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.updateStatus(ids, status as any);

        set(state => {
          state.workOrders.forEach(workOrder => {
            if (ids.includes(workOrder.id)) {
              workOrder.status = status as any;
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

    updateQuantity: async (id: string, actualQty: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.updateQuantity(id, actualQty, qualifiedQty, unqualifiedQty, scrapQty);

        set(state => {
          const workOrder = state.workOrders.find(wo => wo.id === id);
          if (workOrder) {
            workOrder.actualQty = actualQty;
            workOrder.qualifiedQty = qualifiedQty;
            workOrder.unqualifiedQty = unqualifiedQty;
            workOrder.scrapQty = scrapQty;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新数量失败',
          loading: false,
        });
        throw error;
      }
    },

    addStep: async (woId: string, step: Omit<WOStep, 'id' | 'woId'>) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.addStep(woId, step);
        // 重新加载详情
        await get().getStepExecution(woId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加工单工序失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStep: async (woId: string, step: WOStep) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.updateStep(woId, step);
        // 重新加载详情
        await get().getStepExecution(woId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '更新工单工序失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteStep: async (woId: string, stepId: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.deleteStep(woId, stepId);
        // 重新加载详情
        await get().getStepExecution(woId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '删除工单工序失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteSteps: async (woId: string, stepIds: string[]) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.deleteSteps(woId, stepIds);
        // 重新加载详情
        await get().getStepExecution(woId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '删除工单工序失败',
          loading: false,
        });
        throw error;
      }
    },

    startStep: async (woId: string, stepId: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.startStep(woId, stepId);
        // 重新加载详情
        await get().getStepExecution(woId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '启动工单工序失败',
          loading: false,
        });
        throw error;
      }
    },

    completeStep: async (woId: string, stepId: string, quantity: number) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.completeStep(woId, stepId, quantity);
        // 重新加载详情
        await get().getStepExecution(woId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '完成工单工序失败',
          loading: false,
        });
        throw error;
      }
    },

    suspendStep: async (woId: string, stepId: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.suspendStep(woId, stepId);
        // 重新加载详情
        await get().getStepExecution(woId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '暂停工单工序失败',
          loading: false,
        });
        throw error;
      }
    },

    resumeStep: async (woId: string, stepId: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.resumeStep(woId, stepId);
        // 重新加载详情
        await get().getStepExecution(woId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '恢复工单工序失败',
          loading: false,
        });
        throw error;
      }
    },

    allocateWorkcenter: async (id: string, workcenterId: string, teamId?: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.allocateWorkcenter(id, workcenterId, teamId);

        set(state => {
          const workOrder = state.workOrders.find(wo => wo.id === id);
          if (workOrder) {
            workOrder.workcenterId = workcenterId;
            if (teamId) workOrder.teamId = teamId;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '分配工作中心失败',
          loading: false,
        });
        throw error;
      }
    },

    allocateOperator: async (id: string, operator: string) => {
      set({ loading: true, error: null });

      try {
        await workOrderApi.allocateOperator(id, operator);

        set(state => {
          const workOrder = state.workOrders.find(wo => wo.id === id);
          if (workOrder) {
            workOrder.operator = operator;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '分配操作员失败',
          loading: false,
        });
        throw error;
      }
    },

    checkWoNoExists: async (woNo: string, excludeId?: string): Promise<boolean> => {
      try {
        return await workOrderApi.checkWoNoExists(woNo, excludeId);
      } catch (error: any) {
        console.error('检查工单号是否存在失败:', error);
        return false;
      }
    },

    importWorkOrders: async (file: File): Promise<{ success: number; failed: number }> => {
      set({ loading: true, error: null });

      try {
        const result = await workOrderApi.importWorkOrders(file);
        set({ loading: false });
        // 重新加载列表
        await get().loadWorkOrders();
        return result;
      } catch (error: any) {
        set({
          error: error?.message || '导入生产工单失败',
          loading: false,
        });
        throw error;
      }
    },

    exportWorkOrders: async (query: WorkOrderQuery): Promise<Blob> => {
      try {
        return await workOrderApi.exportWorkOrders(query);
      } catch (error: any) {
        console.error('导出生产工单失败:', error);
        throw error;
      }
    },

    getStepExecution: async (woId: string): Promise<WOStep[]> => {
      try {
        const steps = await workOrderApi.getStepExecution(woId);
        set({ currentSteps: steps });
        return steps;
      } catch (error: any) {
        console.error('获取工序执行情况失败:', error);
        return [];
      }
    },

    generateFromPO: async (poId: string): Promise<WorkOrder[]> => {
      set({ loading: true, error: null });

      try {
        const workOrders = await workOrderApi.generateFromPO(poId);
        set({ loading: false });
        // 重新加载列表
        await get().loadWorkOrders();
        return workOrders;
      } catch (error: any) {
        set({
          error: error?.message || '生成工单失败',
          loading: false,
        });
        throw error;
      }
    },

    getAvailableWorkcenters: async (productCode: string): Promise<any[]> => {
      try {
        return await workOrderApi.getAvailableWorkcenters(productCode);
      } catch (error: any) {
        console.error('获取可用工作中心失败:', error);
        return [];
      }
    },

    getAvailableTeams: async (workcenterId: string): Promise<any[]> => {
      try {
        return await workOrderApi.getAvailableTeams(workcenterId);
      } catch (error: any) {
        console.error('获取可用班组失败:', error);
        return [];
      }
    },

    // State setters
    setFilters: (filters: Partial<WorkOrderQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1; // 重置到第一页
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentWorkOrder: (workOrder: WorkOrder | null) => {
      set({ currentWorkOrder: workOrder });
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
        workOrders: DEFAULT_WORK_ORDERS,
        selectedIds: [],
        currentWorkOrder: null,
        currentSteps: [],
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_WORK_ORDERS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    showDetail: false,
    showCreateForm: false,
    showEditForm: false,
    setShowDetail: (show: boolean) => { set({ showDetail: show } as any); },
    setShowCreateForm: (show: boolean) => { set({ showCreateForm: show } as any); },
    setShowEditForm: (show: boolean) => { set({ showEditForm: show } as any); },
    resetFilters: () => { get().setFilters({}); },
    deleteWorkOrder: async (id: string) => { await get().deleteWorkOrders([id]); },
    batchRelease: async (ids: string[]) => { await get().batchWorkOrders({ action: 'release', ids } as any); },
    batchSuspend: async (ids: string[]) => { await get().batchWorkOrders({ action: 'suspend', ids } as any); },
    batchResume: async (ids: string[]) => { await get().batchWorkOrders({ action: 'resume', ids } as any); },
    batchClose: async (ids: string[]) => { await get().batchWorkOrders({ action: 'close', ids } as any); },
    exportData: async (query?: WorkOrderQuery) => { return await get().exportWorkOrders(query || get().filters); },
  })
));
