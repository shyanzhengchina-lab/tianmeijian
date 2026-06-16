/**
 * MES 共享数据仓库 — mesStore.ts
 * ================================================================
 * 统一 localStorage 键名，确保四层生产链路数据共享：
 *   L1 生产订单  bip_production_orders
 *   L2 生产工单  bip_work_orders
 *   L3 生产任务单 bip_task_orders
 *   L4 生产浮票  bip_float_tickets
 *   PAD 执行图  bip_pad_exec_map
 *   EBR 批记录  bip_ebr_records
 *
 * 每个模块用 loadXxx() / saveXxx() 读写同一套键，
 * 确保：ProductionOrderPage ↔ WorkOrderListPage ↔ TaskOrderPage
 *       ↔ PadIndex ↔ EbrListPage 数据完全打通。
 * ================================================================
 */

import {
  mockProductionOrders,
  mockWorkOrders,
  mockTaskOrders,
  mockFloatTicketsV2,
  type ProductionOrder,
  type WorkOrder,
  type TaskOrder,
  type FloatTicketV2,
} from '../pages/workorder/workOrderData';
import { mockStations, type StationCard } from '../pages/workshop/workshopData';
import {
  mockEquipRecords,
  mockFaultRecords,
  mockMaintPlans,
  mockCalibRecords,
  mockSpareparts,
  type EquipRecord,
  type FaultRecord,
  type MaintPlan,
  type CalibRecord,
  type SparePartRecord,
} from '../pages/equipment/equipmentData';
import { mockCategories, mockMaterials, mockUnitGroups } from './mockData';
import { mockBomList } from './bomData';
import { mockProductSeries, mockRoutingMasters } from '../pages/pro/seriesData';

// ── 键名常量 ──────────────────────────────────────────────────────
export const STORE_KEYS = {
  PRODUCTION_ORDERS: 'bip_production_orders',
  WORK_ORDERS:       'bip_work_orders',
  TASK_ORDERS:       'bip_task_orders',
  FLOAT_TICKETS:     'bip_float_tickets',
  PAD_EXEC_MAP:      'bip_pad_exec_map',
  PAD_SELECTED_WO:   'bip_pad_selected_wo',
  PAD_VIEW:          'bip_pad_view',
  PAD_CURRENT_OP:    'bip_pad_current_op_code',
  EBR_RECORDS:       'bip_ebr_records',
  EBR_VERSION:       'bip_ebr_version',
  // 车间执行
  WORKSHOP_STATIONS: 'bip_workshop_stations',
  TASK_POOL:         'bip_task_pool',
  TASK_POOL_OPERATOR:'bip_task_pool_operator',
  // 设备管理
  EQUIP_RECORDS:     'bip_equip_records',
  FAULT_RECORDS:     'bip_fault_records',
  MAINT_PLANS:       'bip_maint_plans',
  CALIB_RECORDS:     'bip_calib_records',
  SPARE_PARTS:       'bip_spare_parts',
} as const;

// ── 数据版本（用于强制刷新 mock 数据） ─────────────────────────────
const DATA_VERSION = 'v20260606_e';
const VERSION_KEY  = 'bip_data_version';

// ── 读/写工具 ─────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s !== null) return JSON.parse(s) as T;
  } catch { /* ignore */ }
  return fallback;
}

function save<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── 核心清除：删除所有 bip_ 前缀的 localStorage 键 ──────────────
function clearAllBipKeys(): void {
  // 保护名单：以下 key 不能被版本清除覆盖
  const KEEP_KEYS = new Set([
    'bip_user_cleared',   // USER_CLEARED_KEY — 直接用字符串避免 TDZ 问题
    'bip_cur_factory',
    'bip_login_user',
    'bip_auth_token',
    // ── 演示数据保护：以下 key 由 DemoDataInjectorPage 写入，不能被版本清除覆盖 ──
    'bip_production_orders',
    'bip_work_orders',
    'bip_ebr_records',
    'bip_pad_exec_map',
    'bip_demo_bom',
    'bip_demo_pick_list',
    'bip_demo_inspections',
    'bip_demo_release',
    'bip_demo_deviations',
    'bip_demo_semi_receipt',
    'bip_demo_fg_receipt',
    'bip_demo_injected',
    // ── 基础资料演示数据保护 ──
    'bip_materials',
    'bip_material_categories',
    'bip_routings',
    'bip_product_series',
    'bip_product_families',
  ]);
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('bip_') && !KEEP_KEYS.has(k)) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
  // Also clear production-related non-bip keys
  [
    'production_orders_v2', 'fg_receipts', 'sales_shipments',
    'udi_records', 'udi_pi_rule', 'udi_di_map',
  ].forEach(k => localStorage.removeItem(k));
}

