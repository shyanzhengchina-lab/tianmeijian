/**
 * 路由守卫
 * 处理路由权限验证、重定向等功能
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { flatRoutes } from './routes';
import { useAuthStore } from '../shared/stores/authStore';
import { useRbacStore } from '../shared/stores/rbacStore';

/**
 * 兼容判断：authStore.isAuthenticated 或 localStorage mes_user 均视为已登录
 */
const isLoggedIn = (isAuthenticated: boolean): boolean => {
  if (isAuthenticated) return true;
  try {
    return !!localStorage.getItem('mes_user');
  } catch {
    return false;
  }
};

/**
 * 兼容判断：bip_cur_factory 或 currentFactoryId 均视为已选工厂
 * 若 bip_cur_factory 缺失但 mes_user 有 factoryId，则自动恢复
 */
const hasFactory = (): boolean => {
  try {
    if (localStorage.getItem('bip_cur_factory') || localStorage.getItem('currentFactoryId')) {
      return true;
    }
    // 从 mes_user 恢复工厂 ID（版本升级清空后的兜底）
    const raw = localStorage.getItem('mes_user');
    if (raw) {
      const u = JSON.parse(raw);
      const fid = u.factoryId || 'F001';
      localStorage.setItem('bip_cur_factory', fid);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * 路由守卫 Hook
 * 检查用户权限和登录状态
 */
export const useRouteGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { hasPermission } = useRbacStore();

  const authenticated = isLoggedIn(isAuthenticated);

  useEffect(() => {
    // 检查登录状态
    if (!authenticated) {
      message.warning('请先登录');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    // 查找当前路由配置
    const currentRoute = flatRoutes.find(route => route.path === location.pathname);
    if (currentRoute?.permission && !hasPermission(currentRoute.permission, 'view')) {
      message.error('您没有访问该页面的权限');
      navigate('/403');
      return;
    }

    // 检查多工厂切换
    // 注意：/select-factory 路由尚未注册页面组件，
    // 未选工厂时回退到 /login 让用户重新登录（登录时会写入工厂ID）
    if (!hasFactory() && location.pathname !== '/select-factory') {
      navigate('/login');
      return;
    }
  }, [location.pathname, authenticated, hasPermission, navigate]);
};

/**
 * 权限守卫组件
 */
interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, fallback, children }) => {
  const { hasPermission } = useRbacStore();
  if (!hasPermission(permission, 'view')) {
    return <>{fallback || null}</>;
  }
  return <>{children}</>;
};

/**
 * 登录守卫组件
 * 兼容 authStore 和旧架构 mes_user localStorage 两种方式
 */
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const authenticated = isLoggedIn(isAuthenticated);

  useEffect(() => {
    if (!authenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [authenticated, navigate, location]);

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
};

/**
 * 工厂选择守卫
 * 兼容 bip_cur_factory 和 currentFactoryId 两种 key
 */
export const FactoryGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const factorySelected = hasFactory();

  useEffect(() => {
    if (!factorySelected) {
      // /select-factory 路由尚未注册组件，跳回 /login
      navigate('/login');
    }
  }, [factorySelected, navigate]);

  if (!factorySelected) {
    return null;
  }

  return <>{children}</>;
};

/**
 * 路由重定向守卫
 */
export const useRedirectBasedOnPermissions = () => {
  const navigate = useNavigate();
  const { hasPermission } = useRbacStore();

  useEffect(() => {
    if (hasPermission('basicdata:material:view', 'view')) {
      navigate('/basic-data/material');
      return;
    }
    if (hasPermission('production:order:view', 'view')) {
      navigate('/production/production-order');
      return;
    }
    navigate('/');
  }, [hasPermission, navigate]);
};

/**
 * 路由白名单
 */
export const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/404',
  '/403',
  '/500',
  '/select-factory',
];

export const isPublicRoute = (path: string): boolean =>
  publicRoutes.some(route => path.startsWith(route));

export const getDefaultRoute = (hp: (permission: string, op: string) => boolean): string => {
  const routePriority = [
    { permission: 'basicdata:material:view', path: '/basic-data/material' },
    { permission: 'production:order:view',   path: '/production/production-order' },
    { permission: 'execution:workshop:view', path: '/execution/workshop' },
    { permission: 'quality:inspection:view', path: '/quality/inspection' },
    { permission: 'ebr:view',               path: '/ebr/list' },
  ];
  for (const route of routePriority) {
    if (hp(route.permission, 'view')) return route.path;
  }
  return '/';
};

export default useRouteGuard;
