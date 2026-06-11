/**
 * 物料清单(BOM)模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  BomHeader,
  BomQuery,
  CreateBomDTO,
  UpdateBomDTO,
  BomBatchAction,
} from './types';

/**
 * BOM API服务类
 * 封装所有BOM相关的API调用
 */
class BomApiService {
  /**
   * 分页查询BOM列表
   */
  async getBoms(query: BomQuery): Promise<PageResult<BomHeader>> {
    return await apiClient.get<PageResult<BomHeader>>(
      '/bom/page',
      { params: query }
    );
  }

  /**
   * 获取所有BOM列表（不分页）
   */
  async getAllBoms(): Promise<BomHeader[]> {
    return await apiClient.get<BomHeader[]>('/bom/list');
  }

  /**
   * 根据ID获取BOM详情（含明细）
   */
  async getBomById(id: string): Promise<BomHeader> {
    return await apiClient.get<BomHeader>(`/bom/${id}`);
  }

  /**
   * 根据编码获取BOM
   */
  async getBomByCode(code: string): Promise<BomHeader> {
    return await apiClient.get<BomHeader>('/bom/byCode', {
      params: { code },
    });
  }

  /**
   * 创建BOM
   */
  async createBom(data: CreateBomDTO): Promise<BomHeader> {
    return await apiClient.post<BomHeader>('/bom', data);
  }

  /**
   * 更新BOM
   */
  async updateBom(data: UpdateBomDTO): Promise<BomHeader> {
    return await apiClient.put<BomHeader>('/bom', data);
  }

  /**
   * 批量删除BOM
   */
  async deleteBoms(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/bom', { data: ids });
  }

  /**
   * 批量操作BOM
   */
  async batchBoms(action: BomBatchAction): Promise<void> {
    await apiClient.put<void>('/bom/batch', action);
  }

  /**
   * 审核BOM
   */
  async reviewBom(id: string, reviewer: string): Promise<void> {
    await apiClient.put<void>(`/bom/${id}/review`, { reviewer });
  }

  /**
   * 撤销审核
   */
  async unreviewBom(id: string): Promise<void> {
    await apiClient.put<void>(`/bom/${id}/un-review`);
  }

  /**
   * 批准BOM
   */
  async approveBom(id: string, approver: string): Promise<void> {
    await apiClient.put<void>(`/bom/${id}/approve`, { approver });
  }

  /**
   * 更新BOM状态
   */
  async updateStatus(ids: string[], status: 'draft' | 'audited' | 'approved' | 'disabled'): Promise<void> {
    await apiClient.put<void>('/bom/status', { ids, status });
  }

  /**
   * 检查BOM编码是否存在
   */
  async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/bom/checkCode', {
      params: { code, excludeId },
    });
  }

  /**
   * 获取BOM统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    draftCount: number;
    auditedCount: number;
    approvedCount: number;
    disabledCount: number;
    typeStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      draftCount: number;
      auditedCount: number;
      approvedCount: number;
      disabledCount: number;
      typeStats: Record<string, number>;
    }>('/bom/statistics');
    return (response as any).data;
  }

  /**
   * 导入BOM
   */
  async importBoms(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/bom/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出BOM
   */
  async exportBoms(query: BomQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/bom/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 导出BOM明细
   */
  async exportBomDetail(id: string): Promise<Blob> {
    return await apiClient.get<Blob>(`/bom/${id}/export`, {
      responseType: 'blob',
    });
  }

  /**
   * 获取BOM版本历史
   */
  async getVersionHistory(code: string): Promise<BomHeader[]> {
    return await apiClient.get<BomHeader[]>(`/bom/${code}/versions`);
  }

  /**
   * 复制BOM
   */
  async copyBom(id: string, newCode: string, newVersion: string): Promise<BomHeader> {
    return await apiClient.post<BomHeader>(`/bom/${id}/copy`, {
      newCode,
      newVersion,
    });
  }
}

// 导出API服务单例
export const bomApi = new BomApiService();
