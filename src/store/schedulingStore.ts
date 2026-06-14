/**
 * 浮动排程（FSE）模块 - Store & Mock数据
 * 天美健保健品MES — MES-FSE-001
 * PRD v1.0 对齐：双工厂架构、GMP硬约束、EDD优先级、事件驱动重排
 */

// ─────────────────────────────────────────────
// 1. 类型定义
// ─────────────────────────────────────────────

/** 工单状态 */
export type WoStatus =
  | 'PENDING'     // 待排程
  | 'SCHEDULED'   // 已排程
  | 'RELEASED'    // 已下达
  | 'RUNNING'     // 生产中
  | 'PAUSED'      // 暂停
  | 'COMPLETED'   // 完成
  | 'CANCELLED';  // 取消

/** 资源状态 */
export type ResourceStatus =
  | 'AVAILABLE'     // 可用
  | 'OCCUPIED'      // 占用中
  | 'MAINTENANCE'   // 维护保养
  | 'BREAKDOWN'     // 故障停机
  | 'CLEANING'      // 清场中
  | 'OFFLINE';      // 离线

/** 排程任务状态（甘特图色块） */
export type ScheduleItemStatus =
  | 'PRODUCING'   // 生产中   #52C41A
  | 'WAITING'     // 待生产   #1890FF
  | 'CLEANING'    // 清场中   #FAAD14
  | 'QC_HOLD'     // 质检等待 #722ED1
  | 'ABNORMAL'    // 异常     #F5222D
  | 'COMPLETED'   // 已完成   #8C8C8C
  | 'LOCKED';     // 冻结锁定 #595959

/** 清场状态 */
export type CleanStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

/** 视图模式 */
export type ViewMode = 'day' | 'week' | 'biweek';

/** 时间分区 */
export type TimeZone = 'HISTORY' | 'FROZEN' | 'ROLLING' | 'OUTLOOK';

/** 洁净区级别 */
export type CleanRoomLevel = 'D级' | 'C级' | 'B级' | 'A级';

/** 工厂 */
export type Factory = 'NJ' | 'LS';

// ─────────────────────────────────────────────
// 2. 资源 / 工作中心
// ─────────────────────────────────────────────
export interface Resource {
  id: string;
  code: string;
  name: string;
  type: 'EQUIPMENT' | 'LINE' | 'WORKCENTER';
  factory: Factory;
  cleanRoomLevel: CleanRoomLevel;
  capacityPerShift: number;   // 班次产能（单位：批/班）
  shiftHours: number;         // 班次时长（小时）
  status: ResourceStatus;
  /** 支持产品类型列表（用于清场规则） */
  supportedProducts: string[];
  /** 最近一次生产的产品编码（用于清场判断） */
  lastProductCode?: string;
  /** 清场所需时间（分钟） */
  cleaningMinutes: number;
  /** 换产所需时间（分钟） */
  changeoverMinutes: number;
  calendar?: {
    shifts: { name: string; start: string; end: string }[];
    workDays: number[]; // 0=周日,1=周一...6=周六
  };
}

// ─────────────────────────────────────────────
// 3. 排程工单
// ─────────────────────────────────────────────
export interface ScheduleWorkOrder {
  woNo: string;
  productCode: string;
  productName: string;
  batchNo: string;
  factory: Factory;
  plannedQty: number;
  unit: string;
  priority: number;           // 1-5（5=最高）
  dueDate: string;            // 交货期 ISO
  releaseDate: string;        // 下达日期
  routingCode: string;
  status: WoStatus;
  isUrgent: boolean;
  isInsertOrder: boolean;     // 插单标记
  ebrRequired: boolean;
  qcHoldMinutes?: number;     // QC等待时长（分钟）
  notes?: string;
}

// ─────────────────────────────────────────────
// 4. 工序排程明细
// ─────────────────────────────────────────────
export interface ScheduleItem {
  id: string;
  woNo: string;
  productName: string;
  productCode: string;
  factory: Factory;
  opNo: string;
  opName: string;
  resourceId: string;
  resourceName: string;
  cleanRoomLevel: CleanRoomLevel;
  startTime: string;          // ISO datetime
  endTime: string;
  durationMinutes: number;
  status: ScheduleItemStatus;
  timeZone: TimeZone;         // 时间分区
  isLocked: boolean;          // 冻结区锁定
  isColdChain: boolean;
  /** 前置清场任务ID */
  cleaningTaskId?: string;
  /** 约束校验结果 */
  constraintViolations: ConstraintViolation[];
  /** 软约束得分 0~100 */
  softScore: number;
  color?: string;             // 自定义颜色覆盖
  priority: number;
  notes?: string;
}

// ─────────────────────────────────────────────
// 5. 清场记录
// ─────────────────────────────────────────────
export interface CleaningTask {
  id: string;
  resourceId: string;
  resourceName: string;
  factory: Factory;
  prevWoNo: string;
  prevProductCode: string;
  prevProductName: string;
  nextWoNo: string;
  nextProductCode: string;
  nextProductName: string;
  isSameProduct: boolean;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: CleanStatus;
  operator?: string;
  verifier?: string;
  verifiedAt?: string;
  checkItems: CleanCheckItem[];
  photos?: string[];
  ebrLinked?: boolean;
}

