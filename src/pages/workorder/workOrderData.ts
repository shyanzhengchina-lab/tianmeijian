// ================================================================
// 生产管理四层数据模型 - 根管锉生产执行（YS-MES Dental PRD V1.0）
// L1 生产订单 → L2 生产工单 → L3 生产任务单 → L4 生产浮票
// 适配工业PAD执行场景（10寸，按钮≥80px）
// ================================================================

// ── 工序定义（与proData工艺路径对齐）──────────────────────────────
export interface RoutingStep {
  id: string;
  opNo: string;
  name: string;
  stage: string;          // S1~S9工艺段
  workCenter: string;
  standardTime: number;   // 标准工时（分钟/百支）
  isKeyOp: boolean;
  mandatoryInspection: boolean;
}

export const ROUTING_STEPS: RoutingStep[] = [
  { id: 'RS01', opNo: 'OP-10', name: '镍钛丝入料确认',    stage: 'S1-备料',    workCenter: '备料区',          standardTime: 15,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS02', opNo: 'OP-15', name: '切断',               stage: 'S1-备料',    workCenter: '机加工-切断区',   standardTime: 60,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS03', opNo: 'OP-20', name: '粗磨锥',             stage: 'S2-磨锥',    workCenter: '机加工-磨削区',   standardTime: 90,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS04', opNo: 'OP-25', name: '精磨锥/尖端成型',    stage: 'S2-磨锥',    workCenter: '机加工-精磨区',   standardTime: 120, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS05', opNo: 'OP-30', name: '螺纹滚压',           stage: 'S3-螺纹',    workCenter: '机加工-螺纹区',   standardTime: 80,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS06', opNo: 'OP-32', name: '尾部修整',           stage: 'S3-螺纹',    workCenter: '机加工-螺纹区',   standardTime: 40,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS07', opNo: 'OP-40', name: '热处理',             stage: 'S4-热处理',  workCenter: '热处理车间',      standardTime: 240, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS08', opNo: 'OP-42', name: '化学蚀刻',           stage: 'S4-热处理',  workCenter: '热处理-蚀刻区',   standardTime: 60,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS09', opNo: 'OP-50', name: 'PVD氮化钛涂层',      stage: 'S5-涂层',    workCenter: '涂层车间',        standardTime: 180, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS10', opNo: 'OP-60', name: 'ABS注塑柄',          stage: 'S6-注塑柄',  workCenter: '注塑车间',        standardTime: 120, isKeyOp: false, mandatoryInspection: false },
  { id: 'RS11', opNo: 'OP-70', name: '柄部组装',           stage: 'S7-组装清洗', workCenter: '组装车间',        standardTime: 90,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS12', opNo: 'OP-72', name: '超声清洗',           stage: 'S7-组装清洗', workCenter: '清洗车间',        standardTime: 60,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS13', opNo: 'OP-80', name: '吸塑包装+UDI赋码',   stage: 'S8-包装',    workCenter: '包装车间',        standardTime: 60,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS14', opNo: 'OP-82', name: '装盒',               stage: 'S8-包装',    workCenter: '包装车间',        standardTime: 30,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS15', opNo: 'OP-90', name: 'OQC出厂终检',        stage: 'S9-入库',    workCenter: '检验室',          standardTime: 120, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS16', opNo: 'OP-95', name: '成品入库',           stage: 'S9-入库',    workCenter: '成品仓库',        standardTime: 30,  isKeyOp: false, mandatoryInspection: false },
];

// ── 工艺路径定义 ──────────────────────────────────────────────────
export interface RoutingMaster {
  code: string;
  name: string;
  version: string;
  applicableSpec: string;   // 适用规格描述
  steps: string[];          // step id 列表
}

export const ROUTING_MASTERS: RoutingMaster[] = [
  {
    code: 'YS-RKQ-STD-V21',
    name: '机用根管锉标准工艺路径',
    version: 'V2.1',
    applicableSpec: '#25 / 04锥 / #30 / 04锥 等标准规格',
    steps: ['RS01','RS02','RS03','RS04','RS05','RS06','RS07','RS08','RS09','RS10','RS11','RS12','RS13','RS14','RS15','RS16'],
  },
  {
    code: 'YS-RKQ-3006-V10',
    name: '机用根管锉 #30/06锥 工艺路径',
    version: 'V1.0',
    applicableSpec: '#30 / 06锥 专用',
    steps: ['RS01','RS02','RS03','RS04','RS05','RS06','RS07','RS08','RS10','RS11','RS12','RS13','RS14','RS15','RS16'],
  },
  {
    code: 'YS-RKQ-4004-V15',
    name: '机用根管锉 #40/04锥 工艺路径',
    version: 'V1.5',
    applicableSpec: '#40 / 04锥 / #40 / 06锥',
    steps: ['RS01','RS02','RS03','RS04','RS05','RS06','RS07','RS08','RS09','RS10','RS11','RS12','RS13','RS14','RS15','RS16'],
  },
];

// ── 班次定义 ──────────────────────────────────────────────────────
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
}

export const SHIFTS: Shift[] = [
  { id: 'SH01', name: '白班',   startTime: '08:00', endTime: '20:00', color: '#fa8c16' },
  { id: 'SH02', name: '夜班',   startTime: '20:00', endTime: '08:00', color: '#531dab' },
  { id: 'SH03', name: '早班',   startTime: '06:00', endTime: '14:00', color: '#0958d9' },
  { id: 'SH04', name: '中班',   startTime: '14:00', endTime: '22:00', color: '#389e0d' },
];

// ── 班组定义 ──────────────────────────────────────────────────────
export interface Team {
  id: string;
  name: string;
  shiftId: string;          // 所属班次
  leader: string;           // 班组长
  members: string[];        // 成员工号
  workCenter: string;       // 主要工作中心
}

export const TEAMS: Team[] = [
  { id: 'TM01', name: '甲班A组', shiftId: 'SH01', leader: '张三',   members: ['OP001','OP007','OP008'], workCenter: '机加工车间' },
  { id: 'TM02', name: '甲班B组', shiftId: 'SH01', leader: '李四',   members: ['OP002','OP009','OP010'], workCenter: '热处理车间/涂层车间' },
  { id: 'TM03', name: '乙班A组', shiftId: 'SH02', leader: '王五',   members: ['OP003','OP011','OP012'], workCenter: '注塑车间/组装车间' },
  { id: 'TM04', name: '乙班B组', shiftId: 'SH02', leader: '赵六',   members: ['OP004','OP013','OP014'], workCenter: '包装车间' },
  { id: 'TM05', name: '丙班A组', shiftId: 'SH03', leader: '孙七',   members: ['OP005','OP015','OP016'], workCenter: '机加工车间' },
  { id: 'TM06', name: '丙班B组', shiftId: 'SH03', leader: '周八',   members: ['OP006','OP017','OP018'], workCenter: '全线' },
];

// ── 操作员（工号）定义 ─────────────────────────────────────────────
export interface Operator {
  id: string;
  name: string;
  teamId: string;
  role: '班组长' | '操作工' | 'QC';
}

export const OPERATORS: Operator[] = [
  { id: 'OP001', name: '张三',   teamId: 'TM01', role: '班组长' },
  { id: 'OP002', name: '李四',   teamId: 'TM02', role: '班组长' },
  { id: 'OP003', name: '王五',   teamId: 'TM03', role: '班组长' },
  { id: 'OP004', name: '赵六',   teamId: 'TM04', role: '班组长' },
  { id: 'OP005', name: '孙七',   teamId: 'TM05', role: '班组长' },
  { id: 'OP006', name: '周八',   teamId: 'TM06', role: '班组长' },
  { id: 'OP007', name: '陈小明', teamId: 'TM01', role: '操作工' },
  { id: 'OP008', name: '刘大强', teamId: 'TM01', role: '操作工' },
  { id: 'OP009', name: '林小红', teamId: 'TM02', role: '操作工' },
  { id: 'OP010', name: '黄建国', teamId: 'TM02', role: '操作工' },
  { id: 'OP011', name: '何文华', teamId: 'TM03', role: '操作工' },
  { id: 'OP012', name: '杨帆',   teamId: 'TM03', role: '操作工' },
  { id: 'OP013', name: '吴晓燕', teamId: 'TM04', role: '操作工' },
  { id: 'OP014', name: '郑国强', teamId: 'TM04', role: '操作工' },
  { id: 'OP015', name: '冯建军', teamId: 'TM05', role: '操作工' },
  { id: 'OP016', name: '蒋晓峰', teamId: 'TM05', role: '操作工' },
  { id: 'OP017', name: '沈美玲', teamId: 'TM06', role: '操作工' },
  { id: 'OP018', name: '韩志远', teamId: 'TM06', role: 'QC' },
];

// ── 设备定义 ──────────────────────────────────────────────────────
export interface Equipment {
  id: string;
  name: string;
  code: string;
  workCenter: string;
  category: string;
  status: 'NORMAL' | 'MAINTAIN' | 'FAULT' | 'IDLE';
}

export const EQUIPMENTS: Equipment[] = [
  { id: 'EQ001', name: '数控磨削机1号', code: 'EQ-GRIND-01', workCenter: '机加工-磨削区',  category: '磨削设备',   status: 'NORMAL'   },
  { id: 'EQ002', name: '数控磨削机2号', code: 'EQ-GRIND-02', workCenter: '机加工-磨削区',  category: '磨削设备',   status: 'NORMAL'   },
  { id: 'EQ003', name: '螺纹滚压机1号', code: 'EQ-THREAD-01',workCenter: '机加工-螺纹区',  category: '螺纹设备',   status: 'NORMAL'   },
  { id: 'EQ004', name: '热处理炉1号',   code: 'EQ-HT-01',    workCenter: '热处理车间',      category: '热处理设备', status: 'NORMAL'   },
  { id: 'EQ005', name: '热处理炉2号',   code: 'EQ-HT-02',    workCenter: '热处理车间',      category: '热处理设备', status: 'MAINTAIN' },
  { id: 'EQ006', name: 'PVD镀膜机1号', code: 'EQ-PVD-01',   workCenter: '涂层车间',        category: '涂层设备',   status: 'NORMAL'   },
  { id: 'EQ007', name: '注塑机1号',     code: 'EQ-INJ-01',   workCenter: '注塑车间',        category: '注塑设备',   status: 'NORMAL'   },
  { id: 'EQ008', name: '超声波清洗机',  code: 'EQ-CLEAN-01', workCenter: '清洗车间',        category: '清洗设备',   status: 'NORMAL'   },
  { id: 'EQ009', name: 'UDI打码机1号', code: 'EQ-UDI-01',   workCenter: '包装车间',        category: '打码设备',   status: 'NORMAL'   },
  { id: 'EQ010', name: '切断机1号',     code: 'EQ-CUT-01',   workCenter: '机加工-切断区',   category: '切断设备',   status: 'NORMAL'   },
];

// ── PAD工位定义 ────────────────────────────────────────────────────
export interface PadStation {
  id: string;
  name: string;
  location: string;
  workCenter: string;
  bindEquipIds: string[];   // 绑定设备ID
  status: 'ONLINE' | 'OFFLINE' | 'FAULT';
  currentOperator?: string;
}

export const PAD_STATIONS: PadStation[] = [
  { id: 'PAD-MJG-01', name: 'PAD-机加工01', location: '机加工车间A区',  workCenter: '机加工车间', bindEquipIds: ['EQ001','EQ003'], status: 'ONLINE', currentOperator: 'OP001' },
  { id: 'PAD-MJG-02', name: 'PAD-机加工02', location: '机加工车间B区',  workCenter: '机加工车间', bindEquipIds: ['EQ002','EQ010'], status: 'ONLINE', currentOperator: 'OP005' },
  { id: 'PAD-HCL-01', name: 'PAD-热处理01', location: '热处理车间',      workCenter: '热处理车间/涂层车间', bindEquipIds: ['EQ004','EQ006'], status: 'ONLINE', currentOperator: 'OP002' },
  { id: 'PAD-ZS-01',  name: 'PAD-注塑01',   location: '注塑/组装车间',   workCenter: '注塑车间/组装车间',  bindEquipIds: ['EQ007','EQ008'], status: 'ONLINE' },
  { id: 'PAD-BZ-01',  name: 'PAD-包装01',   location: '包装车间',         workCenter: '包装车间',           bindEquipIds: ['EQ009'],         status: 'ONLINE' },
  { id: 'PAD-QC-01',  name: 'PAD-检验01',   location: '检验室',           workCenter: '检验室',             bindEquipIds: [],                status: 'ONLINE' },
];

// ── L1 生产订单 ──────────────────────────────────────────────────
export type POStatus = 'OPEN' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export interface ProductionOrder {
  id: string;
  orderNo: string;          // MO-20260425-001
  soNo?: string;            // 关联销售订单
  // ── 单品订单字段（兼容旧数据） ──
  productCode: string;
  productName: string;
  productSpec: string;
  bomVersion: string;       // 使用的BOM版本
  routingCode: string;      // 使用的工艺路径
  totalQty: number;
  completedQty: number;
  scrapQty: number;
  // ── 多规格明细行（新版多物料订单） ──
  lineItems?: POLineItem[];  // 若有，则订单为多规格；totalQty = sum(lineItems[].planQty)
  // ────────────────────────────────
  deliveryDate: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: POStatus;
  isAudited: boolean;
  auditedBy?: string;
  auditedAt?: string;
  remark?: string;
  createdAt: string;
  createdBy: string;
  workOrders?: string[];
}

// ── L2 生产工单 ──────────────────────────────────────────────────
export type WOStatus = 'CREATED' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export interface WorkOrder {
  id: string;
  woNo: string;
  poId?: string;             // 来源生产订单ID（独立新建时可为空）
  poNo?: string;             // 来源生产订单号
  batchNo: string;           // 生产批号（唯一，用于追溯）
  productCode: string;
  productName: string;
  productSpec: string;
  bomVersion: string;
  routingCode: string;
  routingName: string;
  planQty: number;
  actualQty?: number;
  scrapQty?: number;
  status: WOStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  releaseTime?: string;
  planStart?: string;
  planEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  currentOp?: string;        // 当前所在工序
  currentStage?: string;     // 当前工艺段
  progressPct?: number;      // 完成进度%
  createdAt: string;
  createTime?: string;       // 兼容别名
  createdBy: string;
  remark?: string;
  tasks?: TaskOrder[];
}

// ── L3 生产任务单 ────────────────────────────────────────────────
export type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'PAUSED';

export interface TaskOrder {
  id: string;
  taskNo: string;
  woId: string;
  woNo: string;
  batchNo: string;
  workCenter: string;
  shiftId: string;           // 班次ID
  shiftName: string;         // 班次名称
  team: string;              // 执行班组
  teamId?: string;           // 班组ID
  operator: string;          // 主操作工
  operatorId?: string;       // 操作工工号
  stationScope: string;      // 负责工序范围描述
  stepIds: string[];         // 关联工序ID
  planQty: number;
  reportQty?: number;
  scrapQty?: number;
  planStart: string;
  planEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: TaskStatus;
  padStation?: string;       // 绑定工位PAD编号
  equipIds?: string[];       // 绑定设备列表
  currentOpNo?: string;      // PAD当前执行工序
  deviationFlag?: boolean;   // 是否有偏差记录
  remark?: string;
}

// ── L4 生产浮票 ──────────────────────────────────────────────────
export type FTStatus = 'PRINTED' | 'ISSUED' | 'IN_USE' | 'RETURNED' | 'ARCHIVED' | 'LOST';

export interface FloatTicketV2 {
  id: string;
  ticketNo: string;
  woId: string;
  woNo: string;
  taskId?: string;
  taskNo?: string;
  batchNo: string;
  subBatchNo?: string;       // 子批号（热处理炉次等）
  qty: number;               // 本张浮票对应数量
  printTime: string;
  issueTime?: string;
  returnTime?: string;
  status: FTStatus;
  qrContent: string;         // 二维码JSON内容
  currentStation?: string;   // 当前所在工位
  currentOp?: string;        // 当前执行工序
  currentStageName?: string; // 当前阶段名
  operatorName?: string;     // 当前操作员
  lastUpdateTime?: string;
}

// ── EBR批记录执行状态（PAD端） ────────────────────────────────────
export interface EBROperation {
  opNo: string;
  opName: string;
  stage: string;
  workCenter: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEVIATION' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  operatorId?: string;
  operatorName?: string;
  reportQty?: number;
  scrapQty?: number;
  deviationFlag?: boolean;
  keyData?: Record<string, string | number>;
}

export interface EBRRecord {
  id: string;
  ebrNo: string;
  woId: string;
  woNo: string;
  batchNo: string;
  productCode: string;
  productName: string;
  productSpec: string;
  plannedQty: number;
  actualQty: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  operations: EBROperation[];
}

// ── 状态配置 ─────────────────────────────────────────────────────
export const PO_STATUS: Record<POStatus, { label: string; color: string; bg: string; border: string }> = {
  OPEN:        { label: '待下发', color: '#faad14', bg: 'rgba(250,173,20,0.10)',   border: '#ffd666' },
  RELEASED:    { label: '已下发', color: '#1890ff', bg: 'rgba(24,144,255,0.10)',   border: '#69c0ff' },
  IN_PROGRESS: { label: '生产中', color: '#52c41a', bg: 'rgba(82,196,26,0.10)',    border: '#95de64' },
  COMPLETED:   { label: '已完成', color: '#13c2c2', bg: 'rgba(19,194,194,0.10)',   border: '#5cdbd3' },
  CLOSED:      { label: '已关闭', color: '#8c8c8c', bg: 'rgba(140,140,140,0.10)', border: '#bfbfbf' },
};

export const WO_STATUS: Record<WOStatus, { label: string; color: string; bg: string }> = {
  CREATED:     { label: '已创建', color: '#8c8c8c', bg: 'rgba(140,140,140,0.10)' },
  RELEASED:    { label: '已下发', color: '#faad14', bg: 'rgba(250,173,20,0.10)'  },
  IN_PROGRESS: { label: '生产中', color: '#52c41a', bg: 'rgba(82,196,26,0.10)'   },
  COMPLETED:   { label: '已完成', color: '#13c2c2', bg: 'rgba(19,194,194,0.10)'  },
  CLOSED:      { label: '已关闭', color: '#595959', bg: 'rgba(89,89,89,0.10)'    },
};

export const TASK_STATUS: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  PENDING:     { label: '待派工', color: '#8c8c8c', bg: 'rgba(140,140,140,0.10)' },
  ASSIGNED:    { label: '已派工', color: '#1890ff', bg: 'rgba(24,144,255,0.10)'  },
  IN_PROGRESS: { label: '执行中', color: '#52c41a', bg: 'rgba(82,196,26,0.10)'   },
  DONE:        { label: '已完成', color: '#13c2c2', bg: 'rgba(19,194,194,0.10)'  },
  PAUSED:      { label: '已暂停', color: '#faad14', bg: 'rgba(250,173,20,0.10)'  },
};

