/**
 * 批生产浮票模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  FloatTicket,
  FloatTicketQuery,
  CreateFloatTicketDTO,
  UpdateFloatTicketDTO,
  FloatTicketBatchAction,
  FloatTicketStepRecord,
  FloatTicketMaterialUsage,
  FloatTicketQcRecord,
} from './types';

/**
 * 批生产浮票API服务类
 * 封装所有批生产浮票相关的API调用
 */
class FloatTicketApiService {
  /**
   * 分页查询批生产浮票列表
   */
  async getFloatTickets(query: FloatTicketQuery): Promise<PageResult<FloatTicket>> {
    return await apiClient.get<PageResult<FloatTicket>>(
      '/float-ticket/page',
      { params: query }
    );
  }

  /**
   * 获取所有批生产浮票列表（不分页）
   */
  async getAllFloatTickets(): Promise<FloatTicket[]> {
    return await apiClient.get<FloatTicket[]>('/float-ticket/list');
  }

  /**
   * 根据ID获取批生产浮票详情
   */
  async getFloatTicketById(id: string): Promise<FloatTicket> {
    return await apiClient.get<FloatTicket>(`/float-ticket/${id}`);
  }

  /**
   * 根据浮票号获取批生产浮票
   */
  async getFloatTicketByNo(ticketNo: string): Promise<FloatTicket> {
    return await apiClient.get<FloatTicket>('/float-ticket/byNo', {
      params: { ticketNo },
    });
  }

  /**
   * 创建批生产浮票
   */
  async createFloatTicket(data: CreateFloatTicketDTO): Promise<FloatTicket> {
    return await apiClient.post<FloatTicket>('/float-ticket', data);
  }

  /**
   * 更新批生产浮票
   */
  async updateFloatTicket(data: UpdateFloatTicketDTO): Promise<FloatTicket> {
    return await apiClient.put<FloatTicket>('/float-ticket', data);
  }

  /**
   * 批量删除批生产浮票
   */
  async deleteFloatTickets(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/float-ticket', { data: ids });
  }

  /**
   * 批量操作批生产浮票
   */
  async batchFloatTickets(action: FloatTicketBatchAction): Promise<void> {
    await apiClient.put<void>('/float-ticket/batch', action);
  }

  /**
   * 发布批生产浮票
   */
  async releaseFloatTicket(id: string): Promise<void> {
    await apiClient.put<void>(`/float-ticket/${id}/release`);
  }

  /**
   * 开始批生产浮票
   */
  async startFloatTicket(id: string): Promise<void> {
    await apiClient.put<void>(`/float-ticket/${id}/start`);
  }

  /**
   * 完成批生产浮票
   */
  async completeFloatTicket(id: string): Promise<void> {
    await apiClient.put<void>(`/float-ticket/${id}/complete`);
  }

  /**
   * 取消批生产浮票
   */
  async cancelFloatTicket(id: string, reason?: string): Promise<void> {
    await apiClient.put<void>(`/float-ticket/${id}/cancel`, { reason });
  }

  /**
   * 更新浮票状态
   */
  async updateStatus(ids: string[], status: string): Promise<void> {
    await apiClient.put<void>('/float-ticket/status', { ids, status });
  }

  /**
   * 流转到下一工序
   */
  async transferToNextStep(id: string): Promise<void> {
    await apiClient.put<void>(`/float-ticket/${id}/transfer`);
  }

