/**
 * issuanceStore.ts — 工序领料单数据模型 + 倒扣算法
 * ================================================================
 * 基于《BOM工序领料PRD.docx》实现：
 *  - 主动领料（PUSH）：仓管按领料单发料，PDA拣货
 *  - 倒扣领料（BACKFLUSH）：工序报工/完工时自动扣减线边仓
 * ================================================================
 * 天美健双工厂架构：
 *  - 南京工厂（D级洁净，固体制剂）：VitC咀嚼片 湿法制粒/直压工艺
 *  - 溧水工厂（C级洁净，冷链≤8℃）：复合益生菌胶囊 冷链工艺
 * ================================================================
 */

// ── 类型定义 ─────────────────────────────────────────────────────

export type IssueStatus =
  | 'PENDING'    // 待拣货
  | 'PICKING'    // 拣货中
  | 'PICKED'     // 拣货完成，待签收
  | 'RECEIVED'   // 已签收
  | 'EXCEPTION'  // 异常待处理
  | 'CLOSED';    // 已关闭

export type IssueMethod = 'PUSH' | 'BACKFLUSH' | 'ON_SITE';

export type IssuePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type BackflushStatus = 'SUCCESS' | 'FAILED' | 'INSUFFICIENT' | 'OVER_CONSUME' | 'SUPPLEMENT';

export type ExceptionType =
  | 'STOCK_EMPTY'     // 库存不足（系统有账实物无）
  | 'NO_RECORD'       // 库存不足（系统无账）
  | 'QUALITY_ISSUE'   // 来料不良
  | 'BATCH_MISMATCH'  // 批次信息不符
  | 'OTHER';          // 其他

// ── 领料单行（物料明细） ─────────────────────────────────────────
export interface IssueLine {
  id: string;
  lineNo: number;
  itemCode: string;
  itemName: string;
  spec: string;
  unit: string;
  planQty: number;         // 需求数量（= 工单数 × BOM用量 × (1+损耗率) / 基础批量）
  actualQty: number;       // 实发数量
  issueMethod: IssueMethod;
  operationSeq?: number;   // 关联工序序号
  operationCode?: string;  // 关联工序编码
  wipWarehouse: string;    // 目标线边仓
  sourceWarehouse: string; // 源仓库
  batchPicks: BatchPick[]; // 批次拣货明细
  status: 'PENDING' | 'DONE' | 'EXCEPTION' | 'SKIP';
  exceptionType?: ExceptionType;
  exceptionRemark?: string;
}

// ── 批次拣货明细 ─────────────────────────────────────────────────
export interface BatchPick {
  batchNo: string;
  qty: number;
  inboundDate?: string;    // 入库日期（FIFO排序依据）
  expiryDate?: string;     // 效期（FEFO排序依据）
  warehouseCode: string;
}

// ── 领料单主表 ──────────────────────────────────────────────────
export interface IssueOrder {
  id: string;
  issueNo: string;         // 领料单号，如 ISU-20260430-001
  woNo: string;            // 关联工单号
  moNo?: string;           // 关联生产订单号
  productCode: string;     // 产品编码
  productName: string;     // 产品名称
  operationSeq?: number;   // 工序序号（工序领料时用）
  operationName?: string;  // 工序名称
  issueMethod: IssueMethod;
  priority: IssuePriority;
  warehouse: string;       // 领料仓库
  wipWarehouse: string;    // 目标线边仓
  planDate: string;        // 计划发料日期
  lines: IssueLine[];
  status: IssueStatus;
  createdBy: string;
  createdAt: string;
  pickedBy?: string;
  pickedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  remark?: string;
}

// ── 倒扣日志 ────────────────────────────────────────────────────
export interface BackflushLog {
  id: string;
  woNo: string;
  operationSeq: number;
  operationCode: string;
  triggerPoint: 'OPERATION_REPORT' | 'COMPLETE_IN';
  itemCode: string;
  itemName: string;
  bomChildQty: number;
  baseBatchQty: number;
  reportQty: number;
  lossRate: number;
  stdQty: number;          // 标准应扣数量
  actualQty: number;       // 实际扣减数量
  batchNo?: string;
  wipWarehouse: string;
  status: BackflushStatus;
  errorMsg?: string;
  createdAt: string;
}

