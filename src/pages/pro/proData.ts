// ================================================================
// 工艺路径数据层 v3.0
// 串行/并行支持：
//   ProcessRouting.groups = RoutingGroup[]（组间串行）
//   RoutingGroup.steps    = RoutingOpStep[]（组内并行）
//   单工序组 = 普通串行步骤；多工序组 = 并行泳道
// ================================================================

import { Operation } from '../operation/operationData';

export type RoutingStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'DISABLED' | 'OBSOLETE';

// ── 路径中每一个工序步骤（引用工序主数据 + 局部覆盖） ─────────────
export interface RoutingOpStep {
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

// ── 执行组：组内并行，组间串行 ────────────────────────────────────
export interface RoutingGroup {
  id: string;
  seq: number;          // 组顺序：10, 20, 30…
  label?: string;       // 可选标签，如"同步处理"
  steps: RoutingOpStep[];
  // 并行时组的总工时 = max(steps[].stdTimeMin)
  // 串行时 = steps[0].stdTimeMin
}

// ── 工艺路径主体 ────────────────────────────────────────────────────
export interface ProcessRouting {
  id: string;
  routingCode: string;
  routingName: string;
  productCode: string;
  productName: string;
  productModel: string;
  version: string;
  isDefault: boolean;
  status: RoutingStatus;
  auditBy?: string;
  auditAt?: string;
  auditRemark?: string;
  disableReason?: string;
  workshop?: string;
  productLine?: string;
  applicableSpec?: string;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  groups: RoutingGroup[];  // 替代原 steps[]
}

// ── 状态配置 ────────────────────────────────────────────────────────
export const ROUTING_STATUS_MAP: Record<RoutingStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:    { label: '草稿',   color: '#8C8C8C', bg: '#fafafa',  border: '#d9d9d9' },
  PENDING:  { label: '待审核', color: '#FA8C16', bg: '#fff7e6',  border: '#ffd591' },
  ACTIVE:   { label: '已生效', color: '#52C41A', bg: '#f6ffed',  border: '#b7eb8f' },
  DISABLED: { label: '已停用', color: '#FF4D4F', bg: '#fff2f0',  border: '#ffccc7' },
  OBSOLETE: { label: '已废止', color: '#BFBFBF', bg: '#f5f5f5',  border: '#e8e8e8' },
};

// ── 工具：计算路径总工时（串行组累加，并行组取 max）────────────────
export const calcTotalTime = (groups: RoutingGroup[]): number =>
  groups.reduce((sum, g) => {
    const groupTime = g.steps.length === 0 ? 0
      : g.steps.length === 1 ? g.steps[0].stdTimeMin
      : Math.max(...g.steps.map(s => s.stdTimeMin));
    return sum + groupTime;
  }, 0);

// ── 工具：统计所有步骤数 ────────────────────────────────────────────
export const countAllSteps = (groups: RoutingGroup[]): number =>
  groups.reduce((sum, g) => sum + g.steps.length, 0);

// ── 状态流转规则 ────────────────────────────────────────────────────
export const canAudit       = (s: RoutingStatus) => s === 'DRAFT' || s === 'PENDING';
export const canUnaudit     = (s: RoutingStatus) => s === 'PENDING';
export const canActivate    = (s: RoutingStatus) => s === 'PENDING';
export const canDisable     = (s: RoutingStatus) => s === 'ACTIVE';
export const canEnable      = (s: RoutingStatus) => s === 'DISABLED';
export const canObsolete    = (s: RoutingStatus) => s === 'ACTIVE' || s === 'DISABLED';
export const canEdit        = (s: RoutingStatus) => s === 'DRAFT' || s === 'DISABLED';
export const canDelete      = (s: RoutingStatus) => s === 'DRAFT';
export const canConfigSteps = (s: RoutingStatus) => s === 'DRAFT' || s === 'DISABLED';

// ── Mock 数据辅助 ────────────────────────────────────────────────────
const step = (
  id: string, opId: string, opCode: string, opName: string, opShort: string,
  workCenter: string, stdTimeMin: number,
  isKeyOp: boolean, isQcPoint: boolean, isReportPoint: boolean,
  phaseCount: number, remark?: string
): RoutingOpStep => ({
  id, opId, opCode, opName, opShort, workCenter, stdTimeMin,
  isKeyOp, isQcPoint, isReportPoint, phaseCount, remark,
});

const serialGroup = (id: string, seq: number, s: RoutingOpStep): RoutingGroup => ({
  id, seq, steps: [s],
});

