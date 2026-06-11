/**
 * UDI（唯一设备标识）API
 * ================================================================
 * UDI = DI + PI
 *   DI (Device Identifier) — 器械标识，由物料的 GTIN/DI 编码确定
 *   PI (Production Identifier) — 生产标识，包含批号、生产日期、有效期、数量等
 * GS1标准：(01)GTIN(10)BatchNo(17)Expiry(30)Qty
 * ================================================================
 *
 * 所有只读 GET 请求均使用 { silent: true }，后端 UDI 端点尚未实现时
 * 不会弹出错误 toast；所有函数仍有 .catch() 兜底返回空数据。
 */
import http from './http';

/** PI 规则配置（全局） */
export interface UdiPiRule {
  id?: number;
  includeBatchNo: boolean;      // AI 10 — 批号
  includeProductionDate: boolean; // AI 11 — 生产日期
  includeExpiryDate: boolean;   // AI 17 — 有效期
  includeQty: boolean;          // AI 30 — 数量
  expiryMonths: number;         // 有效期 = 生产日期 + expiryMonths 月
  serialLevel: 'batch' | 'unit'; // 批次级 or 单件级序列号
  qrFormat: 'GS1' | 'DM';      // 输出格式
  updateTime?: string;
}

/** 物料 DI 配置 */
export interface MaterialDiRecord {
  id?: number;
  materialId: number;
  materialCode?: string;
  materialName?: string;
  gtin: string;           // 14位 GTIN（GS1标准）
  diCode: string;         // DI 编码（可等于 GTIN 或独立编码）
  issuer: string;         // 签发机构：GS1 | HIBC | ICCBBA
  registrationNo?: string; // 注册证号
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

/** UDI 记录（每条与生产订单/工单关联） */
export interface UdiRecord {
  id?: number;
  udiString: string;        // 完整 UDI 字符串（GS1格式）
  diCode: string;           // DI 部分
  piString: string;         // PI 部分
  gtin: string;             // GTIN
  batchNo: string;          // 批号 (AI 10)
  productionDate: string;   // 生产日期 YYMMDD (AI 11)
  expiryDate: string;       // 有效期 YYMMDD (AI 17)
  qty: number;              // 数量 (AI 30)
  productionOrderId?: number;
  productionOrderNo?: string;
  workOrderId?: number;
  workOrderNo?: string;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  status: 'GENERATED' | 'PRINTED' | 'BOUND' | 'SHIPPED';
  printCount?: number;
  lastPrintTime?: string;
  receiptId?: number;       // 入库单ID
  receiptNo?: string;       // 入库单号
  shipmentId?: number;      // 出库单ID
  shipmentNo?: string;      // 出库单号
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

/** 成品入库单 */
export interface FinishedGoodsReceipt {
  id?: number;
  receiptNo: string;
  productionOrderId?: number;
  productionOrderNo?: string;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  spec?: string;
  qty: number;
  unitName?: string;
  batchNo: string;
  udiString?: string;       // 携带的UDI码
  warehouseCode?: string;
  locationCode?: string;
  operator?: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  remark?: string;
  receiptTime?: string;
  createTime?: string;
}

/** 销售出库单 */
export interface SalesShipment {
  id?: number;
  shipmentNo: string;
  customerName?: string;
  customerCode?: string;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  spec?: string;
  qty: number;
  unitName?: string;
  batchNo?: string;
  udiString?: string;       // 扫码录入的UDI
  diCode?: string;
  piString?: string;
  scanVerified?: boolean;   // 是否扫码验证通过
  warehouseCode?: string;
  operator?: string;
  status: 'DRAFT' | 'SHIPPED' | 'CANCELLED';
  remark?: string;
  shipmentTime?: string;
  createTime?: string;
}

// ── UDI PI规则 CRUD ─────────────────────────────────────────────
// silent:true — 后端未实现时不弹 toast
export const getUdiPiRule = (): Promise<any> =>
  http.get('/udi/pi-rule', { silent: true }).catch(() => ({ data: null }));

export const saveUdiPiRule = (data: UdiPiRule): Promise<any> =>
  http.post('/udi/pi-rule', data);

// ── 物料 DI 配置 CRUD ────────────────────────────────────────────
export const getMaterialDiList = (params?: { materialId?: number }): Promise<any> =>
  http.get('/udi/material-di/list', { params, silent: true }).catch(() => ({ data: [] }));

export const getMaterialDiByMaterialId = (materialId: number): Promise<any> =>
  http.get(`/udi/material-di/by-material/${materialId}`, { silent: true }).catch(() => ({ data: null }));

export const createMaterialDi = (data: MaterialDiRecord): Promise<any> =>
  http.post('/udi/material-di', data);

export const updateMaterialDi = (id: number, data: MaterialDiRecord): Promise<any> =>
  http.put(`/udi/material-di/${id}`, data);

export const deleteMaterialDi = (id: number): Promise<any> =>
  http.delete(`/udi/material-di/${id}`);

// ── UDI 记录 CRUD ────────────────────────────────────────────────
export const getUdiList = (params?: {
  productionOrderNo?: string;
  workOrderNo?: string;
  materialCode?: string;
  status?: string;
}): Promise<any> =>
  http.get('/udi/records/list', { params, silent: true }).catch(() => ({ data: [] }));

export const createUdiRecord = (data: UdiRecord): Promise<any> =>
  http.post('/udi/records', data);

export const batchCreateUdiRecords = (records: UdiRecord[]): Promise<any> =>
  http.post('/udi/records/batch', records);

export const updateUdiRecord = (id: number, data: Partial<UdiRecord>): Promise<any> =>
  http.put(`/udi/records/${id}`, data);

export const printUdiRecord = (id: number): Promise<any> =>
  http.post(`/udi/records/${id}/print`);

// ── 成品入库单 CRUD ──────────────────────────────────────────────
export const getReceiptList = (params?: { status?: string; productionOrderNo?: string }): Promise<any> =>
  http.get('/inventory/fg-receipts/list', { params, silent: true }).catch(() => ({ data: [] }));

export const createReceipt = (data: FinishedGoodsReceipt): Promise<any> =>
  http.post('/inventory/fg-receipts', data);

export const updateReceipt = (id: number, data: Partial<FinishedGoodsReceipt>): Promise<any> =>
  http.put(`/inventory/fg-receipts/${id}`, data);

export const deleteReceipt = (id: number): Promise<any> =>
  http.delete(`/inventory/fg-receipts/${id}`);

// ── 销售出库单 CRUD ──────────────────────────────────────────────
export const getShipmentList = (params?: { status?: string; customerName?: string }): Promise<any> =>
  http.get('/inventory/sales-shipments/list', { params, silent: true }).catch(() => ({ data: [] }));

export const createShipment = (data: SalesShipment): Promise<any> =>
  http.post('/inventory/sales-shipments', data);

export const updateShipment = (id: number, data: Partial<SalesShipment>): Promise<any> =>
  http.put(`/inventory/sales-shipments/${id}`, data);

export const deleteShipment = (id: number): Promise<any> =>
  http.delete(`/inventory/sales-shipments/${id}`);
