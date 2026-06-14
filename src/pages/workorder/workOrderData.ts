// ================================================================
// 生产管理四层数据模型 - 天美健保健品生产执行（TMJ-MES Health PRD V2.0）
// L1 生产订单 → L2 生产工单 → L3 生产任务单 → L4 生产浮票
// 适配工业PAD执行场景（10寸，按钮≥80px）
// 双工厂：南京工厂（固体制剂）+ 溧水工厂（益生菌冷链）
// ================================================================

// ── 工序定义（与proData工艺路径对齐）──────────────────────────────
export interface RoutingStep {
  id: string;
  opNo: string;
  name: string;
  stage: string;          // S1~S9工艺段
  workCenter: string;
  standardTime: number;   // 标准工时（分钟/千粒）
  isKeyOp: boolean;
  mandatoryInspection: boolean;
}

// VitC 咀嚼片（湿法制粒）工艺路径工序 - 南京工厂
export const ROUTING_STEPS: RoutingStep[] = [
  { id: 'RS01', opNo: 'OP-10', name: '称量配料',       stage: 'S1-称量',   workCenter: 'WS-NJ-WEIGH',  standardTime: 45,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS02', opNo: 'OP-20', name: '制粒（湿法）',   stage: 'S2-制粒',   workCenter: 'WS-NJ-SOLID',  standardTime: 90,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS03', opNo: 'OP-25', name: '流化床干燥',     stage: 'S2-制粒',   workCenter: 'WS-NJ-SOLID',  standardTime: 120, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS04', opNo: 'OP-30', name: '整粒过筛',       stage: 'S3-总混',   workCenter: 'WS-NJ-SOLID',  standardTime: 30,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS05', opNo: 'OP-35', name: '总混',           stage: 'S3-总混',   workCenter: 'WS-NJ-SOLID',  standardTime: 60,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS06', opNo: 'OP-40', name: '压片',           stage: 'S4-压片',   workCenter: 'WS-NJ-SOLID',  standardTime: 180, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS07', opNo: 'OP-45', name: '素片中检',       stage: 'S4-压片',   workCenter: 'WS-NJ-QC',     standardTime: 60,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS08', opNo: 'OP-50', name: '薄膜包衣',       stage: 'S5-包衣',   workCenter: 'WS-NJ-SOLID',  standardTime: 120, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS09', opNo: 'OP-60', name: '内包装（铝塑）', stage: 'S6-内包',   workCenter: 'WS-NJ-PACK',   standardTime: 90,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS10', opNo: 'OP-65', name: '贴签',           stage: 'S6-内包',   workCenter: 'WS-NJ-PACK',   standardTime: 30,  isKeyOp: false, mandatoryInspection: false },
  { id: 'RS11', opNo: 'OP-70', name: '外包装装盒',     stage: 'S7-外包',   workCenter: 'WS-NJ-OUTERPACK', standardTime: 60, isKeyOp: false, mandatoryInspection: false },
  { id: 'RS12', opNo: 'OP-80', name: 'FQC成品检验',   stage: 'S8-检验',   workCenter: 'WS-NJ-QC',     standardTime: 90,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS13', opNo: 'OP-90', name: '质量放行',       stage: 'S9-放行',   workCenter: 'WS-NJ-QC',     standardTime: 30,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'RS14', opNo: 'OP-95', name: '成品入库',       stage: 'S9-放行',   workCenter: 'WS-NJ-WH',     standardTime: 30,  isKeyOp: false, mandatoryInspection: false },
];

// 益生菌胶囊工艺路径工序 - 溧水工厂
export const ROUTING_STEPS_PROBIO: RoutingStep[] = [
  { id: 'PB01', opNo: 'OP-10', name: '原料接收验收',   stage: 'S1-备料',   workCenter: 'WS-LS-WH',     standardTime: 30,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'PB02', opNo: 'OP-20', name: '低温称量配料',   stage: 'S1-备料',   workCenter: 'WS-LS-PROBIO', standardTime: 60,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'PB03', opNo: 'OP-30', name: '混合（冷链≤8℃）', stage: 'S2-混合', workCenter: 'WS-LS-PROBIO', standardTime: 90,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'PB04', opNo: 'OP-40', name: '胶囊充填',       stage: 'S3-充填',   workCenter: 'WS-LS-PROBIO', standardTime: 120, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'PB05', opNo: 'OP-45', name: '充填中检',       stage: 'S3-充填',   workCenter: 'WS-LS-QC',     standardTime: 60,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'PB06', opNo: 'OP-50', name: '铝塑泡罩包装',   stage: 'S4-内包',   workCenter: 'WS-LS-PACK',   standardTime: 90,  isKeyOp: false, mandatoryInspection: false },
  { id: 'PB07', opNo: 'OP-60', name: '外包装装盒',     stage: 'S5-外包',   workCenter: 'WS-LS-OUTERPACK', standardTime: 60, isKeyOp: false, mandatoryInspection: false },
  { id: 'PB08', opNo: 'OP-70', name: 'FQC成品检验',   stage: 'S6-检验',   workCenter: 'WS-LS-QC',     standardTime: 120, isKeyOp: true,  mandatoryInspection: true  },
  { id: 'PB09', opNo: 'OP-80', name: '质量放行',       stage: 'S7-放行',   workCenter: 'WS-LS-QC',     standardTime: 30,  isKeyOp: true,  mandatoryInspection: true  },
  { id: 'PB10', opNo: 'OP-90', name: '冷链入库（≤8℃）', stage: 'S7-放行', workCenter: 'WS-LS-WH',     standardTime: 30,  isKeyOp: false, mandatoryInspection: false },
];

// ── 工艺路径定义 ──────────────────────────────────────────────────
export interface RoutingMaster {
  code: string;
  name: string;
  version: string;
  applicableSpec: string;
  steps: string[];
}

export const ROUTING_MASTERS: RoutingMaster[] = [
  {
    code: 'TMJ-VITC-WG-V20',
    name: 'VitC咀嚼片湿法制粒工艺路径',
    version: 'V2.0',
    applicableSpec: '维生素C咀嚼片 500mg/粒 铝塑包装',
    steps: ['RS01','RS02','RS03','RS04','RS05','RS06','RS07','RS08','RS09','RS10','RS11','RS12','RS13','RS14'],
  },
  {
    code: 'TMJ-VITC-DC-V10',
    name: 'VitC咀嚼片直压工艺路径',
    version: 'V1.0',
    applicableSpec: '维生素C咀嚼片 250mg/粒 瓶装',
    steps: ['RS01','RS04','RS05','RS06','RS07','RS09','RS10','RS11','RS12','RS13','RS14'],
  },
  {
    code: 'TMJ-PROBIO-CAP-V15',
    name: '益生菌胶囊冷链工艺路径',
    version: 'V1.5',
    applicableSpec: '复合益生菌胶囊 250mg/粒 铝塑泡罩',
    steps: ['PB01','PB02','PB03','PB04','PB05','PB06','PB07','PB08','PB09','PB10'],
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
  shiftId: string;
  leader: string;
  members: string[];
  workCenter: string;
}

export const TEAMS: Team[] = [
  // 南京工厂班组
  { id: 'TM01', name: '南京甲班', shiftId: 'SH01', leader: '陈国华', members: ['OP001','OP007','OP008','OP009'], workCenter: 'WS-NJ-SOLID' },
  { id: 'TM02', name: '南京乙班', shiftId: 'SH02', leader: '王建平', members: ['OP002','OP010','OP011','OP012'], workCenter: 'WS-NJ-SOLID' },
  { id: 'TM03', name: '南京丙班', shiftId: 'SH03', leader: '刘晓梅', members: ['OP003','OP013','OP014'],         workCenter: 'WS-NJ-PACK' },
  { id: 'TM04', name: '南京QC班', shiftId: 'SH01', leader: '张丽华', members: ['OP004','OP015','OP016'],         workCenter: 'WS-NJ-QC' },
  // 溧水工厂班组
  { id: 'TM05', name: '溧水甲班', shiftId: 'SH01', leader: '李志远', members: ['OP005','OP017','OP018','OP019'], workCenter: 'WS-LS-PROBIO' },
  { id: 'TM06', name: '溧水QC班', shiftId: 'SH01', leader: '赵雪梅', members: ['OP006','OP020','OP021'],         workCenter: 'WS-LS-QC' },
];

// ── 操作员（工号）定义 ─────────────────────────────────────────────
export interface Operator {
  id: string;
  name: string;
  teamId: string;
  role: '班组长' | '操作工' | 'QC';
}

export const OPERATORS: Operator[] = [
  // 南京工厂
  { id: 'OP001', name: '陈国华', teamId: 'TM01', role: '班组长' },
  { id: 'OP002', name: '王建平', teamId: 'TM02', role: '班组长' },
  { id: 'OP003', name: '刘晓梅', teamId: 'TM03', role: '班组长' },
  { id: 'OP004', name: '张丽华', teamId: 'TM04', role: '班组长' },
  { id: 'OP007', name: '周浩然', teamId: 'TM01', role: '操作工' },
  { id: 'OP008', name: '吴慧敏', teamId: 'TM01', role: '操作工' },
  { id: 'OP009', name: '林大强', teamId: 'TM01', role: '操作工' },
  { id: 'OP010', name: '黄亚梅', teamId: 'TM02', role: '操作工' },
  { id: 'OP011', name: '何文博', teamId: 'TM02', role: '操作工' },
  { id: 'OP012', name: '马晓燕', teamId: 'TM02', role: '操作工' },
  { id: 'OP013', name: '孙桂花', teamId: 'TM03', role: '操作工' },
  { id: 'OP014', name: '郑建军', teamId: 'TM03', role: '操作工' },
  { id: 'OP015', name: '冯小丽', teamId: 'TM04', role: 'QC' },
  { id: 'OP016', name: '蒋芳芳', teamId: 'TM04', role: 'QC' },
  // 溧水工厂
  { id: 'OP005', name: '李志远', teamId: 'TM05', role: '班组长' },
  { id: 'OP006', name: '赵雪梅', teamId: 'TM06', role: '班组长' },
  { id: 'OP017', name: '钱文华', teamId: 'TM05', role: '操作工' },
  { id: 'OP018', name: '沈美萍', teamId: 'TM05', role: '操作工' },
  { id: 'OP019', name: '韩建国', teamId: 'TM05', role: '操作工' },
  { id: 'OP020', name: '杨芸',   teamId: 'TM06', role: 'QC' },
  { id: 'OP021', name: '朱晓峰', teamId: 'TM06', role: 'QC' },
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
  // 南京工厂设备
  { id: 'EQ001', name: '湿法制粒机1号',    code: 'EQ-GRN-NJ-01', workCenter: 'WS-NJ-SOLID',  category: '制粒设备',   status: 'NORMAL'   },
  { id: 'EQ002', name: '流化床干燥机1号',  code: 'EQ-FBD-NJ-01', workCenter: 'WS-NJ-SOLID',  category: '干燥设备',   status: 'NORMAL'   },
  { id: 'EQ003', name: '整粒机1号',        code: 'EQ-SZL-NJ-01', workCenter: 'WS-NJ-SOLID',  category: '整粒设备',   status: 'NORMAL'   },
  { id: 'EQ004', name: '三维混合机1号',    code: 'EQ-MIX-NJ-01', workCenter: 'WS-NJ-SOLID',  category: '混合设备',   status: 'NORMAL'   },
  { id: 'EQ005', name: '旋转压片机1号',    code: 'EQ-TAB-NJ-01', workCenter: 'WS-NJ-SOLID',  category: '压片设备',   status: 'NORMAL'   },
  { id: 'EQ006', name: '旋转压片机2号',    code: 'EQ-TAB-NJ-02', workCenter: 'WS-NJ-SOLID',  category: '压片设备',   status: 'MAINTAIN' },
  { id: 'EQ007', name: '高效包衣机1号',    code: 'EQ-COT-NJ-01', workCenter: 'WS-NJ-SOLID',  category: '包衣设备',   status: 'NORMAL'   },
  { id: 'EQ008', name: '铝塑包装机1号',    code: 'EQ-BLS-NJ-01', workCenter: 'WS-NJ-PACK',   category: '包装设备',   status: 'NORMAL'   },
  { id: 'EQ009', name: '电子天平1号',      code: 'EQ-BAL-NJ-01', workCenter: 'WS-NJ-WEIGH',  category: '称量设备',   status: 'NORMAL'   },
  { id: 'EQ010', name: '片剂硬度仪',       code: 'EQ-HRD-NJ-01', workCenter: 'WS-NJ-QC',     category: '检验设备',   status: 'NORMAL'   },
  { id: 'EQ011', name: '溶出仪',           code: 'EQ-DSL-NJ-01', workCenter: 'WS-NJ-QC',     category: '检验设备',   status: 'NORMAL'   },
  // 溧水工厂设备
  { id: 'EQ012', name: '胶囊充填机1号',    code: 'EQ-CAP-LS-01', workCenter: 'WS-LS-PROBIO', category: '充填设备',   status: 'NORMAL'   },
  { id: 'EQ013', name: '低温混合机（冷链）', code: 'EQ-MIX-LS-01', workCenter: 'WS-LS-PROBIO', category: '混合设备',  status: 'NORMAL'   },
  { id: 'EQ014', name: '铝塑泡罩机（溧水）', code: 'EQ-BLS-LS-01', workCenter: 'WS-LS-PACK',   category: '包装设备',  status: 'NORMAL'   },
  { id: 'EQ015', name: '活菌计数仪',       code: 'EQ-CFU-LS-01', workCenter: 'WS-LS-QC',     category: '检验设备',   status: 'NORMAL'   },
  { id: 'EQ016', name: '冷链电子天平',     code: 'EQ-BAL-LS-01', workCenter: 'WS-LS-PROBIO', category: '称量设备',   status: 'NORMAL'   },
];

// ── PAD工位定义 ────────────────────────────────────────────────────
export interface PadStation {
  id: string;
  name: string;
  location: string;
  workCenter: string;
  bindEquipIds: string[];
  status: 'ONLINE' | 'OFFLINE' | 'FAULT';
  currentOperator?: string;
}

export const PAD_STATIONS: PadStation[] = [
  // 南京工厂PAD工位
  { id: 'PAD-NJ-WEIGH-01', name: 'PAD-称量01',     location: '称量配料间A区',    workCenter: 'WS-NJ-WEIGH',     bindEquipIds: ['EQ009'],         status: 'ONLINE', currentOperator: 'OP007' },
  { id: 'PAD-NJ-SOLID-01', name: 'PAD-固剂01',     location: '固体制剂车间A区',  workCenter: 'WS-NJ-SOLID',     bindEquipIds: ['EQ001','EQ002'], status: 'ONLINE', currentOperator: 'OP001' },
  { id: 'PAD-NJ-SOLID-02', name: 'PAD-固剂02',     location: '固体制剂车间B区',  workCenter: 'WS-NJ-SOLID',     bindEquipIds: ['EQ004','EQ005'], status: 'ONLINE', currentOperator: 'OP008' },
  { id: 'PAD-NJ-SOLID-03', name: 'PAD-包衣',       location: '固体制剂车间C区',  workCenter: 'WS-NJ-SOLID',     bindEquipIds: ['EQ007'],         status: 'ONLINE' },
  { id: 'PAD-NJ-PACK-01',  name: 'PAD-内包01',     location: '内包装车间',        workCenter: 'WS-NJ-PACK',      bindEquipIds: ['EQ008'],         status: 'ONLINE', currentOperator: 'OP013' },
  { id: 'PAD-NJ-QC-01',    name: 'PAD-QC南京',     location: 'QC检验室（南京）',  workCenter: 'WS-NJ-QC',        bindEquipIds: ['EQ010','EQ011'], status: 'ONLINE', currentOperator: 'OP015' },
  // 溧水工厂PAD工位
  { id: 'PAD-LS-PROBIO-01', name: 'PAD-益生菌01',  location: '益生菌充填车间',    workCenter: 'WS-LS-PROBIO',    bindEquipIds: ['EQ012','EQ013'], status: 'ONLINE', currentOperator: 'OP005' },
  { id: 'PAD-LS-PACK-01',   name: 'PAD-泡罩01',    location: '包装车间（溧水）',  workCenter: 'WS-LS-PACK',      bindEquipIds: ['EQ014'],         status: 'ONLINE', currentOperator: 'OP017' },
  { id: 'PAD-LS-QC-01',     name: 'PAD-QC溧水',    location: 'QC检验室（溧水）',  workCenter: 'WS-LS-QC',        bindEquipIds: ['EQ015'],         status: 'ONLINE', currentOperator: 'OP020' },
];

// ── L1 生产订单 ──────────────────────────────────────────────────
export type POStatus = 'OPEN' | 'RELEASED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export interface ProductionOrder {
  id: string;
  orderNo: string;
  soNo?: string;
  productCode: string;
  productName: string;
  productSpec: string;
  bomVersion: string;
  routingCode: string;
  totalQty: number;
  completedQty: number;
  scrapQty: number;
  lineItems?: POLineItem[];
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
  poId?: string;
  poNo?: string;
  batchNo: string;
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
  currentOp?: string;
  currentStage?: string;
  progressPct?: number;
  createdAt: string;
  createTime?: string;
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
  shiftId: string;
  shiftName: string;
  team: string;
  teamId?: string;
  operator: string;
  operatorId?: string;
  stationScope: string;
  stepIds: string[];
  planQty: number;
  reportQty?: number;
  scrapQty?: number;
  planStart: string;
  planEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: TaskStatus;
  padStation?: string;
  equipIds?: string[];
  currentOpNo?: string;
  deviationFlag?: boolean;
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
  subBatchNo?: string;
  qty: number;
  printTime: string;
  issueTime?: string;
  returnTime?: string;
  status: FTStatus;
  qrContent: string;
  currentStation?: string;
  currentOp?: string;
  currentStageName?: string;
  operatorName?: string;
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
  NORMAL:   { label: '正常',  color: '#52c41a' },
  MAINTAIN: { label: '维护中', color: '#faad14' },
  FAULT:    { label: '故障',  color: '#ff4d4f' },
  IDLE:     { label: '空闲',  color: '#8c8c8c' },
};

// ================================================================
// Mock 数据 - 生产订单（南京+溧水双工厂，2026年6月批次）
// ================================================================
export const mockProductionOrders: ProductionOrder[] = [
  // 南京工厂 - VitC咀嚼片
  {
    id: 'PO001',
    orderNo: 'MO-20260601-001',
    soNo: 'SO-20260530-001',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/粒 × 60粒/瓶',
    bomVersion: 'V2.0',
    routingCode: 'TMJ-VITC-WG-V20',
    totalQty: 100000,
    completedQty: 100000,
    scrapQty: 320,
    deliveryDate: '2026-06-15',
    priority: 'HIGH',
    status: 'COMPLETED',
    isAudited: true,
    auditedBy: '张丽华',
    auditedAt: '2026-06-01 09:30',
    remark: '客户催货，优先排产',
    createdAt: '2026-05-28 10:00',
    createdBy: '生产计划部-李明',
    workOrders: ['WO001'],
  },
  {
    id: 'PO002',
    orderNo: 'MO-20260605-001',
    soNo: 'SO-20260603-002',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/粒 × 60粒/瓶',
    bomVersion: 'V2.0',
    routingCode: 'TMJ-VITC-WG-V20',
    totalQty: 200000,
    completedQty: 75000,
    scrapQty: 180,
    deliveryDate: '2026-06-25',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    isAudited: true,
    auditedBy: '张丽华',
    auditedAt: '2026-06-05 08:30',
    remark: '电商旺季备货',
    createdAt: '2026-06-03 14:00',
    createdBy: '生产计划部-李明',
    workOrders: ['WO002'],
  },
  {
    id: 'PO003',
    orderNo: 'MO-20260610-001',
    soNo: 'SO-20260608-003',
    productCode: 'FG-VITC-250MG-BTL',
    productName: '维生素C咀嚼片',
    productSpec: '250mg/粒 × 100粒/瓶',
    bomVersion: 'V1.0',
    routingCode: 'TMJ-VITC-DC-V10',
    totalQty: 50000,
    completedQty: 0,
    scrapQty: 0,
    deliveryDate: '2026-06-30',
    priority: 'NORMAL',
    status: 'RELEASED',
    isAudited: true,
    auditedBy: '张丽华',
    auditedAt: '2026-06-10 10:00',
    remark: '直压工艺，新规格首批',
    createdAt: '2026-06-08 16:00',
    createdBy: '生产计划部-王芳',
    workOrders: ['WO003'],
  },
  // 溧水工厂 - 益生菌胶囊
  {
    id: 'PO004',
    orderNo: 'MO-20260601-002',
    soNo: 'SO-20260528-004',
    productCode: 'FG-PROBIO-CAP-250',
    productName: '复合益生菌胶囊',
    productSpec: '250mg/粒（活菌数≥1×10⁹CFU/粒）× 30粒/盒',
    bomVersion: 'V1.5',
    routingCode: 'TMJ-PROBIO-CAP-V15',
    totalQty: 30000,
    completedQty: 30000,
    scrapQty: 120,
    deliveryDate: '2026-06-10',
    priority: 'URGENT',
    status: 'CLOSED',
    isAudited: true,
    auditedBy: '赵雪梅',
    auditedAt: '2026-06-01 08:00',
    remark: '冷链发货，溧水工厂生产',
    createdAt: '2026-05-26 09:00',
    createdBy: '生产计划部-李明',
    workOrders: ['WO004'],
  },
  {
    id: 'PO005',
    orderNo: 'MO-20260612-001',
    soNo: 'SO-20260610-005',
    productCode: 'FG-PROBIO-CAP-250',
    productName: '复合益生菌胶囊',
    productSpec: '250mg/粒 × 30粒/盒',
    bomVersion: 'V1.5',
    routingCode: 'TMJ-PROBIO-CAP-V15',
    totalQty: 60000,
    completedQty: 12000,
    scrapQty: 60,
    deliveryDate: '2026-06-28',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    isAudited: true,
    auditedBy: '赵雪梅',
    auditedAt: '2026-06-12 09:30',
    remark: '益生菌冷链批次，溧水工厂',
    createdAt: '2026-06-10 11:00',
    createdBy: '生产计划部-王芳',
    workOrders: ['WO005'],
  },
  {
    id: 'PO006',
    orderNo: 'MO-20260614-001',
    productCode: 'FG-COLLA-GUM-500',
    productName: '胶原蛋白软糖',
    productSpec: '500mg/粒 × 20粒/袋',
    bomVersion: 'V1.0',
    routingCode: 'TMJ-VITC-WG-V20',
    totalQty: 40000,
    completedQty: 0,
    scrapQty: 0,
    deliveryDate: '2026-07-05',
    priority: 'NORMAL',
    status: 'OPEN',
    isAudited: false,
    remark: '新品首批，待审批',
    createdAt: '2026-06-14 09:00',
    createdBy: '生产计划部-李明',
  },
];

// ================================================================
// Mock 数据 - 生产工单
// ================================================================
export const mockWorkOrders: WorkOrder[] = [
  // 南京工厂 - WO001（已完成批次）
  {
    id: 'WO001',
    woNo: 'WO-20260601-001',
    poId: 'PO001', poNo: 'MO-20260601-001',
    batchNo: 'TMJ-VITC-20260601-001',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/粒 × 60粒/瓶',
    bomVersion: 'V2.0',
    routingCode: 'TMJ-VITC-WG-V20',
    routingName: 'VitC咀嚼片湿法制粒工艺路径',
    planQty: 100000,
    actualQty: 99680,
    scrapQty: 320,
    status: 'COMPLETED',
    priority: 'HIGH',
    releaseTime: '2026-06-01 08:00',
    planStart: '2026-06-01 08:00',
    planEnd: '2026-06-03 20:00',
    actualStart: '2026-06-01 08:30',
    actualEnd: '2026-06-03 18:45',
    currentOp: 'OP-95',
    currentStage: 'S9-放行',
    progressPct: 100,
    createdAt: '2026-05-29 10:00',
    createdBy: '生产计划部-李明',
    remark: '首批次，已放行入库',
  },
  // 南京工厂 - WO002（进行中批次）
  {
    id: 'WO002',
    woNo: 'WO-20260605-001',
    poId: 'PO002', poNo: 'MO-20260605-001',
    batchNo: 'TMJ-VITC-20260605-002',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/粒 × 60粒/瓶',
    bomVersion: 'V2.0',
    routingCode: 'TMJ-VITC-WG-V20',
    routingName: 'VitC咀嚼片湿法制粒工艺路径',
    planQty: 200000,
    actualQty: 75000,
    scrapQty: 180,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    releaseTime: '2026-06-05 07:30',
    planStart: '2026-06-05 08:00',
    planEnd: '2026-06-10 20:00',
    actualStart: '2026-06-05 08:00',
    currentOp: 'OP-50',
    currentStage: 'S5-包衣',
    progressPct: 62,
    createdAt: '2026-06-03 14:30',
    createdBy: '生产计划部-李明',
    remark: '大批量生产，分两段压片',
  },
  // 南京工厂 - WO003（已下发待开始）
  {
    id: 'WO003',
    woNo: 'WO-20260610-001',
    poId: 'PO003', poNo: 'MO-20260610-001',
    batchNo: 'TMJ-VITC-20260610-003',
    productCode: 'FG-VITC-250MG-BTL',
    productName: '维生素C咀嚼片',
    productSpec: '250mg/粒 × 100粒/瓶',
    bomVersion: 'V1.0',
    routingCode: 'TMJ-VITC-DC-V10',
    routingName: 'VitC咀嚼片直压工艺路径',
    planQty: 50000,
    status: 'RELEASED',
    priority: 'NORMAL',
    releaseTime: '2026-06-10 10:00',
    planStart: '2026-06-13 08:00',
    planEnd: '2026-06-17 20:00',
    progressPct: 0,
    createdAt: '2026-06-08 16:30',
    createdBy: '生产计划部-王芳',
    remark: '直压工艺，首批次验证',
  },
  // 溧水工厂 - WO004（已完成）
  {
    id: 'WO004',
    woNo: 'WO-20260601-002',
    poId: 'PO004', poNo: 'MO-20260601-002',
    batchNo: 'TMJ-PROBIO-20260601-001',
    productCode: 'FG-PROBIO-CAP-250',
    productName: '复合益生菌胶囊',
    productSpec: '250mg/粒 × 30粒/盒',
    bomVersion: 'V1.5',
    routingCode: 'TMJ-PROBIO-CAP-V15',
    routingName: '益生菌胶囊冷链工艺路径',
    planQty: 30000,
    actualQty: 29880,
    scrapQty: 120,
    status: 'COMPLETED',
    priority: 'URGENT',
    releaseTime: '2026-06-01 07:00',
    planStart: '2026-06-01 08:00',
    planEnd: '2026-06-05 18:00',
    actualStart: '2026-06-01 08:00',
    actualEnd: '2026-06-05 16:30',
    currentOp: 'OP-90',
    currentStage: 'S7-放行',
    progressPct: 100,
    createdAt: '2026-05-26 09:30',
    createdBy: '生产计划部-李明',
    remark: '冷链全程≤8℃，已完成放行',
  },
  // 溧水工厂 - WO005（进行中）
  {
    id: 'WO005',
    woNo: 'WO-20260612-001',
    poId: 'PO005', poNo: 'MO-20260612-001',
    batchNo: 'TMJ-PROBIO-20260612-002',
    productCode: 'FG-PROBIO-CAP-250',
    productName: '复合益生菌胶囊',
    productSpec: '250mg/粒 × 30粒/盒',
    bomVersion: 'V1.5',
    routingCode: 'TMJ-PROBIO-CAP-V15',
    routingName: '益生菌胶囊冷链工艺路径',
    planQty: 60000,
    actualQty: 12000,
    scrapQty: 60,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    releaseTime: '2026-06-12 08:00',
    planStart: '2026-06-12 08:00',
    planEnd: '2026-06-20 18:00',
    actualStart: '2026-06-12 08:00',
    currentOp: 'OP-40',
    currentStage: 'S3-充填',
    progressPct: 35,
    createdAt: '2026-06-10 11:30',
    createdBy: '生产计划部-王芳',
    remark: '溧水工厂第二批次，增量生产',
  },
];

// ================================================================
// Mock 数据 - 生产任务单（工业PAD执行单元）
// ================================================================
export const mockTaskOrders: TaskOrder[] = [
  // WO002 进行中批次的任务单（南京）
  {
    id: 'TK001',
    taskNo: 'TK-20260605-001-D1',
    woId: 'WO002', woNo: 'WO-20260605-001',
    batchNo: 'TMJ-VITC-20260605-002',
    workCenter: 'WS-NJ-WEIGH',
    shiftId: 'SH01', shiftName: '白班',
    team: '南京甲班', teamId: 'TM01',
    operator: '陈国华', operatorId: 'OP001',
    stationScope: '称量配料（OP-10）',
    stepIds: ['RS01'],
    planQty: 200000,
    reportQty: 200000,
    planStart: '2026-06-05 08:00', planEnd: '2026-06-05 10:00',
    actualStart: '2026-06-05 08:05', actualEnd: '2026-06-05 09:52',
    status: 'DONE',
    padStation: 'PAD-NJ-WEIGH-01',
    equipIds: ['EQ009'],
    currentOpNo: 'OP-10',
    remark: '已完成称量，物料已转移至制粒间',
  },
  {
    id: 'TK002',
    taskNo: 'TK-20260605-001-D2',
    woId: 'WO002', woNo: 'WO-20260605-001',
    batchNo: 'TMJ-VITC-20260605-002',
    workCenter: 'WS-NJ-SOLID',
    shiftId: 'SH01', shiftName: '白班',
    team: '南京甲班', teamId: 'TM01',
    operator: '陈国华', operatorId: 'OP001',
    stationScope: '制粒→干燥→整粒→总混（OP-20至OP-35）',
    stepIds: ['RS02','RS03','RS04','RS05'],
    planQty: 200000,
    reportQty: 199500,
    scrapQty: 180,
    planStart: '2026-06-05 10:00', planEnd: '2026-06-06 20:00',
    actualStart: '2026-06-05 10:00', actualEnd: '2026-06-06 19:30',
    status: 'DONE',
    padStation: 'PAD-NJ-SOLID-01',
    equipIds: ['EQ001','EQ002','EQ003','EQ004'],
    currentOpNo: 'OP-35',
    remark: '湿粒干燥LOD=1.8%，整粒80目通过率97.5%',
  },
  {
    id: 'TK003',
    taskNo: 'TK-20260607-001-D1',
    woId: 'WO002', woNo: 'WO-20260605-001',
    batchNo: 'TMJ-VITC-20260605-002',
    workCenter: 'WS-NJ-SOLID',
    shiftId: 'SH01', shiftName: '白班',
    team: '南京甲班', teamId: 'TM01',
    operator: '周浩然', operatorId: 'OP007',
    stationScope: '压片（OP-40）',
    stepIds: ['RS06'],
    planQty: 200000,
    reportQty: 75000,
    planStart: '2026-06-07 08:00', planEnd: '2026-06-09 20:00',
    actualStart: '2026-06-07 08:00',
    status: 'IN_PROGRESS',
    padStation: 'PAD-NJ-SOLID-02',
    equipIds: ['EQ005'],
    currentOpNo: 'OP-40',
    deviationFlag: false,
    remark: '压片机参数：压力8.5kN，转速35rpm',
  },
  {
    id: 'TK004',
    taskNo: 'TK-20260605-002-D1',
    woId: 'WO002', woNo: 'WO-20260605-001',
    batchNo: 'TMJ-VITC-20260605-002',
    workCenter: 'WS-NJ-QC',
    shiftId: 'SH01', shiftName: '白班',
    team: '南京QC班', teamId: 'TM04',
    operator: '张丽华', operatorId: 'OP004',
    stationScope: '素片中检（OP-45）',
    stepIds: ['RS07'],
    planQty: 200000,
    planStart: '2026-06-09 08:00', planEnd: '2026-06-09 14:00',
    status: 'PENDING',
    padStation: 'PAD-NJ-QC-01',
    equipIds: ['EQ010'],
    remark: '等待压片完成后执行',
  },
  // WO005 进行中批次任务单（溧水）
  {
    id: 'TK005',
    taskNo: 'TK-20260612-001-D1',
    woId: 'WO005', woNo: 'WO-20260612-001',
    batchNo: 'TMJ-PROBIO-20260612-002',
    workCenter: 'WS-LS-PROBIO',
    shiftId: 'SH01', shiftName: '白班',
    team: '溧水甲班', teamId: 'TM05',
    operator: '李志远', operatorId: 'OP005',
    stationScope: '原料验收→低温称量（OP-10至OP-20）',
    stepIds: ['PB01','PB02'],
    planQty: 60000,
    reportQty: 60000,
    planStart: '2026-06-12 08:00', planEnd: '2026-06-12 14:00',
    actualStart: '2026-06-12 08:00', actualEnd: '2026-06-12 13:30',
    status: 'DONE',
    padStation: 'PAD-LS-PROBIO-01',
    equipIds: ['EQ016'],
    currentOpNo: 'OP-20',
    remark: '冷链物料接收，温度记录2.5℃，符合要求',
  },
  {
    id: 'TK006',
    taskNo: 'TK-20260612-001-D2',
    woId: 'WO005', woNo: 'WO-20260612-001',
    batchNo: 'TMJ-PROBIO-20260612-002',
    workCenter: 'WS-LS-PROBIO',
    shiftId: 'SH01', shiftName: '白班',
    team: '溧水甲班', teamId: 'TM05',
    operator: '钱文华', operatorId: 'OP017',
    stationScope: '低温混合→胶囊充填（OP-30至OP-40）',
    stepIds: ['PB03','PB04'],
    planQty: 60000,
    reportQty: 12000,
    scrapQty: 60,
    planStart: '2026-06-12 14:00', planEnd: '2026-06-15 20:00',
    actualStart: '2026-06-12 14:00',
    status: 'IN_PROGRESS',
    padStation: 'PAD-LS-PROBIO-01',
    equipIds: ['EQ013','EQ012'],
    currentOpNo: 'OP-40',
    deviationFlag: false,
    remark: '低温混合温度≤8℃，充填重量每小时抽检一次',
  },
];

// ================================================================
// Mock 数据 - 生产浮票（随批流转的实物标签）
// ================================================================
export const mockFloatTicketsV2: FloatTicketV2[] = [
  // WO001已完成批次浮票
  {
    id: 'FT001',
    ticketNo: 'FT-20260601-001-A',
    woId: 'WO001', woNo: 'WO-20260601-001',
    taskId: 'TK001', taskNo: 'TK-20260605-001-D1',
    batchNo: 'TMJ-VITC-20260601-001',
    qty: 50000,
    printTime: '2026-06-01 07:50',
    issueTime: '2026-06-01 08:00',
    returnTime: '2026-06-03 18:45',
    status: 'ARCHIVED',
    qrContent: '{"batchNo":"TMJ-VITC-20260601-001","woNo":"WO-20260601-001","qty":50000,"product":"维生素C咀嚼片","spec":"500mg×60粒","factory":"南京"}',
    currentStation: 'WS-NJ-WH',
    currentOp: 'OP-95',
    currentStageName: 'S9-放行',
    operatorName: '陈国华',
    lastUpdateTime: '2026-06-03 18:45',
  },
  {
    id: 'FT002',
    ticketNo: 'FT-20260601-001-B',
    woId: 'WO001', woNo: 'WO-20260601-001',
    batchNo: 'TMJ-VITC-20260601-001',
    qty: 50000,
    printTime: '2026-06-01 07:50',
    issueTime: '2026-06-01 08:00',
    returnTime: '2026-06-03 18:45',
    status: 'ARCHIVED',
    qrContent: '{"batchNo":"TMJ-VITC-20260601-001","woNo":"WO-20260601-001","qty":50000,"product":"维生素C咀嚼片","spec":"500mg×60粒","factory":"南京"}',
    currentStation: 'WS-NJ-WH',
    currentStageName: 'S9-放行',
    operatorName: '陈国华',
    lastUpdateTime: '2026-06-03 18:45',
  },
  // WO002进行中批次浮票
  {
    id: 'FT003',
    ticketNo: 'FT-20260605-001-A',
    woId: 'WO002', woNo: 'WO-20260605-001',
    taskId: 'TK003', taskNo: 'TK-20260607-001-D1',
    batchNo: 'TMJ-VITC-20260605-002',
    qty: 100000,
    printTime: '2026-06-05 07:50',
    issueTime: '2026-06-05 08:00',
    status: 'IN_USE',
    qrContent: '{"batchNo":"TMJ-VITC-20260605-002","woNo":"WO-20260605-001","qty":100000,"product":"维生素C咀嚼片","spec":"500mg×60粒","factory":"南京"}',
    currentStation: 'PAD-NJ-SOLID-02',
    currentOp: 'OP-40',
    currentStageName: 'S4-压片',
    operatorName: '周浩然',
    lastUpdateTime: '2026-06-07 08:00',
  },
  {
    id: 'FT004',
    ticketNo: 'FT-20260605-001-B',
    woId: 'WO002', woNo: 'WO-20260605-001',
    batchNo: 'TMJ-VITC-20260605-002',
    qty: 100000,
    printTime: '2026-06-05 07:50',
    issueTime: '2026-06-05 08:00',
    status: 'ISSUED',
    qrContent: '{"batchNo":"TMJ-VITC-20260605-002","woNo":"WO-20260605-001","qty":100000,"product":"维生素C咀嚼片","spec":"500mg×60粒","factory":"南京"}',
    currentStation: 'WS-NJ-WH',
    currentStageName: 'S1-称量',
    operatorName: '吴慧敏',
    lastUpdateTime: '2026-06-05 09:00',
  },
  // WO004溧水工厂已完成浮票
  {
    id: 'FT005',
    ticketNo: 'FT-20260601-002-A',
    woId: 'WO004', woNo: 'WO-20260601-002',
    batchNo: 'TMJ-PROBIO-20260601-001',
    qty: 30000,
    printTime: '2026-06-01 07:55',
    issueTime: '2026-06-01 08:00',
    returnTime: '2026-06-05 16:30',
    status: 'ARCHIVED',
    qrContent: '{"batchNo":"TMJ-PROBIO-20260601-001","woNo":"WO-20260601-002","qty":30000,"product":"复合益生菌胶囊","spec":"250mg×30粒","factory":"溧水","coldChain":"≤8℃"}',
    currentStation: 'WS-LS-WH',
    currentOp: 'OP-90',
    currentStageName: 'S7-放行',
    operatorName: '李志远',
    lastUpdateTime: '2026-06-05 16:30',
  },
  // WO005溧水工厂进行中浮票
  {
    id: 'FT006',
    ticketNo: 'FT-20260612-001-A',
    woId: 'WO005', woNo: 'WO-20260612-001',
    taskId: 'TK006', taskNo: 'TK-20260612-001-D2',
    batchNo: 'TMJ-PROBIO-20260612-002',
    qty: 60000,
    printTime: '2026-06-12 07:55',
    issueTime: '2026-06-12 08:00',
    status: 'IN_USE',
    qrContent: '{"batchNo":"TMJ-PROBIO-20260612-002","woNo":"WO-20260612-001","qty":60000,"product":"复合益生菌胶囊","spec":"250mg×30粒","factory":"溧水","coldChain":"≤8℃"}',
    currentStation: 'PAD-LS-PROBIO-01',
    currentOp: 'OP-40',
    currentStageName: 'S3-充填',
    operatorName: '钱文华',
    lastUpdateTime: '2026-06-12 14:00',
  },
];

// ================================================================
// Mock 数据 - EBR批记录（供PAD端展示）
// ================================================================
export const mockEBRRecords: EBRRecord[] = [
  // WO001已完成批次EBR
  {
    id: 'EBR001',
    ebrNo: 'EBR-20260601-001',
    woId: 'WO001', woNo: 'WO-20260601-001',
    batchNo: 'TMJ-VITC-20260601-001',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/粒 × 60粒/瓶',
    plannedQty: 100000, actualQty: 99680,
    status: 'APPROVED',
    createdAt: '2026-06-01 08:00',
    operations: [
      { opNo: 'OP-10', opName: '称量配料',     stage: 'S1-称量', workCenter: 'WS-NJ-WEIGH',  status: 'COMPLETED', startedAt: '2026-06-01 08:30', completedAt: '2026-06-01 09:45', operatorId: 'OP001', operatorName: '陈国华', reportQty: 100000, keyData: { 'VitC原料(kg)': 52.6, '木糖醇(kg)': 28.4, 'MCC(kg)': 12.0, '矫味剂(kg)': 3.2, '润滑剂(kg)': 1.5, '批量(kg)': 97.7 } },
      { opNo: 'OP-20', opName: '制粒（湿法）', stage: 'S2-制粒', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-01 10:00', completedAt: '2026-06-01 12:30', operatorId: 'OP001', operatorName: '陈国华', reportQty: 100000, keyData: { '黏合剂用量(mL)': 8200, '混合时间(min)': 15, '制粒转速(rpm)': 280 } },
      { opNo: 'OP-25', opName: '流化床干燥',   stage: 'S2-制粒', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-01 13:00', completedAt: '2026-06-01 16:45', operatorId: 'OP008', operatorName: '吴慧敏', reportQty: 100000, keyData: { '进风温度(℃)': 60, '出风温度(℃)': 42, 'LOD(%)': 1.8, '干燥时间(min)': 165 } },
      { opNo: 'OP-30', opName: '整粒过筛',     stage: 'S3-总混', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-01 17:00', completedAt: '2026-06-01 18:00', operatorId: 'OP007', operatorName: '周浩然', reportQty: 99800 },
      { opNo: 'OP-35', opName: '总混',         stage: 'S3-总混', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-02 08:00', completedAt: '2026-06-02 09:30', operatorId: 'OP001', operatorName: '陈国华', reportQty: 99800, keyData: { '混合时间(min)': 20, '转速(rpm)': 12, '含量均匀度RSD(%)': 1.2 } },
      { opNo: 'OP-40', opName: '压片',         stage: 'S4-压片', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-02 10:00', completedAt: '2026-06-03 08:00', operatorId: 'OP007', operatorName: '周浩然', reportQty: 99500, scrapQty: 300, keyData: { '主压力(kN)': 8.5, '转速(rpm)': 35, '平均片重(mg)': 502.3, '硬度(N)': 62, '脆碎度(%)': 0.15, '厚度(mm)': 4.8 } },
      { opNo: 'OP-45', opName: '素片中检',     stage: 'S4-压片', workCenter: 'WS-NJ-QC',     status: 'COMPLETED', startedAt: '2026-06-03 08:30', completedAt: '2026-06-03 11:00', operatorId: 'OP004', operatorName: '张丽华', reportQty: 99500, keyData: { 'VitC含量(mg/粒)': 498.6, '片重差异(%)': 1.8, '崩解时限(min)': 4.2, '结论': '合格' } },
      { opNo: 'OP-50', opName: '薄膜包衣',     stage: 'S5-包衣', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-03 11:30', completedAt: '2026-06-03 14:30', operatorId: 'OP008', operatorName: '吴慧敏', reportQty: 99500, keyData: { '包衣液浓度(%)': 12, '包衣增重(%)': 2.8, '进风温度(℃)': 55, '喷速(mL/min)': 35 } },
      { opNo: 'OP-60', opName: '内包装（铝塑）', stage: 'S6-内包', workCenter: 'WS-NJ-PACK', status: 'COMPLETED', startedAt: '2026-06-03 15:00', completedAt: '2026-06-03 17:00', operatorId: 'OP013', operatorName: '孙桂花', reportQty: 99680, scrapQty: 20, keyData: { '密封温度(℃)': 165, '速度(泡/min)': 45, '合格率(%)': 99.98 } },
      { opNo: 'OP-65', opName: '贴签',         stage: 'S6-内包', workCenter: 'WS-NJ-PACK',  status: 'COMPLETED', startedAt: '2026-06-03 17:00', completedAt: '2026-06-03 17:30', operatorId: 'OP013', operatorName: '孙桂花', reportQty: 99680 },
      { opNo: 'OP-70', opName: '外包装装盒',   stage: 'S7-外包', workCenter: 'WS-NJ-OUTERPACK', status: 'COMPLETED', startedAt: '2026-06-03 08:00', completedAt: '2026-06-03 09:30', operatorId: 'OP014', operatorName: '郑建军', reportQty: 99680 },
      { opNo: 'OP-80', opName: 'FQC成品检验', stage: 'S8-检验', workCenter: 'WS-NJ-QC',     status: 'COMPLETED', startedAt: '2026-06-03 09:30', completedAt: '2026-06-03 15:00', operatorId: 'OP015', operatorName: '冯小丽', reportQty: 99680, keyData: { 'VitC含量(mg/粒)': 497.8, '微生物总数(CFU/g)': '<10', '大肠菌群': '未检出', '外观': '合格', '包装完整性': '合格', '结论': '合格放行' } },
      { opNo: 'OP-90', opName: '质量放行',     stage: 'S9-放行', workCenter: 'WS-NJ-QC',     status: 'COMPLETED', startedAt: '2026-06-03 15:30', completedAt: '2026-06-03 16:00', operatorId: 'OP004', operatorName: '张丽华', reportQty: 99680, keyData: { '放行人': '张丽华', '放行证书编号': 'REL-20260603-001' } },
      { opNo: 'OP-95', opName: '成品入库',     stage: 'S9-放行', workCenter: 'WS-NJ-WH',     status: 'COMPLETED', startedAt: '2026-06-03 16:30', completedAt: '2026-06-03 18:45', operatorId: 'OP001', operatorName: '陈国华', reportQty: 99680 },
    ],
  },
  // WO002进行中批次EBR
  {
    id: 'EBR002',
    ebrNo: 'EBR-20260605-001',
    woId: 'WO002', woNo: 'WO-20260605-001',
    batchNo: 'TMJ-VITC-20260605-002',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/粒 × 60粒/瓶',
    plannedQty: 200000, actualQty: 75000,
    status: 'IN_PROGRESS',
    createdAt: '2026-06-05 08:00',
    operations: [
      { opNo: 'OP-10', opName: '称量配料',     stage: 'S1-称量', workCenter: 'WS-NJ-WEIGH',  status: 'COMPLETED', startedAt: '2026-06-05 08:05', completedAt: '2026-06-05 09:52', operatorId: 'OP007', operatorName: '周浩然', reportQty: 200000, keyData: { 'VitC原料(kg)': 105.2, '木糖醇(kg)': 56.8, 'MCC(kg)': 24.0, '矫味剂(kg)': 6.4, '润滑剂(kg)': 3.0, '批量(kg)': 195.4 } },
      { opNo: 'OP-20', opName: '制粒（湿法）', stage: 'S2-制粒', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-05 10:00', completedAt: '2026-06-05 13:00', operatorId: 'OP001', operatorName: '陈国华', reportQty: 200000, keyData: { '黏合剂用量(mL)': 16400, '混合时间(min)': 18, '制粒转速(rpm)': 280 } },
      { opNo: 'OP-25', opName: '流化床干燥',   stage: 'S2-制粒', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-05 13:30', completedAt: '2026-06-06 08:30', operatorId: 'OP002', operatorName: '王建平', reportQty: 200000, keyData: { '进风温度(℃)': 60, '出风温度(℃)': 43, 'LOD(%)': 1.9, '干燥时间(min)': 295 } },
      { opNo: 'OP-30', opName: '整粒过筛',     stage: 'S3-总混', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-06 09:00', completedAt: '2026-06-06 10:30', operatorId: 'OP002', operatorName: '王建平', reportQty: 199820 },
      { opNo: 'OP-35', opName: '总混',         stage: 'S3-总混', workCenter: 'WS-NJ-SOLID',  status: 'COMPLETED', startedAt: '2026-06-06 11:00', completedAt: '2026-06-06 12:00', operatorId: 'OP001', operatorName: '陈国华', reportQty: 199820, keyData: { '混合时间(min)': 20, '转速(rpm)': 12, '含量均匀度RSD(%)': 1.4 } },
      { opNo: 'OP-40', opName: '压片',         stage: 'S4-压片', workCenter: 'WS-NJ-SOLID',  status: 'IN_PROGRESS', startedAt: '2026-06-07 08:00', operatorId: 'OP007', operatorName: '周浩然', reportQty: 75000, keyData: { '主压力(kN)': 8.5, '转速(rpm)': 35, '平均片重(mg)': 501.8, '硬度(N)': 61 } },
      { opNo: 'OP-45', opName: '素片中检',     stage: 'S4-压片', workCenter: 'WS-NJ-QC',     status: 'PENDING' },
      { opNo: 'OP-50', opName: '薄膜包衣',     stage: 'S5-包衣', workCenter: 'WS-NJ-SOLID',  status: 'PENDING' },
      { opNo: 'OP-60', opName: '内包装（铝塑）', stage: 'S6-内包', workCenter: 'WS-NJ-PACK', status: 'PENDING' },
      { opNo: 'OP-65', opName: '贴签',         stage: 'S6-内包', workCenter: 'WS-NJ-PACK',   status: 'PENDING' },
      { opNo: 'OP-70', opName: '外包装装盒',   stage: 'S7-外包', workCenter: 'WS-NJ-OUTERPACK', status: 'PENDING' },
      { opNo: 'OP-80', opName: 'FQC成品检验', stage: 'S8-检验', workCenter: 'WS-NJ-QC',     status: 'PENDING' },
      { opNo: 'OP-90', opName: '质量放行',     stage: 'S9-放行', workCenter: 'WS-NJ-QC',     status: 'PENDING' },
      { opNo: 'OP-95', opName: '成品入库',     stage: 'S9-放行', workCenter: 'WS-NJ-WH',     status: 'PENDING' },
    ],
  },
  // WO004溧水益生菌EBR（已批准）
  {
    id: 'EBR003',
    ebrNo: 'EBR-20260601-002',
    woId: 'WO004', woNo: 'WO-20260601-002',
    batchNo: 'TMJ-PROBIO-20260601-001',
    productCode: 'FG-PROBIO-CAP-250',
    productName: '复合益生菌胶囊',
    productSpec: '250mg/粒 × 30粒/盒',
    plannedQty: 30000, actualQty: 29880,
    status: 'APPROVED',
    createdAt: '2026-06-01 08:00',
    operations: [
      { opNo: 'OP-10', opName: '原料接收验收', stage: 'S1-备料', workCenter: 'WS-LS-WH',     status: 'COMPLETED', startedAt: '2026-06-01 08:00', completedAt: '2026-06-01 09:30', operatorId: 'OP005', operatorName: '李志远', reportQty: 30000, keyData: { '嗜酸乳杆菌(g)': 180, '双歧杆菌(g)': 120, '鼠李糖乳杆菌(g)': 90, 'FOS(g)': 3000, 'MCC(g)': 4200, '接收温度(℃)': 2.5 } },
      { opNo: 'OP-20', opName: '低温称量配料', stage: 'S1-备料', workCenter: 'WS-LS-PROBIO', status: 'COMPLETED', startedAt: '2026-06-01 10:00', completedAt: '2026-06-01 11:30', operatorId: 'OP005', operatorName: '李志远', reportQty: 30000, keyData: { '操作温度(℃)': 5.2, '活菌配比': 'LA:BB:LR=2:1:1' } },
      { opNo: 'OP-30', opName: '混合（冷链≤8℃）', stage: 'S2-混合', workCenter: 'WS-LS-PROBIO', status: 'COMPLETED', startedAt: '2026-06-01 13:00', completedAt: '2026-06-01 15:30', operatorId: 'OP017', operatorName: '钱文华', reportQty: 30000, keyData: { '混合温度(℃)': 6.8, '混合时间(min)': 20, '活菌均匀度RSD(%)': 2.1 } },
      { opNo: 'OP-40', opName: '胶囊充填',     stage: 'S3-充填', workCenter: 'WS-LS-PROBIO', status: 'COMPLETED', startedAt: '2026-06-02 08:00', completedAt: '2026-06-03 18:00', operatorId: 'OP017', operatorName: '钱文华', reportQty: 29950, scrapQty: 50, keyData: { '充填重量(mg)': 248.5, '充填精度(%)': 99.5, '环境温度(℃)': 7.2, '活菌数(CFU/粒)': '≥1.2×10⁹' } },
      { opNo: 'OP-45', opName: '充填中检',     stage: 'S3-充填', workCenter: 'WS-LS-QC',     status: 'COMPLETED', startedAt: '2026-06-03 08:30', completedAt: '2026-06-03 11:00', operatorId: 'OP006', operatorName: '赵雪梅', reportQty: 29950, keyData: { '活菌数(CFU/粒)': '1.35×10⁹', '外观检查': '合格', '重量差异(%)': 1.8, '结论': '合格' } },
      { opNo: 'OP-50', opName: '铝塑泡罩包装', stage: 'S4-内包', workCenter: 'WS-LS-PACK',   status: 'COMPLETED', startedAt: '2026-06-04 08:00', completedAt: '2026-06-04 18:00', operatorId: 'OP018', operatorName: '沈美萍', reportQty: 29880, scrapQty: 70, keyData: { '封合温度(℃)': 175, '速度(泡/min)': 30, '密封性合格率(%)': 99.8 } },
      { opNo: 'OP-60', opName: '外包装装盒',   stage: 'S5-外包', workCenter: 'WS-LS-OUTERPACK', status: 'COMPLETED', startedAt: '2026-06-04 08:00', completedAt: '2026-06-04 14:00', operatorId: 'OP019', operatorName: '韩建国', reportQty: 29880 },
      { opNo: 'OP-70', opName: 'FQC成品检验', stage: 'S6-检验', workCenter: 'WS-LS-QC',     status: 'COMPLETED', startedAt: '2026-06-04 14:30', completedAt: '2026-06-05 12:00', operatorId: 'OP020', operatorName: '杨芸', reportQty: 29880, keyData: { '活菌数(CFU/粒)': '1.28×10⁹', '大肠菌群': '未检出', '沙门氏菌': '未检出', '外观': '合格', '包装完整性': '合格', '结论': '合格放行' } },
      { opNo: 'OP-80', opName: '质量放行',     stage: 'S7-放行', workCenter: 'WS-LS-QC',     status: 'COMPLETED', startedAt: '2026-06-05 13:00', completedAt: '2026-06-05 14:00', operatorId: 'OP006', operatorName: '赵雪梅', reportQty: 29880, keyData: { '放行人': '赵雪梅', '放行证书编号': 'REL-20260605-002', '存储条件': '2~8℃冷藏' } },
      { opNo: 'OP-90', opName: '冷链入库（≤8℃）', stage: 'S7-放行', workCenter: 'WS-LS-WH', status: 'COMPLETED', startedAt: '2026-06-05 14:30', completedAt: '2026-06-05 16:30', operatorId: 'OP005', operatorName: '李志远', reportQty: 29880, keyData: { '入库温度(℃)': 3.8, '库位': 'LS-WH-COLD-A3' } },
    ],
  },
];

// ── 成品物料目录（供生产订单/工单新建时下拉选择） ─────────────────
export interface FinishedGood {
  code: string;
  name: string;
  spec: string;
  seriesCode: string;
  defaultRouting: string;
  defaultBom: string;
  unit: string;
  packSpec: string;    // 包装规格
  price: number;       // 参考单价（元/瓶或元/盒）
}

export const FINISHED_GOODS: FinishedGood[] = [
  // 南京工厂 - VitC系列
  {
    code: 'FG-VITC-500MG-AP',
    name: '维生素C咀嚼片（500mg铝塑）',
    spec: '500mg/粒 × 60粒/瓶',
    seriesCode: 'PS-VITC',
    defaultRouting: 'TMJ-VITC-WG-V20',
    defaultBom: 'V2.0',
    unit: '粒',
    packSpec: '60粒/瓶',
    price: 28.80,
  },
  {
    code: 'FG-VITC-250MG-BTL',
    name: '维生素C咀嚼片（250mg瓶装）',
    spec: '250mg/粒 × 100粒/瓶',
    seriesCode: 'PS-VITC',
    defaultRouting: 'TMJ-VITC-DC-V10',
    defaultBom: 'V1.0',
    unit: '粒',
    packSpec: '100粒/瓶',
    price: 19.90,
  },
  {
    code: 'FG-VITC-1000MG-BTL',
    name: '维生素C泡腾片（1000mg）',
    spec: '1000mg/粒 × 20粒/管',
    seriesCode: 'PS-VITC',
    defaultRouting: 'TMJ-VITC-WG-V20',
    defaultBom: 'V1.5',
    unit: '粒',
    packSpec: '20粒/管',
    price: 35.00,
  },
  // 溧水工厂 - 益生菌系列
  {
    code: 'FG-PROBIO-CAP-250',
    name: '复合益生菌胶囊',
    spec: '250mg/粒（活菌数≥1×10⁹CFU/粒）× 30粒/盒',
    seriesCode: 'PS-PROBIO',
    defaultRouting: 'TMJ-PROBIO-CAP-V15',
    defaultBom: 'V1.5',
    unit: '粒',
    packSpec: '30粒/盒',
    price: 68.00,
  },
  {
    code: 'FG-PROBIO-PWD-2G',
    name: '婴幼儿益生菌粉',
    spec: '2g/袋（活菌数≥5×10⁸CFU/袋）× 30袋/盒',
    seriesCode: 'PS-PROBIO',
    defaultRouting: 'TMJ-PROBIO-CAP-V15',
    defaultBom: 'V1.0',
    unit: '袋',
    packSpec: '30袋/盒',
    price: 88.00,
  },
  // 南京工厂 - 胶原蛋白系列
  {
    code: 'FG-COLLA-GUM-500',
    name: '胶原蛋白软糖',
    spec: '500mg/粒 × 20粒/袋',
    seriesCode: 'PS-COLLA',
    defaultRouting: 'TMJ-VITC-WG-V20',
    defaultBom: 'V1.0',
    unit: '粒',
    packSpec: '20粒/袋',
    price: 42.00,
  },
];

// ── 生产订单明细行（多规格订单） ────────────────────────────────────
export interface POLineItem {
  lineNo: number;
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
  // 南京工厂
  'WS-NJ-WEIGH',    // 称量配料间
  'WS-NJ-SOLID',    // 固体制剂车间
  'WS-NJ-QC',       // QC检验室（南京）
  'WS-NJ-PACK',     // 内包装车间
  'WS-NJ-OUTERPACK',// 外包装车间
  'WS-NJ-WH',       // 仓储区
  // 溧水工厂
  'WS-LS-PROBIO',   // 益生菌充填车间
  'WS-LS-QC',       // QC检验室（溧水）
  'WS-LS-PACK',     // 包装车间（溧水）
  'WS-LS-OUTERPACK',// 外包装车间（溧水）
  'WS-LS-WH',       // 冷链仓储
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

/** 生成批号：天美健 + 产品类型 + 日期 + 序号 */
export const genBatchNo = (productCode: string, dateStr: string, seq: number): string => {
  const prefix = productCode.includes('PROBIO') ? 'TMJ-PROBIO' :
                 productCode.includes('VITC')   ? 'TMJ-VITC' :
                 productCode.includes('COLLA')  ? 'TMJ-COLLA' : 'TMJ-HLTH';
  return `${prefix}-${dateStr}-${String(seq).padStart(3, '0')}`;
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
