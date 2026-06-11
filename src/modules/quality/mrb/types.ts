import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';
// Re-export types from types/index.ts
export * from './types/index';
/**
 * MRB评审模块类型定义
 * 保持与现有数据结构完全一致
 */

// MRB状态
export type MrbStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';

// 处理结果
export type DispositionResult = 'USE_AS_IS' | 'REWORK' | 'SCRAP' | 'RETURN' | 'SPECIAL_CONCESSION';

// MRB评审单接口
export interface MrbReview {
  id: string;
  mrbNo: string;               // MRB编号
  inspectionId?: string;       // 关联质检单
  inspectionNo?: string;       // 质检单号
  ticketId?: string;           // 关联浮票ID
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  batchNo: string;
  qty: number;                 // 数量
  // 评审信息
  status: MrbStatus;
  defectDescription: string;   // 不良描述
  defectLevel: 'MINOR' | 'MAJOR' | 'CRITICAL'; // 不良等级
  // 处理结果
  dispositionResult?: DispositionResult;
  dispositionRemark?: string;   // 处理意见
  // 时间信息
  requestTime: string;         // 申请时间
  reviewTime?: string;         // 评审时间
  completeTime?: string;       // 完成时间
  // 评审信息
  reviewer?: string;           // 评审人
  approver?: string;           // 批准人
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// MRB评审记录接口
export interface MrbReviewRecord {
  id: string;
  mrbId: string;              // MRB评审ID
  reviewer: string;           // 评审人
  reviewTime: string;         // 评审时间
  reviewResult: 'APPROVE' | 'REJECT' | 'SUGGEST';
  reviewComment: string;      // 评审意见
  suggestedDisposition?: DispositionResult; // 建议处理结果
}

// MRB评审单查询参数
export interface MrbReviewQuery extends PageQuery {
  mrbNo?: string;
  inspectionNo?: string;
  productCode?: string;
  productName?: string;
  batchNo?: string;
  status?: MrbStatus;
  defectLevel?: string;
  reviewer?: string;
  requestTimeStart?: string;
  requestTimeEnd?: string;
}

// 创建MRB评审单DTO
export interface CreateMrbReviewDTO {
  mrbNo: string;
  inspectionId?: string;
  inspectionNo?: string;
  ticketId?: string;
  productCode: string;
  productName: string;
  productSpec: string;
  batchNo: string;
  qty: number;
  defectDescription: string;
  defectLevel: 'MINOR' | 'MAJOR' | 'CRITICAL';
  remark?: string;
}

// 更新MRB评审单DTO
export interface UpdateMrbReviewDTO extends Partial<CreateMrbReviewDTO> {
  id: string;
}

// 批量操作参数
export interface MrbReviewBatchAction {
  ids: string[];
  action: 'start' | 'approve' | 'reject' | 'close' | 'delete';
  params?: Record<string, any>;
}

// MRB状态映射
export const MRB_STATUS_MAP: Record<MrbStatus, { label: string; color: string; badge: any }> = {
  'PENDING':    { label: '待评审', color: '#8c8c8c', badge: 'default' },
  'IN_REVIEW':  { label: '评审中', color: '#1677ff', badge: 'processing' },
  'APPROVED':   { label: '已批准', color: '#52c41a', badge: 'success' },
  'REJECTED':   { label: '已拒绝', color: '#ff4d4f', badge: 'error' },
  'CLOSED':     { label: '已关闭', color: '#d9d9d9', badge: 'default' },
};

// 处理结果映射
export const DISPOSITION_RESULT_MAP: Record<DispositionResult, { label: string; color: string }> = {
  'USE_AS_IS':          { label: '原样使用', color: '#52c41a' },
  'REWORK':             { label: '返工',     color: '#faad14' },
  'SCRAP':              { label: '报废',     color: '#ff4d4f' },
  'RETURN':             { label: '退货',     color: '#722ed1' },
  'SPECIAL_CONCESSION': { label: '特采',     color: '#1677ff' },
};

// 默认MRB评审单数据
export const DEFAULT_MRB_REVIEWS: MrbReview[] = [
  {
    id: 'MRB-001',
    mrbNo: 'MRB-20260425001',
    inspectionId: 'INS-001',
    inspectionNo: 'INS-20260425001',
    ticketId: 'FT-001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    batchNo: '20260425001',
    qty: 10,
    status: 'IN_REVIEW',
    defectDescription: '尺寸偏差超差',
    defectLevel: 'MAJOR',
    dispositionResult: undefined,
    requestTime: '2026-04-05 15:00:00',
    reviewer: '质量经理',
    remark: '需要评审处理方案',
    createdBy: '检验员A',
    createdAt: '2026-04-05 15:00:00',
    updatedAt: '2026-04-05 16:00:00',
  },
];
