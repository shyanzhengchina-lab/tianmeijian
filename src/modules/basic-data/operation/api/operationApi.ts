/**
 * 工序主数据API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 工序实体
 */
export interface Operation {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  workCenterId?: string;
  workCenterName?: string;
  standardTime?: number; // 标准工时（分钟）
  setupTime?: number; // 准备工时（分钟）
  capacity?: number; // 产能（件/小时）
  qualityRequirement?: string; // 质量要求
  safetyRequirement?: string; // 安全要求
  toolingRequirements?: string[]; // 工装要求
  equipmentRequirements?: string[]; // 设备要求
  skillLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert'; // 技能等级
  isBottleneck?: boolean; // 是否瓶颈工序
  status: 'active' | 'inactive' | 'draft';
  sort?: number; // 排序
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 工序分类
 */
export type OperationCategory = string;

/**
 * 工序查询参数
 */
export interface OperationQuery extends PageQuery {
  code?: string;
  name?: string;
  category?: string;
  workCenterId?: string;
  status?: string;
  skillLevel?: string;
}

/**
 * 创建工序DTO
 */
export interface CreateOperationDTO {
  code: string;
  name: string;
  description?: string;
  category?: string;
  workCenterId?: string;
  standardTime?: number;
  setupTime?: number;
  capacity?: number;
  qualityRequirement?: string;
  safetyRequirement?: string;
  toolingRequirements?: string[];
  equipmentRequirements?: string[];
  skillLevel?: string;
  isBottleneck?: boolean;
  status: string;
  sort?: number;
  remark?: string;
}

/**
 * 更新工序DTO
 */
export interface UpdateOperationDTO extends Partial<CreateOperationDTO> {
  id: string;
}

/**
 * 工序状态操作
 */
export interface OperationStatusAction {
  ids: string[];
  status: 'active' | 'inactive' | 'draft';
}

/**
 * 工序导入配置
 */
export interface OperationImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 工序API服务类
 */
class OperationApiService {
  private readonly baseUrl = '/operation';

  /**
   * 获取工序列表（分页）
   */
  async getOperations(query: OperationQuery): Promise<ApiResponse<PageResult<Operation>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有工序（不分页）
   */
  async getAllOperations(params?: Record<string, any>): Promise<ApiResponse<Operation[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取工序详情
   */
  async getOperationById(id: string): Promise<ApiResponse<Operation>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建工序
   */
  async createOperation(data: CreateOperationDTO): Promise<ApiResponse<Operation>> {
    return apiClient.post(`${this.baseUrl}/create`, data);
  }

  /**
   * 更新工序
   */
  async updateOperation(data: UpdateOperationDTO): Promise<ApiResponse<Operation>> {
    return apiClient.put(`${this.baseUrl}/update`, data);
  }

  /**
   * 删除工序
   */
  async deleteOperation(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * 批量删除工序
   */
  async deleteOperations(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { params: { ids } });
  }

  /**
   * 更新工序状态
   */
  async updateStatus(action: OperationStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action);
  }

  /**
   * 批量启用工序
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用工序
   */
  async batchDisable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入工序
   */
  async importOperations(config: OperationImportConfig): Promise<ApiResponse<BatchActionResult>> {
    const formData = new FormData();
    formData.append('file', config.file);

    const params: Record<string, any> = {};
    if (config.validate) {
      params.validate = 'true';
    }
    if (config.updateMode) {
      params.updateMode = config.updateMode;
    }

    return apiClient.post(`${this.baseUrl}/import`, formData, { params });
  }

  /**
   * 导出工序
   */
  async exportOperations(query: OperationQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'operation',
      type: 'excel',
    });
  }

  /**
   * 验证工序编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, {
      params: { code, excludeId },
    });
  }

  /**
   * 获取可用工作中心列表（用于工序中选择）
   */
  async getAvailableWorkCenters(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/workcenter/all');
  }

  /**
   * 获取工序统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    draftCount: number;
    categoryCount: number;
    bottleneckCount: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 根据技能等级筛选工序
   */
  async getOperationsBySkillLevel(skillLevel: string): Promise<ApiResponse<Operation[]>> {
    return apiClient.get(`${this.baseUrl}/by-skill-level`, { params: { skillLevel } });
  }

  /**
   * 获取瓶颈工序列表
   */
  async getBottleneckOperations(): Promise<ApiResponse<Operation[]>> {
    return apiClient.get(`${this.baseUrl}/bottleneck`);
  }

  /**
   * 获取工序分类树
   */
  async getCategoryTree(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>>> {
    return apiClient.get(`${this.baseUrl}/category-tree`);
  }

  /**
   * 复制工序
   */
  async copyOperation(id: string): Promise<ApiResponse<Operation>> {
    return apiClient.post(`${this.baseUrl}/copy/${id}`);
  }

  /**
   * 调整工序排序
   */
  async reorderSort(items: Array<{ id: string; sort: number }>): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/reorder`, { params: { items } });
  }

  /**
   * 获取工序关联的工单数量
   */
  async getWorkOrderCount(operationId: string): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get(`${this.baseUrl}/${operationId}/work-order-count`);
  }

  /**
   * 批量更新工作中心
   */
  async batchUpdateWorkCenter(ids: string[], workCenterId: string): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/batch-update-workcenter`, { params: {
      ids,
      workCenterId,
    } });
  }

  /**
   * 上移工序步骤
   */
  async moveUp(id: string): Promise<any> {
    return apiClient.put(`${this.baseUrl}/${id}/move-up`, {});
  }

  /**
   * 下移工序步骤
   */
  async moveDown(id: string): Promise<any> {
    return apiClient.put(`${this.baseUrl}/${id}/move-down`, {});
  }
}

// 创建单例实例
export const operationApi = new OperationApiService();

export default operationApi;

// 导出类型和API

export { OperationApiService };
