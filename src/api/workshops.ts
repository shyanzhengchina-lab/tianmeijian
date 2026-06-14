/**
 * 车间管理 API
 */
import http from './http';

export interface WorkshopRecord {
  id?: number;
  code?: string;
  name?: string;
  type?: string;
  managerName?: string;
  phone?: string;
  address?: string;
  description?: string;
  status?: number; // 1=启用, 0=停用
  factoryId?: number;
  createTime?: string;
  updateTime?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

/** 分页查询车间 */
export const getWorkshopPage = (current = 1, pageSize = 15): Promise<{ data: PageResult<WorkshopRecord> }> =>
  http.get(`/workshops/page?current=${current}&pageSize=${pageSize}`, { silent: true });

/** 查询全部车间（不分页） */
export const getWorkshopList = (): Promise<{ data: WorkshopRecord[] }> =>
  http.get('/workshops/list', { silent: true });

/** 根据 ID 查询车间 */
export const getWorkshopById = (id: number): Promise<{ data: WorkshopRecord }> =>
  http.get(`/workshops/${id}`);

/** 新增车间 */
export const createWorkshop = (data: WorkshopRecord): Promise<{ data: WorkshopRecord }> =>
  http.post('/workshops', data);

/** 修改车间 */
export const updateWorkshop = (id: number, data: WorkshopRecord): Promise<{ data: void }> =>
  http.put(`/workshops/${id}`, data);

/** 删除车间 */
export const deleteWorkshop = (id: number): Promise<{ data: void }> =>
  http.delete(`/workshops/${id}`);

/** 批量删除车间 */
export const batchDeleteWorkshops = (ids: number[]): Promise<{ data: void }> =>
  http.delete('/workshops/batch', { data: ids });
