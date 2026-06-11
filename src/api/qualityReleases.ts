/**
 * 质量放行 API — 对应后端 /quality-releases
 */
import http from './http';

export interface QualityReleaseRecord {
  id?: number;
  releaseNo?: string;
  releaseType?: string;
  taskId?: number;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  batchNo?: string;
  quantity?: number;
  unit?: string;
  warehouseId?: number;
  warehouseName?: string;
  releaseDate?: string;
  status?: string;
  applicantId?: number;
  applicantName?: string;
  applyTime?: string;
  approverId?: number;
  approverName?: string;
  approveTime?: string;
  approveRemark?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
}

/** 查询全部质量放行 */
export const getQualityReleaseList = (params?: { status?: string; releaseType?: string }): Promise<any> =>
  http.get('/quality-releases/list', { params });

/** 分页查询质量放行 */
export const getQualityReleasePage = (params?: { current?: number; pageSize?: number; releaseNo?: string; status?: string }): Promise<any> =>
  http.get('/quality-releases/page', { params });

/** 根据ID查询 */
export const getQualityReleaseById = (id: number): Promise<any> =>
  http.get(`/quality-releases/${id}`);

/** 新增质量放行 */
export const createQualityRelease = (data: QualityReleaseRecord): Promise<any> =>
  http.post('/quality-releases', data);

/** 修改质量放行 */
export const updateQualityRelease = (id: number, data: QualityReleaseRecord): Promise<any> =>
  http.put(`/quality-releases/${id}`, data);

/** 删除质量放行 */
export const deleteQualityRelease = (id: number): Promise<any> =>
  http.delete(`/quality-releases/${id}`);

/** 批量删除 */
export const batchDeleteQualityReleases = (ids: number[]): Promise<any> =>
  http.delete('/quality-releases/batch', { data: ids });
