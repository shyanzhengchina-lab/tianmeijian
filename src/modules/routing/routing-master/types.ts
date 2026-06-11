/**
 * 工艺路径主数据模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 工艺路径状态
export type RoutingStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

// 工艺路径主数据接口
export interface RoutingMaster {
  id: string;
  routingCode: string;       // 工艺路径编码
  routingName: string;       // 工艺路径名称
  // 产品信息
  productSeries: string;     // 产品系列
  productCode: string;       // 产品编码
  productName: string;       // 产品名称
  productSpec: string;       // 产品规格
  bomVersion: string;        // BOM版本
  routingVersion: string;    // 工艺路径版本
  // 工艺信息
  routingType: string;       // 工艺类型
  status: RoutingStatus;
  // 时间信息
  effectiveDate: string;     // 生效日期
  expiryDate?: string;       // 失效日期
  // 审批信息
  approvedBy?: string;       // 批准人
  approvalTime?: string;     // 批准时间
  // 其他
  description?: string;      // 描述
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  details?: RoutingDetail[]; // 工艺路径明细
}

// 工艺路径明细接口
export interface RoutingDetail {
  id: string;
  routingId: string;        // 工艺路径ID
  stepNo: number;           // 工序号
  stepCode: string;         // 工序编码
  stepName: string;         // 工序名称
  operationId: string;      // 工序ID
  operationName: string;    // 工序名称
  // 时间信息
  planTime: number;         // 计划工时(分钟)
  setupTime: number;        // 准备时间(分钟)
  // 成本信息
  laborCost?: number;       // 人工成本
  machineCost?: number;     // 机器成本
  totalCost?: number;       // 总成本
  // 质检信息
  qcRequired: boolean;      // 是否质检
  qcSchemeId?: string;      // 质检方案ID
  // 设备要求
  equipmentRequirement?: string; // 设备要求
  // 时间轴展示
  date?: string;     // 日期
  event?: string;    // 事件
  desc?: string;     // 描述
  // 其他
  remark?: string;
}

// 工艺路径主数据查询参数
export interface RoutingMasterQuery extends PageQuery {
  routingCode?: string;
  routingName?: string;
  productSeries?: string;
  productCode?: string;
  productName?: string;
  status?: RoutingStatus;
  routingType?: string;
  effectiveDateStart?: string;
  effectiveDateEnd?: string;
}

// 创建工艺路径主数据DTO
export interface CreateRoutingMasterDTO {
  routingCode: string;
  routingName: string;
  productSeries: string;
  productCode: string;
  productName: string;
  productSpec: string;
  bomVersion: string;
  routingVersion: string;
  routingType: string;
  effectiveDate: string;
  expiryDate?: string;
  details?: Omit<RoutingDetail, 'id' | 'routingId'>[];
  description?: string;
  remark?: string;
}

// 更新工艺路径主数据DTO
export interface UpdateRoutingMasterDTO extends Partial<CreateRoutingMasterDTO> {
  id: string;
}

// 批量操作参数
export interface RoutingMasterBatchAction {
  ids: string[];
  action: 'activate' | 'deactivate' | 'archive' | 'delete' | 'approve';
  params?: Record<string, any>;
}

// 工艺路径状态映射
export const ROUTING_STATUS_MAP: Record<RoutingStatus, { label: string; color: string; badge: any }> = {
  'DRAFT':    { label: '草稿',   color: '#8c8c8c', badge: 'default' },
  'ACTIVE':   { label: '生效',   color: '#52c41a', badge: 'success' },
  'INACTIVE': { label: '停用',   color: '#d9d9d9', badge: 'default' },
  'ARCHIVED': { label: '归档',   color: '#1677ff', badge: 'default' },
};

// 默认工艺路径主数据
export interface CopyRoutingMasterDTO {
  sourceId: string;
  newRoutingNo: string;
  newRoutingName: string;
  newVersion: string;
}

export interface RoutingStats {
  totalSteps: number;
  totalTime: number;
  avgTime: number;
  totalCost: number;
  [key: string]: any;
}

export const DEFAULT_ROUTING_MASTERS: RoutingMaster[] = [
  {
    id: 'RM-001',
    routingCode: 'YS-RKQ-STD-V21',
    routingName: '机用根管锉标准工艺路径',
    productSeries: 'RKQ',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    bomVersion: 'V2.1',
    routingVersion: 'V2.1',
    routingType: 'STANDARD',
    status: 'ACTIVE',
    effectiveDate: '2026-01-01',
    expiryDate: '2027-12-31',
    approvedBy: '工艺工程师',
    approvalTime: '2026-01-01 10:00:00',
    description: '机用根管锉标准生产工艺路径',
    remark: '标准路径',
    createdBy: '工艺工程师',
    createdAt: '2026-01-01 09:00:00',
    updatedAt: '2026-04-01 10:00:00',
  },
];
