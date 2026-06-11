/**
 * 生产工单模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 工单状态
export type WOStatus = 'DRAFT' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'SUSPENDED';

// 工单类型
export type WOType = 'PRODUCTION' | 'REWORK' | 'SAMPLE' | 'TEST';

// 生产工单接口
export interface WorkOrder {
  id: string;
  woNo: string;              // 工单号
  poId?: string;             // 关联生产订单ID
  poNo?: string;             // 关联生产订单号
  soNo?: string;             // 关联销售订单号
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  bomVersion: string;
  // 工单信息
  woType: WOType;
  status: WOStatus;
  planQty: number;           // 计划数量
  actualQty: number;         // 实际数量
  qualifiedQty: number;      // 合格数量
  unqualifiedQty: number;    // 不合格数量
  scrapQty: number;          // 报废数量
  // 时间信息
  planStartDate: string;     // 计划开始日期
  planEndDate: string;       // 计划结束日期
  actualStartDate?: string;  // 实际开始日期
  actualEndDate?: string;    // 实际结束日期
  // 工序信息
  routingCode: string;
  currentStep?: string;      // 当前工序
  // 执行信息
  workcenterId?: string;     // 工作中心
  teamId?: string;           // 班组
  operator?: string;         // 操作员
  // 质量信息
  qualityStatus?: string;    // 质量状态
  qResult?: string;          // 质检结果
  // 环境要求
  temperature?: number;      // 温度要求
  humidity?: number;         // 湿度要求
  // 工序步骤
  steps?: WOStep[];          // 工序步骤列表
  // 生产参数
  duration?: number;         // 计划工时（分钟）
  equipmentIds?: string[];   // 设备ID列表
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  createTime?: string;       // 兼容别名
}

// 工单工序明细接口
export interface WOStep {
  id: string;
  woId: string;
  stepNo: number;           // 工序号
  stepCode: string;         // 工序编码
  stepName: string;         // 工序名称
  operationId: string;      // 工序ID
  status: string;           // 工序状态
  planQty: number;          // 计划数量
  actualQty: number;        // 实际数量
  qualifiedQty: number;     // 合格数量
  unqualifiedQty: number;   // 不合格数量
  scrapQty: number;         // 报废数量
  // 时间信息
  planStartTime?: string;   // 计划开始时间
  planEndTime?: string;     // 计划结束时间
  actualStartTime?: string; // 实际开始时间
  actualEndTime?: string;   // 实际结束时间
  // 执行信息
  workcenterId?: string;
  teamId?: string;
  operator?: string;
  // 设备信息
  equipmentIds?: string[];   // 设备ID列表
  // 工艺要求
  temperature?: number;     // 温度要求
  humidity?: number;        // 湿度要求
  duration?: number;        // 加工时长(分钟)
  // 其他
  remark?: string;
}

// 生产工单查询参数
export interface WorkOrderQuery extends PageQuery {
  woNo?: string;
  poNo?: string;
  soNo?: string;
  productCode?: string;
  productName?: string;
  routingCode?: string;
  status?: WOStatus;
  woType?: WOType;
  workcenterId?: string;
  teamId?: string;
  operator?: string;
  planStartDateStart?: string;
  planStartDateEnd?: string;
  planEndDateStart?: string;
  planEndDateEnd?: string;
}

// 创建生产工单DTO
export interface CreateWorkOrderDTO {
  woNo: string;
  poId?: string;
  poNo?: string;
  soNo?: string;
  productCode: string;
  productName: string;
  productSpec: string;
  bomVersion: string;
  woType: WOType;
  planQty: number;
  planStartDate: string;
  planEndDate: string;
  routingCode: string;
  workcenterId?: string;
  teamId?: string;
  steps?: Omit<WOStep, 'id' | 'woId'>[];
  remark?: string;
}

// 更新生产工单DTO
export interface UpdateWorkOrderDTO extends Partial<CreateWorkOrderDTO> {
  id: string;
}

// 批量操作参数
export interface WorkOrderBatchAction {
  ids: string[];
  action: 'release' | 'suspend' | 'resume' | 'close' | 'delete' | 'allocate';
  params?: Record<string, any>;
}

// 生产工单状态映射
export const WO_STATUS_MAP: Record<WOStatus, { label: string; color: string; badge: any }> = {
  'DRAFT':      { label: '草稿',   color: '#8c8c8c', badge: 'default' },
  'RELEASED':   { label: '已发布', color: '#1677ff', badge: 'processing' },
  'IN_PROGRESS': { label: '生产中', color: '#faad14', badge: 'warning' },
  'COMPLETED':  { label: '已完成', color: '#52c41a', badge: 'success' },
  'CLOSED':     { label: '已关闭', color: '#d9d9d9', badge: 'default' },
  'SUSPENDED':  { label: '已暂停', color: '#ff7a45', badge: 'error' },
};

// 工单类型映射
export const WO_TYPE_MAP: Record<WOType, { label: string; color: string }> = {
  'PRODUCTION': { label: '生产',   color: '#1677ff' },
  'REWORK':     { label: '返工',   color: '#ff4d4f' },
  'SAMPLE':     { label: '样品',   color: '#52c41a' },
  'TEST':       { label: '测试',   color: '#faad14' },
};

// 默认生产工单数据
export const DEFAULT_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-001',
    woNo: 'WO-20260425001',
    poId: 'PO-001',
    poNo: 'MO-20260425001',
    soNo: 'SO-20260425001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    bomVersion: 'V2.1',
    woType: 'PRODUCTION',
    status: 'IN_PROGRESS',
    planQty: 5000,
    actualQty: 3200,
    qualifiedQty: 3150,
    unqualifiedQty: 30,
    scrapQty: 20,
    planStartDate: '2026-04-01',
    planEndDate: '2026-04-30',
    actualStartDate: '2026-04-05',
    routingCode: 'YS-RKQ-STD-V21',
    currentStep: 'OP0030',
    workcenterId: 'WC001',
    teamId: 'TEAM001',
    operator: '张三',
    qualityStatus: 'INSPECTING',
    remark: '标准生产订单',
    createdBy: '计划员',
    createdAt: '2026-04-01 10:00:00',
    updatedAt: '2026-04-20 16:30:00',
  },
];
