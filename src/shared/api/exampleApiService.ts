/**
 * 示例API服务
 * 演示如何使用基础API服务类进行业务API对接
 */

import { BaseApiService } from './baseApiService';

/**
 * 物料DTO接口（示例）
 */
interface MaterialDTO {
  id?: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'RAW' | 'SEMIFINISHED' | 'FINISHED';
  description?: string;
}

/**
 * 物料查询DTO（示例）
 */
interface MaterialQuery {
  code?: string;
  name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  type?: 'RAW' | 'SEMIFINISHED' | 'FINISHED';
  page?: number;
  pageSize?: number;
  current?: number;
}

/**
 * 分页结果DTO
 */
interface MaterialPageResult {
  list: MaterialDTO[];
  total: number;
  code: number;
  message: string;
}

/**
 * 示例API服务
 * 演示具体的业务API对接实现
 */
export class MaterialApiService extends BaseApiService {
  private readonly MATERIAL_API = '/materials';

  /**
   * 获取物料列表
   */
  async getMaterials(query: MaterialQuery): Promise<MaterialPageResult> {
    return await this.get<MaterialDTO>('/materials', query as any) as any;
  }

  /**
   * 根据ID获取物料
   */
  async getMaterialById(id: string): Promise<MaterialDTO> {
    return await this.post<MaterialDTO>(`${this.MATERIAL_API}/${id}`, {}) as any;
  }

  /**
   * 创建物料
   */
  async createMaterial(data: Omit<MaterialDTO, 'id'>): Promise<MaterialDTO> {
    try {
      const result = await this.post<MaterialDTO>(this.MATERIAL_API, data);
      this.showSuccess(`创建物料 ${data.name} 成功`);
      return result;
    } catch (error: any) {
      await this.handleApiError(error, '创建物料', '创建物料失败');
      throw error;
    }
  }

  /**
   * 更新物料
   */
  async updateMaterial(data: MaterialDTO): Promise<MaterialDTO> {
    try {
      const result = await this.put<MaterialDTO>(`${this.MATERIAL_API}/${data.id}`, data);
      this.showSuccess(`更新物料 ${data.name} 成功`);
      return result;
    } catch (error: any) {
      await this.handleApiError(error, '更新物料', '更新物料失败');
      throw error;
    }
  }

  /**
   * 删除物料
   */
  async deleteMaterials(ids: string[]): Promise<void> {
    try {
      await this.delete<void>(this.MATERIAL_API, { ids });
      this.showSuccess(`成功删除 ${ids.length} 个物料`);
    } catch (error: any) {
      await this.handleApiError(error, '删除物料', '删除物料失败');
      throw error;
    }
  }

  /**
   * 批量更新物料状态
   */
  async batchUpdateStatus(
    ids: string[],
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<void> {
    try {
      await this.batch<void>(`${this.MATERIAL_API}/batch-status`, { ids, status });
      this.showSuccess(`批量${status === 'ACTIVE' ? '启用' : '停用'} ${ids.length} 个物料成功`);
    } catch (error: any) {
      await this.handleApiError(error, '批量更新状态', '批量更新状态失败');
      throw error;
    }
  }

  /**
   * 导入物料
   */
  async importMaterials(file: File): Promise<MaterialPageResult> {
    try {
      const result = await this.uploadFile<MaterialPageResult>(
        `${this.MATERIAL_API}/import`,
        file,
        (progress) => {
          console.log(`导入进度: ${progress}%`);
        }
      );
      this.showSuccess('物料导入完成');
      return result;
    } catch (error: any) {
      await this.handleApiError(error, '导入物料', '导入物料失败');
      throw error;
    }
  }

  /**
   * 导出物料
   */
  async exportMaterials(query: MaterialQuery): Promise<any> {
    try {
      const response = await this.post<any>(`${this.MATERIAL_API}/export`, query);
      this.showSuccess('物料导出请求已提交');
      return response;
    } catch (error: any) {
      await this.handleApiError(error, '导出物料', '导出物料失败');
      throw error;
    }
  }
}

/**
 * 导出单例实例
 */
export const materialApi = new MaterialApiService();
