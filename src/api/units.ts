/**
 * 计量单位 API — 对应后端 /units
 */
import http from './http';

export interface UnitRecord {
  id?: number;
  code?: string;
  name?: string;
  enName?: string;
  groupId?: number;
  groupName?: string;
  method?: string;
  precision?: number;
  isBase?: number;   // 1是基本单位 0否
  status?: number;   // 1启用 0禁用
  createTime?: string;
  updateTime?: string;
}

/** 分页查询计量单位 */
export const getUnitPage = (params?: {
  current?: number;
  pageSize?: number;
  groupId?: number;
  code?: string;
  name?: string;
  status?: number;
}): Promise<any> =>
  http.get('/units/page', { params });

/** 查询全部（不分页） */
export const getUnitList = (params?: { groupId?: number; status?: number }): Promise<any> =>
  http.get('/units/list', { params });

/** 根据ID查询 */
export const getUnitById = (id: number): Promise<any> =>
  http.get(`/units/${id}`);

/** 新增计量单位 */
export const createUnit = (data: UnitRecord): Promise<any> =>
  http.post('/units', data);

/** 修改计量单位 */
export const updateUnit = (id: number, data: UnitRecord): Promise<any> =>
  http.put(`/units/${id}`, data);

/** 删除计量单位 */
export const deleteUnit = (id: number): Promise<any> =>
  http.delete(`/units/${id}`);

/** 批量删除 */
export const batchDeleteUnits = (ids: number[]): Promise<any> =>
  http.delete('/units/batch', { data: ids });
