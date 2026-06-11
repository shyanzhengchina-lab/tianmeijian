/**
 * 生产工单模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 工单状态
 */
export type WorkOrderStatus =
  | 'DRAFT'          // 草稿
  | 'CREATED'        // 已创建
  | 'RELEASED'       // 已下发
  | 'IN_PROGRESS'     // 执行中
  | 'PAUSED'          // 已暂停
  | 'COMPLETED'       // 已完成
  | 'CANCELLED';      // 已取消

/**
 * 工单优先级
 */
export type WorkOrderPriority =
  | 'URGENT'         // 紧急
  | 'HIGH'           // 高
  | 'NORMAL'          // 普通
  | 'LOW';           // 低

/**
 * 工单类型
 */
export type WorkOrderType =
  | 'STANDARD'        // 标准工单
  | 'RUSH'           // 抢工单
  | 'EXCEPTION'        // 异常工单
  | 'MAINTENANCE';    // 维护工单

/**
 * 工单接口
 */
export interface WorkOrder {
  id: string;
  woNo: string; // 工单编号
  productName: string; // 产品名称
  productCode: string; // 产品编码
  productSpec: string; // 产品规格
  quantity: number; // 数量
  unit: string; // 单位
  status: WorkOrderStatus; // 状态
  priority: WorkOrderPriority; // 优先级
  type: WorkOrderType; // 类型

  // 计划信息
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间

  // 实际信息
  actualStartTime: string | null; // 实际开始时间
  actualEndTime: string | null; // 实际结束时间

  // 执行信息
  workCenter: string; // 工作中心
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  teamId: string; // 班组ID
  teamName: string; // 班组姓名

  // 进度信息
  progress: number; // 进度百分比
  completedQty: number; // 已完成数量
  totalQty: number; // 总数量

  // BOM信息
  bomId: string; // BOM ID
  bomVersion: string; // BOM版本

  // 备注
  remark: string; // 备注

  // 审核信息
  auditorId: string | null; // 审核员ID
  auditorName: string | null; // 审核员姓名
  auditTime: string | null; // 审核时间
  auditRemark: string | null; // 审核备注

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  creatorId: string; // 创建人ID
  creatorName: string; // 创建人姓名
  factoryId: string; // 工厂ID
}

/**
 * 任务单接口
 */
export interface TaskOrder {
  id: string;
  taskNo: string; // 任务单编号
  woId: string; // 工单ID
  woNo: string; // 工单编号

  // 任务信息
  operationId: string; // 工序ID
  operationName: string; // 工序名称
  workCenter: string; // 工作中心
  workstationId: string; // 工位ID

  // 计划信息
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间
  planQty: number; // 计划数量

  // 执行信息
  actualStartTime: string | null; // 实际开始时间
  actualEndTime: string | null; // 实际结束时间
  actualQty: number; // 实际完成数量

  // 操作员信息
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名

  // 状态信息
  status: WorkOrderStatus; // 状态
  progress: number; // 进度百分比

  // 质检信息
  isQcRequired: boolean; // 是否需要质检
  qcPassed: boolean; // 是否质检通过
  qcResult: string | null; // 质检结果
  qcTime: string | null; // 质检时间

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  factoryId: string; // 工厂ID
}

/**
 * 工单查询参数
 */
export interface WorkOrderQuery extends PageQuery {
  woNo?: string; // 工单编号
  productName?: string; // 产品名称
  status?: WorkOrderStatus; // 状态
  priority?: WorkOrderPriority; // 优先级
  type?: WorkOrderType; // 类型
  workCenter?: string; // 工作中心
  operatorId?: string; // 操作员
  teamId?: string; // 班组
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  bomId?: string; // BOM ID
}

/**
 * 创建工单DTO
 */
export interface CreateWorkOrderDTO {
  productName: string; // 产品名称
  productCode: string; // 产品编码
  productSpec?: string; // 产品规格
  quantity: number; // 数量
  unit: string; // 单位
  priority: WorkOrderPriority; // 优先级
  type: WorkOrderType; // 类型
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间
  workCenter?: string; // 工作中心
  operatorId?: string; // 操作员
  teamId?: string; // 班组
  bomId?: string; // BOM ID
  remark?: string; // 备注
}

/**
 * 更新工单DTO
 */
