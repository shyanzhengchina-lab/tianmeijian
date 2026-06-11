/**
 * 工艺路径主数据模块Zustand Store
 * 管理工艺路径主数据的本地状态和API调用
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { routingMasterApi } from './api';
import { DEFAULT_ROUTING_MASTERS } from './types';
import type {
  RoutingMaster,
  RoutingMasterQuery,
  CreateRoutingMasterDTO,
  UpdateRoutingMasterDTO,
  RoutingMasterBatchAction,
  RoutingDetail,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface RoutingMasterStore {
  routingMasters: RoutingMaster[];
  routingDetails: RoutingDetail[];
  selectedIds: string[];
  currentRoutingMaster: RoutingMaster | null;
  filters: RoutingMasterQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: any;

  loadRoutingMasters: (query?: RoutingMasterQuery) => Promise<void>;
  loadAllRoutingMasters: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  createRoutingMaster: (data: CreateRoutingMasterDTO) => Promise<void>;
  updateRoutingMaster: (data: UpdateRoutingMasterDTO) => Promise<void>;
  batchRoutingMasters: (action: RoutingMasterBatchAction) => Promise<void>;
  activateRouting: (id: string) => Promise<void>;
  deactivateRouting: (id: string) => Promise<void>;
  archiveRouting: (id: string) => Promise<void>;
  approveRouting: (id: string, approver: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  getRoutingDetails: (routingId: string) => Promise<RoutingDetail[]>;
  addRoutingDetail: (routingId: string, detail: Omit<RoutingDetail, 'id' | 'routingId'>) => Promise<void>;
  addRoutingDetails: (routingId: string, details: Omit<RoutingDetail, 'id' | 'routingId'>[]) => Promise<void>;
  updateRoutingDetail: (routingId: string, detail: RoutingDetail) => Promise<void>;
  deleteRoutingDetail: (routingId: string, detailId: string) => Promise<void>;
  deleteRoutingDetails: (routingId: string, detailIds: string[]) => Promise<void>;
  copyRouting: (id: string, newRoutingCode: string) => Promise<RoutingMaster>;
  getApplicableRoutings: (productCode: string) => Promise<RoutingMaster[]>;

  setFilters: (filters: Partial<RoutingMasterQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentRoutingMaster: (routingMaster: RoutingMaster | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  deleteRoutingMasters: (ids: string[]) => Promise<void>;
  activateRoutingMaster: (id: string) => Promise<void>;
  deactivateRoutingMaster: (id: string) => Promise<void>;
  approveRoutingMaster: (id: string, approver?: string) => Promise<void>;
  archiveRoutingMaster: (id: string) => Promise<void>;
}

export const useRoutingMasterStore = create<RoutingMasterStore>()(immer(
  (set, get) => ({
    routingMasters: DEFAULT_ROUTING_MASTERS,
    routingDetails: [],
    selectedIds: [],
    currentRoutingMaster: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_ROUTING_MASTERS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    loadRoutingMasters: async (query?: RoutingMasterQuery) => {
      set({ loading: true, error: null });
      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: RoutingMasterQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };
        const result = await routingMasterApi.getRoutingMasters(finalQuery);
        set({
          routingMasters: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载工艺路径主数据列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllRoutingMasters: async () => {
      try {
        const routingMasters = await routingMasterApi.getAllRoutingMasters();
        set({ routingMasters });
      } catch (error: any) {
        console.error('加载所有工艺路径主数据失败:', error);
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await routingMasterApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载工艺路径主数据统计失败:', error);
      }
    },

    createRoutingMaster: async (data: CreateRoutingMasterDTO) => {
      set({ loading: true, error: null });
      try {
        const newRoutingMaster = await routingMasterApi.createRoutingMaster(data);
        set(state => {
          state.routingMasters.unshift(newRoutingMaster);
          state.pagination.total += 1;
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建工艺路径主数据失败',
          loading: false,
        });
        throw error;
      }
    },

    updateRoutingMaster: async (data: UpdateRoutingMasterDTO) => {
      set({ loading: true, error: null });
      try {
        const updatedRoutingMaster = await routingMasterApi.updateRoutingMaster(data);
        set(state => {
          const index = state.routingMasters.findIndex(rm => rm.id === data.id);
          if (index !== -1) {
            state.routingMasters[index] = updatedRoutingMaster;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新工艺路径主数据失败',
          loading: false,
        });
        throw error;
      }
    },

    batchRoutingMasters: async (action: RoutingMasterBatchAction) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.batchRoutingMasters(action);
        await get().loadRoutingMasters();
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    activateRouting: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.activateRouting(id);
        set(state => {
          const routingMaster = state.routingMasters.find(rm => rm.id === id);
          if (routingMaster) {
            routingMaster.status = 'ACTIVE';
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '启用工艺路径失败',
          loading: false,
        });
        throw error;
      }
    },

    deactivateRouting: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.deactivateRouting(id);
        set(state => {
          const routingMaster = state.routingMasters.find(rm => rm.id === id);
          if (routingMaster) {
            routingMaster.status = 'INACTIVE';
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '停用工艺路径失败',
          loading: false,
        });
        throw error;
      }
    },

    archiveRouting: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.archiveRouting(id);
        set(state => {
          const routingMaster = state.routingMasters.find(rm => rm.id === id);
          if (routingMaster) {
            routingMaster.status = 'ARCHIVED';
          }
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '归档工艺路径失败',
          loading: false,
        });
        throw error;
      }
    },

    approveRouting: async (id: string, approver: string) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.approveRouting(id, approver);
        set(state => {
          const routingMaster = state.routingMasters.find(rm => rm.id === id);
          if (routingMaster) {
            routingMaster.approvedBy = approver;
            routingMaster.approvalTime = new Date().toISOString();
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '批准工艺路径失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.updateStatus(ids, status);
        set(state => {
          state.routingMasters.forEach(routingMaster => {
            if (ids.includes(routingMaster.id)) {
              routingMaster.status = status as any;
            }
          });
          state.loading = false;
        });
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '更新状态失败',
          loading: false,
        });
        throw error;
      }
    },

    getRoutingDetails: async (routingId: string): Promise<RoutingDetail[]> => {
      try {
        const routingDetails = await routingMasterApi.getRoutingDetails(routingId);
        set({ routingDetails });
        return routingDetails;
      } catch (error: any) {
        console.error('获取工艺路径明细失败:', error);
        return [];
      }
    },

    addRoutingDetail: async (routingId: string, detail: Omit<RoutingDetail, 'id' | 'routingId'>) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.addRoutingDetail(routingId, detail);
        await get().getRoutingDetails(routingId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加工艺路径明细失败',
          loading: false,
        });
        throw error;
      }
    },

    addRoutingDetails: async (routingId: string, details: Omit<RoutingDetail, 'id' | 'routingId'>[]) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.addRoutingDetails(routingId, details);
        await get().getRoutingDetails(routingId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加工艺路径明细失败',
          loading: false,
        });
        throw error;
      }
    },

    updateRoutingDetail: async (routingId: string, detail: RoutingDetail) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.updateRoutingDetail(routingId, detail);
        await get().getRoutingDetails(routingId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '更新工艺路径明细失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteRoutingDetail: async (routingId: string, detailId: string) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.deleteRoutingDetail(routingId, detailId);
        await get().getRoutingDetails(routingId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '删除工艺路径明细失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteRoutingDetails: async (routingId: string, detailIds: string[]) => {
      set({ loading: true, error: null });
      try {
        await routingMasterApi.deleteRoutingDetails(routingId, detailIds);
        await get().getRoutingDetails(routingId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '删除工艺路径明细失败',
          loading: false,
        });
        throw error;
      }
    },

    copyRouting: async (id: string, newRoutingCode: string): Promise<RoutingMaster> => {
      set({ loading: true, error: null });
      try {
        const routingMaster = await routingMasterApi.copyRouting(id, newRoutingCode);
        set({ loading: false });
        await get().loadRoutingMasters();
        return routingMaster;
      } catch (error: any) {
        set({
          error: error?.message || '复制工艺路径失败',
          loading: false,
        });
        throw error;
      }
    },

    getApplicableRoutings: async (productCode: string): Promise<RoutingMaster[]> => {
      try {
        return await routingMasterApi.getApplicableRoutings(productCode);
      } catch (error: any) {
        console.error('获取适用工艺路径失败:', error);
        return [];
      }
    },

    setFilters: (filters: Partial<RoutingMasterQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1;
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentRoutingMaster: (routingMaster: RoutingMaster | null) => {
      set({ currentRoutingMaster: routingMaster });
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
        routingMasters: DEFAULT_ROUTING_MASTERS,
        routingDetails: [],
        selectedIds: [],
        currentRoutingMaster: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_ROUTING_MASTERS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    deleteRoutingMasters: async (ids: string[]) => { await get().batchRoutingMasters({ action: 'DELETE', ids } as any); },
    activateRoutingMaster: async (id: string) => { await get().activateRouting(id); },
    deactivateRoutingMaster: async (id: string) => { await get().deactivateRouting(id); },
    approveRoutingMaster: async (id: string, approver?: string) => { await get().approveRouting(id, approver || ''); },
    archiveRoutingMaster: async (id: string) => { await get().archiveRouting(id); },
  })
));
