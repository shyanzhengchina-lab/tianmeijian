/**
 * 路由配置
 * 集成所有业务模块的路由
 */

import { lazy } from 'react';

// 懒加载组件 - 优化首屏加载性能
const Dashboard = lazy(() => import('../pages/dashboard/DashboardPage'));

// 基础资料模块
const MaterialList = lazy(() => import('../modules/basic-data/material/components/MaterialList'));
const UnitList = lazy(() => import('../modules/basic-data/unit/components/UnitList'));
const BOMList = lazy(() => import('../modules/basic-data/bom/components/BomList'));
const OperationList = lazy(() => import('../modules/basic-data/operation/components/OperationList'));
const EquipmentList = lazy(() => import('../modules/basic-data/equipment/components/EquipmentList'));
const WorkCenterList = lazy(() => import('../modules/basic-data/workcenter/components/WorkCenterList'));
const TeamList = lazy(() => import('../modules/basic-data/team/components/TeamList'));
const EmployeeList = lazy(() => import('../modules/basic-data/employee/components/EmployeeList'));
const QcItemList = lazy(() => import('../modules/basic-data/qc-item/components/QcItemList'));
const QcSchemeList = lazy(() => import('../modules/basic-data/qc-scheme/components/QcSchemeList'));
const WorkshopList = lazy(() => import('../modules/basic-data/workshop/components/WorkshopList'));

// 生产管理模块
const ProductionOrderList = lazy(() => import('../modules/production/production-order/components/ProductionOrderList'));
const WorkOrderList = lazy(() => import('../modules/production/work-order/components/WorkOrderList'));
const TaskOrderList = lazy(() => import('../modules/production/task-order/components/TaskOrderList'));

// 车间执行模块
// WorkshopDashboard = lazy(() => import('../modules/execution/workshop/components/WorkshopDashboard'));
const FloatTicketList = lazy(() => import('../modules/execution/float-ticket/components/FloatTicketList'));
const PadExecutionList = lazy(() => import('../modules/execution/pad/components/PadExecutionList'));

// 质量管理模块
const QualityInspectionList = lazy(() => import('../modules/quality/inspection/components/QualityInspectionList'));
const MrbReviewList = lazy(() => import('../modules/quality/mrb/components/MrbReviewList'));
const QualityReleaseList = lazy(() => import('../modules/quality/release/components/QualityReleaseList'));

// EBR模块
const EBRList = lazy(() => import('../modules/ebr/ebr-list/components/EBRList'));

// 领料管理模块
const MaterialIssuanceList = lazy(() => import('../modules/issuance/material-issuance/components/MaterialIssuanceList'));

// 工艺路径模块
const RoutingMasterList = lazy(() => import('../modules/routing/routing-master/components/RoutingMasterList'));

// 系统管理模块
const PermissionManagement = lazy(() => import('../modules/system/permission/components/PermissionManagement'));

/**
 * 路由配置项接口
 */
interface RouteConfig {
  path: string;
  component?: React.LazyExoticComponent<React.ComponentType<any>>;
  title: string;
  icon?: string;
  children?: RouteConfig[];
  permission?: string;
  hidden?: boolean;
}

/**
 * 应用路由配置
 * 按模块组织，支持懒加载和权限控制
 */
