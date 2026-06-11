/**
 * 质检工作台模块Zustand Store
 * 管理质检工作台的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { inspectionApi } from './api';
import { DEFAULT_INSPECTIONS } from './types';
import type {
  Inspection,
  InspectionQuery,
  CreateInspectionDTO,
  UpdateInspectionDTO,
  InspectionBatchAction,
  InspectionItem,
  InspectionStatistics,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface InspectionStore {
  // State
  inspections: Inspection[];
  inspectionItems: InspectionItem[];
  inspectionStatistics: InspectionStatistics | null;
  selectedIds: string[];
  currentInspection: Inspection | null;
  filters: InspectionQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    pendingCount: number;
    inProgressCount: number;
    passedCount: number;
    failedCount: number;
    conditionalCount: number;
    typeStats: Record<string, number>;
  } | null;

  // Actions
  loadInspections: (query?: InspectionQuery) => Promise<void>;
  loadAllInspections: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  getInspectionById: (id: string) => Promise<Inspection>;
  getInspectionByNo: (inspectionNo: string) => Promise<Inspection>;
  createInspection: (data: CreateInspectionDTO) => Promise<void>;
  updateInspection: (data: UpdateInspectionDTO | string, extra?: any) => Promise<void>;
  batchInspections: (action: InspectionBatchAction) => Promise<void>;
  startInspection: (id: string, inspector?: string) => Promise<void>;
  passInspection: (id: string, resultDetails?: string) => Promise<void>;
  failInspection: (id: string, resultDetails?: string) => Promise<void>;
  conditionalInspection: (id: string, resultDetails?: string) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
  assignInspector: (id: string, inspector: string) => Promise<void>;
  checkInspectionNoExists: (inspectionNo: string, excludeId?: string) => Promise<boolean>;
  importInspections: (file: File) => Promise<{ success: number; failed: number }>;
  exportInspections: (query: InspectionQuery | string[]) => Promise<Blob>;
  generateFromTicket: (ticketId: string, qcSchemeId: string) => Promise<Inspection>;
  getInspectionItems: (inspectionId: string) => Promise<InspectionItem[]>;
  addInspectionItem: (inspectionId: string, item: Omit<InspectionItem, 'id' | 'inspectionId'>) => Promise<void>;
  addInspectionItems: (inspectionId: string, items: Omit<InspectionItem, 'id' | 'inspectionId'>[]) => Promise<void>;
  updateInspectionItem: (inspectionId: string, item: InspectionItem) => Promise<void>;
  deleteInspectionItem: (inspectionId: string, itemId: string) => Promise<void>;
  deleteInspectionItems: (inspectionId: string, itemIds: string[]) => Promise<void>;
  updateItemResult: (inspectionId: string, itemId: string, result: string, actualValue?: string, deviation?: string, remark?: string) => Promise<void>;
  getInspectionStatistics: (inspectionId: string) => Promise<InspectionStatistics>;
  uploadAttachment: (inspectionId: string, itemId: string, file: File) => Promise<string>;
  deleteAttachment: (inspectionId: string, itemId: string, attachmentUrl: string) => Promise<void>;
  generateReport: (inspectionId: string) => Promise<Blob>;
  getInspectorTasks: (inspectorId: string, status?: string) => Promise<Inspection[]>;
  getPendingTasks: () => Promise<Inspection[]>;
  batchAssignInspector: (ids: string[], inspector: string) => Promise<void>;
  transferInspection: (id: string, newInspector: string, newInspectorName: string) => Promise<void>;
  generateRecordCard: (inspectionId: string) => Promise<Blob>;

  // State setters
  setFilters: (filters: Partial<InspectionQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentInspection: (inspection: Inspection | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  deleteInspections: (ids: string[]) => Promise<void>;
  assignInspection: (id: string, inspectorId: string) => Promise<void>;
}

// 创建Zustand Store
export const useInspectionStore = create<InspectionStore>()(immer(
  (set, get) => ({
    // 初始状态
    inspections: DEFAULT_INSPECTIONS,
    inspectionItems: [],
    inspectionStatistics: null,
    selectedIds: [],
    currentInspection: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_INSPECTIONS.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadInspections: async (query?: InspectionQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: InspectionQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await inspectionApi.getInspections(finalQuery);

        set({
          inspections: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载质检单列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllInspections: async () => {
      try {
        const inspections = await inspectionApi.getAllInspections();
        set({ inspections });
      } catch (error: any) {
        console.error('加载所有质检单失败:', error);
        set({ error: error?.message || '加载质检单列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await inspectionApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载质检单统计失败:', error);
      }
    },

    getInspectionById: async (id: string) => {
      set({ loading: true, error: null });

      try {
        const inspection = await inspectionApi.getInspectionById(id);
        set({ currentInspection: inspection, loading: false });
        return inspection;
      } catch (error: any) {
        set({
          error: error?.message || '加载质检单详情失败',
          loading: false,
        });
        throw error;
      }
    },

    getInspectionByNo: async (inspectionNo: string) => {
      set({ loading: true, error: null });

      try {
        const inspection = await inspectionApi.getInspectionByNo(inspectionNo);
        set({ currentInspection: inspection, loading: false });
        return inspection;
      } catch (error: any) {
        set({
          error: error?.message || '加载质检单详情失败',
          loading: false,
        });
        throw error;
      }
    },

    createInspection: async (data: CreateInspectionDTO) => {
      set({ loading: true, error: null });

      try {
        const newInspection = await inspectionApi.createInspection(data);

        set(state => {
          state.inspections.unshift(newInspection);
          state.pagination.total += 1;
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建质检单失败',
          loading: false,
        });
        throw error;
      }
    },

    updateInspection: async (data: UpdateInspectionDTO | string, extra?: any) => {
      if (typeof data === 'string') { data = { id: data, ...extra } as UpdateInspectionDTO; }
      set({ loading: true, error: null });

      try {
        const updatedInspection = await inspectionApi.updateInspection(data);

        set(state => {
          const index = state.inspections.findIndex(insp => insp.id === (data as any).id);
          if (index !== -1) {
            state.inspections[index] = updatedInspection;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新质检单失败',
          loading: false,
        });
        throw error;
      }
    },

    batchInspections: async (action: InspectionBatchAction) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.batchInspections(action);

        // 重新加载列表
        await get().loadInspections();
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

    startInspection: async (id: string, inspector: string = '') => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.startInspection(id, inspector);

        set(state => {
          const inspection = state.inspections.find(insp => insp.id === id);
          if (inspection) {
            inspection.status = 'IN_PROGRESS';
            inspection.inspector = inspector;
            inspection.inspectionTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '开始检验失败',
          loading: false,
        });
        throw error;
      }
    },

    passInspection: async (id: string, resultDetails: string = '') => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.passInspection(id, resultDetails);

        set(state => {
          const inspection = state.inspections.find(insp => insp.id === id);
          if (inspection) {
            inspection.status = 'PASSED';
            inspection.result = 'PASSED';
            inspection.resultDetails = resultDetails;
            inspection.completeTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '完成检验失败',
          loading: false,
        });
        throw error;
      }
    },

    failInspection: async (id: string, resultDetails: string = '') => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.failInspection(id, resultDetails);

        set(state => {
          const inspection = state.inspections.find(insp => insp.id === id);
          if (inspection) {
            inspection.status = 'FAILED';
            inspection.result = 'FAILED';
            inspection.resultDetails = resultDetails;
            inspection.completeTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '完成检验失败',
          loading: false,
        });
        throw error;
      }
    },

    conditionalInspection: async (id: string, resultDetails: string = '') => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.conditionalInspection(id, resultDetails);

        set(state => {
          const inspection = state.inspections.find(insp => insp.id === id);
          if (inspection) {
            inspection.status = 'CONDITIONAL';
            inspection.result = 'CONDITIONAL';
            inspection.resultDetails = resultDetails;
            inspection.completeTime = new Date().toISOString();
          }
          state.loading = false;
        });

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '完成检验失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: string) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.updateStatus(ids, status);

        set(state => {
          state.inspections.forEach(inspection => {
            if (ids.includes(inspection.id)) {
              inspection.status = status as any;
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

    assignInspector: async (id: string, inspector: string) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.assignInspector(id, inspector);

        set(state => {
          const inspection = state.inspections.find(insp => insp.id === id);
          if (inspection) {
            inspection.inspector = inspector;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '分配检验员失败',
          loading: false,
        });
        throw error;
      }
    },

    checkInspectionNoExists: async (inspectionNo: string, excludeId?: string): Promise<boolean> => {
      try {
        return await inspectionApi.checkInspectionNoExists(inspectionNo, excludeId);
      } catch (error: any) {
        console.error('检查质检单号是否存在失败:', error);
        return false;
      }
    },

    importInspections: async (file: File): Promise<{ success: number; failed: number }> => {
      set({ loading: true, error: null });

      try {
        const result = await inspectionApi.importInspections(file);
        set({ loading: false });
        // 重新加载列表
        await get().loadInspections();
        return result;
      } catch (error: any) {
        set({
          error: error?.message || '导入质检单失败',
          loading: false,
        });
        throw error;
      }
    },

    exportInspections: async (query: InspectionQuery | string[]): Promise<Blob> => {
      try {
        const q = Array.isArray(query) ? { ids: query } as any : query;
        return await inspectionApi.exportInspections(q);
      } catch (error: any) {
        console.error('导出质检单失败:', error);
        throw error;
      }
    },

    generateFromTicket: async (ticketId: string, qcSchemeId: string): Promise<Inspection> => {
      set({ loading: true, error: null });

      try {
        const inspection = await inspectionApi.generateFromTicket(ticketId, qcSchemeId);
        set({ loading: false });
        // 重新加载列表
        await get().loadInspections();
        return inspection;
      } catch (error: any) {
        set({
          error: error?.message || '生成质检单失败',
          loading: false,
        });
        throw error;
      }
    },

    getInspectionItems: async (inspectionId: string): Promise<InspectionItem[]> => {
      try {
        const inspectionItems = await inspectionApi.getInspectionItems(inspectionId);
        set({ inspectionItems });
        return inspectionItems;
      } catch (error: any) {
        console.error('获取质检项目失败:', error);
        return [];
      }
    },

    addInspectionItem: async (inspectionId: string, item: Omit<InspectionItem, 'id' | 'inspectionId'>) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.addInspectionItem(inspectionId, item);
        // 重新加载质检项目
        await get().getInspectionItems(inspectionId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    addInspectionItems: async (inspectionId: string, items: Omit<InspectionItem, 'id' | 'inspectionId'>[]) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.addInspectionItems(inspectionId, items);
        // 重新加载质检项目
        await get().getInspectionItems(inspectionId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '添加质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    updateInspectionItem: async (inspectionId: string, item: InspectionItem) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.updateInspectionItem(inspectionId, item);
        // 重新加载质检项目
        await get().getInspectionItems(inspectionId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '更新质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteInspectionItem: async (inspectionId: string, itemId: string) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.deleteInspectionItem(inspectionId, itemId);
        // 重新加载质检项目
        await get().getInspectionItems(inspectionId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '删除质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteInspectionItems: async (inspectionId: string, itemIds: string[]) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.deleteInspectionItems(inspectionId, itemIds);
        // 重新加载质检项目
        await get().getInspectionItems(inspectionId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '删除质检项目失败',
          loading: false,
        });
        throw error;
      }
    },

    updateItemResult: async (inspectionId: string, itemId: string, result: string, actualValue?: string, deviation?: string, remark?: string) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.updateItemResult(inspectionId, itemId, result, actualValue, deviation, remark);
        // 重新加载质检项目
        await get().getInspectionItems(inspectionId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '更新质检项目结果失败',
          loading: false,
        });
        throw error;
      }
    },

    getInspectionStatistics: async (inspectionId: string): Promise<InspectionStatistics> => {
      try {
        const inspectionStatistics = await inspectionApi.getInspectionStatistics(inspectionId);
        set({ inspectionStatistics });
        return inspectionStatistics;
      } catch (error: any) {
        console.error('获取质检统计失败:', error);
        throw error;
      }
    },

    uploadAttachment: async (inspectionId: string, itemId: string, file: File): Promise<string> => {
      try {
        return await inspectionApi.uploadAttachment(inspectionId, itemId, file);
      } catch (error: any) {
        console.error('上传附件失败:', error);
        throw error;
      }
    },

    deleteAttachment: async (inspectionId: string, itemId: string, attachmentUrl: string) => {
      try {
        await inspectionApi.deleteAttachment(inspectionId, itemId, attachmentUrl);
      } catch (error: any) {
        console.error('删除附件失败:', error);
        throw error;
      }
    },

    generateReport: async (inspectionId: string): Promise<Blob> => {
      try {
        return await inspectionApi.generateReport(inspectionId);
      } catch (error: any) {
        console.error('生成质检报告失败:', error);
        throw error;
      }
    },

    getInspectorTasks: async (inspectorId: string, status?: string): Promise<Inspection[]> => {
      try {
        return await inspectionApi.getInspectorTasks(inspectorId, status);
      } catch (error: any) {
        console.error('获取检验员任务失败:', error);
        return [];
      }
    },

    getPendingTasks: async (): Promise<Inspection[]> => {
      try {
        return await inspectionApi.getPendingTasks();
      } catch (error: any) {
        console.error('获取待质检任务失败:', error);
        return [];
      }
    },

    batchAssignInspector: async (ids: string[], inspector: string) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.batchAssignInspector(ids, inspector);

        set(state => {
          state.inspections.forEach(inspection => {
            if (ids.includes(inspection.id)) {
              inspection.inspector = inspector;
            }
          });
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '批量分配检验员失败',
          loading: false,
        });
        throw error;
      }
    },

    transferInspection: async (id: string, newInspector: string, newInspectorName: string) => {
      set({ loading: true, error: null });

      try {
        await inspectionApi.transferInspection(id, newInspector, newInspectorName);

        set(state => {
          const inspection = state.inspections.find(insp => insp.id === id);
          if (inspection) {
            inspection.inspector = newInspector;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '转交质检单失败',
          loading: false,
        });
        throw error;
      }
    },

    generateRecordCard: async (inspectionId: string): Promise<Blob> => {
      try {
        return await inspectionApi.generateRecordCard(inspectionId);
      } catch (error: any) {
        console.error('生成检验记录卡失败:', error);
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<InspectionQuery>) => {
      set(state => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1; // 重置到第一页
      });
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentInspection: (inspection: Inspection | null) => {
      set({ currentInspection: inspection });
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
        inspections: DEFAULT_INSPECTIONS,
        inspectionItems: [],
        inspectionStatistics: null,
        selectedIds: [],
        currentInspection: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_INSPECTIONS.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },

    // 兼容别名
    deleteInspections: async (ids: string[]) => { await get().batchInspections({ action: 'DELETE', ids } as any); },
    assignInspection: async (id: string, _inspectorId: string) => { await get().batchInspections({ action: 'ASSIGN', ids: [id] } as any); },
  })
));
