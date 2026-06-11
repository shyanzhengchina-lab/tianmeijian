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

// ── Mock：产品系列数据 ──────────────────────────────────────────────
export const mockProductSeries: ProductSeries[] = [
  {
    id: 'PS001',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    productFamily: '机用根管锉族',
    defaultRoutingCode: 'RT-RKQ-STD-001',
    status: 'active',
    remark: '机用镍钛根管锉产品线，符合ISO 3630-1，全规格覆盖',
    createdAt: '2026-01-01',
    updatedAt: '2026-04-01',
  },
  {
    id: 'PS002',
    seriesCode: 'RT-RKQ-PRO',
    seriesName: '机用根管锉专业系列',
    productFamily: '机用根管锉族',
    defaultRoutingCode: 'RT-RKQ-PRO-001',
    status: 'active',
    remark: '专业版根管锉，增加激光微槽工序，切削性能更优',
    createdAt: '2026-02-01',
    updatedAt: '2026-04-10',
  },
  {
    id: 'PS003',
    seriesCode: 'RT-SRK',
    seriesName: '手用根管锉系列',
    productFamily: '手用根管锉族',
    defaultRoutingCode: undefined,
    status: 'active',
    remark: '手用不锈钢根管锉，标准工艺路径待建立',
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'PS004',
    seriesCode: 'RT-HEAT',
    seriesName: '热牙胶充填针系列',
    productFamily: '热牙胶充填针族',
    defaultRoutingCode: undefined,
    status: 'disabled',
    remark: '已停产，保留归档',
    createdAt: '2025-06-01',
    updatedAt: '2026-01-15',
  },
];

// ──────────────────────────────────────────────────────────────────────
// RT-RKQ-FG-001  机用根管锉全工序工艺路径（来源：产品-机用根管锉.xlsx）
// 16 道工序（含2道前端隐藏工序：热处理、清洗/清洗二）
// ──────────────────────────────────────────────────────────────────────

