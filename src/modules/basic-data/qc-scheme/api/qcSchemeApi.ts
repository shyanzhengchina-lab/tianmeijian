/**
 * 质检方案API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 质检方案实体
 */
export interface QcScheme {
  id: string;
  code: string;
  name: string;
  category?: string; // 方案分类
  type?: 'incoming' | 'process' | 'outgoing' | 'final'; // 检验类型
  materialId?: string;
  materialCode?: string;
  materialName?: string;
  operationId?: string;
  operationName?: string;
  sampleMethod?: string; // 抽样方法
  sampleLevel?: string; // 抽样水平
  aql?: string; // AQL值
  inspectionItems: Array<{
    id: string;
    qcItemId: string;
    qcItemCode?: string;
    qcItemName?: string;
    sequence: number;
    required: boolean;
  }>;
  status: 'active' | 'inactive';
  version?: string;
  effectiveDate?: string;
  expiryDate?: string;
  description?: string;
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 质检方案类型
 */
export type QcSchemeType = 'incoming' | 'process' | 'outgoing' | 'final';

/**
 * 质检方案查询参数
 */
export interface QcSchemeQuery extends PageQuery {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  materialId?: string;
  operationId?: string;
  status?: string;
}

/**
 * 创建质检方案DTO
 */
export interface CreateQcSchemeDTO {
  code: string;
  name: string;
  category?: string;
  type?: string;
  materialId?: string;
  operationId?: string;
  sampleMethod?: string;
  sampleLevel?: string;
  aql?: string;
  inspectionItems: Array<{
    qcItemId: string;
    sequence: number;
    required: boolean;
  }>;
  status: string;
  version?: string;
  effectiveDate?: string;
  expiryDate?: string;
  description?: string;
  remark?: string;
}

/**
 * 更新质检方案DTO
 */
export interface UpdateQcSchemeDTO extends Partial<CreateQcSchemeDTO> {
  id: string;
}

/**
 * 质检方案状态操作
 */
export interface QcSchemeStatusAction {
  ids: string[];
  status: 'active' | 'inactive';
}

/**
 * 质检方案导入配置
 */
export interface QcSchemeImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 质检方案API服务类
 */
class QcSchemeApiService {
  private readonly baseUrl = '/qc-scheme';

  /**
   * 获取质检方案列表（分页）
   */
  async getQcSchemes(query: QcSchemeQuery): Promise<ApiResponse<PageResult<QcScheme>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有质检方案（不分页）
   */
  async getAllQcSchemes(params?: Record<string, any>): Promise<ApiResponse<QcScheme[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取质检方案详情
   */
  async getQcSchemeById(id: string): Promise<ApiResponse<QcScheme>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建质检方案
   */
  async createQcScheme(data: CreateQcSchemeDTO): Promise<ApiResponse<QcScheme>> {
    return apiClient.post(`${this.baseUrl}/create`, data, {
      showSuccess: true,
      successText: '创建成功',
    });
  }

  /**
   * 更新质检方案
   */
  async updateQcScheme(data: UpdateQcSchemeDTO): Promise<ApiResponse<QcScheme>> {
    return apiClient.put(`${this.baseUrl}/update`, data, {
      showSuccess: true,
      successText: '更新成功',
    });
  }

  /**
   * 删除质检方案
   */
  async deleteQcScheme(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`, undefined, {
      showSuccess: true,
      successText: '删除成功',
    });
  }

  /**
   * 批量删除质检方案
   */
  async deleteQcSchemes(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { ids }, {
      showSuccess: true,
      successText: `成功删除${ids.length}条记录`,
    });
  }

  /**
   * 更新质检方案状态
   */
  async updateStatus(action: QcSchemeStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action, {
      showSuccess: true,
      successText: `成功更新${action.ids.length}条记录状态`,
    });
  }

  /**
   * 批量启用质检方案
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用质检方案
   */
  async batchDisable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入质检方案
   */
  async importQcSchemes(config: QcSchemeImportConfig): Promise<ApiResponse<BatchActionResult>> {
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
   * 导出质检方案
   */
  async exportQcSchemes(query: QcSchemeQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'qc-scheme',
      type: 'excel',
    });
  }

  /**
   * 验证质检方案编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, { params: {
      code,
      excludeId,
    } });
  }

  /**
   * 获取可用物料列表（用于质检方案中选择）
   */
  async getAvailableMaterials(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/material/all');
  }

  /**
   * 获取可用工序列表（用于质检方案中选择）
   */
  async getAvailableOperations(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/operation/all');
  }

  /**
   * 获取可用质检项目列表（用于质检方案中选择）
   */
  async getAvailableQcItems(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/qc-item/all');
  }

  /**
   * 获取质检方案统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    incomingCount: number;
    processCount: number;
    outgoingCount: number;
    finalCount: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 获取质检方案分类树
   */
  async getCategoryTree(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>>> {
    return apiClient.get(`${this.baseUrl}/category-tree`);
  }

  /**
   * 根据物料获取质检方案
   */
  async getQcSchemesByMaterial(materialId: string): Promise<ApiResponse<QcScheme[]>> {
    return apiClient.get(`${this.baseUrl}/by-material`, { params: { materialId } });
  }

  /**
   * 根据工序获取质检方案
   */
  async getQcSchemesByOperation(operationId: string): Promise<ApiResponse<QcScheme[]>> {
    return apiClient.get(`${this.baseUrl}/by-operation`, { params: { operationId } });
  }

  /**
   * 复制质检方案
   */
  async copyQcScheme(id: string): Promise<ApiResponse<QcScheme>> {
    return apiClient.post(`${this.baseUrl}/copy/${id}`, undefined, {
      showSuccess: true,
      successText: '复制成功',
    });
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(qcSchemeId: string): Promise<ApiResponse<QcScheme[]>> {
    return apiClient.get(`${this.baseUrl}/${qcSchemeId}/versions`);
  }

  /**
   * 搜索质检方案
   */
  async searchQcSchemes(keyword: string): Promise<ApiResponse<QcScheme[]>> {
    return apiClient.get(`${this.baseUrl}/search`, { params: { keyword } });
  }
}

// 创建单例实例
export const qcSchemeApi = new QcSchemeApiService();

export default qcSchemeApi;

// 导出类型和API

export { QcSchemeApiService };