export interface CleanCheckItem {
  id: string;
  item: string;
  required: boolean;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  result?: 'PASS' | 'FAIL';
  remark?: string;
}

// ─────────────────────────────────────────────
// 6. 约束
// ─────────────────────────────────────────────
export interface ConstraintViolation {
  type: 'MATERIAL_RELEASE' | 'EQUIPMENT_CAPACITY' | 'CLEANING_REQUIRED' | 'QUALIFICATION' | 'CLEAN_ROOM_LEVEL' | 'SHIFT_BOUNDARY';
  severity: 'HARD' | 'SOFT';
  message: string;
  suggestion?: string;
}

// ─────────────────────────────────────────────
// 7. 重排事件
// ─────────────────────────────────────────────
export type RescheduleEventType =
  | 'QC_FAIL'           // QC不合格
  | 'QC_HOLD'           // QC等待
  | 'EQUIPMENT_FAULT'   // 设备故障
  | 'INSERT_ORDER'      // 紧急插单
  | 'MATERIAL_DELAY'    // 原料延迟
  | 'STAFF_ABSENCE'     // 人员缺勤
  | 'MANUAL_ADJUST';    // 手工调整

export interface RescheduleEvent {
  id: string;
  type: RescheduleEventType;
  triggeredAt: string;
  affectedWoNos: string[];
  description: string;
  requireApproval: boolean;   // 冻结区 T+0~T+2 需审批
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';
  appliedAt?: string;
  operator?: string;
}

// ─────────────────────────────────────────────
// 8. 排程版本
// ─────────────────────────────────────────────
export interface ScheduleVersion {
  versionId: string;
  label: string;
  createdAt: string;
  createdBy: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isBaseline: boolean;
  itemCount: number;
  kpi: {
    utilization: number;     // 设备利用率 %
    otdRate: number;         // 准时交货率 %
    cleaningWaste: number;   // 清场浪费时间（小时）
    urgentCount: number;     // 插单数量
  };
}

// ─────────────────────────────────────────────
// 9. Mock 数据
// ─────────────────────────────────────────────

const TODAY = new Date('2026-06-14T08:00:00');
const d = (offsetDays: number, hour = 8, minute = 0) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
};

// ── 资源 ──────────────────────────────────────
export const MOCK_RESOURCES: Resource[] = [
  // 南京工厂
  {
    id: 'R-NJ-WEIGH',
    code: 'WS-NJ-WEIGH',
    name: '南京称量配料间',
    type: 'WORKCENTER',
    factory: 'NJ',
    cleanRoomLevel: 'D级',
    capacityPerShift: 2,
    shiftHours: 8,
    status: 'OCCUPIED',
    supportedProducts: ['VITC-500', 'VITC-250'],
    lastProductCode: 'VITC-500',
    cleaningMinutes: 60,
    changeoverMinutes: 90,
    calendar: { shifts: [{ name: '白班', start: '08:00', end: '16:00' }, { name: '中班', start: '16:00', end: '24:00' }], workDays: [1,2,3,4,5] },
  },
  {
    id: 'R-NJ-SOLID',
    code: 'WS-NJ-SOLID',
    name: '南京固体制剂车间',
    type: 'WORKCENTER',
    factory: 'NJ',
    cleanRoomLevel: 'D级',
    capacityPerShift: 1,
    shiftHours: 8,
    status: 'OCCUPIED',
    supportedProducts: ['VITC-500', 'VITC-250'],
    lastProductCode: 'VITC-500',
    cleaningMinutes: 120,
    changeoverMinutes: 180,
    calendar: { shifts: [{ name: '白班', start: '08:00', end: '16:00' }], workDays: [1,2,3,4,5,6] },
  },
  {
    id: 'R-NJ-PACK',
    code: 'WS-NJ-PACK',
    name: '南京内包装车间',
    type: 'WORKCENTER',
    factory: 'NJ',
    cleanRoomLevel: 'D级',
    capacityPerShift: 3,
    shiftHours: 8,
    status: 'AVAILABLE',
    supportedProducts: ['VITC-500', 'VITC-250'],
    cleaningMinutes: 60,
    changeoverMinutes: 60,
    calendar: { shifts: [{ name: '白班', start: '08:00', end: '16:00' }, { name: '中班', start: '16:00', end: '24:00' }], workDays: [1,2,3,4,5] },
  },
  {
    id: 'R-NJ-QC',
    code: 'WS-NJ-QC',
    name: '南京QC检验室',
    type: 'WORKCENTER',
    factory: 'NJ',
    cleanRoomLevel: 'D级',
    capacityPerShift: 4,
    shiftHours: 8,
    status: 'AVAILABLE',
    supportedProducts: ['VITC-500', 'VITC-250'],
    cleaningMinutes: 30,
    changeoverMinutes: 30,
    calendar: { shifts: [{ name: '白班', start: '08:00', end: '16:00' }], workDays: [1,2,3,4,5] },
  },
  // 溧水工厂
  {
    id: 'R-LS-PROBIO',
    code: 'WS-LS-PROBIO',
    name: '溧水益生菌冷链车间',
    type: 'WORKCENTER',
    factory: 'LS',
    cleanRoomLevel: 'C级',
    capacityPerShift: 1,
    shiftHours: 8,
    status: 'OCCUPIED',
    supportedProducts: ['PROBIO-250'],
    lastProductCode: 'PROBIO-250',
    cleaningMinutes: 180,
    changeoverMinutes: 240,
    calendar: { shifts: [{ name: '白班', start: '08:00', end: '16:00' }], workDays: [1,2,3,4,5] },
  },
  {
    id: 'R-LS-PACK',
    code: 'WS-LS-PACK',
    name: '溧水包装车间',
    type: 'WORKCENTER',
    factory: 'LS',
    cleanRoomLevel: 'D级',
    capacityPerShift: 2,
    shiftHours: 8,
    status: 'AVAILABLE',
    supportedProducts: ['PROBIO-250'],
    cleaningMinutes: 60,
    changeoverMinutes: 60,
    calendar: { shifts: [{ name: '白班', start: '08:00', end: '16:00' }], workDays: [1,2,3,4,5,6] },
  },
  {
    id: 'R-LS-QC',
    code: 'WS-LS-QC',
    name: '溧水QC检验室',
    type: 'WORKCENTER',
    factory: 'LS',
    cleanRoomLevel: 'C级',
    capacityPerShift: 3,
    shiftHours: 8,
    status: 'AVAILABLE',
    supportedProducts: ['PROBIO-250'],
    cleaningMinutes: 30,
    changeoverMinutes: 30,
    calendar: { shifts: [{ name: '白班', start: '08:00', end: '16:00' }], workDays: [1,2,3,4,5] },
  },
];

