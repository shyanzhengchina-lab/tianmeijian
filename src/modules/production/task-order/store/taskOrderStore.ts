/**
 * 生产任务单模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import { taskOrderApi } from '../api';
import type {
  TaskOrder,
  TaskOrderQuery,
  CreateTaskOrderDTO,
  UpdateTaskOrderDTO,
  TaskOrderOperationDTO,
  AssignTaskOrderDTO,
  AdjustTaskOrderDTO,
  ReportExceptionDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';

/**
 * TaskOrder Store状态接口
 */
export interface TaskOrderState {
  // 任务单列表状态
  taskOrders: TaskOrder[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: TaskOrderQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedTaskIds: string[];
  selectedTasks: TaskOrder[];

  // 详情状态
  currentTask: TaskOrder | null;
  showTaskDetail: boolean;

  // 批量操作状态
  batchOperationLoading: boolean;

  // 操作状态
  operatingTask: TaskOrder | null;
  operationLoading: boolean;

  // UI状态
  activeTab: 'list' | 'detail' | 'execution';
  showCreateModal: boolean;
  showEditModal: boolean;
  showAssignModal: boolean;
  showAdjustModal: boolean;
  showExceptionModal: boolean;

  // Actions
  setTaskOrders: (tasks: TaskOrder[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<TaskOrderQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedTaskIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentTask: (task: TaskOrder | null) => void;
  setShowTaskDetail: (show: boolean) => void;

  // 任务单操作
  loadTaskOrders: () => Promise<void>;
  refreshTaskOrders: () => Promise<void>;
  createTaskOrder: (data: CreateTaskOrderDTO) => Promise<void>;
  updateTaskOrder: (data: UpdateTaskOrderDTO) => Promise<void>;
  deleteTaskOrders: (ids: string[]) => Promise<void>;

  // 任务单操作
  startTask: (data: TaskOrderOperationDTO) => Promise<void>;
  completeTask: (data: TaskOrderOperationDTO) => Promise<void>;
  suspendTask: (data: TaskOrderOperationDTO) => Promise<void>;
  resumeTask: (data: TaskOrderOperationDTO) => Promise<void>;
  cancelTask: (data: TaskOrderOperationDTO) => Promise<void>;

  // 其他操作
  assignTask: (data: AssignTaskOrderDTO) => Promise<void>;
  adjustTask: (data: AdjustTaskOrderDTO) => Promise<void>;
  reportException: (data: ReportExceptionDTO) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'list' | 'detail' | 'execution') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowAssignModal: (show: boolean) => void;
  setShowAdjustModal: (show: boolean) => void;
  setShowExceptionModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * TaskOrder Store
 */
export const useTaskOrderStore = create<TaskOrderState>()(
  persist(
    (set, get) => ({
      // 初始状态
      taskOrders: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedTaskIds: [],
      selectedTasks: [],
      currentTask: null,
      showTaskDetail: false,
      batchOperationLoading: false,
      operatingTask: null,
      operationLoading: false,
      activeTab: 'list',
      showCreateModal: false,
      showEditModal: false,
      showAssignModal: false,
      showAdjustModal: false,
      showExceptionModal: false,

      /**
       * 设置任务单列表数据
       */
      setTaskOrders: (tasks: TaskOrder[], total: number) => {
        set({ taskOrders: tasks, total, error: null });
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
      setQuery: (query: Partial<TaskOrderQuery>) => {
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
       * 设置选中任务单ID列表
       */
      setSelectedTaskIds: (ids: string[]) => {
        const { taskOrders } = get();
        const selectedTasks = taskOrders.filter(t => ids.includes(t.id));
        set({ selectedTaskIds: ids, selectedTasks });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedTaskIds: [],
          selectedTasks: [],
        });
      },

      /**
       * 设置当前任务单
       */
      setCurrentTask: (task: TaskOrder | null) => {
        set({ currentTask: task });
      },

      /**
       * 显示任务单详情
       */
      setShowTaskDetail: (show: boolean) => {
        set({ showTaskDetail: show });
      },

      /**
       * 加载任务单列表
       */
      loadTaskOrders: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const result = await taskOrderApi.getTaskOrders(query);
          set({
            taskOrders: result.list,
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
       * 刷新任务单列表
       */
      refreshTaskOrders: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const result = await taskOrderApi.getTaskOrders(query);
          set({
            taskOrders: result.list,
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
       * 创建任务单
       */
      createTaskOrder: async (data: CreateTaskOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await taskOrderApi.createTaskOrder(data);
          await get().loadTaskOrders();
          set({ showCreateModal: false });
          message.success('任务单创建成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
          throw error;
        }
      },

      /**
       * 更新任务单
       */
      updateTaskOrder: async (data: UpdateTaskOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await taskOrderApi.updateTaskOrder(data);
          await get().loadTaskOrders();
          set({ showEditModal: false });
          message.success('任务单更新成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
          throw error;
        }
      },

      /**
       * 删除任务单
       */
      deleteTaskOrders: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          await taskOrderApi.deleteTaskOrders(ids);
          await get().loadTaskOrders();
          get().clearSelection();
          message.success(`成功删除 ${ids.length} 个任务单`);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
          throw error;
        }
      },

      /**
       * 开始任务
       */
      startTask: async (data: TaskOrderOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await taskOrderApi.startTask(data.id!);
          await get().loadTaskOrders();
          message.success('任务已开始');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '开始任务失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 完成任务
       */
      completeTask: async (data: TaskOrderOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await taskOrderApi.completeTask(
            data.id!,
            data.completedQuantity || 0,
            data.qualifiedQuantity || 0,
            data.unqualifiedQuantity || 0,
            data.scrapQuantity || 0
          );
          await get().loadTaskOrders();
          message.success('任务已完成');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '完成任务失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 暂停任务
       */
      suspendTask: async (data: TaskOrderOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await taskOrderApi.pauseTask(data.id!);
          await get().loadTaskOrders();
          message.success('任务已暂停');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '暂停任务失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 恢复任务
       */
      resumeTask: async (data: TaskOrderOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await taskOrderApi.resumeTask(data.id!);
          await get().loadTaskOrders();
          message.success('任务已恢复');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '恢复任务失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 取消任务
       */
      cancelTask: async (data: TaskOrderOperationDTO) => {
        set({ operationLoading: true, error: null });

        try {
          await taskOrderApi.cancelTask(data.id!, data.remark);
          await get().loadTaskOrders();
          message.success('任务已取消');
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '取消任务失败',
          });
          throw error;
        } finally {
          set({ operationLoading: false });
        }
      },

      /**
       * 分配任务
       */
      assignTask: async (data: AssignTaskOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await taskOrderApi.assignTask(
            data.id!,
            data.assignedTo ?? '',
            data.workcenterId,
            data.teamId,
            data.equipmentId
          );
          await get().loadTaskOrders();
          set({ showAssignModal: false });
          message.success('任务分配成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '分配失败',
          });
          throw error;
        }
      },

      /**
       * 调整任务
       */
      adjustTask: async (data: AdjustTaskOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await taskOrderApi.updateTaskOrder(data as any);
          await get().loadTaskOrders();
          set({ showAdjustModal: false });
          message.success('任务调整成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '调整失败',
          });
          throw error;
        }
      },

      /**
       * 报告异常
       */
      reportException: async (data: ReportExceptionDTO) => {
        set({ loading: true, error: null });

        try {
          // 使用更新任务接口来记录异常信息
          await taskOrderApi.updateTaskOrder({
            id: data.id,
            remark: data.exceptionDetails,
          } as any);
          await get().loadTaskOrders();
          set({ showExceptionModal: false });
          message.success('异常已报告！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '报告失败',
          });
          throw error;
        }
      },

      /**
       * 设置活动标签页
       */
      setActiveTab: (tab: 'list' | 'detail' | 'execution') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentTask: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示分配弹窗
       */
      setShowAssignModal: (show: boolean) => {
        set({ showAssignModal: show });
      },

      /**
       * 显示调整弹窗
       */
      setShowAdjustModal: (show: boolean) => {
        set({ showAdjustModal: show });
      },

      /**
       * 显示异常弹窗
       */
      setShowExceptionModal: (show: boolean) => {
        set({ showExceptionModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          taskOrders: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedTaskIds: [],
          selectedTasks: [],
          currentTask: null,
          showTaskDetail: false,
          batchOperationLoading: false,
          operatingTask: null,
          operationLoading: false,
          activeTab: 'list',
          showCreateModal: false,
          showEditModal: false,
          showAssignModal: false,
          showAdjustModal: false,
          showExceptionModal: false,
        });
      },
    }),
    {
      name: 'taskorder-store',
      // 只持久化核心状态
      partialize: (state) => ({
        taskOrders: state.taskOrders,
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useTaskOrderStore;