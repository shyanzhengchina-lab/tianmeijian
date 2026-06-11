/**
 * 工序执行模块Zustand Store
 * 管理工序执行的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { padExecutionApi } from './api';
import { DEFAULT_PAD_EXECUTION_TASKS } from './types';
import type {
  PadExecutionTask,
  PadExecutionTaskQuery,
  CreatePadExecutionTaskDTO,
  UpdatePadExecutionTaskDTO,
  PadExecutionBatchAction,
  OperationRecord,
  RealtimeParameter,
  ExecutionLog,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface PadExecutionStore {
  // State
  padExecutionTasks: PadExecutionTask[];
  operationRecords: OperationRecord[];
  realtimeParameters: RealtimeParameter[];
  executionLogs: ExecutionLog[];
  currentTask: PadExecutionTask | null;
  selectedIds: string[];
  filters: PadExecutionTaskQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    pendingCount: number;
    runningCount: number;
    pausedCount: number;
    completedCount: number;
    cancelledCount: number;
    modeStats: Record<string, number>;
  } | null;

  // Actions
  loadPadExecutionTasks: (query?: PadExecutionTaskQuery) => Promise<void>;
  loadAllPadExecutionTasks: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  getPadExecutionTaskById: (id: string) => Promise<PadExecutionTask>;
  getOperatorTasks: (operatorId: string, status?: string) => Promise<PadExecutionTask[]>;
  getCurrentTask: (operatorId: string) => Promise<PadExecutionTask | null>;
  createPadExecutionTask: (data: CreatePadExecutionTaskDTO) => Promise<void>;
  updatePadExecutionTask: (data: UpdatePadExecutionTaskDTO) => Promise<void>;
  batchPadExecutionTasks: (action: PadExecutionBatchAction) => Promise<void>;
  startExecution: (id: string) => Promise<void>;
  pauseExecution: (id: string, reason?: string) => Promise<void>;
  resumeExecution: (id: string) => Promise<void>;
  completeExecution: (id: string, actualQty: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number) => Promise<void>;
  cancelExecution: (id: string, reason?: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  updateQuantity: (id: string, actualQty: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number) => Promise<void>;
  updateExecutionMode: (id: string, executionMode: string) => Promise<void>;
  getOperationRecords: (taskId: string) => Promise<OperationRecord[]>;
  addOperationRecord: (taskId: string, record: Omit<OperationRecord, 'id' | 'taskId'>) => Promise<void>;
  getRealtimeParameters: (taskId: string) => Promise<RealtimeParameter[]>;
  updateRealtimeParameter: (taskId: string, parameter: RealtimeParameter) => Promise<void>;
  getExecutionLogs: (taskId: string) => Promise<ExecutionLog[]>;
  addExecutionLog: (taskId: string, log: Omit<ExecutionLog, 'id' | 'taskId'>) => Promise<void>;
  getOperatorStatistics: (operatorId: string) => Promise<any>;
  importPadExecutionTasks: (file: File) => Promise<{ success: number; failed: number }>;
  exportPadExecutionTasks: (query: PadExecutionTaskQuery) => Promise<Blob>;
  exportOperationRecords: (taskId: string) => Promise<Blob>;
  exportExecutionLogs: (taskId: string) => Promise<Blob>;
  acceptTask: (taskId: string, operatorId: string) => Promise<void>;
  abandonTask: (taskId: string, reason?: string) => Promise<void>;
  transferTask: (taskId: string, newOperatorId: string, newOperatorName: string) => Promise<void>;
  requestQc: (taskId: string) => Promise<void>;
  reportAnomaly: (taskId: string, anomalyType: string, anomalyDescription: string) => Promise<void>;
  getSOP: (stepCode: string) => Promise<any>;

  // State setters
  setFilters: (filters: Partial<PadExecutionTaskQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentTask: (task: PadExecutionTask | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Aliases for backward compatibility
  padTasks: PadExecutionTask[];
  currentPadTask: PadExecutionTask | null;
  loadPadTasks: (query?: PadExecutionTaskQuery) => Promise<void>;
  createPadTask: (data: CreatePadExecutionTaskDTO) => Promise<void>;
  updatePadTask: (id: string, data: Partial<UpdatePadExecutionTaskDTO>) => Promise<void>;
  deletePadTasks: (ids: string[]) => Promise<void>;
  startPadTask: (id: string) => Promise<void>;
  pausePadTask: (id: string, reason?: string) => Promise<void>;
  resumePadTask: (id: string) => Promise<void>;
  completePadTask: (id: string, actualQty?: number, qualifiedQty?: number, unqualifiedQty?: number, scrapQty?: number) => Promise<void>;
  cancelPadTask: (id: string, reason?: string) => Promise<void>;
  exportPadTasks: (query: PadExecutionTaskQuery) => Promise<Blob>;
  setCurrentPadTask: (task: PadExecutionTask | null) => void;
}

// 创建Zustand Store
export const usePadExecutionStore = create<PadExecutionStore>()(immer(
  (set, get) => ({
    // 初始状态
    padExecutionTasks: DEFAULT_PAD_EXECUTION_TASKS,
    operationRecords: [],
    realtimeParameters: [],
    executionLogs: [],
    currentTask: null,
    selectedIds: [],
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_PAD_EXECUTION_TASKS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadPadExecutionTasks: async (query?: PadExecutionTaskQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: PadExecutionTaskQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await padExecutionApi.getPadExecutionTasks(finalQuery);

        set({
          padExecutionTasks: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载工序执行任务列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllPadExecutionTasks: async () => {
      try {
        const padExecutionTasks = await padExecutionApi.getAllPadExecutionTasks();
        set({ padExecutionTasks });
      } catch (error: any) {
        console.error('加载所有工序执行任务失败:', error);
        set({ error: error?.message || '加载工序执行任务列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await padExecutionApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载工序执行统计失败:', error);
      }
    },

    getPadExecutionTaskById: async (id: string) => {
      set({ loading: true, error: null });

      try {
        const padExecutionTask = await padExecutionApi.getPadExecutionTaskById(id);
        set({ currentTask: padExecutionTask, loading: false });
        return padExecutionTask;
      } catch (error: any) {
        set({
          error: error?.message || '加载工序执行任务详情失败',
          loading: false,
        });
        throw error;
      }
    },

    getOperatorTasks: async (operatorId: string, status?: string) => {
      try {
        const operatorTasks = await padExecutionApi.getOperatorTasks(operatorId, status);
        set({ padExecutionTasks: operatorTasks });
        return operatorTasks;
      } catch (error: any) {
        console.error('加载操作员任务失败:', error);
        set({ error: error?.message || '加载操作员任务失败' });
        return [];
      }
    },

    getCurrentTask: async (operatorId: string) => {
      try {
        const currentTask = await padExecutionApi.getCurrentTask(operatorId);
        set({ currentTask });
        return currentTask;
      } catch (error: any) {
        console.error('获取当前任务失败:', error);
        return null;
      }
    },

    createPadExecutionTask: async (data: CreatePadExecutionTaskDTO) => {
      set({ loading: true, error: null });

      try {
        const newPadExecutionTask = await padExecutionApi.createPadExecutionTask(data);

        set(state => {
          state.padExecutionTasks.unshift(newPadExecutionTask);
          state.pagination.total += 1;
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建工序执行任务失败',
          loading: false,
        });
        throw error;
      }
    },

    updatePadExecutionTask: async (data: UpdatePadExecutionTaskDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedPadExecutionTask = await padExecutionApi.updatePadExecutionTask(data);

        set(state => {
          const index = state.padExecutionTasks.findIndex(task => task.id === data.id);
          if (index !== -1) {
            state.padExecutionTasks[index] = updatedPadExecutionTask;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新工序执行任务失败',
          loading: false,
        });
        throw error;
      }
    },

    batchPadExecutionTasks: async (action: PadExecutionBatchAction) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.batchPadExecutionTasks(action);

        // 重新加载列表
        await get().loadPadExecutionTasks();
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

    startExecution: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.startExecution(id);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === id);
          if (task) {
            task.status = 'RUNNING';
            task.actualStartTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '开始执行任务失败',
          loading: false,
        });
        throw error;
      }
    },

    pauseExecution: async (id: string, reason?: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.pauseExecution(id, reason);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === id);
          if (task) {
            task.status = 'PAUSED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '暂停执行任务失败',
          loading: false,
        });
        throw error;
      }
    },

    resumeExecution: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.resumeExecution(id);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === id);
          if (task) {
            task.status = 'RUNNING';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '恢复执行任务失败',
          loading: false,
        });
        throw error;
      }
    },

    completeExecution: async (id: string, actualQty: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.completeExecution(id, actualQty, qualifiedQty, unqualifiedQty, scrapQty);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === id);
          if (task) {
            task.status = 'COMPLETED';
            task.actualQty = actualQty;
            task.qualifiedQty = qualifiedQty;
            task.unqualifiedQty = unqualifiedQty;
            task.scrapQty = scrapQty;
            task.actualEndTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '完成执行任务失败',
          loading: false,
        });
        throw error;
      }
    },

    cancelExecution: async (id: string, reason?: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.cancelExecution(id, reason);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === id);
          if (task) {
            task.status = 'CANCELLED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '取消执行任务失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.updateStatus(ids, status);

        set(state => {
          state.padExecutionTasks.forEach(task => {
            if (ids.includes(task.id)) {
              task.status = status as any;
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
        await padExecutionApi.updateQuantity(id, actualQty, qualifiedQty, unqualifiedQty, scrapQty);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === id);
          if (task) {
            task.actualQty = actualQty;
            task.qualifiedQty = qualifiedQty;
            task.unqualifiedQty = unqualifiedQty;
            task.scrapQty = scrapQty;
            task.progress = Math.round((actualQty / task.planQty) * 100);
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

    updateExecutionMode: async (id: string, executionMode: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.updateExecutionMode(id, executionMode);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === id);
          if (task) {
            task.executionMode = executionMode as any;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新执行模式失败',
          loading: false,
        });
        throw error;
      }
    },

    getOperationRecords: async (taskId: string): Promise<OperationRecord[]> => {
      try {
        const operationRecords = await padExecutionApi.getOperationRecords(taskId);
        set({ operationRecords });
        return operationRecords;
      } catch (error: any) {
        console.error('获取操作记录失败:', error);
        return [];
      }
    },

    addOperationRecord: async (taskId: string, record: Omit<OperationRecord, 'id' | 'taskId'>) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.addOperationRecord(taskId, record);
        // 重新加载操作记录
        await get().getOperationRecords(taskId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加操作记录失败',
          loading: false,
        });
        throw error;
      }
    },

    getRealtimeParameters: async (taskId: string): Promise<RealtimeParameter[]> => {
      try {
        const realtimeParameters = await padExecutionApi.getRealtimeParameters(taskId);
        set({ realtimeParameters });
        return realtimeParameters;
      } catch (error: any) {
        console.error('获取实时参数失败:', error);
        return [];
      }
    },

    updateRealtimeParameter: async (taskId: string, parameter: RealtimeParameter) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.updateRealtimeParameter(taskId, parameter);
        // 重新加载实时参数
        await get().getRealtimeParameters(taskId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '更新实时参数失败',
          loading: false,
        });
        throw error;
      }
    },

    getExecutionLogs: async (taskId: string): Promise<ExecutionLog[]> => {
      try {
        const executionLogs = await padExecutionApi.getExecutionLogs(taskId);
        set({ executionLogs });
        return executionLogs;
      } catch (error: any) {
        console.error('获取执行日志失败:', error);
        return [];
      }
    },

    addExecutionLog: async (taskId: string, log: Omit<ExecutionLog, 'id' | 'taskId'>) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.addExecutionLog(taskId, log);
        // 重新加载执行日志
        await get().getExecutionLogs(taskId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加执行日志失败',
          loading: false,
        });
        throw error;
      }
    },

    getOperatorStatistics: async (operatorId: string): Promise<any> => {
      try {
        return await padExecutionApi.getOperatorStatistics(operatorId);
      } catch (error: any) {
        console.error('获取操作员统计失败:', error);
        return null;
      }
    },

    importPadExecutionTasks: async (file: File): Promise<{ success: number; failed: number }> => {
      set({ loading: true, error: null });

      try {
        const result = await padExecutionApi.importPadExecutionTasks(file);
        set({ loading: false });
        // 重新加载列表
        await get().loadPadExecutionTasks();
        return result;
      } catch (error: any) {
        set({
          error: error?.message || '导入工序执行任务失败',
          loading: false,
        });
        throw error;
      }
    },

    exportPadExecutionTasks: async (query: PadExecutionTaskQuery): Promise<Blob> => {
      try {
        return await padExecutionApi.exportPadExecutionTasks(query);
      } catch (error: any) {
        console.error('导出工序执行任务失败:', error);
        throw error;
      }
    },

    exportOperationRecords: async (taskId: string): Promise<Blob> => {
      try {
        return await padExecutionApi.exportOperationRecords(taskId);
      } catch (error: any) {
        console.error('导出操作记录失败:', error);
        throw error;
      }
    },

    exportExecutionLogs: async (taskId: string): Promise<Blob> => {
      try {
        return await padExecutionApi.exportExecutionLogs(taskId);
      } catch (error: any) {
        console.error('导出执行日志失败:', error);
        throw error;
      }
    },

    acceptTask: async (taskId: string, operatorId: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.acceptTask(taskId, operatorId);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === taskId);
          if (task) {
            task.operatorId = operatorId;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '接收任务失败',
          loading: false,
        });
        throw error;
      }
    },

    abandonTask: async (taskId: string, reason?: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.abandonTask(taskId, reason);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === taskId);
          if (task) {
            task.operatorId = '';
            task.operatorName = '';
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '放弃任务失败',
          loading: false,
        });
        throw error;
      }
    },

    transferTask: async (taskId: string, newOperatorId: string, newOperatorName: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.transferTask(taskId, newOperatorId, newOperatorName);

        set(state => {
          const task = state.padExecutionTasks.find(task => task.id === taskId);
          if (task) {
            task.operatorId = newOperatorId;
            task.operatorName = newOperatorName;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '转移任务失败',
          loading: false,
        });
        throw error;
      }
    },

    requestQc: async (taskId: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.requestQc(taskId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '请求质检失败',
          loading: false,
        });
        throw error;
      }
    },

    reportAnomaly: async (taskId: string, anomalyType: string, anomalyDescription: string) => {
      set({ loading: true, error: null });

      try {
        await padExecutionApi.reportAnomaly(taskId, anomalyType, anomalyDescription);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '报告异常失败',
          loading: false,
        });
        throw error;
      }
    },

    getSOP: async (stepCode: string): Promise<any> => {
      try {
        return await padExecutionApi.getSOP(stepCode);
      } catch (error: any) {
        console.error('获取SOP失败:', error);
        return null;
      }
    },

    // State setters
    setFilters: (filters: Partial<PadExecutionTaskQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1; // 重置到第一页
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentTask: (task: PadExecutionTask | null) => {
      set({ currentTask: task });
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
        padExecutionTasks: DEFAULT_PAD_EXECUTION_TASKS,
        operationRecords: [],
        realtimeParameters: [],
        executionLogs: [],
        currentTask: null,
        selectedIds: [],
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_PAD_EXECUTION_TASKS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // Aliases for backward compatibility
    get padTasks() { return get().padExecutionTasks; },
    get currentPadTask() { return get().currentTask; },
    loadPadTasks: async (query?: PadExecutionTaskQuery) => { await get().loadPadExecutionTasks(query); },
    createPadTask: async (data: CreatePadExecutionTaskDTO) => { await get().createPadExecutionTask(data); },
    updatePadTask: async (id: string, data: Partial<UpdatePadExecutionTaskDTO>) => { await get().updatePadExecutionTask({ id, ...data } as UpdatePadExecutionTaskDTO); },
    deletePadTasks: async (ids: string[]) => { await get().batchPadExecutionTasks({ action: 'cancel' as any, ids }); },
    startPadTask: async (id: string) => { await get().startExecution(id); },
    pausePadTask: async (id: string, reason?: string) => { await get().pauseExecution(id, reason); },
    resumePadTask: async (id: string) => { await get().resumeExecution(id); },
    completePadTask: async (id: string, actualQty?: number, qualifiedQty?: number, unqualifiedQty?: number, scrapQty?: number) => { await get().completeExecution(id, actualQty || 0, qualifiedQty || 0, unqualifiedQty || 0, scrapQty || 0); },
    cancelPadTask: async (id: string, reason?: string) => { await get().cancelExecution(id, reason); },
    exportPadTasks: async (query: PadExecutionTaskQuery) => { return await get().exportPadExecutionTasks(query); },
    setCurrentPadTask: (task: PadExecutionTask | null) => { get().setCurrentTask(task); },
  })
));
