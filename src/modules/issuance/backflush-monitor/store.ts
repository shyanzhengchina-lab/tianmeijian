/**
 * 倒冲监控模块状态管理
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { backflushMonitorApi } from './api';
import type {
  BackflushMonitor,
  CreateBackflushMonitorDTO,
  UpdateBackflushMonitorDTO,
  BackflushMonitorQuery,
  BackflushStatus,
} from './types';

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

interface BackflushMonitorFilters {
  monitorNo?: string;
  workOrderNo?: string;
  taskOrderNo?: string;
  productCode?: string;
  operationCode?: string;
  status?: BackflushStatus;
  backflushTimeStart?: string;
  backflushTimeEnd?: string;
}

interface BackflushMonitorState {
  // State
  backflushMonitors: BackflushMonitor[];
  loading: boolean;
  error: string | null;
  filters: BackflushMonitorFilters;
  selectedIds: string[];
  pagination: PaginationState;
  currentBackflushMonitor: BackflushMonitor | null;
  detailVisible: boolean;
  formVisible: boolean;
  formMode: 'create' | 'edit';

  // Actions - List
  loadBackflushMonitors: (query?: BackflushMonitorQuery) => Promise<void>;
  setFilters: (filters: Partial<BackflushMonitorFilters>) => void;
  setSelectedIds: (ids: string[]) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  resetFilters: () => void;

  // Actions - CRUD
  createBackflushMonitor: (data: CreateBackflushMonitorDTO) => Promise<void>;
  updateBackflushMonitor: (data: UpdateBackflushMonitorDTO) => Promise<void>;
  deleteBackflushMonitor: (ids: string[]) => Promise<void>;

  // Actions - Workflow
  triggerBackflush: (id: string) => Promise<void>;
  retryBackflush: (id: string) => Promise<void>;
  cancelBackflush: (id: string) => Promise<void>;

  // Actions - Batch
  batchTrigger: (ids: string[]) => Promise<void>;
  batchRetry: (ids: string[]) => Promise<void>;
  batchCancel: (ids: string[]) => Promise<void>;

  // Actions - Export
  exportData: (format: 'excel' | 'csv') => Promise<void>;

  // Actions - Detail/Form
  showDetail: (backflushMonitor: BackflushMonitor) => void;
  hideDetail: () => void;
  showCreateForm: () => void;
  showEditForm: (backflushMonitor: BackflushMonitor) => void;
  hideForm: () => void;

  // Actions - Utility
  reset: () => void;
}

const initialState = {
  backflushMonitors: [],
  loading: false,
  error: null,
  filters: {},
  selectedIds: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  currentBackflushMonitor: null,
  detailVisible: false,
  formVisible: false,
  formMode: 'create' as const,
};

export const useBackflushMonitorStore = create<BackflushMonitorState>()(immer(
  (set, get) => ({
    ...initialState,

    // Actions - List
    loadBackflushMonitors: async (query) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const mergedQuery = { ...get().filters, ...query };
        const result = await backflushMonitorApi.getBackflushMonitors(mergedQuery);

        set((state) => {
          state.backflushMonitors = result.list as any;
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
    createBackflushMonitor: async (data) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await backflushMonitorApi.createBackflushMonitor(data as any);
        await get().loadBackflushMonitors();
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

    updateBackflushMonitor: async (data) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await backflushMonitorApi.updateBackflushMonitor(data as any);
        await get().loadBackflushMonitors();
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

    deleteBackflushMonitor: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await backflushMonitorApi.deleteBackflushMonitors(ids);
        await get().loadBackflushMonitors();
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
    triggerBackflush: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await backflushMonitorApi.triggerBackflush(id);
        await get().loadBackflushMonitors();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '触发失败';
          state.loading = false;
        });
        throw error;
      }
    },

    retryBackflush: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await backflushMonitorApi.retryBackflush(id);
        await get().loadBackflushMonitors();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '重试失败';
          state.loading = false;
        });
        throw error;
      }
    },

    cancelBackflush: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await backflushMonitorApi.cancelBackflush(id);
        await get().loadBackflushMonitors();
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

    // Actions - Batch
    batchTrigger: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => backflushMonitorApi.triggerBackflush(id)));
        await get().loadBackflushMonitors();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批量触发失败';
          state.loading = false;
        });
        throw error;
      }
    },

    batchRetry: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => backflushMonitorApi.retryBackflush(id)));
        await get().loadBackflushMonitors();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批量重试失败';
          state.loading = false;
        });
        throw error;
      }
    },

    batchCancel: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => backflushMonitorApi.cancelBackflush(id)));
        await get().loadBackflushMonitors();
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
        const blob = await backflushMonitorApi.exportBackflushMonitors(query, format);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backflush-monitor-export.${format}`;
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
    showDetail: (backflushMonitor) => {
      set((state) => {
        state.currentBackflushMonitor = backflushMonitor;
        state.detailVisible = true;
      });
    },

    hideDetail: () => {
      set((state) => {
        state.detailVisible = false;
        state.currentBackflushMonitor = null;
      });
    },

    showCreateForm: () => {
      set((state) => {
        state.formMode = 'create';
        state.currentBackflushMonitor = null;
        state.formVisible = true;
      });
    },

    showEditForm: (backflushMonitor) => {
      set((state) => {
        state.formMode = 'edit';
        state.currentBackflushMonitor = backflushMonitor;
        state.formVisible = true;
      });
    },

    hideForm: () => {
      set((state) => {
        state.formVisible = false;
        state.currentBackflushMonitor = null;
      });
    },

    // Actions - Utility
    reset: () => {
      set(initialState);
    },
  })
));
