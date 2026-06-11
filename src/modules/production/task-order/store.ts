/**
 * 生产任务单模块Zustand Store
 * 管理生产任务单的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { taskOrderApi } from './api';
import { DEFAULT_TASK_ORDERS } from './types';
import type {
  TaskOrder,
  TaskOrderQuery,
  CreateTaskOrderDTO,
  UpdateTaskOrderDTO,
  TaskOrderBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface TaskOrderStore {
  // State
  taskOrders: TaskOrder[];
  selectedIds: string[];
  currentTaskOrder: TaskOrder | null;
  filters: TaskOrderQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    pendingCount: number;
    assignedCount: number;
    inProgressCount: number;
    completedCount: number;
    cancelledCount: number;
    priorityStats: Record<string, number>;
  } | null;

  // Actions
  loadTaskOrders: (query?: TaskOrderQuery) => Promise<void>;
  loadAllTaskOrders: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  getTaskOrderById: (id: string) => Promise<TaskOrder>;
  getTaskOrderByNo: (taskNo: string) => Promise<TaskOrder>;
  createTaskOrder: (data: CreateTaskOrderDTO) => Promise<void>;
  updateTaskOrder: (data: UpdateTaskOrderDTO) => Promise<void>;
  deleteTaskOrders: (ids: string[]) => Promise<void>;
  batchTaskOrders: (action: TaskOrderBatchAction) => Promise<void>;
  assignTask: (id: string, operatorId: string, workcenterId?: string, teamId?: string, equipmentId?: string) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  completeTask: (id: string, quantity: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  resumeTask: (id: string) => Promise<void>;
  cancelTask: (id: string, reason?: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  updatePriority: (id: string, priority: string) => Promise<void>;
  checkTaskNoExists: (taskNo: string, excludeId?: string) => Promise<boolean>;
  importTaskOrders: (file: File) => Promise<{ success: number; failed: number }>;
  exportTaskOrders: (query: TaskOrderQuery) => Promise<Blob>;
  generateFromWO: (woId: string) => Promise<TaskOrder[]>;
  getAvailableOperators: (workcenterId: string, teamId?: string) => Promise<any[]>;
  getAvailableEquipment: (workcenterId: string) => Promise<any[]>;
  getOperatorTasks: (operatorId: string, status?: string) => Promise<TaskOrder[]>;
  getWorkcenterTasks: (workcenterId: string, status?: string) => Promise<TaskOrder[]>;

  // State setters
  setFilters: (filters: Partial<TaskOrderQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentTaskOrder: (taskOrder: TaskOrder | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  assignTaskOrder: (id: string, operatorId: string, workcenterId?: string) => Promise<void>;
  startTaskOrder: (id: string) => Promise<void>;
  completeTaskOrder: (id: string, quantity?: number, qualifiedQty?: number, unqualifiedQty?: number, scrapQty?: number) => Promise<void>;
  pauseTaskOrder: (id: string) => Promise<void>;
  resumeTaskOrder: (id: string) => Promise<void>;
  cancelTaskOrder: (id: string, reason?: string) => Promise<void>;
}

// 创建Zustand Store
export const useTaskOrderStore = create<TaskOrderStore>()(immer(
  (set, get) => ({
    // 初始状态
    taskOrders: DEFAULT_TASK_ORDERS,
    selectedIds: [],
    currentTaskOrder: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_TASK_ORDERS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadTaskOrders: async (query?: TaskOrderQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: TaskOrderQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await taskOrderApi.getTaskOrders(finalQuery);

        set({
          taskOrders: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载生产任务单列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllTaskOrders: async () => {
      try {
        const taskOrders = await taskOrderApi.getAllTaskOrders();
        set({ taskOrders });
      } catch (error: any) {
        console.error('加载所有生产任务单失败:', error);
        set({ error: error?.message || '加载生产任务单列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await taskOrderApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载生产任务单统计失败:', error);
      }
    },

    getTaskOrderById: async (id: string) => {
      set({ loading: true, error: null });

      try {
        const taskOrder = await taskOrderApi.getTaskOrderById(id);
        set({ currentTaskOrder: taskOrder, loading: false });
        return taskOrder;
      } catch (error: any) {
        set({
          error: error?.message || '加载生产任务单详情失败',
          loading: false,
        });
        throw error;
      }
    },

    getTaskOrderByNo: async (taskNo: string) => {
      set({ loading: true, error: null });

      try {
        const taskOrder = await taskOrderApi.getTaskOrderByNo(taskNo);
        set({ currentTaskOrder: taskOrder, loading: false });
        return taskOrder;
      } catch (error: any) {
        set({
          error: error?.message || '加载生产任务单详情失败',
          loading: false,
        });
        throw error;
      }
    },

    createTaskOrder: async (data: CreateTaskOrderDTO) => {
      set({ loading: true, error: null });

      try {
        const newTaskOrder = await taskOrderApi.createTaskOrder(data);

        set(state => {
          state.taskOrders.unshift(newTaskOrder);
          state.pagination.total += 1;
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建生产任务单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateTaskOrder: async (data: UpdateTaskOrderDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedTaskOrder = await taskOrderApi.updateTaskOrder(data);

        set(state => {
          const index = state.taskOrders.findIndex(to => to.id === data.id);
          if (index !== -1) {
            state.taskOrders[index] = updatedTaskOrder;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新生产任务单失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteTaskOrders: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.deleteTaskOrders(ids);

        set(state => {
          state.taskOrders = state.taskOrders.filter(to => !ids.includes(to.id));
          state.pagination.total -= ids.length;
          state.selectedIds = [];
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '删除生产任务单失败',
          loading: false,
        });
        throw error;
      }
    },

    batchTaskOrders: async (action: TaskOrderBatchAction) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.batchTaskOrders(action);

        // 重新加载列表
        await get().loadTaskOrders();
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

    assignTask: async (id: string, operatorId: string, workcenterId?: string, teamId?: string, equipmentId?: string) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.assignTask(id, operatorId, workcenterId, teamId, equipmentId);

        set(state => {
          const taskOrder = state.taskOrders.find(to => to.id === id);
          if (taskOrder) {
            taskOrder.status = 'ASSIGNED';
            taskOrder.operatorId = operatorId;
            if (workcenterId) taskOrder.workcenterId = workcenterId;
            if (teamId) taskOrder.teamId = teamId;
            if (equipmentId) taskOrder.equipmentId = equipmentId;
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '分配任务失败',
          loading: false,
        });
        throw error;
      }
    },

    startTask: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.startTask(id);

        set(state => {
          const taskOrder = state.taskOrders.find(to => to.id === id);
          if (taskOrder) {
            taskOrder.status = 'IN_PROGRESS';
            taskOrder.actualStartTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '启动任务失败',
          loading: false,
        });
        throw error;
      }
    },

    completeTask: async (id: string, quantity: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.completeTask(id, quantity, qualifiedQty, unqualifiedQty, scrapQty);

        set(state => {
          const taskOrder = state.taskOrders.find(to => to.id === id);
          if (taskOrder) {
            taskOrder.status = 'COMPLETED';
            taskOrder.actualQty = quantity;
            taskOrder.qualifiedQty = qualifiedQty;
            taskOrder.unqualifiedQty = unqualifiedQty;
            taskOrder.scrapQty = scrapQty;
            taskOrder.actualEndTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '完成任务失败',
          loading: false,
        });
        throw error;
      }
    },

    pauseTask: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.pauseTask(id);

        set(state => {
          const taskOrder = state.taskOrders.find(to => to.id === id);
          if (taskOrder) {
            taskOrder.status = 'IN_PROGRESS';
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '暂停任务失败',
          loading: false,
        });
        throw error;
      }
    },

    resumeTask: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.resumeTask(id);

        set(state => {
          const taskOrder = state.taskOrders.find(to => to.id === id);
          if (taskOrder) {
            taskOrder.status = 'IN_PROGRESS';
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '恢复任务失败',
          loading: false,
        });
        throw error;
      }
    },

    cancelTask: async (id: string, reason?: string) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.cancelTask(id, reason);

        set(state => {
          const taskOrder = state.taskOrders.find(to => to.id === id);
          if (taskOrder) {
            taskOrder.status = 'CANCELLED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '取消任务失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });

      try {
        await taskOrderApi.updateStatus(ids, status as any);

        set(state => {
          state.taskOrders.forEach(taskOrder => {
            if (ids.includes(taskOrder.id)) {
              taskOrder.status = status as any;
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
        await taskOrderApi.updatePriority(id, priority as any);

        set(state => {
          const taskOrder = state.taskOrders.find(to => to.id === id);
          if (taskOrder) {
            taskOrder.priority = priority as any;
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

    checkTaskNoExists: async (taskNo: string, excludeId?: string): Promise<boolean> => {
      try {
        return await taskOrderApi.checkTaskNoExists(taskNo, excludeId);
      } catch (error: any) {
        console.error('检查任务单号是否存在失败:', error);
        return false;
      }
    },

    importTaskOrders: async (file: File): Promise<{ success: number; failed: number }> => {
      set({ loading: true, error: null });

      try {
        const result = await taskOrderApi.importTaskOrders(file);
        set({ loading: false });
        // 重新加载列表
        await get().loadTaskOrders();
        return result;
      } catch (error: any) {
        set({
          error: error?.message || '导入生产任务单失败',
          loading: false,
        });
        throw error;
      }
    },

    exportTaskOrders: async (query: TaskOrderQuery): Promise<Blob> => {
      try {
        return await taskOrderApi.exportTaskOrders(query);
      } catch (error: any) {
        console.error('导出生产任务单失败:', error);
        throw error;
      }
    },

    generateFromWO: async (woId: string): Promise<TaskOrder[]> => {
      set({ loading: true, error: null });

      try {
        const taskOrders = await taskOrderApi.generateFromWO(woId);
        set({ loading: false });
        // 重新加载列表
        await get().loadTaskOrders();
        return taskOrders;
      } catch (error: any) {
        set({
          error: error?.message || '生成任务单失败',
          loading: false,
        });
        throw error;
      }
    },

    getAvailableOperators: async (workcenterId: string, teamId?: string): Promise<any[]> => {
      try {
        return await taskOrderApi.getAvailableOperators(workcenterId, teamId);
      } catch (error: any) {
        console.error('获取可用操作员失败:', error);
        return [];
      }
    },

    getAvailableEquipment: async (workcenterId: string): Promise<any[]> => {
      try {
        return await taskOrderApi.getAvailableEquipment(workcenterId);
      } catch (error: any) {
        console.error('获取可用设备失败:', error);
        return [];
      }
    },

    getOperatorTasks: async (operatorId: string, status?: string): Promise<TaskOrder[]> => {
      try {
        return await taskOrderApi.getOperatorTasks(operatorId, status);
      } catch (error: any) {
        console.error('获取操作员任务失败:', error);
        return [];
      }
    },

    getWorkcenterTasks: async (workcenterId: string, status?: string): Promise<TaskOrder[]> => {
      try {
        return await taskOrderApi.getWorkcenterTasks(workcenterId, status);
      } catch (error: any) {
        console.error('获取工作中心任务失败:', error);
        return [];
      }
    },

    // State setters
    setFilters: (filters: Partial<TaskOrderQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1; // 重置到第一页
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentTaskOrder: (taskOrder: TaskOrder | null) => {
      set({ currentTaskOrder: taskOrder });
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
        taskOrders: DEFAULT_TASK_ORDERS,
        selectedIds: [],
        currentTaskOrder: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_TASK_ORDERS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    assignTaskOrder: async (id: string, operatorId: string, workcenterId?: string) => { await get().assignTask(id, operatorId, workcenterId); },
    startTaskOrder: async (id: string) => { await get().startTask(id); },
    completeTaskOrder: async (id: string, quantity?: number, qualifiedQty?: number, unqualifiedQty?: number, scrapQty?: number) => { await get().completeTask(id, quantity || 0, qualifiedQty || 0, unqualifiedQty || 0, scrapQty || 0); },
    pauseTaskOrder: async (id: string) => { await get().pauseTask(id); },
    resumeTaskOrder: async (id: string) => { await get().resumeTask(id); },
    cancelTaskOrder: async (id: string, reason?: string) => { await get().cancelTask(id, reason); },
  })
));
