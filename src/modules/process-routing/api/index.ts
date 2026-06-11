/**
 * 工艺路径模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  ProcessRouting,
  ProcessRoutingQuery,
  CreateProcessRoutingDTO,
  UpdateProcessRoutingDTO,
  ProcessRoutingBatchAction,
  CopyProcessRoutingDTO,
  PublishProcessRoutingDTO,
  ProcessRoutingStatistics,
} from '../types';

/**
 * 工艺路径API服务类
 * 封装所有工艺路径相关的API调用
 */
class ProcessRoutingApiService {
  /**
   * 分页查询工艺路径列表
   */
  async getProcessRoutings(query: ProcessRoutingQuery): Promise<PageResult<ProcessRouting>> {
    return await apiClient.get<PageResult<ProcessRouting>>(
      '/process-routing/page',
      { params: query }
    );
  }

  /**
   * 获取所有工艺路径列表（不分页）
   */
  async getAllProcessRoutings(): Promise<ProcessRouting[]> {
    return await apiClient.get<ProcessRouting[]>('/process-routing/list');
  }

  /**
   * 根据ID获取工艺路径详情
   */
  async getProcessRoutingById(id: string): Promise<ProcessRouting> {
    return await apiClient.get<ProcessRouting>(`/process-routing/${id}`);
  }

  /**
   * 根据编码获取工艺路径
   */
  async getProcessRoutingByCode(routingCode: string): Promise<ProcessRouting> {
    return await apiClient.get<ProcessRouting>('/process-routing/byCode', {
      params: { routingCode },
    });
  }

  /**
   * 根据物料ID获取工艺路径
   */
  async getProcessRoutingByMaterial(materialId: string): Promise<ProcessRouting[]> {
    return await apiClient.get<ProcessRouting[]>('/process-routing/byMaterial', {
      params: { materialId },
    });
  }

  /**
   * 创建工艺路径
   */
  async createProcessRouting(data: CreateProcessRoutingDTO): Promise<ProcessRouting> {
    return await apiClient.post<ProcessRouting>('/process-routing', data);
  }

  /**
   * 更新工艺路径
   */
  async updateProcessRouting(data: UpdateProcessRoutingDTO): Promise<ProcessRouting> {
    return await apiClient.put<ProcessRouting>('/process-routing', data);
  }

  /**
   * 批量操作工艺路径
   */
  async batchProcessRoutings(action: ProcessRoutingBatchAction): Promise<void> {
    await apiClient.put<void>('/process-routing/batch', action);
  }

  /**
   * 复制工艺路径
   */
  async copyProcessRouting(data: CopyProcessRoutingDTO): Promise<ProcessRouting> {
    return await apiClient.post<ProcessRouting>(
      `/process-routing/${data.sourceId}/copy`,
      data
    );
  }

  /**
   * 发布工艺路径
   */
  async publishProcessRouting(data: PublishProcessRoutingDTO): Promise<void> {
    await apiClient.put<void>(`/process-routing/${data.id}/publish`, data);
  }

  /**
   * 作废工艺路径
   */
  async obsoleteProcessRouting(id: string): Promise<void> {
    await apiClient.put<void>(`/process-routing/${id}/obsolete`);
  }

  /**
   * 启用工艺路径
   */
  async enableProcessRouting(id: string): Promise<void> {
    await apiClient.put<void>(`/process-routing/${id}/enable`);
  }

  /**
   * 禁用工艺路径
   */
  async disableProcessRouting(id: string): Promise<void> {
    await apiClient.put<void>(`/process-routing/${id}/disable`);
  }

  /**
   * 更新工艺路径状态
   */
  async updateStatus(ids: string[], status: 'DRAFT' | 'PUBLISHED' | 'OBSOLETE' | 'DISABLED'): Promise<void> {
    await apiClient.put<void>('/process-routing/status', { ids, status });
  }

  /**
   * 检查工艺路径编码是否存在
   */
  async checkRoutingCodeExists(routingCode: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/process-routing/checkCode', {
      params: { routingCode, excludeId },
    });
  }

  /**
   * 获取工艺路径统计信息
   */
  async getStatistics(): Promise<ProcessRoutingStatistics> {
    return await apiClient.get<ProcessRoutingStatistics>('/process-routing/statistics');
  }

  /**
   * 获取工艺路径版本历史
   */
  async getVersionHistory(routingCode: string): Promise<ProcessRouting[]> {
    return await apiClient.get<ProcessRouting[]>(`/process-routing/${routingCode}/versions`);
  }

  /**
   * 导入工艺路径
   */
  async importProcessRoutings(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/process-routing/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出工艺路径
   */
  async exportProcessRoutings(query: ProcessRoutingQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/process-routing/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取可用工序列表
   */
  async getAvailableOperations(): Promise<any[]> {
    return await apiClient.get<any[]>('/process-routing/available-operations');
  }

  /**
   * 获取可用工作中心列表
   */
  async getAvailableWorkCenters(): Promise<any[]> {
    return await apiClient.get<any[]>('/process-routing/available-workcenters');
  }

  /**
   * 验证工艺路径
   */
  async validateProcessRouting(id: string): Promise<{ valid: boolean; errors: string[] }> {
    return await apiClient.post<{ valid: boolean; errors: string[] }>(
      `/process-routing/${id}/validate`
    );
  }

  /**
   * 获取工艺路径对比
   */
  async compareRoutings(sourceId: string, targetId: string): Promise<any> {
    return await apiClient.get<any>('/process-routing/compare', {
      params: { sourceId, targetId },
    });
  }
}

// 导出API服务单例
export const processRoutingApi = new ProcessRoutingApiService();
