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

// 默认工序执行任务数据（天美健保健品制造——维生素C咀嚼片 / 益生菌胶囊）
export const DEFAULT_PAD_EXECUTION_TASKS: PadExecutionTask[] = [
  {
    id: 'PET-001',
    taskId: 'TO-VITC-WG-001',
    taskNo: 'TO-20260605001',
    workOrderId: 'WO-20260605-001',
    workOrderNo: 'WO-20260605-001',
    productCode: 'FG-VITC-500MG-60T',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/片 × 60片/瓶',
    stepCode: 'OP-40',
    stepName: '压片',
    status: 'RUNNING',
    executionMode: 'MANUAL',
    planQty: 600000,
    actualQty: 320000,
    qualifiedQty: 318500,
    unqualifiedQty: 1200,
    scrapQty: 300,
    progress: 53,
    operatorId: 'OP001',
    operatorName: '张三',
    equipmentId: 'EQ-TAB-001',
    equipmentName: '旋转压片机ZP37',
    workcenterId: 'WC-NJ-SOLID',
    workcenterName: '南京-固体制剂车间',
    planStartTime: '2026-06-05 08:00:00',
    planEndTime: '2026-06-05 16:00:00',
    actualStartTime: '2026-06-05 08:20:00',
    estimatedEndTime: '2026-06-05 15:30:00',
    temperature: 22.5,
    humidity: 45.0,
    remark: '正常执行中，首件合格',
    createdBy: '生产计划员',
    createdAt: '2026-06-05 07:30:00',
    updatedAt: '2026-06-05 13:45:00',
  },
  {
    id: 'PET-002',
    taskId: 'TO-VITC-WG-002',
    taskNo: 'TO-20260605002',
    workOrderId: 'WO-20260605-001',
    workOrderNo: 'WO-20260605-001',
    productCode: 'FG-VITC-500MG-60T',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/片 × 60片/瓶',
    stepCode: 'OP-10',
    stepName: '称量配料',
    status: 'COMPLETED',
    executionMode: 'MANUAL',
    planQty: 200,
    actualQty: 200,
    qualifiedQty: 200,
    unqualifiedQty: 0,
    scrapQty: 0,
    progress: 100,
    operatorId: 'OP002',
    operatorName: '李四',
    equipmentId: 'EQ-SCALE-001',
    equipmentName: '精密电子天平TP-202A',
    workcenterId: 'WC-NJ-SOLID',
    workcenterName: '南京-固体制剂车间',
    planStartTime: '2026-06-05 07:30:00',
    planEndTime: '2026-06-05 12:30:00',
    actualStartTime: '2026-06-05 07:45:00',
    actualEndTime: '2026-06-05 11:50:00',
    estimatedEndTime: '2026-06-05 11:50:00',
    temperature: 22.0,
    humidity: 44.0,
    remark: '称量完成，偏差均在±0.1%内',
    createdBy: '生产计划员',
    createdAt: '2026-06-05 07:00:00',
    updatedAt: '2026-06-05 11:55:00',
  },
  {
    id: 'PET-003',
    taskId: 'TO-PROBIO-CAP-001',
    taskNo: 'TO-20260605003',
    workOrderId: 'WO-20260605-003',
    workOrderNo: 'WO-20260605-003',
    productCode: 'FG-PROBIO-400MG-60C',
    productName: '益生菌胶囊',
    productSpec: '400mg/粒 × 60粒/瓶',
    stepCode: 'OP-40',
    stepName: '胶囊充填',
    status: 'RUNNING',
    executionMode: 'MANUAL',
    planQty: 100000,
    actualQty: 35000,
    qualifiedQty: 34850,
    unqualifiedQty: 120,
    scrapQty: 30,
    progress: 35,
    operatorId: 'OP003',
    operatorName: '王五',
    equipmentId: 'EQ-FILL-COLD-001',
    equipmentName: '冷链胶囊充填机NJP-800',
    workcenterId: 'WC-LS-PROBIO',
    workcenterName: '廊坊-益生菌冷链车间',
    planStartTime: '2026-06-05 09:00:00',
    planEndTime: '2026-06-05 17:00:00',
    actualStartTime: '2026-06-05 09:15:00',
    estimatedEndTime: '2026-06-05 16:45:00',
    temperature: 7.5,
    humidity: 38.0,
    remark: '冷链充填中，车间温度符合要求（≤8°C）',
    createdBy: '生产计划员',
    createdAt: '2026-06-05 08:30:00',
    updatedAt: '2026-06-05 12:00:00',
  },
  {
    id: 'PET-004',
    taskId: 'TO-VITC-DC-001',
    taskNo: 'TO-20260605004',
    workOrderId: 'WO-20260605-004',
    workOrderNo: 'WO-20260605-004',
    productCode: 'FG-VITC-500MG-60T-DC',
    productName: '维生素C咀嚼片（直压）',
    productSpec: '500mg/片 × 60片/瓶',
    stepCode: 'OP-30',
    stepName: '总混',
    status: 'PENDING',
    executionMode: 'MANUAL',
    planQty: 241,
    actualQty: 0,
    qualifiedQty: 0,
    unqualifiedQty: 0,
    scrapQty: 0,
    progress: 0,
    operatorId: 'OP004',
    operatorName: '赵六',
    equipmentId: 'EQ-BLEND-001',
    equipmentName: '三维运动混合机SYH-200',
    workcenterId: 'WC-NJ-SOLID',
    workcenterName: '南京-固体制剂车间',
    planStartTime: '2026-06-05 10:00:00',
    planEndTime: '2026-06-05 14:00:00',
    temperature: 22.0,
    humidity: 43.0,
    remark: '待前工序称量完成后开始',
    createdBy: '生产计划员',
    createdAt: '2026-06-05 07:00:00',
    updatedAt: '2026-06-05 09:30:00',
  },
];
