/**
 * 质检工作台模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  Inspection,
  InspectionQuery,
  CreateInspectionDTO,
  UpdateInspectionDTO,
  InspectionBatchAction,
  InspectionItem,
  InspectionStatistics,
} from './types';

/**
 * 质检工作台API服务类
 * 封装所有质检工作台相关的API调用
 */
class InspectionApiService {
  /**
   * 分页查询质检单列表
   */
  async getInspections(query: InspectionQuery): Promise<PageResult<Inspection>> {
    return await apiClient.get<PageResult<Inspection>>(
      '/inspection/page',
      { params: query }
    );
  }

  /**
   * 获取所有质检单列表（不分页）
   */
  async getAllInspections(): Promise<Inspection[]> {
    return await apiClient.get<Inspection[]>('/inspection/list');
  }

  /**
   * 根据ID获取质检单详情
   */
  async getInspectionById(id: string): Promise<Inspection> {
    return await apiClient.get<Inspection>(`/inspection/${id}`);
  }

  /**
   * 根据质检单号获取质检单
   */
  async getInspectionByNo(inspectionNo: string): Promise<Inspection> {
    return await apiClient.get<Inspection>('/inspection/byNo', {
      params: { inspectionNo },
    });
  }

  /**
   * 创建质检单
   */
  async createInspection(data: CreateInspectionDTO): Promise<Inspection> {
    return await apiClient.post<Inspection>('/inspection', data);
  }

  /**
   * 更新质检单
   */
  async updateInspection(data: UpdateInspectionDTO): Promise<Inspection> {
    return await apiClient.put<Inspection>('/inspection', data);
  }

  /**
   * 批量操作质检单
   */
  async batchInspections(action: InspectionBatchAction): Promise<void> {
    await apiClient.put<void>('/inspection/batch', action);
  }

  /**
   * 开始检验
   */
  async startInspection(id: string, inspector: string): Promise<void> {
    await apiClient.put<void>(`/inspection/${id}/start`, { inspector });
  }

  /**
   * 完成检验（合格）
   */
  async passInspection(id: string, resultDetails: string): Promise<void> {
    await apiClient.put<void>(`/inspection/${id}/pass`, { resultDetails });
  }

  /**
   * 完成检验（不合格）
   */
  async failInspection(id: string, resultDetails: string): Promise<void> {
    await apiClient.put<void>(`/inspection/${id}/fail`, { resultDetails });
  }

  /**
   * 完成检验（有条件）
   */
  async conditionalInspection(id: string, resultDetails: string): Promise<void> {
    await apiClient.put<void>(`/inspection/${id}/conditional`, { resultDetails });
  }

  /**
   * 更新质检状态
   */
  async updateStatus(ids: string[], status: string): Promise<void> {
    await apiClient.put<void>('/inspection/status', { ids, status });
  }

  /**
   * 分配检验员
   */
  async assignInspector(id: string, inspector: string): Promise<void> {
    await apiClient.put<void>(`/inspection/${id}/assign`, { inspector });
  }

