/**
 * 生产订单 API (L1) — 对应后端 /production-orders
 */
import http from './http';

export interface ProductionOrderRecord {
  id?: number;
  orderNo?: string;
  orderType?: string;
  customerName?: string;
  customerCode?: string;
  deliveryDate?: string;
  priority?: number;       // 1低 2普通 3高 4紧急
  status?: string;         // DRAFT / RELEASED / IN_PROGRESS / COMPLETED / CLOSED
  totalQuantity?: number;
  completedQuantity?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  releaseBy?: string;
  releaseTime?: string;
}

/** 分页查询生产订单 */
export const getProductionOrderPage = (params?: {
  current?: number; pageSize?: number;
  orderNo?: string; status?: string; customerName?: string;
}): Promise<any> => http.get('/production-orders/page', { params });

/** 查询全部生产订单（不分页） */
export const getProductionOrderList = (params?: { status?: string }): Promise<any> =>
  http.get('/production-orders/list', { params });

/** 根据ID查询 */
export const getProductionOrderById = (id: number): Promise<any> =>
  http.get(`/production-orders/${id}`);

/** 新增生产订单 */
export const createProductionOrder = (data: ProductionOrderRecord): Promise<any> =>
  http.post('/production-orders', data);

/** 修改生产订单 */
export const updateProductionOrder = (id: number, data: ProductionOrderRecord): Promise<any> =>
  http.put(`/production-orders/${id}`, data);

/** 删除生产订单 */
export const deleteProductionOrder = (id: number): Promise<any> =>
  http.delete(`/production-orders/${id}`);

/** 批量删除 */
export const batchDeleteProductionOrders = (ids: number[]): Promise<any> =>
  http.delete('/production-orders/batch', { data: ids });
