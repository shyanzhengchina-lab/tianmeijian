/**
 * 设备子模块 API — 对应后端 /equipment-sub/*
 *   /equipment-sub/maint-plans    维保计划
 *   /equipment-sub/faults         故障记录
 *   /equipment-sub/calibrations   计量校准
 *   /equipment-sub/spare-parts    备件管理
 *   /equipment-sub/usages         设备使用记录
 */
import http from './http';

// ─── 维保计划 ───────────────────────────────────────────────────────────────

export interface MaintPlanRecord {
  id?: number;
  planNo?: string;
  equipId?: string;
  equipCode?: string;
  equipName?: string;
  maintType?: string;       // DAILY/WEEKLY/MONTHLY/QUARTERLY/ANNUAL/SPECIAL
  maintContent?: string;
  planDate?: string;
  planDuration?: number;
  assignee?: string;
  status?: string;          // PENDING/IN_PROGRESS/DONE/OVERDUE/SKIPPED
  actualDate?: string;
  actualDuration?: number;
  result?: string;
  nextPlanDate?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export const getMaintPlanList = (params?: { equipCode?: string; status?: string }): Promise<any> =>
  http.get('/equipment-sub/maint-plans', { params });
export const createMaintPlan = (data: MaintPlanRecord): Promise<any> =>
  http.post('/equipment-sub/maint-plans', data);
export const updateMaintPlan = (id: number, data: MaintPlanRecord): Promise<any> =>
  http.put(`/equipment-sub/maint-plans/${id}`, data);
export const deleteMaintPlan = (id: number): Promise<any> =>
  http.delete(`/equipment-sub/maint-plans/${id}`);

// ─── 故障记录 ───────────────────────────────────────────────────────────────

export interface FaultRecord {
  id?: number;
  faultNo?: string;
  equipId?: string;
  equipCode?: string;
  equipName?: string;
  faultTime?: string;
  reporter?: string;
  faultDesc?: string;
  faultLevel?: string;      // LOW/MEDIUM/HIGH/CRITICAL
  affectedBatch?: string;
  affectedWoNo?: string;
  status?: string;          // REPORTED/ASSIGNED/REPAIRING/PENDING_VERIFY/CLOSED/CANCELLED
  assignee?: string;
  diagnose?: string;
  repairContent?: string;
  spareParts?: string;
  repairStart?: string;
  repairEnd?: string;
  downtime?: number;
  rootCause?: string;
  capaAction?: string;
  verifier?: string;
  verifyTime?: string;
  verifyResult?: string;
  remark?: string;
  createTime?: string;
}

export const getFaultList = (params?: { equipCode?: string; status?: string; faultLevel?: string }): Promise<any> =>
  http.get('/equipment-sub/faults', { params });
export const createFault = (data: FaultRecord): Promise<any> =>
  http.post('/equipment-sub/faults', data);
export const updateFault = (id: number, data: FaultRecord): Promise<any> =>
  http.put(`/equipment-sub/faults/${id}`, data);
export const deleteFault = (id: number): Promise<any> =>
  http.delete(`/equipment-sub/faults/${id}`);

// ─── 计量校准 ───────────────────────────────────────────────────────────────

export interface CalibrationRecord {
  id?: number;
  calibNo?: string;
  equipId?: string;
  equipCode?: string;
  equipName?: string;
  calibType?: string;       // INTERNAL/EXTERNAL
  calibOrg?: string;
  calibDate?: string;
  nextCalibDate?: string;
  calibCycle?: number;
  calibResult?: string;     // PASS/FAIL/CONDITIONAL
  certNo?: string;
  uncertainty?: string;
  status?: string;          // VALID/EXPIRED/PENDING/IN_CALIBRATION/FAILED
  measuredValue?: string;
  standardValue?: string;
  deviation?: string;
  operator?: string;
  remark?: string;
  createTime?: string;
}

export const getCalibrationList = (params?: { equipCode?: string; status?: string }): Promise<any> =>
  http.get('/equipment-sub/calibrations', { params });
export const createCalibration = (data: CalibrationRecord): Promise<any> =>
  http.post('/equipment-sub/calibrations', data);
export const updateCalibration = (id: number, data: CalibrationRecord): Promise<any> =>
  http.put(`/equipment-sub/calibrations/${id}`, data);
export const deleteCalibration = (id: number): Promise<any> =>
  http.delete(`/equipment-sub/calibrations/${id}`);

// ─── 备件管理 ───────────────────────────────────────────────────────────────

export interface SparePartRecord {
  id?: number;
  partCode?: string;
  partName?: string;
  partSpec?: string;
  applicableEquips?: string;
  unit?: string;
  currentStock?: number;
  safetyStock?: number;
  unitCost?: number;
  supplier?: string;
  leadTime?: number;
  location?: string;
  status?: string;          // NORMAL/LOW_STOCK/OUT_OF_STOCK
  lastUsedDate?: string;
  remark?: string;
  createTime?: string;
}

export const getSparePartList = (params?: { partCode?: string; status?: string }): Promise<any> =>
  http.get('/equipment-sub/spare-parts', { params });
export const createSparePart = (data: SparePartRecord): Promise<any> =>
  http.post('/equipment-sub/spare-parts', data);
export const updateSparePart = (id: number, data: SparePartRecord): Promise<any> =>
  http.put(`/equipment-sub/spare-parts/${id}`, data);
export const deleteSparePart = (id: number): Promise<any> =>
  http.delete(`/equipment-sub/spare-parts/${id}`);

// ─── 设备使用记录 ──────────────────────────────────────────────────────────

export interface EquipUsageApiRecord {
  id?: number;
  usageNo?: string;
  equipId?: string;
  equipCode?: string;
  equipName?: string;
  woId?: string;
  woNo?: string;
  taskId?: string;
  taskNo?: string;
  batchNo?: string;
  productCode?: string;
  productName?: string;
  operator?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  setupParams?: string;
  cleanBefore?: number;
  cleanAfter?: number;
  abnormalFlag?: number;
  abnormalDesc?: string;
  operatorSign?: string;
  remark?: string;
  createTime?: string;
}

export const getEquipUsageList = (params?: { equipCode?: string; batchNo?: string; woNo?: string }): Promise<any> =>
  http.get('/equipment-sub/usages', { params });
export const createEquipUsage = (data: EquipUsageApiRecord): Promise<any> =>
  http.post('/equipment-sub/usages', data);
export const updateEquipUsage = (id: number, data: EquipUsageApiRecord): Promise<any> =>
  http.put(`/equipment-sub/usages/${id}`, data);
export const deleteEquipUsage = (id: number): Promise<any> =>
  http.delete(`/equipment-sub/usages/${id}`);
