/**
 * BOM模块类型定义
 */

import type { Bom, BomDetail, BomQuery, CreateBomDTO, UpdateBomDTO, BomStatusAction } from '../api/bomApi';

/**
 * BOM表格行
 */
export type BomRow = Bom;

/**
 * BOM明细表格行
 */
export type BomDetailRow = BomDetail;

/**
 * BOM表单字段
 */
export interface BomFormField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'number' | 'datePicker' | 'table';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  rules?: any[];
  span?: number;
  mode?: 'multiple' | 'tags';
}

/**
 * BOM筛选表单字段
 */
export interface BomFilterFields {
  code?: string;
  name?: string;
  materialId?: string;
  version?: string;
  status?: string;
}

/**
 * BOM操作项
 */
export interface BomAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: (record: BomRow) => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  requirePermission?: string; // 需要的权限
}

/**
 * BOM统计数据
 */
export interface BomStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  draftCount: number;
  defaultCount: number;
  materialCount: number;
}

/**
 * BOM详情字段
 */
export interface BomDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'number' | 'custom' | 'table';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * BOM导入结果
 */
export interface BomImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * BOM导出配置
 */
export interface BomExportConfig {
  query: BomQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected' | 'details';
}

/**
 * BOM表格列配置
 */
export interface BomColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: Bom, b: Bom) => number);
  visible?: boolean;
}

export const BOM_COLUMNS: BomColumnConfig[] = [
  { key: 'code', title: 'BOM编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: 'BOM名称', width: 200, align: 'center' },
  { key: 'materialName', title: '产品名称', width: 200, align: 'center' },
  { key: 'materialCode', title: '产品编码', width: 150, align: 'center' },
  { key: 'version', title: '版本', width: 100, align: 'center' },
  { key: 'quantity', title: '数量', width: 100, align: 'center' },
  { key: 'unitName', title: '单位', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'effectiveDate', title: '生效日期', width: 120, align: 'center' },
  { key: 'expiryDate', title: '失效日期', width: 120, align: 'center' },
  { key: 'isDefault', title: '默认', width: 80, align: 'center' },
  { key: 'remark', title: '备注', width: 200, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * BOM明细表格列配置
 */
export interface BomDetailColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: BomDetail, b: BomDetail) => number);
  visible?: boolean;
  editable?: boolean;
}

export const BOM_DETAIL_COLUMNS: BomDetailColumnConfig[] = [
  { key: 'materialCode', title: '物料编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'materialName', title: '物料名称', width: 200, align: 'center' },
  { key: 'quantity', title: '数量', width: 100, align: 'center', editable: true },
  { key: 'unitName', title: '单位', width: 100, align: 'center' },
  { key: 'isKeyMaterial', title: '关键物料', width: 100, align: 'center', editable: true },
  { key: 'scrapRate', title: '损耗率(%)', width: 100, align: 'center', editable: true },
  { key: 'substituteMaterials', title: '替代物料', width: 200, align: 'center' },
  { key: 'remark', title: '备注', width: 200, align: 'center', editable: true },
  { key: 'action', title: '操作', width: 100, align: 'center', fixed: 'right' },
];

/**
 * BOM状态映射
 */
export const BOM_STATUS_MAP = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  draft: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * BOM版本表单字段
 */
export interface BomVersionForm {
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  remark?: string;
}

/**
 * BOM操作按钮工厂函数
 */
export const createBomActions = (
  onEdit: (record: BomRow) => void,
  onDelete: (record: BomRow) => void,
  onViewDetail: (record: BomRow) => void,
  onCopy?: (record: BomRow) => void,
  onSetDefault?: (record: BomRow) => void,
  onCancelDefault?: (record: BomRow) => void,
  onVersionHistory?: (record: BomRow) => void,
  selectedCount?: number
): BomAction[] => {
  const actions: BomAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'bom.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'bom.delete',
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
      requirePermission: 'bom.create',
    });
  }

  if (onSetDefault) {
    actions.push({
      key: 'set-default',
      label: '设为默认',
      onClick: onSetDefault,
      requirePermission: 'bom.update',
    });
  }

  if (onCancelDefault) {
    actions.push({
      key: 'cancel-default',
      label: '取消默认',
      onClick: onCancelDefault,
      requirePermission: 'bom.update',
    });
  }

  if (onVersionHistory) {
    actions.push({
      key: 'version-history',
      label: '版本历史',
      onClick: onVersionHistory,
      requirePermission: 'bom.view',
    });
  }

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量启用 (${selectedCount})`,
        requirePermission: 'bom.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'bom.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'bom.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * BOM明细表单字段配置
 */
export const BOM_DETAIL_FORM_FIELDS: BomFormField[] = [
  {
    name: 'materialId',
    label: '物料',
    type: 'select',
    required: true,
    placeholder: '请选择物料',
  },
  {
    name: 'quantity',
    label: '数量',
    type: 'number',
    required: true,
    placeholder: '请输入数量',
  },
  {
    name: 'unitId',
    label: '单位',
    type: 'select',
    placeholder: '请选择单位',
  },
  {
    name: 'isKeyMaterial',
    label: '关键物料',
    type: 'select',
    placeholder: '请选择',
    options: [
      { label: '是', value: true },
      { label: '否', value: false },
    ],
  },
  {
    name: 'scrapRate',
    label: '损耗率(%)',
    type: 'number',
    placeholder: '请输入损耗率',
  },
  {
    name: 'substituteMaterials',
    label: '替代物料',
    type: 'select',
    mode: 'multiple',
    placeholder: '请选择替代物料',
  },
  {
    name: 'remark',
    label: '备注',
    type: 'textarea',
    placeholder: '请输入备注',
  },
];

/**
 * BOM版本对比字段
 */
export interface BomVersionCompare {
  oldVersion: Bom;
  newVersion: Bom;
  addedDetails: BomDetail[];
  removedDetails: BomDetail[];
  modifiedDetails: Array<{
    old: BomDetail;
    new: BomDetail;
    changedFields: string[];
  }>;
}

export default {
  BOM_COLUMNS,
  BOM_DETAIL_COLUMNS,
  BOM_STATUS_MAP,
  createBomActions,
  BOM_DETAIL_FORM_FIELDS,
};
