/**
 * 产品系列模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ProductSeries,
  ProductSeriesQuery,
  CreateProductSeriesDTO,
  UpdateProductSeriesDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';
import { message } from 'antd';

/**
 * ProductSeries Store状态接口
 */
export interface ProductSeriesState {
  // 产品系列列表状态
  series: ProductSeries[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: ProductSeriesQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedSeries: ProductSeries[];

  // 详情状态
  currentSeries: ProductSeries | null;
  showDetailDrawer: boolean;

  // 树形状态
  treeData: ProductSeries[];
  expandedKeys: React.Key[];
  selectedKeys: React.Key[];

  // 操作状态
  operationLoading: boolean;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;

  // Actions
  setSeries: (series: ProductSeries[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<ProductSeriesQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentSeries: (series: ProductSeries | null) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setTreeData: (treeData: ProductSeries[]) => void;
  setExpandedKeys: (keys: React.Key[]) => void;
  setSelectedKeys: (keys: React.Key[]) => void;

  // 产品系列操作
  loadSeries: () => Promise<void>;
  refreshSeries: () => Promise<void>;
  createSeries: (data: CreateProductSeriesDTO) => Promise<void>;
  updateSeries: (data: UpdateProductSeriesDTO) => Promise<void>;
  deleteSeries: (ids: string[]) => Promise<void>;
  updateStatus: (ids: string[], status: 'ACTIVE' | 'INACTIVE') => Promise<void>;

  // 树形操作
  loadTree: () => Promise<void>;
  moveSeries: (seriesId: string, targetParentId: string | null) => Promise<void>;

  // UI操作
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * ProductSeries Store
 */
export const useProductSeriesStore = create<ProductSeriesState>()(
  persist(
    (set, get) => ({
      // 初始状态
      series: [],
      total: 0,
      loading: false,
      error: null,

      query: { current: 1, pageSize: 15 } as any,
      filters: {},
      selectedIds: [],
      selectedSeries: [],
      currentSeries: null,
      showDetailDrawer: false,
      treeData: [],
      expandedKeys: [],
      selectedKeys: [],
      operationLoading: false,
      showCreateModal: false,
      showEditModal: false,

      /**
       * 设置产品系列列表数据
       */
      setSeries: (seriesList: ProductSeries[], total: number) => {
        set({ series: seriesList, total, error: null });
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
      setQuery: (query: Partial<ProductSeriesQuery>) => {
        set((state) => ({
          query: { ...state.query, ...query, current: 1 },
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
        const { series } = get();
        const selectedSeries = series.filter(s => ids.includes(s.id));
        set({ selectedIds: ids, selectedSeries });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedIds: [],
          selectedSeries: [],
        });
      },

      /**
       * 设置当前产品系列
       */
      setCurrentSeries: (seriesItem: ProductSeries | null) => {
        set({ currentSeries: seriesItem });
      },

      /**
       * 显示详情抽屉
       */
      setShowDetailDrawer: (show: boolean) => {
        set({ showDetailDrawer: show });
      },

      /**
       * 设置树形数据
       */
      setTreeData: (treeData: ProductSeries[]) => {
        set({ treeData });
      },

      /**
       * 设置展开的节点
       */
      setExpandedKeys: (keys: React.Key[]) => {
        set({ expandedKeys: keys });
      },

      /**
       * 设置选中的节点
       */
      setSelectedKeys: (keys: React.Key[]) => {
        set({ selectedKeys: keys });
      },

      /**
       * 加载产品系列列表
       */
      loadSeries: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载产品系列数据
          // const response = await productSeriesApi.getSeries(query);

          // if (response.code === 200) {
          //   set({
          //     series: response.data.list,
          //     total: response.data.total,
          //     loading: false,
          //   });
          // }

          // 暂时使用空数据
          setTimeout(() => {
            set({
              series: [],
              total: 0,
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 刷新产品系列列表
       */
      refreshSeries: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API刷新产品系列数据
          // const response = await productSeriesApi.refreshSeries(query);

          // if (response.code === 200) {
          //   set({
          //     series: response.data.list,
          //     total: response.data.total,
          //     loading: false,
          //   });
          // }

          // 模拟刷新过程
          setTimeout(() => {
            set({
              series: [],
              total: 0,
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '刷新失败',
          });
        }
      },

      /**
       * 创建产品系列
       */
      createSeries: async (data: CreateProductSeriesDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API创建产品系列
          // const response = await productSeriesApi.createSeries(data);

          // if (response.code === 200) {
          //   await get().loadSeries();
          //   await get().loadTree();
          //   set({ showCreateModal: false });
          //   message.success('产品系列创建成功！');
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '创建失败',
          //   });
          // }

          // 模拟创建过程
          setTimeout(() => {
            message.success('产品系列创建成功！');
            set({ loading: false, showCreateModal: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
        }
      },

      /**
       * 更新产品系列
       */
      updateSeries: async (data: UpdateProductSeriesDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新产品系列
          // const response = await productSeriesApi.updateSeries(data);

          // if (response.code === 200) {
          //   await get().loadSeries();
          //   await get().loadTree();
          //   set({ showEditModal: false });
          //   message.success('产品系列更新成功！');
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '更新失败',
          //   });
          // }

          // 模拟更新过程
          setTimeout(() => {
            message.success('产品系列更新成功！');
            set({ loading: false, showEditModal: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
        }
      },

      /**
       * 删除产品系列
       */
      deleteSeries: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API删除产品系列
          // const response = await productSeriesApi.deleteSeries(ids);

          // if (response.code === 200) {
          //   await get().loadSeries();
          //   await get().loadTree();
          //   get().clearSelection();
          //   message.success(`成功删除 ${ids.length} 个产品系列`);
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '删除失败',
          //   });
          // }

          // 模拟删除过程
          setTimeout(() => {
            message.success(`成功删除 ${ids.length} 个产品系列`);
            set({ loading: false });
            get().clearSelection();
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
        }
      },

      /**
       * 更新产品系列状态
       */
      updateStatus: async (ids: string[], status: 'ACTIVE' | 'INACTIVE') => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新产品系列状态
          // const response = await productSeriesApi.updateStatus(ids, status);

          // if (response.code === 200) {
          //   await get().loadSeries();
          //   await get().loadTree();
          //   message.success(`成功${status === 'ACTIVE' ? '生效' : '停用'} ${ids.length} 个产品系列`);
          // }

          // 模拟更新过程
          setTimeout(() => {
            message.success(`成功${status === 'ACTIVE' ? '生效' : '停用'} ${ids.length} 个产品系列`);
            set({ loading: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '状态更新失败',
          });
        }
      },

      /**
       * 加载树形数据
       */
      loadTree: async () => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载树形数据
          // const response = await productSeriesApi.getTree();

          // if (response.code === 200) {
          //   set({
          //     treeData: response.data,
          //     loading: false,
          //   });
          // }

          // 模拟加载过程
          setTimeout(() => {
            set({
              treeData: [],
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 移动产品系列
       */
      moveSeries: async (seriesId: string, targetParentId: string | null) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API移动产品系列
          // const response = await productSeriesApi.moveSeries(seriesId, targetParentId);

          // if (response.code === 200) {
          //   await get().loadSeries();
          //   await get().loadTree();
          //   message.success('产品系列移动成功！');
          // }

          // 模拟移动过程
          setTimeout(() => {
            message.success('产品系列移动成功！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '移动失败',
          });
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentSeries: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          series: [],
          total: 0,
          loading: false,
          error: null,
          query: { current: 1, pageSize: 15 } as any,
          filters: {},
          selectedIds: [],
          selectedSeries: [],
          currentSeries: null,
          showDetailDrawer: false,
          treeData: [],
          expandedKeys: [],
          selectedKeys: [],
          operationLoading: false,
          showCreateModal: false,
          showEditModal: false,
        });
      },
    }),
    {
      name: 'product-series-store',
      // 只持久化核心状态
      partialize: (state) => ({
        series: state.series,
        query: state.query,
        filters: state.filters,
        expandedKeys: state.expandedKeys,
      }),
    }
  )
);

export default useProductSeriesStore;