/**
 * 质检任务 API — 对应后端 /inspection-tasks
 */
import http from './http';

export interface InspectionTaskRecord {
  id?: number;
  taskNo?: string;
  taskType?: string;
  sourceType?: string;
  sourceNo?: string;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  batchNo?: string;
  quantity?: number;
  unit?: string;
  sampleQuantity?: number;
  inspectDate?: string;
  inspectorId?: number;
  inspectorName?: string;
  status?: string;
  result?: string;
  totalItems?: number;
  passItems?: number;
  failItems?: number;
  remark?: string;
  completeTime?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
}

/** 查询全部质检任务 */
export const getInspectionTaskList = (params?: { status?: string; taskType?: string }): Promise<any> =>
  http.get('/inspection-tasks/list', { params, silent: true });

/** 分页查询质检任务 */
export const getInspectionTaskPage = (params?: { current?: number; pageSize?: number; taskNo?: string; status?: string; taskType?: string }): Promise<any> =>
  http.get('/inspection-tasks/page', { params, silent: true });

/** 根据ID查询 */
export const getInspectionTaskById = (id: number): Promise<any> =>
  http.get(`/inspection-tasks/${id}`);

/** 新增质检任务 */
export const createInspectionTask = (data: InspectionTaskRecord): Promise<any> =>
  http.post('/inspection-tasks', data);

/** 修改质检任务 */
export const updateInspectionTask = (id: number, data: InspectionTaskRecord): Promise<any> =>
  http.put(`/inspection-tasks/${id}`, data);

/** 更新状态 */
export const updateInspectionTaskStatus = (id: number, status: string, result?: string): Promise<any> =>
  http.put(`/inspection-tasks/${id}/status`, { status, result });

/** 删除质检任务 */
export const deleteInspectionTask = (id: number): Promise<any> =>
  http.delete(`/inspection-tasks/${id}`);

/** 批量删除 */
export const batchDeleteInspectionTasks = (ids: number[]): Promise<any> =>
  http.delete('/inspection-tasks/batch', { data: ids });
