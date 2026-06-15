/**
 * 浮动排程（FSE）模块 — 完整Store & Mock数据
 * 天美健保健品MES — MES-FSE-001  PRD v1.0
 * 覆盖：约束引擎 / 清场规则 / 相似产品判定 / 资源日历 / 班次 / EDD算法 / 版本管理
 */

// ═══════════════════════════════════════════════════════════════
// 1. 基础枚举与类型
// ═══════════════════════════════════════════════════════════════
export type WoStatus        = 'PENDING'|'SCHEDULED'|'RELEASED'|'RUNNING'|'PAUSED'|'COMPLETED'|'CANCELLED';
export type ResourceStatus  = 'AVAILABLE'|'OCCUPIED'|'MAINTENANCE'|'BREAKDOWN'|'CLEANING'|'OFFLINE';
export type ScheduleItemStatus = 'PRODUCING'|'WAITING'|'CLEANING'|'QC_HOLD'|'ABNORMAL'|'COMPLETED'|'LOCKED';
export type CleanStatus     = 'PENDING'|'IN_PROGRESS'|'COMPLETED'|'FAILED';
export type CleanType       = 'NONE'|'LIGHT'|'STANDARD'|'DEEP';
export type ViewMode        = 'day'|'week'|'biweek';
export type TimeZone        = 'HISTORY'|'FROZEN'|'ROLLING'|'OUTLOOK';
export type CleanRoomLevel  = 'D级'|'C级'|'B级'|'A级';
export type Factory         = 'NJ'|'LS';
export type ConstraintLevel = 'HARD'|'SOFT';
export type ConstraintType  =
  | 'MATERIAL_RELEASE'|'EQUIPMENT_CAPACITY'|'EQUIPMENT_OCCUPATION'
  | 'CLEANING_REQUIRED'|'QUALIFICATION'|'CLEAN_ROOM_LEVEL'
  | 'CHANGEOVER_TIME'|'SIMILAR_PRODUCT'|'SHIFT_BOUNDARY';
export type EventType =
  | 'QC_FAIL'|'QC_HOLD'|'EQUIPMENT_FAULT'|'INSERT_ORDER'
  | 'MATERIAL_DELAY'|'STAFF_ABSENCE'|'MANUAL_ADJUST';

// ═══════════════════════════════════════════════════════════════
// 2. 班次 & 资源日历
// ═══════════════════════════════════════════════════════════════
export interface Shift {
  id: string;
  name: string;
  startHour: number;   // 0-23
  endHour: number;
  durationH: number;
}

export interface CalendarException {
  date: string;       // YYYY-MM-DD
  type: 'HOLIDAY'|'MAINTENANCE'|'BREAKDOWN'|'EXTRA_SHIFT';
  note: string;
  affectedResourceIds?: string[];
}

export interface ResourceCalendar {
  id: string;
  name: string;
  workDays: number[];  // 0=日,1=一...6=六
  shifts: Shift[];
  exceptions: CalendarException[];
}

export const SHIFT_DEFS: Record<string, Shift[]> = {
  'TWO_SHIFT': [
    { id: 'S1', name: '白班', startHour: 8,  endHour: 16, durationH: 8 },
    { id: 'S2', name: '中班', startHour: 16, endHour: 24, durationH: 8 },
  ],
  'ONE_SHIFT': [
    { id: 'S1', name: '白班', startHour: 8, endHour: 16, durationH: 8 },
  ],
  'THREE_SHIFT': [
    { id: 'S1', name: '早班', startHour: 6,  endHour: 14, durationH: 8 },
    { id: 'S2', name: '中班', startHour: 14, endHour: 22, durationH: 8 },
    { id: 'S3', name: '晚班', startHour: 22, endHour: 30, durationH: 8 }, // 30=次日6点
  ],
};

