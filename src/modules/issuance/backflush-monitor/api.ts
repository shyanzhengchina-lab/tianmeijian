/**
 * 倒冲监控模块API服务
 * 生产完成后物料自动倒扣的完整API对接实现
 */

import { BaseApiService } from '../../../shared/api/baseApiService';

/**
 * 倒冲监控查询DTO
 */
export interface BackflushMonitorQuery {
  status?: string; // 状态筛选
  workOrderId?: string; // 工单ID筛选
  taskId?: string; // 任务ID筛选
  productId?: string; // 产品ID筛选
  dateRange?: [string, string]; // 日期范围
  currentPage?: number;
  pageSize?: number;
}

/**
 * 倒冲监控DTO
 */
export interface BackflushMonitor {
  id?: string;
  monitorNo: string; // 监控单号
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单号
  taskId: string; // 任务ID
  taskNo: string; // 任务编号
  productId: string; // 产品ID
  productCode: string; // 产品编码
  productName: string; // 产品名称
  productSpec?: string; // 规格型号
  batchNo: string; // 批次号
  actualQty: number; // 实际生产数量
  planQty: number; // 计划生产数量
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'CANCELLED'; // 状态
  triggerTime: string; // 触发时间
  completeTime?: string; // 完成时间
  retryCount: number; // 重试次数
  maxRetry: number; // 最大重试次数
  items: BackflushItem[]; // 倒冲明细
  errorMessage?: string; // 错误信息
  remark?: string; // 备注
}

/**
 * 倒冲明细DTO
 */
export interface BackflushItem {
  id?: string;
  monitorId: string; // 监控ID
  materialId: string; // 物料ID
  materialCode: string; // 物料编码
  materialName: string; // 物料名称
  materialSpec?: string; // 规格型号
  unit: string; // 单位
  formulaQty: number; // 配方数量
  backflushQty: number; // 倒冲数量
  actualQty: number; // 实际倒冲数量
  location?: string; // 库位
  status: 'PENDING' | 'SUCCESS' | 'FAILED'; // 状态
  errorMessage?: string; // 错误信息
}

/**
 * 创建倒冲监控DTO
 */
export interface CreateBackflushMonitorDTO {
  taskId: string; // 任务ID
  actualQty: number; // 实际生产数量
  remark?: string;
}

/**
 * 更新倒冲监控DTO
 */
export interface UpdateBackflushMonitorDTO extends CreateBackflushMonitorDTO {
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
export interface BackflushMonitorStats {
  totalCount: number;
  pendingCount: number;
  processingCount: number;
  successCount: number;
  partialSuccessCount: number;
  failedCount: number;
  cancelledCount: number;
  todayCount: number;
}

/**
 * 倒冲监控模块API服务类
 * 继承基础API服务，实现倒冲监控管理的所有API调用
 */
export class BackflushMonitorApiService extends BaseApiService {
  private readonly BACKFLUSH_MONITOR_API = '/backflush-monitor';

  constructor() {
    super();
  }

  /**
   * 获取倒冲监控列表
   */
  async getBackflushMonitors(query: BackflushMonitorQuery): Promise<PaginatedResponse<BackflushMonitor>> {
    return await this.apiClient.get<PaginatedResponse<BackflushMonitor>>(
      `${this.BACKFLUSH_MONITOR_API}/list`,
      { params: query }
    );
  }

  /**
   * 获取倒冲监控详情
   */
  async getBackflushMonitorById(id: string): Promise<BackflushMonitor> {
    return await this.apiClient.get<BackflushMonitor>(`${this.BACKFLUSH_MONITOR_API}/${id}`);
  }

  /**
   * 根据任务获取倒冲监控
   */
  async getBackflushMonitorByTask(taskId: string): Promise<PaginatedResponse<BackflushMonitor>> {
    return await this.apiClient.get<PaginatedResponse<BackflushMonitor>>(
      `${this.BACKFLUSH_MONITOR_API}/task/${taskId}`,
      { params: { currentPage: 1, pageSize: 10 } });
  }

  /**
   * 根据工单获取倒冲监控
   */
  async getBackflushMonitorByWorkOrder(workOrderId: string): Promise<PaginatedResponse<BackflushMonitor>> {
    return await this.apiClient.get<PaginatedResponse<BackflushMonitor>>(
      `${this.BACKFLUSH_MONITOR_API}/work-order/${workOrderId}`,
      { params: { currentPage: 1, pageSize: 10 } }
    );
  }

  /**
   * 创建倒冲监控
   */
  async createBackflushMonitor(data: CreateBackflushMonitorDTO): Promise<BackflushMonitor> {
    return await this.apiClient.post<BackflushMonitor>(`${this.BACKFLUSH_MONITOR_API}`, data);
  }

