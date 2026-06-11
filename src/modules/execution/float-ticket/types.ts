/**
 * 批生产浮票模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 浮票状态
export type FloatTicketStatus = 'CREATED' | 'RELEASED' | 'IN_PROCESS' | 'QC_PENDING' | 'COMPLETED' | 'CANCELLED';

// 浮票类型
export type FloatTicketType = 'PRODUCTION' | 'REWORK' | 'SAMPLE' | 'TEST';

// 质检结果
export type QcResult = 'PENDING' | 'PASS' | 'FAIL' | 'CONDITIONAL';

// 批生产浮票接口
export interface FloatTicket {
  id: string;
  ticketNo: string;           // 浮票号
  workOrderId: string;         // 工单ID
  workOrderNo: string;        // 工单号
  productionOrderId: string;  // 生产订单ID
  productionOrderNo: string;  // 生产订单号
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  batchNo: string;            // 批号
  lotNo: string;              // 子批号
  // 数量信息
  planQty: number;            // 计划数量
  actualQty: number;          // 实际数量
  qualifiedQty: number;       // 合格数量
  unqualifiedQty: number;     // 不合格数量
  scrapQty: number;           // 报废数量
  // 浮票信息
  ticketType: FloatTicketType;
  status: FloatTicketStatus;
  priority: string;           // 优先级
  // 质量信息
  qcResult?: QcResult;
  qcResultDetails?: string;   // 质检结果详情
  inspector?: string;         // 检验员
  inspectionTime?: string;    // 检验时间
  // 时间信息
  releaseTime?: string;       // 发布时间
  startTime?: string;         // 开始时间
  endTime?: string;           // 结束时间
  // 流转信息
  currentWorkcenter?: string; // 当前工作中心
  currentOperator?: string;   // 当前操作员
  processPath: string[];      // 工序路径
  completedSteps: string[];   // 已完成工序
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 浮票工序执行记录接口
export interface FloatTicketStepRecord {
  id: string;
  ticketId: string;          // 浮票ID
  stepCode: string;          // 工序编码
  stepName: string;          // 工序名称
  // 执行信息
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
  // 时间信息
  startTime?: string;
  endTime?: string;
  // 人员信息
  operator?: string;          // 操作员
  equipment?: string;         // 设备
  // 数量信息
  inputQty: number;           // 投入数量
  outputQty: number;          // 产出数量
  qualifiedQty: number;       // 合格数量
  unqualifiedQty: number;     // 不合格数量
  scrapQty: number;           // 报废数量
  // 质检信息
  qcChecked: boolean;         // 是否质检
  qcResult?: QcResult;        // 质检结果
  qcDetails?: string;         // 质检详情
  // 其他
  remark?: string;
}

// 浮票物料使用记录接口
export interface FloatTicketMaterialUsage {
  id: string;
  ticketId: string;          // 浮票ID
  materialCode: string;      // 物料编码
  materialName: string;      // 物料名称
  materialSpec: string;      // 物料规格
  // 数量信息
  planQty: number;           // 计划数量
  actualQty: number;         // 实际使用数量
  // 批次信息
  batchNo?: string;          // 批号
  // 时间信息
  usageTime: string;         // 使用时间
  // 其他
  remark?: string;
}

// 浮票质检记录接口
export interface FloatTicketQcRecord {
  id: string;
  ticketId: string;          // 浮票ID
  qcSchemeId: string;        // 质检方案ID
  qcSchemeName: string;      // 质检方案名称
  // 检验信息
  inspector: string;         // 检验员
  inspectionTime: string;    // 检验时间
  // 检验结果
  result: QcResult;          // 检验结果
  resultDetails: string;     // 结果详情
  // 样品信息
  sampleQty: number;         // 抽样数量
  qualifiedQty: number;      // 合格数量
  unqualifiedQty: number;    // 不合格数量
  // 其他
  remark?: string;
}

// 批生产浮票查询参数
export interface FloatTicketQuery extends PageQuery {
  ticketNo?: string;
  workOrderNo?: string;
  productionOrderNo?: string;
  productCode?: string;
  productName?: string;
  batchNo?: string;
  lotNo?: string;
  status?: FloatTicketStatus;
  ticketType?: FloatTicketType;
  qcResult?: QcResult;
  currentWorkcenter?: string;
  currentOperator?: string;
  releaseTimeStart?: string;
  releaseTimeEnd?: string;
}

// 创建批生产浮票DTO
export interface CreateFloatTicketDTO {
  ticketNo: string;
  workOrderId: string;
  workOrderNo: string;
  productionOrderId: string;
  productionOrderNo: string;
  productCode: string;
  productName: string;
  productSpec: string;
  batchNo: string;
  lotNo: string;
  planQty: number;
  ticketType: FloatTicketType;
  priority?: string;
  processPath: string[];
  remark?: string;
}

// 更新批生产浮票DTO
export interface UpdateFloatTicketDTO extends Partial<CreateFloatTicketDTO> {
  id: string;
}

// 批量操作参数
export interface FloatTicketBatchAction {
  ids: string[];
  action: 'release' | 'start' | 'complete' | 'cancel' | 'delete' | 'qc';
  params?: Record<string, any>;
}

// 浮票状态映射
export const FLOAT_TICKET_STATUS_MAP: Record<FloatTicketStatus, { label: string; color: string; badge: any }> = {
  'CREATED':    { label: '已创建',   color: '#8c8c8c', badge: 'default' },
  'RELEASED':   { label: '已发布',   color: '#1677ff', badge: 'processing' },
  'IN_PROCESS': { label: '生产中',   color: '#faad14', badge: 'warning' },
  'QC_PENDING': { label: '待质检',  color: '#722ed1', badge: 'processing' },
  'COMPLETED':  { label: '已完成',   color: '#52c41a', badge: 'success' },
  'CANCELLED':  { label: '已取消',   color: '#d9d9d9', badge: 'default' },
};

// 浮票类型映射
export const FLOAT_TICKET_TYPE_MAP: Record<FloatTicketType, { label: string; color: string }> = {
  'PRODUCTION': { label: '生产', color: '#1677ff' },
  'REWORK':     { label: '返工', color: '#ff4d4f' },
  'SAMPLE':     { label: '样品', color: '#52c41a' },
  'TEST':       { label: '测试', color: '#faad14' },
};

// 质检结果映射
export const QC_RESULT_MAP: Record<QcResult, { label: string; color: string; badge: any }> = {
  'PENDING':     { label: '待检验',  color: '#8c8c8c', badge: 'default' },
  'PASS':        { label: '合格',    color: '#52c41a', badge: 'success' },
  'FAIL':        { label: '不合格',  color: '#ff4d4f', badge: 'error' },
  'CONDITIONAL': { label: '有条件',  color: '#faad14', badge: 'warning' },
};

// 默认批生产浮票数据
export const DEFAULT_FLOAT_TICKETS: FloatTicket[] = [
  {
    id: 'FT-001',
    ticketNo: 'FT-20260425001',
    workOrderId: 'WO-001',
    workOrderNo: 'WO-20260425001',
    productionOrderId: 'PO-001',
    productionOrderNo: 'MO-20260425001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    batchNo: '20260425001',
    lotNo: '001',
    planQty: 500,
    actualQty: 320,
    qualifiedQty: 315,
    unqualifiedQty: 3,
    scrapQty: 2,
    ticketType: 'PRODUCTION',
    status: 'IN_PROCESS',
    priority: 'HIGH',
    qcResult: undefined,
    releaseTime: '2026-04-05 08:00:00',
    startTime: '2026-04-05 08:15:00',
    currentWorkcenter: 'WC001',
    currentOperator: '张三',
    processPath: ['OP0010', 'OP0020', 'OP0030', 'OP0040'],
    completedSteps: ['OP0010', 'OP0020'],
    remark: '标准生产浮票',
    createdBy: '计划员',
    createdAt: '2026-04-05 07:30:00',
    updatedAt: '2026-04-05 14:30:00',
  },
];
