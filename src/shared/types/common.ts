/**
 * 通用类型定义
 */

// 分页状态
export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

// 筛选状态
export interface FilterState {
  keyword?: string;
  [key: string]: any;
}

// 表格列配置（兼容Ant Design Table的ColumnType）
export type ColumnType<T> = {
  title: React.ReactNode;
  dataIndex?: string | string[];
  key?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: Array<{ text: string; value: any }>;
  filterMultiple?: boolean;
  filterDropdown?: React.ReactNode;
  filterIcon?: React.ReactNode;
  onFilter?: (value: any, record: T) => boolean;
};

// 表单字段类型
export interface FormField {
  name: string;
  label: string;
  type: 'input' | 'textArea' | 'select' | 'treeSelect' | 'datePicker' | 'dateRange' | 'number' | 'switch' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  treeData?: Array<any>;
  disabled?: boolean;
  rules?: any[];
  span?: number;
  render?: (props: any) => React.ReactNode;
  mode?: 'multiple' | 'tags';
}

// 操作项类型
export interface ActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  type?: 'primary' | 'default' | 'dashed';
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// 面包屑项
export interface BreadcrumbItem {
  title: React.ReactNode;
  path?: string;
}

// 加载状态
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// 详情字段类型
export interface DetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'link' | 'date' | 'number' | 'custom' | 'currency';
  options?: any;
  span?: number;
  render?: (value: any) => React.ReactNode;
}