// 串行工序步骤（按Excel"根管锉工艺路径"sheet顺序）
const FG_S_GRIND:   RMOpStep = { id:'fg-s01', opId:'op-fg-01', opCode:'OP-10-GRIND',      opName:'机床成型',   opShort:'机床',   workCenter:'WC-GRIND-01',   stdTimeMin:5.0,  isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:8, remark:'前清/进站/物料/首件/数采/后清/报工/出站' };
const FG_S_WASH1:   RMOpStep = { id:'fg-s02', opId:'op-fg-02', opCode:'OP-20-WASH1',      opName:'清洗一',     opShort:'清洗一', workCenter:'WC-CLEAN-01',   stdTimeMin:1.5,  isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:4, remark:'前清/进站/后清/报工/出站' };
const FG_S_TAIL:    RMOpStep = { id:'fg-s03', opId:'op-fg-03', opCode:'OP-30-TAIL',       opName:'尾部修整',   opShort:'尾修',   workCenter:'WC-GRIND-01',   stdTimeMin:2.0,  isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:6, remark:'前清/进站/首件/后清/报工/出站；备注：手柄打码上色不体现' };
const FG_S_TIP:     RMOpStep = { id:'fg-s04', opId:'op-fg-04', opCode:'OP-40-TIP',        opName:'尖部修整',   opShort:'尖修',   workCenter:'WC-GRIND-01',   stdTimeMin:2.0,  isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:5, remark:'前清/进站/后清/报工/出站' };
const FG_S_GRIND1:  RMOpStep = { id:'fg-s05', opId:'op-fg-05', opCode:'OP-50-GRIND1',     opName:'研磨一',     opShort:'研磨一', workCenter:'WC-GRIND-01',   stdTimeMin:4.0,  isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:6, remark:'含QC自检，触发《机床成型检验记录》' };
const FG_S_INSPECT1:RMOpStep = { id:'fg-s06', opId:'op-fg-06', opCode:'OP-55-INSP1',      opName:'检验',       opShort:'检验',   workCenter:'WC-QC-01',      stdTimeMin:2.5,  isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:3, remark:'研磨一后QC检验' };
const FG_S_HEAT:    RMOpStep = { id:'fg-s07', opId:'op-fg-07', opCode:'OP-60-HEAT',       opName:'热处理',     opShort:'热处理', workCenter:'WC-HT-01',      stdTimeMin:3.0,  isKeyOp:true,  isQcPoint:false, isReportPoint:true,  phaseCount:4, remark:'前端不体现（别名：研磨二）' };
const FG_S_WASH2:   RMOpStep = { id:'fg-s08', opId:'op-fg-08', opCode:'OP-70-WASH2',      opName:'清洗/清洗二', opShort:'清洗二', workCenter:'WC-CLEAN-01',   stdTimeMin:1.5,  isKeyOp:false, isQcPoint:true,  isReportPoint:true,  phaseCount:5, remark:'前端不体现；QC自检触发《超声波清洗检验记录》' };
const FG_S_INSPECT2:RMOpStep = { id:'fg-s09', opId:'op-fg-09', opCode:'OP-80-INSP2',      opName:'检验',       opShort:'检验二', workCenter:'WC-QC-01',      stdTimeMin:2.5,  isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:3, remark:'清洗二后QC检验' };
const FG_S_LINE:    RMOpStep = { id:'fg-s10', opId:'op-fg-10', opCode:'OP-90-LINE',       opName:'刻线',       opShort:'刻线',   workCenter:'WC-GRIND-01',   stdTimeMin:2.0,  isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:5, remark:'前清/进站/首件（刻线尺寸数量）/后清/报工/出站' };
const FG_S_ASM:     RMOpStep = { id:'fg-s11', opId:'op-fg-11', opCode:'OP-100-ASM',       opName:'组装',       opShort:'组装',   workCenter:'WC-ASM-01',     stdTimeMin:3.5,  isKeyOp:true,  isQcPoint:false, isReportPoint:true,  phaseCount:6, remark:'含手柄物料核验（手柄批号）' };
const FG_S_RING:    RMOpStep = { id:'fg-s12', opId:'op-fg-12', opCode:'OP-110-RING',      opName:'环规适配',   opShort:'环规',   workCenter:'WC-QC-01',      stdTimeMin:1.5,  isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:4, remark:'前清/进站/后清/报工/出站' };
const FG_S_MEAS:    RMOpStep = { id:'fg-s13', opId:'op-fg-13', opCode:'OP-120-MEAS',      opName:'测量长度',   opShort:'量长',   workCenter:'WC-QC-01',      stdTimeMin:1.5,  isKeyOp:false, isQcPoint:true,  isReportPoint:true,  phaseCount:4, remark:'前清/进站/后清/报工/出站' };
const FG_S_LIMIT:   RMOpStep = { id:'fg-s14', opId:'op-fg-14', opCode:'OP-130-LIMIT',     opName:'装限位块',   opShort:'限位块', workCenter:'WC-ASM-01',     stdTimeMin:1.5,  isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:5, remark:'含限位块物料核验（限位块批号）' };
const FG_S_JCHE:    RMOpStep = { id:'fg-s15', opId:'op-fg-15', opCode:'OP-140-INSPECT2',  opName:'检测合格',   opShort:'检测',   workCenter:'WC-QC-01',      stdTimeMin:2.5,  isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:3, remark:'半成品入库前最终QC检验' };
const FG_S_STORE:   RMOpStep = { id:'fg-s16', opId:'op-fg-16', opCode:'OP-150-STORE',     opName:'半成品入库', opShort:'入库',   workCenter:'WC-WH-01',      stdTimeMin:1.0,  isKeyOp:false, isQcPoint:true,  isReportPoint:true,  phaseCount:3, remark:'现场QC抽检，形成《半成品检验记录》' };
// 并行工序（前端隐藏：手柄打码、上色）
const FG_S_CODE:    RMOpStep = { id:'fg-s17', opId:'op-fg-17', opCode:'OP-160-HANDLE',    opName:'手柄打码',   opShort:'打码',   workCenter:'WC-PACK-01',    stdTimeMin:1.5,  isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:5, remark:'含手柄物料核验（手柄批号）；前端不体现' };
const FG_S_COLOR:   RMOpStep = { id:'fg-s18', opId:'op-fg-18', opCode:'OP-170-COLOR',     opName:'上色',       opShort:'上色',   workCenter:'WC-PACK-01',    stdTimeMin:1.0,  isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:4, remark:'前端不体现' };

// 并行组：热处理（研磨二）+ 清洗/清洗二（前端均隐藏）
const FG_G_HT_WASH: RMGroup = {
  id: 'fg-g07', seq: 70, label: '热处理(研磨二) & 清洗/清洗二（并行，前端不体现）',
  steps: [FG_S_HEAT, FG_S_WASH2],
};

