/**
 * 设备档案模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  EquipRecord,
  EquipmentQuery,
  CreateEquipmentDTO,
  UpdateEquipmentDTO,
  EquipmentBatchAction,
} from './types';

/**
 * 设备API服务类
 * 封装所有设备相关的API调用
 */
class EquipmentApiService {
  /**
   * 分页查询设备列表
   */
  async getEquipments(query: EquipmentQuery): Promise<PageResult<EquipRecord>> {
    return await apiClient.get<PageResult<EquipRecord>>(
      '/equipment/page',
      { params: query }
    );
  }

  /**
   * 获取所有设备列表（不分页）
   */
  async getAllEquipments(): Promise<EquipRecord[]> {
    return await apiClient.get<EquipRecord[]>('/equipment/list');
  }

  /**
   * 根据ID获取设备详情
   */
  async getEquipmentById(id: string): Promise<EquipRecord> {
    return await apiClient.get<EquipRecord>(`/equipment/${id}`);
  }

  /**
   * 根据编码获取设备
   */
  async getEquipmentByCode(equipCode: string): Promise<EquipRecord> {
    return await apiClient.get<EquipRecord>('/equipment/byCode', {
      params: { equipCode },
    });
  }

  /**
   * 创建设备
   */
  async createEquipment(data: CreateEquipmentDTO): Promise<EquipRecord> {
    return await apiClient.post<EquipRecord>('/equipment', data);
  }

  /**
   * 更新设备
   */
  async updateEquipment(data: UpdateEquipmentDTO): Promise<EquipRecord> {
    return await apiClient.put<EquipRecord>('/equipment', data);
  }

  /**
   * 批量删除设备
   */
  async deleteEquipments(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/equipment', { data: ids });
  }

  /**
   * 批量操作设备
   */
  async batchEquipments(action: EquipmentBatchAction): Promise<void> {
    await apiClient.put<void>('/equipment/batch', action);
  }

  /**
   * 启用设备
   */
  async activateEquipment(id: string): Promise<void> {
    await apiClient.put<void>(`/equipment/${id}/activate`);
  }

  /**
   * 停用设备
   */
  async deactivateEquipment(id: string): Promise<void> {
    await apiClient.put<void>(`/equipment/${id}/deactivate`);
  }

  /**
   * 报废设备
   */
  async scrapEquipment(id: string): Promise<void> {
    await apiClient.put<void>(`/equipment/${id}/scrap`);
  }

  /**
   * 设置设备保养状态
   */
  async setMaintenance(id: string): Promise<void> {
    await apiClient.put<void>(`/equipment/${id}/maintenance`);
  }

  /**
   * 取消设备保养状态
   */
  async unsetMaintenance(id: string): Promise<void> {
    await apiClient.put<void>(`/equipment/${id}/unMaintenance`);
  }

  /**
   * 更新设备状态
   */
  async updateStatus(ids: string[], status: 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'FAULT' | 'SCRAPPED' | 'DISABLED'): Promise<void> {
    await apiClient.put<void>('/equipment/status', { ids, status });
  }

  /**
   * 检查设备编码是否存在
   */
  async checkCodeExists(equipCode: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/equipment/checkCode', {
      params: { equipCode, excludeId },
    });
  }

  /**
   * 获取设备统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    activeCount: number;
    idleCount: number;
    maintenanceCount: number;
    faultCount: number;
    scrappedCount: number;
    disabledCount: number;
    categoryStats: Record<string, number>;
    avgOee: number;
    overdueMaintCount: number;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      activeCount: number;
      idleCount: number;
      maintenanceCount: number;
      faultCount: number;
      scrappedCount: number;
      disabledCount: number;
      categoryStats: Record<string, number>;
      avgOee: number;
      overdueMaintCount: number;
    }>('/equipment/statistics');
    return (response as any).data;
  }

  /**
   * 获取工作中心关联的设备
   */
  async getEquipmentsByWorkCenter(workCenter: string): Promise<EquipRecord[]> {
    return await apiClient.get<EquipRecord[]>('/equipment/byWorkCenter', {
      params: { workCenter },
    });
  }

  /**
   * 获取设备OEE数据
   */
  async getOeeData(id: string, startDate: string, endDate: string): Promise<any> {
    return await apiClient.get<any>(`/equipment/${id}/oee`, {
      params: { startDate, endDate },
    });
  }

  /**
   * 导入设备
   */
  async importEquipments(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/equipment/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出设备
   */
  async exportEquipments(query: EquipmentQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/equipment/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取设备二维码
   */
  async getQrCode(id: string): Promise<string> {
    const response = await apiClient.get<{ qrCode: string }>(`/equipment/${id}/qrCode`);
    return (response as any).data.qrCode;
  }

  /**
   * 上传设备附件
   */
  async uploadAttachment(id: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ url: string }>(
      `/equipment/${id}/attachment`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return (response as any).data.url;
  }

  /**
   * 删除设备附件
   */
  async deleteAttachment(id: string, fileName: string): Promise<void> {
    await apiClient.delete<void>(`/equipment/${id}/attachment/${fileName}`);
  }
}

// 导出API服务单例
export const equipmentApi = new EquipmentApiService();
