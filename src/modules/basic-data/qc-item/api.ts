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
   * 后端路径：/inspection-items/page（返回 {list, total, pageNum, pageSize}）
   */
  async getQcItems(query: QcItemQuery): Promise<PageResult<QcItem>> {
    return await apiClient.get<PageResult<QcItem>>(
      '/inspection-items/page',
      { params: query }
    );
  }

  /**
   * 获取所有质检项目列表（不分页）
   * 后端路径：/inspection-items/list（返回直接数组）
   */
  async getAllQcItems(): Promise<QcItem[]> {
    const res = await apiClient.get<any>('/inspection-items/list');
    // 后端返回 { code, data: [] }，apiClient 可能已解包 data
    if (Array.isArray(res)) return res as QcItem[];
    if (res && Array.isArray((res as any).data)) return (res as any).data as QcItem[];
    return [];
  }

  /**
   * 根据ID获取质检项目详情
   */
  async getQcItemById(id: string): Promise<QcItem> {
    return await apiClient.get<QcItem>(`/inspection-items/${id}`);
  }

  /**
   * 根据编码获取质检项目
   */
  async getQcItemByCode(itemCode: string): Promise<QcItem> {
    return await apiClient.get<QcItem>('/inspection-items/byCode', {
      params: { itemCode },
    });
  }

  /**
   * 创建质检项目
   */
  async createQcItem(data: CreateQcItemDTO): Promise<QcItem> {
    return await apiClient.post<QcItem>('/inspection-items/create', data);
  }

  /**
   * 更新质检项目
   */
  async updateQcItem(data: UpdateQcItemDTO): Promise<QcItem> {
    return await apiClient.put<QcItem>('/inspection-items/create', data);
  }

  /**
   * 批量删除质检项目
   */
  async deleteQcItems(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/inspection-items/create', { data: ids });
  }

  /**
   * 批量操作质检项目
   */
  async batchQcItems(action: QcItemBatchAction): Promise<void> {
    await apiClient.put<void>('/inspection-items/batch', action);
  }

  /**
   * 启用质检项目
   */
  async activateQcItem(id: string): Promise<void> {
    await apiClient.put<void>(`/inspection-items/${id}/activate`);
  }

  /**
   * 停用质检项目
   */
  async deactivateQcItem(id: string): Promise<void> {
    await apiClient.put<void>(`/inspection-items/${id}/deactivate`);
  }

  /**
   * 更新质检项目状态
   */
  async updateStatus(ids: string[], status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'): Promise<void> {
    await apiClient.put<void>('/inspection-items/status', { ids, status });
  }

  /**
   * 检查项目编码是否存在
   */
  async checkCodeExists(itemCode: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/inspection-items/checkCode', {
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
    }>('/inspection-items/statistics');
    return (response as any).data;
  }

  /**
   * 根据大类获取质检项目
   */
  async getQcItemsByCategory(category: string): Promise<QcItem[]> {
    return await apiClient.get<QcItem[]>('/inspection-items/byCategory', {
      params: { category },
    });
  }

  /**
   * 根据检验类型获取适用的质检项目
   */
  async getQcItemsByApplyType(applyType: string): Promise<QcItem[]> {
    return await apiClient.get<QcItem[]>('/inspection-items/byApplyType', {
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
      '/inspection-items/import',
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
    return await apiClient.get<Blob>('/inspection-items/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取质检项目版本历史
   */
  async getVersionHistory(itemCode: string): Promise<QcItem[]> {
    return await apiClient.get<QcItem[]>(`/inspection-items/${itemCode}/versions`);
  }

  /**
   * 复制质检项目
   */
  async copyQcItem(id: string, newItemCode: string): Promise<QcItem> {
    return await apiClient.post<QcItem>(`/inspection-items/${id}/copy`, {
      newItemCode,
    });
  }
}

// 导出API服务单例
export const qcItemApi = new QcItemApiService();