export const FT_STATUS: Record<FTStatus, { label: string; color: string }> = {
  PRINTED:  { label: '已打印', color: '#8c8c8c' },
  ISSUED:   { label: '已领用', color: '#faad14' },
  IN_USE:   { label: '流转中', color: '#1890ff' },
  RETURNED: { label: '已回收', color: '#13c2c2' },
  ARCHIVED: { label: '已归档', color: '#52c41a' },
  LOST:     { label: '已遗失', color: '#ff4d4f' },
};

export const PRIORITY_MAP = {
  LOW:    { label: '低',   color: '#8c8c8c' },
  NORMAL: { label: '普通', color: '#1890ff' },
  HIGH:   { label: '紧急', color: '#fa8c16' },
  URGENT: { label: '特急', color: '#f5222d' },
};

export const EQUIP_STATUS_MAP: Record<Equipment['status'], { label: string; color: string }> = {
  NORMAL:   { label: '正常', color: '#52c41a' },
  MAINTAIN: { label: '维护中', color: '#faad14' },
  FAULT:    { label: '故障', color: '#ff4d4f' },
  IDLE:     { label: '空闲', color: '#8c8c8c' },
};

// ================================================================
// Mock 数据 - 生产订单
// ================================================================
export const mockProductionOrders: ProductionOrder[] = [
]