// ── 版本检测：版本不符时用 mock 数据重置 ─────────────────────────
function ensureVersion(): void {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== DATA_VERSION) {
    // 清除所有 bip_ 旧数据（演示数据相关 key 已在 KEEP_KEYS 中保护，不会被清除）
    clearAllBipKeys();
    // 写入 mock 初始数据（仅在没有演示数据时写入，避免覆盖注入的演示数据）
    const hasDemoData = !!localStorage.getItem('bip_demo_injected');
    if (!hasDemoData) {
      save(STORE_KEYS.PRODUCTION_ORDERS, mockProductionOrders);  // []
      save(STORE_KEYS.WORK_ORDERS,       mockWorkOrders);         // []
      save(STORE_KEYS.TASK_ORDERS,       mockTaskOrders);         // []
      save(STORE_KEYS.FLOAT_TICKETS,     mockFloatTicketsV2);     // []
    }
    // 车间执行初始数据（不含演示业务数据，始终写入）
    save(STORE_KEYS.WORKSHOP_STATIONS, mockStations);
    // 设备管理模块
    save(STORE_KEYS.EQUIP_RECORDS,     mockEquipRecords);
    save(STORE_KEYS.FAULT_RECORDS,     mockFaultRecords);
    save(STORE_KEYS.MAINT_PLANS,       mockMaintPlans);
    save(STORE_KEYS.CALIB_RECORDS,     mockCalibRecords);
    save(STORE_KEYS.SPARE_PARTS,       mockSpareparts);
    // 标记版本
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
  }
}

// ── POC 数据自动种子（保健品行业演示数据常驻）────────────────────────
/**
 * 启动时自动将保健品 POC 数据写入 localStorage，无需手动点击"演示数据注入"。
 * 判断逻辑：
 *  1. bip_material_categories 为空 → 必须写入
 *  2. bip_material_categories 含有旧医疗器械关键词（镍钛/根管）→ 覆盖写入
 *  3. 其余基础资料 key 为空时各自补写，不覆盖已存在的有效数据
 */
