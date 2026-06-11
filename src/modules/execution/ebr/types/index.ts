/**
 * 电子批记录模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 批记录状态
 */
export type EBRStatus =
  | 'PENDING'        // 待执行
  | 'IN_PROGRESS'    // 执行中
  | 'PAUSED'         // 暂停
  | 'COMPLETED'      // 已完成
  | 'CANCELLED';     // 已取消

/**
 * 步骤状态
 */
export type StepStatus =
  | 'PENDING'        // 待执行
  | 'IN_PROGRESS'    // 执行中
  | 'COMPLETED'      // 已完成
  | 'SKIPPED';       // 已跳过

/**
 * 数据类型
 */
export type DataType =
  | 'PARAMETER'      // 参数
  | 'MEASUREMENT'    // 测量值
  | 'CHECK'          // 检查项
  | 'RECORD'         // 记录值
  | 'CALCULATION';   // 计算值

/**
 * 电子批记录接口
 */
export interface EBRRecord {
  id: string;
  ebrNo: string; // 批记录编号
  status: EBRStatus; // 状态

  // 关联信息
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单编号
  batchNo: string; // 批号
  productId: string; // 产品ID
  productCode: string; // 产品编码
  productName: string; // 产品名称
  recipeId: string; // 配方ID
  recipeName: string; // 配方名称

  // 时间信息
  startTime: string | null; // 开始时间
  endTime: string | null; // 结束时间
  duration: number | null; // 执行时长(秒)

  // 人员信息
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  supervisorId: string; // 主管ID
  supervisorName: string; // 主管姓名

  // 步骤信息
  totalSteps: number; // 总步骤数
  completedSteps: number; // 已完成步骤数
  currentStepId: string | null; // 当前步骤ID
  currentStepName: string | null; // 当前步骤名称

  // 质量信息
  qcStatus: 'PENDING' | 'PASSED' | 'FAILED'; // 质检状态
  abnormalCount: number; // 异常次数

  // 备注
  remark: string | null;

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  factoryId: string; // 工厂ID
}

/**
 * 步骤接口
 */
export interface EBRStep {
  id: string;
  ebrId: string; // 批记录ID
  stepNo: string; // 步骤编号
  stepName: string; // 步骤名称
  stepType: 'NORMAL' | 'CRITICAL' | 'QUALITY'; // 步骤类型
  status: StepStatus; // 状态

  // 执行信息
  sequence: number; // 序号
  estimatedTime: number; // 预估时间(秒)
  actualTime: number | null; // 实际时间(秒)
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名

  // 条件信息
  prerequisites: string[]; // 前置步骤ID列表
  conditions: Array<{
    type: 'TIME' | 'PARAMETER' | 'EQUIPMENT' | 'MATERIAL';
    expression: string;
    passed: boolean;
  }>;

  // 数据记录
  dataRecords: Array<{
    id: string;
    dataType: DataType;
    dataName: string;
    dataCode: string;
    value: string | number | null;
    unit: string | null;
    min: number | null;
    max: number | null;
    target: number | null;
    isAbnormal: boolean;
    remark: string | null;
  }>;

  // 设备信息
  equipmentRecords: Array<{
    id: string;
    equipmentId: string;
    equipmentName: string;
    startTime: string;
    endTime: string | null;
    duration: number;
  }>;

  // 物料信息
  materialRecords: Array<{
    id: string;
    materialId: string;
    materialName: string;
    batchNo: string;
    requestedQty: number;
    usedQty: number;
    balanceQty: number;
  }>;

  // 审批信息
  requireApproval: boolean; // 是否需要审批
  approverId: string | null; // 审批人ID
  approverName: string | null; // 审批人姓名
  approvalTime: string | null; // 审批时间

  // 备注
  remark: string | null;

  // 系统信息
  createTime: string;
  updateTime: string;
}

/**
 * 设备使用记录接口
 */
export interface EquipmentUsage {
  id: string;
  ebrId: string; // 批记录ID
  stepId: string; // 步骤ID
  equipmentId: string; // 设备ID
  equipmentName: string; // 设备名称
  equipmentCode: string; // 设备编码

