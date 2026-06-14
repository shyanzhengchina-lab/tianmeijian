/**
 * 物料档案 API — 对应后端 /materials
 */
import http from './http';

export interface MaterialRecord {
  id?: number;
  code?: string;
  name?: string;
  categoryId?: number;
  spec?: string;
  unitId?: number;
  unitName?: string;
  type?: string;
  brand?: string;
  supplier?: string;
  minStock?: number;
  maxStock?: number;
  price?: number;
  status?: number;        // 1启用 0禁用
  description?: string;
  createTime?: string;
  updateTime?: string;
}

export interface MaterialPageQuery {
  current?: number;
  pageSize?: number;
  categoryId?: number;
  keyword?: string;
  type?: string;
  status?: number;
}

/** 分页查询物料 */
export const getMaterialPage = (query: MaterialPageQuery = {}): Promise<any> =>
  http.get('/materials/page', { params: query, silent: true });

/** 查询全部（不分页） */
export const getMaterialList = (params?: { categoryId?: number; status?: number }): Promise<any> =>
  http.get('/materials/list', { params, silent: true });

/** 根据ID查询 */
export const getMaterialById = (id: number): Promise<any> =>
  http.get(`/materials/${id}`);

/** 新增物料 */
export const createMaterial = (data: MaterialRecord): Promise<any> =>
  http.post('/materials', data);

/** 修改物料 */
export const updateMaterial = (id: number, data: MaterialRecord): Promise<any> =>
  http.put(`/materials/${id}`, data);

/** 删除物料 */
export const deleteMaterial = (id: number): Promise<any> =>
  http.delete(`/materials/${id}`);

/** 批量删除 */
export const batchDeleteMaterials = (ids: number[]): Promise<any> =>
  http.delete('/materials/batch', { data: ids });
