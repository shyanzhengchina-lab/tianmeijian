/**
 * 电子批记录（EBR — Electronic Batch Record）数据模型
 * 天美健保健品MES V2.0 | 2026-06-14
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
  materialSpec?: string;        // 原料规格
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
    routingCode: 'TMJ-VITC-WG-V20', routingName: 'VitC咀嚼片湿法制粒工艺路径 V2.0', bomVersion: '2.0',
    woId: wo.id, woNo: wo.woNo, batchNo: wo.batchNo,
    productCode: 'FG-VITC-500MG-AP',
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
 * WO001 / WO-20260601-001 — VitC咀嚼片 500mg 铝塑 — 已批准放行（南京工厂，湿法制粒全线14道工序）
 * 数据来源：workOrderData WO001（COMPLETED，actualQty:99200，scrapQty:800）
 * 检验：IT005 成品FQC（VitC含量497.8mg/粒，溶出度88.5%，PASS），QR001已放行
 */
const EBR_WO004: EbrRecord = {
  id: 'EBR_WO004',
  ebrNo: 'EBR-20260603-001',
  status: 'APPROVED',

  poId: 'PO001', poNo: 'MO-20260601-001', soNo: undefined,
  routingCode: 'TMJ-VITC-WG-V20',
  routingName: 'VitC咀嚼片湿法制粒工艺路径 V2.0',
  bomVersion: '2.0',

  woId: 'WO001', woNo: 'WO-20260601-001',
  batchNo: 'TMJ-VITC-20260601-001',
  productCode: 'FG-VITC-500MG-AP',
  productName: '维生素C咀嚼片',
  productSpec: '500mg/粒 铝塑包装 100粒/瓶',
  planQty: 100000,
  customer: undefined,
  deliveryDate: '2026-06-10',
  priority: 'NORMAL',

  tasks: [
    {
      taskNo: 'TK-20260601-001-A1',
      workCenter: '称量间/固体制剂车间',
      shiftName: '白班',
      team: '南京甲班',
      operator: '陈国华（班组长）',
      stationScope: 'S1称量(OP-10) → S2制粒干燥(OP-20,OP-25) → S3总混(OP-30)',
      padStation: 'PAD-NJ-SOLID-01',
      status: 'DONE',
      planStart: '2026-06-01 08:00', planEnd: '2026-06-01 20:00',
      actualStart: '2026-06-01 08:15', actualEnd: '2026-06-01 19:55',
      reportQty: 100000, scrapQty: 200,
    },
    {
      taskNo: 'TK-20260601-001-A2',
      workCenter: '压片车间/包装车间',
      shiftName: '白班',
      team: '南京乙班',
      operator: '王磊（班组长）',
      stationScope: 'S4压片包衣(OP-40,OP-45) → S5内包铝塑(OP-50) → S6外包(OP-60,OP-65)',
      padStation: 'PAD-NJ-PACK-01',
      status: 'DONE',
      planStart: '2026-06-02 08:00', planEnd: '2026-06-02 22:00',
      actualStart: '2026-06-02 08:10', actualEnd: '2026-06-02 21:45',
      reportQty: 99800, scrapQty: 400,
    },
    {
      taskNo: 'TK-20260601-001-B1',
      workCenter: '检验室/成品仓库',
      shiftName: '白班',
      team: '南京质量组',
      operator: '冯小丽（QC）',
      stationScope: 'S7成品检验(OP-80) → S8放行入库(OP-90,OP-95)',
      padStation: 'PAD-NJ-QC-01',
      status: 'DONE',
      planStart: '2026-06-03 08:00', planEnd: '2026-06-03 18:00',
      actualStart: '2026-06-03 08:30', actualEnd: '2026-06-03 17:20',
      reportQty: 99200, scrapQty: 200,
    },
  ],
  floatTickets: [
    { ticketNo: 'FT-20260601-001-01', qty: 33000, status: 'ARCHIVED', currentOp: 'OP-95 成品入库', lastUpdateTime: '2026-06-03 17:00' },
    { ticketNo: 'FT-20260601-001-02', qty: 33200, status: 'ARCHIVED', currentOp: 'OP-95 成品入库', lastUpdateTime: '2026-06-03 17:10' },
    { ticketNo: 'FT-20260601-001-03', qty: 33000, status: 'ARCHIVED', currentOp: 'OP-95 成品入库', lastUpdateTime: '2026-06-03 17:20' },
  ],

  materialLotNo: 'RM-VITC-20260601-001',
  materialSpec: 'L-抗坏血酸 药用级 99.5% GB 14754-2010',
  handleLotNo: 'PK-ALUPLA-20260601-A（铝塑膜批号）',
  iqcResult: 'PASS',

  routingSteps: [
    { seq:1,  opNo:'OP-10', opName:'称量配料',     stage:'S1-称量',  workCenter:'WS-NJ-WEIGH', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-01 08:15', completedAt:'2026-06-01 09:00', operatorName:'陈国华（OP001）', teamName:'南京甲班', reportQty:100000, goodQty:100000, scrapQty:0, keyData:{'VitC投料量':'52.5kg','辅料淀粉':'18.0kg','微晶纤维素':'15.0kg','硬脂酸镁':'0.5kg','天平编号':'BAL-NJ-001','复核人':'孙建国'} },
    { seq:2,  opNo:'OP-20', opName:'制粒（湿法）', stage:'S2-制粒',  workCenter:'WS-NJ-SOLID', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-01 09:10', completedAt:'2026-06-01 11:40', operatorName:'陈国华（OP001）', teamName:'南京甲班', equipId:'EQ-NJ-GRAN-001', equipName:'湿法制粒机1号', reportQty:100000, goodQty:100000, scrapQty:0, keyData:{'制粒机转速':'200rpm','制粒时间':'90min','粘合剂':'10%PVP-K30溶液','加液速度':'500ml/min'} },
    { seq:3,  opNo:'OP-25', opName:'流化床干燥',   stage:'S2-制粒',  workCenter:'WS-NJ-SOLID', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-01 11:50', completedAt:'2026-06-01 13:50', operatorName:'陈国华（OP001）', teamName:'南京甲班', equipId:'EQ-NJ-FBD-001', equipName:'流化床干燥机1号', reportQty:100000, goodQty:99800, scrapQty:200, keyData:{'进风温度':'65℃','出风温度':'42℃','干燥时间':'120min','颗粒水分':'2.1%（标准≤3.0%）'} },
    { seq:4,  opNo:'OP-30', opName:'整粒总混',     stage:'S2-制粒',  workCenter:'WS-NJ-SOLID', isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-01 14:00', completedAt:'2026-06-01 15:30', operatorName:'孙建国（OP002）', teamName:'南京甲班', equipId:'EQ-NJ-MIX-001', equipName:'三维混合机1号', reportQty:99800, goodQty:99800, scrapQty:0, keyData:{'整粒网目':'20目','混合时间':'20min','混合均匀RSD':'1.8%（标准≤5%）'} },
    { seq:5,  opNo:'OP-40', opName:'压片',         stage:'S3-压片',  workCenter:'WS-NJ-TABLET', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-01 16:00', completedAt:'2026-06-01 19:55', operatorName:'孙建国（OP002）', teamName:'南京甲班', equipId:'EQ-NJ-PRESS-001', equipName:'旋转压片机1号', reportQty:99800, goodQty:99600, scrapQty:200, keyData:{'压片速度':'80000粒/h','主压力':'12kN','预压力':'3kN','片重':'525mg±5%','硬度':'6.2kP（标准≥5kP）','脆碎度':'0.2%（标准≤0.5%）'} },
    { seq:6,  opNo:'OP-45', opName:'包衣',         stage:'S3-压片',  workCenter:'WS-NJ-TABLET', isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-02 08:10', completedAt:'2026-06-02 10:30', operatorName:'孙建国（OP002）', teamName:'南京乙班', equipId:'EQ-NJ-COAT-001', equipName:'薄膜包衣机1号', reportQty:99600, goodQty:99600, scrapQty:0, keyData:{'包衣液':'欧巴代 OY-LS-28920','包衣增重':'3.0%','进风温度':'55℃','包衣时间':'180min'} },
    { seq:7,  opNo:'OP-50', opName:'铝塑内包',     stage:'S4-内包',  workCenter:'WS-NJ-PACK',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-02 10:45', completedAt:'2026-06-02 14:30', operatorName:'赵丽（OP003）', teamName:'南京乙班', equipId:'EQ-NJ-ALUP-001', equipName:'铝塑包装机1号', reportQty:99600, goodQty:99400, scrapQty:200, keyData:{'铝塑批号':'PK-ALUPLA-20260601-A','热封温度':'185℃','热封压力':'0.4MPa','装量检查':'100粒/板，每小时5板检查'} },
    { seq:8,  opNo:'OP-55', opName:'中间体暂存',   stage:'S4-内包',  workCenter:'WS-NJ-WH',    isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-02 14:40', completedAt:'2026-06-02 15:00', operatorName:'赵丽（OP003）', teamName:'南京乙班', reportQty:99400, goodQty:99400, scrapQty:0 },
    { seq:9,  opNo:'OP-60', opName:'装瓶外包',     stage:'S5-外包',  workCenter:'WS-NJ-PACK',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-02 15:10', completedAt:'2026-06-02 18:30', operatorName:'赵丽（OP003）', teamName:'南京乙班', equipId:'EQ-NJ-BOT-001', equipName:'自动装瓶线1号', reportQty:99400, goodQty:99200, scrapQty:200, keyData:{'瓶型':'HDPE白瓶 100mL','瓶盖':'铝箔感应盖','说明书':'TMJ-VitC-PI-V20','标签':'TMJ-VitC-LB-V20'} },
    { seq:10, opNo:'OP-65', opName:'装盒打码',     stage:'S5-外包',  workCenter:'WS-NJ-PACK',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-02 18:40', completedAt:'2026-06-02 21:45', operatorName:'赵丽（OP003）', teamName:'南京乙班', equipId:'EQ-NJ-CODE-001', equipName:'喷码机2号', reportQty:99200, goodQty:99200, scrapQty:0, keyData:{'批号打印':'TMJ-VITC-20260601-001','生产日期':'20260601','有效期':'20280601','条码核验':'通过'} },
    { seq:11, opNo:'OP-70', opName:'待检暂存',     stage:'S6-检验',  workCenter:'WS-NJ-QC',    isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-02 21:50', completedAt:'2026-06-03 08:30', operatorName:'冯小丽（QC001）', teamName:'南京质量组', reportQty:99200, goodQty:99200, scrapQty:0 },
    { seq:12, opNo:'OP-80', opName:'成品检验',     stage:'S6-检验',  workCenter:'WS-NJ-QC',    isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-03 08:30', completedAt:'2026-06-03 16:00', operatorName:'冯小丽（QC001）', teamName:'南京质量组', equipId:'EQ-NJ-HPLC-001', equipName:'HPLC高效液相色谱仪-001', reportQty:99200, goodQty:99200, scrapQty:0, keyData:{'VitC含量':'497.8mg/粒（标准450~550mg/粒）','溶出度':'88.5%（标准≥80%）','崩解时限':'12min（标准≤15min）','微生物限度':'菌落总数350 CFU/g，合格','水分':'3.2%（标准≤5.0%）'} },
    { seq:13, opNo:'OP-90', opName:'质量放行',     stage:'S7-放行',  workCenter:'WS-NJ-QA',    isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-03 16:10', completedAt:'2026-06-03 16:50', operatorName:'张丽华（QA经理）', teamName:'南京质量组', reportQty:99200, goodQty:99200, scrapQty:0, keyData:{'放行人':'张丽华','放行文件':'QR-20260603-001','有效期':'2028-06-01','储存条件':'≤25℃，阴凉干燥，避光'} },
    { seq:14, opNo:'OP-95', opName:'成品入库',     stage:'S7-放行',  workCenter:'WS-NJ-WH',    isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-03 17:00', completedAt:'2026-06-03 17:20', operatorName:'冯小丽（QC001）', teamName:'南京质量组', reportQty:99200, goodQty:99200, scrapQty:0 },
  ],

  planQtyTotal: 100000, reportQtyTotal: 99200, goodQtyTotal: 99200, scrapQtyTotal: 800,
  yieldRate: 99.20,

  inspectionRecords: [
    {
      taskId: 'IT001', taskNo: 'IT-20260601-001',
      schemeCode: 'ISP-IQC-VITC', schemeName: '维生素C原料来料检验', schemeType: 'IQC',
      batchNo: 'RM-VITC-20260601-001', totalQty: 52500, sampleQty: 200,
      inspectorName: '冯小丽(QC001)', checkerName: '张丽华(QA经理)',
      instrumentName: 'HPLC高效液相色谱仪-001(HPLC-NJ-001)',
      startTime: '2026-06-01 07:00', completeTime: '2026-06-01 08:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'vitc_content', itemName:'VitC含量(HPLC)', category:'CHEMICAL', isCritical:true,  standardValue:'≥99.5%',    unit:'%',     actualValue:99.8,    result:'PASS' },
        { itemCode:'heavy_metal',  itemName:'重金属',          category:'CHEMICAL', isCritical:true,  standardValue:'≤10 ppm',   unit:'ppm',   actualValue:2.1,     result:'PASS' },
        { itemCode:'moisture',     itemName:'水分',            category:'PHYSICAL', isCritical:true,  standardValue:'≤0.5%',     unit:'%',     actualValue:0.2,     result:'PASS' },
        { itemCode:'appearance',   itemName:'外观（色泽/均匀）', category:'APPEARANCE', isCritical:true, standardValue:'白色结晶性粉末', actualValue:'符合', result:'PASS' },
        { itemCode:'coa_cert',     itemName:'原料检验报告COA', category:'DOCUMENT', isCritical:true,  actualValue:'已确认', result:'PASS' },
      ],
    },
    {
      taskId: 'IT003', taskNo: 'IT-20260601-003',
      schemeCode: 'ISP-IPQC-GRAN', schemeName: '制粒中间体检验（IPQC）', schemeType: 'IPQC_FIRST',
      opNo: 'OP-20', batchNo: 'TMJ-VITC-20260601-001', totalQty: 100000, sampleQty: 5,
      inspectorName: '冯小丽(QC001)', instrumentName: '水分测定仪-001(MOI-NJ-001)',
      startTime: '2026-06-01 11:45', completeTime: '2026-06-01 12:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'gran_moisture', itemName:'颗粒水分',     category:'PHYSICAL', isCritical:true,  standardValue:'≤3.0%',    unit:'%',  actualValue:2.1,   result:'PASS' },
        { itemCode:'gran_size',     itemName:'颗粒粒径（目数）', category:'PHYSICAL', isCritical:false, standardValue:'过20目',               actualValue:'通过', result:'PASS' },
        { itemCode:'gran_appear',   itemName:'颗粒外观',     category:'APPEARANCE', isCritical:false, standardValue:'色泽均匀无结块', actualValue:'合格', result:'PASS' },
      ],
    },
    {
      taskId: 'IT004', taskNo: 'IT-20260601-004',
      schemeCode: 'ISP-IPQC-TABLET', schemeName: '压片过程检验（IPQC）', schemeType: 'IPQC_PATROL',
      opNo: 'OP-40', batchNo: 'TMJ-VITC-20260601-001', totalQty: 99800, sampleQty: 20,
      inspectorName: '冯小丽(QC001)', instrumentName: '片重差仪-001(WGT-NJ-001)',
      startTime: '2026-06-01 16:00', completeTime: '2026-06-01 17:30',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'tablet_wgt',    itemName:'片重差异',   category:'PHYSICAL', isCritical:true,  standardValue:'475~525mg', unit:'mg', actualValue:505,  result:'PASS' },
        { itemCode:'tablet_hard',   itemName:'硬度',       category:'PHYSICAL', isCritical:true,  standardValue:'≥5.0kP',   unit:'kP', actualValue:6.2,  result:'PASS' },
        { itemCode:'tablet_fria',   itemName:'脆碎度',     category:'PHYSICAL', isCritical:true,  standardValue:'≤0.5%',    unit:'%',  actualValue:0.2,  result:'PASS' },
        { itemCode:'tablet_disint', itemName:'崩解时限',   category:'PHYSICAL', isCritical:true,  standardValue:'≤15min',   unit:'min',actualValue:12,   result:'PASS' },
        { itemCode:'tablet_appear', itemName:'外观',       category:'APPEARANCE', isCritical:false, actualValue:'合格', result:'PASS' },
      ],
    },
    {
      taskId: 'IT005', taskNo: 'IT-20260603-001',
      schemeCode: 'ISP-FQC-VITC', schemeName: 'VitC咀嚼片成品检验', schemeType: 'FQC',
      batchNo: 'TMJ-VITC-20260601-001', totalQty: 99200, sampleQty: 200,
      inspectorName: '冯小丽(QC001)', checkerName: '张丽华(QA经理)',
      instrumentName: 'HPLC高效液相色谱仪-001(HPLC-NJ-001)',
      startTime: '2026-06-03 08:30', completeTime: '2026-06-03 16:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'vitc_final',  itemName:'VitC含量(HPLC)',  category:'CHEMICAL', isCritical:true,  standardValue:'450~550mg/粒', unit:'mg/粒', actualValue:497.8, result:'PASS' },
        { itemCode:'dissolve',    itemName:'溶出度',          category:'CHEMICAL', isCritical:true,  standardValue:'≥80%',         unit:'%',     actualValue:88.5,  result:'PASS' },
        { itemCode:'wgt_diff',    itemName:'片重差异',        category:'PHYSICAL', isCritical:true,  standardValue:'±5%',          unit:'mg',    actualValue:502,   result:'PASS' },
        { itemCode:'hardness',    itemName:'硬度',            category:'PHYSICAL', isCritical:false, standardValue:'≥5.0kP',       unit:'kP',    actualValue:6.0,   result:'PASS' },
        { itemCode:'disint',      itemName:'崩解时限',        category:'PHYSICAL', isCritical:true,  standardValue:'≤15min',       unit:'min',   actualValue:12,    result:'PASS' },
        { itemCode:'moisture',    itemName:'水分',            category:'PHYSICAL', isCritical:true,  standardValue:'≤5.0%',        unit:'%',     actualValue:3.2,   result:'PASS' },
        { itemCode:'micro_total', itemName:'菌落总数',        category:'MICROBIAL',isCritical:true,  standardValue:'≤1000 CFU/g',  unit:'CFU/g', actualValue:350,   result:'PASS' },
        { itemCode:'ecoli',       itemName:'大肠菌群',        category:'MICROBIAL',isCritical:true,  standardValue:'未检出',                     actualValue:'未检出', result:'PASS' },
        { itemCode:'appearance',  itemName:'片剂外观',        category:'APPEARANCE',isCritical:true, standardValue:'色泽均匀，无斑点',           actualValue:'合格', result:'PASS' },
        { itemCode:'pkg_integ',   itemName:'包装完整性',      category:'DOCUMENT', isCritical:true,  standardValue:'密封完好，无漏气',           actualValue:'合格', result:'PASS' },
        { itemCode:'label_chk',   itemName:'标签/批号核对',   category:'DOCUMENT', isCritical:true,  actualValue:'已确认', result:'PASS' },
      ],
    },
  ],

  deviations: [],

  signatures: [
    { role:'称量配料操作员',  name:'陈国华（OP001）', signedAt:'2026-06-01 09:00' },
    { role:'制粒干燥操作员',  name:'陈国华（OP001）', signedAt:'2026-06-01 13:50' },
    { role:'压片包衣操作员',  name:'孙建国（OP002）', signedAt:'2026-06-02 10:30' },
    { role:'内包装操作员',    name:'赵丽（OP003）',   signedAt:'2026-06-02 14:30' },
    { role:'外包装操作员',    name:'赵丽（OP003）',   signedAt:'2026-06-02 21:45' },
    { role:'QC检验员',        name:'冯小丽（QC001）', signedAt:'2026-06-03 16:00' },
    { role:'QA经理审核',      name:'张丽华（QA经理）',signedAt:'2026-06-03 16:45' },
    { role:'批准放行',        name:'张丽华（QA经理）',signedAt:'2026-06-03 16:50' },
  ],

  startTime: '2026-06-01 08:15',
  endTime:   '2026-06-03 17:20',
  createdAt: '2026-06-01 08:15',
  updatedAt: '2026-06-03 17:20',

  reviewedBy: '冯小丽（QC001）', reviewedAt: '2026-06-03 16:00',
  reviewRemark: '批次记录完整，全线14道工序操作员均已签名；关键工序（称量/制粒/压片/铝塑/成品检验）工艺参数均在规格范围内；VitC含量497.8mg/粒，符合GB 14754-2010标准；微生物限度检验通过。',
  approvedBy: '张丽华（QA经理，南京）', approvedAt: '2026-06-03 16:50',
  approveRemark: '本批次维生素C咀嚼片（批号：TMJ-VITC-20260601-001）全项检验合格，物料平衡率符合GMP要求，批准放行。有效期至2028-06-01，存储条件：≤25℃阴凉干燥避光。',
};

/**
 * WO003 / WO-20260612-003 — VitC咀嚼片 500mg（南京工厂）— 生产进行中（压片段完成约50%）
 * 数据来源：workOrderData WO003（IN_PROGRESS，progressPct:50，currentOp:'OP-40'）
 * 包含IPQC偏差：压片过程片重差异偏高，已记录开单处理
 */
const EBR_WO001: EbrRecord = {
  id: 'EBR_WO001',
  ebrNo: 'EBR-20260612-001',
  status: 'IN_PROGRESS',

  poId: 'PO002', poNo: 'MO-20260601-002', soNo: undefined,
  routingCode: 'TMJ-VITC-WG-V20',
  routingName: 'VitC咀嚼片湿法制粒工艺路径 V2.0',
  bomVersion: '2.0',

  woId: 'WO003', woNo: 'WO-20260612-003',
  batchNo: 'TMJ-VITC-20260612-003',
  productCode: 'FG-VITC-500MG-AP',
  productName: '维生素C咀嚼片',
  productSpec: '500mg/粒 铝塑包装 100粒/瓶',
  planQty: 50000,
  customer: undefined,
  deliveryDate: '2026-06-20',
  priority: 'NORMAL',

  tasks: [
    {
      taskNo: 'TK-20260612-003-A1',
      workCenter: '称量间/固体制剂车间',
      shiftName: '白班',
      team: '南京甲班',
      operator: '陈国华（班组长）',
      stationScope: 'S1称量(OP-10) → S2制粒干燥(OP-20,OP-25) → S3总混整粒(OP-30)',
      padStation: 'PAD-NJ-SOLID-01',
      status: 'DONE',
      planStart: '2026-06-12 08:00', planEnd: '2026-06-12 20:00',
      actualStart: '2026-06-12 08:20', actualEnd: '2026-06-12 19:50',
      reportQty: 50000, scrapQty: 100,
    },
    {
      taskNo: 'TK-20260612-003-A2',
      workCenter: '压片车间',
      shiftName: '白班',
      team: '南京乙班',
      operator: '王磊（班组长）',
      stationScope: 'S4压片包衣(OP-40,OP-45)',
      padStation: 'PAD-NJ-TABLET-01',
      status: 'IN_PROGRESS',
      planStart: '2026-06-13 08:00', planEnd: '2026-06-13 18:00',
      actualStart: '2026-06-13 08:30',
      reportQty: 25000, scrapQty: 150,
    },
    {
      taskNo: 'TK-20260612-003-B1',
      workCenter: '包装车间/检验室/仓库',
      shiftName: '白班',
      team: '南京乙班',
      operator: '赵丽（OP003）',
      stationScope: 'S5内包铝塑(OP-50) → S6外包装盒(OP-60,OP-65) → S7成品检验(OP-80) → S8放行入库(OP-90,OP-95)',
      padStation: 'PAD-NJ-PACK-01',
      status: 'PENDING',
      planStart: '2026-06-14 08:00', planEnd: '2026-06-15 18:00',
    },
  ],
  floatTickets: [
    { ticketNo:'FT-20260612-003-01', qty:17000, status:'IN_USE', currentOp:'OP-40 压片', currentStageName:'S4-压片', operatorName:'王磊', lastUpdateTime:'2026-06-13 10:20' },
    { ticketNo:'FT-20260612-003-02', qty:17000, status:'IN_USE', currentOp:'OP-40 压片', currentStageName:'S4-压片', operatorName:'王磊', lastUpdateTime:'2026-06-13 11:30' },
    { ticketNo:'FT-20260612-003-03', qty:16000, status:'WAITING', lastUpdateTime:'2026-06-12 19:50' },
  ],

  materialLotNo: 'RM-VITC-20260612-003',
  materialSpec: 'L-抗坏血酸 药用级 ≥99.5% GB 14754-2010',
  iqcResult: 'PASS',

  routingSteps: [
    { seq:1,  opNo:'OP-10', opName:'称量配料',     stage:'S1-称量', workCenter:'WS-NJ-WEIGH',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-12 08:20', completedAt:'2026-06-12 09:10', operatorName:'陈国华（OP001）', teamName:'南京甲班', reportQty:50000, goodQty:50000, scrapQty:0 },
    { seq:2,  opNo:'OP-20', opName:'制粒（湿法）', stage:'S2-制粒', workCenter:'WS-NJ-SOLID',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-12 09:20', completedAt:'2026-06-12 11:50', operatorName:'陈国华（OP001）', teamName:'南京甲班', reportQty:50000, goodQty:50000, scrapQty:0, keyData:{'制粒机':'EQ-NJ-GRAN-001','制粒时间':'90min'} },
    { seq:3,  opNo:'OP-25', opName:'流化床干燥',   stage:'S2-制粒', workCenter:'WS-NJ-SOLID',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-12 12:00', completedAt:'2026-06-12 14:00', operatorName:'陈国华（OP001）', teamName:'南京甲班', reportQty:50000, goodQty:49900, scrapQty:100, keyData:{'进风温度':'65℃','颗粒水分':'2.3%'} },
    { seq:4,  opNo:'OP-30', opName:'整粒总混',     stage:'S2-制粒', workCenter:'WS-NJ-SOLID',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-12 14:10', completedAt:'2026-06-12 15:30', operatorName:'孙建国（OP002）', teamName:'南京甲班', reportQty:49900, goodQty:49900, scrapQty:0 },
    { seq:5,  opNo:'OP-40', opName:'压片',         stage:'S3-压片', workCenter:'WS-NJ-TABLET', isKeyOp:true,  mandatoryInspection:true,  status:'IN_PROGRESS', startedAt:'2026-06-13 08:30', operatorName:'王磊（OP004）', teamName:'南京乙班', reportQty:25000, goodQty:24850, scrapQty:150, keyData:{'压片速度':'80000粒/h','主压力':'12kN','片重抽检':'偏高，已记录偏差'} },
    { seq:6,  opNo:'OP-45', opName:'包衣',         stage:'S3-压片', workCenter:'WS-NJ-TABLET', isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:7,  opNo:'OP-50', opName:'铝塑内包',     stage:'S4-内包', workCenter:'WS-NJ-PACK',   isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:8,  opNo:'OP-55', opName:'中间体暂存',   stage:'S4-内包', workCenter:'WS-NJ-WH',     isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:9,  opNo:'OP-60', opName:'装瓶外包',     stage:'S5-外包', workCenter:'WS-NJ-PACK',   isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:10, opNo:'OP-65', opName:'装盒打码',     stage:'S5-外包', workCenter:'WS-NJ-PACK',   isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:11, opNo:'OP-70', opName:'待检暂存',     stage:'S6-检验', workCenter:'WS-NJ-QC',     isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:12, opNo:'OP-80', opName:'成品检验',     stage:'S6-检验', workCenter:'WS-NJ-QC',     isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:13, opNo:'OP-90', opName:'质量放行',     stage:'S7-放行', workCenter:'WS-NJ-QA',     isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:14, opNo:'OP-95', opName:'成品入库',     stage:'S7-放行', workCenter:'WS-NJ-WH',     isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
  ],

  planQtyTotal: 50000, reportQtyTotal: 25000, goodQtyTotal: 24850, scrapQtyTotal: 250,
  yieldRate: 97.80,

  inspectionRecords: [
    {
      taskId: 'IT-IQC-WO3', taskNo: 'IT-20260612-003',
      schemeCode: 'ISP-IQC-VITC', schemeName: '维生素C原料来料检验', schemeType: 'IQC',
      batchNo: 'RM-VITC-20260612-003', totalQty: 26250, sampleQty: 100,
      inspectorName: '冯小丽(QC001)', checkerName: '张丽华(QA经理)',
      instrumentName: 'HPLC高效液相色谱仪-001',
      startTime: '2026-06-12 07:00', completeTime: '2026-06-12 08:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'vitc_content', itemName:'VitC含量(HPLC)', category:'CHEMICAL', isCritical:true,  standardValue:'≥99.5%', unit:'%', actualValue:99.7, result:'PASS' },
        { itemCode:'appearance',   itemName:'外观',            category:'APPEARANCE', isCritical:true, actualValue:'白色结晶性粉末，符合', result:'PASS' },
        { itemCode:'coa_cert',     itemName:'原料COA',        category:'DOCUMENT',  isCritical:true,  actualValue:'已确认',   result:'PASS' },
      ],
    },
    {
      taskId: 'IT-IPQC-TAB-WO3', taskNo: 'IT-20260613-001',
      schemeCode: 'ISP-IPQC-TABLET', schemeName: '压片过程检验（IPQC）', schemeType: 'IPQC_PATROL',
      opNo: 'OP-40', batchNo: 'TMJ-VITC-20260612-003', totalQty: 25000, sampleQty: 20,
      inspectorName: '冯小丽(QC001)',
      startTime: '2026-06-13 09:00',
      conclusion: undefined, releaseStatus: 'PENDING',
      items: [
        { itemCode:'tablet_wgt',    itemName:'片重差异',  category:'PHYSICAL', isCritical:true,  standardValue:'475~525mg', unit:'mg', actualValue:538, result:'FAIL' },
        { itemCode:'tablet_hard',   itemName:'硬度',      category:'PHYSICAL', isCritical:true,  standardValue:'≥5.0kP',   unit:'kP', actualValue:5.8, result:'PASS' },
        { itemCode:'tablet_disint', itemName:'崩解时限',  category:'PHYSICAL', isCritical:true,  standardValue:'≤15min',   unit:'min',actualValue:13,  result:'PASS' },
      ],
    },
  ],

  deviations: [
    {
      id: 'DEV-20260613-001',
      opNo: 'OP-40', opName: '压片',
      type: '工艺偏差',
      description: '压片过程IPQC检验片重差异超标（实测538mg，标准475~525mg），已暂停本批次继续生产，启动偏差调查',
      discoveredAt: '2026-06-13 09:30',
      discoveredBy: '冯小丽（QC001）',
      disposition: '暂停生产，调整压片机主压力参数（12kN→11.5kN），重新首件检验通过后恢复生产；不合格片子150g隔离待处置',
      impactQty: 150,
    },
  ],

  signatures: [
    { role:'称量配料操作员', name:'陈国华（OP001）', signedAt:'2026-06-12 09:10' },
    { role:'制粒干燥操作员', name:'陈国华（OP001）', signedAt:'2026-06-12 14:00' },
    { role:'压片操作员（进行中）', name:'王磊（OP004）', signedAt:'2026-06-13 08:30' },
  ],

  startTime: '2026-06-12 08:20',
  createdAt: '2026-06-12 08:20',
  updatedAt: new Date().toLocaleString('zh-CN'),
};

/**
 * WO004 / WO-20260601-002 — 复合益生菌胶囊 250mg（溧水工厂，冷链工艺路径，10道工序）— 已批准放行
 * 数据来源：workOrderData WO004（COMPLETED，actualQty:495000，scrapQty:5000）
 * 检验：IT006 成品FQC（活菌数1.28×10⁹ CFU/粒，沙门氏菌未检出，PASS），QR002已放行
 */
const EBR_WO006: EbrRecord = {
  id: 'EBR_WO006',
  ebrNo: 'EBR-20260605-002',
  status: 'APPROVED',

  poId: 'PO004', poNo: 'MO-20260601-002', soNo: undefined,
  routingCode: 'TMJ-PROBIO-CAP-V15',
  routingName: '益生菌胶囊冷链工艺路径 V1.5',
  bomVersion: '1.5',

  woId: 'WO004', woNo: 'WO-20260601-002',
  batchNo: 'TMJ-PROBIO-20260601-001',
  productCode: 'FG-PROBIO-CAP-250',
  productName: '复合益生菌胶囊',
  productSpec: '250mg/粒 铝塑泡罩 60粒/盒',
  planQty: 500000,
  customer: undefined,
  deliveryDate: '2026-06-08',
  priority: 'HIGH',

  tasks: [
    {
      taskNo: 'TK-20260601-002-LS1',
      workCenter: '溧水冷链备料间',
      shiftName: '白班',
      team: '溧水甲班',
      operator: '李志远（班组长）',
      stationScope: 'S1备料验收(OP-10) → S2称量配料(OP-20) → S3混合填充(OP-30)',
      padStation: 'PAD-LS-PROBIO-01',
      status: 'DONE',
      planStart: '2026-06-01 08:00', planEnd: '2026-06-01 20:00',
      actualStart: '2026-06-01 08:00', actualEnd: '2026-06-01 19:30',
      reportQty: 500000, scrapQty: 2000,
    },
    {
      taskNo: 'TK-20260601-002-LS2',
      workCenter: '溧水胶囊填充车间',
      shiftName: '白班',
      team: '溧水乙班',
      operator: '郑伟（OP006）',
      stationScope: 'S4胶囊填充(OP-40) → S5铝塑内包(OP-50) → S6装盒外包(OP-60)',
      padStation: 'PAD-LS-PACK-01',
      status: 'DONE',
      planStart: '2026-06-02 08:00', planEnd: '2026-06-03 08:00',
      actualStart: '2026-06-02 08:20', actualEnd: '2026-06-03 07:40',
      reportQty: 498000, scrapQty: 2000,
    },
    {
      taskNo: 'TK-20260601-002-LS3',
      workCenter: '溧水检验室/冷库',
      shiftName: '白班',
      team: '溧水质量组',
      operator: '赵雪梅（QA经理）',
      stationScope: 'S7成品检验(OP-70) → S8质量放行(OP-80) → S9冷链入库(OP-90)',
      padStation: 'PAD-LS-QC-01',
      status: 'DONE',
      planStart: '2026-06-03 08:00', planEnd: '2026-06-05 18:00',
      actualStart: '2026-06-03 08:00', actualEnd: '2026-06-05 17:00',
      reportQty: 495000, scrapQty: 1000,
    },
  ],
  floatTickets: [
    { ticketNo:'FT-20260601-002-01', qty:165000, status:'ARCHIVED', currentOp:'OP-90 冷链入库（≤8℃）', lastUpdateTime:'2026-06-05 16:00' },
    { ticketNo:'FT-20260601-002-02', qty:165000, status:'ARCHIVED', currentOp:'OP-90 冷链入库（≤8℃）', lastUpdateTime:'2026-06-05 16:30' },
    { ticketNo:'FT-20260601-002-03', qty:165000, status:'ARCHIVED', currentOp:'OP-90 冷链入库（≤8℃）', lastUpdateTime:'2026-06-05 17:00' },
  ],

  materialLotNo: 'RM-PROBIO-LA-20260601-001',
  materialSpec: '乳酸杆菌菌粉 ≥2×10¹⁰ CFU/g，冷链接收≤2℃ GB/T 4789.35',
  iqcResult: 'PASS',

  routingSteps: [
    { seq:1,  opNo:'OP-10', opName:'原料接收验收',       stage:'S1-备料',  workCenter:'WS-LS-WH',     isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-01 08:00', completedAt:'2026-06-01 09:00', operatorName:'李志远（OP005）', teamName:'溧水甲班', reportQty:500000, goodQty:500000, scrapQty:0, keyData:{'菌粉接收温度':'2.5℃（标准≤2℃，偏差已记录）','冷链车温度记录':'全程≤4℃','批号核对':'已确认'} },
    { seq:2,  opNo:'OP-20', opName:'称量配料（冷链）',   stage:'S1-备料',  workCenter:'WS-LS-PROBIO', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-01 09:10', completedAt:'2026-06-01 10:30', operatorName:'李志远（OP005）', teamName:'溧水甲班', reportQty:500000, goodQty:500000, scrapQty:0, keyData:{'操作温度':'5.2℃（标准≤8℃）','乳酸杆菌菌粉':'12.5kg','双歧杆菌菌粉':'6.3kg','菊粉（益生元）':'6.0kg','复核人':'郑伟'} },
    { seq:3,  opNo:'OP-30', opName:'低温混合',           stage:'S2-混合',  workCenter:'WS-LS-PROBIO', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-01 10:40', completedAt:'2026-06-01 12:00', operatorName:'李志远（OP005）', teamName:'溧水甲班', equipId:'EQ-LS-MIX-001', equipName:'低温三维混合机（溧水）', reportQty:500000, goodQty:498000, scrapQty:2000, keyData:{'混合机温度':'4.5℃','混合时间':'30min','混合均匀RSD':'2.1%（标准≤5%）'} },
    { seq:4,  opNo:'OP-40', opName:'胶囊填充（冷链）',   stage:'S3-填充',  workCenter:'WS-LS-PROBIO', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-02 08:20', completedAt:'2026-06-02 14:00', operatorName:'郑伟（OP006）', teamName:'溧水乙班', equipId:'EQ-LS-CAP-001', equipName:'胶囊填充机（溧水）', reportQty:498000, goodQty:496000, scrapQty:2000, keyData:{'填充环境温度':'6.0℃（标准≤8℃）','填充速度':'60000粒/h','装量差异':'±4%（标准±5%）','空胶囊批号':'CAP-GEL-20260530-A'} },
    { seq:5,  opNo:'OP-45', opName:'中间体暂存（冷链）', stage:'S3-填充',  workCenter:'WS-LS-WH',     isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-02 14:10', completedAt:'2026-06-02 15:00', operatorName:'郑伟（OP006）', teamName:'溧水乙班', reportQty:496000, goodQty:496000, scrapQty:0, keyData:{'暂存温度':'3.2℃（标准≤8℃）'} },
    { seq:6,  opNo:'OP-50', opName:'铝塑泡罩包装',       stage:'S4-内包',  workCenter:'WS-LS-PACK',   isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-02 15:10', completedAt:'2026-06-03 07:40', operatorName:'郑伟（OP006）', teamName:'溧水乙班', equipId:'EQ-LS-ALUP-001', equipName:'泡罩包装机（溧水）', reportQty:496000, goodQty:496000, scrapQty:0, keyData:{'铝塑批号':'PK-BLI-PROBIO-20260601-A','热封温度':'180℃','密封性检查':'100%通过'} },
    { seq:7,  opNo:'OP-60', opName:'装盒外包',           stage:'S5-外包',  workCenter:'WS-LS-PACK',   isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-03 08:00', completedAt:'2026-06-03 14:00', operatorName:'郑伟（OP006）', teamName:'溧水乙班', reportQty:496000, goodQty:495000, scrapQty:1000, keyData:{'纸盒批号':'BX-PROBIO-V20260601-A','批号打印':'TMJ-PROBIO-20260601-001','冷链标识':'2~8℃储运标贴已贴附'} },
    { seq:8,  opNo:'OP-70', opName:'成品检验',           stage:'S6-检验',  workCenter:'WS-LS-QC',     isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-03 08:00', completedAt:'2026-06-05 16:00', operatorName:'王小芳（QC002）', teamName:'溧水质量组', equipId:'EQ-LS-CFU-001', equipName:'活菌计数仪-001（溧水）', reportQty:495000, goodQty:495000, scrapQty:0, keyData:{'活菌数':'1.28×10⁹ CFU/粒（标准≥1×10⁹）','菌落总数':'280 CFU/g（标准≤1000）','大肠菌群':'未检出','沙门氏菌':'未检出','水分':'3.8%（标准≤5%）'} },
    { seq:9,  opNo:'OP-80', opName:'质量放行',           stage:'S7-放行',  workCenter:'WS-LS-QA',     isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-05 16:10', completedAt:'2026-06-05 16:50', operatorName:'赵雪梅（QA经理）', teamName:'溧水质量组', reportQty:495000, goodQty:495000, scrapQty:0, keyData:{'放行人':'赵雪梅','放行文件':'QR-20260605-002','有效期':'2027-06-01','储存条件':'2~8℃冷链储运'} },
    { seq:10, opNo:'OP-90', opName:'冷链入库（≤8℃）',   stage:'S7-放行',  workCenter:'WS-LS-WH',     isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-05 17:00', completedAt:'2026-06-05 17:20', operatorName:'王小芳（QC002）', teamName:'溧水质量组', reportQty:495000, goodQty:495000, scrapQty:0, keyData:{'冷库货位':'LS-COLD-A03','入库温度':'3.1℃（标准2~8℃）'} },
  ],

  planQtyTotal: 500000, reportQtyTotal: 495000, goodQtyTotal: 495000, scrapQtyTotal: 5000,
  yieldRate: 99.00,

  inspectionRecords: [
    {
      taskId: 'IT002', taskNo: 'IT-20260601-002',
      schemeCode: 'ISP-IQC-PROBIO', schemeName: '益生菌菌粉来料检验', schemeType: 'IQC',
      batchNo: 'RM-PROBIO-LA-20260601-001', totalQty: 18800, sampleQty: 100,
      inspectorName: '王小芳(QC002)', checkerName: '赵雪梅(QA经理)',
      instrumentName: '活菌计数仪-001（溧水）(CFU-LS-001)',
      startTime: '2026-06-01 07:00', completeTime: '2026-06-01 08:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'cfu_count',    itemName:'活菌数',         category:'CHEMICAL',  isCritical:true,  standardValue:'≥2×10¹⁰ CFU/g',   unit:'CFU/g',actualValue:'2.3×10¹⁰', result:'PASS' },
        { itemCode:'cold_recv',    itemName:'冷链接收温度',   category:'PHYSICAL',  isCritical:true,  standardValue:'≤2℃',             unit:'℃',    actualValue:2.5,  result:'PASS', },
        { itemCode:'micro_total',  itemName:'菌落总数（杂菌）', category:'MICROBIAL', isCritical:true,  standardValue:'≤100 CFU/g',     unit:'CFU/g',actualValue:12,   result:'PASS' },
        { itemCode:'salmonella',   itemName:'沙门氏菌',       category:'MICROBIAL', isCritical:true,  standardValue:'未检出',                      actualValue:'未检出', result:'PASS' },
        { itemCode:'coa_cert',     itemName:'原料COA',        category:'DOCUMENT',  isCritical:true,  actualValue:'已确认', result:'PASS' },
      ],
    },
    {
      taskId: 'IT-IPQC-FILL', taskNo: 'IT-20260602-001',
      schemeCode: 'ISP-IPQC-CAP', schemeName: '胶囊填充过程检验（IPQC）', schemeType: 'IPQC_PATROL',
      opNo: 'OP-40', batchNo: 'TMJ-PROBIO-20260601-001', totalQty: 498000, sampleQty: 20,
      inspectorName: '王小芳(QC002)', instrumentName: '活菌计数仪-001（溧水）',
      startTime: '2026-06-02 10:00', completeTime: '2026-06-02 10:30',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'fill_temp',  itemName:'填充环境温度',  category:'PHYSICAL',  isCritical:true,  standardValue:'≤8℃',  unit:'℃',    actualValue:6.0,   result:'PASS' },
        { itemCode:'fill_var',   itemName:'装量差异',     category:'PHYSICAL',  isCritical:true,  standardValue:'≤±5%', unit:'%',     actualValue:4,     result:'PASS' },
        { itemCode:'cfu_inline', itemName:'活菌数抽测',   category:'CHEMICAL',  isCritical:true,  standardValue:'≥1×10⁹ CFU/粒', unit:'CFU/粒', actualValue:'1.31×10⁹', result:'PASS' },
      ],
    },
    {
      taskId: 'IT006', taskNo: 'IT-20260604-001',
      schemeCode: 'ISP-FQC-PROBIO', schemeName: '复合益生菌胶囊成品检验', schemeType: 'FQC',
      batchNo: 'TMJ-PROBIO-20260601-001', totalQty: 495000, sampleQty: 200,
      inspectorName: '王小芳(QC002)', checkerName: '赵雪梅(QA经理)',
      instrumentName: '活菌计数仪-001（溧水）(CFU-LS-001) / 冷链温度记录仪-001(TMP-LS-001)',
      startTime: '2026-06-03 08:00', completeTime: '2026-06-05 16:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode:'cfu_final',   itemName:'活菌数（乳酸杆菌）', category:'CHEMICAL',  isCritical:true,  standardValue:'≥1×10⁹ CFU/粒', unit:'CFU/粒', actualValue:'1.28×10⁹', result:'PASS' },
        { itemCode:'fill_weight', itemName:'装量差异',           category:'PHYSICAL',  isCritical:true,  standardValue:'±5%',           unit:'mg',    actualValue:248, result:'PASS' },
        { itemCode:'micro_total', itemName:'菌落总数',           category:'MICROBIAL', isCritical:true,  standardValue:'≤1000 CFU/g',   unit:'CFU/g', actualValue:280, result:'PASS' },
        { itemCode:'ecoli',       itemName:'大肠菌群',           category:'MICROBIAL', isCritical:true,  standardValue:'未检出',                      actualValue:'未检出', result:'PASS' },
        { itemCode:'salmonella',  itemName:'沙门氏菌',           category:'MICROBIAL', isCritical:true,  standardValue:'未检出',                      actualValue:'未检出', result:'PASS' },
        { itemCode:'moisture',    itemName:'水分',               category:'PHYSICAL',  isCritical:true,  standardValue:'≤5%',           unit:'%',     actualValue:3.8, result:'PASS' },
        { itemCode:'cold_temp',   itemName:'冷链温度记录',       category:'PHYSICAL',  isCritical:true,  standardValue:'全程≤8℃',       unit:'℃',     actualValue:'最高3.1℃', result:'PASS' },
        { itemCode:'pkg_integ',   itemName:'铝塑密封完整性',     category:'DOCUMENT',  isCritical:true,  actualValue:'合格', result:'PASS' },
        { itemCode:'label_chk',   itemName:'冷链标签核对',       category:'DOCUMENT',  isCritical:true,  actualValue:'已确认', result:'PASS' },
      ],
    },
  ],

  deviations: [
    {
      id: 'DEV-20260601-LS001',
      opNo: 'OP-10', opName: '原料接收验收',
      type: '工艺偏差',
      description: '益生菌菌粉接收时冷链车温度记录显示2.5℃，略高于入库标准（≤2℃），已取样复检活菌数（1.98×10¹⁰ CFU/g），仍在规格范围内',
      discoveredAt: '2026-06-01 08:30',
      discoveredBy: '李志远（OP005）',
      disposition: '偏差已评估，活菌数复检通过，判断为可接受偏差，记录偏差报告DEV-20260601-LS001，QA签字关闭',
      closedAt: '2026-06-01 14:00',
      closedBy: '赵雪梅（QA经理）',
      impactQty: 0,
    },
  ],

  signatures: [
    { role:'原料验收操作员',    name:'李志远（OP005）',  signedAt:'2026-06-01 09:00' },
    { role:'冷链称量操作员',    name:'李志远（OP005）',  signedAt:'2026-06-01 10:30' },
    { role:'低温混合操作员',    name:'李志远（OP005）',  signedAt:'2026-06-01 12:00' },
    { role:'胶囊填充操作员',    name:'郑伟（OP006）',    signedAt:'2026-06-02 14:00' },
    { role:'铝塑内包操作员',    name:'郑伟（OP006）',    signedAt:'2026-06-03 07:40' },
    { role:'装盒外包操作员',    name:'郑伟（OP006）',    signedAt:'2026-06-03 14:00' },
    { role:'QC检验员（溧水）',  name:'王小芳（QC002）',  signedAt:'2026-06-05 16:00' },
    { role:'QA经理审核（溧水）',name:'赵雪梅（QA经理）', signedAt:'2026-06-05 16:45' },
    { role:'批准放行',          name:'赵雪梅（QA经理）', signedAt:'2026-06-05 16:50' },
  ],

  startTime: '2026-06-01 08:00',
  endTime:   '2026-06-05 17:20',
  createdAt: '2026-06-01 08:00',
  updatedAt: '2026-06-05 17:20',

  reviewedBy: '王小芳（QC002）', reviewedAt: '2026-06-05 16:00',
  reviewRemark: '溧水工厂益生菌胶囊批次记录完整，冷链全程温度监控记录合规（≤8℃），活菌数1.28×10⁹ CFU/粒符合标准（≥1×10⁹）；原料接收偏差（2.5℃）已按程序评估关闭；各关键工序GMP签名完整。',
  approvedBy: '赵雪梅（QA经理，溧水）', approvedAt: '2026-06-05 16:50',
  approveRemark: '本批次复合益生菌胶囊（批号：TMJ-PROBIO-20260601-001）全项检验合格，冷链工艺参数符合GMP要求，批准放行。储存条件：2~8℃，有效期2027-06-01。',
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

/** EBR-20260603-001（VitC咀嚼片，南京工厂）— 物料平衡表 */
export const MATERIAL_BALANCE_WO004: MaterialBalanceSheet = {
  batchNo: 'TMJ-VITC-20260601-001',
  ebrNo: 'EBR-20260603-001',
  productName: '维生素C咀嚼片',
  productSpec: '500mg/粒 铝塑包装 100粒/瓶',
  planQty: 100000,
  actualInputQty: 100000,
  actualOutputQty: 99200,
  totalScrapQty: 800,
  totalReturnQty: 0,
  overallBalanceRate: 99.20,
  overallYieldRate: 99.20,
  theoryLossRate: 0.80,
  balanceStatus: 'NORMAL',
  preparedBy: '赵丽（OP003）',
  reviewedBy: '张丽华（QA经理）',
  preparedAt: '2026-06-03 17:20',
  conclusion: '本批次物料平衡率99.20%，在理论损耗范围（±2%）内，符合GMP物料平衡要求。关键物料L-抗坏血酸实际使用量52.5kg，投料量核对无误。批准放行。',
  materialRows: [
    {
      lineNo: 1,
      itemCode: 'RM-VITC-ASC-001',
      itemName: 'L-抗坏血酸（维生素C）',
      itemSpec: '药用级 ≥99.5% GB 14754-2010',
      unit: 'kg',
      lotNo: 'RM-VITC-20260601-001',
      theoreticalQty: 52.50,
      actualInputQty: 52.50,
      actualOutputQty: 52.08,
      scrapQty: 0.42,
      returnQty: 0,
      lossQty: 0.42,
      theoreticalLossRate: 0.60,
      actualLossRate: 0.80,
      balanceRate: 99.20,
      lossReason: '制粒干燥过程水分蒸发损耗约0.2kg，压片报废约0.22kg',
      isMainMaterial: true,
      status: 'NORMAL',
    },
    {
      lineNo: 2,
      itemCode: 'EXC-STARCH-001',
      itemName: '玉米淀粉（赋形剂）',
      itemSpec: '药用级 GB/T 8885',
      unit: 'kg',
      lotNo: 'EXC-ST-20260530-A',
      theoreticalQty: 18.00,
      actualInputQty: 18.00,
      actualOutputQty: 17.86,
      scrapQty: 0.14,
      returnQty: 0,
      lossQty: 0.14,
      theoreticalLossRate: 0.50,
      actualLossRate: 0.78,
      balanceRate: 99.22,
      isMainMaterial: false,
      status: 'NORMAL',
    },
    {
      lineNo: 3,
      itemCode: 'PK-ALUPLA-001',
      itemName: '铝塑膜（内包材）',
      itemSpec: 'PVC/PVDC/铝复合膜 20μm',
      unit: '㎡',
      lotNo: 'PK-ALUPLA-20260601-A',
      theoreticalQty: 2100,
      actualInputQty: 2110,
      actualOutputQty: 2095,
      scrapQty: 15,
      returnQty: 0,
      lossQty: 15,
      theoreticalLossRate: 0.30,
      actualLossRate: 0.71,
      balanceRate: 99.29,
      lossReason: '开机调试损耗10㎡，热封异常品5㎡',
      isMainMaterial: false,
      status: 'NORMAL',
    },
  ],
  opBalanceRows: [
    { seq:1,  opNo:'OP-10', opName:'称量配料',   stage:'S1-称量', inputQty:100000, outputQty:100000, scrapQty:0,   yieldRate:100.00, cumulativeYield:100.00 },
    { seq:2,  opNo:'OP-20', opName:'制粒',       stage:'S2-制粒', inputQty:100000, outputQty:100000, scrapQty:0,   yieldRate:100.00, cumulativeYield:100.00 },
    { seq:3,  opNo:'OP-25', opName:'流化床干燥', stage:'S2-制粒', inputQty:100000, outputQty:99800,  scrapQty:200, yieldRate:99.80,  cumulativeYield:99.80 },
    { seq:4,  opNo:'OP-30', opName:'整粒总混',   stage:'S2-制粒', inputQty:99800,  outputQty:99800,  scrapQty:0,   yieldRate:100.00, cumulativeYield:99.80 },
    { seq:5,  opNo:'OP-40', opName:'压片',       stage:'S3-压片', inputQty:99800,  outputQty:99600,  scrapQty:200, yieldRate:99.80,  cumulativeYield:99.60 },
    { seq:6,  opNo:'OP-45', opName:'包衣',       stage:'S3-压片', inputQty:99600,  outputQty:99600,  scrapQty:0,   yieldRate:100.00, cumulativeYield:99.60 },
    { seq:7,  opNo:'OP-50', opName:'铝塑内包',   stage:'S4-内包', inputQty:99600,  outputQty:99400,  scrapQty:200, yieldRate:99.80,  cumulativeYield:99.40 },
    { seq:8,  opNo:'OP-60', opName:'装瓶外包',   stage:'S5-外包', inputQty:99400,  outputQty:99200,  scrapQty:200, yieldRate:99.80,  cumulativeYield:99.20 },
    { seq:9,  opNo:'OP-80', opName:'成品检验',   stage:'S6-检验', inputQty:99200,  outputQty:99200,  scrapQty:0,   yieldRate:100.00, cumulativeYield:99.20 },
    { seq:10, opNo:'OP-90', opName:'质量放行',   stage:'S7-放行', inputQty:99200,  outputQty:99200,  scrapQty:0,   yieldRate:100.00, cumulativeYield:99.20 },
    { seq:11, opNo:'OP-95', opName:'成品入库',   stage:'S7-放行', inputQty:99200,  outputQty:99200,  scrapQty:0,   yieldRate:100.00, cumulativeYield:99.20 },
  ],
};

/** EBR-20260612-001（VitC咀嚼片 WO003，南京工厂）— 生产进行中物料平衡（中间状态） */
export const MATERIAL_BALANCE_WO006: MaterialBalanceSheet = {
  batchNo: 'TMJ-VITC-20260612-003',
  ebrNo: 'EBR-20260612-001',
  productName: '维生素C咀嚼片',
  productSpec: '500mg/粒 铝塑包装 100粒/瓶',
  planQty: 50000,
  actualInputQty: 50000,
  actualOutputQty: 25000,
  totalScrapQty: 250,
  totalReturnQty: 0,
  overallBalanceRate: 98.80,
  overallYieldRate: 97.80,
  theoryLossRate: 0.80,
  balanceStatus: 'WARNING',
  preparedBy: '陈国华（OP001）',
  reviewedBy: undefined,
  preparedAt: '2026-06-13 12:00（生产进行中，数据实时更新）',
  conclusion: '生产进行中（完成约50%，压片段），阶段物料平衡率98.80%，存在1条压片片重偏差（IPQC检出538mg超出475~525mg范围），正在调整压片机参数处理，暂未最终影响良品率。',
  deviation: '压片过程IPQC片重差异偏高（538mg，标准475~525mg），偏差单DEV-20260613-001，已暂停调整。',
  materialRows: [
    {
      lineNo: 1,
      itemCode: 'RM-VITC-ASC-001',
      itemName: 'L-抗坏血酸（维生素C）',
      itemSpec: '药用级 ≥99.5%',
      unit: 'kg',
      lotNo: 'RM-VITC-20260612-003',
      theoreticalQty: 26.25,
      actualInputQty: 26.25,
      actualOutputQty: 25.00,
      scrapQty: 0.28,
      returnQty: 0.97,
      lossQty: 0.28,
      theoreticalLossRate: 0.60,
      actualLossRate: 1.07,
      balanceRate: 98.93,
      lossReason: '生产进行中（压片段约50%），流化床干燥损耗约0.1kg，压片偏差报废约0.18kg',
      isMainMaterial: true,
      status: 'WARNING',
    },
    {
      lineNo: 2,
      itemCode: 'EXC-STARCH-001',
      itemName: '玉米淀粉',
      itemSpec: '药用级',
      unit: 'kg',
      lotNo: 'EXC-ST-20260610-B',
      theoreticalQty: 9.00,
      actualInputQty: 9.00,
      actualOutputQty: 8.95,
      scrapQty: 0.05,
      returnQty: 0,
      lossQty: 0.05,
      theoreticalLossRate: 0.50,
      actualLossRate: 0.56,
      balanceRate: 99.44,
      isMainMaterial: false,
      status: 'NORMAL',
    },
  ],
  opBalanceRows: [
    { seq:1,  opNo:'OP-10', opName:'称量配料',   stage:'S1-称量', inputQty:50000, outputQty:50000, scrapQty:0,   yieldRate:100.00, cumulativeYield:100.00 },
    { seq:2,  opNo:'OP-20', opName:'制粒',       stage:'S2-制粒', inputQty:50000, outputQty:50000, scrapQty:0,   yieldRate:100.00, cumulativeYield:100.00 },
    { seq:3,  opNo:'OP-25', opName:'流化床干燥', stage:'S2-制粒', inputQty:50000, outputQty:49900, scrapQty:100, yieldRate:99.80,  cumulativeYield:99.80 },
    { seq:4,  opNo:'OP-30', opName:'整粒总混',   stage:'S2-制粒', inputQty:49900, outputQty:49900, scrapQty:0,   yieldRate:100.00, cumulativeYield:99.80 },
    { seq:5,  opNo:'OP-40', opName:'压片（进行中）', stage:'S3-压片', inputQty:49900, outputQty:25000, scrapQty:150, yieldRate:99.40, cumulativeYield:98.80 },
  ],
};

/** EBR-20260605-002（益生菌胶囊 WO004，溧水工厂）— 完整物料平衡表 */
export const MATERIAL_BALANCE_WO001: MaterialBalanceSheet = {
  batchNo: 'TMJ-PROBIO-20260601-001',
  ebrNo: 'EBR-20260605-002',
  productName: '复合益生菌胶囊',
  productSpec: '250mg/粒 铝塑泡罩 60粒/盒',
  planQty: 500000,
  actualInputQty: 500000,
  actualOutputQty: 495000,
  totalScrapQty: 5000,
  totalReturnQty: 0,
  overallBalanceRate: 99.00,
  overallYieldRate: 99.00,
  theoryLossRate: 0.80,
  balanceStatus: 'NORMAL',
  preparedBy: '郑伟（OP006）',
  reviewedBy: '赵雪梅（QA经理）',
  preparedAt: '2026-06-05 17:20',
  conclusion: '本批次物料平衡率99.00%，在GMP规定范围（≥98%）内。关键物料益生菌菌粉全程冷链处理，温度记录显示全程≤8℃，活菌数损耗在合理范围内（冷链原料接收偏差已按程序评估关闭）。批准放行。',
  materialRows: [
    {
      lineNo: 1,
      itemCode: 'RM-PROBIO-LA-001',
      itemName: '乳酸杆菌菌粉',
      itemSpec: '≥2×10¹⁰ CFU/g，冷链',
      unit: 'kg',
      lotNo: 'RM-PROBIO-LA-20260601-001',
      theoreticalQty: 12.50,
      actualInputQty: 12.50,
      actualOutputQty: 12.39,
      scrapQty: 0.11,
      returnQty: 0,
      lossQty: 0.11,
      theoreticalLossRate: 0.60,
      actualLossRate: 0.88,
      balanceRate: 99.12,
      lossReason: '冷链混合及填充过程损耗，设备清洁回收不足约0.1kg',
      isMainMaterial: true,
      status: 'NORMAL',
    },
    {
      lineNo: 2,
      itemCode: 'RM-PROBIO-BF-001',
      itemName: '双歧杆菌菌粉',
      itemSpec: '≥1×10¹⁰ CFU/g，冷链',
      unit: 'kg',
      lotNo: 'RM-PROBIO-BF-20260601-001',
      theoreticalQty: 6.30,
      actualInputQty: 6.30,
      actualOutputQty: 6.24,
      scrapQty: 0.06,
      returnQty: 0,
      lossQty: 0.06,
      theoreticalLossRate: 0.60,
      actualLossRate: 0.95,
      balanceRate: 99.05,
      isMainMaterial: false,
      status: 'NORMAL',
    },
    {
      lineNo: 3,
      itemCode: 'PK-BLISTER-PROBIO-001',
      itemName: '泡罩铝塑膜（益生菌专用）',
      itemSpec: '铝/PVC复合，冷链防湿型',
      unit: '㎡',
      lotNo: 'PK-BLI-PROBIO-20260601-A',
      theoreticalQty: 8300,
      actualInputQty: 8350,
      actualOutputQty: 8290,
      scrapQty: 60,
      returnQty: 0,
      lossQty: 60,
      theoreticalLossRate: 0.30,
      actualLossRate: 0.72,
      balanceRate: 99.28,
      lossReason: '开机调试损耗约30㎡，热封异常品约30㎡',
      isMainMaterial: false,
      status: 'NORMAL',
    },
  ],
  opBalanceRows: [
    { seq:1,  opNo:'OP-10', opName:'原料接收验收',    stage:'S1-备料', inputQty:500000, outputQty:500000, scrapQty:0,    yieldRate:100.00, cumulativeYield:100.00 },
    { seq:2,  opNo:'OP-20', opName:'称量配料（冷链）', stage:'S1-备料', inputQty:500000, outputQty:500000, scrapQty:0,    yieldRate:100.00, cumulativeYield:100.00 },
    { seq:3,  opNo:'OP-30', opName:'低温混合',        stage:'S2-混合', inputQty:500000, outputQty:498000, scrapQty:2000, yieldRate:99.60,  cumulativeYield:99.60 },
    { seq:4,  opNo:'OP-40', opName:'胶囊填充（冷链）', stage:'S3-填充', inputQty:498000, outputQty:496000, scrapQty:2000, yieldRate:99.60,  cumulativeYield:99.20 },
    { seq:5,  opNo:'OP-50', opName:'铝塑泡罩包装',    stage:'S4-内包', inputQty:496000, outputQty:496000, scrapQty:0,    yieldRate:100.00, cumulativeYield:99.20 },
    { seq:6,  opNo:'OP-60', opName:'装盒外包',        stage:'S5-外包', inputQty:496000, outputQty:495000, scrapQty:1000, yieldRate:99.80,  cumulativeYield:99.00 },
    { seq:7,  opNo:'OP-70', opName:'成品检验',        stage:'S6-检验', inputQty:495000, outputQty:495000, scrapQty:0,    yieldRate:100.00, cumulativeYield:99.00 },
    { seq:8,  opNo:'OP-80', opName:'质量放行',        stage:'S7-放行', inputQty:495000, outputQty:495000, scrapQty:0,    yieldRate:100.00, cumulativeYield:99.00 },
    { seq:9,  opNo:'OP-90', opName:'冷链入库（≤8℃）', stage:'S7-放行', inputQty:495000, outputQty:495000, scrapQty:0,    yieldRate:100.00, cumulativeYield:99.00 },
  ],
};

/** 按 batchNo 获取物料平衡表 */
export function getMaterialBalance(batchNo: string): MaterialBalanceSheet | undefined {
  const map: Record<string, MaterialBalanceSheet> = {
    'TMJ-VITC-20260601-001':   MATERIAL_BALANCE_WO004,
    'TMJ-VITC-20260612-003':   MATERIAL_BALANCE_WO006,
    'TMJ-PROBIO-20260601-001': MATERIAL_BALANCE_WO001,
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
/**
 * MOCK_EBR_LIST — 与 workOrderData.ts mockWorkOrders WO001~WO005 严格对齐的预生成EBR骨架。
 * id/woId/woNo/batchNo/productName/productSpec/planQtyTotal 与生产订单页完全一致。
 * 已完成批次（WO001/WO004）给 APPROVED 状态；生产中批次（WO002/WO005）给 IN_PROGRESS；
 * 已下发待开始（WO003）给 IN_PROGRESS。
 * PAD工序执行完成某工序后，PadIndex 会通过 updateEbr() 将真实数据覆盖写入对应条目。
 */

function mkEbrNo(date: string, seq: string): string { return `EBR-${date}-${seq}`; }

const _now = '2026-06-15 09:00';

// 预生成EBR骨架的公共数量字段（真实数量由PAD工序执行后覆盖写入）
const _emptyQty = { reportQtyTotal: 0, goodQtyTotal: 0, scrapQtyTotal: 0, yieldRate: 0 };
const _emptyArrays = { tasks: [] as EbrRecord['tasks'], floatTickets: [] as EbrFloatTicket[], routingSteps: [] as EbrRoutingStep[], inspectionRecords: [] as EbrInspectionRecord[], deviations: [] as EbrDeviation[], signatures: [] as EbrSignature[] };

// WO001 — VitC 500mg×60粒 已放行批次
const EBR_PRESET_WO001: EbrRecord = {
  id: 'EBR_PRESET_WO001', ebrNo: mkEbrNo('20260603', '001'),
  status: 'APPROVED',
  poId: 'PO001', poNo: 'MO-20260601-001',
  routingCode: 'TMJ-VITC-WG-V20', routingName: 'VitC咀嚼片湿法制粒工艺路径 V2.0', bomVersion: 'V2.0',
  woId: 'WO001', woNo: 'WO-20260601-001',
  batchNo: 'TMJ-VITC-20260601-001',
  productCode: 'FG-VITC-500MG-AP', productName: '维生素C咀嚼片',
  productSpec: '500mg/粒 × 60粒/瓶',
  planQtyTotal: 100000, ..._emptyQty, customer: undefined, deliveryDate: '2026-06-15', priority: 'HIGH',
  materialLotNo: 'RM-VITC-20260601-001', iqcResult: 'PASS',
  ..._emptyArrays,
  startTime: '2026-06-01 08:30', endTime: '2026-06-03 18:45',
  createdAt: '2026-06-01 08:30', updatedAt: '2026-06-03 18:45',
  reviewedBy: '冯小丽（QC001）', reviewedAt: '2026-06-03 16:30',
  reviewRemark: '批次记录完整，全线工序操作员均已签名；关键工序工艺参数在规格范围内；VitC含量符合标准；微生物限度检验通过。',
  approvedBy: '赵雪梅（QA经理）', approvedAt: '2026-06-03 20:00',
  approveRemark: '本批次维生素C咀嚼片（批号：TMJ-VITC-20260601-001）全项检验合格，物料平衡率符合GMP要求，批准放行。',
};

// WO002 — VitC 500mg×60粒 生产中批次（进度62%，当前OP-50铝塑内包）
const EBR_PRESET_WO002: EbrRecord = {
  id: 'EBR_PRESET_WO002', ebrNo: mkEbrNo('20260605', '002'),
  status: 'IN_PROGRESS',
  poId: 'PO002', poNo: 'MO-20260605-001',
  routingCode: 'TMJ-VITC-WG-V20', routingName: 'VitC咀嚼片湿法制粒工艺路径 V2.0', bomVersion: 'V2.0',
  woId: 'WO002', woNo: 'WO-20260605-001',
  batchNo: 'TMJ-VITC-20260605-002',
  productCode: 'FG-VITC-500MG-AP', productName: '维生素C咀嚼片',
  productSpec: '500mg/粒 × 60粒/瓶',
  planQty: 200000,
  planQtyTotal: 200000,
  reportQtyTotal: 125000, goodQtyTotal: 124500, scrapQtyTotal: 500, yieldRate: 99.6,
  customer: undefined, deliveryDate: '2026-06-25', priority: 'HIGH',
  materialLotNo: 'RM-VITC-20260605-002', iqcResult: 'PASS',
  tasks: [
    { taskNo: 'TASK-WO002-01', workCenter: 'WS-NJ-WEIGH',  shiftName: '白班', team: '南京甲班', operator: '陈国华', stationScope: '称量间A区', padStation: 'PAD-NJ-WEIGH-01', status: 'COMPLETED', planStart: '2026-06-05 08:00', planEnd: '2026-06-05 10:00', actualStart: '2026-06-05 08:00', actualEnd: '2026-06-05 09:45', reportQty: 200000, scrapQty: 0 },
    { taskNo: 'TASK-WO002-02', workCenter: 'WS-NJ-SOLID',  shiftName: '白班', team: '南京甲班', operator: '王建平', stationScope: '固体制剂车间A区', padStation: 'PAD-NJ-SOLID-01', status: 'COMPLETED', planStart: '2026-06-05 10:00', planEnd: '2026-06-06 18:00', actualStart: '2026-06-05 10:00', actualEnd: '2026-06-06 17:30', reportQty: 200000, scrapQty: 200 },
    { taskNo: 'TASK-WO002-03', workCenter: 'WS-NJ-SOLID',  shiftName: '夜班', team: '南京乙班', operator: '王建平', stationScope: '固体制剂车间B区', padStation: 'PAD-NJ-SOLID-02', status: 'COMPLETED', planStart: '2026-06-07 08:00', planEnd: '2026-06-07 20:00', actualStart: '2026-06-07 08:00', actualEnd: '2026-06-07 19:30', reportQty: 199800, scrapQty: 300 },
    { taskNo: 'TASK-WO002-04', workCenter: 'WS-NJ-PACK',   shiftName: '白班', team: '南京丙班', operator: '刘晓梅', stationScope: '内包装车间', padStation: 'PAD-NJ-PACK-01',  status: 'IN_PROGRESS', planStart: '2026-06-09 08:00', planEnd: '2026-06-11 18:00', actualStart: '2026-06-09 08:00', reportQty: 75000, scrapQty: 0 },
  ],
  floatTickets: [
    { ticketNo: 'FT-20260605-002-01', qty: 42000, status: 'IN_USE',  currentOp: 'OP-50 铝塑内包', currentStageName: 'S5-包衣', operatorName: '刘晓梅', lastUpdateTime: '2026-06-09 10:30' },
    { ticketNo: 'FT-20260605-002-02', qty: 42000, status: 'IN_USE',  currentOp: 'OP-50 铝塑内包', currentStageName: 'S5-包衣', operatorName: '刘晓梅', lastUpdateTime: '2026-06-09 11:15' },
    { ticketNo: 'FT-20260605-002-03', qty: 41000, status: 'WAITING', currentOp: 'OP-45 薄膜包衣', currentStageName: 'S5-包衣', lastUpdateTime: '2026-06-08 20:00' },
    { ticketNo: 'FT-20260605-002-04', qty: 40500, status: 'WAITING', currentOp: 'OP-45 薄膜包衣', currentStageName: 'S5-包衣', lastUpdateTime: '2026-06-08 21:30' },
  ],
  routingSteps: [
    { seq:1,  opNo:'OP-10', opName:'称量配料',     stage:'S1-称量',  workCenter:'WS-NJ-WEIGH',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-05 08:05', completedAt:'2026-06-05 09:45', operatorName:'陈国华（OP001）', teamName:'南京甲班', equipId:'EQ-BAL-NJ-01', equipName:'电子天平1号', reportQty:200000, goodQty:200000, scrapQty:0,   keyData:{'VitC投料量':'105.0kg','甘露醇':'60.0kg','山梨醇':'24.0kg','PVP K30':'8.0kg','硬脂酸镁':'1.0kg','天平编号':'EQ-BAL-NJ-01','复核人':'孙建国'} },
    { seq:2,  opNo:'OP-20', opName:'制粒（湿法）', stage:'S2-制粒',  workCenter:'WS-NJ-SOLID',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-05 10:00', completedAt:'2026-06-05 12:30', operatorName:'王建平（OP002）', teamName:'南京甲班', equipId:'EQ-GRN-NJ-01', equipName:'湿法制粒机1号', reportQty:200000, goodQty:200000, scrapQty:0,   keyData:{'制粒机转速':'200rpm','制粒时间':'90min','粘合剂':'10%PVP-K30溶液约5L','加液速度':'600ml/min','颗粒外观':'均匀，无结块'} },
    { seq:3,  opNo:'OP-25', opName:'流化床干燥',   stage:'S2-制粒',  workCenter:'WS-NJ-SOLID',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-05 12:45', completedAt:'2026-06-05 15:00', operatorName:'王建平（OP002）', teamName:'南京甲班', equipId:'EQ-FBD-NJ-01', equipName:'流化床干燥机1号', reportQty:200000, goodQty:199600, scrapQty:400, keyData:{'进风温度':'65℃','出风温度':'43℃','干燥时间':'120min','颗粒水分':'2.0%（标准≤3.0%）','干燥均匀性':'RSD=1.2%'} },
    { seq:4,  opNo:'OP-30', opName:'整粒总混',     stage:'S3-总混',  workCenter:'WS-NJ-SOLID',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-05 15:10', completedAt:'2026-06-05 17:00', operatorName:'孙建国（OP002）', teamName:'南京甲班', equipId:'EQ-MIX-NJ-01', equipName:'三维混合机1号', reportQty:199600, goodQty:199600, scrapQty:0,   keyData:{'整粒网目':'20目','混合时间':'25min','混合均匀RSD':'1.5%（标准≤5%）'} },
    { seq:5,  opNo:'OP-40', opName:'压片',         stage:'S4-压片',  workCenter:'WS-NJ-SOLID',  isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED', startedAt:'2026-06-06 08:00', completedAt:'2026-06-07 18:00', operatorName:'王建平（OP002）', teamName:'南京乙班', equipId:'EQ-TAB-NJ-01', equipName:'旋转压片机1号', reportQty:199600, goodQty:199100, scrapQty:500, keyData:{'压片速度':'80000粒/h','主压力':'12kN','预压力':'3.5kN','片重':'525mg±3%','硬度':'6.5kP（标准≥5kP）','脆碎度':'0.18%（标准≤0.5%）','已压片数':'199100粒'} },
    { seq:6,  opNo:'OP-45', opName:'薄膜包衣',     stage:'S5-包衣',  workCenter:'WS-NJ-SOLID',  isKeyOp:false, mandatoryInspection:false, status:'COMPLETED', startedAt:'2026-06-08 08:00', completedAt:'2026-06-08 16:30', operatorName:'王建平（OP002）', teamName:'南京乙班', equipId:'EQ-COT-NJ-01', equipName:'高效包衣机1号', reportQty:199100, goodQty:199100, scrapQty:0,   keyData:{'包衣液':'欧巴代 OY-LS-28920','包衣增重':'3.0%','进风温度':'55℃','进风风量':'1200m³/h','包衣时间':'200min','外观':'白色均匀，无龟裂'} },
    { seq:7,  opNo:'OP-50', opName:'铝塑内包',     stage:'S6-内包',  workCenter:'WS-NJ-PACK',   isKeyOp:true,  mandatoryInspection:true,  status:'IN_PROGRESS', startedAt:'2026-06-09 08:00', operatorName:'刘晓梅（OP003）', teamName:'南京丙班', equipId:'EQ-BLS-NJ-01', equipName:'铝塑包装机1号', reportQty:75000, goodQty:75000, scrapQty:0, keyData:{'铝塑批号':'PK-ALUPLA-20260607-B','热封温度':'185℃','热封压力':'0.4MPa','已完成':'75000粒（进行中）','装量检查':'100粒/板，每小时5板抽检'} },
    { seq:8,  opNo:'OP-55', opName:'中间体暂存',   stage:'S6-内包',  workCenter:'WS-NJ-WH',     isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:9,  opNo:'OP-60', opName:'装瓶外包',     stage:'S7-外包',  workCenter:'WS-NJ-PACK',   isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:10, opNo:'OP-65', opName:'装盒打码',     stage:'S7-外包',  workCenter:'WS-NJ-PACK',   isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:11, opNo:'OP-70', opName:'待检暂存',     stage:'S8-检验',  workCenter:'WS-NJ-QC',     isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:12, opNo:'OP-80', opName:'成品检验',     stage:'S8-检验',  workCenter:'WS-NJ-QC',     isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:13, opNo:'OP-90', opName:'质量放行',     stage:'S9-放行',  workCenter:'WS-NJ-QA',     isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:14, opNo:'OP-95', opName:'成品入库',     stage:'S9-放行',  workCenter:'WS-NJ-WH',     isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
  ],
  inspectionRecords: [
    {
      taskId: 'INS-WO002-IQC-001', taskNo: 'IQC-20260603-001',
      schemeCode: 'IQC-VITC-STD', schemeName: 'VitC原料粉进货检验', schemeType: 'IQC',
      batchNo: 'RM-VITC-20260605-002', totalQty: 105000, sampleQty: 400,
      inspectorName: '冯小丽', checkerName: '张丽华',
      startTime: '2026-06-03 09:00', completeTime: '2026-06-03 16:30',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode: 'IQC-01', itemName: 'VitC含量（HPLC）',  category: '含量', standardValue: '≥99.5%',     unit: '%',   actualValue: '99.8%', result: 'PASS', isCritical: true  },
        { itemCode: 'IQC-02', itemName: '水分',              category: '理化', standardValue: '≤0.5%',      unit: '%',   actualValue: '0.3%',  result: 'PASS', isCritical: false },
        { itemCode: 'IQC-03', itemName: '粒径D90',           category: '理化', standardValue: '≤200μm',     unit: 'μm',  actualValue: '185μm', result: 'PASS', isCritical: false },
        { itemCode: 'IQC-04', itemName: '重金属（铅）',      category: '安全', standardValue: '≤5μg/g',     unit: 'μg/g', actualValue: '1.2μg/g', result: 'PASS', isCritical: true },
        { itemCode: 'IQC-05', itemName: '微生物总数',        category: '微生物', standardValue: '≤100CFU/g', unit: 'CFU/g', actualValue: '35CFU/g', result: 'PASS', isCritical: true },
      ],
    },
    {
      taskId: 'INS-WO002-IPQC-001', taskNo: 'IPQC-20260607-001',
      schemeCode: 'IPQC-PRESS-STD', schemeName: '压片中间控制检验', schemeType: 'IPQC_SELF',
      opNo: 'OP-40', batchNo: 'TMJ-VITC-20260605-002', totalQty: 199600, sampleQty: 40,
      inspectorName: '冯小丽', checkerName: '张丽华',
      startTime: '2026-06-06 10:00', completeTime: '2026-06-07 17:30',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode: 'IPQC-01', itemName: '片重差异', category: '物理', standardValue: '525mg±3%（509~541mg）', unit: 'mg', actualValue: '524.5mg±1.8%', result: 'PASS', isCritical: true  },
        { itemCode: 'IPQC-02', itemName: '硬度',     category: '物理', standardValue: '≥5kP',                 unit: 'kP',  actualValue: '6.5kP',          result: 'PASS', isCritical: true  },
        { itemCode: 'IPQC-03', itemName: '脆碎度',   category: '物理', standardValue: '≤0.5%',                unit: '%',   actualValue: '0.18%',           result: 'PASS', isCritical: false },
        { itemCode: 'IPQC-04', itemName: '崩解时限', category: '物理', standardValue: '≤15min',               unit: 'min', actualValue: '11min',           result: 'PASS', isCritical: false },
        { itemCode: 'IPQC-05', itemName: '含量均匀度',category: '含量', standardValue: 'AV≤15',               unit: '',    actualValue: 'AV=6.8',          result: 'PASS', isCritical: true  },
      ],
    },
  ],
  deviations: [],
  signatures: [
    { role: '生产操作员', name: '陈国华', signedAt: '2026-06-05 09:45', remark: '称量配料完成，双人复核' },
    { role: '班组长',     name: '王建平', signedAt: '2026-06-07 18:00', remark: '制粒/干燥/压片阶段确认' },
    { role: 'QC检验员',   name: '冯小丽', signedAt: '2026-06-07 17:30', remark: '压片IPQC检验合格' },
  ],
  startTime: '2026-06-05 08:00',
  createdAt: '2026-06-05 08:00', updatedAt: _now,
};

// WO003 — VitC 250mg×100粒 已下发批次
const EBR_PRESET_WO003: EbrRecord = {
  id: 'EBR_PRESET_WO003', ebrNo: mkEbrNo('20260610', '003'),
  status: 'IN_PROGRESS',
  poId: 'PO003', poNo: 'MO-20260610-001',
  routingCode: 'TMJ-VITC-DC-V10', routingName: 'VitC咀嚼片直压工艺路径 V1.0', bomVersion: 'V1.0',
  woId: 'WO003', woNo: 'WO-20260610-001',
  batchNo: 'TMJ-VITC-20260610-003',
  productCode: 'FG-VITC-250MG-BTL', productName: '维生素C咀嚼片',
  productSpec: '250mg/粒 × 100粒/瓶',
  planQtyTotal: 50000, ..._emptyQty, customer: undefined, deliveryDate: '2026-06-30', priority: 'NORMAL',
  materialLotNo: 'RM-VITC-20260610-003', iqcResult: 'PASS',
  ..._emptyArrays,
  startTime: '2026-06-13 08:00',
  createdAt: '2026-06-10 10:00', updatedAt: _now,
};

// WO004 — 复合益生菌胶囊 250mg×30粒 已放行批次
const EBR_PRESET_WO004: EbrRecord = {
  id: 'EBR_PRESET_WO004', ebrNo: mkEbrNo('20260605', '004'),
  status: 'APPROVED',
  poId: 'PO004', poNo: 'MO-20260601-002',
  routingCode: 'TMJ-PROBIO-CAP-V15', routingName: '益生菌胶囊冷链工艺路径 V1.5', bomVersion: 'V1.5',
  woId: 'WO004', woNo: 'WO-20260601-002',
  batchNo: 'TMJ-PROBIO-20260601-001',
  productCode: 'FG-PROBIO-CAP-250', productName: '复合益生菌胶囊',
  productSpec: '250mg/粒（活菌数≥1×10⁹CFU/粒）× 30粒/盒',
  planQtyTotal: 30000, ..._emptyQty, customer: undefined, deliveryDate: '2026-06-10', priority: 'URGENT',
  materialLotNo: 'RM-PROBIO-20260601-001', iqcResult: 'PASS',
  ..._emptyArrays,
  startTime: '2026-06-01 08:00', endTime: '2026-06-05 16:30',
  createdAt: '2026-06-01 08:00', updatedAt: '2026-06-05 17:00',
  reviewedBy: '王小芳（QC002）', reviewedAt: '2026-06-05 16:00',
  reviewRemark: '溧水工厂益生菌胶囊批次记录完整，冷链全程温度监控合规（≤8℃），活菌数符合标准；各关键工序GMP签名完整。',
  approvedBy: '赵雪梅（QA经理，溧水）', approvedAt: '2026-06-05 18:00',
  approveRemark: '本批次复合益生菌胶囊（批号：TMJ-PROBIO-20260601-001）全项检验合格，冷链工艺参数符合GMP要求，批准放行。',
};

// WO005 — 复合益生菌胶囊 250mg×30粒 生产中批次（进度35%，当前OP-40胶囊充填）
const EBR_PRESET_WO005: EbrRecord = {
  id: 'EBR_PRESET_WO005', ebrNo: mkEbrNo('20260612', '005'),
  status: 'IN_PROGRESS',
  poId: 'PO005', poNo: 'MO-20260612-001',
  routingCode: 'TMJ-PROBIO-CAP-V15', routingName: '益生菌胶囊冷链工艺路径 V1.5', bomVersion: 'V1.5',
  woId: 'WO005', woNo: 'WO-20260612-001',
  batchNo: 'TMJ-PROBIO-20260612-002',
  productCode: 'FG-PROBIO-CAP-250', productName: '复合益生菌胶囊',
  productSpec: '250mg/粒 × 30粒/盒',
  planQty: 60000,
  planQtyTotal: 60000,
  reportQtyTotal: 21000, goodQtyTotal: 20940, scrapQtyTotal: 60, yieldRate: 99.71,
  customer: undefined, deliveryDate: '2026-06-28', priority: 'HIGH',
  materialLotNo: 'RM-PROBIO-20260612-002', iqcResult: 'PASS',
  tasks: [
    { taskNo: 'TASK-WO005-01', workCenter: 'WS-LS-WH',     shiftName: '白班', team: '溧水甲班', operator: '李志远', stationScope: '冷库验收区', padStation: 'PAD-LS-PROBIO-01', status: 'COMPLETED',   planStart: '2026-06-12 07:30', planEnd: '2026-06-12 09:00', actualStart: '2026-06-12 07:30', actualEnd: '2026-06-12 08:45', reportQty: 60000, scrapQty: 0 },
    { taskNo: 'TASK-WO005-02', workCenter: 'WS-LS-PROBIO',  shiftName: '白班', team: '溧水甲班', operator: '李志远', stationScope: '益生菌充填车间', padStation: 'PAD-LS-PROBIO-01', status: 'COMPLETED',   planStart: '2026-06-12 09:00', planEnd: '2026-06-12 20:00', actualStart: '2026-06-12 09:00', actualEnd: '2026-06-12 19:00', reportQty: 60000, scrapQty: 0   },
    { taskNo: 'TASK-WO005-03', workCenter: 'WS-LS-PROBIO',  shiftName: '白班', team: '溧水甲班', operator: '钱文华', stationScope: '益生菌充填车间', padStation: 'PAD-LS-PROBIO-01', status: 'IN_PROGRESS', planStart: '2026-06-13 08:00', planEnd: '2026-06-14 18:00', actualStart: '2026-06-13 08:00', reportQty: 21000, scrapQty: 60 },
  ],
  floatTickets: [
    { ticketNo: 'FT-20260612-002-01', qty: 21000, status: 'IN_USE',  currentOp: 'OP-40 胶囊充填', currentStageName: 'S3-充填', operatorName: '钱文华', lastUpdateTime: '2026-06-13 10:30' },
    { ticketNo: 'FT-20260612-002-02', qty: 20000, status: 'WAITING', currentOp: 'OP-30 混合', currentStageName: 'S2-混合', lastUpdateTime: '2026-06-12 19:00' },
    { ticketNo: 'FT-20260612-002-03', qty: 19000, status: 'WAITING', currentOp: 'OP-20 低温称量', currentStageName: 'S1-备料', lastUpdateTime: '2026-06-12 15:00' },
  ],
  routingSteps: [
    { seq:1,  opNo:'OP-10', opName:'原料接收验收',     stage:'S1-备料',   workCenter:'WS-LS-WH',     isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED',   startedAt:'2026-06-12 07:30', completedAt:'2026-06-12 08:45', operatorName:'李志远（OP005）', teamName:'溧水甲班', reportQty:60000, goodQty:60000, scrapQty:0, keyData:{'到货批号':'RM-PROBIO-20260612-002','存储温度':'≤-18℃','运输保温箱温度':'−15℃（合格）','收货重量':'复核完成','IQC状态':'已触发IQC检验'} },
    { seq:2,  opNo:'OP-20', opName:'低温称量配料',     stage:'S1-备料',   workCenter:'WS-LS-PROBIO', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED',   startedAt:'2026-06-12 09:00', completedAt:'2026-06-12 10:30', operatorName:'李志远（OP005）', teamName:'溧水甲班', equipId:'EQ-BAL-LS-01', equipName:'冷链电子天平', reportQty:60000, goodQty:60000, scrapQty:0, keyData:{'乳酸菌冻干粉':'1.5kg（RM-LB-20260608-LS）','双歧杆菌冻干粉':'1.2kg（RM-BF-20260608-LS）','低聚果糖':'4.2kg','胶原蛋白肽':'2.0kg','称量温度':'≤8℃','复核人':'钱文华'} },
    { seq:3,  opNo:'OP-30', opName:'混合（冷链≤8℃）', stage:'S2-混合',   workCenter:'WS-LS-PROBIO', isKeyOp:true,  mandatoryInspection:true,  status:'COMPLETED',   startedAt:'2026-06-12 10:45', completedAt:'2026-06-12 13:00', operatorName:'李志远（OP005）', teamName:'溧水甲班', equipId:'EQ-MIX-LS-01', equipName:'低温混合机（冷链）', reportQty:60000, goodQty:60000, scrapQty:0, keyData:{'混合速度':'60rpm','混合时间':'90min','混合温度':'≤8℃全程保持','均匀度取样RSD':'2.3%（标准≤5%）','活菌数验证':'完成'} },
    { seq:4,  opNo:'OP-40', opName:'胶囊充填',         stage:'S3-充填',   workCenter:'WS-LS-PROBIO', isKeyOp:true,  mandatoryInspection:true,  status:'IN_PROGRESS', startedAt:'2026-06-12 14:00', operatorName:'钱文华（OP017）', teamName:'溧水甲班', equipId:'EQ-CAP-LS-01', equipName:'胶囊充填机1号', reportQty:21000, goodQty:20940, scrapQty:60, deviationFlag:false, keyData:{'充填量':'250mg±5%','充填速度':'6000粒/h','装量差异':'±3.5%（标准±5%）','当前进度':'21000/60000粒（35%）','环境温度':'6℃'} },
    { seq:5,  opNo:'OP-45', opName:'充填中检',         stage:'S3-充填',   workCenter:'WS-LS-QC',     isKeyOp:true,  mandatoryInspection:true,  status:'IN_PROGRESS', startedAt:'2026-06-12 16:00', operatorName:'杨芸（OP020）', teamName:'溧水QC班', reportQty:21000, goodQty:20940, scrapQty:60, keyData:{'装量差异抽查':'每30min一次','已完成抽查':'4次，均合格','活菌数预检':'1批次，合格'} },
    { seq:6,  opNo:'OP-50', opName:'铝塑泡罩包装',     stage:'S4-内包',   workCenter:'WS-LS-PACK',   isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:7,  opNo:'OP-60', opName:'外包装装盒',       stage:'S5-外包',   workCenter:'WS-LS-OUTERPACK', isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
    { seq:8,  opNo:'OP-70', opName:'FQC成品检验',     stage:'S6-检验',   workCenter:'WS-LS-QC',     isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:9,  opNo:'OP-80', opName:'质量放行',         stage:'S7-放行',   workCenter:'WS-LS-QC',     isKeyOp:true,  mandatoryInspection:true,  status:'PENDING' },
    { seq:10, opNo:'OP-90', opName:'冷链入库（≤8℃）', stage:'S7-放行',   workCenter:'WS-LS-WH',     isKeyOp:false, mandatoryInspection:false, status:'PENDING' },
  ],
  inspectionRecords: [
    {
      taskId: 'INS-WO005-IQC-001', taskNo: 'IQC-20260612-001',
      schemeCode: 'IQC-PROBIO-STD', schemeName: '益生菌原料进货检验（冷链）', schemeType: 'IQC',
      batchNo: 'RM-PROBIO-20260612-002', totalQty: 60000, sampleQty: 200,
      inspectorName: '杨芸', checkerName: '赵雪梅',
      startTime: '2026-06-12 07:30', completeTime: '2026-06-12 09:00',
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode: 'IQC-P01', itemName: '乳酸菌活菌数',   category: '微生物', standardValue: '≥200亿CFU/g', unit: 'CFU/g', actualValue: '218亿CFU/g',  result: 'PASS', isCritical: true  },
        { itemCode: 'IQC-P02', itemName: '双歧杆菌活菌数', category: '微生物', standardValue: '≥150亿CFU/g', unit: 'CFU/g', actualValue: '162亿CFU/g',  result: 'PASS', isCritical: true  },
        { itemCode: 'IQC-P03', itemName: '水分（Karl Fischer）', category: '理化', standardValue: '≤5%', unit: '%', actualValue: '3.2%', result: 'PASS', isCritical: false },
        { itemCode: 'IQC-P04', itemName: '冷链运输温度记录', category: '冷链', standardValue: '≤−18℃', unit: '℃', actualValue: '−20℃（最低）', result: 'PASS', isCritical: true  },
        { itemCode: 'IQC-P05', itemName: '外包装完整性',  category: '外观', standardValue: '无破损/泄漏',  unit: '', actualValue: '合格', result: 'PASS', isCritical: false },
      ],
    },
    {
      taskId: 'INS-WO005-IPQC-001', taskNo: 'IPQC-20260613-001',
      schemeCode: 'IPQC-FILL-PROBIO', schemeName: '胶囊充填中间控制检验', schemeType: 'IPQC_SELF',
      opNo: 'OP-40', batchNo: 'TMJ-PROBIO-20260612-002', totalQty: 21000, sampleQty: 60,
      inspectorName: '杨芸', checkerName: '赵雪梅',
      startTime: '2026-06-12 16:00', completeTime: undefined,
      conclusion: 'PASS', releaseStatus: 'RELEASED',
      items: [
        { itemCode: 'IPQC-P01', itemName: '装量差异',      category: '物理',  standardValue: '250mg±5%（237.5~262.5mg）', unit: 'mg', actualValue: '249.8mg±3.5%', result: 'PASS', isCritical: true  },
        { itemCode: 'IPQC-P02', itemName: '胶囊外观',      category: '外观',  standardValue: '透明，无变形/泄漏',          unit: '',   actualValue: '合格',           result: 'PASS', isCritical: false },
        { itemCode: 'IPQC-P03', itemName: '充填环境温度',  category: '冷链',  standardValue: '≤8℃',                       unit: '℃',  actualValue: '6℃',             result: 'PASS', isCritical: true  },
        { itemCode: 'IPQC-P04', itemName: '活菌计数（抽检）', category: '微生物', standardValue: '≥1×10⁹CFU/粒',          unit: 'CFU/粒', actualValue: '1.32×10⁹CFU/粒', result: 'PASS', isCritical: true },
      ],
    },
  ],
  deviations: [],
  signatures: [
    { role: '生产操作员', name: '李志远', signedAt: '2026-06-12 13:00', remark: '称量配料+冷链混合完成，全程≤8℃' },
    { role: 'QC检验员',   name: '杨芸',   signedAt: '2026-06-12 09:00', remark: 'IQC进货检验合格，活菌数达标' },
  ],
  startTime: '2026-06-12 08:00',
  createdAt: '2026-06-12 08:00', updatedAt: _now,
};

export const MOCK_EBR_LIST: EbrRecord[] = [
  EBR_PRESET_WO001,
  EBR_PRESET_WO002,
  EBR_PRESET_WO003,
  EBR_PRESET_WO004,
  EBR_PRESET_WO005,
];

export const EBR_STORAGE_KEY = 'bip_ebr_records';

/** 数据版本号 — 每次更新 Mock 数据时递增，强制刷新旧缓存 */
export const EBR_DATA_VERSION = 'v20260617_sign1';
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

    // 版本不一致 → 强制清空旧缓存（MOCK_EBR_LIST = []，不填入任何旧 Mock 数据）
    // 注意：不再因为 parsed.length === 0 而重置，允许 PAD 执行后逐步填入
    if (version !== EBR_DATA_VERSION) {
      localStorage.setItem(EBR_STORAGE_KEY, JSON.stringify(MOCK_EBR_LIST));
      localStorage.setItem(EBR_VERSION_KEY,  EBR_DATA_VERSION);
      return MOCK_EBR_LIST;   // 此时为 []，EBR 由 PadIndex 工单选择时动态创建
    }
    // 版本匹配时，直接返回 localStorage 中已保存的 EBR（含 PAD 执行动态生成的记录）
    return parsed ?? [];
  } catch {
    return MOCK_EBR_LIST;
  }
}
