/**
 * 生产任务单模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 任务单状态
 */
export type TaskOrderStatus =
  | 'CREATED'        // 已创建
  | 'ASSIGNED'       // 已分配
  | 'IN_PROGRESS'     // 执行中
  | 'SUSPENDED'       // 已暂停
  | 'COMPLETED'       // 已完成
  | 'CANCELLED';      // 已取消

/**
 * 任务单类型
 */
export type TaskOrderType =
  | 'NORMAL'          // 正常任务
  | 'URGENT'          // 紧急任务
  | 'RETURN'          // 返工任务
  | 'MAINTENANCE';    // 维护任务

/**
 * 优先级
 */
export type TaskPriority =
  | 'HIGH'            // 高优先级
  | 'MEDIUM'          // 中优先级
  | 'LOW';            // 低优先级

/**
 * 生产任务单接口
 */
export interface TaskOrder {
  id: string;
  taskNo: string; // 任务单号
  taskType: TaskOrderType; // 任务类型
  status: TaskOrderStatus; // 任务状态
  priority: TaskPriority; // 优先级

  // 工单关联
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单编号

  // 产品信息
  productId: string; // 产品ID
  productCode: string; // 产品编码
  productName: string; // 产品名称
  productSpec: string; // 产品规格
  batchNo: string; // 批号

  // 工序信息
  operationId: string; // 工序ID
  operationCode: string; // 工序代码
  operationName: string; // 工序名称
  operationType: string; // 工序类型

  // 数量信息
  planQty: number; // 计划数量
  completedQty: number; // 完成数量
  remainingQty: number; // 剩余数量
  qualifiedQty: number; // 合格数量
  unqualifiedQty: number; // 不合格数量
  progress: number; // 进度百分比

  // 时间信息
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间
  actualStartTime: string | null; // 实际开始时间
  actualEndTime: string | null; // 实际结束时间

  // 人员信息
  assigneeId: string; // 分配人ID
  assigneeName: string; // 分配人姓名
  assigneeDept: string; // 分配人部门

  // 设备信息
  equipmentId: string; // 设备ID
  equipmentCode: string; // 设备编码
  equipmentName: string; // 设备名称

  // 工位信息
  workstationId: string; // 工位ID
  workstationCode: string; // 工位编码
  workstationName: string; // 工位名称

  // 质量要求
  qualityRequirement: {
    inspectionRequired: boolean; // 是否需要检验
    inspectionType: string; // 检验类型
    acceptanceCriteria: string; // 接收标准
  };

  // 技术参数
  technicalParams: Array<{
    paramName: string; // 参数名称
    paramValue: string; // 参数值
    tolerance: string; // 公差范围
    unit: string; // 单位
  }>;

  // 物料需求
  materialRequirements: Array<{
    materialId: string; // 物料ID
    materialCode: string; // 物料编码
    materialName: string; // 物料名称
    requiredQty: number; // 需求数量
    allocatedQty: number; // 已分配数量
    unit: string; // 单位
  }>;

  // 执行记录
  executionRecords: Array<{
    recordId: string; // 记录ID
    operationId: string; // 工序ID
    operatorId: string; // 操作员ID
    operatorName: string; // 操作员姓名
    startTime: string; // 开始时间
    endTime: string | null; // 结束时间
    qty: number; // 完成数量
    qualifiedQty: number; // 合格数量
    unqualifiedQty: number; // 不合格数量
    result: 'PASS' | 'FAIL' | 'REWORK'; // 结果
    remark?: string; // 备注
  }>;

  // 异常信息
  hasException: boolean; // 是否有异常
  exceptions: Array<{
    exceptionId: string; // 异常ID
    exceptionType: string; // 异常类型
    description: string; // 异常描述
    severity: 'HIGH' | 'MEDIUM' | 'LOW'; // 严重程度
    status: 'PENDING' | 'PROCESSING' | 'RESOLVED'; // 处理状态
    reportTime: string; // 报告时间
    reporter: string; // 报告人
  }>;

  // 附件信息
  attachments: Array<{
    attachmentId: string; // 附件ID
    fileName: string; // 文件名称
    fileType: string; // 文件类型
    fileSize: number; // 文件大小
    uploadTime: string; // 上传时间
    uploader: string; // 上传人
  }>;

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  creatorId: string; // 创建人ID
  creatorName: string; // 创建人姓名
  factoryId: string; // 工厂ID
  remark: string | null; // 备注
}

/**
 * 生产任务单查询参数
 */
