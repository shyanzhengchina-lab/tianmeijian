/**
 * 工作中心管理 API
 */
import http from './http';

export interface WorkCenterRecord {
  id?: number;
  code?: string;
  name?: string;
  workshopId?: number;
  workshopName?: string;
  category?: string;
  leaderName?: string;
  phone?: string;
  capacity?: number;
  capacityUnit?: string;
  equipCount?: number;
  location?: string;
  costCenter?: string;
  status?: number; // 1=启用, 0=停用
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

/** 分页查询工作中心 */
export const getWorkCenterPage = (current = 1, pageSize = 15): Promise<{ data: PageResult<WorkCenterRecord> }> =>
  http.get(`/work-centers/page?current=${current}&pageSize=${pageSize}`, { silent: true });

/** 查询全部工作中心（不分页） */
export const getWorkCenterList = (): Promise<{ data: WorkCenterRecord[] }> =>
  http.get('/work-centers/list', { silent: true });

/** 根据 ID 查询工作中心 */
export const getWorkCenterById = (id: number): Promise<{ data: WorkCenterRecord }> =>
  http.get(`/work-centers/${id}`);

/** 新增工作中心 */
export const createWorkCenter = (data: WorkCenterRecord): Promise<{ data: WorkCenterRecord }> =>
  http.post('/work-centers', data);

/** 修改工作中心 */
export const updateWorkCenter = (id: number, data: WorkCenterRecord): Promise<{ data: void }> =>
  http.put(`/work-centers/${id}`, data);

/** 删除工作中心 */
export const deleteWorkCenter = (id: number): Promise<{ data: void }> =>
  http.delete(`/work-centers/${id}`);

/** 批量删除工作中心 */
export const batchDeleteWorkCenters = (ids: number[]): Promise<{ data: void }> =>
  http.delete('/work-centers/batch', { data: ids });
