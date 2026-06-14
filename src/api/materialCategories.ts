/**
 * 物料分类 API
 * 后端 MaterialCategoryController — /material-categories
 */
import http from './http';

export interface MaterialCategoryRecord {
  id?: number;
  parentId?: number;
  code?: string;
  name?: string;
  sortNo?: number;
  status?: number;   // 1=启用, 0=停用
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

/** 查询全部分类（flat list，前端自行组树） */
export const getMaterialCategoryList = (params?: { parentId?: number; status?: number }): Promise<any> =>
  http.get('/material-categories/list', { params, silent: true });

/** 新增分类 */
export const createMaterialCategory = (data: MaterialCategoryRecord): Promise<any> =>
  http.post('/material-categories', data);

/** 修改分类 */
export const updateMaterialCategory = (id: number, data: MaterialCategoryRecord): Promise<any> =>
  http.put(`/material-categories/${id}`, data);

/** 删除分类 */
export const deleteMaterialCategory = (id: number): Promise<any> =>
  http.delete(`/material-categories/${id}`);

/** 批量删除 */
export const batchDeleteMaterialCategories = (ids: number[]): Promise<any> =>
  http.delete('/material-categories/batch', { data: ids });