// ── 线边仓库存 ──────────────────────────────────────────────────
export interface WipInventory {
  warehouseCode: string;
  itemCode: string;
  itemName: string;
  batchNo: string;
  qty: number;
  availableQty: number;
  lockedQty: number;
  unit: string;
  inboundDate: string;
  expiryDate?: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════════
// Mock 初始数据 — 天美健保健品双工厂
// 南京工厂（D级洁净，固体制剂）：VitC咀嚼片
// 溧水工厂（C级洁净，冷链≤8℃）：复合益生菌胶囊
// ════════════════════════════════════════════════════════════════

const today = '2026-06-14';

export const MOCK_ISSUE_ORDERS: IssueOrder[] = [

  // ═══════════════════════════════════════════════════════════════
  // ISU-001：南京工厂 WO002 — VitC咀嚼片 称量配料（OP-10-WEIGH）
  // 工单：WO-20260605-001 / 批次：TMJ-VITC-20260605-002 / 计划20万粒
  // 状态：拣货中（主动领料，高优先级）
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ISO001',
    issueNo: 'ISU-20260614-001',
    woNo: 'WO-20260605-001',
    moNo: 'MO-20260605-001',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    operationSeq: 10,
    operationName: '称量配料',
    issueMethod: 'PUSH',
    priority: 'HIGH',
    warehouse: 'NJ-RM-原料仓',
    wipWarehouse: 'WIP-NJ-称量',
    planDate: today,
    status: 'PICKING',
    createdBy: '陈国华',
    createdAt: `${today} 07:30`,
    remark: 'VitC咀嚼片湿法制粒批次，称量间D级洁净，双人复核',
    lines: [
      {
        id: 'L001', lineNo: 1,
        itemCode: 'RM-VITC-POWDER', itemName: '维生素C原料粉',
        spec: 'USP级 / 含量≥99.5% / 25kg/袋',
        unit: 'KG',
        planQty: 50.0, actualQty: 50.0,
        issueMethod: 'PUSH', operationSeq: 10, operationCode: 'OP-10-WEIGH',
        wipWarehouse: 'WIP-NJ-称量', sourceWarehouse: 'NJ-RM-原料仓',
        batchPicks: [
          { batchNo: 'RM-VITC-20260602-A1', qty: 25.0, inboundDate: '2026-06-02', expiryDate: '2028-06-01', warehouseCode: 'NJ-RM-原料仓' },
          { batchNo: 'RM-VITC-20260602-A2', qty: 25.0, inboundDate: '2026-06-02', expiryDate: '2028-06-01', warehouseCode: 'NJ-RM-原料仓' },
        ],
        status: 'DONE',
      },
      {
        id: 'L002', lineNo: 2,
        itemCode: 'RM-MANNITOL', itemName: '甘露醇（填充剂）',
        spec: '药用级 / 粒径D90≤200μm / 25kg/袋',
        unit: 'KG',
        planQty: 30.0, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 10, operationCode: 'OP-10-WEIGH',
        wipWarehouse: 'WIP-NJ-称量', sourceWarehouse: 'NJ-RM-原料仓',
        batchPicks: [], status: 'PENDING',
      },
      {
        id: 'L003', lineNo: 3,
        itemCode: 'RM-SORBITOL', itemName: '山梨醇（甜味剂）',
        spec: '药用级 / 含量≥97% / 25kg/袋',
        unit: 'KG',
        planQty: 12.0, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 10, operationCode: 'OP-10-WEIGH',
        wipWarehouse: 'WIP-NJ-称量', sourceWarehouse: 'NJ-RM-原料仓',
        batchPicks: [], status: 'PENDING',
      },
      {
        id: 'L004', lineNo: 4,
        itemCode: 'EX-PVPK30', itemName: 'PVP K30（粘合剂）',
        spec: '药用级 / K值28~32 / 5kg/袋',
        unit: 'KG',
        planQty: 4.0, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 10, operationCode: 'OP-10-WEIGH',
        wipWarehouse: 'WIP-NJ-称量', sourceWarehouse: 'NJ-RM-原料仓',
        batchPicks: [], status: 'PENDING',
      },
      {
        id: 'L005', lineNo: 5,
        itemCode: 'EX-MGST', itemName: '硬脂酸镁（润滑剂）',
        spec: '药用级 / 粒径≤75μm / 25kg/袋',
        unit: 'KG',
        planQty: 1.0, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 10, operationCode: 'OP-10-WEIGH',
        wipWarehouse: 'WIP-NJ-称量', sourceWarehouse: 'NJ-RM-原料仓',
        batchPicks: [], status: 'PENDING',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ISU-002：南京工厂 WO002 — VitC咀嚼片 压片工序（OP-60-PRESS）
  // 工单：WO-20260605-001 / 批次：TMJ-VITC-20260605-002
  // 状态：待拣货（主动领料，高优先级）— 等待制粒完成后发料
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ISO002',
    issueNo: 'ISU-20260614-002',
    woNo: 'WO-20260605-001',
    moNo: 'MO-20260605-001',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    operationSeq: 60,
    operationName: '压片',
    issueMethod: 'PUSH',
    priority: 'HIGH',
    warehouse: 'NJ-PM-包材仓',
    wipWarehouse: 'WIP-NJ-压片',
    planDate: today,
    status: 'PENDING',
    createdBy: '王建平',
    createdAt: `${today} 08:00`,
    remark: '旋转压片机ZP-45D，主压力8~12kN，片重600mg±3%',
    lines: [
      {
        id: 'L006', lineNo: 1,
        itemCode: 'PKG-AL-FOIL-INNER', itemName: '内层铝塑复合膜',
        spec: 'PVC/PVDC/Al/PP复合 / 厚度0.08mm / 宽150mm',
        unit: 'M',
        planQty: 2500, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 60, operationCode: 'OP-60-PRESS',
        wipWarehouse: 'WIP-NJ-压片', sourceWarehouse: 'NJ-PM-包材仓',
        batchPicks: [], status: 'PENDING',
      },
      {
        id: 'L007', lineNo: 2,
        itemCode: 'EX-SILICON-DIO', itemName: '二氧化硅（助流剂）',
        spec: '气相法 / 粒径7nm / 5kg/袋',
        unit: 'KG',
        planQty: 0.6, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 60, operationCode: 'OP-60-PRESS',
        wipWarehouse: 'WIP-NJ-压片', sourceWarehouse: 'NJ-RM-原料仓',
        batchPicks: [], status: 'PENDING',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ISU-003：南京工厂 WO002 — VitC咀嚼片 内包装（OP-90-BOTTLE）
  // 工单：WO-20260605-001 / 批次：TMJ-VITC-20260605-002
  // 状态：已签收（主动领料，高优先级）— 已完成入库前内包
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ISO003',
    issueNo: 'ISU-20260614-003',
    woNo: 'WO-20260605-001',
    moNo: 'MO-20260605-001',
    productCode: 'FG-VITC-500MG-AP',
    productName: '维生素C咀嚼片',
    operationSeq: 90,
    operationName: '瓶装内包',
    issueMethod: 'PUSH',
    priority: 'HIGH',
    warehouse: 'NJ-PM-包材仓',
    wipWarehouse: 'WIP-NJ-内包',
    planDate: '2026-06-10',
    status: 'RECEIVED',
    createdBy: '刘晓梅',
    createdAt: '2026-06-10 08:30',
    pickedBy: '仓管-赵磊',
    pickedAt: '2026-06-10 09:15',
    receivedBy: '刘晓梅',
    receivedAt: '2026-06-10 09:30',
    remark: '60粒/瓶规格，自动旋盖线，已完成首批次内包',
    lines: [
      {
        id: 'L008', lineNo: 1,
        itemCode: 'PKG-HDPE-BOTTLE-60', itemName: 'HDPE塑料瓶（60粒装）',
        spec: 'Φ55mm × H80mm / 白色不透明 / 100个/袋',
        unit: 'PCS',
        planQty: 1250, actualQty: 1250,
        issueMethod: 'PUSH', operationSeq: 90, operationCode: 'OP-90-BOTTLE',
        wipWarehouse: 'WIP-NJ-内包', sourceWarehouse: 'NJ-PM-包材仓',
        batchPicks: [
          { batchNo: 'PKG-BTL-20260608-NJ', qty: 1250, inboundDate: '2026-06-08', warehouseCode: 'NJ-PM-包材仓' },
        ],
        status: 'DONE',
      },
      {
        id: 'L009', lineNo: 2,
        itemCode: 'PKG-CAP-INDUCTION', itemName: '铝箔感应封口盖',
        spec: 'Φ55mm / 防伪铝膜 / 1000个/袋',
        unit: 'PCS',
        planQty: 1250, actualQty: 1250,
        issueMethod: 'PUSH', operationSeq: 90, operationCode: 'OP-90-BOTTLE',
        wipWarehouse: 'WIP-NJ-内包', sourceWarehouse: 'NJ-PM-包材仓',
        batchPicks: [
          { batchNo: 'PKG-CAP-20260608-NJ', qty: 1250, inboundDate: '2026-06-08', warehouseCode: 'NJ-PM-包材仓' },
        ],
        status: 'DONE',
      },
      {
        id: 'L010', lineNo: 3,
        itemCode: 'PKG-DESICCANT-2G', itemName: '干燥剂（食品级）',
        spec: '硅胶/2g/粒 / 独立包装 / GMP合规',
        unit: 'PCS',
        planQty: 1250, actualQty: 1250,
        issueMethod: 'PUSH', operationSeq: 90, operationCode: 'OP-90-BOTTLE',
        wipWarehouse: 'WIP-NJ-内包', sourceWarehouse: 'NJ-PM-包材仓',
        batchPicks: [
          { batchNo: 'PKG-DES-20260608-NJ', qty: 1250, inboundDate: '2026-06-08', warehouseCode: 'NJ-PM-包材仓' },
        ],
        status: 'DONE',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ISU-004：溧水工厂 WO005 — 复合益生菌胶囊 菌粉混合（OP-P20-BLEND）
  // 工单：WO-20260612-001 / 批次：TMJ-PROBIO-20260612-002 / 计划6万粒
  // 状态：拣货中（主动领料，高优先级）— 冷链物料≤8℃
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ISO004',
    issueNo: 'ISU-20260614-004',
    woNo: 'WO-20260612-001',
    moNo: 'MO-20260612-001',
    productCode: 'FG-PROBIO-CAP-250',
    productName: '复合益生菌胶囊',
    operationSeq: 20,
    operationName: '菌粉混合',
    issueMethod: 'PUSH',
    priority: 'HIGH',
    warehouse: 'LS-COLD-冷库（≤8℃）',
    wipWarehouse: 'WIP-LS-混合（冷链）',
    planDate: today,
    status: 'PICKING',
    createdBy: '李志远',
    createdAt: `${today} 07:00`,
    remark: '全程冷链操作，C级洁净区，菌粉转运需保温箱≤8℃',
    lines: [
      {
        id: 'L011', lineNo: 1,
        itemCode: 'RM-LACTO-POWDER', itemName: '乳酸菌冻干粉',
        spec: '≥200亿CFU/g / 冷冻保存≤-18℃ / 1kg/铝箔袋',
        unit: 'KG',
        planQty: 1.5, actualQty: 1.5,
        issueMethod: 'PUSH', operationSeq: 20, operationCode: 'OP-P20-BLEND',
        wipWarehouse: 'WIP-LS-混合（冷链）', sourceWarehouse: 'LS-COLD-冷库（≤8℃）',
        batchPicks: [
          { batchNo: 'RM-LB-20260608-LS', qty: 1.5, inboundDate: '2026-06-08', expiryDate: '2027-06-07', warehouseCode: 'LS-COLD-冷库（≤8℃）' },
        ],
        status: 'DONE',
      },
      {
        id: 'L012', lineNo: 2,
        itemCode: 'RM-BIFIDO-POWDER', itemName: '双歧杆菌冻干粉',
        spec: '≥150亿CFU/g / 冷冻保存≤-18℃ / 1kg/铝箔袋',
        unit: 'KG',
        planQty: 1.2, actualQty: 1.2,
        issueMethod: 'PUSH', operationSeq: 20, operationCode: 'OP-P20-BLEND',
        wipWarehouse: 'WIP-LS-混合（冷链）', sourceWarehouse: 'LS-COLD-冷库（≤8℃）',
        batchPicks: [
          { batchNo: 'RM-BF-20260608-LS', qty: 1.2, inboundDate: '2026-06-08', expiryDate: '2027-06-07', warehouseCode: 'LS-COLD-冷库（≤8℃）' },
        ],
        status: 'DONE',
      },
      {
        id: 'L013', lineNo: 3,
        itemCode: 'EX-FRUCTOOLIGO', itemName: '低聚果糖（益生元）',
        spec: '纯度≥95% / FOS / 20kg/袋',
        unit: 'KG',
        planQty: 4.2, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 20, operationCode: 'OP-P20-BLEND',
        wipWarehouse: 'WIP-LS-混合（冷链）', sourceWarehouse: 'LS-COLD-冷库（≤8℃）',
        batchPicks: [], status: 'PENDING',
      },
      {
        id: 'L014', lineNo: 4,
        itemCode: 'RM-COLLAGEN-PROT', itemName: '胶原蛋白肽（辅料）',
        spec: 'MW<1000Da / 水解度≥90% / 10kg/袋',
        unit: 'KG',
        planQty: 2.0, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 20, operationCode: 'OP-P20-BLEND',
        wipWarehouse: 'WIP-LS-混合（冷链）', sourceWarehouse: 'LS-COLD-冷库（≤8℃）',
        batchPicks: [], status: 'PENDING',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ISU-005：溧水工厂 WO005 — 复合益生菌胶囊 胶囊充填（OP-P30-FILL）
  // 工单：WO-20260612-001 / 批次：TMJ-PROBIO-20260612-002
  // 状态：待拣货（主动领料，高优先级）— 等待混合完成
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ISO005',
    issueNo: 'ISU-20260614-005',
    woNo: 'WO-20260612-001',
    moNo: 'MO-20260612-001',
    productCode: 'FG-PROBIO-CAP-250',
    productName: '复合益生菌胶囊',
    operationSeq: 30,
    operationName: '胶囊充填',
    issueMethod: 'PUSH',
    priority: 'HIGH',
    warehouse: 'LS-PM-包材仓',
    wipWarehouse: 'WIP-LS-充填',
    planDate: today,
    status: 'PENDING',
    createdBy: '李志远',
    createdAt: `${today} 08:30`,
    remark: '0号HPMC植物胶囊，充填机NJP-1200，充填量250mg±5%，冷链操作',
    lines: [
      {
        id: 'L015', lineNo: 1,
        itemCode: 'PKG-HPMC-CAP-0', itemName: 'HPMC植物胶囊（0号）',
        spec: '0号 / 透明 / HPMC材质 / 10万粒/箱',
        unit: 'PCS',
        planQty: 62000, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 30, operationCode: 'OP-P30-FILL',
        wipWarehouse: 'WIP-LS-充填', sourceWarehouse: 'LS-PM-包材仓',
        batchPicks: [], status: 'PENDING',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ISU-006：溧水工厂 WO005 — 复合益生菌胶囊 铝箔泡罩封合（OP-P40-SEAL）
  // 工单：WO-20260612-001 / 批次：TMJ-PROBIO-20260612-002
  // 状态：倒扣领料（已关闭）— 上批次WO004已完成扣减
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ISO006',
    issueNo: 'ISU-20260614-006',
    woNo: 'WO-20260601-002',
    moNo: 'MO-20260601-002',
    productCode: 'FG-PROBIO-CAP-250',
    productName: '复合益生菌胶囊',
    operationSeq: 40,
    operationName: '铝箔泡罩封合',
    issueMethod: 'BACKFLUSH',
    priority: 'MEDIUM',
    warehouse: 'WIP-LS-泡罩',
    wipWarehouse: 'WIP-LS-泡罩',
    planDate: '2026-06-05',
    status: 'CLOSED',
    createdBy: '系统',
    createdAt: '2026-06-05 15:00',
    remark: '上批次(WO004)报工触发倒扣，铝膜PTP型，30粒/板×1板/盒',
    lines: [
      {
        id: 'L016', lineNo: 1,
        itemCode: 'PKG-ALU-FOIL-PTP', itemName: 'PTP铝箔（冷成型）',
        spec: 'OPA/Al/PVC三层 / 厚度0.085mm / 宽200mm',
        unit: 'M',
        planQty: 320, actualQty: 324,
        issueMethod: 'BACKFLUSH', operationSeq: 40, operationCode: 'OP-P40-SEAL',
        wipWarehouse: 'WIP-LS-泡罩', sourceWarehouse: 'WIP-LS-泡罩',
        batchPicks: [
          { batchNo: 'PKG-PTP-20260601-LS', qty: 320, inboundDate: '2026-06-01', warehouseCode: 'WIP-LS-泡罩' },
          { batchNo: 'PKG-PTP-20260530-LS', qty: 4, inboundDate: '2026-05-30', warehouseCode: 'WIP-LS-泡罩' },
        ],
        status: 'DONE',
      },
      {
        id: 'L017', lineNo: 2,
        itemCode: 'PKG-LABEL-PROBIO', itemName: '产品标签（益生菌胶囊）',
        spec: '50mm×30mm / 双面印刷 / 条形码+QR码',
        unit: 'PCS',
        planQty: 1000, actualQty: 1000,
        issueMethod: 'BACKFLUSH', operationSeq: 40, operationCode: 'OP-P40-SEAL',
        wipWarehouse: 'WIP-LS-泡罩', sourceWarehouse: 'WIP-LS-泡罩',
        batchPicks: [
          { batchNo: 'PKG-LBL-20260601-LS', qty: 1000, inboundDate: '2026-06-01', warehouseCode: 'WIP-LS-泡罩' },
        ],
        status: 'DONE',
      },
    ],
  },
];

// ── 线边仓库存 Mock — 天美健双工厂 ─────────────────────────────
export const MOCK_WIP_INVENTORY: WipInventory[] = [
  // 南京工厂 — 称量/制粒线边仓
  { warehouseCode: 'WIP-NJ-称量', itemCode: 'RM-VITC-POWDER',   itemName: '维生素C原料粉',     batchNo: 'RM-VITC-20260602-A1', qty: 25.0, availableQty: 0,    lockedQty: 25.0, unit: 'KG', inboundDate: '2026-06-02', expiryDate: '2028-06-01', updatedAt: `${today} 08:30` },
  { warehouseCode: 'WIP-NJ-称量', itemCode: 'RM-VITC-POWDER',   itemName: '维生素C原料粉',     batchNo: 'RM-VITC-20260602-A2', qty: 25.0, availableQty: 0,    lockedQty: 25.0, unit: 'KG', inboundDate: '2026-06-02', expiryDate: '2028-06-01', updatedAt: `${today} 08:30` },
  { warehouseCode: 'WIP-NJ-称量', itemCode: 'RM-MANNITOL',      itemName: '甘露醇（填充剂）',   batchNo: 'RM-MAN-20260601-NJ',  qty: 30.0, availableQty: 30.0, lockedQty: 0,    unit: 'KG', inboundDate: '2026-06-01', expiryDate: '2028-12-31', updatedAt: `${today} 09:00` },
  { warehouseCode: 'WIP-NJ-称量', itemCode: 'RM-SORBITOL',      itemName: '山梨醇（甜味剂）',   batchNo: 'RM-SOR-20260601-NJ',  qty: 12.0, availableQty: 12.0, lockedQty: 0,    unit: 'KG', inboundDate: '2026-06-01', expiryDate: '2028-12-31', updatedAt: `${today} 09:00` },
  { warehouseCode: 'WIP-NJ-称量', itemCode: 'EX-PVPK30',        itemName: 'PVP K30（粘合剂）',  batchNo: 'EX-PVP-20260601-NJ',  qty: 4.0,  availableQty: 4.0,  lockedQty: 0,    unit: 'KG', inboundDate: '2026-06-01', expiryDate: '2027-12-31', updatedAt: `${today} 09:00` },
  { warehouseCode: 'WIP-NJ-称量', itemCode: 'EX-MGST',          itemName: '硬脂酸镁（润滑剂）', batchNo: 'EX-MGS-20260601-NJ',  qty: 1.0,  availableQty: 1.0,  lockedQty: 0,    unit: 'KG', inboundDate: '2026-06-01', expiryDate: '2028-06-30', updatedAt: `${today} 09:00` },
  // 南京工厂 — 内包装线边仓
  { warehouseCode: 'WIP-NJ-内包', itemCode: 'PKG-HDPE-BOTTLE-60', itemName: 'HDPE塑料瓶（60粒装）', batchNo: 'PKG-BTL-20260608-NJ', qty: 1250, availableQty: 0, lockedQty: 0, unit: 'PCS', inboundDate: '2026-06-08', updatedAt: '2026-06-10 10:00' },
  { warehouseCode: 'WIP-NJ-内包', itemCode: 'PKG-CAP-INDUCTION',  itemName: '铝箔感应封口盖',       batchNo: 'PKG-CAP-20260608-NJ', qty: 1250, availableQty: 0, lockedQty: 0, unit: 'PCS', inboundDate: '2026-06-08', updatedAt: '2026-06-10 10:00' },
  // 溧水工厂 — 冷链混合线边仓
  { warehouseCode: 'WIP-LS-混合（冷链）', itemCode: 'RM-LACTO-POWDER',   itemName: '乳酸菌冻干粉',   batchNo: 'RM-LB-20260608-LS', qty: 1.5, availableQty: 0,   lockedQty: 1.5, unit: 'KG', inboundDate: '2026-06-08', expiryDate: '2027-06-07', updatedAt: `${today} 08:00` },
  { warehouseCode: 'WIP-LS-混合（冷链）', itemCode: 'RM-BIFIDO-POWDER',  itemName: '双歧杆菌冻干粉', batchNo: 'RM-BF-20260608-LS', qty: 1.2, availableQty: 0,   lockedQty: 1.2, unit: 'KG', inboundDate: '2026-06-08', expiryDate: '2027-06-07', updatedAt: `${today} 08:00` },
  { warehouseCode: 'WIP-LS-混合（冷链）', itemCode: 'EX-FRUCTOOLIGO',    itemName: '低聚果糖（益生元）', batchNo: 'EX-FOS-20260610-LS', qty: 4.2, availableQty: 4.2, lockedQty: 0, unit: 'KG', inboundDate: '2026-06-10', expiryDate: '2027-06-09', updatedAt: `${today} 09:00` },
  { warehouseCode: 'WIP-LS-混合（冷链）', itemCode: 'RM-COLLAGEN-PROT',  itemName: '胶原蛋白肽（辅料）', batchNo: 'RM-COL-20260610-LS', qty: 2.0, availableQty: 2.0, lockedQty: 0, unit: 'KG', inboundDate: '2026-06-10', expiryDate: '2027-06-09', updatedAt: `${today} 09:00` },
  // 溧水工厂 — 泡罩包装线边仓（上批次剩余）
  { warehouseCode: 'WIP-LS-泡罩', itemCode: 'PKG-ALU-FOIL-PTP', itemName: 'PTP铝箔（冷成型）',       batchNo: 'PKG-PTP-20260601-LS', qty: 30, availableQty: 30, lockedQty: 0, unit: 'M',   inboundDate: '2026-06-01', updatedAt: '2026-06-05 16:00' },
  { warehouseCode: 'WIP-LS-泡罩', itemCode: 'PKG-LABEL-PROBIO',  itemName: '产品标签（益生菌胶囊）', batchNo: 'PKG-LBL-20260601-LS', qty: 80,  availableQty: 80, lockedQty: 0, unit: 'PCS', inboundDate: '2026-06-01', updatedAt: '2026-06-05 16:00' },
];

// ── 倒扣日志 Mock — 天美健双工厂 ────────────────────────────────
export const MOCK_BACKFLUSH_LOGS: BackflushLog[] = [
  // 溧水工厂 WO004 铝箔泡罩封合倒扣（上批次，已关闭）
  {
    id: 'BF001', woNo: 'WO-20260601-002', operationSeq: 40, operationCode: 'OP-P40-SEAL',
    triggerPoint: 'OPERATION_REPORT',
    itemCode: 'PKG-ALU-FOIL-PTP', itemName: 'PTP铝箔（冷成型）',
    bomChildQty: 10.8, baseBatchQty: 1000, reportQty: 29880, lossRate: 1.5,
    stdQty: 323.8, actualQty: 324, wipWarehouse: 'WIP-LS-泡罩',
    status: 'OVER_CONSUME', errorMsg: '微超耗：标准323.8，实际324（拆批向上取整），在GMP允许范围内',
    createdAt: '2026-06-05 15:30',
  },
  // 溧水工厂 WO004 产品标签倒扣（已成功）
  {
    id: 'BF002', woNo: 'WO-20260601-002', operationSeq: 40, operationCode: 'OP-P40-SEAL',
    triggerPoint: 'OPERATION_REPORT',
    itemCode: 'PKG-LABEL-PROBIO', itemName: '产品标签（益生菌胶囊）',
    bomChildQty: 33.4, baseBatchQty: 1000, reportQty: 29880, lossRate: 0.5,
    stdQty: 1002, actualQty: 1000, wipWarehouse: 'WIP-LS-泡罩',
    status: 'SUCCESS', createdAt: '2026-06-05 15:35',
  },
  // 南京工厂 WO001 硬脂酸镁倒扣（首批次，已成功）
  {
    id: 'BF003', woNo: 'WO-20260601-001', operationSeq: 60, operationCode: 'OP-60-PRESS',
    triggerPoint: 'OPERATION_REPORT',
    itemCode: 'EX-MGST', itemName: '硬脂酸镁（润滑剂）',
    bomChildQty: 0.005, baseBatchQty: 1000, reportQty: 99680, lossRate: 2,
    stdQty: 0.509, actualQty: 0.51, wipWarehouse: 'WIP-NJ-压片',
    status: 'SUCCESS', createdAt: '2026-06-03 14:00',
  },
];

// ════════════════════════════════════════════════════════════════
// localStorage 持久化
// 版本号机制：数据模型升级（保健品双工厂）时清除旧缓存
// ════════════════════════════════════════════════════════════════

// ⚠️ 数据版本：每次更换产品线/重构Mock时递增，强制清除旧缓存
const DATA_VERSION = 'TMJ-HEALTH-V2';
const STORE_KEY_VERSION = 'bip_data_version';
const STORE_KEY_ORDERS  = 'bip_issue_orders';
const STORE_KEY_WIP     = 'bip_wip_inventory';
const STORE_KEY_BF      = 'bip_backflush_logs';

/** 启动时检查版本，版本不符则清除全部旧数据 */
function checkAndMigrateVersion(): void {
  try {
    const storedVer = localStorage.getItem(STORE_KEY_VERSION);
    if (storedVer !== DATA_VERSION) {
      // 版本升级：清除旧的根管锉/医疗器械数据
      localStorage.removeItem(STORE_KEY_ORDERS);
      localStorage.removeItem(STORE_KEY_WIP);
      localStorage.removeItem(STORE_KEY_BF);
      localStorage.setItem(STORE_KEY_VERSION, DATA_VERSION);
    }
  } catch { /* ignore */ }
}

// 模块加载时立即执行版本检查
checkAndMigrateVersion();

function load<T>(key: string, defaults: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s) as T;
  } catch { /* ignore */ }
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}
function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadIssueOrders(): IssueOrder[] { return load(STORE_KEY_ORDERS, MOCK_ISSUE_ORDERS); }
export function saveIssueOrders(data: IssueOrder[]): void { save(STORE_KEY_ORDERS, data); }

export function loadWipInventory(): WipInventory[] { return load(STORE_KEY_WIP, MOCK_WIP_INVENTORY); }
export function saveWipInventory(data: WipInventory[]): void { save(STORE_KEY_WIP, data); }

export function loadBackflushLogs(): BackflushLog[] { return load(STORE_KEY_BF, MOCK_BACKFLUSH_LOGS); }
export function saveBackflushLogs(data: BackflushLog[]): void { save(STORE_KEY_BF, data); }

// ════════════════════════════════════════════════════════════════
// 倒扣算法（前端模拟，对应 PRD 中的存储过程逻辑）
// ════════════════════════════════════════════════════════════════

/**
 * 计算倒扣标准用量
 * 公式：报工数 × BOM子件数量 × (1 + 损耗率/100) / 基础批量
 *       向上取整到最小发料量
 */
export function calcBackflushQty(params: {
  reportQty: number;
  bomChildQty: number;
  baseBatchQty: number;
  lossRate: number;      // %
  minIssueQty: number;
}): number {
  const { reportQty, bomChildQty, baseBatchQty, lossRate, minIssueQty } = params;
  const base = baseBatchQty || 1;
  const min  = minIssueQty || 0.001;
  const raw  = reportQty * bomChildQty * (1 + lossRate / 100) / base;
  // 向上取整到最小发料单位
  return Math.ceil(raw / min) * min;
}

/**
 * 按 FIFO+FEFO 策略从线边仓批次中分配扣减
 * 返回：{ picks: BatchPick[], remaining: number, success: boolean }
 */
export function allocateBatchFIFO(params: {
  inventory: WipInventory[];
  warehouseCode: string;
  itemCode: string;
  needQty: number;
}): { picks: BatchPick[]; remaining: number; actualQty: number } {
  const { inventory, warehouseCode, itemCode, needQty } = params;

  // 过滤 + FEFO（效期近优先） + FIFO（入库早优先）
  const batches = inventory
    .filter(inv => inv.warehouseCode === warehouseCode && inv.itemCode === itemCode && inv.availableQty > 0)
    .sort((a, b) => {
      // 效期升序（FEFO）
      if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate);
      if (a.expiryDate) return -1;
      if (b.expiryDate) return 1;
      // 入库日期升序（FIFO）
      return a.inboundDate.localeCompare(b.inboundDate);
    });

  const picks: BatchPick[] = [];
  let remaining = needQty;
  let actualQty = 0;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const deduct = Math.min(remaining, batch.availableQty);
    picks.push({
      batchNo:       batch.batchNo,
      qty:           deduct,
      inboundDate:   batch.inboundDate,
      expiryDate:    batch.expiryDate,
      warehouseCode: batch.warehouseCode,
    });
    remaining -= deduct;
    actualQty += deduct;
  }

  return { picks, remaining, actualQty };
}

/**
 * 执行倒扣 — 工序报工时调用
 * 模拟存储过程 sp_backflush_by_operation_report
 */
export function execBackflush(params: {
  woNo: string;
  operationSeq: number;
  operationCode: string;
  reportQty: number;
  triggerPoint: 'OPERATION_REPORT' | 'COMPLETE_IN';
  bomLines: Array<{
    itemCode: string; itemName: string;
    bomChildQty: number; baseBatchQty: number;
    lossRate: number; minIssueQty: number;
    wipWarehouse: string;
  }>;
  inventory: WipInventory[];
}): { logs: BackflushLog[]; updatedInventory: WipInventory[]; resultCode: 0 | 1 | 2; resultMsg: string } {
  const { woNo, operationSeq, operationCode, reportQty, triggerPoint, bomLines } = params;
  let inventory = [...params.inventory.map(inv => ({ ...inv }))];
  const logs: BackflushLog[] = [];
  let failCount = 0;
  let exceptionCount = 0;
  const OVER_CONSUME_THRESHOLD = 10; // %

  for (const line of bomLines) {
    const stdQty = calcBackflushQty({
      reportQty,
      bomChildQty:  line.bomChildQty,
      baseBatchQty: line.baseBatchQty,
      lossRate:     line.lossRate,
      minIssueQty:  line.minIssueQty,
    });

    const { picks, remaining, actualQty } = allocateBatchFIFO({
      inventory,
      warehouseCode: line.wipWarehouse,
      itemCode:      line.itemCode,
      needQty:       stdQty,
    });

    // 更新库存（从 inventory 数组中扣减）
    for (const pick of picks) {
      const idx = inventory.findIndex(
        inv => inv.warehouseCode === pick.warehouseCode &&
               inv.itemCode === line.itemCode &&
               inv.batchNo === pick.batchNo
      );
      if (idx >= 0) {
        inventory[idx] = {
          ...inventory[idx],
          availableQty: inventory[idx].availableQty - pick.qty,
          qty: inventory[idx].qty - pick.qty,
          updatedAt: new Date().toLocaleString('zh-CN'),
        };
      }
    }

    // 判断状态
    let status: BackflushStatus = 'SUCCESS';
    let errorMsg: string | undefined;

    if (remaining > 0) {
      status    = 'INSUFFICIENT';
      errorMsg  = `线边仓库存不足，应扣${stdQty}，实扣${actualQty}，缺${remaining.toFixed(3)}`;
      failCount++;
    } else if (actualQty > stdQty * (1 + OVER_CONSUME_THRESHOLD / 100)) {
      status    = 'OVER_CONSUME';
      errorMsg  = `超耗：标准${stdQty}，实际${actualQty}`;
      exceptionCount++;
    }

    logs.push({
      id:           `BF-${Date.now()}-${line.itemCode}`,
      woNo, operationSeq, operationCode, triggerPoint,
      itemCode:     line.itemCode,
      itemName:     line.itemName,
      bomChildQty:  line.bomChildQty,
      baseBatchQty: line.baseBatchQty,
      reportQty,
      lossRate:     line.lossRate,
      stdQty,
      actualQty,
      wipWarehouse: line.wipWarehouse,
      status,
      errorMsg,
      createdAt:    new Date().toLocaleString('zh-CN'),
    });
  }

  let resultCode: 0 | 1 | 2 = 0;
  let resultMsg = `倒扣完成：全部成功，共${bomLines.length}种物料`;
  if (failCount > 0) {
    resultCode = 2;
    resultMsg  = `倒扣失败：${failCount}种物料库存不足`;
    // 库存不足时回滚（恢复原始库存）
    inventory = [...params.inventory.map(inv => ({ ...inv }))];
  } else if (exceptionCount > 0) {
    resultCode = 1;
    resultMsg  = `倒扣完成：成功${bomLines.length - exceptionCount}种，超耗${exceptionCount}种`;
  }

  return { logs, updatedInventory: inventory, resultCode, resultMsg };
}

// ── 工具：生成领料单号 ───────────────────────────────────────────
export function genIssueNo(): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `ISU-${dateStr}-${seq}`;
}

// ── 状态中文映射 ─────────────────────────────────────────────────
export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  PENDING:   '待拣货',
  PICKING:   '拣货中',
  PICKED:    '待签收',
  RECEIVED:  '已签收',
  EXCEPTION: '异常待处理',
  CLOSED:    '已关闭',
};

export const ISSUE_STATUS_COLOR: Record<IssueStatus, string> = {
  PENDING:   'default',
  PICKING:   'processing',
  PICKED:    'warning',
  RECEIVED:  'success',
  EXCEPTION: 'error',
  CLOSED:    'default',
};

export const ISSUE_METHOD_LABEL: Record<IssueMethod, string> = {
  PUSH:      '主动领料',
  BACKFLUSH: '倒扣领料',
  ON_SITE:   '现场领料',
};

export const ISSUE_METHOD_COLOR: Record<IssueMethod, string> = {
  PUSH:      '#1677ff',
  BACKFLUSH: '#722ed1',
  ON_SITE:   '#13c2c2',
};

export const PRIORITY_LABEL: Record<IssuePriority, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' };
export const PRIORITY_COLOR: Record<IssuePriority, string> = { HIGH: '#f5222d', MEDIUM: '#faad14', LOW: '#8c8c8c' };

export const BF_STATUS_LABEL: Record<BackflushStatus, string> = {
  SUCCESS:      '成功',
  FAILED:       '失败',
  INSUFFICIENT: '库存不足',
  OVER_CONSUME: '超耗',
  SUPPLEMENT:   '补扣',
};
export const BF_STATUS_COLOR: Record<BackflushStatus, string> = {
  SUCCESS:      'success',
  FAILED:       'error',
  INSUFFICIENT: 'error',
  OVER_CONSUME: 'warning',
  SUPPLEMENT:   'processing',
};
