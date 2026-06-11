/**
 * 生产工单API服务
 * 提供生产工单相关的所有API调用方法
 */

import { apiClient } from '@/shared/api/apiClient';

// 类型定义
export interface WorkOrder {
  id?: number;
  workOrderNo?: string;
  productionOrderId?: number;
  productionOrderNo?: string;
  productId?: number;
  productName?: string;
  productCode?: string;
  quantity?: number;
  unitId?: number;
  unitName?: string;
  planStartDate?: string;
  planEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status?: string;
  progress?: number;
  completedQuantity?: number;
  qualifiedQuantity?: number;
  actualHours?: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

export interface WorkOrderQuery {
  page?: number;
  size?: number;
  workOrderNo?: string;
  productName?: string;
  status?: string;
  productionOrderId?: number;
  startDate?: string;
  endDate?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * 生产工单API服务类
 */
export class WorkOrderApiService {
  private baseUrl = '/work-order';

  /**
   * 分页查询生产工单
   */
  async getWorkOrders(query: WorkOrderQuery): Promise<PageResult<WorkOrder>> {
    return await apiClient.get<PageResult<WorkOrder>>(
      `${this.baseUrl}/page`,
      { params: query }
    );
  }

  /**
   * 根据ID查询生产工单
   */
  async getWorkOrderById(id: number): Promise<WorkOrder> {
    return await apiClient.get<WorkOrder>(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建生产工单
   */
  async createWorkOrder(data: Partial<WorkOrder>): Promise<void> {
    return await apiClient.post<void>(this.baseUrl, data);
  }

  /**
   * 更新生产工单
   */
  async updateWorkOrder(data: WorkOrder): Promise<void> {
    return await apiClient.put<void>(this.baseUrl, data);
  }

  /**
   * 删除生产工单
   */
  async deleteWorkOrder(id: number): Promise<void> {
    return await apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * 批量删除生产工单
   */
  async deleteWorkOrders(ids: number[]): Promise<void> {
    return await apiClient.delete<void>(this.baseUrl, { data: ids });
  }

  /**
   * 开始工单
   */
  async startWorkOrder(id: number): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/start`);
  }

  /**
   * 暂停工单
   */
  async pauseWorkOrder(id: number, reason?: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/pause`, { reason });
  }

  /**
   * 恢复工单
   */
  async resumeWorkOrder(id: number): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/resume`);
  }

  /**
   * 完成工单
   */
  async completeWorkOrder(id: number, data: {
    actualQuantity?: number;
    qualifiedQuantity?: number;
    actualHours?: number;
    remark?: string;
  }): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/complete`, data);
  }

  /**
   * 取消工单
   */
  async cancelWorkOrder(id: number, reason?: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  /**
   * 更新工单进度
   */
  async updateProgress(id: number, progress: number, completedQuantity: number): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/progress`, {
      progress,
      completedQuantity
    });
  }

  /**
   * 获取工单统计信息
   */
  async getWorkOrderStatistics(): Promise<any> {
    return await apiClient.get<any>(`${this.baseUrl}/statistics`);
  }

  /**
   * 根据生产订单查询工单
   */
  async getWorkOrdersByProductionOrder(productionOrderId: number): Promise<WorkOrder[]> {
    return await apiClient.get<WorkOrder[]>(`${this.baseUrl}/by-production-order/${productionOrderId}`);
  }

  /**
   * 导出生产工单
   */
  async exportWorkOrders(query: WorkOrderQuery, format: string = 'excel'): Promise<Blob> {
    return await apiClient.get<Blob>(
      `${this.baseUrl}/export`,
      {
        params: { ...query, format },
        responseType: 'blob'
      }
    );
  }

  /**
   * 导入生产工单
   */
  async importWorkOrders(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.post<any>(`${this.baseUrl}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}

// 导出单例
export const workOrderApi = new WorkOrderApiService();