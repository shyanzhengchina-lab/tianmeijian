/**
 * 质量管理基础档案数据
 * ─ 质检项目档案（QcItem）：可复用的检验项，是质检方案的构成单元
 * ─ 质检方案档案（QcScheme）：由多个质检项目组成，用于IQC/IPQC/FQC等各类检验
 *
 * 与 qmsData.ts（检验任务、记录、放行）的关系：
 *   qmsData.InspectionTask.items 直接从 QcScheme.items 中的 itemRef 引用本文件的 QcItem
 *   InspectionPage 可按 schemeId 从 activeQcSchemes 查找方案，用于生成检验任务
 */

// ============================================================
// 质检项目 —— 类型
// ============================================================

/** 检验项目大类 */
export type QcItemCategory =
  | 'SIZE'        // 尺寸
  | 'APPEARANCE'  // 外观
  | 'PERFORMANCE' // 性能/功能
  | 'MICROBIAL'   // 微生物
  | 'CHEMICAL'    // 化学
  | 'PHYSICAL'    // 物理特性
  | 'DOCUMENT';   // 文件/记录

/** 标准值类型 */
export type QcStandardType =
  | 'NUMERIC'  // 数值（含上下限）
  | 'ENUM'     // 枚举（合格选项）
  | 'BOOLEAN'  // 布尔（是/否，通过/不通过）
  | 'TEXT';    // 文本（人工判断）

/** 项目状态 */
export type QcItemStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

/** 适用检验类型（可多选） */
export type QcApplyType =
  | 'IQC'         // 来料检验
  | 'IPQC_FIRST'  // 首件检验
  | 'IPQC_SELF'   // 过程自检
  | 'IPQC_PATROL' // 巡检
  | 'IPQC_LAST'   // 末件检验
  | 'FQC'         // 成品检验
  | 'OQC'         // 出货检验
  | 'STERILE'     // 灭菌确认
  | 'SPECIAL';    // 特殊过程

// ============================================================
// 质检项目 —— 接口
// ============================================================

