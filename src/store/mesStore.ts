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
import { mockInspectionTasks, mockQualityReleases } from '../pages/inspection/qmsData';
import { MOCK_EBR_LIST, EBR_DATA_VERSION } from '../pages/ebr/ebrData';

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
const DATA_VERSION = 'v20260617_c';
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
    'bip_task_orders',
    'bip_float_tickets',
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
    'bip_inspection_tasks',
    'bip_quality_releases',
  ]);
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    // bip_pad_exec_snap_* 保留真实PAD执行快照，不随版本清除
    if (k && k.startsWith('bip_') && !KEEP_KEYS.has(k) && !k.startsWith('bip_pad_exec_snap_')) keys.push(k);
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
      if (flat.includes('根管') || flat.includes('镍钛') ||
          flat.includes('FG-VitC-1000-120') || flat.includes('FG-VitC-500-60') ||
          !Array.isArray(parsed) || parsed.length === 0) {
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

  // ── 7. 生产订单：为空时补种天美健Demo数据 ────────────────────────
  const existingPOs = localStorage.getItem('bip_production_orders');
  let needsPOSeed = !existingPOs;
  if (!needsPOSeed && existingPOs) {
    try {
      const parsed = JSON.parse(existingPOs);
      if (!Array.isArray(parsed) || parsed.length === 0) needsPOSeed = true;
    } catch { needsPOSeed = true; }
  }
  if (needsPOSeed) {
    try { localStorage.setItem('bip_production_orders', JSON.stringify(mockProductionOrders)); } catch { /* ignore */ }
  }

  // ── 8. 生产工单：为空时补种天美健Demo数据 ────────────────────────
  const existingWOs = localStorage.getItem('bip_work_orders');
  let needsWOSeed = !existingWOs;
  if (!needsWOSeed && existingWOs) {
    try {
      const parsed = JSON.parse(existingWOs);
      if (!Array.isArray(parsed) || parsed.length === 0) needsWOSeed = true;
    } catch { needsWOSeed = true; }
  }
  if (needsWOSeed) {
    try { localStorage.setItem('bip_work_orders', JSON.stringify(mockWorkOrders)); } catch { /* ignore */ }
  }

  // ── 9. 生产任务单：为空时补种天美健Demo数据 ────────────────────────
  const existingTasks = localStorage.getItem('bip_task_orders');
  let needsTaskSeed = !existingTasks;
  if (!needsTaskSeed && existingTasks) {
    try {
      const parsed = JSON.parse(existingTasks);
      if (!Array.isArray(parsed) || parsed.length === 0) needsTaskSeed = true;
    } catch { needsTaskSeed = true; }
  }
  if (needsTaskSeed) {
    try { localStorage.setItem('bip_task_orders', JSON.stringify(mockTaskOrders)); } catch { /* ignore */ }
  }

  // ── 10. 质检任务单：为空时补种天美健Demo数据 ────────────────────────
  const existingInspTasks = localStorage.getItem('bip_inspection_tasks');
  let needsInspSeed = !existingInspTasks;
  if (!needsInspSeed && existingInspTasks) {
    try {
      const parsed = JSON.parse(existingInspTasks);
      if (!Array.isArray(parsed) || parsed.length === 0) needsInspSeed = true;
    } catch { needsInspSeed = true; }
  }
  if (needsInspSeed) {
    try { localStorage.setItem('bip_inspection_tasks', JSON.stringify(mockInspectionTasks)); } catch { /* ignore */ }
  }

  // ── 11. 质量放行：为空时补种天美健Demo数据 ────────────────────────
  const existingReleases = localStorage.getItem('bip_quality_releases');
  let needsRelSeed = !existingReleases;
  if (!needsRelSeed && existingReleases) {
    try {
      const parsed = JSON.parse(existingReleases);
      if (!Array.isArray(parsed) || parsed.length === 0) needsRelSeed = true;
    } catch { needsRelSeed = true; }
  }
  if (needsRelSeed) {
    try { localStorage.setItem('bip_quality_releases', JSON.stringify(mockQualityReleases)); } catch { /* ignore */ }
  }

  // ── 12. 标记 POC 数据已注入（与 DemoDataInjectorPage 保持兼容）─────
  if (!localStorage.getItem('bip_demo_injected')) {
    localStorage.setItem('bip_demo_injected', '1');
  }

  // ── 13. EBR批记录：每次启动都确保5条MOCK记录存在 ─────────────────
  // 策略：
  //   a) 若 bip_ebr_records 为空或版本不一致 → 直接写入 MOCK_EBR_LIST（5条）
  //   b) 若已有记录 → 按 id 检查缺失的 MOCK 条目并追加（保留用户审批记录）
  //   c) 版本不一致时强制全量重置（避免旧格式残留导致只显示1条）
  // 注：bip_ebr_records 已从 KEEP_KEYS 移除，DATA_VERSION 升级时会被清空，
  // 此步骤在清空后补入 MOCK_EBR_LIST，确保5条全量存在。
  {
    const existingEbrVersion = localStorage.getItem('bip_ebr_version');
    const existingEbr = localStorage.getItem('bip_ebr_records');
    try {
      const parsed: any[] = existingEbr ? JSON.parse(existingEbr) : [];
      if (!Array.isArray(parsed) || parsed.length === 0 || existingEbrVersion !== EBR_DATA_VERSION) {
        // 版本不一致或无数据 → 强制全量重写（用户从未审批，可以安全覆盖）
        localStorage.setItem('bip_ebr_records', JSON.stringify(MOCK_EBR_LIST));
        localStorage.setItem('bip_ebr_version', EBR_DATA_VERSION);
      } else {
        // 版本一致且有数据 → 按id补全缺失的 MOCK 条目
        const existingIds = new Set(parsed.map((e: any) => e.id));
        const missing = MOCK_EBR_LIST.filter(m => !existingIds.has(m.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem('bip_ebr_records', JSON.stringify(merged));
          localStorage.setItem('bip_ebr_version', EBR_DATA_VERSION);
        }
      }
    } catch {
      try {
        localStorage.setItem('bip_ebr_records', JSON.stringify(MOCK_EBR_LIST));
        localStorage.setItem('bip_ebr_version', EBR_DATA_VERSION);
      } catch { /* ignore */ }
    }
  }

  // ── 14. PAD execMap 快照预种（全量）──────────────────────────────
  // 为 WO001~WO005 所有批次的批记录打印页预置完整 execMap 快照（7道GMP工序），
  // 使 §1~§7 所有章节都能显示完整的演示数据，不再出现"数据待填入"空白。
  // key: bip_pad_exec_snap_{woId}，版本键: bip_pad_exec_snap_version
  const PAD_SNAP_VERSION = 'v20260617_snap2';
  const existingSnapVersion = localStorage.getItem('bip_pad_exec_snap_version');
  if (existingSnapVersion !== PAD_SNAP_VERSION) {
    try {
      // ── 公共阶段构建工具函数 ──────────────────────────────────────────
      const mkStages = (pre: any, check: any, mat: any, dc: any, rpt: any, cout: any) => ({
        PRE_CLEAN:    { code: 'PRE_CLEAN',   status: 'completed', ...pre   },
        CHECK_IN:     { code: 'CHECK_IN',    status: 'completed', ...check },
        MAT_VERIFY:   { code: 'MAT_VERIFY',  status: 'completed', ...mat  },
        FIRST_PIECE:  { code: 'FIRST_PIECE', status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
        DATA_COLLECT: { code: 'DATA_COLLECT', status: 'completed', ...dc  },
        SELF_CHECK:   { code: 'SELF_CHECK',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
        POST_CLEAN:   { code: 'POST_CLEAN',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
        REPORT:       { code: 'REPORT',      status: 'completed', ...rpt  },
        CHECK_OUT:    { code: 'CHECK_OUT',   status: 'completed', ...cout },
      });
      const mkPreClean = (date: string, op: string, certNo: string, temp: string, humid: string) => ({
        startTime: `${date} 08:00`, endTime: `${date} 08:20`, operator: op,
        data: { env_temp: temp, env_humid: humid, clean_cert: certNo,
          pc_wo: true, pc_bom: true, pc_cert: true, pc_material: true, pc_equip: true,
          pc_ppe: true, pc_env: true, pc_record: true, pc_qapprove: true,
          cert_no: certNo, cert_time: `${date} 08:00`, cert_expire: `${date} 20:00`,
        },
      });
      const mkReport = (st: string, et: string, op: string, fin: number, good: number, bad: number) => ({
        startTime: st, endTime: et, operator: op,
        data: { rpt_finish: fin, rpt_good: good, rpt_bad: bad, rpt_scrap: 0, rpt_operator: op },
      });
      const mkCheckOut = (t: string, op: string) => ({ startTime: t, endTime: t, operator: op, data: { out_operator: op } });
      const mkCheckIn  = (st: string, et: string, op: string) => ({ startTime: st, endTime: et, operator: op, data: {} });
      const mkMatVerify = (st: string, et: string, op: string, extra?: any) => ({ startTime: st, endTime: et, operator: op, data: extra ?? {} });

      // 9项生产前再确认默认全通过
      const preConfirm9 = {
        pc_wo: true, pc_bom: true, pc_cert: true, pc_material: true, pc_equip: true,
        pc_ppe: true, pc_env: true, pc_record: true, pc_qapprove: true,
      };

      // ── WO001: VitC咀嚼片 500mg×60粒/瓶 × 100,000瓶 全部完成 ─────────────
      const wo1Map: Record<string, any> = {
        'OP-GMP-WEIGH': {
          opCode: 'OP-GMP-WEIGH', status: 'completed',
          inTime: '2026-06-01 08:00', outTime: '2026-06-01 09:40',
          finishQty: 100000, goodQty: 100000, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-01', '李建国', 'QC-CLN-20260601-001', '22', '48'),
            mkCheckIn('2026-06-01 08:20', '2026-06-01 08:25', '李建国'),
            mkMatVerify('2026-06-01 08:25', '2026-06-01 08:40', '李建国'),
            { startTime: '2026-06-01 08:40', endTime: '2026-06-01 09:30', operator: '李建国',
              data: { dc_table: [
                { material_name: '维生素C（原料药）', batch_no: 'RM-VITC-20260601-001', plan_qty: '44.000', actual_qty: '44.006', balance_check: '复核一致', dc_operator: '李建国' },
                { material_name: '甘露醇', batch_no: 'RM-MAN-20260601-001', plan_qty: '25.000', actual_qty: '24.998', balance_check: '复核一致', dc_operator: '李建国' },
                { material_name: '柠檬酸', batch_no: 'RM-CA-20260601-001', plan_qty: '2.500', actual_qty: '2.500', balance_check: '复核一致', dc_operator: '李建国' },
                { material_name: '硬脂酸镁', batch_no: 'RM-MG-20260601-001', plan_qty: '1.000', actual_qty: '1.000', balance_check: '复核一致', dc_operator: '李建国' },
                { material_name: '微晶纤维素', batch_no: 'RM-MCC-20260601-001', plan_qty: '7.500', actual_qty: '7.502', balance_check: '复核一致', dc_operator: '李建国' },
              ]},
            },
            mkReport('2026-06-01 09:30', '2026-06-01 09:40', '李建国', 100000, 100000, 0),
            mkCheckOut('2026-06-01 09:40', '李建国'),
          ),
        },
        'OP-GMP-MIX': {
          opCode: 'OP-GMP-MIX', status: 'completed',
          inTime: '2026-06-01 10:00', outTime: '2026-06-01 12:05',
          finishQty: 100000, goodQty: 100000, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-01', '李建国', 'QC-CLN-20260601-002', '22', '47'),
            mkCheckIn('2026-06-01 10:00', '2026-06-01 10:05', '李建国'),
            mkMatVerify('2026-06-01 10:05', '2026-06-01 10:10', '李建国'),
            { startTime: '2026-06-01 10:10', endTime: '2026-06-01 11:50', operator: '李建国',
              data: { dc_table: [{ mix_speed: '15', mix_time: '30', rsd: '2.8', env_temp: '22', env_humid: '47', dc_operator: '李建国' }] },
            },
            mkReport('2026-06-01 11:50', '2026-06-01 12:05', '李建国', 100000, 100000, 0),
            mkCheckOut('2026-06-01 12:05', '李建国'),
          ),
        },
        'OP-GMP-GRANULATE': {
          opCode: 'OP-GMP-GRANULATE', status: 'completed',
          inTime: '2026-06-01 14:00', outTime: '2026-06-02 08:30',
          finishQty: 100000, goodQty: 99800, badQty: 0, scrapQty: 200, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-01', '李建国', 'QC-CLN-20260601-003', '23', '50'),
            mkCheckIn('2026-06-01 14:00', '2026-06-01 14:05', '李建国'),
            mkMatVerify('2026-06-01 14:05', '2026-06-01 14:15', '李建国'),
            { startTime: '2026-06-01 14:15', endTime: '2026-06-02 08:00', operator: '李建国',
              data: { dc_table: [{ granulate_speed: '200', dry_time: '120', moisture: '1.9', inlet_temp: '65', outlet_temp: '42', dc_operator: '李建国' }] },
            },
            mkReport('2026-06-02 08:00', '2026-06-02 08:30', '李建国', 99800, 99800, 0),
            mkCheckOut('2026-06-02 08:30', '李建国'),
          ),
        },
        'OP-GMP-COATING': {
          opCode: 'OP-GMP-COATING', status: 'completed',
          inTime: '2026-06-02 09:00', outTime: '2026-06-02 17:00',
          finishQty: 99800, goodQty: 99800, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-02', '王芳', 'QC-CLN-20260602-001', '22', '46'),
            mkCheckIn('2026-06-02 09:00', '2026-06-02 09:05', '王芳'),
            mkMatVerify('2026-06-02 09:05', '2026-06-02 09:15', '王芳'),
            { startTime: '2026-06-02 09:15', endTime: '2026-06-02 16:30', operator: '王芳',
              data: { dc_table: [{ coating_material: '欧巴代OY-LS-28920', coat_gain: '3.0', inlet_temp: '55', air_volume: '1200', coat_time: '200', appearance: '白色均匀无龟裂', dc_operator: '王芳' }] },
            },
            mkReport('2026-06-02 16:30', '2026-06-02 17:00', '王芳', 99800, 99800, 0),
            mkCheckOut('2026-06-02 17:00', '王芳'),
          ),
        },
        'OP-GMP-INNERPACK': {
          opCode: 'OP-GMP-INNERPACK', status: 'completed',
          inTime: '2026-06-03 08:00', outTime: '2026-06-03 17:30',
          finishQty: 99800, goodQty: 99800, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            { startTime: '2026-06-03 07:30', endTime: '2026-06-03 08:00', operator: '刘晓梅',
              data: { ...preConfirm9, env_temp: '22', env_humid: '46', cert_no: 'QC-CLN-20260603-001', cert_time: '2026-06-03 08:00', cert_expire: '2026-06-03 20:00' },
            },
            mkCheckIn('2026-06-03 08:00', '2026-06-03 08:05', '刘晓梅'),
            mkMatVerify('2026-06-03 08:05', '2026-06-03 08:20', '刘晓梅', { mat_qty: '52.400' }),
            { startTime: '2026-06-03 08:20', endTime: '2026-06-03 17:00', operator: '刘晓梅',
              data: { dc_table: [
                { check_time: '2026-06-03 09:00', fill_qty: '60', fill_weight: '31.5', seal_check: '合格', label_check: '合格', temp: '22', humidity: '46', dc_operator: '刘晓梅' },
                { check_time: '2026-06-03 10:00', fill_qty: '60', fill_weight: '31.5', seal_check: '合格', label_check: '合格', temp: '22', humidity: '46', dc_operator: '刘晓梅' },
                { check_time: '2026-06-03 11:00', fill_qty: '60', fill_weight: '31.6', seal_check: '合格', label_check: '合格', temp: '22', humidity: '47', dc_operator: '刘晓梅' },
                { check_time: '2026-06-03 14:00', fill_qty: '60', fill_weight: '31.5', seal_check: '合格', label_check: '合格', temp: '23', humidity: '47', dc_operator: '刘晓梅' },
                { check_time: '2026-06-03 16:00', fill_qty: '60', fill_weight: '31.5', seal_check: '合格', label_check: '合格', temp: '23', humidity: '47', dc_operator: '刘晓梅' },
              ]},
            },
            mkReport('2026-06-03 17:00', '2026-06-03 17:30', '刘晓梅', 1663, 1663, 0),
            mkCheckOut('2026-06-03 17:30', '刘晓梅'),
          ),
        },
        'OP-GMP-INNERCLEAN': {
          opCode: 'OP-GMP-INNERCLEAN', status: 'completed',
          inTime: '2026-06-03 17:30', outTime: '2026-06-03 18:15',
          finishQty: 0, goodQty: 0, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: {
            PRE_CLEAN:    { code: 'PRE_CLEAN',   status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            CHECK_IN:     { code: 'CHECK_IN',    status: 'completed', startTime: '2026-06-03 17:30', endTime: '2026-06-03 17:35', operator: '刘晓梅', data: {} },
            MAT_VERIFY:   { code: 'MAT_VERIFY',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            FIRST_PIECE:  { code: 'FIRST_PIECE', status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            DATA_COLLECT: { code: 'DATA_COLLECT', status: 'completed', startTime: '2026-06-03 17:35', endTime: '2026-06-03 18:10', operator: '刘晓梅', data: { dc_table: [] } },
            SELF_CHECK:   { code: 'SELF_CHECK',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            POST_CLEAN:   { code: 'POST_CLEAN',  status: 'completed', startTime: '2026-06-03 18:00', endTime: '2026-06-03 18:10', operator: '刘晓梅',
              data: { clean_start: '2026-06-03 17:35', clean_end: '2026-06-03 18:10', clean_operator: '刘晓梅', cert_no: 'CLN-INNER-20260603-001' },
            },
            REPORT:       { code: 'REPORT',      status: 'completed', startTime: '2026-06-03 18:10', endTime: '2026-06-03 18:15', operator: '刘晓梅', data: { rpt_finish: 0, rpt_good: 0, rpt_bad: 0, rpt_scrap: 0, rpt_operator: '刘晓梅' } },
            CHECK_OUT:    { code: 'CHECK_OUT',   status: 'completed', startTime: '2026-06-03 18:15', endTime: '2026-06-03 18:15', operator: '刘晓梅', data: { out_operator: '刘晓梅' } },
          },
        },
        'OP-GMP-OUTERPACK': {
          opCode: 'OP-GMP-OUTERPACK', status: 'completed',
          inTime: '2026-06-03 09:00', outTime: '2026-06-03 17:00',
          finishQty: 1663, goodQty: 1663, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            { startTime: '2026-06-03 08:30', endTime: '2026-06-03 09:00', operator: '赵磊',
              data: { ...preConfirm9, env_temp: '22', env_humid: '46', cert_no: 'QC-CLN-20260603-002', cert_time: '2026-06-03 08:30', cert_expire: '2026-06-03 20:00' },
            },
            mkCheckIn('2026-06-03 09:00', '2026-06-03 09:05', '赵磊'),
            mkMatVerify('2026-06-03 09:05', '2026-06-03 09:15', '赵磊', { mat_version: 'PK-V20260501', batch_no: 'PK-BOX-20260601-001' }),
            { startTime: '2026-06-03 09:15', endTime: '2026-06-03 16:30', operator: '赵磊',
              data: { dc_table: [
                { check_time: '2026-06-03 10:00', bottles_per_box: '1', insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致', dc_operator: '赵磊' },
                { check_time: '2026-06-03 12:00', bottles_per_box: '1', insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致', dc_operator: '赵磊' },
                { check_time: '2026-06-03 14:00', bottles_per_box: '1', insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致', dc_operator: '赵磊' },
                { check_time: '2026-06-03 16:00', bottles_per_box: '1', insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致', dc_operator: '赵磊' },
              ]},
            },
            mkReport('2026-06-03 16:30', '2026-06-03 17:00', '赵磊', 1663, 1663, 0),
            mkCheckOut('2026-06-03 17:00', '赵磊'),
          ),
        },
      };

      // ── WO002: VitC咀嚼片 500mg×60粒/瓶 × 200,000粒 生产中（内包装进行中）────
      const wo2Map: Record<string, any> = {
        'OP-GMP-WEIGH': {
          opCode: 'OP-GMP-WEIGH', status: 'completed',
          inTime: '2026-06-05 08:00', outTime: '2026-06-05 09:50',
          finishQty: 160014, goodQty: 160014, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-05', '张伟', 'QC-CLN-20260605-001', '22', '48'),
            mkCheckIn('2026-06-05 08:20', '2026-06-05 08:25', '张伟'),
            mkMatVerify('2026-06-05 08:25', '2026-06-05 08:40', '张伟'),
            { startTime: '2026-06-05 08:40', endTime: '2026-06-05 09:30', operator: '张伟',
              data: { dc_table: [
                { material_name: '维生素C（原料药）', batch_no: 'RM-VITC-20260601', plan_qty: '88.000', actual_qty: '88.012', balance_check: '复核一致', dc_operator: '张伟' },
                { material_name: '甘露醇', batch_no: 'RM-MAN-20260601', plan_qty: '50.000', actual_qty: '49.998', balance_check: '复核一致', dc_operator: '张伟' },
                { material_name: '柠檬酸', batch_no: 'RM-CA-20260601', plan_qty: '5.000', actual_qty: '5.001', balance_check: '复核一致', dc_operator: '张伟' },
                { material_name: '硬脂酸镁', batch_no: 'RM-MG-20260601', plan_qty: '2.000', actual_qty: '2.000', balance_check: '复核一致', dc_operator: '张伟' },
                { material_name: '微晶纤维素', batch_no: 'RM-MCC-20260601', plan_qty: '15.000', actual_qty: '15.003', balance_check: '复核一致', dc_operator: '张伟' },
              ]},
            },
            mkReport('2026-06-05 09:30', '2026-06-05 09:50', '张伟', 160014, 160014, 0),
            mkCheckOut('2026-06-05 09:50', '张伟'),
          ),
        },
        'OP-GMP-MIX': {
          opCode: 'OP-GMP-MIX', status: 'completed',
          inTime: '2026-06-05 10:00', outTime: '2026-06-05 12:05',
          finishQty: 160014, goodQty: 160014, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-05', '张伟', 'QC-CLN-20260605-002', '22', '48'),
            mkCheckIn('2026-06-05 10:00', '2026-06-05 10:05', '张伟'),
            mkMatVerify('2026-06-05 10:05', '2026-06-05 10:10', '张伟'),
            { startTime: '2026-06-05 10:10', endTime: '2026-06-05 11:50', operator: '张伟',
              data: { dc_table: [{ mix_speed: '15', mix_time: '30', rsd: '3.2', env_temp: '22', env_humid: '48', dc_operator: '张伟' }] },
            },
            mkReport('2026-06-05 11:50', '2026-06-05 12:05', '张伟', 160014, 160014, 0),
            mkCheckOut('2026-06-05 12:05', '张伟'),
          ),
        },
        'OP-GMP-GRANULATE': {
          opCode: 'OP-GMP-GRANULATE', status: 'completed',
          inTime: '2026-06-05 14:00', outTime: '2026-06-06 08:30',
          finishQty: 159800, goodQty: 159800, badQty: 0, scrapQty: 214, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-05', '张伟', 'QC-CLN-20260605-003', '23', '50'),
            mkCheckIn('2026-06-05 14:00', '2026-06-05 14:05', '张伟'),
            mkMatVerify('2026-06-05 14:05', '2026-06-05 14:15', '张伟'),
            { startTime: '2026-06-05 14:15', endTime: '2026-06-06 08:00', operator: '张伟',
              data: { dc_table: [{ granulate_speed: '200', dry_time: '120', moisture: '2.0', inlet_temp: '65', outlet_temp: '43', dc_operator: '张伟' }] },
            },
            mkReport('2026-06-06 08:00', '2026-06-06 08:30', '张伟', 159800, 159800, 0),
            mkCheckOut('2026-06-06 08:30', '张伟'),
          ),
        },
        'OP-GMP-COATING': {
          opCode: 'OP-GMP-COATING', status: 'completed',
          inTime: '2026-06-06 09:00', outTime: '2026-06-06 17:30',
          finishQty: 159800, goodQty: 159800, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-06', '王芳', 'QC-CLN-20260606-001', '22', '47'),
            mkCheckIn('2026-06-06 09:00', '2026-06-06 09:05', '王芳'),
            mkMatVerify('2026-06-06 09:05', '2026-06-06 09:15', '王芳'),
            { startTime: '2026-06-06 09:15', endTime: '2026-06-06 16:30', operator: '王芳',
              data: { dc_table: [{ coating_material: '欧巴代OY-LS-28920', coat_gain: '3.1', inlet_temp: '55', air_volume: '1200', coat_time: '210', appearance: '白色均匀无龟裂', dc_operator: '王芳' }] },
            },
            mkReport('2026-06-06 16:30', '2026-06-06 17:30', '王芳', 159800, 159800, 0),
            mkCheckOut('2026-06-06 17:30', '王芳'),
          ),
        },
        'OP-GMP-INNERPACK': {
          opCode: 'OP-GMP-INNERPACK', status: 'in_progress',
          inTime: '2026-06-09 08:00', outTime: undefined,
          finishQty: 1250, goodQty: 1250, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            { startTime: '2026-06-09 07:30', endTime: '2026-06-09 08:00', operator: '刘晓梅',
              data: { ...preConfirm9, env_temp: '22', env_humid: '46', cert_no: 'QC-CLN-20260609-001', cert_time: '2026-06-09 08:00', cert_expire: '2026-06-09 20:00' },
            },
            mkCheckIn('2026-06-09 08:00', '2026-06-09 08:05', '刘晓梅'),
            mkMatVerify('2026-06-09 08:05', '2026-06-09 08:20', '刘晓梅', { mat_qty: '83.900' }),
            { startTime: '2026-06-09 08:20', endTime: '2026-06-09 12:00', operator: '刘晓梅',
              data: { dc_table: [
                { check_time: '2026-06-09 09:00', fill_qty: '60', fill_weight: '31.5', seal_check: '合格', label_check: '合格', temp: '22', humidity: '46', dc_operator: '刘晓梅' },
                { check_time: '2026-06-09 10:00', fill_qty: '60', fill_weight: '31.5', seal_check: '合格', label_check: '合格', temp: '22', humidity: '47', dc_operator: '刘晓梅' },
                { check_time: '2026-06-09 11:00', fill_qty: '60', fill_weight: '31.6', seal_check: '合格', label_check: '合格', temp: '23', humidity: '47', dc_operator: '刘晓梅' },
              ]},
            },
            mkReport('2026-06-09 12:00', '2026-06-09 12:00', '刘晓梅', 1250, 1250, 0),
            mkCheckOut('2026-06-09 12:00', '刘晓梅'),
          ),
        },
        'OP-GMP-INNERCLEAN': {
          opCode: 'OP-GMP-INNERCLEAN', status: 'pending',
          inTime: undefined, outTime: undefined,
          finishQty: 0, goodQty: 0, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: {
            PRE_CLEAN:    { code: 'PRE_CLEAN',   status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            CHECK_IN:     { code: 'CHECK_IN',    status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            MAT_VERIFY:   { code: 'MAT_VERIFY',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            FIRST_PIECE:  { code: 'FIRST_PIECE', status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            DATA_COLLECT: { code: 'DATA_COLLECT', status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            SELF_CHECK:   { code: 'SELF_CHECK',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            POST_CLEAN:   { code: 'POST_CLEAN',  status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            REPORT:       { code: 'REPORT',      status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            CHECK_OUT:    { code: 'CHECK_OUT',   status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
          },
        },
        'OP-GMP-OUTERPACK': {
          opCode: 'OP-GMP-OUTERPACK', status: 'pending',
          inTime: undefined, outTime: undefined,
          finishQty: 0, goodQty: 0, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: {
            PRE_CLEAN:    { code: 'PRE_CLEAN',   status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            CHECK_IN:     { code: 'CHECK_IN',    status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            MAT_VERIFY:   { code: 'MAT_VERIFY',  status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            FIRST_PIECE:  { code: 'FIRST_PIECE', status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            DATA_COLLECT: { code: 'DATA_COLLECT', status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            SELF_CHECK:   { code: 'SELF_CHECK',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            POST_CLEAN:   { code: 'POST_CLEAN',  status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            REPORT:       { code: 'REPORT',      status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            CHECK_OUT:    { code: 'CHECK_OUT',   status: 'pending', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
          },
        },
      };

      // ── WO003: VitC咀嚼片 250mg×100粒/瓶 × 50,000粒 已下发待开工 ──────────
      const wo3Map: Record<string, any> = {
        'OP-GMP-WEIGH': {
          opCode: 'OP-GMP-WEIGH', status: 'completed',
          inTime: '2026-06-13 08:00', outTime: '2026-06-13 09:30',
          finishQty: 50000, goodQty: 50000, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-13', '孙志远', 'QC-CLN-20260613-001', '22', '47'),
            mkCheckIn('2026-06-13 08:20', '2026-06-13 08:25', '孙志远'),
            mkMatVerify('2026-06-13 08:25', '2026-06-13 08:35', '孙志远'),
            { startTime: '2026-06-13 08:35', endTime: '2026-06-13 09:20', operator: '孙志远',
              data: { dc_table: [
                { material_name: '维生素C（原料药）', batch_no: 'RM-VITC-20260610-003', plan_qty: '22.000', actual_qty: '22.002', balance_check: '复核一致', dc_operator: '孙志远' },
                { material_name: '甘露醇', batch_no: 'RM-MAN-20260610-003', plan_qty: '12.500', actual_qty: '12.498', balance_check: '复核一致', dc_operator: '孙志远' },
                { material_name: '柠檬酸', batch_no: 'RM-CA-20260610-003', plan_qty: '1.250', actual_qty: '1.250', balance_check: '复核一致', dc_operator: '孙志远' },
                { material_name: '硬脂酸镁', batch_no: 'RM-MG-20260610-003', plan_qty: '0.500', actual_qty: '0.500', balance_check: '复核一致', dc_operator: '孙志远' },
                { material_name: '微晶纤维素', batch_no: 'RM-MCC-20260610-003', plan_qty: '3.750', actual_qty: '3.752', balance_check: '复核一致', dc_operator: '孙志远' },
              ]},
            },
            mkReport('2026-06-13 09:20', '2026-06-13 09:30', '孙志远', 50000, 50000, 0),
            mkCheckOut('2026-06-13 09:30', '孙志远'),
          ),
        },
        'OP-GMP-MIX': {
          opCode: 'OP-GMP-MIX', status: 'in_progress',
          inTime: '2026-06-13 10:00', outTime: undefined,
          finishQty: 0, goodQty: 0, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-13', '孙志远', 'QC-CLN-20260613-002', '22', '47'),
            mkCheckIn('2026-06-13 10:00', '2026-06-13 10:05', '孙志远'),
            mkMatVerify('2026-06-13 10:05', '2026-06-13 10:10', '孙志远'),
            { startTime: '2026-06-13 10:10', endTime: undefined, operator: '孙志远',
              data: { dc_table: [] },
            },
            mkReport('2026-06-13 10:10', '2026-06-13 10:10', '孙志远', 0, 0, 0),
            mkCheckOut('2026-06-13 10:10', '孙志远'),
          ),
        },
      };

      // ── WO004: 复合益生菌胶囊 250mg×30粒 × 30,000粒 全部完成 ───────────────
      const wo4Map: Record<string, any> = {
        'OP-GMP-WEIGH': {
          opCode: 'OP-GMP-WEIGH', status: 'completed',
          inTime: '2026-06-01 08:00', outTime: '2026-06-01 09:30',
          finishQty: 30000, goodQty: 30000, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-01', '钱文华', 'QC-CLN-20260601-W4-001', '8', '45'),
            mkCheckIn('2026-06-01 08:20', '2026-06-01 08:25', '钱文华'),
            mkMatVerify('2026-06-01 08:25', '2026-06-01 08:40', '钱文华'),
            { startTime: '2026-06-01 08:40', endTime: '2026-06-01 09:20', operator: '钱文华',
              data: { dc_table: [
                { material_name: '长双歧杆菌BB536（冻干粉）', batch_no: 'RM-BB536-20260528', plan_qty: '6.000', actual_qty: '6.004', balance_check: '复核一致', dc_operator: '钱文华' },
                { material_name: '嗜酸乳杆菌NCFM（冻干粉）', batch_no: 'RM-NCFM-20260528', plan_qty: '4.000', actual_qty: '4.001', balance_check: '复核一致', dc_operator: '钱文华' },
                { material_name: '低聚果糖（益生元）', batch_no: 'RM-FOS-20260528', plan_qty: '3.000', actual_qty: '2.999', balance_check: '复核一致', dc_operator: '钱文华' },
                { material_name: '微晶纤维素', batch_no: 'RM-MCC-20260528', plan_qty: '2.000', actual_qty: '2.000', balance_check: '复核一致', dc_operator: '钱文华' },
              ]},
            },
            mkReport('2026-06-01 09:20', '2026-06-01 09:30', '钱文华', 30000, 30000, 0),
            mkCheckOut('2026-06-01 09:30', '钱文华'),
          ),
        },
        'OP-GMP-MIX': {
          opCode: 'OP-GMP-MIX', status: 'completed',
          inTime: '2026-06-01 10:00', outTime: '2026-06-01 12:00',
          finishQty: 30000, goodQty: 30000, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-01', '钱文华', 'QC-CLN-20260601-W4-002', '8', '45'),
            mkCheckIn('2026-06-01 10:00', '2026-06-01 10:05', '钱文华'),
            mkMatVerify('2026-06-01 10:05', '2026-06-01 10:10', '钱文华'),
            { startTime: '2026-06-01 10:10', endTime: '2026-06-01 11:40', operator: '钱文华',
              data: { dc_table: [{ mix_speed: '60', mix_time: '90', rsd: '2.1', env_temp: '8', env_humid: '42', dc_operator: '钱文华' }] },
            },
            mkReport('2026-06-01 11:40', '2026-06-01 12:00', '钱文华', 30000, 30000, 0),
            mkCheckOut('2026-06-01 12:00', '钱文华'),
          ),
        },
        'OP-GMP-GRANULATE': {
          opCode: 'OP-GMP-GRANULATE', status: 'completed',
          inTime: '2026-06-02 08:00', outTime: '2026-06-02 15:00',
          finishQty: 30000, goodQty: 29950, badQty: 0, scrapQty: 50, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-02', '钱文华', 'QC-CLN-20260602-W4-001', '8', '43'),
            mkCheckIn('2026-06-02 08:00', '2026-06-02 08:05', '钱文华'),
            mkMatVerify('2026-06-02 08:05', '2026-06-02 08:15', '钱文华'),
            { startTime: '2026-06-02 08:15', endTime: '2026-06-02 14:30', operator: '钱文华',
              data: { dc_table: [{ granulate_speed: '150', dry_time: '90', moisture: '3.1', inlet_temp: '50', outlet_temp: '35', dc_operator: '钱文华' }] },
            },
            mkReport('2026-06-02 14:30', '2026-06-02 15:00', '钱文华', 29950, 29950, 0),
            mkCheckOut('2026-06-02 15:00', '钱文华'),
          ),
        },
        'OP-GMP-COATING': {
          opCode: 'OP-GMP-COATING', status: 'completed',
          inTime: '2026-06-03 08:00', outTime: '2026-06-03 14:00',
          finishQty: 29950, goodQty: 29950, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-03', '陈明', 'QC-CLN-20260603-W4-001', '8', '43'),
            mkCheckIn('2026-06-03 08:00', '2026-06-03 08:05', '陈明'),
            mkMatVerify('2026-06-03 08:05', '2026-06-03 08:15', '陈明'),
            { startTime: '2026-06-03 08:15', endTime: '2026-06-03 13:30', operator: '陈明',
              data: { dc_table: [{ coating_material: '肠溶包衣液HPMC-AS', coat_gain: '4.0', inlet_temp: '45', air_volume: '800', coat_time: '150', appearance: '淡黄色均匀无龟裂', dc_operator: '陈明' }] },
            },
            mkReport('2026-06-03 13:30', '2026-06-03 14:00', '陈明', 29950, 29950, 0),
            mkCheckOut('2026-06-03 14:00', '陈明'),
          ),
        },
        'OP-GMP-INNERPACK': {
          opCode: 'OP-GMP-INNERPACK', status: 'completed',
          inTime: '2026-06-04 08:00', outTime: '2026-06-04 17:00',
          finishQty: 998, goodQty: 998, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            { startTime: '2026-06-04 07:30', endTime: '2026-06-04 08:00', operator: '周虹',
              data: { ...preConfirm9, env_temp: '8', env_humid: '42', cert_no: 'QC-CLN-20260604-W4-001', cert_time: '2026-06-04 08:00', cert_expire: '2026-06-04 20:00' },
            },
            mkCheckIn('2026-06-04 08:00', '2026-06-04 08:05', '周虹'),
            mkMatVerify('2026-06-04 08:05', '2026-06-04 08:20', '周虹', { mat_qty: '15.000' }),
            { startTime: '2026-06-04 08:20', endTime: '2026-06-04 16:30', operator: '周虹',
              data: { dc_table: [
                { check_time: '2026-06-04 09:00', fill_qty: '30', fill_weight: '7.5', seal_check: '合格', label_check: '合格', temp: '8', humidity: '42', dc_operator: '周虹' },
                { check_time: '2026-06-04 11:00', fill_qty: '30', fill_weight: '7.5', seal_check: '合格', label_check: '合格', temp: '8', humidity: '42', dc_operator: '周虹' },
                { check_time: '2026-06-04 14:00', fill_qty: '30', fill_weight: '7.5', seal_check: '合格', label_check: '合格', temp: '8', humidity: '43', dc_operator: '周虹' },
                { check_time: '2026-06-04 16:00', fill_qty: '30', fill_weight: '7.5', seal_check: '合格', label_check: '合格', temp: '8', humidity: '43', dc_operator: '周虹' },
              ]},
            },
            mkReport('2026-06-04 16:30', '2026-06-04 17:00', '周虹', 998, 998, 0),
            mkCheckOut('2026-06-04 17:00', '周虹'),
          ),
        },
        'OP-GMP-INNERCLEAN': {
          opCode: 'OP-GMP-INNERCLEAN', status: 'completed',
          inTime: '2026-06-04 17:00', outTime: '2026-06-04 18:00',
          finishQty: 0, goodQty: 0, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: {
            PRE_CLEAN:    { code: 'PRE_CLEAN',   status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            CHECK_IN:     { code: 'CHECK_IN',    status: 'completed', startTime: '2026-06-04 17:00', endTime: '2026-06-04 17:05', operator: '周虹', data: {} },
            MAT_VERIFY:   { code: 'MAT_VERIFY',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            FIRST_PIECE:  { code: 'FIRST_PIECE', status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            DATA_COLLECT: { code: 'DATA_COLLECT', status: 'completed', startTime: '2026-06-04 17:05', endTime: '2026-06-04 17:50', operator: '周虹', data: { dc_table: [] } },
            SELF_CHECK:   { code: 'SELF_CHECK',  status: 'skipped', startTime: undefined, endTime: undefined, operator: undefined, data: {} },
            POST_CLEAN:   { code: 'POST_CLEAN',  status: 'completed', startTime: '2026-06-04 17:05', endTime: '2026-06-04 17:50', operator: '周虹',
              data: { clean_start: '2026-06-04 17:05', clean_end: '2026-06-04 17:50', clean_operator: '周虹', cert_no: 'CLN-INNER-20260604-W4-001' },
            },
            REPORT:       { code: 'REPORT',      status: 'completed', startTime: '2026-06-04 17:50', endTime: '2026-06-04 18:00', operator: '周虹', data: { rpt_finish: 0, rpt_good: 0, rpt_bad: 0, rpt_scrap: 0, rpt_operator: '周虹' } },
            CHECK_OUT:    { code: 'CHECK_OUT',   status: 'completed', startTime: '2026-06-04 18:00', endTime: '2026-06-04 18:00', operator: '周虹', data: { out_operator: '周虹' } },
          },
        },
        'OP-GMP-OUTERPACK': {
          opCode: 'OP-GMP-OUTERPACK', status: 'completed',
          inTime: '2026-06-05 08:00', outTime: '2026-06-05 16:00',
          finishQty: 998, goodQty: 998, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            { startTime: '2026-06-05 07:30', endTime: '2026-06-05 08:00', operator: '李振宇',
              data: { ...preConfirm9, env_temp: '8', env_humid: '42', cert_no: 'QC-CLN-20260605-W4-001', cert_time: '2026-06-05 08:00', cert_expire: '2026-06-05 20:00' },
            },
            mkCheckIn('2026-06-05 08:00', '2026-06-05 08:05', '李振宇'),
            mkMatVerify('2026-06-05 08:05', '2026-06-05 08:15', '李振宇', { mat_version: 'PK-PROBIO-V15', batch_no: 'PK-BOX-20260601-W4-001' }),
            { startTime: '2026-06-05 08:15', endTime: '2026-06-05 15:30', operator: '李振宇',
              data: { dc_table: [
                { check_time: '2026-06-05 09:00', bottles_per_box: '1', insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致', dc_operator: '李振宇' },
                { check_time: '2026-06-05 11:00', bottles_per_box: '1', insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致', dc_operator: '李振宇' },
                { check_time: '2026-06-05 13:00', bottles_per_box: '1', insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致', dc_operator: '李振宇' },
                { check_time: '2026-06-05 15:00', bottles_per_box: '1', insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致', dc_operator: '李振宇' },
              ]},
            },
            mkReport('2026-06-05 15:30', '2026-06-05 16:00', '李振宇', 998, 998, 0),
            mkCheckOut('2026-06-05 16:00', '李振宇'),
          ),
        },
      };

      // ── WO005: 复合益生菌胶囊 250mg×30粒 × 60,000粒 生产中（混合中）─────────
      const wo5Map: Record<string, any> = {
        'OP-GMP-WEIGH': {
          opCode: 'OP-GMP-WEIGH', status: 'completed',
          inTime: '2026-06-12 08:00', outTime: '2026-06-12 09:40',
          finishQty: 21000, goodQty: 21000, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-12', '陈明', 'QC-CLN-20260612-001', '8', '42'),
            mkCheckIn('2026-06-12 08:20', '2026-06-12 08:25', '陈明'),
            mkMatVerify('2026-06-12 08:25', '2026-06-12 08:40', '陈明'),
            { startTime: '2026-06-12 08:40', endTime: '2026-06-12 09:20', operator: '陈明',
              data: { dc_table: [
                { material_name: '长双歧杆菌BB536（冻干粉）', batch_no: 'RM-BB536-20260610', plan_qty: '12.000', actual_qty: '12.008', balance_check: '复核一致', dc_operator: '陈明' },
                { material_name: '嗜酸乳杆菌NCFM（冻干粉）', batch_no: 'RM-NCFM-20260610', plan_qty: '8.000', actual_qty: '8.002', balance_check: '复核一致', dc_operator: '陈明' },
                { material_name: '低聚果糖（益生元）', batch_no: 'RM-FOS-20260610', plan_qty: '6.000', actual_qty: '5.999', balance_check: '复核一致', dc_operator: '陈明' },
                { material_name: '微晶纤维素', batch_no: 'RM-MCC-20260610', plan_qty: '4.000', actual_qty: '4.001', balance_check: '复核一致', dc_operator: '陈明' },
              ]},
            },
            mkReport('2026-06-12 09:20', '2026-06-12 09:40', '陈明', 21000, 21000, 0),
            mkCheckOut('2026-06-12 09:40', '陈明'),
          ),
        },
        'OP-GMP-MIX': {
          opCode: 'OP-GMP-MIX', status: 'in_progress',
          inTime: '2026-06-12 10:00', outTime: undefined,
          finishQty: 0, goodQty: 0, badQty: 0, scrapQty: 0, reportRecords: [],
          stages: mkStages(
            mkPreClean('2026-06-12', '陈明', 'QC-CLN-20260612-002', '8', '42'),
            mkCheckIn('2026-06-12 10:00', '2026-06-12 10:05', '陈明'),
            mkMatVerify('2026-06-12 10:05', '2026-06-12 10:10', '陈明'),
            { startTime: '2026-06-12 10:10', endTime: undefined, operator: '陈明',
              data: { dc_table: [] },
            },
            mkReport('2026-06-12 10:10', '2026-06-12 10:10', '陈明', 0, 0, 0),
            mkCheckOut('2026-06-12 10:10', '陈明'),
          ),
        },
      };

      // 写入所有5个WO的快照（版本升级时强制覆盖，确保数据是最新格式）
      localStorage.setItem('bip_pad_exec_snap_WO001', JSON.stringify(wo1Map));
      localStorage.setItem('bip_pad_exec_snap_WO002', JSON.stringify(wo2Map));
      localStorage.setItem('bip_pad_exec_snap_WO003', JSON.stringify(wo3Map));
      localStorage.setItem('bip_pad_exec_snap_WO004', JSON.stringify(wo4Map));
      localStorage.setItem('bip_pad_exec_snap_WO005', JSON.stringify(wo5Map));
      localStorage.setItem('bip_pad_exec_snap_version', PAD_SNAP_VERSION);
    } catch { /* ignore */ }
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
