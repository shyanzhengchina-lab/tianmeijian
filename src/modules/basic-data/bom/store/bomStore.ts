/**
 * BOM模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BomHeader, BomChild, BomQuery } from '../types';
import { bomApi } from '../api/bomApi';

/**
 * BOM Store状态接口
 */
export interface BomState {
  // 数据状态
  boms: BomHeader[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: BomQuery;
  filters: Record<string, any>;
  pagination: { current: number; pageSize: number; total: number };

  // 选择状态
  selectedIds: string[];
  selectedBoms: BomHeader[];

  // 详情状态
  currentBom: BomHeader | null;
  bomDetails: BomChild[];

  // 统计数据
  statistics: any | null;

  // 成本计算结果
  costCalculation: {
    totalCost: number;
    materialCosts: Array<{
      materialId: string;
      materialName: string;
      quantity: number;
      unitCost: number;
    }>;
  } | null;

  // 版本历史
  versionHistory: BomHeader[];

  // UI状态
  showEditModal: boolean;
  showDetailDrawer: boolean;
  showVersionHistoryModal: boolean;
  showCopyModal: boolean;
  showCostCalculationDrawer: boolean;

  // Actions
  setBoms: (boms: BomHeader[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<BomQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setPagination: (pagination: { current: number; pageSize: number; total: number }) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadBoms: () => Promise<void>;
  refreshBoms: () => Promise<void>;
  createBom: (data: any) => Promise<void>;
  updateBom: (data: any) => Promise<void>;
  deleteBom: (id: string) => Promise<void>;
  deleteBoms: (ids: string[]) => Promise<void>;
  batchDeleteBoms: (ids: string[]) => Promise<void>;
  batchEnableBoms: (ids: string[]) => Promise<void>;
  batchDisableBoms: (ids: string[]) => Promise<void>;
  updateBomStatus: (ids: string[], status: 'draft' | 'audited' | 'approved' | 'disabled') => Promise<void>;
  loadBomById: (id: string) => Promise<BomHeader | null>;
  loadBomDetails: (bomId: string) => Promise<void>;
  setBomDetails: (details: BomChild[]) => void;
  addBomDetail: (detail: BomChild) => void;
  updateBomDetail: (id: string, detail: Partial<BomChild>) => void;
  removeBomDetail: (id: string) => void;
  copyBom: (id: string) => Promise<void>;
  reviewBom: (id: string, reviewer: string) => Promise<void>;
  unreviewBom: (id: string) => Promise<void>;
  approveBom: (id: string, approver: string) => Promise<void>;
  setAsDefault: (id: string) => Promise<void>;
  cancelDefault: (id: string) => Promise<void>;
  loadVersionHistory: (bomId: string) => Promise<void>;
  calculateCost: (bomId: string) => Promise<void>;
  checkCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  checkVersionConflict: (version: string, materialId: string, excludeId?: string) => Promise<boolean>;
  getAvailableMaterials: () => Promise<any[]>;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowVersionHistoryModal: (show: boolean) => void;
  setShowCopyModal: (show: boolean) => void;
  setShowCostCalculationDrawer: (show: boolean) => void;
  setCurrentBom: (bom: BomHeader | null) => void;
  loadStatistics: () => Promise<void>;
  importBoms: (file: File, validate?: boolean, updateMode?: 'create' | 'update' | 'skip') => Promise<void>;
  exportBoms: (query?: BomQuery, fileName?: string) => Promise<void>;
  reset: () => void;
}

/**
 * BOM Store
 */
export const useBomStore = create<BomState>()(
  persist(
    (set, get) => ({
      // 初始状态
      boms: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      pagination: {
        current: 1,
        pageSize: 15,
        total: 0,
      },
      selectedIds: [],
      selectedBoms: [],
      currentBom: null,
      bomDetails: [],
      statistics: null,
      costCalculation: null,
      versionHistory: [],
      showEditModal: false,
      showDetailDrawer: false,
      showVersionHistoryModal: false,
      showCopyModal: false,
      showCostCalculationDrawer: false,

      /**
       * 设置BOM列表数据
       */
      setBoms: (boms: BomHeader[], total: number) => {
        set({ boms, total, error: null });
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
      setQuery: (query: Partial<BomQuery>) => {
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
       * 设置分页信息
       */
      setPagination: (pagination: { current: number; pageSize: number; total: number }) => {
        set({ pagination });
      },

      /**
       * 设置选中ID列表
       */
      setSelectedIds: (ids: string[]) => {
        const { boms } = get();
        const selectedBoms = boms.filter(b => ids.includes(b.id));
        set({ selectedIds: ids, selectedBoms });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedBoms: [] });
      },

      /**
       * 加载BOM列表
       */
      loadBoms: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await bomApi.getBoms(query);

          if (response.code === 200) {
            set({
              boms: response.data.list as unknown as BomHeader[],
              total: response.data.total,
              pagination: {
                current: query.current || 1,
                pageSize: query.pageSize || 15,
                total: response.data.total,
              },
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
       * 刷新BOM列表
       */
      refreshBoms: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await bomApi.getBoms(query);

          if (response.code === 200) {
            set({
              boms: response.data.list as unknown as BomHeader[],
              total: response.data.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '刷新失败',
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
       * 创建BOM
       */
      createBom: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.createBom(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
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
       * 更新BOM
       */
      updateBom: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.updateBom(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
            set({ showEditModal: false, currentBom: null });
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
       * 删除BOM
       */
      deleteBom: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.deleteBom(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
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
       * 删除BOMs (别名函数，用于组件兼容)
       */
      deleteBoms: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.deleteBoms(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
            // 清除选择
            set({ selectedIds: [], selectedBoms: [] });
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
       * 批量删除BOM
       */
      batchDeleteBoms: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.deleteBoms(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
            // 清除选择
            set({ selectedIds: [], selectedBoms: [] });
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
       * 批量启用BOM
       */
      batchEnableBoms: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.batchEnable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
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
       * 批量禁用BOM
       */
      batchDisableBoms: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.batchDisable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
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
       * 更新BOM状态
       */
      updateBomStatus: async (ids: string[], status: 'draft' | 'audited' | 'approved' | 'disabled') => {
        set({ loading: true, error: null });

        try {
          // Map status values to API expectations
          const apiStatus = status === 'approved' ? 'active' : status === 'disabled' ? 'inactive' : status === 'audited' ? 'active' : 'draft';
          const response = await bomApi.updateStatus({ ids, status: apiStatus });

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
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
       * 根据ID加载BOM
       */
      loadBomById: async (id: string): Promise<BomHeader | null> => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.getBomById(id);

          if (response.code === 200) {
            set({
              currentBom: response.data as unknown as BomHeader,
              loading: false,
            });
            return response.data as unknown as BomHeader;
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
       * 加载BOM明细
       */
      loadBomDetails: async (bomId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.getBomDetails(bomId);

          if (response.code === 200) {
            set({
              bomDetails: response.data as unknown as BomChild[],
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载明细失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载明细失败',
          });
        }
      },

      /**
       * 设置BOM明细
       */
      setBomDetails: (details: BomChild[]) => {
        set({ bomDetails: details });
      },

      /**
       * 添加BOM明细
       */
      addBomDetail: (detail: BomChild) => {
        set((state) => ({
          bomDetails: [...state.bomDetails, detail],
        }));
      },

      /**
       * 更新BOM明细
       */
      updateBomDetail: (id: string, detail: Partial<BomChild>) => {
        set((state) => ({
          bomDetails: state.bomDetails.map(d =>
            d.id === id ? { ...d, ...detail } : d
          ),
        }));
      },

      /**
       * 删除BOM明细
       */
      removeBomDetail: (id: string) => {
        set((state) => ({
          bomDetails: state.bomDetails.filter(d => d.id !== id),
        }));
      },

      /**
       * 复制BOM
       */
      copyBom: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.copyBom(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
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
       * 审核BOM
       */
      reviewBom: async (id: string, reviewer: string) => {
        set({ loading: true, error: null });

        try {
          // 业务状态'audited'映射到API状态'active'
          const response = await bomApi.updateStatus({
            ids: [id],
            status: 'active',
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
          } else {
            set({
              loading: false,
              error: response.message || '审核失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '审核失败',
          });
        }
      },

      /**
       * 撤销审核
       */
      unreviewBom: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.updateStatus({
            ids: [id],
            status: 'draft',
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
          } else {
            set({
              loading: false,
              error: response.message || '撤销审核失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '撤销审核失败',
          });
        }
      },

      /**
       * 批准BOM
       */
      approveBom: async (id: string, approver: string) => {
        set({ loading: true, error: null });

        try {
          // 业务状态'approved'映射到API状态'active'
          const response = await bomApi.updateStatus({
            ids: [id],
            status: 'active',
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
          } else {
            set({
              loading: false,
              error: response.message || '批准失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批准失败',
          });
        }
      },

      /**
       * 设置为默认BOM
       */
      setAsDefault: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.setAsDefault(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
          } else {
            set({
              loading: false,
              error: response.message || '设置失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '设置失败',
          });
        }
      },

      /**
       * 取消默认BOM
       */
      cancelDefault: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.cancelDefault(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
          } else {
            set({
              loading: false,
              error: response.message || '取消失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '取消失败',
          });
        }
      },

      /**
       * 加载版本历史
       */
      loadVersionHistory: async (bomId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.getVersionHistory(bomId);

          if (response.code === 200) {
            set({
              versionHistory: response.data as unknown as BomHeader[],
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载版本历史失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载版本历史失败',
          });
        }
      },

      /**
       * 计算BOM成本
       */
      calculateCost: async (bomId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.calculateCost(bomId);

          if (response.code === 200) {
            set({
              costCalculation: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '成本计算失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '成本计算失败',
          });
        }
      },

      /**
       * 检查BOM编码唯一性
       */
      checkCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await bomApi.checkCodeUnique(code, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 检查版本冲突
       */
      checkVersionConflict: async (version: string, materialId: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await bomApi.checkVersionConflict(version, materialId, excludeId);
          return response.code === 200 && response.data.conflict;
        } catch (error: any) {
          console.error('检查版本冲突失败:', error);
          return false;
        }
      },

      /**
       * 获取可用物料列表
       */
      getAvailableMaterials: async (): Promise<any[]> => {
        try {
          const response = await bomApi.getAvailableMaterials();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用物料失败:', error);
          return [];
        }
      },

      /**
       * 显示创建弹窗
       */
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
       * 显示版本历史弹窗
       */
      setShowVersionHistoryModal: (show: boolean) => {
        set({ showVersionHistoryModal: show });
      },

      /**
       * 显示复制弹窗
       */
      setShowCopyModal: (show: boolean) => {
        set({ showCopyModal: show });
      },

      /**
       * 显示成本计算抽屉
       */
      setShowCostCalculationDrawer: (show: boolean) => {
        set({ showCostCalculationDrawer: show });
      },

      /**
       * 设置当前BOM
       */
      setCurrentBom: (bom: BomHeader | null) => {
        set({ currentBom: bom });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          // 暂时使用API获取统计数据，如果没有专门的统计API，可以基于现有数据计算
          const { boms } = get();
          const statistics: any = {
            totalCount: boms.length,
            activeCount: boms.filter(b => b.status === 'approved').length,
            inactiveCount: boms.filter(b => b.status === 'disabled').length,
            draftCount: boms.filter(b => b.status === 'draft').length,
            auditedCount: boms.filter(b => b.status === 'audited').length,
          };
          set({ statistics });
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入BOM
       */
      importBoms: async (
        file: File,
        validate?: boolean,
        updateMode?: 'create' | 'update' | 'skip'
      ) => {
        set({ loading: true, error: null });

        try {
          const response = await bomApi.importBoms({
            file,
            validate,
            updateMode,
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadBoms();
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
       * 导出BOM
       */
      exportBoms: async (query?: BomQuery, fileName?: string) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          await bomApi.exportBoms(query || currentQuery, fileName);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          boms: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          pagination: {
            current: 1,
            pageSize: 15,
            total: 0,
          },
          selectedIds: [],
          selectedBoms: [],
          currentBom: null,
          bomDetails: [],
          statistics: null,
          costCalculation: null,
          versionHistory: [],
          showEditModal: false,
          showDetailDrawer: false,
          showVersionHistoryModal: false,
          showCopyModal: false,
          showCostCalculationDrawer: false,
        });
      },
    }),
    {
      name: 'bom-store',
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

export default useBomStore;
