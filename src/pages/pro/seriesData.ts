// ================================================================
// 产品系列 & 工艺路径档案数据层
// PRD §一（产品系列）+ §三（工艺路径档案）+ §五（版本管理）+ §六（变体路径）
// ================================================================

// ── 复用 proData 里的工序步骤 & 组定义（避免重复声明）────────────────
// 与 proData.ts 中的 RoutingOpStep / RoutingGroup 结构完全相同
export interface RMOpStep {
  id: string;
  opId: string;
  opCode: string;
  opName: string;
  opShort: string;
  workCenter: string;
  stdTimeMin: number;
  isKeyOp: boolean;
  isQcPoint: boolean;
  isReportPoint: boolean;
  remark?: string;
  phaseCount: number;
}

export interface RMGroup {
  id: string;
  seq: number;
  label?: string;
  steps: RMOpStep[];
}

// ── 产品系列状态 ────────────────────────────────────────────────────
export type SeriesStatus = 'active' | 'disabled';

// ── 产品系列 ────────────────────────────────────────────────────────
export interface ProductSeries {
  id: string;
  seriesCode: string;           // 如 RT-RKQ
  seriesName: string;           // 如 机用根管锉标准系列
  productFamily: string;        // 如 机用根管锉族
  defaultRoutingCode?: string;  // 最新默认版本编码
  status: SeriesStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 工艺路径档案状态（PRD §5.1版本状态机）──────────────────────────
// 草稿 → 审核 → 启用 → 停用 → 归档
// 反审核：审核 → 草稿
export type RMStatus = 'DRAFT' | 'AUDITED' | 'ENABLED' | 'DISABLED' | 'ARCHIVED';

// 绑定方式（标准=规格范围匹配；变体=强绑定物料 或 规格规则）
export type BindMode = 'RANGE' | 'MATERIAL';

// 变体类型
export type VariantType = 'STANDARD' | 'SPEC' | 'CUSTOMER' | 'EQUIP' | 'OTHER';

// 升版原因
export type UpgradeReason = '工艺优化' | '客户定制' | '法规变更' | '设备换代' | '其他';

// ── 版本历史条目 ─────────────────────────────────────────────────────
export interface VersionHistoryEntry {
  id: string;
  operationType: 'CREATE' | 'UPGRADE' | 'COPY' | 'AUDIT' | 'UNAUDIT' | 'ENABLE' | 'DISABLE' | 'ARCHIVE';
  fromVersion?: string;
  toVersion?: string;
  operator: string;
  operationTime: string;
  upgradeReason?: string;
  upgradeEcnNo?: string;
  effectiveDate?: string;
  remark?: string;
}

// ── 工艺路径档案主体 ─────────────────────────────────────────────────
export interface RoutingMaster {
  id: string;
  routingCode: string;         // 如 RT-RKQ-STD-001
  version: string;             // 如 V2.1
  routingName: string;
  seriesCode: string;          // 关联产品系列
  seriesName: string;          // 冗余，自动带出
  workshop?: string;
  productLine?: string;
  isDefault: boolean;
  specRangeExpr?: string;      // 如 diameter:#15~#40;taper:04锥~06锥;length:*
  status: RMStatus;
  // 变体路径字段
  variantType: VariantType;
  bindMode: BindMode;
  bindMaterialCodes?: string[];   // 强绑定物料编码列表
  sourceRoutingId?: string;       // 源路径 ID（变体指向标准路径）
  sourceRoutingCode?: string;     // 源路径编码（冗余）
  sourceBaseVersion?: string;     // 变体创建时所基于的源路径版本（如 V2.0）
  inheritSync?: boolean;          // 继承同步开关
  sourceNeedsSync?: boolean;      // 源路径升版后待同步标记
  syncNote?: string;              // 同步说明（触发同步时的变更摘要）
  // 升版字段
  upgradeReason?: string;
  upgradeEcnNo?: string;
  effectiveDate?: string;
  expireDate?: string;
  // 停用字段
  disableReason?: string;
  disableMode?: 'NORMAL' | 'FORCE';
  // 审核字段
  auditBy?: string;
  auditAt?: string;
  auditRemark?: string;
  // 工序统计（冗余展示）
  opCount: number;
  parallelGroupCount: number;
  totalTimeMin: number;
  // 工序步骤（实际配置数据，与 proData 的 groups 结构一致）
  groups: RMGroup[];
  // 历史版本
  history: VersionHistoryEntry[];
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── 状态配置 ────────────────────────────────────────────────────────
export const RM_STATUS_MAP: Record<RMStatus, {
  label: string; color: string; bg: string; border: string;
}> = {
  DRAFT:    { label: '草稿',     color: '#8C8C8C', bg: '#fafafa',  border: '#d9d9d9' },
  AUDITED:  { label: '已审核',   color: '#FA8C16', bg: '#fff7e6',  border: '#ffd591' },
  ENABLED:  { label: '已启用',   color: '#52C41A', bg: '#f6ffed',  border: '#b7eb8f' },
  DISABLED: { label: '已停用',   color: '#FF4D4F', bg: '#fff2f0',  border: '#ffccc7' },
  ARCHIVED: { label: '已归档',   color: '#BFBFBF', bg: '#f5f5f5',  border: '#e8e8e8' },
};

export const VARIANT_TYPE_MAP: Record<VariantType, { label: string; color: string }> = {
  STANDARD: { label: '标准',   color: '#1677FF' },
  SPEC:     { label: '规格变体', color: '#722ED1' },
  CUSTOMER: { label: '客户定制', color: '#FA8C16' },
  EQUIP:    { label: '设备适配', color: '#13C2C2' },
  OTHER:    { label: '其他',   color: '#8C8C8C' },
};

// ── 状态流转规则 ────────────────────────────────────────────────────
// 草稿：可编辑、可提审核、可删除
export const rmCanEdit      = (s: RMStatus) => s === 'DRAFT';
// 草稿 → 审核并自动启用（审核即生效）
export const rmCanAudit     = (s: RMStatus) => s === 'DRAFT';
// 已审核/已停用 → 草稿（反审核；停用时可直接反审核回草稿重新编辑）
export const rmCanUnaudit   = (s: RMStatus) => s === 'AUDITED' || s === 'DISABLED';
// 已审核 → 启用（保留，但审核时已自动启用，正常不单独触发）
export const rmCanEnable    = (s: RMStatus) => s === 'AUDITED';
// 启用 → 停用（停用）
export const rmCanDisable   = (s: RMStatus) => s === 'ENABLED';
// 停用 → 启用（重新启用）
export const rmCanReEnable  = (s: RMStatus) => s === 'DISABLED';
// 停用 → 归档
export const rmCanArchive   = (s: RMStatus) => s === 'DISABLED';
// 升版（审核/启用/停用均可发起升版，生成新草稿）
export const rmCanUpgrade   = (s: RMStatus) => s === 'AUDITED' || s === 'ENABLED' || s === 'DISABLED';
// 删除（仅草稿）
export const rmCanDelete    = (s: RMStatus) => s === 'DRAFT';
// 复制（任意状态）
export const rmCanCopy      = (_: RMStatus) => true;
// 兼容旧引用
export const rmCanActivate  = rmCanAudit;
export const rmCanSetDefault= (s: RMStatus) => s === 'ENABLED';

// ── 规格范围匹配引擎（前端模拟 PRD §四）──────────────────────────────
export interface SpecInput {
  diameter?: string;   // 如 "25"
  taper?: string;      // 如 "04锥"
  length?: string;     // 如 "25"
}

function parseNum(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
}

function matchRule(rule: string, value: string): boolean {
  const r = rule.trim();
  if (r === '*') return true;
  if (r.includes('~')) {
    const [lo, hi] = r.split('~').map(parseNum);
    const v = parseNum(value);
    return v >= lo && v <= hi;
  }
  if (r.includes('|')) {
    return r.split('|').some(opt => opt.trim() === value.trim());
  }
  return r === value.trim();
}

export function matchSpecRange(expr: string | undefined, spec: SpecInput): boolean {
  if (!expr) return true;
  const dims = expr.split(';');
  for (const dim of dims) {
    const [key, rule] = dim.split(':');
    if (!key || !rule) continue;
    const k = key.trim().toLowerCase();
    const v = k === 'diameter' ? (spec.diameter || '')
            : k === 'taper'    ? (spec.taper    || '')
            : k === 'length'   ? (spec.length   || '') : '';
    if (!matchRule(rule, v)) return false;
  }
  return true;
}

// ── Mock：产品系列数据（天美健保健品 GMP 制造）──────────────────────
export const mockProductSeries: ProductSeries[] = [
  {
    id: 'PS001',
    seriesCode: 'VitC-TAB',
    seriesName: '维生素C咀嚼片系列',
    productFamily: '维生素/矿物质族',
    defaultRoutingCode: 'RT-VitC-TAB-001',
    status: 'active',
    remark: '天美健核心SKU：VitC 1000mg×120片/瓶，全流程GMP电子批记录',
    createdAt: '2026-01-10',
    updatedAt: '2026-04-01',
  },
  {
    id: 'PS002',
    seriesCode: 'VitC-CAP',
    seriesName: '维生素C胶囊系列',
    productFamily: '维生素/矿物质族',
    defaultRoutingCode: undefined,
    status: 'active',
    remark: '胶囊剂型，工艺路径建立中',
    createdAt: '2026-02-01',
    updatedAt: '2026-04-10',
  },
  {
    id: 'PS003',
    seriesCode: 'PRO-CAP',
    seriesName: '益生菌胶囊系列',
    productFamily: '益生菌族',
    defaultRoutingCode: 'RT-PRO-CAP-001',
    status: 'active',
    remark: '冻干益生菌胶囊，需低温储运，特殊工艺管控',
    createdAt: '2026-03-01',
    updatedAt: '2026-03-15',
  },
  {
    id: 'PS004',
    seriesCode: 'COLLAGEN-GUMMY',
    seriesName: '胶原蛋白软糖系列',
    productFamily: '功能性食品族',
    defaultRoutingCode: undefined,
    status: 'disabled',
    remark: '已暂停开发，保留归档',
    createdAt: '2025-06-01',
    updatedAt: '2026-01-15',
  },
];

// ──────────────────────────────────────────────────────────────────────
// 保健品 GMP 生产工艺工序步骤（天美健维生素C咀嚼片）
// ──────────────────────────────────────────────────────────────────────

// ── 通用工序步骤（维生素C咀嚼片制造）──────────────────────────────────
const S_WEIGH:    RMOpStep = { id:'s-weigh',   opId:'op-001', opCode:'OP-10-WEIGH',   opName:'称量配料',     opShort:'称量',   workCenter:'WC-WEIGH-01',  stdTimeMin:30.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:5 };
const S_GRANULE:  RMOpStep = { id:'s-gran',    opId:'op-002', opCode:'OP-20-GRAN',    opName:'湿法制粒',     opShort:'制粒',   workCenter:'WC-GRAN-01',   stdTimeMin:90.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:6 };
const S_DRY:      RMOpStep = { id:'s-dry',     opId:'op-003', opCode:'OP-30-DRY',     opName:'流化床干燥',   opShort:'干燥',   workCenter:'WC-DRY-01',    stdTimeMin:60.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:4 };
const S_SIEVE:    RMOpStep = { id:'s-sieve',   opId:'op-004', opCode:'OP-40-SIEVE',   opName:'整粒过筛',     opShort:'整粒',   workCenter:'WC-SIEVE-01',  stdTimeMin:20.0, isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:3 };
const S_MIX:      RMOpStep = { id:'s-mix',     opId:'op-005', opCode:'OP-50-MIX',     opName:'总混',         opShort:'总混',   workCenter:'WC-MIX-01',    stdTimeMin:30.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:4 };
const S_PRESS:    RMOpStep = { id:'s-press',   opId:'op-006', opCode:'OP-60-PRESS',   opName:'压片',         opShort:'压片',   workCenter:'WC-PRESS-01',  stdTimeMin:120.0,isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:7 };
const S_COAT:     RMOpStep = { id:'s-coat',    opId:'op-007', opCode:'OP-70-COAT',    opName:'薄膜包衣',     opShort:'包衣',   workCenter:'WC-COAT-01',   stdTimeMin:90.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:5 };
const S_IQC:      RMOpStep = { id:'s-iqc',     opId:'op-008', opCode:'OP-80-IQC',     opName:'中间体检验',   opShort:'中检',   workCenter:'WC-QC-01',     stdTimeMin:45.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:4 };
const S_BOTTLE:   RMOpStep = { id:'s-bottle',  opId:'op-009', opCode:'OP-90-BOTTLE',  opName:'瓶装内包',     opShort:'瓶装',   workCenter:'WC-PACK-01',   stdTimeMin:60.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:6 };
const S_LABEL:    RMOpStep = { id:'s-label',   opId:'op-010', opCode:'OP-100-LABEL',  opName:'贴标',         opShort:'贴标',   workCenter:'WC-PACK-01',   stdTimeMin:30.0, isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:3 };
const S_CARTON:   RMOpStep = { id:'s-carton',  opId:'op-011', opCode:'OP-110-CARTON', opName:'装盒装箱',     opShort:'装箱',   workCenter:'WC-PACK-02',   stdTimeMin:30.0, isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:3 };
const S_FQC:      RMOpStep = { id:'s-fqc',     opId:'op-012', opCode:'OP-120-FQC',    opName:'成品检验(FQC)', opShort:'成检',  workCenter:'WC-QC-01',     stdTimeMin:60.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:5 };
const S_RELEASE:  RMOpStep = { id:'s-release', opId:'op-013', opCode:'OP-130-RELEASE',opName:'放行审核',     opShort:'放行',   workCenter:'WC-QA-01',     stdTimeMin:30.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:3 };

// ── 益生菌胶囊工序步骤 ──────────────────────────────────────────────
const S_PRO_THAW:  RMOpStep = { id:'ps-01', opId:'op-p01', opCode:'OP-P10-THAW',  opName:'菌粉解冻',   opShort:'解冻',  workCenter:'WC-COLD-01', stdTimeMin:240.0,isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:3 };
const S_PRO_BLEND: RMOpStep = { id:'ps-02', opId:'op-p02', opCode:'OP-P20-BLEND', opName:'菌粉混合',   opShort:'混合',  workCenter:'WC-MIX-02',  stdTimeMin:30.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:4 };
const S_PRO_FILL:  RMOpStep = { id:'ps-03', opId:'op-p03', opCode:'OP-P30-FILL',  opName:'胶囊充填',   opShort:'充填',  workCenter:'WC-CAP-01',  stdTimeMin:90.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:6 };
const S_PRO_SEAL:  RMOpStep = { id:'ps-04', opId:'op-p04', opCode:'OP-P40-SEAL',  opName:'铝箔泡罩封合', opShort:'封合', workCenter:'WC-PACK-03', stdTimeMin:60.0, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:5 };

// ── VitC 咀嚼片标准工艺路径工序组 ─────────────────────────────────────
// 并行组：薄膜包衣 & 中间体检验（同时进行）
const G_COAT_IQC: RMGroup = { id:'g-ci', seq:70, label:'薄膜包衣 & 中间体检验（并行）', steps:[
  { ...S_COAT, id:'s-coat-g' },
  { ...S_IQC,  id:'s-iqc-g'  },
]};

// 并行组：贴标 & FQC 并行（贴标完成等FQC）
const G_LABEL_FQC: RMGroup = { id:'g-lf', seq:110, label:'贴标 & 成品检验（并行）', steps:[
  { ...S_LABEL, id:'s-label-g' },
  { ...S_FQC,   id:'s-fqc-g'  },
]};

// VitC 标准工艺路径工序组（含2个并行组，共10道主工序）
const VITC_STD_GROUPS: RMGroup[] = [
  { id:'vg1',  seq:10,  steps:[{ ...S_WEIGH,   id:'vs1'  }] },  // 称量配料
  { id:'vg2',  seq:20,  steps:[{ ...S_GRANULE, id:'vs2'  }] },  // 湿法制粒
  { id:'vg3',  seq:30,  steps:[{ ...S_DRY,     id:'vs3'  }] },  // 流化床干燥
  { id:'vg4',  seq:40,  steps:[{ ...S_SIEVE,   id:'vs4'  }] },  // 整粒过筛
  { id:'vg5',  seq:50,  steps:[{ ...S_MIX,     id:'vs5'  }] },  // 总混
  { id:'vg6',  seq:60,  steps:[{ ...S_PRESS,   id:'vs6'  }] },  // 压片
  { ...G_COAT_IQC,       id:'vg7', seq:70 },                    // 包衣 & 中检（并行）
  { id:'vg8',  seq:90,  steps:[{ ...S_BOTTLE,  id:'vs8'  }] },  // 瓶装内包
  { ...G_LABEL_FQC,      id:'vg9', seq:110 },                   // 贴标 & 成检（并行）
  { id:'vg10', seq:130, steps:[{ ...S_CARTON,  id:'vs10' }] },  // 装盒装箱
  { id:'vg11', seq:140, steps:[{ ...S_RELEASE, id:'vs11' }] },  // 放行审核
];

// VitC 压片+直接内包路径（跳过薄膜包衣，适合直压成型工艺）
const VITC_DIRECT_GROUPS: RMGroup[] = [
  { id:'dg1', seq:10, steps:[{ ...S_WEIGH,   id:'ds1' }] },
  { id:'dg2', seq:20, steps:[{ ...S_MIX,     id:'ds2', opName:'直接混合', opShort:'混合' }] },
  { id:'dg3', seq:30, steps:[{ ...S_PRESS,   id:'ds3' }] },
  { id:'dg4', seq:40, steps:[{ ...S_IQC,     id:'ds4' }] },
  { id:'dg5', seq:50, steps:[{ ...S_BOTTLE,  id:'ds5' }] },
  { id:'dg6', seq:60, steps:[{ ...S_LABEL,   id:'ds6' }] },
  { id:'dg7', seq:70, steps:[{ ...S_CARTON,  id:'ds7' }] },
  { id:'dg8', seq:80, steps:[{ ...S_FQC,     id:'ds8' }] },
  { id:'dg9', seq:90, steps:[{ ...S_RELEASE, id:'ds9' }] },
];

// 益生菌胶囊工艺路径工序组
const PRO_CAP_GROUPS: RMGroup[] = [
  { id:'pg1', seq:10, steps:[{ ...S_PRO_THAW,  id:'pp1' }] },
  { id:'pg2', seq:20, steps:[{ ...S_PRO_BLEND, id:'pp2' }] },
  { id:'pg3', seq:30, steps:[{ ...S_PRO_FILL,  id:'pp3' }] },
  { id:'pg4', seq:40, steps:[{ ...S_IQC,       id:'pp4', opName:'胶囊中间体检验', opShort:'中检' }] },
  { id:'pg5', seq:50, steps:[{ ...S_PRO_SEAL,  id:'pp5' }] },
  { id:'pg6', seq:60, steps:[{ ...S_FQC,       id:'pp6' }] },
  { id:'pg7', seq:70, steps:[{ ...S_RELEASE,   id:'pp7' }] },
];

// ── Mock：工艺路径档案数据（天美健保健品 GMP）───────────────────────
export const mockRoutingMasters: RoutingMaster[] = [

  // ── VitC 咀嚼片标准工艺路径 V2.0（默认/启用）─────────────────────
  {
    id: 'RM001',
    routingCode: 'RT-VitC-TAB-001',
    version: 'V2.0',
    routingName: 'VitC咀嚼片标准工艺路径（湿法制粒）',
    seriesCode: 'VitC-TAB',
    seriesName: '维生素C咀嚼片系列',
    workshop: '固体制剂车间',
    productLine: '压片生产线A',
    isDefault: true,
    status: 'ENABLED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 11,
    parallelGroupCount: 2,
    totalTimeMin: 665.0,
    groups: VITC_STD_GROUPS,
    auditBy: '李QA总监',
    auditAt: '2026-01-20',
    auditRemark: '湿法制粒工艺参数已验证批（PV批次）确认，符合GB16740-2014',
    effectiveDate: '2026-01-21',
    remark: '天美健VitC咀嚼片核心工艺路径，含薄膜包衣，全流程EBR电子批记录',
    createdBy: '张工艺',
    createdAt: '2026-01-10',
    updatedAt: '2026-04-01',
    history: [
      {
        id: 'H001', operationType: 'CREATE', toVersion: 'V1.0',
        operator: '张工艺', operationTime: '2025-08-01 09:00:00',
        remark: '初始建立VitC咀嚼片工艺路径',
      },
      {
        id: 'H002', operationType: 'AUDIT', toVersion: 'V1.0',
        operator: '李QA总监', operationTime: '2025-09-01 14:00:00',
        remark: '审核通过，V1.0生效',
      },
      {
        id: 'H003', operationType: 'UPGRADE', fromVersion: 'V1.0', toVersion: 'V2.0',
        operator: '王工艺', operationTime: '2026-01-10 10:00:00',
        upgradeReason: '工艺优化', upgradeEcnNo: 'ECN-2026-001',
        effectiveDate: '2026-01-21',
        remark: '增加薄膜包衣工序及中间体检验并行组，改善产品稳定性',
      },
      {
        id: 'H004', operationType: 'AUDIT', toVersion: 'V2.0',
        operator: '李QA总监', operationTime: '2026-01-20 16:00:00',
        remark: '审核通过，V2.0生效并设为默认',
      },
    ],
  },

  // ── VitC 咀嚼片 V1.0（停用）──────────────────────────────────────
  {
    id: 'RM002',
    routingCode: 'RT-VitC-TAB-001',
    version: 'V1.0',
    routingName: 'VitC咀嚼片标准工艺路径（湿法制粒）',
    seriesCode: 'VitC-TAB',
    seriesName: '维生素C咀嚼片系列',
    workshop: '固体制剂车间',
    productLine: '压片生产线A',
    isDefault: false,
    status: 'DISABLED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 9,
    parallelGroupCount: 0,
    totalTimeMin: 515.0,
    groups: [
      { id:'r2g1', seq:10, steps:[{ ...S_WEIGH,   id:'r2s1' }] },
      { id:'r2g2', seq:20, steps:[{ ...S_GRANULE, id:'r2s2' }] },
      { id:'r2g3', seq:30, steps:[{ ...S_DRY,     id:'r2s3' }] },
      { id:'r2g4', seq:40, steps:[{ ...S_SIEVE,   id:'r2s4' }] },
      { id:'r2g5', seq:50, steps:[{ ...S_MIX,     id:'r2s5' }] },
      { id:'r2g6', seq:60, steps:[{ ...S_PRESS,   id:'r2s6' }] },
      { id:'r2g7', seq:70, steps:[{ ...S_BOTTLE,  id:'r2s7' }] },
      { id:'r2g8', seq:80, steps:[{ ...S_FQC,     id:'r2s8' }] },
      { id:'r2g9', seq:90, steps:[{ ...S_RELEASE, id:'r2s9' }] },
    ],
    expireDate: '2026-01-20',
    disableMode: 'NORMAL',
    disableReason: 'V2.0增加包衣工序后升版替代',
    remark: '初始版本，V2.0发布后停用',
    createdBy: '张工艺',
    createdAt: '2025-08-01',
    updatedAt: '2026-01-20',
    history: [],
  },

  // ── VitC 直压工艺路径（草稿）──────────────────────────────────────
  {
    id: 'RM003',
    routingCode: 'RT-VitC-TAB-002',
    version: 'V1.0',
    routingName: 'VitC咀嚼片直压工艺路径',
    seriesCode: 'VitC-TAB',
    seriesName: '维生素C咀嚼片系列',
    workshop: '固体制剂车间',
    productLine: '压片生产线B',
    isDefault: false,
    status: 'DRAFT',
    variantType: 'SPEC',
    bindMode: 'MATERIAL',
    bindMaterialCodes: ['FG-VitC-500-60'],
    sourceRoutingId: 'RM001',
    sourceRoutingCode: 'RT-VitC-TAB-001',
    inheritSync: false,
    sourceNeedsSync: false,
    opCount: 9,
    parallelGroupCount: 0,
    totalTimeMin: 365.0,
    groups: VITC_DIRECT_GROUPS,
    remark: '小规格500mg×60片直压工艺，跳过湿法制粒和薄膜包衣，适合试产',
    createdBy: '陈工艺',
    createdAt: '2026-03-01',
    updatedAt: '2026-04-15',
    history: [
      {
        id: 'H020', operationType: 'COPY', fromVersion: 'V2.0(RT-VitC-TAB-001)', toVersion: 'V1.0',
        operator: '陈工艺', operationTime: '2026-03-01 10:00:00',
        remark: '从标准路径复制新建，删除制粒/干燥/包衣工序',
      },
    ],
  },

  // ── 益生菌胶囊工艺路径 V1.0（启用）──────────────────────────────
  {
    id: 'RM004',
    routingCode: 'RT-PRO-CAP-001',
    version: 'V1.0',
    routingName: '益生菌胶囊工艺路径（冻干粉充填）',
    seriesCode: 'PRO-CAP',
    seriesName: '益生菌胶囊系列',
    workshop: '洁净充填车间',
    productLine: '胶囊充填线',
    isDefault: true,
    status: 'ENABLED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 7,
    parallelGroupCount: 0,
    totalTimeMin: 545.0,
    groups: PRO_CAP_GROUPS,
    auditBy: '李QA总监',
    auditAt: '2026-03-10',
    effectiveDate: '2026-03-11',
    remark: '益生菌冻干粉胶囊，需D级洁净区充填，低温（2~8℃）全程冷链管控',
    createdBy: '王工艺',
    createdAt: '2026-03-01',
    updatedAt: '2026-04-10',
    history: [
      {
        id: 'H010', operationType: 'CREATE', toVersion: 'V1.0',
        operator: '王工艺', operationTime: '2026-03-01 09:00:00',
        remark: '新建益生菌胶囊工艺路径',
      },
      {
        id: 'H011', operationType: 'AUDIT', toVersion: 'V1.0',
        operator: '李QA总监', operationTime: '2026-03-10 15:00:00',
        remark: '审核通过，冷链工序温度参数已验证',
      },
    ],
  },
];
