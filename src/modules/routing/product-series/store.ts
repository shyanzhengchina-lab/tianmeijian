/**
 * 产品系列模块状态管理
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { productSeriesApi } from './api';
import type {
  ProductSeries,
  CreateProductSeriesDTO,
  UpdateProductSeriesDTO,
  ProductSeriesQuery,
  ProductSeriesStatus,
} from './types';

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

interface ProductSeriesFilters {
  seriesCode?: string;
  seriesName?: string;
  category?: string;
  status?: ProductSeriesStatus;
}

interface ProductSeriesState {
  // State
  productSeries: ProductSeries[];
  loading: boolean;
  error: string | null;
  filters: ProductSeriesFilters;
  selectedIds: string[];
  pagination: PaginationState;
  currentProductSeries: ProductSeries | null;
  detailVisible: boolean;
  formVisible: boolean;
  formMode: 'create' | 'edit';

  // Actions - List
  loadProductSeries: (query?: ProductSeriesQuery) => Promise<void>;
  setFilters: (filters: Partial<ProductSeriesFilters>) => void;
  setSelectedIds: (ids: string[]) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  resetFilters: () => void;

  // Actions - CRUD
  createProductSeries: (data: CreateProductSeriesDTO) => Promise<void>;
  updateProductSeries: (data: UpdateProductSeriesDTO) => Promise<void>;
  deleteProductSeries: (ids: string[]) => Promise<void>;

  // Actions - Status
  activateProductSeries: (id: string) => Promise<void>;
  deactivateProductSeries: (id: string) => Promise<void>;

  // Actions - Batch
  batchActivate: (ids: string[]) => Promise<void>;
  batchDeactivate: (ids: string[]) => Promise<void>;

  // Actions - Export
  exportData: (format: 'excel' | 'csv') => Promise<void>;

  // Actions - Detail/Form
  showDetail: (productSeries: ProductSeries) => void;
  hideDetail: () => void;
  showCreateForm: () => void;
  showEditForm: (productSeries: ProductSeries) => void;
  hideForm: () => void;

  // Actions - Utility
  reset: () => void;
}

const initialState = {
  productSeries: [],
  loading: false,
  error: null,
  filters: {},
  selectedIds: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  currentProductSeries: null,
  detailVisible: false,
  formVisible: false,
  formMode: 'create' as const,
};

export const useProductSeriesStore = create<ProductSeriesState>()(immer(
  (set, get) => ({
    ...initialState,

    // Actions - List
    loadProductSeries: async (query) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const mergedQuery = { ...get().filters, ...query };
        const result = await productSeriesApi.getProductSeriesList(mergedQuery);

        set((state) => {
          state.productSeries = result.data;
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
    createProductSeries: async (data) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await productSeriesApi.createProductSeries(data);
        await get().loadProductSeries();
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

    updateProductSeries: async (data) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await productSeriesApi.updateProductSeries(data);
        await get().loadProductSeries();
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

    deleteProductSeries: async (ids) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await productSeriesApi.deleteProductSeries(ids);
        await get().loadProductSeries();
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
    activateProductSeries: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await productSeriesApi.activateProductSeries(id);
        await get().loadProductSeries();
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

    deactivateProductSeries: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await productSeriesApi.deactivateProductSeries(id);
        await get().loadProductSeries();
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
        await Promise.all(ids.map(id => productSeriesApi.activateProductSeries(id)));
        await get().loadProductSeries();
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
        await Promise.all(ids.map(id => productSeriesApi.deactivateProductSeries(id)));
        await get().loadProductSeries();
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
        const blob = await productSeriesApi.exportProductSeries(query, format);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `product-series-export.${format}`;
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
    showDetail: (productSeries) => {
      set((state) => {
        state.currentProductSeries = productSeries;
        state.detailVisible = true;
      });
    },

    hideDetail: () => {
      set((state) => {
        state.detailVisible = false;
        state.currentProductSeries = null;
      });
    },

    showCreateForm: () => {
      set((state) => {
        state.formMode = 'create';
        state.currentProductSeries = null;
        state.formVisible = true;
      });
    },

    showEditForm: (productSeries) => {
      set((state) => {
        state.formMode = 'edit';
        state.currentProductSeries = productSeries;
        state.formVisible = true;
      });
    },

    hideForm: () => {
      set((state) => {
        state.formVisible = false;
        state.currentProductSeries = null;
      });
    },

    // Actions - Utility
    reset: () => {
      set(initialState);
    },
  })
));
