/**
 * 产品系列模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 产品系列状态
 */
export type ProductSeriesStatus =
  | 'DRAFT'          // 草稿
  | 'ACTIVE'        // 生效
  | 'INACTIVE';     // 停用

/**
 * 产品系列接口
 */
export interface ProductSeries {
  id: string;
  seriesCode: string; // 系列编码
  seriesName: string; // 系列名称
  status: ProductSeriesStatus; // 状态

  // 关联信息
  parentId: string | null; // 父系列ID
  parentName: string | null; // 父系列名称
  level: number; // 层级
  path: string; // 路径
  sort: number; // 排序

  // 描述信息
  description: string | null; // 描述
  remark: string | null; // 备注

  // 统计信息
  productCount: number; // 产品数量
  routingCount: number; // 工艺路线数量

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  factoryId: string; // 工厂ID
  creatorId: string; // 创建人ID
  creatorName: string; // 创建人姓名
  updaterId: string | null; // 更新人ID
  updaterName: string | null; // 更新人姓名
}

/**
 * 产品系列查询参数
 */
export interface ProductSeriesQuery extends PageQuery {
  seriesCode?: string; // 系列编码
  seriesName?: string; // 系列名称
  status?: ProductSeriesStatus; // 状态
  parentId?: string; // 父系列ID
  level?: number; // 层级
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建产品系列DTO
 */
export interface CreateProductSeriesDTO {
  seriesCode: string; // 系列编码
  seriesName: string; // 系列名称
  parentId?: string; // 父系列ID
  sort: number; // 排序
  description?: string; // 描述
  remark?: string; // 备注
}

/**
 * 更新产品系列DTO
 */
export interface UpdateProductSeriesDTO extends Partial<CreateProductSeriesDTO> {
  id: string; // 产品系列ID
}

/**
 * 产品系列状态映射
 */
export const PRODUCT_SERIES_STATUS_MAP: Record<ProductSeriesStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: '草稿', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  ACTIVE: { label: '生效', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  INACTIVE: { label: '停用', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 产品系列表格列配置
 */
export const PRODUCT_SERIES_COLUMNS = [
  { key: 'seriesCode', title: '系列编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'seriesName', title: '系列名称', width: 200, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'parentName', title: '父系列', width: 150, align: 'center' },
  { key: 'level', title: '层级', width: 80, align: 'center' },
  { key: 'sort', title: '排序', width: 80, align: 'center' },
  { key: 'productCount', title: '产品数量', width: 100, align: 'center' },
  { key: 'routingCount', title: '路线数量', width: 100, align: 'center' },
  { key: 'description', title: '描述', width: 300, align: 'center' },
  { key: 'creatorName', title: '创建人', width: 120, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 240, align: 'center', fixed: 'right' },
];

export default {
  PRODUCT_SERIES_STATUS_MAP,
  PRODUCT_SERIES_COLUMNS,
};