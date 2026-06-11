/**
 * 物料模块Zustand Store
 * 管理物料的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';

import { materialApi } from './api';
import type {
  Material,
  MaterialQuery,
  CreateMaterialDTO,
  UpdateMaterialDTO,
  MaterialCategory,
  MaterialBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface MaterialStore {
  // State
  materials: Material[];
  categories: MaterialCategory[];
  selectedIds: string[];
  currentMaterial: Material | null;
  filters: MaterialQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;

  // Actions
  loadMaterials: (query?: MaterialQuery) => Promise<void>;
  loadCategories: () => Promise<void>;
  createMaterial: (data: CreateMaterialDTO) => Promise<void>;
  updateMaterial: (data: UpdateMaterialDTO) => Promise<void>;
  deleteMaterials: (ids: string[]) => Promise<void>;
  batchMaterials: (action: MaterialBatchAction) => Promise<void>;
  updateStatus: (ids: string[], status: 'active' | 'inactive') => Promise<void>;
  loadCategoryTree: () => Promise<void>;

  // State setters
  setFilters: (filters: Partial<MaterialQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentMaterial: (material: Material | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 单位相关（表单所需）
  units: Array<{ id: string; name: string; code: string }>;
  loadUnits: () => Promise<void>;
}

// 创建Zustand Store
export const useMaterialStore = create<MaterialStore>()(
  (set, get) => ({
    // 初始状态
    materials: [],
    categories: [],
    selectedIds: [],
    currentMaterial: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: 0,
    },
    loading: false,
    error: null,

    // Actions
    loadMaterials: async (query?: MaterialQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: MaterialQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await materialApi.getMaterials(finalQuery);

        set({
          materials: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载物料列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadCategories: async () => {
      try {
        const categories = await materialApi.getCategoryTree();
        set({ categories });
      } catch (error: any) {
        console.error('加载物料分类失败:', error);
      }
    },

    createMaterial: async (data: CreateMaterialDTO) => {
      set({ loading: true, error: null });

      try {
        const newMaterial = await materialApi.createMaterial(data);

        set(state => ({
          materials: [newMaterial, ...get().materials],
          pagination: { ...get().pagination, total: get().pagination.total + 1 },
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '创建物料失败',
          loading: false,
        });
        throw error;
      }
    },

    updateMaterial: async (data: UpdateMaterialDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedMaterial = await materialApi.updateMaterial(data);

        set(state => ({
          materials: get().materials.map(m => m.id === data.id ? updatedMaterial : m),
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '更新物料失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteMaterials: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await materialApi.deleteMaterials(ids);

        set(state => ({
          materials: get().materials.filter(m => !ids.includes(m.id)),
          pagination: { ...get().pagination, total: get().pagination.total - ids.length },
          selectedIds: [],
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '删除物料失败',
          loading: false,
        });
        throw error;
      }
    },

    batchMaterials: async (action: MaterialBatchAction) => {
      set({ loading: true, error: null });

      try {
        await materialApi.batchMaterials(action);

        // 重新加载列表
        await get().loadMaterials();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: 'active' | 'inactive') => {
      set({ loading: true, error: null });

      try {
        await materialApi.updateStatus(ids, status);

        set(state => ({
          materials: get().materials.map(material =>
            ids.includes(material.id) ? { ...material, status } : material
          ),
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '更新状态失败',
          loading: false,
        });
        throw error;
      }
    },

    loadCategoryTree: async () => {
      try {
        const categories = await materialApi.getCategoryTree();
        set({ categories });
      } catch (error: any) {
        console.error('加载物料分类失败:', error);
      }
    },

    // State setters
    setFilters: (filters: Partial<MaterialQuery>) => {
      set(state => ({
        filters: { ...get().filters, ...filters },
        pagination: { ...get().pagination, current: 1 }
      }));
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentMaterial: (material: Material | null) => {
      set({ currentMaterial: material });
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
        materials: [],
        categories: [],
        selectedIds: [],
        currentMaterial: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: 0,
        },
        loading: false,
        error: null,
      });
    },

    // 单位相关
    units: [],
    loadUnits: async () => { set({ units: [] }); },
  })
);