export interface TaskOrderQuery extends PageQuery {
  taskNo?: string; // 任务单号
  taskType?: TaskOrderType; // 任务类型
  status?: TaskOrderStatus; // 状态
  priority?: TaskPriority; // 优先级
  workOrderNo?: string; // 工单编号
  productCode?: string; // 产品编码
  productName?: string; // 产品名称
  batchNo?: string; // 批号
  operationId?: string; // 工序ID
  assigneeId?: string; // 分配人ID
  equipmentId?: string; // 设备ID
  workstationId?: string; // 工位ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建生产任务单DTO
 */
export interface CreateTaskOrderDTO {
  workOrderId: string; // 工单ID
  productId: string; // 产品ID
  batchNo: string; // 批号
  operationId: string; // 工序ID
  planQty: number; // 计划数量
  taskType: TaskOrderType; // 任务类型
  priority: TaskPriority; // 优先级
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间
  assigneeId: string; // 分配人ID
  equipmentId: string; // 设备ID
  workstationId: string; // 工位ID
  technicalParams?: Array<{ paramName: string; paramValue: string; tolerance: string; unit: string }>;
  qualityRequirement?: {
    inspectionRequired: boolean;
    inspectionType: string;
    acceptanceCriteria: string;
  };
  remark?: string; // 备注
}

/**
 * 更新生产任务单DTO
 */
export interface UpdateTaskOrderDTO extends Partial<CreateTaskOrderDTO> {
  id: string; // 任务单ID
}

/**
 * 任务单操作DTO
 */
export interface TaskOrderOperationDTO {
  action: 'START' | 'COMPLETE' | 'SUSPEND' | 'RESUME' | 'CANCEL'; // 操作类型
  taskId: string; // 任务单ID
  id?: string; // alias for taskId
  operatorId: string; // 操作员ID
  qty: number; // 完成数量
  qualifiedQty: number; // 合格数量
  unqualifiedQty: number; // 不合格数量
  remark?: string; // 备注
  // Extended fields used in store
  completedQuantity?: number;
  qualifiedQuantity?: number;
  unqualifiedQuantity?: number;
  scrapQuantity?: number;
}

/**
 * 任务单分配DTO
 */
export interface AssignTaskOrderDTO {
  taskId: string; // 任务单ID
  id?: string; // alias for taskId
  assigneeId: string; // 新分配人ID
  assignedTo?: string; // alias for assigneeId
  assigneeDept: string; // 新分配部门
  workcenterId?: string;
  teamId?: string;
  equipmentId?: string;
  remark?: string; // 备注
}

/**
 * 任务单调整DTO
 */
export interface AdjustTaskOrderDTO {
  taskId: string; // 任务单ID
  planQty?: number; // 调整后计划数量
  planStartTime?: string; // 调整后计划开始时间
  planEndTime?: string; // 调整后计划结束时间
  priority?: TaskPriority; // 调整后优先级
  equipmentId?: string; // 调整后设备ID
  workstationId?: string; // 调整后工位ID
  reason: string; // 调整原因
}

/**
 * 报告异常DTO
 */
export interface ReportExceptionDTO {
  taskId: string; // 任务单ID
  id?: string; // alias for taskId
  exceptionType: string; // 异常类型
  description: string; // 异常描述
  exceptionDetails?: string; // alias for description
  severity: 'HIGH' | 'MEDIUM' | 'LOW'; // 严重程度
  attachments?: string[]; // 附件ID列表
}

/**
 * 上传附件DTO
 */
export interface UploadAttachmentDTO {
  taskId: string; // 任务单ID
  fileName: string; // 文件名称
  fileType: string; // 文件类型
  fileSize: number; // 文件大小
  fileData: string; // 文件数据（Base64）
}

/**
 * 生产任务单状态映射
 */
export const TASK_ORDER_STATUS_MAP: Record<TaskOrderStatus, { label: string; color: string; bg: string; border: string }> = {
  CREATED: { label: '已创建', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  ASSIGNED: { label: '已分配', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  IN_PROGRESS: { label: '执行中', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  SUSPENDED: { label: '已暂停', color: '#ff7a45', bg: '#fff7e6', border: '#ffd591' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  CANCELLED: { label: '已取消', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 任务单类型映射
 */
export const TASK_ORDER_TYPE_MAP: Record<TaskOrderType, { label: string; color: string; icon: string }> = {
  NORMAL: { label: '正常任务', color: '#1890ff', icon: '📋' },
  URGENT: { label: '紧急任务', color: '#ff4d4f', icon: '🔥' },
  RETURN: { label: '返工任务', color: '#faad14', icon: '🔄' },
  MAINTENANCE: { label: '维护任务', color: '#722ed1', icon: '🔧' },
};

/**
 * 优先级映射
 */
export const TASK_PRIORITY_MAP: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  HIGH: { label: '高', color: '#ff4d4f', icon: '⭐' },
  MEDIUM: { label: '中', color: '#faad14', icon: '⭐⭐' },
  LOW: { label: '低', color: '#52c41a', icon: '⭐⭐⭐' },
};

/**
 * 生产任务单表格列配置
 */
export const TASK_ORDER_COLUMNS = [
  { key: 'taskNo', title: '任务单号', width: 150, align: 'center', fixed: 'left' },
  { key: 'taskType', title: '任务类型', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'priority', title: '优先级', width: 80, align: 'center' },
  { key: 'workOrderNo', title: '工单编号', width: 150, align: 'center' },
  { key: 'productCode', title: '产品编码', width: 120, align: 'center' },
  { key: 'productName', title: '产品名称', width: 200, align: 'center' },
  { key: 'batchNo', title: '批号', width: 120, align: 'center' },
  { key: 'operationName', title: '工序名称', width: 150, align: 'center' },
  { key: 'planQty', title: '计划数量', width: 100, align: 'center' },
  { key: 'completedQty', title: '完成数量', width: 100, align: 'center' },
  { key: 'qualifiedQty', title: '合格数量', width: 100, align: 'center' },
  { key: 'progress', title: '进度', width: 120, align: 'center' },
  { key: 'planStartTime', title: '计划开始时间', width: 160, align: 'center' },
  { key: 'planEndTime', title: '计划结束时间', width: 160, align: 'center' },
  { key: 'assigneeName', title: '分配人', width: 120, align: 'center' },
  { key: 'equipmentName', title: '设备', width: 120, align: 'center' },
  { key: 'actualStartTime', title: '实际开始时间', width: 160, align: 'center' },
  { key: 'actualEndTime', title: '实际结束时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

export default {
  TASK_ORDER_STATUS_MAP,
  TASK_ORDER_TYPE_MAP,
  TASK_PRIORITY_MAP,
  TASK_ORDER_COLUMNS,
};