  /**
   * 检查浮票号是否存在
   */
  async checkTicketNoExists(ticketNo: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/float-ticket/checkTicketNo', {
      params: { ticketNo, excludeId },
    });
  }

  /**
   * 获取批生产浮票统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    createdCount: number;
    releasedCount: number;
    inProcessCount: number;
    qcPendingCount: number;
    completedCount: number;
    cancelledCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      createdCount: number;
      releasedCount: number;
      inProcessCount: number;
      qcPendingCount: number;
      completedCount: number;
      cancelledCount: number;
      typeStats: Record<string, number>;
    }>('/float-ticket/statistics');
    return (response as any).data;
  }

  /**
   * 导入批生产浮票
   */
  async importFloatTickets(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/float-ticket/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出批生产浮票
   */
  async exportFloatTickets(query: FloatTicketQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/float-ticket/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 从工单生成浮票
   */
  async generateFromWO(woId: string, batchNo: string, lotNo?: string): Promise<FloatTicket[]> {
    return await apiClient.post<FloatTicket[]>(`/float-ticket/generate-from-wo/${woId}`, {
      batchNo,
      lotNo,
    });
  }

  /**
   * 获取浮票工序执行记录
   */
  async getStepRecords(ticketId: string): Promise<FloatTicketStepRecord[]> {
    return await apiClient.get<FloatTicketStepRecord[]>(`/float-ticket/${ticketId}/steps`);
  }

  /**
   * 添加浮票工序执行记录
   */
  async addStepRecord(ticketId: string, record: Omit<FloatTicketStepRecord, 'id' | 'ticketId'>): Promise<void> {
    await apiClient.post<void>(`/float-ticket/${ticketId}/step`, record);
  }

  /**
   * 更新浮票工序执行记录
   */
  async updateStepRecord(ticketId: string, record: FloatTicketStepRecord): Promise<void> {
    await apiClient.put<void>(`/float-ticket/${ticketId}/step`, record);
  }

  /**
   * 完成工序
   */
  async completeStep(ticketId: string, stepCode: string, outputQty: number, qualifiedQty: number): Promise<void> {
    await apiClient.put<void>(`/float-ticket/${ticketId}/step/${stepCode}/complete`, {
      outputQty,
      qualifiedQty,
    });
  }

  /**
   * 获取浮票物料使用记录
   */
  async getMaterialUsages(ticketId: string): Promise<FloatTicketMaterialUsage[]> {
    return await apiClient.get<FloatTicketMaterialUsage[]>(`/float-ticket/${ticketId}/materials`);
  }

  /**
   * 添加浮票物料使用记录
   */
  async addMaterialUsage(ticketId: string, usage: Omit<FloatTicketMaterialUsage, 'id' | 'ticketId'>): Promise<void> {
    await apiClient.post<void>(`/float-ticket/${ticketId}/material`, usage);
  }

  /**
   * 获取浮票质检记录
   */
  async getQcRecords(ticketId: string): Promise<FloatTicketQcRecord[]> {
    return await apiClient.get<FloatTicketQcRecord[]>(`/float-ticket/${ticketId}/qc-records`);
  }

  /**
   * 添加浮票质检记录
   */
  async addQcRecord(ticketId: string, record: Omit<FloatTicketQcRecord, 'id' | 'ticketId'>): Promise<void> {
    await apiClient.post<void>(`/float-ticket/${ticketId}/qc-record`, record);
  }

  /**
   * 提交质检
   */
  async submitQc(ticketId: string, result: string, resultDetails: string): Promise<void> {
    await apiClient.put<void>(`/float-ticket/${ticketId}/qc-submit`, {
      result,
      resultDetails,
    });
  }

  /**
   * 获取浮票流转轨迹
   */
  async getTransferHistory(ticketId: string): Promise<{
    time: string;
    workcenter: string;
    operator: string;
    action: string;
    remark?: string;
  }[]> {
    const response = await apiClient.get<{
      time: string;
      workcenter: string;
      operator: string;
      action: string;
      remark?: string;
    }[]>(`/float-ticket/${ticketId}/transfer-history`);
    return (response as any).data;
  }

  /**
   * 打印浮票
   */
  async printFloatTicket(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/float-ticket/${id}/print`, {
      responseType: 'blob',
    });
  }

  /**
   * 打印浮票标签
   */
  async printFloatTicketLabel(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/float-ticket/${id}/print-label`, {
      responseType: 'blob',
    });
  }
}

// 导出API服务单例
export const floatTicketApi = new FloatTicketApiService();
