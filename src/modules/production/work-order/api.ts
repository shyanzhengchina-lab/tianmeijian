/**
 * 生产工单模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  WorkOrder,
  WorkOrderQuery,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO,
  WorkOrderBatchAction,
  WOStep,
  WOStatus,
} from './types';

// Helper interface to create a step without id and woId
interface CreateWOStep {
  stepNo: number;
  stepCode: string;
  stepName: string;
  operationId: string;
  status: string;
  planQty: number;
  actualQty: number;
  qualifiedQty: number;
  unqualifiedQty: number;
  scrapQty: number;
  planStartTime?: string;
  planEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  workcenterId?: string;
  equipmentId?: string;
  operatorId?: string;
  remark?: string;
}

/**
 * 生产工单API服务类
 * 封装所有生产工单相关的API调用
 */
class WorkOrderApiService {
  /**
   * 分页查询生产工单列表
   */
  async getWorkOrders(query: WorkOrderQuery): Promise<PageResult<WorkOrder>> {
    return await apiClient.get<PageResult<WorkOrder>>(
      '/work-order/page',
      { params: query }
    );
  }

  /**
   * 获取所有生产工单列表（不分页）
   */
  async getAllWorkOrders(): Promise<WorkOrder[]> {
    return await apiClient.get<WorkOrder[]>('/work-order/list');
  }

  /**
   * 根据ID获取生产工单详情
   */
  async getWorkOrderById(id: string): Promise<WorkOrder> {
    return await apiClient.get<WorkOrder>(`/work-order/${id}`);
  }

  /**
   * 根据工单号获取生产工单
   */
  async getWorkOrderByNo(woNo: string): Promise<WorkOrder> {
    return await apiClient.get<WorkOrder>('/work-order/byNo', {
      params: { woNo },
    });
  }

  /**
   * 创建生产工单
   */
  async createWorkOrder(data: CreateWorkOrderDTO): Promise<WorkOrder> {
    return await apiClient.post<WorkOrder>('/work-order', data);
  }

  /**
   * 更新生产工单
   */
  async updateWorkOrder(data: UpdateWorkOrderDTO): Promise<WorkOrder> {
    return await apiClient.put<WorkOrder>('/work-order', data);
  }

  /**
   * 批量删除生产工单
   */
  async deleteWorkOrders(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/work-order', { data: ids });
  }

  /**
   * 批量操作生产工单
   */
  async batchWorkOrders(action: WorkOrderBatchAction): Promise<void> {
    await apiClient.put<void>('/work-order/batch', action);
  }

  /**
   * 发布生产工单
   */
  async releaseWorkOrder(id: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${id}/release`);
  }

  /**
   * 暂停生产工单
   */
  async suspendWorkOrder(id: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${id}/suspend`);
  }

  /**
   * 恢复生产工单
   */
  async resumeWorkOrder(id: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${id}/resume`);
  }

  /**
   * 关闭生产工单
   */
  async closeWorkOrder(id: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${id}/close`);
  }

  /**
   * 更新工单状态
   */
  async updateStatus(ids: string[], status: WOStatus): Promise<void> {
    await apiClient.put<void>('/work-order/status', { ids, status });
  }

  /**
   * 更新工单数量
   */
  async updateQuantity(id: string, actualQty: number, qualifiedQty: number, unqualifiedQty: number, scrapQty: number): Promise<void> {
    await apiClient.put<void>(`/work-order/${id}/quantity`, {
      actualQty,
      qualifiedQty,
      unqualifiedQty,
      scrapQty,
    });
  }

  /**
   * 添加工单工序明细
   */
  async addStep(woId: string, step: CreateWOStep): Promise<void> {
    await apiClient.post<void>(`/work-order/${woId}/step`, step);
  };

  /**
   * 批量添加工单工序明细
   */
  async addSteps(woId: string, steps: CreateWOStep[]): Promise<void> {
    await apiClient.post<void>(`/work-order/${woId}/steps`, steps);
  };

  /**
   * 更新工单工序明细
   */
  async updateStep(woId: string, step: WOStep): Promise<void> {
    await apiClient.put<void>(`/work-order/${woId}/step`, step);
  }

  /**
   * 删除工单工序明细
   */
  async deleteStep(woId: string, stepId: string): Promise<void> {
    await apiClient.delete<void>(`/work-order/${woId}/step/${stepId}`);
  }

  /**
   * 批量删除工单工序明细
   */
  async deleteSteps(woId: string, stepIds: string[]): Promise<void> {
    await apiClient.delete<void>(`/work-order/${woId}/steps`, { data: stepIds });
  }

  /**
   * 启动工单工序
   */
  async startStep(woId: string, stepId: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${woId}/step/${stepId}/start`);
  }

  /**
   * 完成工单工序
   */
  async completeStep(woId: string, stepId: string, quantity: number): Promise<void> {
    await apiClient.put<void>(`/work-order/${woId}/step/${stepId}/complete`, { quantity });
  }

  /**
   * 暂停工单工序
   */
  async suspendStep(woId: string, stepId: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${woId}/step/${stepId}/suspend`);
  }

  /**
   * 恢复工单工序
   */
  async resumeStep(woId: string, stepId: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${woId}/step/${stepId}/resume`);
  }

  /**
   * 分配工作中心
   */
  async allocateWorkcenter(id: string, workcenterId: string, teamId?: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${id}/allocate`, {
      workcenterId,
      teamId,
    });
  }

  /**
   * 分配操作员
   */
  async allocateOperator(id: string, operator: string): Promise<void> {
    await apiClient.put<void>(`/work-order/${id}/operator`, { operator });
  }

  /**
   * 检查工单号是否存在
   */
  async checkWoNoExists(woNo: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/work-order/checkWoNo', {
      params: { woNo, excludeId },
    });
  }

  /**
   * 获取生产工单统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    draftCount: number;
    releasedCount: number;
    inProgressCount: number;
    completedCount: number;
    closedCount: number;
    suspendedCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      draftCount: number;
      releasedCount: number;
      inProgressCount: number;
      completedCount: number;
      closedCount: number;
      suspendedCount: number;
      typeStats: Record<string, number>;
    }>('/work-order/statistics');
    return (response as any).data;
  }

  /**
   * 导入生产工单
   */
  async importWorkOrders(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/work-order/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出生产工单
   */
  async exportWorkOrders(query: WorkOrderQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/work-order/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 导出工单明细
   */
  async exportWorkOrderDetail(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/work-order/${id}/detail`, {
      responseType: 'blob',
    });
  }

  /**
   * 获取工序执行情况
   */
  async getStepExecution(woId: string): Promise<WOStep[]> {
    return await apiClient.get<WOStep[]>(`/work-order/${woId}/steps`);
  }

  /**
   * 从生产订单生成工单
   */
  async generateFromPO(poId: string): Promise<WorkOrder[]> {
    return await apiClient.post<WorkOrder[]>(`/work-order/generate-from-po/${poId}`, {});
  }

  /**
   * 获取可用工作中心列表
   */
  async getAvailableWorkcenters(productCode: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/work-order/workcenters`, {
      params: { productCode },
    });
  }

  /**
   * 获取可用班组列表
   */
  async getAvailableTeams(workcenterId: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/work-order/teams`, {
      params: { workcenterId },
    });
  }
}

// 导出API服务单例
export const workOrderApi = new WorkOrderApiService();
