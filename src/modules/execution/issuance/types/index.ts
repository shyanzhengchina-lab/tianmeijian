/**
 * 领料管理模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 领料单状态
 */
export type IssuanceStatus =
  | 'PENDING'        // 待领料
  | 'ISSUED'         // 已领料
  | 'RETURNED'        // 已退料
  | 'PARTIAL_RETURN' // 部分退料
  | 'CANCELLED';      // 已取消

/**
 * 领料类型
 */
export type IssuanceType =
  | 'NORMAL'          // 正常领料
  | 'EMERGENCY'      // 紧急领料
  | 'REPLACE'        // 补料
  | 'RETURN';        // 退料

/**
 * 领料方式
 */
export type IssuanceMethod =
  | 'PER_BATCH'      // 按批领料
  | 'PER_OPERATION'   // 按工序领料
  | 'PER_WORKSTATION'; // 按工位领料

/**
 * 领料单接口
 */
export interface MaterialIssuance {
  id: string;
  issuanceNo: string; // 领料单号
  issuanceType: IssuanceType; // 领料类型
  status: IssuanceStatus; // 状态
  method: IssuanceMethod; // 领料方式

  // 关联信息
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单编号
  taskId: string; // 任务ID
  taskNo: string; // 任务编号
  operationId: string; // 工序ID
  operationName: string; // 工序名称

  // 人员信息
  requesterId: string; // 申请人ID
  requesterName: string; // 申请人姓名
  requesterDept: string; // 申请部门
  operatorId: string; // 领料人ID
  operatorName: string; // 领料人姓名
  receiverId: string; // 收料人ID
  receiverName: string; // 收料人姓名

  // 领料明细
  issuanceItems: Array<{
    itemId: string; // 明细ID
    materialId: string; // 物料ID
    materialCode: string; // 物料编码
    materialName: string; // 物料名称
    materialSpec: string; // 物料规格
    batchNo: string; // 批号
    requestedQty: number; // 申请数量
    issuedQty: number; // 实发数量
    returnedQty: number; // 退料数量
    unit: string; // 单位
    warehouseId: string; // 仓库ID
    warehouseName: string; // 仓库名称
    locationId: string; // 库位ID
    locationCode: string; // 库位编码
    issueTime: string | null; // 领料时间
    returnTime: string | null; // 退料时间
  }>;

  // 统计信息
  totalQty: number; // 总数量
  issuedQty: number; // 已发数量
  returnedQty: number; // 已退数量
  remainingQty: number; // 剩余数量

  // 时间信息
  requestTime: string; // 申请时间
  issueTime: string | null; // 领料时间
  planReturnTime: string | null; // 计划退料时间
  actualReturnTime: string | null; // 实际退料时间

  // 审批信息
  approverId: string | null; // 审批人ID
  approverName: string | null; // 审批人姓名
  approvalTime: string | null; // 审批时间
  approvalComment: string | null; // 审批意见

  // 备注
  remark: string | null;

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  factoryId: string; // 工厂ID
}

/**
 * 领料查询参数
 */
