/**
 * 生产任务单API服务
 * 提供生产任务单相关的所有API调用方法
 */

import { apiClient } from '@/shared/api/apiClient';

// 类型定义
export interface TaskOrder {
  id?: number;
  taskNo?: string;
  workOrderId?: number;
  workOrderNo?: string;
  productionOrderId?: number;
  productionOrderNo?: string;
  productId?: number;
  productName?: string;
  productCode?: string;
  quantity?: number;
  unitId?: number;
  unitName?: string;
  assignedTo?: string;
  assignedToName?: string;
  receivedBy?: string;
  receivedByName?: string;
  status?: string;
  priority?: string;
  planStartDate?: string;
  planEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  completedQuantity?: number;
  qualifiedQuantity?: number;
  actualHours?: number;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

export interface TaskOrderQuery {
  page?: number;
  size?: number;
  taskNo?: string;
  productName?: string;
  status?: string;
  assignedTo?: string;
  workOrderId?: number;
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
 * 生产任务单API服务类
 */
export class TaskOrderApiService {
  private baseUrl = '/task-order';

  /**
   * 分页查询生产任务单
   */
  async getTaskOrders(query: TaskOrderQuery): Promise<PageResult<TaskOrder>> {
    return await apiClient.get<PageResult<TaskOrder>>(
      `${this.baseUrl}/page`,
      { params: query }
    );
  }

  /**
   * 根据ID查询生产任务单
   */
  async getTaskOrderById(id: number): Promise<TaskOrder> {
    return await apiClient.get<TaskOrder>(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建生产任务单
   */
  async createTaskOrder(data: Partial<TaskOrder>): Promise<void> {
    return await apiClient.post<void>(this.baseUrl, data);
  }

  /**
   * 更新生产任务单
   */
  async updateTaskOrder(data: TaskOrder): Promise<void> {
    return await apiClient.put<void>(this.baseUrl, data);
  }

  /**
   * 删除生产任务单
   */
  async deleteTaskOrder(id: number): Promise<void> {
    return await apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * 批量删除生产任务单
   */
  async deleteTaskOrders(ids: number[]): Promise<void> {
    return await apiClient.delete<void>(this.baseUrl, { data: ids });
  }

  /**
   * 分配任务
   */
  async assignTask(id: number, assignedTo: string, assignedToName: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/assign`, {
      assignedTo,
      assignedToName
    });
  }

  /**
   * 批量分配任务
   */
  async assignTasks(ids: number[], assignedTo: string, assignedToName: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/batch-assign`, {
      ids,
      assignedTo,
      assignedToName
    });
  }

  /**
   * 接收任务
   */
  async receiveTask(id: number, receivedBy: string, receivedByName: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/receive`, {
      receivedBy,
      receivedByName
    });
  }

  /**
   * 开始任务
   */
  async startTask(id: number): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/start`);
  }

  /**
   * 暂停任务
   */
  async pauseTask(id: number, reason?: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/pause`, { reason });
  }

  /**
   * 恢复任务
   */
  async resumeTask(id: number): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/resume`);
  }

  /**
   * 完成任务
   */
  async completeTask(id: number, data: {
    completedQuantity?: number;
    qualifiedQuantity?: number;
    actualHours?: number;
    remark?: string;
  }): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/complete`, data);
  }

  /**
   * 取消任务
   */
  async cancelTask(id: number, reason?: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  /**
   * 更新任务进度
   */
  async updateProgress(id: number, completedQuantity: number): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/progress`, {
      completedQuantity
    });
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStatistics(): Promise<any> {
    return await apiClient.get<any>(`${this.baseUrl}/statistics`);
  }

  /**
   * 根据工单查询任务
   */
  async getTasksByWorkOrder(workOrderId: number): Promise<TaskOrder[]> {
    return await apiClient.get<TaskOrder[]>(`${this.baseUrl}/by-work-order/${workOrderId}`);
  }

  /**
   * 根据生产订单查询任务
   */
  async getTasksByProductionOrder(productionOrderId: number): Promise<TaskOrder[]> {
    return await apiClient.get<TaskOrder[]>(`${this.baseUrl}/by-production-order/${productionOrderId}`);
  }

  /**
   * 导出生产任务单
   */
  async exportTaskOrders(query: TaskOrderQuery, format: string = 'excel'): Promise<Blob> {
    return await apiClient.get<Blob>(
      `${this.baseUrl}/export`,
      {
        params: { ...query, format },
        responseType: 'blob'
      }
    );
  }

  /**
   * 导入生产任务单
   */
  async importTaskOrders(file: File): Promise<any> {
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
export const taskOrderApi = new TaskOrderApiService();
