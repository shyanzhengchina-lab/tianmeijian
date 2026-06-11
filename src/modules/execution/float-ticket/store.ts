/**
 * 批生产浮票模块Zustand Store
 * 管理批生产浮票的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { floatTicketApi } from './api';
import { DEFAULT_FLOAT_TICKETS } from './types';
import type {
  FloatTicket,
  FloatTicketQuery,
  CreateFloatTicketDTO,
  UpdateFloatTicketDTO,
  FloatTicketBatchAction,
  FloatTicketStepRecord,
  FloatTicketMaterialUsage,
  FloatTicketQcRecord,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface FloatTicketStore {
  // State
  floatTickets: FloatTicket[];
  stepRecords: FloatTicketStepRecord[];
  materialUsages: FloatTicketMaterialUsage[];
  qcRecords: FloatTicketQcRecord[];
  selectedIds: string[];
  currentFloatTicket: FloatTicket | null;
  filters: FloatTicketQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    createdCount: number;
    releasedCount: number;
    inProcessCount: number;
    qcPendingCount: number;
    completedCount: number;
    cancelledCount: number;
    typeStats: Record<string, number>;
  } | null;

  // Actions
  loadFloatTickets: (query?: FloatTicketQuery) => Promise<void>;
  loadAllFloatTickets: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  getFloatTicketById: (id: string) => Promise<FloatTicket>;
  getFloatTicketByNo: (ticketNo: string) => Promise<FloatTicket>;
  createFloatTicket: (data: CreateFloatTicketDTO) => Promise<void>;
  updateFloatTicket: (data: UpdateFloatTicketDTO) => Promise<void>;
  deleteFloatTickets: (ids: string[]) => Promise<void>;
  batchFloatTickets: (action: FloatTicketBatchAction) => Promise<void>;
  releaseFloatTicket: (id: string) => Promise<void>;
  startFloatTicket: (id: string) => Promise<void>;
  completeFloatTicket: (id: string) => Promise<void>;
  cancelFloatTicket: (id: string, reason?: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  transferToNextStep: (id: string) => Promise<void>;
  checkTicketNoExists: (ticketNo: string, excludeId?: string) => Promise<boolean>;
  importFloatTickets: (file: File) => Promise<{ success: number; failed: number }>;
  exportFloatTickets: (query: FloatTicketQuery) => Promise<Blob>;
  generateFromWO: (woId: string, batchNo: string, lotNo?: string) => Promise<FloatTicket[]>;
  getStepRecords: (ticketId: string) => Promise<FloatTicketStepRecord[]>;
  addStepRecord: (ticketId: string, record: Omit<FloatTicketStepRecord, 'id' | 'ticketId'>) => Promise<void>;
  updateStepRecord: (ticketId: string, record: FloatTicketStepRecord) => Promise<void>;
  completeStep: (ticketId: string, stepCode: string, outputQty: number, qualifiedQty: number) => Promise<void>;
  getMaterialUsages: (ticketId: string) => Promise<FloatTicketMaterialUsage[]>;
  addMaterialUsage: (ticketId: string, usage: Omit<FloatTicketMaterialUsage, 'id' | 'ticketId'>) => Promise<void>;
  getQcRecords: (ticketId: string) => Promise<FloatTicketQcRecord[]>;
  addQcRecord: (ticketId: string, record: Omit<FloatTicketQcRecord, 'id' | 'ticketId'>) => Promise<void>;
  submitQc: (ticketId: string, result: string, resultDetails: string) => Promise<void>;
  getTransferHistory: (ticketId: string) => Promise<any[]>;
  printFloatTicket: (id: string) => Promise<Blob>;
  printFloatTicketLabel: (id: string) => Promise<Blob>;

  // State setters
  setFilters: (filters: Partial<FloatTicketQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentFloatTicket: (floatTicket: FloatTicket | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  qcFloatTicket: (id: string, data?: any) => Promise<void>;
}

// 创建Zustand Store
export const useFloatTicketStore = create<FloatTicketStore>()(immer(
  (set, get) => ({
    // 初始状态
    floatTickets: DEFAULT_FLOAT_TICKETS,
    stepRecords: [],
    materialUsages: [],
    qcRecords: [],
    selectedIds: [],
    currentFloatTicket: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_FLOAT_TICKETS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadFloatTickets: async (query?: FloatTicketQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: FloatTicketQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await floatTicketApi.getFloatTickets(finalQuery);

        set({
          floatTickets: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载批生产浮票列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllFloatTickets: async () => {
      try {
        const floatTickets = await floatTicketApi.getAllFloatTickets();
        set({ floatTickets });
      } catch (error: any) {
        console.error('加载所有批生产浮票失败:', error);
        set({ error: error?.message || '加载批生产浮票列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await floatTicketApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载批生产浮票统计失败:', error);
      }
    },

    getFloatTicketById: async (id: string) => {
      set({ loading: true, error: null });

      try {
        const floatTicket = await floatTicketApi.getFloatTicketById(id);
        set({ currentFloatTicket: floatTicket, loading: false });
        return floatTicket;
      } catch (error: any) {
        set({
          error: error?.message || '加载批生产浮票详情失败',
          loading: false,
        });
        throw error;
      }
    },

    getFloatTicketByNo: async (ticketNo: string) => {
      set({ loading: true, error: null });

      try {
        const floatTicket = await floatTicketApi.getFloatTicketByNo(ticketNo);
        set({ currentFloatTicket: floatTicket, loading: false });
        return floatTicket;
      } catch (error: any) {
        set({
          error: error?.message || '加载批生产浮票详情失败',
          loading: false,
        });
        throw error;
      }
    },

    createFloatTicket: async (data: CreateFloatTicketDTO) => {
      set({ loading: true, error: null });

      try {
        const newFloatTicket = await floatTicketApi.createFloatTicket(data);

        set(state => {
          state.floatTickets.unshift(newFloatTicket);
          state.pagination.total += 1;
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建批生产浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    updateFloatTicket: async (data: UpdateFloatTicketDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedFloatTicket = await floatTicketApi.updateFloatTicket(data);

        set(state => {
          const index = state.floatTickets.findIndex(ft => ft.id === data.id);
          if (index !== -1) {
            state.floatTickets[index] = updatedFloatTicket;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新批生产浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteFloatTickets: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.deleteFloatTickets(ids);

        set(state => {
          state.floatTickets = state.floatTickets.filter(ft => !ids.includes(ft.id));
          state.pagination.total -= ids.length;
          state.selectedIds = [];
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '删除批生产浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    batchFloatTickets: async (action: FloatTicketBatchAction) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.batchFloatTickets(action);

        // 重新加载列表
        await get().loadFloatTickets();
        // 重新加载统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    releaseFloatTicket: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.releaseFloatTicket(id);

        set(state => {
          const floatTicket = state.floatTickets.find(ft => ft.id === id);
          if (floatTicket) {
            floatTicket.status = 'RELEASED';
            floatTicket.releaseTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '发布批生产浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    startFloatTicket: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.startFloatTicket(id);

        set(state => {
          const floatTicket = state.floatTickets.find(ft => ft.id === id);
          if (floatTicket) {
            floatTicket.status = 'IN_PROCESS';
            floatTicket.startTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '开始批生产浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    completeFloatTicket: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.completeFloatTicket(id);

        set(state => {
          const floatTicket = state.floatTickets.find(ft => ft.id === id);
          if (floatTicket) {
            floatTicket.status = 'COMPLETED';
            floatTicket.endTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '完成批生产浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    cancelFloatTicket: async (id: string, reason?: string) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.cancelFloatTicket(id, reason);

        set(state => {
          const floatTicket = state.floatTickets.find(ft => ft.id === id);
          if (floatTicket) {
            floatTicket.status = 'CANCELLED';
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '取消批生产浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.updateStatus(ids, status);

        set(state => {
          state.floatTickets.forEach(floatTicket => {
            if (ids.includes(floatTicket.id)) {
              floatTicket.status = status as any;
            }
          });
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '更新状态失败',
          loading: false,
        });
        throw error;
      }
    },

    transferToNextStep: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.transferToNextStep(id);

        set(state => {
          const floatTicket = state.floatTickets.find(ft => ft.id === id);
          if (floatTicket) {
            // 更新流转信息（实际由后端处理）
            state.loading = false;
          }
        });
      } catch (error: any) {
        set({
          error: error?.message || '流转到下一工序失败',
          loading: false,
        });
        throw error;
      }
    },

    checkTicketNoExists: async (ticketNo: string, excludeId?: string): Promise<boolean> => {
      try {
        return await floatTicketApi.checkTicketNoExists(ticketNo, excludeId);
      } catch (error: any) {
        console.error('检查浮票号是否存在失败:', error);
        return false;
      }
    },

    importFloatTickets: async (file: File): Promise<{ success: number; failed: number }> => {
      set({ loading: true, error: null });

      try {
        const result = await floatTicketApi.importFloatTickets(file);
        set({ loading: false });
        // 重新加载列表
        await get().loadFloatTickets();
        return result;
      } catch (error: any) {
        set({
          error: error?.message || '导入批生产浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    exportFloatTickets: async (query: FloatTicketQuery): Promise<Blob> => {
      try {
        return await floatTicketApi.exportFloatTickets(query);
      } catch (error: any) {
        console.error('导出批生产浮票失败:', error);
        throw error;
      }
    },

    generateFromWO: async (woId: string, batchNo: string, lotNo?: string): Promise<FloatTicket[]> => {
      set({ loading: true, error: null });

      try {
        const floatTickets = await floatTicketApi.generateFromWO(woId, batchNo, lotNo);
        set({ loading: false });
        // 重新加载列表
        await get().loadFloatTickets();
        return floatTickets;
      } catch (error: any) {
        set({
          error: error?.message || '生成浮票失败',
          loading: false,
        });
        throw error;
      }
    },

    getStepRecords: async (ticketId: string): Promise<FloatTicketStepRecord[]> => {
      try {
        const stepRecords = await floatTicketApi.getStepRecords(ticketId);
        set({ stepRecords });
        return stepRecords;
      } catch (error: any) {
        console.error('获取浮票工序执行记录失败:', error);
        return [];
      }
    },

    addStepRecord: async (ticketId: string, record: Omit<FloatTicketStepRecord, 'id' | 'ticketId'>) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.addStepRecord(ticketId, record);
        // 重新加载工序记录
        await get().getStepRecords(ticketId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加工序执行记录失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStepRecord: async (ticketId: string, record: FloatTicketStepRecord) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.updateStepRecord(ticketId, record);
        // 重新加载工序记录
        await get().getStepRecords(ticketId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '更新工序执行记录失败',
          loading: false,
        });
        throw error;
      }
    },

    completeStep: async (ticketId: string, stepCode: string, outputQty: number, qualifiedQty: number) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.completeStep(ticketId, stepCode, outputQty, qualifiedQty);
        // 重新加载工序记录
        await get().getStepRecords(ticketId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '完成工序失败',
          loading: false,
        });
        throw error;
      }
    },

    getMaterialUsages: async (ticketId: string): Promise<FloatTicketMaterialUsage[]> => {
      try {
        const materialUsages = await floatTicketApi.getMaterialUsages(ticketId);
        set({ materialUsages });
        return materialUsages;
      } catch (error: any) {
        console.error('获取浮票物料使用记录失败:', error);
        return [];
      }
    },

    addMaterialUsage: async (ticketId: string, usage: Omit<FloatTicketMaterialUsage, 'id' | 'ticketId'>) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.addMaterialUsage(ticketId, usage);
        // 重新加载物料使用记录
        await get().getMaterialUsages(ticketId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加物料使用记录失败',
          loading: false,
        });
        throw error;
      }
    },

    getQcRecords: async (ticketId: string): Promise<FloatTicketQcRecord[]> => {
      try {
        const qcRecords = await floatTicketApi.getQcRecords(ticketId);
        set({ qcRecords });
        return qcRecords;
      } catch (error: any) {
        console.error('获取浮票质检记录失败:', error);
        return [];
      }
    },

    addQcRecord: async (ticketId: string, record: Omit<FloatTicketQcRecord, 'id' | 'ticketId'>) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.addQcRecord(ticketId, record);
        // 重新加载质检记录
        await get().getQcRecords(ticketId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加质检记录失败',
          loading: false,
        });
        throw error;
      }
    },

    submitQc: async (ticketId: string, result: string, resultDetails: string) => {
      set({ loading: true, error: null });

      try {
        await floatTicketApi.submitQc(ticketId, result, resultDetails);

        set(state => {
          const floatTicket = state.floatTickets.find(ft => ft.id === ticketId);
          if (floatTicket) {
            floatTicket.qcResult = result as any;
            floatTicket.qcResultDetails = resultDetails;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '提交质检失败',
          loading: false,
        });
        throw error;
      }
    },

    getTransferHistory: async (ticketId: string): Promise<any[]> => {
      try {
        return await floatTicketApi.getTransferHistory(ticketId);
      } catch (error: any) {
        console.error('获取浮票流转轨迹失败:', error);
        return [];
      }
    },

    printFloatTicket: async (id: string): Promise<Blob> => {
      try {
        return await floatTicketApi.printFloatTicket(id);
      } catch (error: any) {
        console.error('打印浮票失败:', error);
        throw error;
      }
    },

    printFloatTicketLabel: async (id: string): Promise<Blob> => {
      try {
        return await floatTicketApi.printFloatTicketLabel(id);
      } catch (error: any) {
        console.error('打印浮票标签失败:', error);
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<FloatTicketQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1; // 重置到第一页
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentFloatTicket: (floatTicket: FloatTicket | null) => {
      set({ currentFloatTicket: floatTicket });
    },

    setPagination: (pagination: Partial<PaginationState>) => {
      set(state => {
        state.pagination = { ...state.pagination, ...pagination };
      });
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    reset: () => {
      set({
        floatTickets: DEFAULT_FLOAT_TICKETS,
        stepRecords: [],
        materialUsages: [],
        qcRecords: [],
        selectedIds: [],
        currentFloatTicket: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_FLOAT_TICKETS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    qcFloatTicket: async (id: string, _data?: any) => { await get().batchFloatTickets({ action: 'QC', ids: [id] } as any); },
  })
));