// ── 工单 ──────────────────────────────────────
export const MOCK_SCHEDULE_WOS: ScheduleWorkOrder[] = [
  {
    woNo: 'WO-20260605-001',
    productCode: 'VITC-500',
    productName: '维生素C咀嚼片500mg',
    batchNo: 'B20260605001',
    factory: 'NJ',
    plannedQty: 100000,
    unit: '粒',
    priority: 4,
    dueDate: '2026-06-20T17:00:00',
    releaseDate: '2026-06-05T08:00:00',
    routingCode: 'TMJ-VITC-WG-V20',
    status: 'RUNNING',
    isUrgent: false,
    isInsertOrder: false,
    ebrRequired: true,
    notes: '常规批次',
  },
  {
    woNo: 'WO-20260612-001',
    productCode: 'PROBIO-250',
    productName: '复合益生菌胶囊250mg',
    batchNo: 'B20260612001',
    factory: 'LS',
    plannedQty: 50000,
    unit: '粒',
    priority: 5,
    dueDate: '2026-06-22T17:00:00',
    releaseDate: '2026-06-12T08:00:00',
    routingCode: 'TMJ-PROBIO-CAP-V15',
    status: 'RUNNING',
    isUrgent: true,
    isInsertOrder: false,
    ebrRequired: true,
    qcHoldMinutes: 480,
    notes: '冷链生产，全程≤8℃',
  },
  {
    woNo: 'WO-20260601-002',
    productCode: 'PROBIO-250',
    productName: '复合益生菌胶囊250mg',
    batchNo: 'B20260601002',
    factory: 'LS',
    plannedQty: 30000,
    unit: '粒',
    priority: 3,
    dueDate: '2026-06-18T17:00:00',
    releaseDate: '2026-06-01T08:00:00',
    routingCode: 'TMJ-PROBIO-CAP-V15',
    status: 'COMPLETED',
    isUrgent: false,
    isInsertOrder: false,
    ebrRequired: true,
  },
  {
    woNo: 'WO-20260616-001',
    productCode: 'VITC-500',
    productName: '维生素C咀嚼片500mg',
    batchNo: 'B20260616001',
    factory: 'NJ',
    plannedQty: 80000,
    unit: '粒',
    priority: 3,
    dueDate: '2026-06-25T17:00:00',
    releaseDate: '2026-06-14T08:00:00',
    routingCode: 'TMJ-VITC-WG-V20',
    status: 'SCHEDULED',
    isUrgent: false,
    isInsertOrder: false,
    ebrRequired: true,
  },
  {
    woNo: 'WO-20260617-URGENT',
    productCode: 'VITC-250',
    productName: '维生素C咀嚼片250mg',
    batchNo: 'B20260617U01',
    factory: 'NJ',
    plannedQty: 20000,
    unit: '粒',
    priority: 5,
    dueDate: '2026-06-19T17:00:00',
    releaseDate: '2026-06-14T10:00:00',
    routingCode: 'TMJ-VITC-DC-V10',
    status: 'PENDING',
    isUrgent: true,
    isInsertOrder: true,
    ebrRequired: true,
    notes: '紧急插单 - 客户追加订单',
  },
  {
    woNo: 'WO-20260618-001',
    productCode: 'PROBIO-250',
    productName: '复合益生菌胶囊250mg',
    batchNo: 'B20260618001',
    factory: 'LS',
    plannedQty: 60000,
    unit: '粒',
    priority: 4,
    dueDate: '2026-06-28T17:00:00',
    releaseDate: '2026-06-16T08:00:00',
    routingCode: 'TMJ-PROBIO-CAP-V15',
    status: 'PENDING',
    isUrgent: false,
    isInsertOrder: false,
    ebrRequired: true,
  },
];

