/**
 * 工序 API — 对应后端 /operations
 */
import http from './http';

export interface OperationRecord {
  id?: number;
  routingStepId?: number;
  operationCode?: string;
  operationName?: string;
  aliasName?: string;
  seqInStep?: number;
  workCenterId?: number;
  workCenterName?: string;
  isKeyOperation?: number;
  materialTraceReq?: number;
  inspectionTrigger?: string;
  reportRequired?: number;
  standardTime?: number;
  description?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

/** 查询全部工序 */
export const getOperationList = (params?: { routingStepId?: number; operationCode?: string }): Promise<any> =>
  http.get('/operations/list', { params });

/** 分页查询工序 */
export const getOperationPage = (params?: { current?: number; pageSize?: number; operationCode?: string; operationName?: string }): Promise<any> =>
  http.get('/operations/page', { params });

/** 根据ID查询 */
export const getOperationById = (id: number): Promise<any> =>
  http.get(`/operations/${id}`);

/** 新增工序 */
export const createOperation = (data: OperationRecord): Promise<any> =>
  http.post('/operations', data);

/** 修改工序 */
export const updateOperation = (id: number, data: OperationRecord): Promise<any> =>
  http.put(`/operations/${id}`, data);

/** 删除工序 */
export const deleteOperation = (id: number): Promise<any> =>
  http.delete(`/operations/${id}`);

/** 批量删除 */
export const batchDeleteOperations = (ids: number[]): Promise<any> =>
  http.delete('/operations/batch', { data: ids });