// ================================================================
// Mock 数据 - 生产工单
// ================================================================
export const mockWorkOrders: WorkOrder[] = [
]

// ================================================================
// Mock 数据 - 生产任务单（工业PAD执行单元）
// ================================================================
export const mockTaskOrders: TaskOrder[] = [
]

// ================================================================
// Mock 数据 - 生产浮票（随批流转的实物标签）
// ================================================================
export const mockFloatTicketsV2: FloatTicketV2[] = [
]

// ================================================================
// Mock 数据 - EBR批记录（部分，供PAD端展示）
// ================================================================
export const mockEBRRecords: EBRRecord[] = [
  {
    id: 'EBR001',
    ebrNo: 'EBR-20260425-001',
    woId: 'WO001', woNo: 'WO-20260425-001',
    batchNo: 'YS-RKQ-20260425-001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25 / 04锥度 / 25mm',
    plannedQty: 5000, actualQty: 3200,
    status: 'IN_PROGRESS',
    createdAt: '2026-04-25 08:00',
    operations: [
      { opNo: 'OP-10', opName: '镍钛丝入料确认', stage: 'S1-备料',   workCenter: '备料区',        status: 'COMPLETED', startedAt: '2026-04-25 08:45', completedAt: '2026-04-25 09:00', reportQty: 5000 },
      { opNo: 'OP-15', opName: '切断',           stage: 'S1-备料',   workCenter: '机加工-切断区', status: 'COMPLETED', startedAt: '2026-04-25 09:05', completedAt: '2026-04-25 09:50', reportQty: 4998, scrapQty: 2 },
      { opNo: 'OP-20', opName: '粗磨锥',         stage: 'S2-磨锥',   workCenter: '机加工-磨削区', status: 'COMPLETED', startedAt: '2026-04-25 09:55', completedAt: '2026-04-25 11:10', reportQty: 4990, scrapQty: 8 },
      { opNo: 'OP-25', opName: '精磨锥/尖端成型', stage: 'S2-磨锥',  workCenter: '机加工-精磨区', status: 'COMPLETED', startedAt: '2026-04-25 11:15', completedAt: '2026-04-25 13:20', reportQty: 4965, scrapQty: 25, keyData: { 'd1_avg': 0.253, 'd3_avg': 0.149 } },
      { opNo: 'OP-30', opName: '螺纹滚压',       stage: 'S3-螺纹',   workCenter: '机加工-螺纹区', status: 'IN_PROGRESS', startedAt: '2026-04-25 13:30', reportQty: 3200 },
      { opNo: 'OP-32', opName: '尾部修整',       stage: 'S3-螺纹',   workCenter: '机加工-螺纹区', status: 'PENDING' },
      { opNo: 'OP-40', opName: '热处理',         stage: 'S4-热处理', workCenter: '热处理车间',    status: 'PENDING' },
      { opNo: 'OP-42', opName: '化学蚀刻',       stage: 'S4-热处理', workCenter: '热处理-蚀刻区', status: 'PENDING' },
      { opNo: 'OP-50', opName: 'PVD氮化钛涂层',  stage: 'S5-涂层',   workCenter: '涂层车间',      status: 'PENDING' },
      { opNo: 'OP-60', opName: 'ABS注塑柄',      stage: 'S6-注塑柄', workCenter: '注塑车间',      status: 'PENDING' },
      { opNo: 'OP-70', opName: '柄部组装',       stage: 'S7-组装清洗',workCenter: '组装车间',     status: 'PENDING' },
      { opNo: 'OP-72', opName: '超声清洗',       stage: 'S7-组装清洗',workCenter: '清洗车间',     status: 'PENDING' },
      { opNo: 'OP-80', opName: '吸塑包装+UDI赋码',stage: 'S8-包装',  workCenter: '包装车间',      status: 'PENDING' },
      { opNo: 'OP-82', opName: '装盒',           stage: 'S8-包装',   workCenter: '包装车间',      status: 'PENDING' },
      { opNo: 'OP-90', opName: 'OQC出厂终检',    stage: 'S9-入库',   workCenter: '检验室',        status: 'PENDING' },
      { opNo: 'OP-95', opName: '成品入库',        stage: 'S9-入库',  workCenter: '成品仓库',      status: 'PENDING' },
    ],
  },
];

