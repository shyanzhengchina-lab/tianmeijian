/**
 * 车间档案模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse, PageResult } from '../../../shared/api/requestTypes';
import type {
  Workshop,
  WorkshopQuery,
  CreateWorkshopDTO,
  UpdateWorkshopDTO,
  WorkshopBatchAction,
} from './types';

/**
 * 车间API服务类
 * 封装所有车间相关的API调用
 */
class WorkshopApiService {
  /**
   * 分页查询车间列表
   */
  async getWorkshops(query: WorkshopQuery): Promise<PageResult<Workshop>> {
    return await apiClient.get<PageResult<Workshop>>(
      '/workshop/page',
      { params: query }
    );
  }

  /**
   * 获取所有车间列表（不分页）
   */
  async getAllWorkshops(): Promise<Workshop[]> {
    return await apiClient.get<Workshop[]>('/workshop/list');
  }

  /**
   * 根据ID获取车间详情
   */
  async getWorkshopById(id: string): Promise<Workshop> {
    return await apiClient.get<Workshop>(`/workshop/${id}`);
  }

  /**
   * 根据编码获取车间
   */
  async getWorkshopByCode(workShopCode: string): Promise<Workshop> {
    return await apiClient.get<Workshop>('/workshop/byCode', {
      params: { workShopCode },
    });
  }

  /**
   * 创建车间
   */
  async createWorkshop(data: CreateWorkshopDTO): Promise<Workshop> {
    return await apiClient.post<Workshop>('/workshop', data);
  }

  /**
   * 更新车间
   */
  async updateWorkshop(data: UpdateWorkshopDTO): Promise<Workshop> {
    return await apiClient.put<Workshop>('/workshop', data);
  }

  /**
   * 批量删除车间
   */
  async deleteWorkshops(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/workshop', { data: ids });
  }

  /**
   * 批量操作车间
   */
  async batchWorkshops(action: WorkshopBatchAction): Promise<void> {
    await apiClient.put<void>('/workshop/batch', action);
  }

  /**
   * 更新车间状态
   */
  async updateStatus(ids: string[], status: 'ACTIVE' | 'DISABLED'): Promise<void> {
    await apiClient.put<void>('/workshop/status', { ids, status });
  }

  /**
   * 设置整修状态
   */
  async setMaintenance(id: string): Promise<void> {
    await apiClient.put<void>(`/workshop/${id}/setMaintenance`, {});
  }

  /**
   * 取消整修状态
   */
  async unsetMaintenance(id: string): Promise<void> {
    await apiClient.put<void>(`/workshop/${id}/unsetMaintenance`, {});
  }

  /**
   * 更新车间负责人
   */
  async updateManager(id: string, manager: string, managerPhone?: string): Promise<void> {
    await apiClient.put<void>(`/workshop/${id}/manager`, {
      manager,
      managerPhone,
    });
  }

  /**
   * 检查车间编码是否存在
   */
  async checkCodeExists(workShopCode: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/workshop/checkCode', {
      params: { workShopCode, excludeId },
    });
  }

  /**
   * 获取车间关联的工作中心
   */
  async getWorkCenters(id: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/workshop/${id}/workCenters`);
  }

  /**
   * 添加工作中心到车间
   */
  async addWorkCenter(id: string, workCenterId: string): Promise<void> {
    await apiClient.post<void>(`/workshop/${id}/workCenters`, { workCenterId });
  }

  /**
   * 从车间移除工作中心
   */
  async removeWorkCenter(id: string, workCenterId: string): Promise<void> {
    await apiClient.delete<void>(`/workshop/${id}/workCenters/${workCenterId}`);
  }

  /**
   * 获取车间统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    activeCount: number;
    disabledCount: number;
    maintenanceCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      activeCount: number;
      disabledCount: number;
      maintenanceCount: number;
      typeStats: Record<string, number>;
    }>('/workshop/statistics');
    return (response as any).data;
  }

  /**
   * 导入车间
   */
  async importWorkshops(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/workshop/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出车间
   */
  async exportWorkshops(query: WorkshopQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/workshop/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取车间KPI数据
   */
  async getKpiData(id: string): Promise<any> {
    return await apiClient.get<any>(`/workshop/${id}/kpi`);
  }
}

// 导出API服务单例
export const workshopApi = new WorkshopApiService();