  // 使用信息
  usageType: 'PRODUCTION' | 'QUALITY' | 'MAINTENANCE'; // 使用类型
  startTime: string; // 开始时间
  endTime: string | null; // 结束时间
  duration: number; // 使用时长(秒)

  // 运行参数
  runParameters: Array<{
    paramName: string;
    paramCode: string;
    value: string;
    unit: string;
  }>;

  // 状态信息
  status: 'NORMAL' | 'ABNORMAL' | 'MAINTENANCE'; // 状态
  abnormalCount: number; // 异常次数

  // 操作信息
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名

  // 备注
  remark: string | null;

  // 系统信息
  createTime: string;
  updateTime: string;
}

/**
 * 物料平衡记录接口
 */
export interface MaterialBalance {
  id: string;
  ebrId: string; // 批记录ID
  materialId: string; // 物料ID
  materialName: string; // 物料名称
  materialCode: string; // 物料编码
  batchNo: string; // 批号

  // 标准用量
  standardQty: number; // 标准用量
  standardUnit: string; // 标准单位

  // 投料记录
  feedingRecords: Array<{
    recordId: string;
    stepId: string;
    stepName: string;
    feedingQty: number;
    feedingTime: string;
  }>;

  // 倒冲记录
  backflushRecords: Array<{
    recordId: string;
    stepId: string;
    stepName: string;
    backflushedQty: number;
    backflushTime: string;
  }>;

  // 实际用量
  actualQty: number; // 实际用量
  actualUnit: string; // 实际单位

  // 差异分析
  variance: number; // 差异
  varianceRate: number; // 差异率(%)
  varianceReason: string | null; // 差异原因

  // 平衡状态
  balanceStatus: 'BALANCED' | 'OVER' | 'SHORT'; // 平衡状态

  // 备注
  remark: string | null;

  // 系统信息
  createTime: string;
  updateTime: string;
}

/**
 * 电子批记录查询参数
 */