// ── 成品物料目录（供生产订单/工单新建时下拉选择） ─────────────────
export interface FinishedGood {
  code: string;            // 物料编码
  name: string;            // 物料名称
  spec: string;            // 规格
  seriesCode: string;      // 所属产品系列编码（对应 seriesData.RoutingMaster.seriesCode）
  defaultRouting: string;  // 默认工艺路径编码（对应 seriesData.RoutingMaster.routingCode）
  defaultBom: string;      // 默认BOM版本
  unit: string;            // 计量单位
  handleColor: string;     // 柄色（用于辨识）
  price: number;           // 参考单价（元/支）
}

export const FINISHED_GOODS: FinishedGood[] = [
  {
    code: 'FG-RKQ-2504-25', name: '机用根管锉', spec: '#25 / 04锥度 / 25mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '2.1', unit: '根',
    handleColor: '黄色', price: 18.50,
  },
  {
    code: 'FG-RKQ-2504-21', name: '机用根管锉', spec: '#25 / 04锥度 / 21mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '2.1', unit: '根',
    handleColor: '黄色', price: 17.80,
  },
  {
    code: 'FG-RKQ-2506-25', name: '机用根管锉', spec: '#25 / 06锥度 / 25mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '1.0', unit: '根',
    handleColor: '黄色', price: 20.00,
  },
  {
    code: 'FG-RKQ-2506-21', name: '机用根管锉', spec: '#25 / 06锥度 / 21mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '1.0', unit: '根',
    handleColor: '黄色', price: 19.50,
  },
  {
    code: 'FG-RKQ-3006-21', name: '机用根管锉', spec: '#30 / 06锥度 / 21mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '2.0', unit: '根',
    handleColor: '绿色', price: 21.00,
  },
  {
    code: 'FG-RKQ-3006-25', name: '机用根管锉', spec: '#30 / 06锥度 / 25mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '2.0', unit: '根',
    handleColor: '绿色', price: 21.50,
  },
  {
    code: 'FG-RKQ-4004-21', name: '机用根管锉', spec: '#40 / 04锥度 / 21mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '1.5', unit: '根',
    handleColor: '黑色', price: 24.50,
  },
  {
    code: 'FG-RKQ-4006-21', name: '机用根管锉', spec: '#40 / 06锥度 / 21mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '1.5', unit: '根',
    handleColor: '黑色', price: 25.00,
  },
  {
    code: 'FG-RKQ-2004-21', name: '机用根管锉', spec: '#20 / 04锥度 / 21mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '2.1', unit: '根',
    handleColor: '红色', price: 17.00,
  },
  {
    code: 'FG-RKQ-1502-21', name: '机用根管锉', spec: '#15 / 02锥度 / 21mm',
    seriesCode: 'RT-RKQ',
    defaultRouting: 'RT-RKQ-STD-001', defaultBom: '2.1', unit: '根',
    handleColor: '白色', price: 16.50,
  },
];

