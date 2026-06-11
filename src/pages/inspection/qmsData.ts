// QMS 质量检验模块 数据模型与 Mock 数据
// 版本：V1.0 | 对齐 PRD：医疗器械MES_质量检验模块QMS_PRD_AI编程版

// ============================================================
// 类型定义
// ============================================================

export type SchemeType =
  | 'IQC'
  | 'IPQC_FIRST'
  | 'IPQC_PATROL'
  | 'IPQC_SELF'
  | 'IPQC_LAST'
  | 'FQC'
  | 'OQC'
  | 'STERILE'
  | 'SPECIAL';

export type SamplingType = 'FULL' | 'AQL' | 'FIXED' | 'PERCENT';
export type SchemeStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type ItemCategory = 'SIZE' | 'APPEARANCE' | 'PERFORMANCE' | 'MICROBIAL' | 'CHEMICAL' | 'PHYSICAL' | 'DOCUMENT';
export type StandardType = 'NUMERIC' | 'ENUM' | 'TEXT' | 'BOOLEAN' | 'JSON';

export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'DOING'
  | 'WAIT_RETEST'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export type Conclusion = 'PASS' | 'FAIL' | 'CONDITIONAL';
export type ReleaseStatus = 'PENDING' | 'RELEASED' | 'REJECTED';
export type Disposition = 'NONE' | 'REWORK' | 'SCRAP' | 'CONCESSION' | 'SORTING';
export type ReleaseType = 'SEMI_FINISHED' | 'FINISHED' | 'STERILE' | 'MATERIAL';
export type ReleaseConclusion = 'RELEASED' | 'REJECTED' | 'HOLD';

// ============================================================
// 检验方案 & 检验项目
// ============================================================

export interface InspectionItem {
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  standardType: StandardType;
  standardValue?: string;
  minValue?: number;
  maxValue?: number;
  enumOptions?: string[];
  unit?: string;
  instrumentType?: string;
  isCritical: boolean;
  isRequired: boolean;
  seqNo: number;
}

export interface InspectionScheme {
  id: string;
  schemeCode: string;
  schemeName: string;
  schemeType: SchemeType;
  productModel?: string;
  operationSeq?: number;
  samplingType: SamplingType;
  aqlLevel?: string;
  sampleSize?: number;
  samplePercent?: number;
  status: SchemeStatus;
  version: string;
  effectiveDate: string;
  items: InspectionItem[];
}

// ============================================================
// 量具
// ============================================================

export interface Instrument {
  id: string;
  name: string;
  code: string;
  type: string;
  calibrateValidUntil: string;
  status: 'VALID' | 'EXPIRED' | 'CALIBRATING';
}

// ============================================================
// 检验任务
// ============================================================

export interface InspectionTaskItem {
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  standardType: StandardType;
  standardValue?: string;
  minValue?: number;
  maxValue?: number;
  enumOptions?: string[];
  unit?: string;
  isCritical: boolean;
  // 实际录入值
  actualValue?: string | number;
  result?: 'PASS' | 'FAIL' | 'PENDING';
  remark?: string;
}

export interface InspectionTask {
  id: string;
  taskNo: string;
  schemeId: string;
  schemeCode: string;
  schemeName: string;
  schemeType: SchemeType;
  // 来源
  sourceType: 'MATERIAL' | 'OPERATION' | 'TASK' | 'PRODUCT';
  sourceNo: string;
  // 关联生产
  woNo?: string;
  taskNo_prod?: string;
  batchNo?: string;
  productModel?: string;
  // 样品
  totalQty: number;
  sampleQty: number;
  priority: 'A' | 'B' | 'C';
  // 状态
  status: TaskStatus;
  // 执行
  inspectorId?: string;
  inspectorName?: string;
  checkerId?: string;
  checkerName?: string;
  assignTime?: string;
  startTime?: string;
  completeTime?: string;
  // 结论
  conclusion?: Conclusion;
  releaseStatus: ReleaseStatus;
  // 处置
  disposition?: Disposition;
  dispositionRemark?: string;
  // 检验项
  items: InspectionTaskItem[];
  // 量具
  instrumentId?: string;
  instrumentName?: string;
  instrumentValid?: boolean;
  // 附件/备注
  photos?: string[];
  remark?: string;
  // 审计
  createdAt: string;
  failItems?: string[];
}

// ============================================================
// 检验记录
// ============================================================

export interface InspectionRecord {
  id: string;
  recordNo: string;
  taskId: string;
  taskNo: string;
  conclusion: Conclusion;
  inspectorId: string;
  inspectorName: string;
  inspectorSign?: string;
  checkerId?: string;
  checkerName?: string;
  checkerSign?: string;
  disposition: Disposition;
  failItems?: string[];
  createdAt: string;
  items: InspectionTaskItem[];
}

// ============================================================
// 质量放行单
// ============================================================

