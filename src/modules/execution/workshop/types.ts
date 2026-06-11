/**
 * 车间看板模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 车间状态
export type WorkshopStatus = 'ACTIVE' | 'MAINTENANCE' | 'STOPPED';

// 设备状态
export type EquipmentStatus = 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'STOPPED' | 'ERROR';

// 车间看板数据接口
export interface WorkshopDashboard {
  id: string;
  workcenterId: string;
  workcenterName: string;
  workshopId: string;
  workshopName: string;
  status: WorkshopStatus;
  // 生产统计
  totalOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  // 人员统计
  totalOperators: number;
  presentOperators: number;
  absentOperators: number;
  // 设备统计
  totalEquipment: number;
  runningEquipment: number;
  idleEquipment: number;
  maintenanceEquipment: number;
  stoppedEquipment: number;
  errorEquipment: number;
  // 产能统计
  dailyPlanQty: number;
  dailyActualQty: number;
  dailyQualifiedRate: number;
  // 时间戳
  updateTime: string;
}

// 设备运行状态接口
export interface EquipmentStatusInfo {
  id: string;
  equipmentId: string;
  equipmentName: string;
  workcenterId: string;
  status: EquipmentStatus;
  // 运行参数
  temperature?: number;
  speed?: number;
  efficiency?: number;
  // 当前工单
  currentTask?: {
    taskNo: string;
    productName: string;
    progress: number;
  };
  // 运行时间
  runTime?: number;          // 运行时长(小时)
  idleTime?: number;         // 空闲时长(小时)
  maintenanceTime?: number;  // 维护时长(小时)
  // 告警信息
  alarms: EquipmentAlarm[];
  // 时间戳
  updateTime: string;
}

// 设备告警接口
export interface EquipmentAlarm {
  id: string;
  equipmentId: string;
  alarmType: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  alarmCode: string;
  alarmMessage: string;
  alarmTime: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedTime?: string;
}

// 工序执行状态接口
export interface OperationExecution {
  id: string;
  workOrderId: string;
  workOrderNo: string;
  taskId: string;
  taskNo: string;
  stepCode: string;
  stepName: string;
  // 执行状态
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  // 执行进度
  planQty: number;
  actualQty: number;
  qualifiedQty: number;
  unqualifiedQty: number;
  progress: number;          // 进度百分比
  // 时间信息
  startTime?: string;
  endTime?: string;
  estimatedEndTime?: string;
  // 执行人员
  operatorId?: string;
  operatorName?: string;
  // 设备信息
  equipmentId?: string;
  equipmentName?: string;
  // 时间戳
  updateTime: string;
}

// 生产实绩统计接口
export interface ProductionStatistics {
  id: string;
  workcenterId: string;
  date: string;
  // 数量统计
  planQty: number;
  actualQty: number;
  qualifiedQty: number;
  unqualifiedQty: number;
  scrapQty: number;
  // 工单统计
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  pendingOrders: number;
  // 效率统计
  scheduleAdherence: number;  // 计划达成率
  qualifiedRate: number;      // 合格率
  efficiency: number;         // 生产效率
  // 时间统计
  workTime: number;           // 工作时间
  downTime: number;           // 停机时间
  idleTime: number;           // 空闲时间
  // 时间戳
  updateTime: string;
}

// 车间看板查询参数
export interface WorkshopDashboardQuery extends PageQuery {
  workcenterId?: string;
  workshopId?: string;
  status?: WorkshopStatus;
  date?: string;
  dateStart?: string;
  dateEnd?: string;
}

// 车间状态映射
export const WORKSHOP_STATUS_MAP: Record<WorkshopStatus, { label: string; color: string }> = {
  'ACTIVE':      { label: '正常',  color: '#52c41a' },
  'MAINTENANCE': { label: '维护',  color: '#faad14' },
  'STOPPED':     { label: '停机',  color: '#d9d9d9' },
};

// 设备状态映射
export const EQUIPMENT_STATUS_MAP: Record<EquipmentStatus, { label: string; color: string; icon: string }> = {
  'RUNNING':     { label: '运行中', color: '#52c41a', icon: '⚡' },
  'IDLE':        { label: '空闲',   color: '#1677ff', icon: '⏸' },
  'MAINTENANCE': { label: '维护',   color: '#faad14', icon: '🔧' },
  'STOPPED':     { label: '停机',   color: '#d9d9d9', icon: '⏹' },
  'ERROR':       { label: '故障',   color: '#ff4d4f', icon: '⚠' },
};

// 默认车间看板数据
export const DEFAULT_WORKSHOP_DASHBOARDS: WorkshopDashboard[] = ([
  {
    id: 'WD-001',
    workcenterId: 'WC001',
    workcenterName: '机加工中心一',
    workshopId: 'WS001',
    workshopName: '车间A',
    status: 'ACTIVE',
    totalOrders: 10,
    inProgressOrders: 5,
    completedOrders: 3,
    totalOperators: 20,
    presentOperators: 18,
    absentOperators: 2,
    totalEquipment: 8,
    runningEquipment: 6,
    idleEquipment: 1,
    maintenanceEquipment: 0,
    stoppedEquipment: 1,
    errorEquipment: 0,
    dailyPlanQty: 5000,
    dailyActualQty: 3200,
    qualifiedRate: 98.5,
    updateTime: new Date().toISOString(),
  },
] as any[]);

// 默认设备运行状态数据
export const DEFAULT_EQUIPMENT_STATUSES: EquipmentStatusInfo[] = ([
  {
    id: 'ES-001',
    equipmentId: 'EQ001',
    equipmentName: '车床CNC-001',
    workcenterId: 'WC001',
    status: 'RUNNING',
    temperature: 25.5,
    speed: 1500,
    efficiency: 92.5,
    currentTask: {
      taskNo: 'TO-20260425001',
      productName: '机用根管锉',
      progress: 64,
    },
    runTime: 6.5,
    idleTime: 0.5,
    maintenanceTime: 0,
    alarms: [],
    updateTime: new Date().toISOString(),
  },
] as any[]);

// 默认工序执行状态数据
export const DEFAULT_OPERATION_EXECUTIONS: OperationExecution[] = [
  {
    id: 'OE-001',
    workOrderId: 'WO-001',
    workOrderNo: 'WO-20260425001',
    taskId: 'TO-001',
    taskNo: 'TO-20260425001',
    stepCode: 'OP0020',
    stepName: '车削',
    status: 'RUNNING',
    planQty: 500,
    actualQty: 320,
    qualifiedQty: 315,
    unqualifiedQty: 3,
    progress: 64,
    startTime: '2026-04-05 08:15:00',
    estimatedEndTime: '2026-04-05 14:00:00',
    operatorId: 'OP001',
    operatorName: '张三',
    equipmentId: 'EQ001',
    equipmentName: '车床CNC-001',
    updateTime: new Date().toISOString(),
  },
];