export interface IssuanceQuery extends PageQuery {
  issuanceNo?: string; // 领料单号
  issuanceType?: IssuanceType; // 领料类型
  status?: IssuanceStatus; // 状态
  method?: IssuanceMethod; // 领料方式
  workOrderNo?: string; // 工单编号
  taskId?: string; // 任务ID
  requesterId?: string; // 申请人ID
  operatorId?: string; // 领料人ID
  materialCode?: string; // 物料编码
  materialName?: string; // 物料名称
  batchNo?: string; // 批号
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建领料单DTO
 */
export interface CreateIssuanceDTO {
  workOrderId: string; // 工单ID
  taskId: string; // 任务ID
  operationId: string; // 工序ID
  issuanceType: IssuanceType; // 领料类型
  method: IssuanceMethod; // 领料方式
  planReturnTime: string; // 计划退料时间
  requesterId: string; // 申请人ID
  operatorId: string; // 领料人ID
  receiverId: string; // 收料人ID
  issuanceItems: Array<{
    materialId: string; // 物料ID
    batchNo: string; // 批号
    requestedQty: number; // 申请数量
    warehouseId: string; // 仓库ID
    locationId: string; // 库位ID
  }>;
  remark?: string; // 备注
}

/**
 * 更新领料单DTO
 */
export interface UpdateIssuanceDTO extends Partial<CreateIssuanceDTO> {
  id: string; // 领料单ID
}

/**
 * 领料操作DTO
 */
export interface IssuanceOperationDTO {
  action: 'APPROVE' | 'REJECT' | 'ISSUE' | 'RETURN'; // 操作类型
  issuanceId: string; // 领料单ID
  operatorId: string; // 操作员ID
  operatorName?: string; // 操作员姓名
  itemId?: string; // 明细ID
  qty?: number; // 数量
  actualQuantity?: number; // 实际数量（兼容别名）
  remark?: string; // 备注
}

/**
 * 退料DTO
 */
export interface ReturnMaterialDTO {
  issuanceId: string; // 领料单ID
  itemId: string; // 明细ID
  returnQty: number; // 退料数量
  returnReason: string; // 退料原因
  operatorId: string; // 操作员ID
  remark?: string; // 备注
}

/**
 * 倒冲监控DTO
 */
export interface BackflushMonitorDTO {
  workOrderId: string; // 工单ID
  taskId: string; // 任务ID
  materialId: string; // 物料ID
  backflushedQty: number; // 已倒冲数量
  standardQty: number; // 标准用量
  actualQty: number; // 实际用量
  variance: number; // 差异
  varianceRate: number; // 差异率
  operatorId: string; // 操作员ID
  checkTime: string; // 检查时间
}

/**
 * 领料单状态映射
 */
export const ISSUANCE_STATUS_MAP: Record<IssuanceStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: '待领料', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  ISSUED: { label: '已领料', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  RETURNED: { label: '已退料', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  PARTIAL_RETURN: { label: '部分退料', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  CANCELLED: { label: '已取消', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 领料类型映射
 */
export const ISSUANCE_TYPE_MAP: Record<IssuanceType, { label: string; color: string; icon: string }> = {
  NORMAL: { label: '正常领料', color: '#1890ff', icon: '📦' },
  EMERGENCY: { label: '紧急领料', color: '#ff4d4f', icon: '🚨' },
  REPLACE: { label: '补料', color: '#faad14', icon: '🔄' },
  RETURN: { label: '退料', color: '#52c41a', icon: '↩️' },
};

/**
 * 领料方式映射
 */
export const ISSUANCE_METHOD_MAP: Record<IssuanceMethod, { label: string; color: string; icon: string }> = {
  PER_BATCH: { label: '按批领料', color: '#1890ff', icon: '📋' },
  PER_OPERATION: { label: '按工序领料', color: '#722ed1', icon: '⚙️' },
  PER_WORKSTATION: { label: '按工位领料', color: '#13c2c2', icon: '🖥️' },
};

/**
 * 领料单表格列配置
 */
export const ISSUANCE_COLUMNS = [
  { key: 'issuanceNo', title: '领料单号', width: 150, align: 'center', fixed: 'left' },
  { key: 'issuanceType', title: '领料类型', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'method', title: '领料方式', width: 120, align: 'center' },
  { key: 'workOrderNo', title: '工单编号', width: 150, align: 'center' },
  { key: 'taskNo', title: '任务编号', width: 150, align: 'center' },
  { key: 'operationName', title: '工序名称', width: 150, align: 'center' },
  { key: 'requesterName', title: '申请人', width: 120, align: 'center' },
  { key: 'operatorName', title: '领料人', width: 120, align: 'center' },
  { key: 'totalQty', title: '总数量', width: 100, align: 'center' },
  { key: 'issuedQty', title: '已发数量', width: 100, align: 'center' },
  { key: 'returnedQty', title: '已退数量', width: 100, align: 'center' },
  { key: 'requestTime', title: '申请时间', width: 160, align: 'center' },
  { key: 'issueTime', title: '领料时间', width: 160, align: 'center' },
  { key: 'planReturnTime', title: '计划退料时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

export default {
  ISSUANCE_STATUS_MAP,
  ISSUANCE_TYPE_MAP,
  ISSUANCE_METHOD_MAP,
  ISSUANCE_COLUMNS,
};