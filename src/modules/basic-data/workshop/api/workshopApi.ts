/**
 * 车间档案API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 车间实体
 */
export interface Workshop {
  id: string;
  code: string;
  name: string;
  type?: 'production' | 'assembly' | 'warehouse' | 'other'; // 车间类型
  category?: string; // 车间分类
  location?: string;
  area?: number; // 面积（平方米）
  capacity?: number; // 产能
  managerId?: string;
  managerName?: string;
  contactPhone?: string;
  status: 'active' | 'inactive';
  description?: string;
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 车间类型
 */
export type WorkshopType = 'production' | 'assembly' | 'warehouse' | 'other';

/**
 * 车间查询参数
 */
export interface WorkshopQuery extends PageQuery {
  code?: string;
  name?: string;
  type?: string;
  category?: string;
  status?: string;
  managerId?: string;
}

/**
 * 创建车间DTO
 */
export interface CreateWorkshopDTO {
  code: string;
  name: string;
  type?: string;
  category?: string;
  location?: string;
  area?: number;
  capacity?: number;
  managerId?: string;
  contactPhone?: string;
  status: string;
  description?: string;
  remark?: string;
}

/**
 * 更新车间DTO
 */
export interface UpdateWorkshopDTO extends Partial<CreateWorkshopDTO> {
  id: string;
}

/**
 * 车间状态操作
 */
export interface WorkshopStatusAction {
  ids: string[];
  status: 'active' | 'inactive';
}

/**
 * 车间导入配置
 */
export interface WorkshopImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 车间API服务类
 */
class WorkshopApiService {
  private readonly baseUrl = '/workshop';

  /**
   * 获取车间列表（分页）
   */
  async getWorkshops(query: WorkshopQuery): Promise<ApiResponse<PageResult<Workshop>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有车间（不分页）
   */
  async getAllWorkshops(params?: Record<string, any>): Promise<ApiResponse<Workshop[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取车间详情
   */
  async getWorkshopById(id: string): Promise<ApiResponse<Workshop>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建车间
   */
  async createWorkshop(data: CreateWorkshopDTO): Promise<ApiResponse<Workshop>> {
    return apiClient.post(`${this.baseUrl}/create`, data, {
      showSuccess: true,
      successText: '创建成功',
    });
  }

  /**
   * 更新车间
   */
  async updateWorkshop(data: UpdateWorkshopDTO): Promise<ApiResponse<Workshop>> {
    return apiClient.put(`${this.baseUrl}/update`, data, {
      showSuccess: true,
      successText: '更新成功',
    });
  }

  /**
   * 删除车间
   */
  async deleteWorkshop(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`, undefined, {
      showSuccess: true,
      successText: '删除成功',
    });
  }

  /**
   * 批量删除车间
   */
  async deleteWorkshops(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { ids }, {
      showSuccess: true,
      successText: `成功删除${ids.length}条记录`,
    });
  }

  /**
   * 更新车间状态
   */
  async updateStatus(action: WorkshopStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action, {
      showSuccess: true,
      successText: `成功更新${action.ids.length}条记录状态`,
    });
  }

  /**
   * 批量启用车间
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用车间
   */
  async batchDisable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入车间
   */
  async importWorkshops(config: WorkshopImportConfig): Promise<ApiResponse<BatchActionResult>> {
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
   * 导出车间
   */
  async exportWorkshops(query: WorkshopQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'workshop',
      type: 'excel',
    });
  }

  /**
   * 验证车间编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, { params: {
      code,
      excludeId,
    } });
  }

  /**
   * 获取可用员工列表（用于车间负责人中选择）
   */
  async getAvailableEmployees(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/employee/all');
  }

  /**
   * 获取车间统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    typeCount: number;
    totalArea: number;
    totalCapacity: number;
    workCenterCount: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 获取车间分类树
   */
  async getCategoryTree(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>>> {
    return apiClient.get(`${this.baseUrl}/category-tree`);
  }

  /**
   * 根据类型筛选车间
   */
  async getWorkshopsByType(type: string): Promise<ApiResponse<Workshop[]>> {
    return apiClient.get(`${this.baseUrl}/by-type`, { params: { type } });
  }

  /**
   * 复制车间
   */
  async copyWorkshop(id: string): Promise<ApiResponse<Workshop>> {
    return apiClient.post(`${this.baseUrl}/copy/${id}`, undefined, {
      showSuccess: true,
      successText: '复制成功',
    });
  }

  /**
   * 搜索车间
   */
  async searchWorkshops(keyword: string): Promise<ApiResponse<Workshop[]>> {
    return apiClient.get(`${this.baseUrl}/search`, { params: { keyword } });
  }
}

// 创建单例实例
export const workshopApi = new WorkshopApiService();

export default workshopApi;

// 导出类型和API

export { WorkshopApiService };