export interface EBRQuery extends PageQuery {
  ebrNo?: string; // 批记录编号
  status?: EBRStatus; // 状态
  workOrderNo?: string; // 工单编号
  batchNo?: string; // 批号
  productId?: string; // 产品ID
  productCode?: string; // 产品编码
  operatorId?: string; // 操作员ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建EBR记录DTO
 */
export interface CreateEBRDTO {
  workOrderId: string; // 工单ID
  recipeId: string; // 配方ID
  operatorId: string; // 操作员ID
  supervisorId: string; // 主管ID
  remark?: string; // 备注
}

/**
 * 更新EBR记录DTO
 */
export interface UpdateEBRDTO extends Partial<CreateEBRDTO> {
  id: string; // EBR记录ID
}

/**
 * 步骤操作DTO
 */
export interface StepOperationDTO {
  action: 'START' | 'COMPLETE' | 'PAUSE' | 'SKIP' | 'APPROVE'; // 操作类型
  ebrId: string; // EBR记录ID
  stepId: string; // 步骤ID
  operatorId: string; // 操作员ID
  operatorName?: string; // 操作员姓名
  dataRecords?: Array<{
    recordId: string;
    value: string | number;
    remark?: string;
  }>;
  remark?: string; // 备注
}

/**
 * 数据记录DTO
 */
export interface DataRecordDTO {
  recordId: string; // 记录ID
  dataType: DataType; // 数据类型
  dataName: string; // 数据名称
  dataCode: string; // 数据编码
  value: string | number; // 值
  unit: string | null; // 单位
  min: number | null; // 最小值
  max: number | null; // 最大值
  target: number | null; // 目标值
  isAbnormal: boolean; // 是否异常
  remark: string | null; // 备注
}

/**
 * 设备使用DTO
 */
export interface EquipmentUsageDTO {
  equipmentId: string; // 设备ID
  usageType: 'PRODUCTION' | 'QUALITY' | 'MAINTENANCE'; // 使用类型
  startTime: string; // 开始时间
  endTime: string | null; // 结束时间
  runParameters: Array<{
    paramName: string;
    paramCode: string;
    value: string;
    unit: string;
  }>;
  operatorId: string; // 操作员ID
  remark?: string; // 备注
}

/**
 * 批记录状态映射
 */
export const EBR_STATUS_MAP: Record<EBRStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: '待执行', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  IN_PROGRESS: { label: '执行中', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  PAUSED: { label: '暂停', color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  CANCELLED: { label: '已取消', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 步骤状态映射
 */
export const STEP_STATUS_MAP: Record<StepStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: '待执行', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  IN_PROGRESS: { label: '执行中', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  SKIPPED: { label: '已跳过', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 数据类型映射
 */
export const DATA_TYPE_MAP: Record<DataType, { label: string; icon: string }> = {
  PARAMETER: { label: '参数', icon: '🔧' },
  MEASUREMENT: { label: '测量值', icon: '📏' },
  CHECK: { label: '检查项', icon: '✅' },
  RECORD: { label: '记录值', icon: '📝' },
  CALCULATION: { label: '计算值', icon: '🧮' },
};

/**
 * EBR表格列配置
 */
export const EBR_COLUMNS = [
  { key: 'ebrNo', title: '批记录编号', width: 150, align: 'center', fixed: 'left' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'workOrderNo', title: '工单编号', width: 150, align: 'center' },
  { key: 'batchNo', title: '批号', width: 150, align: 'center' },
  { key: 'productName', title: '产品名称', width: 150, align: 'center' },
  { key: 'recipeName', title: '配方名称', width: 150, align: 'center' },
  { key: 'operatorName', title: '操作员', width: 120, align: 'center' },
  { key: 'supervisorName', title: '主管', width: 120, align: 'center' },
  { key: 'totalSteps', title: '总步骤', width: 80, align: 'center' },
  { key: 'completedSteps', title: '已完成', width: 80, align: 'center' },
  { key: 'progress', title: '进度', width: 120, align: 'center' },
  { key: 'qcStatus', title: '质检状态', width: 100, align: 'center' },
  { key: 'startTime', title: '开始时间', width: 160, align: 'center' },
  { key: 'endTime', title: '结束时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 320, align: 'center', fixed: 'right' },
];

/**
 * 设备使用表格列配置
 */
export const EQUIPMENT_USAGE_COLUMNS = [
  { key: 'equipmentName', title: '设备名称', width: 150, align: 'center' },
  { key: 'equipmentCode', title: '设备编码', width: 150, align: 'center' },
  { key: 'usageType', title: '使用类型', width: 120, align: 'center' },
  { key: 'startTime', title: '开始时间', width: 160, align: 'center' },
  { key: 'endTime', title: '结束时间', width: 160, align: 'center' },
  { key: 'duration', title: '使用时长', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'abnormalCount', title: '异常次数', width: 100, align: 'center' },
  { key: 'operatorName', title: '操作员', width: 120, align: 'center' },
  { key: 'action', title: '操作', width: 200, align: 'center', fixed: 'right' },
];

/**
 * 物料平衡表格列配置
 */
export const MATERIAL_BALANCE_COLUMNS = [
  { key: 'materialName', title: '物料名称', width: 150, align: 'center' },
  { key: 'materialCode', title: '物料编码', width: 150, align: 'center' },
  { key: 'batchNo', title: '批号', width: 150, align: 'center' },
  { key: 'standardQty', title: '标准用量', width: 120, align: 'center' },
  { key: 'actualQty', title: '实际用量', width: 120, align: 'center' },
  { key: 'variance', title: '差异', width: 100, align: 'center' },
  { key: 'varianceRate', title: '差异率', width: 100, align: 'center' },
  { key: 'balanceStatus', title: '平衡状态', width: 120, align: 'center' },
  { key: 'varianceReason', title: '差异原因', width: 200, align: 'center' },
  { key: 'action', title: '操作', width: 200, align: 'center', fixed: 'right' },
];

export default {
  EBR_STATUS_MAP,
  STEP_STATUS_MAP,
  DATA_TYPE_MAP,
  EBR_COLUMNS,
  EQUIPMENT_USAGE_COLUMNS,
  MATERIAL_BALANCE_COLUMNS,
};