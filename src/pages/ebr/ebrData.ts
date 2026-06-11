/**
 * 电子批记录（EBR — Electronic Batch Record）数据模型
 * 医疗器械MES V1.0 | 2026-04-28
 *
 * 真实数据源：
 *   - 生产管理：mockProductionOrders / mockWorkOrders / mockTaskOrders (workOrderData.ts)
 *   - 工序定义：ROUTING_STEPS / ROUTING_MASTERS (workOrderData.ts)
 *   - 设备：EQUIPMENTS / PAD_STATIONS (workOrderData.ts)
 *   - 人员：OPERATORS / TEAMS / SHIFTS (workOrderData.ts)
 *   - 质量检验：mockInspectionTasks / mockInstruments (qmsData.ts)
 *   - PAD执行：MOCK_WORK_ORDERS / VISIBLE_OPERATIONS (padExecutionData.ts)
 *   - 浮票：mockFloatTicketsV2 (workOrderData.ts)
 */

import type { OperationExecution, WorkOrder as PadWorkOrder } from '../pad/padExecutionData';
import { VISIBLE_OPERATIONS } from '../pad/padExecutionData';
import { isUserCleared } from '../../store/mesStore';

// ────────────────────────────────────────────────────────────────────
// 基础类型
// ────────────────────────────────────────────────────────────────────

export type EbrStatus =
  | 'IN_PROGRESS'   // 生产进行中
  | 'COMPLETED'     // 生产完成，待审核
  | 'REVIEWED'      // QA 已审核
  | 'APPROVED'      // 批准放行
  | 'REJECTED';     // 驳回

// 工艺路径工序（对应 workOrderData ROUTING_STEPS）
export interface EbrRoutingStep {
  seq: number;           // 工序序号 (10/15/20...)
  opNo: string;          // 工序编码 (OP-10)
  opName: string;        // 工序名称
  stage: string;         // 工艺段 (S1-备料)
  workCenter: string;
  isKeyOp: boolean;
  mandatoryInspection: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEVIATION' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  operatorId?: string;
  operatorName?: string;
  teamName?: string;
  equipId?: string;
  equipName?: string;
  padStation?: string;
  reportQty?: number;
  goodQty?: number;
  scrapQty?: number;
  deviationFlag?: boolean;
  deviationDesc?: string;
  keyData?: Record<string, string | number>;   // 关键工艺参数
  stagesSnapshot?: {                            // PAD阶段执行快照
    code: string;
    name: string;
    status: string;
    startTime?: string;
    endTime?: string;
    operator?: string;
  }[];
}

// 检验记录快照（对应 qmsData InspectionTask）
export interface EbrInspectionRecord {
  taskId: string;
  taskNo: string;
  schemeCode: string;
  schemeName: string;
  schemeType: string;   // IQC / IPQC_FIRST / IPQC_SELF / FQC / OQC / SPECIAL
  opNo?: string;        // 关联工序
  batchNo: string;
  totalQty: number;
  sampleQty: number;
  inspectorName?: string;
  checkerName?: string;
  instrumentName?: string;
  startTime?: string;
  completeTime?: string;
  conclusion?: 'PASS' | 'FAIL' | 'CONDITIONAL';
  releaseStatus: 'PENDING' | 'RELEASED' | 'REJECTED';
  disposition?: string;
  dispositionRemark?: string;
  failItems?: string[];
  items: {
    itemCode: string;
    itemName: string;
    category: string;
    standardValue?: string;
    unit?: string;
    actualValue?: string | number;
    result?: 'PASS' | 'FAIL' | 'PENDING';
    isCritical: boolean;
  }[];
}

// 生产浮票快照
export interface EbrFloatTicket {
  ticketNo: string;
  qty: number;
  status: string;
  currentOp?: string;
  currentStageName?: string;
  operatorName?: string;
  lastUpdateTime?: string;
  subBatchNo?: string;
}

// 偏差/异常记录
export interface EbrDeviation {
  id: string;
  opNo: string;
  opName: string;
  type: string;         // 工艺偏差/设备异常/物料异常/人员异常
  description: string;
  discoveredAt: string;
  discoveredBy: string;
  disposition: string;  // 处置措施
  closedAt?: string;
  closedBy?: string;
  impactQty?: number;
}

// 签名链
export interface EbrSignature {
  role: string;
  name: string;
  signedAt: string;
  remark?: string;
}

// 完整 EBR
export interface EbrRecord {
  id: string;
  ebrNo: string;
  status: EbrStatus;

  // ── 生产订单层 ─────────────────────────────────────────
  poId?: string;
  poNo?: string;
  soNo?: string;        // 关联销售订单
  routingCode: string;
  routingName: string;
  bomVersion: string;

  // ── 工单层 ─────────────────────────────────────────────
  woId: string;
  woNo: string;
  batchNo: string;
  productCode: string;
  productName: string;
  productSpec: string;
  planQty: number;
  customer?: string;
  deliveryDate?: string;
  priority: string;

  // ── 任务/浮票层 ────────────────────────────────────────
  tasks: {
    taskNo: string;
    workCenter: string;
    shiftName: string;
    team: string;
    operator: string;
    stationScope: string;
    padStation?: string;
    status: string;
    planStart: string;
    planEnd: string;
    actualStart?: string;
    actualEnd?: string;
    reportQty?: number;
    scrapQty?: number;
  }[];
  floatTickets: EbrFloatTicket[];

  // ── 物料层 ─────────────────────────────────────────────
  materialLotNo?: string;       // 原料批号
  materialSpec?: string;        // 镍钛丝规格
  handleLotNo?: string;
  limitLotNo?: string;
  iqcResult?: 'PASS' | 'FAIL' | 'PENDING';

  // ── 工序执行明细（按 ROUTING_STEPS 展开）──────────────
  routingSteps: EbrRoutingStep[];

  // ── 数量汇总 ───────────────────────────────────────────
  planQtyTotal: number;
  reportQtyTotal: number;
  goodQtyTotal: number;
  scrapQtyTotal: number;
  yieldRate: number;

  // ── 质量检验记录 ───────────────────────────────────────
  inspectionRecords: EbrInspectionRecord[];

  // ── 偏差记录 ───────────────────────────────────────────
  deviations: EbrDeviation[];

  // ── 签名链 ─────────────────────────────────────────────
  signatures: EbrSignature[];

  // ── 审核流 ─────────────────────────────────────────────
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;

  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemark?: string;
  approvedBy?: string;
  approvedAt?: string;
  approveRemark?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectReason?: string;
}

// ────────────────────────────────────────────────────────────────────
// PAD execMap → EBR 映射（生产中动态更新用）
// ────────────────────────────────────────────────────────────────────

function genEbrNo(): string {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const seq = Math.floor(Math.random() * 900) + 100;
  return `EBR-${ds}-${seq}`;
}