// ── 生产订单明细行（多规格订单） ────────────────────────────────────
export interface POLineItem {
  lineNo: number;          // 行号（1-based）
  productCode: string;
  productName: string;
  productSpec: string;
  routingCode: string;
  bomVersion: string;
  planQty: number;
  completedQty: number;
  scrapQty: number;
  remark?: string;
}

// ── 工作中心列表（派工单下拉选项） ────────────────────────────────
export const WORK_CENTERS = [
  '备料区',
  '机加工车间',
  '机加工-切断区',
  '机加工-磨削区',
  '机加工-精磨区',
  '机加工-螺纹区',
  '热处理车间',
  '热处理-蚀刻区',
  '涂层车间',
  '注塑车间',
  '组装车间',
  '清洗车间',
  '包装车间',
  '检验室',
  '成品仓库',
  '全线',
];

// ── 工具函数 ──────────────────────────────────────────────────────
export const getRoutingMaster = (code: string): RoutingMaster | undefined =>
  ROUTING_MASTERS.find(r => r.code === code);

export const getShift = (id: string): Shift | undefined =>
  SHIFTS.find(s => s.id === id);

export const getTeam = (id: string): Team | undefined =>
  TEAMS.find(t => t.id === id);

export const getEquipment = (id: string): Equipment | undefined =>
  EQUIPMENTS.find(e => e.id === id);

export const getPadStation = (id: string): PadStation | undefined =>
  PAD_STATIONS.find(p => p.id === id);

/** 生成批号：产品代码前缀 + 日期 + 序号 */
export const genBatchNo = (productCode: string, dateStr: string, seq: number): string => {
  const prefix = productCode.replace('FG-RKQ-', '').replace(/-/g, '');
  return `YS-${prefix}-${dateStr}-${String(seq).padStart(3, '0')}`;
};

/** 工单号生成规则 */
export const genWONo = (dateStr: string, seq: number): string =>
  `WO-${dateStr}-${String(seq).padStart(3, '0')}`;

/** 任务单号生成规则：工单号后缀 + 班次字母 + 序号 */
export const genTaskNo = (woNo: string, shiftName: string, seq: number): string => {
  const shiftChar = shiftName === '白班' ? 'D' : shiftName === '夜班' ? 'N' : shiftName === '早班' ? 'M' : 'E';
  const woSuffix = woNo.slice(-3);
  return `TK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${woSuffix}-${shiftChar}${seq}`;
};
