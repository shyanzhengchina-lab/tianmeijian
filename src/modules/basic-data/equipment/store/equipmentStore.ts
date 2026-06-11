/**
 * 设备模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Equipment, EquipmentQuery, EquipmentStatistics, EquipmentStatusAction, MaintenanceRecord, EquipmentOEE } from '../types';
import { equipmentApi } from '../api/equipmentApi';

/**
 * 设备Store状态接口
 */
export interface EquipmentState {
  // 数据状态
  equipments: Equipment[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: EquipmentQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedEquipments: Equipment[];

  // 详情状态
  currentEquipment: Equipment | null;

  // 维护记录
  maintenanceRecords: MaintenanceRecord[];
  showMaintenanceDrawer: boolean;

  // OEE数据
  oeeData: EquipmentOEE[];
  showOEEDrawer: boolean;

  // 统计数据
  statistics: EquipmentStatistics | null;

  // 分类数据
  categoryTree: Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>;

  // 关联数据（表单所需）
  workshops: Array<{ id: string; name: string; code: string }>;
  workCenters: Array<{ id: string; name: string; code: string }>;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  showCopyModal: boolean;

  // Actions
  loadWorkshops: () => Promise<void>;
  loadWorkCenters: () => Promise<void>;
  setEquipments: (equipments: Equipment[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<EquipmentQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadEquipments: () => Promise<void>;
  refreshEquipments: () => Promise<void>;
  createEquipment: (data: any) => Promise<void>;
  updateEquipment: (data: any) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  batchDeleteEquipments: (ids: string[]) => Promise<void>;
  batchStartEquipments: (ids: string[]) => Promise<void>;
  batchStopEquipments: (ids: string[]) => Promise<void>;
  batchSetMaintenanceEquipments: (ids: string[]) => Promise<void>;
  updateEquipmentStatus: (action: EquipmentStatusAction) => Promise<void>;
  loadEquipmentById: (id: string) => Promise<Equipment | null>;
  copyEquipment: (id: string) => Promise<void>;
  toggleEquipmentStatus: (id: string, status: 'running' | 'stopped') => Promise<void>;
  checkCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  getAvailableWorkCenters: () => Promise<any[]>;
  getBottleneckEquipments: () => Promise<Equipment[]>;
  loadCategoryTree: () => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowCopyModal: (show: boolean) => void;
  setCurrentEquipment: (equipment: Equipment | null) => void;
  loadStatistics: () => Promise<void>;
  importEquipments: (file: File, validate?: boolean, updateMode?: 'create' | 'update' | 'skip') => Promise<void>;
  exportEquipments: (query?: EquipmentQuery, fileName?: string) => Promise<void>;
  batchUpdateWorkCenter: (ids: string[], workCenterId: string) => Promise<void>;
  loadMaintenanceRecords: (equipmentId: string) => Promise<void>;
  createMaintenanceRecord: (equipmentId: string, data: Partial<MaintenanceRecord>) => Promise<void>;
  updateMaintenanceRecord: (equipmentId: string, recordId: string, data: Partial<MaintenanceRecord>) => Promise<void>;
  deleteMaintenanceRecord: (equipmentId: string, recordId: string) => Promise<void>;
  loadOEEData: (equipmentId: string, startDate: string, endDate: string) => Promise<void>;
  setShowMaintenanceDrawer: (show: boolean) => void;
  setShowOEEDrawer: (show: boolean) => void;
  getPendingMaintenanceEquipments: () => Promise<Array<{
    equipmentId: string;
    equipmentName: string;
    nextMaintenanceDate: string;
    daysOverdue: number;
  }>>;
  searchEquipments: (keyword: string) => Promise<Equipment[]>;
  reset: () => void;

  // 兼容别名
  pagination: { current: number; pageSize: number; total: number };
  deleteEquipments: (ids: string[]) => Promise<void>;
  activateEquipment: (id: string) => Promise<void>;
  deactivateEquipment: (id: string) => Promise<void>;
  scrapEquipment: (id: string) => Promise<void>;
  setMaintenance: (id: string) => Promise<void>;
  unsetMaintenance: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
}

/**
 * 设备Store
 */
export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      // 初始状态
      equipments: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedEquipments: [],
      currentEquipment: null,
      maintenanceRecords: [],
      showMaintenanceDrawer: false,
      oeeData: [],
      showOEEDrawer: false,
      statistics: null,
      categoryTree: [],
      workshops: [],
      workCenters: [],
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      showCopyModal: false,

      /**
       * 设置设备列表数据
       */
      setEquipments: (equipments: Equipment[], total: number) => {
        set({ equipments, total, error: null });
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
      setQuery: (query: Partial<EquipmentQuery>) => {
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
        const { equipments } = get();
        const selectedEquipments = equipments.filter(e => ids.includes(e.id));
        set({ selectedIds: ids, selectedEquipments });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedEquipments: [] });
      },

      /**
       * 加载设备列表
       */
      loadEquipments: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.getEquipments(query);

          if (response.code === 200) {
            set({
              equipments: response.data.list,
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
       * 刷新设备列表
       */
      refreshEquipments: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.getEquipments(query);

          if (response.code === 200) {
            set({
              equipments: response.data.list,
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
       * 创建设备
       */
      createEquipment: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.createEquipment(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
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
       * 更新设备
       */
      updateEquipment: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.updateEquipment(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
            set({ showEditModal: false, currentEquipment: null });
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
       * 删除设备
       */
      deleteEquipment: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.deleteEquipment(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
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
       * 批量删除设备
       */
      batchDeleteEquipments: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.deleteEquipments(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
            // 清除选择
            set({ selectedIds: [], selectedEquipments: [] });
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
       * 批量启动设备
       */
      batchStartEquipments: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.batchStart(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
          } else {
            set({
              loading: false,
              error: response.message || '批量启动失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量启动失败',
          });
        }
      },

      /**
       * 批量停止设备
       */
      batchStopEquipments: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.batchStop(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
          } else {
            set({
              loading: false,
              error: response.message || '批量停止失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量停止失败',
          });
        }
      },

      /**
       * 批量设置为维护状态
       */
      batchSetMaintenanceEquipments: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.batchSetMaintenance(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
          } else {
            set({
              loading: false,
              error: response.message || '批量设置维护失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量设置维护失败',
          });
        }
      },

      /**
       * 更新设备状态
       */
      updateEquipmentStatus: async (action: EquipmentStatusAction) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.updateStatus(action);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
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
       * 根据ID加载设备
       */
      loadEquipmentById: async (id: string): Promise<Equipment | null> => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.getEquipmentById(id);

          if (response.code === 200) {
            set({
              currentEquipment: response.data,
              loading: false,
            });
            return response.data;
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
       * 复制设备
       */
      copyEquipment: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.copyEquipment(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
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
       * 设备启停
       */
      toggleEquipmentStatus: async (id: string, status: 'running' | 'stopped') => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.toggleEquipmentStatus(id, status);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
          } else {
            set({
              loading: false,
              error: response.message || '启停操作失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '启停操作失败',
          });
        }
      },

      /**
       * 检查设备编码唯一性
       */
      checkCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await equipmentApi.checkCodeUnique(code, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 获取可用工作中心列表
       */
      getAvailableWorkCenters: async (): Promise<any[]> => {
        try {
          const response = await equipmentApi.getAvailableWorkCenters();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用工作中心失败:', error);
          return [];
        }
      },

      /**
       * 获取瓶颈设备列表
       */
      getBottleneckEquipments: async (): Promise<Equipment[]> => {
        try {
          const response = await equipmentApi.getBottleneckEquipments();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取瓶颈设备失败:', error);
          return [];
        }
      },

      /**
       * 加载分类树
       */
      loadCategoryTree: async () => {
        try {
          const response = await equipmentApi.getCategoryTree();

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
        set({ showCreateModal: show, currentEquipment: null });
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
       * 显示复制弹窗
       */
      setShowCopyModal: (show: boolean) => {
        set({ showCopyModal: show });
      },

      /**
       * 设置当前设备
       */
      setCurrentEquipment: (equipment: Equipment | null) => {
        set({ currentEquipment: equipment });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await equipmentApi.getStatistics();

          if (response.code === 200) {
            set({ statistics: response.data });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入设备
       */
      importEquipments: async (
        file: File,
        validate?: boolean,
        updateMode?: 'create' | 'update' | 'skip'
      ) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.importEquipments({
            file,
            validate,
            updateMode,
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
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
       * 导出设备
       */
      exportEquipments: async (query?: EquipmentQuery, fileName?: string) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          await equipmentApi.exportEquipments(query || currentQuery, fileName);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 批量更新工作中心
       */
      batchUpdateWorkCenter: async (ids: string[], workCenterId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.batchUpdateWorkCenter(ids, workCenterId);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEquipments();
          } else {
            set({
              loading: false,
              error: response.message || '批量更新工作中心失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量更新工作中心失败',
          });
        }
      },

      /**
       * 加载维护记录
       */
      loadMaintenanceRecords: async (equipmentId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.getMaintenanceRecords(equipmentId);

          if (response.code === 200) {
            set({
              maintenanceRecords: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载维护记录失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载维护记录失败',
          });
        }
      },

      /**
       * 创建维护记录
       */
      createMaintenanceRecord: async (equipmentId: string, data: Partial<MaintenanceRecord>) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.createMaintenanceRecord(equipmentId, data);

          if (response.code === 200) {
            // 刷新维护记录
            await get().loadMaintenanceRecords(equipmentId);
          } else {
            set({
              loading: false,
              error: response.message || '创建维护记录失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建维护记录失败',
          });
        }
      },

      /**
       * 更新维护记录
       */
      updateMaintenanceRecord: async (equipmentId: string, recordId: string, data: Partial<MaintenanceRecord>) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.updateMaintenanceRecord(equipmentId, recordId, data);

          if (response.code === 200) {
            // 刷新维护记录
            await get().loadMaintenanceRecords(equipmentId);
          } else {
            set({
              loading: false,
              error: response.message || '更新维护记录失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新维护记录失败',
          });
        }
      },

      /**
       * 删除维护记录
       */
      deleteMaintenanceRecord: async (equipmentId: string, recordId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.deleteMaintenanceRecord(equipmentId, recordId);

          if (response.code === 200) {
            // 刷新维护记录
            await get().loadMaintenanceRecords(equipmentId);
          } else {
            set({
              loading: false,
              error: response.message || '删除维护记录失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除维护记录失败',
          });
        }
      },

      /**
       * 加载OEE数据
       */
      loadOEEData: async (equipmentId: string, startDate: string, endDate: string) => {
        set({ loading: true, error: null });

        try {
          const response = await equipmentApi.getOEEData(equipmentId, startDate, endDate);

          if (response.code === 200) {
            set({
              oeeData: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载OEE数据失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载OEE数据失败',
          });
        }
      },

      /**
       * 显示维护记录抽屉
       */
      setShowMaintenanceDrawer: (show: boolean) => {
        set({ showMaintenanceDrawer: show });
      },

      /**
       * 显示OEE抽屉
       */
      setShowOEEDrawer: (show: boolean) => {
        set({ showOEEDrawer: show });
      },

      /**
       * 获取待维护设备列表
       */
      getPendingMaintenanceEquipments: async () => {
        try {
          const response = await equipmentApi.getPendingMaintenanceEquipments();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取待维护设备失败:', error);
          return [];
        }
      },

      /**
       * 搜索设备
       */
      searchEquipments: async (keyword: string): Promise<Equipment[]> => {
        try {
          const response = await equipmentApi.searchEquipments(keyword);
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('搜索设备失败:', error);
          return [];
        }
      },

      /**
       * 重置状态
       */
      loadWorkshops: async () => {
      set({ workshops: [] });
    },
    loadWorkCenters: async () => {
      set({ workCenters: [] });
    },
    reset: () => {
        set({
          equipments: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedEquipments: [],
          currentEquipment: null,
          maintenanceRecords: [],
          showMaintenanceDrawer: false,
          oeeData: [],
          showOEEDrawer: false,
          statistics: null,
          categoryTree: [],
          workshops: [],
          workCenters: [],
          showCreateModal: false,
          showEditModal: false,
          showDetailDrawer: false,
          showCopyModal: false,
        });
      },

    // 兼容别名实现
    get pagination() {
      const s = get();
      return { current: (s.query as any).current || 1, pageSize: (s.query as any).pageSize || 15, total: s.total };
    },
    deleteEquipments: async (ids: string[]) => { await get().batchDeleteEquipments(ids); },
    activateEquipment: async (id: string) => { await get().updateEquipmentStatus({ action: 'activate', ids: [id] } as any); },
    deactivateEquipment: async (id: string) => { await get().updateEquipmentStatus({ action: 'deactivate', ids: [id] } as any); },
    scrapEquipment: async (id: string) => { await get().updateEquipmentStatus({ action: 'scrap', ids: [id] } as any); },
    setMaintenance: async (id: string) => { await get().batchSetMaintenanceEquipments([id]); },
    unsetMaintenance: async (id: string) => { await get().batchStartEquipments([id]); },
    updateStatus: async (ids: string[], status: string) => { await get().updateEquipmentStatus({ action: status, ids } as any); },
    }),
    {
      name: 'equipment-store',
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

export default useEquipmentStore;
