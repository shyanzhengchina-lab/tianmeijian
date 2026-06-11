/**
 * 生产订单模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// Re-export types from types/index.ts so store can import from '../types'
export * from './types/index';

// 订单状态
export type POStatus = 'OPEN' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

// 订单优先级
export type POPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// 生产订单接口
export interface ProductionOrder {
  id: string;
  orderNo: string;          // 订单编号，如 PO-20260425001
  soNo?: string;             // 关联销售订单
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  bomVersion: string;
  routingCode: string;      // 工艺路径编码
  // 订单信息
  totalQty: number;          // 订单总量
  completedQty: number;     // 完成数量
  scrapQty: number;          // 报废数量
  // 多规格明细（新版多物料订单）
  lineItems?: POLineItem[];  // 单规格订单时为null
  // 状态信息
  status: POStatus;
  priority: POPriority;
  deliveryDate: string;
  releaseDate?: string;
  // 审核信息
  isAudited: boolean;
  auditedBy?: string;
  auditedAt?: string;
  // 关联信息
  relatedWOs?: WorkOrderSummary[]; // 关联工单汇总
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 单规格明细接口（多物料订单）
export interface POLineItem {
  id: string;
  lineNo: number;           // 行号
  productCode: string;
  productSpec: string;       // 产品规格
  planQty: number;          // 计划数量
  actualQty?: number;      // 实际数量（入库时填入）
  remark?: string;
}

// 工单汇总接口
export interface WorkOrderSummary {
  id: string;
  woNo: string;
  status: string;
  planQty: number;
  actualQty?: number;
}

// 生产订单查询参数
export interface ProductionOrderQuery extends PageQuery {
  orderNo?: string;
  productCode?: string;
  productName?: string;
  routingCode?: string;
  status?: POStatus;
  priority?: POPriority;
  soNo?: string;
  deliveryDateStart?: string;
  deliveryDateEnd?: string;
  isAudited?: boolean;
}

// 创建生产订单DTO
export interface CreateProductionOrderDTO {
  orderNo: string;
  productCode: string;
  productName: string;
  productSpec: string;
  bomVersion: string;
  routingCode: string;
  totalQty: number;
  priority?: POPriority;
  deliveryDate: string;
  lineItems?: Omit<POLineItem, 'id'>[];
  remark?: string;
}

// 更新生产订单DTO
export interface UpdateProductionOrderDTO extends Partial<CreateProductionOrderDTO> {
  id: string;
}

// 批量操作参数
export interface ProductionOrderBatchAction {
  ids: string[];
  action: 'release' | 'audit' | 'unaudit' | 'close' | 'delete';
  params?: Record<string, any>;
}

// 生产订单状态映射
export const PO_STATUS_MAP: Record<POStatus, { label: string; color: string; badge: any }> = {
  'OPEN':       { label: '未发布', color: '#8c8c8c', badge: 'default' },
  'RELEASED':    { label: '已发布', color: '#1677ff', badge: 'processing' },
  'IN_PROGRESS': { label: '生产中', color: '#faad14', badge: 'warning' },
  'COMPLETED':  { label: '已完成', color: '#52c41a', badge: 'success' },
  'CLOSED':     { label: '已关闭', color: '#d9d9d9', badge: 'default' },
};

// 优先级映射
export const PO_PRIORITY_MAP: Record<POPriority, { label: string; color: string }> = {
  'LOW':    { label: '低',   color: '#8c8c8c' },
  'NORMAL': { label: '中',   color: '#1677ff' },
  'HIGH':   { label: '高',   color: '#ff4d4f' },
  'URGENT': { label: '紧急', color: '#cf1322' },
};

// 默认生产订单数据
export const DEFAULT_PRODUCTION_ORDERS: ProductionOrder[] = [
  {
    id: 'PO-001',
    orderNo: 'MO-20260425001',
    soNo: 'SO-20260425001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    bomVersion: 'V2.1',
    routingCode: 'YS-RKQ-STD-V21',
    totalQty: 10000,
    completedQty: 8500,
    scrapQty: 50,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    deliveryDate: '2026-05-30',
    isAudited: true,
    auditedBy: '计划员',
    auditedAt: '2026-04-01 15:30:00',
    remark: '高优先级标准产品批量订单',
    createdBy: '计划员',
    createdAt: '2026-04-01 10:00:00',
    updatedAt: '2026-04-20 16:30:00',
  },
];
