/**
 * 工序执行模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  PadExecutionTask,
  PadExecutionTaskQuery,
  CreatePadExecutionTaskDTO,
  UpdatePadExecutionTaskDTO,
  PadExecutionBatchAction,
  OperationRecord,
  RealtimeParameter,
  ExecutionLog,
} from './types';

/**
 * 工序执行API服务类
 * 封装所有工序执行相关的API调用
 */
class PadApiService {
  /**
   * 分页查询工序执行任务列表
   */
  async getPadExecutionTasks(query: PadExecutionTaskQuery): Promise<PageResult<PadExecutionTask>> {
    return await apiClient.get<PageResult<PadExecutionTask>>(
      '/pad-execution/page',
      { params: query }
    );
  }

  /**
   * 获取所有工序执行任务列表（不分页）
   */
  async getAllPadExecutionTasks(): Promise<PadExecutionTask[]> {
    return await apiClient.get<PadExecutionTask[]>('/pad-execution/list');
  }

  /**
   * 根据ID获取工序执行任务详情
   */
  async getPadExecutionTaskById(id: string): Promise<PadExecutionTask> {
    return await apiClient.get<PadExecutionTask>(`/pad-execution/${id}`);
  }

  /**
   * 获取操作员的执行任务列表
   */
  async getOperatorTasks(operatorId: string, status?: string): Promise<PadExecutionTask[]> {
    return await apiClient.get<PadExecutionTask[]>('/pad-execution/operator-tasks', {
      params: { operatorId, status },
    });
  }

  /**
   * 获取当前执行任务（正在执行的任务）
   */
  async getCurrentTask(operatorId: string): Promise<PadExecutionTask | null> {
    return await apiClient.get<PadExecutionTask | null>('/pad-execution/current-task', {
      params: { operatorId },
    });
  }

  /**
   * 创建工序执行任务
   */
  async createPadExecutionTask(data: CreatePadExecutionTaskDTO): Promise<PadExecutionTask> {
    return await apiClient.post<PadExecutionTask>('/pad-execution', data);
  }

  /**
   * 更新工序执行任务
   */
  async updatePadExecutionTask(data: UpdatePadExecutionTaskDTO): Promise<PadExecutionTask> {
    return await apiClient.put<PadExecutionTask>('/pad-execution', data);
  }

  /**
   * 批量操作工序执行任务
   */
  async batchPadExecutionTasks(action: PadExecutionBatchAction): Promise<void> {
    await apiClient.put<void>('/pad-execution/batch', action);
  }

