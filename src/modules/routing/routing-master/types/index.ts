/**
 * 工艺路线主数据模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 路线状态
 */
export type RoutingStatus =
  | 'DRAFT'          // 草稿
  | 'ACTIVE'        // 生效
  | 'INACTIVE';     // 停用

/**
 * 路线类型
 */
export type RoutingType =
  | 'STANDARD'      // 标准路线
  | 'ALTERNATIVE';  // 替代路线

/**
 * 工艺路线接口
 */
export interface RoutingMaster {
  id: string;
  routingNo: string; // 路线编号
  routingName: string; // 路线名称
  routingType: RoutingType; // 路线类型
  status: RoutingStatus; // 状态

  // 关联信息
  productSeriesId: string; // 产品系列ID
  productSeriesName: string; // 产品系列名称
  productId: string; // 产品ID
  productCode: string; // 产品编码
  productName: string; // 产品名称
  specification: string; // 规格型号

  // 版本信息
  version: string; // 版本号
  isDefault: boolean; // 是否默认路线
  isStandard: boolean; // 是否标准路线

  // 时间信息
  effectiveDate: string; // 生效日期
  expireDate: string | null; // 失效日期

  // 路线信息
  operationCount: number; // 工序数量
  totalTime: number; // 总工时(分钟)

  // 成本信息
  estimatedCost: number; // 预估成本
  actualCost: number | null; // 实际成本

  // 描述信息
  description: string | null; // 描述
  remark: string | null; // 备注

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
 * 工艺路线查询参数
 */
export interface RoutingMasterQuery extends PageQuery {
  routingNo?: string; // 路线编号
  routingName?: string; // 路线名称
  routingType?: RoutingType; // 路线类型
  status?: RoutingStatus; // 状态
  productSeriesId?: string; // 产品系列ID
  productId?: string; // 产品ID
  productCode?: string; // 产品编码
  productName?: string; // 产品名称
  version?: string; // 版本号
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建工艺路线DTO
 */
export interface CreateRoutingMasterDTO {
  routingNo: string; // 路线编号
  routingName: string; // 路线名称
  routingType: RoutingType; // 路线类型
  productSeriesId: string; // 产品系列ID
  productId: string; // 产品ID
  version: string; // 版本号
  isDefault: boolean; // 是否默认路线
  isStandard: boolean; // 是否标准路线
  effectiveDate: string; // 生效日期
  expireDate?: string; // 失效日期
  estimatedCost: number; // 预估成本
  description?: string; // 描述
  remark?: string; // 备注
}

/**
 * 更新工艺路线DTO
 */
export interface UpdateRoutingMasterDTO extends Partial<CreateRoutingMasterDTO> {
  id: string; // 工艺路线ID
}

/**
 * 复制工艺路线DTO
 */
export interface CopyRoutingMasterDTO {
  sourceId: string; // 源路线ID
  newRoutingNo: string; // 新路线编号
  newRoutingName: string; // 新路线名称
  newVersion: string; // 新版本号
}

/**
 * 工艺路线状态映射
 */
export const ROUTING_STATUS_MAP: Record<RoutingStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: '草稿', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  ACTIVE: { label: '生效', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  INACTIVE: { label: '停用', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 工艺路线类型映射
 */
export const ROUTING_TYPE_MAP: Record<RoutingType, { label: string; color: string; icon: string }> = {
  STANDARD: { label: '标准路线', color: '#1890ff', icon: '📋' },
  ALTERNATIVE: { label: '替代路线', color: '#722ed1', icon: '🔄' },
};

/**
 * 工艺路线表格列配置
 */
export const ROUTING_MASTER_COLUMNS = [
  { key: 'routingNo', title: '路线编号', width: 150, align: 'center', fixed: 'left' },
  { key: 'routingName', title: '路线名称', width: 200, align: 'center' },
  { key: 'routingType', title: '路线类型', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'productCode', title: '产品编码', width: 150, align: 'center' },
  { key: 'productName', title: '产品名称', width: 200, align: 'center' },
  { key: 'specification', title: '规格型号', width: 200, align: 'center' },
  { key: 'version', title: '版本号', width: 100, align: 'center' },
  { key: 'isDefault', title: '默认路线', width: 100, align: 'center' },
  { key: 'isStandard', title: '标准路线', width: 100, align: 'center' },
  { key: 'effectiveDate', title: '生效日期', width: 160, align: 'center' },
  { key: 'expireDate', title: '失效日期', width: 160, align: 'center' },
  { key: 'operationCount', title: '工序数量', width: 100, align: 'center' },
  { key: 'totalTime', title: '总工时', width: 100, align: 'center' },
  { key: 'estimatedCost', title: '预估成本', width: 120, align: 'center' },
  { key: 'actualCost', title: '实际成本', width: 120, align: 'center' },
  { key: 'creatorName', title: '创建人', width: 120, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

export default {
  ROUTING_STATUS_MAP,
  ROUTING_TYPE_MAP,
  ROUTING_MASTER_COLUMNS,
};