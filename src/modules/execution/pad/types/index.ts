/**
 * PAD (Process Area Display) 执行界面模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 工作站状态
 */
export type WorkstationStatus =
  | 'IDLE'           // 空闲
  | 'BUSY'           // 忙碌
  | 'MAINTENANCE'    // 维护中
  | 'ERROR';         // 故障

/**
 * 任务状态
 */
export type TaskStatus =
  | 'PENDING'        // 待执行
  | 'IN_PROGRESS'     // 执行中
  | 'PAUSED'         // 已暂停
  | 'COMPLETED'      // 已完成
  | 'FAILED';        // 已失败

/**
 * 设备状态
 */
export type EquipmentStatus =
  | 'STOPPED'        // 已停止
  | 'RUNNING'        // 运行中
  | 'PAUSED'         // 已暂停
  | 'ERROR'          // 故障
  | 'MAINTENANCE';   // 维护中

/**
 * 质量检查点状态
 */
export type QualityCheckStatus =
  | 'PENDING'        // 待检查
  | 'PASSED'         // 已通过
  | 'FAILED'         // 未通过
  | 'SKIPPED';       // 已跳过

/**
 * PAD工作站接口
 */
export interface PADWorkstation {
  id: string;
  workstationNo: string; // 工作站编号
  workstationName: string; // 工作站名称
  workstationType: string; // 工作站类型
  status: WorkstationStatus; // 工作站状态

  // 人员信息
  operatorId: string | null; // 操作员ID
  operatorName: string | null; // 操作员姓名
  operatorBadge: string | null; // 操作员工号
  shiftId: string; // 班次ID
  shiftName: string; // 班次名称

  // 当前任务
  currentTask: TaskInfo | null;

  // 设备信息
  equipment: EquipmentInfo[];

  // 生产信息
  productionInfo: {
    workOrderId: string; // 工单ID
    workOrderNo: string; // 工单编号
    productId: string; // 产品ID
    productCode: string; // 产品编码
    productName: string; // 产品名称
    productSpec: string; // 产品规格
    batchNo: string; // 批号
    operationId: string; // 工序ID
    operationName: string; // 工序名称
  };

  // 统计信息
  statistics: {
    totalTasks: number; // 总任务数
    completedTasks: number; // 已完成任务数
    qualifiedQty: number; // 合格数量
    unqualifiedQty: number; // 不合格数量
    efficiency: number; // 效率百分比
  };

  // 消息通知
  notifications: Array<{
    notificationId: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;

  // 系统信息
  lastUpdateTime: string; // 最后更新时间
  factoryId: string; // 工厂ID
}

/**
 * 任务信息
 */
export interface TaskInfo {
  id: string;
  taskNo: string; // 任务编号
  taskId: string; // 任务ID
  taskType: string; // 任务类型
  status: TaskStatus; // 任务状态
  priority: string; // 优先级

  // 产品信息
  productCode: string; // 产品编码
  productName: string; // 产品名称
  productSpec: string; // 产品规格
  batchNo: string; // 批号

  // 数量信息
  planQty: number; // 计划数量
  completedQty: number; // 完成数量
  qualifiedQty: number; // 合格数量
  unqualifiedQty: number; // 不合格数量
  remainingQty: number; // 剩余数量
  progress: number; // 进度百分比

  // 时间信息
  planStartTime: string; // 计划开始时间
  planEndTime: string; // 计划结束时间
  actualStartTime: string | null; // 实际开始时间
  actualEndTime: string | null; // 实际结束时间

  // 工艺参数
  processParams: Array<{
    paramId: string; // 参数ID
    paramName: string; // 参数名称
    paramCode: string; // 参数代码
    targetValue: string; // 目标值
    tolerance: string; // 公差范围
    currentValue: string; // 当前值
    status: 'NORMAL' | 'WARNING' | 'ERROR'; // 状态
    unit: string; // 单位
  }>;