function seedPocData(): void {
  // ── 1. 物料分类：扁平化 mockCategories 写入 ────────────────────────
  const existingCats = localStorage.getItem('bip_material_categories');
  let needsCatSeed = !existingCats;
  if (!needsCatSeed && existingCats) {
    try {
      const parsed = JSON.parse(existingCats);
      const flat = JSON.stringify(parsed);
      // 旧数据含医疗器械关键词或数据为空数组 → 重新种入
      if (flat.includes('镍钛') || flat.includes('根管') || flat.includes('锉') ||
          !Array.isArray(parsed) || parsed.length === 0) {
        needsCatSeed = true;
      }
    } catch { needsCatSeed = true; }
  }

  if (needsCatSeed) {
    // 扁平化分类树（去掉 children 字段写入 localStorage）
    const flatCats: Array<{ id: string; code: string; name: string; parentId?: string }> = [];
    const walkCats = (items: typeof mockCategories[0]['children']) => {
      if (!items) return;
      items.forEach((c: any) => {
        flatCats.push({ id: c.id, code: c.code, name: c.name, parentId: c.parentId });
        if (c.children) walkCats(c.children);
      });
    };
    // mockCategories[0] 是 "全部" 根节点，将其本身也写入
    const root = mockCategories[0];
    flatCats.push({ id: root.id, code: root.code, name: root.name });
    walkCats(root.children);
    localStorage.setItem('bip_material_categories', JSON.stringify(flatCats));
  }

  // ── 2. 物料档案：为空或含旧医疗器械数据时写入 ─────────────────────
  const existingMats = localStorage.getItem('bip_materials');
  let needsMatSeed = !existingMats;
  if (!needsMatSeed && existingMats) {
    try {
      const parsed = JSON.parse(existingMats);
      const flat = JSON.stringify(parsed);
      if (flat.includes('根管') || flat.includes('镍钛') || !Array.isArray(parsed) || parsed.length === 0) {
        needsMatSeed = true;
      }
    } catch { needsMatSeed = true; }
  }
  if (needsMatSeed) {
    localStorage.setItem('bip_materials', JSON.stringify(mockMaterials));
  }

  // ── 3. 计量单位：为空时写入 ──────────────────────────────────────────
  const existingUnits = localStorage.getItem('bip_units');
  if (!existingUnits) {
    localStorage.setItem('bip_units', JSON.stringify(mockUnitGroups));
  }

  // ── 4. 工艺路径：为空或含旧医疗器械数据时写入 ─────────────────────
  const existingRoutings = localStorage.getItem('bip_routings');
  let needsRoutingSeed = !existingRoutings;
  if (!needsRoutingSeed && existingRoutings) {
    try {
      const parsed = JSON.parse(existingRoutings);
      const flat = JSON.stringify(parsed);
      if (flat.includes('根管锉') || flat.includes('机用根管') || !Array.isArray(parsed) || parsed.length === 0) {
        needsRoutingSeed = true;
      }
    } catch { needsRoutingSeed = true; }
  }
  if (needsRoutingSeed) {
    localStorage.setItem('bip_routings', JSON.stringify(mockRoutingMasters));
  }

  // ── 5. 产品系列：为空或含旧医疗器械数据时写入 ─────────────────────
  const existingSeries = localStorage.getItem('bip_product_series');
  let needsSeriesSeed = !existingSeries;
  if (!needsSeriesSeed && existingSeries) {
    try {
      const parsed = JSON.parse(existingSeries);
      const flat = JSON.stringify(parsed);
      if (flat.includes('根管锉') || flat.includes('机用根管') || !Array.isArray(parsed) || parsed.length === 0) {
        needsSeriesSeed = true;
      }
    } catch { needsSeriesSeed = true; }
  }
  if (needsSeriesSeed) {
    localStorage.setItem('bip_product_series', JSON.stringify(mockProductSeries));
    // 同时写入产品族
    localStorage.setItem('bip_product_families', JSON.stringify([
      '维生素/矿物质族', '植物提取物族', '益生菌族', '功能性食品族',
    ]));
  }

  // ── 6. BOM数据：为空或含旧根管锉数据时写入天美健BOM ────────────
  const existingBom = localStorage.getItem('bip_demo_bom');
  let needsBomSeed = !existingBom;
  if (!needsBomSeed && existingBom) {
    try {
      const parsed = JSON.parse(existingBom);
      const flat = JSON.stringify(parsed);
      // 旧数据含牙科器械关键词 或 旧保健品编码（FG-VitC-xxx / FG-PROBIO-250-xx）→ 重新种入新BOM
      if (flat.includes('根管锉') || flat.includes('镍钛') || flat.includes('FG-RKQ') ||
          flat.includes('PK-BOX-SET') || flat.includes('BOM-TMJ-') ||
          flat.includes('FG-VitC-500-60') || flat.includes('FG-VitC-1000-120') ||
          flat.includes('FG-PROBIO-250-30') || flat.includes('FG-PROBIO-250-60') ||
          !Array.isArray(parsed) || parsed.length === 0) {
        needsBomSeed = true;
      }
    } catch { needsBomSeed = true; }
  }
  if (needsBomSeed) {
    try { localStorage.setItem('bip_demo_bom', JSON.stringify(mockBomList)); } catch { /* ignore */ }
  }

  // ── 7. 标记 POC 数据已注入（与 DemoDataInjectorPage 保持兼容）─────
  if (!localStorage.getItem('bip_demo_injected')) {
    localStorage.setItem('bip_demo_injected', '1');
  }
}

// 应用启动时调用一次
ensureVersion();
// POC 数据常驻种入（保健品行业基础资料自动写入 localStorage）
seedPocData();

// ── 生产订单 ─────────────────────────────────────────────────────
export function loadProductionOrders(): ProductionOrder[] {
  return load(STORE_KEYS.PRODUCTION_ORDERS, mockProductionOrders);
}
export function saveProductionOrders(data: ProductionOrder[]): void {
  save(STORE_KEYS.PRODUCTION_ORDERS, data);
}

// ── 生产工单 ─────────────────────────────────────────────────────
export function loadWorkOrders(): WorkOrder[] {
  return load(STORE_KEYS.WORK_ORDERS, mockWorkOrders);
}
export function saveWorkOrders(data: WorkOrder[]): void {
  save(STORE_KEYS.WORK_ORDERS, data);
}

// ── 生产任务单 ────────────────────────────────────────────────────
export function loadTaskOrders(): TaskOrder[] {
  return load(STORE_KEYS.TASK_ORDERS, mockTaskOrders);
}
export function saveTaskOrders(data: TaskOrder[]): void {
  save(STORE_KEYS.TASK_ORDERS, data);
}