// ── 排程条目（甘特图数据） ──────────────────────
export const MOCK_SCHEDULE_ITEMS: ScheduleItem[] = [
  // ===== WO-20260605-001 VitC南京 =====
  {
    id: 'SI-001',
    woNo: 'WO-20260605-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-10',
    opName: '称量配料',
    resourceId: 'R-NJ-WEIGH',
    resourceName: '南京称量配料间',
    cleanRoomLevel: 'D级',
    startTime: d(-9, 8),
    endTime: d(-9, 13),
    durationMinutes: 300,
    status: 'COMPLETED',
    timeZone: 'HISTORY',
    isLocked: true,
    isColdChain: false,
    constraintViolations: [],
    softScore: 92,
    priority: 4,
  },
  {
    id: 'SI-002',
    woNo: 'WO-20260605-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-20',
    opName: '制粒（湿法）',
    resourceId: 'R-NJ-SOLID',
    resourceName: '南京固体制剂车间',
    cleanRoomLevel: 'D级',
    startTime: d(-8, 8),
    endTime: d(-8, 17, 30),
    durationMinutes: 570,
    status: 'COMPLETED',
    timeZone: 'HISTORY',
    isLocked: true,
    isColdChain: false,
    constraintViolations: [],
    softScore: 88,
    priority: 4,
  },
  {
    id: 'SI-003',
    woNo: 'WO-20260605-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-40',
    opName: '压片',
    resourceId: 'R-NJ-SOLID',
    resourceName: '南京固体制剂车间',
    cleanRoomLevel: 'D级',
    startTime: d(-6, 8),
    endTime: d(-6, 20),
    durationMinutes: 720,
    status: 'COMPLETED',
    timeZone: 'HISTORY',
    isLocked: true,
    isColdChain: false,
    constraintViolations: [],
    softScore: 95,
    priority: 4,
  },
  {
    id: 'SI-004',
    woNo: 'WO-20260605-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-45',
    opName: '素片中检',
    resourceId: 'R-NJ-QC',
    resourceName: '南京QC检验室',
    cleanRoomLevel: 'D级',
    startTime: d(-5, 8),
    endTime: d(-5, 14),
    durationMinutes: 360,
    status: 'COMPLETED',
    timeZone: 'HISTORY',
    isLocked: true,
    isColdChain: false,
    constraintViolations: [],
    softScore: 90,
    priority: 4,
  },
  {
    id: 'SI-005',
    woNo: 'WO-20260605-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-60',
    opName: '内包装（铝塑）',
    resourceId: 'R-NJ-PACK',
    resourceName: '南京内包装车间',
    cleanRoomLevel: 'D级',
    startTime: d(-2, 8),
    endTime: d(-2, 17),
    durationMinutes: 540,
    status: 'COMPLETED',
    timeZone: 'FROZEN',
    isLocked: true,
    isColdChain: false,
    constraintViolations: [],
    softScore: 91,
    priority: 4,
  },
  {
    id: 'SI-006',
    woNo: 'WO-20260605-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-80',
    opName: 'FQC成品检验',
    resourceId: 'R-NJ-QC',
    resourceName: '南京QC检验室',
    cleanRoomLevel: 'D级',
    startTime: d(0, 8),
    endTime: d(0, 14, 30),
    durationMinutes: 390,
    status: 'PRODUCING',
    timeZone: 'FROZEN',
    isLocked: true,
    isColdChain: false,
    constraintViolations: [],
    softScore: 93,
    priority: 4,
    color: '#52C41A',
  },
  {
    id: 'SI-007',
    woNo: 'WO-20260605-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-90',
    opName: '质量放行',
    resourceId: 'R-NJ-QC',
    resourceName: '南京QC检验室',
    cleanRoomLevel: 'D级',
    startTime: d(1, 8),
    endTime: d(1, 11),
    durationMinutes: 180,
    status: 'WAITING',
    timeZone: 'FROZEN',
    isLocked: true,
    isColdChain: false,
    constraintViolations: [],
    softScore: 88,
    priority: 4,
    color: '#1890FF',
  },
  // ===== 清场任务 WO-20260605-001 → WO-20260616-001 =====
  {
    id: 'SI-CLN-001',
    woNo: 'CLN-NJ-SOLID',
    productName: '清场',
    productCode: '',
    factory: 'NJ',
    opNo: 'CLN',
    opName: '换产清场',
    resourceId: 'R-NJ-SOLID',
    resourceName: '南京固体制剂车间',
    cleanRoomLevel: 'D级',
    startTime: d(2, 8),
    endTime: d(2, 11),
    durationMinutes: 180,
    status: 'CLEANING',
    timeZone: 'FROZEN',
    isLocked: false,
    isColdChain: false,
    cleaningTaskId: 'CTK-001',
    constraintViolations: [],
    softScore: 100,
    priority: 5,
    color: '#FAAD14',
  },
  // ===== WO-20260616-001 VitC 次批 =====
  {
    id: 'SI-008',
    woNo: 'WO-20260616-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-10',
    opName: '称量配料',
    resourceId: 'R-NJ-WEIGH',
    resourceName: '南京称量配料间',
    cleanRoomLevel: 'D级',
    startTime: d(2, 8),
    endTime: d(2, 13),
    durationMinutes: 300,
    status: 'WAITING',
    timeZone: 'FROZEN',
    isLocked: true,
    isColdChain: false,
    constraintViolations: [],
    softScore: 87,
    priority: 3,
    color: '#1890FF',
  },
  {
    id: 'SI-009',
    woNo: 'WO-20260616-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-20',
    opName: '制粒（湿法）',
    resourceId: 'R-NJ-SOLID',
    resourceName: '南京固体制剂车间',
    cleanRoomLevel: 'D级',
    startTime: d(3, 8),
    endTime: d(3, 17, 30),
    durationMinutes: 570,
    status: 'WAITING',
    timeZone: 'ROLLING',
    isLocked: false,
    isColdChain: false,
    constraintViolations: [],
    softScore: 85,
    priority: 3,
    color: '#1890FF',
  },
  {
    id: 'SI-010',
    woNo: 'WO-20260616-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-40',
    opName: '压片',
    resourceId: 'R-NJ-SOLID',
    resourceName: '南京固体制剂车间',
    cleanRoomLevel: 'D级',
    startTime: d(5, 8),
    endTime: d(5, 20),
    durationMinutes: 720,
    status: 'WAITING',
    timeZone: 'ROLLING',
    isLocked: false,
    isColdChain: false,
    constraintViolations: [],
    softScore: 82,
    priority: 3,
    color: '#1890FF',
  },
  {
    id: 'SI-011',
    woNo: 'WO-20260616-001',
    productName: '维生素C咀嚼片500mg',
    productCode: 'VITC-500',
    factory: 'NJ',
    opNo: 'OP-80',
    opName: 'FQC成品检验',
    resourceId: 'R-NJ-QC',
    resourceName: '南京QC检验室',
    cleanRoomLevel: 'D级',
    startTime: d(8, 8),
    endTime: d(8, 14, 30),
    durationMinutes: 390,
    status: 'WAITING',
    timeZone: 'ROLLING',
    isLocked: false,
    isColdChain: false,
    constraintViolations: [],
    softScore: 80,
    priority: 3,
    color: '#1890FF',
  },
  // ===== 紧急插单 WO-20260617-URGENT =====
  {
    id: 'SI-URGENT-001',
    woNo: 'WO-20260617-URGENT',
    productName: '维生素C咀嚼片250mg',
    productCode: 'VITC-250',
    factory: 'NJ',
    opNo: 'OP-10',
    opName: '称量配料',
    resourceId: 'R-NJ-WEIGH',
    resourceName: '南京称量配料间',
    cleanRoomLevel: 'D级',
    startTime: d(0, 14, 30),
    endTime: d(0, 18, 30),
    durationMinutes: 240,
    status: 'WAITING',
    timeZone: 'FROZEN',
    isLocked: false,
    isColdChain: false,
    constraintViolations: [
      {
        type: 'CLEANING_REQUIRED',
        severity: 'SOFT',
        message: '插单需要额外清场验证',
        suggestion: '确认上批产品为同品种，可缩短清场时间',
      },
    ],
    softScore: 72,
    priority: 5,
    notes: '🔴 紧急插单',
    color: '#F5222D',
  },
  {
    id: 'SI-URGENT-002',
    woNo: 'WO-20260617-URGENT',
    productName: '维生素C咀嚼片250mg',
    productCode: 'VITC-250',
    factory: 'NJ',
    opNo: 'OP-40',
    opName: '压片',
    resourceId: 'R-NJ-SOLID',
    resourceName: '南京固体制剂车间',
    cleanRoomLevel: 'D级',
    startTime: d(1, 14),
    endTime: d(1, 22),
    durationMinutes: 480,
    status: 'WAITING',
    timeZone: 'FROZEN',
    isLocked: false,
    isColdChain: false,
    constraintViolations: [],
    softScore: 78,
    priority: 5,
    color: '#F5222D',
  },
  // ===== WO-20260612-001 益生菌溧水 =====
  {
    id: 'SI-012',
    woNo: 'WO-20260612-001',
    productName: '复合益生菌胶囊250mg',
    productCode: 'PROBIO-250',
    factory: 'LS',
    opNo: 'OP-20',
    opName: '低温称量配料',
    resourceId: 'R-LS-PROBIO',
    resourceName: '溧水益生菌冷链车间',
    cleanRoomLevel: 'C级',
    startTime: d(-2, 8),
    endTime: d(-2, 13),
    durationMinutes: 300,
    status: 'COMPLETED',
    timeZone: 'FROZEN',
    isLocked: true,
    isColdChain: true,
    constraintViolations: [],
    softScore: 95,
    priority: 5,
  },
  {
    id: 'SI-013',
    woNo: 'WO-20260612-001',
    productName: '复合益生菌胶囊250mg',
    productCode: 'PROBIO-250',
    factory: 'LS',
    opNo: 'OP-30',
    opName: '混合（冷链≤8℃）',
    resourceId: 'R-LS-PROBIO',
    resourceName: '溧水益生菌冷链车间',
    cleanRoomLevel: 'C级',
    startTime: d(-1, 8),
    endTime: d(-1, 15, 30),
    durationMinutes: 450,
    status: 'COMPLETED',
    timeZone: 'FROZEN',
    isLocked: true,
    isColdChain: true,
    constraintViolations: [],
    softScore: 92,
    priority: 5,
  },
  {
    id: 'SI-014',
    woNo: 'WO-20260612-001',
    productName: '复合益生菌胶囊250mg',
    productCode: 'PROBIO-250',
    factory: 'LS',
    opNo: 'OP-40',
    opName: '胶囊充填',
    resourceId: 'R-LS-PROBIO',
    resourceName: '溧水益生菌冷链车间',
    cleanRoomLevel: 'C级',
    startTime: d(0, 8),
    endTime: d(0, 16),
    durationMinutes: 480,
    status: 'PRODUCING',
    timeZone: 'FROZEN',
    isLocked: true,
    isColdChain: true,
    constraintViolations: [],
    softScore: 90,
    priority: 5,
    color: '#52C41A',
  },
  {
    id: 'SI-015',
    woNo: 'WO-20260612-001',
    productName: '复合益生菌胶囊250mg',
    productCode: 'PROBIO-250',
    factory: 'LS',
    opNo: 'OP-45',
    opName: '充填中检',
    resourceId: 'R-LS-QC',
    resourceName: '溧水QC检验室',
    cleanRoomLevel: 'C级',
    startTime: d(1, 8),
    endTime: d(1, 16),
    durationMinutes: 480,
    status: 'WAITING',
    timeZone: 'FROZEN',
    isLocked: true,
    isColdChain: true,
    constraintViolations: [],
    softScore: 88,
    priority: 5,
    color: '#722ED1',
  },
  {
    id: 'SI-016',
    woNo: 'WO-20260612-001',
    productName: '复合益生菌胶囊250mg',
    productCode: 'PROBIO-250',
    factory: 'LS',
    opNo: 'OP-50',
    opName: '铝塑泡罩包装',
    resourceId: 'R-LS-PACK',
    resourceName: '溧水包装车间',
    cleanRoomLevel: 'D级',
    startTime: d(3, 8),
    endTime: d(3, 17),
    durationMinutes: 540,
    status: 'WAITING',
    timeZone: 'ROLLING',
    isLocked: false,
    isColdChain: false,
    constraintViolations: [],
    softScore: 85,
    priority: 5,
    color: '#1890FF',
  },
  {
    id: 'SI-017',
    woNo: 'WO-20260612-001',
    productName: '复合益生菌胶囊250mg',
    productCode: 'PROBIO-250',
    factory: 'LS',
    opNo: 'OP-70',
    opName: 'FQC成品检验',
    resourceId: 'R-LS-QC',
    resourceName: '溧水QC检验室',
    cleanRoomLevel: 'C级',
    startTime: d(5, 8),
    endTime: d(5, 16),
    durationMinutes: 480,
    status: 'WAITING',
    timeZone: 'ROLLING',
    isLocked: false,
    isColdChain: false,
    constraintViolations: [],
    softScore: 82,
    priority: 4,
    color: '#1890FF',
  },
  // ===== WO-20260618-001 益生菌次批（展望区） =====
  {
    id: 'SI-018',
    woNo: 'WO-20260618-001',
    productName: '复合益生菌胶囊250mg',
    productCode: 'PROBIO-250',
    factory: 'LS',
    opNo: 'OP-20',
    opName: '低温称量配料',
    resourceId: 'R-LS-PROBIO',
    resourceName: '溧水益生菌冷链车间',
    cleanRoomLevel: 'C级',
    startTime: d(7, 8),
    endTime: d(7, 13),
    durationMinutes: 300,
    status: 'WAITING',
    timeZone: 'ROLLING',
    isLocked: false,
    isColdChain: true,
    constraintViolations: [],
    softScore: 78,
    priority: 4,
    color: '#1890FF',
  },
];

