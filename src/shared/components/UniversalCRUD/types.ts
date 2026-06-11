/**
 * Universal CRUD Component Types
 * Comprehensive TypeScript definitions for the universal CRUD component
 */

import { ColumnsType } from 'antd/es/table';
import { ReactNode, CSSProperties } from 'react';
import type { FormField, DetailField } from '../../types/common';

/**
 * Batch action configuration
 */
export interface BatchAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void | Promise<void>;
  danger?: boolean;
  disabled?: boolean;
  showProgress?: boolean;
  loading?: boolean;
}

/**
 * Statistic item for displaying metrics
 */
export interface StatisticItem {
  label: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  suffix?: string;
  prefix?: ReactNode;
}

/**
 * Row selection configuration
 */
export interface RowSelectionConfig {
  selectedRowKeys: React.Key[];
  onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => void;
  type?: 'checkbox' | 'radio';
  getCheckboxProps?: (record: any) => any;
  columnWidth?: number | string;
  fixed?: boolean;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  pageSizeOptions?: string[];
  showTotal?: (total: number, range: [number, number]) => string;
}

/**
 * Action handler configuration
 */
export interface ActionHandlers<T> {
  onCreate: () => void;
  onUpdate: (record: T) => void;
  onDelete: (record: T) => void | Promise<void>;
  onView?: (record: T) => void;
}

/**
 * CRUD operation handlers
 */
export interface CRUDHandlers<T> {
  // Single record operations
  onCreate?: () => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void | Promise<void>;
  onView?: (record: T) => void;

  // Batch operations
  onBatchDelete?: (selectedIds: React.Key[]) => void | Promise<void>;
  onBatchEnable?: (selectedIds: React.Key[]) => void | Promise<void>;
  onBatchDisable?: (selectedIds: React.Key[]) => void | Promise<void>;
  onBatchCustom?: (actionKey: string, selectedIds: React.Key[]) => void | Promise<void>;

  // Data operations
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

/**
 * Modal and drawer configuration
 */
export interface ModalDrawerConfig {
  createModal?: ReactNode;
  updateModal?: ReactNode;
  detailDrawer?: ReactNode;
  createModalVisible?: boolean;
  updateModalVisible?: boolean;
  detailDrawerVisible?: boolean;
  onCreateModalClose?: () => void;
  onUpdateModalClose?: () => void;
  onDetailDrawerClose?: () => void;
}

/**
 * Table configuration
 */
export interface TableConfig {
  scroll?: { x?: number | string; y?: number | string };
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  showHeader?: boolean;
  sticky?: boolean;
  rowClassName?: (record: any, index: number) => string;
}

/**
 * Search configuration
 */
export interface SearchConfig {
  searchable?: boolean;
  filterable?: boolean;
  searchPlaceholder?: string;
  showAdvancedSearch?: boolean;
  searchFields?: FormField[];
}

/**
 * Universal CRUD main props
 */
export interface UniversalCRUDProps<T extends Record<string, any>> {
  // ===== Data Management =====
  data: T[];
  loading?: boolean;
  error?: string;
  totalCount?: number;

  // ===== Table Configuration =====
  columns: ColumnsType<T>;
  rowKey: keyof T | ((record: T) => string);
  rowSelection?: RowSelectionConfig;
  tableConfig?: TableConfig;

  // ===== Actions =====
  onCreate?: () => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void | Promise<void>;
  onView?: (record: T) => void;

  // ===== Batch Actions =====
  batchActions?: BatchAction[];
  showBatchActions?: boolean;

  // ===== Search and Filter =====
  searchable?: boolean;
  filterable?: boolean;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  searchPlaceholder?: string;
  searchFields?: FormField[];

  // ===== Pagination =====
  paginatable?: boolean;
  pagination?: PaginationConfig;

  // ===== Statistics =====
  showStatistics?: boolean;
  statistics?: StatisticItem[];
  statisticsLayout?: 'horizontal' | 'vertical' | 'grid';

