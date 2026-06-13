/**
 * BOM（物料清单）API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * BOM实体
 */
export interface Bom {
  id: string;
  code: string;
  name: string;
  version?: string;
  materialId: string;
  materialCode?: string;
  materialName?: string;
  quantity: number;
  unitId?: string;
  unitName?: string;
  status: 'active' | 'inactive' | 'draft';
  effectiveDate?: string;
  expiryDate?: string;
  isDefault?: boolean;
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * BOM物料明细
 */
export interface BomDetail {
  id: string;
  bomId: string;
  materialId: string;
  materialCode?: string;
  materialName?: string;
  quantity: number;
  unitId?: string;
  unitName?: string;
  isKeyMaterial?: boolean;
  scrapRate?: number;
  substituteMaterials?: string[];
  remark?: string;
}

/**
 * BOM查询参数
 */
export interface BomQuery extends PageQuery {
  code?: string;
  name?: string;
  materialId?: string;
  version?: string;
  status?: string;
}

/**
 * 创建BOM DTO
 */
export interface CreateBomDTO {
  code: string;
  name: string;
  version?: string;
  effectiveDate?: string;
  expiryDate?: string;
  materialId: string;
  details: BomDetail[];
  status: string;
  isDefault?: boolean;
  remark?: string;
}

/**
 * 更新BOM DTO
 */
export interface UpdateBomDTO extends Partial<CreateBomDTO> {
  id: string;
}

/**
 * BOM状态操作
 */
export interface BomStatusAction {
  ids: string[];
  status: 'active' | 'inactive' | 'draft';
}

/**
 * BOM导入配置
 */
export interface BomImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * BOM API服务类
 */
class BomApiService {
  private readonly baseUrl = '/boms';

  /**
   * 获取BOM列表（分页）
   * 后端 /boms/list 返回 data 直接为数组，此处归一化为 {list, total} 分页结构
   */
  async getBoms(query: BomQuery): Promise<ApiResponse<PageResult<Bom>>> {
    const res = await apiClient.getPage(`${this.baseUrl}/list`, query) as any;
    // 若 data 是数组，包装为分页对象
    if (res && Array.isArray(res.data)) {
      res.data = { list: res.data, total: res.data.length, current: 1, pageSize: res.data.length };
    }
    return res;
  }

  /**
   * 获取所有BOM（不分页）
   */
  async getAllBoms(params?: Record<string, any>): Promise<ApiResponse<Bom[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取BOM详情
   */
  async getBomById(id: string): Promise<ApiResponse<Bom>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 获取BOM的物料明细
   */
  async getBomDetails(bomId: string): Promise<ApiResponse<BomDetail[]>> {
    return apiClient.get(`${this.baseUrl}/${bomId}/details`);
  }

  /**
   * 创建BOM
   */
  async createBom(data: CreateBomDTO): Promise<ApiResponse<Bom>> {
    return apiClient.post(`${this.baseUrl}/create`, data);
  }

  /**
   * 更新BOM
   */
  async updateBom(data: UpdateBomDTO): Promise<ApiResponse<Bom>> {
    return apiClient.put(`${this.baseUrl}/update`, data);
  }

  /**
   * 删除BOM
   */
  async deleteBom(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * 批量删除BOM
   */
  async deleteBoms(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { params: { ids } });
  }

  /**
   * 更新BOM状态
   */
  async updateStatus(action: BomStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action);
  }

  /**
   * 批量启用BOM
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用BOM
   */
  async batchDisable(ids: string[]): Promise< ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入BOM
   */
  async importBoms(config: BomImportConfig): Promise<ApiResponse<BatchActionResult>> {
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
   * 导出BOM
   */
  async exportBoms(query: BomQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'bom',
      type: 'excel',
    });
  }

  /**
   * 验证BOM编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, {
      params: { code, excludeId },
    });
  }

  /**
   * 获取可用物料列表（用于BOM中选择）
   */
  async getAvailableMaterials(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/material/all');
  }

  /**
   * 计算BOM成本
   */
  async calculateCost(bomId: string): Promise<ApiResponse<{
    totalCost: number;
    materialCosts: Array<{ materialId: string; materialName: string; quantity: number; unitCost: number }>
  }>> {
    return apiClient.get(`${this.baseUrl}/${bomId}/cost`);
  }

  /**
   * 检查BOM版本冲突
   */
  async checkVersionConflict(version: string, materialId: string, excludeId?: string): Promise<ApiResponse<{ conflict: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-version`, {
      params: { version, materialId, excludeId },
    });
  }

  /**
   * 复制BOM
   */
  async copyBom(id: string): Promise<ApiResponse<Bom>> {
    return apiClient.post(`${this.baseUrl}/copy/${id}`);
  }

  /**
   * 设置为默认BOM
   */
  async setAsDefault(id: string): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/${id}/default`);
  }

  /**
   * 取消默认BOM
   */
  async cancelDefault(id: string): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/${id}/cancel-default`);
  }

  /**
   * 获取BOM版本历史
   */
  async getVersionHistory(bomId: string): Promise<ApiResponse<Bom[]>> {
    return apiClient.get(`${this.baseUrl}/${bomId}/versions`);
  }
}

// 创建单例实例
export const bomApi = new BomApiService();

export default bomApi;

export { BomApiService };