// ── 清场任务 ──────────────────────────────────
export const MOCK_CLEANING_TASKS: CleaningTask[] = [
  {
    id: 'CTK-001',
    resourceId: 'R-NJ-SOLID',
    resourceName: '南京固体制剂车间',
    factory: 'NJ',
    prevWoNo: 'WO-20260605-001',
    prevProductCode: 'VITC-500',
    prevProductName: '维生素C咀嚼片500mg',
    nextWoNo: 'WO-20260616-001',
    nextProductCode: 'VITC-500',
    nextProductName: '维生素C咀嚼片500mg',
    isSameProduct: true,
    startTime: d(2, 8),
    endTime: d(2, 11),
    durationMinutes: 180,
    status: 'IN_PROGRESS',
    operator: '张清洁',
    checkItems: [
      { id: 'CC-01', item: '设备表面清洁（无可见残留）', required: true, checked: true, result: 'PASS', checkedBy: '张清洁', checkedAt: d(2, 9) },
      { id: 'CC-02', item: '生产记录归档完成', required: true, checked: true, result: 'PASS', checkedBy: '张清洁', checkedAt: d(2, 9, 30) },
      { id: 'CC-03', item: '设备润滑状态检查', required: false, checked: true, result: 'PASS', checkedBy: '张清洁', checkedAt: d(2, 10) },
      { id: 'CC-04', item: '清场确认签字（QA）', required: true, checked: false },
      { id: 'CC-05', item: '更换产品标签/状态牌', required: true, checked: false },
    ],
    ebrLinked: true,
  },
  {
    id: 'CTK-002',
    resourceId: 'R-LS-PROBIO',
    resourceName: '溧水益生菌冷链车间',
    factory: 'LS',
    prevWoNo: 'WO-20260601-002',
    prevProductCode: 'PROBIO-250',
    prevProductName: '复合益生菌胶囊250mg',
    nextWoNo: 'WO-20260612-001',
    nextProductCode: 'PROBIO-250',
    nextProductName: '复合益生菌胶囊250mg',
    isSameProduct: true,
    startTime: d(-3, 15),
    endTime: d(-3, 18),
    durationMinutes: 180,
    status: 'COMPLETED',
    operator: '李维护',
    verifier: 'QA王工',
    verifiedAt: d(-3, 18),
    checkItems: [
      { id: 'CC-LS-01', item: '冷链设备温度恢复≤8℃', required: true, checked: true, result: 'PASS', checkedBy: '李维护', checkedAt: d(-3, 16) },
      { id: 'CC-LS-02', item: '冷链车间消毒记录', required: true, checked: true, result: 'PASS', checkedBy: '李维护', checkedAt: d(-3, 16, 30) },
      { id: 'CC-LS-03', item: 'C级洁净区清场验证（沉降菌）', required: true, checked: true, result: 'PASS', checkedBy: 'QA王工', checkedAt: d(-3, 17, 30) },
      { id: 'CC-LS-04', item: '清场确认签字（QA）', required: true, checked: true, result: 'PASS', checkedBy: 'QA王工', checkedAt: d(-3, 18) },
    ],
    ebrLinked: true,
  },
];