export interface UpdateWorkOrderDTO extends Partial<CreateWorkOrderDTO> {
  id: string; // 工单ID
  status?: WorkOrderStatus; // 状态更新
  actualStartTime?: string; // 实际开始时间
  actualEndTime?: string; // 实际结束时间
}

/**
 * 工单状态映射
 */
export const WORK_ORDER_STATUS_MAP: Record<WorkOrderStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  CREATED: { label: '已创建', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  RELEASED: { label: '已下发', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  IN_PROGRESS: { label: '执行中', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  PAUSED: { label: '已暂停', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  CANCELLED: { label: '已取消', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 工单优先级映射
 */
export const WORK_ORDER_PRIORITY_MAP: Record<WorkOrderPriority, { label: string; color: string; icon: string }> = {
  URGENT: { label: '紧急', color: '#ff4d4f', icon: '🔴' },
  HIGH: { label: '高', color: '#faad14', icon: '🟠' },
  NORMAL: { label: '普通', color: '#1890ff', icon: '🟢' },
  LOW: { label: '低', color: '#8c8c8c', icon: '⚪' },
};

/**
 * 工单类型映射
 */
export const WORK_ORDER_TYPE_MAP: Record<WorkOrderType, { label: string; icon: string; color: string }> = {
  STANDARD: { label: '标准工单', icon: '📋', color: 'blue' },
  RUSH: { label: '抢工单', icon: '⚡', color: 'red' },
  EXCEPTION: { label: '异常工单', icon: '⚠️', color: 'orange' },
  MAINTENANCE: { label: '维护工单', icon: '🔧', color: 'purple' },
};

/**
 * 工单表格列配置
 */
export const WORK_ORDER_COLUMNS = [
  { key: 'woNo', title: '工单编号', width: 150, align: 'center', fixed: 'left' },
  { key: 'productName', title: '产品名称', width: 200, align: 'center' },
  { key: 'productCode', title: '产品编码', width: 150, align: 'center' },
  { key: 'quantity', title: '数量', width: 100, align: 'center' },
  { key: 'unit', title: '单位', width: 80, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'priority', title: '优先级', width: 100, align: 'center' },
  { key: 'type', title: '类型', width: 100, align: 'center' },
  { key: 'workCenter', title: '工作中心', width: 120, align: 'center' },
  { key: 'operatorName', title: '操作员', width: 120, align: 'center' },
  { key: 'planStartTime', title: '计划开始', width: 160, align: 'center' },
  { key: 'planEndTime', title: '计划结束', width: 160, align: 'center' },
  { key: 'progress', title: '进度', width: 120, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * 任务单表格列配置
 */
export const TASK_ORDER_COLUMNS = [
  { key: 'taskNo', title: '任务单编号', width: 150, align: 'center', fixed: 'left' },
  { key: 'woNo', title: '工单编号', width: 150, align: 'center' },
  { key: 'operationName', title: '工序名称', width: 150, align: 'center' },
  { key: 'workCenter', title: '工作中心', width: 120, align: 'center' },
  { key: 'planStartTime', title: '计划开始', width: 160, align: 'center' },
  { key: 'planEndTime', title: '计划结束', width: 160, align: 'center' },
  { key: 'planQty', title: '计划数量', width: 100, align: 'center' },
  { key: 'actualQty', title: '实际完成', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'progress', title: '进度', width: 120, align: 'center' },
  { key: 'operatorName', title: '操作员', width: 120, align: 'center' },
  { key: 'isQcRequired', title: '需要质检', width: 100, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * 工单统计信息
 */
export interface WorkOrderStatistics {
  totalCount: number; // 总工单数
  draftCount: number; // 草稿工单数
  createdCount: number; // 已创建工单数
  releasedCount: number; // 已下发工单数
  inProgressCount: number; // 执行中工单数
  completedCount: number; // 已完成工单数
  cancelledCount: number; // 已取消工单数

  // 生产效率
  onTimeDeliveryRate: number; // 按时交付率
  avgCycleTime: number; // 平均周期时间
  totalQuantity: number; // 总生产数量
  completedQuantity: number; // 完成数量
}

export default {
  WORK_ORDER_STATUS_MAP,
  WORK_ORDER_PRIORITY_MAP,
  WORK_ORDER_TYPE_MAP,
  WORK_ORDER_COLUMNS,
  TASK_ORDER_COLUMNS,
};