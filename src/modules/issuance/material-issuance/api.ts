/**
 * 领料管理模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  MaterialIssuance,
  IssuanceQuery,
  CreateIssuanceDTO,
  UpdateIssuanceDTO,
  IssuanceBatchAction,
  IssuanceItem,
} from './types';

/**
 * 领料管理API服务类
 * 封装所有领料管理相关的API调用
 */
class MaterialIssuanceApiService {
  /**
   * 分页查询领料单列表
   */
  async getIssuances(query: IssuanceQuery): Promise<PageResult<MaterialIssuance>> {
    return await apiClient.get<PageResult<MaterialIssuance>>(
      '/material-issuance/page',
      { params: query }
    );
  }

  /**
   * 获取所有领料单列表（不分页）
   */
  async getAllIssuances(): Promise<MaterialIssuance[]> {
    return await apiClient.get<MaterialIssuance[]>('/material-issuance/list');
  }

  /**
   * 根据ID获取领料单详情
   */
  async getIssuanceById(id: string): Promise<MaterialIssuance> {
    return await apiClient.get<MaterialIssuance>(`/material-issuance/${id}`);
  }

  /**
   * 创建领料单
   */
  async createIssuance(data: CreateIssuanceDTO): Promise<MaterialIssuance> {
    return await apiClient.post<MaterialIssuance>('/material-issuance', data);
  }

  /**
   * 更新领料单
   */
  async updateIssuance(data: UpdateIssuanceDTO): Promise<MaterialIssuance> {
    return await apiClient.put<MaterialIssuance>('/material-issuance', data);
  }

  /**
   * 批量操作领料单
   */
  async batchIssuances(action: IssuanceBatchAction): Promise<void> {
    await apiClient.put<void>('/material-issuance/batch', action);
  }

  /**
   * 提交领料单
   */
  async submitIssuance(id: string): Promise<void> {
    await apiClient.put<void>(`/material-issuance/${id}/submit`);
  }

  /**
   * 批准领料单
   */
  async approveIssuance(id: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/material-issuance/${id}/approve`, { approver });
  }

  /**
   * 拒绝领料单
   */
  async rejectIssuance(id: string, reason: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/material-issuance/${id}/reject`, { reason, approver });
  }

  /**
   * 发料
   */
  async issueMaterial(id: string, issuedBy: string, items: { itemId: string; qty: number; batchNo?: string }[]): Promise<void> {
    await apiClient.put<void>(`/material-issuance/${id}/issue`, {
      issuedBy,
      items,
    });
  }

  /**
   * 取消领料单
   */
  async cancelIssuance(id: string, reason?: string): Promise<void> {
    await apiClient.put<void>(`/material-issuance/${id}/cancel`, { reason });
  }

  /**
   * 更新领料单状态
   */
  async updateStatus(ids: string[], status: string): Promise<void> {
    await apiClient.put<void>('/material-issuance/status', { ids, status });
  }

  /**
   * 获取领料明细
   */
  async getIssuanceItems(issuanceId: string): Promise<IssuanceItem[]> {
    return await apiClient.get<IssuanceItem[]>(`/material-issuance/${issuanceId}/items`);
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    draftCount: number;
    submittedCount: number;
    approvedCount: number;
    partialIssuedCount: number;
    completedCount: number;
    cancelledCount: number;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      draftCount: number;
      submittedCount: number;
      approvedCount: number;
      partialIssuedCount: number;
      completedCount: number;
      cancelledCount: number;
    }>('/material-issuance/statistics');
    return (response as any).data;
  }

  /**
   * 从工单生成领料单
   */
  async generateFromWO(workOrderId: string): Promise<MaterialIssuance> {
    return await apiClient.post<MaterialIssuance>(
      `/material-issuance/generate-from-wo/${workOrderId}`,
      {}
    );
  }
}

// 导出API服务单例
export const materialIssuanceApi = new MaterialIssuanceApiService();
