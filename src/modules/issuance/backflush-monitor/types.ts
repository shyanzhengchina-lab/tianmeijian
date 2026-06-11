/**
 * 倒冲监控模块类型定义
 */

export type BackflushStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface BackflushItem {
  id: string;
  monitorId: string;
  materialCode: string;
  materialName: string;
  materialSpec: string;
  planQty: number;
  backflushQty: number;
  diffQty: number;
  batchNo?: string;
  unit: string;
  remark?: string;
}

export interface BackflushMonitor {
  id: string;
  monitorNo: string;
  workOrderId: string;
  workOrderNo: string;
  taskOrderId: string;
  taskOrderNo: string;
  operationCode: string;
  operationName: string;
  productId: string;
  productCode: string;
  productName: string;
  productSpec: string;
  completedQty: number;
  backflushQty: number;
  status: BackflushStatus;
  backflushTime?: string;
  startTime?: string;
  endTime?: string;
  errorReason?: string;
  items: BackflushItem[];
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBackflushMonitorDTO {
  monitorNo: string;
  workOrderId: string;
  workOrderNo: string;
  taskOrderId: string;
  taskOrderNo: string;
  operationCode: string;
  operationName: string;
  productId: string;
  productCode: string;
  productName: string;
  productSpec: string;
  completedQty: number;
  items: Omit<BackflushItem, 'id' | 'monitorId'>[];
  remark?: string;
}

export interface UpdateBackflushMonitorDTO extends Partial<CreateBackflushMonitorDTO> {
  id: string;
}

export interface BackflushMonitorQuery {
  page?: number;
  pageSize?: number;
  monitorNo?: string;
  workOrderNo?: string;
  taskOrderNo?: string;
  productCode?: string;
  operationCode?: string;
  status?: BackflushStatus;
  backflushTimeStart?: string;
  backflushTimeEnd?: string;
}

// 状态映射
export const BACKFLUSH_STATUS_MAP: Record<BackflushStatus, {
  label: string;
  color: string;
  badgeType: 'default' | 'processing' | 'error' | 'success' | 'warning';
}> = {
  PENDING: { label: '待倒冲', color: '#faad14', badgeType: 'warning' },
  RUNNING: { label: '倒冲中', color: '#1677ff', badgeType: 'processing' },
  COMPLETED: { label: '已完成', color: '#52c41a', badgeType: 'success' },
  FAILED: { label: '失败', color: '#ff4d4f', badgeType: 'error' },
  CANCELLED: { label: '已取消', color: '#999', badgeType: 'default' },
};
