/**
 * 物料模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse, PageResult } from '../../../shared/api/requestTypes';
import type {
  Material,
  MaterialQuery,
  CreateMaterialDTO,
  UpdateMaterialDTO,
  MaterialCategory,
  MaterialBatchAction,
} from './types';

/**
 * 物料API服务类
 * 封装所有物料相关的API调用
 */
class MaterialApiService {
  /**
   * 分页查询物料列表
   */
  async getMaterials(query: MaterialQuery): Promise<PageResult<Material>> {
    return await apiClient.get<PageResult<Material>>(
      '/material/page',
      { params: query }
    );
  }

  /**
   * 根据ID获取物料详情
   */
  async getMaterialById(id: string): Promise<Material> {
    return await apiClient.get<Material>(`/material/${id}`);
  }

  /**
   * 根据编码获取物料
   */
  async getMaterialByCode(code: string): Promise<Material> {
    return await apiClient.get<Material>('/material/byCode', {
      params: { code },
    });
  }

  /**
   * 创建物料
   */
  async createMaterial(data: CreateMaterialDTO): Promise<Material> {
    return await apiClient.post<Material>('/material', data);
  }

  /**
   * 更新物料
   */
  async updateMaterial(data: UpdateMaterialDTO): Promise<Material> {
    return await apiClient.put<Material>('/material', data);
  }

  /**
   * 批量删除物料
   */
  async deleteMaterials(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/material', { data: ids });
  }

  /**
   * 批量操作物料
   */
  async batchMaterials(action: MaterialBatchAction): Promise<void> {
    await apiClient.put<void>('/material/batch', action);
  }

  /**
   * 更新物料状态
   */
  async updateStatus(ids: string[], status: 'active' | 'inactive'): Promise<void> {
    await apiClient.put<void>('/material/status', { ids, status });
  }

  /**
   * 获取物料分类树
   */
  async getCategoryTree(): Promise<MaterialCategory[]> {
    return await apiClient.get<MaterialCategory[]>('/material/category/tree');
  }

  /**
   * 创建物料分类
   */
  async createCategory(category: Partial<MaterialCategory>): Promise<MaterialCategory> {
    return await apiClient.post<MaterialCategory>('/material/category', category);
  }

  /**
   * 更新物料分类
   */
  async updateCategory(category: MaterialCategory): Promise<MaterialCategory> {
    return await apiClient.put<MaterialCategory>('/material/category', category);
  }

  /**
   * 删除物料分类
   */
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete<void>(`/material/category/${id}`);
  }

  /**
   * 导入物料
   */
  async importMaterials(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/material/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出物料
   */
  async exportMaterials(query: MaterialQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/material/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 检查物料编码是否存在
   */
  async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/material/checkCode', {
      params: { code, excludeId },
    });
  }
}

// 导出API服务单例
export const materialApi = new MaterialApiService();