// 并行组：手柄打码 & 上色（前端不体现，在半成品入库后并行处理）
const FG_G_CODE_COLOR: RMGroup = {
  id: 'fg-g17', seq: 170, label: '手柄打码 & 上色（并行，前端不体现）',
  steps: [FG_S_CODE, FG_S_COLOR],
};

// RT-RKQ-FG-001 完整工序组（17道=15串行+2并行组）
const FG_GROUPS: RMGroup[] = [
  { id: 'fg-g01', seq:  10, steps: [FG_S_GRIND]    },  // 机床成型
  { id: 'fg-g02', seq:  20, steps: [FG_S_WASH1]    },  // 清洗一
  { id: 'fg-g03', seq:  30, steps: [FG_S_TAIL]     },  // 尾部修整
  { id: 'fg-g04', seq:  40, steps: [FG_S_TIP]      },  // 尖部修整
  { id: 'fg-g05', seq:  50, steps: [FG_S_GRIND1]   },  // 研磨一
  { id: 'fg-g06', seq:  60, steps: [FG_S_INSPECT1] },  // 检验（研磨一后）
  FG_G_HT_WASH,                                         // 热处理 & 清洗二（并行，隐藏）
  { id: 'fg-g09', seq:  80, steps: [FG_S_INSPECT2] },  // 检验（清洗二后）
  { id: 'fg-g10', seq:  90, steps: [FG_S_LINE]     },  // 刻线
  { id: 'fg-g11', seq: 100, steps: [FG_S_ASM]      },  // 组装
  { id: 'fg-g12', seq: 110, steps: [FG_S_RING]     },  // 环规适配
  { id: 'fg-g13', seq: 120, steps: [FG_S_MEAS]     },  // 测量长度
  { id: 'fg-g14', seq: 130, steps: [FG_S_LIMIT]    },  // 装限位块
  { id: 'fg-g15', seq: 140, steps: [FG_S_JCHE]     },  // 检测合格
  { id: 'fg-g16', seq: 150, steps: [FG_S_STORE]    },  // 半成品入库
  FG_G_CODE_COLOR,                                      // 手柄打码 & 上色（并行，隐藏）
];

// ── 公共工序步骤定义（供 mock 数据复用）──────────────────────────────
const S_GRIND:    RMOpStep = { id:'s-grind',   opId:'op-001', opCode:'OP-CUT-001',   opName:'数控磨削',       opShort:'磨削',   workCenter:'WC-GRIND-01',  stdTimeMin:4.5, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:5 };
const S_HT:       RMOpStep = { id:'s-ht',      opId:'op-002', opCode:'OP-HT-001',    opName:'热处理定型',     opShort:'热处理', workCenter:'WC-HT-01',     stdTimeMin:3.0, isKeyOp:true,  isQcPoint:false, isReportPoint:true,  phaseCount:4 };
const S_COAT:     RMOpStep = { id:'s-coat',    opId:'op-003', opCode:'OP-COAT-001',  opName:'表面涂层(PVD)',   opShort:'PVD涂层',workCenter:'WC-COAT-01',   stdTimeMin:2.0, isKeyOp:false, isQcPoint:false, isReportPoint:false, phaseCount:3 };
const S_LASER:    RMOpStep = { id:'s-laser',   opId:'op-004', opCode:'OP-LASER-001', opName:'激光打标(UDI)',   opShort:'打标',   workCenter:'WC-LASER-01',  stdTimeMin:1.0, isKeyOp:false, isQcPoint:false, isReportPoint:false, phaseCount:2 };
const S_CLEAN:    RMOpStep = { id:'s-clean',   opId:'op-005', opCode:'OP-USC-001',   opName:'超声波清洗',     opShort:'清洗',   workCenter:'WC-CLEAN-01',  stdTimeMin:1.5, isKeyOp:false, isQcPoint:false, isReportPoint:false, phaseCount:3 };
const S_FQC:      RMOpStep = { id:'s-fqc',     opId:'op-006', opCode:'OP-FINAL-001', opName:'成品检验(FQC)',   opShort:'成检',   workCenter:'WC-FQC-01',    stdTimeMin:2.5, isKeyOp:true,  isQcPoint:true,  isReportPoint:true,  phaseCount:4 };
const S_PACK1:    RMOpStep = { id:'s-pack1',   opId:'op-007', opCode:'OP-STER-001',  opName:'初包装+灭菌',    opShort:'初包装', workCenter:'WC-PACK-01',   stdTimeMin:1.5, isKeyOp:false, isQcPoint:false, isReportPoint:false, phaseCount:3 };
const S_PACK2:    RMOpStep = { id:'s-pack2',   opId:'op-008', opCode:'OP-FPACK-001', opName:'终包装/装箱',    opShort:'终包装', workCenter:'WC-PACK-02',   stdTimeMin:1.0, isKeyOp:false, isQcPoint:false, isReportPoint:true,  phaseCount:3 };

