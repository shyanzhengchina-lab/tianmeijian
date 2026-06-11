import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';
// Re-export types from types/index.ts
export * from './types/index';
/**
 * 生产任务单模块类型定义
 * 保持与现有数据结构完全一致
 */

// 任务单状态
export type TOStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';

// 任务优先级
export type TOPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// 生产任务单接口
export interface TaskOrder {
  id: string;
  taskNo: string;             // 任务单号
  woId?: string;              // 关联工单ID
  woNo?: string;              // 关联工单号
  poId?: string;              // 关联生产订单ID
  poNo?: string;              // 关联生产订单号
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  // 任务信息
  taskName: string;           // 任务名称
  taskType: string;           // 任务类型
  status: TOStatus;
  priority: TOPriority;
  // 数量信息
  planQty: number;            // 计划数量
  actualQty: number;          // 实际数量
  qualifiedQty: number;       // 合格数量
  unqualifiedQty: number;     // 不合格数量
  scrapQty: number;           // 报废数量
  // 时间信息
  planStartTime: string;      // 计划开始时间
  planEndTime: string;        // 计划结束时间
  actualStartTime?: string;   // 实际开始时间
  actualEndTime?: string;     // 实际结束时间
  // 工序信息
  stepCode: string;           // 工序编码
  stepName: string;           // 工序名称
  // 分配信息
  workcenterId?: string;      // 工作中心
  workcenterName?: string;    // 工作中心名称
  teamId?: string;           // 班组
  teamName?: string;         // 班组名称
  equipmentId?: string;       // 设备
  equipmentName?: string;     // 设备名称
  operatorId?: string;        // 操作员ID
  operatorName?: string;      // 操作员姓名
  // 质量信息
  qResult?: string;          // 质检结果
  qStatus?: string;           // 质检状态
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 生产任务单查询参数
export interface TaskOrderQuery extends PageQuery {
  taskNo?: string;
  woNo?: string;
  poNo?: string;
  productCode?: string;
  productName?: string;
  stepCode?: string;
  status?: TOStatus;
  priority?: TOPriority;
  taskType?: string;
  workcenterId?: string;
  teamId?: string;
  operatorId?: string;
  equipmentId?: string;
  planStartTimeStart?: string;
  planStartTimeEnd?: string;
  planEndTimeStart?: string;
  planEndTimeEnd?: string;
}

// 创建生产任务单DTO
export interface CreateTaskOrderDTO {
  taskNo: string;
  woId?: string;
  woNo?: string;
  poId?: string;
  poNo?: string;
  productCode: string;
  productName: string;
  productSpec: string;
  taskName: string;
  taskType: string;
  planQty: number;
  planStartTime: string;
  planEndTime: string;
  stepCode: string;
  stepName: string;
  workcenterId?: string;
  teamId?: string;
  equipmentId?: string;
  operatorId?: string;
  priority?: TOPriority;
  remark?: string;
}

// 更新生产任务单DTO
export interface UpdateTaskOrderDTO extends Partial<CreateTaskOrderDTO> {
  id: string;
}

// 批量操作参数
export interface TaskOrderBatchAction {
  ids: string[];
  action: 'assign' | 'start' | 'complete' | 'pause' | 'resume' | 'cancel' | 'delete' | 'allocate';
  params?: Record<string, any>;
}

// 生产任务单状态映射
export const TO_STATUS_MAP: Record<TOStatus, { label: string; color: string; badge: any }> = {
  'PENDING':    { label: '待分配', color: '#8c8c8c', badge: 'default' },
  'ASSIGNED':   { label: '已分配', color: '#1677ff', badge: 'processing' },
  'IN_PROGRESS': { label: '执行中', color: '#faad14', badge: 'warning' },
  'COMPLETED':  { label: '已完成', color: '#52c41a', badge: 'success' },
  'CANCELLED':  { label: '已取消', color: '#d9d9d9', badge: 'default' },
  'PAUSED':     { label: '已暂停', color: '#faad14', badge: 'warning' },
};

// 任务优先级映射
export const TO_PRIORITY_MAP: Record<TOPriority, { label: string; color: string }> = {
  'LOW':    { label: '低',   color: '#8c8c8c' },
  'NORMAL': { label: '中',   color: '#1677ff' },
  'HIGH':   { label: '高',   color: '#ff4d4f' },
  'URGENT': { label: '紧急', color: '#cf1322' },
};

// 默认生产任务单数据
export const DEFAULT_TASK_ORDERS: TaskOrder[] = [
  {
    id: 'TO-001',
    taskNo: 'TO-20260425001',
    woId: 'WO-001',
    woNo: 'WO-20260425001',
    poId: 'PO-001',
    poNo: 'MO-20260425001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    taskName: '机用根管锉车削加工',
    taskType: 'MACHINING',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    planQty: 500,
    actualQty: 320,
    qualifiedQty: 315,
    unqualifiedQty: 3,
    scrapQty: 2,
    planStartTime: '2026-04-05 08:00:00',
    planEndTime: '2026-04-05 16:00:00',
    actualStartTime: '2026-04-05 08:15:00',
    stepCode: 'OP0020',
    stepName: '车削',
    workcenterId: 'WC001',
    workcenterName: '机加工中心一',
    teamId: 'TEAM001',
    teamName: 'A班',
    equipmentId: 'EQ001',
    equipmentName: '车床CNC-001',
    operatorId: 'OP001',
    operatorName: '张三',
    qResult: 'PASS',
    qStatus: 'PASSED',
    remark: '标准生产任务',
    createdBy: '计划员',
    createdAt: '2026-04-05 07:30:00',
    updatedAt: '2026-04-05 14:30:00',
  },
];
