/**
 * 物料模块状态管理Store (带进度追踪)
 * 使用Zustand进行模块级状态管理，集成了批量操作进度追踪
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Material, MaterialQuery, MaterialStatistics } from '../types';
import { materialApi } from '../api/materialApi';
import { useBatchOperation } from '../../../../shared/hooks/useBatchOperation';
import { message } from 'antd';

/**
 * 批量操作进度状态
 */
export interface BatchProgressInfo {
  visible: boolean;
  title: string;
  operationType: string;
  total: number;
  processed: number;
  successCount: number;
  failedCount: number;
  items: Array<{
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
    error?: string;
  }>;
  isCancelled: boolean;
  isComplete: boolean;
}

/**
 * 物料Store状态接口
 */
export interface MaterialStateWithProgress {
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

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  currentMaterial: Material | null;

  // 批量操作进度
  batchProgress: BatchProgressInfo;

  // Actions
  setMaterials: (materials: Material[], total: number) => void;
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
  batchDeleteMaterialsWithProgress: (ids: string[]) => Promise<void>;
  batchEnableMaterialsWithProgress: (ids: string[]) => Promise<void>;
  batchDisableMaterialsWithProgress: (ids: string[]) => Promise<void>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setCurrentMaterial: (material: Material | null) => void;
  loadStatistics: () => Promise<void>;
  setBatchProgress: (progress: Partial<BatchProgressInfo>) => void;
  resetBatchProgress: () => void;
}

/**
 * 物料Store (带进度追踪)
 */
