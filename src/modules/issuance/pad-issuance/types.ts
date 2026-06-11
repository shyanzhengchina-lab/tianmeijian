/**
 * 工位领料模块类型定义
 */

export type PadIssuanceStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ISSUED' | 'CANCELLED' | 'COMPLETED';

export interface PadIssuanceItem {
  id: string;
  padIssuanceId: string;
  materialCode: string;
  materialName: string;
  materialSpec: string;
  planQty: number;
  issuedQty: number;
  pendingQty: number;
  batchNo?: string;
  unit: string;
  remark?: string;
}

export interface PadIssuance {
  id: string;
  issuanceNo: string;
  taskId: string;
  taskNo: string;
  workOrderNo: string;
  operationCode: string;
  operationName: string;
  workstation: string;
  worker: string;
  status: PadIssuanceStatus;
  requestDate: string;
  requiredDate: string;
  requestBy: string;
  submitTime?: string;
  approvedBy?: string;
  approveTime?: string;
  issuedBy?: string;
  issueTime?: string;
  completeTime?: string;
  items: PadIssuanceItem[];
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePadIssuanceDTO {
  issuanceNo: string;
  taskId: string;
  taskNo: string;
  workOrderNo: string;
  operationCode: string;
  operationName: string;
  workstation: string;
  worker: string;
  requestDate: string;
  requiredDate: string;
  requestBy: string;
  items: Omit<PadIssuanceItem, 'id' | 'padIssuanceId'>[];
  remark?: string;
}

export interface UpdatePadIssuanceDTO extends Partial<CreatePadIssuanceDTO> {
  id: string;
}

export interface PadIssuanceQuery {
  page?: number;
  pageSize?: number;
  issuanceNo?: string;
  taskNo?: string;
  workOrderNo?: string;
  operationCode?: string;
  workstation?: string;
  status?: PadIssuanceStatus;
  requestDateStart?: string;
  requestDateEnd?: string;
}

// 状态映射
export const PAD_ISSUANCE_STATUS_MAP: Record<PadIssuanceStatus, {
  label: string;
  color: string;
  badgeType: 'default' | 'processing' | 'error' | 'success' | 'warning';
}> = {
  DRAFT: { label: '草稿', color: '#faad14', badgeType: 'warning' },
  SUBMITTED: { label: '已提交', color: '#1677ff', badgeType: 'processing' },
  APPROVED: { label: '已批准', color: '#52c41a', badgeType: 'success' },
  ISSUED: { label: '已发料', color: '#13c2c2', badgeType: 'default' },
  CANCELLED: { label: '已取消', color: '#ff4d4f', badgeType: 'error' },
  COMPLETED: { label: '已完成', color: '#722ed1', badgeType: 'default' },
};
