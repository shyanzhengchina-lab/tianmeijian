/**
 * 生产任务单 API (L3) — 对应后端 /task-orders
 */
import http from './http';

export interface TaskOrderRecord {
  id?: number;
  taskNo?: string;
  workOrderId?: number;
  workOrderNo?: string;
  operationCode?: string;
  operationName?: string;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  planQuantity?: number;
  completedQuantity?: number;
  qualifiedQuantity?: number;
  unqualifiedQuantity?: number;
  unitId?: number;
  unitName?: string;
  workCenterId?: number;
  workCenterName?: string;
  assignedTo?: number;
  assignedToName?: string;
  assignTime?: string;
  startTime?: string;
  endTime?: string;
  equipId?: number;
  equipCode?: string;
  actualWorkHours?: number;
  status?: string;         // PENDING / ASSIGNED / IN_PROGRESS / COMPLETED / PAUSED
  progress?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
}

/** 分页查询任务单 */
export const getTaskOrderPage = (params?: {
  current?: number; pageSize?: number;
  taskNo?: string; workOrderId?: number; status?: string; assignedToName?: string;
}): Promise<any> => http.get('/task-orders/page', { params, silent: true });

/** 查询全部任务单（不分页） */
export const getTaskOrderList = (params?: { workOrderId?: number; status?: string }): Promise<any> =>
  http.get('/task-orders/list', { params, silent: true });

/** 根据ID查询 */
export const getTaskOrderById = (id: number): Promise<any> =>
  http.get(`/task-orders/${id}`);

/** 新增任务单 */
export const createTaskOrder = (data: TaskOrderRecord): Promise<any> =>
  http.post('/task-orders', data);

/** 修改任务单 */
export const updateTaskOrder = (id: number, data: TaskOrderRecord): Promise<any> =>
  http.put(`/task-orders/${id}`, data);

/** 删除任务单 */
export const deleteTaskOrder = (id: number): Promise<any> =>
  http.delete(`/task-orders/${id}`);

/** 批量删除 */
export const batchDeleteTaskOrders = (ids: number[]): Promise<any> =>
  http.delete('/task-orders/batch', { data: ids });
