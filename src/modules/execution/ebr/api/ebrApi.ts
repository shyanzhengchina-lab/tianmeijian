/**
 * EBR模块API服务
 * 电子批记录的完整API对接实现
 */

import { BaseApiService } from '../../../../shared/api/baseApiService';

/**
 * EBR查询DTO
 */
export interface EBRQueryDTO {
  batchNo?: string; // 批次号
  productCode?: string; // 产品编码
  status?: string; // 状态：PENDING/IN_PROGRESS/PAUSED/COMPLETED/CANCELLED
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  currentPage?: number;
  pageSize?: number;
}

/**
 * EBR步骤操作DTO
 */
export interface EBRStepOperationDTO {
  ebrId: string; // 批记录ID
  stepId: string; // 步骤ID
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  operationType: 'START' | 'COMPLETE' | 'PAUSE' | 'SKIP' | 'APPROVE'; // 操作类型
  operationTime: string; // 操作时间
  remark?: string; // 备注
  actualValue?: string; // 实际值（用于数据记录）
  attachments?: string[]; // 附件列表
}

/**
 * 设备使用DTO
 */
export interface EquipmentUsageDTO {
  ebrId: string; // 批记录ID
  stepId: string; // 步骤ID
  equipmentId: string; // 设备ID
  equipmentName: string; // 设备名称
  startTime: string; // 开始时间
  endTime?: string; // 结束时间
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  actualParams?: Record<string, any>; // 实际参数
  remark?: string; // 备注
}

/**
 * 数据记录DTO
 */
export interface DataRecordDTO {
  ebrId: string; // 批记录ID
  stepId: string; // 步骤ID
  recordId: string; // 记录项ID
  recordName: string; // 记录项名称
  recordType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECTION'; // 记录类型
  actualValue: string; // 实际值
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  recordTime: string; // 记录时间
  remark?: string; // 备注
}

/**
 * 分页结果DTO
 */
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  code: number;
  message: string;
}

/**
 * EBR模块API服务类
 * 继承基础API服务，实现电子批记录相关的所有API调用
 */
export class EbrApiService extends BaseApiService {
  private readonly EBR_API = '/ebr-record';

  constructor() {
    super();
  }

  /**
   * 获取批记录列表
   */
  async getEBRRecords(query: EBRQueryDTO): Promise<PaginatedResponse<any>> {
    return await this.get<PaginatedResponse<any>>(`${this.EBR_API}/page`, query);
  }