// PVD 涂层和激光打标并行执行
const G_COAT_LASER: RMGroup = { id:'g-cl', seq:30, label:'PVD涂层 & 激光打标（并行）', steps:[
  { ...S_COAT,  id:'s-coat-g'  },
  { ...S_LASER, id:'s-laser-g' },
]};

// RM001 的完整工序组（8道，含1个并行组）
const RM001_GROUPS: RMGroup[] = [
  { id:'g1', seq:10, steps:[{ ...S_GRIND, id:'sg1' }] },
  { id:'g2', seq:20, steps:[{ ...S_HT,    id:'sg2' }] },
  { ...G_COAT_LASER, id:'g3', seq:30 },
  { id:'g4', seq:40, steps:[{ ...S_CLEAN, id:'sg4' }] },
  { id:'g5', seq:50, steps:[{ ...S_FQC,   id:'sg5' }] },
  { id:'g6', seq:60, steps:[{ ...S_PACK1, id:'sg6' }] },
  { id:'g7', seq:70, steps:[{ ...S_PACK2, id:'sg7' }] },
];

// RM004 专业系列（9道，含2个并行组：涂层+打标 & 清洗+初检 并行）
const RM004_GROUPS: RMGroup[] = [
  { id:'p1', seq:10, steps:[{ ...S_GRIND, id:'pg1' }] },
  { id:'p2', seq:20, steps:[{ ...S_HT,    id:'pg2' }] },
  { id:'p3', seq:30, label:'涂层 & 激光打标（并行）', steps:[
    { ...S_COAT,  id:'pc1', opId:'op-003' },
    { ...S_LASER, id:'pc2', opId:'op-004' },
  ]},
  { id:'p4', seq:40, steps:[{ ...S_CLEAN, id:'pg4' }] },
  { id:'p5', seq:50, label:'清洗复检 & 半成品自检（并行）', steps:[
    { ...S_FQC, id:'pf1', opId:'op-006', opName:'半成品检验(IPQC)', opShort:'半检', stdTimeMin:1.5 },
    { ...S_CLEAN, id:'pf2', opId:'op-005', opName:'精密清洗复检', opShort:'精洗', stdTimeMin:2.0 },
  ]},
  { id:'p6', seq:60, steps:[{ ...S_FQC,   id:'pg6' }] },
  { id:'p7', seq:70, steps:[{ ...S_PACK1, id:'pg7' }] },
  { id:'p8', seq:80, steps:[{ ...S_PACK2, id:'pg8' }] },
];

