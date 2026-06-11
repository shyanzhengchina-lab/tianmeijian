/**
 * 工序模块类型定义
 */

import type { Operation, OperationQuery, CreateOperationDTO, UpdateOperationDTO, OperationStatusAction } from '../api/operationApi';

// Re-export types needed by store
export type { Operation, OperationQuery, CreateOperationDTO, UpdateOperationDTO, OperationStatusAction };

/**
 * 工序表格行
 */
export type OperationRow = Operation;

/**
 * 工序表单字段
 */
export interface OperationFormField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'number' | 'datePicker' | 'transfer';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  rules?: any[];
  span?: number;
  mode?: 'multiple' | 'tags';
}

/**
 * 工序筛选表单字段
 */
export interface OperationFilterFields {
  code?: string;
  name?: string;
  category?: string;
  workCenterId?: string;
  status?: string;
  skillLevel?: string;
}

/**
 * 工序操作项
 */
export interface OperationAction {
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
 * 工序统计数据
 */
export interface OperationStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  draftCount: number;
  disabledCount?: number;
  categoryCount: number;
  bottleneckCount: number;
  qcPointCount?: number;
}

/**
 * 工序详情字段
 */
export interface OperationDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'number' | 'custom' | 'list';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 工序导入结果
 */
export interface OperationImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 工序导出配置
 */
export interface OperationExportConfig {
  query: OperationQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 工序表格列配置
 */
export interface OperationColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: Operation, b: Operation) => number);
  visible?: boolean;
}

export const OPERATION_COLUMNS: OperationColumnConfig[] = [
  { key: 'code', title: '工序编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '工序名称', width: 200, align: 'center' },
  { key: 'category', title: '工序分类', width: 120, align: 'center' },
  { key: 'workCenterName', title: '工作中心', width: 150, align: 'center' },
  { key: 'standardTime', title: '标准工时', width: 100, align: 'center' },
  { key: 'setupTime', title: '准备工时', width: 100, align: 'center' },
  { key: 'capacity', title: '产能(件/小时)', width: 120, align: 'center' },
  { key: 'skillLevel', title: '技能等级', width: 100, align: 'center' },
  { key: 'isBottleneck', title: '瓶颈工序', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'remark', title: '备注', width: 200, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * 工序状态映射
 */
export const OPERATION_STATUS_MAP = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  draft: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 技能等级映射
 */
export const SKILL_LEVEL_MAP = {
  basic: { label: '基础', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  intermediate: { label: '中级', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  advanced: { label: '高级', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  expert: { label: '专家', color: '#fa541c', bg: '#fff7e6', border: '#ffd591' },
};

/**
 * 工序操作按钮工厂函数
 */
export const createOperationActions = (
  onEdit: (record: OperationRow) => void,
  onDelete: (record: OperationRow) => void,
  onViewDetail: (record: OperationRow) => void,
  onCopy?: (record: OperationRow) => void,
  onWorkOrderCount?: (record: OperationRow) => void,
  selectedCount?: number
): OperationAction[] => {
  const actions: OperationAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'operation.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'operation.delete',
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
      requirePermission: 'operation.create',
    });
  }

  if (onWorkOrderCount) {
    actions.push({
      key: 'work-order-count',
      label: '关联工单',
      onClick: onWorkOrderCount,
      requirePermission: 'operation.view',
    });
  }

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量启用 (${selectedCount})`,
        requirePermission: 'operation.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'operation.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'operation.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * 工序表单字段配置
 */
export const OPERATION_FORM_FIELDS: OperationFormField[] = [
  {
    name: 'code',
    label: '工序编码',
    type: 'input',
    required: true,
    placeholder: '请输入工序编码',
    span: 12,
  },
  {
    name: 'name',
    label: '工序名称',
    type: 'input',
    required: true,
    placeholder: '请输入工序名称',
    span: 12,
  },
  {
    name: 'category',
    label: '工序分类',
    type: 'select',
    placeholder: '请选择工序分类',
    span: 12,
  },
  {
    name: 'workCenterId',
    label: '工作中心',
    type: 'select',
    placeholder: '请选择工作中心',
    span: 12,
  },
  {
    name: 'standardTime',
    label: '标准工时(分钟)',
    type: 'number',
    placeholder: '请输入标准工时',
    span: 12,
  },
  {
    name: 'setupTime',
    label: '准备工时(分钟)',
    type: 'number',
    placeholder: '请输入准备工时',
    span: 12,
  },
  {
    name: 'capacity',
    label: '产能(件/小时)',
    type: 'number',
    placeholder: '请输入产能',
    span: 12,
  },
  {
    name: 'skillLevel',
    label: '技能等级',
    type: 'select',
    placeholder: '请选择技能等级',
    options: [
      { label: '基础', value: 'basic' },
      { label: '中级', value: 'intermediate' },
      { label: '高级', value: 'advanced' },
      { label: '专家', value: 'expert' },
    ],
    span: 12,
  },
  {
    name: 'qualityRequirement',
    label: '质量要求',
    type: 'textarea',
    placeholder: '请输入质量要求',
    span: 24,
  },
  {
    name: 'safetyRequirement',
    label: '安全要求',
    type: 'textarea',
    placeholder: '请输入安全要求',
    span: 24,
  },
  {
    name: 'toolingRequirements',
    label: '工装要求',
    type: 'select',
    mode: 'multiple',
    placeholder: '请选择工装要求',
    span: 24,
  },
  {
    name: 'equipmentRequirements',
    label: '设备要求',
    type: 'select',
    mode: 'multiple',
    placeholder: '请选择设备要求',
    span: 24,
  },
  {
    name: 'isBottleneck',
    label: '瓶颈工序',
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
      { label: '草稿', value: 'draft' },
    ],
    span: 12,
  },
  {
    name: 'sort',
    label: '排序',
    type: 'number',
    placeholder: '请输入排序号',
    span: 12,
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
  OPERATION_COLUMNS,
  OPERATION_STATUS_MAP,
  SKILL_LEVEL_MAP,
  createOperationActions,
  OPERATION_FORM_FIELDS,
};