  /**
   * 获取批记录详情
   */
  async getEBRById(id: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${id}`);
  }

  /**
   * 创建批记录
   */
  async createEBR(data: any): Promise<any> {
    return await this.post<any>(`${this.EBR_API}`, data);
  }

  /**
   * 更新批记录
   */
  async updateEBR(data: any): Promise<any> {
    return await this.put<any>(`${this.EBR_API}`, data);
  }

  /**
   * 删除批记录
   */
  async deleteEBRs(ids: string[]): Promise<any> {
    return await this.delete<any>(`${this.EBR_API}`, { data: ids });
  }

  /**
   * 开始批记录
   */
  async startEBR(id: string, operatorId: string): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${id}/start`, { operatorId });
  }

  /**
   * 暂停批记录
   */
  async pauseEBR(id: string, operatorId: string, reason?: string): Promise<any> {
    return await this.put<any>(`${this.EBR_API}/${id}/pause`, { operatorId, reason });
  }

  /**
   * 恢复批记录
   */
  async resumeEBR(id: string, operatorId: string): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${id}/resume`, { operatorId });
  }

  /**
   * 完成批记录
   */
  async completeEBR(id: string, operatorId: string): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${id}/complete`, { operatorId });
  }

  /**
   * 取消批记录
   */
  async cancelEBR(id: string, operatorId: string, reason?: string): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${id}/cancel`, { operatorId, reason });
  }

  /**
   * 获取步骤列表
   */
  async getSteps(ebrId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/steps`);
  }

  /**
   * 获取步骤详情
   */
  async getStepById(ebrId: string, stepId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/steps/${stepId}`);
  }

  /**
   * 开始步骤
   */
  async startStep(data: EBRStepOperationDTO): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${data.ebrId}/step/${data.stepId}/start`, data);
  }

  /**
   * 完成步骤
   */
  async completeStep(data: EBRStepOperationDTO): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${data.ebrId}/step/${data.stepId}/complete`, data);
  }

  /**
   * 暂停步骤
   */
  async pauseStep(data: EBRStepOperationDTO): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${data.ebrId}/step/${data.stepId}/pause`, data);
  }

  /**
   * 跳过步骤
   */
  async skipStep(data: EBRStepOperationDTO): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${data.ebrId}/step/${data.stepId}/skip`, data);
  }

  /**
   * 审批步骤
   */
  async approveStep(data: EBRStepOperationDTO): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${data.ebrId}/step/${data.stepId}/approve`, data);
  }

  /**
   * 记录数据
   */
  async recordData(recordId: string, data: DataRecordDTO): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/data-records/${recordId}`, data);
  }

  /**
   * 获取数据记录
   */
  async getDataRecords(ebrId: string, stepId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/steps/${stepId}/data-records`);
  }

  /**
   * 获取设备使用记录
   */
  async getEquipmentUsage(ebrId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/equipment-usage`);
  }

  /**
   * 添加设备使用记录
   */
  async addEquipmentUsage(ebrId: string, data: EquipmentUsageDTO): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${ebrId}/equipment-usage`, data);
  }

  /**
   * 结束设备使用
   */
  async endEquipmentUsage(ebrId: string, usageId: string = '', endTime: string = ''): Promise<any> {
    return await this.put<any>(`${this.EBR_API}/${ebrId}/equipment-usage/${usageId}/end`, { endTime });
  }

  /**
   * 获取物料平衡记录
   */
  async getMaterialBalance(ebrId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/material-balance`);
  }

  /**
   * 重新计算物料平衡
   */
  async recalculateBalance(ebrId: string, operatorId: string = ''): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${ebrId}/material-balance/recalculate`, { operatorId });
  }

  /**
   * 调整差异
   */
  async adjustVariance(ebrId: string, balanceId: string = '', reason: string = '', operatorId: string = ''): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${ebrId}/material-balance/${balanceId}/adjust`, {
      reason,
      operatorId
    });
  }

  /**
   * 获取批记录统计信息
   */
  async getEBRStats(ebrId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/stats`);
  }

  /**
   * 获取步骤统计信息
   */
  async getStepStats(ebrId: string, stepId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/steps/${stepId}/stats`);
  }

  /**
   * 导出批记录
   */
  async exportEBR(ebrId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/export`, { responseType: 'blob' });
  }

  /**
   * 获取批记录历史
   */
  async getEBRHistory(ebrId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/history`);
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(ebrId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/operation-logs`);
  }

  /**
   * 批量审批步骤
   */
  async batchApproveSteps(ebrId: string, stepIds: string[], operatorId: string): Promise<any> {
    return await this.post<any>(`${this.EBR_API}/${ebrId}/steps/batch-approve`, {
      stepIds,
      operatorId
    });
  }

  /**
   * 获取可跳过的步骤
   */
  async getSkippableSteps(ebrId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/steps/skippable`);
  }

  /**
   * 验证步骤前置条件
   */
  async validateStepPrerequisites(ebrId: string, stepId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/steps/${stepId}/validate`);
  }

  /**
   * 获取步骤附件
   */
  async getStepAttachments(ebrId: string, stepId: string): Promise<any> {
    return await this.get<any>(`${this.EBR_API}/${ebrId}/steps/${stepId}/attachments`);
  }

  /**
   * 上传步骤附件
   */
  async uploadStepAttachment(ebrId: string, stepId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return await this.post<any>(`${this.EBR_API}/${ebrId}/steps/${stepId}/attachments`, formData);
  }

  /**
   * 删除步骤附件
   */
  async deleteStepAttachment(ebrId: string, stepId: string, attachmentId: string): Promise<any> {
    return await this.delete<any>(`${this.EBR_API}/${ebrId}/steps/${stepId}/attachments/${attachmentId}`);
  }

  /**
   * 更新EBR记录（兼容别名）
   */
  async updateEBRRecord(ebrId: string, data: any): Promise<any> {
    return await this.put<any>(`${this.EBR_API}/${ebrId}/records`, data);
  }
}

/**
 * 导出单例实例
 */
export const ebrApi = new EbrApiService();
