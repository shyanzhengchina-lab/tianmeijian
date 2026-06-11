/**
 * 物料档案API服务
 * 提供类型化的API调用接口
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 物料实体
 */
export interface Material {
  id: string;
  code: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  specification?: string;
  model?: string;
  unitId?: string;
  unitName?: string;
  baseUnitId?: string;
  baseUnitName?: string;
  conversionRate?: number;
  brand?: string;
  manufacturer?: string;
  status: 'active' | 'inactive' | 'draft';
  safetyStock?: number;
  minStock?: number;
  maxStock?: number;
  leadTime?: number;
  description?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  createUserId?: string;
  updateUserId?: string;
}

/**
 * 物料分类
 */
export interface MaterialCategory {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  level?: number;
  sort?: number;
  status: 'active' | 'inactive';
  children?: MaterialCategory[];
}

/**
 * 物料查询参数
 */
export interface MaterialQuery extends PageQuery {
  code?: string;
  name?: string;
  categoryId?: string;
  status?: string;
  brand?: string;
  model?: string;
}

/**
 * 创建物料DTO
 */
export interface CreateMaterialDTO {
  code: string;
  name: string;
  categoryId: string;
  specification?: string;
  model?: string;
  unitId: string;
  baseUnitId?: string;
  conversionRate?: number;
  brand?: string;
  manufacturer?: string;
  status: string;
  safetyStock?: number;
  minStock?: number;
  maxStock?: number;
  leadTime?: number;
  description?: string;
  remark?: string;
}

/**
 * 更新物料DTO
 */
export interface UpdateMaterialDTO extends Partial<CreateMaterialDTO> {
  id: string;
}

/**
 * 物料状态操作
 */
export interface MaterialStatusAction {
  ids: string[];
  status: 'active' | 'inactive';
}

/**
 * 物料API服务类
 */
class MaterialApiService {
  private readonly baseUrl = '/material';

  /**
   * 获取物料列表（分页）
   */
  async getMaterials(query: MaterialQuery): Promise<ApiResponse<PageResult<Material>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有物料（不分页）
   */
  async getAllMaterials(params?: Record<string, any>): Promise<ApiResponse<Material[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取物料详情
   */
  async getMaterialById(id: string): Promise<ApiResponse<Material>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 根据编码获取物料
   */
  async getMaterialByCode(code: string): Promise<ApiResponse<Material>> {
    return apiClient.get(`${this.baseUrl}/code/${code}`);
  }

  /**
   * 创建物料
   */
  async createMaterial(data: CreateMaterialDTO): Promise<ApiResponse<Material>> {
    return apiClient.post(`${this.baseUrl}/create`, data, {
      showSuccess: true,
      successText: '创建成功',
    });
  }

  /**
   * 更新物料
   */
  async updateMaterial(data: UpdateMaterialDTO): Promise<ApiResponse<Material>> {
    return apiClient.put(`${this.baseUrl}/update`, data, {
      showSuccess: true,
      successText: '更新成功',
    });
  }

  /**
   * 删除物料
   */
  async deleteMaterial(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`, undefined, {
      showSuccess: true,
      successText: '删除成功',
    });
  }

  /**
   * 批量删除物料
   */
  async deleteMaterials(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { ids }, {
      showSuccess: true,
      successText: `成功删除${ids.length}条记录`,
    });
  }

  /**
   * 更新物料状态
   */
  async updateStatus(action: MaterialStatusAction): Promise<ApiResponse<BatchActionResult>> {
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
   * 导入物料
   */
  async importMaterials(file: File): Promise<ApiResponse<BatchActionResult>> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post(`${this.baseUrl}/import`, formData, {
      showSuccess: true,
      successText: '导入成功',
    });
  }

  /**
   * 导出物料
   */
  async exportMaterials(query: MaterialQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'material',
      type: 'excel',
    });
  }

  /**
   * 验证物料编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, { params: {
      code,
      excludeId,
    } });
  }

  /**
   * 获取物料分类树
   */
  async getCategoryTree(): Promise<ApiResponse<MaterialCategory[]>> {
    return apiClient.get(`${this.baseUrl}/category-tree`);
  }

  /**
   * 获取物料分类列表
   */
  async getCategories(): Promise<ApiResponse<MaterialCategory[]>> {
    return apiClient.get(`${this.baseUrl}/categories`);
  }

  /**
   * 创建物料分类
   */
  async createCategory(data: Omit<MaterialCategory, 'id' | 'children'>): Promise<ApiResponse<MaterialCategory>> {
    return apiClient.post(`${this.baseUrl}/category/create`, data, {
      showSuccess: true,
      successText: '创建成功',
    });
  }

  /**
   * 更新物料分类
   */
  async updateCategory(data: Omit<MaterialCategory, 'children'>): Promise<ApiResponse<MaterialCategory>> {
    return apiClient.put(`${this.baseUrl}/category/update`, data, {
      showSuccess: true,
      successText: '更新成功',
    });
  }

  /**
   * 删除物料分类
   */
  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/category/${id}`, undefined, {
      showSuccess: true,
      successText: '删除成功',
    });
  }

  /**
   * 获取物料统计信息
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
   * 搜索物料
   */
  async searchMaterials(keyword: string): Promise<ApiResponse<Material[]>> {
    return apiClient.get(`${this.baseUrl}/search`, { params: { keyword } });
  }
}

// 创建单例实例
export const materialApi = new MaterialApiService();

export default materialApi;

// 导出类型和API

export { MaterialApiService };
