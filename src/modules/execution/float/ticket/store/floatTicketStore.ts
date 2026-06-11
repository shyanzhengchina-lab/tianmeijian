/**
 * 浮票管理模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FloatTicket,
  FloatTicketQuery,
  CreateFloatTicketDTO,
  UpdateFloatTicketDTO,
  FloatTicketOperationDTO,
  PrintFloatTicketDTO,
  ReturnFloatTicketDTO,
  BatchPrintFloatTicketDTO,
} from '../types';
import type { PageQuery } from '../../../../../shared/api/requestTypes';
import { message } from 'antd';

/**
 * FloatTicket Store状态接口
 */
export interface FloatTicketState {
  // 浮票列表状态
  floatTickets: FloatTicket[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: FloatTicketQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedTicketIds: string[];
  selectedTickets: FloatTicket[];

  // 详情状态
  currentTicket: FloatTicket | null;
  showTicketDetail: boolean;

  // 批量操作状态
  batchOperationLoading: boolean;

  // 打印状态
  printingTicket: FloatTicket | null;
  printLoading: boolean;

  // UI状态
  activeTab: 'list' | 'detail' | 'print';
  showCreateModal: boolean;
  showEditModal: boolean;
  showPrintModal: boolean;
  showReturnModal: boolean;

  // Actions
  setFloatTickets: (tickets: FloatTicket[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<FloatTicketQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedTicketIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentTicket: (ticket: FloatTicket | null) => void;
  setShowTicketDetail: (show: boolean) => void;

  // 浮票操作
  loadFloatTickets: () => Promise<void>;
  refreshFloatTickets: () => Promise<void>;
  createFloatTicket: (data: CreateFloatTicketDTO) => Promise<void>;
  updateFloatTicket: (data: UpdateFloatTicketDTO) => Promise<void>;
  deleteFloatTickets: (ids: string[]) => Promise<void>;

  // 浮票工序操作
  passOperation: (data: FloatTicketOperationDTO) => Promise<void>;
  failOperation: (data: FloatTicketOperationDTO) => Promise<void>;
  skipOperation: (data: FloatTicketOperationDTO) => Promise<void>;

  // 打印操作
  printTicket: (ticketId: string) => Promise<void>;
  batchPrintTickets: (data: BatchPrintFloatTicketDTO) => Promise<void>;
  returnTicket: (data: ReturnFloatTicketDTO) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'list' | 'detail' | 'print') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowPrintModal: (show: boolean) => void;
  setShowReturnModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * FloatTicket Store
 */
export const useFloatTicketStore = create<FloatTicketState>()(
  persist(
    (set, get) => ({
      // 初始状态
      floatTickets: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedTicketIds: [],
      selectedTickets: [],
      currentTicket: null,
      showTicketDetail: false,
      batchOperationLoading: false,
      printingTicket: null,
      printLoading: false,
      activeTab: 'list',
      showCreateModal: false,
      showEditModal: false,
      showPrintModal: false,
      showReturnModal: false,

      /**
       * 设置浮票列表数据
       */
      setFloatTickets: (tickets: FloatTicket[], total: number) => {
        set({ floatTickets: tickets, total, error: null });
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
      setQuery: (query: Partial<FloatTicketQuery>) => {
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
       * 设置选中浮票ID列表
       */
      setSelectedTicketIds: (ids: string[]) => {
        const { floatTickets } = get();
        const selectedTickets = floatTickets.filter(t => ids.includes(t.id));
        set({ selectedTicketIds: ids, selectedTickets });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedTicketIds: [],
          selectedTickets: [],
        });
      },

      /**
       * 设置当前浮票
       */
      setCurrentTicket: (ticket: FloatTicket | null) => {
        set({ currentTicket: ticket });
      },

      /**
       * 显示浮票详情
       */
      setShowTicketDetail: (show: boolean) => {
        set({ showTicketDetail: show });
      },

      /**
       * 加载浮票列表
       */
      loadFloatTickets: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载浮票数据
          // const response = await floatTicketApi.getFloatTickets(query);

          // if (response.code === 200) {
          //   set({
          //     floatTickets: response.data.list,
          //     total: response.data.total,
          //     loading: false,
          //   });
          // }

          // 暂时使用空数据
          setTimeout(() => {
            set({
              floatTickets: [],
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
       * 刷新浮票列表
       */
      refreshFloatTickets: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          // TODO: 调用API刷新浮票数据
          // const response = await floatTicketApi.refreshFloatTickets(query);

          // if (response.code === 200) {
          //   set({
          //     floatTickets: response.data.list,
          //     total: response.data.total,
          //     loading: false,
          //   });
          // }

          // 模拟刷新过程
          setTimeout(() => {
            set({
              floatTickets: [],
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
       * 创建浮票
       */
      createFloatTicket: async (data: CreateFloatTicketDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API创建浮票
          // const response = await floatTicketApi.createFloatTicket(data);

          // if (response.code === 200) {
          //   await get().loadFloatTickets();
          //   set({ showCreateModal: false });
          //   message.success('浮票创建成功！');
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '创建失败',
          //   });
          // }

          // 模拟创建过程
          setTimeout(() => {
            message.success('浮票创建成功！');
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
       * 更新浮票
       */
      updateFloatTicket: async (data: UpdateFloatTicketDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API更新浮票
          // const response = await floatTicketApi.updateFloatTicket(data);

          // if (response.code === 200) {
          //   await get().loadFloatTickets();
          //   set({ showEditModal: false });
          //   message.success('浮票更新成功！');
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '更新失败',
          //   });
          // }

          // 模拟更新过程
          setTimeout(() => {
            message.success('浮票更新成功！');
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
       * 删除浮票
       */
      deleteFloatTickets: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API删除浮票
          // const response = await floatTicketApi.deleteFloatTickets(ids);

          // if (response.code === 200) {
          //   await get().loadFloatTickets();
          //   get().clearSelection();
          //   message.success(`成功删除 ${ids.length} 个浮票`);
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '删除失败',
          //   });
          // }

          // 模拟删除过程
          setTimeout(() => {
            message.success(`成功删除 ${ids.length} 个浮票`);
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
       * 浮票工序操作
       */
      passOperation: async (data: FloatTicketOperationDTO) => {
        set({ batchOperationLoading: true, error: null });

        try {
          // TODO: 调用API执行过站操作
          // const response = await floatTicketApi.passOperation(data);

          // if (response.code === 200) {
          //   await get().loadFloatTickets();
          //   message.success('过站成功！');
          // } else {
          //   set({
          //     batchOperationLoading: false,
          //     error: response.message || '过站失败',
          //   });
          // }

          // 模拟过站过程
          setTimeout(() => {
            message.success('过站成功！');
            set({ batchOperationLoading: false });
          }, 1000);
        } catch (error: any) {
          set({
            batchOperationLoading: false,
            error: error.message || '过站失败',
          });
        }
      },

      /**
       * 浮票工序操作
       */
      failOperation: async (data: FloatTicketOperationDTO) => {
        set({ batchOperationLoading: true, error: null });

        try {
          // TODO: 调用API执行失败操作
          // const response = await floatTicketApi.failOperation(data);

          // if (response.code === 200) {
          //   await get().loadFloatTickets();
          //   message.success('异常标记成功！');
          // } else {
          //   set({
          //     batchOperationLoading: false,
          //     error: response.message || '标记失败',
          //   });
          // }

          // 模拟标记过程
          setTimeout(() => {
            message.success('异常标记成功！');
            set({ batchOperationLoading: false });
          }, 1000);
        } catch (error: any) {
          set({
            batchOperationLoading: false,
            error: error.message || '标记失败',
          });
        }
      },

      /**
       * 浮票工序操作
       */
      skipOperation: async (data: FloatTicketOperationDTO) => {
        set({ batchOperationLoading: true, error: null });

        try {
          // TODO: 调用API执行跳过操作
          // const response = await floatTicketApi.skipOperation(data);

          // if (response.code === 200) {
          //   await get().loadFloatTickets();
          //   message.success('跳过工序成功！');
          // } else {
          //   set({
          //     batchOperationLoading: false,
          //     error: response.message || '跳过失败',
          //   });
          // }

          // 模拟跳过过程
          setTimeout(() => {
            message.success('跳过工序成功！');
            set({ batchOperationLoading: false });
          }, 1000);
        } catch (error: any) {
          set({
            batchOperationLoading: false,
            error: error.message || '跳过失败',
          });
        }
      },

      /**
       * 打印单个浮票
       */
      printTicket: async (ticketId: string) => {
        set({ printLoading: true, error: null, printingTicket: get().currentTicket });

        try {
          // TODO: 调用API打印浮票
          // const response = await floatTicketApi.printTicket(ticketId);

          // if (response.code === 200) {
          //   set({ printLoading: false });
          //   message.success('打印任务已发送，请检查打印队列');
          // } else {
          //   set({
          //     printLoading: false,
          //     error: response.message || '打印失败',
          //   });
          // }

          // 模拟打印过程
          setTimeout(() => {
            set({ printLoading: false });
            message.success('打印任务已发送，请检查打印队列');
          }, 2000);
        } catch (error: any) {
          set({
            printLoading: false,
            error: error.message || '打印失败',
          });
        }
      },

      /**
       * 批量打印浮票
       */
      batchPrintTickets: async (data: BatchPrintFloatTicketDTO) => {
        set({ printLoading: true, error: null });

        try {
          // TODO: 调用API批量打印
          // const response = await floatTicketApi.batchPrintTickets(data);

          // if (response.code === 200) {
          //   set({ printLoading: false });
          //   message.success(`已添加 ${data.tickets.length} 个打印任务`);
          // } else {
          //   set({
          //     printLoading: false,
          //     error: response.message || '批量打印失败',
          //   });
          // }

          // 模拟批量打印过程
          setTimeout(() => {
            set({ printLoading: false });
            message.success(`已添加 ${(data.tickets ?? []).length} 个打印任务`);
          }, 1500);
        } catch (error: any) {
          set({
            printLoading: false,
            error: error.message || '批量打印失败',
          });
        }
      },

      /**
       * 返工浮票
       */
      returnTicket: async (data: ReturnFloatTicketDTO) => {
        set({ batchOperationLoading: true, error: null });

        try {
          // TODO: 调用API返工浮票
          // const response = await floatTicketApi.returnTicket(data);

          // if (response.code === 200) {
          //   await get().loadFloatTickets();
          //   set({ showReturnModal: false });
          //   message.success('返工成功！');
          // } else {
          //   set({
          //     batchOperationLoading: false,
          //     error: response.message || '返工失败',
          //   });
          // }

          // 模拟返工过程
          setTimeout(() => {
            message.success('返工成功！');
            set({ batchOperationLoading: false, showReturnModal: false });
          }, 1500);
        } catch (error: any) {
          set({
            batchOperationLoading: false,
            error: error.message || '返工失败',
          });
        }
      },

      /**
       * 设置活动标签页
       */
      setActiveTab: (tab: 'list' | 'detail' | 'print') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentTicket: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示打印弹窗
       */
      setShowPrintModal: (show: boolean) => {
        set({ showPrintModal: show });
      },

      /**
       * 显示返工弹窗
       */
      setShowReturnModal: (show: boolean) => {
        set({ showReturnModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          floatTickets: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedTicketIds: [],
          selectedTickets: [],
          currentTicket: null,
          showTicketDetail: false,
          batchOperationLoading: false,
          printingTicket: null,
          printLoading: false,
          activeTab: 'list',
          showCreateModal: false,
          showEditModal: false,
          showPrintModal: false,
          showReturnModal: false,
        });
      },
    }),
    {
      name: 'floatticket-store',
      // 只持久化核心状态
      partialize: (state) => ({
        floatTickets: state.floatTickets,
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useFloatTicketStore;