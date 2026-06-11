/**
 * 计量单位API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 计量单位实体
 */
export interface Unit {
  id: string;
  code: string;
  name: string;
  category: 'base' | 'auxiliary' | 'custom';
  symbol?: string;
  baseUnitId?: string;
  conversionRate?: number;
  decimalPlaces?: number;
  status: 'active' | 'inactive';
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createUserId?: string;
  updateUserId?: string;
}

/**
 * 单位分类
 */
export type UnitCategory = 'base' | 'auxiliary' | 'custom';

/**
 * 查询参数
 */
export interface UnitQuery extends PageQuery {
  code?: string;
  name?: string;
  category?: UnitCategory;
  status?: string;
}

/**
 * 创建单位DTO
 */
export interface CreateUnitDTO {
  code: string;
  name: string;
  category: UnitCategory;
  symbol?: string;
  baseUnitId?: string;
  conversionRate?: number;
  decimalPlaces?: number;
  status: string;
  remark?: string;
}

/**
 * 更新单位DTO
 */
export interface UpdateUnitDTO extends Partial<CreateUnitDTO> {
  id: string;
}

/**
 * 单位状态操作
 */
export interface UnitStatusAction {
  ids: string[];
  status: 'active' | 'inactive';
}

/**
 * 计量单位API服务类
 */
class UnitApiService {
  private readonly baseUrl = '/unit';

  /**
   * 获取单位列表（分页）
   */
  async getUnits(query: UnitQuery): Promise<ApiResponse<PageResult<Unit>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有单位（不分页）
   */
  async getAllUnits(): Promise<ApiResponse<Unit[]>> {
    return apiClient.get(`${this.baseUrl}/all`);
  }

  /**
   * 根据ID获取单位
   */
  async getUnitById(id: string): Promise<ApiResponse<Unit>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建单位
   */
  async createUnit(data: CreateUnitDTO): Promise<ApiResponse<Unit>> {
    return apiClient.post(`${this.baseUrl}/create`, data);
  }

  /**
   * 更新单位
   */
  async updateUnit(data: UpdateUnitDTO): Promise<ApiResponse<Unit>> {
    return apiClient.put(`${this.baseUrl}/update`, data);
  }

  /**
   * 删除单位
   */
  async deleteUnit(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * 批量删除单位
   */
  async deleteUnits(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { params: { ids } });
  }

  /**
   * 更新单位状态
   */
  async updateStatus(action: UnitStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action);
  }

  /**
   * 批量启用
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用
   */
  async batchDisable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入单位
   */
  async importUnits(file: File): Promise<ApiResponse<BatchActionResult>> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post(`${this.baseUrl}/import`, formData);
  }

  /**
   * 导出单位
   */
  async exportUnits(query: UnitQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'unit',
      type: 'excel',
    });
  }

  /**
   * 验证单位编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, {
      params: { code, excludeId },
    });
  }

  /**
   * 获取单位统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    categoryCount: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 搜索单位
   */
  async searchUnits(keyword: string): Promise<ApiResponse<Unit[]>> {
    return apiClient.get(`${this.baseUrl}/search`, { params: { keyword } });
  }
}

// 创建单例实例
export const unitApi = new UnitApiService();

export default unitApi;

// 导出类型和API

export { UnitApiService };
