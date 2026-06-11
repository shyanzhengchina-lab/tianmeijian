/**
 * 工位领料模块API服务
 * PAD端工位物料领料管理的完整API对接实现
 */

import { BaseApiService } from '../../../shared/api/baseApiService';

/**
 * 工位领料查询DTO
 */
export interface PadIssuanceQuery {
  status?: string; // 状态筛选
  workOrderId?: string; // 工单ID筛选
  taskId?: string; // 任务ID筛选
  workstationId?: string; // 工位ID筛选
  operatorId?: string; // 操作员ID筛选
  currentPage?: number;
  pageSize?: number;
}

/**
 * 工位领料单DTO
 */
export interface PadIssuance {
  id?: string;
  issuanceNo: string; // 领料单号
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单号
  taskId: string; // 任务ID
  taskNo: string; // 任务编号
  workstationId: string; // 工位ID
  workstationName: string; // 工位名称
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ISSUED' | 'PARTIAL_ISSUED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'; // 状态
  requestTime: string; // 请求时间
  approvalTime?: string; // 审批时间
  issueTime?: string; // 发料时间
  completeTime?: string; // 完成时间
  items: PadIssuanceItem[]; // 领料明细
  remark?: string; // 备注
}

/**
 * 工位领料明细DTO
 */
export interface PadIssuanceItem {
  id?: string;
  issuanceId: string; // 领料单ID
  materialId: string; // 物料ID
  materialCode: string; // 物料编码
  materialName: string; // 物料名称
  materialSpec?: string; // 规格型号
  unit: string; // 单位
  requestedQty: number; // 请领数量
  issuedQty: number; // 实发数量
  batchNo?: string; // 批次号
  location?: string; // 库位
  status: 'PENDING' | 'ISSUED' | 'COMPLETED'; // 状态
}

/**
 * 创建工位领料DTO
 */
export interface CreatePadIssuanceDTO {
  taskId: string; // 任务ID
  workstationId: string; // 工位ID
  operatorId: string; // 操作员ID
  items: Omit<PadIssuanceItem, 'id' | 'issuanceId' | 'issuedQty' | 'status'>[];
  remark?: string;
}

/**
 * 更新工位领料DTO
 */
export interface UpdatePadIssuanceDTO extends CreatePadIssuanceDTO {
  id: string;
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
 * 统计信息DTO
 */
export interface PadIssuanceStats {
  totalCount: number;
  draftCount: number;
  pendingCount: number;
  approvedCount: number;
  partialIssuedCount: number;
  completedCount: number;
  cancelledCount: number;
  rejectedCount: number;
}

/**
 * 工位领料模块API服务类
 * 继承基础API服务，实现工位领料管理的所有API调用
 */
export class PadIssuanceApiService extends BaseApiService {
  private readonly PAD_ISSUANCE_API = '/pad-issuance';

  constructor() {
    super();
  }

  /**
   * 获取工位领料列表
   */
  async getPadIssuances(query: PadIssuanceQuery): Promise<PaginatedResponse<PadIssuance>> {
    return await this.apiClient.get<PaginatedResponse<PadIssuance>>(`${this.PAD_ISSUANCE_API}/list`, { params: query });
  }

  /**
   * 获取工位领料详情
   */
  async getPadIssuanceById(id: string): Promise<PadIssuance> {
    return await this.apiClient.get<PadIssuance>(`${this.PAD_ISSUANCE_API}/${id}`);
  }

  /**
   * 根据任务获取工位领料
   */
  async getPadIssuanceByTask(taskId: string): Promise<PaginatedResponse<PadIssuance>> {
    return await this.apiClient.get<PaginatedResponse<PadIssuance>>(
      `${this.PAD_ISSUANCE_API}/task/${taskId}`,
      { params: { currentPage: 1, pageSize: 10 } }
    );
  }

  /**
   * 根据工位获取工位领料
   */
  async getPadIssuanceByWorkstation(workstationId: string): Promise<PaginatedResponse<PadIssuance>> {
    return await this.apiClient.get<PaginatedResponse<PadIssuance>>(
      `${this.PAD_ISSUANCE_API}/workstation/${workstationId}`,
      { params: { currentPage: 1, pageSize: 10 } }
    );
  }

  /**
   * 创建工位领料
   */
  async createPadIssuance(data: CreatePadIssuanceDTO): Promise<PadIssuance> {
    return await this.apiClient.post<PadIssuance>(`${this.PAD_ISSUANCE_API}`, data);
  }

  /**
   * 更新工位领料
   */
  async updatePadIssuance(data: UpdatePadIssuanceDTO): Promise<PadIssuance> {
    return await this.apiClient.put<PadIssuance>(`${this.PAD_ISSUANCE_API}`, data);
  }

  /**
   * 删除工位领料
   */
  async deletePadIssuances(ids: string[]): Promise<void> {
    return await this.apiClient.delete<void>(`${this.PAD_ISSUANCE_API}`, { ids });
  }

  /**
   * 提交审批
   */
  async submitForApproval(id: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/${id}/submit`);
  }

  /**
   * 批准
   */
  async approve(id: string, approverId: string, approverName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/${id}/approve`, {
      approverId,
      approverName,
    });
  }

