/**
 * PAD模块API服务
 * 工序执行界面的完整API对接实现
 * 对接后端 /api/pad-task 接口
 */

import { BaseApiService } from '../../../../shared/api/baseApiService';

/**
 * PAD任务查询DTO
 */
export interface PadTaskQueryDTO {
  status?: string; // 任务状态：PENDING/IN_PROGRESS/PAUSED/COMPLETED/CANCELLED
  workOrderNo?: string; // 工单号
  operationName?: string; // 工序名称
  workstationId?: string; // 工作站ID
  priority?: string; // 优先级
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  currentPage?: number;
  pageSize?: number;
}

/**
 * 任务执行DTO
 */
export interface TaskExecutionDTO {
  taskId: string; // 任务ID
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  operationType: 'START' | 'PAUSE' | 'RESUME' | 'COMPLETE' | 'CANCEL'; // 操作类型
  operationTime: string; // 操作时间
  completedQty?: number; // 完成数量
  reason?: string; // 原因（用于暂停/取消）
  remark?: string; // 备注
}

/**
 * 操作记录DTO
 */
export interface OperationRecordDTO {
  taskId: string; // 任务ID
  operationType: string; // 操作类型
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  operationTime: string; // 操作时间
  remark?: string; // 备注
  operationData?: any; // 操作数据
}

/**
 * 质量检查DTO
 */
export interface QualityCheckDTO {
  taskId: string; // 任务ID
  checkPointId: string; // 检查点ID
  checkResult: 'PASSED' | 'FAILED' | 'SKIPPED'; // 检查结果
  checkerId: string; // 检验员ID
  checkerName: string; // 检验员姓名
  checkTime: string; // 检验时间
  actualValue?: string; // 实际值
  targetValue?: string; // 目标值
  tolerance?: string; // 公差
  remark?: string; // 备注
}

/**
 * 设备控制DTO
 */
export interface EquipmentControlDTO {
  taskId: string; // 任务ID
  equipmentId: string; // 设备ID
  equipmentName: string; // 设备名称
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  operationType: 'START' | 'STOP' | 'PAUSE' | 'RESET'; // 操作类型
  operationTime: string; // 操作时间
  remark?: string; // 备注
}

/**
 * 参数设置DTO
 */
export interface ParameterSettingDTO {
  taskId: string; // 任务ID
  equipmentId: string; // 设备ID
  parameterName: string; // 参数名称
  parameterValue: string; // 参数值
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  settingTime: string; // 设置时间
  remark?: string; // 备注
}

/**
 * 分页结果DTO
 */
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  code: number;
  message: string;
}

/**
 * PAD模块API服务类
 * 继承基础API服务，实现工序执行相关的所有API调用
 * 对接后端 /api/pad-task 接口
 */
export class PadApiService extends BaseApiService {
  private readonly PAD_TASK_API = '/pad-task';

  constructor() {
    super();
  }

  /**
   * 获取任务列表
   */
  async getTasks(query: PadTaskQueryDTO): Promise<PaginatedResponse<any>> {
    return await this.get<PaginatedResponse<any>>(`${this.PAD_TASK_API}/page`, query);
  }

  /**
   * 获取任务详情
   */
  async getTaskById(id: string): Promise<any> {
    return await this.get<any>(`${this.PAD_TASK_API}/${id}`);
  }

  /**
   * 开始任务
   */
  async startTask(taskId: string, operatorId: string): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/${taskId}/start`, { operatorId });
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: string, operatorId: string, reason?: string): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/${taskId}/pause`, { operatorId, reason });
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId: string, operatorId: string): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/${taskId}/resume`, { operatorId });
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, operatorId: string, completedQty: number): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/${taskId}/complete`, { operatorId, completedQty });
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string, operatorId: string, reason?: string): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/${taskId}/cancel`, { operatorId, reason });
  }

  /**
   * 质量检查
   */
  async createQualityCheck(check: QualityCheckDTO): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/quality-checks`, check);
  }

  /**
   * 获取质量检查记录
   */
  async getQualityChecks(query: any): Promise<PaginatedResponse<any>> {
    return await this.get<PaginatedResponse<any>>(`${this.PAD_TASK_API}/quality-checks`, query);
  }

  /**
   * 获取质量检查详情
   */
  async getQualityCheckById(id: string): Promise<any> {
    return await this.get<any>(`${this.PAD_TASK_API}/quality-checks/${id}`);
  }

  /**
   * 获取操作记录
   */
  async getOperationRecords(query: any): Promise<PaginatedResponse<any>> {
    return await this.get<PaginatedResponse<any>>(`${this.PAD_TASK_API}/operations`, query);
  }

  /**
   * 创建操作记录
   */
  async createOperationRecord(record: OperationRecordDTO): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/operations`, record);
  }

  /**
   * 获取当前任务操作记录
   */
  async getTaskOperationRecords(taskId: string): Promise<any> {
    return await this.get<PaginatedResponse<any>>(`${this.PAD_TASK_API}/${taskId}/operations`);
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(id: string): Promise<any> {
    return await this.get<any>(`${this.PAD_TASK_API}/${id}/stats`);
  }

  /**
   * 批量操作
   */
  async batchStartTasks(taskIds: string[], operatorId: string): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/batch/start`, { taskIds, operatorId });
  }

  /**
   * 批量暂停任务
   */
  async batchPauseTasks(taskIds: string[], operatorId: string, reason?: string): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/batch/pause`, { taskIds, operatorId, reason });
  }

  /**
   * 批量完成任务
   */
  async batchCompleteTasks(completions: Array<{ taskId: string; completedQty: number }>, operatorId: string): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/batch/complete`, { completions, operatorId });
  }

  /**
   * 获取系统时间
   */
  async getSystemTime(): Promise<any> {
    return await this.get<any>(`${this.PAD_TASK_API}/system/time`);
  }

  /**
   * 扫码扫描
   */
  async scanBarcode(barcode: string): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/scan/barcode`, { barcode });
  }

  /**
   * 获取产品信息
   */
  async getProductInfo(productId: string): Promise<any> {
    return await this.get<any>(`${this.PAD_TASK_API}/product-info/${productId}`);
  }

  /**
   * 获取工单信息
   */
  async getWorkOrderInfo(workOrderId: string): Promise<any> {
    return await this.get<any>(`${this.PAD_TASK_API}/work-order/${workOrderId}`);
  }

  /**
   * 记录日志
   */
  async logActivity(logData: any): Promise<any> {
    return await this.post<any>(`${this.PAD_TASK_API}/activities`, logData);
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId: string): Promise<any> {
    return await this.get<any>(`${this.PAD_TASK_API}/users/${userId}/permissions`);
  }

  /**
   * 获取实时通知
   */
  async getNotifications(userId: string): Promise<any> {
    return await this.get<any>(`${this.PAD_TASK_API}/users/${userId}/notifications`);
  }

  /**
   * 标记通知已读
   */
  async markNotificationRead(notificationId: string): Promise<any> {
    return await this.put<any>(`${this.PAD_TASK_API}/notifications/${notificationId}/read`, {});
  }
}

/**
 * 导出单例实例
 */
export const padApi = new PadApiService();