/**
 * issuanceStore.ts — 工序领料单数据模型 + 倒扣算法
 * ================================================================
 * 基于《BOM工序领料PRD.docx》实现：
 *  - 主动领料（PUSH）：仓管按领料单发料，PDA拣货
 *  - 倒扣领料（BACKFLUSH）：工序报工/完工时自动扣减线边仓
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
// Mock 初始数据
// ════════════════════════════════════════════════════════════════

const today = '2026-04-30';

export const MOCK_ISSUE_ORDERS: IssueOrder[] = [
  {
    id: 'ISO001',
    issueNo: 'ISU-20260430-001',
    woNo: 'WO-20260430-001',
    moNo: 'MO-20260425-001',
    productCode: 'RKQ-25-04',
    productName: '根管锉 25# 04锥',
    operationSeq: 40,
    operationName: '涂层',
    issueMethod: 'PUSH',
    priority: 'HIGH',
    warehouse: 'A1-原料仓',
    wipWarehouse: 'WIP-涂层',
    planDate: today,
    status: 'PICKING',
    createdBy: '孙七',
    createdAt: `${today} 08:00`,
    lines: [
      {
        id: 'L001', lineNo: 1,
        itemCode: 'CH-NITRIDE', itemName: '氮化钛涂层靶材',
        spec: 'TiN/纯度99.9%', unit: 'G',
        planQty: 500, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 40, operationCode: 'OP-40',
        wipWarehouse: 'WIP-涂层', sourceWarehouse: 'A1-原料仓',
        batchPicks: [], status: 'PENDING',
      },
      {
        id: 'L002', lineNo: 2,
        itemCode: 'CH-ADHESIVE', itemName: '涂层粘结剂',
        spec: 'UV-固化型', unit: 'ML',
        planQty: 200, actualQty: 200,
        issueMethod: 'PUSH', operationSeq: 40, operationCode: 'OP-40',
        wipWarehouse: 'WIP-涂层', sourceWarehouse: 'A1-原料仓',
        batchPicks: [{ batchNo: 'BT-20260428-A1', qty: 200, inboundDate: '2026-04-28', warehouseCode: 'A1-原料仓' }],
        status: 'DONE',
      },
    ],
  },
  {
    id: 'ISO002',
    issueNo: 'ISU-20260430-002',
    woNo: 'WO-20260430-002',
    moNo: 'MO-20260425-001',
    productCode: 'RKQ-25-04',
    productName: '根管锉 25# 04锥',
    operationSeq: 10,
    operationName: '切割',
    issueMethod: 'PUSH',
    priority: 'MEDIUM',
    warehouse: 'A1-原料仓',
    wipWarehouse: 'WIP-切割',
    planDate: today,
    status: 'PENDING',
    createdBy: '孙七',
    createdAt: `${today} 08:30`,
    lines: [
      {
        id: 'L003', lineNo: 1,
        itemCode: 'NW-SS316L', itemName: '不锈钢丝 316L',
        spec: 'φ0.6mm×3000mm', unit: 'KG',
        planQty: 12.5, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 10, operationCode: 'OP-10',
        wipWarehouse: 'WIP-切割', sourceWarehouse: 'A1-原料仓',
        batchPicks: [], status: 'PENDING',
      },
      {
        id: 'L004', lineNo: 2,
        itemCode: 'NW-NITI', itemName: '镍钛合金丝',
        spec: 'φ0.4mm-φ1.2mm', unit: 'KG',
        planQty: 8, actualQty: 0,
        issueMethod: 'PUSH', operationSeq: 10, operationCode: 'OP-10',
        wipWarehouse: 'WIP-切割', sourceWarehouse: 'A1-原料仓',
        batchPicks: [], status: 'PENDING',
      },
      {
        id: 'L005', lineNo: 3,
        itemCode: 'PKG-BOX-25', itemName: '包装盒（25#）',
        spec: '标准GMP包装', unit: 'PCS',
        planQty: 5000, actualQty: 0,
        issueMethod: 'ON_SITE', operationSeq: 80, operationCode: 'OP-80',
        wipWarehouse: 'WIP-包装', sourceWarehouse: 'A1-原料仓',
        batchPicks: [], status: 'PENDING',
      },
    ],
  },
  {
    id: 'ISO003',
    issueNo: 'ISU-20260430-003',
    woNo: 'WO-20260429-003',
    moNo: 'MO-20260420-002',
    productCode: 'RKQ-30-06',
    productName: '根管锉 30# 06锥',
    issueMethod: 'BACKFLUSH',
    priority: 'LOW',
    warehouse: 'WIP-研磨',
    wipWarehouse: 'WIP-研磨',
    planDate: today,
    status: 'CLOSED',
    createdBy: '系统',
    createdAt: `${today} 07:00`,
    lines: [
      {
        id: 'L006', lineNo: 1,
        itemCode: 'AB-DIAMOND', itemName: '金刚石磨料',
        spec: 'D50=2μm', unit: 'G',
        planQty: 150, actualQty: 152,
        issueMethod: 'BACKFLUSH', operationSeq: 30, operationCode: 'OP-30',
        wipWarehouse: 'WIP-研磨', sourceWarehouse: 'WIP-研磨',
        batchPicks: [
          { batchNo: 'BT-20260410-AB', qty: 150, inboundDate: '2026-04-10', warehouseCode: 'WIP-研磨' },
          { batchNo: 'BT-20260405-AB', qty: 2, inboundDate: '2026-04-05', warehouseCode: 'WIP-研磨' },
        ],
        status: 'DONE',
      },
    ],
  },
];

// ── 线边仓库存 Mock ──────────────────────────────────────────────
export const MOCK_WIP_INVENTORY: WipInventory[] = [
  { warehouseCode: 'WIP-涂层', itemCode: 'CH-NITRIDE', itemName: '氮化钛涂层靶材', batchNo: 'BT-20260425-A1', qty: 800, availableQty: 800, lockedQty: 0, unit: 'G', inboundDate: '2026-04-25', expiryDate: '2027-04-25', updatedAt: `${today} 08:00` },
  { warehouseCode: 'WIP-涂层', itemCode: 'CH-NITRIDE', itemName: '氮化钛涂层靶材', batchNo: 'BT-20260420-A2', qty: 300, availableQty: 300, lockedQty: 0, unit: 'G', inboundDate: '2026-04-20', expiryDate: '2027-04-20', updatedAt: `${today} 08:00` },
  { warehouseCode: 'WIP-涂层', itemCode: 'CH-ADHESIVE', itemName: '涂层粘结剂', batchNo: 'BT-20260428-A1', qty: 500, availableQty: 500, lockedQty: 0, unit: 'ML', inboundDate: '2026-04-28', updatedAt: `${today} 08:00` },
  { warehouseCode: 'WIP-切割', itemCode: 'NW-SS316L', itemName: '不锈钢丝 316L', batchNo: 'BT-20260422-SS', qty: 50, availableQty: 50, lockedQty: 0, unit: 'KG', inboundDate: '2026-04-22', updatedAt: `${today} 08:00` },
  { warehouseCode: 'WIP-研磨', itemCode: 'AB-DIAMOND', itemName: '金刚石磨料', batchNo: 'BT-20260410-AB', qty: 30, availableQty: 30, lockedQty: 0, unit: 'G', inboundDate: '2026-04-10', updatedAt: `${today} 09:00` },
  { warehouseCode: 'WIP-研磨', itemCode: 'AB-DIAMOND', itemName: '金刚石磨料', batchNo: 'BT-20260415-AB', qty: 200, availableQty: 200, lockedQty: 0, unit: 'G', inboundDate: '2026-04-15', updatedAt: `${today} 09:00` },
];

// ── 倒扣日志 Mock ────────────────────────────────────────────────
export const MOCK_BACKFLUSH_LOGS: BackflushLog[] = [
  {
    id: 'BF001', woNo: 'WO-20260429-003', operationSeq: 30, operationCode: 'OP-30',
    triggerPoint: 'OPERATION_REPORT',
    itemCode: 'AB-DIAMOND', itemName: '金刚石磨料',
    bomChildQty: 30, baseBatchQty: 1000, reportQty: 5000, lossRate: 1,
    stdQty: 151.5, actualQty: 152, wipWarehouse: 'WIP-研磨',
    status: 'OVER_CONSUME', errorMsg: '超耗：标准151.5，实际152（拆批向上取整）',
    createdAt: `${today} 07:30`,
  },
  {
    id: 'BF002', woNo: 'WO-20260429-004', operationSeq: 40, operationCode: 'OP-40',
    triggerPoint: 'OPERATION_REPORT',
    itemCode: 'CH-NITRIDE', itemName: '氮化钛涂层靶材',
    bomChildQty: 100, baseBatchQty: 1000, reportQty: 3000, lossRate: 2,
    stdQty: 306, actualQty: 306, wipWarehouse: 'WIP-涂层',
    status: 'SUCCESS', createdAt: `${today} 09:15`,
  },
  {
    id: 'BF003', woNo: 'WO-20260430-005', operationSeq: 30, operationCode: 'OP-30',
    triggerPoint: 'OPERATION_REPORT',
    itemCode: 'AB-COARSE', itemName: '粗磨磨料',
    bomChildQty: 50, baseBatchQty: 1000, reportQty: 2000, lossRate: 0,
    stdQty: 100, actualQty: 30, wipWarehouse: 'WIP-研磨',
    status: 'INSUFFICIENT', errorMsg: '线边仓库存不足，应扣100，实扣30，缺70',
    createdAt: `${today} 10:00`,
  },
];

// ════════════════════════════════════════════════════════════════
// localStorage 持久化
// ════════════════════════════════════════════════════════════════

const STORE_KEY_ORDERS = 'bip_issue_orders';
const STORE_KEY_WIP    = 'bip_wip_inventory';
const STORE_KEY_BF     = 'bip_backflush_logs';

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
