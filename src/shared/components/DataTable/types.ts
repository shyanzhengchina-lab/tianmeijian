/**
 * DataTable类型定义
 * 将类型定义从组件中分离，以便于导出
 */

import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { ColumnType, PaginationState } from '../../types/common';

/**
 * 表格引用接口
 */
export interface DataTableRef {
  reload: () => void;
  getSelectedRows: () => any[];
  clearSelection: () => void;
  scrollToTop: () => void;
}

/**
 * 表格操作按钮配置
 */
export interface TableAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}

/**
 * 表格属性
 */
export interface DataTableProps<T> {
  // 数据
  data: T[];
  rowKey: string | ((record: T) => string);
  columns: ColumnType<T>[];

  // 分页
  pagination?: TablePaginationConfig | false;
  paginationState?: PaginationState;
  onPaginationChange?: (page: number, pageSize: number) => void;

  // 行选择
  rowSelection?: {
    selectedRowKeys?: React.Key[];
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    type?: 'checkbox' | 'radio';
    getCheckboxProps?: (record: T) => any;
    columnWidth?: number | string;
    fixed?: boolean;
  };

  // 表格操作
  actions?: TableAction[];
  showRefresh?: boolean;
  showExport?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;

  // 加载状态
  loading?: boolean;
  loadingText?: string;

  // 其他
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  scroll?: { x?: number | string; y?: number | string };
  showHeader?: boolean;
  showFooter?: boolean;
  title?: React.ReactNode;
  footer?: React.ReactNode;

  // 样式
  className?: string;
  style?: React.CSSProperties;
  rowClassName?: (record: T, index: number) => string;

  // 引用
  forwardRef?: React.Ref<DataTableRef>;
}
