/**
 * PAD 任务 API — 对应后端 /pad-tasks
 */
import http from './http';

export interface PadTaskRecord {
  id?: number;
  taskNo?: string;
  taskName?: string;
  productCode?: string;
  productName?: string;
  operationCode?: string;
  operationName?: string;
  workCenterName?: string;
  status?: string;
  priority?: string;
  planQuantity?: number;
  unitName?: string;
  completedQuantity?: number;
  qualifiedQuantity?: number;
  rejectedQuantity?: number;
  progress?: number;
  operatorName?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  remark?: string;
  createTime?: string;
}

/** 全量列表 */
export const getPadTaskList = (params?: { status?: string; operationCode?: string }): Promise<any> =>
  http.get('/pad-tasks/list', { params });

/** 分页查询 */
export const getPadTaskPage = (params?: {
  current?: number; pageSize?: number; status?: string; taskNo?: string;
}): Promise<any> =>
  http.get('/pad-tasks/page', { params });

/** 根据ID查询 */
export const getPadTaskById = (id: number): Promise<any> =>
  http.get(`/pad-tasks/${id}`);

/** 查询任务操作记录 */
export const getPadTaskRecords = (id: number): Promise<any> =>
  http.get(`/pad-tasks/${id}/records`);

/** 新增任务 */
export const createPadTask = (data: PadTaskRecord): Promise<any> =>
  http.post('/pad-tasks', data);

/** 修改任务 */
export const updatePadTask = (id: number, data: PadTaskRecord): Promise<any> =>
  http.put(`/pad-tasks/${id}`, data);

/** 更新任务状态 */
export const updatePadTaskStatus = (id: number, body: Record<string, string>): Promise<any> =>
  http.put(`/pad-tasks/${id}/status`, body);

/** 删除任务 */
export const deletePadTask = (id: number): Promise<any> =>
  http.delete(`/pad-tasks/${id}`);
