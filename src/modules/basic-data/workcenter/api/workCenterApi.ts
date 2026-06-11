/**
 * 工作中心API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 工作中心实体
 */
export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  category?: string; // 工作中心分类
  type?: 'production' | 'assembly' | 'packing' | 'storage' | 'other'; // 工作中心类型
  workshopId?: string;
  workshopName?: string;
  location?: string;
  capacity?: number; // 产能（件/天）
  operatorCount?: number; // 操作员数量
  shiftCount?: number; // 班次数量
  workingHours?: number; // 工作时长（小时/天）
  status: 'active' | 'inactive' | 'maintenance';
  isBottleneck?: boolean; // 是否瓶颈工作中心
  description?: string;
  responsiblePerson?: string; // 负责人
  contactPhone?: string;
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 工作中心分类
 */
export type WorkCenterCategory = string;

/**
 * 工作中心类型
 */
export type WorkCenterType = 'production' | 'assembly' | 'packing' | 'storage' | 'other';

/**
 * 工作中心查询参数
 */
export interface WorkCenterQuery extends PageQuery {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  workshopId?: string;
  status?: string;
  responsiblePerson?: string;
}

/**
 * 创建工作中心DTO
 */
export interface CreateWorkCenterDTO {
  code: string;
  name: string;
  category?: string;
  type?: string;
  workshopId?: string;
  location?: string;
  capacity?: number;
  operatorCount?: number;
  shiftCount?: number;
  workingHours?: number;
  status: string;
  isBottleneck?: boolean;
  description?: string;
  responsiblePerson?: string;
  contactPhone?: string;
  remark?: string;
}

/**
 * 更新工作中心DTO
 */
export interface UpdateWorkCenterDTO extends Partial<CreateWorkCenterDTO> {
  id: string;
}

/**
 * 工作中心状态操作
 */
export interface WorkCenterStatusAction {
  ids: string[];
  status: 'active' | 'inactive' | 'maintenance';
}

/**
 * 工作中心导入配置
 */
export interface WorkCenterImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 工作中心关联数据统计
 */
export interface WorkCenterStatistics {
  workCenterId: string;
  workCenterName: string;
  equipmentCount: number;
  operationCount: number;
  employeeCount: number;
  totalCapacity: number;
  actualCapacity: number;
  utilizationRate: number; // 利用率
}

/**
 * 工作中心API服务类
 */
class WorkCenterApiService {
  private readonly baseUrl = '/workcenter';

  /**
   * 获取工作中心列表（分页）
   */
  async getWorkCenters(query: WorkCenterQuery): Promise<ApiResponse<PageResult<WorkCenter>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有工作中心（不分页）
   */
  async getAllWorkCenters(params?: Record<string, any>): Promise<ApiResponse<WorkCenter[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取工作中心详情
   */
  async getWorkCenterById(id: string): Promise<ApiResponse<WorkCenter>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建工作中心
   */
  async createWorkCenter(data: CreateWorkCenterDTO): Promise<ApiResponse<WorkCenter>> {
    return apiClient.post(`${this.baseUrl}/create`, data);
  }

  /**
   * 更新工作中心
   */
  async updateWorkCenter(data: UpdateWorkCenterDTO): Promise<ApiResponse<WorkCenter>> {
    return apiClient.put(`${this.baseUrl}/update`, data);
  }

  /**
   * 删除工作中心
   */
  async deleteWorkCenter(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * 批量删除工作中心
   */
  async deleteWorkCenters(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { params: { ids } });
  }

  /**
   * 更新工作中心状态
   */
  async updateStatus(action: WorkCenterStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action);
  }

  /**
   * 批量启用工作中心
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用工作中心
   */
  async batchDisable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入工作中心
   */
  async importWorkCenters(config: WorkCenterImportConfig): Promise<ApiResponse<BatchActionResult>> {
    const formData = new FormData();
    formData.append('file', config.file);

    const requestConfig: Record<string, any> = {
      showSuccess: true,
      successText: '导入成功',
    };

    if (config.validate) {
      requestConfig.validate = 'true';
    }
    if (config.updateMode) {
      requestConfig.updateMode = config.updateMode;
    }

    return apiClient.post(`${this.baseUrl}/import`, formData, requestConfig);
  }

  /**
   * 导出工作中心
   */
  async exportWorkCenters(query: WorkCenterQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'workcenter',
      type: 'excel',
    });
  }

  /**
   * 验证工作中心编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, { params: {
      code,
      excludeId,
    } });
  }

  /**
   * 获取可用车间列表（用于工作中心中选择）
   */
  async getAvailableWorkshops(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/workshop/all');
  }

  /**
   * 获取工作中心统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    maintenanceCount: number;
    categoryCount: number;
    bottleneckCount: number;
    totalCapacity: number;
    averageUtilizationRate: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 获取工作中心关联数据统计
   */
  async getWorkCenterStatistics(workCenterId: string): Promise<ApiResponse<WorkCenterStatistics>> {
    return apiClient.get(`${this.baseUrl}/${workCenterId}/statistics`);
  }

  /**
   * 获取工作中心下的设备列表
   */
  async getWorkCenterEquipments(workCenterId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`${this.baseUrl}/${workCenterId}/equipments`);
  }

  /**
   * 获取工作中心下的工序列表
   */
  async getWorkCenterOperations(workCenterId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`${this.baseUrl}/${workCenterId}/operations`);
  }

  /**
   * 获取工作中心下的员工列表
   */
  async getWorkCenterEmployees(workCenterId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`${this.baseUrl}/${workCenterId}/employees`);
  }

  /**
   * 获取瓶颈工作中心列表
   */
  async getBottleneckWorkCenters(): Promise<ApiResponse<WorkCenter[]>> {
    return apiClient.get(`${this.baseUrl}/bottleneck`);
  }

  /**
   * 获取工作中心分类树
   */
  async getCategoryTree(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>>> {
    return apiClient.get(`${this.baseUrl}/category-tree`);
  }

  /**
   * 复制工作中心
   */
  async copyWorkCenter(id: string): Promise<ApiResponse<WorkCenter>> {
    return apiClient.post(`${this.baseUrl}/copy/${id}`, undefined, {
      showSuccess: true,
      successText: '复制成功',
    });
  }

  /**
   * 获取工作中心产能利用率
   */
  async getUtilizationRate(workCenterId: string, startDate: string, endDate: string): Promise<ApiResponse<{
    date: string;
    plannedCapacity: number;
    actualCapacity: number;
    utilizationRate: number;
  }[]>> {
    return apiClient.get(`${this.baseUrl}/${workCenterId}/utilization-rate`, { params: {
      startDate,
      endDate,
    } });
  }

  /**
   * 搜索工作中心
   */
  async searchWorkCenters(keyword: string): Promise<ApiResponse<WorkCenter[]>> {
    return apiClient.get(`${this.baseUrl}/search`, { params: { keyword } });
  }
}

// 创建单例实例
export const workCenterApi = new WorkCenterApiService();

export default workCenterApi;

// 导出类型和API

export { WorkCenterApiService };
