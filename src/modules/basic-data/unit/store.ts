/**
 * 计量单位模块Zustand Store
 * 管理单位的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';

import { unitApi } from './api';
import {
  DEFAULT_UNITS,
  DEFAULT_UNIT_GROUPS,
} from './types';
import type {
  UnitItem,
  UnitGroup,
  UnitQuery,
  CreateUnitDTO,
  UpdateUnitDTO,
  UnitBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface UnitStore {
  // State
  units: UnitItem[];
  groups: UnitGroup[];
  selectedIds: string[];
  selectedGroupId: string;
  currentUnit: UnitItem | null;
  filters: UnitQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;

  // Actions
  loadUnits: (query?: UnitQuery) => Promise<void>;
  loadAllUnits: () => Promise<void>;
  loadGroups: () => Promise<void>;
  createUnit: (data: CreateUnitDTO) => Promise<void>;
  updateUnit: (data: UpdateUnitDTO) => Promise<void>;
  deleteUnits: (ids: string[]) => Promise<void>;
  batchUnits: (action: UnitBatchAction) => Promise<void>;
  updateStatus: (ids: string[], status: 'active' | 'disabled') => Promise<void>;
  setBaseUnit: (id: string) => Promise<void>;
  unsetBaseUnit: (id: string) => Promise<void>;

  // State setters
  setFilters: (filters: Partial<UnitQuery>) => void;
  setSelectedGroupId: (groupId: string) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentUnit: (unit: UnitItem | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 创建Zustand Store
export const useUnitStore = create<UnitStore>()(
  (set, get) => ({
    // 初始状态
    units: DEFAULT_UNITS,
    groups: DEFAULT_UNIT_GROUPS,
    selectedIds: [],
    selectedGroupId: 'all',
    currentUnit: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_UNITS.length,
    },
    loading: false,
    error: null,

    // Actions
    loadUnits: async (query?: UnitQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination, selectedGroupId: currentGroupId } = get();
        const finalQuery: UnitQuery = {
          ...currentFilters,
          ...query,
          groupId: query?.groupId || (currentGroupId === 'all' ? undefined : currentGroupId),
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await unitApi.getUnits(finalQuery);

        set({
          units: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载单位列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllUnits: async () => {
      try {
        const units = await unitApi.getAllUnits();
        set({ units });
      } catch (error: any) {
        console.error('加载所有单位失败:', error);
        set({ error: error?.message || '加载单位列表失败' });
      }
    },

    loadGroups: async () => {
      try {
        const groups = await unitApi.getGroupTree();
        set({ groups });
      } catch (error: any) {
        console.error('加载单位分组失败:', error);
        // 使用默认分组数据
        set({ groups: DEFAULT_UNIT_GROUPS });
      }
    },

    createUnit: async (data: CreateUnitDTO) => {
      set({ loading: true, error: null });

      try {
        const newUnit = await unitApi.createUnit(data);

        set(state => ({
          units: [newUnit, ...state.units],
          pagination: { ...state.pagination, total: state.pagination.total + 1 },
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '创建单位失败',
          loading: false,
        });
        throw error;
      }
    },

    updateUnit: async (data: UpdateUnitDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedUnit = await unitApi.updateUnit(data);

        set(state => ({
          units: state.units.map(u => u.id === data.id ? updatedUnit : u),
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '更新单位失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteUnits: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await unitApi.deleteUnits(ids);

        set(state => ({
          units: state.units.filter(u => !ids.includes(u.id)),
          pagination: { ...state.pagination, total: state.pagination.total - ids.length },
          selectedIds: [],
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '删除单位失败',
          loading: false,
        });
        throw error;
      }
    },

    batchUnits: async (action: UnitBatchAction) => {
      set({ loading: true, error: null });

      try {
        await unitApi.batchUnits(action);

        // 重新加载列表
        await get().loadUnits();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: 'active' | 'disabled') => {
      set({ loading: true, error: null });

      try {
        await unitApi.updateStatus(ids, status);

        set(state => ({
          units: state.units.map(unit =>
            ids.includes(unit.id) ? { ...unit, status } : unit
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

    setBaseUnit: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await unitApi.setBaseUnit(id);

        set(state => ({
          units: state.units.map(unit =>
            unit.id === id ? { ...unit, isBase: true } : unit
          ),
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '设置基础单位失败',
          loading: false,
        });
        throw error;
      }
    },

    unsetBaseUnit: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await unitApi.unsetBaseUnit(id);

        set(state => ({
          units: state.units.map(unit =>
            unit.id === id ? { ...unit, isBase: false } : unit
          ),
          loading: false
        }));
      } catch (error: any) {
        set({
          error: error?.message || '取消基础单位失败',
          loading: false,
        });
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<UnitQuery>) => {
      set(state => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, current: 1 }
      }));
    },

    setSelectedGroupId: (groupId: string) => {
      set({
        selectedGroupId: groupId,
        pagination: {
          current: 1,
          pageSize: 15,
          total: 0,
        },
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentUnit: (unit: UnitItem | null) => {
      set({ currentUnit: unit });
    },

    setPagination: (pagination: Partial<PaginationState>) => {
      set(state => ({
        pagination: { ...state.pagination, ...pagination }
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
        units: DEFAULT_UNITS,
        groups: DEFAULT_UNIT_GROUPS,
        selectedIds: [],
        selectedGroupId: 'all',
        currentUnit: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_UNITS.length,
        },
        loading: false,
        error: null,
      });
    },
  })
);