  /**
   * 开始执行任务
   */
  async startExecution(id: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${id}/start`);
  }

  /**
   * 暂停执行任务
   */
  async pauseExecution(id: string, reason?: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${id}/pause`, { reason });
  }

  /**
   * 恢复执行任务
   */
  async resumeExecution(id: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${id}/resume`);
  }

  /**
   * 完成执行任务
   */
  async completeExecution(id: string, actualQty: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${id}/complete`, {
      actualQty,
      qualifiedQty,
      unqualifiedQty,
      scrapQty,
    });
  }

  /**
   * 取消执行任务
   */
  async cancelExecution(id: string, reason?: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${id}/cancel`, { reason });
  }

  /**
   * 更新执行状态
   */
  async updateStatus(ids: string[], status: string): Promise<void> {
    await apiClient.put<void>('/pad-execution/status', { ids, status });
  }

  /**
   * 更新执行数量
   */
  async updateQuantity(id: string, actualQty: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${id}/quantity`, {
      actualQty,
      qualifiedQty,
      unqualifiedQty,
      scrapQty,
    });
  }

  /**
   * 更新执行模式
   */
  async updateExecutionMode(id: string, executionMode: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${id}/execution-mode`, { executionMode });
  }

  /**
   * 获取操作记录
   */
  async getOperationRecords(taskId: string): Promise<OperationRecord[]> {
    return await apiClient.get<OperationRecord[]>(`/pad-execution/${taskId}/records`);
  }

  /**
   * 添加操作记录
   */
  async addOperationRecord(taskId: string, record: Omit<OperationRecord, 'id' | 'taskId'>): Promise<void> {
    await apiClient.post<void>(`/pad-execution/${taskId}/record`, record);
  }

  /**
   * 获取实时参数
   */
  async getRealtimeParameters(taskId: string): Promise<RealtimeParameter[]> {
    return await apiClient.get<RealtimeParameter[]>(`/pad-execution/${taskId}/realtime-parameters`);
  }

  /**
   * 更新实时参数
   */
  async updateRealtimeParameter(taskId: string, parameter: RealtimeParameter): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${taskId}/realtime-parameter`, parameter);
  }

  /**
   * 获取执行日志
   */
  async getExecutionLogs(taskId: string): Promise<ExecutionLog[]> {
    return await apiClient.get<ExecutionLog[]>(`/pad-execution/${taskId}/logs`);
  }

  /**
   * 添加执行日志
   */
  async addExecutionLog(taskId: string, log: Omit<ExecutionLog, 'id' | 'taskId'>): Promise<void> {
    await apiClient.post<void>(`/pad-execution/${taskId}/log`, log);
  }

  /**
   * 获取执行统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    pendingCount: number;
    runningCount: number;
    pausedCount: number;
    completedCount: number;
    cancelledCount: number;
    modeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      pendingCount: number;
      runningCount: number;
      pausedCount: number;
      completedCount: number;
      cancelledCount: number;
      modeStats: Record<string, number>;
    }>('/pad-execution/statistics');
    return (response as any).data;
  }

  /**
   * 获取操作员统计信息
   */
  async getOperatorStatistics(operatorId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    runningTask?: PadExecutionTask;
    todayActualQty: number;
    todayQualifiedRate: number;
    workTime: number;
  }> {
    const response = await apiClient.get<{
      totalTasks: number;
      completedTasks: number;
      runningTask?: PadExecutionTask;
      todayActualQty: number;
      todayQualifiedRate: number;
      workTime: number;
    }>('/pad-execution/operator-statistics', {
      params: { operatorId },
    });
    return (response as any).data;
  }

  /**
   * 导入工序执行任务
   */
  async importPadExecutionTasks(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/pad-execution/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出工序执行任务
   */
  async exportPadExecutionTasks(query: PadExecutionTaskQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/pad-execution/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 导出操作记录
   */
  async exportOperationRecords(taskId: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/pad-execution/${taskId}/export-records`, {
      responseType: 'blob',
    });
  }

  /**
   * 导出执行日志
   */
  async exportExecutionLogs(taskId: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/pad-execution/${taskId}/export-logs`, {
      responseType: 'blob',
    });
  }

  /**
   * 接收任务
   */
  async acceptTask(taskId: string, operatorId: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${taskId}/accept`, { operatorId });
  }

  /**
   * 放弃任务
   */
  async abandonTask(taskId: string, reason?: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${taskId}/abandon`, { reason });
  }

  /**
   * 转移任务
   */
  async transferTask(taskId: string, newOperatorId: string, newOperatorName: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${taskId}/transfer`, {
      newOperatorId,
      newOperatorName,
    });
  }

  /**
   * 请求质检
   */
  async requestQc(taskId: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${taskId}/request-qc`);
  }

  /**
   * 报告异常
   */
  async reportAnomaly(taskId: string, anomalyType: string, anomalyDescription: string): Promise<void> {
    await apiClient.put<void>(`/pad-execution/${taskId}/report-anomaly`, {
      anomalyType,
      anomalyDescription,
    });
  }

  /**
   * 获取SOP（标准作业程序）
   */
  async getSOP(stepCode: string): Promise<{
    stepCode: string;
    stepName: string;
    sopContent: string;
    sopImages?: string[];
    videos?: string[];
  }> {
    const response = await apiClient.get<{
      stepCode: string;
      stepName: string;
      sopContent: string;
      sopImages?: string[];
      videos?: string[];
    }>('/pad-execution/sop', {
      params: { stepCode },
    });
    return (response as any).data;
  }
}

// 导出API服务单例
export const padExecutionApi = new PadApiService();
