/**
 * 质检项目 API — 对应后端 /inspection-items
 */
import http from './http';

export interface InspectionItemRecord {
  id?: number;
  code?: string;
  name?: string;
  category?: string;
  method?: string;
  standard?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isKeyItem?: number;
  status?: number;
  createTime?: string;
  updateTime?: string;
}

/** 查询全部质检项目（不分页） */
export const getInspectionItemList = (params?: { category?: string; status?: number }): Promise<any> =>
  http.get('/inspection-items/list', { params });

/** 分页查询 */
export const getInspectionItemPage = (params?: {
  current?: number; pageSize?: number;
  code?: string; category?: string; status?: number;
}): Promise<any> =>
  http.get('/inspection-items/page', { params });

/** 根据ID查询 */
export const getInspectionItemById = (id: number): Promise<any> =>
  http.get(`/inspection-items/${id}`);

/** 新增 */
export const createInspectionItem = (data: InspectionItemRecord): Promise<any> =>
  http.post('/inspection-items', data);

/** 修改 */
export const updateInspectionItem = (id: number, data: InspectionItemRecord): Promise<any> =>
  http.put(`/inspection-items/${id}`, data);

/** 删除 */
export const deleteInspectionItem = (id: number): Promise<any> =>
  http.delete(`/inspection-items/${id}`);

/** 批量删除 */
export const batchDeleteInspectionItems = (ids: number[]): Promise<any> =>
  http.delete('/inspection-items/batch', { data: ids });
