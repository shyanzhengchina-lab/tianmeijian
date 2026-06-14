/**
 * equipmentData.ts
 * 设备管理模块 — 数据类型、常量与 Mock 数据
 * 天美健保健品MES — 南京工厂（固体制剂/VitC咀嚼片）+ 溧水工厂（冷链/益生菌胶囊）
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
  // ══════════════════════════════════════════════════════════════
  // 南京工厂 — 固体制剂车间（VitC咀嚼片）
  // ══════════════════════════════════════════════════════════════
  {
    id: 'eq-001', equipCode: 'EQ-GRAN-001', equipName: '湿法制粒机 #1',
    category: 'MACHINE', model: 'GHL-200', brand: '重庆英格',
    serialNo: 'GHL200-2023-NJ-001', workshop: '固体制剂车间（D级）', workCenter: 'WC-GRAN-01',
    location: 'A区-01号位', purchaseDate: '2023-04-01', installDate: '2023-04-20',
    warrantyDate: '2026-04-01', assetNo: 'FA-NJ-2023-0420', isSpecialProcess: true,
    isValidationRequired: true, precision: '搅拌转速±5rpm，制粒桨±2rpm',
    status: 'ACTIVE', lastMaintDate: '2026-05-10', nextMaintDate: '2026-06-10',
    oeeTarget: 85, currentOee: 82,
    remark: '主力制粒设备，VitC咀嚼片湿法制粒关键工序，需IQ/OQ/PQ验证',
    qrCode: 'EQ-GRAN-001|湿法制粒机#1|固体制剂车间',
    createdAt: '2023-04-20', updatedAt: '2026-05-10', createdBy: '张工程师',
  },
  {
    id: 'eq-002', equipCode: 'EQ-FLUID-001', equipName: '流化床干燥机 #1',
    category: 'HEAT', model: 'FL-200', brand: '常州永信',
    serialNo: 'FL200-2023-NJ-001', workshop: '固体制剂车间（D级）', workCenter: 'WC-DRY-01',
    location: 'A区-02号位', purchaseDate: '2023-04-01', installDate: '2023-04-22',
    warrantyDate: '2026-04-01', assetNo: 'FA-NJ-2023-0422', isSpecialProcess: true,
    isValidationRequired: true, precision: '进风温度±2℃，出口温度±1℃',
    status: 'ACTIVE', lastMaintDate: '2026-05-12', nextMaintDate: '2026-06-12',
    oeeTarget: 80, currentOee: 78,
    remark: '湿颗粒干燥，需定期校准温控系统；过滤袋每批检查，每月更换',
    qrCode: 'EQ-FLUID-001|流化床干燥机#1|固体制剂车间',
    createdAt: '2023-04-22', updatedAt: '2026-05-12', createdBy: '张工程师',
  },
  {
    id: 'eq-003', equipCode: 'EQ-PRESS-001', equipName: '旋转式压片机 #1',
    category: 'MACHINE', model: 'ZP-35', brand: '上海天祥',
    serialNo: 'ZP35-2023-NJ-001', workshop: '固体制剂车间（D级）', workCenter: 'WC-PRESS-01',
    location: 'B区-01号位', purchaseDate: '2023-06-01', installDate: '2023-06-15',
    warrantyDate: '2026-06-01', assetNo: 'FA-NJ-2023-0615', isSpecialProcess: true,
    isValidationRequired: true, precision: '片重差异≤±5%，硬度±10%',
    status: 'ACTIVE', lastMaintDate: '2026-05-20', nextMaintDate: '2026-06-20',
    oeeTarget: 88, currentOee: 85,
    remark: '35冲旋转压片，VitC咀嚼片500mg关键设备；冲模每批检查，每半年更换',
    qrCode: 'EQ-PRESS-001|旋转式压片机#1|固体制剂车间',
    createdAt: '2023-06-15', updatedAt: '2026-05-20', createdBy: '张工程师',
  },
  {
    id: 'eq-004', equipCode: 'EQ-COAT-001', equipName: '高效包衣机 BFC-150',
    category: 'COAT', model: 'BFC-150', brand: '常州英格',
    serialNo: 'BFC150-2024-NJ-001', workshop: '固体制剂车间（D级）', workCenter: 'WC-COAT-01',
    location: 'B区-02号位', purchaseDate: '2024-01-10', installDate: '2024-01-25',
    warrantyDate: '2027-01-10', assetNo: 'FA-NJ-2024-0125', isSpecialProcess: true,
    isValidationRequired: true, precision: '包衣增重率±0.2%，进风温度±2℃',
    status: 'ACTIVE', lastMaintDate: '2026-05-15', nextMaintDate: '2026-06-15',
    oeeTarget: 80, currentOee: 77,
    remark: '薄膜包衣专用，OPADRY包衣液，关键参数：增重率2~4%；喷枪每批检查',
    qrCode: 'EQ-COAT-001|高效包衣机BFC-150|固体制剂车间',
    createdAt: '2024-01-25', updatedAt: '2026-05-15', createdBy: '王工程师',
  },
  {
    id: 'eq-005', equipCode: 'EQ-MIX-001', equipName: '三维运动混合机',
    category: 'MACHINE', model: 'SYH-500', brand: '无锡新达',
    serialNo: 'SYH500-2023-NJ-001', workshop: '固体制剂车间（D级）', workCenter: 'WC-MIX-01',
    location: 'A区-03号位', purchaseDate: '2023-05-01', installDate: '2023-05-15',
    warrantyDate: '2026-05-01', assetNo: 'FA-NJ-2023-0515', isSpecialProcess: false,
    precision: '混合转速10~20rpm，容积500L',
    status: 'ACTIVE', lastMaintDate: '2026-04-25', nextMaintDate: '2026-07-25',
    oeeTarget: 75, currentOee: 73,
    remark: '总混工序，混合时间和转速经验证；每季度检查密封圈',
    qrCode: 'EQ-MIX-001|三维混合机|固体制剂车间',
    createdAt: '2023-05-15', updatedAt: '2026-04-25', createdBy: '张工程师',
  },
  {
    id: 'eq-006', equipCode: 'EQ-COUNT-001', equipName: '全自动数片机',
    category: 'PACK', model: 'PPC-3000', brand: '杭州中亚',
    serialNo: 'PPC3000-2023-NJ-001', workshop: '包装车间（D级）', workCenter: 'WC-COUNT-01',
    location: 'C区-01号位', purchaseDate: '2023-09-01', installDate: '2023-09-15',
    warrantyDate: '2026-09-01', assetNo: 'FA-NJ-2023-0915', isSpecialProcess: false,
    precision: '数片精度±0片，速度3000粒/min',
    status: 'ACTIVE', lastMaintDate: '2026-05-01', nextMaintDate: '2026-06-01',
    oeeTarget: 90, currentOee: 88,
    remark: '内包装瓶装数片，光电传感器每月校准',
    qrCode: 'EQ-COUNT-001|全自动数片机|包装车间',
    createdAt: '2023-09-15', updatedAt: '2026-05-01', createdBy: '赵工程师',
  },
  {
    id: 'eq-007', equipCode: 'EQ-LABEL-001', equipName: '激光喷码机（批号打印）',
    category: 'MARK', model: 'CL-650C', brand: '科迪华激光',
    serialNo: 'CL650C-2024-NJ-001', workshop: '包装车间（D级）', workCenter: 'WC-MARK-01',
    location: 'C区-02号位', purchaseDate: '2024-03-01', installDate: '2024-03-15',
    warrantyDate: '2027-03-01', assetNo: 'FA-NJ-2024-0315', isSpecialProcess: false,
    precision: '字符高度±0.1mm，打印速度≤12m/min',
    status: 'ACTIVE', lastMaintDate: '2026-04-15', nextMaintDate: '2026-07-15',
    remark: 'GMP批号/生产日期/有效期激光喷印；每日校验打印质量',
    qrCode: 'EQ-LABEL-001|激光喷码机|包装车间',
    createdAt: '2024-03-15', updatedAt: '2026-04-15', createdBy: '赵工程师',
  },
  {
    id: 'eq-008', equipCode: 'EQ-CARTONER-001', equipName: '全自动装盒机',
    category: 'PACK', model: 'ZH-120', brand: '温州汇博',
    serialNo: 'ZH120-2023-NJ-001', workshop: '包装车间（D级）', workCenter: 'WC-PACK-01',
    location: 'C区-03号位', purchaseDate: '2023-10-01', installDate: '2023-10-20',
    warrantyDate: '2026-10-01', assetNo: 'FA-NJ-2023-1020', isSpecialProcess: false,
    precision: '装盒速度120盒/min，说明书折叠精度±1mm',
    status: 'ACTIVE', lastMaintDate: '2026-05-05', nextMaintDate: '2026-06-05',
    oeeTarget: 85, currentOee: 83,
    remark: '外包装装盒，含说明书插入；每班首件确认',
    qrCode: 'EQ-CARTONER-001|全自动装盒机|包装车间',
    createdAt: '2023-10-20', updatedAt: '2026-05-05', createdBy: '赵工程师',
  },
  // ══════════════════════════════════════════════════════════════
  // 溧水工厂 — 益生菌胶囊（C级洁净，冷链≤8℃）
  // ══════════════════════════════════════════════════════════════
  {
    id: 'eq-009', equipCode: 'EQ-CAPS-001', equipName: '全自动胶囊充填机',
    category: 'MACHINE', model: 'NJP-1200C', brand: '常州金远',
    serialNo: 'NJP1200C-2023-LS-001', workshop: '胶囊充填车间（C级）', workCenter: 'WC-CAPS-01',
    location: 'A区-01号位（溧水厂）', purchaseDate: '2023-07-01', installDate: '2023-07-20',
    warrantyDate: '2026-07-01', assetNo: 'FA-LS-2023-0720', isSpecialProcess: true,
    isValidationRequired: true, precision: '装量差异≤±7.5%，速度1200粒/min',
    status: 'ACTIVE', lastMaintDate: '2026-05-18', nextMaintDate: '2026-06-18',
    oeeTarget: 85, currentOee: 80,
    remark: '益生菌胶囊关键工序；操作间温度≤20℃，湿度≤50%；活菌数防护',
    qrCode: 'EQ-CAPS-001|胶囊充填机#1|胶囊充填车间',
    createdAt: '2023-07-20', updatedAt: '2026-05-18', createdBy: '李工程师',
  },
  {
    id: 'eq-010', equipCode: 'EQ-COLDCHAIN-001', equipName: '冷链储存柜（益生菌专用）',
    category: 'OTHER', model: 'YC-1000', brand: '中科美菱',
    serialNo: 'YC1000-2023-LS-001', workshop: '冷链储存区（≤8℃）', workCenter: 'WC-COLD-01',
    location: 'G区-冷链1号（溧水厂）', purchaseDate: '2023-06-01', installDate: '2023-06-15',
    warrantyDate: '2026-06-01', assetNo: 'FA-LS-2023-0615', isSpecialProcess: true,
    isValidationRequired: true, precision: '温度±0.5℃（2~8℃范围）',
    status: 'ACTIVE', lastMaintDate: '2026-05-20', nextMaintDate: '2026-06-20',
    lastCalibDate: '2026-03-01', nextCalibDate: '2026-09-01',
    oeeTarget: 99, currentOee: 99,
    remark: '益生菌原料及成品冷链存储，24h温度监控；温度超标自动报警',
    qrCode: 'EQ-COLDCHAIN-001|冷链储存柜|冷链储存区',
    createdAt: '2023-06-15', updatedAt: '2026-05-20', createdBy: '李工程师',
  },
  {
    id: 'eq-011', equipCode: 'EQ-COLDCHAIN-002', equipName: '冷链运输车（溧水→南京）',
    category: 'OTHER', model: 'THERMO KING T-600R', brand: 'Thermo King',
    serialNo: 'TK-T600R-2024-LS-001', workshop: '物流中心（溧水厂）', workCenter: 'WC-LOGISTICS-01',
    location: '停车场-冷链专区（溧水厂）', purchaseDate: '2024-02-01', installDate: '2024-02-15',
    warrantyDate: '2027-02-01', assetNo: 'FA-LS-2024-0215', isSpecialProcess: true,
    isValidationRequired: true, precision: '车厢温度≤8℃，温度波动±1℃',
    status: 'IDLE', lastMaintDate: '2026-04-10', nextMaintDate: '2026-07-10',
    lastCalibDate: '2026-04-01', nextCalibDate: '2026-10-01',
    remark: '益生菌胶囊冷链配送专用，实时GPS+温度记录仪；每次运输前验证温度',
    qrCode: 'EQ-COLDCHAIN-002|冷链运输车|物流中心',
    createdAt: '2024-02-15', updatedAt: '2026-04-10', createdBy: '李工程师',
  },
  // ══════════════════════════════════════════════════════════════
  // 共用QC实验室设备（南京工厂检验室）
  // ══════════════════════════════════════════════════════════════
  {
    id: 'eq-012', equipCode: 'EQ-HPLC-001', equipName: 'HPLC高效液相色谱仪',
    category: 'INSPECT', model: 'LC-2030C 3D', brand: '岛津（Shimadzu）',
    serialNo: 'SZ-LC2030-2022-001', workshop: '质检实验室', workCenter: 'WC-QC-HPLC',
    location: 'QC实验室-仪器间A', purchaseDate: '2022-08-01', installDate: '2022-08-20',
    warrantyDate: '2025-08-01', assetNo: 'FA-NJ-2022-0820', isSpecialProcess: false,
    isValidationRequired: true, precision: 'RSD≤2%（峰面积），波长精度±0.5nm',
    status: 'ACTIVE', lastMaintDate: '2026-04-01', nextMaintDate: '2026-07-01',
    lastCalibDate: '2026-04-01', nextCalibDate: '2026-10-01',
    remark: 'VitC含量（HPLC法）、益生菌中糖分测定；每季度外部校准；色谱柱需定期更换',
    qrCode: 'EQ-HPLC-001|HPLC|QC实验室',
    createdAt: '2022-08-20', updatedAt: '2026-04-01', createdBy: '陈工程师',
  },
  {
    id: 'eq-013', equipCode: 'EQ-DISS-001', equipName: '溶出度测定仪',
    category: 'INSPECT', model: 'RC-806D', brand: '天大天发',
    serialNo: 'RC806D-2023-NJ-001', workshop: '质检实验室', workCenter: 'WC-QC-DISS',
    location: 'QC实验室-理化间B', purchaseDate: '2023-03-01', installDate: '2023-03-15',
    warrantyDate: '2026-03-01', assetNo: 'FA-NJ-2023-0315', isSpecialProcess: false,
    isValidationRequired: true, precision: '转速精度±1rpm，温度精度±0.2℃',
    status: 'ACTIVE', lastMaintDate: '2026-03-15', nextMaintDate: '2026-09-15',
    lastCalibDate: '2026-03-15', nextCalibDate: '2026-09-15',
    remark: 'VitC咀嚼片崩解/溶出度测定，中国药典2020版方法；每半年外部校准',
    qrCode: 'EQ-DISS-001|溶出度仪|QC实验室',
    createdAt: '2023-03-15', updatedAt: '2026-03-15', createdBy: '陈工程师',
  },
  {
    id: 'eq-014', equipCode: 'EQ-COLONY-001', equipName: '活菌数检测仪（菌落计数）',
    category: 'INSPECT', model: 'Scan™ 1200', brand: '梅里埃（bioMérieux）',
    serialNo: 'BM-SC1200-2023-LS-001', workshop: '微生物实验室（溧水厂）', workCenter: 'WC-MICRO-01',
    location: 'QC微生物室-A（溧水厂）', purchaseDate: '2023-08-01', installDate: '2023-08-20',
    warrantyDate: '2026-08-01', assetNo: 'FA-LS-2023-0820', isSpecialProcess: false,
    isValidationRequired: true, precision: '计数精度：CV≤5%（菌落数≥30）',
    status: 'ACTIVE', lastMaintDate: '2026-04-20', nextMaintDate: '2026-07-20',
    lastCalibDate: '2026-04-01', nextCalibDate: '2026-10-01',
    remark: '益生菌活菌数（CFU/粒）检测，关键质量属性；需在洁净间内操作',
    qrCode: 'EQ-COLONY-001|活菌数检测仪|微生物实验室',
    createdAt: '2023-08-20', updatedAt: '2026-04-20', createdBy: '陈工程师',
  },
  {
    id: 'eq-015', equipCode: 'EQ-BALANCE-001', equipName: '万分之一天平',
    category: 'INSPECT', model: 'ME204E', brand: '梅特勒-托利多（Mettler-Toledo）',
    serialNo: 'MT-ME204E-2022-001', workshop: '质检实验室', workCenter: 'WC-QC-WEIGH',
    location: 'QC实验室-称量间', purchaseDate: '2022-06-01', installDate: '2022-06-10',
    warrantyDate: '2025-06-01', assetNo: 'FA-NJ-2022-0610', isSpecialProcess: false,
    isValidationRequired: true, precision: '读数精度0.1mg，线性误差±0.2mg',
    status: 'ACTIVE', lastMaintDate: '2026-05-01', nextMaintDate: '2026-08-01',
    lastCalibDate: '2026-05-01', nextCalibDate: '2026-11-01',
    remark: '每日使用标准砝码校准；每半年由法定计量机构外部校准；GMP计量器具',
    qrCode: 'EQ-BALANCE-001|万分之一天平|QC实验室',
    createdAt: '2022-06-10', updatedAt: '2026-05-01', createdBy: '陈工程师',
  },
  {
    id: 'eq-016', equipCode: 'EQ-HARDNESS-001', equipName: '片剂硬度脆碎度仪',
    category: 'INSPECT', model: 'TBH 425D', brand: '电立（ERWEKA）',
    serialNo: 'ER-TBH425-2023-NJ-001', workshop: '质检实验室', workCenter: 'WC-QC-HARD',
    location: 'QC实验室-理化间A', purchaseDate: '2023-05-01', installDate: '2023-05-15',
    warrantyDate: '2026-05-01', assetNo: 'FA-NJ-2023-0515', isSpecialProcess: false,
    isValidationRequired: true, precision: '硬度精度±0.5N，脆碎度±0.01%',
    status: 'ACTIVE', lastMaintDate: '2026-04-10', nextMaintDate: '2026-10-10',
    lastCalibDate: '2026-04-10', nextCalibDate: '2026-10-10',
    remark: 'VitC咀嚼片硬度（≥40N）及脆碎度（≤1%）检测；半年校准一次',
    qrCode: 'EQ-HARDNESS-001|硬度脆碎度仪|QC实验室',
    createdAt: '2023-05-15', updatedAt: '2026-04-10', createdBy: '陈工程师',
  },
];

export const mockMaintPlans: MaintPlan[] = [
  {
    id: 'mp-001', planNo: 'MP-20260510-001',
    equipId: 'eq-001', equipCode: 'EQ-GRAN-001', equipName: '湿法制粒机 #1',
    maintType: 'MONTHLY', maintContent: '检查搅拌桨磨损情况，更换密封圈，清洁切割刀及筛网，润滑各运动部件',
    planDate: '2026-05-10', planDuration: 4, assignee: '张师傅',
    status: 'DONE', actualDate: '2026-05-10', actualDuration: 3.5,
    result: '搅拌桨无异常磨损，更换密封圈1套，筛网清洁合格，各润滑点补油完毕',
    nextPlanDate: '2026-06-10',
    createdAt: '2026-04-25', updatedAt: '2026-05-10',
  },
  {
    id: 'mp-002', planNo: 'MP-20260612-002',
    equipId: 'eq-002', equipCode: 'EQ-FLUID-001', equipName: '流化床干燥机 #1',
    maintType: 'MONTHLY', maintContent: '更换过滤袋，检查空气分布板，校准进出风温度传感器，清洁膨胀室',
    planDate: '2026-06-12', planDuration: 5, assignee: '张师傅',
    status: 'PENDING',
    nextPlanDate: '2026-07-12',
    createdAt: '2026-05-25', updatedAt: '2026-05-25',
  },
  {
    id: 'mp-003', planNo: 'MP-20260520-003',
    equipId: 'eq-003', equipCode: 'EQ-PRESS-001', equipName: '旋转式压片机 #1',
    maintType: 'MONTHLY', maintContent: '检查冲模磨损（用千分尺测量），清洁强迫加料器，润滑传动链，检查预压压力',
    planDate: '2026-05-20', planDuration: 4, assignee: '王师傅',
    status: 'DONE', actualDate: '2026-05-20', actualDuration: 4.5,
    result: '冲模尺寸均在公差范围，更换加料器密封条1套，传动链润滑正常，预压力调整至3kN',
    nextPlanDate: '2026-06-20',
    createdAt: '2026-05-05', updatedAt: '2026-05-20',
  },
  {
    id: 'mp-004', planNo: 'MP-20260615-004',
    equipId: 'eq-004', equipCode: 'EQ-COAT-001', equipName: '高效包衣机 BFC-150',
    maintType: 'MONTHLY', maintContent: '清洁喷枪，检查蠕动泵管，校准包衣液流量计，检查进排风过滤器',
    planDate: '2026-06-15', planDuration: 4, assignee: '王师傅',
    status: 'PENDING',
    nextPlanDate: '2026-07-15',
    createdAt: '2026-05-28', updatedAt: '2026-05-28',
  },
  {
    id: 'mp-005', planNo: 'MP-20260618-005',
    equipId: 'eq-009', equipCode: 'EQ-CAPS-001', equipName: '全自动胶囊充填机',
    maintType: 'MONTHLY', maintContent: '检查充填盘磨损，更换分拣剔除传感器，清洁计量盘，调整充填量一致性',
    planDate: '2026-06-18', planDuration: 5, assignee: '李师傅',
    status: 'PENDING',
    nextPlanDate: '2026-07-18',
    createdAt: '2026-06-01', updatedAt: '2026-06-01',
  },
  {
    id: 'mp-006', planNo: 'MP-20260620-006',
    equipId: 'eq-010', equipCode: 'EQ-COLDCHAIN-001', equipName: '冷链储存柜（益生菌专用）',
    maintType: 'MONTHLY', maintContent: '清洁冷凝器，检查密封条，校验温度传感器3点（2℃/5℃/8℃），测试报警系统',
    planDate: '2026-06-20', planDuration: 3, assignee: '李师傅',
    status: 'PENDING',
    nextPlanDate: '2026-07-20',
    createdAt: '2026-06-05', updatedAt: '2026-06-05',
  },
  {
    id: 'mp-007', planNo: 'MP-20261001-007',
    equipId: 'eq-012', equipCode: 'EQ-HPLC-001', equipName: 'HPLC高效液相色谱仪',
    maintType: 'SPECIAL', maintContent: '年度外部计量校准（由法定计量检定机构执行）：波长精度、流量准确度、柱压系统验证',
    planDate: '2026-10-01', planDuration: 4, assignee: '南京市计量所',
    status: 'PENDING',
    createdAt: '2026-06-01', updatedAt: '2026-06-01',
  },
];

export const mockFaultRecords: FaultRecord[] = [
  {
    id: 'fr-001', faultNo: 'FT-20260528-001',
    equipId: 'eq-009', equipCode: 'EQ-CAPS-001', equipName: '全自动胶囊充填机',
    faultTime: '2026-05-28 10:15', reporter: '李操作员（OP009）',
    faultDesc: '计量盘卡顿，充填量波动超标（装量差异>±10%），停机报告，当批益生菌胶囊暂停生产',
    faultLevel: 'HIGH',
    affectedBatch: 'TMJ-PROBIO-20260528-003', affectedWoNo: 'WO-CAPS-20260528-003',
    status: 'CLOSED',
    assignee: '李维修员',
    diagnose: '计量盘圆柱孔内有胶囊壳碎屑嵌入，导致充填量波动；清洁后恢复正常',
    repairContent: '拆卸计量盘，清除碎屑，检查圆柱孔尺寸合格，重新安装并验证装量差异',
    spareParts: '无需更换备件',
    repairStart: '2026-05-28 10:30', repairEnd: '2026-05-28 13:00',
    downtime: 165,
    rootCause: '上批清场不彻底，残留少量胶囊壳碎屑未清除干净',
    capaAction: '修订清场SOP：增加计量盘孔清洁专项检查项目，使用标准套规验证，QA清场签字',
    verifier: '李工程师', verifyTime: '2026-05-28 13:30',
    verifyResult: '装量差异验证：10粒连续检测差异均≤±7.5%，验收通过，继续生产',
    createdAt: '2026-05-28 10:20', updatedAt: '2026-05-28 13:35',
  },
  {
    id: 'fr-002', faultNo: 'FT-20260515-001',
    equipId: 'eq-003', equipCode: 'EQ-PRESS-001', equipName: '旋转式压片机 #1',
    faultTime: '2026-05-15 14:30', reporter: '王操作员（OP003）',
    faultDesc: '首件检查发现片重偏低（485mg，规格500±5%下限475mg附近），片硬度偏软（≤35N），停机调整',
    faultLevel: 'MEDIUM',
    affectedBatch: undefined, affectedWoNo: undefined,
    status: 'CLOSED',
    assignee: '王维修员',
    diagnose: '主压力轮磨损导致压力输出不足，更换主压力轮后片重恢复正常',
    repairContent: '更换主压力轮，重新调整预压力（3kN）和主压力（8kN），首件重新确认',
    spareParts: '主压力轮×1套（ZP-35配套）',
    repairStart: '2026-05-15 15:00', repairEnd: '2026-05-15 17:00',
    downtime: 150,
    rootCause: '主压力轮未按季度维保计划检查更换，磨损超限',
    capaAction: '将压力轮列入月度维保必检项；每月用片重统计图监控压力稳定性趋势',
    verifier: '王工程师', verifyTime: '2026-05-15 17:30',
    verifyResult: '首件确认：片重502mg、硬度48N、脆碎度0.3%，均合格，恢复生产',
    createdAt: '2026-05-15 14:35', updatedAt: '2026-05-15 17:35',
  },
  {
    id: 'fr-003', faultNo: 'FT-20260510-001',
    equipId: 'eq-010', equipCode: 'EQ-COLDCHAIN-001', equipName: '冷链储存柜（益生菌专用）',
    faultTime: '2026-05-10 02:18', reporter: '系统自动报警',
    faultDesc: '冷链柜温度超出控制范围（报警值：>8℃），实测9.2℃，持续约25分钟；已自动触发企业微信报警',
    faultLevel: 'CRITICAL',
    affectedBatch: 'TMJ-PROBIO-20260508-001', affectedWoNo: undefined,
    status: 'CLOSED',
    assignee: '李维修员',
    diagnose: '压缩机运行正常，温升原因为频繁开门导致冷量散失；门磁感应器故障未能记录开门次数',
    repairContent: '更换门磁感应器，修复门封条，恢复温度监控完整性；25分钟超温事件偏差处理',
    spareParts: '门磁感应器×1个，门封条（1号柜）×1套',
    repairStart: '2026-05-10 07:00', repairEnd: '2026-05-10 10:00',
    downtime: 300,
    rootCause: '夜班人员误开冷链柜取样时未及时关门，门磁故障导致无超时关门提醒',
    capaAction: '①修复门磁并增加开门时长限制报警（>30秒自动报警）；②启动偏差DEV-20260510-001评估超温对TMJ-PROBIO-20260508-001批活菌数影响，QA决策',
    verifier: '李工程师', verifyTime: '2026-05-10 10:30',
    verifyResult: '冷链柜温度恢复2~8℃稳定运行，门磁正常；超温偏差已立案处理（见DEV-20260510-001）',
    remark: '关联偏差：DEV-20260510-001（冷链温度偏差，已提交CAPA）',
    createdAt: '2026-05-10 02:20', updatedAt: '2026-05-10 11:00',
  },
  {
    id: 'fr-004', faultNo: 'FT-20260505-001',
    equipId: 'eq-002', equipCode: 'EQ-FLUID-001', equipName: '流化床干燥机 #1',
    faultTime: '2026-05-05 09:30', reporter: '张操作员（OP001）',
    faultDesc: '出口温度持续偏低（32℃，规格35~45℃），颗粒水分超标（>3.0%），停机检查',
    faultLevel: 'MEDIUM',
    affectedBatch: 'TMJ-VITC-20260505-002', affectedWoNo: 'WO-DRY-20260505-002',
    status: 'CLOSED',
    assignee: '张维修员',
    diagnose: '进风过滤器堵塞，进风量不足导致出口温度偏低',
    repairContent: '更换进风F7级过滤器，清洁预过滤器，重新验证进风量（≥3000m³/h）',
    spareParts: '进风F7过滤器×1套，预过滤G4×2片',
    repairStart: '2026-05-05 10:00', repairEnd: '2026-05-05 12:00',
    downtime: 150,
    rootCause: '过滤器更换周期（每月）执行不到位，本次已超期15天',
    capaAction: '将过滤器更换列入月度维保必执行项，增加维保完成率KPI考核',
    verifier: '张工程师', verifyTime: '2026-05-05 13:30',
    verifyResult: '出口温度恢复至40±2℃，含水量复验1.8%合格，恢复生产；本批湿颗粒延长干燥时间，QA复检合格',
    createdAt: '2026-05-05 09:35', updatedAt: '2026-05-05 14:00',
  },
  {
    id: 'fr-005', faultNo: 'FT-20260601-001',
    equipId: 'eq-001', equipCode: 'EQ-GRAN-001', equipName: '湿法制粒机 #1',
    faultTime: '2026-06-01 16:00', reporter: '张操作员（OP001）',
    faultDesc: '切割刀异响，制粒粒度偏粗（通过20目筛<80%），停机待维修',
    faultLevel: 'HIGH',
    affectedBatch: 'TMJ-VITC-20260601-001', affectedWoNo: 'WO-GRAN-20260601-001',
    status: 'ASSIGNED',
    assignee: '张维修员',
    diagnose: undefined,
    repairContent: undefined,
    downtime: 120,
    remark: '已隔离本班制粒湿颗粒（约80kg）待QA决策；下批生产暂停，等待维修完成',
    createdAt: '2026-06-01 16:05', updatedAt: '2026-06-01 16:30',
  },
];

export const mockCalibRecords: CalibRecord[] = [
  {
    id: 'cb-001', calibNo: 'CAL-20260401-001',
    equipId: 'eq-012', equipCode: 'EQ-HPLC-001', equipName: 'HPLC高效液相色谱仪',
    calibType: 'EXTERNAL', calibOrg: '南京市计量测试技术研究院',
    calibDate: '2026-04-01', nextCalibDate: '2026-10-01', calibCycle: 6,
    calibResult: 'PASS', certNo: 'NJ-MEAS-2026-003456',
    uncertainty: 'U=0.3nm（波长，k=2）',
    status: 'VALID',
    measuredValue: '254.2nm（标准汞灯波长）', standardValue: '254.0nm',
    deviation: '+0.2nm（合格限：±0.5nm）',
    operator: '南京市计量院工程师',
    remark: '含波长精度、流量准确度、柱温精度三项校准；下次校准：2026-10-01前',
    createdAt: '2026-04-01',
  },
  {
    id: 'cb-002', calibNo: 'CAL-20260501-001',
    equipId: 'eq-015', equipCode: 'EQ-BALANCE-001', equipName: '万分之一天平',
    calibType: 'EXTERNAL', calibOrg: '南京市计量测试技术研究院',
    calibDate: '2026-05-01', nextCalibDate: '2026-11-01', calibCycle: 6,
    calibResult: 'PASS', certNo: 'NJ-MEAS-2026-004123',
    uncertainty: 'U=0.1mg（k=2）',
    status: 'VALID',
    measuredValue: '100.0001g（标准砝码100g）', standardValue: '100.0000g',
    deviation: '+0.0001g（合格限：±0.0002g）',
    operator: '南京市计量院工程师',
    remark: 'GMP计量器具，每日使用内置标准砝码自校；半年法定机构校准',
    createdAt: '2026-05-01',
  },
  {
    id: 'cb-003', calibNo: 'CAL-20260301-001',
    equipId: 'eq-010', equipCode: 'EQ-COLDCHAIN-001', equipName: '冷链储存柜（益生菌专用）',
    calibType: 'INTERNAL', calibOrg: undefined,
    calibDate: '2026-03-01', nextCalibDate: '2026-09-01', calibCycle: 6,
    calibResult: 'PASS', certNo: 'INT-TEMP-2026-COLD-001',
    status: 'VALID',
    measuredValue: '5.2℃（设定5℃，测3点均值）', standardValue: '5.0℃',
    deviation: '+0.2℃（合格限：±0.5℃）',
    operator: '李检验员',
    remark: '内部校准，使用NIST溯源的标准温度计对比；3点（2℃/5℃/8℃）均合格',
    createdAt: '2026-03-01',
  },
  {
    id: 'cb-004', calibNo: 'CAL-20260315-001',
    equipId: 'eq-013', equipCode: 'EQ-DISS-001', equipName: '溶出度测定仪',
    calibType: 'INTERNAL', calibOrg: undefined,
    calibDate: '2026-03-15', nextCalibDate: '2026-09-15', calibCycle: 6,
    calibResult: 'PASS', certNo: 'INT-DISS-2026-0315',
    status: 'VALID',
    measuredValue: '100.2rpm（设定100rpm）', standardValue: '100.0rpm',
    deviation: '+0.2%（合格限：±1.5%）',
    operator: '陈检验员',
    remark: '转速精度及温度精度（37.0±0.5℃）双项内部校准，使用标准转速仪',
    createdAt: '2026-03-15',
  },
  {
    id: 'cb-005', calibNo: 'CAL-20260410-001',
    equipId: 'eq-016', equipCode: 'EQ-HARDNESS-001', equipName: '片剂硬度脆碎度仪',
    calibType: 'INTERNAL', calibOrg: undefined,
    calibDate: '2026-04-10', nextCalibDate: '2026-10-10', calibCycle: 6,
    calibResult: 'PASS', certNo: 'INT-HARD-2026-0410',
    status: 'VALID',
    measuredValue: '50.2N（标准砝码对应50N）', standardValue: '50.0N',
    deviation: '+0.4%（合格限：±1%）',
    operator: '陈检验员',
    remark: '硬度精度内部校准（标准砝码溯源），脆碎度转速验证100rpm±2rpm',
    createdAt: '2026-04-10',
  },
];

export const mockUsageRecords: EquipUsageRecord[] = [
  // ── VitC咀嚼片批次 TMJ-VITC-20260610-001（南京工厂，WO-EBR-001关联）──────────
  {
    id: 'eu-001', usageNo: 'EU-20260610-001',
    equipId: 'eq-001', equipCode: 'EQ-GRAN-001', equipName: '湿法制粒机 #1',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-GRAN',
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '张三（OP001）',
    startTime: '2026-06-10 08:00', endTime: '2026-06-10 10:30',
    duration: 150,
    setupParams: '搅拌桨转速：150rpm，切割刀转速：1200rpm，加水量：3.5kg，制粒时间：8min',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '张三（OP001）-20260610',
    createdAt: '2026-06-10',
  },
  {
    id: 'eu-002', usageNo: 'EU-20260610-002',
    equipId: 'eq-002', equipCode: 'EQ-FLUID-001', equipName: '流化床干燥机 #1',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-DRY',
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '张三（OP001）',
    startTime: '2026-06-10 11:00', endTime: '2026-06-10 13:30',
    duration: 150,
    setupParams: '进风温度：70℃，出口温度终点：40℃，进风量：3200m³/h，干燥时间：约120min',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '张三（OP001）-20260610',
    createdAt: '2026-06-10',
  },
  {
    id: 'eu-003', usageNo: 'EU-20260610-003',
    equipId: 'eq-005', equipCode: 'EQ-MIX-001', equipName: '三维运动混合机',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-MIX',
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '张三（OP001）',
    startTime: '2026-06-10 14:00', endTime: '2026-06-10 15:00',
    duration: 60,
    setupParams: '混合转速：15rpm，混合时间：30min，加入硬脂酸镁后延伸混合5min',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '张三（OP001）-20260610',
    createdAt: '2026-06-10',
  },
  {
    id: 'eu-004', usageNo: 'EU-20260610-004',
    equipId: 'eq-003', equipCode: 'EQ-PRESS-001', equipName: '旋转式压片机 #1',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-PRESS',
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '王五（OP003）',
    startTime: '2026-06-10 15:30', endTime: '2026-06-10 18:00',
    duration: 150,
    setupParams: '主压力：8kN，预压力：3kN，转速：30rpm，冲模规格：Ø18mm浅凹，片重：500mg',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '王五（OP003）-20260610',
    createdAt: '2026-06-10',
  },
  {
    id: 'eu-005', usageNo: 'EU-20260611-001',
    equipId: 'eq-004', equipCode: 'EQ-COAT-001', equipName: '高效包衣机 BFC-150',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-COAT',
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '王五（OP003）',
    startTime: '2026-06-11 08:30', endTime: '2026-06-11 12:00',
    duration: 210,
    setupParams: 'OPADRY白色包衣液浓度：15%，进风温度：50℃，出风温度：40℃，喷液速率：95g/min，终点增重率：3.2%',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '王五（OP003）-20260611',
    createdAt: '2026-06-11',
  },
  {
    id: 'eu-006', usageNo: 'EU-20260611-002',
    equipId: 'eq-006', equipCode: 'EQ-COUNT-001', equipName: '全自动数片机',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-COUNT',
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '赵六（OP005）',
    startTime: '2026-06-11 14:00', endTime: '2026-06-11 16:30',
    duration: 150,
    setupParams: '数片设定：60粒/瓶，速度：2500粒/min，剔除传感器灵敏度校准（0.8mm缺口可检出）',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '赵六（OP005）-20260611',
    createdAt: '2026-06-11',
  },
  {
    id: 'eu-007', usageNo: 'EU-20260611-003',
    equipId: 'eq-007', equipCode: 'EQ-LABEL-001', equipName: '激光喷码机（批号打印）',
    woId: 'wo-ebr-001', woNo: 'WO-EBR-001',
    taskNo: 'TK-EBR-001-LABEL',
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '赵六（OP005）',
    startTime: '2026-06-11 14:00', endTime: '2026-06-11 16:30',
    duration: 150,
    setupParams: '打印内容：批号TMJ-VITC-20260610-001，生产日期2026-06-10，有效期至2028-06-09；字体高度4mm',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '赵六（OP005）-20260611',
    createdAt: '2026-06-11',
  },
  // ── 益生菌胶囊批次 TMJ-PROBIO-20260609-001（溧水工厂，WO-EBR-004关联）──────
  {
    id: 'eu-008', usageNo: 'EU-20260609-001',
    equipId: 'eq-009', equipCode: 'EQ-CAPS-001', equipName: '全自动胶囊充填机',
    woId: 'wo-ebr-004', woNo: 'WO-EBR-004',
    taskNo: 'TK-EBR-004-CAPS',
    batchNo: 'TMJ-PROBIO-20260609-001',
    productCode: 'TMJ-PROBIO-300', productName: '复合益生菌胶囊300mg',
    operator: '李四（OP002）',
    startTime: '2026-06-09 08:00', endTime: '2026-06-09 12:00',
    duration: 240,
    setupParams: '充填量：300mg±7.5%，速度：800粒/min，操作间温度：18℃，湿度：45%；胶囊壳规格：0#',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    operatorSign: '李四（OP002）-20260609',
    createdAt: '2026-06-09',
  },
  {
    id: 'eu-009', usageNo: 'EU-20260609-002',
    equipId: 'eq-010', equipCode: 'EQ-COLDCHAIN-001', equipName: '冷链储存柜（益生菌专用）',
    woId: 'wo-ebr-004', woNo: 'WO-EBR-004',
    taskNo: 'TK-EBR-004-COLD',
    batchNo: 'TMJ-PROBIO-20260609-001',
    productCode: 'TMJ-PROBIO-300', productName: '复合益生菌胶囊300mg',
    operator: '李四（OP002）',
    startTime: '2026-06-09 12:30', endTime: '2026-06-10 08:00',
    duration: 1170,
    setupParams: '成品冷链暂存，设定温度5℃，上下限报警2℃/8℃，封存入库前温度记录导出确认',
    cleanBefore: false, cleanAfter: false, abnormalFlag: false,
    operatorSign: '李四（OP002）-20260609',
    createdAt: '2026-06-09',
  },
  // ── QC检验室 独立使用记录 ─────────────────────────────────────────────────
  {
    id: 'eu-010', usageNo: 'EU-20260612-001',
    equipId: 'eq-012', equipCode: 'EQ-HPLC-001', equipName: 'HPLC高效液相色谱仪',
    woId: undefined, woNo: undefined,
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '陈检验员（QC003）',
    startTime: '2026-06-12 09:00', endTime: '2026-06-12 13:00',
    duration: 240,
    setupParams: 'VitC含量HPLC法（中国药典2020版）：柱C18，流动相0.05mol/L磷酸二氢钾，检测波长254nm，流速1.0mL/min',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    remark: '成品放行检验，VitC含量结果：101.2%（规格90~110%），合格',
    operatorSign: '陈检验员（QC003）-20260612',
    createdAt: '2026-06-12',
  },
  {
    id: 'eu-011', usageNo: 'EU-20260612-002',
    equipId: 'eq-014', equipCode: 'EQ-COLONY-001', equipName: '活菌数检测仪（菌落计数）',
    woId: undefined, woNo: undefined,
    batchNo: 'TMJ-PROBIO-20260609-001',
    productCode: 'TMJ-PROBIO-300', productName: '复合益生菌胶囊300mg',
    operator: '陈检验员（QC003）',
    startTime: '2026-06-12 14:00', endTime: '2026-06-12 18:00',
    duration: 240,
    setupParams: '活菌数平板计数法（MRS培养基，37℃/72h培养），稀释梯度：10⁻⁴~10⁻⁶，每梯度2平行',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    remark: '成品放行检验（培养完毕读数），活菌数：5.8×10⁹ CFU/粒（规格≥3×10⁹），合格',
    operatorSign: '陈检验员（QC003）-20260612',
    createdAt: '2026-06-12',
  },
  {
    id: 'eu-012', usageNo: 'EU-20260613-001',
    equipId: 'eq-013', equipCode: 'EQ-DISS-001', equipName: '溶出度测定仪',
    woId: undefined, woNo: undefined,
    batchNo: 'TMJ-VITC-20260610-001',
    productCode: 'TMJ-VITC-500', productName: 'VitC咀嚼片500mg',
    operator: '陈检验员（QC003）',
    startTime: '2026-06-13 09:00', endTime: '2026-06-13 11:00',
    duration: 120,
    setupParams: '崩解方法：转篮法100rpm，介质：0.1mol/L盐酸，温度：37℃，取样时间：30min',
    cleanBefore: true, cleanAfter: true, abnormalFlag: false,
    remark: '成品放行检验，溶出度：6片均≥80%（规格：30min内溶出≥70%），合格',
    operatorSign: '陈检验员（QC003）-20260613',
    createdAt: '2026-06-13',
  },
];

export const mockSpareparts: SparePartRecord[] = [
  {
    id: 'sp-001', partCode: 'SP-GRAN-001', partName: '湿法制粒机密封圈套装',
    partSpec: '适配GHL-200，硅胶材质，FDA食品级', applicableEquips: ['eq-001'],
    unit: '套', currentStock: 5, safetyStock: 3, unitCost: 180,
    supplier: '重庆英格机械', leadTime: 7, location: '备件库A区-001',
    status: 'NORMAL', lastUsedDate: '2026-05-10',
    remark: '每月维保时检查，破损立即更换；GMP食品接触材质',
  },
  {
    id: 'sp-002', partCode: 'SP-FLUID-001', partName: '流化床过滤袋（F7级）',
    partSpec: 'FL-200配套，过滤精度F7，聚酯材质，尺寸Ø800×1200mm', applicableEquips: ['eq-002'],
    unit: '套', currentStock: 6, safetyStock: 4, unitCost: 320,
    supplier: '常州永信制药设备', leadTime: 5, location: '备件库A区-002',
    status: 'NORMAL', lastUsedDate: '2026-06-05',
    remark: '每月必换；破损立即更换；颗粒细粉多时增加更换频率',
  },
  {
    id: 'sp-003', partCode: 'SP-PRESS-001', partName: 'ZP-35压片机冲模套装（Ø18mm浅凹）',
    partSpec: 'VitC咀嚼片专用，Ø18mm浅凹，HSS材质，35冲套装', applicableEquips: ['eq-003'],
    unit: '套', currentStock: 2, safetyStock: 1, unitCost: 8500,
    supplier: '上海天祥机械', leadTime: 21, location: '备件库B区-001',
    status: 'NORMAL', lastUsedDate: '2026-05-15',
    remark: '单套冲模正常使用寿命约50万片；每批检查磨损量；备用套保存时涂防锈油',
  },
  {
    id: 'sp-004', partCode: 'SP-COAT-001', partName: '包衣机喷枪套装',
    partSpec: '适配BFC-150，双流体喷枪，喷嘴孔径1.2mm，可拆卸清洗', applicableEquips: ['eq-004'],
    unit: '套', currentStock: 3, safetyStock: 2, unitCost: 650,
    supplier: '常州英格机械', leadTime: 10, location: '备件库B区-005',
    status: 'NORMAL', lastUsedDate: '2026-05-15',
    remark: '每批包衣后拆卸清洗；喷嘴堵塞立即更换；每半年强制更换',
  },
  {
    id: 'sp-005', partCode: 'SP-COAT-002', partName: '蠕动泵软管（硅胶）',
    partSpec: '适配BFC-150包衣液输送，硅胶材质，内径8mm，FDA食品级', applicableEquips: ['eq-004'],
    unit: '根', currentStock: 8, safetyStock: 5, unitCost: 45,
    supplier: '上海赛迪', leadTime: 3, location: '辅料库C区-003',
    status: 'NORMAL', lastUsedDate: '2026-05-20',
    remark: '每季度预防性更换；出现裂纹或变形立即更换；GMP食品接触材质',
  },
  {
    id: 'sp-006', partCode: 'SP-CAPS-001', partName: '胶囊充填机计量盘套装',
    partSpec: '适配NJP-1200C，0#胶囊，不锈钢316L，CNC精密加工', applicableEquips: ['eq-009'],
    unit: '套', currentStock: 1, safetyStock: 1, unitCost: 12000,
    supplier: '常州金远制药机械', leadTime: 30, location: '备件库A区-010（溧水厂）',
    status: 'LOW_STOCK', lastUsedDate: '2026-05-28',
    remark: '紧急采购中（当前库存仅1套，安全库存1套）；每季度检测圆柱孔尺寸',
  },
  {
    id: 'sp-007', partCode: 'SP-COLD-001', partName: '冷链柜温度传感器（PT100）',
    partSpec: 'PT100铂电阻，精度±0.1℃，量程-40~+50℃，防水IP67', applicableEquips: ['eq-010', 'eq-011'],
    unit: '支', currentStock: 5, safetyStock: 3, unitCost: 280,
    supplier: '中科美菱配件部', leadTime: 7, location: '备件库G区-001（溧水厂）',
    status: 'NORMAL', lastUsedDate: '2026-05-10',
    remark: '冷链设备核心传感器，年度校准时更换老化传感器；溧水冷链两台设备共用备件',
  },
  {
    id: 'sp-008', partCode: 'SP-HPLC-001', partName: 'HPLC色谱柱（C18反相）',
    partSpec: '岛津Shim-pack GIST C18，5μm，4.6×250mm，适配LC-2030C', applicableEquips: ['eq-012'],
    unit: '支', currentStock: 2, safetyStock: 1, unitCost: 2800,
    supplier: '岛津企业管理（中国）', leadTime: 14, location: '冷藏备件库-QC室',
    status: 'NORMAL', lastUsedDate: '2026-06-12',
    remark: '色谱柱使用≥500进样次数时考虑更换；存储于4℃冷藏；开启后记录使用次数',
  },
  {
    id: 'sp-009', partCode: 'SP-HPLC-002', partName: 'HPLC流动相过滤膜（0.45μm）',
    partSpec: '有机相：PVDF膜；水相：混合纤维素膜，Ø47mm，0.45μm', applicableEquips: ['eq-012'],
    unit: '片', currentStock: 200, safetyStock: 100, unitCost: 2.5,
    supplier: '天津津腾', leadTime: 3, location: '试剂室-QC室',
    status: 'NORMAL', lastUsedDate: '2026-06-12',
    remark: '每次配制流动相均需过滤；消耗品，按月采购',
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
