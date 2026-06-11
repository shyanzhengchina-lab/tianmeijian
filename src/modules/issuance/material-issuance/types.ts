/**
 * 领料管理模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 领料单状态
export type IssuanceStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIAL_ISSUED' | 'COMPLETED' | 'CANCELLED';

// 领料单接口
export interface MaterialIssuance {
  id: string;
  issuanceNo: string;        // 领料单号
  workOrderId: string;       // 工单ID
  workOrderNo: string;      // 工单号
  productionOrderId: string; // 生产订单ID
  // 领料信息
  status: IssuanceStatus;
  requestDate: string;      // 申请日期
  requiredDate: string;     // 要求日期
  // 人员信息
  requestBy: string;        // 申请人
  approvedBy?: string;      // 批准人
  issuedBy?: string;        // 发料人
  // 时间信息
  submitTime?: string;      // 提交时间
  approveTime?: string;     // 批准时间
  completeTime?: string;    // 完成时间
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: IssuanceItem[];    // 领料明细
}

// 领料明细接口
export interface IssuanceItem {
  id: string;
  issuanceId: string;       // 领料单ID
  materialCode: string;     // 物料编码
  materialName: string;     // 物料名称
  materialSpec: string;     // 物料规格
  // 数量信息
  planQty: number;         // 计划数量
  issuedQty: number;       // 已发数量
  pendingQty: number;       // 待发数量
  // 库存信息
  availableQty: number;     // 可用库存
  // 批次信息
  batchNo?: string;        // 批号
  // 其他
  remark?: string;
}

// 领料单查询参数
export interface IssuanceQuery extends PageQuery {
  issuanceNo?: string;
  workOrderNo?: string;
  status?: IssuanceStatus;
  requestBy?: string;
  requestDateStart?: string;
  requestDateEnd?: string;
}

// 创建领料单DTO
export interface CreateIssuanceDTO {
  issuanceNo: string;
  workOrderId: string;
  workOrderNo: string;
  productionOrderId: string;
  requestDate: string;
  requiredDate: string;
  requestBy: string;
  items?: Omit<IssuanceItem, 'id' | 'issuanceId'>[];
  remark?: string;
}

// 更新领料单DTO
export interface UpdateIssuanceDTO extends Partial<CreateIssuanceDTO> {
  id: string;
}

// 批量操作参数
export interface IssuanceBatchAction {
  ids: string[];
  action: 'submit' | 'approve' | 'reject' | 'issue' | 'cancel' | 'delete';
  params?: Record<string, any>;
}

// 领料单状态映射
export const ISSUANCE_STATUS_MAP: Record<IssuanceStatus, { label: string; color: string; badge: any }> = {
  'DRAFT':          { label: '草稿',     color: '#8c8c8c', badge: 'default' },
  'SUBMITTED':       { label: '已提交',   color: '#1677ff', badge: 'processing' },
  'APPROVED':        { label: '已批准',   color: '#52c41a', badge: 'success' },
  'PARTIAL_ISSUED':  { label: '部分发料', color: '#faad14', badge: 'warning' },
  'COMPLETED':       { label: '已完成',   color: '#1677ff', badge: 'success' },
  'CANCELLED':       { label: '已取消',   color: '#d9d9d9', badge: 'default' },
};

// 默认领料单数据
export const DEFAULT_ISSUANCES: MaterialIssuance[] = [
  {
    id: 'MI-001',
    issuanceNo: 'MI-20260425001',
    workOrderId: 'WO-001',
    workOrderNo: 'WO-20260425001',
    productionOrderId: 'PO-001',
    status: 'APPROVED',
    requestDate: '2026-04-05',
    requiredDate: '2026-04-10',
    requestBy: '生产调度',
    approvedBy: '仓库主管',
    approveTime: '2026-04-05 10:30:00',
    remark: '标准生产领料',
    createdBy: '生产调度',
    createdAt: '2026-04-05 09:00:00',
    updatedAt: '2026-04-05 10:30:00',
  } as MaterialIssuance,
];