  /**
   * 拒绝
   */
  async reject(id: string, reason: string, approverId: string, approverName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/${id}/reject`, {
      reason,
      approverId,
      approverName,
    });
  }

  /**
   * 发料
   */
  async issue(id: string, issuedBy: string, issuedByName: string, items: { itemId: string; qty: number; batchNo?: string }[]): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/${id}/issue`, {
      issuedBy,
      issuedByName,
      items,
    });
  }

  /**
   * 取消
   */
  async cancel(id: string, reason?: string, operatorId?: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/${id}/cancel`, {
      reason,
      operatorId,
    });
  }

  /**
   * 完成
   */
  async complete(id: string, operatorId: string, operatorName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/${id}/complete`, {
      operatorId,
      operatorName,
    });
  }

  /**
   * 获取领料明细
   */
  async getIssuanceItems(issuanceId: string): Promise<PaginatedResponse<PadIssuanceItem>> {
    return await this.apiClient.get<PaginatedResponse<PadIssuanceItem>>(
      `${this.PAD_ISSUANCE_API}/${issuanceId}/items`,
      { params: { currentPage: 1, pageSize: 100 } }
    );
  }

  /**
   * 更新领料明细
   */
  async updateIssuanceItem(itemId: string, data: Partial<PadIssuanceItem>): Promise<PadIssuanceItem> {
    return await this.apiClient.put<PadIssuanceItem>(`${this.PAD_ISSUANCE_API}/items/${itemId}`, data);
  }

  /**
   * 批量更新领料明细
   */
  async batchUpdateIssuanceItems(items: Array<{ itemId: string; issuedQty: number; batchNo?: string }>): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/items/batch-update`, { items });
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<PadIssuanceStats> {
    return await this.apiClient.get<PadIssuanceStats>(`${this.PAD_ISSUANCE_API}/statistics`);
  }

  /**
   * 获取工位领料统计
   */
  async getWorkstationStats(workstationId: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.PAD_ISSUANCE_API}/workstation/${workstationId}/stats`);
  }

  /**
   * 获取任务领料统计
   */
  async getTaskStats(taskId: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.PAD_ISSUANCE_API}/task/${taskId}/stats`);
  }

  /**
   * 获取待处理领料列表
   */
  async getPendingIssuances(operatorId?: string): Promise<PaginatedResponse<PadIssuance>> {
    const query = operatorId ? { operatorId, currentPage: 1, pageSize: 10 } : { params: { currentPage: 1, pageSize: 10 } };
    return await this.apiClient.get<PaginatedResponse<PadIssuance>>(`${this.PAD_ISSUANCE_API}/pending`, { params: query });
  }

  /**
   * 批量审批
   */
  async batchApprove(ids: string[], approverId: string, approverName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/batch/approve`, {
      ids,
      approverId,
      approverName,
    });
  }

  /**
   * 批量拒绝
   */
  async batchReject(ids: string[], reason: string, approverId: string, approverName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/batch/reject`, {
      ids,
      reason,
      approverId,
      approverName,
    });
  }

  /**
   * 批量发料
   */
  async batchIssue(data: {
    issuanceId: string;
    issuedBy: string;
    issuedByName: string;
    items: { itemId: string; qty: number; batchNo?: string }[];
  }[]): Promise<void> {
    return await this.apiClient.post<void>(`${this.PAD_ISSUANCE_API}/batch/issue`, { data });
  }

  /**
   * 获取物料可用库存
   */
  async getMaterialAvailableStock(materialId: string, location?: string): Promise<any> {
    const query = location ? { location } : {};
    return await this.apiClient.get<any>(`${this.PAD_ISSUANCE_API}/material/${materialId}/stock`, { params: query });
  }

  /**
   * 导出工位领料列表
   */
  async exportPadIssuances(query: PadIssuanceQuery, format: 'excel' | 'csv' = 'excel'): Promise<any> {
    return await this.apiClient.post<any>(`${this.PAD_ISSUANCE_API}/export/${format}`, query);
  }

  /**
   * 打印领料单
   */
  async printIssuance(id: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.PAD_ISSUANCE_API}/${id}/print`);
  }

  /**
   * 获取审批历史
   */
  async getApprovalHistory(id: string): Promise<PaginatedResponse<any>> {
    return await this.apiClient.get<PaginatedResponse<any>>(
      `${this.PAD_ISSUANCE_API}/${id}/approval-history`,
      { params: { currentPage: 1, pageSize: 10 } }
    );
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(id: string): Promise<PaginatedResponse<any>> {
    return await this.apiClient.get<PaginatedResponse<any>>(
      `${this.PAD_ISSUANCE_API}/${id}/logs`,
      { params: { currentPage: 1, pageSize: 20 } }
    );
  }

  /**
   * 自动创建领料单（根据任务物料需求）
   */
  async autoCreateFromTask(taskId: string, operatorId: string, workstationId: string): Promise<PadIssuance> {
    return await this.apiClient.post<PadIssuance>(`${this.PAD_ISSUANCE_API}/auto-create`, {
      taskId,
      operatorId,
      workstationId,
    });
  }

  /**
   * 获取物料需求（任务关联）
   */
  async getMaterialRequirements(taskId: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.PAD_ISSUANCE_API}/task/${taskId}/requirements`);
  }

  /**
   * 校验领料数量
   */
  async validateIssuanceQty(materialId: string, qty: number, location?: string): Promise<any> {
    const query = location ? { location } : {};
    return await this.apiClient.post<any>(`${this.PAD_ISSUANCE_API}/validate`, {
      materialId,
      qty,
      ...query,
    });
  }
}

/**
 * 导出单例实例
 */
export const padIssuanceApi = new PadIssuanceApiService();