export interface QualityRelease {
  id: string;
  releaseNo: string;
  releaseType: ReleaseType;
  taskId?: string;
  batchNo: string;
  productModel?: string;
  inspectRecordIds: string[];
  conclusion: ReleaseConclusion;
  rejectReason?: string;
  qaId?: string;
  qaName?: string;
  qaSign?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerSign?: string;
  releaseTime?: string;
  validUntil?: string;
  createdAt: string;
  remark?: string;
}

// ============================================================
// 常量映射
// ============================================================

export const SCHEME_TYPE_MAP: Record<SchemeType, { label: string; color: string }> = {
  IQC:         { label: '来料检验(IQC)',  color: 'blue' },
  IPQC_FIRST:  { label: '首件检验',       color: 'geekblue' },
  IPQC_PATROL: { label: '巡检',           color: 'purple' },
  IPQC_SELF:   { label: '过程自检',       color: 'cyan' },
  IPQC_LAST:   { label: '末件检验',       color: 'magenta' },
  FQC:         { label: '成品检验(FQC)',  color: 'orange' },
  OQC:         { label: '出货检验(OQC)',  color: 'volcano' },
  STERILE:     { label: '灭菌确认',       color: 'lime' },
  SPECIAL:     { label: '特殊过程确认',   color: 'gold' },
};

export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
  PENDING:      { label: '待检验',   color: 'default' },
  ASSIGNED:     { label: '已分派',   color: 'blue' },
  DOING:        { label: '检验中',   color: 'processing' },
  WAIT_RETEST:  { label: '待复验',   color: 'warning' },
  COMPLETED:    { label: '已完成',   color: 'success' },
  CLOSED:       { label: '已关闭',   color: 'default' },
  CANCELLED:    { label: '已取消',   color: 'error' },
};

export const CONCLUSION_MAP: Record<Conclusion, { label: string; color: string }> = {
  PASS:        { label: '合格',     color: 'success' },
  FAIL:        { label: '不合格',   color: 'error' },
  CONDITIONAL: { label: '让步接收', color: 'warning' },
};

export const DISPOSITION_MAP: Record<Disposition, { label: string; color: string }> = {
  NONE:        { label: '无',     color: 'default' },
  REWORK:      { label: '返工',   color: 'warning' },
  SCRAP:       { label: '报废',   color: 'error' },
  CONCESSION:  { label: '让步接收', color: 'gold' },
  SORTING:     { label: '挑选使用', color: 'blue' },
};

export const RELEASE_TYPE_MAP: Record<ReleaseType, { label: string; color: string }> = {
  MATERIAL:      { label: '原料放行',   color: 'blue' },
  SEMI_FINISHED: { label: '半成品放行', color: 'cyan' },
  STERILE:       { label: '灭菌放行',   color: 'lime' },
  FINISHED:      { label: '成品放行',   color: 'green' },
};

export const RELEASE_CONCLUSION_MAP: Record<ReleaseConclusion, { label: string; color: string }> = {
  RELEASED: { label: '已放行', color: 'success' },
  REJECTED: { label: '已驳回', color: 'error' },
  HOLD:     { label: '待审查', color: 'warning' },
};

// ============================================================
// Mock 检验方案
// ============================================================