export const routes: RouteConfig[] = [
  {
    path: '/',
    component: Dashboard,
    title: '首页',
    icon: 'DashboardOutlined',
  },
  {
    path: '/basic-data',
    title: '基础资料',
    icon: 'DatabaseOutlined',
    children: [
      {
        path: '/basic-data/material',
        component: MaterialList,
        title: '物料档案',
        permission: 'basicdata:material:view',
      },
      {
        path: '/basic-data/unit',
        component: UnitList,
        title: '计量单位',
        permission: 'basicdata:unit:view',
      },
      {
        path: '/basic-data/bom',
        component: BOMList,
        title: '物料清单',
        permission: 'basicdata:bom:view',
      },
      {
        path: '/basic-data/operation',
        component: OperationList,
        title: '工序主数据',
        permission: 'basicdata:operation:view',
      },
      {
        path: '/basic-data/equipment',
        component: EquipmentList,
        title: '设备档案',
        permission: 'basicdata:equipment:view',
      },
      {
        path: '/basic-data/workcenter',
        component: WorkCenterList,
        title: '工作中心',
        permission: 'basicdata:workcenter:view',
      },
      {
        path: '/basic-data/team',
        component: TeamList,
        title: '班组档案',
        permission: 'basicdata:team:view',
      },
      {
        path: '/basic-data/employee',
        component: EmployeeList,
        title: '员工档案',
        permission: 'basicdata:employee:view',
      },
      {
        path: '/basic-data/qc-item',
        component: QcItemList,
        title: '质检项目',
        permission: 'basicdata:qcitem:view',
      },
      {
        path: '/basic-data/qc-scheme',
        component: QcSchemeList,
        title: '质检方案',
        permission: 'basicdata:qcscheme:view',
      },
      {
        path: '/basic-data/workshop',
        component: WorkshopList,
        title: '车间档案',
        permission: 'basicdata:workshop:view',
      },
    ],
  },
  {
    path: '/production',
    title: '生产管理',
    icon: 'ControlOutlined',
    children: [
      {
        path: '/production/production-order',
        component: ProductionOrderList,
        title: '生产订单',
        permission: 'production:order:view',
      },
      {
        path: '/production/work-order',
        component: WorkOrderList,
        title: '生产工单',
        permission: 'production:workorder:view',
      },
      {
        path: '/production/task-order',
        component: TaskOrderList,
        title: '生产任务单',
        permission: 'production:taskorder:view',
      },
    ],
  },
  {
    path: '/execution',
    title: '车间执行',
    icon: 'ExperimentOutlined',
    children: [
      // {
      //   path: '/execution/workshop',
      //   component: WorkshopDashboard,
      //   title: '车间看板',
      //   permission: 'execution:workshop:view',
      // },
      {
        path: '/execution/float-ticket',
        component: FloatTicketList,
        title: '批生产浮票',
        permission: 'execution:floatticket:view',
      },
      {
        path: '/execution/pad',
        component: PadExecutionList,
        title: '工序执行',
        permission: 'execution:pad:view',
      },
    ],
  },
  {
    path: '/quality',
    title: '质量管理',
    icon: 'SafetyCertificateOutlined',
    children: [
      {
        path: '/quality/inspection',
        component: QualityInspectionList,
        title: '质检工作台',
        permission: 'quality:inspection:view',
      },
      {
        path: '/quality/mrb',
        component: MrbReviewList,
        title: 'MRB评审',
        permission: 'quality:mrb:view',
      },
      {
        path: '/quality/release',
        component: QualityReleaseList,
        title: '质量放行',
        permission: 'quality:release:view',
      },
    ],
  },
  {
    path: '/ebr',
    title: '电子批记录',
    icon: 'FileTextOutlined',
    children: [
      {
        path: '/ebr/list',
        component: EBRList,
        title: 'EBR列表',
        permission: 'ebr:view',
      },
    ],
  },
  {
    path: '/issuance',
    title: '领料管理',
    icon: 'ShoppingCartOutlined',
    children: [
      {
        path: '/issuance/material',
        component: MaterialIssuanceList,
        title: '领料管理',
        permission: 'issuance:material:view',
      },
    ],
  },
  {
    path: '/routing',
    title: '工艺路径',
    icon: 'PartitionOutlined',
    children: [
      {
        path: '/routing/master',
        component: RoutingMasterList,
        title: '工艺路径主数据',
        permission: 'routing:master:view',
      },
    ],
  },
  {
    path: '/system',
    title: '系统管理',
    icon: 'SettingOutlined',
    children: [
      {
        path: '/system/permission',
        component: PermissionManagement,
        title: '权限管理',
        permission: 'system:permission:view',
      },
    ],
  },
];

/**
 * 扁平化路由配置
 * 用于路由守卫和权限检查
 */
export const flatRoutes: RouteConfig[] = [];

function flattenRoutes(routes: RouteConfig[], parentPath = ''): void {
  routes.forEach(route => {
    const fullPath = `${parentPath}${route.path}`;
    flatRoutes.push({ ...route, path: fullPath });

    if (route.children) {
      flattenRoutes(route.children, fullPath);
    }
  });
}

flattenRoutes(routes);

/**
 * 获取路由面包屑
 */
export const getBreadcrumbs = (pathname: string): Array<{ path: string; title: string }> => {
  const breadcrumbs: Array<{ path: string; title: string }> = [];

  const findRoute = (routes: RouteConfig[], path: string, prefix = ''): boolean => {
    for (const route of routes) {
      const fullPath = `${prefix}${route.path}`;
      if (path.startsWith(fullPath)) {
        breadcrumbs.push({ path: fullPath, title: route.title });

        if (route.children) {
          const found = findRoute(route.children, path, fullPath);
          if (found) return true;
        }

        if (fullPath === path) {
          return true;
        }

        breadcrumbs.pop();
      }
    }
    return false;
  };

  findRoute(routes, pathname);
  return breadcrumbs;
};

/**
 * 根据权限过滤路由
 */
export const filterRoutesByPermission = (
  routes: RouteConfig[],
  userPermissions: string[]
): RouteConfig[] => {
  return routes
    .filter(route => {
      if (route.hidden) return false;
      if (route.permission && !userPermissions.includes(route.permission)) return false;
      return true;
    })
    .map(route => ({
      ...route,
      children: route.children ? filterRoutesByPermission(route.children, userPermissions) : undefined,
    }));
};

export default routes;