  // ===== Modals and Drawers =====
  createModal?: ReactNode;
  updateModal?: ReactNode;
  detailDrawer?: ReactNode;
  createModalVisible?: boolean;
  updateModalVisible?: boolean;
  detailDrawerVisible?: boolean;
  onCreateModalClose?: () => void;
  onUpdateModalClose?: () => void;
  onDetailDrawerClose?: () => void;

  // ===== Additional Features =====
  exportable?: boolean;
  onExport?: () => void;
  importable?: boolean;
  onImport?: () => void;
  refreshable?: boolean;
  onRefresh?: () => void;

  // ===== Styling and Layout =====
  title?: string;
  extra?: ReactNode;
  className?: string;
  style?: React.CSSProperties;

  // ===== Advanced Configuration =====
  // Custom action column configuration
  actionColumn?: {
    width?: number;
    fixed?: boolean | 'left' | 'right';
    render?: (record: T) => ReactNode;
  };

  // Custom toolbar configuration
  toolbar?: ReactNode;

  // Custom footer configuration
  footer?: ReactNode;

  // Empty state configuration
  emptyText?: ReactNode;

  // Error state configuration
  errorRender?: (error: string) => ReactNode;

  // Loading state configuration
  loadingRender?: () => ReactNode;

  // Custom row actions
  rowActions?: Array<{
    key: string;
    label: string;
    icon?: ReactNode;
    onClick: (record: T) => void;
    danger?: boolean;
    disabled?: (record: T) => boolean;
    show?: (record: T) => boolean;
  }>;

  // Permission control
  permissions?: {
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    canView?: boolean;
    canExport?: boolean;
    canImport?: boolean;
    canRefresh?: boolean;
  };
}

/**
 * Universal CRUD component configuration
 * Helper type for creating typed configurations
 */
export interface UniversalCRUDConfig<T extends Record<string, any>> {
  // Module-specific configuration
  moduleName: string;
  apiEndpoints?: {
    list: string;
    create: string;
    update: string;
    delete: string;
    batchDelete: string;
  };

  // Default batch actions
  defaultBatchActions?: BatchAction[];

  // Default statistics
  defaultStatistics?: (data: T[]) => StatisticItem[];

  // Custom form fields
  formFields?: FormField[];

  // Custom detail fields
  getDetailFields?: (record: T) => DetailField[];

  // Custom column transformers
  columnTransformers?: {
    [key: string]: (value: any, record: T) => ReactNode;
  };
}

/**
 * Universal CRUD ref methods
 * Methods that can be called on the component ref
 */
export interface UniversalCRUDRef {
  refresh: () => void;
  getSelectedRows: () => any[];
  getSelectedRowKeys: () => React.Key[];
  clearSelection: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  scrollToTop: () => void;
  exportData: () => void;
  showCreateModal: () => void;
  showUpdateModal: (record: any) => void;
  showDetailDrawer: (record: any) => void;
}

/**
 * Props for simplified CRUD components
 * For modules that don't need full customization
 */
export interface SimpleCRUDProps<T extends Record<string, any>> extends Omit<
  UniversalCRUDProps<T>,
  'columns' | 'rowKey'
> {
  // Simplified configuration
  fields: Array<{
    key: keyof T;
    title: string;
    width?: number;
    sortable?: boolean;
    filterable?: boolean;
  }>;
}

/**
 * Hook return type for useUniversalCRUD
 */
export interface UseUniversalCRUDReturn<T> {
  // Data state
  data: T[];
  loading: boolean;
  error: string | null;

  // Selection state
  selectedRowKeys: React.Key[];
  selectedRows: T[];

  // Pagination state
  pagination: PaginationConfig;

  // Action handlers
  handleCreate: () => void;
  handleUpdate: (record: T) => void;
  handleDelete: (record: T) => void;
  handleView?: (record: T) => void;

  // Batch actions
  handleBatchAction: (actionKey: string) => void;

  // Search and filter
  handleSearch: (query: string) => void;
  handleFilter: (filters: Record<string, any>) => void;

  // Utility methods
  refresh: () => void;
  clearSelection: () => void;
  selectAll: () => void;
}