// ── Mock：工艺路径档案数据 ──────────────────────────────────────────
export const mockRoutingMasters: RoutingMaster[] = [

  // ── 标准路径 V2.1（默认）─────────────────────────────────────────
  {
    id: 'RM001',
    routingCode: 'RT-RKQ-STD-001',
    version: 'V2.1',
    routingName: '机用根管锉标准工艺路径',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    isDefault: true,
    specRangeExpr: 'diameter:#15~#40;taper:04锥~06锥;length:*',
    status: 'ENABLED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 8,
    parallelGroupCount: 1,
    totalTimeMin: 17.0,
    groups: RM001_GROUPS,
    auditBy: '王质量总监',
    auditAt: '2026-01-15',
    auditRemark: '工艺参数已验证，符合GMP要求，准予生效',
    effectiveDate: '2026-01-16',
    remark: '根管锉标准生产工艺路径，符合ISO 3630-1，全流程PAD电子化执行',
    createdBy: '陈工长',
    createdAt: '2026-01-10',
    updatedAt: '2026-04-01',
    history: [
      {
        id: 'H001', operationType: 'CREATE', toVersion: 'V1.0',
        operator: '陈工长', operationTime: '2025-06-01 09:00:00',
        remark: '初始建立标准工艺路径',
      },
      {
        id: 'H002', operationType: 'AUDIT', toVersion: 'V1.0',
        operator: '王质量总监', operationTime: '2025-07-01 14:00:00',
        remark: '审核通过，首次生效',
      },
      {
        id: 'H003', operationType: 'UPGRADE', fromVersion: 'V1.0', toVersion: 'V2.0',
        operator: '李工艺', operationTime: '2025-10-15 10:30:00',
        upgradeReason: '工艺优化', upgradeEcnNo: 'ECN-2025-088',
        effectiveDate: '2025-11-01',
        remark: '增加PVD涂层并行工序，优化总工时',
      },
      {
        id: 'H004', operationType: 'UPGRADE', fromVersion: 'V2.0', toVersion: 'V2.1',
        operator: '张工艺', operationTime: '2026-01-10 08:00:00',
        upgradeReason: '法规变更', upgradeEcnNo: 'ECN-2026-012',
        effectiveDate: '2026-01-16',
        remark: '依据ISO 3630-1:2023修订，增加末件检验阶段',
      },
      {
        id: 'H005', operationType: 'AUDIT', toVersion: 'V2.1',
        operator: '王质量总监', operationTime: '2026-01-15 16:00:00',
        remark: '审核通过，V2.1生效并设为默认，V2.0自动失效',
      },
    ],
  },

  // ── 标准路径 V2.0（失效）─────────────────────────────────────────
  {
    id: 'RM002',
    routingCode: 'RT-RKQ-STD-001',
    version: 'V2.0',
    routingName: '机用根管锉标准工艺路径',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    isDefault: false,
    specRangeExpr: 'diameter:#15~#40;taper:04锥~06锥;length:*',
    status: 'DISABLED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 7,
    parallelGroupCount: 1,
    totalTimeMin: 15.5,
    groups: [
      { id:'r2g1', seq:10, steps:[{ ...S_GRIND, id:'r2s1' }] },
      { id:'r2g2', seq:20, steps:[{ ...S_HT,    id:'r2s2' }] },
      { id:'r2g3', seq:30, label:'涂层 & 打标（并行）', steps:[
        { ...S_COAT,  id:'r2c1' },
        { ...S_LASER, id:'r2l1' },
      ]},
      { id:'r2g4', seq:40, steps:[{ ...S_CLEAN, id:'r2s4' }] },
      { id:'r2g5', seq:50, steps:[{ ...S_FQC,   id:'r2s5' }] },
      { id:'r2g6', seq:60, steps:[{ ...S_PACK1, id:'r2s6' }] },
    ],
    auditBy: '王质量总监',
    auditAt: '2025-10-20',
    effectiveDate: '2025-11-01',
    expireDate: '2026-01-15',
    remark: 'V2.1发布后自动失效',
    createdBy: '李工艺',
    createdAt: '2025-10-15',
    updatedAt: '2026-01-15',
    history: [],
  },

  // ── 标准路径 V1.0（归档）─────────────────────────────────────────
  {
    id: 'RM003',
    routingCode: 'RT-RKQ-STD-001',
    version: 'V1.0',
    routingName: '机用根管锉标准工艺路径',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    isDefault: false,
    status: 'ARCHIVED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 6,
    parallelGroupCount: 0,
    totalTimeMin: 14.0,
    groups: [
      { id:'r3g1', seq:10, steps:[{ ...S_GRIND, id:'r3s1' }] },
      { id:'r3g2', seq:20, steps:[{ ...S_HT,    id:'r3s2' }] },
      { id:'r3g3', seq:30, steps:[{ ...S_COAT,  id:'r3s3' }] },
      { id:'r3g4', seq:40, steps:[{ ...S_CLEAN, id:'r3s4' }] },
      { id:'r3g5', seq:50, steps:[{ ...S_FQC,   id:'r3s5' }] },
      { id:'r3g6', seq:60, steps:[{ ...S_PACK2, id:'r3s6' }] },
    ],
    expireDate: '2025-10-31',
    remark: '初始版本，已归档',
    createdBy: '陈工长',
    createdAt: '2025-06-01',
    updatedAt: '2025-11-01',
    history: [],
  },

  // ── 专业系列路径 V1.0（生效）─────────────────────────────────────
  {
    id: 'RM004',
    routingCode: 'RT-RKQ-PRO-001',
    version: 'V1.0',
    routingName: '机用根管锉专业工艺路径',
    seriesCode: 'RT-RKQ-PRO',
    seriesName: '机用根管锉专业系列',
    workshop: '精密加工车间',
    productLine: '根管锉B线',
    isDefault: true,
    specRangeExpr: 'diameter:#15~#40;taper:04锥~08锥;length:*',
    status: 'ENABLED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 9,
    parallelGroupCount: 2,
    totalTimeMin: 21.0,
    groups: RM004_GROUPS,
    auditBy: '王质量总监',
    auditAt: '2026-02-10',
    effectiveDate: '2026-02-11',
    remark: '专业版增加激光微槽工序，双并行组',
    createdBy: '张工艺',
    createdAt: '2026-02-01',
    updatedAt: '2026-04-10',
    history: [
      {
        id: 'H010', operationType: 'CREATE', toVersion: 'V1.0',
        operator: '张工艺', operationTime: '2026-02-01 09:00:00',
      },
      {
        id: 'H011', operationType: 'AUDIT', toVersion: 'V1.0',
        operator: '王质量总监', operationTime: '2026-02-10 15:00:00',
      },
    ],
  },

  // ── 规格变体路径（草稿）─────────────────────────────────────────
  {
    id: 'RM005',
    routingCode: 'RT-RKQ-STD-001-C01',
    version: 'V1.0',
    routingName: '机用根管锉标准工艺路径-免涂层版',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    isDefault: false,
    status: 'DRAFT',
    variantType: 'SPEC',
    bindMode: 'MATERIAL',
    bindMaterialCodes: ['FG-RKQ-2506-25', 'FG-RKQ-4004-21'],
    sourceRoutingId: 'RM001',
    sourceRoutingCode: 'RT-RKQ-STD-001',
    inheritSync: true,
    sourceNeedsSync: false,
    opCount: 6,
    parallelGroupCount: 0,
    totalTimeMin: 11.0,
    groups: [
      { id:'r5g1', seq:10, steps:[{ ...S_GRIND, id:'r5s1' }] },
      { id:'r5g2', seq:20, steps:[{ ...S_HT,    id:'r5s2' }] },
      { id:'r5g3', seq:30, steps:[{ ...S_CLEAN, id:'r5s3' }] },
      { id:'r5g4', seq:40, steps:[{ ...S_FQC,   id:'r5s4' }] },
      { id:'r5g5', seq:50, steps:[{ ...S_PACK1, id:'r5s5' }] },
      { id:'r5g6', seq:60, steps:[{ ...S_PACK2, id:'r5s6' }] },
    ],
    remark: '#25/06锥及#40/04锥免涂层版，绑定具体物料',
    createdBy: '李娜',
    createdAt: '2026-03-01',
    updatedAt: '2026-04-15',
    history: [
      {
        id: 'H020', operationType: 'COPY', fromVersion: 'V2.1(RT-RKQ-STD-001)', toVersion: 'V1.0',
        operator: '李娜', operationTime: '2026-03-01 10:00:00',
        remark: '从标准路径复制新建，删除PVD涂层工序',
      },
    ],
  },

  // ── 客户定制路径（生效）─────────────────────────────────────────
  {
    id: 'RM006',
    routingCode: 'RT-RKQ-STD-001-CUS-A001',
    version: 'V1.0',
    routingName: '机用根管锉标准工艺路径-客户A定制版',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    isDefault: false,
    status: 'ENABLED',
    variantType: 'CUSTOMER',
    bindMode: 'MATERIAL',
    bindMaterialCodes: ['FG-RKQ-2504-25'],
    sourceRoutingId: 'RM001',
    sourceRoutingCode: 'RT-RKQ-STD-001',
    sourceBaseVersion: 'V2.0',   // 变体创建时基于 V2.0，源路径已升至 V2.1
    inheritSync: false,
    sourceNeedsSync: true,   // 源路径已升版至V2.1，提示同步
    syncNote: '源路径从V2.0升级至V2.1：①新增ISO 3630-1:2023最终检验阶段（成品检验工序新增3个检验字段）②磨削工序标准工时由4.0min调整为4.5min③PVD涂层工序新增环境温湿度记录要求',
    opCount: 8,
    parallelGroupCount: 1,
    totalTimeMin: 18.5,
    groups: [
      { id:'r6g1', seq:10, steps:[{ ...S_GRIND, id:'r6s1' }] },
      { id:'r6g2', seq:20, steps:[{ ...S_HT,    id:'r6s2' }] },
      { id:'r6g3', seq:30, label:'涂层 & 打标（并行）', steps:[
        { ...S_COAT,  id:'r6c1' },
        { ...S_LASER, id:'r6l1' },
      ]},
      { id:'r6g4', seq:40, steps:[{ ...S_CLEAN, id:'r6s4' }] },
      { id:'r6g5', seq:50, steps:[{ ...S_FQC,   id:'r6s5' }] },
      { id:'r6g6', seq:60, steps:[{ ...S_PACK1, id:'r6s6' }] },
      { id:'r6g7', seq:70, steps:[{ ...S_FQC,   id:'r6s7', opName:'客户包装专检', opShort:'客检', stdTimeMin:1.5 }] },
      { id:'r6g8', seq:80, steps:[{ ...S_PACK2, id:'r6s8' }] },
    ],
    auditBy: '王质量总监',
    auditAt: '2026-03-15',
    effectiveDate: '2026-03-20',
    remark: '客户A要求增加独立包装检验工序，基于标准路径定制',
    createdBy: '张销售',
    createdAt: '2026-03-10',
    updatedAt: '2026-04-01',
    history: [
      {
        id: 'H030', operationType: 'COPY', fromVersion: 'V2.1(RT-RKQ-STD-001)', toVersion: 'V1.0',
        operator: '张销售', operationTime: '2026-03-10 11:00:00',
      },
      {
        id: 'H031', operationType: 'AUDIT', toVersion: 'V1.0',
        operator: '王质量总监', operationTime: '2026-03-15 16:00:00',
      },
    ],
  },

  // ── RT-RKQ-FG-001：机用根管锉完整全工序工艺路径（基于Excel）─────────
  {
    id: 'RM008',
    routingCode: 'RT-RKQ-FG-001',
    version: 'V1.0',
    routingName: '机用根管锉全工序工艺路径（FG完整版）',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    isDefault: false,
    specRangeExpr: 'diameter:#15~#40;taper:04锥~06锥;length:21mm|25mm',
    status: 'ENABLED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    // 16工序（含并行组2个：热处理&清洗二 / 手柄打码&上色）
    opCount: 16,
    parallelGroupCount: 2,
    // 各工序标准工时合计（串行主路径）：5+1.5+2+2+4+2.5+3+1.5+2.5+2+3.5+1.5+1.5+1.5+2.5+1=37.5 min
    totalTimeMin: 37.5,
    groups: FG_GROUPS,
    auditBy: '王质量总监',
    auditAt: '2026-04-20',
    auditRemark: '依据产品-机用根管锉Excel工艺文件审核通过，16道全工序含阶段开关配置',
    effectiveDate: '2026-04-21',
    remark: '基于《产品-机用根管锉.xlsx》建立。含16道工序串并行完整工艺路径：机床成型→清洗一→尾部修整→尖部修整→研磨一→检验→热处理(并行)→清洗二(并行)→检验→刻线→组装→环规适配→测量长度→装限位块→检测合格→半成品入库；手柄打码&上色后端并行。每道工序已按Excel阶段开关（前清/进站/物料/首件/数采/自检/后清/报工/出站）精确配置。',
    createdBy: '系统导入',
    createdAt: '2026-04-27',
    updatedAt: '2026-04-27',
    history: [
      {
        id: 'FG-H001',
        operationType: 'CREATE',
        toVersion: 'V1.0',
        operator: '系统导入',
        operationTime: '2026-04-27 00:00:00',
        remark: '依据《产品-机用根管锉.xlsx》Excel工艺文件自动导入建立，16道工序全配置',
      },
      {
        id: 'FG-H002',
        operationType: 'AUDIT',
        toVersion: 'V1.0',
        operator: '王质量总监',
        operationTime: '2026-04-20 16:00:00',
        remark: '审核通过，正式生效。工序阶段配置已与Excel文件逐项核对',
      },
    ],
  },

  // ── 已停用路径（可反审核退回草稿）────────────────────────────────
  {
    id: 'RM009',
    routingCode: 'RT-RKQ-2504-001',
    version: 'V1.0',
    routingName: '#25/04锥根管锉工艺路径（旧版）',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    isDefault: false,
    specRangeExpr: 'diameter:#25~#25;taper:04锥~04锥;length:21mm|25mm',
    status: 'DISABLED',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 7,
    parallelGroupCount: 0,
    totalTimeMin: 17.0,
    groups: [
      { id:'r9g1', seq:10, steps:[{ ...S_GRIND, id:'r9s1', stdTimeMin:4.0, remark:'#25/04锥磨削参数' }] },
      { id:'r9g2', seq:20, steps:[{ ...S_HT,    id:'r9s2' }] },
      { id:'r9g3', seq:30, steps:[{ ...S_COAT,  id:'r9s3' }] },
      { id:'r9g4', seq:40, steps:[{ ...S_LASER, id:'r9s4' }] },
      { id:'r9g5', seq:50, steps:[{ ...S_CLEAN, id:'r9s5' }] },
      { id:'r9g6', seq:60, steps:[{ ...S_FQC,   id:'r9s6' }] },
      { id:'r9g7', seq:70, steps:[{ ...S_PACK2, id:'r9s7' }] },
    ],
    auditBy: '王质量总监',
    auditAt: '2026-04-20',
    auditRemark: '审核通过，自动生效',
    effectiveDate: '2026-04-20',
    disableMode: 'NORMAL',
    disableReason: '已有新版本替代，停用旧版',
    expireDate: '2026-04-27',
    remark: '#25/04锥旧版路径，已停用——可通过「反审核」退回草稿重新修改',
    createdBy: '李娜',
    createdAt: '2026-04-10',
    updatedAt: '2026-04-27',
    history: [
      {
        id: 'H050', operationType: 'CREATE', toVersion: 'V1.0',
        operator: '李娜', operationTime: '2026-04-10 09:00:00',
        remark: '新建工艺路径',
      },
      {
        id: 'H051', operationType: 'AUDIT', toVersion: 'V1.0',
        operator: '王质量总监', operationTime: '2026-04-20 15:30:00',
        remark: '审核通过',
      },
      {
        id: 'H052', operationType: 'ENABLE', toVersion: 'V1.0',
        operator: 'admin', operationTime: '2026-04-20 15:30:01',
        remark: '审核即生效，自动启用',
      },
      {
        id: 'H053', operationType: 'DISABLE', toVersion: 'V1.0',
        operator: 'admin', operationTime: '2026-04-27 10:00:00',
        remark: '已有新版本替代，停用旧版',
      },
    ],
  },

  // ── 草稿路径 ─────────────────────────────────────────────────
  {
    id: 'RM007',
    routingCode: 'RT-RKQ-3006-002',
    version: 'V1.0',
    routingName: '#30/06锥根管锉工艺路径',
    seriesCode: 'RT-RKQ',
    seriesName: '机用根管锉标准系列',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    isDefault: false,
    specRangeExpr: 'diameter:#30~#30;taper:06锥~06锥;length:21mm|25mm',
    status: 'DRAFT',
    variantType: 'STANDARD',
    bindMode: 'RANGE',
    opCount: 7,
    parallelGroupCount: 0,
    totalTimeMin: 19.5,
    groups: [
      { id:'r7g1', seq:10, steps:[{ ...S_GRIND, id:'r7s1', stdTimeMin:5.0, remark:'#30/06锥磨削参数调整，进给量减少10%' }] },
      { id:'r7g2', seq:20, steps:[{ ...S_HT,    id:'r7s2', stdTimeMin:3.5, remark:'热处理温度提高5℃至550℃' }] },
      { id:'r7g3', seq:30, steps:[{ ...S_COAT,  id:'r7s3' }] },
      { id:'r7g4', seq:40, steps:[{ ...S_LASER, id:'r7s4' }] },
      { id:'r7g5', seq:50, steps:[{ ...S_CLEAN, id:'r7s5' }] },
      { id:'r7g6', seq:60, steps:[{ ...S_FQC,   id:'r7s6' }] },
      { id:'r7g7', seq:70, steps:[{ ...S_PACK2, id:'r7s7' }] },
    ],
    remark: '基于标准路径，#30/06锥磨削参数调整，热处理温度提高5℃',
    createdBy: '李娜',
    createdAt: '2026-02-20',
    updatedAt: '2026-04-10',
    history: [
      {
        id: 'H040', operationType: 'CREATE', toVersion: 'V1.0',
        operator: '李娜', operationTime: '2026-02-20 09:30:00',
      },
    ],
  },
];
