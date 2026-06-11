/**
 * 计量单位模块类型定义
 */
import React from 'react';
import type { UnitQuery as _UnitQuery } from '../types';
import { UNIT_STATUS_MAP as _UNIT_STATUS_MAP } from '../types';

// 重新导出types.ts中的所有类型和常量
export * from '../types';

// Alias to ensure UnitQuery is accessible in this file's scope
type UnitQuery = _UnitQuery;

// -------------------------------------------------------
// 本文件补充 types.ts 中缺少的类型
// -------------------------------------------------------

/** 单位分类（按单位组名） */
export type UnitCategory = string;

/** Unit 是 UnitItem 的别名，方便组件引用 */
export type Unit = import('../types').UnitItem;

/** UnitRow - 表格行数据类型（与 UnitItem 一致） */
export type UnitRow = import('../types').UnitItem;

/** 单位分类 Map（前端显示用） */
export const UNIT_CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  '中医药材': { label: '中医药材', color: 'green' },
  '统计学单位': { label: '统计学单位', color: 'blue' },
  '标准桶': { label: '标准桶', color: 'cyan' },
  '服务': { label: '服务', color: 'geekblue' },
  '长度': { label: '长度', color: 'purple' },
  '其他': { label: '其他', color: 'default' },
  '件数': { label: '件数', color: 'orange' },
  '时间': { label: '时间', color: 'gold' },
  '体积': { label: '体积', color: 'lime' },
  '质量': { label: '质量', color: 'magenta' },
  '物流单位': { label: '物流单位', color: 'volcano' },
  '包装规格': { label: '包装规格', color: 'red' },
};

/**
 * 单位表单字段
 */
export interface UnitFormField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'number';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  rules?: any[];
  span?: number;
}

/**
 * 单位筛选表单字段
 */
export interface UnitFilterFields {
  code?: string;
  name?: string;
  category?: UnitCategory;
  status?: string;
}

/**
 * 单位操作项
 */
export interface UnitAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: (record?: UnitRow) => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  requirePermission?: string; // 需要的权限
}

/**
 * 单位统计数据
 */
export interface UnitStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  categoryCount: number;
}

/**
 * 单位详情字段
 */
export interface UnitDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'number' | 'custom';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 单位导入结果
 */
export interface UnitImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 单位导出配置
 */
export interface UnitExportConfig {
  query: UnitQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 单位表格列配置
 */
export interface UnitColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: import('../types').UnitItem, b: import('../types').UnitItem) => number);
  visible?: boolean;
}

export const UNIT_COLUMNS: UnitColumnConfig[] = [
  { key: 'code', title: '单位编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '单位名称', width: 200, align: 'center' },
  { key: 'categoryName', title: '单位分类', width: 150, align: 'center' },
  { key: 'symbol', title: '单位符号', width: 100, align: 'center' },
  { key: 'baseUnitName', title: '基准单位', width: 150, align: 'center' },
  { key: 'conversionRate', title: '换算率', width: 120, align: 'center' },
  { key: 'decimalPlaces', title: '小数位数', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'remark', title: '备注', width: 200, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 200, align: 'center', fixed: 'right' },
];

// UNIT_STATUS_MAP 和 UNIT_CATEGORY_MAP 已经从 types.ts 导入，不需要重新定义

/**
 * 单位操作按钮工厂函数
 */
export const createUnitActions = (
  onEdit: (record?: UnitRow) => void,
  onDelete: (record?: UnitRow) => void,
  onViewDetail: (record?: UnitRow) => void,
  selectedCount?: number
): UnitAction[] => {
  const actions: UnitAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'unit.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'unit.delete',
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
        requirePermission: 'unit.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'unit.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'unit.delete',
        showBadge: true,
        badgeCount: selectedCount,
      },
    );
  }

  return actions;
};

export default {
  UNIT_COLUMNS,
  UNIT_STATUS_MAP: _UNIT_STATUS_MAP,
  UNIT_CATEGORY_MAP,
  createUnitActions,
};
