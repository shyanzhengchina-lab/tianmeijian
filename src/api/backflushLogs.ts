/**
 * 倒扣领料日志 API — 对应后端 /backflush-logs
 */
import http from './http';

export interface BackflushLogRecord {
  id?: number;
  logNo?: string;
  workOrderId?: string;
  woNo?: string;
  materialCode?: string;
  materialName?: string;
  bomQty?: number;
  actualQty?: number;
  unit?: string;
  batchNo?: string;
  operationCode?: string;
  operationName?: string;
  status?: string;     // SUCCESS/FAILED/EXCEPTION/PENDING
  exceptionDesc?: string;
  operator?: string;
  execTime?: string;
  remark?: string;
  createTime?: string;
}

/** 全量列表（支持 woNo / materialCode / status 过滤） */
export const getBackflushLogList = (params?: {
  woNo?: string;
  materialCode?: string;
  status?: string;
}): Promise<any> =>
  http.get('/backflush-logs/list', { params, silent: true });

/** 新增倒扣日志 */
export const createBackflushLog = (data: BackflushLogRecord): Promise<any> =>
  http.post('/backflush-logs', data);

/** 修改 */
export const updateBackflushLog = (id: number, data: BackflushLogRecord): Promise<any> =>
  http.put(`/backflush-logs/${id}`, data);

/** 删除 */
export const deleteBackflushLog = (id: number): Promise<any> =>
  http.delete(`/backflush-logs/${id}`);
