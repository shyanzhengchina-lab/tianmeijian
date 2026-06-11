/**
 * 工艺路径主数据模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  RoutingMaster,
  RoutingMasterQuery,
  CreateRoutingMasterDTO,
  UpdateRoutingMasterDTO,
  RoutingMasterBatchAction,
  RoutingDetail,
} from './types';

/**
 * 工艺路径主数据API服务类
 * 封装所有工艺路径主数据相关的API调用
 */
class RoutingMasterApiService {
  /**
   * 分页查询工艺路径主数据列表
   */
  async getRoutingMasters(query: RoutingMasterQuery): Promise<PageResult<RoutingMaster>> {
    return await apiClient.get<PageResult<RoutingMaster>>(
      '/routing-master/page',
      { params: query }
    );
  }

  /**
   * 获取所有工艺路径主数据列表（不分页）
   */
  async getAllRoutingMasters(): Promise<RoutingMaster[]> {
    return await apiClient.get<RoutingMaster[]>('/routing-master/list');
  }

  /**
   * 根据ID获取工艺路径主数据详情
   */
  async getRoutingMasterById(id: string): Promise<RoutingMaster> {
    return await apiClient.get<RoutingMaster>(`/routing-master/${id}`);
  }

  /**
   * 创建工艺路径主数据
   */
  async createRoutingMaster(data: CreateRoutingMasterDTO): Promise<RoutingMaster> {
    return await apiClient.post<RoutingMaster>('/routing-master', data);
  }

  /**
   * 更新工艺路径主数据
   */
  async updateRoutingMaster(data: UpdateRoutingMasterDTO): Promise<RoutingMaster> {
    return await apiClient.put<RoutingMaster>('/routing-master', data);
  }

  /**
   * 批量操作工艺路径主数据
   */
  async batchRoutingMasters(action: RoutingMasterBatchAction): Promise<void> {
    await apiClient.put<void>('/routing-master/batch', action);
  }

  /**
   * 启用工艺路径
   */
  async activateRouting(id: string): Promise<void> {
    await apiClient.put<void>(`/routing-master/${id}/activate`);
  }

  /**
   * 停用工艺路径
   */
  async deactivateRouting(id: string): Promise<void> {
    await apiClient.put<void>(`/routing-master/${id}/deactivate`);
  }

  /**
   * 归档工艺路径
   */
  async archiveRouting(id: string): Promise<void> {
    await apiClient.put<void>(`/routing-master/${id}/archive`);
  }

  /**
   * 批准工艺路径
   */
  async approveRouting(id: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/routing-master/${id}/approve`, { approver });
  }

  /**
   * 更新工艺路径状态
   */
  async updateStatus(ids: string[], status: string): Promise<void> {
    await apiClient.put<void>('/routing-master/status', { ids, status });
  }

  /**
   * 获取工艺路径明细
   */
  async getRoutingDetails(routingId: string): Promise<RoutingDetail[]> {
    return await apiClient.get<RoutingDetail[]>(`/routing-master/${routingId}/details`);
  }

  /**
   * 添加工艺路径明细
   */
  async addRoutingDetail(routingId: string, detail: Omit<RoutingDetail, 'id' | 'routingId'>): Promise<void> {
    await apiClient.post<void>(`/routing-master/${routingId}/detail`, detail);
  }

  /**
   * 批量添加工艺路径明细
   */
  async addRoutingDetails(routingId: string, details: Omit<RoutingDetail, 'id' | 'routingId'>[]): Promise<void> {
    await apiClient.post<void>(`/routing-master/${routingId}/details`, details);
  }

  /**
   * 更新工艺路径明细
   */
  async updateRoutingDetail(routingId: string, detail: RoutingDetail): Promise<void> {
    await apiClient.put<void>(`/routing-master/${routingId}/detail`, detail);
  }

  /**
   * 删除工艺路径明细
   */
  async deleteRoutingDetail(routingId: string, detailId: string): Promise<void> {
    await apiClient.delete<void>(`/routing-master/${routingId}/detail/${detailId}`);
  }

  /**
   * 批量删除工艺路径明细
   */
  async deleteRoutingDetails(routingId: string, detailIds: string[]): Promise<void> {
    await apiClient.delete<void>(`/routing-master/${routingId}/details`, { data: detailIds });
  }

  /**
   * 复制工艺路径
   */
  async copyRouting(id: string, newRoutingCode: string): Promise<RoutingMaster> {
    return await apiClient.post<RoutingMaster>(`/routing-master/${id}/copy`, {
      newRoutingCode,
    });
  }

  /**
   * 获取适用工艺路径列表
   */
  async getApplicableRoutings(productCode: string): Promise<RoutingMaster[]> {
    return await apiClient.get<RoutingMaster[]>('/routing-master/applicable', {
      params: { productCode },
    });
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    draftCount: number;
    activeCount: number;
    inactiveCount: number;
    archivedCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      draftCount: number;
      activeCount: number;
      inactiveCount: number;
      archivedCount: number;
      typeStats: Record<string, number>;
    }>('/routing-master/statistics');
    return (response as any).data;
  }
}

// 导出API服务单例
export const routingMasterApi = new RoutingMasterApiService();
