/**
 * 质检方案管理 API
 */
import http from './http';

export interface QcSchemeRecord {
  id?: number;
  schemeCode?: string;
  schemeName?: string;
  schemeType?: string;
  samplingType?: string;
  aqlLevel?: string;
  status?: number; // 1=启用, 0=停用
  version?: string;
  effectiveDate?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

/** 分页查询质检方案 */
export const getQcSchemePage = (current = 1, pageSize = 15): Promise<{ data: PageResult<QcSchemeRecord> }> =>
  http.get(`/qc-schemes/page?current=${current}&pageSize=${pageSize}`, { silent: true });

/** 查询全部质检方案（不分页） */
export const getQcSchemeList = (): Promise<{ data: QcSchemeRecord[] }> =>
  http.get('/qc-schemes/list', { silent: true });

/** 根据 ID 查询质检方案 */
export const getQcSchemeById = (id: number): Promise<{ data: QcSchemeRecord }> =>
  http.get(`/qc-schemes/${id}`);

/** 新增质检方案 */
export const createQcScheme = (data: QcSchemeRecord): Promise<{ data: QcSchemeRecord }> =>
  http.post('/qc-schemes', data);

/** 修改质检方案 */
export const updateQcScheme = (id: number, data: QcSchemeRecord): Promise<{ data: void }> =>
  http.put(`/qc-schemes/${id}`, data);

/** 删除质检方案 */
export const deleteQcScheme = (id: number): Promise<{ data: void }> =>
  http.delete(`/qc-schemes/${id}`);

/** 批量删除质检方案 */
export const batchDeleteQcSchemes = (ids: number[]): Promise<{ data: void }> =>
  http.delete('/qc-schemes/batch', { data: ids });
