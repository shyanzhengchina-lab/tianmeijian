/**
 * 生产工单模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import { workOrderApi } from '../../work-order/api';
import { taskOrderApi } from '../../task-order/api';
import type {
  WorkOrder,
  TaskOrder,
  WorkOrderQuery,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO,
  WorkOrderStatistics,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';

/**
 * WorkOrder Store状态接口
 */
export interface WorkOrderState {
  // 工单列表状态
  workOrders: WorkOrder[];
  total: number;
  loading: boolean;
  error: string | null;

  // 任务单列表状态
  taskOrders: TaskOrder[];
  taskTotal: number;
  taskLoading: boolean;
  taskError: string | null;

  // 查询状态
  query: WorkOrderQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedWorkOrderIds: string[];
  selectedWorkOrders: WorkOrder[];
  selectedTaskOrderIds: string[];
  selectedTaskOrders: TaskOrder[];

  // 详情状态
  currentWorkOrder: WorkOrder | null;
  currentTaskOrder: TaskOrder | null;
  showWorkOrderDetail: boolean;
  showTaskOrderDetail: boolean;

  // 统计数据
  statistics: WorkOrderStatistics | null;

  // UI状态
  activeTab: 'workorder' | 'taskorder';
  showCreateModal: boolean;
  showEditModal: boolean;
  showReleaseModal: boolean;
  showPauseModal: boolean;

