/**
 * 工艺路线明细模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RoutingDetail,
  RoutingDetailQuery,
  CreateRoutingDetailDTO,
  UpdateRoutingDetailDTO,
  AdjustSequenceDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';
import { message } from 'antd';

/**
 * RoutingDetail Store状态接口
 */
export interface RoutingDetailState {
  // 工艺路线明细列表状态
  details: RoutingDetail[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: RoutingDetailQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedDetails: RoutingDetail[];

  // 详情状态
  currentDetail: RoutingDetail | null;
  showDetailDrawer: boolean;

  // 工序顺序状态
  detailsByRouting: Map<string, RoutingDetail[]>; // 按工艺路线ID分组

  // 操作状态
  operationLoading: boolean;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showSequenceModal: boolean;

  // Actions
  setDetails: (details: RoutingDetail[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<RoutingDetailQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentDetail: (detail: RoutingDetail | null) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setDetailsByRouting: (routingId: string, details: RoutingDetail[]) => void;

  // 工艺路线明细操作
  loadDetails: () => Promise<void>;
  refreshDetails: () => Promise<void>;
  createDetail: (data: CreateRoutingDetailDTO) => Promise<void>;
  updateDetail: (data: UpdateRoutingDetailDTO) => Promise<void>;
  deleteDetails: (ids: string[]) => Promise<void>;
  updateStatus: (ids: string[], status: 'ACTIVE' | 'INACTIVE') => Promise<void>;

  // 按工艺路线加载明细
  loadDetailsByRouting: (routingId: string) => Promise<void>;

  // 顺序操作
  adjustSequence: (data: AdjustSequenceDTO) => Promise<void>;
  moveUp: (detailId: string) => Promise<void>;
  moveDown: (detailId: string) => Promise<void>;

  // UI操作
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowSequenceModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * RoutingDetail Store
 */
export const useRoutingDetailStore = create<RoutingDetailState>()(
  persist(
    (set, get) => ({
      // 初始状态
      details: [],
      total: 0,
      loading: false,
      error: null,

      query: { current: 1, pageSize: 15 } as any,
      filters: {},
      selectedIds: [],
      selectedDetails: [],
      currentDetail: null,
      showDetailDrawer: false,
      detailsByRouting: new Map(),
      operationLoading: false,
      showCreateModal: false,
      showEditModal: false,
      showSequenceModal: false,

      /**
       * 设置工艺路线明细列表数据
       */
      setDetails: (detailList: RoutingDetail[], total: number) => {
        set({ details: detailList, total, error: null });
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
      setQuery: (query: Partial<RoutingDetailQuery>) => {
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
        const { details } = get();
        const selectedDetails = details.filter(d => ids.includes(d.id));
        set({ selectedIds: ids, selectedDetails });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedIds: [],
          selectedDetails: [],
        });
      },

      /**
       * 设置当前工艺路线明细
       */
      setCurrentDetail: (detail: RoutingDetail | null) => {
        set({ currentDetail: detail });
      },

      /**
       * 显示详情抽屉
       */
      setShowDetailDrawer: (show: boolean) => {
        set({ showDetailDrawer: show });
      },

      /**
       * 设置按工艺路线分组的明细
       */
      setDetailsByRouting: (routingId: string, detailList: RoutingDetail[]) => {
        set((state) => {
          const newDetailsByRouting = new Map(state.detailsByRouting);
          newDetailsByRouting.set(routingId, detailList);
          return { detailsByRouting: newDetailsByRouting };
        });
      },

      /**
       * 加载工艺路线明细列表
       */
      loadDetails: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载工艺路线明细数据
          // const response = await routingDetailApi.getDetails(query);

          // if (response.code === 200) {
          //   set({
          //     details: response.data.list,
          //     total: response.data.total,
          //     loading: false,
          //   });
          // }

          // 暂时使用空数据
          setTimeout(() => {
            set({
              details: [],
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
       * 刷新工艺路线明细列表
       */
      refreshDetails: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API刷新工艺路线明细数据
          // const response = await routingDetailApi.refreshDetails(query);

          // if (response.code === 200) {
          //   set({
          //     details: response.data.list,
          //     total: response.data.total,
          //     loading: false,
          //   });
          // }

          // 模拟刷新过程
          setTimeout(() => {
            set({
              details: [],
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
       * 创建工艺路线明细
       */
      createDetail: async (data: CreateRoutingDetailDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API创建工艺路线明细
          // const response = await routingDetailApi.createDetail(data);

          // if (response.code === 200) {
          //   await get().loadDetails();
          //   await get().loadDetailsByRouting(data.routingId);
          //   set({ showCreateModal: false });
          //   message.success('工艺路线明细创建成功！');
          // }

          // 模拟创建过程
          setTimeout(() => {
            message.success('工艺路线明细创建成功！');
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
       * 更新工艺路线明细
       */
      updateDetail: async (data: UpdateRoutingDetailDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新工艺路线明细
          // const response = await routingDetailApi.updateDetail(data);

          // if (response.code === 200) {
          //   await get().loadDetails();
          //   await get().loadDetailsByRouting(data.routingId);
          //   set({ showEditModal: false });
          //   message.success('工艺路线明细更新成功！');
          // }

          // 模拟更新过程
          setTimeout(() => {
            message.success('工艺路线明细更新成功！');
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
       * 删除工艺路线明细
       */
      deleteDetails: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API删除工艺路线明细
          // const response = await routingDetailApi.deleteDetails(ids);

          // if (response.code === 200) {
          //   await get().loadDetails();
          //   get().clearSelection();
          //   message.success(`成功删除 ${ids.length} 个工艺路线明细`);
          // }

          // 模拟删除过程
          setTimeout(() => {
            message.success(`成功删除 ${ids.length} 个工艺路线明细`);
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
       * 更新工艺路线明细状态
       */
      updateStatus: async (ids: string[], status: 'ACTIVE' | 'INACTIVE') => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新工艺路线明细状态
          // const response = await routingDetailApi.updateStatus(ids, status);

          // if (response.code === 200) {
          //   await get().loadDetails();
          //   message.success(`成功${status === 'ACTIVE' ? '生效' : '停用'} ${ids.length} 个工艺路线明细`);
          // }

          // 模拟更新过程
          setTimeout(() => {
            message.success(`成功${status === 'ACTIVE' ? '生效' : '停用'} ${ids.length} 个工艺路线明细`);
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
       * 按工艺路线加载明细
       */
      loadDetailsByRouting: async (routingId: string) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API按工艺路线加载明细
          // const response = await routingDetailApi.getDetailsByRouting(routingId);

          // if (response.code === 200) {
          //   set({
          //     details: response.data,
          //     loading: false,
          //   });
          //   get().setDetailsByRouting(routingId, response.data);
          // }

          // 模拟加载过程
          setTimeout(() => {
            set({
              details: [],
              loading: false,
            });
            get().setDetailsByRouting(routingId, []);
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 调整工序顺序
       */
      adjustSequence: async (data: AdjustSequenceDTO) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API调整工序顺序
          // const response = await routingDetailApi.adjustSequence(data);

          // if (response.code === 200) {
          //   await get().loadDetails();
          //   message.success('工序顺序调整成功！');
          // }

          // 模拟调整过程
          setTimeout(() => {
            message.success('工序顺序调整成功！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '调整失败',
          });
        }
      },

      /**
       * 上移工序
       */
      moveUp: async (detailId: string) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API上移工序
          // const response = await routingDetailApi.moveUp(detailId);

          // if (response.code === 200) {
          //   await get().loadDetails();
          //   message.success('工序已上移！');
          // }

          // 模拟上移过程
          setTimeout(() => {
            message.success('工序已上移！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '上移失败',
          });
        }
      },

      /**
       * 下移工序
       */
      moveDown: async (detailId: string) => {
        set({ operationLoading: true, error: null });

        try {
          // TODO: 调用API下移工序
          // const response = await routingDetailApi.moveDown(detailId);

          // if (response.code === 200) {
          //   await get().loadDetails();
          //   message.success('工序已下移！');
          // }

          // 模拟下移过程
          setTimeout(() => {
            message.success('工序已下移！');
            set({ operationLoading: false });
          }, 500);
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '下移失败',
          });
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentDetail: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示顺序调整弹窗
       */
      setShowSequenceModal: (show: boolean) => {
        set({ showSequenceModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          details: [],
          total: 0,
          loading: false,
          error: null,
          query: { current: 1, pageSize: 15 } as any,
          filters: {},
          selectedIds: [],
          selectedDetails: [],
          currentDetail: null,
          showDetailDrawer: false,
          detailsByRouting: new Map(),
          operationLoading: false,
          showCreateModal: false,
          showEditModal: false,
          showSequenceModal: false,
        });
      },
    }),
    {
      name: 'routing-detail-store',
      // 只持久化核心状态
      partialize: (state) => ({
        details: state.details,
        query: state.query,
        filters: state.filters,
        // 不持久化 detailsByRouting，避免内存泄漏
      }),
    }
  )
);

export default useRoutingDetailStore;