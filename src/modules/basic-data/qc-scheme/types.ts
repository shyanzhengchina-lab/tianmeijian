/**
 * 质检方案模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 质检方案类型
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

// 抽样规则类型
export type QcSamplingType = 'FULL' | 'AQL' | 'FIXED' | 'PERCENT';

// 质检方案状态
export type QcSchemeStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

// 方案中的项目条目（引用 QcItem + 局部覆盖）
export interface QcSchemeItem {
  seqNo: number;            // 排序号
  itemId?: string;           // 引用 QcItem.id
  itemCode: string;         // 冗余，便于展示
  itemName: string;         // 冗余
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

// 质检方案接口
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
  // 方案管理
  status: QcSchemeStatus;
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  approvedBy?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 质检方案查询参数
export interface QcSchemeQuery extends PageQuery {
  schemeCode?: string;
  schemeName?: string;
  schemeType?: QcSchemeType;
  status?: QcSchemeStatus;
  productModel?: string;
  materialCode?: string;
  operationCode?: string;
}

// 创建质检方案DTO
export interface CreateQcSchemeDTO {
  schemeCode: string;
  schemeName: string;
  schemeType: QcSchemeType;
  productModel?: string;
  materialCode?: string;
  operationCode?: string;
  operationSeq?: number;
  samplingType: QcSamplingType;
  aqlLevel?: string;
  sampleSize?: number;
  samplePercent?: number;
  items: Omit<QcSchemeItem, 'itemId'>[];
  status?: QcSchemeStatus;
  version?: string;
  effectiveDate: string;
  expiryDate?: string;
  remark?: string;
}

// 更新质检方案DTO
export interface UpdateQcSchemeDTO extends Partial<CreateQcSchemeDTO> {
  id: string;
}

// 批量操作参数
export interface QcSchemeBatchAction {
  ids: string[];
  action: 'activate' | 'deactivate' | 'approve' | 'delete';
  params?: Record<string, any>;
}

// 质检方案类型映射
export const QC_SCHEME_TYPE_MAP: Record<QcSchemeType, { label: string; color: string }> = {
  'IQC':         { label: '来料检验',   color: '#1677ff' },
  'IPQC_FIRST':  { label: '首件检验',   color: '#52c41a' },
  'IPQC_PATROL': { label: '巡检',       color: '#13c2c2' },
  'IPQC_SELF':   { label: '过程自检',   color: '#faad14' },
  'IPQC_LAST':   { label: '末件检验',   color: '#eb2f96' },
  'FQC':         { label: '成品检验',   color: '#f5222d' },
  'OQC':         { label: '出货检验',   color: '#722ed1' },
  'STERILE':      { label: '灭菌确认',   color: '#13c2c2' },
  'SPECIAL':      { label: '特殊过程',   color: '#8c8c8c' },
};

// 抽样规则类型映射
export const QC_SAMPLING_TYPE_MAP: Record<QcSamplingType, { label: string; color: string }> = {
  'FULL':    { label: '全检',     color: '#1677ff' },
  'AQL':     { label: 'AQL抽样',  color: '#52c41a' },
  'FIXED':   { label: '固定数量', color: '#faad14' },
  'PERCENT': { label: '百分比',   color: '#eb2f96' },
};

// 质检方案状态映射
export const QC_SCHEME_STATUS_MAP: Record<QcSchemeStatus, { label: string; color: string; badge: any }> = {
  'DRAFT':    { label: '草稿',   color: '#8c8c8c', badge: 'default' },
  'ACTIVE':   { label: '已启用', color: '#52c41a', badge: 'success' },
  'INACTIVE': { label: '已停用', color: '#d9d9d9', badge: 'default' },
};

export interface QcSchemeStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  incomingCount: number;
  processCount: number;
  outgoingCount: number;
  finalCount: number;
  [key: string]: any;
}

export interface QcSchemeStatusAction {
  ids: string[];
  status: QcSchemeStatus;
  remark?: string;
}

// 默认质检方案数据
export const DEFAULT_QC_SCHEMES: QcScheme[] = [
  {
    id: 'SCH-001',
    schemeCode: 'SCH-IPQC-FIRST-001',
    schemeName: '根管锉首件检验方案',
    schemeType: 'IPQC_FIRST',
    operationCode: 'OP-CUT-001',
    operationSeq: 30,
    samplingType: 'FULL',
    items: [
      { seqNo: 10, itemCode: 'QCI-SZ-001', itemName: '外径D1', standardValue: '0.250±0.005', minValue: 0.245, maxValue: 0.255, unit: 'mm', instrumentType: '千分尺', isCritical: true, isRequired: true, enabled: true },
      { seqNo: 20, itemCode: 'QCI-SZ-002', itemName: '锥度', standardValue: '0.04/0.06/0.02', instrumentType: '投影仪', isCritical: true, isRequired: true, enabled: true },
      { seqNo: 30, itemCode: 'QCI-AP-001', itemName: '螺纹完整性', enumOptions: ['合格', '不合格'], instrumentType: '目视', isCritical: true, isRequired: true, enabled: true },
    ],
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-15',
    approvedBy: '质量总监',
    remark: '数控磨削工序首件检验标准方案',
    createdAt: '2026-01-10 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'SCH-002',
    schemeCode: 'SCH-IPQC-PATROL-001',
    schemeName: '根管锉巡检方案',
    schemeType: 'IPQC_PATROL',
    operationCode: 'OP-CUT-001',
    operationSeq: 50,
    samplingType: 'AQL',
    aqlLevel: '1.0',
    items: [
      { seqNo: 10, itemCode: 'QCI-SZ-001', itemName: '外径D1', standardValue: '0.250±0.005', minValue: 0.245, maxValue: 0.255, unit: 'mm', instrumentType: '千分尺', isCritical: true, isRequired: true, enabled: true },
      { seqNo: 20, itemCode: 'QCI-PE-001', itemName: '膜厚', standardValue: '0.5±0.1', minValue: 0.4, maxValue: 0.6, unit: 'μm', instrumentType: '粗糙度仪', isCritical: true, isRequired: true, enabled: true },
    ],
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-15',
    approvedBy: '质量总监',
    remark: '数控磨削工序巡检方案，每50件抽样检验',
    createdAt: '2026-01-10 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'SCH-003',
    schemeCode: 'SCH-IQC-001',
    schemeName: '镍钛丝材来料检验方案',
    schemeType: 'IQC',
    materialCode: 'RM-NTW-2504',
    samplingType: 'AQL',
    aqlLevel: '0.65',
    items: [
      { seqNo: 10, itemCode: 'QCI-SZ-001', itemName: '外径D1', standardValue: 'Φ0.32±0.005', minValue: 0.315, maxValue: 0.325, unit: 'mm', instrumentType: '千分尺', isCritical: true, isRequired: true, enabled: true },
      { seqNo: 20, itemCode: 'QCI-MI-001', itemName: '无菌检查', enumOptions: ['合格', '不合格'], instrumentType: '目视', isCritical: true, isRequired: true, enabled: true },
      { seqNo: 30, itemCode: 'QCI-AP-002', itemName: '表面粗糙度', standardValue: '≤0.8', maxValue: 0.8, unit: 'μm', instrumentType: '粗糙度仪', isCritical: false, isRequired: true, enabled: true },
    ],
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-15',
    approvedBy: '质量总监',
    remark: '镍钛丝材来料IQC检验方案',
    createdAt: '2026-01-10 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'SCH-004',
    schemeCode: 'SCH-OQC-001',
    schemeName: '根管锉出货检验方案',
    schemeType: 'OQC',
    productModel: 'FG-RKQ',
    samplingType: 'AQL',
    aqlLevel: '1.5',
    items: [
      { seqNo: 10, itemCode: 'QCI-SZ-001', itemName: '外径D1', standardValue: '0.250±0.005', minValue: 0.245, maxValue: 0.255, unit: 'mm', instrumentType: '千分尺', isCritical: true, isRequired: true, enabled: true },
      { seqNo: 20, itemCode: 'QCI-AP-001', itemName: '螺纹完整性', enumOptions: ['合格', '不合格'], instrumentType: '目视', isCritical: true, isRequired: true, enabled: true },
      { seqNo: 30, itemCode: 'QCI-MI-001', itemName: '无菌检查', enumOptions: ['合格', '不合格'], instrumentType: '目视', isCritical: true, isRequired: true, enabled: true },
      { seqNo: 40, itemCode: 'QCI-DO-001', itemName: '包装完整性', enumOptions: ['合格', '不合格'], instrumentType: '目视', isCritical: true, isRequired: true, enabled: true },
    ],
    status: 'ACTIVE',
    version: 'V1.0',
    effectiveDate: '2026-01-15',
    approvedBy: '质量总监',
    remark: '根管锉成品出货检验方案',
    createdAt: '2026-01-10 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
];
