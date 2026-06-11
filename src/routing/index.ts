/**
 * 路由模块统一导出
 */

export { default as routes, flatRoutes, getBreadcrumbs, filterRoutesByPermission } from './routes';
export {
  useRouteGuard,
  PermissionGuard,
  AuthGuard,
  FactoryGuard,
  useRedirectBasedOnPermissions,
  isPublicRoute,
  getDefaultRoute,
} from './route-guards';
export {
  useNavigation,
  NavigationConstants,
  type NavigationAction,
  type NavigationParams,
} from './navigation';