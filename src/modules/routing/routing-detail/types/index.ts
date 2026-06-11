/**
 * 工艺路线明细模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 明细状态
 */
export type DetailStatus =
  | 'DRAFT'          // 草稿
  | 'ACTIVE'        // 生效
  | 'INACTIVE';     // 停用

/**
 * 工序类型
 */
export type OperationType =
  | 'NORMAL'        // 普通工序
  | 'CRITICAL'      // 关键工序
  | 'QUALITY'       // 质检工序
  | 'INSPECTION';   // 检验工序

/**
 * 控制类型
 */
export type ControlType =
  | 'MANUAL'        // 手工控制
  | 'AUTO'          // 自动控制
  | 'SEMI_AUTO';    // 半自动控制

/**
 * 工艺路线明细接口
 */
export interface RoutingDetail {
  id: string;
  detailNo: string; // 明细编号
  status: DetailStatus; // 状态

  // 关联信息
  routingId: string; // 工艺路线ID
  routingNo: string; // 工艺路线编号
  routingName: string; // 工艺路线名称

  // 工序信息
  operationId: string; // 工序ID
  operationCode: string; // 工序编码
  operationName: string; // 工序名称
  operationType: OperationType; // 工序类型
  operationDesc: string | null; // 工序描述

  // 顺序信息
  sequence: number; // 序号
  sequenceNo: string; // 顺序编号
  nextSequenceNo: string | null; // 下一顺序编号

  // 控制信息
  controlType: ControlType; // 控制类型
  isParallel: boolean; // 是否并行工序
  parentSequenceNo: string | null; // 父顺序编号(并行工序)

  // 时间信息
  standardTime: number; // 标准工时(分钟)
  minTime: number; // 最小工时(分钟)
  maxTime: number; // 最大工时(分钟)
  waitTime: number; // 等待时间(分钟)

  // 设备信息
  equipmentId: string | null; // 设备ID
  equipmentName: string | null; // 设备名称
  equipmentCode: string | null; // 设备编码
  workCenterId: string | null; // 工作中心ID
  workCenterName: string | null; // 工作中心名称

  // 人员信息
  teamId: string | null; // 班组ID
  teamName: string | null; // 班组名称
  minWorkers: number; // 最少人数
  maxWorkers: number; // 最多人数
  skillLevel: string | null; // 技能等级

  // 质量信息
  qcSchemeId: string | null; // 质检方案ID
  qcSchemeName: string | null; // 质检方案名称
  inspectionPoints: number; // 检验点数量

  // 成本信息
  estimatedCost: number; // 预估成本
  actualCost: number | null; // 实际成本

  // 前置条件
  prerequisites: Array<{
    type: 'MATERIAL' | 'EQUIPMENT' | 'QUALITY' | 'DOCUMENT';
    reference: string; // 参考ID
    description: string; // 描述
  }>;

  // 输出信息
  outputs: Array<{
    type: 'PRODUCT' | 'BYPRODUCT' | 'WASTE';
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
  }>;

  // 描述信息
  description: string | null; // 描述
  remark: string | null; // 备注

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  factoryId: string; // 工厂ID
  creatorId: string; // 创建人ID
  creatorName: string; // 创建人姓名
  updaterId: string | null; // 更新人ID
  updaterName: string | null; // 更新人姓名
}

/**
 * 工艺路线明细查询参数
 */