// ── 重排事件 ──────────────────────────────────
export const MOCK_RESCHEDULE_EVENTS: RescheduleEvent[] = [
  {
    id: 'EVT-001',
    type: 'INSERT_ORDER',
    triggeredAt: d(0, 10),
    affectedWoNos: ['WO-20260617-URGENT'],
    description: '紧急插单 WO-20260617-URGENT（维生素C咀嚼片250mg，2万粒），客户要求2026-06-19交货，需重排南京称量配料间和压片车间',
    requireApproval: true,
    status: 'PENDING',
    operator: '排程员小赵',
  },
  {
    id: 'EVT-002',
    type: 'QC_HOLD',
    triggeredAt: d(-1, 14),
    affectedWoNos: ['WO-20260612-001'],
    description: 'WO-20260612-001 充填中检QC等待，预计额外等待8小时，影响WO-20260612-001后续铝塑包装工序，自动推迟滚动区任务',
    requireApproval: false,
    status: 'APPLIED',
    appliedAt: d(-1, 14, 30),
    operator: '系统自动',
  },
  {
    id: 'EVT-003',
    type: 'EQUIPMENT_FAULT',
    triggeredAt: d(0, 6, 30),
    affectedWoNos: ['WO-20260616-001'],
    description: '南京固体制剂车间压片机PM-NJ-02故障（油压系统报警），预计维修时间4小时，影响WO-20260616-001压片工序',
    requireApproval: false,
    status: 'PENDING',
    operator: '设备工程师老李',
  },
];

