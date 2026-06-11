/**
 * 物料清单(BOM)模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// BOM状态
export type BomStatus = 'draft' | 'audited' | 'approved' | 'disabled';

// BOM类型
export type BomType = '主BOM' | '替代BOM' | '销售BOM';

// 子件类型
export type ChildType = '主料' | '辅料' | '包材' | '模具';

// 领料方式
export type IssueMethod = 'PUSH' | 'BACKFLUSH' | 'ON_SITE';

// BOM子件接口
export interface BomChild {
  id: string;
  rowNo: number;              // 行号
  childCode: string;          // 子件编码
  childName: string;          // 子件名称
  spec: string;               // 规格型号
  freeDesc: string;           // 自由项说明
  type: ChildType;            // 类型：主料/辅料/包材/模具
  qty: number;                // 主数量
  unit: string;               // 主单位
  childQty: number;           // 子件数量
  calcUnit: string;           // 计量单位
  scrapRate?: number;         // 损耗率%（废品率）
  lossRate?: number;          // 损耗率%（工艺损耗，倒扣公式用）
  issueType?: string;         // 领料方式：按工单/倒冲/现场领
  issueMethod?: IssueMethod;  // 领料方式枚举
  consumeOp?: string;         // 倒冲关联工序（如 OP-40）
  issueOperationSeq?: number;  // 领料工序序号（倒扣触发工序）
  minIssueQty?: number;       // 最小发料量（最小包装单位）
  wipWarehouse?: string;      // 目标线边仓编码（如 WIP-涂层）
  baseBatchQty?: number;      // 基础批量（BOM计算基准）
  keyMaterial?: boolean;      // 是否关键物料
  substitute?: string;        // 替代料编码
  remark?: string;            // 备注
}

// BOM头接口
export interface BomHeader {
  id: string;
  code: string;               // 母件编码（与物料档案联动）
  name: string;               // 物料名称
  spec?: string;              // 规格型号
  unit: string;               // 单位
  version: string;            // 版本号
  bomType: BomType;
  status: BomStatus;
  mainQty: number;            // 主批量
  mainUnit: string;           // 主单位
  batchQty: number;           // 批量
  calcUnit: string;           // 计量单位
  effectDate: string;         // 生效日期
  createdBy: string;
  createdAt: string;
  auditedBy?: string;
  auditedAt?: string;
  remark?: string;
  children: BomChild[];
}

// BOM查询参数
export interface BomQuery extends PageQuery {
  code?: string;
  name?: string;
  bomType?: BomType;
  status?: BomStatus;
  createdBy?: string;
  childCode?: string;
  childName?: string;
}

// 创建BOM DTO
export interface CreateBomDTO {
  code: string;
  name: string;
  spec?: string;
  unit: string;
  version: string;
  bomType: BomType;
  mainQty: number;
  mainUnit: string;
  batchQty: number;
  calcUnit: string;
  effectDate: string;
  remark?: string;
  children: Omit<BomChild, 'id'>[];
}

// 更新BOM DTO
export interface UpdateBomDTO extends Partial<CreateBomDTO> {
  id: string;
}

// 批量操作参数
export interface BomBatchAction {
  ids: string[];
  action: 'approve' | 'disable' | 'enable' | 'delete';
  params?: Record<string, any>;
}

// BOM状态映射
export const BOM_STATUS_MAP: Record<BomStatus, { label: string; color: string; badge: any }> = {
  draft: { label: '草稿', color: '#8c8c8c', badge: 'default' },
  audited: { label: '已审核', color: '#52c41a', badge: 'success' },
  approved: { label: '已批准', color: '#1677ff', badge: 'processing' },
  disabled: { label: '已禁用', color: '#cf1322', badge: 'error' },
};

// BOM类型映射
export const BOM_TYPE_MAP: Record<BomType, { label: string; color: string }> = {
  '主BOM': { label: '主BOM', color: '#1677ff' },
  '替代BOM': { label: '替代BOM', color: '#faad14' },
  '销售BOM': { label: '销售BOM', color: '#52c41a' },
};

// 子件类型映射
export const CHILD_TYPE_MAP: Record<ChildType, { label: string; color: string }> = {
  '主料': { label: '主料', color: '#cf1322' },
  '辅料': { label: '辅料', color: '#1677ff' },
  '包材': { label: '包材', color: '#52c41a' },
  '模具': { label: '模具', color: '#faad14' },
};

// 领料方式映射
export const ISSUE_METHOD_MAP: Record<IssueMethod, { label: string; color: string }> = {
  'PUSH': { label: '按工单', color: '#1677ff' },
  'BACKFLUSH': { label: '倒冲', color: '#52c41a' },
  'ON_SITE': { label: '现场领', color: '#faad14' },
};

// 默认BOM数据（从bomData.ts复制）
export const DEFAULT_BOMS: BomHeader[] = [
  {
    id: 'BOM001',
    code: 'FG-RKQ-2504-25',
    name: '机用根管锉',
    spec: '#25 / 04锥度 / 25mm',
    unit: '根',
    version: '2.1',
    bomType: '主BOM',
    status: 'approved',
    mainQty: 1,
    mainUnit: '根',
    batchQty: 5000,
    calcUnit: '根',
    effectDate: '2026-01-15',
    createdBy: '陈工长',
    createdAt: '2026-01-10 09:00:00',
    auditedBy: '质量总监',
    auditedAt: '2026-01-14 15:30:00',
    remark: 'V2.1版本：更新TiN涂层厚度至0.5μm，符合ISO 10993-18',
    children: [
      {
        id: 'BC001', rowNo: 10,
        childCode: 'RM-NTW-2504', childName: '镍钛丝材',
        spec: 'Φ0.32mm / ASTM F2063 / 盘装',
        freeDesc: '炉批号必须记录，IQC合格方可使用', type: '主料',
        qty: 1, unit: '根', childQty: 0.032, calcUnit: 'M',
        scrapRate: 3, issueType: '按工单', issueMethod: 'PUSH', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC002', rowNo: 20,
        childCode: 'RM-SS-HANDLE', childName: '不锈钢柄部毛坯',
        spec: 'Φ11mm × 12mm / SUS304',
        freeDesc: '激光焊接前需清洁', type: '主料',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单', issueMethod: 'PUSH', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC003', rowNo: 30,
        childCode: 'RM-ABS-COLOR-Y', childName: 'ABS色母粒（黄）',
        spec: '医用级ABS / ISO 10993-5 / 黄色',
        freeDesc: '#25锥度标识色，每1000个柄用约0.2kg', type: '主料',
        qty: 1, unit: '根', childQty: 0.0002, calcUnit: 'KG',
        scrapRate: 2, issueType: '按工单', issueMethod: 'PUSH',
        consumeOp: 'OP-50',
      },
      {
        id: 'BC004', rowNo: 40,
        childCode: 'CH-ETCH-HF', childName: '化学蚀刻液',
        spec: 'HF 5%混合液 / 20L桶',
        freeDesc: '按炉次用量，每炉约0.5L', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0005, calcUnit: 'L',
        issueType: '倒冲', issueMethod: 'BACKFLUSH', consumeOp: 'OP-30',
      },
      {
        id: 'BC005', rowNo: 50,
        childCode: 'CH-NITRIDE', childName: '氮化钛涂层靶材',
        spec: 'TiN / 纯度99.9% / PVD用',
        freeDesc: '每炉约消耗2g，按炉次计', type: '辅料',
        qty: 1, unit: '根', childQty: 0.002, calcUnit: 'G',
        issueType: '倒冲', issueMethod: 'BACKFLUSH', consumeOp: 'OP-40',
      },
      {
        id: 'BC009', rowNo: 90,
        childCode: 'PK-BLISTER-S', childName: '吸塑托盘（单支装）',
        spec: 'PET / 单根 / 113×22mm',
        freeDesc: '每根锉对应1个吸塑托', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        issueType: '按工单', issueMethod: 'PUSH',
      },
      {
        id: 'BC012', rowNo: 120,
        childCode: 'PK-BOX-6PCS', childName: '彩盒（6支装）',
        spec: '白卡纸 / 110×60×18mm',
        freeDesc: '6支1盒，每根分摊1/6', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '个',
        issueType: '按工单', issueMethod: 'PUSH',
      },
    ],
  },
  {
    id: 'BOM002',
    code: 'FG-RKQ-3006-21',
    name: '机用根管锉',
    spec: '#30 / 06锥度 / 21mm',
    unit: '根',
    version: '2.0',
    bomType: '主BOM',
    status: 'approved',
    mainQty: 1,
    mainUnit: '根',
    batchQty: 5000,
    calcUnit: '根',
    effectDate: '2026-01-15',
    createdBy: '陈工长',
    createdAt: '2026-01-10 10:00:00',
    auditedBy: '质量总监',
    auditedAt: '2026-01-14 16:00:00',
    remark: '#30/06锥，绿色柄，丝材规格Φ0.38mm',
    children: [
      {
        id: 'BC101', rowNo: 10,
        childCode: 'RM-NTW-3006', childName: '镍钛丝材',
        spec: 'Φ0.38mm / ASTM F2063',
        freeDesc: '炉批号必须记录', type: '主料',
        qty: 1, unit: '根', childQty: 0.027, calcUnit: 'M',
        scrapRate: 3, issueType: '按工单', issueMethod: 'PUSH', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC102', rowNo: 20,
        childCode: 'RM-SS-HANDLE', childName: '不锈钢柄部毛坯',
        spec: 'Φ11mm × 12mm / SUS304',
        freeDesc: '', type: '主料',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单', issueMethod: 'PUSH', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC103', rowNo: 30,
        childCode: 'RM-ABS-COLOR-G', childName: 'ABS色母粒（绿）',
        spec: '医用级ABS / ISO 10993-5 / 绿色',
        freeDesc: '#30锥度标识色', type: '主料',
        qty: 1, unit: '根', childQty: 0.0002, calcUnit: 'KG',
        scrapRate: 2, issueType: '按工单', issueMethod: 'PUSH',
        consumeOp: 'OP-50',
      },
      {
        id: 'BC104', rowNo: 40,
        childCode: 'CH-ETCH-HF', childName: '化学蚀刻液',
        spec: 'HF 5%混合液', freeDesc: '按炉次', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0005, calcUnit: 'L',
        issueType: '倒冲', issueMethod: 'BACKFLUSH', consumeOp: 'OP-30',
      },
    ],
  },
];
