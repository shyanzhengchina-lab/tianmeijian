/**
 * EBR列表模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// EBR状态
export type EbrStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';

// EBR类型
export type EbrType = 'PRODUCTION' | 'TEST' | 'PILOT' | 'VALIDATION';

// EBR接口
export interface Ebr {
  id: string;
  ebrNo: string;               // EBR编号
  batchNo: string;             // 批号
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  // EBR信息
  ebrType: EbrType;
  status: EbrStatus;
  // 计划信息
  planQty: number;
  actualQty?: number;
  qualifiedQty?: number;
  unqualifiedQty?: number;
  // 时间信息
  planStartDate: string;
  planEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  // 审批信息
  approvedBy?: string;
  approvalTime?: string;
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// EBR查询参数
export interface EbrQuery extends PageQuery {
  ebrNo?: string;
  batchNo?: string;
  productCode?: string;
  productName?: string;
  status?: EbrStatus;
  ebrType?: EbrType;
  planStartDateStart?: string;
  planStartDateEnd?: string;
}

// 创建EBR DTO
export interface CreateEbrDTO {
  ebrNo: string;
  batchNo: string;
  productCode: string;
  productName: string;
  productSpec: string;
  ebrType: EbrType;
  planQty: number;
  planStartDate: string;
  planEndDate: string;
  remark?: string;
}

// 更新EBR DTO
export interface UpdateEbrDTO extends Partial<CreateEbrDTO> {
  id: string;
}

// 批量操作参数
export interface EbrBatchAction {
  ids: string[];
  action: 'start' | 'complete' | 'close' | 'cancel' | 'delete' | 'approve';
  params?: Record<string, any>;
}

// EBR状态映射
export const EBR_STATUS_MAP: Record<EbrStatus, { label: string; color: string; badge: any }> = {
  'CREATED':     { label: '已创建',   color: '#8c8c8c', badge: 'default' },
  'IN_PROGRESS':  { label: '进行中',   color: '#1677ff', badge: 'processing' },
  'COMPLETED':    { label: '已完成',   color: '#52c41a', badge: 'success' },
  'CLOSED':       { label: '已关闭',   color: '#d9d9d9', badge: 'default' },
  'CANCELLED':    { label: '已取消',   color: '#ff4d4f', badge: 'error' },
};

// EBR类型映射
export const EBR_TYPE_MAP: Record<EbrType, { label: string; color: string }> = {
  'PRODUCTION':  { label: '生产',    color: '#1677ff' },
  'TEST':        { label: '测试',    color: '#faad14' },
  'PILOT':       { label: '试产',    color: '#52c41a' },
  'VALIDATION':  { label: '验证',    color: '#722ed1' },
};

// 默认EBR数据
export const DEFAULT_EBRS: Ebr[] = [
  {
    id: 'EBR-001',
    ebrNo: 'EBR-20260425001',
    batchNo: '20260425001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    ebrType: 'PRODUCTION',
    status: 'IN_PROGRESS',
    planQty: 5000,
    actualQty: 3200,
    qualifiedQty: 3150,
    planStartDate: '2026-04-01',
    planEndDate: '2026-04-30',
    actualStartDate: '2026-04-05',
    remark: '标准生产批次',
    createdBy: '计划员',
    createdAt: '2026-04-01 10:00:00',
    updatedAt: '2026-04-20 16:30:00',
  },
];
