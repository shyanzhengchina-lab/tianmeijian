/**
 * EBR列表模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  Ebr,
  EbrQuery,
  CreateEbrDTO,
  UpdateEbrDTO,
  EbrBatchAction,
} from './types';

/**
 * EBR列表API服务类
 * 封装所有EBR相关的API调用
 */
class EbrApiService {
  /**
   * 分页查询EBR列表
   */
  async getEbrs(query: EbrQuery): Promise<PageResult<Ebr>> {
    return await apiClient.get<PageResult<Ebr>>(
      '/ebr/page',
      { params: query }
    );
  }

  /**
   * 获取所有EBR列表（不分页）
   */
  async getAllEbrs(): Promise<Ebr[]> {
    return await apiClient.get<Ebr[]>('/ebr/list');
  }

  /**
   * 根据ID获取EBR详情
   */
  async getEbrById(id: string): Promise<Ebr> {
    return await apiClient.get<Ebr>(`/ebr/${id}`);
  }

  /**
   * 创建EBR
   */
  async createEbr(data: CreateEbrDTO): Promise<Ebr> {
    return await apiClient.post<Ebr>('/ebr', data);
  }

  /**
   * 更新EBR
   */
  async updateEbr(data: UpdateEbrDTO): Promise<Ebr> {
    return await apiClient.put<Ebr>('/ebr', data);
  }

  /**
   * 批量操作EBR
   */
  async batchEbrs(action: EbrBatchAction): Promise<void> {
    await apiClient.put<void>('/ebr/batch', action);
  }

  /**
   * 开始EBR
   */
  async startEbr(id: string): Promise<void> {
    await apiClient.put<void>(`/ebr/${id}/start`);
  }

  /**
   * 完成EBR
   */
  async completeEbr(id: string, actualQty: number, qualifiedQty: number): Promise<void> {
    await apiClient.put<void>(`/ebr/${id}/complete`, {
      actualQty,
      qualifiedQty,
    });
  }

  /**
   * 关闭EBR
   */
  async closeEbr(id: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/ebr/${id}/close`, { approver });
  }

  /**
   * 取消EBR
   */
  async cancelEbr(id: string, reason?: string): Promise<void> {
    await apiClient.put<void>(`/ebr/${id}/cancel`, { reason });
  }

  /**
   * 批准EBR
   */
  async approveEbr(id: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/ebr/${id}/approve`, { approver });
  }

  /**
   * 更新EBR状态
   */
  async updateStatus(ids: string[], status: string): Promise<void> {
    await apiClient.put<void>('/ebr/status', { ids, status });
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    createdCount: number;
    inProgressCount: number;
    completedCount: number;
    closedCount: number;
    cancelledCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      createdCount: number;
      inProgressCount: number;
      completedCount: number;
      closedCount: number;
      cancelledCount: number;
      typeStats: Record<string, number>;
    }>('/ebr/statistics');
    return (response as any).data;
  }

  /**
   * 导出EBR
   */
  async exportEbr(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/ebr/${id}/export`, {
      responseType: 'blob',
    });
  }

  /**
   * 生成EBR报告
   */
  async generateReport(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/ebr/${id}/report`, {
      responseType: 'blob',
    });
  }
}

// 导出API服务单例
export const ebrApi = new EbrApiService();
