/**
 * 工艺明细模块状态管理
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { routingDetailApi } from './api';
import type {
  RoutingDetail,
  CreateRoutingDetailDTO,
  UpdateRoutingDetailDTO,
  RoutingDetailQuery,
  RoutingDetailStatus,
} from './types';

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

interface RoutingDetailFilters {
  routingId?: string;
  routingNo?: string;
  operationCode?: string;
  operationName?: string;
  workCenter?: string;
  status?: RoutingDetailStatus;
}

interface RoutingDetailState {
  // State
  routingDetails: RoutingDetail[];
  loading: boolean;
  error: string | null;
  filters: RoutingDetailFilters;
  selectedIds: string[];
  pagination: PaginationState;
  currentRoutingDetail: RoutingDetail | null;
  detailVisible: boolean;
  formVisible: boolean;
  formMode: 'create' | 'edit';

  // Actions - List
  loadRoutingDetails: (query?: RoutingDetailQuery) => Promise<void>;
  setFilters: (filters: Partial<RoutingDetailFilters>) => void;
  setSelectedIds: (ids: string[]) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  resetFilters: () => void;

  // Actions - CRUD
  createRoutingDetail: (data: CreateRoutingDetailDTO) => Promise<void>;
  updateRoutingDetail: (data: UpdateRoutingDetailDTO) => Promise<void>;
  deleteRoutingDetail: (ids: string[]) => Promise<void>;

  // Actions - Status
  activateRoutingDetail: (id: string) => Promise<void>;
  deactivateRoutingDetail: (id: string) => Promise<void>;

  // Actions - Batch
  batchActivate: (ids: string[]) => Promise<void>;
  batchDeactivate: (ids: string[]) => Promise<void>;

  // Actions - Export
  exportData: (format: 'excel' | 'csv') => Promise<void>;

  // Actions - Detail/Form
  showDetail: (routingDetail: RoutingDetail) => void;
  hideDetail: () => void;
  showCreateForm: () => void;
  showEditForm: (routingDetail: RoutingDetail) => void;
  hideForm: () => void;

  // Actions - Utility
  reset: () => void;
}

const initialState = {
  routingDetails: [],
  loading: false,
  error: null,
  filters: {},
  selectedIds: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  currentRoutingDetail: null,
  detailVisible: false,
  formVisible: false,
  formMode: 'create' as const,
};

export const useRoutingDetailStore = create<RoutingDetailState>()(immer(
  (set, get) => ({
    ...initialState,

    // Actions - List
    loadRoutingDetails: async (query) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const mergedQuery = { ...get().filters, ...query };
        const result = await routingDetailApi.getRoutingDetailList(mergedQuery);

        set((state) => {
          state.routingDetails = result.data;
          state.pagination = {
            current: result.page,
            pageSize: result.pageSize,
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
    createRoutingDetail: async (data) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await routingDetailApi.createRoutingDetail(data);
        await get().loadRoutingDetails();
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

    updateRoutingDetail: async (data) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await routingDetailApi.updateRoutingDetail(data);
        await get().loadRoutingDetails();
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

    deleteRoutingDetail: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await routingDetailApi.deleteRoutingDetail(ids);
        await get().loadRoutingDetails();
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

    // Actions - Status
    activateRoutingDetail: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await routingDetailApi.activateRoutingDetail(id);
        await get().loadRoutingDetails();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '启用失败';
          state.loading = false;
        });
        throw error;
      }
    },

    deactivateRoutingDetail: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await routingDetailApi.deactivateRoutingDetail(id);
        await get().loadRoutingDetails();
        set((state) => {
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '停用失败';
          state.loading = false;
        });
        throw error;
      }
    },

    // Actions - Batch
    batchActivate: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => routingDetailApi.activateRoutingDetail(id)));
        await get().loadRoutingDetails();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批量启用失败';
          state.loading = false;
        });
        throw error;
      }
    },

    batchDeactivate: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await Promise.all(ids.map(id => routingDetailApi.deactivateRoutingDetail(id)));
        await get().loadRoutingDetails();
        set((state) => {
          state.selectedIds = [];
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = error.message || '批量停用失败';
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
        const blob = await routingDetailApi.exportRoutingDetail(query, format);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `routing-detail-export.${format}`;
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
    showDetail: (routingDetail) => {
      set((state) => {
        state.currentRoutingDetail = routingDetail;
        state.detailVisible = true;
      });
    },

    hideDetail: () => {
      set((state) => {
        state.detailVisible = false;
        state.currentRoutingDetail = null;
      });
    },

    showCreateForm: () => {
      set((state) => {
        state.formMode = 'create';
        state.currentRoutingDetail = null;
        state.formVisible = true;
      });
    },

    showEditForm: (routingDetail) => {
      set((state) => {
        state.formMode = 'edit';
        state.currentRoutingDetail = routingDetail;
        state.formVisible = true;
      });
    },

    hideForm: () => {
      set((state) => {
        state.formVisible = false;
        state.currentRoutingDetail = null;
      });
    },

    // Actions - Utility
    reset: () => {
      set(initialState);
    },
  })
));