  /**
   * 检查质检单号是否存在
   */
  async checkInspectionNoExists(inspectionNo: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/inspection/checkInspectionNo', {
      params: { inspectionNo, excludeId },
    });
  }

  /**
   * 获取质检单统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    pendingCount: number;
    inProgressCount: number;
    passedCount: number;
    failedCount: number;
    conditionalCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      pendingCount: number;
      inProgressCount: number;
      passedCount: number;
      failedCount: number;
      conditionalCount: number;
      typeStats: Record<string, number>;
    }>('/inspection/statistics');
    return (response as any).data;
  }

  /**
   * 导入质检单
   */
  async importInspections(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/inspection/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出质检单
   */
  async exportInspections(query: InspectionQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/inspection/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 从浮票生成质检单
   */
  async generateFromTicket(ticketId: string, qcSchemeId: string): Promise<Inspection> {
    return await apiClient.post<Inspection>(`/inspection/generate-from-ticket/${ticketId}`, {
      qcSchemeId,
    });
  }

  /**
   * 获取质检项目列表
   */
  async getInspectionItems(inspectionId: string): Promise<InspectionItem[]> {
    return await apiClient.get<InspectionItem[]>(`/inspection/${inspectionId}/items`);
  }

  /**
   * 添加质检项目
   */
  async addInspectionItem(inspectionId: string, item: Omit<InspectionItem, 'id' | 'inspectionId'>): Promise<void> {
    await apiClient.post<void>(`/inspection/${inspectionId}/item`, item);
  }

  /**
   * 批量添加质检项目
   */
  async addInspectionItems(inspectionId: string, items: Omit<InspectionItem, 'id' | 'inspectionId'>[]): Promise<void> {
    await apiClient.post<void>(`/inspection/${inspectionId}/items`, items);
  }

  /**
   * 更新质检项目
   */
  async updateInspectionItem(inspectionId: string, item: InspectionItem): Promise<void> {
    await apiClient.put<void>(`/inspection/${inspectionId}/item`, item);
  }

  /**
   * 删除质检项目
   */
  async deleteInspectionItem(inspectionId: string, itemId: string): Promise<void> {
    await apiClient.delete<void>(`/inspection/${inspectionId}/item/${itemId}`);
  }

  /**
   * 批量删除质检项目
   */
  async deleteInspectionItems(inspectionId: string, itemIds: string[]): Promise<void> {
    await apiClient.delete<void>(`/inspection/${inspectionId}/items`, { data: itemIds });
  }

  /**
   * 更新质检项目结果
   */
  async updateItemResult(inspectionId: string, itemId: string, result: string, actualValue?: string, deviation?: string, remark?: string): Promise<void> {
    await apiClient.put<void>(`/inspection/${inspectionId}/item/${itemId}/result`, {
      result,
      actualValue,
      deviation,
      remark,
    });
  }

  /**
   * 获取质检统计
   */
  async getInspectionStatistics(inspectionId: string): Promise<InspectionStatistics> {
    return await apiClient.get<InspectionStatistics>(`/inspection/${inspectionId}/statistics`);
  }

  /**
   * 上传附件
   */
  async uploadAttachment(inspectionId: string, itemId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ url: string }>(
      `/inspection/${inspectionId}/item/${itemId}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return (response as any).data.url;
  }

  /**
   * 删除附件
   */
  async deleteAttachment(inspectionId: string, itemId: string, attachmentUrl: string): Promise<void> {
    await apiClient.delete<void>(`/inspection/${inspectionId}/item/${itemId}/attachment`, {
      params: { attachmentUrl },
    });
  }

  /**
   * 生成质检报告
   */
  async generateReport(inspectionId: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/inspection/${inspectionId}/report`, {
      responseType: 'blob',
    });
  }

  /**
   * 获取检验员任务列表
   */
  async getInspectorTasks(inspectorId: string, status?: string): Promise<Inspection[]> {
    return await apiClient.get<Inspection[]>('/inspection/inspector-tasks', {
      params: { inspectorId, status },
    });
  }

  /**
   * 获取待质检任务
   */
  async getPendingTasks(): Promise<Inspection[]> {
    return await apiClient.get<Inspection[]>('/inspection/pending-tasks');
  }

  /**
   * 批量分配检验员
   */
  async batchAssignInspector(ids: string[], inspector: string): Promise<void> {
    await apiClient.put<void>('/inspection/batch-assign', { ids, inspector });
  }

  /**
   * 转交质检单
   */
  async transferInspection(id: string, newInspector: string, newInspectorName: string): Promise<void> {
    await apiClient.put<void>(`/inspection/${id}/transfer`, {
      newInspector,
      newInspectorName,
    });
  }

  /**
   * 生成检验记录卡
   */
  async generateRecordCard(inspectionId: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/inspection/${inspectionId}/record-card`, {
      responseType: 'blob',
    });
  }
}

// 导出API服务单例
export const inspectionApi = new InspectionApiService();
