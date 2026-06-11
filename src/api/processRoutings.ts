/**
 * 工艺路径 API — 对应后端 /process-routings
 */
import http from './http';

export interface ProcessRoutingRecord {
  id?: number;
  routingCode?: string;
  routingName?: string;
  productId?: number;
  productCode?: string;
  productModel?: string;
  productName?: string;
  version?: string;
  isDefault?: number;
  status?: string;
  effectiveDate?: string;
  expiryDate?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
}

export interface RoutingStepRecord {
  id?: number;
  routingId?: number;
  stepNo?: number;
  stepName?: string;
  stepCode?: string;
  reportPoint?: number;
  stepType?: string;
  workshopId?: number;
  description?: string;
}

/** 查询全部工艺路径 */
export const getProcessRoutingList = (params?: { status?: string; routingCode?: string }): Promise<any> =>
  http.get('/process-routings/list', { params });

/** 分页查询工艺路径 */
export const getProcessRoutingPage = (params?: { current?: number; pageSize?: number; routingCode?: string; status?: string }): Promise<any> =>
  http.get('/process-routings/page', { params });

/** 根据ID查询 */
export const getProcessRoutingById = (id: number): Promise<any> =>
  http.get(`/process-routings/${id}`);

/** 新增工艺路径 */
export const createProcessRouting = (data: ProcessRoutingRecord): Promise<any> =>
  http.post('/process-routings', data);

/** 修改工艺路径 */
export const updateProcessRouting = (id: number, data: ProcessRoutingRecord): Promise<any> =>
  http.put(`/process-routings/${id}`, data);

/** 删除工艺路径 */
export const deleteProcessRouting = (id: number): Promise<any> =>
  http.delete(`/process-routings/${id}`);

/** 批量删除 */
export const batchDeleteProcessRoutings = (ids: number[]): Promise<any> =>
  http.delete('/process-routings/batch', { data: ids });

/** 查询路径步骤 */
export const getRoutingStepList = (params?: { routingId?: number }): Promise<any> =>
  http.get('/routing-steps/list', { params });

/** 新增路径步骤 */
export const createRoutingStep = (data: RoutingStepRecord): Promise<any> =>
  http.post('/routing-steps', data);

/** 修改路径步骤 */
export const updateRoutingStep = (id: number, data: RoutingStepRecord): Promise<any> =>
  http.put(`/routing-steps/${id}`, data);

/** 删除路径步骤 */
export const deleteRoutingStep = (id: number): Promise<any> =>
  http.delete(`/routing-steps/${id}`);
