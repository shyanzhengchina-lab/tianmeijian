/**
 * 共享资源模块统一导出
 */

// 组件
export * from './components';

// Hooks
export * from './hooks';

// Store (避免与 hooks 中重复导出的类型冲突)
export { useAuthStore } from './stores/authStore';
export type { User, LoginCredentials } from './stores/authStore';
export { useFactoryStore } from './stores/factoryStore';
export type { FactoryState } from './stores/factoryStore';
export { useNavigationStore, PAGES, PAGE_NAMES } from './stores/navigationStore';
export type { PageKey } from './stores/navigationStore';
export { useRbacStore } from './stores/rbacStore';
export type {
  DataScope,
  OrgLevel,
  Role,
  UserRole,
  FactoryConfig as RbacFactoryConfig,
  OrgNode,
  MenuPermission,
  UserContext,
} from './stores/rbacStore';
// OperationFlags 已通过 hooks/usePermission 导出，此处不重复

// API
export * from './api';

// Utils
export * from './utils';

// Types (只导出 hooks 未重复导出的类型)
export type {
  FilterState,
  BreadcrumbItem,
  ActionItem,
  LoadingState,
  DetailField,
} from './types/common';

// Config
export * from './config';
