/**
 * 车间档案模块Zustand Store
 * 管理车间的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';

import { workshopApi } from './api';
import { DEFAULT_WORKSHOPS } from './types';
import type {
  Workshop,
  WorkshopQuery,
  CreateWorkshopDTO,
  UpdateWorkshopDTO,
  WorkshopBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface WorkshopStore {
  // State
  workshops: Workshop[];
  selectedIds: string[];
  currentWorkshop: Workshop | null;
  filters: WorkshopQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    activeCount: number;
    disabledCount: number;
    maintenanceCount: number;
    typeStats: Record<string, number>;
  } | null;
  relatedWorkCenters: any[];
  currentWorkshopWorkCenters: any[];

  // Actions
  loadWorkshops: (query?: WorkshopQuery) => Promise<void>;
  loadAllWorkshops: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  loadRelatedWorkCenters: (id: string) => Promise<void>;
  createWorkshop: (data: CreateWorkshopDTO) => Promise<void>;
  updateWorkshop: (data: UpdateWorkshopDTO) => Promise<void>;
  deleteWorkshops: (ids: string[]) => Promise<void>;
  batchWorkshops: (action: WorkshopBatchAction) => Promise<void>;
  updateStatus: (ids: string[], status: 'ACTIVE' | 'DISABLED') => Promise<void>;
  setMaintenance: (id: string) => Promise<void>;
  unsetMaintenance: (id: string) => Promise<void>;
  updateManager: (id: string, manager: string, managerPhone?: string) => Promise<void>;
  addWorkCenter: (id: string, workCenterId: string) => Promise<void>;
  removeWorkCenter: (id: string, workCenterId: string) => Promise<void>;

  // State setters
  setFilters: (filters: Partial<WorkshopQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentWorkshop: (workshop: Workshop | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 创建Zustand Store
export const useWorkshopStore = create<WorkshopStore>()(
  (set, get) => ({
    // 初始状态
    workshops: DEFAULT_WORKSHOPS,
    selectedIds: [],
    currentWorkshop: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_WORKSHOPS.length,
    },
    loading: false,
    error: null,
    statistics: null,
    relatedWorkCenters: [],
    currentWorkshopWorkCenters: [],

    // Actions
    loadWorkshops: async (query?: WorkshopQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: WorkshopQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await workshopApi.getWorkshops(finalQuery);

        set({
          workshops: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载车间列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllWorkshops: async () => {
      try {
        const workshops = await workshopApi.getAllWorkshops();
        set({ workshops });
      } catch (error: any) {
        console.error('加载所有车间失败:', error);
        set({ error: error?.message || '加载车间列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await workshopApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载车间统计失败:', error);
      }
    },

    loadRelatedWorkCenters: async (id: string) => {
      try {
        const workCenters = await workshopApi.getWorkCenters(id);
        set({ currentWorkshopWorkCenters: workCenters });
      } catch (error: any) {
        console.error('加载工作中心失败:', error);
        set({ error: error?.message || '加载工作中心失败' });
      }
    },

    createWorkshop: async (data: CreateWorkshopDTO) => {
      set({ loading: true, error: null });

      try {
        const newWorkshop = await workshopApi.createWorkshop(data);

        set({
          workshops: [newWorkshop, ...get().workshops],
          pagination: { ...get().pagination, total: get().pagination.total + 1 },
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建车间失败',
          loading: false,
        });
        throw error;
      }
    },

    updateWorkshop: async (data: UpdateWorkshopDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedWorkshop = await workshopApi.updateWorkshop(data);

        set({
          workshops: get().workshops.map(ws => ws.id === data.id ? updatedWorkshop : ws),
          loading: false
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新车间失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteWorkshops: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.deleteWorkshops(ids);

        set({
          workshops: get().workshops.filter(ws => !ids.includes(ws.id)),
          pagination: { ...get().pagination, total: get().pagination.total - ids.length },
          selectedIds: [],
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '删除车间失败',
          loading: false,
        });
        throw error;
      }
    },

    batchWorkshops: async (action: WorkshopBatchAction) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.batchWorkshops(action);

        // 重新加载列表
        await get().loadWorkshops();
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

    updateStatus: async (ids: string[], status: 'ACTIVE' | 'DISABLED') => {
      set({ loading: true, error: null });

      try {
        await workshopApi.updateStatus(ids, status);

        set({
          workshops: get().workshops.map(workshop =>
            ids.includes(workshop.id) ? { ...workshop, status } : workshop
          ),
          loading: false
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

    setMaintenance: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.setMaintenance(id);

        set({
          workshops: get().workshops.map(ws =>
            ws.id === id ? { ...ws, status: 'MAINTENANCE' } : ws
          ),
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '设置整修状态失败',
          loading: false,
        });
        throw error;
      }
    },

    unsetMaintenance: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.unsetMaintenance(id);

        set({
          workshops: get().workshops.map(ws =>
            ws.id === id ? { ...ws, status: 'ACTIVE' } : ws
          ),
          loading: false
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '取消整修状态失败',
          loading: false,
        });
        throw error;
      }
    },

    updateManager: async (id: string, manager: string, managerPhone?: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.updateManager(id, manager, managerPhone);

        set({
          workshops: get().workshops.map(ws =>
            ws.id === id ? { ...ws, manager, managerPhone } : ws
          ),
          loading: false
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新负责人失败',
          loading: false,
        });
        throw error;
      }
    },

    addWorkCenter: async (id: string, workCenterId: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.addWorkCenter(id, workCenterId);

        // 重新加载工作中心
        await get().loadRelatedWorkCenters(id);
      } catch (error: any) {
        set({
          error: error?.message || '添加工作中心失败',
          loading: false,
        });
        throw error;
      }
    },

    removeWorkCenter: async (id: string, workCenterId: string) => {
      set({ loading: true, error: null });

      try {
        await workshopApi.removeWorkCenter(id, workCenterId);

        // 重新加载工作中心
        await get().loadRelatedWorkCenters(id);
      } catch (error: any) {
        set({
          error: error?.message || '移除工作中心失败',
          loading: false,
        });
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<WorkshopQuery>) => {
      set(state => ({
        filters: { ...get().filters, ...filters },
        pagination: { ...get().pagination, current: 1 }
      }));
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentWorkshop: (workshop: Workshop | null) => {
      set({ currentWorkshop: workshop });
    },

    setPagination: (pagination: Partial<PaginationState>) => {
      set(state => ({
        pagination: { ...get().pagination, ...pagination }
      }));
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    reset: () => {
      set({
        workshops: DEFAULT_WORKSHOPS,
        selectedIds: [],
        currentWorkshop: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_WORKSHOPS.length,
        },
        loading: false,
        error: null,
        statistics: null,
        relatedWorkCenters: [],
        currentWorkshopWorkCenters: [],
      });
    },
  })
);