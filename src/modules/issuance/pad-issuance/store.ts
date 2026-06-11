/**
 * 工位领料模块状态管理
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { padIssuanceApi } from './api';
import type {
  PadIssuance,
  CreatePadIssuanceDTO,
  UpdatePadIssuanceDTO,
  PadIssuanceQuery,
  PadIssuanceStatus,
} from './types';

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

interface PadIssuanceFilters {
  issuanceNo?: string;
  taskNo?: string;
  workOrderNo?: string;
  operationCode?: string;
  workstation?: string;
  status?: PadIssuanceStatus;
  requestDateStart?: string;
  requestDateEnd?: string;
}

interface PadIssuanceState {
  // State
  padIssuances: PadIssuance[];
  loading: boolean;
  error: string | null;
  filters: PadIssuanceFilters;
  selectedIds: string[];
  pagination: PaginationState;
  currentPadIssuance: PadIssuance | null;
  detailVisible: boolean;
  formVisible: boolean;
  formMode: 'create' | 'edit';

  // Actions - List
  loadPadIssuances: (query?: PadIssuanceQuery) => Promise<void>;
  setFilters: (filters: Partial<PadIssuanceFilters>) => void;
  setSelectedIds: (ids: string[]) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  resetFilters: () => void;

  // Actions - CRUD
  createPadIssuance: (data: CreatePadIssuanceDTO) => Promise<void>;
  updatePadIssuance: (data: UpdatePadIssuanceDTO) => Promise<void>;
  deletePadIssuance: (ids: string[]) => Promise<void>;

  // Actions - Workflow
  submitForApproval: (id: string) => Promise<void>;
  approve: (id: string, approverId?: string, approverName?: string) => Promise<void>;
  reject: (id: string, reason?: string, approverId?: string, approverName?: string) => Promise<void>;
  issue: (id: string, issuedBy?: string, issuedByName?: string, items?: { itemId: string; qty: number; batchNo?: string }[]) => Promise<void>;
  cancel: (id: string, reason?: string, operatorId?: string) => Promise<void>;
  complete: (id: string, operatorId?: string, operatorName?: string) => Promise<void>;

  // Actions - Batch
  batchApprove: (ids: string[], approverId?: string, approverName?: string) => Promise<void>;
  batchReject: (ids: string[], reason?: string, approverId?: string, approverName?: string) => Promise<void>;
  batchIssue: (ids: string[]) => Promise<void>;
  batchCancel: (ids: string[], reason?: string) => Promise<void>;

  // Actions - Export
  exportData: (format: 'excel' | 'csv') => Promise<void>;

  // Actions - Detail/Form
  showDetail: (padIssuance: PadIssuance) => void;
  hideDetail: () => void;
  showCreateForm: () => void;
  showEditForm: (padIssuance: PadIssuance) => void;
  hideForm: () => void;

  // Actions - Utility
  reset: () => void;
}

const initialState = {
  padIssuances: [],
  loading: false,
  error: null,
  filters: {},
  selectedIds: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  currentPadIssuance: null,
  detailVisible: false,
  formVisible: false,
  formMode: 'create' as const,
};

export const usePadIssuanceStore = create<PadIssuanceState>()(immer(
  (set, get) => ({
    ...initialState,

    // Actions - List
    loadPadIssuances: async (query) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const mergedQuery = { ...get().filters, ...query };
        const result = await padIssuanceApi.getPadIssuances(mergedQuery);

        set((state) => {
          state.padIssuances = result.list as any;
          state.pagination = {
            current: (result as any).page || state.pagination.current,
            pageSize: (result as any).pageSize || state.pagination.pageSize,
            total: result.total,
          };
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '加载失败';
          state.loading = false;
        });
      }
    },

    setFilters: (filters) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters };
        state.pagination.current = 1;
      });
    },

    setSelectedIds: (ids) => {
      set((state) => {
        state.selectedIds = ids;
      });
    },

    setPagination: (pagination) => {
      set((state) => {
        state.pagination = { ...state.pagination, ...pagination };
      });
    },

    resetFilters: () => {
      set((state) => {
        state.filters = {};
        state.pagination.current = 1;
      });
    },

    // Actions - CRUD
    createPadIssuance: async (data) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.createPadIssuance(data as any);
        await get().loadPadIssuances();
        set((state) => {
          state.loading = false;
          state.formVisible = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '创建失败';
          state.loading = false;
        });
        throw error;
      }
    },

    updatePadIssuance: async (data) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.updatePadIssuance(data as any);
        await get().loadPadIssuances();
        set((state) => {
          state.loading = false;
          state.formVisible = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '更新失败';
          state.loading = false;
        });
        throw error;
      }
    },

    deletePadIssuance: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.deletePadIssuances(ids);
        await get().loadPadIssuances();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '删除失败';
          state.loading = false;
        });
        throw error;
      }
    },

    // Actions - Workflow
    submitForApproval: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.submitForApproval(id);
        await get().loadPadIssuances();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '提交失败';
          state.loading = false;
        });
        throw error;
      }
    },

    approve: async (id, approverId = '', approverName = '') => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.approve(id, approverId, approverName);
        await get().loadPadIssuances();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批准失败';
          state.loading = false;
        });
        throw error;
      }
    },

    reject: async (id, reason = '', approverId = '', approverName = '') => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.reject(id, reason, approverId, approverName);
        await get().loadPadIssuances();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '拒绝失败';
          state.loading = false;
        });
        throw error;
      }
    },

    issue: async (id, issuedBy = '', issuedByName = '', items = []) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.issue(id, issuedBy, issuedByName, items);
        await get().loadPadIssuances();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '发料失败';
          state.loading = false;
        });
        throw error;
      }
    },

    cancel: async (id, reason) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.cancel(id, reason);
        await get().loadPadIssuances();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '取消失败';
          state.loading = false;
        });
        throw error;
      }
    },

    complete: async (id, operatorId = '', operatorName = '') => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await padIssuanceApi.complete(id, operatorId, operatorName);
        await get().loadPadIssuances();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '完成失败';
          state.loading = false;
        });
        throw error;
      }
    },

    // Actions - Batch
    batchApprove: async (ids, approverId = '', approverName = '') => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => padIssuanceApi.approve(id, approverId, approverName)));
        await get().loadPadIssuances();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批量批准失败';
          state.loading = false;
        });
        throw error;
      }
    },

    batchReject: async (ids, reason = '', approverId = '', approverName = '') => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => padIssuanceApi.reject(id, reason, approverId, approverName)));
        await get().loadPadIssuances();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批量拒绝失败';
          state.loading = false;
        });
        throw error;
      }
    },

    batchIssue: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => padIssuanceApi.issue(id, '', '', [])));
        await get().loadPadIssuances();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批量发料失败';
          state.loading = false;
        });
        throw error;
      }
    },

    batchCancel: async (ids, reason) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => padIssuanceApi.cancel(id, reason)));
        await get().loadPadIssuances();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批量取消失败';
          state.loading = false;
        });
        throw error;
      }
    },

    // Actions - Export
    exportData: async (format) => {
      try {
        const query = {
          ...get().filters,
          page: 1,
          pageSize: 10000,
        };
        const blob = await padIssuanceApi.exportPadIssuances(query, format);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pad-issuance-export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '导出失败';
        });
        throw error;
      }
    },

    // Actions - Detail/Form
    showDetail: (padIssuance) => {
      set((state) => {
        state.currentPadIssuance = padIssuance;
        state.detailVisible = true;
      });
    },

    hideDetail: () => {
      set((state) => {
        state.detailVisible = false;
        state.currentPadIssuance = null;
      });
    },

    showCreateForm: () => {
      set((state) => {
        state.formMode = 'create';
        state.currentPadIssuance = null;
        state.formVisible = true;
      });
    },

    showEditForm: (padIssuance) => {
      set((state) => {
        state.formMode = 'edit';
        state.currentPadIssuance = padIssuance;
        state.formVisible = true;
      });
    },

    hideForm: () => {
      set((state) => {
        state.formVisible = false;
        state.currentPadIssuance = null;
      });
    },

    // Actions - Utility
    reset: () => {
      set(initialState);
    },
  })
));
