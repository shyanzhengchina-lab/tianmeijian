/**
 * 质检项目模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 检验项目大类
export type QcItemCategory =
  | 'SIZE'        // 尺寸
  | 'APPEARANCE'  // 外观
  | 'PERFORMANCE'  // 性能/功能
  | 'MICROBIAL'   // 微生物
  | 'CHEMICAL'    // 化学
  | 'PHYSICAL'    // 物理特性
  | 'DOCUMENT';   // 文件/记录

// 标准值类型
export type QcStandardType =
  | 'NUMERIC'  // 数值（含上下限）
  | 'ENUM'     // 枚举（合格选项）
  | 'BOOLEAN'  // 布尔（是/否，通过/不通过）
  | 'TEXT';    // 文本（人工判断）

// 项目状态
export type QcItemStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

// 适用检验类型（可多选）
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

// 质检项目接口
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
  // 关键属性
  isCritical: boolean;      // 关键项（Critical）
  isRequired: boolean;      // 必检项
  // 适用范围
  applyTypes: QcApplyType[]; // 适用的检验类型
  // 引用标准/规范
  refStandard?: string;     // 引用标准，如 YY 0462-2023
  // 方案管理
  status: QcItemStatus;
  version: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 质检项目查询参数
export interface QcItemQuery extends PageQuery {
  itemCode?: string;
  itemName?: string;
  category?: QcItemCategory;
  standardType?: QcStandardType;
  status?: QcItemStatus;
  applyType?: QcApplyType;
}

// 创建质检项目DTO
export interface CreateQcItemDTO {
  itemCode: string;
  itemName: string;
  category: QcItemCategory;
  standardType: QcStandardType;
  standardValue?: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  enumOptions?: string[];
  instrumentType?: string;
  isCritical: boolean;
  isRequired: boolean;
  applyTypes: QcApplyType[];
  refStandard?: string;
  status?: QcItemStatus;
  version?: string;
  remark?: string;
}

// 更新质检项目DTO
export interface UpdateQcItemDTO extends Partial<CreateQcItemDTO> {
  id: string;
}

// 批量操作参数
export interface QcItemBatchAction {
  ids: string[];
  action: 'activate' | 'deactivate' | 'delete';
  params?: Record<string, any>;
}

// 质检项目大类映射
export const QC_ITEM_CATEGORY_MAP: Record<QcItemCategory, { label: string; color: string }> = {
  'SIZE':       { label: '尺寸',     color: '#1677ff' },
  'APPEARANCE': { label: '外观',     color: '#52c41a' },
  'PERFORMANCE': { label: '性能',     color: '#faad14' },
  'MICROBIAL':  { label: '微生物',   color: '#eb2f96' },
  'CHEMICAL':   { label: '化学',     color: '#f5222d' },
  'PHYSICAL':   { label: '物理特性', color: '#722ed1' },
  'DOCUMENT':    { label: '文件/记录', color: '#13c2c2' },
};

// 标准值类型映射
export const QC_STANDARD_TYPE_MAP: Record<QcStandardType, { label: string; color: string }> = {
  'NUMERIC': { label: '数值', color: '#1677ff' },
  'ENUM':    { label: '枚举', color: '#52c41a' },
  'BOOLEAN':  { label: '布尔', color: '#faad14' },
  'TEXT':    { label: '文本', color: '#722ed1' },
};

// 适用检验类型映射
export const QC_APPLY_TYPE_MAP: Record<QcApplyType, { label: string; color: string }> = {
  'IQC':          { label: '来料检验',   color: '#1677ff' },
  'IPQC_FIRST':   { label: '首件检验',   color: '#52c41a' },
  'IPQC_SELF':    { label: '过程自检',   color: '#13c2c2' },
  'IPQC_PATROL':  { label: '巡检',       color: '#faad14' },
  'IPQC_LAST':    { label: '末件检验',   color: '#eb2f96' },
  'FQC':          { label: '成品检验',   color: '#f5222d' },
  'OQC':          { label: '出货检验',   color: '#722ed1' },
  'STERILE':       { label: '灭菌确认',   color: '#13c2c2' },
  'SPECIAL':       { label: '特殊过程',   color: '#8c8c8c' },
};

// 质检项目状态映射
export const QC_ITEM_STATUS_MAP: Record<QcItemStatus, { label: string; color: string; badge: any }> = {
  'ACTIVE':   { label: '启用',   color: '#52c41a', badge: 'success' },
  'INACTIVE': { label: '停用',   color: '#8c8c8c', badge: 'default' },
  'DRAFT':    { label: '草稿',   color: '#faad14', badge: 'warning' },
};

// 量具选项
export const INSTRUMENT_OPTIONS = [
  '千分尺', '投影仪', '游标卡尺', '粗糙度仪', '硬度仪',
  '扭矩测试仪', '弯曲测试仪', '圆度仪', '目视', '量规', '扫码枪',
];

export interface QcItemStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  categoryCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  [key: string]: any;
}

export interface QcItemStatusAction {
  ids: string[];
  status: QcItemStatus;
  remark?: string;
}

// 默认质检项目数据
export const DEFAULT_QC_ITEMS: QcItem[] = [
  {
    id: 'QCI-001',
    itemCode: 'QCI-SZ-001',
    itemName: '外径D1（尖端上方3mm）',
    category: 'SIZE',
    standardType: 'NUMERIC',
    standardValue: '0.250±0.005',
    minValue: 0.245,
    maxValue: 0.255,
    unit: 'mm',
    instrumentType: '千分尺',
    isCritical: true,
    isRequired: true,
    applyTypes: ['IPQC_FIRST', 'IPQC_SELF', 'IPQC_PATROL', 'IPQC_LAST', 'FQC', 'OQC'],
    refStandard: 'YY 0462-2023',
    status: 'ACTIVE',
    version: 'V1.0',
    remark: '根管锉锥度磨削关键尺寸',
    createdAt: '2023-06-15 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'QCI-002',
    itemCode: 'QCI-SZ-002',
    itemName: '锥度',
    category: 'SIZE',
    standardType: 'NUMERIC',
    standardValue: '0.04/0.06/0.02',
    unit: '',
    instrumentType: '投影仪',
    isCritical: true,
    isRequired: true,
    applyTypes: ['IPQC_FIRST', 'IPQC_SELF', 'IPQC_PATROL', 'IPQC_LAST', 'FQC', 'OQC'],
    status: 'ACTIVE',
    version: 'V1.0',
    remark: '根管锉锥度规格',
    createdAt: '2023-06-15 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'QCI-003',
    itemCode: 'QCI-AP-001',
    itemName: '螺纹完整性',
    category: 'APPEARANCE',
    standardType: 'ENUM',
    enumOptions: ['合格', '不合格'],
    instrumentType: '目视',
    isCritical: true,
    isRequired: true,
    applyTypes: ['IPQC_FIRST', 'IPQC_SELF', 'IPQC_PATROL', 'IPQC_LAST', 'FQC', 'OQC'],
    status: 'ACTIVE',
    version: 'V1.0',
    remark: '螺纹滚压工序外观检验',
    createdAt: '2023-06-15 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'QCI-004',
    itemCode: 'QCI-PE-001',
    itemName: '膜厚',
    category: 'PERFORMANCE',
    standardType: 'NUMERIC',
    standardValue: '0.5±0.1',
    minValue: 0.4,
    maxValue: 0.6,
    unit: 'μm',
    instrumentType: '粗糙度仪',
    isCritical: true,
    isRequired: true,
    applyTypes: ['IPQC_SELF', 'IPQC_PATROL', 'IPQC_LAST', 'FQC', 'OQC'],
    refStandard: 'ISO 10993-18',
    status: 'ACTIVE',
    version: 'V1.2',
    remark: 'PVD涂层膜厚控制',
    createdAt: '2023-08-01 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'QCI-005',
    itemCode: 'QCI-AP-002',
    itemName: '表面粗糙度',
    category: 'APPEARANCE',
    standardType: 'NUMERIC',
    standardValue: '≤0.8',
    maxValue: 0.8,
    unit: 'μm',
    instrumentType: '粗糙度仪',
    isCritical: false,
    isRequired: true,
    applyTypes: ['IPQC_SELF', 'IPQC_PATROL', 'IPQC_LAST', 'FQC', 'OQC'],
    refStandard: 'GB/T 3505-2000',
    status: 'ACTIVE',
    version: 'V1.0',
    remark: '表面粗糙度要求',
    createdAt: '2023-06-15 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'QCI-006',
    itemCode: 'QCI-MI-001',
    itemName: '无菌检查',
    category: 'MICROBIAL',
    standardType: 'BOOLEAN',
    instrumentType: '目视',
    isCritical: true,
    isRequired: true,
    applyTypes: ['STERILE', 'OQC'],
    refStandard: 'GB 15980-1995',
    status: 'ACTIVE',
    version: 'V1.0',
    remark: '灭菌后的无菌检查',
    createdAt: '2023-06-15 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
];