export interface RoutingDetailQuery extends PageQuery {
  detailNo?: string; // 明细编号
  status?: DetailStatus; // 状态
  routingId?: string; // 工艺路线ID
  routingNo?: string; // 工艺路线编号
  operationId?: string; // 工序ID
  operationCode?: string; // 工序编码
  operationName?: string; // 工序名称
  operationType?: OperationType; // 工序类型
  controlType?: ControlType; // 控制类型
  equipmentId?: string; // 设备ID
  workCenterId?: string; // 工作中心ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建工艺路线明细DTO
 */
export interface CreateRoutingDetailDTO {
  routingId: string; // 工艺路线ID
  operationId: string; // 工序ID
  operationType: OperationType; // 工序类型
  sequence: number; // 序号
  controlType: ControlType; // 控制类型
  isParallel: boolean; // 是否并行工序
  parentSequenceNo?: string; // 父顺序编号
  standardTime: number; // 标准工时
  minTime: number; // 最小工时
  maxTime: number; // 最大工时
  waitTime: number; // 等待时间
  equipmentId?: string; // 设备ID
  workCenterId?: string; // 工作中心ID
  teamId?: string; // 班组ID
  minWorkers: number; // 最少人数
  maxWorkers: number; // 最多人数
  skillLevel?: string; // 技能等级
  qcSchemeId?: string; // 质检方案ID
  estimatedCost: number; // 预估成本
  description?: string; // 描述
  remark?: string; // 备注
}

/**
 * 更新工艺路线明细DTO
 */
export interface UpdateRoutingDetailDTO extends Partial<CreateRoutingDetailDTO> {
  id: string; // 工艺路线明细ID
}

/**
 * 调整工序顺序DTO
 */
export interface AdjustSequenceDTO {
  detailIds: string[]; // 明细ID列表(按新顺序)
}

/**
 * 工艺路线明细状态映射
 */
export const DETAIL_STATUS_MAP: Record<DetailStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: '草稿', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  ACTIVE: { label: '生效', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  INACTIVE: { label: '停用', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 工序类型映射
 */
export const OPERATION_TYPE_MAP: Record<OperationType, { label: string; color: string; icon: string }> = {
  NORMAL: { label: '普通工序', color: '#1890ff', icon: '⚙️' },
  CRITICAL: { label: '关键工序', color: '#ff4d4f', icon: '🔑' },
  QUALITY: { label: '质检工序', color: '#faad14', icon: '✅' },
  INSPECTION: { label: '检验工序', color: '#722ed1', icon: '🔍' },
};

/**
 * 控制类型映射
 */
export const CONTROL_TYPE_MAP: Record<ControlType, { label: string; color: string; icon: string }> = {
  MANUAL: { label: '手工控制', color: '#1890ff', icon: '👤' },
  AUTO: { label: '自动控制', color: '#52c41a', icon: '🤖' },
  SEMI_AUTO: { label: '半自动控制', color: '#faad14', icon: '🎮' },
};

/**
 * 工艺路线明细表格列配置
 */
export const ROUTING_DETAIL_COLUMNS = [
  { key: 'detailNo', title: '明细编号', width: 150, align: 'center', fixed: 'left' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'routingNo', title: '路线编号', width: 150, align: 'center' },
  { key: 'sequence', title: '序号', width: 80, align: 'center' },
  { key: 'sequenceNo', title: '顺序编号', width: 150, align: 'center' },
  { key: 'operationCode', title: '工序编码', width: 150, align: 'center' },
  { key: 'operationName', title: '工序名称', width: 200, align: 'center' },
  { key: 'operationType', title: '工序类型', width: 120, align: 'center' },
  { key: 'controlType', title: '控制类型', width: 120, align: 'center' },
  { key: 'equipmentName', title: '设备名称', width: 150, align: 'center' },
  { key: 'workCenterName', title: '工作中心', width: 150, align: 'center' },
  { key: 'teamName', title: '班组', width: 120, align: 'center' },
  { key: 'standardTime', title: '标准工时', width: 100, align: 'center' },
  { key: 'minTime', title: '最小工时', width: 100, align: 'center' },
  { key: 'maxTime', title: '最大工时', width: 100, align: 'center' },
  { key: 'waitTime', title: '等待时间', width: 100, align: 'center' },
  { key: 'qcSchemeName', title: '质检方案', width: 150, align: 'center' },
  { key: 'estimatedCost', title: '预估成本', width: 120, align: 'center' },
  { key: 'creatorName', title: '创建人', width: 120, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

export default {
  DETAIL_STATUS_MAP,
  OPERATION_TYPE_MAP,
  CONTROL_TYPE_MAP,
  ROUTING_DETAIL_COLUMNS,
};