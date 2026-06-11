/**
 * 浮票管理模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../../shared/api/requestTypes';

/**
 * 浮票状态
 */
export type FloatTicketStatus =
  | 'CREATED'        // 已创建
  | 'PINTED'         // 已打印
  | 'IN_PROGRESS'    // 执行中
  | 'PASSED'         // 已过站
  | 'COMPLETED'      // 已完成
  | 'PAUSED'         // 已暂停
  | 'CANCELLED';     // 已取消

/**
 * 浮票类型
 */
export type FloatTicketType =
  | 'NORMAL'          // 正常浮票
  | 'EXCEPTION'      // 异常浮票
  | 'RETURNED';       // 返工浮票

/**
 * 浮票接口
 */
export interface FloatTicket {
  id: string;
  ticketNo: string; // 浮票编号
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单编号
  productName: string; // 产品名称
  productCode: string; // 产品编码
  productSpec: string; // 产品规格
  batchNo: string; // 批号

  // 浮票状态
  status: FloatTicketStatus;
  type: FloatTicketType;

  // 当前工序
  currentOpId: string; // 工序ID
  currentOpName: string; // 工序名称
  currentOpCode: string; // 工序代码

  // 执行信息
  workstationId: string; // 工位ID
  workstationName: string; // 工位名称
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名

  // 过站信息
  passedOps: Array<{
    opId: string;
    opName: string;
    opCode: string;
    passTime: string;
    operatorId: string;
    operatorName: string;
    qty: number; // 完成数量
    result: 'PASS' | 'FAIL' | 'REWORK';
    remark?: string; // 备注
  }>;

  // 数量（兼容字段）
  quantity?: number; // 浮票数量

  // 执行进度
  progress: number; // 进度百分比

  // 开始时间
  startTime: string;
  endTime: string | null; // 结束时间（完成或取消）

  // 打印信息
  printTime: string | null; // 打印时间
  printOperatorId: string | null; // 打印人ID
  printOperatorName: string | null; // 打印人姓名

  // 备注
  remark: string | null;

  // 返工信息
  returnOpId: string | null; // 返工工序ID
  returnOpName: string | null; // 返工工序名称
  returnOpCode: string | null; // 返工工序代码
  returnTime: string | null; // 返工时间
  returnOperatorId: string | null; // 返工人ID
  returnOperatorName: string | null; // 返工人姓名
  returnQty: number | null; // 返工数量
  returnReason: string | null; // 返工原因

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  creatorId: string; // 创建人ID
  creatorName: string; // 创建人姓名
  factoryId: string; // 工厂ID
}

/**
 * 浮票查询参数
 */
export interface FloatTicketQuery extends PageQuery {
  ticketNo?: string; // 浮票编号
  workOrderId?: string; // 工单ID
  workOrderNo?: string; // 工单编号
  productName?: string; // 产品名称
  status?: FloatTicketStatus; // 状态
  type?: FloatTicketType; // 类型
  currentOpId?: string; // 当前工序ID
  workstationId?: string; // 工位ID
  operatorId?: string; // 操作员ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  printStartDate?: string; // 打印开始日期
  printEndDate?: string; // 打印结束日期
}

/**
 * 创建浮票DTO
 */
export interface CreateFloatTicketDTO {
  workOrderId: string; // 工单ID
  batchNo: string; // 批号
  ticketType: FloatTicketType; // 浮票类型
  quantity: number; // 数量
  currentOpId: string; // 起始工序ID
  workstationId: string; // 起始工位
  operatorId?: string; // 操作员ID
  priority?: 'HIGH' | 'NORMAL' | 'LOW'; // 优先级
  remark?: string; // 备注
}

/**
 * 更新浮票DTO
 */
export interface UpdateFloatTicketDTO extends Partial<CreateFloatTicketDTO> {
  id: string; // 浮票ID
}

/**
 * 浮票操作DTO
 */
export interface FloatTicketOperationDTO {
  action: 'PASS' | 'FAIL' | 'REWORK'; // 操作类型
  ticketId: string; // 浮票ID
  opId: string; // 工序ID
  qty: number; // 完成数量
  remark?: string; // 备注
  operatorId?: string; // 操作员ID
}

/**
 * 打印浮票DTO
 */
export interface PrintFloatTicketDTO {
  tickets: string[]; // 浮票ID列表
  printer: string; // 打印机名称
  copies?: number; // 打印份数，默认1
}

/**
 * 批量打印浮票DTO
 */
export interface BatchPrintFloatTicketDTO {
  workOrderId: string; // 工单ID
  batchSize: number; // 每批打印数量
  printer: string; // 打印机名称
  tickets?: string[]; // 浮票ID列表
}

/**
 * 返工浮票DTO
 */
export interface ReturnFloatTicketDTO {
  ticketId: string; // 浮票ID
  returnOpId: string; // 返工工序ID
  returnQty: number; // 返工数量
  returnReason: string; // 返工原因
  remark?: string; // 备注
}

/**
 * 浮票状态映射
 */
export const FLOAT_TICKET_STATUS_MAP: Record<FloatTicketStatus, { label: string; color: string; bg: string; border: string }> = {
  CREATED: { label: '已创建', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  PINTED: { label: '已打印', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  IN_PROGRESS: { label: '执行中', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  PASSED: { label: '已过站', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  CANCELLED: { label: '已取消', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  PAUSED: { label: '已暂停', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 浮票类型映射
 */
export const FLOAT_TICKET_TYPE_MAP: Record<FloatTicketType, { label: string; color: string; icon: string }> = {
  NORMAL: { label: '正常浮票', color: '#1890ff', icon: '📋' },
  EXCEPTION: { label: '异常浮票', color: '#faad14', icon: '⚠️' },
  RETURNED: { label: '返工浮票', color: '#ff7a45', icon: '↩️' },
};

/**
 * 浮票表格列配置
 */
export const FLOAT_TICKET_COLUMNS = [
  { key: 'ticketNo', title: '浮票编号', width: 150, align: 'center', fixed: 'left' },
  { key: 'workOrderNo', title: '工单编号', width: 150, align: 'center' },
  { key: 'productName', title: '产品名称', width: 200, align: 'center' },
  { key: 'productCode', title: '产品编码', width: 120, align: 'center' },
  { key: 'batchNo', title: '批号', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'type', title: '类型', width: 100, align: 'center' },
  { key: 'currentOpName', title: '当前工序', width: 150, align: 'center' },
  { key: 'workstationName', title: '工位', width: 120, align: 'center' },
  { key: 'operatorName', title: '操作员', width: 120, align: 'center' },
  { key: 'progress', title: '进度', width: 120, align: 'center' },
  { key: 'startTime', title: '开始时间', width: 160, align: 'center' },
  { key: 'endTime', title: '结束时间', width: 160, align: 'center' },
  { key: 'printTime', title: '打印时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

export default {
  FLOAT_TICKET_STATUS_MAP,
  FLOAT_TICKET_TYPE_MAP,
  FLOAT_TICKET_COLUMNS,
};