  // 质量检查点
  qualityChecks: Array<{
    checkId: string; // 检查点ID
    checkName: string; // 检查点名称
    checkType: string; // 检查类型
    checkMethod: string; // 检验方法
    acceptanceCriteria: string; // 接收标准
    status: QualityCheckStatus; // 状态
    result?: string; // 检查结果
    inspectorId: string | null; // 检验员ID
    inspectorName: string | null; // 检验员姓名
    checkTime: string | null; // 检查时间
    remark?: string; // 备注
  }>;

  // 附件
  attachments: Array<{
    attachmentId: string; // 附件ID
    fileName: string; // 文件名称
    fileType: string; // 文件类型
    fileSize: number; // 文件大小
    uploadTime: string; // 上传时间
  }>;

  // 备注
  remark: string | null;
}

/**
 * 设备信息
 */
export interface EquipmentInfo {
  id: string;
  equipmentNo: string; // 设备编号
  equipmentName: string; // 设备名称
  equipmentType: string; // 设备类型
  status: EquipmentStatus; // 设备状态
  serialNo: string; // 序列号
  model: string; // 型号
  manufacturer: string; // 制造商

  // 运行参数
  operatingParams: Array<{
    paramName: string; // 参数名称
    paramValue: string; // 参数值
    unit: string; // 单位
    status: 'NORMAL' | 'WARNING' | 'ERROR'; // 状态
  }>;

  // 控制权限
  controlPermissions: {
    start: boolean; // 启动权限
    stop: boolean; // 停止权限
    pause: boolean; // 暂停权限
    reset: boolean; // 复位权限
    parameter: boolean; // 参数设置权限
  };

  // 维护信息
  maintenanceInfo: {
    lastMaintenanceDate: string; // 上次维护日期
    nextMaintenanceDate: string; // 下次维护日期
    maintenanceInterval: number; // 维护间隔（小时）
    runningHours: number; // 运行小时数
    status: 'NORMAL' | 'DUE' | 'OVERDUE'; // 维护状态
  };

  // 故障信息
  faultInfo: {
    hasFault: boolean; // 是否有故障
    faultCode: string | null; // 故障代码
    faultDescription: string | null; // 故障描述
    faultTime: string | null; // 故障时间
    resolution: string | null; // 解决方案
    resolvedTime: string | null; // 解决时间
  };
}

/**
 * 操作记录
 */
export interface OperationRecord {
  id: string;
  recordNo: string; // 记录编号
  workstationId: string; // 工作站ID
  workstationName: string; // 工作站名称
  taskId: string; // 任务ID
  taskNo: string; // 任务编号
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名

  // 操作信息
  operationType: 'LOGIN' | 'LOGOUT' | 'START_TASK' | 'PAUSE_TASK' | 'RESUME_TASK' | 'COMPLETE_TASK' | 'EQUIPMENT_START' | 'EQUIPMENT_STOP' | 'PARAMETER_CHANGE' | 'QUALITY_CHECK'; // 操作类型
  operationDesc: string; // 操作描述
  operationData: Record<string, any>; // 操作数据

  // 时间信息
  operationTime: string; // 操作时间

