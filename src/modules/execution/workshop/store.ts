/**
 * 车间看板模块Zustand Store
 * 管理车间看板的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { workshopApi } from './api';
import {
  DEFAULT_WORKSHOP_DASHBOARDS,
  DEFAULT_EQUIPMENT_STATUSES,
  DEFAULT_OPERATION_EXECUTIONS,
} from './types';
import type {
  WorkshopDashboard,
  WorkshopDashboardQuery,
  EquipmentStatus,
  EquipmentStatusInfo,
  OperationExecution,
  ProductionStatistics,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface WorkshopStore {
  // State
  workshopDashboards: WorkshopDashboard[];
  equipmentStatuses: EquipmentStatusInfo[];
  operationExecutions: OperationExecution[];
  productionStatistics: ProductionStatistics[];
  selectedIds: string[];
  currentWorkshopDashboard: WorkshopDashboard | null;
  currentEquipmentStatus: EquipmentStatus | null;
  currentOperationExecution: OperationExecution | null;
  realtimeData: {
    dashboard?: WorkshopDashboard;
    equipmentStatuses?: EquipmentStatus[];
    operationExecutions?: OperationExecution[];
  } | null;
  filters: WorkshopDashboardQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;

  // Actions
  loadWorkshopDashboards: (query?: WorkshopDashboardQuery) => Promise<void>;
  loadAllWorkshopDashboards: () => Promise<void>;
  loadEquipmentStatuses: (workcenterId?: string) => Promise<void>;
  loadOperationExecutions: (workcenterId?: string, status?: string) => Promise<void>;
  loadProductionStatistics: (workcenterId: string, dateStart?: string, dateEnd?: string) => Promise<void>;
  getWorkshopDashboardById: (id: string) => Promise<WorkshopDashboard>;
  getWorkshopDashboardByWorkcenter: (workcenterId: string) => Promise<WorkshopDashboard>;
  getWorkshopRealtimeData: (workcenterId: string) => Promise<void>;
  getEquipmentStatusById: (equipmentId: string) => Promise<EquipmentStatus>;
  getOperationExecutionById: (id: string) => Promise<OperationExecution>;
  pauseOperationExecution: (id: string, reason?: string) => Promise<void>;
  resumeOperationExecution: (id: string) => Promise<void>;
  acknowledgeAlarm: (alarmId: string, acknowledgedBy: string) => Promise<void>;
  acknowledgeAlarms: (alarmIds: string[], acknowledgedBy: string) => Promise<void>;
  exportProductionStatistics: (workcenterId: string, dateStart: string, dateEnd: string) => Promise<Blob>;
  exportEquipmentRecord: (equipmentId: string, dateStart: string, dateEnd: string) => Promise<Blob>;

  // State setters
  setFilters: (filters: Partial<WorkshopDashboardQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentWorkshopDashboard: (workshopDashboard: WorkshopDashboard | null) => void;
  setCurrentEquipmentStatus: (equipmentStatus: EquipmentStatus | null) => void;
  setCurrentOperationExecution: (operationExecution: OperationExecution | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  showWorkshopDetail: boolean;
  setShowWorkshopDetail: (show: boolean) => void;
}

// 创建Zustand Store
export const useWorkshopStore = create<WorkshopStore>()(immer(
  (set, get) => ({
    // 初始状态
    workshopDashboards: DEFAULT_WORKSHOP_DASHBOARDS,
    equipmentStatuses: DEFAULT_EQUIPMENT_STATUSES as any[],
    operationExecutions: DEFAULT_OPERATION_EXECUTIONS,
    productionStatistics: [],
    selectedIds: [],
    currentWorkshopDashboard: null,
    currentEquipmentStatus: null,
    currentOperationExecution: null,
    realtimeData: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_WORKSHOP_DASHBOARDS.length,
    },
    loading: false,
    error: null,

    // Actions
    loadWorkshopDashboards: async (query?: WorkshopDashboardQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: WorkshopDashboardQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await workshopApi.getWorkshopDashboards(finalQuery);

        set({
          workshopDashboards: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载车间看板列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllWorkshopDashboards: async () => {
      try {
        const workshopDashboards = await workshopApi.getAllWorkshopDashboards();
        set({ workshopDashboards });
      } catch (error: any) {
        console.error('加载所有车间看板失败:', error);
        set({ error: error?.message || '加载车间看板列表失败' });
      }
    },

    loadEquipmentStatuses: async (workcenterId?: string) => {
      try {
        const equipmentStatuses = await workshopApi.getEquipmentStatuses(workcenterId);
        set({ equipmentStatuses: equipmentStatuses as any });
      } catch (error: any) {
        console.error('加载设备运行状态失败:', error);
        set({ error: error?.message || '加载设备运行状态失败' });
      }
    },

    loadOperationExecutions: async (workcenterId?: string, status?: string) => {
      try {
        const operationExecutions = await workshopApi.getOperationExecutions(workcenterId, status);
        set({ operationExecutions });
      } catch (error: any) {
        console.error('加载工序执行状态失败:', error);
        set({ error: error?.message || '加载工序执行状态失败' });
      }
    },

    loadProductionStatistics: async (workcenterId: string, dateStart?: string, dateEnd?: string) => {
      try {
        if (dateStart && dateEnd) {
          const productionStatistics = await workshopApi.getProductionStatisticsList(workcenterId, dateStart, dateEnd);
          set({ productionStatistics });
        } else {
          const today = new Date().toISOString().split('T')[0];
          const statistics = await workshopApi.getProductionStatistics(workcenterId, today);
          set({ productionStatistics: [statistics] });
        }
      } catch (error: any) {
        console.error('加载生产实绩统计失败:', error);
        set({ error: error?.message || '加载生产实绩统计失败' });
      }
    },

    getWorkshopDashboardById: async (id: string) => {
      set({ loading: true, error: null });

      try {
        const workshopDashboard = await workshopApi.getWorkshopDashboardById(id);
        set({ currentWorkshopDashboard: workshopDashboard, loading: false });
        return workshopDashboard;
      } catch (error: any) {
        set({
          error: error?.message || '加载车间看板详情失败',
          loading: false,
        });
        throw error;
      }
    },

    getWorkshopDashboardByWorkcenter: async (workcenterId: string) => {
      set({ loading: true, error: null });

      try {
        const workshopDashboard = await workshopApi.getWorkshopDashboardByWorkcenter(workcenterId);
        set({ currentWorkshopDashboard: workshopDashboard, loading: false });
        return workshopDashboard;
      } catch (error: any) {
        set({
          error: error?.message || '加载车间看板详情失败',
          loading: false,
        });
        throw error;
      }
    },

    getWorkshopRealtimeData: async (workcenterId: string) => {
      try {
        const realtimeData = await workshopApi.getWorkshopRealtimeData(workcenterId);
        set({ realtimeData });
      } catch (error: any) {
        console.error('获取车间实时数据失败:', error);
        set({ error: error?.message || '获取车间实时数据失败' });
      }
    },

    getEquipmentStatusById: async (equipmentId: string) => {
      set({ loading: true, error: null });

      try {
        const equipmentStatus = await workshopApi.getEquipmentStatusById(equipmentId);
        set({ currentEquipmentStatus: equipmentStatus, loading: false });
        return equipmentStatus;
      } catch (error: any) {
        set({
          error: error?.message || '加载设备运行状态失败',
          loading: false,
        });
        throw error;
      }
    },

    getOperationExecutionById: async (id: string) => {
      set({ loading: true, error: null });

      try {
        const operationExecution = await workshopApi.getOperationExecutionById(id);
        set({ currentOperationExecution: operationExecution, loading: false });
        return operationExecution;
      } catch (error: any) {
        set({
          error: error?.message || '加载工序执行状态失败',
          loading: false,
        });
        throw error;
      }
    },

    pauseOperationExecution: async (id: string, reason?: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.pauseOperationExecution(id, reason);

        set(state => {
          const operationExecution = state.operationExecutions.find(oe => oe.id === id);
          if (operationExecution) {
            operationExecution.status = 'PAUSED';
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '暂停工序执行失败',
          loading: false,
        });
        throw error;
      }
    },

    resumeOperationExecution: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.resumeOperationExecution(id);

        set(state => {
          const operationExecution = state.operationExecutions.find(oe => oe.id === id);
          if (operationExecution) {
            operationExecution.status = 'RUNNING';
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '恢复工序执行失败',
          loading: false,
        });
        throw error;
      }
    },

    acknowledgeAlarm: async (alarmId: string, acknowledgedBy: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.acknowledgeAlarm(alarmId, acknowledgedBy);

        set(state => {
          state.equipmentStatuses.forEach(equipmentStatus => {
            equipmentStatus.alarms.forEach(alarm => {
              if (alarm.id === alarmId) {
                alarm.acknowledged = true;
                alarm.acknowledgedBy = acknowledgedBy;
                alarm.acknowledgedTime = new Date().toISOString();
              }
            });
          });
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '确认设备告警失败',
          loading: false,
        });
        throw error;
      }
    },

    acknowledgeAlarms: async (alarmIds: string[], acknowledgedBy: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.acknowledgeAlarms(alarmIds, acknowledgedBy);

        set(state => {
          state.equipmentStatuses.forEach(equipmentStatus => {
            equipmentStatus.alarms.forEach(alarm => {
              if (alarmIds.includes(alarm.id)) {
                alarm.acknowledged = true;
                alarm.acknowledgedBy = acknowledgedBy;
                alarm.acknowledgedTime = new Date().toISOString();
              }
            });
          });
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '确认设备告警失败',
          loading: false,
        });
        throw error;
      }
    },

    exportProductionStatistics: async (workcenterId: string, dateStart: string, dateEnd: string): Promise<Blob> => {
      try {
        return await workshopApi.exportProductionStatistics(workcenterId, dateStart, dateEnd);
      } catch (error: any) {
        console.error('导出生产实绩统计失败:', error);
        throw error;
      }
    },

    exportEquipmentRecord: async (equipmentId: string, dateStart: string, dateEnd: string): Promise<Blob> => {
      try {
        return await workshopApi.exportEquipmentRecord(equipmentId, dateStart, dateEnd);
      } catch (error: any) {
        console.error('导出设备运行记录失败:', error);
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<WorkshopDashboardQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1; // 重置到第一页
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentWorkshopDashboard: (workshopDashboard: WorkshopDashboard | null) => {
      set({ currentWorkshopDashboard: workshopDashboard });
    },

    setCurrentEquipmentStatus: (equipmentStatus: EquipmentStatus | null) => {
      set({ currentEquipmentStatus: equipmentStatus });
    },

    setCurrentOperationExecution: (operationExecution: OperationExecution | null) => {
      set({ currentOperationExecution: operationExecution });
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
        workshopDashboards: DEFAULT_WORKSHOP_DASHBOARDS,
        equipmentStatuses: DEFAULT_EQUIPMENT_STATUSES as any[],
        operationExecutions: DEFAULT_OPERATION_EXECUTIONS,
        productionStatistics: [],
        selectedIds: [],
        currentWorkshopDashboard: null,
        currentEquipmentStatus: null,
        currentOperationExecution: null,
        realtimeData: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_WORKSHOP_DASHBOARDS.length,
        },
        loading: false,
        error: null,
      });
    },

    // 兼容别名
    showWorkshopDetail: false,
    setShowWorkshopDetail: (show: boolean) => { set({ showWorkshopDetail: show } as any); },
  })
));
