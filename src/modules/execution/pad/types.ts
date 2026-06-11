/**
 * 工序执行模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// Re-export PAD types from types/index.ts so pad/store and pad/components can import from '../types'
export * from './types/index';

// 执行状态
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

// 执行模式
export type ExecutionMode = 'MANUAL' | 'AUTO' | 'SEMI_AUTO';

// 操作记录类型
export type OperationRecordType = 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'CANCEL' | 'QC' | 'MATERIAL';

// 工序执行任务接口
export interface PadExecutionTask {
  id: string;
  taskId: string;              // 关联任务ID
  taskNo: string;              // 任务编号
  workOrderId: string;         // 工单ID
  workOrderNo: string;        // 工单号
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  // 工序信息
  stepCode: string;
  stepName: string;
  // 执行状态
  status: ExecutionStatus;
  executionMode: ExecutionMode;
  // 数量信息
  planQty: number;
  actualQty: number;
  qualifiedQty: number;
  unqualifiedQty: number;
  scrapQty: number;
  // 进度信息
  progress: number;            // 进度百分比
  // 人员信息
  operatorId: string;
  operatorName: string;
  // 设备信息
  equipmentId: string;
  equipmentName: string;
  workcenterId: string;
  workcenterName: string;
  // 时间信息
  planStartTime: string;
  planEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  estimatedEndTime?: string;
  // 工艺参数
  temperature?: number;
  humidity?: number;
  pressure?: number;
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 操作记录接口
export interface OperationRecord {
  id: string;
  taskId: string;
  recordType: OperationRecordType;
  // 操作信息
  operatorId: string;
  operatorName: string;
  operationTime: string;
  // 操作详情
  beforeStatus: string;
  afterStatus: string;
  quantity?: number;
  qualifiedQty?: number;
  unqualifiedQty?: number;
  scrapQty?: number;
  // 备注
  remark?: string;
}

// 实时参数接口
export interface RealtimeParameter {
  id: string;
  taskId: string;
  parameterCode: string;
  parameterName: string;
  parameterValue: number;
  parameterUnit: string;
  minValue: number;
  maxValue: number;
  isNormal: boolean;
  recordTime: string;
}

// 执行日志接口
export interface ExecutionLog {
  id: string;
  taskId: string;
  logType: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  logMessage: string;
  logTime: string;
  operator?: string;
}

// 工序执行任务查询参数
export interface PadExecutionTaskQuery extends PageQuery {
  taskNo?: string;
  workOrderNo?: string;
  productCode?: string;
  productName?: string;
  stepCode?: string;
  stepName?: string;
  status?: ExecutionStatus;
  executionMode?: ExecutionMode;
  operatorId?: string;
  operatorName?: string;
  equipmentId?: string;
  workcenterId?: string;
  planStartTimeStart?: string;
  planStartTimeEnd?: string;
}

// 创建工序执行任务DTO
export interface CreatePadExecutionTaskDTO {
  taskId: string;
  taskNo: string;
  workOrderId: string;
  workOrderNo: string;
  productCode: string;
  productName: string;
  productSpec: string;
  stepCode: string;
  stepName: string;
  planQty: number;
  planStartTime: string;
  planEndTime: string;
  operatorId: string;
  operatorName: string;
  equipmentId: string;
  equipmentName: string;
  workcenterId: string;
  workcenterName: string;
  executionMode?: ExecutionMode;
  temperature?: number;
  humidity?: number;
  remark?: string;
}

// 更新工序执行任务DTO
export interface UpdatePadExecutionTaskDTO extends Partial<CreatePadExecutionTaskDTO> {
  id: string;
}

// 批量操作参数
export interface PadExecutionBatchAction {
  ids: string[];
  action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel';
  params?: Record<string, any>;
}

// 执行状态映射
export const EXECUTION_STATUS_MAP: Record<ExecutionStatus, { label: string; color: string; badge: any }> = {
  'PENDING':    { label: '待执行', color: '#8c8c8c', badge: 'default' },
  'RUNNING':    { label: '执行中', color: '#52c41a', badge: 'processing' },
  'PAUSED':     { label: '已暂停', color: '#faad14', badge: 'warning' },
  'COMPLETED':  { label: '已完成', color: '#1677ff', badge: 'success' },
  'CANCELLED':  { label: '已取消', color: '#d9d9d9', badge: 'default' },
};

// 执行模式映射
export const EXECUTION_MODE_MAP: Record<ExecutionMode, { label: string; color: string }> = {
  'MANUAL':    { label: '手动',   color: '#1677ff' },
  'AUTO':      { label: '自动',   color: '#52c41a' },
  'SEMI_AUTO': { label: '半自动', color: '#faad14' },
};

// 默认工序执行任务数据
export const DEFAULT_PAD_EXECUTION_TASKS: PadExecutionTask[] = [
  {
    id: 'PET-001',
    taskId: 'TO-001',
    taskNo: 'TO-20260425001',
    workOrderId: 'WO-001',
    workOrderNo: 'WO-20260425001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    stepCode: 'OP0020',
    stepName: '车削',
    status: 'RUNNING',
    executionMode: 'MANUAL',
    planQty: 500,
    actualQty: 320,
    qualifiedQty: 315,
    unqualifiedQty: 3,
    scrapQty: 2,
    progress: 64,
    operatorId: 'OP001',
    operatorName: '张三',
    equipmentId: 'EQ001',
    equipmentName: '车床CNC-001',
    workcenterId: 'WC001',
    workcenterName: '机加工中心一',
    planStartTime: '2026-04-05 08:00:00',
    planEndTime: '2026-04-05 16:00:00',
    actualStartTime: '2026-04-05 08:15:00',
    estimatedEndTime: '2026-04-05 14:00:00',
    temperature: 25.5,
    humidity: 45.0,
    remark: '正常执行中',
    createdBy: '计划员',
    createdAt: '2026-04-05 07:30:00',
    updatedAt: '2026-04-05 14:30:00',
  },
];
