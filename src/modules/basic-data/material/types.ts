/**
 * 物料模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 物料状态
export type MaterialStatus = 'active' | 'inactive' | 'draft' | 'pending';

// 物料类型
export type MaterialType = 'raw' | 'semi' | 'finished' | 'packaging' | 'accessory';

// 物料主数据接口
export interface Material {
  id: string;
  code: string;
  name: string;
  spec?: string;
  specification?: string; // alias for spec
  unit?: string;          // unit name shorthand
  price?: number;         // 单价
  description?: string;   // 描述
  type: MaterialType;
  categoryId?: string;
  category?: string;     // alias for categoryId
  categoryPath?: string;
  unitId?: string;
  unitName?: string;
  status: MaterialStatus;
  barcode?: string;
  safetyStock?: number;
  leadTime?: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  supplier?: string;         // 供应商
  supplierCode?: string;     // 供应商编码
}

// 物料分类
export interface MaterialCategory {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  level: number;
  sort: number;
  status: MaterialStatus;
  children?: MaterialCategory[];
}

// 物料查询参数
export interface MaterialQuery extends PageQuery {
  code?: string;
  name?: string;
  spec?: string;
  categoryId?: string;
  type?: MaterialType;
  status?: MaterialStatus;
  barcode?: string;
}

// 创建物料DTO
export interface CreateMaterialDTO {
  code: string;
  name: string;
  spec?: string;
  type: MaterialType;
  categoryId?: string;
  unitId?: string;
  barcode?: string;
  safetyStock?: number;
  leadTime?: number;
  remark?: string;
}

// 更新物料DTO
export interface UpdateMaterialDTO extends Partial<CreateMaterialDTO> {
  id: string;
}

// 批量操作参数
export interface MaterialBatchAction {
  ids: string[];
  action: 'enable' | 'disable' | 'delete' | 'approve' | 'reject';
  params?: Record<string, any>;
}

// 物料映射（用于显示）
export const MATERIAL_TYPE_MAP: Record<MaterialType, { label: string; color: string }> = {
  raw: { label: '原材料', color: '#1677ff' },
  semi: { label: '半成品', color: '#52c41a' },
  finished: { label: '成品', color: '#faad14' },
  packaging: { label: '包装材料', color: '#722ed1' },
  accessory: { label: '辅助材料', color: '#eb2f96' },
};

export const MATERIAL_STATUS_MAP: Record<MaterialStatus, { label: string; color: string; bg: string; border: string }> = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
  draft: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  pending: { label: '待审核', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
};

// 库存类型
export type InventoryType = 'none' | 'fifo' | 'lifo' | 'weighted';

// 库存类型映射
export const INVENTORY_TYPE_MAP: Record<InventoryType, { label: string; description: string }> = {
  none: { label: '不控制', description: '不进行库存控制' },
  fifo: { label: '先进先出', description: '按照入库时间顺序出库' },
  lifo: { label: '后进先出', description: '按照入库时间倒序出库' },
  weighted: { label: '加权平均', description: '按照加权平均法计算成本' },
};

// 导出小写版本的映射，方便组件使用
export const materialStatusMap = MATERIAL_STATUS_MAP;
export const materialTypeMap = MATERIAL_TYPE_MAP;
export const inventoryTypeMap = INVENTORY_TYPE_MAP;

// 物料表格列配置
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
  { key: 'spec', title: '规格型号', width: 150, align: 'center' },
  { key: 'type', title: '物料类型', width: 120, align: 'center' },
  { key: 'unitName', title: '基本单位', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'safetyStock', title: '安全库存', width: 100, align: 'center' },
  { key: 'leadTime', title: '交货周期', width: 100, align: 'center' },
  { key: 'createdAt', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 200, align: 'center', fixed: 'right' },
];

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
  [key: string]: any;
}

/**
 * 创建物料操作函数（actions helper）
 */
export const createMaterialActions = (
  handlers: Record<string, (record: Material) => void>
) => {
  return Object.entries(handlers).map(([key, handler]) => ({
    key,
    handler,
  }));
};