  /**
   * 更新倒冲监控
   */
  async updateBackflushMonitor(data: UpdateBackflushMonitorDTO): Promise<BackflushMonitor> {
    return await this.apiClient.put<BackflushMonitor>(`${this.BACKFLUSH_MONITOR_API}`, data);
  }

  /**
   * 删除倒冲监控
   */
  async deleteBackflushMonitors(ids: string[]): Promise<void> {
    return await this.apiClient.delete<void>(`${this.BACKFLUSH_MONITOR_API}`, { ids });
  }

  /**
   * 手动触发倒冲
   */
  async triggerBackflush(id: string, operatorId?: string, operatorName?: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/${id}/trigger`, {
      operatorId,
      operatorName,
    });
  }

  /**
   * 重试失败
   */
  async retryBackflush(id: string, operatorId?: string, operatorName?: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/${id}/retry`, {
      operatorId,
      operatorName,
    });
  }

  /**
   * 批量重试
   */
  async batchRetry(ids: string[], operatorId: string, operatorName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/batch/retry`, {
      ids,
      operatorId,
      operatorName,
    });
  }

  /**
   * 取消倒冲
   */
  async cancelBackflush(id: string, reason?: string, operatorId?: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/${id}/cancel`, {
      reason,
      operatorId,
    });
  }

  /**
   * 获取倒冲明细
   */
  async getBackflushItems(monitorId: string): Promise<PaginatedResponse<BackflushItem>> {
    return await this.apiClient.get<PaginatedResponse<BackflushItem>>(
      `${this.BACKFLUSH_MONITOR_API}/${monitorId}/items`,
      { params: { currentPage: 1, pageSize: 100 } }
    );
  }

  /**
   * 更新倒冲明细
   */
  async updateBackflushItem(itemId: string, data: Partial<BackflushItem>): Promise<BackflushItem> {
    return await this.apiClient.put<BackflushItem>(`${this.BACKFLUSH_MONITOR_API}/items/${itemId}`, data);
  }

  /**
   * 手动调整倒冲数量
   */
  async adjustBackflushQty(itemId: string, actualQty: number, reason?: string, operatorId?: string): Promise<BackflushItem> {
    return await this.apiClient.post<BackflushItem>(`${this.BACKFLUSH_MONITOR_API}/items/${itemId}/adjust`, {
      actualQty,
      reason,
      operatorId,
    });
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<BackflushMonitorStats> {
    return await this.apiClient.get<BackflushMonitorStats>(`${this.BACKFLUSH_MONITOR_API}/statistics`);
  }

  /**
   * 获取工单倒冲统计
   */
  async getWorkOrderStats(workOrderId: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.BACKFLUSH_MONITOR_API}/work-order/${workOrderId}/stats`);
  }

  /**
   * 获取任务倒冲统计
   */
  async getTaskStats(taskId: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.BACKFLUSH_MONITOR_API}/task/${taskId}/stats`);
  }

  /**
   * 获取产品倒冲统计
   */
  async getProductStats(productId: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.BACKFLUSH_MONITOR_API}/product/${productId}/stats`);
  }

  /**
   * 获取失败倒冲列表
   */
  async getFailedBackflushes(dateRange?: [string, string]): Promise<PaginatedResponse<BackflushMonitor>> {
    const query = dateRange ? { dateRange, currentPage: 1, pageSize: 20 } : { currentPage: 1, pageSize: 20 };
    return await this.apiClient.get<PaginatedResponse<BackflushMonitor>>(`${this.BACKFLUSH_MONITOR_API}/failed`, { params: query });
  }

  /**
   * 获取待处理倒冲列表
   */
  async getPendingBackflushes(): Promise<PaginatedResponse<BackflushMonitor>> {
    return await this.apiClient.get<PaginatedResponse<BackflushMonitor>>(
      `${this.BACKFLUSH_MONITOR_API}/pending`,
      { params: { currentPage: 1, pageSize: 20 } }
    );
  }

  /**
   * 批量取消
   */
  async batchCancel(ids: string[], reason?: string, operatorId?: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/batch/cancel`, {
      ids,
      reason,
      operatorId,
    });
  }

  /**
   * 批量触发
   */
  async batchTrigger(ids: string[], operatorId: string, operatorName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/batch/trigger`, {
      ids,
      operatorId,
      operatorName,
    });
  }

  /**
   * 获取倒冲配方（根据产品）
   */
  async getBackflushFormula(productId: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.BACKFLUSH_MONITOR_API}/formula/${productId}`);
  }

  /**
   * 预览倒冲数量
   */
  async previewBackflushQty(taskId: string, actualQty: number): Promise<any> {
    return await this.apiClient.post<any>(`${this.BACKFLUSH_MONITOR_API}/preview`, {
      taskId,
      actualQty,
    });
  }

  /**
   * 验证倒冲可行性
   */
  async validateBackflush(taskId: string, actualQty: number): Promise<any> {
    return await this.apiClient.post<any>(`${this.BACKFLUSH_MONITOR_API}/validate`, {
      taskId,
      actualQty,
    });
  }

  /**
   * 导出倒冲监控列表
   */
  async exportBackflushMonitors(query: BackflushMonitorQuery, format: 'excel' | 'csv' = 'excel'): Promise<any> {
    return await this.apiClient.post<any>(`${this.BACKFLUSH_MONITOR_API}/export/${format}`, query);
  }

  /**
   * 导出倒冲明细
   */
  async exportBackflushItems(monitorId: string, format: 'excel' | 'csv' = 'excel'): Promise<any> {
    return await this.apiClient.get<any>(`${this.BACKFLUSH_MONITOR_API}/${monitorId}/items/export/${format}`);
  }

  /**
   * 打印倒冲单
   */
  async printBackflushMonitor(id: string): Promise<any> {
    return await this.apiClient.get<any>(`${this.BACKFLUSH_MONITOR_API}/${id}/print`);
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(id: string): Promise<PaginatedResponse<any>> {
    return await this.apiClient.get<PaginatedResponse<any>>(
      `${this.BACKFLUSH_MONITOR_API}/${id}/logs`,
      { params: { currentPage: 1, pageSize: 20 } });
  }

  /**
   * 获取倒冲历史
   */
  async getBackflushHistory(workOrderId?: string, taskId?: string): Promise<PaginatedResponse<BackflushMonitor>> {
    const query: any = { currentPage: 1, pageSize: 20 };
    if (workOrderId) query.workOrderId = workOrderId;
    if (taskId) query.taskId = taskId;
    return await this.apiClient.get<PaginatedResponse<BackflushMonitor>>(`${this.BACKFLUSH_MONITOR_API}/history`, query);
  }

  /**
   * 自动倒冲配置（是否启用自动倒冲）
   */
  async getAutoBackflushConfig(): Promise<any> {
    return await this.apiClient.get<any>(`${this.BACKFLUSH_MONITOR_API}/config/auto`);
  }

  /**
   * 更新自动倒冲配置
   */
  async updateAutoBackflushConfig(config: any): Promise<any> {
    return await this.apiClient.put<any>(`${this.BACKFLUSH_MONITOR_API}/config/auto`, config);
  }

  /**
   * 获取库存变动记录
   */
  async getInventoryChanges(monitorId: string): Promise<PaginatedResponse<any>> {
    return await this.apiClient.get<PaginatedResponse<any>>(
      `${this.BACKFLUSH_MONITOR_API}/${monitorId}/inventory-changes`,
      { params: { currentPage: 1, pageSize: 50 } }
    );
  }

  /**
   * 获取异常列表（库存不足、物料不存在等）
   */
  async getExceptionList(monitorId: string): Promise<PaginatedResponse<any>> {
    return await this.apiClient.get<PaginatedResponse<any>>(
      `${this.BACKFLUSH_MONITOR_API}/${monitorId}/exceptions`,
      { params: { currentPage: 1, pageSize: 50 } }
    );
  }

  /**
   * 处理异常
   */
  async handleException(exceptionId: string, action: string, remark?: string, operatorId?: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/exceptions/${exceptionId}/handle`, {
      action,
      remark,
      operatorId,
    });
  }

  /**
   * 获取倒冲汇总报表
   */
  async getBackflushSummaryReport(dateRange: [string, string], groupBy?: 'product' | 'workOrder' | 'workstation'): Promise<any> {
    return await this.apiClient.post<any>(`${this.BACKFLUSH_MONITOR_API}/report/summary`, {
      dateRange,
      groupBy,
    });
  }

  /**
   * 同步倒冲数据到ERP
   */
  async syncToERP(monitorId: string, operatorId: string, operatorName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/${monitorId}/sync-erp`, {
      operatorId,
      operatorName,
    });
  }

  /**
   * 批量同步到ERP
   */
  async batchSyncToERP(ids: string[], operatorId: string, operatorName: string): Promise<void> {
    return await this.apiClient.post<void>(`${this.BACKFLUSH_MONITOR_API}/batch/sync-erp`, {
      ids,
      operatorId,
      operatorName,
    });
  }
}

/**
 * 导出单例实例
 */
export const backflushMonitorApi = new BackflushMonitorApiService();