export const MOCK_CALENDARS: ResourceCalendar[] = [
  {
    id: 'CAL-NJ-STD',
    name: '南京标准日历（双班）',
    workDays: [1,2,3,4,5,6],
    shifts: SHIFT_DEFS['TWO_SHIFT'],
    exceptions: [
      { date: '2026-06-15', type: 'MAINTENANCE', note: '南京固体制剂车间季度预防性维护', affectedResourceIds: ['R-NJ-SOLID'] },
    ],
  },
  {
    id: 'CAL-NJ-QC',
    name: '南京QC日历（单班）',
    workDays: [1,2,3,4,5],
    shifts: SHIFT_DEFS['ONE_SHIFT'],
    exceptions: [],
  },
  {
    id: 'CAL-LS-COLDCHAIN',
    name: '溧水冷链日历（单班）',
    workDays: [1,2,3,4,5],
    shifts: SHIFT_DEFS['ONE_SHIFT'],
    exceptions: [
      { date: '2026-06-16', type: 'EXTRA_SHIFT', note: '溧水益生菌赶单加班', affectedResourceIds: ['R-LS-PROBIO'] },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// 3. 约束规则定义
// ═══════════════════════════════════════════════════════════════
export interface ConstraintRule {
  id: string;
  type: ConstraintType;
  level: ConstraintLevel;
  name: string;
  description: string;
  enabled: boolean;
  /** 权重（软约束用于评分） */
  weight: number;
  /** 规则逻辑描述（展示用） */
  ruleLogic: string;
  errorMessage: string;
  suggestion?: string;
}

export const CONSTRAINT_RULES: ConstraintRule[] = [
  {
    id: 'CR-001', type: 'MATERIAL_RELEASE', level: 'HARD', name: '物料放行约束', enabled: true, weight: 999,
    description: '原料/辅料必须IQC合格，中间体必须QC放行后方可投入下一工序',
    ruleLogic: 'IF material.status != "RELEASED" THEN BLOCK',
    errorMessage: '物料未放行，不可排程',
    suggestion: '请在LIMS中完成物料检验并放行',
  },
  {
    id: 'CR-002', type: 'EQUIPMENT_CAPACITY', level: 'HARD', name: '设备产能约束', enabled: true, weight: 999,
    description: '设备类型、产能、模具必须与工序要求匹配',
    ruleLogic: 'IF resource.capacity < operation.requiredCapacity THEN BLOCK',
    errorMessage: '设备产能不满足工序需求',
    suggestion: '请选择产能更大的设备或拆分批次',
  },
  {
    id: 'CR-003', type: 'EQUIPMENT_OCCUPATION', level: 'HARD', name: '设备占用约束', enabled: true, weight: 999,
    description: '同一设备同一时刻只能执行一个工序（无时间重叠）',
    ruleLogic: 'IF resource.timeline overlaps(newTask) THEN BLOCK',
    errorMessage: '设备时间冲突，存在时间重叠',
    suggestion: '请将任务调整到设备空闲时段',
  },
  {
    id: 'CR-004', type: 'CLEANING_REQUIRED', level: 'HARD', name: '清场约束', enabled: true, weight: 999,
    description: '批次切换时强制插入清场时间，同品种换批需≥30分钟，不同品种需≥60分钟，相似产品≥120分钟深度清场',
    ruleLogic: 'IF prevProduct != currentProduct THEN insert_cleaning(type=DEEP, duration=120)',
    errorMessage: '批次切换缺少清场时间',
    suggestion: '系统将自动在批次间插入清场任务',
  },
  {
    id: 'CR-005', type: 'QUALIFICATION', level: 'HARD', name: '人员资质约束', enabled: true, weight: 999,
    description: '操作员须持有对应剂型/工序操作证，QA验证须具备GMP认证资格',
    ruleLogic: 'IF operator.certificates NOT includes operation.requiredCert THEN BLOCK',
    errorMessage: '操作员资质不满足工序要求',
    suggestion: '请安排具备相应资质的操作员',
  },
  {
    id: 'CR-006', type: 'CLEAN_ROOM_LEVEL', level: 'HARD', name: '洁净区约束', enabled: true, weight: 999,
    description: '工序洁净级别要求不能高于资源实际洁净级别（A>B>C>D）',
    ruleLogic: 'IF operation.cleanRoomRequired > resource.cleanRoomLevel THEN BLOCK',
    errorMessage: '洁净区级别不满足工序要求',
    suggestion: '请将工序分配到符合洁净级别的车间',
  },
  {
    id: 'CR-007', type: 'SIMILAR_PRODUCT', level: 'HARD', name: '相似产品防混排', enabled: true, weight: 999,
    description: '外观/气味/剂型相似产品在同一设备上切换时，强制深度清场（120min）并需QA现场确认',
    ruleLogic: 'IF isSimilarProduct(prev, curr) THEN deepClean + QA_required',
    errorMessage: '相似产品切换须执行深度清场（120分钟）',
    suggestion: '安排QA现场监督清场并签字确认',
  },
  {
    id: 'CR-008', type: 'SHIFT_BOUNDARY', level: 'HARD', name: '班次边界约束', enabled: true, weight: 500,
    description: '工序不可跨班次连续执行（换班须交接并记录），若工序时长超过单班，须拆分或申请连续生产',
    ruleLogic: 'IF task.endTime > shift.endTime AND task.duration > shift.duration THEN WARN',
    errorMessage: '工序跨越班次边界，请确认交接安排',
    suggestion: '建议拆分工序或申请连续生产审批',
  },
  {
    id: 'CR-009', type: 'MATERIAL_RELEASE', level: 'SOFT', name: '交货期约束（EDD）', enabled: true, weight: 100,
    description: '优先安排交货期最早的工单（EDD原则），交货期越紧迫优先级越高',
    ruleLogic: 'SORT BY dueDate ASC',
    errorMessage: '工单存在交货期风险',
    suggestion: '调整排序优先级或协商交货期',
  },
  {
    id: 'CR-010', type: 'CHANGEOVER_TIME', level: 'SOFT', name: '连续生产偏好', enabled: true, weight: 50,
    description: '相同产品在同一设备上连续生产可减少清场时间，排程时优先安排同品种连续',
    ruleLogic: 'PREFER prevProduct == currentProduct',
    errorMessage: '可通过调整顺序实现连续生产，节省清场时间',
    suggestion: '将同品种工单排在相邻时段，减少换产',
  },
];

// ═══════════════════════════════════════════════════════════════
// 4. 清场规则
// ═══════════════════════════════════════════════════════════════
export interface CleaningRule {
  type: CleanType;
  label: string;
  durationMinutes: number;
  requireQA: boolean;
  requirePhoto: boolean;
  steps: string[];
  color: string;
}

export const CLEANING_RULES: Record<CleanType, CleaningRule> = {
  NONE: {
    type: 'NONE', label: '无需清场', durationMinutes: 0,
    requireQA: false, requirePhoto: false, color: '#52c41a',
    steps: [],
  },
  LIGHT: {
    type: 'LIGHT', label: '轻度清场（同品种换批）', durationMinutes: 30,
    requireQA: false, requirePhoto: true, color: '#1890ff',
    steps: [
      '清除上批剩余物料及废弃包材',
      '设备表面擦拭（无可见残留）',
      '更换批次标识牌',
      '操作员自检签字',
    ],
  },
  STANDARD: {
    type: 'STANDARD', label: '标准清场（不同品种）', durationMinutes: 60,
    requireQA: false, requirePhoto: true, color: '#faad14',
    steps: [
      '清除上批所有物料及废弃包材',
      '设备拆卸清洁（接触面、密封圈）',
      '环境擦拭（地面、墙面、顶棚）',
      '清洁记录填写',
      '操作员自检并填写清场记录单',
      '线长/班长复核签字',
    ],
  },
  DEEP: {
    type: 'DEEP', label: '深度清场（相似产品/跨品类）', durationMinutes: 120,
    requireQA: true, requirePhoto: true, color: '#f5222d',
    steps: [
      '完整拆卸设备所有接触部件',
      '清洁剂浸泡（≥30分钟）',
      '纯化水冲洗三遍（末次用注射用水）',
      '棉签取样（清洁验证）送QC检测',
      '环境消毒（75%乙醇擦拭）',
      '沉降菌培养皿放置（培养48h）',
      '清场记录完整填写',
      '操作员签字 + 线长复核',
      'QA现场审查并签字确认',
      '等待QC清洁验证结果（≥4小时）',
    ],
  },
};

/** 相似产品判定 */
export interface SimilarProductRule {
  productA: string;
  productB: string;
  reason: string;
  requiredCleanType: CleanType;
}

export const SIMILAR_PRODUCT_RULES: SimilarProductRule[] = [
  { productA: 'VITC-500', productB: 'VITC-250', reason: '同品种不同规格，外观相似，需标准清场', requiredCleanType: 'STANDARD' },
  { productA: 'VITC-500', productB: 'PROBIO-250', reason: '不同品类，冷链/常温差异，需深度清场', requiredCleanType: 'DEEP' },
  { productA: 'VITC-250', productB: 'PROBIO-250', reason: '不同品类，需深度清场', requiredCleanType: 'DEEP' },
];

/** 计算两产品间所需清场类型 */
export function getCleanType(prevCode: string, nextCode: string): CleanType {
  if (!prevCode || prevCode === nextCode) return 'NONE';
  // 查相似产品规则
  const rule = SIMILAR_PRODUCT_RULES.find(r =>
    (r.productA === prevCode && r.productB === nextCode) ||
    (r.productB === prevCode && r.productA === nextCode)
  );
  if (rule) return rule.requiredCleanType;
  // 同类别（都是VitC）→ 标准清场
  if (prevCode.startsWith('VITC') && nextCode.startsWith('VITC')) return 'STANDARD';
  // 跨类别 → 深度清场
  return 'DEEP';
}

/** 清场时长（分钟） */
export function getCleanDurationMinutes(prevCode: string, nextCode: string): number {
  return CLEANING_RULES[getCleanType(prevCode, nextCode)].durationMinutes;
}

// ═══════════════════════════════════════════════════════════════
// 5. 资源（工作中心/设备）
// ═══════════════════════════════════════════════════════════════
export interface Resource {
  id: string;
  code: string;
  name: string;
  type: 'EQUIPMENT'|'LINE'|'WORKCENTER';
  factory: Factory;
  cleanRoomLevel: CleanRoomLevel;
  capacityPerShift: number;
  shiftModel: string;       // 'ONE_SHIFT'|'TWO_SHIFT'|'THREE_SHIFT'
  status: ResourceStatus;
  calendarId: string;
  supportedProducts: string[];
  lastProductCode?: string;
  /** 设备利用率（%）实时统计 */
  utilizationPct?: number;
  /** 维护计划 */
  maintenancePlan?: { nextDate: string; durationH: number; type: string };
}

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'R-NJ-WEIGH',   code: 'WC-NJ-WEIGH', name: '南京称量配料间',
    type: 'WORKCENTER', factory: 'NJ', cleanRoomLevel: 'D级',
    capacityPerShift: 2, shiftModel: 'TWO_SHIFT', status: 'OCCUPIED',
    calendarId: 'CAL-NJ-STD', supportedProducts: ['VITC-500','VITC-250'],
    lastProductCode: 'VITC-500', utilizationPct: 82,
  },
  {
    id: 'R-NJ-SOLID',   code: 'WC-NJ-SOLID', name: '南京固体制剂车间',
    type: 'WORKCENTER', factory: 'NJ', cleanRoomLevel: 'D级',
    capacityPerShift: 1, shiftModel: 'TWO_SHIFT', status: 'CLEANING',
    calendarId: 'CAL-NJ-STD', supportedProducts: ['VITC-500','VITC-250'],
    lastProductCode: 'VITC-500', utilizationPct: 76,
    maintenancePlan: { nextDate: '2026-06-15', durationH: 4, type: '季度预防性维护' },
  },
  {
    id: 'R-NJ-PACK',    code: 'WC-NJ-PACK', name: '南京内包装车间',
    type: 'WORKCENTER', factory: 'NJ', cleanRoomLevel: 'D级',
    capacityPerShift: 3, shiftModel: 'TWO_SHIFT', status: 'AVAILABLE',
    calendarId: 'CAL-NJ-STD', supportedProducts: ['VITC-500','VITC-250'],
    utilizationPct: 58,
  },
  {
    id: 'R-NJ-QC',      code: 'WC-NJ-QC', name: '南京QC检验室',
    type: 'WORKCENTER', factory: 'NJ', cleanRoomLevel: 'D级',
    capacityPerShift: 4, shiftModel: 'ONE_SHIFT', status: 'OCCUPIED',
    calendarId: 'CAL-NJ-QC', supportedProducts: ['VITC-500','VITC-250'],
    utilizationPct: 65,
  },
  {
    id: 'R-NJ-OUTERPACK',code:'WC-NJ-OUTERPACK',name: '南京外包装车间',
    type: 'WORKCENTER', factory: 'NJ', cleanRoomLevel: 'D级',
    capacityPerShift: 2, shiftModel: 'TWO_SHIFT', status: 'AVAILABLE',
    calendarId: 'CAL-NJ-STD', supportedProducts: ['VITC-500','VITC-250'],
    utilizationPct: 44,
  },
  {
    id: 'R-LS-PROBIO',  code: 'WC-LS-PROBIO', name: '溧水益生菌冷链车间',
    type: 'WORKCENTER', factory: 'LS', cleanRoomLevel: 'C级',
    capacityPerShift: 1, shiftModel: 'ONE_SHIFT', status: 'OCCUPIED',
    calendarId: 'CAL-LS-COLDCHAIN', supportedProducts: ['PROBIO-250'],
    lastProductCode: 'PROBIO-250', utilizationPct: 91,
  },
  {
    id: 'R-LS-PACK',    code: 'WC-LS-PACK', name: '溧水包装车间',
    type: 'WORKCENTER', factory: 'LS', cleanRoomLevel: 'D级',
    capacityPerShift: 2, shiftModel: 'ONE_SHIFT', status: 'AVAILABLE',
    calendarId: 'CAL-LS-COLDCHAIN', supportedProducts: ['PROBIO-250'],
    utilizationPct: 50,
  },
  {
    id: 'R-LS-QC',      code: 'WC-LS-QC', name: '溧水QC检验室',
    type: 'WORKCENTER', factory: 'LS', cleanRoomLevel: 'C级',
    capacityPerShift: 3, shiftModel: 'ONE_SHIFT', status: 'AVAILABLE',
    calendarId: 'CAL-LS-COLDCHAIN', supportedProducts: ['PROBIO-250'],
    utilizationPct: 60,
  },
];

// ═══════════════════════════════════════════════════════════════
// 6. 物料批次（放行状态）
// ═══════════════════════════════════════════════════════════════
export type MatStatus = 'PENDING_IQC'|'IQC_SAMPLING'|'RELEASED'|'REJECTED'|'QUARANTINE';

export interface MaterialBatch {
  batchNo: string;
  materialCode: string;
  materialName: string;
  qty: number;
  unit: string;
  status: MatStatus;
  iqcResult?: 'PASS'|'FAIL'|'PENDING';
  releaseDate?: string;
  expiryDate?: string;
  supplier?: string;
  warehouseCode?: string;
}

export const MOCK_MATERIAL_BATCHES: MaterialBatch[] = [
  { batchNo:'MB-VC-2026050001',materialCode:'RM-VITC',materialName:'维生素C原料',qty:500,unit:'kg',status:'RELEASED',iqcResult:'PASS',releaseDate:'2026-05-28',expiryDate:'2027-05-28',supplier:'DSM营养品（上海）',warehouseCode:'NJ-RM-01' },
  { batchNo:'MB-EXCIP-060001',materialCode:'RM-SORBITOL',materialName:'山梨糖醇',qty:200,unit:'kg',status:'RELEASED',iqcResult:'PASS',releaseDate:'2026-06-01',expiryDate:'2027-06-01',warehouseCode:'NJ-RM-01' },
  { batchNo:'MB-PB-2026060001',materialCode:'RM-PROBIO',materialName:'益生菌粉（混合菌株）',qty:50,unit:'kg',status:'RELEASED',iqcResult:'PASS',releaseDate:'2026-06-10',expiryDate:'2026-12-10',supplier:'科汉森（中国）',warehouseCode:'LS-COLD-01' },
  { batchNo:'MB-PB-2026060002',materialCode:'RM-PROBIO',materialName:'益生菌粉（混合菌株）',qty:30,unit:'kg',status:'IQC_SAMPLING',iqcResult:'PENDING',warehouseCode:'LS-COLD-01' },
  { batchNo:'MB-VC-2026060002',materialCode:'RM-VITC',materialName:'维生素C原料（新批）',qty:300,unit:'kg',status:'PENDING_IQC',iqcResult:'PENDING',supplier:'DSM营养品（上海）',warehouseCode:'NJ-RM-01' },
  { batchNo:'MB-CAP-060001',materialCode:'PM-GELCAP',materialName:'明胶空心胶囊',qty:100000,unit:'粒',status:'RELEASED',iqcResult:'PASS',releaseDate:'2026-06-05',warehouseCode:'LS-PM-01' },
  { batchNo:'MB-ALU-060001',materialCode:'PM-ALUMINUM',materialName:'铝箔膜',qty:5000,unit:'m',status:'RELEASED',iqcResult:'PASS',releaseDate:'2026-06-01',warehouseCode:'NJ-PM-01' },
];

// ═══════════════════════════════════════════════════════════════
// 7. 工单
// ═══════════════════════════════════════════════════════════════
export interface ScheduleWorkOrder {
  woNo: string;
  productCode: string;
  productName: string;
  batchNo: string;
  factory: Factory;
  plannedQty: number;
  unit: string;
  priority: number;
  dueDate: string;
  releaseDate: string;
  routingCode: string;
  status: WoStatus;
  isUrgent: boolean;
  isInsertOrder: boolean;
  ebrRequired: boolean;
  materialBatches: string[];       // 关联物料批次号
  requiredCleanRoomLevel: CleanRoomLevel;
  isColdChain: boolean;
  estimatedDurationH: number;      // 预计总工时
  progress?: number;               // 0-100
  qcHoldMinutes?: number;
  notes?: string;
}

export const MOCK_SCHEDULE_WOS: ScheduleWorkOrder[] = [
  {
    woNo:'WO-20260605-001', productCode:'VITC-500', productName:'维生素C咀嚼片500mg',
    batchNo:'B20260605001', factory:'NJ', plannedQty:100000, unit:'粒',
    priority:4, dueDate:'2026-06-20T17:00:00', releaseDate:'2026-06-05T08:00:00',
    routingCode:'TMJ-VITC-WG-V20', status:'RUNNING',
    isUrgent:false, isInsertOrder:false, ebrRequired:true,
    materialBatches:['MB-VC-2026050001','MB-EXCIP-060001','MB-ALU-060001'],
    requiredCleanRoomLevel:'D级', isColdChain:false, estimatedDurationH:52, progress:78,
    notes:'常规批次，FQC检验中',
  },
  {
    woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'复合益生菌胶囊250mg',
    batchNo:'B20260612001', factory:'LS', plannedQty:50000, unit:'粒',
    priority:5, dueDate:'2026-06-22T17:00:00', releaseDate:'2026-06-12T08:00:00',
    routingCode:'TMJ-PROBIO-CAP-V15', status:'RUNNING',
    isUrgent:true, isInsertOrder:false, ebrRequired:true,
    materialBatches:['MB-PB-2026060001','MB-CAP-060001'],
    requiredCleanRoomLevel:'C级', isColdChain:true, estimatedDurationH:48, progress:52,
    qcHoldMinutes:480, notes:'冷链生产，全程≤8℃，QC充填中检等待中',
  },
  {
    woNo:'WO-20260601-002', productCode:'PROBIO-250', productName:'复合益生菌胶囊250mg',
    batchNo:'B20260601002', factory:'LS', plannedQty:30000, unit:'粒',
    priority:3, dueDate:'2026-06-18T17:00:00', releaseDate:'2026-06-01T08:00:00',
    routingCode:'TMJ-PROBIO-CAP-V15', status:'COMPLETED',
    isUrgent:false, isInsertOrder:false, ebrRequired:true,
    materialBatches:['MB-PB-2026060001','MB-CAP-060001'],
    requiredCleanRoomLevel:'C级', isColdChain:true, estimatedDurationH:44, progress:100,
  },
  {
    woNo:'WO-20260616-001', productCode:'VITC-500', productName:'维生素C咀嚼片500mg',
    batchNo:'B20260616001', factory:'NJ', plannedQty:80000, unit:'粒',
    priority:3, dueDate:'2026-06-25T17:00:00', releaseDate:'2026-06-14T08:00:00',
    routingCode:'TMJ-VITC-WG-V20', status:'SCHEDULED',
    isUrgent:false, isInsertOrder:false, ebrRequired:true,
    materialBatches:['MB-VC-2026050001','MB-EXCIP-060001','MB-ALU-060001'],
    requiredCleanRoomLevel:'D级', isColdChain:false, estimatedDurationH:48, progress:0,
    notes:'待前批清场完成后开始',
  },
  {
    woNo:'WO-20260617-URGENT', productCode:'VITC-250', productName:'维生素C咀嚼片250mg',
    batchNo:'B20260617U01', factory:'NJ', plannedQty:20000, unit:'粒',
    priority:5, dueDate:'2026-06-19T17:00:00', releaseDate:'2026-06-14T10:00:00',
    routingCode:'TMJ-VITC-DC-V10', status:'PENDING',
    isUrgent:true, isInsertOrder:true, ebrRequired:true,
    materialBatches:['MB-VC-2026050001','MB-EXCIP-060001'],
    requiredCleanRoomLevel:'D级', isColdChain:false, estimatedDurationH:24, progress:0,
    notes:'🔴 紧急插单 - 华东区客户追加订单，交货期2026-06-19',
  },
  {
    woNo:'WO-20260618-001', productCode:'PROBIO-250', productName:'复合益生菌胶囊250mg',
    batchNo:'B20260618001', factory:'LS', plannedQty:60000, unit:'粒',
    priority:4, dueDate:'2026-06-28T17:00:00', releaseDate:'2026-06-16T08:00:00',
    routingCode:'TMJ-PROBIO-CAP-V15', status:'PENDING',
    isUrgent:false, isInsertOrder:false, ebrRequired:true,
    materialBatches:['MB-PB-2026060002','MB-CAP-060001'],  // ← MB-PB-060002 未放行！
    requiredCleanRoomLevel:'C级', isColdChain:true, estimatedDurationH:52, progress:0,
    notes:'⚠️ 物料MB-PB-2026060002 IQC取样中，待放行',
  },
];

// ═══════════════════════════════════════════════════════════════
// 8. 工序路由定义（用于排程算法）
// ═══════════════════════════════════════════════════════════════
export interface RoutingOp {
  opNo: string;
  opName: string;
  resourceIds: string[];         // 可用资源列表（候选）
  durationMinutes: number;
  requiredCleanRoomLevel: CleanRoomLevel;
  isMandatoryQC: boolean;
  isColdChain: boolean;
  predecessorOpNo?: string;      // 前驱工序
  requiredCerts?: string[];      // 所需操作证
  setupMinutes?: number;         // 准备时间
}

export const ROUTING_OPS: Record<string, RoutingOp[]> = {
  'TMJ-VITC-WG-V20': [
    { opNo:'OP-10',opName:'称量配料',          resourceIds:['R-NJ-WEIGH'],    durationMinutes:300, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false },
    { opNo:'OP-20',opName:'制粒（湿法）',      resourceIds:['R-NJ-SOLID'],    durationMinutes:540, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-10' },
    { opNo:'OP-25',opName:'流化床干燥',        resourceIds:['R-NJ-SOLID'],    durationMinutes:480, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-20' },
    { opNo:'OP-35',opName:'总混',              resourceIds:['R-NJ-SOLID'],    durationMinutes:240, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-25' },
    { opNo:'OP-40',opName:'压片',              resourceIds:['R-NJ-SOLID'],    durationMinutes:480, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-35', setupMinutes:30 },
    { opNo:'OP-45',opName:'素片中检（QC）',    resourceIds:['R-NJ-QC'],       durationMinutes:360, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-40' },
    { opNo:'OP-60',opName:'内包装（铝塑）',    resourceIds:['R-NJ-PACK'],     durationMinutes:480, requiredCleanRoomLevel:'D级', isMandatoryQC:false, isColdChain:false, predecessorOpNo:'OP-45', setupMinutes:30 },
    { opNo:'OP-70',opName:'外包装装盒',        resourceIds:['R-NJ-OUTERPACK'],durationMinutes:300, requiredCleanRoomLevel:'D级', isMandatoryQC:false, isColdChain:false, predecessorOpNo:'OP-60' },
    { opNo:'OP-80',opName:'FQC成品检验',       resourceIds:['R-NJ-QC'],       durationMinutes:360, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-70' },
    { opNo:'OP-90',opName:'质量放行',          resourceIds:['R-NJ-QC'],       durationMinutes:120, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-80' },
  ],
  'TMJ-VITC-DC-V10': [
    { opNo:'OP-10',opName:'称量配料',          resourceIds:['R-NJ-WEIGH'],    durationMinutes:180, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false },
    { opNo:'OP-35',opName:'总混',              resourceIds:['R-NJ-SOLID'],    durationMinutes:180, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-10' },
    { opNo:'OP-40',opName:'压片（直压）',      resourceIds:['R-NJ-SOLID'],    durationMinutes:300, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-35', setupMinutes:20 },
    { opNo:'OP-45',opName:'素片中检（QC）',    resourceIds:['R-NJ-QC'],       durationMinutes:240, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-40' },
    { opNo:'OP-60',opName:'内包装（铝塑）',    resourceIds:['R-NJ-PACK'],     durationMinutes:300, requiredCleanRoomLevel:'D级', isMandatoryQC:false, isColdChain:false, predecessorOpNo:'OP-45', setupMinutes:20 },
    { opNo:'OP-70',opName:'外包装装盒',        resourceIds:['R-NJ-OUTERPACK'],durationMinutes:180, requiredCleanRoomLevel:'D级', isMandatoryQC:false, isColdChain:false, predecessorOpNo:'OP-60' },
    { opNo:'OP-80',opName:'FQC成品检验',       resourceIds:['R-NJ-QC'],       durationMinutes:240, requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-70' },
    { opNo:'OP-90',opName:'质量放行',          resourceIds:['R-NJ-QC'],       durationMinutes:60,  requiredCleanRoomLevel:'D级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-80' },
  ],
  'TMJ-PROBIO-CAP-V15': [
    { opNo:'OP-10',opName:'原料接收验收',       resourceIds:['R-LS-QC'],       durationMinutes:120, requiredCleanRoomLevel:'C级', isMandatoryQC:true,  isColdChain:false },
    { opNo:'OP-20',opName:'低温称量配料',       resourceIds:['R-LS-PROBIO'],   durationMinutes:300, requiredCleanRoomLevel:'C级', isMandatoryQC:true,  isColdChain:true,  predecessorOpNo:'OP-10' },
    { opNo:'OP-30',opName:'混合（冷链≤8℃）',  resourceIds:['R-LS-PROBIO'],   durationMinutes:360, requiredCleanRoomLevel:'C级', isMandatoryQC:true,  isColdChain:true,  predecessorOpNo:'OP-20' },
    { opNo:'OP-40',opName:'胶囊充填',           resourceIds:['R-LS-PROBIO'],   durationMinutes:480, requiredCleanRoomLevel:'C级', isMandatoryQC:true,  isColdChain:true,  predecessorOpNo:'OP-30', setupMinutes:60 },
    { opNo:'OP-45',opName:'充填中检（QC）',     resourceIds:['R-LS-QC'],       durationMinutes:480, requiredCleanRoomLevel:'C级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-40' },
    { opNo:'OP-50',opName:'铝塑泡罩包装',       resourceIds:['R-LS-PACK'],     durationMinutes:480, requiredCleanRoomLevel:'D级', isMandatoryQC:false, isColdChain:false, predecessorOpNo:'OP-45', setupMinutes:30 },
    { opNo:'OP-60',opName:'外包装装盒',         resourceIds:['R-LS-PACK'],     durationMinutes:240, requiredCleanRoomLevel:'D级', isMandatoryQC:false, isColdChain:false, predecessorOpNo:'OP-50' },
    { opNo:'OP-70',opName:'FQC成品检验',        resourceIds:['R-LS-QC'],       durationMinutes:480, requiredCleanRoomLevel:'C级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-60' },
    { opNo:'OP-80',opName:'质量放行',           resourceIds:['R-LS-QC'],       durationMinutes:120, requiredCleanRoomLevel:'C级', isMandatoryQC:true,  isColdChain:false, predecessorOpNo:'OP-70' },
    { opNo:'OP-90',opName:'冷链入库（≤8℃）',  resourceIds:['R-LS-PROBIO'],   durationMinutes:60,  requiredCleanRoomLevel:'D级', isMandatoryQC:false, isColdChain:true,  predecessorOpNo:'OP-80' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 9. 约束校验
// ═══════════════════════════════════════════════════════════════
export interface ConstraintViolation {
  ruleId: string;
  type: ConstraintType;
  severity: ConstraintLevel;
  message: string;
  suggestion?: string;
  affectedField?: string;
}

/** 执行约束校验（前端模拟） */
export function checkConstraints(
  wo: ScheduleWorkOrder,
  op: RoutingOp,
  resource: Resource,
  startTime: Date,
  endTime: Date,
  prevProductCode?: string,
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  // CR-001: 物料放行
  const unreleasedBatches = wo.materialBatches.filter(b => {
    const batch = MOCK_MATERIAL_BATCHES.find(m => m.batchNo === b);
    return batch && batch.status !== 'RELEASED';
  });
  if (unreleasedBatches.length > 0) {
    violations.push({
      ruleId:'CR-001', type:'MATERIAL_RELEASE', severity:'HARD',
      message: `物料批次 ${unreleasedBatches.join(', ')} 尚未放行`,
      suggestion:'请在LIMS完成IQC检验并执行放行',
      affectedField:'materialBatches',
    });
  }

  // CR-002: 设备产能
  if (resource.status === 'BREAKDOWN' || resource.status === 'OFFLINE') {
    violations.push({
      ruleId:'CR-002', type:'EQUIPMENT_CAPACITY', severity:'HARD',
      message:`资源 ${resource.name} 当前状态为${resource.status === 'BREAKDOWN' ? '故障' : '离线'}，无法排程`,
      suggestion:'请选择备用设备或等待故障恢复',
    });
  }

  // CR-006: 洁净区
  const levelMap: Record<CleanRoomLevel, number> = {'D级':1,'C级':2,'B级':3,'A级':4};
  if (levelMap[resource.cleanRoomLevel] < levelMap[op.requiredCleanRoomLevel]) {
    violations.push({
      ruleId:'CR-006', type:'CLEAN_ROOM_LEVEL', severity:'HARD',
      message:`资源洁净级别(${resource.cleanRoomLevel})低于工序要求(${op.requiredCleanRoomLevel})`,
      suggestion:`请将 ${op.opName} 分配到 ${op.requiredCleanRoomLevel} 或更高级别车间`,
    });
  }

  // CR-004: 清场
  if (prevProductCode && prevProductCode !== wo.productCode) {
    const ct = getCleanType(prevProductCode, wo.productCode);
    const dur = CLEANING_RULES[ct].durationMinutes;
    if (dur > 0) {
      violations.push({
        ruleId:'CR-004', type:'CLEANING_REQUIRED', severity:'HARD',
        message:`批次切换（${prevProductCode}→${wo.productCode}）需执行${CLEANING_RULES[ct].label}（${dur}分钟）`,
        suggestion:'系统将自动插入清场任务',
      });
    }
  }

  // CR-008: 班次边界
  const cal = MOCK_CALENDARS.find(c => c.id === resource.calendarId);
  if (cal) {
    const shifts = cal.shifts;
    const endH = endTime.getHours() + endTime.getMinutes()/60;
    const crossBoundary = shifts.some(s => {
      const startH = startTime.getHours() + startTime.getMinutes()/60;
      return startH < s.endHour && endH > s.endHour;
    });
    if (crossBoundary && op.durationMinutes > 480) {
      violations.push({
        ruleId:'CR-008', type:'SHIFT_BOUNDARY', severity:'HARD',
        message:`工序 ${op.opName} 时长${op.durationMinutes}分钟，跨越班次边界`,
        suggestion:'建议申请连续生产或拆分批次',
      });
    }
  }

  return violations;
}

// ═══════════════════════════════════════════════════════════════
// 10. 排程条目（甘特图项）
// ═══════════════════════════════════════════════════════════════
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
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ScheduleItemStatus;
  timeZone: TimeZone;
  isLocked: boolean;
  isColdChain: boolean;
  cleaningTaskId?: string;
  constraintViolations: ConstraintViolation[];
  softScore: number;
  color?: string;
  priority: number;
  notes?: string;
  /** 是否清场条目 */
  isCleaningBar?: boolean;
  cleanType?: CleanType;
  /** 前驱条目ID（用于连线） */
  predecessorId?: string;
}

// ═══════════════════════════════════════════════════════════════
// 11. 清场任务
// ═══════════════════════════════════════════════════════════════
export interface CleanCheckItem {
  id: string; item: string; required: boolean; checked: boolean;
  checkedBy?: string; checkedAt?: string; result?: 'PASS'|'FAIL'; remark?: string;
  photoRequired?: boolean; photoUrl?: string;
}

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
  cleanType: CleanType;
  isSameProduct: boolean;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: CleanStatus;
  operator?: string;
  verifier?: string;
  verifiedAt?: string;
  checkItems: CleanCheckItem[];
  qrCode?: string;
  ebrLinked?: boolean;
  qaRequired: boolean;
  qaSignedBy?: string;
}

// ═══════════════════════════════════════════════════════════════
// 12. 事件
// ═══════════════════════════════════════════════════════════════
export interface RescheduleEvent {
  id: string;
  type: EventType;
  source: string;           // 'LIMS'|'EAM'|'ERP'|'WMS'|'HR'|'MANUAL'
  triggeredAt: string;
  affectedWoNos: string[];
  affectedResourceIds?: string[];
  description: string;
  impactMinutes: number;    // 影响时长（分钟）
  requireApproval: boolean;
  status: 'PENDING'|'APPROVED'|'REJECTED'|'APPLIED'|'AUTO_APPLIED';
  appliedAt?: string;
  operator?: string;
  proposedActions?: string[];  // 重排建议
  timeZone: TimeZone;          // 影响区域
}

// ═══════════════════════════════════════════════════════════════
// 13. 版本
// ═══════════════════════════════════════════════════════════════
export interface ScheduleVersion {
  versionId: string;
  label: string;
  createdAt: string;
  createdBy: string;
  status: 'DRAFT'|'PUBLISHED'|'ARCHIVED';
  isBaseline: boolean;
  itemCount: number;
  triggerEvent?: string;     // 触发重排的事件ID
  changeDesc?: string;
  kpi: {
    utilization: number;
    otdRate: number;
    cleaningWasteH: number;
    urgentCount: number;
    conflictCount: number;
    avgLeadTimeH: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 14. Mock 排程条目数据（完整2周甘特图）
// ═══════════════════════════════════════════════════════════════
const BASE = new Date('2026-06-14T00:00:00');
function iso(offsetDays: number, hour: number, minute = 0): string {
  const d = new Date(BASE);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function calcTZ(isoDate: string): TimeZone {
  const diff = Math.floor((new Date(isoDate).getTime() - BASE.getTime()) / 86400000);
  if (diff < 0)   return 'HISTORY';
  if (diff <= 2)  return 'FROZEN';
  if (diff <= 14) return 'ROLLING';
  return 'OUTLOOK';
}

export const MOCK_SCHEDULE_ITEMS: ScheduleItem[] = [
  // ── WO-20260605-001 VitC 500mg 南京（进行中） ──────────
  { id:'SI-001', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-10', opName:'称量配料',
    resourceId:'R-NJ-WEIGH', resourceName:'南京称量配料间', cleanRoomLevel:'D级',
    startTime:iso(-9,8), endTime:iso(-9,13), durationMinutes:300,
    status:'COMPLETED', timeZone:'HISTORY', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:96, priority:4 },

  { id:'SI-002', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-20', opName:'制粒（湿法）',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(-8,8), endTime:iso(-8,17), durationMinutes:540,
    status:'COMPLETED', timeZone:'HISTORY', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:92, priority:4, predecessorId:'SI-001' },

  { id:'SI-003', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-25', opName:'流化床干燥',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(-7,8), endTime:iso(-7,16), durationMinutes:480,
    status:'COMPLETED', timeZone:'HISTORY', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:94, priority:4, predecessorId:'SI-002' },

  { id:'SI-004', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-35', opName:'总混',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(-6,8), endTime:iso(-6,12), durationMinutes:240,
    status:'COMPLETED', timeZone:'HISTORY', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:91, priority:4, predecessorId:'SI-003' },

  { id:'SI-005', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-40', opName:'压片',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(-5,8), endTime:iso(-5,16), durationMinutes:480,
    status:'COMPLETED', timeZone:'HISTORY', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:93, priority:4, predecessorId:'SI-004' },

  { id:'SI-006', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-45', opName:'素片中检',
    resourceId:'R-NJ-QC', resourceName:'南京QC检验室', cleanRoomLevel:'D级',
    startTime:iso(-4,8), endTime:iso(-4,14), durationMinutes:360,
    status:'COMPLETED', timeZone:'HISTORY', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:90, priority:4, predecessorId:'SI-005' },

  { id:'SI-007', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-60', opName:'内包装（铝塑）',
    resourceId:'R-NJ-PACK', resourceName:'南京内包装车间', cleanRoomLevel:'D级',
    startTime:iso(-2,8), endTime:iso(-2,16), durationMinutes:480,
    status:'COMPLETED', timeZone:'FROZEN', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:89, priority:4, predecessorId:'SI-006' },

  { id:'SI-008', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-70', opName:'外包装装盒',
    resourceId:'R-NJ-OUTERPACK', resourceName:'南京外包装车间', cleanRoomLevel:'D级',
    startTime:iso(-1,8), endTime:iso(-1,13), durationMinutes:300,
    status:'COMPLETED', timeZone:'FROZEN', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:88, priority:4, predecessorId:'SI-007' },

  { id:'SI-009', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-80', opName:'FQC成品检验',
    resourceId:'R-NJ-QC', resourceName:'南京QC检验室', cleanRoomLevel:'D级',
    startTime:iso(0,8), endTime:iso(0,14), durationMinutes:360,
    status:'PRODUCING', timeZone:'FROZEN', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:92, priority:4, color:'#52C41A', predecessorId:'SI-008' },

  { id:'SI-010', woNo:'WO-20260605-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-90', opName:'质量放行',
    resourceId:'R-NJ-QC', resourceName:'南京QC检验室', cleanRoomLevel:'D级',
    startTime:iso(1,8), endTime:iso(1,10), durationMinutes:120,
    status:'WAITING', timeZone:'FROZEN', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:88, priority:4, color:'#1890FF', predecessorId:'SI-009' },

  // ── 清场条（WO-20260605-001 → WO-20260616-001，南京固体） ──
  { id:'SI-CLN-001', woNo:'CLN-20260616-NJ-SOLID', productCode:'', productName:'换产清场（同品种标准清场）',
    factory:'NJ', opNo:'CLN', opName:'标准清场 60min',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(2,8), endTime:iso(2,9), durationMinutes:60,
    status:'CLEANING', timeZone:'FROZEN', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:100, priority:5, color:'#FAAD14',
    isCleaningBar:true, cleanType:'STANDARD', cleaningTaskId:'CTK-001' },

  // ── WO-20260616-001 VitC 500mg 次批（已排程） ──────────
  { id:'SI-011', woNo:'WO-20260616-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-10', opName:'称量配料',
    resourceId:'R-NJ-WEIGH', resourceName:'南京称量配料间', cleanRoomLevel:'D级',
    startTime:iso(2,8), endTime:iso(2,13), durationMinutes:300,
    status:'WAITING', timeZone:'FROZEN', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:87, priority:3, color:'#1890FF' },

  { id:'SI-012', woNo:'WO-20260616-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-20', opName:'制粒（湿法）',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(3,8), endTime:iso(3,17), durationMinutes:540,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:85, priority:3, color:'#1890FF', predecessorId:'SI-011' },

  { id:'SI-013', woNo:'WO-20260616-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-25', opName:'流化床干燥',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(4,8), endTime:iso(4,16), durationMinutes:480,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:84, priority:3, color:'#1890FF', predecessorId:'SI-012' },

  { id:'SI-014', woNo:'WO-20260616-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-40', opName:'压片',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(5,8), endTime:iso(5,16), durationMinutes:480,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:82, priority:3, color:'#1890FF', predecessorId:'SI-013' },

  { id:'SI-015', woNo:'WO-20260616-001', productCode:'VITC-500', productName:'VitC咀嚼片500mg',
    factory:'NJ', opNo:'OP-80', opName:'FQC成品检验',
    resourceId:'R-NJ-QC', resourceName:'南京QC检验室', cleanRoomLevel:'D级',
    startTime:iso(8,8), endTime:iso(8,14), durationMinutes:360,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:80, priority:3, color:'#1890FF', predecessorId:'SI-014' },

  // ── 紧急插单 WO-20260617-URGENT VitC 250mg ──────────────
  { id:'SI-URG-001', woNo:'WO-20260617-URGENT', productCode:'VITC-250', productName:'VitC咀嚼片250mg（插单）',
    factory:'NJ', opNo:'OP-10', opName:'称量配料',
    resourceId:'R-NJ-WEIGH', resourceName:'南京称量配料间', cleanRoomLevel:'D级',
    startTime:iso(0,14,30), endTime:iso(0,17,30), durationMinutes:180,
    status:'WAITING', timeZone:'FROZEN', isLocked:false, isColdChain:false,
    constraintViolations:[{
      ruleId:'CR-004', type:'CLEANING_REQUIRED', severity:'HARD',
      message:'插单导致与WO-20260605-001产品切换，需标准清场（60分钟）',
      suggestion:'建议先执行清场再开始称量',
    }],
    softScore:70, priority:5, color:'#F5222D',
    notes:'🔴 紧急插单 P5', predecessorId:undefined },

  { id:'SI-URG-002', woNo:'WO-20260617-URGENT', productCode:'VITC-250', productName:'VitC咀嚼片250mg（插单）',
    factory:'NJ', opNo:'OP-35', opName:'总混',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(1,8), endTime:iso(1,11), durationMinutes:180,
    status:'WAITING', timeZone:'FROZEN', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:75, priority:5, color:'#F5222D', predecessorId:'SI-URG-001' },

  { id:'SI-URG-003', woNo:'WO-20260617-URGENT', productCode:'VITC-250', productName:'VitC咀嚼片250mg（插单）',
    factory:'NJ', opNo:'OP-40', opName:'压片（直压）',
    resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', cleanRoomLevel:'D级',
    startTime:iso(1,11,30), endTime:iso(1,16,30), durationMinutes:300,
    status:'WAITING', timeZone:'FROZEN', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:73, priority:5, color:'#F5222D', predecessorId:'SI-URG-002' },

  { id:'SI-URG-004', woNo:'WO-20260617-URGENT', productCode:'VITC-250', productName:'VitC咀嚼片250mg（插单）',
    factory:'NJ', opNo:'OP-80', opName:'FQC成品检验',
    resourceId:'R-NJ-QC', resourceName:'南京QC检验室', cleanRoomLevel:'D级',
    startTime:iso(2,8), endTime:iso(2,12), durationMinutes:240,
    status:'WAITING', timeZone:'FROZEN', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:72, priority:5, color:'#F5222D', predecessorId:'SI-URG-003' },

  // ── WO-20260612-001 益生菌 溧水冷链（进行中） ──────────
  { id:'SI-PB-001', woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg',
    factory:'LS', opNo:'OP-10', opName:'原料接收验收',
    resourceId:'R-LS-QC', resourceName:'溧水QC检验室', cleanRoomLevel:'C级',
    startTime:iso(-3,8), endTime:iso(-3,10), durationMinutes:120,
    status:'COMPLETED', timeZone:'HISTORY', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:96, priority:5 },

  { id:'SI-PB-002', woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg',
    factory:'LS', opNo:'OP-20', opName:'低温称量配料',
    resourceId:'R-LS-PROBIO', resourceName:'溧水冷链车间', cleanRoomLevel:'C级',
    startTime:iso(-2,8), endTime:iso(-2,13), durationMinutes:300,
    status:'COMPLETED', timeZone:'FROZEN', isLocked:true, isColdChain:true,
    constraintViolations:[], softScore:94, priority:5, predecessorId:'SI-PB-001' },

  { id:'SI-PB-003', woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg',
    factory:'LS', opNo:'OP-30', opName:'混合（冷链≤8℃）',
    resourceId:'R-LS-PROBIO', resourceName:'溧水冷链车间', cleanRoomLevel:'C级',
    startTime:iso(-1,8), endTime:iso(-1,14), durationMinutes:360,
    status:'COMPLETED', timeZone:'FROZEN', isLocked:true, isColdChain:true,
    constraintViolations:[], softScore:93, priority:5, predecessorId:'SI-PB-002' },

  { id:'SI-PB-004', woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg',
    factory:'LS', opNo:'OP-40', opName:'胶囊充填',
    resourceId:'R-LS-PROBIO', resourceName:'溧水冷链车间', cleanRoomLevel:'C级',
    startTime:iso(0,8), endTime:iso(0,16), durationMinutes:480,
    status:'PRODUCING', timeZone:'FROZEN', isLocked:true, isColdChain:true,
    constraintViolations:[], softScore:91, priority:5, color:'#52C41A', predecessorId:'SI-PB-003' },

  { id:'SI-PB-005', woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg',
    factory:'LS', opNo:'OP-45', opName:'充填中检（QC）',
    resourceId:'R-LS-QC', resourceName:'溧水QC检验室', cleanRoomLevel:'C级',
    startTime:iso(1,8), endTime:iso(1,16), durationMinutes:480,
    status:'WAITING', timeZone:'FROZEN', isLocked:true, isColdChain:false,
    constraintViolations:[], softScore:88, priority:5, color:'#722ED1',
    notes:'QC充填中检等待中（约8小时）', predecessorId:'SI-PB-004' },

  { id:'SI-PB-006', woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg',
    factory:'LS', opNo:'OP-50', opName:'铝塑泡罩包装',
    resourceId:'R-LS-PACK', resourceName:'溧水包装车间', cleanRoomLevel:'D级',
    startTime:iso(3,8), endTime:iso(3,16), durationMinutes:480,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:85, priority:5, color:'#1890FF', predecessorId:'SI-PB-005' },

  { id:'SI-PB-007', woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg',
    factory:'LS', opNo:'OP-70', opName:'FQC成品检验',
    resourceId:'R-LS-QC', resourceName:'溧水QC检验室', cleanRoomLevel:'C级',
    startTime:iso(5,8), endTime:iso(5,16), durationMinutes:480,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:82, priority:5, color:'#1890FF', predecessorId:'SI-PB-006' },

  { id:'SI-PB-008', woNo:'WO-20260612-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg',
    factory:'LS', opNo:'OP-80', opName:'质量放行',
    resourceId:'R-LS-QC', resourceName:'溧水QC检验室', cleanRoomLevel:'C级',
    startTime:iso(6,8), endTime:iso(6,10), durationMinutes:120,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:80, priority:5, color:'#1890FF', predecessorId:'SI-PB-007' },

  // ── WO-20260618-001 益生菌次批（待排，物料未放行警告） ──
  { id:'SI-PB2-001', woNo:'WO-20260618-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg（次批）',
    factory:'LS', opNo:'OP-20', opName:'低温称量配料',
    resourceId:'R-LS-PROBIO', resourceName:'溧水冷链车间', cleanRoomLevel:'C级',
    startTime:iso(8,8), endTime:iso(8,13), durationMinutes:300,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:true,
    constraintViolations:[{
      ruleId:'CR-001', type:'MATERIAL_RELEASE', severity:'HARD',
      message:'物料批次MB-PB-2026060002 IQC取样中，尚未放行',
      suggestion:'请在LIMS中完成IQC检验并执行放行后方可开始生产',
    }],
    softScore:55, priority:4, color:'#FF7A00',
    notes:'⚠️ 物料放行约束告警' },

  { id:'SI-PB2-002', woNo:'WO-20260618-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg（次批）',
    factory:'LS', opNo:'OP-40', opName:'胶囊充填',
    resourceId:'R-LS-PROBIO', resourceName:'溧水冷链车间', cleanRoomLevel:'C级',
    startTime:iso(9,8), endTime:iso(9,16), durationMinutes:480,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:true,
    constraintViolations:[], softScore:60, priority:4, color:'#1890FF', predecessorId:'SI-PB2-001' },

  { id:'SI-PB2-003', woNo:'WO-20260618-001', productCode:'PROBIO-250', productName:'益生菌胶囊250mg（次批）',
    factory:'LS', opNo:'OP-70', opName:'FQC成品检验',
    resourceId:'R-LS-QC', resourceName:'溧水QC检验室', cleanRoomLevel:'C级',
    startTime:iso(11,8), endTime:iso(11,16), durationMinutes:480,
    status:'WAITING', timeZone:'ROLLING', isLocked:false, isColdChain:false,
    constraintViolations:[], softScore:62, priority:4, color:'#1890FF', predecessorId:'SI-PB2-002' },
];

// ═══════════════════════════════════════════════════════════════
// 15. 清场任务 Mock
// ═══════════════════════════════════════════════════════════════
export const MOCK_CLEANING_TASKS: CleaningTask[] = [
  {
    id:'CTK-001', resourceId:'R-NJ-SOLID', resourceName:'南京固体制剂车间', factory:'NJ',
    prevWoNo:'WO-20260605-001', prevProductCode:'VITC-500', prevProductName:'VitC咀嚼片500mg',
    nextWoNo:'WO-20260616-001', nextProductCode:'VITC-500', nextProductName:'VitC咀嚼片500mg',
    cleanType:'STANDARD', isSameProduct:true,
    startTime:iso(2,8), endTime:iso(2,9), durationMinutes:60,
    status:'IN_PROGRESS', operator:'张清洁工', qaRequired:false,
    ebrLinked:true, qrCode:'CTK-001-QR',
    checkItems:[
      { id:'CC-01', item:'清除上批所有物料及废弃包材', required:true, checked:true, result:'PASS', checkedBy:'张清洁工', checkedAt:iso(2,8,15), photoRequired:true, photoUrl:'https://picsum.photos/300/200?random=1' },
      { id:'CC-02', item:'设备拆卸清洁（接触面、密封圈）', required:true, checked:true, result:'PASS', checkedBy:'张清洁工', checkedAt:iso(2,8,30), photoRequired:true, photoUrl:'https://picsum.photos/300/200?random=2' },
      { id:'CC-03', item:'环境擦拭（地面、墙面）', required:true, checked:true, result:'PASS', checkedBy:'张清洁工', checkedAt:iso(2,8,45), photoRequired:false },
      { id:'CC-04', item:'清洁记录填写', required:true, checked:false, photoRequired:false },
      { id:'CC-05', item:'操作员自检并签字', required:true, checked:false, photoRequired:false },
      { id:'CC-06', item:'线长/班长复核签字', required:true, checked:false, photoRequired:false },
    ],
  },
  {
    id:'CTK-002', resourceId:'R-LS-PROBIO', resourceName:'溧水冷链车间', factory:'LS',
    prevWoNo:'WO-20260601-002', prevProductCode:'PROBIO-250', prevProductName:'益生菌胶囊250mg',
    nextWoNo:'WO-20260612-001', nextProductCode:'PROBIO-250', nextProductName:'益生菌胶囊250mg',
    cleanType:'STANDARD', isSameProduct:true,
    startTime:iso(-4,15), endTime:iso(-4,16), durationMinutes:60,
    status:'COMPLETED', operator:'李维护', verifier:'QA王工', verifiedAt:iso(-4,16,0),
    qaRequired:false, ebrLinked:true, qrCode:'CTK-002-QR',
    checkItems:[
      { id:'CC-LS-01', item:'冷链设备温度恢复≤8℃确认', required:true, checked:true, result:'PASS', checkedBy:'李维护', checkedAt:iso(-4,15,20), photoRequired:true, photoUrl:'https://picsum.photos/300/200?random=3' },
      { id:'CC-LS-02', item:'冷链车间消毒记录', required:true, checked:true, result:'PASS', checkedBy:'李维护', checkedAt:iso(-4,15,35), photoRequired:true, photoUrl:'https://picsum.photos/300/200?random=4' },
      { id:'CC-LS-03', item:'C级洁净区清场验证（沉降菌）', required:true, checked:true, result:'PASS', checkedBy:'QA王工', checkedAt:iso(-4,15,50), photoRequired:false },
      { id:'CC-LS-04', item:'清场确认签字（QA）', required:true, checked:true, result:'PASS', checkedBy:'QA王工', checkedAt:iso(-4,16,0), photoRequired:false },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// 16. 重排事件 Mock
// ═══════════════════════════════════════════════════════════════
export const MOCK_RESCHEDULE_EVENTS: RescheduleEvent[] = [
  {
    id:'EVT-001', type:'INSERT_ORDER', source:'ERP',
    triggeredAt:iso(0,10,0),
    affectedWoNos:['WO-20260617-URGENT'],
    affectedResourceIds:['R-NJ-WEIGH','R-NJ-SOLID','R-NJ-QC'],
    description:'ERP系统推送紧急插单 WO-20260617-URGENT（VitC咀嚼片250mg，2万粒），华东区客户追加，要求2026-06-19交货，影响南京称量/压片/QC资源，冻结区需审批',
    impactMinutes:1440, requireApproval:true, timeZone:'FROZEN',
    status:'PENDING', operator:'排程员小赵',
    proposedActions:[
      '将WO-20260617-URGENT插入南京称量配料间今日14:30空档',
      '压片安排至明日上午（与WO-20260616-001清场后并行）',
      'QC检验安排至后天上午',
      '预计影响WO-20260616-001压片推迟4小时',
    ],
  },
  {
    id:'EVT-002', type:'QC_HOLD', source:'LIMS',
    triggeredAt:iso(-1,14,0),
    affectedWoNos:['WO-20260612-001'],
    description:'LIMS推送：WO-20260612-001充填中检取样，QC等待时长预计8小时（480分钟），导致后续铝塑包装工序（OP-50）推迟480分钟。滚动区自动重排已执行。',
    impactMinutes:480, requireApproval:false, timeZone:'ROLLING',
    status:'AUTO_APPLIED', appliedAt:iso(-1,14,30), operator:'系统自动',
    proposedActions:['OP-50铝塑包装自动推迟至D+3 08:00','KPI利用率影响-2.1%'],
  },
  {
    id:'EVT-003', type:'EQUIPMENT_FAULT', source:'EAM',
    triggeredAt:iso(0,6,30),
    affectedWoNos:['WO-20260616-001'],
    affectedResourceIds:['R-NJ-SOLID'],
    description:'EAM推送：南京固体制剂车间压片机油压系统告警（故障代码E-0x3A），维修工程师预估维修时长4小时，影响WO-20260616-001压片工序（OP-40，计划D+5）',
    impactMinutes:240, requireApproval:false, timeZone:'ROLLING',
    status:'PENDING', operator:'设备工程师老李',
    proposedActions:[
      'WO-20260616-001 OP-40压片推迟4小时（D+5 12:00开始）',
      '对应QC/包装工序级联推迟',
      '建议联系备用压片机PM-NJ-03确认可用性',
    ],
  },
  {
    id:'EVT-004', type:'MATERIAL_DELAY', source:'WMS',
    triggeredAt:iso(1,9,0),
    affectedWoNos:['WO-20260618-001'],
    description:'WMS推送：益生菌原料批次MB-PB-2026060002 IQC取样，预计放行时间D+3，导致WO-20260618-001无法按计划D+2开始生产，需推迟至D+3',
    impactMinutes:1440, requireApproval:false, timeZone:'ROLLING',
    status:'PENDING', operator:'物料计划员小陈',
    proposedActions:[
      'WO-20260618-001全链条推迟1天（D+3开始称量）',
      '建议联系IQC加急检验',
      '溧水冷链车间D+2产能空置，可考虑安排设备维护',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// 17. 版本 Mock
// ═══════════════════════════════════════════════════════════════
export const MOCK_SCHEDULE_VERSIONS: ScheduleVersion[] = [
  {
    versionId:'VER-20260614-003', label:'当前版本（插单重排后）',
    createdAt:iso(0,10,30), createdBy:'排程员小赵',
    status:'PUBLISHED', isBaseline:false, itemCount:28,
    triggerEvent:'EVT-001', changeDesc:'插入紧急工单WO-20260617-URGENT，南京三资源重排',
    kpi:{ utilization:78.3, otdRate:91.2, cleaningWasteH:12.5, urgentCount:1, conflictCount:1, avgLeadTimeH:46.2 },
  },
  {
    versionId:'VER-20260614-002', label:'插单前基线版本',
    createdAt:iso(0,8,0), createdBy:'排程员小赵',
    status:'ARCHIVED', isBaseline:true, itemCount:24,
    kpi:{ utilization:82.1, otdRate:95.0, cleaningWasteH:10.2, urgentCount:0, conflictCount:0, avgLeadTimeH:44.5 },
  },
  {
    versionId:'VER-20260613-001', label:'昨日自动生成版本',
    createdAt:iso(-1,17,0), createdBy:'系统自动',
    status:'ARCHIVED', isBaseline:false, itemCount:22,
    triggerEvent:'EVT-002', changeDesc:'QC等待事件触发，益生菌铝塑包装推迟480分钟',
    kpi:{ utilization:79.5, otdRate:93.1, cleaningWasteH:11.8, urgentCount:0, conflictCount:0, avgLeadTimeH:45.1 },
  },
  {
    versionId:'VER-20260612-001', label:'设备故障前版本',
    createdAt:iso(-2,8,0), createdBy:'系统自动',
    status:'ARCHIVED', isBaseline:false, itemCount:20,
    kpi:{ utilization:85.0, otdRate:96.5, cleaningWasteH:9.0, urgentCount:0, conflictCount:0, avgLeadTimeH:43.0 },
  },
];

// ═══════════════════════════════════════════════════════════════
// 18. 颜色/标签映射
// ═══════════════════════════════════════════════════════════════
export const SCHEDULE_STATUS_COLOR: Record<ScheduleItemStatus, string> = {
  PRODUCING:'#52C41A', WAITING:'#1890FF', CLEANING:'#FAAD14',
  QC_HOLD:'#722ED1',  ABNORMAL:'#F5222D', COMPLETED:'#8C8C8C', LOCKED:'#595959',
};
export const SCHEDULE_STATUS_LABEL: Record<ScheduleItemStatus, string> = {
  PRODUCING:'生产中', WAITING:'待生产', CLEANING:'清场中',
  QC_HOLD:'QC等待', ABNORMAL:'异常', COMPLETED:'已完成', LOCKED:'已锁定',
};
export const WO_STATUS_COLOR: Record<WoStatus, string> = {
  PENDING:'default', SCHEDULED:'blue', RELEASED:'cyan',
  RUNNING:'green', PAUSED:'orange', COMPLETED:'success', CANCELLED:'error',
};
export const WO_STATUS_LABEL: Record<WoStatus, string> = {
  PENDING:'待排程', SCHEDULED:'已排程', RELEASED:'已下达',
  RUNNING:'生产中', PAUSED:'暂停', COMPLETED:'已完成', CANCELLED:'已取消',
};
export const TIME_ZONE_LABEL: Record<TimeZone, string> = {
  HISTORY:'历史区', FROZEN:'冻结区(T+0~T+2)', ROLLING:'滚动区(T+3~T+14)', OUTLOOK:'展望区(>T+14)',
};
export const TIME_ZONE_COLOR: Record<TimeZone, string> = {
  HISTORY:'#f0f0f0', FROZEN:'#fff7e6', ROLLING:'#e6f7ff', OUTLOOK:'#f9f0ff',
};
export const TIME_ZONE_BG: Record<TimeZone, string> = {
  HISTORY:'#fafafa', FROZEN:'#fffbe6', ROLLING:'#f0f9ff', OUTLOOK:'#faf5ff',
};
export const CLEAN_STATUS_LABEL: Record<CleanStatus, string> = {
  PENDING:'待清场', IN_PROGRESS:'清场中', COMPLETED:'已完成', FAILED:'未通过',
};
export const CLEAN_STATUS_COLOR: Record<CleanStatus, string> = {
  PENDING:'default', IN_PROGRESS:'warning', COMPLETED:'success', FAILED:'error',
};
export const CLEAN_TYPE_LABEL: Record<CleanType, string> = {
  NONE:'无需清场', LIGHT:'轻度清场', STANDARD:'标准清场', DEEP:'深度清场',
};
export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  QC_FAIL:'QC不合格', QC_HOLD:'QC等待', EQUIPMENT_FAULT:'设备故障',
  INSERT_ORDER:'紧急插单', MATERIAL_DELAY:'原料延迟',
  STAFF_ABSENCE:'人员缺勤', MANUAL_ADJUST:'手工调整',
};
export const EVENT_TYPE_COLOR: Record<EventType, string> = {
  QC_FAIL:'red', QC_HOLD:'purple', EQUIPMENT_FAULT:'orange',
  INSERT_ORDER:'volcano', MATERIAL_DELAY:'gold',
  STAFF_ABSENCE:'cyan', MANUAL_ADJUST:'blue',
};

// ═══════════════════════════════════════════════════════════════
// 19. 工具函数
// ═══════════════════════════════════════════════════════════════
export function calcTimeZone(isoDate: string): TimeZone {
  const today = new Date('2026-06-14'); today.setHours(0,0,0,0);
  const dt = new Date(isoDate); dt.setHours(0,0,0,0);
  const diff = Math.floor((dt.getTime()-today.getTime())/86400000);
  if (diff < 0)   return 'HISTORY';
  if (diff <= 2)  return 'FROZEN';
  if (diff <= 14) return 'ROLLING';
  return 'OUTLOOK';
}

export function groupItemsByResource(items: ScheduleItem[]): Record<string, ScheduleItem[]> {
  return items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    if (!acc[item.resourceId]) acc[item.resourceId] = [];
    acc[item.resourceId].push(item);
    return acc;
  }, {});
}

export function getResourceById(id: string): Resource | undefined {
  return MOCK_RESOURCES.find(r => r.id === id);
}

export function getCalendarById(id: string): ResourceCalendar | undefined {
  return MOCK_CALENDARS.find(c => c.id === id);
}
