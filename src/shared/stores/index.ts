/**
 * 共享Stores模块统一导出
 * 使用Zustand进行全局状态管理
 */

// 导航状态
export { useNavigationStore, PAGES, PAGE_NAMES } from './navigationStore';
export type { PageKey, BreadcrumbItem } from './navigationStore';

// 认证状态
export { useAuthStore } from './authStore';
export type { User, LoginCredentials } from './authStore';

// 工厂管理状态
export { useFactoryStore } from './factoryStore';
export type { FactoryState } from './factoryStore';

// 权限管理状态
export { useRbacStore } from './rbacStore';
export type {
  OperationFlags,
  DataScope,
  OrgLevel,
  Role,
  UserRole,
  FactoryConfig as RbacFactoryConfig,
  OrgNode,
  MenuPermission,
  UserContext,
} from './rbacStore';
