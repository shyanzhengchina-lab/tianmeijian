/**
 * 工作中心模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkCenter, WorkCenterQuery, WorkCenterOverallStatistics, WorkCenterStatusAction, WorkCenterStatistics } from '../types';
import { workCenterApi } from '../api/workCenterApi';

/**
 * 工作中心Store状态接口
 */
export interface WorkCenterState {
  // 数据状态
  workCenters: WorkCenter[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: WorkCenterQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedWorkCenters: WorkCenter[];

  // 详情状态
  currentWorkCenter: WorkCenter | null;

  // 关联数据
  workCenterStatistics: WorkCenterStatistics | null;
  equipments: any[];
  operations: any[];
  employees: any[];
  utilizationRateData: Array<{
    date: string;
    plannedCapacity: number;
    actualCapacity: number;
    utilizationRate: number;
  }>;

  // 统计数据
  statistics: WorkCenterOverallStatistics | null;

  // 分类数据
  categoryTree: Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>;

  // 关联数据
  workshops: Array<{ id: string; name: string; code: string }>;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  showStatisticsDrawer: boolean;
  showCopyModal: boolean;

  // Actions
  loadWorkshops: () => Promise<void>;
  setWorkCenters: (workCenters: WorkCenter[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<WorkCenterQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadWorkCenters: () => Promise<void>;
  refreshWorkCenters: () => Promise<void>;
  createWorkCenter: (data: any) => Promise<void>;
  updateWorkCenter: (data: any) => Promise<void>;
  deleteWorkCenter: (id: string) => Promise<void>;
  batchDeleteWorkCenters: (ids: string[]) => Promise<void>;
  batchEnableWorkCenters: (ids: string[]) => Promise<void>;
  batchDisableWorkCenters: (ids: string[]) => Promise<void>;
  updateWorkCenterStatus: (action: WorkCenterStatusAction) => Promise<void>;
  loadWorkCenterById: (id: string) => Promise<WorkCenter | null>;
  copyWorkCenter: (id: string) => Promise<void>;
  checkCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  getAvailableWorkshops: () => Promise<any[]>;
  getBottleneckWorkCenters: () => Promise<WorkCenter[]>;
  loadCategoryTree: () => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowStatisticsDrawer: (show: boolean) => void;
  setShowCopyModal: (show: boolean) => void;
  setCurrentWorkCenter: (workCenter: WorkCenter | null) => void;
  loadStatistics: () => Promise<void>;
  importWorkCenters: (file: File, validate?: boolean, updateMode?: 'create' | 'update' | 'skip') => Promise<void>;
  exportWorkCenters: (query?: WorkCenterQuery, fileName?: string) => Promise<void>;
  loadWorkCenterStatistics: (workCenterId: string) => Promise<void>;
  loadWorkCenterEquipments: (workCenterId: string) => Promise<void>;
  loadWorkCenterOperations: (workCenterId: string) => Promise<void>;
  loadWorkCenterEmployees: (workCenterId: string) => Promise<void>;
  loadUtilizationRate: (workCenterId: string, startDate: string, endDate: string) => Promise<void>;
  searchWorkCenters: (keyword: string) => Promise<WorkCenter[]>;
  reset: () => void;

  // 兼容别名
  pagination: { current: number; pageSize: number; total: number };
  deleteWorkCenters: (ids: string[]) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  setMaintenance: (id: string) => Promise<void>;
  unsetMaintenance: (id: string) => Promise<void>;
  updateLeader: (id: string, leaderId: string) => Promise<void>;
}

/**
 * 工作中心Store
 */
export const useWorkCenterStore = create<WorkCenterState>()(
  persist(
    (set, get) => ({
      // 初始状态
      workCenters: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedWorkCenters: [],
      currentWorkCenter: null,
      workCenterStatistics: null,
      equipments: [],
      operations: [],
      employees: [],
      utilizationRateData: [],
      statistics: null,
      categoryTree: [],
      workshops: [],
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      showStatisticsDrawer: false,
      showCopyModal: false,

      /**
       * 设置工作中心列表数据
       */
      setWorkCenters: (workCenters: WorkCenter[], total: number) => {
        set({ workCenters, total, error: null });
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
      setQuery: (query: Partial<WorkCenterQuery>) => {
        set((state) => ({
          query: { ...state.query, ...query, current: 1 }, // 重置到第一页
        }));
      },

      /**
       * 设置筛选条件
       */
      setFilters: (filters: Record<string, any>) => {
        set({ filters });
      },

      /**
       * 设置选中ID列表
       */
      setSelectedIds: (ids: string[]) => {
        const { workCenters } = get();
        const selectedWorkCenters = workCenters.filter(w => ids.includes(w.id));
        set({ selectedIds: ids, selectedWorkCenters });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedWorkCenters: [] });
      },

      /**
       * 加载工作中心列表
       */
      loadWorkCenters: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.getWorkCenters(query);

          if (response.code === 200) {
            set({
              workCenters: response.data.list as any,
              total: response.data.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 刷新工作中心列表
       */
      refreshWorkCenters: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.getWorkCenters(query);

          if (response.code === 200) {
            set({
              workCenters: response.data.list as any,
              total: response.data.total,
              loading: false,
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '刷新失败',
          });
        }
      },

      /**
       * 创建工作中心
       */
      createWorkCenter: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.createWorkCenter(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
            set({ showCreateModal: false });
          } else {
            set({
              loading: false,
              error: response.message || '创建失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
        }
      },

      /**
       * 更新工作中心
       */
      updateWorkCenter: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.updateWorkCenter(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
            set({ showEditModal: false, currentWorkCenter: null });
          } else {
            set({
              loading: false,
              error: response.message || '更新失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
        }
      },

      /**
       * 删除工作中心
       */
      deleteWorkCenter: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.deleteWorkCenter(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
          } else {
            set({
              loading: false,
              error: response.message || '删除失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
        }
      },

      /**
       * 批量删除工作中心
       */
      batchDeleteWorkCenters: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.deleteWorkCenters(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
            // 清除选择
            set({ selectedIds: [], selectedWorkCenters: [] });
          } else {
            set({
              loading: false,
              error: response.message || '批量删除失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量删除失败',
          });
        }
      },

      /**
       * 批量启用工作中心
       */
      batchEnableWorkCenters: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.batchEnable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
          } else {
            set({
              loading: false,
              error: response.message || '批量启用失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量启用失败',
          });
        }
      },

      /**
       * 批量禁用工作中心
       */
      batchDisableWorkCenters: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.batchDisable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
          } else {
            set({
              loading: false,
              error: response.message || '批量禁用失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量禁用失败',
          });
        }
      },

      /**
       * 更新工作中心状态
       */
      updateWorkCenterStatus: async (action: WorkCenterStatusAction) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.updateStatus(action);

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
          } else {
            set({
              loading: false,
              error: response.message || '状态更新失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '状态更新失败',
          });
        }
      },

      /**
       * 根据ID加载工作中心
       */
      loadWorkCenterById: async (id: string): Promise<WorkCenter | null> => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.getWorkCenterById(id);

          if (response.code === 200) {
            set({
              currentWorkCenter: response.data as any,
              loading: false,
            });
            return response.data as any;
          } else {
            set({
              loading: false,
              error: response.message || '加载失败',
            });
            return null;
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
          return null;
        }
      },

      /**
       * 复制工作中心
       */
      copyWorkCenter: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.copyWorkCenter(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
            set({ showCopyModal: false });
          } else {
            set({
              loading: false,
              error: response.message || '复制失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '复制失败',
          });
        }
      },

      /**
       * 检查工作中心编码唯一性
       */
      checkCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await workCenterApi.checkCodeUnique(code, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 获取可用车间列表
       */
      getAvailableWorkshops: async (): Promise<any[]> => {
        try {
          const response = await workCenterApi.getAvailableWorkshops();
          return response.code === 200 ? response.data as any : [];
        } catch (error: any) {
          console.error('获取可用车间失败:', error);
          return [];
        }
      },

      /**
       * 获取瓶颈工作中心列表
       */
      getBottleneckWorkCenters: async (): Promise<WorkCenter[]> => {
        try {
          const response = await workCenterApi.getBottleneckWorkCenters();
          return response.code === 200 ? response.data as any : [];
        } catch (error: any) {
          console.error('获取瓶颈工作中心失败:', error);
          return [];
        }
      },

      /**
       * 加载分类树
       */
      loadCategoryTree: async () => {
        try {
          const response = await workCenterApi.getCategoryTree();

          if (response.code === 200) {
            set({ categoryTree: response.data });
          }
        } catch (error: any) {
          console.error('加载分类树失败:', error);
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentWorkCenter: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示详情抽屉
       */
      setShowDetailDrawer: (show: boolean) => {
        set({ showDetailDrawer: show });
      },

      /**
       * 显示统计抽屉
       */
      setShowStatisticsDrawer: (show: boolean) => {
        set({ showStatisticsDrawer: show });
      },

      /**
       * 显示复制弹窗
       */
      setShowCopyModal: (show: boolean) => {
        set({ showCopyModal: show });
      },

      /**
       * 设置当前工作中心
       */
      setCurrentWorkCenter: (workCenter: WorkCenter | null) => {
        set({ currentWorkCenter: workCenter });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await workCenterApi.getStatistics();

          if (response.code === 200) {
            set({ statistics: response.data });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入工作中心
       */
      importWorkCenters: async (
        file: File,
        validate?: boolean,
        updateMode?: 'create' | 'update' | 'skip'
      ) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.importWorkCenters({
            file,
            validate,
            updateMode,
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadWorkCenters();
          } else {
            set({
              loading: false,
              error: response.message || '导入失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导入失败',
          });
        }
      },

      /**
       * 导出工作中心
       */
      exportWorkCenters: async (query?: WorkCenterQuery, fileName?: string) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          await workCenterApi.exportWorkCenters(query || currentQuery, fileName);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 加载工作中心统计数据
       */
      loadWorkCenterStatistics: async (workCenterId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.getWorkCenterStatistics(workCenterId);

          if (response.code === 200) {
            set({
              workCenterStatistics: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载统计数据失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载统计数据失败',
          });
        }
      },

      /**
       * 加载工作中心设备
       */
      loadWorkCenterEquipments: async (workCenterId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.getWorkCenterEquipments(workCenterId);

          if (response.code === 200) {
            set({
              equipments: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载设备列表失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载设备列表失败',
          });
        }
      },

      /**
       * 加载工作中心工序
       */
      loadWorkCenterOperations: async (workCenterId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.getWorkCenterOperations(workCenterId);

          if (response.code === 200) {
            set({
              operations: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载工序列表失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载工序列表失败',
          });
        }
      },

      /**
       * 加载工作中心员工
       */
      loadWorkCenterEmployees: async (workCenterId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.getWorkCenterEmployees(workCenterId);

          if (response.code === 200) {
            set({
              employees: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载员工列表失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载员工列表失败',
          });
        }
      },

      /**
       * 加载产能利用率
       */
      loadUtilizationRate: async (workCenterId: string, startDate: string, endDate: string) => {
        set({ loading: true, error: null });

        try {
          const response = await workCenterApi.getUtilizationRate(workCenterId, startDate, endDate);

          if (response.code === 200) {
            set({
              utilizationRateData: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载产能利用率失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载产能利用率失败',
          });
        }
      },

      /**
       * 搜索工作中心
       */
      searchWorkCenters: async (keyword: string): Promise<WorkCenter[]> => {
        try {
          const response = await workCenterApi.searchWorkCenters(keyword);
          return response.code === 200 ? response.data as any : [];
        } catch (error: any) {
          console.error('搜索工作中心失败:', error);
          return [];
        }
      },

      /**
       * 重置状态
       */
      loadWorkshops: async () => {
      set({ workshops: [] });
    },
    reset: () => {
        set({
          workCenters: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedWorkCenters: [],
          currentWorkCenter: null,
          workCenterStatistics: null,
          equipments: [],
          operations: [],
          employees: [],
          utilizationRateData: [],
          statistics: null,
          categoryTree: [],
          showCreateModal: false,
          showEditModal: false,
          showDetailDrawer: false,
          showStatisticsDrawer: false,
          showCopyModal: false,
        });
      },

    // 兼容别名
    get pagination() {
      const s = get();
      return { current: (s.query as any).current || 1, pageSize: (s.query as any).pageSize || 15, total: s.total };
    },
    deleteWorkCenters: async (ids: string[]) => { await get().batchDeleteWorkCenters(ids); },
    updateStatus: async (ids: string[], status: string) => { await get().updateWorkCenterStatus({ action: status, ids } as any); },
    setMaintenance: async (id: string) => { await get().updateWorkCenterStatus({ action: 'maintenance', ids: [id] } as any); },
    unsetMaintenance: async (id: string) => { await get().updateWorkCenterStatus({ action: 'activate', ids: [id] } as any); },
    updateLeader: async (id: string, _leaderId: string) => { await get().updateWorkCenterStatus({ action: 'updateLeader', ids: [id] } as any); },
    }),
    {
      name: 'workcenter-store',
      // 可选：配置存储选项
      // getStorage: () => localStorage,
      // setStorage: () => localStorage,
      // 持久化选定的字段
      partialize: (state) => ({
        query: state.query,
        filters: state.filters,
      }),
    }
  )
);

export default useWorkCenterStore;
