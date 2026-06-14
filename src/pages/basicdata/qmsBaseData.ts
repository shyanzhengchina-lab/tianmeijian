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
// Mock 质检项目档案 - 天美健保健品行业（GB/国标/保健食品法规）
// ============================================================

export const mockQcItems: QcItem[] = [
  // ── 化学类（含量测定）────────────────────────────────────
  {
    id: 'QCI001', itemCode: 'QCI-CH-001', itemName: 'VitC含量（HPLC法）', category: 'CHEMICAL',
    standardType: 'NUMERIC', standardValue: '450~550mg/粒', minValue: 450, maxValue: 550, unit: 'mg/粒',
    instrumentType: 'HPLC高效液相色谱仪', isCritical: true, isRequired: true,
    applyTypes: ['IQC', 'IPQC_SELF', 'FQC', 'OQC'], refStandard: 'GB 14754-2010',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── 化学类（含量/纯度）────────────────────────────────────
  {
    id: 'QCI002', itemCode: 'QCI-CH-002', itemName: '维生素C含量（滴定法）', category: 'CHEMICAL',
    standardType: 'NUMERIC', standardValue: '≥450mg/粒（标示量90%~110%）', minValue: 450, maxValue: 550, unit: 'mg/粒',
    instrumentType: '自动滴定仪', isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'], refStandard: 'GB 14754-2010',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI003', itemCode: 'QCI-CH-003', itemName: '活菌数（益生菌胶囊）', category: 'CHEMICAL',
    standardType: 'NUMERIC', standardValue: '≥1×10⁹ CFU/粒', minValue: 1.0e9, unit: 'CFU/粒',
    instrumentType: '活菌计数仪/培养箱', isCritical: true, isRequired: true,
    applyTypes: ['IQC', 'IPQC_SELF', 'FQC', 'OQC'], refStandard: 'GB/T 4789.35',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI004', itemCode: 'QCI-CH-004', itemName: '水分（LOD）', category: 'CHEMICAL',
    standardType: 'NUMERIC', standardValue: '≤2.0%', maxValue: 2.0, unit: '%',
    instrumentType: '水分测定仪（快速卤素）', isCritical: true, isRequired: true,
    applyTypes: ['IPQC_SELF', 'FQC'], refStandard: 'GB 5009.3',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI005', itemCode: 'QCI-CH-005', itemName: '重金属（铅 Pb）', category: 'CHEMICAL',
    standardType: 'NUMERIC', standardValue: '≤0.5mg/kg', maxValue: 0.5, unit: 'mg/kg',
    instrumentType: 'ICP-MS质谱仪', isCritical: true, isRequired: true,
    applyTypes: ['IQC', 'FQC'], refStandard: 'GB 5009.12',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── 物理类（物理特性）────────────────────────────────────
  {
    id: 'QCI006', itemCode: 'QCI-PH-001', itemName: '片重差异', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '标示量±5%', minValue: 475, maxValue: 525, unit: 'mg',
    instrumentType: '分析天平', isCritical: true, isRequired: true,
    applyTypes: ['IPQC_FIRST', 'IPQC_SELF', 'IPQC_PATROL', 'FQC'], refStandard: 'GB/T 14456',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI007', itemCode: 'QCI-PH-002', itemName: '片剂硬度', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '50~80N', minValue: 50, maxValue: 80, unit: 'N',
    instrumentType: '片剂硬度仪', isCritical: false, isRequired: true,
    applyTypes: ['IPQC_FIRST', 'IPQC_PATROL', 'FQC'], refStandard: 'ChP2020',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI008', itemCode: 'QCI-PH-003', itemName: '脆碎度', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '≤0.5%', maxValue: 0.5, unit: '%',
    instrumentType: '片剂脆碎度测定仪', isCritical: false, isRequired: true,
    applyTypes: ['IPQC_FIRST', 'FQC'], refStandard: 'ChP2020',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI009', itemCode: 'QCI-PH-004', itemName: '崩解时限', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '≤30min', maxValue: 30, unit: 'min',
    instrumentType: '崩解时限测定仪', isCritical: true, isRequired: true,
    applyTypes: ['IPQC_FIRST', 'FQC'], refStandard: 'ChP2020',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI010', itemCode: 'QCI-PH-005', itemName: '溶出度（30min释放率）', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '≥70%（30min，磷酸盐缓冲液pH6.8）', minValue: 70, unit: '%',
    instrumentType: '溶出仪/HPLC', isCritical: true, isRequired: true,
    applyTypes: ['FQC'], refStandard: 'ChP2020',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI011', itemCode: 'QCI-PH-006', itemName: '胶囊充填重量差异', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '标示量±7.5%', unit: 'mg',
    instrumentType: '分析天平', isCritical: true, isRequired: true,
    applyTypes: ['IPQC_FIRST', 'IPQC_SELF', 'FQC'], refStandard: 'ChP2020',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI012', itemCode: 'QCI-PH-007', itemName: '冷链温度记录（益生菌）', category: 'PHYSICAL',
    standardType: 'NUMERIC', standardValue: '操作温度≤8℃', maxValue: 8, unit: '℃',
    instrumentType: '冷链温度记录仪', isCritical: true, isRequired: true,
    applyTypes: ['IPQC_SELF', 'SPECIAL'], refStandard: 'GB 19489',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── 微生物类 ─────────────────────────────────────────────
  {
    id: 'QCI013', itemCode: 'QCI-MB-001', itemName: '菌落总数', category: 'MICROBIAL',
    standardType: 'NUMERIC', standardValue: '≤1000 CFU/g', maxValue: 1000, unit: 'CFU/g',
    instrumentType: '微生物培养箱/平板计数', isCritical: true, isRequired: true,
    applyTypes: ['IQC', 'FQC', 'OQC'], refStandard: 'GB 4789.2',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI014', itemCode: 'QCI-MB-002', itemName: '大肠菌群', category: 'MICROBIAL',
    standardType: 'ENUM', enumOptions: ['未检出', '检出'],
    instrumentType: '微生物培养箱/MPN法', isCritical: true, isRequired: true,
    applyTypes: ['IQC', 'FQC', 'OQC'], refStandard: 'GB 4789.3',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI015', itemCode: 'QCI-MB-003', itemName: '霉菌和酵母菌', category: 'MICROBIAL',
    standardType: 'NUMERIC', standardValue: '≤100 CFU/g', maxValue: 100, unit: 'CFU/g',
    instrumentType: '微生物培养箱', isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'], refStandard: 'GB 4789.15',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI016', itemCode: 'QCI-MB-004', itemName: '沙门氏菌', category: 'MICROBIAL',
    standardType: 'ENUM', enumOptions: ['未检出', '检出'],
    instrumentType: 'PCR快速检测/培养', isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'], refStandard: 'GB 4789.4',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── 外观类 ────────────────────────────────────────────────
  {
    id: 'QCI017', itemCode: 'QCI-AP-001', itemName: '片剂外观（色泽/均匀性）', category: 'APPEARANCE',
    standardType: 'ENUM', enumOptions: ['合格', '不合格'],
    isCritical: false, isRequired: true,
    applyTypes: ['IPQC_PATROL', 'IPQC_FIRST', 'FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI018', itemCode: 'QCI-AP-002', itemName: '包装密封性检验', category: 'APPEARANCE',
    standardType: 'ENUM', enumOptions: ['合格', '不合格'],
    isCritical: true, isRequired: true,
    applyTypes: ['IPQC_SELF', 'FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI019', itemCode: 'QCI-AP-003', itemName: '标签印刷质量', category: 'APPEARANCE',
    standardType: 'ENUM', enumOptions: ['合格', '不合格'],
    isCritical: false, isRequired: true,
    applyTypes: ['IPQC_LAST', 'FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI020', itemCode: 'QCI-AP-004', itemName: '胶囊外观（无缺损/无漏粉）', category: 'APPEARANCE',
    standardType: 'ENUM', enumOptions: ['合格', '不合格'],
    isCritical: true, isRequired: true,
    applyTypes: ['IPQC_PATROL', 'FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── 文件类 ────────────────────────────────────────────────
  {
    id: 'QCI021', itemCode: 'QCI-DC-001', itemName: '原料检验报告（COA）', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['IQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI022', itemCode: 'QCI-DC-002', itemName: '批生产记录（BPR）审核', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI023', itemCode: 'QCI-DC-003', itemName: '有效期与生产日期核对', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI024', itemCode: 'QCI-DC-004', itemName: 'QA放行签字确认', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['FQC', 'OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI025', itemCode: 'QCI-DC-005', itemName: '冷链配送温度记录', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: true, isRequired: true,
    applyTypes: ['OQC', 'SPECIAL'], refStandard: 'GB 19489',
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QCI026', itemCode: 'QCI-DC-006', itemName: '出货数量核对', category: 'DOCUMENT',
    standardType: 'BOOLEAN',
    isCritical: false, isRequired: true,
    applyTypes: ['OQC'],
    status: 'ACTIVE', version: 'V1.0', createdAt: '2026-01-01', updatedAt: '2026-01-15',
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
  // ── IQC 来料检验方案 ──────────────────────────────────────
  {
    id: 'QSCH001',
    schemeCode: 'SCH-IQC-VITC',
    schemeName: '维生素C原料来料检验方案',
    schemeType: 'IQC',
    materialCode: 'RM-VITC-001',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张丽华 (QA经理)',
    items: [
      mkItem(i('QCI021'), 1),  // 原料检验报告COA
      mkItem(i('QCI001'), 2),  // VitC含量(HPLC)
      mkItem(i('QCI004'), 3),  // 水分(LOD)
      mkItem(i('QCI005'), 4),  // 重金属(Pb)
      mkItem(i('QCI013'), 5),  // 菌落总数
      mkItem(i('QCI014'), 6),  // 大肠菌群
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QSCH002',
    schemeCode: 'SCH-IQC-PROBIO',
    schemeName: '益生菌菌粉来料检验方案',
    schemeType: 'IQC',
    materialCode: 'RM-PROBIO-LA',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '赵雪梅 (QA经理)',
    items: [
      mkItem(i('QCI021'), 1),  // COA
      mkItem(i('QCI003'), 2),  // 活菌数
      mkItem(i('QCI012'), 3),  // 冷链温度记录
      mkItem(i('QCI013'), 4),  // 菌落总数
      mkItem(i('QCI016'), 5),  // 沙门氏菌
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── IPQC 首件检验 ─────────────────────────────────────────
  {
    id: 'QSCH003',
    schemeCode: 'SCH-FPP-TAB',
    schemeName: 'VitC片剂压片首件检验方案',
    schemeType: 'IPQC_FIRST',
    productModel: 'FG-VITC-500MG-AP',
    operationCode: 'OP-40',
    operationSeq: 40,
    samplingType: 'FIXED',
    sampleSize: 10,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张丽华 (QA经理)',
    items: [
      mkItem(i('QCI006'), 1),  // 片重差异
      mkItem(i('QCI007'), 2),  // 片剂硬度
      mkItem(i('QCI008'), 3),  // 脆碎度
      mkItem(i('QCI009'), 4),  // 崩解时限
      mkItem(i('QCI017'), 5),  // 外观
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QSCH004',
    schemeCode: 'SCH-FPP-CAP',
    schemeName: '益生菌胶囊充填首件检验方案',
    schemeType: 'IPQC_FIRST',
    productModel: 'FG-PROBIO-CAP-250',
    operationCode: 'OP-40',
    operationSeq: 40,
    samplingType: 'FIXED',
    sampleSize: 10,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '赵雪梅 (QA经理)',
    items: [
      mkItem(i('QCI011'), 1),  // 胶囊重量差异
      mkItem(i('QCI012'), 2),  // 冷链温度
      mkItem(i('QCI020'), 3),  // 胶囊外观
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── IPQC 过程自检 ─────────────────────────────────────────
  {
    id: 'QSCH005',
    schemeCode: 'SCH-SLF-TAB',
    schemeName: '片剂压片过程自检方案',
    schemeType: 'IPQC_SELF',
    productModel: 'VitC咀嚼片',
    operationCode: 'OP-40',
    operationSeq: 40,
    samplingType: 'FIXED',
    sampleSize: 20,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张丽华 (QA经理)',
    remark: '每30分钟取样20粒检验',
    items: [
      mkItem(i('QCI006'), 1),  // 片重差异
      mkItem(i('QCI007'), 2),  // 硬度
      mkItem(i('QCI017'), 3),  // 外观
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── 特殊过程确认（冷链）─────────────────────────────────
  {
    id: 'QSCH006',
    schemeCode: 'SCH-SPC-COLD',
    schemeName: '益生菌冷链操作特殊过程确认',
    schemeType: 'SPECIAL',
    productModel: 'FG-PROBIO-CAP-250',
    operationCode: 'OP-30',
    operationSeq: 30,
    samplingType: 'FULL',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '赵雪梅 (QA经理)',
    items: [
      mkItem(i('QCI012'), 1),  // 冷链温度
      mkItem(i('QCI025'), 2),  // 冷链配送温度记录
      mkItem(i('QCI024'), 3),  // QA放行签字
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── IPQC 巡检 ─────────────────────────────────────────────
  {
    id: 'QSCH007',
    schemeCode: 'SCH-PTL-SOLID',
    schemeName: '固体制剂车间通用巡检方案',
    schemeType: 'IPQC_PATROL',
    productModel: '通用',
    samplingType: 'FIXED',
    sampleSize: 5,
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张丽华 (QA经理)',
    remark: '每2小时巡检一次',
    items: [
      mkItem(i('QCI006'), 1),  // 片重差异
      mkItem(i('QCI007'), 2),  // 硬度
      mkItem(i('QCI017'), 3),  // 外观
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── FQC 成品检验 ──────────────────────────────────────────
  {
    id: 'QSCH008',
    schemeCode: 'SCH-FQC-VITC',
    schemeName: '维生素C咀嚼片成品检验方案',
    schemeType: 'FQC',
    productModel: 'FG-VITC-500MG-AP',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    sampleSize: 20,
    status: 'ACTIVE',
    version: 'V2.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张丽华 (QA经理)',
    items: [
      mkItem(i('QCI001'), 1),  // VitC含量(HPLC)
      mkItem(i('QCI002'), 2),  // VitC含量(滴定法)
      mkItem(i('QCI004'), 3),  // 水分
      mkItem(i('QCI006'), 4),  // 片重差异
      mkItem(i('QCI007'), 5),  // 硬度
      mkItem(i('QCI009'), 6),  // 崩解时限
      mkItem(i('QCI010'), 7),  // 溶出度
      mkItem(i('QCI013'), 8),  // 菌落总数
      mkItem(i('QCI014'), 9),  // 大肠菌群
      mkItem(i('QCI017'), 10), // 外观
      mkItem(i('QCI018'), 11), // 包装密封性
      mkItem(i('QCI022'), 12), // 批生产记录审核
      mkItem(i('QCI023'), 13), // 有效期核对
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QSCH009',
    schemeCode: 'SCH-FQC-PROBIO',
    schemeName: '复合益生菌胶囊成品检验方案',
    schemeType: 'FQC',
    productModel: 'FG-PROBIO-CAP-250',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    sampleSize: 10,
    status: 'ACTIVE',
    version: 'V1.5',
    effectiveDate: '2026-01-01',
    approvedBy: '赵雪梅 (QA经理)',
    items: [
      mkItem(i('QCI003'), 1),  // 活菌数
      mkItem(i('QCI004'), 2),  // 水分
      mkItem(i('QCI011'), 3),  // 胶囊重量差异
      mkItem(i('QCI013'), 4),  // 菌落总数
      mkItem(i('QCI014'), 5),  // 大肠菌群
      mkItem(i('QCI015'), 6),  // 霉菌和酵母
      mkItem(i('QCI016'), 7),  // 沙门氏菌
      mkItem(i('QCI020'), 8),  // 胶囊外观
      mkItem(i('QCI018'), 9),  // 包装密封性
      mkItem(i('QCI022'), 10), // 批生产记录审核
      mkItem(i('QCI023'), 11), // 有效期核对
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  // ── OQC 出货检验 ──────────────────────────────────────────
  {
    id: 'QSCH010',
    schemeCode: 'SCH-OQC-HLTH',
    schemeName: '保健品出货检验通用方案',
    schemeType: 'OQC',
    productModel: '通用',
    samplingType: 'AQL',
    aqlLevel: '0.65',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '张丽华 (QA经理)',
    items: [
      mkItem(i('QCI018'), 1),  // 包装密封性
      mkItem(i('QCI019'), 2),  // 标签印刷质量
      mkItem(i('QCI022'), 3),  // 批生产记录审核
      mkItem(i('QCI023'), 4),  // 有效期核对
      mkItem(i('QCI024'), 5),  // QA放行签字
      mkItem(i('QCI026'), 6),  // 出货数量核对
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
  },
  {
    id: 'QSCH011',
    schemeCode: 'SCH-OQC-COLD',
    schemeName: '益生菌冷链出货检验方案',
    schemeType: 'OQC',
    productModel: 'FG-PROBIO-CAP-250',
    samplingType: 'AQL',
    aqlLevel: '0.65',
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-01',
    approvedBy: '赵雪梅 (QA经理)',
    remark: '冷链出货，需核验全程温度记录',
    items: [
      mkItem(i('QCI012'), 1),  // 冷链温度
      mkItem(i('QCI025'), 2),  // 冷链配送温度记录
      mkItem(i('QCI018'), 3),  // 包装密封性
      mkItem(i('QCI022'), 4),  // 批生产记录审核
      mkItem(i('QCI023'), 5),  // 有效期核对
      mkItem(i('QCI026'), 6),  // 出货数量核对
    ],
    createdAt: '2026-01-01', updatedAt: '2026-01-15',
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
