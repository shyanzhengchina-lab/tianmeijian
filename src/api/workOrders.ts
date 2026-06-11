/**
 * 生产工单 API (L2) — 对应后端 /work-orders
 */
import http from './http';

export interface WorkOrderRecord {
  id?: number;
  workOrderNo?: string;
  orderId?: number;
  orderNo?: string;
  materialId?: number;
  materialCode?: string;
  materialName?: string;
  spec?: string;
  planQuantity?: number;
  completedQuantity?: number;
  qualifiedQuantity?: number;
  unqualifiedQuantity?: number;
  unitId?: number;
  unitName?: string;
  bomId?: number;
  bomVersion?: string;
  routingId?: number;
  workCenterId?: number;
  workCenterName?: string;
  startDate?: string;
  endDate?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status?: string;         // DRAFT / RELEASED / IN_PROGRESS / COMPLETED / CLOSED
  progress?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
}

/** 分页查询工单 */
export const getWorkOrderPage = (params?: {
  current?: number; pageSize?: number;
  workOrderNo?: string; orderId?: number; status?: string; materialName?: string;
}): Promise<any> => http.get('/work-orders/page', { params });

/** 查询全部工单（不分页） */
export const getWorkOrderList = (params?: { orderId?: number; status?: string }): Promise<any> =>
  http.get('/work-orders/list', { params });

/** 根据ID查询 */
export const getWorkOrderById = (id: number): Promise<any> =>
  http.get(`/work-orders/${id}`);

/** 新增工单 */
export const createWorkOrder = (data: WorkOrderRecord): Promise<any> =>
  http.post('/work-orders', data);

/** 修改工单 */
export const updateWorkOrder = (id: number, data: WorkOrderRecord): Promise<any> =>
  http.put(`/work-orders/${id}`, data);

/** 删除工单 */
export const deleteWorkOrder = (id: number): Promise<any> =>
  http.delete(`/work-orders/${id}`);

/** 批量删除 */
export const batchDeleteWorkOrders = (ids: number[]): Promise<any> =>
  http.delete('/work-orders/batch', { data: ids });
