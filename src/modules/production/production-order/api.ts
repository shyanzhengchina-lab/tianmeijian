/**
 * 生产订单模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  ProductionOrder,
  ProductionOrderQuery,
  CreateProductionOrderDTO,
  UpdateProductionOrderDTO,
  ProductionOrderBatchAction,
  POLineItem,
  POStatus,
  POPriority,
  WorkOrderSummary,
} from './types';

// Helper interface to create a line item without id
interface CreatePOLineItemDTO {
  poId: string;
  lineNo: number;
  productCode: string;
  productName: string;
  productSpec: string;
  planQty: number;
  actualQty: number;
  qualifiedQty: number;
  unqualifiedQty: number;
  scrapQty: number;
  unit: string;
  remark?: string;
}

/**
 * 生产订单API服务类
 * 封装所有生产订单相关的API调用
 */
class ProductionOrderApiService {
  /**
   * 分页查询生产订单列表
   */
  async getProductionOrders(query: ProductionOrderQuery): Promise<PageResult<ProductionOrder>> {
    return await apiClient.get<PageResult<ProductionOrder>>(
      '/production-order/page',
      { params: query }
    );
  }

  /**
   * 获取所有生产订单列表（不分页）
   */
  async getAllProductionOrders(): Promise<ProductionOrder[]> {
    return await apiClient.get<ProductionOrder[]>('/production-order/list');
  }

  /**
   * 根据ID获取生产订单详情
   */
  async getProductionOrderById(id: string): Promise<ProductionOrder> {
    return await apiClient.get<ProductionOrder>(`/production-order/${id}`);
  }

  /**
   * 根据订单号获取生产订单
   */
  async getProductionOrderByNo(orderNo: string): Promise<ProductionOrder> {
    return await apiClient.get<ProductionOrder>('/production-order/byNo', {
      params: { orderNo },
    });
  }

  /**
   * 创建生产订单
   */
  async createProductionOrder(data: CreateProductionOrderDTO): Promise<ProductionOrder> {
    return await apiClient.post<ProductionOrder>('/production-order', data);
  }

  /**
   * 更新生产订单
   */
  async updateProductionOrder(data: UpdateProductionOrderDTO): Promise<ProductionOrder> {
    return await apiClient.put<ProductionOrder>('/production-order', data);
  }

  /**
   * 批量删除生产订单
   */
  async deleteProductionOrders(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/production-order', { data: ids });
  }

  /**
   * 批量操作生产订单
   */
  async batchProductionOrders(action: ProductionOrderBatchAction): Promise<void> {
    await apiClient.put<void>('/production-order/batch', action);
  }

  /**
   * 发布生产订单
   */
  async releaseProductionOrder(id: string): Promise<void> {
    await apiClient.put<void>(`/production-order/${id}/release`);
  }

  /**
   * 审核生产订单
   */
  async auditProductionOrder(id: string, auditor: string): Promise<void> {
    await apiClient.put<void>(`/production-order/${id}/audit`, { auditor });
  }

  /**
   * 反审核生产订单
   */
  async unAuditProductionOrder(id: string): Promise<void> {
    await apiClient.put<void>(`/production-order/${id}/un-audit`);
  }

  /**
   * 关闭生产订单
   */
  async closeProductionOrder(id: string): Promise<void> {
    await apiClient.put<void>(`/production-order/${id}/close`);
  }

  /**
   * 重启生产订单
   */
  async reopenProductionOrder(id: string): Promise<void> {
    await apiClient.put<void>(`/production-order/${id}/reopen`);
  }

  /**
   * 更新生产订单状态
   */
  async updateStatus(ids: string[], status: POStatus): Promise<void> {
    await apiClient.put<void>('/production-order/status', { ids, status });
  } ;

  /**
   * 更新订单优先级
   */
  async updatePriority(id: string, priority: POPriority): Promise<void> {
    await apiClient.put<void>(`/production-order/${id}/priority`, { priority });
  } ;

  /**
   * 添加订单规格明细
   */
  async addLineItem(orderId: string, item: CreatePOLineItemDTO): Promise<void> {
    await apiClient.post<void>(`/production-order/${orderId}/line-item`, item);
  };

  /**
   * 批量添加订单规格明细
   */
  async addLineItems(orderId: string, items: CreatePOLineItemDTO[]): Promise<void> {
    await apiClient.post<void>(`/production-order/${orderId}/line-items`, items);
  };

  /**
   * 更新订单规格明细
   */
  async updateLineItem(orderId: string, item: CreatePOLineItemDTO): Promise<void> {
    await apiClient.put<void>(`/production-order/${orderId}/line-item`, item);
  }

  /**
   删除订单规格明细
   */
  async deleteLineItem(orderId: string, itemId: string): Promise<void> {
    await apiClient.delete<void>(`/production-order/${orderId}/line-item/${itemId}`);
  }

  /**
   * 批量删除订单规格明细
   */
  async deleteLineItems(orderId: string, itemIds: string[]): Promise<void> {
    await apiClient.delete<void>(`/production-order/${orderId}/line-items`, { data: itemIds });
  }

  /**
   * 下推生产工单
   */
  async pushWorkOrder(id: string): Promise<void> {
    await apiClient.post<void>(`/production-order/${id}/push-wo`);
  }

  /**
   * 批量下推生产工单
   */
  async pushWorkOrders(ids: string[]): Promise<void> {
    await apiClient.post<void>('/production-order/push-wo-batch', { data: ids });
  }

  /**
   * 检查订单号是否存在
   */
  async checkOrderNoExists(orderNo: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/production-order/checkOrderNo', {
      params: { orderNo, excludeId },
    });
  }

  /**
   * 获取生产订单统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    openCount: number;
    inProgressCount: number;
    completedCount: number;
    closedCount: number;
    priorityStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      openCount: number;
      inProgressCount: number;
      completedCount: number;
      closedCount: number;
      priorityStats: Record<string, number>;
    }>('/production-order/statistics');
    return (response as any).data;
  }

  /**
   * 导入生产订单
   */
  async importProductionOrders(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/production-order/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出生产订单
   */
  async exportProductionOrders(query: ProductionOrderQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/production-order/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 导出工单汇总
   */
  async exportWorkOrderSummary(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/production-order/${id}/wo-summary`, {
      responseType: 'blob',
    });
  }

  /**
   * 获取适用工艺路径列表
   */
  async getApplicableRoutings(productCode: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/production-order/routings`, {
      params: { productCode },
    });
  }

  /**
   * 获取工单汇总信息
   */
  async getWorkOrderSummary(orderId: string): Promise<WorkOrderSummary> {
    return await apiClient.get<WorkOrderSummary>(`/production-order/${orderId}/wo-summary`);
  }

  /**
   * 根据工艺路径计算工单
   */
  async calculateWorkOrders(orderId: string): Promise<any> {
    return await apiClient.post<any>(`/production-order/${orderId}/calculate-wo`, {});
  }

  /**
   * 根据工艺路径生成工单
   */
  async generateWorkOrders(orderId: string): Promise<any> {
    return await apiClient.post<any>(`/production-order/${orderId}/generate-wo`, {});
  }
}

// 导出API服务单例
export const productionOrderApi = new ProductionOrderApiService();
