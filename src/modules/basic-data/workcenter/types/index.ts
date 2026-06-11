/**
 * 工作中心模块类型定义
 */

import type { WorkCenter, WorkCenterQuery, CreateWorkCenterDTO, UpdateWorkCenterDTO, WorkCenterStatusAction, WorkCenterStatistics } from '../api/workCenterApi';

// Re-export types needed by store
export type { WorkCenter, WorkCenterQuery, CreateWorkCenterDTO, UpdateWorkCenterDTO, WorkCenterStatusAction, WorkCenterStatistics };

/**
 * 工作中心表格行
 */
export type WorkCenterRow = WorkCenter;

/**
 * 工作中心表单字段
 */
export interface WorkCenterFormField {
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
 * 工作中心筛选表单字段
 */
export interface WorkCenterFilterFields {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  workshopId?: string;
  status?: string;
  responsiblePerson?: string;
}

/**
 * 工作中心操作项
 */
export interface WorkCenterAction {
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
 * 工作中心统计数据
 */
export interface WorkCenterOverallStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  disabledCount?: number;
  maintenanceCount: number;
  categoryCount: number;
  bottleneckCount: number;
  totalCapacity: number;
  averageUtilizationRate: number;
}

/**
 * 工作中心详情字段
 */
export interface WorkCenterDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'currency' | 'number' | 'custom' | 'progress';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 工作中心导入结果
 */
export interface WorkCenterImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 工作中心导出配置
 */
export interface WorkCenterExportConfig {
  query: WorkCenterQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 工作中心表格列配置
 */
export interface WorkCenterColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: WorkCenter, b: WorkCenter) => number);
  visible?: boolean;
}

export const WORKCENTER_COLUMNS: WorkCenterColumnConfig[] = [
  { key: 'code', title: '工作中心编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '工作中心名称', width: 200, align: 'center' },
  { key: 'category', title: '分类', width: 120, align: 'center' },
  { key: 'type', title: '类型', width: 120, align: 'center' },
  { key: 'workshopName', title: '所属车间', width: 150, align: 'center' },
  { key: 'location', title: '位置', width: 150, align: 'center' },
  { key: 'capacity', title: '产能(件/天)', width: 120, align: 'center' },
  { key: 'operatorCount', title: '操作员数量', width: 120, align: 'center' },
  { key: 'shiftCount', title: '班次数量', width: 100, align: 'center' },
  { key: 'workingHours', title: '工作时长(小时)', width: 140, align: 'center' },
  { key: 'isBottleneck', title: '瓶颈中心', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'responsiblePerson', title: '负责人', width: 120, align: 'center' },
  { key: 'contactPhone', title: '联系电话', width: 130, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * 工作中心状态映射
 */
export const WORKCENTER_STATUS_MAP = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  maintenance: { label: '维护中', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
};

/**
 * 工作中心类型映射
 */
export const WORKCENTER_TYPE_MAP = {
  production: { label: '生产中心', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  assembly: { label: '组装中心', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  packing: { label: '包装中心', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  storage: { label: '仓储中心', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  other: { label: '其他', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 工作中心操作按钮工厂函数
 */
export const createWorkCenterActions = (
  onEdit: (record: WorkCenterRow) => void,
  onDelete: (record: WorkCenterRow) => void,
  onViewDetail: (record: WorkCenterRow) => void,
  onViewStatistics?: (record: WorkCenterRow) => void,
  onCopy?: (record: WorkCenterRow) => void,
  selectedCount?: number
): WorkCenterAction[] => {
  const actions: WorkCenterAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'workcenter.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'workcenter.delete',
    },
    {
      key: 'detail',
      label: '详情',
      onClick: onViewDetail,
    },
  ];

  if (onViewStatistics) {
    actions.push({
      key: 'statistics',
      label: '统计',
      onClick: onViewStatistics,
      requirePermission: 'workcenter.statistics',
    });
  }

  if (onCopy) {
    actions.push({
      key: 'copy',
      label: '复制',
      onClick: onCopy,
      requirePermission: 'workcenter.create',
    });
  }

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量启用 (${selectedCount})`,
        requirePermission: 'workcenter.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'workcenter.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'workcenter.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * 工作中心表单字段配置
 */
export const WORKCENTER_FORM_FIELDS: WorkCenterFormField[] = [
  {
    name: 'code',
    label: '工作中心编码',
    type: 'input',
    required: true,
    placeholder: '请输入工作中心编码',
    span: 12,
  },
  {
    name: 'name',
    label: '工作中心名称',
    type: 'input',
    required: true,
    placeholder: '请输入工作中心名称',
    span: 12,
  },
  {
    name: 'category',
    label: '分类',
    type: 'select',
    placeholder: '请选择分类',
    span: 12,
  },
  {
    name: 'type',
    label: '类型',
    type: 'select',
    placeholder: '请选择类型',
    span: 12,
    options: [
      { label: '生产中心', value: 'production' },
      { label: '组装中心', value: 'assembly' },
      { label: '包装中心', value: 'packing' },
      { label: '仓储中心', value: 'storage' },
      { label: '其他', value: 'other' },
    ],
  },
  {
    name: 'workshopId',
    label: '所属车间',
    type: 'select',
    placeholder: '请选择所属车间',
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
    name: 'capacity',
    label: '产能(件/天)',
    type: 'number',
    placeholder: '请输入产能',
    span: 12,
  },
  {
    name: 'workingHours',
    label: '工作时长(小时)',
    type: 'number',
    placeholder: '请输入工作时长',
    span: 12,
  },
  {
    name: 'operatorCount',
    label: '操作员数量',
    type: 'number',
    placeholder: '请输入操作员数量',
    span: 12,
  },
  {
    name: 'shiftCount',
    label: '班次数量',
    type: 'number',
    placeholder: '请输入班次数量',
    span: 12,
  },
  {
    name: 'responsiblePerson',
    label: '负责人',
    type: 'input',
    placeholder: '请输入负责人',
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
    name: 'isBottleneck',
    label: '瓶颈中心',
    type: 'select',
    placeholder: '请选择',
    options: [
      { label: '是', value: true },
      { label: '否', value: false },
    ],
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
      { label: '维护中', value: 'maintenance' },
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
  WORKCENTER_COLUMNS,
  WORKCENTER_STATUS_MAP,
  WORKCENTER_TYPE_MAP,
  createWorkCenterActions,
  WORKCENTER_FORM_FIELDS,
};
