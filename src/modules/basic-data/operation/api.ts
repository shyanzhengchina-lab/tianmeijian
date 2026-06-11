/**
 * 工序主数据模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  Operation,
  OperationQuery,
  CreateOperationDTO,
  UpdateOperationDTO,
  OperationBatchAction,
} from './types';

/**
 * 工序API服务类
 * 封装所有工序相关的API调用
 */
class OperationApiService {
  /**
   * 分页查询工序列表
   */
  async getOperations(query: OperationQuery): Promise<PageResult<Operation>> {
    return await apiClient.get<PageResult<Operation>>(
      '/operation/page',
      { params: query }
    );
  }

  /**
   * 获取所有工序列表（不分页）
   */
  async getAllOperations(): Promise<Operation[]> {
    return await apiClient.get<Operation[]>('/operation/list');
  }

  /**
   * 根据ID获取工序详情（含阶段）
   */
  async getOperationById(id: string): Promise<Operation> {
    return await apiClient.get<Operation>(`/operation/${id}`);
  }

  /**
   * 根据编码获取工序
   */
  async getOperationByCode(opCode: string): Promise<Operation> {
    return await apiClient.get<Operation>('/operation/byCode', {
      params: { opCode },
    });
  }

  /**
   * 创建工序
   */
  async createOperation(data: CreateOperationDTO): Promise<Operation> {
    return await apiClient.post<Operation>('/operation', data);
  }

  /**
   * 更新工序
   */
  async updateOperation(data: UpdateOperationDTO): Promise<Operation> {
    return await apiClient.put<Operation>('/operation', data);
  }

  /**
   * 批量删除工序
   */
  async deleteOperations(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/operation', { data: ids });
  }

  /**
   * 批量操作工序
   */
  async batchOperations(action: OperationBatchAction): Promise<void> {
    await apiClient.put<void>('/operation/batch', action);
  }

  /**
   * 生效工序
   */
  async activateOperation(id: string): Promise<void> {
    await apiClient.put<void>(`/operation/${id}/activate`);
  }

  /**
   * 停用工序
   */
  async deactivateOperation(id: string): Promise<void> {
    await apiClient.put<void>(`/operation/${id}/deactivate`);
  }

  /**
   * 作废工序
   */
  async obsoleteOperation(id: string): Promise<void> {
    await apiClient.put<void>(`/operation/${id}/obsolete`);
  }

  /**
   * 更新工序状态
   */
  async updateStatus(ids: string[], status: 'DRAFT' | 'ACTIVE' | 'OBSOLETE' | 'DISABLED'): Promise<void> {
    await apiClient.put<void>('/operation/status', { ids, status });
  }

  /**
   * 检查工序编码是否存在
   */
  async checkCodeExists(opCode: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/operation/checkCode', {
      params: { opCode, excludeId },
    });
  }

  /**
   * 获取工序统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    draftCount: number;
    activeCount: number;
    obsoleteCount: number;
    disabledCount: number;
    categoryStats: Record<string, number>;
    bottleneckCount: number;
    qcPointCount: number;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      draftCount: number;
      activeCount: number;
      obsoleteCount: number;
      disabledCount: number;
      categoryStats: Record<string, number>;
      bottleneckCount: number;
      qcPointCount: number;
    }>('/operation/statistics');
    return (response as any).data;
  }

  /**
   * 获取工作中心关联的工序
   */
  async getOperationsByWorkCenter(workCenter: string): Promise<Operation[]> {
    return await apiClient.get<Operation[]>('/operation/byWorkCenter', {
      params: { workCenter },
    });
  }

  /**
   * 复制工序
   */
  async copyOperation(id: string, newOpCode: string, newOpName: string): Promise<Operation> {
    return await apiClient.post<Operation>(`/operation/${id}/copy`, {
      newOpCode,
      newOpName,
    });
  }

  /**
   * 导入工序
   */
  async importOperations(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/operation/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出工序
   */
  async exportOperations(query: OperationQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/operation/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 导出工序详情（含阶段）
   */
  async exportOperationDetail(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/operation/${id}/export`, {
      responseType: 'blob',
    });
  }

  /**
   * 获取工序版本历史
   */
  async getVersionHistory(opCode: string): Promise<Operation[]> {
    return await apiClient.get<Operation[]>(`/operation/${opCode}/versions`);
  }

  /**
   * 获取工序阶段定义
   */
  async getPhaseTemplates(): Promise<any[]> {
    return await apiClient.get<any[]>('/operation/phaseTemplates');
  }

  /**
   * 获取工序KPI数据
   */
  async getKpiData(id: string): Promise<any> {
    return await apiClient.get<any>(`/operation/${id}/kpi`);
  }

  /**
   * 上移工序
   */
  async moveUp(id: string): Promise<void> {
    await apiClient.put<void>(`/operation/${id}/move-up`);
  }

  /**
   * 下移工序
   */
  async moveDown(id: string): Promise<void> {
    await apiClient.put<void>(`/operation/${id}/move-down`);
  }

  /**
   * 批量启用工序
   */
  async batchEnable(ids: string[]): Promise<void> {
    await apiClient.put<void>('/operation/batch-enable', { ids });
  }

  /**
   * 批量禁用工序
   */
  async batchDisable(ids: string[]): Promise<void> {
    await apiClient.put<void>('/operation/batch-disable', { ids });
  }

  /**
   * 批量更新工作中心
   */
  async batchUpdateWorkCenter(ids: string[], workCenterId: string): Promise<void> {
    await apiClient.put<void>('/operation/batch-update-workcenter', {
      ids,
      workCenterId,
    });
  }

  /**
   * 调整排序
   */
  async reorderSort(items: Array<{ id: string; sort: number }>): Promise<void> {
    await apiClient.put<void>('/operation/reorder-sort', { items });
  }

  /**
   * 获取可用工作中心
   */
  async getAvailableWorkCenters(): Promise<any[]> {
    return await apiClient.get<any[]>('/operation/available-workcenters');
  }

  /**
   * 获取瓶颈工序
   */
  async getBottleneckOperations(): Promise<Operation[]> {
    return await apiClient.get<Operation[]>('/operation/bottleneck');
  }

  /**
   * 根据技能等级获取工序
   */
  async getOperationsBySkillLevel(skillLevel: string): Promise<Operation[]> {
    return await apiClient.get<Operation[]>('/operation/by-skill-level', {
      params: { skillLevel },
    });
  }

  /**
   * 获取分类树
   */
  async getCategoryTree(): Promise<any[]> {
    return await apiClient.get<any[]>('/operation/category-tree');
  }

  /**
   * 检查编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<{ unique: boolean }> {
    return await apiClient.get<{ unique: boolean }>('/operation/check-code-unique', {
      params: { code, excludeId },
    });
  }

}

// 导出API服务单例
export const operationApi = new OperationApiService();
