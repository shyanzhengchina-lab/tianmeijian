/**
 * 工厂管理模块API服务
 * 多工厂配置和切换的完整API对接实现
 */

import { BaseApiService } from '../../../../shared/api/baseApiService';
import type { PageResult } from '../../../../shared/api/requestTypes';
import type {
  FactoryConfig,
  FactoryQuery,
  CreateFactoryDTO,
  UpdateFactoryDTO,
  SwitchFactoryDTO,
  UserFactoryAuth,
  FactoryStats,
} from '../types';

/**
 * 工厂查询DTO
 */
export interface FactoryQueryParams {
  status?: 'ACTIVE' | 'INACTIVE'; // 状态筛选
  name?: string; // 工厂名称筛选
  code?: string; // 工厂编码筛选
  currentPage?: number;
  pageSize?: number;
}

/**
 * 工厂统计数据DTO
 */
export interface FactoryStatisticsDTO {
  totalFactories: number;
  activeFactories: number;
  inactiveFactories: number;
  totalUsers: number;
  totalWorkcenters: number;
  productionStats: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
  };
  equipmentStats: {
    totalEquipment: number;
    runningEquipment: number;
    stoppedEquipment: number;
    maintenanceEquipment: number;
  };
}

/**
 * 工厂用户DTO
 */
export interface FactoryUserDTO {
  userId: string;
  userName: string;
  userCode: string;
  role: string;
  permissions: string[];
}

/**
 * 分页结果DTO
 */
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  code: number;
  message: string;
}

/**
 * 工厂管理模块API服务类
 * 继承基础API服务，实现工厂管理的所有API调用
 */
export class FactoryApiService extends BaseApiService {
  private readonly FACTORY_API = '/api/system/factories';

  constructor() {
    super();
  }

  /**
   * 获取工厂列表（分页）
   */
  async getFactoryList(query: FactoryQueryParams): Promise<PaginatedResponse<FactoryConfig>> {
    return await this.get<PaginatedResponse<FactoryConfig>>(
      `${this.FACTORY_API}`,
      query as any
    );
  }

  /**
   * 获取工厂详情
   */
  async getFactoryDetail(id: string): Promise<FactoryConfig> {
    return await this.get<FactoryConfig>(`${this.FACTORY_API}/${id}`);
  }

  /**
   * 获取所有工厂（不分页，用于下拉选择）
   */
  async getAllFactories(): Promise<FactoryConfig[]> {
    const response = await this.get<PaginatedResponse<FactoryConfig>>(
      `${this.FACTORY_API}/all`,
      { currentPage: 1, pageSize: 1000 }
    );
    return response.list;
  }

  /**
   * 创建工厂
   */
  async createFactory(data: CreateFactoryDTO): Promise<FactoryConfig> {
    return await this.post<FactoryConfig>(`${this.FACTORY_API}`, data);
  }

  /**
   * 更新工厂
   */
  async updateFactory(data: UpdateFactoryDTO): Promise<FactoryConfig> {
    return await this.put<FactoryConfig>(`${this.FACTORY_API}/${data.id}`, data);
  }

  /**
   * 删除工厂
   */
  async deleteFactory(ids: string[]): Promise<void> {
    return await this.delete<void>(`${this.FACTORY_API}`, { ids });
  }

  /**
   * 更新工厂状态
   */
  async updateFactoryStatus(ids: string[], status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    return await this.post<void>(`${this.FACTORY_API}/status`, { ids, status });
  }

  /**
   * 切换工厂
   */
  async switchFactory(data: SwitchFactoryDTO): Promise<void> {
    return await this.post<void>(`${this.FACTORY_API}/switch`, data);
  }

  /**
   * 获取用户工厂授权
   */
  async getUserFactoryAuth(userId: string): Promise<UserFactoryAuth> {
    return await this.get<UserFactoryAuth>(`${this.FACTORY_API}/user/${userId}/auth`);
  }

  /**
   * 更新用户工厂授权
   */
  async updateUserFactoryAuth(data: UserFactoryAuth): Promise<void> {
    return await this.put<void>(`${this.FACTORY_API}/user/auth`, data);
  }

  /**
   * 获取工厂统计信息
   */
  async getFactoryStats(factoryId: string): Promise<FactoryStats> {
    return await this.get<FactoryStats>(`${this.FACTORY_API}/${factoryId}/stats`);
  }

