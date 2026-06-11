/**
 * MRB评审模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  MrbReview,
  MrbReviewQuery,
  CreateMrbReviewDTO,
  UpdateMrbReviewDTO,
  MrbReviewBatchAction,
  MrbReviewRecord,
} from './types';

/**
 * MRB评审API服务类
 * 封装所有MRB评审相关的API调用
 */
class MrbApiService {
  /**
   * 分页查询MRB评审单列表
   */
  async getMrbReviews(query: MrbReviewQuery): Promise<PageResult<MrbReview>> {
    return await apiClient.get<PageResult<MrbReview>>(
      '/mrb-review/page',
      { params: query }
    );
  }

  /**
   * 获取所有MRB评审单列表（不分页）
   */
  async getAllMrbReviews(): Promise<MrbReview[]> {
    return await apiClient.get<MrbReview[]>('/mrb-review/list');
  }

  /**
   * 根据ID获取MRB评审单详情
   */
  async getMrbReviewById(id: string): Promise<MrbReview> {
    return await apiClient.get<MrbReview>(`/mrb-review/${id}`);
  }

  /**
   * 创建MRB评审单
   */
  async createMrbReview(data: CreateMrbReviewDTO): Promise<MrbReview> {
    return await apiClient.post<MrbReview>('/mrb-review', data);
  }

  /**
   * 更新MRB评审单
   */
  async updateMrbReview(data: UpdateMrbReviewDTO): Promise<MrbReview> {
    return await apiClient.put<MrbReview>('/mrb-review', data);
  }

  /**
   * 批量操作MRB评审单
   */
  async batchMrbReviews(action: MrbReviewBatchAction): Promise<void> {
    await apiClient.put<void>('/mrb-review/batch', action);
  }

  /**
   * 开始评审
   */
  async startReview(id: string, reviewer: string): Promise<void> {
    await apiClient.put<void>(`/mrb-review/${id}/start`, { reviewer });
  }

  /**
   * 批准评审
   */
  async approveReview(id: string, dispositionResult: string, dispositionRemark: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/mrb-review/${id}/approve`, {
      dispositionResult,
      dispositionRemark,
      approver,
    });
  }

  /**
   * 拒绝评审
   */
  async rejectReview(id: string, reason: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/mrb-review/${id}/reject`, { reason, approver });
  }

  /**
   * 关闭评审
   */
  async closeReview(id: string): Promise<void> {
    await apiClient.put<void>(`/mrb-review/${id}/close`);
  }

  /**
   * 更新评审状态
   */
  async updateStatus(ids: string[], status: string): Promise<void> {
    await apiClient.put<void>('/mrb-review/status', { ids, status });
  }

  /**
   * 获取评审记录
   */
  async getReviewRecords(mrbId: string): Promise<MrbReviewRecord[]> {
    return await apiClient.get<MrbReviewRecord[]>(`/mrb-review/${mrbId}/records`);
  }

  /**
   * 添加评审记录
   */
  async addReviewRecord(mrbId: string, record: Omit<MrbReviewRecord, 'id' | 'mrbId'>): Promise<void> {
    await apiClient.post<void>(`/mrb-review/${mrbId}/record`, record);
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    pendingCount: number;
    inReviewCount: number;
    approvedCount: number;
    rejectedCount: number;
    closedCount: number;
    defectLevelStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      pendingCount: number;
      inReviewCount: number;
      approvedCount: number;
      rejectedCount: number;
      closedCount: number;
      defectLevelStats: Record<string, number>;
    }>('/mrb-review/statistics');
    return (response as any).data;
  }
}

// 导出API服务单例
export const mrbApi = new MrbApiService();