// ── 生产浮票 ─────────────────────────────────────────────────────
export function loadFloatTickets(): FloatTicketV2[] {
  return load(STORE_KEYS.FLOAT_TICKETS, mockFloatTicketsV2);
}
export function saveFloatTickets(data: FloatTicketV2[]): void {
  save(STORE_KEYS.FLOAT_TICKETS, data);
}

// ── 快速辅助：通过工单ID获取任务单列表 ────────────────────────────
export function getTasksByWoId(woId: string): TaskOrder[] {
  return loadTaskOrders().filter(t => t.woId === woId);
}

// ── 快速辅助：通过任务单更新工单进度 ─────────────────────────────
export function syncWoProgressFromTasks(woId: string): void {
  const tasks = getTasksByWoId(woId);
  const wos   = loadWorkOrders();
  const idx   = wos.findIndex(w => w.id === woId);
  if (idx < 0) return;

  const wo   = wos[idx];
  const done = tasks.filter(t => t.status === 'DONE');
  const inPg = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'PAUSED');

  // 已报工数量累计
  const reportQty = done.reduce((s, t) => s + (t.reportQty || 0), 0);
  const scrapQty  = done.reduce((s, t) => s + (t.scrapQty  || 0), 0);

  // 工序进度：基于已完成任务涵盖的工序数 / 工艺路径总工序数
  const allStepIds     = tasks.flatMap(t => t.stepIds || []);
  const uniqueStepIds  = [...new Set(allStepIds)];
  const doneStepIds    = done.flatMap(t => t.stepIds || []);
  const uniqueDone     = [...new Set(doneStepIds)];
  const progressPct    = uniqueStepIds.length > 0
    ? Math.round((uniqueDone.length / uniqueStepIds.length) * 100)
    : wo.progressPct || 0;

  // 当前工序：取最后一个 IN_PROGRESS 任务的 currentOpNo，或最后完成任务的最后工序
  let currentOp = wo.currentOp;
  if (inPg.length > 0) {
    const t = inPg[inPg.length - 1];
    currentOp = t.currentOpNo || t.stationScope;
  }

  // 状态推断
  let status = wo.status;
  const hasInProgress = inPg.length > 0;
  const allDone       = tasks.length > 0 && tasks.every(t => t.status === 'DONE');

  if (allDone) {
    status = 'COMPLETED';
  } else if (hasInProgress || done.length > 0) {
    if (wo.status === 'RELEASED' || wo.status === 'CREATED') {
      status = 'IN_PROGRESS';
    }
  }

  const updated: WorkOrder = {
    ...wo,
    status:      status as WorkOrder['status'],
    actualQty:   reportQty > 0 ? reportQty : wo.actualQty,
    scrapQty:    scrapQty  > 0 ? scrapQty  : wo.scrapQty,
    progressPct,
    currentOp,
    actualStart: wo.actualStart || (hasInProgress || done.length > 0
      ? (tasks.find(t => t.actualStart)?.actualStart)
      : undefined),
    actualEnd: allDone
      ? (done[done.length - 1]?.actualEnd)
      : undefined,
  };

  wos[idx] = updated;
  saveWorkOrders(wos);
}

// ── 快速辅助：通过工单更新生产订单进度 ───────────────────────────
export function syncPoProgressFromWos(poId: string): void {
  const pos = loadProductionOrders();
  const wos = loadWorkOrders();
  const idx = pos.findIndex(p => p.id === poId);
  if (idx < 0) return;

  const po      = pos[idx];
  const relWOs  = wos.filter(w => w.poId === poId);
  const doneQty = relWOs.reduce((s, w) => s + (w.actualQty || 0), 0);
  const scrapQty= relWOs.reduce((s, w) => s + (w.scrapQty  || 0), 0);
  const allDone = relWOs.length > 0 && relWOs.every(w => w.status === 'COMPLETED');
  const hasInPg = relWOs.some(w => w.status === 'IN_PROGRESS');

  let status = po.status;
  if (allDone) {
    status = 'COMPLETED';
  } else if (hasInPg || doneQty > 0) {
    if (po.status === 'RELEASED' || po.status === 'OPEN') {
      status = 'IN_PROGRESS';
    }
  }

  pos[idx] = {
    ...po,
    status:       status as ProductionOrder['status'],
    completedQty: doneQty,
    scrapQty:     scrapQty,
  };
  saveProductionOrders(pos);
}

