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
 * 兼容判断：authStore.isAuthenticated 或 localStorage mes_user+mes_token 均视为已登录
 * 优先级：authStore > localStorage
 */
const isLoggedIn = (isAuthenticated: boolean): boolean => {
  if (isAuthenticated) return true;
  try {
    // 只要 mes_user 存在即认为已登录（token 由各 API 请求自行携带）
    const user = localStorage.getItem('mes_user');
    const token = localStorage.getItem('mes_token');
    return !!(user && token);
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
 * 注意：只使用 localStorage 判断，避免 Zustand store 初始化延迟导致闪退
 */
export const useRouteGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { hasPermission } = useRbacStore();

  // 直接读 localStorage，不依赖 Zustand 初始化时序
  const authenticated = !!(
    isAuthenticated ||
    (localStorage.getItem('mes_user') && localStorage.getItem('mes_token'))
  );

  useEffect(() => {
    // 未登录 → 跳登录页
    if (!authenticated) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    // 路由权限检查
    const currentRoute = flatRoutes.find(route => route.path === location.pathname);
    if (currentRoute?.permission && !hasPermission(currentRoute.permission, 'view')) {
      navigate('/403', { replace: true });
      return;
    }

    // 工厂检查
    if (!hasFactory() && location.pathname !== '/select-factory') {
      navigate('/login', { replace: true });
      return;
    }
  }, [location.pathname]);   // 只监听 path 变化，去掉 authenticated 依赖避免循环
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
