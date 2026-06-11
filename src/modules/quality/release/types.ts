/**
 * 质量放行模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 放行状态
export type ReleaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// 放行类型
export type ReleaseType = 'BATCH' | 'LOT' | 'ORDER';

// 质量放行单接口
export interface QualityRelease {
  id: string;
  releaseNo: string;         // 放行单号
  inspectionId?: string;     // 关联质检单
  inspectionNo?: string;     // 质检单号
  ticketId?: string;         // 关联浮票ID
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  batchNo: string;
  lotNo?: string;
  qty: number;               // 数量
  // 放行信息
  releaseType: ReleaseType;
  status: ReleaseStatus;
  // 审批信息
  requester: string;         // 申请人
  approver?: string;         // 批准人
  approvalTime?: string;     // 批准时间
  rejectReason?: string;     // 拒绝原因
  // 时间信息
  requestTime: string;       // 申请时间
  completeTime?: string;     // 完成时间
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 质量放行单查询参数
export interface QualityReleaseQuery extends PageQuery {
  releaseNo?: string;
  inspectionNo?: string;
  productCode?: string;
  productName?: string;
  batchNo?: string;
  status?: ReleaseStatus;
  releaseType?: ReleaseType;
  requester?: string;
  approver?: string;
  requestTimeStart?: string;
  requestTimeEnd?: string;
}

// 创建质量放行单DTO
export interface CreateQualityReleaseDTO {
  releaseNo: string;
  inspectionId?: string;
  inspectionNo?: string;
  ticketId?: string;
  productCode: string;
  productName: string;
  productSpec: string;
  batchNo: string;
  lotNo?: string;
  qty: number;
  releaseType: ReleaseType;
  requester: string;
  remark?: string;
}

// 更新质量放行单DTO
export interface UpdateQualityReleaseDTO extends Partial<CreateQualityReleaseDTO> {
  id: string;
}

// 批量操作参数
export interface QualityReleaseBatchAction {
  ids: string[];
  action: 'approve' | 'reject' | 'cancel' | 'delete';
  params?: Record<string, any>;
}

// 放行状态映射
export const RELEASE_STATUS_MAP: Record<ReleaseStatus, { label: string; color: string; badge: any }> = {
  'PENDING':   { label: '待批准', color: '#8c8c8c', badge: 'default' },
  'APPROVED':  { label: '已批准', color: '#52c41a', badge: 'success' },
  'REJECTED':  { label: '已拒绝', color: '#ff4d4f', badge: 'error' },
  'CANCELLED': { label: '已取消', color: '#d9d9d9', badge: 'default' },
};

// 放行类型映射
export const RELEASE_TYPE_MAP: Record<ReleaseType, { label: string; color: string }> = {
  'BATCH': { label: '批次放行', color: '#1677ff' },
  'LOT':   { label: '子批放行', color: '#faad14' },
  'ORDER': { label: '订单放行', color: '#52c41a' },
};

// 默认质量放行单数据
export const DEFAULT_QUALITY_RELEASES: QualityRelease[] = [
  {
    id: 'QR-001',
    releaseNo: 'QR-20260425001',
    inspectionId: 'INS-001',
    inspectionNo: 'INS-20260425001',
    ticketId: 'FT-001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    batchNo: '20260425001',
    lotNo: '001',
    qty: 10,
    releaseType: 'BATCH',
    status: 'PENDING',
    requester: '生产调度',
    requestTime: '2026-04-05 17:00:00',
    remark: '申请批次放行',
    createdBy: '生产调度',
    createdAt: '2026-04-05 17:00:00',
    updatedAt: '2026-04-05 17:00:00',
  },
];

export * from './types/index';