export const mockSchemes: InspectionScheme[] = [
  {
    id: 'SCH001',
    schemeCode: 'ISP-IQC-001',
    schemeName: '镍钛丝来料检验',
    schemeType: 'IQC',
    productModel: '通用',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    items: [
      { itemCode: 'mat_spec', itemName: '材料规格', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, isRequired: true, seqNo: 1 },
      { itemCode: 'dia_raw', itemName: '原材直径', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.300±0.005', minValue: 0.295, maxValue: 0.305, unit: 'mm', instrumentType: '千分尺', isCritical: true, isRequired: true, seqNo: 2 },
      { itemCode: 'hardness', itemName: '硬度', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '300~380', minValue: 300, maxValue: 380, unit: 'HV', instrumentType: '硬度仪', isCritical: true, isRequired: true, seqNo: 3 },
      { itemCode: 'surface', itemName: '表面外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: false, isRequired: true, seqNo: 4 },
      { itemCode: 'cert', itemName: '材质证书', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, isRequired: true, seqNo: 5 },
    ],
  },
  {
    id: 'SCH002',
    schemeCode: 'ISP-IPQC-10',
    schemeName: '机床成型首件检验',
    schemeType: 'IPQC_FIRST',
    operationSeq: 10,
    samplingType: 'FULL',
    sampleSize: 1,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    items: [
      { itemCode: 'd1', itemName: '外径D1', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.250±0.005', minValue: 0.245, maxValue: 0.255, unit: 'mm', instrumentType: '千分尺', isCritical: true, isRequired: true, seqNo: 1 },
      { itemCode: 'taper', itemName: '锥度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['0.02', '0.04', '0.06'], isCritical: true, isRequired: true, seqNo: 2 },
      { itemCode: 'thread', itemName: '螺纹螺距', category: 'SIZE', standardType: 'NUMERIC', standardValue: '按设计', unit: 'mm', instrumentType: '投影仪', isCritical: true, isRequired: true, seqNo: 3 },
      { itemCode: 'appearance', itemName: '外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: false, isRequired: true, seqNo: 4 },
    ],
  },
  {
    id: 'SCH003',
    schemeCode: 'ISP-IPQC-50',
    schemeName: '研磨一过程检验',
    schemeType: 'IPQC_SELF',
    operationSeq: 50,
    samplingType: 'FIXED',
    sampleSize: 5,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    items: [
      { itemCode: 'd1', itemName: '外径D1', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.250±0.005', minValue: 0.245, maxValue: 0.255, unit: 'mm', instrumentType: '千分尺', isCritical: true, isRequired: true, seqNo: 1 },
      { itemCode: 'd2', itemName: '外径D2', category: 'SIZE', standardType: 'NUMERIC', standardValue: '按规格', unit: 'mm', instrumentType: '千分尺', isCritical: false, isRequired: true, seqNo: 2 },
      { itemCode: 'taper', itemName: '锥度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['0.02', '0.04', '0.06'], isCritical: true, isRequired: true, seqNo: 3 },
      { itemCode: 'appearance', itemName: '外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: false, isRequired: true, seqNo: 4 },
      { itemCode: 'ra', itemName: '表面粗糙度', category: 'SIZE', standardType: 'NUMERIC', standardValue: '≤0.8', maxValue: 0.8, unit: 'μm', instrumentType: '粗糙度仪', isCritical: false, isRequired: true, seqNo: 5 },
    ],
  },
  {
    id: 'SCH004',
    schemeCode: 'ISP-SPEC-60',
    schemeName: '热处理过程确认',
    schemeType: 'SPECIAL',
    operationSeq: 60,
    samplingType: 'FULL',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    items: [
      { itemCode: 'temp_rise', itemName: '升温速率', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '5.0~8.0', minValue: 5.0, maxValue: 8.0, unit: '℃/min', isCritical: true, isRequired: true, seqNo: 1 },
      { itemCode: 'hold_temp', itemName: '保温温度', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '480~520', minValue: 480, maxValue: 520, unit: '℃', isCritical: true, isRequired: true, seqNo: 2 },
      { itemCode: 'hold_time', itemName: '保温时间', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '10~15', minValue: 10, maxValue: 15, unit: 'min', isCritical: true, isRequired: true, seqNo: 3 },
      { itemCode: 'temp_curve', itemName: '温度曲线审核', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, isRequired: true, seqNo: 4 },
      { itemCode: 'qa_dual', itemName: 'QA双人复核', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, isRequired: true, seqNo: 5 },
    ],
  },
  {
    id: 'SCH005',
    schemeCode: 'ISP-FQC-001',
    schemeName: '半成品检验',
    schemeType: 'FQC',
    operationSeq: 150,
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    items: [
      { itemCode: 'length', itemName: '总长度L', category: 'SIZE', standardType: 'NUMERIC', standardValue: '25±0.5mm', minValue: 24.5, maxValue: 25.5, unit: 'mm', instrumentType: '游标卡尺', isCritical: true, isRequired: true, seqNo: 1 },
      { itemCode: 'd0', itemName: '尖端直径D0', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.150±0.005', minValue: 0.145, maxValue: 0.155, unit: 'mm', instrumentType: '投影仪', isCritical: true, isRequired: true, seqNo: 2 },
      { itemCode: 'taper', itemName: '锥度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['0.04'], isCritical: true, isRequired: true, seqNo: 3 },
      { itemCode: 'torque', itemName: '扭转强度', category: 'PERFORMANCE', standardType: 'NUMERIC', standardValue: '≥标准值', unit: 'N·cm', instrumentType: '扭力测试仪', isCritical: true, isRequired: true, seqNo: 4 },
      { itemCode: 'flex', itemName: '抗弯强度', category: 'PERFORMANCE', standardType: 'NUMERIC', standardValue: '≥标准值', unit: 'N', instrumentType: '弯曲测试仪', isCritical: true, isRequired: true, seqNo: 5 },
      { itemCode: 'surface', itemName: '表面外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: true, isRequired: true, seqNo: 6 },
      { itemCode: 'color', itemName: '颜色标识', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['正确', '错误'], isCritical: false, isRequired: true, seqNo: 7 },
    ],
  },
  {
    id: 'SCH006',
    schemeCode: 'ISP-FQC-002',
    schemeName: '成品终检',
    schemeType: 'FQC',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    items: [
      { itemCode: 'length', itemName: '总长度L', category: 'SIZE', standardType: 'NUMERIC', standardValue: '25±0.5mm', minValue: 24.5, maxValue: 25.5, unit: 'mm', instrumentType: '游标卡尺', isCritical: true, isRequired: true, seqNo: 1 },
      { itemCode: 'work_len', itemName: '工作长度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['16mm', '20mm', '26mm'], instrumentType: '投影仪', isCritical: true, isRequired: true, seqNo: 2 },
      { itemCode: 'd0', itemName: '尖端直径D0', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.150±0.005', minValue: 0.145, maxValue: 0.155, unit: 'mm', instrumentType: '投影仪', isCritical: true, isRequired: true, seqNo: 3 },
      { itemCode: 'taper', itemName: '锥度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['0.04'], isCritical: true, isRequired: true, seqNo: 4 },
      { itemCode: 'roundness', itemName: '圆度', category: 'SIZE', standardType: 'NUMERIC', standardValue: '≤0.005', maxValue: 0.005, unit: 'mm', instrumentType: '圆度仪', isCritical: false, isRequired: true, seqNo: 5 },
      { itemCode: 'ra', itemName: '表面粗糙度', category: 'SIZE', standardType: 'NUMERIC', standardValue: '≤0.8', maxValue: 0.8, unit: 'μm', instrumentType: '粗糙度仪', isCritical: true, isRequired: true, seqNo: 6 },
      { itemCode: 'torque', itemName: '扭转强度', category: 'PERFORMANCE', standardType: 'NUMERIC', standardValue: '≥标准值', unit: 'N·cm', instrumentType: '扭力测试仪', isCritical: true, isRequired: true, seqNo: 7 },
      { itemCode: 'flex', itemName: '抗弯强度', category: 'PERFORMANCE', standardType: 'NUMERIC', standardValue: '≥标准值', unit: 'N', instrumentType: '弯曲测试仪', isCritical: true, isRequired: true, seqNo: 8 },
      { itemCode: 'appearance', itemName: '外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: true, isRequired: true, seqNo: 9 },
    ],
  },
  {
    id: 'SCH007',
    schemeCode: 'ISP-OQC-001',
    schemeName: '出货检验',
    schemeType: 'OQC',
    samplingType: 'AQL',
    aqlLevel: '0.65',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    items: [
      { itemCode: 'udi', itemName: '外箱UDI校验', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, isRequired: true, seqNo: 1 },
      { itemCode: 'pkg_intact', itemName: '包装完整性', category: 'PERFORMANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: true, isRequired: true, seqNo: 2 },
      { itemCode: 'sterile_batch', itemName: '灭菌批号一致性', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, isRequired: true, seqNo: 3 },
      { itemCode: 'exp_date', itemName: '有效期计算', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, isRequired: true, seqNo: 4 },
      { itemCode: 'qty_check', itemName: '出货数量核对', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: false, isRequired: true, seqNo: 5 },
    ],
  },
];

// ============================================================
// Mock 量具
// ============================================================

export const mockInstruments: Instrument[] = [
  { id: 'INS001', name: '千分尺-001', code: 'DC-001', type: '千分尺', calibrateValidUntil: '2026-08-01', status: 'VALID' },
  { id: 'INS002', name: '粗糙度仪-001', code: 'RA-001', type: '粗糙度仪', calibrateValidUntil: '2026-06-15', status: 'VALID' },
  { id: 'INS003', name: '投影仪-001', code: 'PJ-001', type: '投影仪', calibrateValidUntil: '2026-12-31', status: 'VALID' },
  { id: 'INS004', name: '扭力测试仪-001', code: 'TQ-001', type: '扭力测试仪', calibrateValidUntil: '2026-09-30', status: 'VALID' },
  { id: 'INS005', name: '弯曲测试仪-001', code: 'BT-001', type: '弯曲测试仪', calibrateValidUntil: '2027-01-15', status: 'VALID' },
  { id: 'INS006', name: '硬度仪-001', code: 'HV-001', type: '硬度仪', calibrateValidUntil: '2026-05-01', status: 'EXPIRED' },
  { id: 'INS007', name: '游标卡尺-001', code: 'VC-001', type: '游标卡尺', calibrateValidUntil: '2026-07-20', status: 'VALID' },
  { id: 'INS008', name: '圆度仪-001', code: 'RD-001', type: '圆度仪', calibrateValidUntil: '2026-11-10', status: 'VALID' },
];

// ============================================================
// Mock QC 检验员
// ============================================================

export const QC_INSPECTORS = [
  { id: 'QC001', name: '王五', role: 'QC' },
  { id: 'QC002', name: '赵六', role: 'QC' },
  { id: 'QC003', name: '李娜', role: 'QC' },
  { id: 'QC004', name: '张伟', role: 'QA主管' },
  { id: 'QC005', name: '周敏', role: 'QA经理' },
];

// ============================================================
// Mock 检验任务
// ============================================================

export const mockInspectionTasks: InspectionTask[] = [
  {
    id: 'IT001',
    taskNo: 'IT-20260426-001',
    schemeId: 'SCH001',
    schemeCode: 'ISP-IQC-001',
    schemeName: '镍钛丝来料检验',
    schemeType: 'IQC',
    sourceType: 'MATERIAL',
    sourceNo: 'MAT-NiTi-2026042601',
    batchNo: 'NiTi-2604-001',
    productModel: '通用镍钛丝 Ø0.3',
    totalQty: 5000,
    sampleQty: 32,
    priority: 'A',
    status: 'PENDING',
    releaseStatus: 'PENDING',
    createdAt: '2026-04-26 08:00:00',
    items: [
      { itemCode: 'mat_spec', itemName: '材料规格', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, result: 'PENDING' },
      { itemCode: 'dia_raw', itemName: '原材直径', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.300±0.005', minValue: 0.295, maxValue: 0.305, unit: 'mm', isCritical: true, result: 'PENDING' },
      { itemCode: 'hardness', itemName: '硬度', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '300~380', minValue: 300, maxValue: 380, unit: 'HV', isCritical: true, result: 'PENDING' },
      { itemCode: 'surface', itemName: '表面外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: false, result: 'PENDING' },
      { itemCode: 'cert', itemName: '材质证书', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, result: 'PENDING' },
    ],
  },
  {
    id: 'IT002',
    taskNo: 'IT-20260426-002',
    schemeId: 'SCH002',
    schemeCode: 'ISP-IPQC-10',
    schemeName: '机床成型首件检验',
    schemeType: 'IPQC_FIRST',
    sourceType: 'OPERATION',
    sourceNo: 'OP-10-WO20260426001',
    woNo: 'WO-20260426-001',
    batchNo: 'RKQ-2604-001',
    productModel: '根管锉 25mm/04锥度',
    totalQty: 480,
    sampleQty: 1,
    priority: 'A',
    status: 'ASSIGNED',
    inspectorId: 'QC001',
    inspectorName: '王五',
    assignTime: '2026-04-26 09:15:00',
    releaseStatus: 'PENDING',
    createdAt: '2026-04-26 09:00:00',
    items: [
      { itemCode: 'd1', itemName: '外径D1', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.250±0.005', minValue: 0.245, maxValue: 0.255, unit: 'mm', isCritical: true, result: 'PENDING' },
      { itemCode: 'taper', itemName: '锥度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['0.02', '0.04', '0.06'], isCritical: true, result: 'PENDING' },
      { itemCode: 'thread', itemName: '螺纹螺距', category: 'SIZE', standardType: 'NUMERIC', standardValue: '按设计', unit: 'mm', isCritical: true, result: 'PENDING' },
      { itemCode: 'appearance', itemName: '外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: false, result: 'PENDING' },
    ],
  },
  {
    id: 'IT003',
    taskNo: 'IT-20260426-003',
    schemeId: 'SCH003',
    schemeCode: 'ISP-IPQC-50',
    schemeName: '研磨一过程检验',
    schemeType: 'IPQC_SELF',
    sourceType: 'OPERATION',
    sourceNo: 'OP-50-WO20260426001',
    woNo: 'WO-20260426-001',
    batchNo: 'RKQ-2604-001',
    productModel: '根管锉 25mm/04锥度',
    totalQty: 480,
    sampleQty: 5,
    priority: 'B',
    status: 'DOING',
    inspectorId: 'QC001',
    inspectorName: '王五',
    checkerId: 'QC002',
    checkerName: '赵六',
    assignTime: '2026-04-26 10:00:00',
    startTime: '2026-04-26 10:15:00',
    releaseStatus: 'PENDING',
    instrumentId: 'INS001',
    instrumentName: '千分尺-001',
    instrumentValid: true,
    createdAt: '2026-04-26 10:00:00',
    items: [
      { itemCode: 'd1', itemName: '外径D1', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.250±0.005', minValue: 0.245, maxValue: 0.255, unit: 'mm', isCritical: true, actualValue: 0.251, result: 'PASS' },
      { itemCode: 'd2', itemName: '外径D2', category: 'SIZE', standardType: 'NUMERIC', standardValue: '按规格', unit: 'mm', isCritical: false, actualValue: 0.297, result: 'PASS' },
      { itemCode: 'taper', itemName: '锥度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['0.02', '0.04', '0.06'], isCritical: true, actualValue: '0.04', result: 'PASS' },
      { itemCode: 'appearance', itemName: '外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: false, actualValue: '合格', result: 'PASS' },
      { itemCode: 'ra', itemName: '表面粗糙度', category: 'SIZE', standardType: 'NUMERIC', standardValue: '≤0.8', maxValue: 0.8, unit: 'μm', isCritical: false, result: 'PENDING' },
    ],
  },
  {
    id: 'IT004',
    taskNo: 'IT-20260426-004',
    schemeId: 'SCH004',
    schemeCode: 'ISP-SPEC-60',
    schemeName: '热处理过程确认',
    schemeType: 'SPECIAL',
    sourceType: 'OPERATION',
    sourceNo: 'OP-60-WO20260426001',
    woNo: 'WO-20260426-001',
    batchNo: 'RKQ-2604-001',
    productModel: '根管锉 25mm/04锥度',
    totalQty: 480,
    sampleQty: 480,
    priority: 'A',
    status: 'WAIT_RETEST',
    inspectorId: 'QC003',
    inspectorName: '李娜',
    assignTime: '2026-04-26 11:00:00',
    startTime: '2026-04-26 11:30:00',
    releaseStatus: 'PENDING',
    createdAt: '2026-04-26 11:00:00',
    items: [
      { itemCode: 'temp_rise', itemName: '升温速率', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '5.0~8.0', minValue: 5.0, maxValue: 8.0, unit: '℃/min', isCritical: true, actualValue: 6.2, result: 'PASS' },
      { itemCode: 'hold_temp', itemName: '保温温度', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '480~520', minValue: 480, maxValue: 520, unit: '℃', isCritical: true, actualValue: 525, result: 'FAIL' },
      { itemCode: 'hold_time', itemName: '保温时间', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '10~15', minValue: 10, maxValue: 15, unit: 'min', isCritical: true, actualValue: 12, result: 'PASS' },
      { itemCode: 'temp_curve', itemName: '温度曲线审核', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, actualValue: '已确认', result: 'PASS' },
      { itemCode: 'qa_dual', itemName: 'QA双人复核', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, result: 'PENDING' },
    ],
    failItems: ['保温温度'],
  },
  {
    id: 'IT005',
    taskNo: 'IT-20260426-005',
    schemeId: 'SCH005',
    schemeCode: 'ISP-FQC-001',
    schemeName: '半成品检验',
    schemeType: 'FQC',
    sourceType: 'TASK',
    sourceNo: 'TK-20260425-003',
    woNo: 'WO-20260425-002',
    batchNo: 'RKQ-2604-002',
    productModel: '根管锉 25mm/04锥度',
    totalQty: 960,
    sampleQty: 32,
    priority: 'A',
    status: 'COMPLETED',
    inspectorId: 'QC002',
    inspectorName: '赵六',
    checkerId: 'QC004',
    checkerName: '张伟',
    assignTime: '2026-04-25 14:00:00',
    startTime: '2026-04-25 14:30:00',
    completeTime: '2026-04-25 16:00:00',
    conclusion: 'PASS',
    releaseStatus: 'PENDING',
    createdAt: '2026-04-25 14:00:00',
    items: [
      { itemCode: 'length', itemName: '总长度L', category: 'SIZE', standardType: 'NUMERIC', standardValue: '25±0.5mm', minValue: 24.5, maxValue: 25.5, unit: 'mm', isCritical: true, actualValue: 25.1, result: 'PASS' },
      { itemCode: 'd0', itemName: '尖端直径D0', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.150±0.005', minValue: 0.145, maxValue: 0.155, unit: 'mm', isCritical: true, actualValue: 0.152, result: 'PASS' },
      { itemCode: 'taper', itemName: '锥度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['0.04'], isCritical: true, actualValue: '0.04', result: 'PASS' },
      { itemCode: 'torque', itemName: '扭转强度', category: 'PERFORMANCE', standardType: 'NUMERIC', standardValue: '≥标准值', unit: 'N·cm', isCritical: true, actualValue: 18.5, result: 'PASS' },
      { itemCode: 'flex', itemName: '抗弯强度', category: 'PERFORMANCE', standardType: 'NUMERIC', standardValue: '≥标准值', unit: 'N', isCritical: true, actualValue: 42.3, result: 'PASS' },
      { itemCode: 'surface', itemName: '表面外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: true, actualValue: '合格', result: 'PASS' },
      { itemCode: 'color', itemName: '颜色标识', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['正确', '错误'], isCritical: false, actualValue: '正确', result: 'PASS' },
    ],
  },
  {
    id: 'IT006',
    taskNo: 'IT-20260426-006',
    schemeId: 'SCH006',
    schemeCode: 'ISP-FQC-002',
    schemeName: '成品终检',
    schemeType: 'FQC',
    sourceType: 'PRODUCT',
    sourceNo: 'FG-20260424-001',
    batchNo: 'RKQ-2604-003',
    productModel: '根管锉 25mm/04锥度',
    totalQty: 1200,
    sampleQty: 50,
    priority: 'A',
    status: 'COMPLETED',
    inspectorId: 'QC002',
    inspectorName: '赵六',
    checkerId: 'QC004',
    checkerName: '张伟',
    assignTime: '2026-04-24 09:00:00',
    startTime: '2026-04-24 09:30:00',
    completeTime: '2026-04-24 12:00:00',
    conclusion: 'PASS',
    releaseStatus: 'RELEASED',
    createdAt: '2026-04-24 09:00:00',
    items: [
      { itemCode: 'length', itemName: '总长度L', category: 'SIZE', standardType: 'NUMERIC', standardValue: '25±0.5mm', minValue: 24.5, maxValue: 25.5, unit: 'mm', isCritical: true, actualValue: 25.0, result: 'PASS' },
      { itemCode: 'work_len', itemName: '工作长度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['16mm', '20mm', '26mm'], isCritical: true, actualValue: '16mm', result: 'PASS' },
      { itemCode: 'd0', itemName: '尖端直径D0', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.150±0.005', minValue: 0.145, maxValue: 0.155, unit: 'mm', isCritical: true, actualValue: 0.151, result: 'PASS' },
      { itemCode: 'taper', itemName: '锥度', category: 'SIZE', standardType: 'ENUM', enumOptions: ['0.04'], isCritical: true, actualValue: '0.04', result: 'PASS' },
      { itemCode: 'torque', itemName: '扭转强度', category: 'PERFORMANCE', standardType: 'NUMERIC', standardValue: '≥标准值', unit: 'N·cm', isCritical: true, actualValue: 19.2, result: 'PASS' },
      { itemCode: 'appearance', itemName: '外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: true, actualValue: '合格', result: 'PASS' },
    ],
  },
  {
    id: 'IT007',
    taskNo: 'IT-20260423-007',
    schemeId: 'SCH001',
    schemeCode: 'ISP-IQC-001',
    schemeName: '镍钛丝来料检验',
    schemeType: 'IQC',
    sourceType: 'MATERIAL',
    sourceNo: 'MAT-NiTi-2026042301',
    batchNo: 'NiTi-2604-002',
    productModel: '通用镍钛丝 Ø0.3',
    totalQty: 3000,
    sampleQty: 20,
    priority: 'B',
    status: 'COMPLETED',
    inspectorId: 'QC001',
    inspectorName: '王五',
    checkerId: 'QC004',
    checkerName: '张伟',
    assignTime: '2026-04-23 08:00:00',
    startTime: '2026-04-23 08:30:00',
    completeTime: '2026-04-23 10:00:00',
    conclusion: 'FAIL',
    releaseStatus: 'REJECTED',
    disposition: 'SCRAP',
    dispositionRemark: '硬度超标，供应商批次不合格，全批退货',
    failItems: ['硬度'],
    createdAt: '2026-04-23 08:00:00',
    items: [
      { itemCode: 'mat_spec', itemName: '材料规格', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, actualValue: '已确认', result: 'PASS' },
      { itemCode: 'dia_raw', itemName: '原材直径', category: 'SIZE', standardType: 'NUMERIC', standardValue: '0.300±0.005', minValue: 0.295, maxValue: 0.305, unit: 'mm', isCritical: true, actualValue: 0.298, result: 'PASS' },
      { itemCode: 'hardness', itemName: '硬度', category: 'PHYSICAL', standardType: 'NUMERIC', standardValue: '300~380', minValue: 300, maxValue: 380, unit: 'HV', isCritical: true, actualValue: 392, result: 'FAIL' },
      { itemCode: 'surface', itemName: '表面外观', category: 'APPEARANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: false, actualValue: '合格', result: 'PASS' },
      { itemCode: 'cert', itemName: '材质证书', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, actualValue: '已确认', result: 'PASS' },
    ],
  },
  {
    id: 'IT008',
    taskNo: 'IT-20260426-008',
    schemeId: 'SCH007',
    schemeCode: 'ISP-OQC-001',
    schemeName: '出货检验',
    schemeType: 'OQC',
    sourceType: 'PRODUCT',
    sourceNo: 'SHP-20260426-001',
    batchNo: 'RKQ-2604-003',
    productModel: '根管锉 25mm/04锥度',
    totalQty: 1200,
    sampleQty: 80,
    priority: 'A',
    status: 'PENDING',
    releaseStatus: 'PENDING',
    createdAt: '2026-04-26 14:00:00',
    items: [
      { itemCode: 'udi', itemName: '外箱UDI校验', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, result: 'PENDING' },
      { itemCode: 'pkg_intact', itemName: '包装完整性', category: 'PERFORMANCE', standardType: 'ENUM', enumOptions: ['合格', '不合格'], isCritical: true, result: 'PENDING' },
      { itemCode: 'sterile_batch', itemName: '灭菌批号一致性', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, result: 'PENDING' },
      { itemCode: 'exp_date', itemName: '有效期计算', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: true, result: 'PENDING' },
      { itemCode: 'qty_check', itemName: '出货数量核对', category: 'DOCUMENT', standardType: 'BOOLEAN', isCritical: false, result: 'PENDING' },
    ],
  },
];

// ============================================================
// Mock 质量放行单
// ============================================================

export const mockQualityReleases: QualityRelease[] = [
  {
    id: 'QR001',
    releaseNo: 'QR-20260424-001',
    releaseType: 'FINISHED',
    taskId: 'IT006',
    batchNo: 'RKQ-2604-003',
    productModel: '根管锉 25mm/04锥度',
    inspectRecordIds: ['IR001', 'IR002'],
    conclusion: 'RELEASED',
    qaId: 'QC004',
    qaName: '张伟',
    qaSign: 'SIGN_ZW_20260424',
    reviewerId: 'QC005',
    reviewerName: '周敏',
    reviewerSign: 'SIGN_ZM_20260424',
    releaseTime: '2026-04-24 14:30:00',
    createdAt: '2026-04-24 13:00:00',
    remark: '成品终检全部合格，批准放行出货',
  },
  {
    id: 'QR002',
    releaseNo: 'QR-20260425-002',
    releaseType: 'SEMI_FINISHED',
    taskId: 'IT005',
    batchNo: 'RKQ-2604-002',
    productModel: '根管锉 25mm/04锥度',
    inspectRecordIds: ['IR003'],
    conclusion: 'HOLD',
    qaId: 'QC004',
    qaName: '张伟',
    createdAt: '2026-04-25 16:30:00',
    remark: '半成品检验已完成，等待QA主管审核签字',
  },
  {
    id: 'QR003',
    releaseNo: 'QR-20260423-003',
    releaseType: 'MATERIAL',
    batchNo: 'NiTi-2604-002',
    productModel: '通用镍钛丝 Ø0.3',
    inspectRecordIds: ['IR004'],
    conclusion: 'REJECTED',
    rejectReason: 'IQC检验硬度超标（实测392HV，标准300~380HV），全批退货',
    qaId: 'QC004',
    qaName: '张伟',
    qaSign: 'SIGN_ZW_20260423',
    releaseTime: '2026-04-23 11:00:00',
    createdAt: '2026-04-23 10:30:00',
  },
  {
    id: 'QR004',
    releaseNo: 'QR-20260426-004',
    releaseType: 'SEMI_FINISHED',
    taskId: 'IT005',
    batchNo: 'RKQ-2604-001',
    productModel: '根管锉 25mm/04锥度',
    inspectRecordIds: ['IR005'],
    conclusion: 'RELEASED',
    qaId: 'QC004',
    qaName: '张伟',
    qaSign: 'SIGN_ZW_20260426',
    reviewerId: 'QC005',
    reviewerName: '周敏',
    reviewerSign: 'SIGN_ZM_20260426',
    releaseTime: '2026-04-26 10:00:00',
    createdAt: '2026-04-26 09:00:00',
    remark: '半成品全项合格，批准入库',
  },
];

// ============================================================
// 工具函数
// ============================================================

let taskCounter = 9;
export function genInspTaskNo(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(taskCounter++).padStart(3, '0');
  return `IT-${today}-${seq}`;
}

let releaseCounter = 5;
export function genReleaseNo(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(releaseCounter++).padStart(3, '0');
  return `QR-${today}-${seq}`;
}

export function judgeItemResult(item: InspectionTaskItem): 'PASS' | 'FAIL' | 'PENDING' {
  if (item.actualValue === undefined || item.actualValue === null || item.actualValue === '') return 'PENDING';
  if (item.standardType === 'NUMERIC') {
    const v = Number(item.actualValue);
    if (item.minValue !== undefined && v < item.minValue) return 'FAIL';
    if (item.maxValue !== undefined && v > item.maxValue) return 'FAIL';
    return 'PASS';
  }
  if (item.standardType === 'BOOLEAN') {
    return item.actualValue ? 'PASS' : 'FAIL';
  }
  if (item.standardType === 'ENUM') {
    if (item.enumOptions && (item.enumOptions[0] === '合格' || item.enumOptions[0] === '正确')) {
      return item.actualValue === item.enumOptions[0] ? 'PASS' : 'FAIL';
    }
    return item.actualValue ? 'PASS' : 'PENDING';
  }
  return item.actualValue ? 'PASS' : 'PENDING';
}

export function judgeOverallConclusion(items: InspectionTaskItem[]): Conclusion {
  const hasFailCritical = items.some(i => i.isCritical && i.result === 'FAIL');
  if (hasFailCritical) return 'FAIL';
  const hasFail = items.some(i => i.result === 'FAIL');
  if (hasFail) return 'CONDITIONAL';
  const allDone = items.every(i => i.result !== 'PENDING');
  if (!allDone) return 'CONDITIONAL';
  return 'PASS';
}

export function getSchemeByType(type: SchemeType): InspectionScheme | undefined {
  return mockSchemes.find(s => s.schemeType === type);
}