  /**
   * 获取当前用户可访问的工厂列表
   */
  async getAvailableFactories(): Promise<FactoryConfig[]> {
    const response = await this.get<PaginatedResponse<FactoryConfig>>(
      `${this.FACTORY_API}/available`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 获取当前工厂配置
   */
  async getCurrentFactory(): Promise<FactoryConfig> {
    return await this.get<FactoryConfig>(`${this.FACTORY_API}/current`);
  }

  /**
   * 获取工厂用户列表
   */
  async getFactoryUsers(factoryId: string): Promise<PaginatedResponse<FactoryUserDTO>> {
    return await this.get<PaginatedResponse<FactoryUserDTO>>(
      `${this.FACTORY_API}/${factoryId}/users`,
      { currentPage: 1, pageSize: 50 }
    );
  }

  /**
   * 添加工厂用户
   */
  async addFactoryUser(factoryId: string, userId: string, role: string, permissions: string[]): Promise<void> {
    return await this.post<void>(`${this.FACTORY_API}/${factoryId}/users`, {
      userId,
      role,
      permissions,
    });
  }

  /**
   * 移除工厂用户
   */
  async removeFactoryUser(factoryId: string, userId: string): Promise<void> {
    return await this.delete<void>(`${this.FACTORY_API}/${factoryId}/users/${userId}`);
  }

  /**
   * 更新工厂用户权限
   */
  async updateFactoryUserPermissions(
    factoryId: string,
    userId: string,
    role: string,
    permissions: string[]
  ): Promise<void> {
    return await this.put<void>(`${this.FACTORY_API}/${factoryId}/users/${userId}`, {
      role,
      permissions,
    });
  }

  /**
   * 获取工厂工作中心列表
   */
  async getFactoryWorkcenters(factoryId: string): Promise<any[]> {
    const response = await this.get<PaginatedResponse<any>>(
      `${this.FACTORY_API}/${factoryId}/workcenters`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 获取工厂车间列表
   */
  async getFactoryWorkshops(factoryId: string): Promise<any[]> {
    const response = await this.get<PaginatedResponse<any>>(
      `${this.FACTORY_API}/${factoryId}/workshops`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 获取工厂设备列表
   */
  async getFactoryEquipment(factoryId: string): Promise<any[]> {
    const response = await this.get<PaginatedResponse<any>>(
      `${this.FACTORY_API}/${factoryId}/equipment`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 获取工厂统计数据
   */
  async getFactoryStatistics(factoryId?: string): Promise<FactoryStatisticsDTO> {
    const url = factoryId ? `${this.FACTORY_API}/${factoryId}/statistics` : `${this.FACTORY_API}/statistics`;
    return await this.get<FactoryStatisticsDTO>(url);
  }

  /**
   * 导出工厂数据
   */
  async exportFactoryData(factoryId?: string): Promise<any> {
    const url = factoryId ? `${this.FACTORY_API}/${factoryId}/export` : `${this.FACTORY_API}/export`;
    return await this.get<any>(url);
  }

  /**
   * 导入工厂数据
   */
  async importFactoryData(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    return await this.uploadFile<{ success: number; failed: number; errors: string[] }>(
      `${this.FACTORY_API}/import`,
      file
    );
  }

  /**
   * 检查工厂编码是否存在
   */
  async checkFactoryCodeExists(code: string, excludeId?: string): Promise<boolean> {
    const query: any = { code };
    if (excludeId) query.excludeId = excludeId;
    const response = await this.get<{ exists: boolean }>(`${this.FACTORY_API}/check-code`, query as any);
    return response.exists;
  }

  /**
   * 批量更新工厂状态
   */
  async batchUpdateFactoryStatus(ids: string[], status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    return await this.post<void>(`${this.FACTORY_API}/batch/status`, { ids, status });
  }

  /**
   * 批量删除工厂
   */
  async batchDeleteFactories(ids: string[]): Promise<void> {
    return await this.delete<void>(`${this.FACTORY_API}/batch`, { ids });
  }

  /**
   * 获取工厂日志
   */
  async getFactoryLogs(factoryId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<any>> {
    return await this.get<PaginatedResponse<any>>(
      `${this.FACTORY_API}/${factoryId}/logs`,
      { currentPage: page || 1, pageSize: pageSize || 20 }
    );
  }

  /**
   * 同步工厂数据到ERP
   */
  async syncFactoryToERP(factoryId: string): Promise<void> {
    return await this.post<void>(`${this.FACTORY_API}/${factoryId}/sync-erp`, {});
  }

  /**
   * 获取工厂配置模板
   */
  async getFactoryTemplate(): Promise<any> {
    return await this.get<any>(`${this.FACTORY_API}/template`);
  }

  /**
   * 从模板创建工厂
   */
  async createFactoryFromTemplate(templateId: string, data: Partial<CreateFactoryDTO>): Promise<FactoryConfig> {
    return await this.post<FactoryConfig>(`${this.FACTORY_API}/from-template/${templateId}`, data);
  }

  /**
   * 获取工厂关联关系
   */
  async getFactoryRelations(factoryId: string): Promise<any> {
    return await this.get<any>(`${this.FACTORY_API}/${factoryId}/relations`);
  }

  /**
   * 设置工厂关联关系
   */
  async setFactoryRelations(factoryId: string, relations: any): Promise<void> {
    return await this.post<void>(`${this.FACTORY_API}/${factoryId}/relations`, relations);
  }

  /**
   * 获取工厂权限配置
   */
  async getFactoryPermissionConfig(factoryId: string): Promise<any> {
    return await this.get<any>(`${this.FACTORY_API}/${factoryId}/permission-config`);
  }

  /**
   * 更新工厂权限配置
   */
  async updateFactoryPermissionConfig(factoryId: string, config: any): Promise<void> {
    return await this.put<void>(`${this.FACTORY_API}/${factoryId}/permission-config`, config);
  }

  /**
   * 获取工厂数据范围配置
   */
  async getFactoryDataScope(factoryId: string): Promise<any> {
    return await this.get<any>(`${this.FACTORY_API}/${factoryId}/data-scope`);
  }

  /**
   * 更新工厂数据范围配置
   */
  async updateFactoryDataScope(factoryId: string, dataScope: any): Promise<void> {
    return await this.put<void>(`${this.FACTORY_API}/${factoryId}/data-scope`, dataScope);
  }
}

/**
 * 导出单例实例
 */
export const factoryApi = new FactoryApiService();

/**
 * 向后兼容的导出
 */
export default factoryApi;
