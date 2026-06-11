/**
 * 设备管理 API
 */
import http from './http';

export interface EquipmentRecord {
  id?: number;
  code?: string;
  name?: string;
  category?: string;
  model?: string;
  brand?: string;
  workshopId?: number;
  workshopName?: string;
  workCenterId?: number;
  workCenterName?: string;
  location?: string;
  purchaseDate?: string;
  warrantyDate?: string;
  lastMaintDate?: string;
  nextMaintDate?: string;
  status?: string; // 'NORMAL' | 'MAINTAIN' | 'FAULT'
  precision?: string;
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

/** 分页查询设备 */
export const getEquipmentPage = (current = 1, pageSize = 15): Promise<{ data: PageResult<EquipmentRecord> }> =>
  http.get(`/equipment/page?current=${current}&pageSize=${pageSize}`);

/** 查询全部设备（不分页） */
export const getEquipmentList = (): Promise<{ data: EquipmentRecord[] }> =>
  http.get('/equipment/list');

/** 根据 ID 查询设备 */
export const getEquipmentById = (id: number): Promise<{ data: EquipmentRecord }> =>
  http.get(`/equipment/${id}`);

/** 新增设备 */
export const createEquipment = (data: EquipmentRecord): Promise<{ data: EquipmentRecord }> =>
  http.post('/equipment', data);

/** 修改设备 */
export const updateEquipment = (id: number, data: EquipmentRecord): Promise<{ data: void }> =>
  http.put(`/equipment/${id}`, data);

/** 删除设备 */
export const deleteEquipment = (id: number): Promise<{ data: void }> =>
  http.delete(`/equipment/${id}`);

/** 批量删除设备 */
export const batchDeleteEquipments = (ids: number[]): Promise<{ data: void }> =>
  http.delete('/equipment/batch', { data: ids });