function genEbrId(): string {
  return `EBR_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
}

const STAGE_NAMES: Record<string, string> = {
  PRE_CLEAN:'前清场', CHECK_IN:'进站', MAT_VERIFY:'物料一致确认',
  FIRST_PIECE:'首件确认', DATA_COLLECT:'数据采集', SELF_CHECK:'自检',
  POST_CLEAN:'后清场', REPORT:'报工', CHECK_OUT:'出站',
};

export function buildEbrFromExecMap(
  wo: PadWorkOrder,
  execMap: Record<string, OperationExecution>,
): EbrRecord {
  const now = new Date().toLocaleString('zh-CN');
  let earliestIn: string | undefined;
  let latestOut:  string | undefined;
  let totalFinish = 0, totalGood = 0, totalBad = 0, totalScrap = 0;
  const signatures: EbrSignature[] = [];

  const routingSteps: EbrRoutingStep[] = [];
  for (const opDef of VISIBLE_OPERATIONS) {
    const exec = execMap[opDef.code];
    const enabledStages = opDef.stages.filter(s => s.enabled);
    const completedCount = exec
      ? Object.values(exec.stages).filter(s => s.status === 'completed').length
      : 0;

    const reportData = exec?.stages['REPORT']?.data as Record<string,unknown> | undefined;
    const fQty = exec?.finishQty ?? (reportData?.rpt_finish as number) ?? 0;
    const gQty = exec?.goodQty  ?? (reportData?.rpt_good   as number) ?? 0;
    const bQty = exec?.badQty   ?? (reportData?.rpt_bad    as number) ?? 0;
    const sQty = exec?.scrapQty ?? (reportData?.rpt_scrap  as number) ?? 0;

    if (exec?.inTime && (!earliestIn || exec.inTime < earliestIn)) earliestIn = exec.inTime;
    if (exec?.outTime && (!latestOut  || exec.outTime > latestOut))  latestOut  = exec.outTime;
    if (exec?.status === 'completed' || exec?.inTime) {
      totalFinish += fQty; totalGood += gQty; totalBad += bQty; totalScrap += sQty;
    }

    const checkOutData = exec?.stages['CHECK_OUT']?.data as Record<string,unknown> | undefined;
    if (checkOutData?.out_operator) {
      signatures.push({ role:'操作员', name: checkOutData.out_operator as string, signedAt: exec?.outTime ?? now });
    }

    const stagesSnapshot = exec
      ? Object.entries(exec.stages)
          .filter(([,s]) => s.status !== 'pending')
          .map(([code, s]) => ({
            code, name: STAGE_NAMES[code] ?? code,
            status: s.status, startTime: s.startTime, endTime: s.endTime, operator: s.operator,
          }))
      : [];

    routingSteps.push({
      seq: opDef.seq,
      opNo: opDef.code,
      opName: opDef.name,
      stage: opDef.workshop,
      workCenter: opDef.workshop,
      isKeyOp: opDef.hasQcInspection ?? false,
      mandatoryInspection: opDef.hasQcInspection ?? false,
      status: !exec ? 'PENDING' :
              exec.status === 'completed'  ? 'COMPLETED' :
              exec.status === 'abnormal'   ? 'DEVIATION' :
              exec.status === 'in_progress'? 'IN_PROGRESS' : 'PENDING',
      startedAt: exec?.inTime,
      completedAt: exec?.outTime,
      operatorName: reportData?.rpt_operator as string,
      equipId: reportData?.rpt_equip as string,
      equipName: reportData?.rpt_equip_name as string,
      reportQty: fQty || undefined,
      goodQty:   gQty || undefined,
      scrapQty:  sQty || undefined,
      deviationFlag: exec?.status === 'abnormal',
      stagesSnapshot,
      keyData: reportData?.rpt_params
        ? Object.fromEntries(
            (reportData.rpt_params as Array<{label:string;value:string;unit:string}>)
              .map(p => [p.label, `${p.value}${p.unit}`])
          )
        : undefined,
    });
  }

  const totalVisibleOps = VISIBLE_OPERATIONS.length;
  const completedOps = routingSteps.filter(r => r.status === 'COMPLETED').length;
  const ebrStatus: EbrStatus = completedOps >= totalVisibleOps ? 'COMPLETED' : 'IN_PROGRESS';
  const yieldRate = totalFinish > 0 ? Math.round((totalGood / totalFinish) * 10000) / 100 : 0;

  return {
    id: genEbrId(), ebrNo: genEbrNo(), status: ebrStatus,
    poId: undefined, poNo: undefined, soNo: undefined,
    routingCode: 'YS-RKQ-STD-V21', routingName: '机用根管锉标准工艺路径 V2.1', bomVersion: '2.1',
    woId: wo.id, woNo: wo.woNo, batchNo: wo.batchNo,
    productCode: 'FG-RKQ-2504-25',
    productName: wo.productName, productSpec: wo.productSpec,
    planQty: wo.planQty, customer: wo.customer, priority: wo.priority,
    tasks: [], floatTickets: [],
    materialLotNo: wo.materialLotNo, handleLotNo: wo.handleLotNo, limitLotNo: wo.limitLotNo,
    routingSteps,
    planQtyTotal: wo.planQty, reportQtyTotal: totalFinish, goodQtyTotal: totalGood,
    scrapQtyTotal: totalScrap, yieldRate,
    inspectionRecords: [], deviations: [],
    signatures,
    startTime: earliestIn ?? now,
    endTime: ebrStatus === 'COMPLETED' ? (latestOut ?? now) : undefined,
    createdAt: now, updatedAt: now,
  };
}

export function updateEbr(
  existing: EbrRecord,
  wo: PadWorkOrder,
  execMap: Record<string, OperationExecution>,
): EbrRecord {
  const updated = buildEbrFromExecMap(wo, execMap);
  return {
    ...updated,
    id: existing.id, ebrNo: existing.ebrNo, createdAt: existing.createdAt,
    reviewedBy: existing.reviewedBy, reviewedAt: existing.reviewedAt, reviewRemark: existing.reviewRemark,
    approvedBy: existing.approvedBy, approvedAt: existing.approvedAt, approveRemark: existing.approveRemark,
    rejectedBy: existing.rejectedBy, rejectedAt: existing.rejectedAt, rejectReason: existing.rejectReason,
    status: (['APPROVED','REJECTED'] as EbrStatus[]).includes(existing.status)
      ? existing.status : updated.status,
  };
}

// ────────────────────────────────────────────────────────────────────
// 基于真实 MES 数据的 Mock EBR 列表
// ────────────────────────────────────────────────────────────────────

/**
 * WO004 / WO-20260424-007 — #30/06锥度 — 已完成批次（全线16道工序完成，OQC通过，质量放行）
 * 数据来源：
 *   - 工单：WO004（COMPLETED，actualQty:4965，scrapQty:35）
 *   - 任务单：TK006（全线 S1~S9，周八 OP006，2026-04-24 完成）
 *   - 检验：IT006 成品终检（赵六+张伟，PASS）、IT008 OQC出货检验（PASS）
 *   - 设备：EQ001~EQ009
 */
const EBR_WO004: EbrRecord = {
  id: 'EBR_WO004',
  ebrNo: 'EBR-20260424-001',
  status: 'APPROVED',

  poId: 'PO002', poNo: 'MO-20260424-002', soNo: 'SO-20260419-071',
  routingCode: 'YS-RKQ-3006-V10',
  routingName: '机用根管锉 #30/06锥 工艺路径 V1.0',
  bomVersion: '2.0',

  woId: 'WO004', woNo: 'WO-20260424-007',
  batchNo: 'YS-RKQ-20260424-007',
  productCode: 'FG-RKQ-3006-21',
  productName: '机用根管锉',
  productSpec: '#30 / 06锥度 / 21mm',
  planQty: 5000,
  customer: undefined,
  deliveryDate: '2026-05-05',
  priority: 'NORMAL',

  tasks: [
    {
      taskNo: 'TK-20260424-007-C1',
      workCenter: '全线',
      shiftName: '早班',
      team: '丙班B组',
      operator: '周八（工号:OP006）',
      stationScope: '全工序 S1~S9',
      padStation: 'PAD-MJG-01',
      status: 'DONE',
      planStart: '2026-04-24 06:00', planEnd: '2026-04-24 18:00',
      actualStart: '2026-04-24 08:10', actualEnd: '2026-04-24 21:45',
      reportQty: 4965, scrapQty: 35,
    },
  ],
  floatTickets: [
    { ticketNo: 'FT-20260424-007-01', qty: 2500, status: 'ARCHIVED', currentOp: 'OP-95 成品入库', lastUpdateTime: '2026-04-24 21:45' },
    { ticketNo: 'FT-20260424-007-02', qty: 2500, status: 'ARCHIVED', currentOp: 'OP-95 成品入库', lastUpdateTime: '2026-04-24 21:45' },
  ],

  materialLotNo: 'NT-20260419-B',
  materialSpec: '镍钛丝 Ø0.3 HV300~380',
  iqcResult: 'PASS',

  routingSteps: [
    { seq:1,  opNo:'OP-10', opName:'镍钛丝入料确认',  stage:'S1-备料',     workCenter:'备料区',         isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 08:10', completedAt:'2026-04-24 08:30', operatorName:'周八（OP006）', reportQty:5000, goodQty:4998, scrapQty:2  },
    { seq:2,  opNo:'OP-15', opName:'切断',             stage:'S1-备料',     workCenter:'机加工-切断区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 08:30', completedAt:'2026-04-24 09:30', operatorName:'周八（OP006）', equipId:'EQ010', equipName:'切断机1号', reportQty:4998, goodQty:4995, scrapQty:3, keyData:{'刀具规格':'CUT-03','进给速度':'0.20mm/min'} },
    { seq:3,  opNo:'OP-20', opName:'粗磨锥',           stage:'S2-磨锥',     workCenter:'机加工-磨削区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 09:30', completedAt:'2026-04-24 10:45', operatorName:'周八（OP006）', equipId:'EQ001', equipName:'数控磨削机1号', reportQty:4995, goodQty:4990, scrapQty:5, keyData:{'主轴转速':'3800rpm','砂轮规格':'SA-002'} },
    { seq:4,  opNo:'OP-25', opName:'精磨锥/尖端成型',  stage:'S2-磨锥',     workCenter:'机加工-精磨区',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-24 10:45', completedAt:'2026-04-24 12:30', operatorName:'周八（OP006）', equipId:'EQ001', equipName:'数控磨削机1号', reportQty:4990, goodQty:4980, scrapQty:10, keyData:{'主轴转速':'4500rpm','进给速度':'0.12mm/min','砂轮规格':'SB-003'} },
    { seq:5,  opNo:'OP-30', opName:'螺纹滚压',         stage:'S3-螺纹',     workCenter:'机加工-螺纹区',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-24 12:30', completedAt:'2026-04-24 13:30', operatorName:'周八（OP006）', equipId:'EQ003', equipName:'螺纹滚压机1号', reportQty:4980, goodQty:4975, scrapQty:5, keyData:{'滚压压力':'12MPa','螺距':'0.22mm'} },
    { seq:6,  opNo:'OP-32', opName:'尾部修整',         stage:'S3-螺纹',     workCenter:'机加工-螺纹区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 13:30', completedAt:'2026-04-24 14:00', operatorName:'周八（OP006）', reportQty:4975, goodQty:4973, scrapQty:2 },
    { seq:7,  opNo:'OP-40', opName:'热处理',           stage:'S4-热处理',   workCenter:'热处理车间',     isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-24 14:00', completedAt:'2026-04-24 16:30', operatorName:'李四（OP002）', equipId:'EQ004', equipName:'热处理炉1号', reportQty:4973, goodQty:4970, scrapQty:3, keyData:{'升温速率':'6.0℃/min','保温温度':'500℃','保温时间':'12min','炉次号':'HT-20260424-F01'} },
    { seq:8,  opNo:'OP-42', opName:'化学蚀刻',         stage:'S4-热处理',   workCenter:'热处理-蚀刻区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 16:30', completedAt:'2026-04-24 17:00', operatorName:'李四（OP002）', reportQty:4970, goodQty:4969, scrapQty:1 },
    { seq:9,  opNo:'OP-60', opName:'ABS注塑柄',        stage:'S6-注塑柄',   workCenter:'注塑车间',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 17:00', completedAt:'2026-04-24 18:00', operatorName:'王五（OP003）', equipId:'EQ007', equipName:'注塑机1号', reportQty:4969, goodQty:4968, scrapQty:1, keyData:{'注塑温度':'220℃','注塑压力':'85MPa','模具批号':'MD-2026-001'} },
    { seq:10, opNo:'OP-70', opName:'柄部组装',         stage:'S7-组装清洗', workCenter:'组装车间',       isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-24 18:00', completedAt:'2026-04-24 19:00', operatorName:'王五（OP003）', reportQty:4968, goodQty:4966, scrapQty:2, keyData:{'扭矩':'3.5N·cm'} },
    { seq:11, opNo:'OP-72', opName:'超声清洗',         stage:'S7-组装清洗', workCenter:'清洗车间',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 19:00', completedAt:'2026-04-24 19:30', operatorName:'王五（OP003）', equipId:'EQ008', equipName:'超声波清洗机', reportQty:4966, goodQty:4965, scrapQty:1, keyData:{'清洗频率':'40kHz','清洗时间':'15min','清洗温度':'45℃'} },
    { seq:12, opNo:'OP-80', opName:'吸塑包装+UDI赋码', stage:'S8-包装',     workCenter:'包装车间',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 19:30', completedAt:'2026-04-24 20:30', operatorName:'赵六（OP004）', equipId:'EQ009', equipName:'UDI打码机1号', reportQty:4965, goodQty:4965, scrapQty:0, keyData:{'UDI批号':'UDI-2026-0424-007','包装规格':'6支/袋'} },
    { seq:13, opNo:'OP-82', opName:'装盒',             stage:'S8-包装',     workCenter:'包装车间',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 20:30', completedAt:'2026-04-24 21:00', operatorName:'赵六（OP004）', reportQty:4965, goodQty:4965, scrapQty:0 },
    { seq:14, opNo:'OP-90', opName:'OQC出厂终检',      stage:'S9-入库',     workCenter:'检验室',         isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-24 21:00', completedAt:'2026-04-24 21:30', operatorName:'韩志远（OP018）', reportQty:4965, goodQty:4965, scrapQty:0 },
    { seq:15, opNo:'OP-95', opName:'成品入库',         stage:'S9-入库',     workCenter:'成品仓库',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-24 21:30', completedAt:'2026-04-24 21:45', operatorName:'周八（OP006）', reportQty:4965, goodQty:4965, scrapQty:0 },
  ],

  planQtyTotal: 5000, reportQtyTotal: 4965, goodQtyTotal: 4965, scrapQtyTotal: 35,
  yieldRate: 99.30,

  inspectionRecords: [
    {
      taskId: 'IT-IQC-001', taskNo: 'IT-20260423-007',
      schemeCode: 'ISP-IQC-001', schemeName: '镍钛丝来料检验', schemeType: 'IQC',
      batchNo: 'NiTi-2604-002', totalQty: 3000, sampleQty: 20,
      inspectorName: '王五(QC001)', checkerName: '张伟(QC004)',
      startTime: '2026-04-23 08:30', completeTime: '2026-04-23 10:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'mat_spec', itemName:'材料规格', category:'DOCUMENT',  isCritical:true,  standardValue:'镍钛合金 ISO 15841', actualValue:'已确认', result:'PASS' },
        { itemCode:'dia_raw',  itemName:'原材直径', category:'SIZE',      isCritical:true,  standardValue:'0.300±0.005', unit:'mm', actualValue:0.298, result:'PASS' },
        { itemCode:'hardness', itemName:'硬度',     category:'PHYSICAL',  isCritical:true,  standardValue:'300~380', unit:'HV', actualValue:342, result:'PASS' },
        { itemCode:'surface',  itemName:'表面外观', category:'APPEARANCE',isCritical:false, actualValue:'合格', result:'PASS' },
        { itemCode:'cert',     itemName:'材质证书', category:'DOCUMENT',  isCritical:true,  actualValue:'已确认', result:'PASS' },
      ],
    },
    {
      taskId: 'IT-IPQC-025', taskNo: 'IT-20260424-002',
      schemeCode: 'ISP-IPQC-10', schemeName: '精磨锥首件检验', schemeType: 'IPQC_FIRST',
      opNo: 'OP-25', batchNo: 'YS-RKQ-20260424-007', totalQty: 4990, sampleQty: 1,
      inspectorName: '赵六(QC002)', instrumentName: '千分尺-001(DC-001)',
      startTime: '2026-04-24 10:50', completeTime: '2026-04-24 11:10',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'d1',        itemName:'外径D1',   category:'SIZE',      isCritical:true,  standardValue:'0.300±0.005', unit:'mm', actualValue:0.302, result:'PASS' },
        { itemCode:'taper',     itemName:'锥度',     category:'SIZE',      isCritical:true,  standardValue:'0.06', actualValue:'0.06', result:'PASS' },
        { itemCode:'thread',    itemName:'螺纹螺距', category:'SIZE',      isCritical:true,  standardValue:'按设计', unit:'mm', actualValue:0.22, result:'PASS' },
        { itemCode:'appearance',itemName:'外观',     category:'APPEARANCE',isCritical:false, actualValue:'合格', result:'PASS' },
      ],
    },
    {
      taskId: 'IT-SPEC-040', taskNo: 'IT-20260424-003',
      schemeCode: 'ISP-SPEC-60', schemeName: '热处理过程确认', schemeType: 'SPECIAL',
      opNo: 'OP-40', batchNo: 'YS-RKQ-20260424-007', totalQty: 4973, sampleQty: 4973,
      inspectorName: '李娜(QC003)', checkerName: '张伟(QC004)',
      startTime: '2026-04-24 14:05', completeTime: '2026-04-24 14:20',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'temp_rise', itemName:'升温速率', category:'PHYSICAL', isCritical:true, standardValue:'5.0~8.0', unit:'℃/min', actualValue:6.0, result:'PASS' },
        { itemCode:'hold_temp', itemName:'保温温度', category:'PHYSICAL', isCritical:true, standardValue:'480~520', unit:'℃', actualValue:500, result:'PASS' },
        { itemCode:'hold_time', itemName:'保温时间', category:'PHYSICAL', isCritical:true, standardValue:'10~15', unit:'min', actualValue:12, result:'PASS' },
        { itemCode:'temp_curve',itemName:'温度曲线审核', category:'DOCUMENT', isCritical:true, actualValue:'已确认', result:'PASS' },
        { itemCode:'qa_dual',   itemName:'QA双人复核', category:'DOCUMENT', isCritical:true, actualValue:'已确认', result:'PASS' },
      ],
    },
    {
      taskId: 'IT006', taskNo: 'IT-20260424-006',
      schemeCode: 'ISP-FQC-002', schemeName: '成品终检', schemeType: 'FQC',
      batchNo: 'YS-RKQ-20260424-007', totalQty: 4965, sampleQty: 50,
      inspectorName: '赵六(QC002)', checkerName: '张伟(QC004)',
      instrumentName: '千分尺-001(DC-001) / 投影仪-001(PJ-001)',
      startTime: '2026-04-24 09:30', completeTime: '2026-04-24 12:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'length',    itemName:'总长度L',     category:'SIZE',       isCritical:true,  standardValue:'21±0.5mm',  unit:'mm',  actualValue:21.0, result:'PASS' },
        { itemCode:'work_len',  itemName:'工作长度',    category:'SIZE',       isCritical:true,  standardValue:'16mm',      unit:'mm',  actualValue:'16mm', result:'PASS' },
        { itemCode:'d0',        itemName:'尖端直径D0',  category:'SIZE',       isCritical:true,  standardValue:'0.300±0.005',unit:'mm', actualValue:0.301, result:'PASS' },
        { itemCode:'taper',     itemName:'锥度',        category:'SIZE',       isCritical:true,  standardValue:'0.06',      actualValue:'0.06', result:'PASS' },
        { itemCode:'roundness', itemName:'圆度',        category:'SIZE',       isCritical:false, standardValue:'≤0.005',    unit:'mm',  actualValue:0.003, result:'PASS' },
        { itemCode:'ra',        itemName:'表面粗糙度',  category:'SIZE',       isCritical:true,  standardValue:'≤0.8',      unit:'μm',  actualValue:0.62, result:'PASS' },
        { itemCode:'torque',    itemName:'扭转强度',    category:'PERFORMANCE',isCritical:true,  standardValue:'≥标准值',   unit:'N·cm',actualValue:19.2, result:'PASS' },
        { itemCode:'flex',      itemName:'抗弯强度',    category:'PERFORMANCE',isCritical:true,  standardValue:'≥标准值',   unit:'N',   actualValue:45.1, result:'PASS' },
        { itemCode:'appearance',itemName:'外观',        category:'APPEARANCE', isCritical:true,  actualValue:'合格', result:'PASS' },
      ],
    },
    {
      taskId: 'IT008', taskNo: 'IT-20260426-008',
      schemeCode: 'ISP-OQC-001', schemeName: '出货检验(OQC)', schemeType: 'OQC',
      batchNo: 'YS-RKQ-20260424-007', totalQty: 4965, sampleQty: 13,
      inspectorName: '王五(QC001)', checkerName: '周敏(QC005)',
      startTime: '2026-04-26 09:00', completeTime: '2026-04-26 10:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'udi',          itemName:'外箱UDI校验',     category:'DOCUMENT',    isCritical:true,  actualValue:'已校验', result:'PASS' },
        { itemCode:'pkg_intact',   itemName:'包装完整性',       category:'PERFORMANCE', isCritical:true,  actualValue:'合格',   result:'PASS' },
        { itemCode:'sterile_batch',itemName:'灭菌批号一致性',   category:'DOCUMENT',    isCritical:true,  actualValue:'已确认', result:'PASS' },
        { itemCode:'exp_date',     itemName:'有效期计算',       category:'DOCUMENT',    isCritical:true,  actualValue:'已确认', result:'PASS' },
        { itemCode:'qty_check',    itemName:'出货数量核对',     category:'DOCUMENT',    isCritical:false, actualValue:'4965支', result:'PASS' },
      ],
    },
  ],

  deviations: [],

  signatures: [
    { role:'操作员（全线）', name:'周八（OP006）',  signedAt:'2026-04-24 21:45' },
    { role:'热处理操作员',   name:'李四（OP002）',  signedAt:'2026-04-24 16:30' },
    { role:'QC检验员',       name:'赵六（QC002）',  signedAt:'2026-04-24 12:00' },
    { role:'QA主管',         name:'张伟（QC004）',  signedAt:'2026-04-24 17:00' },
    { role:'QA审核',         name:'王质检（QC001）',signedAt:'2026-04-26 10:30' },
    { role:'批准放行',       name:'周敏（QC005）',  signedAt:'2026-04-26 11:00' },
  ],

  startTime: '2026-04-24 08:10',
  endTime:   '2026-04-24 21:45',
  createdAt: '2026-04-24 08:10',
  updatedAt: '2026-04-26 11:00',

  reviewedBy: '王质检（QC001）', reviewedAt: '2026-04-26 10:30',
  reviewRemark: '批次记录完整，所有关键工序均有操作员签名；热处理工艺参数符合规范；成品终检及OQC均合格；量具校准有效期内。批准通过。',
  approvedBy: '周敏（QC005，QA经理）', approvedAt: '2026-04-26 11:00',
  approveRemark: '产品质量符合 ISO 13485 及 YY0015 标准要求，批准放行。',
};

/**
 * WO001 / WO-20260425-001 — #25/04锥度 — 生产进行中（S5涂层段完成62%）
 * 数据来源：WO001(IN_PROGRESS,actualQty:3200)，TK001(机加工,IN_PROGRESS)，TK002(热处理/涂层,IN_PROGRESS)
 * 包含偏差：热处理过程保温温度超标，复验中
 */
const EBR_WO001: EbrRecord = {
  id: 'EBR_WO001',
  ebrNo: 'EBR-20260425-001',
  status: 'IN_PROGRESS',

  poId: 'PO001', poNo: 'MO-20260425-001', soNo: 'SO-20260420-088',
  routingCode: 'YS-RKQ-STD-V21',
  routingName: '机用根管锉标准工艺路径 V2.1',
  bomVersion: '2.1',

  woId: 'WO001', woNo: 'WO-20260425-001',
  batchNo: 'YS-RKQ-20260425-001',
  productCode: 'FG-RKQ-2504-25',
  productName: '机用根管锉',
  productSpec: '#25 / 04锥度 / 25mm',
  planQty: 5000,
  customer: '日本ABC牙科集团（出口）',
  deliveryDate: '2026-05-10',
  priority: 'HIGH',

  tasks: [
    {
      taskNo: 'TK-20260425-001-A1',
      workCenter: '机加工车间',
      shiftName: '白班',
      team: '甲班A组',
      operator: '张三（工号:OP001）',
      stationScope: 'S1备料(OP-10,OP-15) → S2磨锥(OP-20,OP-25) → S3螺纹(OP-30,OP-32)',
      padStation: 'PAD-MJG-01',
      status: 'IN_PROGRESS',
      planStart: '2026-04-25 08:00', planEnd: '2026-04-25 20:00',
      actualStart: '2026-04-25 08:45',
      reportQty: 3200, scrapQty: 58,
    },
    {
      taskNo: 'TK-20260425-001-A2',
      workCenter: '热处理车间 / 涂层车间',
      shiftName: '白班',
      team: '甲班B组',
      operator: '李四（工号:OP002）',
      stationScope: 'S4热处理(OP-40,OP-42) → S5涂层(OP-50)',
      padStation: 'PAD-HCL-01',
      status: 'IN_PROGRESS',
      planStart: '2026-04-25 08:00', planEnd: '2026-04-25 20:00',
      actualStart: '2026-04-25 13:35',
      reportQty: 3200, scrapQty: 27,
    },
    {
      taskNo: 'TK-20260425-001-B1',
      workCenter: '注塑车间 / 组装车间 / 清洗车间',
      shiftName: '夜班',
      team: '乙班A组',
      operator: '王五（工号:OP003）',
      stationScope: 'S6注塑柄(OP-60) → S7组装清洗(OP-70,OP-72)',
      padStation: 'PAD-ZS-01',
      status: 'PENDING',
      planStart: '2026-04-25 20:00', planEnd: '2026-04-26 08:00',
    },
    {
      taskNo: 'TK-20260425-001-B2',
      workCenter: '包装车间 / 检验室 / 成品仓库',
      shiftName: '夜班',
      team: '乙班B组',
      operator: '赵六（工号:OP004）',
      stationScope: 'S8包装UDI(OP-80,OP-82) → S9终检入库(OP-90,OP-95)',
      padStation: 'PAD-BZ-01',
      status: 'PENDING',
      planStart: '2026-04-26 08:00', planEnd: '2026-04-26 20:00',
    },
  ],
  floatTickets: [
    { ticketNo:'FT-20260425-001-01', qty:1000, status:'IN_USE', currentOp:'OP-30 螺纹滚压', currentStageName:'S3-螺纹', operatorName:'张三', lastUpdateTime:'2026-04-25 11:20' },
    { ticketNo:'FT-20260425-001-02', qty:1000, status:'IN_USE', currentOp:'OP-25 精磨锥/尖端成型', currentStageName:'S2-磨锥', operatorName:'张三', lastUpdateTime:'2026-04-25 10:50' },
    { ticketNo:'FT-20260425-001-03', qty:1200, status:'IN_USE', currentOp:'OP-50 PVD氮化钛涂层', currentStageName:'S5-涂层', operatorName:'李四', lastUpdateTime:'2026-04-25 16:30', subBatchNo:'HT-20260425-F03' },
    { ticketNo:'FT-20260425-001-04', qty:800,  status:'RETURNED', lastUpdateTime:'2026-04-25 12:00' },
  ],

  materialLotNo: 'NT-20260420-A',
  materialSpec: '镍钛合金丝 Ø0.3 HV310~370 (ASTM F2063)',
  handleLotNo: 'HD-20260425-B（ABS柄批号）',
  iqcResult: 'PASS',

  routingSteps: [
    { seq:1,  opNo:'OP-10', opName:'镍钛丝入料确认',  stage:'S1-备料',     workCenter:'备料区',         isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-25 08:45', completedAt:'2026-04-25 09:00', operatorName:'张三（OP001）', reportQty:5000, goodQty:5000, scrapQty:0 },
    { seq:2,  opNo:'OP-15', opName:'切断',             stage:'S1-备料',     workCenter:'机加工-切断区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-25 09:00', completedAt:'2026-04-25 10:00', operatorName:'张三（OP001）', equipId:'EQ010', equipName:'切断机1号', reportQty:5000, goodQty:4996, scrapQty:4, keyData:{'刀具规格':'CUT-02','进给速度':'0.18mm/min'} },
    { seq:3,  opNo:'OP-20', opName:'粗磨锥',           stage:'S2-磨锥',     workCenter:'机加工-磨削区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-25 10:00', completedAt:'2026-04-25 11:20', operatorName:'张三（OP001）', equipId:'EQ002', equipName:'数控磨削机2号', reportQty:4996, goodQty:4990, scrapQty:6, keyData:{'主轴转速':'4000rpm','砂轮规格':'SA-001'} },
    { seq:4,  opNo:'OP-25', opName:'精磨锥/尖端成型',  stage:'S2-磨锥',     workCenter:'机加工-精磨区',  isKeyOp:true,  mandatoryInspection:true,  status:'IN_PROGRESS', startedAt:'2026-04-25 11:20', operatorName:'张三（OP001）', equipId:'EQ002', equipName:'数控磨削机2号', reportQty:2200, goodQty:2188, scrapQty:12, keyData:{'主轴转速':'4200rpm','进给速度':'0.15mm/min','砂轮规格':'SB-002'} },
    { seq:5,  opNo:'OP-30', opName:'螺纹滚压',         stage:'S3-螺纹',     workCenter:'机加工-螺纹区',  isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:6,  opNo:'OP-32', opName:'尾部修整',         stage:'S3-螺纹',     workCenter:'机加工-螺纹区',  isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:7,  opNo:'OP-40', opName:'热处理',           stage:'S4-热处理',   workCenter:'热处理车间',     isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:8,  opNo:'OP-42', opName:'化学蚀刻',         stage:'S4-热处理',   workCenter:'热处理-蚀刻区',  isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:9,  opNo:'OP-50', opName:'PVD氮化钛涂层',   stage:'S5-涂层',     workCenter:'涂层车间',       isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:10, opNo:'OP-60', opName:'ABS注塑柄',        stage:'S6-注塑柄',   workCenter:'注塑车间',       isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:11, opNo:'OP-70', opName:'柄部组装',         stage:'S7-组装清洗', workCenter:'组装车间',       isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:12, opNo:'OP-72', opName:'超声清洗',         stage:'S7-组装清洗', workCenter:'清洗车间',       isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:13, opNo:'OP-80', opName:'吸塑包装+UDI赋码', stage:'S8-包装',     workCenter:'包装车间',       isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:14, opNo:'OP-82', opName:'装盒',             stage:'S8-包装',     workCenter:'包装车间',       isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:15, opNo:'OP-90', opName:'OQC出厂终检',      stage:'S9-入库',     workCenter:'检验室',         isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:16, opNo:'OP-95', opName:'成品入库',         stage:'S9-入库',     workCenter:'成品仓库',       isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
  ],

  planQtyTotal: 5000, reportQtyTotal: 3200, goodQtyTotal: 3115, scrapQtyTotal: 85,
  yieldRate: 97.34,

  inspectionRecords: [
    {
      taskId: 'IT001', taskNo: 'IT-20260426-001',
      schemeCode: 'ISP-IQC-001', schemeName: '镍钛丝来料检验', schemeType: 'IQC',
      batchNo: 'NiTi-2604-001', totalQty: 5000, sampleQty: 32,
      inspectorName: '王五(QC001)',
      startTime: '2026-04-26 08:00',
      conclusion: undefined, releaseStatus: 'PENDING',
      items: [
        { itemCode:'mat_spec', itemName:'材料规格', category:'DOCUMENT',  isCritical:true,  standardValue:'镍钛合金 ISO 15841', result:'PENDING' },
        { itemCode:'dia_raw',  itemName:'原材直径', category:'SIZE',      isCritical:true,  standardValue:'0.300±0.005', unit:'mm', result:'PENDING' },
        { itemCode:'hardness', itemName:'硬度',     category:'PHYSICAL',  isCritical:true,  standardValue:'300~380', unit:'HV', result:'PENDING' },
        { itemCode:'surface',  itemName:'表面外观', category:'APPEARANCE',isCritical:false, result:'PENDING' },
        { itemCode:'cert',     itemName:'材质证书', category:'DOCUMENT',  isCritical:true,  result:'PENDING' },
      ],
    },
    {
      taskId: 'IT002', taskNo: 'IT-20260426-002',
      schemeCode: 'ISP-IPQC-10', schemeName: '机床成型首件检验', schemeType: 'IPQC_FIRST',
      opNo: 'OP-25', batchNo: 'YS-RKQ-20260425-001', totalQty: 4996, sampleQty: 1,
      inspectorName: '王五(QC001)',
      startTime: '2026-04-26 09:15',
      conclusion: undefined, releaseStatus: 'PENDING',
      items: [
        { itemCode:'d1',        itemName:'外径D1',   category:'SIZE',      isCritical:true,  standardValue:'0.250±0.005', unit:'mm', result:'PENDING' },
        { itemCode:'taper',     itemName:'锥度',     category:'SIZE',      isCritical:true,  standardValue:'0.04', result:'PENDING' },
        { itemCode:'thread',    itemName:'螺纹螺距', category:'SIZE',      isCritical:true,  standardValue:'按设计', unit:'mm', result:'PENDING' },
        { itemCode:'appearance',itemName:'外观',     category:'APPEARANCE',isCritical:false, result:'PENDING' },
      ],
    },
    {
      taskId: 'IT003', taskNo: 'IT-20260426-003',
      schemeCode: 'ISP-IPQC-50', schemeName: '研磨一过程检验', schemeType: 'IPQC_SELF',
      opNo: 'OP-20', batchNo: 'YS-RKQ-20260425-001', totalQty: 4990, sampleQty: 5,
      inspectorName: '王五(QC001)', checkerName: '赵六(QC002)',
      instrumentName: '千分尺-001(DC-001)',
      startTime: '2026-04-26 10:15',
      conclusion: undefined, releaseStatus: 'PENDING',
      items: [
        { itemCode:'d1',        itemName:'外径D1',    category:'SIZE',      isCritical:true,  standardValue:'0.250±0.005', unit:'mm', actualValue:0.251, result:'PASS' },
        { itemCode:'d2',        itemName:'外径D2',    category:'SIZE',      isCritical:false, standardValue:'按规格', unit:'mm', actualValue:0.297, result:'PASS' },
        { itemCode:'taper',     itemName:'锥度',      category:'SIZE',      isCritical:true,  standardValue:'0.04', actualValue:'0.04', result:'PASS' },
        { itemCode:'appearance',itemName:'外观',      category:'APPEARANCE',isCritical:false, actualValue:'合格', result:'PASS' },
        { itemCode:'ra',        itemName:'表面粗糙度',category:'SIZE',      isCritical:false, standardValue:'≤0.8', unit:'μm', result:'PENDING' },
      ],
    },
  ],

  deviations: [
    {
      id: 'DEV-20260425-001',
      opNo: 'OP-40', opName: '热处理（计划）',
      type: '工艺偏差',
      description: '上一批次（YS-RKQ-20260424-008）热处理炉次 HT-20260425-F02 保温温度达525℃（超出480~520℃规范），已触发复验流程（IT004），本批次热处理待该批偏差关闭后方可启动',
      discoveredAt: '2026-04-26 11:30',
      discoveredBy: '李娜（QC003）',
      disposition: '隔离相关批次，启动偏差报告 DR-20260426-001，待QA评估影响后决定是否返工',
      impactQty: 0,
    },
  ],

  signatures: [
    { role:'机加工操作员', name:'张三（OP001）', signedAt:'2026-04-25 10:00' },
    { role:'热处理操作员', name:'李四（OP002）', signedAt:'2026-04-25 13:35' },
  ],

  startTime: '2026-04-25 08:45',
  createdAt: '2026-04-25 08:45',
  updatedAt: new Date().toLocaleString('zh-CN'),
};

/**
 * WO006 / WO-20260423-010 — #25/06锥度 — 已完成待审核
 * 数据来源：WO006(COMPLETED，actualQty:4930，scrapQty:70)，PO003(COMPLETED)
 */
const EBR_WO006: EbrRecord = {
  id: 'EBR_WO006',
  ebrNo: 'EBR-20260423-001',
  status: 'COMPLETED',

  poId: 'PO003', poNo: 'MO-20260423-003', soNo: 'SO-20260418-055',
  routingCode: 'YS-RKQ-STD-V21',
  routingName: '机用根管锉标准工艺路径 V2.1',
  bomVersion: '1.0',

  woId: 'WO006', woNo: 'WO-20260423-010',
  batchNo: 'YS-RKQ-20260423-010',
  productCode: 'FG-RKQ-2506-25',
  productName: '机用根管锉',
  productSpec: '#25 / 06锥度 / 25mm',
  planQty: 5000,
  customer: 'ZZZ医疗',
  deliveryDate: '2026-04-30',
  priority: 'NORMAL',

  tasks: [
    {
      taskNo: 'TK-20260423-010-D1',
      workCenter: '全线',
      shiftName: '白班',
      team: '甲班A组',
      operator: '陈小明（工号:OP007）',
      stationScope: '全工序 S1~S9',
      status: 'DONE',
      planStart: '2026-04-23 08:00', planEnd: '2026-04-23 22:00',
      actualStart: '2026-04-23 08:05', actualEnd: '2026-04-23 21:50',
      reportQty: 4930, scrapQty: 70,
    },
  ],
  floatTickets: [
    { ticketNo:'FT-20260423-010-01', qty:2500, status:'ARCHIVED', currentOp:'OP-95 成品入库', lastUpdateTime:'2026-04-23 21:50' },
    { ticketNo:'FT-20260423-010-02', qty:2500, status:'ARCHIVED', currentOp:'OP-95 成品入库', lastUpdateTime:'2026-04-23 21:50' },
  ],

  materialLotNo: 'NT-20260418-C',
  materialSpec: '镍钛合金丝 Ø0.3 HV300~380',
  iqcResult: 'PASS',

  routingSteps: [
    { seq:1,  opNo:'OP-10', opName:'镍钛丝入料确认',  stage:'S1-备料',     workCenter:'备料区',         isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 08:05', completedAt:'2026-04-23 08:20', operatorName:'陈小明（OP007）', reportQty:5000, goodQty:5000, scrapQty:0 },
    { seq:2,  opNo:'OP-15', opName:'切断',             stage:'S1-备料',     workCenter:'机加工-切断区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 08:20', completedAt:'2026-04-23 09:20', operatorName:'陈小明（OP007）', equipId:'EQ010', equipName:'切断机1号', reportQty:5000, goodQty:4997, scrapQty:3 },
    { seq:3,  opNo:'OP-20', opName:'粗磨锥',           stage:'S2-磨锥',     workCenter:'机加工-磨削区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 09:20', completedAt:'2026-04-23 10:40', operatorName:'陈小明（OP007）', equipId:'EQ001', equipName:'数控磨削机1号', reportQty:4997, goodQty:4990, scrapQty:7 },
    { seq:4,  opNo:'OP-25', opName:'精磨锥/尖端成型',  stage:'S2-磨锥',     workCenter:'机加工-精磨区',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-23 10:40', completedAt:'2026-04-23 12:10', operatorName:'陈小明（OP007）', equipId:'EQ001', reportQty:4990, goodQty:4980, scrapQty:10 },
    { seq:5,  opNo:'OP-30', opName:'螺纹滚压',         stage:'S3-螺纹',     workCenter:'机加工-螺纹区',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-23 12:10', completedAt:'2026-04-23 13:10', operatorName:'陈小明（OP007）', equipId:'EQ003', reportQty:4980, goodQty:4972, scrapQty:8 },
    { seq:6,  opNo:'OP-32', opName:'尾部修整',         stage:'S3-螺纹',     workCenter:'机加工-螺纹区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 13:10', completedAt:'2026-04-23 13:40', operatorName:'陈小明（OP007）', reportQty:4972, goodQty:4970, scrapQty:2 },
    { seq:7,  opNo:'OP-40', opName:'热处理',           stage:'S4-热处理',   workCenter:'热处理车间',     isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-23 13:40', completedAt:'2026-04-23 16:00', operatorName:'林小红（OP009）', equipId:'EQ004', equipName:'热处理炉1号', reportQty:4970, goodQty:4967, scrapQty:3, keyData:{'升温速率':'5.5℃/min','保温温度':'495℃','保温时间':'11min','炉次号':'HT-20260423-F02'} },
    { seq:8,  opNo:'OP-42', opName:'化学蚀刻',         stage:'S4-热处理',   workCenter:'热处理-蚀刻区',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 16:00', completedAt:'2026-04-23 16:30', operatorName:'林小红（OP009）', reportQty:4967, goodQty:4966, scrapQty:1 },
    { seq:9,  opNo:'OP-50', opName:'PVD氮化钛涂层',   stage:'S5-涂层',     workCenter:'涂层车间',       isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-23 16:30', completedAt:'2026-04-23 18:30', operatorName:'黄建国（OP010）', equipId:'EQ006', equipName:'PVD镀膜机1号', reportQty:4966, goodQty:4960, scrapQty:6, keyData:{'靶材':'TiN','沉积时间':'90min','基础真空':'2e-3Pa'} },
    { seq:10, opNo:'OP-60', opName:'ABS注塑柄',        stage:'S6-注塑柄',   workCenter:'注塑车间',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 18:30', completedAt:'2026-04-23 19:30', operatorName:'何文华（OP011）', equipId:'EQ007', reportQty:4960, goodQty:4957, scrapQty:3 },
    { seq:11, opNo:'OP-70', opName:'柄部组装',         stage:'S7-组装清洗', workCenter:'组装车间',       isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-23 19:30', completedAt:'2026-04-23 20:20', operatorName:'何文华（OP011）', reportQty:4957, goodQty:4950, scrapQty:7 },
    { seq:12, opNo:'OP-72', opName:'超声清洗',         stage:'S7-组装清洗', workCenter:'清洗车间',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 20:20', completedAt:'2026-04-23 20:50', operatorName:'何文华（OP011）', equipId:'EQ008', reportQty:4950, goodQty:4945, scrapQty:5 },
    { seq:13, opNo:'OP-80', opName:'吸塑包装+UDI赋码', stage:'S8-包装',     workCenter:'包装车间',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 20:50', completedAt:'2026-04-23 21:20', operatorName:'吴晓燕（OP013）', equipId:'EQ009', reportQty:4945, goodQty:4940, scrapQty:5 },
    { seq:14, opNo:'OP-82', opName:'装盒',             stage:'S8-包装',     workCenter:'包装车间',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 21:20', completedAt:'2026-04-23 21:30', operatorName:'吴晓燕（OP013）', reportQty:4940, goodQty:4935, scrapQty:5 },
    { seq:15, opNo:'OP-90', opName:'OQC出厂终检',      stage:'S9-入库',     workCenter:'检验室',         isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-04-23 21:30', completedAt:'2026-04-23 21:45', operatorName:'韩志远（OP018）', reportQty:4935, goodQty:4930, scrapQty:5 },
    { seq:16, opNo:'OP-95', opName:'成品入库',         stage:'S9-入库',     workCenter:'成品仓库',       isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-04-23 21:45', completedAt:'2026-04-23 21:50', operatorName:'陈小明（OP007）', reportQty:4930, goodQty:4930, scrapQty:0 },
  ],

  planQtyTotal: 5000, reportQtyTotal: 4930, goodQtyTotal: 4930, scrapQtyTotal: 70,
  yieldRate: 98.60,

  inspectionRecords: [
    {
      taskId: 'IT-FQC-006-2', taskNo: 'IT-20260423-005',
      schemeCode: 'ISP-FQC-001', schemeName: '半成品检验', schemeType: 'FQC',
      batchNo: 'YS-RKQ-20260423-010', totalQty: 4960, sampleQty: 32,
      inspectorName: '赵六(QC002)', checkerName: '张伟(QC004)',
      startTime: '2026-04-23 18:30', completeTime: '2026-04-23 19:30',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'length', itemName:'总长度L',    category:'SIZE',       isCritical:true,  standardValue:'25±0.5mm', unit:'mm', actualValue:25.2, result:'PASS' },
        { itemCode:'d0',     itemName:'尖端直径D0', category:'SIZE',       isCritical:true,  standardValue:'0.150±0.005', unit:'mm', actualValue:0.153, result:'PASS' },
        { itemCode:'taper',  itemName:'锥度',       category:'SIZE',       isCritical:true,  standardValue:'0.06', actualValue:'0.06', result:'PASS' },
        { itemCode:'torque', itemName:'扭转强度',   category:'PERFORMANCE',isCritical:true,  standardValue:'≥标准值', unit:'N·cm', actualValue:17.8, result:'PASS' },
        { itemCode:'flex',   itemName:'抗弯强度',   category:'PERFORMANCE',isCritical:true,  standardValue:'≥标准值', unit:'N', actualValue:40.5, result:'PASS' },
        { itemCode:'surface',itemName:'表面外观',   category:'APPEARANCE', isCritical:true,  actualValue:'合格', result:'PASS' },
        { itemCode:'color',  itemName:'颜色标识',   category:'APPEARANCE', isCritical:false, actualValue:'正确', result:'PASS' },
      ],
    },
  ],

  deviations: [],

  signatures: [
    { role:'机加工操作员',  name:'陈小明（OP007）', signedAt:'2026-04-23 21:50' },
    { role:'热处理操作员',  name:'林小红（OP009）', signedAt:'2026-04-23 16:30' },
    { role:'涂层操作员',    name:'黄建国（OP010）', signedAt:'2026-04-23 18:30' },
    { role:'组装/包装操作员',name:'何文华（OP011）',signedAt:'2026-04-23 20:50' },
    { role:'包装/UDI操作员',name:'吴晓燕（OP013）', signedAt:'2026-04-23 21:30' },
    { role:'OQC检验员',     name:'韩志远（OP018）', signedAt:'2026-04-23 21:45' },
  ],

  startTime: '2026-04-23 08:05',
  endTime:   '2026-04-23 21:50',
  createdAt: '2026-04-23 08:05',
  updatedAt: '2026-04-23 22:00',
};

// ────────────────────────────────────────────────────────────────────
// 物料平衡表数据结构
// ────────────────────────────────────────────────────────────────────

/** 物料平衡行（BOM中的每种投料物料） */
export interface MaterialBalanceRow {
  lineNo: number;                // 行号
  itemCode: string;              // 物料编码
  itemName: string;              // 物料名称
  itemSpec?: string;             // 规格
  unit: string;                  // 单位
  lotNo?: string;                // 物料批号
  theoreticalQty: number;        // 理论投料量（BOM定额 × 生产数量）
  actualInputQty: number;        // 实际投料量
  actualOutputQty: number;       // 实际产出量（进入下道工序或成品）
  scrapQty: number;              // 报废量
  returnQty: number;             // 退料量（未使用退库）
  lossQty: number;               // 损耗量 = 实投 - 实产 - 退料
  theoreticalLossRate: number;   // 理论损耗率（%）
  actualLossRate: number;        // 实际损耗率（%）
  balanceRate: number;           // 物料平衡率（%）= 实产/实投×100
  lossReason?: string;           // 损耗原因说明
  isMainMaterial: boolean;       // 是否主物料
  status: 'NORMAL' | 'WARNING' | 'ABNORMAL'; // 平衡率状态
}

/** 工序级物料平衡行 */
export interface OpBalanceRow {
  seq: number;
  opNo: string;
  opName: string;
  stage: string;
  inputQty: number;              // 本工序投入量
  outputQty: number;             // 本工序产出量（goodQty）
  scrapQty: number;              // 本工序报废量
  yieldRate: number;             // 本工序直通率（%）
  cumulativeYield: number;       // 累计综合良率（%）
}

/** 批次物料平衡表 */
export interface MaterialBalanceSheet {
  batchNo: string;
  ebrNo: string;
  productName: string;
  productSpec: string;
  planQty: number;
  actualInputQty: number;        // 实际总投料量（主物料）
  actualOutputQty: number;       // 实际总产出量（成品）
  totalScrapQty: number;         // 总报废量
  totalReturnQty: number;        // 总退料量
  overallBalanceRate: number;    // 总物料平衡率（%）
  overallYieldRate: number;      // 综合良率（%）
  theoryLossRate: number;        // 理论综合损耗率（%）
  balanceStatus: 'NORMAL' | 'WARNING' | 'ABNORMAL';
  preparedBy: string;            // 制表人
  reviewedBy?: string;           // 审核人
  preparedAt: string;            // 制表时间
  materialRows: MaterialBalanceRow[];
  opBalanceRows: OpBalanceRow[];
  conclusion: string;            // 平衡结论
  deviation?: string;            // 偏差说明
}

/** 判断平衡率状态 */
function balanceStatus(rate: number): 'NORMAL' | 'WARNING' | 'ABNORMAL' {
  if (rate >= 98) return 'NORMAL';
  if (rate >= 95) return 'WARNING';
  return 'ABNORMAL';
}

/** EBR-20260424-001（WO004）— 机用根管锉 #30/06锥 完整物料平衡表 */
export const MATERIAL_BALANCE_WO004: MaterialBalanceSheet = {
  batchNo: 'YS-RKQ-20260424-007',
  ebrNo: 'EBR-20260424-001',
  productName: '机用根管锉',
  productSpec: '#30 / 06锥度 / 21mm',
  planQty: 5000,
  actualInputQty: 5000,
  actualOutputQty: 4965,
  totalScrapQty: 35,
  totalReturnQty: 0,
  overallBalanceRate: 99.30,
  overallYieldRate: 99.30,
  theoryLossRate: 0.50,
  balanceStatus: 'NORMAL',
  preparedBy: '赵六（OP004）',
  reviewedBy: '王质检（QC001）',
  preparedAt: '2026-04-24 21:45',
  conclusion: '本批次物料平衡率99.30%，在理论损耗范围内（±2%），符合GMP物料平衡要求，批准放行。',
  materialRows: [
    {
      lineNo: 1,
      itemCode: 'RM-NITI-030-HV300',
      itemName: '镍钛合金丝',
      itemSpec: 'Ø0.3mm / HV300~380',
      unit: '根',
      lotNo: 'NT-20260419-B',
      theoreticalQty: 5000,
      actualInputQty: 5000,
      actualOutputQty: 4965,
      scrapQty: 35,
      returnQty: 0,
      lossQty: 35,
      theoreticalLossRate: 0.50,
      actualLossRate: 0.70,
      balanceRate: 99.30,
      lossReason: '磨削精度控制产生少量报废（含精磨锥10根、螺纹5根、热处理3根、清洗1根等）',
      isMainMaterial: true,
      status: 'NORMAL',
    },
    {
      lineNo: 2,
      itemCode: 'PM-ABS-WHITE-001',
      itemName: 'ABS塑料柄',
      itemSpec: '白色 / 符合医疗级要求',
      unit: '个',
      lotNo: 'ABS-20260420-A',
      theoreticalQty: 4970,
      actualInputQty: 4970,
      actualOutputQty: 4965,
      scrapQty: 5,
      returnQty: 0,
      lossQty: 5,
      theoreticalLossRate: 0.10,
      actualLossRate: 0.10,
      balanceRate: 99.90,
      lossReason: '注塑异常品5个，已记录销毁',
      isMainMaterial: false,
      status: 'NORMAL',
    },
    {
      lineNo: 3,
      itemCode: 'PK-BLISTER-30',
      itemName: '吸塑包装袋',
      itemSpec: '#30锥 / 6支装 / 灭菌级',
      unit: '袋',
      lotNo: 'BL-20260421-C',
      theoreticalQty: 828,
      actualInputQty: 830,
      actualOutputQty: 828,
      scrapQty: 2,
      returnQty: 0,
      lossQty: 2,
      theoreticalLossRate: 0.20,
      actualLossRate: 0.24,
      balanceRate: 99.76,
      lossReason: '封口不良品2袋已销毁',
      isMainMaterial: false,
      status: 'NORMAL',
    },
  ],
  opBalanceRows: [
    { seq:1,  opNo:'OP-10', opName:'镍钛丝入料确认',  stage:'S1-备料',     inputQty:5000, outputQty:4998, scrapQty:2,  yieldRate:99.96, cumulativeYield:99.96 },
    { seq:2,  opNo:'OP-15', opName:'切断',             stage:'S1-备料',     inputQty:4998, outputQty:4995, scrapQty:3,  yieldRate:99.94, cumulativeYield:99.90 },
    { seq:3,  opNo:'OP-20', opName:'粗磨锥',           stage:'S2-磨锥',     inputQty:4995, outputQty:4990, scrapQty:5,  yieldRate:99.90, cumulativeYield:99.80 },
    { seq:4,  opNo:'OP-25', opName:'精磨锥/尖端成型',  stage:'S2-磨锥',     inputQty:4990, outputQty:4980, scrapQty:10, yieldRate:99.80, cumulativeYield:99.60 },
    { seq:5,  opNo:'OP-30', opName:'螺纹滚压',         stage:'S3-螺纹',     inputQty:4980, outputQty:4975, scrapQty:5,  yieldRate:99.90, cumulativeYield:99.50 },
    { seq:6,  opNo:'OP-32', opName:'尾部修整',         stage:'S3-螺纹',     inputQty:4975, outputQty:4973, scrapQty:2,  yieldRate:99.96, cumulativeYield:99.46 },
    { seq:7,  opNo:'OP-40', opName:'热处理',           stage:'S4-热处理',   inputQty:4973, outputQty:4970, scrapQty:3,  yieldRate:99.94, cumulativeYield:99.40 },
    { seq:8,  opNo:'OP-42', opName:'化学蚀刻',         stage:'S4-热处理',   inputQty:4970, outputQty:4969, scrapQty:1,  yieldRate:99.98, cumulativeYield:99.38 },
    { seq:9,  opNo:'OP-60', opName:'ABS注塑柄',        stage:'S6-注塑柄',   inputQty:4969, outputQty:4968, scrapQty:1,  yieldRate:99.98, cumulativeYield:99.36 },
    { seq:10, opNo:'OP-70', opName:'柄部组装',         stage:'S7-组装清洗', inputQty:4968, outputQty:4966, scrapQty:2,  yieldRate:99.96, cumulativeYield:99.32 },
    { seq:11, opNo:'OP-72', opName:'超声清洗',         stage:'S7-组装清洗', inputQty:4966, outputQty:4965, scrapQty:1,  yieldRate:99.98, cumulativeYield:99.30 },
    { seq:12, opNo:'OP-80', opName:'吸塑包装+UDI赋码', stage:'S8-包装',     inputQty:4965, outputQty:4965, scrapQty:0,  yieldRate:100,   cumulativeYield:99.30 },
    { seq:13, opNo:'OP-82', opName:'装盒',             stage:'S8-包装',     inputQty:4965, outputQty:4965, scrapQty:0,  yieldRate:100,   cumulativeYield:99.30 },
    { seq:14, opNo:'OP-90', opName:'OQC出厂终检',      stage:'S9-入库',     inputQty:4965, outputQty:4965, scrapQty:0,  yieldRate:100,   cumulativeYield:99.30 },
    { seq:15, opNo:'OP-95', opName:'成品入库',         stage:'S9-入库',     inputQty:4965, outputQty:4965, scrapQty:0,  yieldRate:100,   cumulativeYield:99.30 },
  ],
};

/** EBR-20260425-001（WO006）— 机用根管锉 #25/04锥 进行中 */
export const MATERIAL_BALANCE_WO006: MaterialBalanceSheet = {
  batchNo: 'YS-RKQ-20260425-001',
  ebrNo: 'EBR-20260425-001',
  productName: '机用根管锉',
  productSpec: '#25 / 04锥度 / 25mm',
  planQty: 5000,
  actualInputQty: 5000,
  actualOutputQty: 3200,
  totalScrapQty: 58,
  totalReturnQty: 0,
  overallBalanceRate: 98.84,
  overallYieldRate: 98.22,
  theoryLossRate: 0.50,
  balanceStatus: 'NORMAL',
  preparedBy: '张三（OP001）',
  reviewedBy: undefined,
  preparedAt: '2026-04-25 20:00（生产进行中，数据实时更新）',
  conclusion: '生产进行中（完成约64%），阶段物料平衡率98.84%，存在1条热处理偏差（保温温度超标），正在复验，暂未影响平衡率。',
  deviation: '热处理工序保温温度超标（507℃，规范≤505℃），已采取措施复验，偏差单DEV-20260425-001。',
  materialRows: [
    {
      lineNo: 1,
      itemCode: 'RM-NITI-025-HV300',
      itemName: '镍钛合金丝',
      itemSpec: 'Ø0.25mm / HV300~380',
      unit: '根',
      lotNo: 'NT-20260421-A',
      theoreticalQty: 5000,
      actualInputQty: 5000,
      actualOutputQty: 3200,
      scrapQty: 58,
      returnQty: 1742,
      lossQty: 58,
      theoreticalLossRate: 0.50,
      actualLossRate: 1.16,
      balanceRate: 98.84,
      lossReason: '生产进行中（S5涂层段），已完成工序报废量，热处理偏差正在复验',
      isMainMaterial: true,
      status: 'WARNING',
    },
    {
      lineNo: 2,
      itemCode: 'PM-ABS-BLUE-001',
      itemName: 'ABS塑料柄（蓝色）',
      itemSpec: '蓝色 / 医疗级',
      unit: '个',
      lotNo: 'ABS-20260422-B',
      theoreticalQty: 3200,
      actualInputQty: 3200,
      actualOutputQty: 3185,
      scrapQty: 15,
      returnQty: 0,
      lossQty: 15,
      theoreticalLossRate: 0.10,
      actualLossRate: 0.47,
      balanceRate: 99.53,
      lossReason: '注塑段偏差产生少量不良品',
      isMainMaterial: false,
      status: 'WARNING',
    },
  ],
  opBalanceRows: [
    { seq:1,  opNo:'OP-10', opName:'镍钛丝入料确认',  stage:'S1-备料',     inputQty:5000, outputQty:4996, scrapQty:4,  yieldRate:99.92, cumulativeYield:99.92 },
    { seq:2,  opNo:'OP-15', opName:'切断',             stage:'S1-备料',     inputQty:4996, outputQty:4990, scrapQty:6,  yieldRate:99.88, cumulativeYield:99.80 },
    { seq:3,  opNo:'OP-20', opName:'粗磨锥',           stage:'S2-磨锥',     inputQty:4990, outputQty:4985, scrapQty:5,  yieldRate:99.90, cumulativeYield:99.70 },
    { seq:4,  opNo:'OP-25', opName:'精磨锥/尖端成型',  stage:'S2-磨锥',     inputQty:4985, outputQty:4970, scrapQty:15, yieldRate:99.70, cumulativeYield:99.40 },
    { seq:5,  opNo:'OP-30', opName:'螺纹滚压',         stage:'S3-螺纹',     inputQty:4970, outputQty:4965, scrapQty:5,  yieldRate:99.90, cumulativeYield:99.30 },
    { seq:6,  opNo:'OP-32', opName:'尾部修整',         stage:'S3-螺纹',     inputQty:4965, outputQty:4963, scrapQty:2,  yieldRate:99.96, cumulativeYield:99.26 },
    { seq:7,  opNo:'OP-40', opName:'热处理',           stage:'S4-热处理',   inputQty:4963, outputQty:4947, scrapQty:16, yieldRate:99.68, cumulativeYield:98.94 },
    { seq:8,  opNo:'OP-42', opName:'化学蚀刻',         stage:'S4-热处理',   inputQty:4947, outputQty:4942, scrapQty:5,  yieldRate:99.90, cumulativeYield:98.84 },
    { seq:9,  opNo:'OP-50', opName:'涂层（进行中）',   stage:'S5-涂层',     inputQty:4942, outputQty:3200, scrapQty:5,  yieldRate:99.90, cumulativeYield:98.22 },
  ],
};

/** EBR-20260423-010（WO001）— 机用根管锉 #15/02锥 已完成 */
export const MATERIAL_BALANCE_WO001: MaterialBalanceSheet = {
  batchNo: 'YS-RKQ-20260423-010',
  ebrNo: 'EBR-20260423-001',
  productName: '机用根管锉',
  productSpec: '#15 / 02锥度 / 21mm',
  planQty: 5000,
  actualInputQty: 5000,
  actualOutputQty: 4960,
  totalScrapQty: 40,
  totalReturnQty: 0,
  overallBalanceRate: 99.20,
  overallYieldRate: 99.20,
  theoryLossRate: 0.50,
  balanceStatus: 'NORMAL',
  preparedBy: '赵六（OP004）',
  reviewedBy: '王质检（QC001）',
  preparedAt: '2026-04-23 22:00',
  conclusion: '本批次物料平衡率99.20%，超过98%的GMP下限要求，符合规定。',
  materialRows: [
    {
      lineNo: 1,
      itemCode: 'RM-NITI-015-HV280',
      itemName: '镍钛合金丝',
      itemSpec: 'Ø0.15mm / HV280~350',
      unit: '根',
      lotNo: 'NT-20260418-C',
      theoreticalQty: 5000,
      actualInputQty: 5000,
      actualOutputQty: 4960,
      scrapQty: 40,
      returnQty: 0,
      lossQty: 40,
      theoreticalLossRate: 0.50,
      actualLossRate: 0.80,
      balanceRate: 99.20,
      lossReason: '细丝精磨损耗偏高，已分析并优化砂轮参数',
      isMainMaterial: true,
      status: 'NORMAL',
    },
    {
      lineNo: 2,
      itemCode: 'PM-ABS-WHITE-001',
      itemName: 'ABS塑料柄',
      itemSpec: '白色 / 医疗级',
      unit: '个',
      lotNo: 'ABS-20260419-A',
      theoreticalQty: 4970,
      actualInputQty: 4970,
      actualOutputQty: 4963,
      scrapQty: 7,
      returnQty: 0,
      lossQty: 7,
      theoreticalLossRate: 0.10,
      actualLossRate: 0.14,
      balanceRate: 99.86,
      isMainMaterial: false,
      status: 'NORMAL',
    },
  ],
  opBalanceRows: [
    { seq:1,  opNo:'OP-10', opName:'镍钛丝入料确认', stage:'S1-备料',     inputQty:5000, outputQty:4998, scrapQty:2,  yieldRate:99.96, cumulativeYield:99.96 },
    { seq:2,  opNo:'OP-15', opName:'切断',            stage:'S1-备料',     inputQty:4998, outputQty:4994, scrapQty:4,  yieldRate:99.92, cumulativeYield:99.88 },
    { seq:3,  opNo:'OP-20', opName:'粗磨锥',          stage:'S2-磨锥',     inputQty:4994, outputQty:4988, scrapQty:6,  yieldRate:99.88, cumulativeYield:99.76 },
    { seq:4,  opNo:'OP-25', opName:'精磨锥/尖端成型', stage:'S2-磨锥',     inputQty:4988, outputQty:4974, scrapQty:14, yieldRate:99.72, cumulativeYield:99.48 },
    { seq:5,  opNo:'OP-30', opName:'螺纹滚压',        stage:'S3-螺纹',     inputQty:4974, outputQty:4970, scrapQty:4,  yieldRate:99.92, cumulativeYield:99.40 },
    { seq:6,  opNo:'OP-40', opName:'热处理',          stage:'S4-热处理',   inputQty:4970, outputQty:4966, scrapQty:4,  yieldRate:99.92, cumulativeYield:99.32 },
    { seq:7,  opNo:'OP-60', opName:'ABS注塑柄',       stage:'S6-注塑柄',   inputQty:4966, outputQty:4963, scrapQty:3,  yieldRate:99.94, cumulativeYield:99.26 },
    { seq:8,  opNo:'OP-70', opName:'柄部组装',        stage:'S7-组装清洗', inputQty:4963, outputQty:4961, scrapQty:2,  yieldRate:99.96, cumulativeYield:99.22 },
    { seq:9,  opNo:'OP-72', opName:'超声清洗',        stage:'S7-组装清洗', inputQty:4961, outputQty:4960, scrapQty:1,  yieldRate:99.98, cumulativeYield:99.20 },
    { seq:10, opNo:'OP-80', opName:'吸塑包装',        stage:'S8-包装',     inputQty:4960, outputQty:4960, scrapQty:0,  yieldRate:100,   cumulativeYield:99.20 },
    { seq:11, opNo:'OP-90', opName:'OQC出厂终检',     stage:'S9-入库',     inputQty:4960, outputQty:4960, scrapQty:0,  yieldRate:100,   cumulativeYield:99.20 },
    { seq:12, opNo:'OP-95', opName:'成品入库',        stage:'S9-入库',     inputQty:4960, outputQty:4960, scrapQty:0,  yieldRate:100,   cumulativeYield:99.20 },
  ],
};

/** 按 batchNo 获取物料平衡表 */
export function getMaterialBalance(batchNo: string): MaterialBalanceSheet | undefined {
  const map: Record<string, MaterialBalanceSheet> = {
    'YS-RKQ-20260424-007': MATERIAL_BALANCE_WO004,
    'YS-RKQ-20260425-001': MATERIAL_BALANCE_WO006,
    'YS-RKQ-20260423-010': MATERIAL_BALANCE_WO001,
  };
  return map[batchNo];
}

/** 所有物料平衡表列表 */
export const ALL_MATERIAL_BALANCES: MaterialBalanceSheet[] = [
  MATERIAL_BALANCE_WO004,
  MATERIAL_BALANCE_WO006,
  MATERIAL_BALANCE_WO001,
];

// ────────────────────────────────────────────────────────────────────
// 导出
// ────────────────────────────────────────────────────────────────────
export const MOCK_EBR_LIST: EbrRecord[] = [];
export const EBR_STORAGE_KEY = 'bip_ebr_records';

/** 数据版本号 — 每次更新 Mock 数据时递增，强制刷新旧缓存 */
export const EBR_DATA_VERSION = 'v20260606_clear';
export const EBR_VERSION_KEY  = 'bip_ebr_version';

/**
 * 读取 EBR 列表：
 * - 若用户已主动清空（isUserCleared），返回空数组，不填入任何 Mock 数据
 * - 若 localStorage 版本号不匹配（或数据为空），自动回填 MOCK_EBR_LIST 并更新版本
 * - 否则返回 localStorage 中的用户操作数据（审核/驳回等）
 */
export function loadEbrRecords(): EbrRecord[] {
  try {
    // 用户已主动清空时，直接返回空数组
    if (isUserCleared()) {
      localStorage.setItem(EBR_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(EBR_VERSION_KEY,  EBR_DATA_VERSION);
      return [];
    }
    const version = localStorage.getItem(EBR_VERSION_KEY);
    const stored  = localStorage.getItem(EBR_STORAGE_KEY);
    const parsed  = stored ? JSON.parse(stored) as EbrRecord[] : null;

    // 版本不一致 或 数据为空数组 → 强制重置（MOCK_EBR_LIST 现为 []，等于清空）
    if (version !== EBR_DATA_VERSION || !parsed || parsed.length === 0) {
      localStorage.setItem(EBR_STORAGE_KEY, JSON.stringify(MOCK_EBR_LIST));
      localStorage.setItem(EBR_VERSION_KEY,  EBR_DATA_VERSION);
      return MOCK_EBR_LIST;
    }
    return parsed;
  } catch {
    return MOCK_EBR_LIST;
  }
}