const parallelGroup = (id: string, seq: number, label: string, steps: RoutingOpStep[]): RoutingGroup => ({
  id, seq, label, steps,
});

// ── Mock 工艺路径数据 ────────────────────────────────────────────────
export const mockRoutings: ProcessRouting[] = [

  // ── R001：机用根管锉标准路径 V2.1（已生效）
  //    串行：磨削 → [热处理 ‖ PVD涂层（并行）] → 激光打标 → 超声清洗 → 成品检验 → EO灭菌 → 包装
  {
    id: 'R001',
    routingCode: 'RT-RKQ-STD-001',
    routingName: '机用根管锉标准工艺路径',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productModel: '#25/04锥/25mm',
    version: 'V2.1',
    isDefault: true,
    status: 'ACTIVE',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    applicableSpec: '#15~#40 / 04锥~06锥 / 21mm~31mm',
    remark: '根管锉标准生产工艺路径，符合ISO 3630-1，全流程PAD电子化执行',
    auditBy: '王质量总监',
    auditAt: '2026-01-15',
    auditRemark: '工艺参数已验证，符合GMP要求，准予生效',
    createdBy: '陈工长',
    createdAt: '2026-01-10',
    updatedAt: '2026-04-01',
    groups: [
      serialGroup('G001', 10, step('S001', 'op-001', 'OP-CUT-001', '数控磨削', '磨削', 'WC-GRIND-01', 4.5, true, true, true, 8, '瓶颈工序，锥度/直径精度关键控制点')),
      parallelGroup('G002', 20, '同步热处理与涂层', [
        step('S002', 'op-002', 'OP-HT-001',   '热处理定型', '热处理', 'WC-HT-01',   3.0, true,  true,  true,  6, '记忆合金相变激活，每炉独立批次号'),
        step('S003', 'op-003', 'OP-COAT-001', 'PVD涂层',    '涂层',   'WC-COAT-01', 2.5, false, true,  true,  5, 'TiN/TiCN 0.5μm涂层'),
      ]),
      serialGroup('G003', 30, step('S004', 'op-004', 'OP-MARK-001', '激光打标', '打标', 'WC-LASER-01', 0.5, false, false, false, 4)),
      serialGroup('G004', 40, step('S005', 'op-005', 'OP-CLN-001',  '超声清洗', '清洗', 'WC-CLEAN-01', 1.5, false, true,  false, 5, '三段清洗')),
      serialGroup('G005', 50, step('S006', 'op-006', 'OP-QC-001',   '成品检验', '检验', 'WC-QC-01',    2.0, true,  true,  true,  7, 'OQC出厂终检，AQL抽样')),
      serialGroup('G006', 60, step('S007', 'op-007', 'OP-STER-001', 'EO灭菌',   '灭菌', 'WC-STER-01',  4.0, false, true,  true,  4)),
      serialGroup('G007', 70, step('S008', 'op-008', 'OP-PACK-001', '无菌包装', '包装', 'WC-PACK-01',  1.0, false, false, true,  5, '吸塑热封+UDI赋码')),
    ],
  },

  // ── R002：#30/06锥专用路径 V1.0（待审核）── 全串行
  {
    id: 'R002',
    routingCode: 'RT-RKQ-3006-002',
    routingName: '#30/06锥根管锉工艺路径',
    productCode: 'FG-RKQ-3006-21',
    productName: '机用根管锉',
    productModel: '#30/06锥/21mm',
    version: 'V1.0',
    isDefault: false,
    status: 'PENDING',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    applicableSpec: '#30 / 06锥度 / 21mm',
    remark: '基于标准路径，#30/06锥磨削参数调整，热处理温度提高5℃',
    createdBy: '李娜',
    createdAt: '2026-02-20',
    updatedAt: '2026-04-10',
    groups: [
      serialGroup('G101', 10, step('S101', 'op-001', 'OP-CUT-001', '数控磨削',   '磨削',   'WC-GRIND-01', 5.0, true,  true,  true,  8, '#30/06锥磨削参数：转速3200rpm')),
      serialGroup('G102', 20, step('S102', 'op-002', 'OP-HT-001',  '热处理定型', '热处理', 'WC-HT-01',    3.5, true,  true,  true,  6, '热处理温度较标准路径+5℃')),
      serialGroup('G103', 30, step('S103', 'op-003', 'OP-COAT-001','PVD涂层',    '涂层',   'WC-COAT-01',  2.5, false, true,  true,  5)),
      serialGroup('G104', 40, step('S104', 'op-005', 'OP-CLN-001', '超声清洗',   '清洗',   'WC-CLEAN-01', 1.5, false, true,  false, 5)),
      serialGroup('G105', 50, step('S105', 'op-006', 'OP-QC-001',  '成品检验',   '检验',   'WC-QC-01',    2.0, true,  true,  true,  7)),
      serialGroup('G106', 60, step('S106', 'op-007', 'OP-STER-001','EO灭菌',     '灭菌',   'WC-STER-01',  4.0, false, true,  true,  4)),
      serialGroup('G107', 70, step('S107', 'op-008', 'OP-PACK-001','无菌包装',   '包装',   'WC-PACK-01',  1.0, false, false, true,  5)),
    ],
  },

  // ── R005：机用根管锉 #26/04锥/25mm 标准工艺路径 V1.0（已生效）
  //    基于Excel《产品-机用根管锉》工艺路径定义，全串行14步
  //    工序：机床成型→清洗一→尾部修整→尖部修整→研磨一→热处理→清洗二
  //          →刻线→组装→环规适配→测量长度→装限位块→检测合格→半成品入库
  {
    id: 'R005',
    routingCode: 'RT-RKQ-STD-002',
    routingName: '机用根管锉标准工艺路径V2（#26/04锥）',
    productCode: 'FG-RKQ-2504-26',
    productName: '机用根管锉',
    productModel: '#26/04锥/25mm',
    version: 'V1.0',
    isDefault: true,
    status: 'ACTIVE',
    workshop: '精密加工车间',
    productLine: '根管锉B线',
    applicableSpec: '#26 / 04锥度 / 25mm',
    remark: '机用根管锉#26/04锥/25mm完整生产工艺路径，含机床成型、研磨、热处理、组装、检测全流程；符合ISO 3630-1，全流程PAD电子化执行',
    auditBy: '王质量总监',
    auditAt: '2026-04-01',
    auditRemark: '工艺路径参数已按Excel《产品-机用根管锉》规范核对，符合GMP要求，准予生效',
    createdBy: '陈工长',
    createdAt: '2026-03-15',
    updatedAt: '2026-04-20',
    groups: [
      serialGroup('G501', 10,  step('S501', 'op-011', 'OP-JC-001',   '机床成型',   '机床成型', 'WC-GRIND-01',  5.0, true,  true,  true,  8, '瓶颈工序：镍钛丝磨削成型，首件检验产品尺寸；含前清场+进站+物料一致确认(镍钛丝批号)+首件确认(产品尺寸)+数据采集+报工+出站')),
      serialGroup('G502', 20,  step('S502', 'op-012', 'OP-QX1-001',  '清洗一',     '清洗一',   'WC-CLEAN-01',  1.5, false, false, true,  6, '机床成型后超声波清洗；含前清场+进站+后清场+报工+出站；物料一致确认/首件确认/数据采集/自检均不适用(×)')),
      serialGroup('G503', 30,  step('S503', 'op-013', 'OP-WBX-001',  '尾部修整',   '尾修',     'WC-GRIND-01',  2.0, false, true,  true,  7, '修整产品尾部；首件确认检验长度及尾部外观；含前清场+进站+首件确认(长度/尾部外观)+后清场+报工+出站')),
      serialGroup('G504', 40,  step('S504', 'op-014', 'OP-JPX-001',  '尖部修整',   '尖修',     'WC-GRIND-01',  2.0, false, false, true,  6, '修整产品尖部；物料/首件/数据/自检均不适用(×)；含前清场+进站+后清场+报工+出站')),
      serialGroup('G505', 50,  step('S505', 'op-015', 'OP-YM1-001',  '研磨一',     '研磨一',   'WC-GRIND-01',  3.0, false, true,  true,  7, '工作部研磨成形；自检QC检验(尺寸+外观)，形成《机床成型检验记录》/《超声波清洗检验记录》，关联设备编号；含前清场+进站+自检+后清场+报工+出站')),
      serialGroup('G506', 60,  step('S506', 'op-016', 'OP-RCL-001',  '热处理',     '热处理',   'WC-HT-01',    120.0, true, true,  true,  8, '瓶颈工序：镍钛丝记忆合金相变激活热处理定型；热处理不体现在批记录中；含前清场+进站+后清场+报工+出站')),
      serialGroup('G507', 70,  step('S507', 'op-017', 'OP-QX2-001',  '清洗二',     '清洗二',   'WC-CLEAN-01',  1.5, false, true,  true,  7, '热处理后超声波清洗；QC进行自检(尺寸+外观)，形成《超声波清洗检验记录》，关联检测设备，此记录不体现在批记录中')),
      serialGroup('G508', 80,  step('S508', 'op-018', 'OP-KX-001',   '刻线',       '刻线',     'WC-GRIND-01',  2.0, false, false, true,  7, '工作部深度刻线标识；首件确认刻线尺寸和数量；含前清场+进站+首件确认(刻线尺寸/数量)+数据采集+后清场+报工+出站')),
      serialGroup('G509', 90,  step('S509', 'op-019', 'OP-ZZ-001',   '组装',       '组装',     'WC-ASM-01',    1.0, false, true,  true,  8, '锉针与手柄组装；物料一致确认(手柄批号)；首件确认(产品总长+手柄可靠性拉拔力测试，需记录检测设备)；含前清场+进站+物料一致确认+首件确认+数据采集+后清场+报工+出站')),
      serialGroup('G510', 100, step('S510', 'op-020', 'OP-HG-001',   '环规适配',   '环规',     'WC-RING-01',   2.5, false, true,  true,  6, '使用标准环规检验工作部锥度精度；物料/首件/数据/自检均不适用(×)；含前清场+进站+后清场+报工+出站')),
      serialGroup('G511', 110, step('S511', 'op-021', 'OP-CL-001',   '测量长度',   '测长',     'WC-QC-01',     1.5, false, true,  true,  6, '测量产品总长度；物料/首件/数据/自检均不适用(×)；含前清场+进站+后清场+报工+出站')),
      serialGroup('G512', 120, step('S512', 'op-022', 'OP-XWK-001',  '装限位块',   '限位块',   'WC-ASM-01',    0.5, false, false, true,  6, '安装橡胶限位块；物料一致确认(限位块批次号)；含前清场+进站+物料一致确认+后清场+报工+出站')),
      serialGroup('G513', 130, step('S513', 'op-023', 'OP-JCHE-001', '检测合格',   '检测合格', 'WC-QC-01',     3.0, true,  true,  false, 5, '瓶颈工序：QC半成品综合检验；AQL抽样；检验项：外观+尺寸+颜色标识；关联检测设备；前清场/进站/物料/首件/数据均不适用')),
      serialGroup('G514', 140, step('S514', 'op-024', 'OP-BCR-001',  '半成品入库', '半成品库', 'WC-STORE-01',  0.5, false, false, true,  4, '完成所有工序后由QC逐批次抽检，形成《半成品检验记录》；检验项：尺寸+颜色标识+外观+连接强度+抗扭强度+抗弯强度；前清场/进站/物料/首件/数据/后清场均不适用')),
    ],
  },

  // ── R003：简化路径（草稿，无步骤）
  {
    id: 'R003',
    routingCode: 'RT-RKQ-MINI-003',
    routingName: '根管锉简化工艺路径（试制）',
    productCode: 'FG-RKQ-4004-21',
    productName: '机用根管锉',
    productModel: '#40/04锥/21mm',
    version: 'V1.0',
    isDefault: false,
    status: 'DRAFT',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    remark: '试制品简化路径，不含灭菌步骤，仅用于内部测试',
    createdBy: '王工长',
    createdAt: '2026-03-01',
    updatedAt: '2026-04-15',
    groups: [],
  },

  // ── R004：旧版路径（已停用）
  {
    id: 'R004',
    routingCode: 'RT-RKQ-OLD-004',
    routingName: '机用根管锉旧版工艺路径',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productModel: '#25/04锥/25mm',
    version: 'V1.5',
    isDefault: false,
    status: 'DISABLED',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    remark: '旧版工艺，V2.1版本发布后停用',
    disableReason: 'V2.1版本已生效，本路径不再使用',
    auditBy: '王质量总监',
    auditAt: '2025-12-01',
    createdBy: '陈工长',
    createdAt: '2025-06-01',
    updatedAt: '2026-01-15',
    groups: [
      serialGroup('G401', 10, step('S401', 'op-001', 'OP-CUT-001', '数控磨削', '磨削', 'WC-GRIND-01', 5.0, true, true, true, 8)),
      serialGroup('G402', 20, step('S402', 'op-006', 'OP-QC-001',  '成品检验', '检验', 'WC-QC-01',    2.0, true, true, true, 7)),
    ],
  },
];
