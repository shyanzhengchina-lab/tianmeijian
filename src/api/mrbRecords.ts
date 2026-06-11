/**
 * MRB记录 API — 对应后端 /mrb-records
 */
import http from './http';

export interface MrbRecordRecord {
  id?: number;
  mrbNo?: string;
  taskId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  batchNo?: string;
  quantity?: number;
  unit?: string;
  failureType?: string;
  failureDesc?: string;
  reporterId?: number;
  reporterName?: string;
  reportTime?: string;
  status?: string;
  disposition?: string;
  dispositionDesc?: string;
  dispositionBy?: string;
  dispositionTime?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
}

/** 查询全部MRB记录 */
export const getMrbRecordList = (params?: { status?: string; mrbNo?: string }): Promise<any> =>
  http.get('/mrb-records/list', { params });

/** 分页查询MRB记录 */
export const getMrbRecordPage = (params?: { current?: number; pageSize?: number; mrbNo?: string; status?: string }): Promise<any> =>
  http.get('/mrb-records/page', { params });

/** 根据ID查询 */
export const getMrbRecordById = (id: number): Promise<any> =>
  http.get(`/mrb-records/${id}`);

/** 新增MRB记录 */
export const createMrbRecord = (data: MrbRecordRecord): Promise<any> =>
  http.post('/mrb-records', data);

/** 修改MRB记录 */
export const updateMrbRecord = (id: number, data: MrbRecordRecord): Promise<any> =>
  http.put(`/mrb-records/${id}`, data);

/** 删除MRB记录 */
export const deleteMrbRecord = (id: number): Promise<any> =>
  http.delete(`/mrb-records/${id}`);

/** 批量删除 */
export const batchDeleteMrbRecords = (ids: number[]): Promise<any> =>
  http.delete('/mrb-records/batch', { data: ids });