// ── 设备管理 ──────────────────────────────────────────────────────
export function loadEquipRecords(): EquipRecord[] {
  return load(STORE_KEYS.EQUIP_RECORDS, mockEquipRecords);
}
export function saveEquipRecords(data: EquipRecord[]): void {
  save(STORE_KEYS.EQUIP_RECORDS, data);
}

export function loadFaultRecords(): FaultRecord[] {
  return load(STORE_KEYS.FAULT_RECORDS, mockFaultRecords);
}
export function saveFaultRecords(data: FaultRecord[]): void {
  save(STORE_KEYS.FAULT_RECORDS, data);
}

export function loadMaintPlans(): MaintPlan[] {
  return load(STORE_KEYS.MAINT_PLANS, mockMaintPlans);
}
export function saveMaintPlans(data: MaintPlan[]): void {
  save(STORE_KEYS.MAINT_PLANS, data);
}

export function loadCalibRecords(): CalibRecord[] {
  return load(STORE_KEYS.CALIB_RECORDS, mockCalibRecords);
}
export function saveCalibRecords(data: CalibRecord[]): void {
  save(STORE_KEYS.CALIB_RECORDS, data);
}

export function loadSpareParts(): SparePartRecord[] {
  return load(STORE_KEYS.SPARE_PARTS, mockSpareparts);
}
export function saveSpareParts(data: SparePartRecord[]): void {
  save(STORE_KEYS.SPARE_PARTS, data);
}

// ── 车间看板工位 ────────────────────────────────────────────────
export function loadWorkshopStations(): StationCard[] {
  return load(STORE_KEYS.WORKSHOP_STATIONS, mockStations);
}
export function saveWorkshopStations(data: StationCard[]): void {
  save(STORE_KEYS.WORKSHOP_STATIONS, data);
}

// ── PAD任务池 ─────────────────────────────────────────────────────
export function loadTaskPool<T>(fallback: T[]): T[] {
  return load(STORE_KEYS.TASK_POOL, fallback);
}
export function saveTaskPool<T>(data: T[]): void {
  save(STORE_KEYS.TASK_POOL, data);
}
export function loadTaskPoolOperator(): string | null {
  return load<string | null>(STORE_KEYS.TASK_POOL_OPERATOR, null);
}
export function saveTaskPoolOperator(operatorId: string | null): void {
  save(STORE_KEYS.TASK_POOL_OPERATOR, operatorId);
}

// ── 重置所有数据到初始 mock ──────────────────────────────────────
export function resetAllMesData(): void {
  localStorage.removeItem(VERSION_KEY);
  ensureVersion();
}

// ── 「用户已清空」标志键（防止 API 重新写入数据）─────────────────
export const USER_CLEARED_KEY = 'bip_user_cleared';

export function isUserCleared(): boolean {
  return localStorage.getItem(USER_CLEARED_KEY) === '1';
}

export function setUserCleared(cleared: boolean): void {
  if (cleared) {
    localStorage.setItem(USER_CLEARED_KEY, '1');
  } else {
    localStorage.removeItem(USER_CLEARED_KEY);
  }
}

// ── 强制清空生产相关数据（生产订单/工单/任务单/浮票/PAD）────────────
export function clearProductionData(): void {
  [
    STORE_KEYS.PRODUCTION_ORDERS,
    STORE_KEYS.WORK_ORDERS,
    STORE_KEYS.TASK_ORDERS,
    STORE_KEYS.FLOAT_TICKETS,
    STORE_KEYS.PAD_EXEC_MAP,
    STORE_KEYS.PAD_SELECTED_WO,
    STORE_KEYS.PAD_VIEW,
    STORE_KEYS.PAD_CURRENT_OP,
    STORE_KEYS.TASK_POOL,
    STORE_KEYS.EBR_RECORDS,
    STORE_KEYS.EBR_VERSION,
    'production_orders_v2',
  ].forEach(k => localStorage.removeItem(k));
  save(STORE_KEYS.PRODUCTION_ORDERS, []);
  save(STORE_KEYS.WORK_ORDERS,       []);
  save(STORE_KEYS.TASK_ORDERS,       []);
  save(STORE_KEYS.FLOAT_TICKETS,     []);
  save(STORE_KEYS.EBR_RECORDS,       []);
  // 标记用户已主动清空，防止 loadFromApi 重新用 API 数据覆盖
  setUserCleared(true);
}