export const useMaterialStoreWithProgress = create<MaterialStateWithProgress>()(
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
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      currentMaterial: null,
      batchProgress: {
        visible: false,
        title: '',
        operationType: '',
        total: 0,
        processed: 0,
        successCount: 0,
        failedCount: 0,
        items: [],
        isCancelled: false,
        isComplete: false,
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
       * 批量删除物料 (无进度)
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
       * 批量启用物料 (无进度)
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
       * 批量禁用物料 (无进度)
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
       * 批量删除物料 (带进度)
       */
      batchDeleteMaterialsWithProgress: async (ids: string[]) => {
        const { materials } = get();
        const selectedMaterials = materials.filter(m => ids.includes(m.id));

        // 初始化进度
        set({
          batchProgress: {
            visible: true,
            title: '批量删除物料',
            operationType: '正在删除...',
            total: ids.length,
            processed: 0,
            successCount: 0,
            failedCount: 0,
            items: selectedMaterials.map(m => ({
              id: m.id,
              name: `${m.code} - ${m.name}`,
              status: 'pending' as const,
            })),
            isCancelled: false,
            isComplete: false,
          },
        });

        const updateProgress = (updates: Partial<BatchProgressInfo>) => {
          set(state => ({
            batchProgress: { ...state.batchProgress, ...updates },
          }));
        };

        let successCount = 0;
        let failedCount = 0;

        try {
          for (let i = 0; i < selectedMaterials.length; i++) {
            const material = selectedMaterials[i];
            const items = get().batchProgress.items;

            // 更新为处理中
            updateProgress({
              items: items.map(item =>
                item.id === material.id
                  ? { ...item, status: 'processing' as const }
                  : item
              ),
            });

            try {
              // 删除单个物料
              await materialApi.deleteMaterial(material.id);

              // 更新为成功
              updateProgress({
                items: items.map(item =>
                  item.id === material.id
                    ? { ...item, status: 'success' as const }
                    : item
                ),
                processed: i + 1,
                successCount: successCount + 1,
              });
              successCount++;
            } catch (error: any) {
              // 更新为失败
              updateProgress({
                items: items.map(item =>
                  item.id === material.id
                    ? { ...item, status: 'failed' as const, error: error.message }
                    : item
                ),
                processed: i + 1,
                failedCount: failedCount + 1,
              });
              failedCount++;
            }
          }

          // 标记完成
          updateProgress({
            isComplete: true,
            operationType: '删除完成',
          });

          // 刷新列表
          await get().loadMaterials();
          set({ selectedIds: [], selectedMaterials: [] });

          // 显示结果
          if (failedCount === 0) {
            message.success(`成功删除 ${successCount} 条记录`);
          } else {
            message.warning(`删除完成: 成功 ${successCount} 条，失败 ${failedCount} 条`);
          }
        } catch (error: any) {
          updateProgress({
            isComplete: true,
            operationType: '删除失败',
          });
          message.error('批量删除发生异常');
        }
      },

      /**
       * 批量启用物料 (带进度)
       */
      batchEnableMaterialsWithProgress: async (ids: string[]) => {
        const { materials } = get();
        const selectedMaterials = materials.filter(m => ids.includes(m.id));

        // 初始化进度
        set({
          batchProgress: {
            visible: true,
            title: '批量启用物料',
            operationType: '正在启用...',
            total: ids.length,
            processed: 0,
            successCount: 0,
            failedCount: 0,
            items: selectedMaterials.map(m => ({
              id: m.id,
              name: `${m.code} - ${m.name}`,
              status: 'pending' as const,
            })),
            isCancelled: false,
            isComplete: false,
          },
        });

        const updateProgress = (updates: Partial<BatchProgressInfo>) => {
          set(state => ({
            batchProgress: { ...state.batchProgress, ...updates },
          }));
        };

        let successCount = 0;
        let failedCount = 0;

        try {
          for (let i = 0; i < selectedMaterials.length; i++) {
            const material = selectedMaterials[i];
            const items = get().batchProgress.items;

            // 更新为处理中
            updateProgress({
              items: items.map(item =>
                item.id === material.id
                  ? { ...item, status: 'processing' as const }
                  : item
              ),
            });

            try {
              // 启用单个物料
              await materialApi.updateStatus({ ids: [material.id], status: 'active' });

              // 更新为成功
              updateProgress({
                items: items.map(item =>
                  item.id === material.id
                    ? { ...item, status: 'success' as const }
                    : item
                ),
                processed: i + 1,
                successCount: successCount + 1,
              });
              successCount++;
            } catch (error: any) {
              // 更新为失败
              updateProgress({
                items: items.map(item =>
                  item.id === material.id
                    ? { ...item, status: 'failed' as const, error: error.message }
                    : item
                ),
                processed: i + 1,
                failedCount: failedCount + 1,
              });
              failedCount++;
            }
          }

          // 标记完成
          updateProgress({
            isComplete: true,
            operationType: '启用完成',
          });

          // 刷新列表
          await get().loadMaterials();

          // 显示结果
          if (failedCount === 0) {
            message.success(`成功启用 ${successCount} 条记录`);
          } else {
            message.warning(`启用完成: 成功 ${successCount} 条，失败 ${failedCount} 条`);
          }
        } catch (error: any) {
          updateProgress({
            isComplete: true,
            operationType: '启用失败',
          });
          message.error('批量启用发生异常');
        }
      },

      /**
       * 批量禁用物料 (带进度)
       */
      batchDisableMaterialsWithProgress: async (ids: string[]) => {
        const { materials } = get();
        const selectedMaterials = materials.filter(m => ids.includes(m.id));

        // 初始化进度
        set({
          batchProgress: {
            visible: true,
            title: '批量禁用物料',
            operationType: '正在禁用...',
            total: ids.length,
            processed: 0,
            successCount: 0,
            failedCount: 0,
            items: selectedMaterials.map(m => ({
              id: m.id,
              name: `${m.code} - ${m.name}`,
              status: 'pending' as const,
            })),
            isCancelled: false,
            isComplete: false,
          },
        });

        const updateProgress = (updates: Partial<BatchProgressInfo>) => {
          set(state => ({
            batchProgress: { ...state.batchProgress, ...updates },
          }));
        };

        let successCount = 0;
        let failedCount = 0;

        try {
          for (let i = 0; i < selectedMaterials.length; i++) {
            const material = selectedMaterials[i];
            const items = get().batchProgress.items;

            // 更新为处理中
            updateProgress({
              items: items.map(item =>
                item.id === material.id
                  ? { ...item, status: 'processing' as const }
                  : item
              ),
            });

            try {
              // 禁用单个物料
              await materialApi.updateStatus({ ids: [material.id], status: 'inactive' });

              // 更新为成功
              updateProgress({
                items: items.map(item =>
                  item.id === material.id
                    ? { ...item, status: 'success' as const }
                    : item
                ),
                processed: i + 1,
                successCount: successCount + 1,
              });
              successCount++;
            } catch (error: any) {
              // 更新为失败
              updateProgress({
                items: items.map(item =>
                  item.id === material.id
                    ? { ...item, status: 'failed' as const, error: error.message }
                    : item
                ),
                processed: i + 1,
                failedCount: failedCount + 1,
              });
              failedCount++;
            }
          }

          // 标记完成
          updateProgress({
            isComplete: true,
            operationType: '禁用完成',
          });

          // 刷新列表
          await get().loadMaterials();

          // 显示结果
          if (failedCount === 0) {
            message.success(`成功禁用 ${successCount} 条记录`);
          } else {
            message.warning(`禁用完成: 成功 ${successCount} 条，失败 ${failedCount} 条`);
          }
        } catch (error: any) {
          updateProgress({
            isComplete: true,
            operationType: '禁用失败',
          });
          message.error('批量禁用发生异常');
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

      /**
       * 设置批量操作进度
       */
      setBatchProgress: (progress: Partial<BatchProgressInfo>) => {
        set(state => ({
          batchProgress: { ...state.batchProgress, ...progress },
        }));
      },

      /**
       * 重置批量操作进度
       */
      resetBatchProgress: () => {
        set({
          batchProgress: {
            visible: false,
            title: '',
            operationType: '',
            total: 0,
            processed: 0,
            successCount: 0,
            failedCount: 0,
            items: [],
            isCancelled: false,
            isComplete: false,
          },
        });
      },
    }),
    {
      name: 'material-store-with-progress',
    }
  )
);

export default useMaterialStoreWithProgress;
