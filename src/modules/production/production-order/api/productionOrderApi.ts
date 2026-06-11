/**
 * 生产订单API服务
 * 提供生产订单相关的所有API调用方法
 */

import { apiClient } from '@/shared/api/apiClient';

// 类型定义
export interface ProductionOrder {
  id?: number;
  orderNo?: string;
  productId?: number;
  productName?: string;
  productCode?: string;
  quantity?: number;
  unitId?: number;
  unitName?: string;
  planStartDate?: string;
  planEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status?: string;
  priority?: string;
  remark?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

export interface ProductionOrderQuery {
  page?: number;
  size?: number;
  orderNo?: string;
  productName?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * 生产订单API服务类
 */
export class ProductionOrderApiService {
  private baseUrl = '/production-order';

  /**
   * 分页查询生产订单
   */
  async getProductionOrders(query: ProductionOrderQuery): Promise<PageResult<ProductionOrder>> {
    return await apiClient.get<PageResult<ProductionOrder>>(
      `${this.baseUrl}/page`,
      { params: query }
    );
  }

  /**
   * 根据ID查询生产订单
   */
  async getProductionOrderById(id: number): Promise<ProductionOrder> {
    return await apiClient.get<ProductionOrder>(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建生产订单
   */
  async createProductionOrder(data: Partial<ProductionOrder>): Promise<void> {
    return await apiClient.post<void>(this.baseUrl, data);
  }

  /**
   * 更新生产订单
   */
  async updateProductionOrder(data: ProductionOrder): Promise<void> {
    return await apiClient.put<void>(this.baseUrl, data);
  }

  /**
   * 删除生产订单
   */
  async deleteProductionOrder(id: number): Promise<void> {
    return await apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * 批量删除生产订单
   */
  async deleteProductionOrders(ids: number[]): Promise<void> {
    return await apiClient.delete<void>(this.baseUrl, { data: ids });
  }

  /**
   * 下达生产订单
   */
  async releaseProductionOrder(id: number): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/release`);
  }

  /**
   * 批量下达生产订单
   */
  async releaseProductionOrders(ids: number[]): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/batch-release`, { ids });
  }

  /**
   * 关闭生产订单
   */
  async closeProductionOrder(id: number, reason?: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/close`, { reason });
  }

  /**
   * 取消生产订单
   */
  async cancelProductionOrder(id: number, reason?: string): Promise<void> {
    return await apiClient.put<void>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  /**
   * 下推生产工单
   */
  async pushToWorkOrder(id: number): Promise<void> {
    return await apiClient.post<void>(`${this.baseUrl}/${id}/push-work-order`);
  }

  /**
   * 获取订单统计信息
   */
  async getOrderStatistics(): Promise<any> {
    return await apiClient.get<any>(`${this.baseUrl}/statistics`);
  }

  /**
   * 导出生产订单
   */
  async exportOrders(query: ProductionOrderQuery, format: string = 'excel'): Promise<Blob> {
    return await apiClient.get<Blob>(
      `${this.baseUrl}/export`,
      {
        params: { ...query, format },
        responseType: 'blob'
      }
    );
  }

  /**
   * 导入生产订单
   */
  async importOrders(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return await apiClient.post<any>(`${this.baseUrl}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}

// 导出单例
export const productionOrderApi = new ProductionOrderApiService();