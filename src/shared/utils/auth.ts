/**
 * 权限验证工具函数
 * 提供基于角色和权限的验证功能
 */

import React from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * 权限配置
 */
export interface PermissionConfig {
  // 权限字符串，例如：'basicdata:material:view'
  permission: string;
  // 权限描述
  description?: string;
  // 所需角色（可选）
  roles?: string[];
}

/**
 * 检查用户是否有指定权限
 * @param permission 权限字符串
 * @returns 是否有权限
 */
export const hasPermission = (permission: string): boolean => {
  const { checkPermission } = useAuthStore.getState();
  return checkPermission(permission);
};

/**
 * 检查用户是否有所有指定的权限
 * @param permissions 权限字符串数组
 * @returns 是否有所有权限
 */
export const hasPermissions = (permissions: string[]): boolean => {
  const { checkPermissions } = useAuthStore.getState();
  return checkPermissions(permissions);
};

/**
 * 检查用户是否有任意一个指定的权限
 * @param permissions 权限字符串数组
 * @returns 是否有任意一个权限
 */
export const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(permission));
};

/**
 * 检查用户是否有指定角色
 * @param roleId 角色ID
 * @returns 是否有该角色
 */
export const hasRole = (roleId: string): boolean => {
  const { hasRole: hasRoleInStore } = useAuthStore.getState();
  return hasRoleInStore(roleId);
};

/**
 * 检查用户是否有任意一个指定的角色
 * @param roleIds 角色ID数组
 * @returns 是否有任意一个角色
 */
export const hasAnyRole = (roleIds: string[]): boolean => {
  return roleIds.some(roleId => hasRole(roleId));
};

/**
 * 检查用户是否为超级管理员
 * @returns 是否为超级管理员
 */
export const isSuperAdmin = (): boolean => {
  return hasRole('ROLE_SUPER_ADMIN');
};

/**
 * 检查用户是否为管理员
 * @returns 是否为管理员
 */
export const isAdmin = (): boolean => {
  return hasAnyRole(['ROLE_SUPER_ADMIN', 'ROLE_ADMIN']);
};

/**
 * 获取当前用户ID
 * @returns 当前用户ID，如果未登录返回null
 */
export const getCurrentUserId = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.id || null;
};

/**
 * 获取当前用户名
 * @returns 当前用户名，如果未登录返回null
 */
export const getCurrentUsername = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.username || null;
};

/**
 * 获取当前用户真实姓名
 * @returns 当前用户真实姓名，如果未登录返回'未知用户'
 */
export const getCurrentUserRealName = (): string => {
  const { user } = useAuthStore.getState();
  return user?.realName || '未知用户';
};

/**
 * 获取当前用户的工厂ID列表
 * @returns 当前用户的工厂ID列表
 */
export const getCurrentUserFactoryIds = (): string[] => {
  const { user } = useAuthStore.getState();
  return user?.factoryIds || [];
};

/**
 * 获取当前用户的默认工厂ID
 * @returns 当前用户的默认工厂ID
 */
export const getCurrentUserDefaultFactoryId = (): string | undefined => {
  const { user } = useAuthStore.getState();
  return user?.defaultFactoryId;
};

/**
 * 检查用户是否可以访问指定工厂
 * @param factoryId 工厂ID
 * @returns 是否可以访问
 */
export const canAccessFactory = (factoryId: string): boolean => {
  const factoryIds = getCurrentUserFactoryIds();
  return factoryIds.includes(factoryId);
};

/**
 * 检查用户是否已登录
 * @returns 是否已登录
 */
export const isAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuthStore.getState();
  return isAuthenticated;
};

/**
 * 检查用户状态是否为激活
 * @returns 用户状态是否为激活
 */
export const isUserActive = (): boolean => {
  const { user } = useAuthStore.getState();
  return user?.status === 'active';
};

/**
 * 权限守卫：检查权限，如果没有权限则抛出错误
 * @param permission 权限字符串
 * @param errorMessage 错误消息
 * @throws Error 如果没有权限
 */
export const requirePermission = (permission: string, errorMessage: string = '没有权限执行此操作'): void => {
  if (!hasPermission(permission)) {
    throw new Error(errorMessage);
  }
};

/**
 * 角色守卫：检查角色，如果没有该角色则抛出错误
 * @param roleId 角色ID
 * @param errorMessage 错误消息
 * @throws Error 如果没有该角色
 */
export const requireRole = (roleId: string, errorMessage: string = '没有权限执行此操作'): void => {
  if (!hasRole(roleId)) {
    throw new Error(errorMessage);
  }
};

/**
 * 登录守卫：检查是否已登录，如果未登录则抛出错误
 * @param errorMessage 错误消息
 * @throws Error 如果未登录
 */
export const requireAuth = (errorMessage: string = '请先登录'): void => {
  if (!isAuthenticated()) {
    throw new Error(errorMessage);
  }
};

/**
 * 工厂访问守卫：检查是否可以访问指定工厂，如果不可访问则抛出错误
 * @param factoryId 工厂ID
 * @param errorMessage 错误消息
 * @throws Error 如果不可访问
 */
export const requireFactoryAccess = (factoryId: string, errorMessage: string = '没有权限访问该工厂'): void => {
  if (!canAccessFactory(factoryId)) {
    throw new Error(errorMessage);
  }
};

/**
 * 获取用户显示名称（优先使用真实姓名，其次用户名）
 * @returns 用户显示名称
 */
