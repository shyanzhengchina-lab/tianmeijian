/**
 * 物料模块状态管理Store
 * 使用Zustand进行模块级状态管理
 * 性能优化：使用选择器避免不必要的重渲染
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Material, MaterialQuery, MaterialStatistics } from '../types';
import { materialApi } from '../api/materialApi';

/**
 * 性能优化的选择器
 * 避免组件订阅整个状态导致不必要的重渲染
 */

// 数据选择器
export const selectMaterials = (state: MaterialState) => state.materials;
export const selectTotal = (state: MaterialState) => state.total;
export const selectLoading = (state: MaterialState) => state.loading;
export const selectError = (state: MaterialState) => state.error;

// 查询选择器
export const selectQuery = (state: MaterialState) => state.query;
export const selectFilters = (state: MaterialState) => state.filters;

// 选择状态选择器
export const selectSelectedIds = (state: MaterialState) => state.selectedIds;
export const selectSelectedMaterials = (state: MaterialState) => state.selectedMaterials;

// 统计数据选择器
export const selectStatistics = (state: MaterialState) => state.statistics;

// UI状态选择器
export const selectShowCreateModal = (state: MaterialState) => state.showCreateModal;
export const selectShowEditModal = (state: MaterialState) => state.showEditModal;
export const selectShowDetailDrawer = (state: MaterialState) => state.showDetailDrawer;
export const selectCurrentMaterial = (state: MaterialState) => state.currentMaterial;

// 复合选择器 - 分页数据
export const selectPaginatedData = (state: MaterialState) => ({
  list: state.materials,
  total: state.total,
  loading: state.loading,
});

// 复合选择器 - 选择状态
export const selectSelection = (state: MaterialState) => ({
  selectedIds: state.selectedIds,
  selectedMaterials: state.selectedMaterials,
});

// 复合选择器 - UI状态
export const selectUIState = (state: MaterialState) => ({
  showCreateModal: state.showCreateModal,
  showEditModal: state.showEditModal,
  showDetailDrawer: state.showDetailDrawer,
  currentMaterial: state.currentMaterial,
});

/**
 * 物料Store状态接口
 */
export interface MaterialState {
  // 数据状态
  materials: Material[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: MaterialQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedMaterials: Material[];

  // 统计数据
  statistics: MaterialStatistics | null;

  // 关联数据
  units: Array<{ id: string; name: string; code: string }>;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  currentMaterial: Material | null;

  // Actions
  setMaterials: (materials: Material[], total: number) => void;
  loadUnits: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<MaterialQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadMaterials: () => Promise<void>;
  refreshMaterials: () => Promise<void>;
  createMaterial: (data: any) => Promise<void>;
  updateMaterial: (data: any) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  batchDeleteMaterials: (ids: string[]) => Promise<void>;
  batchEnableMaterials: (ids: string[]) => Promise<void>;
  batchDisableMaterials: (ids: string[]) => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setCurrentMaterial: (material: Material | null) => void;
  loadStatistics: () => Promise<void>;
}

/**
 * 物料Store
 */
export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      // 初始状态
      materials: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedMaterials: [],
      statistics: null,
      units: [],
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      currentMaterial: null,

      /**
       * 加载单位列表
       */
      loadUnits: async () => {
        try {
          // 从工作中心或单位API加载单位数据
          set({ units: [] });
        } catch (error: any) {
          console.error('加载单位失败', error);
        }
      },

      /**
       * 设置物料列表数据
       */
      setMaterials: (materials: Material[], total: number) => {
        set({ materials, total, error: null });
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
      setQuery: (query: Partial<MaterialQuery>) => {
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
        const { materials } = get();
        const selectedMaterials = materials.filter(m => ids.includes(m.id));
        set({ selectedIds: ids, selectedMaterials });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedMaterials: [] });
      },

      /**
       * 加载物料列表
       */
      loadMaterials: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await materialApi.getMaterials(query);

          if (response.code === 200) {
            set({
              materials: response.data.list as any,
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
       * 刷新物料列表
       */
      refreshMaterials: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await materialApi.getMaterials(query);

          if (response.code === 200) {
            set({
              materials: response.data.list as any,
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
       * 创建物料
       */
      createMaterial: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await materialApi.createMaterial(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadMaterials();
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
       * 更新物料
       */
      updateMaterial: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await materialApi.updateMaterial(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadMaterials();
            set({ showEditModal: false, currentMaterial: null });
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
       * 删除物料
       */
      deleteMaterial: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await materialApi.deleteMaterial(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadMaterials();
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
       * 批量删除物料
       */
      batchDeleteMaterials: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await materialApi.deleteMaterials(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadMaterials();
            // 清除选择
            set({ selectedIds: [], selectedMaterials: [] });
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
       * 批量启用物料
       */
      batchEnableMaterials: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await materialApi.batchEnable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadMaterials();
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
       * 批量禁用物料
       */
      batchDisableMaterials: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await materialApi.batchDisable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadMaterials();
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
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentMaterial: null });
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
       * 设置当前物料
       */
      setCurrentMaterial: (material: Material | null) => {
        set({ currentMaterial: material });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await materialApi.getStatistics();

          if (response.code === 200) {
            set({ statistics: response.data as any });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },
    }),
    {
      name: 'material-store',
      // 可选：配置存储选项
      // getStorage: () => localStorage,
      // setStorage: () => localStorage,
    }
  )
);

export default useMaterialStore;
