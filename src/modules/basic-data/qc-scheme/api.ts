/**
 * 质检方案模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  QcScheme,
  QcSchemeQuery,
  CreateQcSchemeDTO,
  UpdateQcSchemeDTO,
  QcSchemeBatchAction,
} from './types';

/**
 * 质检方案API服务类
 * 封装所有质检方案相关的API调用
 */
class QcSchemeApiService {
  /**
   * 分页查询质检方案列表
   */
  async getQcSchemes(query: QcSchemeQuery): Promise<PageResult<QcScheme>> {
    return await apiClient.get<PageResult<QcScheme>>(
      '/qc-scheme/page',
      { params: query }
    );
  }

  /**
   * 获取所有质检方案列表（不分页）
   */
  async getAllQcSchemes(): Promise<QcScheme[]> {
    return await apiClient.get<QcScheme[]>('/qc-scheme/list');
  }

  /**
   * 根据ID获取质检方案详情（含检验项）
   */
  async getQcSchemeById(id: string): Promise<QcScheme> {
    return await apiClient.get<QcScheme>(`/qc-scheme/${id}`);
  }

  /**
   * 根据编码获取质检方案
   */
  async getQcSchemeByCode(schemeCode: string): Promise<QcScheme> {
    return await apiClient.get<QcScheme>('/qc-scheme/byCode', {
      params: { schemeCode },
    });
  }

  /**
   * 创建质检方案
   */
  async createQcScheme(data: CreateQcSchemeDTO): Promise<QcScheme> {
    return await apiClient.post<QcScheme>('/qc-scheme', data);
  }

  /**
   * 更新质检方案
   */
  async updateQcScheme(data: UpdateQcSchemeDTO): Promise<QcScheme> {
    return await apiClient.put<QcScheme>('/qc-scheme', data);
  }

  /**
   * 批量删除质检方案
   */
  async deleteQcSchemes(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/qc-scheme', { data: ids });
  }

  /**
   * 批量操作质检方案
   */
  async batchQcSchemes(action: QcSchemeBatchAction): Promise<void> {
    await apiClient.put<void>('/qc-scheme/batch', action);
  }

  /**
   * 启用质检方案
   */
  async activateQcScheme(id: string): Promise<void> {
    await apiClient.put<void>(`/qc-scheme/${id}/activate`);
  }

  /**
   * 停用质检方案
   */
  async deactivateQcScheme(id: string): Promise<void> {
    await apiClient.put<void>(`/qc-scheme/${id}/deactivate`);
  }

  /**
   * 批准质检方案
   */
  async approveQcScheme(id: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/qc-scheme/${id}/approve`, { approver });
  }

  /**
   * 更新质检方案状态
   */
  async updateStatus(ids: string[], status: 'DRAFT' | 'ACTIVE' | 'INACTIVE'): Promise<void> {
    await apiClient.put<void>('/qc-scheme/status', { ids, status });
  }

  /**
   * 检查方案编码是否存在
   */
  async checkCodeExists(schemeCode: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/qc-scheme/checkCode', {
      params: { schemeCode, excludeId },
    });
  }

  /**
   * 获取质检方案统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    draftCount: number;
    activeCount: number;
    inactiveCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      draftCount: number;
      activeCount: number;
      inactiveCount: number;
      typeStats: Record<string, number>;
    }>('/qc-scheme/statistics');
    return (response as any).data;
  }

  /**
   * 根据检验类型获取质检方案
   */
  async getQcSchemesByType(schemeType: string): Promise<QcScheme[]> {
    return await apiClient.get<QcScheme[]>('/qc-scheme/byType', {
      params: { schemeType },
    });
  }

  /**
   * 根据工序获取质检方案
   */
  async getQcSchemesByOperation(operationCode: string): Promise<QcScheme[]> {
    return await apiClient.get<QcScheme[]>('/qc-scheme/byOperation', {
      params: { operationCode },
    });
  }

  /**
   * 导入质检方案
   */
  async importQcSchemes(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/qc-scheme/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出质检方案
   */
  async exportQcSchemes(query: QcSchemeQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/qc-scheme/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 导出质检方案详情（含检验项）
   */
  async exportQcSchemeDetail(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/qc-scheme/${id}/export`, {
      responseType: 'blob',
    });
  }

  /**
   * 获取质检方案版本历史
   */
  async getVersionHistory(schemeCode: string): Promise<QcScheme[]> {
    return await apiClient.get<QcScheme[]>(`/qc-scheme/${schemeCode}/versions`);
  }

  /**
   * 复制质检方案
   */
  async copyQcScheme(id: string, newSchemeCode: string): Promise<QcScheme> {
    return await apiClient.post<QcScheme>(`/qc-scheme/${id}/copy`, {
      newSchemeCode,
    });
  }
}

// 导出API服务单例
export const qcSchemeApi = new QcSchemeApiService();
