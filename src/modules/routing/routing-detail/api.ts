/**
 * 工艺明细模块API服务
 */

import http from '../../../api/http';
import type {
  RoutingDetail,
  CreateRoutingDetailDTO,
  UpdateRoutingDetailDTO,
  RoutingDetailQuery,
} from './types';

interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

class RoutingDetailApiService {
  /**
   * 获取工艺明细列表
   */
  async getRoutingDetailList(query: RoutingDetailQuery): Promise<PageResult<RoutingDetail>> {
    const response = await http.get<ApiResponse<PageResult<RoutingDetail>>>('/routing-detail/list', { params: query });
    return (response as any).data.data;
  }

  /**
   * 根据ID获取工艺明细详情
   */
  async getRoutingDetailById(id: string): Promise<RoutingDetail> {
    const response = await http.get<ApiResponse<RoutingDetail>>(`/routing-detail/${id}`);
    return (response as any).data.data;
  }

  /**
   * 创建工艺明细
   */
  async createRoutingDetail(data: CreateRoutingDetailDTO): Promise<RoutingDetail> {
    const response = await http.post<ApiResponse<RoutingDetail>>('/routing-detail', data);
    return (response as any).data.data;
  }

  /**
   * 更新工艺明细
   */
  async updateRoutingDetail(data: UpdateRoutingDetailDTO): Promise<RoutingDetail> {
    const response = await http.put<ApiResponse<RoutingDetail>>('/routing-detail', data);
    return (response as any).data.data;
  }

  /**
   * 删除工艺明细
   */
  async deleteRoutingDetail(ids: string[]): Promise<void> {
    await http.delete('/routing-detail', { data: { ids } });
  }

  /**
   * 启用
   */
  async activateRoutingDetail(id: string): Promise<void> {
    await http.post(`/routing-detail/${id}/activate`);
  }

  /**
   * 停用
   */
  async deactivateRoutingDetail(id: string): Promise<void> {
    await http.post(`/routing-detail/${id}/deactivate`);
  }

  /**
   * 导出工艺明细列表
   */
  async exportRoutingDetail(query: RoutingDetailQuery, format: 'excel' | 'csv' = 'excel'): Promise<Blob> {
    const response = await http.get(`/routing-detail/export/${format}`, {
      params: query,
      responseType: 'blob',
    });
    return (response as any).data;
  }
}

export const routingDetailApi = new RoutingDetailApiService();
