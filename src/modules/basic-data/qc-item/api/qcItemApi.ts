/**
 * 质检项目API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 质检项目实体
 */
export interface QcItem {
  id: string;
  code: string;
  name: string;
  category?: string; // 检验分类
  type?: 'dimension' | 'visual' | 'physical' | 'chemical' | 'functional'; // 检验类型
  method?: string; // 检验方法
  standard?: string; // 检验标准
  tolerance?: string; // 公差
  unitId?: string;
  unitName?: string;
  criticalLevel?: 'critical' | 'major' | 'minor'; // 关键等级
  sampleMethod?: string; // 抽样方法
  sampleSize?: number; // 抽样数量
  inspectionLevel?: string; // 检验水平
  acceptanceCriteria?: string; // 接收标准
  description?: string;
  status: 'active' | 'inactive';
  version?: string; // 版本
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 检验类型
 */
export type InspectionType = 'dimension' | 'visual' | 'physical' | 'chemical' | 'functional';

/**
 * 关键等级
 */
export type CriticalLevel = 'critical' | 'major' | 'minor';

/**
 * 质检项目查询参数
 */
export interface QcItemQuery extends PageQuery {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  criticalLevel?: string;
  status?: string;
}

/**
 * 创建质检项目DTO
 */
export interface CreateQcItemDTO {
  code: string;
  name: string;
  category?: string;
  type?: string;
  method?: string;
  standard?: string;
  tolerance?: string;
  unitId?: string;
  criticalLevel?: string;
  sampleMethod?: string;
  sampleSize?: number;
  inspectionLevel?: string;
  acceptanceCriteria?: string;
  description?: string;
  status: string;
  version?: string;
  remark?: string;
}

/**
 * 更新质检项目DTO
 */
export interface UpdateQcItemDTO extends Partial<CreateQcItemDTO> {
  id: string;
}

/**
 * 质检项目状态操作
 */
export interface QcItemStatusAction {
  ids: string[];
  status: 'active' | 'inactive';
}

/**
 * 质检项目导入配置
 */
export interface QcItemImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 质检项目API服务类
 */
class QcItemApiService {
  private readonly baseUrl = '/qc-item';

  /**
   * 获取质检项目列表（分页）
   */
  async getQcItems(query: QcItemQuery): Promise<ApiResponse<PageResult<QcItem>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有质检项目（不分页）
   */
  async getAllQcItems(params?: Record<string, any>): Promise<ApiResponse<QcItem[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取质检项目详情
   */
  async getQcItemById(id: string): Promise<ApiResponse<QcItem>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建质检项目
   */
  async createQcItem(data: CreateQcItemDTO): Promise<ApiResponse<QcItem>> {
    return apiClient.post(`${this.baseUrl}/create`, data, {
      showSuccess: true,
      successText: '创建成功',
    });
  }

  /**
   * 更新质检项目
   */
  async updateQcItem(data: UpdateQcItemDTO): Promise<ApiResponse<QcItem>> {
    return apiClient.put(`${this.baseUrl}/update`, data, {
      showSuccess: true,
      successText: '更新成功',
    });
  }

  /**
   * 删除质检项目
   */
  async deleteQcItem(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`, undefined, {
      showSuccess: true,
      successText: '删除成功',
    });
  }

  /**
   * 批量删除质检项目
   */
  async deleteQcItems(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { ids }, {
      showSuccess: true,
      successText: `成功删除${ids.length}条记录`,
    });
  }

  /**
   * 更新质检项目状态
   */
  async updateStatus(action: QcItemStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action, {
      showSuccess: true,
      successText: `成功更新${action.ids.length}条记录状态`,
    });
  }

  /**
   * 批量启用质检项目
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用质检项目
   */
  async batchDisable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入质检项目
   */
  async importQcItems(config: QcItemImportConfig): Promise<ApiResponse<BatchActionResult>> {
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
   * 导出质检项目
   */
  async exportQcItems(query: QcItemQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'qc-item',
      type: 'excel',
    });
  }

  /**
   * 验证质检项目编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, { params: {
      code,
      excludeId,
    } });
  }

  /**
   * 获取可用单位列表（用于质检项目中选择）
   */
  async getAvailableUnits(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/unit/all');
  }

  /**
   * 获取质检项目统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    categoryCount: number;
    criticalCount: number;
    majorCount: number;
    minorCount: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 获取质检分类树
   */
  async getCategoryTree(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>>> {
    return apiClient.get(`${this.baseUrl}/category-tree`);
  }

  /**
   * 根据检验类型筛选质检项目
   */
  async getQcItemsByType(type: string): Promise<ApiResponse<QcItem[]>> {
    return apiClient.get(`${this.baseUrl}/by-type`, { params: { type } });
  }

  /**
   * 根据关键等级筛选质检项目
   */
  async getQcItemsByCriticalLevel(criticalLevel: string): Promise<ApiResponse<QcItem[]>> {
    return apiClient.get(`${this.baseUrl}/by-critical-level`, { params: { criticalLevel } });
  }

  /**
   * 复制质检项目
   */
  async copyQcItem(id: string): Promise<ApiResponse<QcItem>> {
    return apiClient.post(`${this.baseUrl}/copy/${id}`, undefined, {
      showSuccess: true,
      successText: '复制成功',
    });
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(qcItemId: string): Promise<ApiResponse<QcItem[]>> {
    return apiClient.get(`${this.baseUrl}/${qcItemId}/versions`);
  }

  /**
   * 搜索质检项目
   */
  async searchQcItems(keyword: string): Promise<ApiResponse<QcItem[]>> {
    return apiClient.get(`${this.baseUrl}/search`, { params: { keyword } });
  }
}

// 创建单例实例
export const qcItemApi = new QcItemApiService();

export default qcItemApi;

// 导出类型和API

export { QcItemApiService };
