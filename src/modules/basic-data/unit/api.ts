/**
 * 计量单位模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { ApiResponse, PageResult } from '../../../shared/api/requestTypes';
import type {
  UnitItem,
  UnitGroup,
  UnitQuery,
  CreateUnitDTO,
  UpdateUnitDTO,
  UnitBatchAction,
} from './types';

/**
 * 单位API服务类
 * 封装所有单位相关的API调用
 */
class UnitApiService {
  /**
   * 分页查询单位列表
   */
  async getUnits(query: UnitQuery): Promise<PageResult<UnitItem>> {
    return await apiClient.get<PageResult<UnitItem>>(
      '/unit/page',
      { params: query }
    );
  }

  /**
   * 获取所有单位列表（不分页）
   */
  async getAllUnits(): Promise<UnitItem[]> {
    return await apiClient.get<UnitItem[]>('/unit/list');
  }

  /**
   * 根据ID获取单位详情
   */
  async getUnitById(id: string): Promise<UnitItem> {
    return await apiClient.get<UnitItem>(`/unit/${id}`);
  }

  /**
   * 根据编码获取单位
   */
  async getUnitByCode(code: string): Promise<UnitItem> {
    return await apiClient.get<UnitItem>('/unit/byCode', {
      params: { code },
    });
  }

  /**
   * 创建单位
   */
  async createUnit(data: CreateUnitDTO): Promise<UnitItem> {
    return await apiClient.post<UnitItem>('/unit', data);
  }

  /**
   * 更新单位
   */
  async updateUnit(data: UpdateUnitDTO): Promise<UnitItem> {
    return await apiClient.put<UnitItem>('/unit', data);
  }

  /**
   * 批量删除单位
   */
  async deleteUnits(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/unit', { data: ids });
  }

  /**
   * 批量操作单位
   */
  async batchUnits(action: UnitBatchAction): Promise<void> {
    await apiClient.put<void>('/unit/batch', action);
  }

  /**
   * 更新单位状态
   */
  async updateStatus(ids: string[], status: 'active' | 'disabled'): Promise<void> {
    await apiClient.put<void>('/unit/status', { ids, status });
  }

  /**
   * 设置基础单位
   */
  async setBaseUnit(id: string): Promise<void> {
    await apiClient.put<void>(`/unit/${id}/setBase`, {});
  }

  /**
   * 取消基础单位
   */
  async unsetBaseUnit(id: string): Promise<void> {
    await apiClient.put<void>(`/unit/${id}/unsetBase`, {});
  }

  /**
   * 获取单位分组树
   */
  async getGroupTree(): Promise<UnitGroup[]> {
    return await apiClient.get<UnitGroup[]>('/unit/group/tree');
  }

  /**
   * 创建单位分组
   */
  async createGroup(group: Partial<UnitGroup>): Promise<UnitGroup> {
    return await apiClient.post<UnitGroup>('/unit/group', group);
  }

  /**
   * 更新单位分组
   */
  async updateGroup(group: UnitGroup): Promise<UnitGroup> {
    return await apiClient.put<UnitGroup>('/unit/group', group);
  }

  /**
   * 删除单位分组
   */
  async deleteGroup(id: string): Promise<void> {
    await apiClient.delete<void>(`/unit/group/${id}`);
  }

  /**
   * 检查单位编码是否存在
   */
  async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/unit/checkCode', {
      params: { code, excludeId },
    });
  }

  /**
   * 导入单位
   */
  async importUnits(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/unit/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出单位
   */
  async exportUnits(query: UnitQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/unit/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取基础单位列表
   */
  async getBaseUnits(): Promise<UnitItem[]> {
    return await apiClient.get<UnitItem[]>('/unit/base');
  }
}

// 导出API服务单例
export const unitApi = new UnitApiService();