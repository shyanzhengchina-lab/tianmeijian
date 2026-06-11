/**
 * EBR 子表 API — 对应后端 /ebr-sub/*
 *   - /ebr-sub/steps              工步记录
 *   - /ebr-sub/equipment-usages   设备使用记录
 *   - /ebr-sub/material-balances  物料平衡记录
 */
import http from './http';

// ─── 工步记录 ───────────────────────────────────────────────────────────────

export interface EbrStepRecord {
  id?: number;
  ebrId?: number;
  stepNo?: number;
  stepName?: string;
  operationCode?: string;
  operationName?: string;
  status?: string;           // PENDING | IN_PROGRESS | COMPLETED | DEVIATION | SKIPPED
  startTime?: string;
  endTime?: string;
  operator?: string;
  approvalStatus?: string;   // PENDING | APPROVED | REJECTED
  approver?: string;
  approvalTime?: string;
  approvalComment?: string;
  dataRecord?: string;
  createTime?: string;
  updateTime?: string;
}

/** 查询工步列表（按 ebrId 过滤） */
export const getEbrStepList = (ebrId?: number): Promise<any> =>
  http.get('/ebr-sub/steps', { params: ebrId != null ? { ebrId } : {} });

/** 新增工步 */
export const createEbrStep = (data: EbrStepRecord): Promise<any> =>
  http.post('/ebr-sub/steps', data);

/** 修改工步 */
export const updateEbrStep = (id: number, data: EbrStepRecord): Promise<any> =>
  http.put(`/ebr-sub/steps/${id}`, data);

/** 删除工步 */
export const deleteEbrStep = (id: number): Promise<any> =>
  http.delete(`/ebr-sub/steps/${id}`);

// ─── 设备使用记录 ────────────────────────────────────────────────────────────

export interface EbrEquipmentUsageRecord {
  id?: number;
  ebrId?: number;
  stepId?: number;
  equipmentCode?: string;
  equipmentName?: string;
  equipmentType?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;         // 分钟
  operatorId?: number;
  operatorName?: string;
  usageStatus?: string;      // NORMAL | ABNORMAL
  maintenanceRecord?: string;
  createTime?: string;
  updateTime?: string;
}

/** 查询设备使用列表（按 ebrId 过滤） */
export const getEbrEquipmentUsageList = (ebrId?: number): Promise<any> =>
  http.get('/ebr-sub/equipment-usages', { params: ebrId != null ? { ebrId } : {} });

/** 新增设备使用记录 */
export const createEbrEquipmentUsage = (data: EbrEquipmentUsageRecord): Promise<any> =>
  http.post('/ebr-sub/equipment-usages', data);

/** 修改设备使用记录 */
export const updateEbrEquipmentUsage = (id: number, data: EbrEquipmentUsageRecord): Promise<any> =>
  http.put(`/ebr-sub/equipment-usages/${id}`, data);

/** 删除设备使用记录 */
export const deleteEbrEquipmentUsage = (id: number): Promise<any> =>
  http.delete(`/ebr-sub/equipment-usages/${id}`);

// ─── 物料平衡记录 ────────────────────────────────────────────────────────────

export interface EbrMaterialBalanceRecord {
  id?: number;
  ebrId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  spec?: string;
  unitId?: number;
  unitName?: string;
  planQuantity?: number;
  theoreticalQuantity?: number;
  actualInput?: number;
  actualOutput?: number;
  difference?: number;
  differenceRate?: number;
  balanceStatus?: string;    // BALANCED | IN_PROGRESS | ABNORMAL
  createTime?: string;
  updateTime?: string;
}

/** 查询物料平衡列表（按 ebrId 过滤） */
export const getEbrMaterialBalanceList = (ebrId?: number): Promise<any> =>
  http.get('/ebr-sub/material-balances', { params: ebrId != null ? { ebrId } : {} });

/** 新增物料平衡记录 */
export const createEbrMaterialBalance = (data: EbrMaterialBalanceRecord): Promise<any> =>
  http.post('/ebr-sub/material-balances', data);

/** 修改物料平衡记录 */
export const updateEbrMaterialBalance = (id: number, data: EbrMaterialBalanceRecord): Promise<any> =>
  http.put(`/ebr-sub/material-balances/${id}`, data);

/** 删除物料平衡记录 */
export const deleteEbrMaterialBalance = (id: number): Promise<any> =>
  http.delete(`/ebr-sub/material-balances/${id}`);
