/**
 * 系统权限模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  SystemPermission,
  PermissionQuery,
  CreatePermissionDTO,
  UpdatePermissionDTO,
  PermissionBatchAction,
  Role,
  RoleQuery,
  CreateRoleDTO,
  UpdateRoleDTO,
  UserRole,
} from './types';

/**
 * 系统权限API服务类
 * 封装所有系统权限相关的API调用
 */
class PermissionApiService {
  /**
   * 分页查询系统权限列表
   */
  async getPermissions(query: PermissionQuery): Promise<PageResult<SystemPermission>> {
    return await apiClient.get<PageResult<SystemPermission>>(
      '/system-permission/page',
      { params: query }
    );
  }

  /**
   * 获取所有系统权限列表（不分页）
   */
  async getAllPermissions(): Promise<SystemPermission[]> {
    return await apiClient.get<SystemPermission[]>('/system-permission/list');
  }

  /**
   * 根据ID获取系统权限详情
   */
  async getPermissionById(id: string): Promise<SystemPermission> {
    return await apiClient.get<SystemPermission>(`/system-permission/${id}`);
  }

  /**
   * 创建系统权限
   */
  async createPermission(data: CreatePermissionDTO): Promise<SystemPermission> {
    return await apiClient.post<SystemPermission>('/system-permission', data);
  }

  /**
   * 更新系统权限
   */
  async updatePermission(data: UpdatePermissionDTO): Promise<SystemPermission> {
    return await apiClient.put<SystemPermission>('/system-permission', data);
  }

  /**
   * 批量操作系统权限
   */
  async batchPermissions(action: PermissionBatchAction): Promise<void> {
    await apiClient.put<void>('/system-permission/batch', action);
  }

  /**
   * 启用权限
   */
  async activatePermission(id: string): Promise<void> {
    await apiClient.put<void>(`/system-permission/${id}/activate`);
  }

  /**
   * 停用权限
   */
  async deactivatePermission(id: string): Promise<void> {
    await apiClient.put<void>(`/system-permission/${id}/deactivate`);
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalPermissions: number;
    activePermissions: number;
    inactivePermissions: number;
    typeStats: Record<string, number>;
    moduleStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalPermissions: number;
      activePermissions: number;
      inactivePermissions: number;
      typeStats: Record<string, number>;
      moduleStats: Record<string, number>;
    }>('/system-permission/statistics');
    return (response as any).data;
  }

  /**
   * 分页查询角色列表
   */
  async getRoles(query: RoleQuery): Promise<PageResult<Role>> {
    return await apiClient.get<PageResult<Role>>(
      '/system-role/page',
      { params: query }
    );
  }

  /**
   * 获取所有角色列表（不分页）
   */
  async getAllRoles(): Promise<Role[]> {
    return await apiClient.get<Role[]>('/system-role/list');
  }

  /**
   * 根据ID获取角色详情
   */
  async getRoleById(id: string): Promise<Role> {
    return await apiClient.get<Role>(`/system-role/${id}`);
  }

  /**
   * 创建角色
   */
  async createRole(data: CreateRoleDTO): Promise<Role> {
    return await apiClient.post<Role>('/system-role', data);
  }

  /**
   * 更新角色
   */
  async updateRole(data: UpdateRoleDTO): Promise<Role> {
    return await apiClient.put<Role>('/system-role', data);
  }

  /**
   * 批量操作角色
   */
  async batchRoles(action: PermissionBatchAction): Promise<void> {
    await apiClient.put<void>('/system-role/batch', action);
  }

  /**
   * 启用角色
   */
  async activateRole(id: string): Promise<void> {
    await apiClient.put<void>(`/system-role/${id}/activate`);
  }

  /**
   * 停用角色
   */
  async deactivateRole(id: string): Promise<void> {
    await apiClient.put<void>(`/system-role/${id}/deactivate`);
  }

  /**
   * 分配权限给角色
   */
  async assignPermissionsToRole(roleId: string, permissions: string[]): Promise<void> {
    await apiClient.put<void>(`/system-role/${roleId}/assign-permissions`, {
      permissions,
    });
  }

  /**
   * 获取角色统计信息
   */
  async getRoleStatistics(): Promise<{
    totalRoles: number;
    activeRoles: number;
    inactiveRoles: number;
    avgPermissions: number;
  }> {
    const response = await apiClient.get<{
      totalRoles: number;
      activeRoles: number;
      inactiveRoles: number;
      avgPermissions: number;
    }>('/system-role/statistics');
    return (response as any).data;
  }

  /**
   * 获取用户角色关联
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    return await apiClient.get<UserRole[]>(`/system-user-role/${userId}/roles`);
  }

  /**
   * 分配角色给用户
   */
  async assignRoleToUser(userId: string, roleId: string, expireDate?: string): Promise<void> {
    await apiClient.post<void>('/system-user-role/assign', {
      userId,
      roleId,
      expireDate,
    });
  }

  /**
   * 撤销用户角色
   */
  async revokeUserRole(userRoleId: string): Promise<void> {
    await apiClient.delete<void>(`/system-user-role/${userRoleId}`);
  }

  /**
   * 检查用户权限
   */
  async checkUserPermission(userId: string, permissionKey: string): Promise<boolean> {
    return await apiClient.get<boolean>('/system-permission/check', {
      params: { userId, permissionKey },
    });
  }

  /**
   * 获取用户所有权限
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    return await apiClient.get<string[]>(`/system-user/${userId}/permissions`);
  }
}

// 导出API服务单例
export const permissionApi = new PermissionApiService();