export interface QcItem {
  id: string;
  itemCode: string;         // 项目编码，如 QCI-SZ-001
  itemName: string;         // 项目名称，如 外径D1
  category: QcItemCategory; // 大类
  standardType: QcStandardType; // 标准值类型
  // 数值型
  standardValue?: string;   // 标准值描述，如 "0.250±0.005"
  minValue?: number;
  maxValue?: number;
  unit?: string;            // 单位，如 mm、℃
  // 枚举型
  enumOptions?: string[];   // 合格选项列表
  // 量具
  instrumentType?: string;  // 所需量具类型，如 千分尺
  // 管控属性
  isCritical: boolean;      // 关键项（Critical）
  isRequired: boolean;      // 必检项
  // 适用范围
  applyTypes: QcApplyType[]; // 适用的检验类型
  // 引用标准/规范
  refStandard?: string;     // 引用标准，如 YY 0462-2023
  // 档案管理
  status: QcItemStatus;
  version: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 质检方案 —— 类型
// ============================================================

export type QcSchemeType =
  | 'IQC'
  | 'IPQC_FIRST'
  | 'IPQC_PATROL'
  | 'IPQC_SELF'
  | 'IPQC_LAST'
  | 'FQC'
  | 'OQC'
  | 'STERILE'
  | 'SPECIAL';

export type QcSamplingType = 'FULL' | 'AQL' | 'FIXED' | 'PERCENT';
export type QcSchemeStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

/** 方案中的项目条目（引用 QcItem + 局部覆盖） */
export interface QcSchemeItem {
  seqNo: number;            // 排序号
  itemId: string;           // 引用 QcItem.id
  itemCode: string;         // 冗余，便于展示
  itemName: string;         // 冗余
  category: QcItemCategory;
  standardType: QcStandardType;
  // 以下字段继承自 QcItem，方案可局部覆盖
  standardValue?: string;
  minValue?: number;
  maxValue?: number;
  enumOptions?: string[];
  unit?: string;
  instrumentType?: string;
  isCritical: boolean;
  isRequired: boolean;
  // 是否在本方案中启用
  enabled: boolean;
  remark?: string;
}

export interface QcScheme {
  id: string;
  schemeCode: string;       // 方案编码，如 SCH-IQC-001
  schemeName: string;       // 方案名称
  schemeType: QcSchemeType; // 检验类型
  // 适用对象
  productModel?: string;    // 适用产品型号（空=通用）
  materialCode?: string;    // 适用物料编码（IQC）
  operationCode?: string;   // 适用工序编码（IPQC）
  operationSeq?: number;    // 适用工序序号
  // 抽样规则
  samplingType: QcSamplingType;
  aqlLevel?: string;        // AQL水平，如 "1.0", "0.65"
  sampleSize?: number;      // 固定样本量
  samplePercent?: number;   // 百分比
  // 检验项列表（有序）
  items: QcSchemeItem[];
  // 档案管理
  status: QcSchemeStatus;
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  approvedBy?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 常量映射
// ============================================================

export const QC_ITEM_CATEGORY_MAP: Record<QcItemCategory, { label: string; color: string }> = {
  SIZE:        { label: '尺寸',   color: 'blue' },
  APPEARANCE:  { label: '外观',   color: 'cyan' },
  PERFORMANCE: { label: '性能',   color: 'purple' },
  MICROBIAL:   { label: '微生物', color: 'red' },
  CHEMICAL:    { label: '化学',   color: 'orange' },
  PHYSICAL:    { label: '物理',   color: 'geekblue' },
  DOCUMENT:    { label: '文件',   color: 'default' },
};

export const QC_STANDARD_TYPE_MAP: Record<QcStandardType, { label: string; color: string }> = {
  NUMERIC: { label: '数值型', color: 'blue' },
  ENUM:    { label: '枚举型', color: 'green' },
  BOOLEAN: { label: '判断型', color: 'orange' },
  TEXT:    { label: '文本型', color: 'default' },
};

export const QC_SCHEME_TYPE_MAP: Record<QcSchemeType, { label: string; color: string; shortLabel: string }> = {
  IQC:         { label: '来料检验(IQC)',  color: 'blue',     shortLabel: 'IQC' },
  IPQC_FIRST:  { label: '首件检验',       color: 'geekblue', shortLabel: '首件' },
  IPQC_PATROL: { label: '巡检',           color: 'purple',   shortLabel: '巡检' },
  IPQC_SELF:   { label: '过程自检',       color: 'cyan',     shortLabel: '自检' },
  IPQC_LAST:   { label: '末件检验',       color: 'magenta',  shortLabel: '末件' },
  FQC:         { label: '成品检验(FQC)',  color: 'orange',   shortLabel: 'FQC' },
  OQC:         { label: '出货检验(OQC)',  color: 'volcano',  shortLabel: 'OQC' },
  STERILE:     { label: '灭菌确认',       color: 'lime',     shortLabel: '灭菌' },
  SPECIAL:     { label: '特殊过程确认',   color: 'gold',     shortLabel: '特殊' },
};

export const QC_SCHEME_STATUS_MAP: Record<QcSchemeStatus, { label: string; color: string }> = {
  DRAFT:    { label: '草稿',   color: 'default' },
  ACTIVE:   { label: '启用中', color: 'success' },
  INACTIVE: { label: '已停用', color: 'error' },
};

export const QC_APPLY_TYPE_MAP: Record<QcApplyType, string> = {
  IQC:         '来料检验',
  IPQC_FIRST:  '首件检验',
  IPQC_SELF:   '过程自检',
  IPQC_PATROL: '巡检',
  IPQC_LAST:   '末件检验',
  FQC:         '成品检验',
  OQC:         '出货检验',
  STERILE:     '灭菌确认',
  SPECIAL:     '特殊过程',
};

export const QC_SAMPLING_TYPE_MAP: Record<QcSamplingType, string> = {
  FULL:    '全检',
  AQL:     'AQL抽样',
  FIXED:   '固定样本量',
  PERCENT: '百分比抽样',
};

// ============================================================
// 生成工具
// ============================================================

export function genQcItemCode(): string {
  const d = new Date();
  return `QCI-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*999)+1).padStart(3,'0')}`;
}

export function genQcSchemeCode(type: QcSchemeType): string {
  const prefix: Record<QcSchemeType, string> = {
    IQC: 'SCH-IQC', IPQC_FIRST: 'SCH-FPP', IPQC_PATROL: 'SCH-PTL',
    IPQC_SELF: 'SCH-SLF', IPQC_LAST: 'SCH-LST', FQC: 'SCH-FQC',
    OQC: 'SCH-OQC', STERILE: 'SCH-STR', SPECIAL: 'SCH-SPC',
  };
  return `${prefix[type]}-${String(Date.now()).slice(-4)}`;
}

/** 从 QcSchemeItem 生成 InspectionTaskItem（供创建检验任务时使用） */
export function schemeItemToTaskItem(si: QcSchemeItem) {
  return {
    itemCode: si.itemCode,
    itemName: si.itemName,
    category: si.category,
    standardType: si.standardType,
    standardValue: si.standardValue,
    minValue: si.minValue,
    maxValue: si.maxValue,
    enumOptions: si.enumOptions,
    unit: si.unit,
    isCritical: si.isCritical,
    result: 'PENDING' as const,
  };
}

// ============================================================
// Mock 质检项目档案
// ============================================================

export const mockQcItems: QcItem[] = [
  // ── 尺寸类 ────────────────────────────────────────────────
  {
    id: 'QCI001', itemCode: 'QCI-SZ-001', itemName: '原材直径', category: 'SIZE',
    standardType: 'NUMERIC', standardValue: '0.300±0.005', minValue: 0.295, maxValue: 0.305, unit: 'mm',
    instrumentType: '千分尺', isCritical: true, isRequired: true,
    applyTypes: ['IQC'], refStandard: 'YY 0462-2023',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI002', itemCode: 'QCI-SZ-002', itemName: '外径D1', category: 'SIZE',
    standardType: 'NUMERIC', standardValue: '0.250±0.005', minValue: 0.245, maxValue: 0.255, unit: 'mm',
    instrumentType: '千分尺', isCritical: true, isRequired: true,
    applyTypes: ['IPQC_FIRST', 'IPQC_SELF', 'FQC', 'OQC'], refStandard: 'YY 0462-2023',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI003', itemCode: 'QCI-SZ-003', itemName: '外径D2', category: 'SIZE',
    standardType: 'NUMERIC', standardValue: '按规格书', unit: 'mm',
    instrumentType: '千分尺', isCritical: false, isRequired: true,
    applyTypes: ['IPQC_SELF', 'FQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI004', itemCode: 'QCI-SZ-004', itemName: '尖端直径D0', category: 'SIZE',
    standardType: 'NUMERIC', standardValue: '0.150±0.005', minValue: 0.145, maxValue: 0.155, unit: 'mm',
    instrumentType: '投影仪', isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'], refStandard: 'YY 0462-2023',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI005', itemCode: 'QCI-SZ-005', itemName: '总长度L', category: 'SIZE',
    standardType: 'NUMERIC', standardValue: '25±0.5', minValue: 24.5, maxValue: 25.5, unit: 'mm',
    instrumentType: '游标卡尺', isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'], refStandard: 'YY 0462-2023',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI006', itemCode: 'QCI-SZ-006', itemName: '工作长度', category: 'SIZE',
    standardType: 'ENUM', enumOptions: ['16mm', '20mm', '26mm'],
    instrumentType: '投影仪', isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'], refStandard: 'YY 0462-2023',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI007', itemCode: 'QCI-SZ-007', itemName: '锥度', category: 'SIZE',
    standardType: 'ENUM', enumOptions: ['0.02', '0.04', '0.06', '0.08'],
    isCritical: true, isRequired: true,
    applyTypes: ['IPQC_FIRST', 'IPQC_SELF', 'FQC', 'OQC'], refStandard: 'YY 0462-2023',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI008', itemCode: 'QCI-SZ-008', itemName: '螺纹螺距', category: 'SIZE',
    standardType: 'NUMERIC', standardValue: '按设计图纸', unit: 'mm',
    instrumentType: '投影仪', isCritical: true, isRequired: true,
    applyTypes: ['IPQC_FIRST'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI009', itemCode: 'QCI-SZ-009', itemName: '表面粗糙度Ra', category: 'SIZE',
    standardType: 'NUMERIC', standardValue: '≤0.8', maxValue: 0.8, unit: 'μm',
    instrumentType: '粗糙度仪', isCritical: false, isRequired: true,
    applyTypes: ['IPQC_SELF', 'FQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI010', itemCode: 'QCI-SZ-010', itemName: '圆度', category: 'SIZE',
    standardType: 'NUMERIC', standardValue: '≤0.005', maxValue: 0.005, unit: 'mm',
    instrumentType: '圆度仪', isCritical: false, isRequired: true,
    applyTypes: ['FQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── 外观类 ────────────────────────────────────────────────
  {
    id: 'QCI011', itemCode: 'QCI-AP-001', itemName: '表面外观', category: 'APPEARANCE',
    standardType: 'ENUM', enumOptions: ['合格', '不合格'],
    isCritical: true, isRequired: true,
    applyTypes: ['IQC', 'IPQC_FIRST', 'IPQC_SELF', 'IPQC_PATROL', 'FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI012', itemCode: 'QCI-AP-002', itemName: '颜色标识', category: 'APPEARANCE',
    standardType: 'ENUM', enumOptions: ['正确', '错误'],
    isCritical: false, isRequired: true,
    applyTypes: ['FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI013', itemCode: 'QCI-AP-003', itemName: '清洗洁净度', category: 'APPEARANCE',
    standardType: 'ENUM', enumOptions: ['合格', '不合格'],
    isCritical: false, isRequired: true,
    applyTypes: ['IPQC_SELF'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI014', itemCode: 'QCI-AP-004', itemName: '包装完整性', category: 'APPEARANCE',
    standardType: 'ENUM', enumOptions: ['合格', '不合格'],
    isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── 性能类 ────────────────────────────────────────────────
  {
    id: 'QCI015', itemCode: 'QCI-PF-001', itemName: '扭转强度', category: 'PERFORMANCE',
    standardType: 'NUMERIC', standardValue: '≥规范要求值', unit: 'N·cm',
    instrumentType: '扭力测试仪', isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'], refStandard: 'YY 0462-2023',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI016', itemCode: 'QCI-PF-002', itemName: '抗弯强度', category: 'PERFORMANCE',
    standardType: 'NUMERIC', standardValue: '≥规范要求值', unit: 'N',
    instrumentType: '弯曲测试仪', isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'], refStandard: 'YY 0462-2023',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── 物理类 ────────────────────────────────────────────────
  {
    id: 'QCI017', itemCode: 'QCI-PH-001', itemName: '硬度', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '300~380', minValue: 300, maxValue: 380, unit: 'HV',
    instrumentType: '硬度仪', isCritical: true, isRequired: true,
    applyTypes: ['IQC'], refStandard: 'GB/T 4340',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI018', itemCode: 'QCI-PH-002', itemName: '升温速率', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '5.0~8.0', minValue: 5.0, maxValue: 8.0, unit: '℃/min',
    isCritical: true, isRequired: true,
    applyTypes: ['SPECIAL'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI019', itemCode: 'QCI-PH-003', itemName: '保温温度', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '480~520', minValue: 480, maxValue: 520, unit: '℃',
    isCritical: true, isRequired: true,
    applyTypes: ['SPECIAL'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI020', itemCode: 'QCI-PH-004', itemName: '保温时间', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '10~15', minValue: 10, maxValue: 15, unit: 'min',
    isCritical: true, isRequired: true,
    applyTypes: ['SPECIAL'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── 文件类 ────────────────────────────────────────────────
  {
    id: 'QCI021', itemCode: 'QCI-DC-001', itemName: '材质证书', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['IQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI022', itemCode: 'QCI-DC-002', itemName: '材料规格核对', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['IQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI023', itemCode: 'QCI-DC-003', itemName: '温度曲线审核', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['SPECIAL'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI024', itemCode: 'QCI-DC-004', itemName: 'QA双人复核', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['SPECIAL'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI025', itemCode: 'QCI-DC-005', itemName: '外箱UDI校验', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['OQC'], refStandard: 'YY/T 0681',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI026', itemCode: 'QCI-DC-006', itemName: '灭菌批号一致性', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['OQC', 'STERILE'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI027', itemCode: 'QCI-DC-007', itemName: '有效期计算确认', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['OQC', 'STERILE'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QCI028', itemCode: 'QCI-DC-008', itemName: '出货数量核对', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: false, isRequired: true,
    applyTypes: ['OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
];

// ============================================================
// Mock 质检方案档案
// ============================================================

function mkItem(item: QcItem, seq: number, overrides?: Partial<QcSchemeItem>): QcSchemeItem {
  return {
    seqNo: seq,
    itemId: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    category: item.category,
    standardType: item.standardType,
    standardValue: item.standardValue,
    minValue: item.minValue,
    maxValue: item.maxValue,
    enumOptions: item.enumOptions,
    unit: item.unit,
    instrumentType: item.instrumentType,
    isCritical: item.isCritical,
    isRequired: item.isRequired,
    enabled: true,
    ...overrides,
  };
}

const i = (code: string) => mockQcItems.find(x => x.id === code)!;

export const mockQcSchemes: QcScheme[] = [
  // ── IQC 来料检验 ──────────────────────────────────────────
  {
    id: 'QSCH001',
    schemeCode: 'SCH-IQC-001',
    schemeName: '镍钛丝来料检验方案',
    schemeType: 'IQC',
    productModel: '通用',
    materialCode: 'MAT-NiTi',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张伟 (QA经理)',
    items: [
      mkItem(i('QCI022'), 1),  // 材料规格核对
      mkItem(i('QCI001'), 2),  // 原材直径
      mkItem(i('QCI017'), 3),  // 硬度
      mkItem(i('QCI011'), 4),  // 表面外观
      mkItem(i('QCI021'), 5),  // 材质证书
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── IPQC 首件检验 ─────────────────────────────────────────
  {
    id: 'QSCH002',
    schemeCode: 'SCH-FPP-010',
    schemeName: '机床成型首件检验方案',
    schemeType: 'IPQC_FIRST',
    productModel: '根管锉',
    operationCode: 'OP-10-GRIND',
    operationSeq: 10,
    samplingType: 'FULL',
    sampleSize: 1,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张伟 (QA经理)',
    items: [
      mkItem(i('QCI002'), 1),  // 外径D1
      mkItem(i('QCI007'), 2),  // 锥度
      mkItem(i('QCI008'), 3),  // 螺纹螺距
      mkItem(i('QCI011'), 4),  // 表面外观
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── IPQC 过程自检 ─────────────────────────────────────────
  {
    id: 'QSCH003',
    schemeCode: 'SCH-SLF-050',
    schemeName: '研磨一过程自检方案',
    schemeType: 'IPQC_SELF',
    productModel: '根管锉',
    operationCode: 'OP-50-GRIND1',
    operationSeq: 50,
    samplingType: 'FIXED',
    sampleSize: 5,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张伟 (QA经理)',
    items: [
      mkItem(i('QCI002'), 1),  // 外径D1
      mkItem(i('QCI003'), 2),  // 外径D2
      mkItem(i('QCI007'), 3),  // 锥度
      mkItem(i('QCI011'), 4),  // 表面外观
      mkItem(i('QCI009'), 5),  // 粗糙度Ra
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── 特殊过程确认 ──────────────────────────────────────────
  {
    id: 'QSCH004',
    schemeCode: 'SCH-SPC-060',
    schemeName: '热处理特殊过程确认方案',
    schemeType: 'SPECIAL',
    productModel: '根管锉',
    operationCode: 'OP-60-HEAT',
    operationSeq: 60,
    samplingType: 'FULL',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '周敏 (QA经理)',
    items: [
      mkItem(i('QCI018'), 1),  // 升温速率
      mkItem(i('QCI019'), 2),  // 保温温度
      mkItem(i('QCI020'), 3),  // 保温时间
      mkItem(i('QCI023'), 4),  // 温度曲线审核
      mkItem(i('QCI024'), 5),  // QA双人复核
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── FQC 成品检验 ──────────────────────────────────────────
  {
    id: 'QSCH005',
    schemeCode: 'SCH-FQC-001',
    schemeName: '半成品检验方案',
    schemeType: 'FQC',
    productModel: '根管锉',
    operationSeq: 150,
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张伟 (QA经理)',
    items: [
      mkItem(i('QCI005'), 1),  // 总长度L
      mkItem(i('QCI004'), 2),  // 尖端直径D0
      mkItem(i('QCI007'), 3),  // 锥度
      mkItem(i('QCI015'), 4),  // 扭转强度
      mkItem(i('QCI016'), 5),  // 抗弯强度
      mkItem(i('QCI011'), 6),  // 表面外观
      mkItem(i('QCI012'), 7),  // 颜色标识
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'QSCH006',
    schemeCode: 'SCH-FQC-002',
    schemeName: '成品终检方案',
    schemeType: 'FQC',
    productModel: '根管锉',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '周敏 (QA经理)',
    items: [
      mkItem(i('QCI005'), 1),  // 总长度L
      mkItem(i('QCI006'), 2),  // 工作长度
      mkItem(i('QCI004'), 3),  // 尖端直径D0
      mkItem(i('QCI007'), 4),  // 锥度
      mkItem(i('QCI010'), 5),  // 圆度
      mkItem(i('QCI009'), 6),  // 粗糙度Ra
      mkItem(i('QCI015'), 7),  // 扭转强度
      mkItem(i('QCI016'), 8),  // 抗弯强度
      mkItem(i('QCI011'), 9),  // 表面外观
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── OQC 出货检验 ──────────────────────────────────────────
  {
    id: 'QSCH007',
    schemeCode: 'SCH-OQC-001',
    schemeName: '出货检验方案',
    schemeType: 'OQC',
    productModel: '根管锉',
    samplingType: 'AQL',
    aqlLevel: '0.65',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '周敏 (QA经理)',
    items: [
      mkItem(i('QCI025'), 1),  // 外箱UDI校验
      mkItem(i('QCI014'), 2),  // 包装完整性
      mkItem(i('QCI026'), 3),  // 灭菌批号一致性
      mkItem(i('QCI027'), 4),  // 有效期计算确认
      mkItem(i('QCI028'), 5),  // 出货数量核对
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  // ── IPQC 巡检 ─────────────────────────────────────────────
  {
    id: 'QSCH008',
    schemeCode: 'SCH-PTL-001',
    schemeName: '车间通用巡检方案',
    schemeType: 'IPQC_PATROL',
    productModel: '通用',
    samplingType: 'FIXED',
    sampleSize: 3,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张伟 (QA经理)',
    items: [
      mkItem(i('QCI002'), 1),  // 外径D1
      mkItem(i('QCI011'), 2),  // 表面外观
      mkItem(i('QCI013'), 3),  // 清洗洁净度
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
];

// ============================================================
// 辅助函数
// ============================================================

/** 按 id 查找质检项目 */
export function findQcItem(id: string): QcItem | undefined {
  return mockQcItems.find(x => x.id === id);
}

/** 按 id 查找质检方案 */
export function findQcScheme(id: string): QcScheme | undefined {
  return mockQcSchemes.find(x => x.id === id);
}

/** 获取所有启用的方案（供检验任务选择） */
export function getActiveSchemes(): QcScheme[] {
  return mockQcSchemes.filter(s => s.status === 'ACTIVE');
}

/** 按检验类型筛选方案 */
export function getSchemesByType(type: QcSchemeType): QcScheme[] {
  return mockQcSchemes.filter(s => s.schemeType === type && s.status === 'ACTIVE');
}
