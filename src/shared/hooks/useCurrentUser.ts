/**
 * 当前用户信息Hook
 * 提供便捷的方式访问当前用户信息
 */

import { useAuthStore } from '../stores/authStore';
import type { User } from '../stores/authStore';

/**
 * 当前用户信息Hook
 * @returns 当前用户信息和相关方法
 */
export const useCurrentUser = () => {
  const {
    user,
    isAuthenticated,
    checkPermission,
    checkPermissions,
    hasRole,
    permissions,
  } = useAuthStore();

  return {
    // 用户信息
    user,
    isAuthenticated,

    // 便捷属性
    userId: user?.id || null,
    username: user?.username || null,
    realName: user?.realName || '未知用户',
    email: user?.email || null,
    phone: user?.phone || null,
    avatar: user?.avatar || null,
    roleIds: user?.roleIds || [],
    factoryIds: user?.factoryIds || [],
    defaultFactoryId: user?.defaultFactoryId || null,
    permissions: permissions,

    // 权限检查方法
    hasPermission: checkPermission,
    hasPermissions: checkPermissions,
    hasRole: hasRole,

    // 状态检查
    isActive: user?.status === 'active',
    isInactive: user?.status === 'inactive',
    isLocked: user?.status === 'locked',

    // 获取操作员信息（用于审计日志）
    getOperatorInfo: () => ({
      id: user?.id || null,
      username: user?.username || null,
      realName: user?.realName || '未知用户',
    }),

    // 添加创建人信息到数据对象
    addCreatorInfo: <T extends Record<string, any>>(data: T) => ({
      ...data,
      createUserId: user?.id || null,
      createBy: user?.realName || '未知用户',
    }),

    // 添加更新人信息到数据对象
    addUpdaterInfo: <T extends Record<string, any>>(data: T) => ({
      ...data,
      updateUserId: user?.id || null,
      updateBy: user?.realName || '未知用户',
    }),
  };
};

/**
 * 获取当前用户ID的Hook
 * @returns 当前用户ID
 */
export const useCurrentUserId = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.id || null;
};

/**
 * 获取当前用户真实姓名的Hook
 * @returns 当前用户真实姓名
 */
export const useCurrentUserName = (): string => {
  const { user } = useAuthStore.getState();
  return user?.realName || '未知用户';
};

/**
 * 获取当前用户工厂ID列表的Hook
 * @returns 当前用户工厂ID列表
 */
export const useCurrentUserFactories = (): string[] => {
  const { user } = useAuthStore.getState();
  return user?.factoryIds || [];
};

export default useCurrentUser;
