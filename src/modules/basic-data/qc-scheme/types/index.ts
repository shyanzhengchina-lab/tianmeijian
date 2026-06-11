/**
 * 质检方案模块类型定义
 */

import type { QcScheme, QcSchemeQuery, CreateQcSchemeDTO, UpdateQcSchemeDTO, QcSchemeStatusAction, QcSchemeType } from '../api/qcSchemeApi';

// Re-export only what types.ts doesn't already have
export type { QcSchemeStatusAction, QcSchemeType };

/**
 * 质检方案表格行
 */
export type QcSchemeRow = QcScheme;

/**
 * 质检方案表单字段
 */
export interface QcSchemeFormField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'number' | 'datePicker' | 'table';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  rules?: any[];
  span?: number;
}

/**
 * 质检方案筛选表单字段
 */
export interface QcSchemeFilterFields {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  materialId?: string;
  operationId?: string;
  status?: string;
}

/**
 * 质检方案操作项
 */
export interface QcSchemeAction {
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
 * 质检方案统计数据
 */
export interface QcSchemeStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  incomingCount: number;
  processCount: number;
  outgoingCount: number;
  finalCount: number;
}

/**
 * 质检方案详情字段
 */
export interface QcSchemeDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'number' | 'custom' | 'table';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 质检方案导入结果
 */
export interface QcSchemeImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 质检方案导出配置
 */
export interface QcSchemeExportConfig {
  query: QcSchemeQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 质检方案表格列配置
 */
export interface QC_SCHEME_COLUMN_CONFIG {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: QcScheme, b: QcScheme) => number);
  visible?: boolean;
}

export const QC_SCHEME_COLUMNS: QC_SCHEME_COLUMN_CONFIG[] = [
  { key: 'code', title: '方案编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '方案名称', width: 200, align: 'center' },
  { key: 'category', title: '方案分类', width: 120, align: 'center' },
  { key: 'type', title: '检验类型', width: 120, align: 'center' },
  { key: 'materialCode', title: '物料编码', width: 150, align: 'center' },
  { key: 'materialName', title: '物料名称', width: 200, align: 'center' },
  { key: 'operationName', title: '工序', width: 150, align: 'center' },
  { key: 'sampleMethod', title: '抽样方法', width: 120, align: 'center' },
  { key: 'sampleLevel', title: '抽样水平', width: 100, align: 'center' },
  { key: 'aql', title: 'AQL值', width: 80, align: 'center' },
  { key: 'effectiveDate', title: '生效日期', width: 120, align: 'center' },
  { key: 'expiryDate', title: '失效日期', width: 120, align: 'center' },
  { key: 'version', title: '版本', width: 80, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

/**
 * 检验项目明细列配置
 */
export interface INSPECTION_ITEM_COLUMN_CONFIG {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean;
  visible?: boolean;
  editable?: boolean;
}

export const INSPECTION_ITEM_COLUMNS: INSPECTION_ITEM_COLUMN_CONFIG[] = [
  { key: 'sequence', title: '序号', width: 80, align: 'center', editable: true },
  { key: 'qcItemCode', title: '检验项目编码', width: 150, align: 'center' },
  { key: 'qcItemName', title: '检验项目名称', width: 200, align: 'center' },
  { key: 'required', title: '必检', width: 80, align: 'center', editable: true },
  { key: 'action', title: '操作', width: 100, align: 'center', fixed: 'right' },
];

/**
 * 质检方案状态映射
 */
export const QC_SCHEME_STATUS_MAP = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 质检方案类型映射
 */
export const QC_SCHEME_TYPE_MAP: Record<QcSchemeType, { label: string; color: string; bg: string; border: string }> = {
  incoming: { label: '来料检验', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  process: { label: '过程检验', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  outgoing: { label: '出货检验', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  final: { label: '最终检验', color: '#fa541c', bg: '#fff7e6', border: '#ffd591' },
};

/**
 * 质检方案操作按钮工厂函数
 */
export const createQcSchemeActions = (
  onEdit: (record: QcSchemeRow) => void,
  onDelete: (record: QcSchemeRow) => void,
  onViewDetail: (record: QcSchemeRow) => void,
  onCopy?: (record: QcSchemeRow) => void,
  onVersionHistory?: (record: QcSchemeRow) => void,
  selectedCount?: number
): QcSchemeAction[] => {
  const actions: QcSchemeAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'qc-scheme.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'qc-scheme.delete',
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
      requirePermission: 'qc-scheme.create',
    });
  }

  if (onVersionHistory) {
    actions.push({
      key: 'version-history',
      label: '版本历史',
      onClick: onVersionHistory,
      requirePermission: 'qc-scheme.view',
    });
  }

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量启用 (${selectedCount})`,
        requirePermission: 'qc-scheme.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'qc-scheme.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'qc-scheme.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * 质检方案表单字段配置
 */
export const QC_SCHEME_FORM_FIELDS: QcSchemeFormField[] = [
  {
    name: 'code',
    label: '方案编码',
    type: 'input',
    required: true,
    placeholder: '请输入方案编码',
    span: 12,
  },
  {
    name: 'name',
    label: '方案名称',
    type: 'input',
    required: true,
    placeholder: '请输入方案名称',
    span: 12,
  },
  {
    name: 'category',
    label: '方案分类',
    type: 'select',
    placeholder: '请选择方案分类',
    span: 12,
  },
  {
    name: 'type',
    label: '检验类型',
    type: 'select',
    placeholder: '请选择检验类型',
    span: 12,
    options: [
      { label: '来料检验', value: 'incoming' },
      { label: '过程检验', value: 'process' },
      { label: '出货检验', value: 'outgoing' },
      { label: '最终检验', value: 'final' },
    ],
  },
  {
    name: 'materialId',
    label: '物料',
    type: 'select',
    placeholder: '请选择物料',
    span: 12,
  },
  {
    name: 'operationId',
    label: '工序',
    type: 'select',
    placeholder: '请选择工序',
    span: 12,
  },
  {
    name: 'sampleMethod',
    label: '抽样方法',
    type: 'input',
    placeholder: '请输入抽样方法',
    span: 12,
  },
  {
    name: 'sampleLevel',
    label: '抽样水平',
    type: 'input',
    placeholder: '请输入抽样水平',
    span: 12,
  },
  {
    name: 'aql',
    label: 'AQL值',
    type: 'input',
    placeholder: '请输入AQL值',
    span: 12,
  },
  {
    name: 'version',
    label: '版本',
    type: 'input',
    placeholder: '请输入版本',
    span: 12,
  },
  {
    name: 'effectiveDate',
    label: '生效日期',
    type: 'datePicker',
    placeholder: '请选择生效日期',
    span: 12,
  },
  {
    name: 'expiryDate',
    label: '失效日期',
    type: 'datePicker',
    placeholder: '请选择失效日期',
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
    name: 'inspectionItems',
    label: '检验项目',
    type: 'table',
    required: true,
    span: 24,
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
  QC_SCHEME_COLUMNS,
  INSPECTION_ITEM_COLUMNS,
  QC_SCHEME_STATUS_MAP,
  QC_SCHEME_TYPE_MAP,
  createQcSchemeActions,
  QC_SCHEME_FORM_FIELDS,
};