export const getUserDisplayName = (): string => {
  const { user } = useAuthStore.getState();
  return user?.realName || user?.username || '未知用户';
};

/**
 * 获取用户头像URL
 * @returns 用户头像URL，如果没有则返回默认头像
 */
export const getUserAvatar = (): string => {
  const { user } = useAuthStore.getState();
  return user?.avatar || '/default-avatar.png';
};

/**
 * 获取当前用户的权限列表
 * @returns 权限列表
 */
export const getCurrentUserPermissions = (): string[] => {
  const { permissions } = useAuthStore.getState();
  return permissions;
};

/**
 * 获取当前用户的角色ID列表
 * @returns 角色ID列表
 */
export const getCurrentUserRoles = (): string[] => {
  const { user } = useAuthStore.getState();
  return user?.roleIds || [];
};

/**
 * 权限检查装饰器（用于高阶组件）
 * @param permission 权限字符串
 * @param Component 组件
 * @returns 包装后的组件
 */
export const withPermissionCheck = <P extends object>(
  permission: string,
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    if (!hasPermission(permission)) {
      return null;
    }
    return React.createElement(Component, props);
  };
};

/**
 * 角色检查装饰器（用于高阶组件）
 * @param roleId 角色ID
 * @param Component 组件
 * @returns 包装后的组件
 */
export const withRoleCheck = <P extends object>(
  roleId: string,
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    if (!hasRole(roleId)) {
      return null;
    }
    return React.createElement(Component, props);
  };
};

/**
 * 认证检查装饰器（用于高阶组件）
 * @param Component 组件
 * @returns 包装后的组件
 */
export const withAuthCheck = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    if (!isAuthenticated()) {
      return null;
    }
    return React.createElement(Component, props);
  };
};

/**
 * 检查并过滤操作按钮权限
 * @param actions 操作列表
 * @param permissionMap 操作权限映射
 * @returns 过滤后的操作列表
 */
export const filterActionsByPermission = <T extends { key: string }>(
  actions: T[],
  permissionMap: Record<string, string>
): T[] => {
  return actions.filter(action => {
    const permission = permissionMap[action.key];
    if (!permission) return true; // 如果没有配置权限，默认显示
    return hasPermission(permission);
  });
};

/**
 * 获取可用的工厂选项（基于用户权限）
 * @param allFactories 所有工厂列表
 * @returns 用户可访问的工厂列表
 */
export const getAvailableFactories = <T extends { id: string }>(
  allFactories: T[]
): T[] => {
  const userFactoryIds = getCurrentUserFactoryIds();
  return allFactories.filter(factory => userFactoryIds.includes(factory.id));
};

/**
 * 批量检查权限
 * @param permissions 权限字符串数组
 * @returns 权限检查结果对象
 */
export const checkPermissions = (permissions: string[]): Record<string, boolean> => {
  return permissions.reduce((result, permission) => {
    result[permission] = hasPermission(permission);
    return result;
  }, {} as Record<string, boolean>);
};

/**
 * 获取操作员信息（用于审计日志）
 * @returns 操作员信息对象
 */
export const getOperatorInfo = (): {
  id: string | null;
  username: string | null;
  realName: string;
} => {
  return {
    id: getCurrentUserId(),
    username: getCurrentUsername(),
    realName: getCurrentUserRealName(),
  };
};

/**
 * 添加操作员信息到数据对象（用于创建/更新操作）
 * @param data 数据对象
 * @returns 包含操作员信息的数据对象
 */
export const addOperatorInfo = <T extends Record<string, any>>(data: T): T => {
  const operator = getOperatorInfo();
  return {
    ...data,
    createUserId: operator.id,
    createBy: operator.realName,
  };
};

/**
 * 添加更新人信息到数据对象（用于更新操作）
 * @param data 数据对象
 * @returns 包含更新人信息的数据对象
 */
export const addUpdaterInfo = <T extends Record<string, any>>(data: T): T => {
  const operator = getOperatorInfo();
  return {
    ...data,
    updateUserId: operator.id,
    updateBy: operator.realName,
  };
};

// 导出便捷Hook
export const useAuth = () => {
  return useAuthStore();
};

// 导出便捷Hook - 权限检查
export const usePermission = (permission: string) => {
  return hasPermission(permission);
};

// 导出便捷Hook - 多权限检查
export const usePermissions = (permissions: string[]) => {
  return hasPermissions(permissions);
};

// 导出便捷Hook - 角色检查
export const useRole = (roleId: string) => {
  return hasRole(roleId);
};

// 导出便捷Hook - 多角色检查
export const useRoles = (roleIds: string[]) => {
  return hasAnyRole(roleIds);
};

export default {
  hasPermission,
  hasPermissions,
  hasAnyPermission,
  hasRole,
  hasAnyRole,
  isSuperAdmin,
  isAdmin,
  getCurrentUserId,
  getCurrentUsername,
  getCurrentUserRealName,
  getCurrentUserFactoryIds,
  getCurrentUserDefaultFactoryId,
  canAccessFactory,
  isAuthenticated,
  isUserActive,
  requirePermission,
  requireRole,
  requireAuth,
  requireFactoryAccess,
  getUserDisplayName,
  getUserAvatar,
  getCurrentUserPermissions,
  getCurrentUserRoles,
  withPermissionCheck,
  withRoleCheck,
  withAuthCheck,
  filterActionsByPermission,
  getAvailableFactories,
  checkPermissions,
  getOperatorInfo,
  addOperatorInfo,
  addUpdaterInfo,
};
