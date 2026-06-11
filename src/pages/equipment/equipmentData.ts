/**
 * equipmentData.ts
 * 设备管理模块 — 数据类型、常量与 Mock 数据
 * GMP 医疗器械根管锉生产场景
 */

// ══════════════════════════════════════════════════════════════
// 1. 基础类型
// ══════════════════════════════════════════════════════════════

export type EquipStatus = 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'FAULT' | 'SCRAPPED' | 'DISABLED';
export type EquipCategory = 'MACHINE' | 'INSPECT' | 'CLEAN' | 'COAT' | 'HEAT' | 'PACK' | 'MARK' | 'OTHER';
export type MaintType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'SPECIAL';
export type MaintStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE' | 'SKIPPED';
export type FaultLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FaultStatus = 'REPORTED' | 'ASSIGNED' | 'REPAIRING' | 'PENDING_VERIFY' | 'CLOSED' | 'CANCELLED';
export type CalibStatus = 'VALID' | 'EXPIRED' | 'PENDING' | 'IN_CALIBRATION' | 'FAILED';
export type SpareStatus = 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';

// ══════════════════════════════════════════════════════════════
// 2. 接口定义
// ══════════════════════════════════════════════════════════════

/** 设备档案 */
export interface EquipRecord {
  id: string;
  equipCode: string;          // 设备编码（唯一）
  equipName: string;
  category: EquipCategory;
  model: string;              // 型号规格
  brand: string;              // 品牌/厂商
  serialNo?: string;          // 出厂序列号
  workshop: string;           // 所属车间
  workCenter: string;         // 工作中心
  location: string;           // 安装位置
  purchaseDate: string;       // 购入日期
  installDate?: string;       // 安装验收日期
  warrantyDate: string;       // 保质期至
  assetNo?: string;           // 资产编号
  isSpecialProcess?: boolean; // 是否特殊工序设备（GMP）
  isValidationRequired?: boolean; // 是否需要验证
  precision?: string;         // 精度/关键参数
  status: EquipStatus;
  lastMaintDate?: string;     // 上次保养日期
  nextMaintDate?: string;     // 下次保养日期
  lastCalibDate?: string;     // 上次校准日期（仅检测设备）
  nextCalibDate?: string;     // 下次校准日期
  oeeTarget?: number;         // OEE目标 (%)
  currentOee?: number;        // 当前OEE (%)
  remark?: string;
  attachments?: string[];     // 文件附件列表（文件名）
  qrCode?: string;            // 设备二维码内容
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/** 维保计划 */
export interface MaintPlan {
  id: string;
  planNo: string;             // 维保计划编号
  equipId: string;
  equipCode: string;
  equipName: string;
  maintType: MaintType;       // 维保类型
  maintContent: string;       // 维保内容
  planDate: string;           // 计划日期
  planDuration: number;       // 计划工时(小时)
  assignee?: string;          // 负责人
  status: MaintStatus;
  actualDate?: string;        // 实际执行日期
  actualDuration?: number;    // 实际工时
  result?: string;            // 维保结果
  nextPlanDate?: string;      // 下次计划日期
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

/** 故障记录 */
export interface FaultRecord {
  id: string;
  faultNo: string;            // 故障单编号
  equipId: string;
  equipCode: string;
  equipName: string;
  faultTime: string;          // 故障发生时间
  reporter: string;           // 报告人
  faultDesc: string;          // 故障描述
  faultLevel: FaultLevel;     // 故障等级
  affectedBatch?: string;     // 影响的批号（若有在产批次）
  affectedWoNo?: string;      // 影响的工单号
  status: FaultStatus;
  assignee?: string;          // 维修负责人
  diagnose?: string;          // 故障诊断
  repairContent?: string;     // 维修内容
  spareParts?: string;        // 更换备件
  repairStart?: string;       // 维修开始时间
  repairEnd?: string;         // 维修完成时间
  downtime?: number;          // 停机时长(分钟)
  rootCause?: string;         // 根本原因(RCA)
  capaAction?: string;        // CAPA措施
  verifier?: string;          // 验收人
  verifyTime?: string;        // 验收时间
  verifyResult?: string;      // 验收结论
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

/** 计量校准记录 */
export interface CalibRecord {
  id: string;
  calibNo: string;            // 校准编号
  equipId: string;
  equipCode: string;
  equipName: string;
  calibType: 'INTERNAL' | 'EXTERNAL'; // 内部/外部校准
  calibOrg?: string;          // 校准机构（外部）
  calibDate: string;          // 校准日期
  nextCalibDate: string;      // 下次校准日期
  calibCycle: number;         // 校准周期（月）
  calibResult: 'PASS' | 'FAIL' | 'CONDITIONAL'; // 校准结果
  certNo?: string;            // 证书编号
  uncertainty?: string;       // 不确定度
  status: CalibStatus;
  measuredValue?: string;     // 测量值
  standardValue?: string;     // 标准值
  deviation?: string;         // 偏差
  operator?: string;          // 操作人
  remark?: string;
  createdAt: string;
}

/** 备件记录 */
export interface SparePartRecord {
  id: string;
  partCode: string;           // 备件编码
  partName: string;           // 备件名称
  partSpec: string;           // 规格型号
  applicableEquips: string[]; // 适用设备IDs
  unit: string;               // 单位
  currentStock: number;       // 当前库存
  safetyStock: number;        // 安全库存
  unitCost: number;           // 单价
  supplier?: string;          // 供应商
  leadTime?: number;          // 采购周期(天)
  location?: string;          // 存放位置
  status: SpareStatus;
  lastUsedDate?: string;
  remark?: string;
}

/** 设备批生产记录（设备使用记录与工单关联） */
export interface EquipUsageRecord {
  id: string;
  usageNo: string;            // 使用记录编号
  equipId: string;
  equipCode: string;
  equipName: string;
  woId?: string;              // 关联工单ID
  woNo?: string;              // 关联工单号
  taskId?: string;            // 关联任务单ID
  taskNo?: string;            // 关联任务单号
  batchNo?: string;           // 批号
  productCode?: string;       // 产品代码
  productName?: string;       // 产品名称
  operator: string;           // 操作人
  startTime: string;          // 开始使用时间
  endTime?: string;           // 结束时间
  duration?: number;          // 使用时长(分钟)
  setupParams?: string;       // 设备参数设置记录
  cleanBefore?: boolean;      // 使用前清洁确认
  cleanAfter?: boolean;       // 使用后清洁确认
  abnormalFlag?: boolean;     // 是否有异常
  abnormalDesc?: string;      // 异常描述
  operatorSign?: string;      // 操作人签名（电子签名）
  remark?: string;
  createdAt: string;
}

// ══════════════════════════════════════════════════════════════
// 3. 常量映射
// ══════════════════════════════════════════════════════════════

export const EQUIP_CATEGORY_MAP: Record<EquipCategory, { label: string; color: string; icon: string }> = {
  MACHINE:  { label: '加工设备', color: '#1677FF', icon: '⚙️' },
  INSPECT:  { label: '检测设备', color: '#FA8C16', icon: '🔬' },
  CLEAN:    { label: '清洗设备', color: '#13C2C2', icon: '🧹' },
  COAT:     { label: '涂层设备', color: '#722ED1', icon: '🎨' },
  HEAT:     { label: '热处理设备', color: '#FF4D4F', icon: '🔥' },
  PACK:     { label: '包装设备', color: '#52C41A', icon: '📦' },
  MARK:     { label: '标识设备', color: '#EB2F96', icon: '🏷️' },
  OTHER:    { label: '其他设备', color: '#8C8C8C', icon: '🔧' },
};

export const EQUIP_STATUS_MAP: Record<EquipStatus, { label: string; color: string; badge: any }> = {
  ACTIVE:      { label: '运行中',   color: '#52C41A', badge: 'success' },
  IDLE:        { label: '空闲',     color: '#1677FF', badge: 'processing' },
  MAINTENANCE: { label: '维保中',   color: '#FAAD14', badge: 'warning' },
  FAULT:       { label: '故障停机', color: '#FF4D4F', badge: 'error' },
  SCRAPPED:    { label: '已报废',   color: '#8C8C8C', badge: 'default' },
  DISABLED:    { label: '已停用',   color: '#BFBFBF', badge: 'default' },
};

export const MAINT_TYPE_MAP: Record<MaintType, { label: string; color: string }> = {
  DAILY:     { label: '日常保养', color: '#52C41A' },
  WEEKLY:    { label: '周保养',   color: '#1677FF' },
  MONTHLY:   { label: '月度保养', color: '#722ED1' },
  QUARTERLY: { label: '季度保养', color: '#FA8C16' },
  ANNUAL:    { label: '年度保养', color: '#EB2F96' },
  SPECIAL:   { label: '专项维保', color: '#FF4D4F' },
};

export const MAINT_STATUS_MAP: Record<MaintStatus, { label: string; color: string; badge: any }> = {
  PENDING:     { label: '待执行', color: '#1677FF', badge: 'processing' },
  IN_PROGRESS: { label: '执行中', color: '#FAAD14', badge: 'warning' },
  DONE:        { label: '已完成', color: '#52C41A', badge: 'success' },
  OVERDUE:     { label: '已逾期', color: '#FF4D4F', badge: 'error' },
  SKIPPED:     { label: '已跳过', color: '#8C8C8C', badge: 'default' },
};

export const FAULT_LEVEL_MAP: Record<FaultLevel, { label: string; color: string }> = {
  LOW:      { label: '低', color: '#52C41A' },
  MEDIUM:   { label: '中', color: '#FAAD14' },
  HIGH:     { label: '高', color: '#FF7A00' },
  CRITICAL: { label: '紧急', color: '#FF4D4F' },
};

export const FAULT_STATUS_MAP: Record<FaultStatus, { label: string; color: string; badge: any }> = {
  REPORTED:        { label: '已报告',   color: '#1677FF', badge: 'processing' },
  ASSIGNED:        { label: '已派工',   color: '#722ED1', badge: 'processing' },
  REPAIRING:       { label: '维修中',   color: '#FAAD14', badge: 'warning' },
  PENDING_VERIFY:  { label: '待验收',   color: '#FA8C16', badge: 'warning' },
  CLOSED:          { label: '已关闭',   color: '#52C41A', badge: 'success' },
  CANCELLED:       { label: '已取消',   color: '#8C8C8C', badge: 'default' },
};

export const CALIB_STATUS_MAP: Record<CalibStatus, { label: string; color: string; badge: any }> = {
  VALID:          { label: '有效',    color: '#52C41A', badge: 'success' },
  EXPIRED:        { label: '已过期',  color: '#FF4D4F', badge: 'error' },
  PENDING:        { label: '待校准',  color: '#1677FF', badge: 'processing' },
  IN_CALIBRATION: { label: '校准中',  color: '#FAAD14', badge: 'warning' },
  FAILED:         { label: '校准失败',color: '#FF4D4F', badge: 'error' },
};

// ══════════════════════════════════════════════════════════════
// 4. Mock 数据
// ══════════════════════════════════════════════════════════════

export const mockEquipRecords: EquipRecord[] = [
  {
    id: 'eq-001', equipCode: 'EQ-GRIND-001', equipName: '数控五轴磨床 #1',
    category: 'MACHINE', model: 'WALTER HELITRONIC POWER', brand: '瓦尔特(WALTER)',
    serialNo: 'WHR-2023-0615-001', workshop: '精密加工车间', workCenter: 'WC-GRIND-01',
    location: 'A区-01号位', purchaseDate: '2023-06-01', installDate: '2023-06-15',
    warrantyDate: '2026-06-01', assetNo: 'FA-2023-0615', isSpecialProcess: true,
    isValidationRequired: true, precision: '±0.002mm',
    status: 'ACTIVE', lastMaintDate: '2026-03-15', nextMaintDate: '2026-06-15',
    oeeTarget: 85, currentOee: 78,
    remark: '主力磨削设备，用于根管锉锥度磨削成型，瓶颈工序',
    qrCode: 'EQ-GRIND-001|数控五轴磨床#1|精密加工车间',
    createdAt: '2023-06-15', updatedAt: '2026-03-15', createdBy: '张工',
  },
  {
    id: 'eq-002', equipCode: 'EQ-GRIND-002', equipName: '数控五轴磨床 #2',
    category: 'MACHINE', model: 'WALTER HELITRONIC POWER', brand: '瓦尔特(WALTER)',
    serialNo: 'WHR-2023-0801-002', workshop: '精密加工车间', workCenter: 'WC-GRIND-01',
    location: 'A区-02号位', purchaseDate: '2023-08-01', installDate: '2023-08-15',
    warrantyDate: '2026-08-01', assetNo: 'FA-2023-0801', isSpecialProcess: true,
    isValidationRequired: true, precision: '±0.002mm',
    status: 'ACTIVE', lastMaintDate: '2026-03-15', nextMaintDate: '2026-06-15',
    oeeTarget: 85, currentOee: 82,
    remark: '备用磨削设备',
    qrCode: 'EQ-GRIND-002|数控五轴磨床#2|精密加工车间',
    createdAt: '2023-08-15', updatedAt: '2026-03-15', createdBy: '张工',
  },
  {
    id: 'eq-003', equipCode: 'EQ-HT-001', equipName: '镍钛合金热处理炉 #1',
    category: 'HEAT', model: 'KSL-1400X', brand: '科晶仪器',
    serialNo: 'KSL-2023-0301-001', workshop: '热处理车间', workCenter: 'WC-HT-01',
    location: 'B区-01号位', purchaseDate: '2023-03-01', installDate: '2023-03-15',
    warrantyDate: '2026-03-01', assetNo: 'FA-2023-0315', isSpecialProcess: true,
    isValidationRequired: true, precision: '±2℃',
    status: 'ACTIVE', lastMaintDate: '2026-02-10', nextMaintDate: '2026-05-10',
    oeeTarget: 80, currentOee: 75,
    remark: '特殊工序设备，马氏体相变热处理，需定期校准温控系统',
    qrCode: 'EQ-HT-001|热处理炉#1|热处理车间',
    createdAt: '2023-03-15', updatedAt: '2026-02-10', createdBy: '李工',
  },
  {
    id: 'eq-004', equipCode: 'EQ-HT-002', equipName: '镍钛合金热处理炉 #2',
    category: 'HEAT', model: 'KSL-1400X', brand: '科晶仪器',
    serialNo: 'KSL-2023-0302-002', workshop: '热处理车间', workCenter: 'WC-HT-01',
    location: 'B区-02号位', purchaseDate: '2023-05-01', installDate: '2023-05-10',
    warrantyDate: '2026-05-01', assetNo: 'FA-2023-0510', isSpecialProcess: true,
    isValidationRequired: true, precision: '±2℃',
    status: 'MAINTENANCE', lastMaintDate: '2026-01-20', nextMaintDate: '2026-04-20',
    remark: '控温模块故障维修中，预计5月1日恢复',
    qrCode: 'EQ-HT-002|热处理炉#2|热处理车间',
    createdAt: '2023-05-10', updatedAt: '2026-04-20', createdBy: '李工',
  },
  {
    id: 'eq-005', equipCode: 'EQ-COAT-001', equipName: 'PVD镀膜机',
    category: 'COAT', model: 'PLATIT π80', brand: 'PLATIT AG',
    serialNo: 'PLT-2022-1001-001', workshop: '涂层车间', workCenter: 'WC-COAT-01',
    location: 'C区-01号位', purchaseDate: '2022-10-01', installDate: '2022-11-01',
    warrantyDate: '2025-10-01', assetNo: 'FA-2022-1101', isSpecialProcess: true,
    isValidationRequired: true, precision: '涂层厚度 2-4μm',
    status: 'ACTIVE', lastMaintDate: '2026-03-01', nextMaintDate: '2026-06-01',
    oeeTarget: 75, currentOee: 70,
    remark: 'TiN/TiCN涂层专用，靶材消耗监控',
    qrCode: 'EQ-COAT-001|PVD镀膜机|涂层车间',
    createdAt: '2022-11-01', updatedAt: '2026-03-01', createdBy: '王工',
  },
  {
    id: 'eq-006', equipCode: 'EQ-THREAD-001', equipName: '数控螺纹滚压机',
    category: 'MACHINE', model: 'ZM-5080', brand: '上海机床厂',
    serialNo: 'ZM5080-2023-001', workshop: '精密加工车间', workCenter: 'WC-THREAD-01',
    location: 'A区-03号位', purchaseDate: '2023-01-15', installDate: '2023-02-01',
    warrantyDate: '2026-01-15', assetNo: 'FA-2023-0201', isSpecialProcess: false,
    precision: 'M0.3~M2.0',
    status: 'ACTIVE', lastMaintDate: '2026-02-25', nextMaintDate: '2026-05-25',
    oeeTarget: 80, currentOee: 76,
    remark: '根管锉柄部螺纹加工',
    qrCode: 'EQ-THREAD-001|螺纹滚压机|精密加工车间',
    createdAt: '2023-02-01', updatedAt: '2026-02-25', createdBy: '张工',
  },
  {
    id: 'eq-007', equipCode: 'EQ-USC-001', equipName: '超声波清洗机',
    category: 'CLEAN', model: 'GT-2200QTS', brand: '固特超声',
    serialNo: 'GT2200-2023-001', workshop: '清洗车间', workCenter: 'WC-CLEAN-01',
    location: 'E区-01号位', purchaseDate: '2023-05-01', installDate: '2023-05-15',
    warrantyDate: '2026-05-01', assetNo: 'FA-2023-0515', isSpecialProcess: false,
    status: 'ACTIVE', lastMaintDate: '2026-02-28', nextMaintDate: '2026-05-28',
    remark: '多槽超声波清洗，ISO 13485洁净要求',
    qrCode: 'EQ-USC-001|超声波清洗机|清洗车间',
    createdAt: '2023-05-15', updatedAt: '2026-02-28', createdBy: '赵工',
  },
  {
    id: 'eq-008', equipCode: 'EQ-INSP-001', equipName: '万能工具显微镜',
    category: 'INSPECT', model: 'PH-A14', brand: '尼康(Nikon)',
    serialNo: 'NK-PHA14-2022-001', workshop: '检验室', workCenter: 'WC-QC-01',
    location: 'F区-QC精密室', purchaseDate: '2022-06-01', installDate: '2022-06-15',
    warrantyDate: '2025-06-01', assetNo: 'FA-2022-0615', isSpecialProcess: false,
    isValidationRequired: true, precision: '±0.001mm',
    status: 'ACTIVE', lastMaintDate: '2026-01-10', nextMaintDate: '2026-07-10',
    lastCalibDate: '2026-01-10', nextCalibDate: '2026-07-10',
    remark: '每半年由法定计量所外部校准，计量证书管理',
    qrCode: 'EQ-INSP-001|万能工具显微镜|检验室',
    createdAt: '2022-06-15', updatedAt: '2026-01-10', createdBy: '陈工',
  },
  {
    id: 'eq-009', equipCode: 'EQ-INSP-002', equipName: '扭转疲劳试验机',
    category: 'INSPECT', model: 'TT-200', brand: 'ZwickRoell',
    serialNo: 'ZR-TT200-2024-001', workshop: '检验室', workCenter: 'WC-QC-01',
    location: 'F区-QC机械室', purchaseDate: '2024-03-01', installDate: '2024-03-20',
    warrantyDate: '2027-03-01', assetNo: 'FA-2024-0320', isSpecialProcess: false,
    isValidationRequired: true, precision: '0.01N·cm',
    status: 'ACTIVE', lastMaintDate: '2026-03-01', nextMaintDate: '2026-09-01',
    lastCalibDate: '2026-03-01', nextCalibDate: '2026-09-01',
    remark: 'ISO 3630-1扭转/疲劳测试，用于根管锉型式检验',
    qrCode: 'EQ-INSP-002|扭转疲劳试验机|检验室',
    createdAt: '2024-03-20', updatedAt: '2026-03-01', createdBy: '陈工',
  },
  {
    id: 'eq-010', equipCode: 'EQ-LASER-001', equipName: '光纤激光打标机',
    category: 'MARK', model: 'JPT M7 20W', brand: '杰普特激光',
    serialNo: 'JPT-M7-2024-001', workshop: '标识车间', workCenter: 'WC-MARK-01',
    location: 'D区-01号位', purchaseDate: '2024-01-15', installDate: '2024-01-25',
    warrantyDate: '2027-01-15', assetNo: 'FA-2024-0125', isSpecialProcess: false,
    precision: '标识线宽 0.01mm',
    status: 'ACTIVE', lastMaintDate: '2026-03-01', nextMaintDate: '2026-06-01',
    remark: 'UDI直接标记专用，每日清洁镜头，每月检查激光功率',
    qrCode: 'EQ-LASER-001|激光打标机|标识车间',
    createdAt: '2024-01-25', updatedAt: '2026-03-01', createdBy: '王工',
  },
  {
    id: 'eq-011', equipCode: 'EQ-PACK-001', equipName: '全自动热封机',
    category: 'PACK', model: 'SF-400A', brand: '顺丰封装设备',
    serialNo: 'SF400A-2023-001', workshop: '包装车间', workCenter: 'WC-PACK-01',
    location: 'H区-01号位', purchaseDate: '2023-11-01', installDate: '2023-11-15',
    warrantyDate: '2026-11-01', assetNo: 'FA-2023-1115', isSpecialProcess: false,
    precision: '封口强度≥15N/15mm',
    status: 'ACTIVE', lastMaintDate: '2026-02-20', nextMaintDate: '2026-05-20',
    remark: '初包装热封专用，Tyvek/PE复合包装',
    qrCode: 'EQ-PACK-001|全自动热封机|包装车间',
    createdAt: '2023-11-15', updatedAt: '2026-02-20', createdBy: '赵工',
  },
  {
    id: 'eq-012', equipCode: 'EQ-CUT-001', equipName: '数控切断机',
    category: 'MACHINE', model: 'GHC-250', brand: '上海机床厂',
    serialNo: 'GHC250-2023-001', workshop: '精密加工车间', workCenter: 'WC-CUT-01',
    location: 'A区-04号位', purchaseDate: '2023-02-01', installDate: '2023-02-15',
    warrantyDate: '2026-02-01', assetNo: 'FA-2023-0215', isSpecialProcess: false,
    precision: '切断精度 ±0.05mm',
    status: 'IDLE', lastMaintDate: '2026-02-15', nextMaintDate: '2026-05-15',
    remark: '镍钛丝棒料切断，刀具定期更换',
    qrCode: 'EQ-CUT-001|数控切断机|精密加工车间',
    createdAt: '2023-02-15', updatedAt: '2026-02-15', createdBy: '张工',
  },
];

export const mockMaintPlans: MaintPlan[] = [
  {
    id: 'mp-001', planNo: 'MP-20260415-001',
    equipId: 'eq-001', equipCode: 'EQ-GRIND-001', equipName: '数控五轴磨床 #1',
    maintType: 'MONTHLY', maintContent: '更换磨削液，清洁过滤器，检查主轴精度，润滑各导轨',
    planDate: '2026-04-15', planDuration: 4, assignee: '张师傅',
    status: 'DONE', actualDate: '2026-04-15', actualDuration: 3.5,
    result: '各项检查正常，更换磨削液5L，导轨油脂补充完毕',
    nextPlanDate: '2026-05-15',
    createdAt: '2026-04-01', updatedAt: '2026-04-15',
  },
  {
    id: 'mp-002', planNo: 'MP-20260510-001',
    equipId: 'eq-001', equipCode: 'EQ-GRIND-001', equipName: '数控五轴磨床 #1',
    maintType: 'MONTHLY', maintContent: '更换磨削液，清洁过滤器，检查主轴精度，润滑各导轨',
    planDate: '2026-05-15', planDuration: 4, assignee: '张师傅',
    status: 'PENDING',
    nextPlanDate: '2026-06-15',
    createdAt: '2026-04-15', updatedAt: '2026-04-15',
  },
  {
    id: 'mp-003', planNo: 'MP-20260401-002',
    equipId: 'eq-003', equipCode: 'EQ-HT-001', equipName: '镍钛合金热处理炉 #1',
    maintType: 'QUARTERLY', maintContent: '校准温控系统，更换热电偶，检查炉膛气密性，清洁发热体',
    planDate: '2026-04-10', planDuration: 8, assignee: '李师傅',
    status: 'DONE', actualDate: '2026-04-10', actualDuration: 9,
    result: '温控精度校准至±1.5℃，更换1根热电偶，气密性正常',
    nextPlanDate: '2026-07-10',
    createdAt: '2026-03-25', updatedAt: '2026-04-10',
  },
  {
    id: 'mp-004', planNo: 'MP-20260420-003',
    equipId: 'eq-004', equipCode: 'EQ-HT-002', equipName: '镍钛合金热处理炉 #2',
    maintType: 'SPECIAL', maintContent: '控温模块故障专项维修：更换PID控制器，重新校准温度曲线',
    planDate: '2026-04-20', planDuration: 16, assignee: '科晶工程师（外部）',
    status: 'IN_PROGRESS',
    createdAt: '2026-04-18', updatedAt: '2026-04-22',
  },
  {
    id: 'mp-005', planNo: 'MP-20260501-004',
    equipId: 'eq-005', equipCode: 'EQ-COAT-001', equipName: 'PVD镀膜机',
    maintType: 'QUARTERLY', maintContent: '靶材检查与更换，真空系统检测，清洁反应室，校准涂层厚度',
    planDate: '2026-05-01', planDuration: 12, assignee: 'PLATIT驻厂工程师',
    status: 'PENDING',
    createdAt: '2026-04-15', updatedAt: '2026-04-15',
  },
  {
    id: 'mp-006', planNo: 'MP-20260415-005',
    equipId: 'eq-008', equipCode: 'EQ-INSP-001', equipName: '万能工具显微镜',
    maintType: 'SPECIAL', maintContent: '外部年度计量校准（由法定计量检定机构执行）',
    planDate: '2026-04-30', planDuration: 2, assignee: '上海市计量所',
    status: 'PENDING',
    createdAt: '2026-04-10', updatedAt: '2026-04-10',
  },
  {
    id: 'mp-007', planNo: 'MP-20260301-006',
    equipId: 'eq-002', equipCode: 'EQ-GRIND-002', equipName: '数控五轴磨床 #2',
    maintType: 'MONTHLY', maintContent: '更换磨削液，清洁过滤器，检查主轴精度',
    planDate: '2026-03-15', planDuration: 4, assignee: '张师傅',
    status: 'OVERDUE', actualDate: undefined,
    createdAt: '2026-03-01', updatedAt: '2026-03-15',
  },
];

export const mockFaultRecords: FaultRecord[] = [
  {
    id: 'fr-001', faultNo: 'FT-20260420-001',
    equipId: 'eq-004', equipCode: 'EQ-HT-002', equipName: '镍钛合金热处理炉 #2',
    faultTime: '2026-04-20 08:30', reporter: '李操作员',
    faultDesc: '控温仪显示E3错误，炉温持续上升无法控制，紧急停机',
    faultLevel: 'CRITICAL',
    affectedBatch: 'LOT-20260420-003', affectedWoNo: 'WO-20260420-003',
    status: 'REPAIRING',
    assignee: '科晶工程师',
    diagnose: 'PID控制器故障，PWM输出异常，导致加热失控',
    repairContent: '拆除旧PID控制器，等待新备件到货',
    repairStart: '2026-04-20 10:00',
    downtime: 4320,
    rootCause: 'PID控制器元器件老化，已超过设计寿命',
    capaAction: '建议同型设备EQ-HT-001同步更换PID控制器，建立备件库',
    remark: '影响批次LOT-20260420-003已暂停，转移至EQ-HT-001处理',
    createdAt: '2026-04-20 08:35', updatedAt: '2026-04-22 14:00',
  },
  {
    id: 'fr-002', faultNo: 'FT-20260410-001',
    equipId: 'eq-001', equipCode: 'EQ-GRIND-001', equipName: '数控五轴磨床 #1',
    faultTime: '2026-04-10 14:20', reporter: '张操作员',
    faultDesc: '磨削液供液泵噪音异常，供液不稳定，刀具磨削热异常',
    faultLevel: 'MEDIUM',
    affectedBatch: undefined, affectedWoNo: undefined,
    status: 'CLOSED',
    assignee: '张维修员',
    diagnose: '供液泵叶轮磨损，密封件老化',
    repairContent: '更换供液泵叶轮及密封件，重新调整供液压力至0.3MPa',
    spareParts: '供液泵叶轮×1套，密封件×1套',
    repairStart: '2026-04-10 15:00', repairEnd: '2026-04-10 17:30',
    downtime: 190,
    rootCause: '磨削液中切屑未过滤完全，导致叶轮加速磨损',
    capaAction: '增加每日检查磨削液过滤器的频率，每周更换一次滤芯',
    verifier: '张工程师', verifyTime: '2026-04-11 08:00',
    verifyResult: '供液压力稳定，磨削热正常，验收通过',
    createdAt: '2026-04-10 14:25', updatedAt: '2026-04-11 08:05',
  },
  {
    id: 'fr-003', faultNo: 'FT-20260325-001',
    equipId: 'eq-005', equipCode: 'EQ-COAT-001', equipName: 'PVD镀膜机',
    faultTime: '2026-03-25 09:00', reporter: '王操作员',
    faultDesc: '真空泵抽气速度明显下降，达不到工艺要求真空度(<1×10⁻³Pa)',
    faultLevel: 'HIGH',
    affectedBatch: 'LOT-20260325-002', affectedWoNo: 'WO-20260325-002',
    status: 'CLOSED',
    assignee: 'PLATIT工程师（外部）',
    diagnose: '机械泵油污染，油封老化，前级泵抽速下降',
    repairContent: '更换真空泵油，更换油封，清洗前级泵，重新标定真空度',
    spareParts: '真空泵油5L×1桶，油封×2套',
    repairStart: '2026-03-25 10:00', repairEnd: '2026-03-26 12:00',
    downtime: 1560,
    rootCause: '真空泵油未按规定每3个月更换，油质劣化',
    capaAction: '修订维保规程，增加每3个月强制换油节点，加入维保计划',
    verifier: '王工程师', verifyTime: '2026-03-26 14:00',
    verifyResult: '真空度恢复至8×10⁻⁴Pa，工艺参数正常，验收通过',
    createdAt: '2026-03-25 09:10', updatedAt: '2026-03-26 14:05',
  },
  {
    id: 'fr-004', faultNo: 'FT-20260315-001',
    equipId: 'eq-007', equipCode: 'EQ-USC-001', equipName: '超声波清洗机',
    faultTime: '2026-03-15 11:30', reporter: '赵操作员',
    faultDesc: '3号槽超声波振子无振动，清洗效果差，工件表面残留切削油',
    faultLevel: 'MEDIUM',
    status: 'CLOSED',
    assignee: '赵维修员',
    diagnose: '超声波换能器老化断裂',
    repairContent: '更换3号槽换能器4支，重新校准超声功率',
    spareParts: '超声波换能器40kHz×4支',
    repairStart: '2026-03-15 14:00', repairEnd: '2026-03-16 10:00',
    downtime: 690,
    rootCause: '换能器使用年限超过3年，未纳入定期更换计划',
    capaAction: '建立换能器更换周期管理，每3年强制更换',
    verifier: '赵工程师', verifyTime: '2026-03-16 11:00',
    verifyResult: '超声功率恢复正常，清洁验证通过',
    createdAt: '2026-03-15 11:35', updatedAt: '2026-03-16 11:05',
  },
  {
    id: 'fr-005', faultNo: 'FT-20260428-001',
    equipId: 'eq-006', equipCode: 'EQ-THREAD-001', equipName: '数控螺纹滚压机',
    faultTime: '2026-04-28 16:00', reporter: '张操作员',
    faultDesc: '螺纹滚压头异响，产品螺纹尺寸偏差超出公差，已停机报告',
    faultLevel: 'HIGH',
    affectedBatch: 'LOT-20260428-001', affectedWoNo: 'WO-20260428-001',
    status: 'ASSIGNED',
    assignee: '张维修员',
    diagnose: undefined,
    repairContent: undefined,
    downtime: 120,
    remark: '已隔离本班次加工产品待检验确认',
    createdAt: '2026-04-28 16:05', updatedAt: '2026-04-28 16:30',
  },
];

export const mockCalibRecords: CalibRecord[] = [
  {
    id: 'cb-001', calibNo: 'CAL-20260110-001',
    equipId: 'eq-008', equipCode: 'EQ-INSP-001', equipName: '万能工具显微镜',
    calibType: 'EXTERNAL', calibOrg: '上海市计量检测技术研究院',
    calibDate: '2026-01-10', nextCalibDate: '2026-07-10', calibCycle: 6,
    calibResult: 'PASS', certNo: 'SH-MEAS-2026-001234',
    uncertainty: 'U=2μm (k=2)',
    status: 'VALID',
    measuredValue: '100.001mm (标准100mm量块)', standardValue: '100.000mm',
    deviation: '+0.001mm (合格限: ±0.003mm)',
    operator: '计量所工程师',
    remark: '校准证书有效期6个月，下次校准：2026-07-10前',
    createdAt: '2026-01-10',
  },
  {
    id: 'cb-002', calibNo: 'CAL-20260301-001',
    equipId: 'eq-009', equipCode: 'EQ-INSP-002', equipName: '扭转疲劳试验机',
    calibType: 'INTERNAL', calibOrg: undefined,
    calibDate: '2026-03-01', nextCalibDate: '2026-09-01', calibCycle: 6,
    calibResult: 'PASS', certNo: 'INT-CAL-2026-0301',
    status: 'VALID',
    measuredValue: '100.02N·cm (标准砝码)', standardValue: '100.00N·cm',
    deviation: '+0.02% (合格限: ±0.5%)',
    operator: '陈检验员',
    remark: '内部校准，使用NIST溯源的标准砝码',
    createdAt: '2026-03-01',
  },
  {
    id: 'cb-003', calibNo: 'CAL-20260201-001',
    equipId: 'eq-003', equipCode: 'EQ-HT-001', equipName: '镍钛合金热处理炉 #1',
    calibType: 'INTERNAL', calibOrg: undefined,
    calibDate: '2026-02-01', nextCalibDate: '2026-05-01', calibCycle: 3,
    calibResult: 'PASS', certNo: 'INT-TEMP-2026-0201',
    status: 'VALID',
    measuredValue: '800.5℃ (设定800℃)', standardValue: '800.0℃',
    deviation: '+0.5℃ (合格限: ±2℃)',
    operator: '李检验员',
    remark: '热电偶校准，使用PT100标准温度计对比',
    createdAt: '2026-02-01',
  },
  {
    id: 'cb-004', calibNo: 'CAL-20251010-001',
    equipId: 'eq-008', equipCode: 'EQ-INSP-001', equipName: '万能工具显微镜',
    calibType: 'EXTERNAL', calibOrg: '上海市计量检测技术研究院',
    calibDate: '2025-07-10', nextCalibDate: '2026-01-10', calibCycle: 6,
    calibResult: 'PASS', certNo: 'SH-MEAS-2025-005678',
    uncertainty: 'U=2μm (k=2)',
    status: 'EXPIRED',
    operator: '计量所工程师',
    remark: '历史记录，已过期，新记录见CAL-20260110-001',
    createdAt: '2025-07-10',
  },
];

export const mockUsageRecords: EquipUsageRecord[] = [
  // ── 关联 EBR批次 YS-RKQ-20260424-007（WO-EBR-004）────────────────────────
  {
    id: 'eu-001', usageNo: 'EU-20260424-001',
    equipId: 'eq-012', equipCode: 'EQ-CUT-001', equipName: '数控切断机',
    woId: 'wo-ebr-004', woNo: 'WO-EBR-004',
    taskNo: 'TK-EBR-004-D1',
    batchNo: 'YS-RKQ-20260424-007',
    productCode: 'YS-25-04', productName: '#25根管锉（YS款）',
    operator: '周八（OP006）',
    startTime: '2026-04-24 08:00', endTime: '2026-04-24 09:30',
    duration: 90,
    setupParams: '刀具规格：CUT-03，进给速度：0.20mm/min，切割长度：25.0mm',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '周八（OP006）-20260424',
    createdAt: '2026-04-24',
  },
  {
    id: 'eu-002', usageNo: 'EU-20260424-002',
    equipId: 'eq-001', equipCode: 'EQ-GRIND-001', equipName: '数控五轴磨床 #1',
    woId: 'wo-ebr-004', woNo: 'WO-EBR-004',
    taskNo: 'TK-EBR-004-D2',
    batchNo: 'YS-RKQ-20260424-007',
    productCode: 'YS-25-04', productName: '#25根管锉（YS款）',
    operator: '周八（OP006）',
    startTime: '2026-04-24 09:30', endTime: '2026-04-24 12:30',
    duration: 180,
    setupParams: '主轴转速：4500rpm，进给速度：0.12mm/min，砂轮规格：SB-003',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '周八（OP006）-20260424',
    createdAt: '2026-04-24',
  },
  {
    id: 'eu-003', usageNo: 'EU-20260424-003',
    equipId: 'eq-006', equipCode: 'EQ-THREAD-001', equipName: '数控螺纹滚压机',
    woId: 'wo-ebr-004', woNo: 'WO-EBR-004',
    taskNo: 'TK-EBR-004-D3',
    batchNo: 'YS-RKQ-20260424-007',
    productCode: 'YS-25-04', productName: '#25根管锉（YS款）',
    operator: '周八（OP006）',
    startTime: '2026-04-24 12:30', endTime: '2026-04-24 13:30',
    duration: 60,
    setupParams: '滚压压力：12MPa，螺距：0.22mm，转速：500rpm',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '周八（OP006）-20260424',
    createdAt: '2026-04-24',
  },
  {
    id: 'eu-004', usageNo: 'EU-20260424-004',
    equipId: 'eq-003', equipCode: 'EQ-HT-001', equipName: '镍钛合金热处理炉 #1',
    woId: 'wo-ebr-004', woNo: 'WO-EBR-004',
    taskNo: 'TK-EBR-004-D4',
    batchNo: 'YS-RKQ-20260424-007',
    productCode: 'YS-25-04', productName: '#25根管锉（YS款）',
    operator: '李四（OP002）',
    startTime: '2026-04-24 14:00', endTime: '2026-04-24 16:30',
    duration: 150,
    setupParams: '升温速率：6.0℃/min，保温温度：500℃，保温时间：12min，炉次号：HT-20260424-F01',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '李四（OP002）-20260424',
    createdAt: '2026-04-24',
  },
  {
    id: 'eu-005', usageNo: 'EU-20260424-005',
    equipId: 'eq-007', equipCode: 'EQ-USC-001', equipName: '超声波清洗机',
    woId: 'wo-ebr-004', woNo: 'WO-EBR-004',
    taskNo: 'TK-EBR-004-D5',
    batchNo: 'YS-RKQ-20260424-007',
    productCode: 'YS-25-04', productName: '#25根管锉（YS款）',
    operator: '王五（OP003）',
    startTime: '2026-04-24 19:00', endTime: '2026-04-24 19:30',
    duration: 30,
    setupParams: '清洗频率：40kHz，清洗时间：15min，清洗温度：45℃',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '王五（OP003）-20260424',
    createdAt: '2026-04-24',
  },
  // ── 关联 EBR批次 YS-RKQ-20260425-001（WO-EBR-006）────────────────────────
  {
    id: 'eu-006', usageNo: 'EU-20260425-001',
    equipId: 'eq-002', equipCode: 'EQ-GRIND-002', equipName: '数控五轴磨床 #2',
    woId: 'wo-ebr-006', woNo: 'WO-EBR-006',
    taskNo: 'TK-EBR-006-D1',
    batchNo: 'YS-RKQ-20260425-001',
    productCode: 'YS-30-04', productName: '#30根管锉（YS款）',
    operator: '张三（OP001）',
    startTime: '2026-04-25 08:00', endTime: '2026-04-25 11:00',
    duration: 180,
    setupParams: '主轴转速：3800rpm，砂轮规格：SA-002，进给量：0.015mm',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '张三（OP001）-20260425',
    createdAt: '2026-04-25',
  },
  {
    id: 'eu-007', usageNo: 'EU-20260425-002',
    equipId: 'eq-004', equipCode: 'EQ-HT-002', equipName: '镍钛合金热处理炉 #2',
    woId: 'wo-ebr-006', woNo: 'WO-EBR-006',
    taskNo: 'TK-EBR-006-D2',
    batchNo: 'YS-RKQ-20260425-001',
    productCode: 'YS-30-04', productName: '#30根管锉（YS款）',
    operator: '李四（OP002）',
    startTime: '2026-04-25 13:00', endTime: '2026-04-25 15:30',
    duration: 150,
    setupParams: '升温速率：5.5℃/min，保温温度：510℃，保温时间：15min，炉次号：HT-20260425-F01',
    cleanBefore: true, cleanAfter: false, abnormalFlag: true,
    abnormalDesc: '热处理结束后清洁确认延迟，已补充清洁记录',
    operatorSign: '李四（OP002）-20260425',
    createdAt: '2026-04-25',
  },
  // ── 关联 EBR批次 YS-RKQ-20260423-010（WO-EBR-001）────────────────────────
  {
    id: 'eu-008', usageNo: 'EU-20260423-001',
    equipId: 'eq-001', equipCode: 'EQ-GRIND-001', equipName: '数控五轴磨床 #1',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-D1',
    batchNo: 'YS-RKQ-20260423-010',
    productCode: 'YS-15-02', productName: '#15根管锉（YS款）',
    operator: '张三（OP001）',
    startTime: '2026-04-23 08:30', endTime: '2026-04-23 12:00',
    duration: 210,
    setupParams: '主轴转速：4000rpm，砂轮规格：SC-001，进给量：0.010mm，冷却液流量：2.5L/min',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '张三（OP001）-20260423',
    createdAt: '2026-04-23',
  },
  {
    id: 'eu-009', usageNo: 'EU-20260423-002',
    equipId: 'eq-005', equipCode: 'EQ-COAT-001', equipName: 'PVD镀膜机',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-D2',
    batchNo: 'YS-RKQ-20260423-010',
    productCode: 'YS-15-02', productName: '#15根管锉（YS款）',
    operator: '王五（OP003）',
    startTime: '2026-04-23 14:00', endTime: '2026-04-23 18:00',
    duration: 240,
    setupParams: 'TiN涂层，偏压-90V，温度440℃，镀膜时间3.5h，靶电流5.5A',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '王五（OP003）-20260423',
    createdAt: '2026-04-23',
  },
  // ── 独立记录（非批记录联动）────────────────────────────────────────────────
  {
    id: 'eu-010', usageNo: 'EU-20260429-003',
    equipId: 'eq-008', equipCode: 'EQ-INSP-001', equipName: '万能工具显微镜',
    woId: 'wo-001', woNo: 'WO-20260429-001',
    batchNo: 'LOT-20260429-001',
    productCode: 'NTF-25-04', productName: '#25/.04根管锉',
    operator: '张操作员',
    startTime: '2026-04-29 08:00', endTime: '2026-04-29 11:30',
    duration: 210,
    setupParams: '锥度4%，转速3000rpm，磨削液流量3L/min，进给量0.02mm',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '张操作员-20260429',
    createdAt: '2026-04-29',
  },
  {
    id: 'eu-011', usageNo: 'EU-20260429-004',
    equipId: 'eq-003', equipCode: 'EQ-HT-001', equipName: '镍钛合金热处理炉 #1',
    woId: 'wo-001', woNo: 'WO-20260429-001',
    batchNo: 'LOT-20260429-001',
    productCode: 'NTF-25-04', productName: '#25/.04根管锉',
    operator: '李操作员',
    startTime: '2026-04-29 13:00', endTime: '2026-04-29 17:00',
    duration: 240,
    setupParams: '温度曲线：600℃/5min→800℃/20min→600℃/10min，气氛：惰性气体',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '李操作员-20260429',
    createdAt: '2026-04-29',
  },
  {
    id: 'eu-012', usageNo: 'EU-20260428-001',
    equipId: 'eq-005', equipCode: 'EQ-COAT-001', equipName: 'PVD镀膜机',
    woId: 'wo-002', woNo: 'WO-20260428-001',
    batchNo: 'LOT-20260428-001',
    productCode: 'NTF-30-06', productName: '#30/.06根管锉',
    operator: '王操作员',
    startTime: '2026-04-28 08:00', endTime: '2026-04-28 14:00',
    duration: 360,
    setupParams: 'TiN涂层，偏压-100V，温度450℃，镀膜时间4h，靶电流6A',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '王操作员-20260428',
    createdAt: '2026-04-28',
  },
];

export const mockSpareparts: SparePartRecord[] = [
  {
    id: 'sp-001', partCode: 'SP-GRIND-001', partName: '磨削液',
    partSpec: '水溶性磨削液，稀释比1:20', applicableEquips: ['eq-001', 'eq-002'],
    unit: 'L', currentStock: 45, safetyStock: 20, unitCost: 35,
    supplier: '上海切削液公司', leadTime: 3, location: '辅料库A区-001',
    status: 'NORMAL', lastUsedDate: '2026-04-15',
  },
  {
    id: 'sp-002', partCode: 'SP-GRIND-002', partName: '供液泵密封件套装',
    partSpec: '适配WALTER泵，NBR材质', applicableEquips: ['eq-001', 'eq-002'],
    unit: '套', currentStock: 3, safetyStock: 2, unitCost: 280,
    supplier: '瓦尔特中国', leadTime: 14, location: '备件库B区-002',
    status: 'NORMAL', lastUsedDate: '2026-04-10',
  },
  {
    id: 'sp-003', partCode: 'SP-HT-001', partName: '热电偶（K型）',
    partSpec: 'K型，直径3mm，长度500mm，精度±1℃', applicableEquips: ['eq-003', 'eq-004'],
    unit: '支', currentStock: 4, safetyStock: 3, unitCost: 180,
    supplier: '科晶仪器', leadTime: 7, location: '备件库B区-010',
    status: 'NORMAL', lastUsedDate: '2026-04-10',
  },
  {
    id: 'sp-004', partCode: 'SP-HT-002', partName: 'PID控制器',
    partSpec: 'KSL-1400X配套，220V，100A', applicableEquips: ['eq-003', 'eq-004'],
    unit: '台', currentStock: 0, safetyStock: 1, unitCost: 3500,
    supplier: '科晶仪器', leadTime: 21, location: '备件库B区-011',
    status: 'OUT_OF_STOCK', lastUsedDate: '2026-04-20',
    remark: '紧急采购中，EQ-HT-002故障急需',
  },
  {
    id: 'sp-005', partCode: 'SP-COAT-001', partName: '真空泵油',
    partSpec: 'Busch RL 47 真空泵专用油，5L/桶', applicableEquips: ['eq-005'],
    unit: '桶', currentStock: 2, safetyStock: 2, unitCost: 680,
    supplier: 'PLATIT中国', leadTime: 10, location: '辅料库C区-001',
    status: 'LOW_STOCK', lastUsedDate: '2026-03-25',
  },
  {
    id: 'sp-006', partCode: 'SP-USC-001', partName: '超声波换能器',
    partSpec: '40kHz，200W，不锈钢外壳', applicableEquips: ['eq-007'],
    unit: '支', currentStock: 6, safetyStock: 4, unitCost: 420,
    supplier: '固特超声', leadTime: 10, location: '备件库E区-001',
    status: 'NORMAL', lastUsedDate: '2026-03-16',
  },
];

// ══════════════════════════════════════════════════════════════
// 5. 辅助函数
// ══════════════════════════════════════════════════════════════

export function getEquipById(id: string): EquipRecord | undefined {
  return mockEquipRecords.find(e => e.id === id);
}

export function getDaysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/** 计算设备综合状态评分 */
export function calcEquipScore(eq: EquipRecord, faults: FaultRecord[]): number {
  let score = 100;
  if (eq.status === 'FAULT') score -= 40;
  if (eq.status === 'MAINTENANCE') score -= 20;
  if (isOverdue(eq.nextMaintDate)) score -= 15;
  if (isOverdue(eq.nextCalibDate)) score -= 15;
  const recentFaults = faults.filter(f => f.equipId === eq.id && f.status !== 'CLOSED' && f.status !== 'CANCELLED');
  score -= recentFaults.length * 10;
  return Math.max(0, score);
}
