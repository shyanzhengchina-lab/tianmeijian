/**
 * UDI 工具函数
 * ================================================================
 * 标准：GB/T 42062-2022（等同 ISO/IEC 15459，基于 GS1标准）
 * UDI 结构：(01)GTIN14(10)BatchNo(11)ProdDate(17)ExpiryDate(30)Qty
 * ================================================================
 */
import type { UdiPiRule, MaterialDiRecord, UdiRecord } from '../../api/udi';

// ── 日期工具 ─────────────────────────────────────────────────────

/** Date → YYMMDD 字符串（GS1 AI 11/17格式） */
export function toGs1Date(date: Date): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/** YYMMDD → Date */
export function fromGs1Date(s: string): Date | null {
  if (!s || s.length !== 6) return null;
  const yy = parseInt(s.slice(0, 2), 10);
  const mm = parseInt(s.slice(2, 4), 10) - 1;
  const dd = parseInt(s.slice(4, 6), 10);
  const year = yy >= 0 && yy <= 49 ? 2000 + yy : 1900 + yy;
  return new Date(year, mm, dd);
}

/** 生产日期 + 月数 → 有效期 */
export function calcExpiryDate(productionDate: Date, months: number): Date {
  const d = new Date(productionDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ── GS1 UDI 编码 ─────────────────────────────────────────────────

export interface UdiComponents {
  gtin: string;
  batchNo: string;
  productionDate: string;  // YYMMDD
  expiryDate: string;      // YYMMDD
  qty: number;
}

/**
 * 生成 GS1 UDI 字符串
 * 格式：(01)GTIN(10)BatchNo(11)ProdDate(17)Expiry(30)Qty
 */
export function buildUdiString(c: UdiComponents): string {
  const parts: string[] = [];
  if (c.gtin)           parts.push(`(01)${c.gtin}`);
  if (c.batchNo)        parts.push(`(10)${c.batchNo}`);
  if (c.productionDate) parts.push(`(11)${c.productionDate}`);
  if (c.expiryDate)     parts.push(`(17)${c.expiryDate}`);
  if (c.qty > 0)        parts.push(`(30)${c.qty}`);
  return parts.join('');
}

/**
 * 解析 GS1 UDI 字符串 → UdiComponents
 * 支持格式：(01)...(10)...(17)...(30)...
 */
export function parseUdiString(udiStr: string): Partial<UdiComponents> | null {
  if (!udiStr) return null;
  const result: Partial<UdiComponents> = {};
  const regex = /\((\d{2})\)([^(]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(udiStr)) !== null) {
    const ai = m[1];
    const val = m[2].trim();
    switch (ai) {
      case '01': result.gtin = val; break;
      case '10': result.batchNo = val; break;
      case '11': result.productionDate = val; break;
      case '17': result.expiryDate = val; break;
      case '30': result.qty = parseInt(val, 10); break;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** 从 UDI 字符串提取 DI 部分（GTIN） */
export function extractDi(udiStr: string): string {
  const parsed = parseUdiString(udiStr);
  return parsed?.gtin ?? '';
}

/** 从 UDI 字符串提取 PI 部分 */
export function extractPi(udiStr: string): string {
  if (!udiStr) return '';
  return udiStr.replace(/^\(01\)\d{14}/, '').trim();
}

// ── UDI 记录生成 ──────────────────────────────────────────────────

export interface GenerateUdiParams {
  di: MaterialDiRecord;
  rule: UdiPiRule;
  batchNo: string;
  qty: number;
  productionDate?: Date;
  productionOrderNo?: string;
  productionOrderId?: number;
  workOrderNo?: string;
  workOrderId?: number;
  materialCode?: string;
  materialName?: string;
}

/**
 * 根据 DI + PI规则 + 批次信息 生成 UDI 记录
 */
export function generateUdiRecord(p: GenerateUdiParams): UdiRecord {
  const prodDate = p.productionDate ?? new Date();
  const expiryDate = calcExpiryDate(prodDate, p.rule.expiryMonths);

  const prodDateStr   = p.rule.includeProductionDate ? toGs1Date(prodDate)   : '';
  const expiryDateStr = p.rule.includeExpiryDate     ? toGs1Date(expiryDate) : '';
  const batchNoStr    = p.rule.includeBatchNo         ? p.batchNo             : '';

  const components: UdiComponents = {
    gtin:           p.di.gtin,
    batchNo:        batchNoStr,
    productionDate: prodDateStr,
    expiryDate:     expiryDateStr,
    qty:            p.rule.includeQty ? p.qty : 0,
  };

  const udiString = buildUdiString(components);
  const piString  = extractPi(udiString);

  return {
    udiString,
    diCode:              p.di.diCode,
    piString,
    gtin:                p.di.gtin,
    batchNo:             p.batchNo,
    productionDate:      prodDateStr,
    expiryDate:          expiryDateStr,
    qty:                 p.qty,
    productionOrderNo:   p.productionOrderNo,
    productionOrderId:   p.productionOrderId,
    workOrderNo:         p.workOrderNo,
    workOrderId:         p.workOrderId,
    materialCode:        p.materialCode ?? p.di.materialCode,
    materialName:        p.materialName ?? p.di.materialName,
    status:              'GENERATED',
    printCount:          0,
  };
}

// ── 默认 PI 规则 ─────────────────────────────────────────────────

export const DEFAULT_PI_RULE: UdiPiRule = {
  includeBatchNo:       true,
  includeProductionDate: true,
  includeExpiryDate:    true,
  includeQty:           true,
  expiryMonths:         24,
  serialLevel:          'batch',
  qrFormat:             'GS1',
};

// ── 本地存储（API不可用时的降级存储） ────────────────────────────

const LS_PI_RULE  = 'udi_pi_rule';
const LS_DI_MAP   = 'udi_di_map';       // materialId → MaterialDiRecord
const LS_UDI_LIST = 'udi_records';

export function loadPiRule(): UdiPiRule {
  try {
    const s = localStorage.getItem(LS_PI_RULE);
    return s ? { ...DEFAULT_PI_RULE, ...JSON.parse(s) } : { ...DEFAULT_PI_RULE };
  } catch { return { ...DEFAULT_PI_RULE }; }
}

export function savePiRule(rule: UdiPiRule): void {
  localStorage.setItem(LS_PI_RULE, JSON.stringify(rule));
}

export function loadDiMap(): Record<number, MaterialDiRecord> {
  try {
    const s = localStorage.getItem(LS_DI_MAP);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

export function saveDiMap(map: Record<number, MaterialDiRecord>): void {
  localStorage.setItem(LS_DI_MAP, JSON.stringify(map));
}

export function loadUdiRecords(): UdiRecord[] {
  try {
    const s = localStorage.getItem(LS_UDI_LIST);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function saveUdiRecords(records: UdiRecord[]): void {
  localStorage.setItem(LS_UDI_LIST, JSON.stringify(records));
}

/** 根据生产订单号从本地查 UDI */
export function getUdiByOrderNo(orderNo: string): UdiRecord[] {
  return loadUdiRecords().filter(r => r.productionOrderNo === orderNo);
}
