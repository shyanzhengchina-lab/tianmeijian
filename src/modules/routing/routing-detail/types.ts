// Re-export types from types/index.ts
export * from './types/index';
/**
 * 工艺明细模块类型定义
 */

export type RoutingDetailStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface RoutingDetail {
  id: string;
  routingId: string;
  routingNo: string;
  operationCode: string;
  operationName: string;
  operationDesc?: string;
  sequence: number;
  workCenter: string;
  equipment?: string;
  standardTime: number;
  setupTime: number;
  laborTime: number;
  machineTime: number;
  status: RoutingDetailStatus;
  remarks?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutingDetailDTO {
  routingId: string;
  routingNo: string;
  operationCode: string;
  operationName: string;
  operationDesc?: string;
  sequence: number;
  workCenter: string;
  equipment?: string;
  standardTime: number;
  setupTime: number;
  laborTime: number;
  machineTime: number;
  status: RoutingDetailStatus;
  remarks?: string;
}

export interface UpdateRoutingDetailDTO extends Partial<CreateRoutingDetailDTO> {
  id: string;
}

export interface RoutingDetailQuery {
  page?: number;
  pageSize?: number;
  routingId?: string;
  routingNo?: string;
  operationCode?: string;
  operationName?: string;
  workCenter?: string;
  status?: RoutingDetailStatus;
}

// 状态映射
export const ROUTING_DETAIL_STATUS_MAP: Record<RoutingDetailStatus, {
  label: string;
  color: string;
  badgeType: 'default' | 'processing' | 'error' | 'success' | 'warning';
}> = {
  ACTIVE: { label: '启用', color: '#52c41a', badgeType: 'success' },
  INACTIVE: { label: '停用', color: '#d9d9d9', badgeType: 'default' },
  ARCHIVED: { label: '归档', color: '#999', badgeType: 'default' },
};
