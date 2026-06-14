/**
 * BOM API — 对应后端 /boms
 */
import http from './http';

export interface BomRecord {
  id?: number;
  code?: string;
  version?: string;
  bomType?: string;
  status?: string;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  quantity?: number;
  unitId?: number;
  unitName?: string;
  orgManage?: string;
  orgUse?: string;
  effectiveDate?: string;
  expiryDate?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
}

export interface BomDetailRecord {
  id?: number;
  bomId?: number;
  lineNo?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  spec?: string;
  quantity?: number;
  unitId?: number;
  unitName?: string;
  scrapRate?: number;
  issueMethod?: string;
  remark?: string;
}

/** 查询全部BOM（不分页） */
export const getBomList = (params?: { status?: string; code?: string }): Promise<any> =>
  http.get('/boms/list', { params, silent: true });

/** 分页查询BOM */
export const getBomPage = (params?: { current?: number; pageSize?: number; code?: string; status?: string }): Promise<any> =>
  http.get('/boms/page', { params, silent: true });

/** 根据ID查询BOM */
export const getBomById = (id: number): Promise<any> =>
  http.get(`/boms/${id}`);

/** 查询BOM明细 */
export const getBomDetails = (id: number): Promise<any> =>
  http.get(`/boms/${id}/details`);

/** 新增BOM */
export const createBom = (data: BomRecord): Promise<any> =>
  http.post('/boms', data);

/** 修改BOM */
export const updateBom = (id: number, data: BomRecord): Promise<any> =>
  http.put(`/boms/${id}`, data);

/** 删除BOM */
export const deleteBom = (id: number): Promise<any> =>
  http.delete(`/boms/${id}`);

/** 批量删除BOM */
export const batchDeleteBoms = (ids: number[]): Promise<any> =>
  http.delete('/boms/batch', { data: ids });

/** 查询BOM明细列表 */
export const getBomDetailList = (params?: { bomId?: number }): Promise<any> =>
  http.get('/bom-details/list', { params, silent: true });

/** 新增BOM明细 */
export const createBomDetail = (data: BomDetailRecord): Promise<any> =>
  http.post('/bom-details', data);

/** 修改BOM明细 */
export const updateBomDetail = (id: number, data: BomDetailRecord): Promise<any> =>
  http.put(`/bom-details/${id}`, data);

/** 删除BOM明细 */
export const deleteBomDetail = (id: number): Promise<any> =>
  http.delete(`/bom-details/${id}`);
