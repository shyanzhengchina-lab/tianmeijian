/**
 * 质检项目模块类型定义
 */

import type { QcItem, QcItemQuery, CreateQcItemDTO, UpdateQcItemDTO, QcItemStatusAction, InspectionType, CriticalLevel } from '../api/qcItemApi';

// Re-export only what types.ts doesn't already have
export type { QcItemStatusAction, InspectionType, CriticalLevel };

/**
 * 质检项目表格行
 */
export type QcItemRow = QcItem;

/**
 * 质检项目表单字段
 */
export interface QcItemFormField {
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
 * 质检项目筛选表单字段
 */
export interface QcItemFilterFields {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  criticalLevel?: string;
  status?: string;
}

/**
 * 质检项目操作项
 */
export interface QcItemAction {
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
 * 质检项目统计数据
 */
export interface QcItemStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  categoryCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
}

/**
 * 质检项目详情字段
 */
export interface QcItemDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'number' | 'custom';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 质检项目导入结果
 */
export interface QcItemImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 质检项目导出配置
 */
export interface QcItemExportConfig {
  query: QcItemQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 质检项目表格列配置
 */
export interface QC_ITEM_COLUMN_CONFIG {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: QcItem, b: QcItem) => number);
  visible?: boolean;
}

export const QC_ITEM_COLUMNS: QC_ITEM_COLUMN_CONFIG[] = [
  { key: 'code', title: '检验项目编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '检验项目名称', width: 200, align: 'center' },
  { key: 'category', title: '检验分类', width: 120, align: 'center' },
  { key: 'type', title: '检验类型', width: 120, align: 'center' },
  { key: 'method', title: '检验方法', width: 150, align: 'center' },
  { key: 'standard', title: '检验标准', width: 150, align: 'center' },
  { key: 'tolerance', title: '公差', width: 120, align: 'center' },
  { key: 'unitName', title: '单位', width: 100, align: 'center' },
  { key: 'criticalLevel', title: '关键等级', width: 100, align: 'center' },
  { key: 'sampleMethod', title: '抽样方法', width: 120, align: 'center' },
  { key: 'sampleSize', title: '抽样数量', width: 100, align: 'center' },
  { key: 'inspectionLevel', title: '检验水平', width: 100, align: 'center' },
  { key: 'acceptanceCriteria', title: '接收标准', width: 150, align: 'center' },
  { key: 'version', title: '版本', width: 80, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * 质检项目状态映射
 */
export const QC_ITEM_STATUS_MAP = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 检验类型映射
 */
export const INSPECTION_TYPE_MAP: Record<InspectionType, { label: string; color: string; bg: string; border: string }> = {
  dimension: { label: '尺寸检验', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  visual: { label: '外观检验', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  physical: { label: '物理性能', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  chemical: { label: '化学分析', color: '#fa541c', bg: '#fff7e6', border: '#ffd591' },
  functional: { label: '功能测试', color: '#eb2f96', bg: '#fff0f6', border: '#ffadd2' },
};

/**
 * 关键等级映射
 */
export const CRITICAL_LEVEL_MAP: Record<CriticalLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: '关键', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  major: { label: '主要', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  minor: { label: '次要', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
};

/**
 * 质检项目操作按钮工厂函数
 */
export const createQcItemActions = (
  onEdit: (record: QcItemRow) => void,
  onDelete: (record: QcItemRow) => void,
  onViewDetail: (record: QcItemRow) => void,
  onCopy?: (record: QcItemRow) => void,
  onVersionHistory?: (record: QcItemRow) => void,
  selectedCount?: number
): QcItemAction[] => {
  const actions: QcItemAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'qc-item.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'qc-item.delete',
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
      requirePermission: 'qc-item.create',
    });
  }

  if (onVersionHistory) {
    actions.push({
      key: 'version-history',
      label: '版本历史',
      onClick: onVersionHistory,
      requirePermission: 'qc-item.view',
    });
  }

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量启用 (${selectedCount})`,
        requirePermission: 'qc-item.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'qc-item.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'qc-item.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * 质检项目表单字段配置
 */
export const QC_ITEM_FORM_FIELDS: QcItemFormField[] = [
  {
    name: 'code',
    label: '检验项目编码',
    type: 'input',
    required: true,
    placeholder: '请输入检验项目编码',
    span: 12,
  },
  {
    name: 'name',
    label: '检验项目名称',
    type: 'input',
    required: true,
    placeholder: '请输入检验项目名称',
    span: 12,
  },
  {
    name: 'category',
    label: '检验分类',
    type: 'select',
    placeholder: '请选择检验分类',
    span: 12,
  },
  {
    name: 'type',
    label: '检验类型',
    type: 'select',
    placeholder: '请选择检验类型',
    span: 12,
    options: [
      { label: '尺寸检验', value: 'dimension' },
      { label: '外观检验', value: 'visual' },
      { label: '物理性能', value: 'physical' },
      { label: '化学分析', value: 'chemical' },
      { label: '功能测试', value: 'functional' },
    ],
  },
  {
    name: 'method',
    label: '检验方法',
    type: 'input',
    placeholder: '请输入检验方法',
    span: 12,
  },
  {
    name: 'standard',
    label: '检验标准',
    type: 'input',
    placeholder: '请输入检验标准',
    span: 12,
  },
  {
    name: 'tolerance',
    label: '公差',
    type: 'input',
    placeholder: '请输入公差',
    span: 12,
  },
  {
    name: 'unitId',
    label: '单位',
    type: 'select',
    placeholder: '请选择单位',
    span: 12,
  },
  {
    name: 'criticalLevel',
    label: '关键等级',
    type: 'select',
    placeholder: '请选择关键等级',
    span: 12,
    options: [
      { label: '关键', value: 'critical' },
      { label: '主要', value: 'major' },
      { label: '次要', value: 'minor' },
    ],
  },
  {
    name: 'sampleMethod',
    label: '抽样方法',
    type: 'input',
    placeholder: '请输入抽样方法',
    span: 12,
  },
  {
    name: 'sampleSize',
    label: '抽样数量',
    type: 'number',
    placeholder: '请输入抽样数量',
    span: 12,
  },
  {
    name: 'inspectionLevel',
    label: '检验水平',
    type: 'input',
    placeholder: '请输入检验水平',
    span: 12,
  },
  {
    name: 'acceptanceCriteria',
    label: '接收标准',
    type: 'input',
    placeholder: '请输入接收标准',
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
  QC_ITEM_COLUMNS,
  QC_ITEM_STATUS_MAP,
  INSPECTION_TYPE_MAP,
  CRITICAL_LEVEL_MAP,
  createQcItemActions,
  QC_ITEM_FORM_FIELDS,
};