  // 系统信息
  createTime: string; // 创建时间
}

/**
 * PAD操作DTO
 */
export interface PADOperationDTO {
  operationType: string; // 操作类型
  workstationId: string; // 工作站ID
  taskId?: string; // 任务ID
  operatorId: string; // 操作员ID
  operationData: Record<string, any>; // 操作数据
}

/**
 * 任务执行DTO
 */
export interface TaskExecutionDTO {
  taskId: string; // 任务ID
  workstationId: string; // 工作站ID
  operatorId: string; // 操作员ID
  executionType: 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'ABORT'; // 执行类型
  qty: number; // 执行数量
  completedQty?: number; // 完成数量(alias)
  qualifiedQty: number; // 合格数量
  unqualifiedQty: number; // 不合格数量
  remark?: string; // 备注
}

/**
 * 设备控制DTO
 */
export interface EquipmentControlDTO {
  equipmentId: string; // 设备ID
  workstationId: string; // 工作站ID
  operatorId: string; // 操作员ID
  controlType: 'START' | 'STOP' | 'PAUSE' | 'RESET'; // 控制类型
  params?: Array<{
    paramId: string;
    paramValue: string;
  }>; // 参数设置
}

/**
 * 质量检查DTO
 */
export interface QualityCheckDTO {
  taskId: string; // 任务ID
  checkId: string; // 检查点ID
  workstationId: string; // 工作站ID
  inspectorId: string; // 检验员ID
  checkResult: 'PASSED' | 'FAILED' | 'SKIPPED'; // 检查结果
  checkValue: string; // 检查值
  remark?: string; // 备注
}

/**
 * 参数设置DTO
 */
export interface ParameterSettingDTO {
  taskId: string; // 任务ID
  paramId: string; // 参数ID
  workstationId: string; // 工作站ID
  operatorId: string; // 操作员ID
  targetValue: string; // 目标值
  remark?: string; // 备注
}

/**
 * PAD状态映射
 */
export const PAD_WORKSTATION_STATUS_MAP: Record<WorkstationStatus, { label: string; color: string; bg: string; icon: string }> = {
  IDLE: { label: '空闲', color: '#52c41a', bg: '#f6ffed', icon: '✓' },
  BUSY: { label: '忙碌', color: '#1890ff', bg: '#e6f7ff', icon: '⚡' },
  MAINTENANCE: { label: '维护中', color: '#faad14', bg: '#fffbe6', icon: '🔧' },
  ERROR: { label: '故障', color: '#ff4d4f', bg: '#fff1f0', icon: '⚠️' },
};

/**
 * 任务状态映射
 */
export const PAD_TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: '待执行', color: '#faad14', bg: '#fffbe6', icon: '⏳' },
  IN_PROGRESS: { label: '执行中', color: '#1890ff', bg: '#e6f7ff', icon: '⚙️' },
  PAUSED: { label: '已暂停', color: '#ff7a45', bg: '#fff7e6', icon: '⏸️' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', icon: '✅' },
  FAILED: { label: '已失败', color: '#ff4d4f', bg: '#fff1f0', icon: '❌' },
};

/**
 * 设备状态映射
 */
export const PAD_EQUIPMENT_STATUS_MAP: Record<EquipmentStatus, { label: string; color: string; bg: string; icon: string }> = {
  STOPPED: { label: '已停止', color: '#bfbfbf', bg: '#f5f5f5', icon: '⏹️' },
  RUNNING: { label: '运行中', color: '#52c41a', bg: '#f6ffed', icon: '▶️' },
  PAUSED: { label: '已暂停', color: '#ff7a45', bg: '#fff7e6', icon: '⏸️' },
  ERROR: { label: '故障', color: '#ff4d4f', bg: '#fff1f0', icon: '⚠️' },
  MAINTENANCE: { label: '维护中', color: '#faad14', bg: '#fffbe6', icon: '🔧' },
};

/**
 * 质量检查状态映射
 */
export const PAD_QUALITY_CHECK_STATUS_MAP: Record<QualityCheckStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: '待检查', color: '#faad14', icon: '⏳' },
  PASSED: { label: '已通过', color: '#52c41a', icon: '✅' },
  FAILED: { label: '未通过', color: '#ff4d4f', icon: '❌' },
  SKIPPED: { label: '已跳过', color: '#bfbfbf', icon: '⏭️' },
};

export default {
  PAD_WORKSTATION_STATUS_MAP,
  PAD_TASK_STATUS_MAP,
  PAD_EQUIPMENT_STATUS_MAP,
  PAD_QUALITY_CHECK_STATUS_MAP,
};