/**
 * 质量放行模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  QualityRelease,
  QualityReleaseQuery,
  CreateQualityReleaseDTO,
  UpdateQualityReleaseDTO,
  QualityReleaseBatchAction,
} from './types';

/**
 * 质量放行API服务类
 * 封装所有质量放行相关的API调用
 */
class QualityReleaseApiService {
  /**
   * 分页查询质量放行单列表
   */
  async getQualityReleases(query: QualityReleaseQuery): Promise<PageResult<QualityRelease>> {
    return await apiClient.get<PageResult<QualityRelease>>(
      '/quality-release/page',
      { params: query }
    );
  }

  /**
   * 获取所有质量放行单列表（不分页）
   */
  async getAllQualityReleases(): Promise<QualityRelease[]> {
    return await apiClient.get<QualityRelease[]>('/quality-release/list');
  }

  /**
   * 根据ID获取质量放行单详情
   */
  async getQualityReleaseById(id: string): Promise<QualityRelease> {
    return await apiClient.get<QualityRelease>(`/quality-release/${id}`);
  }

  /**
   * 创建质量放行单
   */
  async createQualityRelease(data: CreateQualityReleaseDTO): Promise<QualityRelease> {
    return await apiClient.post<QualityRelease>('/quality-release', data);
  }

  /**
   * 更新质量放行单
   */
  async updateQualityRelease(data: UpdateQualityReleaseDTO): Promise<QualityRelease> {
    return await apiClient.put<QualityRelease>('/quality-release', data);
  }

  /**
   * 批量操作质量放行单
   */
  async batchQualityReleases(action: QualityReleaseBatchAction): Promise<void> {
    await apiClient.put<void>('/quality-release/batch', action);
  }

  /**
   * 批准放行
   */
  async approveRelease(id: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/quality-release/${id}/approve`, { approver });
  }

  /**
   * 拒绝放行
   */
  async rejectRelease(id: string, reason: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/quality-release/${id}/reject`, { reason, approver });
  }

  /**
   * 取消放行
   */
  async cancelRelease(id: string): Promise<void> {
    await apiClient.put<void>(`/quality-release/${id}/cancel`);
  }

  /**
   * 更新放行状态
   */
  async updateStatus(ids: string[], status: string): Promise<void> {
    await apiClient.put<void>('/quality-release/status', { ids, status });
  }

  /**
   * 从质检单生成放行单
   */
  async generateFromInspection(inspectionId: string): Promise<QualityRelease> {
    return await apiClient.post<QualityRelease>(
      `/quality-release/generate-from-inspection/${inspectionId}`,
      {}
    );
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    cancelledCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      pendingCount: number;
      approvedCount: number;
      rejectedCount: number;
      cancelledCount: number;
      typeStats: Record<string, number>;
    }>('/quality-release/statistics');
    return (response as any).data;
  }

  /**
   * 生成放行证书
   */
  async generateCertificate(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/quality-release/${id}/certificate`, {
      responseType: 'blob',
    });
  }
}

// 导出API服务单例
export const qualityReleaseApi = new QualityReleaseApiService();
