/**
 * 生产任务单模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  TaskOrder,
  TaskOrderQuery,
  CreateTaskOrderDTO,
  UpdateTaskOrderDTO,
  TaskOrderBatchAction,
  TOStatus,
  TOPriority,
} from './types';

/**
 * 生产任务单API服务类
 * 封装所有生产任务单相关的API调用
 */
class TaskOrderApiService {
  /**
   * 分页查询生产任务单列表
   */
  async getTaskOrders(query: TaskOrderQuery): Promise<PageResult<TaskOrder>> {
    return await apiClient.get<PageResult<TaskOrder>>(
      '/task-order/page',
      { params: query }
    );
  }

  /**
   * 获取所有生产任务单列表（不分页）
   */
  async getAllTaskOrders(): Promise<TaskOrder[]> {
    return await apiClient.get<TaskOrder[]>('/task-order/list');
  }

  /**
   * 根据ID获取生产任务单详情
   */
  async getTaskOrderById(id: string): Promise<TaskOrder> {
    return await apiClient.get<TaskOrder>(`/task-order/${id}`);
  }

  /**
   * 根据任务单号获取生产任务单
   */
  async getTaskOrderByNo(taskNo: string): Promise<TaskOrder> {
    return await apiClient.get<TaskOrder>('/task-order/byNo', {
      params: { taskNo },
    });
  }

  /**
   * 创建生产任务单
   */
  async createTaskOrder(data: CreateTaskOrderDTO): Promise<TaskOrder> {
    return await apiClient.post<TaskOrder>('/task-order', data);
  }

  /**
   * 更新生产任务单
   */
  async updateTaskOrder(data: UpdateTaskOrderDTO): Promise<TaskOrder> {
    return await apiClient.put<TaskOrder>('/task-order', data);
  }

  /**
   * 批量删除生产任务单
   */
  async deleteTaskOrders(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/task-order', { data: ids });
  }

  /**
   * 批量操作生产任务单
   */
  async batchTaskOrders(action: TaskOrderBatchAction): Promise<void> {
    await apiClient.put<void>('/task-order/batch', action);
  }

  /**
   * 分配任务
   */
  async assignTask(id: string, operatorId: string, workcenterId?: string, teamId?: string, equipmentId?: string): Promise<void> {
    await apiClient.put<void>(`/task-order/${id}/assign`, {
      operatorId,
      workcenterId,
      teamId,
      equipmentId,
    });
  }

  /**
   * 开始任务
   */
  async startTask(id: string): Promise<void> {
    await apiClient.put<void>(`/task-order/${id}/start`);
  }

  /**
   * 完成任务
   */
  async completeTask(id: string, quantity: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number): Promise<void> {
    await apiClient.put<void>(`/task-order/${id}/complete`, {
      quantity,
      qualifiedQty,
      unqualifiedQty,
      scrapQty,
    });
  }

  /**
   * 暂停任务
   */
  async pauseTask(id: string): Promise<void> {
    await apiClient.put<void>(`/task-order/${id}/pause`);
  }

  /**
   * 恢复任务
   */
  async resumeTask(id: string): Promise<void> {
    await apiClient.put<void>(`/task-order/${id}/resume`);
  }

  /**
   * 取消任务
   */
  async cancelTask(id: string, reason?: string): Promise<void> {
    await apiClient.put<void>(`/task-order/${id}/cancel`, { reason });
  }

  /**
   * 更新任务状态
   */
  async updateStatus(ids: string[], status: TOStatus): Promise<void> {
    await apiClient.put<void>('/task-order/status', { ids, status });
  }

  /**
   * 更新任务优先级
   */
  async updatePriority(id: string, priority: TOPriority): Promise<void> {
    await apiClient.put<void>(`/task-order/${id}/priority`, { priority });
  }

  /**
   * 检查任务单号是否存在
   */
  async checkTaskNoExists(taskNo: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/task-order/checkTaskNo', {
      params: { taskNo, excludeId },
    });
  }

  /**
   * 获取生产任务单统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    pendingCount: number;
    assignedCount: number;
    inProgressCount: number;
    completedCount: number;
    cancelledCount: number;
    priorityStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      pendingCount: number;
      assignedCount: number;
      inProgressCount: number;
      completedCount: number;
      cancelledCount: number;
      priorityStats: Record<string, number>;
    }>('/task-order/statistics');
    return (response as any).data;
  }

  /**
   * 导入生产任务单
   */
  async importTaskOrders(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/task-order/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出生产任务单
   */
  async exportTaskOrders(query: TaskOrderQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/task-order/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 从工单生成任务单
   */
  async generateFromWO(woId: string): Promise<TaskOrder[]> {
    return await apiClient.post<TaskOrder[]>(`/task-order/generate-from-wo/${woId}`, {});
  }

  /**
   * 获取可分配的操作员列表
   */
  async getAvailableOperators(workcenterId: string, teamId?: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/task-order/operators`, {
      params: { workcenterId, teamId },
    });
  }

  /**
   * 获取可分配的设备列表
   */
  async getAvailableEquipment(workcenterId: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/task-order/equipment`, {
      params: { workcenterId },
    });
  }

  /**
   * 获取操作员任务列表
   */
  async getOperatorTasks(operatorId: string, status?: string): Promise<TaskOrder[]> {
    return await apiClient.get<TaskOrder[]>(`/task-order/operator/${operatorId}`, {
      params: { status },
    });
  }

  /**
   * 获取工作中心任务列表
   */
  async getWorkcenterTasks(workcenterId: string, status?: string): Promise<TaskOrder[]> {
    return await apiClient.get<TaskOrder[]>(`/task-order/workcenter/${workcenterId}`, {
      params: { status },
    });
  }
}

// 导出API服务单例
export const taskOrderApi = new TaskOrderApiService();