// ── 排程版本 ──────────────────────────────────
export const MOCK_SCHEDULE_VERSIONS: ScheduleVersion[] = [
  {
    versionId: 'VER-20260614-003',
    label: '当前版本（含插单重排）',
    createdAt: d(0, 10, 30),
    createdBy: '排程员小赵',
    status: 'PUBLISHED',
    isBaseline: false,
    itemCount: 22,
    kpi: { utilization: 78.3, otdRate: 91.2, cleaningWaste: 12.5, urgentCount: 1 },
  },
  {
    versionId: 'VER-20260614-002',
    label: '插单前基线版本',
    createdAt: d(0, 8, 0),
    createdBy: '排程员小赵',
    status: 'ARCHIVED',
    isBaseline: true,
    itemCount: 20,
    kpi: { utilization: 82.1, otdRate: 95.0, cleaningWaste: 10.2, urgentCount: 0 },
  },
  {
    versionId: 'VER-20260613-001',
    label: '昨日排程基线',
    createdAt: d(-1, 17, 0),
    createdBy: '系统自动',
    status: 'ARCHIVED',
    isBaseline: false,
    itemCount: 18,
    kpi: { utilization: 79.5, otdRate: 93.1, cleaningWaste: 11.8, urgentCount: 0 },
  },
];

