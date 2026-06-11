/**
 * 质检项目模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  QcItem,
  QcItemQuery,
  CreateQcItemDTO,
  UpdateQcItemDTO,
  QcItemBatchAction,
} from './types';

/**
 * 质检项目API服务类
 * 封装所有质检项目相关的API调用
 */
class QcItemApiService {
  /**
   * 分页查询质检项目列表
   */
  async getQcItems(query: QcItemQuery): Promise<PageResult<QcItem>> {
    return await apiClient.get<PageResult<QcItem>>(
      '/qc-item/page',
      { params: query }
    );
  }

  /**
   * 获取所有质检项目列表（不分页）
   */
  async getAllQcItems(): Promise<QcItem[]> {
    return await apiClient.get<QcItem[]>('/qc-item/list');
  }

  /**
   * 根据ID获取质检项目详情
   */
  async getQcItemById(id: string): Promise<QcItem> {
    return await apiClient.get<QcItem>(`/qc-item/${id}`);
  }

  /**
   * 根据编码获取质检项目
   */
  async getQcItemByCode(itemCode: string): Promise<QcItem> {
    return await apiClient.get<QcItem>('/qc-item/byCode', {
      params: { itemCode },
    });
  }

  /**
   * 创建质检项目
   */
  async createQcItem(data: CreateQcItemDTO): Promise<QcItem> {
    return await apiClient.post<QcItem>('/qc-item', data);
  }

  /**
   * 更新质检项目
   */
  async updateQcItem(data: UpdateQcItemDTO): Promise<QcItem> {
    return await apiClient.put<QcItem>('/qc-item', data);
  }

  /**
   * 批量删除质检项目
   */
  async deleteQcItems(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/qc-item', { data: ids });
  }

  /**
   * 批量操作质检项目
   */
  async batchQcItems(action: QcItemBatchAction): Promise<void> {
    await apiClient.put<void>('/qc-item/batch', action);
  }

  /**
   * 启用质检项目
   */
  async activateQcItem(id: string): Promise<void> {
    await apiClient.put<void>(`/qc-item/${id}/activate`);
  }

  /**
   * 停用质检项目
   */
  async deactivateQcItem(id: string): Promise<void> {
    await apiClient.put<void>(`/qc-item/${id}/deactivate`);
  }

  /**
   * 更新质检项目状态
   */
  async updateStatus(ids: string[], status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'): Promise<void> {
    await apiClient.put<void>('/qc-item/status', { ids, status });
  }

  /**
   * 检查项目编码是否存在
   */
  async checkCodeExists(itemCode: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/qc-item/checkCode', {
      params: { itemCode, excludeId },
    });
  }

  /**
   * 获取质检项目统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    draftCount: number;
    categoryStats: Record<string, number>;
    standardTypeStats: Record<string, number>;
    criticalCount: number;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      activeCount: number;
      inactiveCount: number;
      draftCount: number;
      categoryStats: Record<string, number>;
      standardTypeStats: Record<string, number>;
      criticalCount: number;
    }>('/qc-item/statistics');
    return (response as any).data;
  }

  /**
   * 根据大类获取质检项目
   */
  async getQcItemsByCategory(category: string): Promise<QcItem[]> {
    return await apiClient.get<QcItem[]>('/qc-item/byCategory', {
      params: { category },
    });
  }

  /**
   * 根据检验类型获取适用的质检项目
   */
  async getQcItemsByApplyType(applyType: string): Promise<QcItem[]> {
    return await apiClient.get<QcItem[]>('/qc-item/byApplyType', {
      params: { applyType },
    });
  }

  /**
   * 导入质检项目
   */
  async importQcItems(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/qc-item/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出质检项目
   */
  async exportQcItems(query: QcItemQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/qc-item/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取质检项目版本历史
   */
  async getVersionHistory(itemCode: string): Promise<QcItem[]> {
    return await apiClient.get<QcItem[]>(`/qc-item/${itemCode}/versions`);
  }

  /**
   * 复制质检项目
   */
  async copyQcItem(id: string, newItemCode: string): Promise<QcItem> {
    return await apiClient.post<QcItem>(`/qc-item/${id}/copy`, {
      newItemCode,
    });
  }
}

// 导出API服务单例
export const qcItemApi = new QcItemApiService();
