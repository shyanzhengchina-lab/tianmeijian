/**
 * 电子批记录 API (EBR) — 对应后端 /ebr-records
 */
import http from './http';

export interface EbrRecordApiRecord {
  id?: number;
  batchNo?: string;
  productId?: number;
  productCode?: string;
  productName?: string;
  bomId?: number;
  bomVersion?: string;
  routingId?: number;
  planQuantity?: number;
  unitId?: number;
  unitName?: string;
  status?: string;           // IN_PROGRESS / COMPLETED / REVIEWED / APPROVED / REJECTED
  startTime?: string;
  endTime?: string;
  operatorId?: number;
  operatorName?: string;
  supervisorId?: number;
  supervisorName?: string;
  completedQuantity?: number;
  qualifiedQuantity?: number;
  rejectedQuantity?: number;
  qualifiedRate?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
}

/** 分页查询 EBR */
export const getEbrRecordPage = (params?: {
  current?: number; pageSize?: number;
  batchNo?: string; productCode?: string; status?: string;
}): Promise<any> => http.get('/ebr-records/page', { params, silent: true });

/** 查询全部 EBR（不分页） */
export const getEbrRecordList = (params?: {
  status?: string; productCode?: string;
}): Promise<any> => http.get('/ebr-records/list', { params, silent: true });

/** 根据ID查询 */
export const getEbrRecordById = (id: number): Promise<any> =>
  http.get(`/ebr-records/${id}`);

/** 根据批号查询 */
export const getEbrRecordByBatchNo = (batchNo: string): Promise<any> =>
  http.get(`/ebr-records/batch/${encodeURIComponent(batchNo)}`);

/** 新增 EBR */
export const createEbrRecord = (data: EbrRecordApiRecord): Promise<any> =>
  http.post('/ebr-records', data);

/** 修改 EBR */
export const updateEbrRecord = (id: number, data: EbrRecordApiRecord): Promise<any> =>
  http.put(`/ebr-records/${id}`, data);

/** 删除 EBR */
export const deleteEbrRecord = (id: number): Promise<any> =>
  http.delete(`/ebr-records/${id}`);

/** 批量删除 */
export const batchDeleteEbrRecords = (ids: number[]): Promise<any> =>
  http.delete('/ebr-records/batch', { data: ids });