// ─────────────────────────────────────────────
// 10. 辅助函数
// ─────────────────────────────────────────────

/** 状态颜色映射（PRD规定） */
export const SCHEDULE_STATUS_COLOR: Record<ScheduleItemStatus, string> = {
  PRODUCING:  '#52C41A',
  WAITING:    '#1890FF',
  CLEANING:   '#FAAD14',
  QC_HOLD:    '#722ED1',
  ABNORMAL:   '#F5222D',
  COMPLETED:  '#8C8C8C',
  LOCKED:     '#595959',
};

export const SCHEDULE_STATUS_LABEL: Record<ScheduleItemStatus, string> = {
  PRODUCING: '生产中',
  WAITING:   '待生产',
  CLEANING:  '清场中',
  QC_HOLD:   'QC等待',
  ABNORMAL:  '异常',
  COMPLETED: '已完成',
  LOCKED:    '已锁定',
};

export const WO_STATUS_COLOR: Record<WoStatus, string> = {
  PENDING:   'default',
  SCHEDULED: 'blue',
  RELEASED:  'cyan',
  RUNNING:   'green',
  PAUSED:    'orange',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

export const WO_STATUS_LABEL: Record<WoStatus, string> = {
  PENDING:   '待排程',
  SCHEDULED: '已排程',
  RELEASED:  '已下达',
  RUNNING:   '生产中',
  PAUSED:    '暂停',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export const TIME_ZONE_LABEL: Record<TimeZone, string> = {
  HISTORY: '历史区',
  FROZEN:  '日冻结区(T+0~T+2)',
  ROLLING: '滚动区(T+3~T+14)',
  OUTLOOK: '展望区(>T+14)',
};

export const TIME_ZONE_COLOR: Record<TimeZone, string> = {
  HISTORY: '#f0f0f0',
  FROZEN:  '#fff7e6',
  ROLLING: '#e6f7ff',
  OUTLOOK: '#f9f0ff',
};

export const CLEAN_STATUS_LABEL: Record<CleanStatus, string> = {
  PENDING:     '待清场',
  IN_PROGRESS: '清场中',
  COMPLETED:   '已完成',
  FAILED:      '未通过',
};

export const CLEAN_STATUS_COLOR: Record<CleanStatus, string> = {
  PENDING:     'default',
  IN_PROGRESS: 'warning',
  COMPLETED:   'success',
  FAILED:      'error',
};

export const RESCHEDULE_EVENT_LABEL: Record<RescheduleEventType, string> = {
  QC_FAIL:        'QC不合格',
  QC_HOLD:        'QC等待',
  EQUIPMENT_FAULT:'设备故障',
  INSERT_ORDER:   '紧急插单',
  MATERIAL_DELAY: '原料延迟',
  STAFF_ABSENCE:  '人员缺勤',
  MANUAL_ADJUST:  '手工调整',
};

export const RESCHEDULE_EVENT_COLOR: Record<RescheduleEventType, string> = {
  QC_FAIL:        'red',
  QC_HOLD:        'purple',
  EQUIPMENT_FAULT:'orange',
  INSERT_ORDER:   'volcano',
  MATERIAL_DELAY: 'gold',
  STAFF_ABSENCE:  'cyan',
  MANUAL_ADJUST:  'blue',
};

/** 计算时间分区 */
export function calcTimeZone(isoDate: string): TimeZone {
  const today = new Date('2026-06-14');
  today.setHours(0, 0, 0, 0);
  const dt = new Date(isoDate);
  dt.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((dt.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0)   return 'HISTORY';
  if (diffDays <= 2)  return 'FROZEN';
  if (diffDays <= 14) return 'ROLLING';
  return 'OUTLOOK';
}

/** 按资源分组排程条目 */
export function groupItemsByResource(items: ScheduleItem[]): Record<string, ScheduleItem[]> {
  return items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    if (!acc[item.resourceId]) acc[item.resourceId] = [];
    acc[item.resourceId].push(item);
    return acc;
  }, {});
}
