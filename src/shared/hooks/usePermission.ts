/**
 * 权限检查Hook
 * 基于rbacStore进行权限检查
 */
import { useMemo } from 'react';
import { useRbacStore } from '../stores/rbacStore';
import { OperationFlags } from '../stores/rbacStore';

interface UsePermissionResult {
  hasPermission: (menuKey: string, operation?: keyof OperationFlags) => boolean;
  canView: (menuKey: string) => boolean;
  canCreate: (menuKey: string) => boolean;
  canUpdate: (menuKey: string) => boolean;
  canDelete: (menuKey: string) => boolean;
  canManage: (menuKey: string) => boolean;
  canAudit: (menuKey: string) => boolean;
  canReview: (menuKey: string) => boolean;
  canApprove: (menuKey: string) => boolean;
  canEnable: (menuKey: string) => boolean;
  canDisable: (menuKey: string) => boolean;
  canPrint: (menuKey: string) => boolean;
  canMaintain: (menuKey: string) => boolean;
  canActivate: (menuKey: string) => boolean;
  canExport: (menuKey: string) => boolean;
  canImport: (menuKey: string) => boolean;
  canStart: (menuKey: string) => boolean;
  canComplete: (menuKey: string) => boolean;
  canClose: (menuKey: string) => boolean;
  canCancel: (menuKey: string) => boolean;
  dataScope: string;
  maxDataScope: string;
}

export function usePermission(userId?: string): UsePermissionResult {
  const { getUserEffectivePermissions, getUserMaxDataScope, currentUserContext } = useRbacStore();

  // 获取当前用户ID
  const currentUserId = userId || currentUserContext?.userId;

  // 计算用户权限
  const userPermissions = useMemo(() => {
    if (!currentUserId) return new Map<string, OperationFlags>();
    return getUserEffectivePermissions(currentUserId);
  }, [currentUserId, getUserEffectivePermissions]);

  // 计算用户最大数据范围
  const maxDataScope = useMemo(() => {
    if (!currentUserId) return 'PERSONAL';
    return getUserMaxDataScope(currentUserId);
  }, [currentUserId, getUserMaxDataScope]);

  // 检查权限的函数
  const hasPermission = useMemo(() => {
    return (menuKey: string, operation?: keyof OperationFlags): boolean => {
      const permission = userPermissions.get(menuKey);
      if (!permission) return false;
      if (!operation) return permission.view || false;
      return permission[operation] || false;
    };
  }, [userPermissions]);

  // 便捷函数
  const canView = (menuKey: string): boolean => hasPermission(menuKey, 'view');
  const canCreate = (menuKey: string): boolean => hasPermission(menuKey, 'create');
  const canUpdate = (menuKey: string): boolean => hasPermission(menuKey, 'update');
  const canDelete = (menuKey: string): boolean => hasPermission(menuKey, 'delete');
  const canManage = (menuKey: string): boolean => hasPermission(menuKey, 'update') || hasPermission(menuKey, 'delete');
  const canAudit = (menuKey: string): boolean => hasPermission(menuKey, 'audit');
  const canReview = (menuKey: string): boolean => hasPermission(menuKey, 'audit'); // 审核权限使用audit
  const canApprove = (menuKey: string): boolean => hasPermission(menuKey, 'audit'); // 审批权限使用audit
  const canEnable = (menuKey: string): boolean => hasPermission(menuKey, 'enable');
  const canDisable = (menuKey: string): boolean => hasPermission(menuKey, 'disable');
  const canPrint = (menuKey: string): boolean => hasPermission(menuKey, 'print');
  const canMaintain = (menuKey: string): boolean => hasPermission(menuKey, 'update');
  const canActivate = (menuKey: string): boolean => hasPermission(menuKey, 'enable');
  const canExport = (menuKey: string): boolean => hasPermission(menuKey, 'export' as keyof OperationFlags) || hasPermission(menuKey, 'view');
  const canImport = (menuKey: string): boolean => hasPermission(menuKey, 'import' as keyof OperationFlags) || hasPermission(menuKey, 'create');

  return {
    hasPermission,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canManage,
    canAudit,
    canReview,
    canApprove,
    canEnable,
    canDisable,
    canPrint,
    canMaintain,
    canActivate,
    canExport,
    canImport,
    canStart: (menuKey: string) => hasPermission(menuKey, 'create'),
    canComplete: (menuKey: string) => hasPermission(menuKey, 'update'),
    canClose: (menuKey: string) => hasPermission(menuKey, 'update'),
    canCancel: (menuKey: string) => hasPermission(menuKey, 'delete'),
    dataScope: maxDataScope,
    maxDataScope,
  };
}