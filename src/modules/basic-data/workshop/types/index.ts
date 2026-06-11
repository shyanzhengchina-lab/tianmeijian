/**
 * 车间模块类型定义
 */

import type { Workshop, WorkshopQuery, CreateWorkshopDTO, UpdateWorkshopDTO, WorkshopStatusAction, WorkshopType } from '../api/workshopApi';

/**
 * 车间表格行
 */
export type WorkshopRow = Workshop;

/**
 * 车间表单字段
 */
export interface WorkshopFormField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'number' | 'datePicker';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  rules?: any[];
  span?: number;
}

/**
 * 车间筛选表单字段
 */
export interface WorkshopFilterFields {
  code?: string;
  name?: string;
  type?: string;
  category?: string;
  status?: string;
  managerId?: string;
}

/**
 * 车间操作项
 */
export interface WorkshopAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: (...args: any[]) => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  requirePermission?: string; // 需要的权限
}

/**
 * 车间统计数据
 */
export interface WorkshopStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  typeCount: number;
  totalArea: number;
  totalCapacity: number;
  workCenterCount: number;
}

/**
 * 车间详情字段
 */
export interface WorkshopDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'number' | 'custom';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 车间导入结果
 */
export interface WorkshopImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 车间导出配置
 */
export interface WorkshopExportConfig {
  query: WorkshopQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 车间表格列配置
 */
export interface WorkshopColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: Workshop, b: Workshop) => number);
  visible?: boolean;
}

export const WORKSHOP_COLUMNS: WorkshopColumnConfig[] = [
  { key: 'code', title: '车间编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '车间名称', width: 200, align: 'center' },
  { key: 'type', title: '车间类型', width: 120, align: 'center' },
  { key: 'category', title: '车间分类', width: 120, align: 'center' },
  { key: 'location', title: '位置', width: 150, align: 'center' },
  { key: 'area', title: '面积(㎡)', width: 100, align: 'center' },
  { key: 'capacity', title: '产能', width: 100, align: 'center' },
  { key: 'managerName', title: '负责人', width: 120, align: 'center' },
  { key: 'contactPhone', title: '联系电话', width: 130, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * 车间状态映射
 */
export const WORKSHOP_STATUS_MAP = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 车间类型映射
 */
export const WORKSHOP_TYPE_MAP: Record<WorkshopType, { label: string; color: string; bg: string; border: string }> = {
  production: { label: '生产车间', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  assembly: { label: '组装车间', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  warehouse: { label: '仓库', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  other: { label: '其他', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 车间操作按钮工厂函数
 */
export const createWorkshopActions = (
  onEdit: (record: WorkshopRow) => void,
  onDelete: (record: WorkshopRow) => void,
  onViewDetail: (record: WorkshopRow) => void,
  onCopy?: (record: WorkshopRow) => void,
  selectedCount?: number
): WorkshopAction[] => {
  const actions: WorkshopAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'workshop.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'workshop.delete',
    },
    {
      key: 'detail',
      label: '详情',
      onClick: onViewDetail,
    },
  ];

  if (onCopy) {
    actions.push({
      key: 'copy',
      label: '复制',
      onClick: onCopy,
      requirePermission: 'workshop.create',
    });
  }

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量启用 (${selectedCount})`,
        requirePermission: 'workshop.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'workshop.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'workshop.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * 车间表单字段配置
 */
export const WORKSHOP_FORM_FIELDS: WorkshopFormField[] = [
  {
    name: 'code',
    label: '车间编码',
    type: 'input',
    required: true,
    placeholder: '请输入车间编码',
    span: 12,
  },
  {
    name: 'name',
    label: '车间名称',
    type: 'input',
    required: true,
    placeholder: '请输入车间名称',
    span: 12,
  },
  {
    name: 'type',
    label: '车间类型',
    type: 'select',
    placeholder: '请选择车间类型',
    span: 12,
    options: [
      { label: '生产车间', value: 'production' },
      { label: '组装车间', value: 'assembly' },
      { label: '仓库', value: 'warehouse' },
      { label: '其他', value: 'other' },
    ],
  },
  {
    name: 'category',
    label: '车间分类',
    type: 'select',
    placeholder: '请选择车间分类',
    span: 12,
  },
  {
    name: 'location',
    label: '位置',
    type: 'input',
    placeholder: '请输入位置',
    span: 12,
  },
  {
    name: 'area',
    label: '面积(㎡)',
    type: 'number',
    placeholder: '请输入面积',
    span: 12,
  },
  {
    name: 'capacity',
    label: '产能',
    type: 'number',
    placeholder: '请输入产能',
    span: 12,
  },
  {
    name: 'managerId',
    label: '负责人',
    type: 'select',
    placeholder: '请选择负责人',
    span: 12,
  },
  {
    name: 'contactPhone',
    label: '联系电话',
    type: 'input',
    placeholder: '请输入联系电话',
    span: 12,
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    placeholder: '请选择状态',
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
    span: 12,
  },
  {
    name: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '请输入描述',
    span: 24,
  },
  {
    name: 'remark',
    label: '备注',
    type: 'textarea',
    placeholder: '请输入备注',
    span: 24,
  },
];

export default {
  WORKSHOP_COLUMNS,
  WORKSHOP_STATUS_MAP,
  WORKSHOP_TYPE_MAP,
  createWorkshopActions,
  WORKSHOP_FORM_FIELDS,
};
