import type { Material, MaterialQuery } from '../types';
/**
 * 物料模块类型定义
 */

// 重新导出types.ts中的所有类型和常量
export * from '../types';

// 导入Material类型用于类型别名

// MaterialRow类型别名（与Material相同）
export type MaterialRow = Material;

// 本文件中定义的常量会自动导出
// MATERIAL_COLUMNS, MATERIAL_STATUS_MAP, createMaterialActions 已在上方定义并导出

/**
 * 物料表单字段
 */
export interface MaterialFormField {
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
 * 物料筛选表单字段
 */
export interface MaterialFilterFields {
  code?: string;
  name?: string;
  categoryId?: string;
  status?: string;
  brand?: string;
  model?: string;
}

/**
 * 物料操作项
 */
export interface MaterialAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: (record?: any) => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  requirePermission?: string; // 需要的权限
}

/**
 * 物料统计数据
 */
export interface MaterialStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  draftCount: number;
  categoryCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

/**
 * 物料详情字段
 */
export interface MaterialDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'currency' | 'number' | 'custom';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 物料导入结果
 */
export interface MaterialImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 物料导出配置
 */
export interface MaterialExportConfig {
  query: MaterialQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 物料表格列配置
 */
export interface MaterialColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: Material, b: Material) => number);
  visible?: boolean;
}

export const MATERIAL_COLUMNS: MaterialColumnConfig[] = [
  { key: 'code', title: '物料编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '物料名称', width: 200, align: 'center' },
  { key: 'categoryName', title: '物料分类', width: 150, align: 'center' },
  { key: 'specification', title: '规格型号', width: 150, align: 'center' },
  { key: 'model', title: '型号', width: 120, align: 'center' },
  { key: 'brand', title: '品牌', width: 120, align: 'center' },
  { key: 'manufacturer', title: '制造商', width: 150, align: 'center' },
  { key: 'unitName', title: '基本单位', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'safetyStock', title: '安全库存', width: 100, align: 'center' },
  { key: 'minStock', title: '最小库存', width: 100, align: 'center' },
  { key: 'maxStock', title: '最大库存', width: 100, align: 'center' },
  { key: 'description', title: '备注', width: 200, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 200, align: 'center', fixed: 'right' },
];

/**
 * 物料状态映射
 */
export const MATERIAL_STATUS_MAP = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  draft: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 物料操作按钮工厂函数
 */
export const createMaterialActions = (
  onEdit: (record: MaterialRow) => void,
  onDelete: (record: MaterialRow) => void,
  onViewDetail: (record: MaterialRow) => void,
  selectedCount?: number
): MaterialAction[] => {
  const actions: MaterialAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'material.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'material.delete',
    },
    {
      key: 'detail',
      label: '详情',
      onClick: onViewDetail,
    },
  ];

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量启用 (${selectedCount})`,
        requirePermission: 'material.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'material.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'material.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

export default {
  MATERIAL_COLUMNS,
  MATERIAL_STATUS_MAP,
  createMaterialActions,
};