  // Actions
  setWorkOrders: (workOrders: WorkOrder[], total: number) => void;
  setTaskOrders: (taskOrders: TaskOrder[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<WorkOrderQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedWorkOrderIds: (ids: string[]) => void;
  setSelectedTaskOrderIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentWorkOrder: (workOrder: WorkOrder | null) => void;
  setCurrentTaskOrder: (taskOrder: TaskOrder | null) => void;
  setShowWorkOrderDetail: (show: boolean) => void;
  setShowTaskOrderDetail: (show: boolean) => void;

  // 工单操作
  loadWorkOrders: () => Promise<void>;
  refreshWorkOrders: () => Promise<void>;
  createWorkOrder: (data: CreateWorkOrderDTO) => Promise<void>;
  updateWorkOrder: (data: UpdateWorkOrderDTO) => Promise<void>;
  deleteWorkOrders: (ids: string[]) => Promise<void>;
  batchReleaseWorkOrders: (ids: string[]) => Promise<void>;
  batchPauseWorkOrders: (ids: string[]) => Promise<void>;
  batchResumeWorkOrders: (ids: string[]) => Promise<void>;
  batchCancelWorkOrders: (ids: string[]) => Promise<void>;
  updateWorkOrderStatus: (id: string, status: string) => Promise<void>;

  // 任务单操作
  loadTaskOrders: (woId: string) => Promise<void>;
  createTaskOrder: (data: any) => Promise<void>;
  updateTaskOrder: (data: any) => Promise<void>;
  deleteTaskOrders: (ids: string[]) => Promise<void>;
  updateTaskOrderStatus: (id: string, status: string) => Promise<void>;
  reportWorkOrderProgress: (taskId: string, progress: number, qty: number) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'workorder' | 'taskorder') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowReleaseModal: (show: boolean) => void;
  setShowPauseModal: (show: boolean) => void;

  // 统计
  loadStatistics: () => Promise<void>;
}

/**
 * WorkOrder Store
 */
export const useWorkOrderStore = create<WorkOrderState>()(
  persist(
    (set, get) => ({
      // 初始状态
      workOrders: [],
      total: 0,
      loading: false,
      error: null,

      taskOrders: [],
      taskTotal: 0,
      taskLoading: false,
      taskError: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedWorkOrderIds: [],
      selectedWorkOrders: [],
      selectedTaskOrderIds: [],
      selectedTaskOrders: [],
      currentWorkOrder: null,
      currentTaskOrder: null,
      showWorkOrderDetail: false,
      showTaskOrderDetail: false,
      statistics: null,

      activeTab: 'workorder',
      showCreateModal: false,
      showEditModal: false,
      showReleaseModal: false,
      showPauseModal: false,

      /**
       * 设置工单列表数据
       */
      setWorkOrders: (workOrders: WorkOrder[], total: number) => {
        set({ workOrders, total, error: null });
      },

      /**
       * 设置任务单列表数据
       */
      setTaskOrders: (taskOrders: TaskOrder[], total: number) => {
        set({ taskOrders, taskTotal: total, taskError: null });
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
      setQuery: (query: Partial<WorkOrderQuery>) => {
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
       * 设置选中工单ID列表
       */
      setSelectedWorkOrderIds: (ids: string[]) => {
        const { workOrders } = get();
        const selectedWorkOrders = workOrders.filter(wo => ids.includes(wo.id));
        set({ selectedWorkOrderIds: ids, selectedWorkOrders });
      },

      /**
       * 设置选中任务单ID列表
       */
      setSelectedTaskOrderIds: (ids: string[]) => {
        const { taskOrders } = get();
        const selectedTaskOrders = taskOrders.filter(to => ids.includes(to.id));
        set({ selectedTaskOrderIds: ids, selectedTaskOrders });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedWorkOrderIds: [],
          selectedWorkOrders: [],
          selectedTaskOrderIds: [],
          selectedTaskOrders: [],
        });
      },

      /**
       * 设置当前工单
       */
      setCurrentWorkOrder: (workOrder: WorkOrder | null) => {
        set({ currentWorkOrder: workOrder });
      },

      /**
       * 设置当前任务单
       */
      setCurrentTaskOrder: (taskOrder: TaskOrder | null) => {
        set({ currentTaskOrder: taskOrder });
      },

      /**
       * 显示工单详情
       */
      setShowWorkOrderDetail: (show: boolean) => {
        set({ showWorkOrderDetail: show });
      },

      /**
       * 显示任务单详情
       */
      setShowTaskOrderDetail: (show: boolean) => {
        set({ showTaskOrderDetail: show });
      },

      /**
       * 加载工单列表
       */
      loadWorkOrders: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const result = await workOrderApi.getWorkOrders(query as any);
          set({
            workOrders: result.list as any[],
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
       * 刷新工单列表
       */
      refreshWorkOrders: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const result = await workOrderApi.getWorkOrders(query as any);
          set({
            workOrders: result.list as any[],
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
       * 创建工单
       */
      createWorkOrder: async (data: CreateWorkOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await workOrderApi.createWorkOrder(data as any);
          await get().loadWorkOrders();
          set({ showCreateModal: false });
          message.success('工单创建成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
          throw error;
        }
      },

      /**
       * 更新工单
       */
      updateWorkOrder: async (data: UpdateWorkOrderDTO) => {
        set({ loading: true, error: null });

        try {
          await workOrderApi.updateWorkOrder(data);
          await get().loadWorkOrders();
          set({ showEditModal: false, currentWorkOrder: null });
          message.success('工单更新成功！');
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
          throw error;
        }
      },

      /**
       * 删除工单
       */
      deleteWorkOrders: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          await workOrderApi.deleteWorkOrders(ids);
          await get().loadWorkOrders();
          set({ selectedWorkOrderIds: [] });
          message.success(`成功删除 ${ids.length} 个工单`);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
          throw error;
        }
      },

      /**
       * 批量下发工单
       */
      batchReleaseWorkOrders: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          for (const id of ids) {
            await workOrderApi.releaseWorkOrder(id);
          }
          await get().loadWorkOrders();
          set({ showReleaseModal: false });
          message.success(`成功下发 ${ids.length} 个工单`);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '下发失败',
          });
          throw error;
        }
      },

      /**
       * 批量暂停工单
       */
      batchPauseWorkOrders: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          for (const id of ids) {
            await workOrderApi.suspendWorkOrder(id);
          }
          await get().loadWorkOrders();
          set({ showPauseModal: false });
          message.success(`成功暂停 ${ids.length} 个工单`);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '暂停失败',
          });
          throw error;
        }
      },

      /**
       * 批量恢复工单
       */
      batchResumeWorkOrders: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          for (const id of ids) {
            await workOrderApi.resumeWorkOrder(id);
          }
          await get().loadWorkOrders();
          message.success(`成功恢复 ${ids.length} 个工单`);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '恢复失败',
          });
          throw error;
        }
      },

      /**
       * 批量取消工单
       */
      batchCancelWorkOrders: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API批量取消
          // const response = await workOrderApi.batchCancel(ids);

          // if (response.code === 200) {
          //   await get().loadWorkOrders();
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '取消失败',
          //   });
          // }

          setTimeout(() => {
            message.success(`成功取消 ${ids.length} 个工单`);
            set({ loading: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '取消失败',
          });
        }
      },

      /**
       * 更新工单状态
       */
      updateWorkOrderStatus: async (id: string, status: string) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新工单状态
          // const response = await workOrderApi.updateStatus(id, status);

          // if (response.code === 200) {
          //   await get().loadWorkOrders();
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '更新状态失败',
          //   });
          // }

          setTimeout(() => {
            message.success('工单状态更新成功！');
            set({ loading: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新状态失败',
          });
        }
      },

      /**
       * 加载任务单列表
       */
      loadTaskOrders: async (woId: string) => {
        set({ taskLoading: true, taskError: null });

        try {
          // TODO: 调用API加载任务单数据
          // const response = await workOrderApi.getTaskOrders(woId);

          // if (response.code === 200) {
          //   set({
          //     taskOrders: response.data.list,
          //     taskTotal: response.data.total,
          //     taskLoading: false,
          //   });
          // }

          // 模拟加载过程
          setTimeout(() => {
            set({
              taskOrders: [],
              taskTotal: 0,
              taskLoading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            taskLoading: false,
            taskError: error.message || '加载失败',
          });
        }
      },

      /**
       * 创建任务单
       */
      createTaskOrder: async (data: any) => {
        set({ taskLoading: true, taskError: null });

        try {
          // TODO: 调用API创建任务单
          // const response = await workOrderApi.createTaskOrder(data);

          // if (response.code === 200) {
          //   await get().loadTaskOrders(currentWorkOrder?.id);
          //   message.success('任务单创建成功！');
          // } else {
          //   set({
          //     taskLoading: false,
          //     taskError: response.message || '创建失败',
          //   });
          // }

          setTimeout(() => {
            message.success('任务单创建成功！');
            set({ taskLoading: false });
          }, 1000);
        } catch (error: any) {
          set({
            taskLoading: false,
            taskError: error.message || '创建失败',
          });
        }
      },

      /**
       * 更新任务单
       */
      updateTaskOrder: async (data: any) => {
        set({ taskLoading: true, taskError: null });

        try {
          // TODO: 调用API更新任务单
          // const response = await workOrderApi.updateTaskOrder(data);

          // if (response.code === 200) {
          //   await get().loadTaskOrders(currentWorkOrder?.id);
          //   message.success('任务单更新成功！');
          // } else {
          //   set({
          //     taskLoading: false,
          //     taskError: response.message || '更新失败',
          //   });
          // }

          setTimeout(() => {
            message.success('任务单更新成功！');
            set({ taskLoading: false });
          }, 1000);
        } catch (error: any) {
          set({
            taskLoading: false,
            taskError: error.message || '更新失败',
          });
        }
      },

      /**
       * 删除任务单
       */
      deleteTaskOrders: async (ids: string[]) => {
        set({ taskLoading: true, taskError: null });

        try {
          // TODO: 调用API删除任务单
          // const response = await workOrderApi.deleteTaskOrders(ids);

          // if (response.code === 200) {
          //   await get().loadTaskOrders(currentWorkOrder?.id);
          //   set({ selectedTaskOrderIds: [] });
          // } else {
          //   set({
          //     taskLoading: false,
          //     taskError: response.message || '删除失败',
          //   });
          // }

          setTimeout(() => {
            message.success(`成功删除 ${ids.length} 个任务单`);
            set({ taskLoading: false, selectedTaskOrderIds: [] });
          }, 1000);
        } catch (error: any) {
          set({
            taskLoading: false,
            taskError: error.message || '删除失败',
          });
        }
      },

      /**
       * 更新任务单状态
       */
      updateTaskOrderStatus: async (id: string, status: string) => {
        set({ taskLoading: true, taskError: null });

        try {
          // TODO: 调用API更新任务单状态
          // const response = await workOrderApi.updateTaskOrderStatus(id, status);

          // if (response.code === 200) {
          //   await get().loadTaskOrders(currentWorkOrder?.id);
          // } else {
          //   set({
          //     taskLoading: false,
          //     taskError: response.message || '更新状态失败',
          //   });
          // }

          setTimeout(() => {
            message.success('任务单状态更新成功！');
            set({ taskLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            taskLoading: false,
            taskError: error.message || '更新状态失败',
          });
        }
      },

      /**
       * 报告工单进度
       */
      reportWorkOrderProgress: async (taskId: string, progress: number, qty: number) => {
        set({ taskLoading: true, taskError: null });

        try {
          // TODO: 调用API报告工单进度
          // const response = await workOrderApi.reportProgress(taskId, progress, qty);

          // if (response.code === 200) {
          //   await get().loadTaskOrders(currentWorkOrder?.id);
          //   message.success('进度报告成功！');
          // } else {
          //   set({
          //     taskLoading: false,
          //     taskError: response.message || '报告失败',
          //   });
          // }

          setTimeout(() => {
            message.success('进度报告成功！');
            set({ taskLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            taskLoading: false,
            taskError: error.message || '报告失败',
          });
        }
      },

      /**
       * 设置活动标签页
       */
      setActiveTab: (tab: 'workorder' | 'taskorder') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示下发弹窗
       */
      setShowReleaseModal: (show: boolean) => {
        set({ showReleaseModal: show });
      },

      /**
       * 显示暂停弹窗
       */
      setShowPauseModal: (show: boolean) => {
        set({ showPauseModal: show });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          // TODO: 调用API获取统计数据
          // const response = await workOrderApi.getStatistics();

          // if (response.code === 200) {
          //   set({ statistics: response.data });
          // }

          // 模拟统计数据
          const mockStatistics: WorkOrderStatistics = {
            totalCount: 156,
            draftCount: 12,
            createdCount: 8,
            releasedCount: 45,
            inProgressCount: 23,
            completedCount: 68,
            cancelledCount: 0,
            onTimeDeliveryRate: 94.2,
            avgCycleTime: 4.5,
            totalQuantity: 12500,
            completedQuantity: 11750,
          };

          set({ statistics: mockStatistics });
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          workOrders: [],
          total: 0,
          loading: false,
          error: null,

          taskOrders: [],
          taskTotal: 0,
          taskLoading: false,
          taskError: null,

          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedWorkOrderIds: [],
          selectedWorkOrders: [],
          selectedTaskOrderIds: [],
          selectedTaskOrders: [],
          currentWorkOrder: null,
          currentTaskOrder: null,
          showWorkOrderDetail: false,
          showTaskOrderDetail: false,
          statistics: null,

          activeTab: 'workorder',
          showCreateModal: false,
          showEditModal: false,
          showReleaseModal: false,
          showPauseModal: false,
        });
      },
    }),
    {
      name: 'workorder-store',
      // 只持久化核心状态
      partialize: (state) => ({
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useWorkOrderStore;