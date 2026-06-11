/**
 * 工作中心模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse, PageResult } from '../../../shared/api/requestTypes';
import type {
  WorkCenter,
  WorkCenterQuery,
  CreateWorkCenterDTO,
  UpdateWorkCenterDTO,
  WorkCenterBatchAction,
} from './types';

/**
 * 工作中心API服务类
 * 封装所有工作中心相关的API调用
 */
class WorkCenterApiService {
  /**
   * 分页查询工作中心列表
   */
  async getWorkCenters(query: WorkCenterQuery): Promise<PageResult<WorkCenter>> {
    return await apiClient.get<PageResult<WorkCenter>>(
      '/workcenter/page',
      { params: query }
    );
  }

  /**
   * 获取所有工作中心列表（不分页）
   */
  async getAllWorkCenters(): Promise<WorkCenter[]> {
    return await apiClient.get<WorkCenter[]>('/workcenter/list');
  }

  /**
   * 根据ID获取工作中心详情
   */
  async getWorkCenterById(id: string): Promise<WorkCenter> {
    return await apiClient.get<WorkCenter>(`/workcenter/${id}`);
  }

  /**
   * 根据编码获取工作中心
   */
  async getWorkCenterByCode(wcCode: string): Promise<WorkCenter> {
    return await apiClient.get<WorkCenter>('/workcenter/byCode', {
      params: { wcCode },
    });
  }

  /**
   * 创建工作中心
   */
  async createWorkCenter(data: CreateWorkCenterDTO): Promise<WorkCenter> {
    return await apiClient.post<WorkCenter>('/workcenter', data);
  }

  /**
   * 更新工作中心
   */
  async updateWorkCenter(data: UpdateWorkCenterDTO): Promise<WorkCenter> {
    return await apiClient.put<WorkCenter>('/workcenter', data);
  }

  /**
   * 批量删除工作中心
   */
  async deleteWorkCenters(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/workcenter', { data: ids });
  }

  /**
   * 批量操作工作中心
   */
  async batchWorkCenters(action: WorkCenterBatchAction): Promise<void> {
    await apiClient.put<void>('/workcenter/batch', action);
  }

  /**
   * 更新工作中心状态
   */
  async updateStatus(ids: string[], status: 'ACTIVE' | 'DISABLED'): Promise<void> {
    await apiClient.put<void>('/workcenter/status', { ids, status });
  }

  /**
   * 设置整修状态
   */
  async setMaintenance(id: string): Promise<void> {
    await apiClient.put<void>(`/workcenter/${id}/setMaintenance`, {});
  }

  /**
   * 取消整修状态
   */
  async unsetMaintenance(id: string): Promise<void> {
    await apiClient.put<void>(`/workcenter/${id}/unsetMaintenance`, {});
  }

  /**
   * 获取按车间分组的工作中心列表
   */
  async getWorkCentersByWorkshop(): Promise<Record<string, WorkCenter[]>> {
    return await apiClient.get<Record<string, WorkCenter[]>>(
      '/workcenter/byWorkshop'
    );
  }

  /**
   * 检查工作中心编码是否存在
   */
  async checkCodeExists(wcCode: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/workcenter/checkCode', {
      params: { wcCode, excludeId },
    });
  }

  /**
   * 导入工作中心
   */
  async importWorkCenters(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/workcenter/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出工作中心
   */
  async exportWorkCenters(query: WorkCenterQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/workcenter/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取工作中心统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    activeCount: number;
    disabledCount: number;
    maintenanceCount: number;
    categoryStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      activeCount: number;
      disabledCount: number;
      maintenanceCount: number;
      categoryStats: Record<string, number>;
    }>('/workcenter/statistics');
    return (response as any).data;
  }

  /**
   * 更新工作中心负责人
   */
  async updateLeader(id: string, leader: string): Promise<void> {
    await apiClient.put<void>(`/workcenter/${id}/leader`, { leader });
  }

  /**
   * 获取工作中心设备列表
   */
  async getEquipment(id: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/workcenter/${id}/equipment`);
  }

  /**
   * 添加设备到工作中心
   */
  async addEquipment(id: string, equipmentId: string): Promise<void> {
    await apiClient.post<void>(`/workcenter/${id}/equipment`, { equipmentId });
  }

  /**
   * 从工作中心移除设备
   */
  async removeEquipment(id: string, equipmentId: string): Promise<void> {
    await apiClient.delete<void>(`/workcenter/${id}/equipment/${equipmentId}`);
  }
}

// 导出API服务单例
export const workCenterApi = new WorkCenterApiService();
