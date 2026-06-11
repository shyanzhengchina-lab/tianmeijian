/**
 * 导航工具
 * 提供统一的导航管理功能
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';

/**
 * 导航操作类型
 */
export type NavigationAction =
  | 'push'
  | 'replace'
  | 'back'
  | 'forward'
  | 'refresh';

/**
 * 导航参数类型
 */
export interface NavigationParams {
  path?: string;
  query?: Record<string, any>;
  state?: Record<string, any>;
}

/**
 * 导航工具 Hook
 */
export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * 构建带查询参数的URL
   */
  const buildUrl = (path: string, query?: Record<string, any>): string => {
    if (!query || Object.keys(query).length === 0) {
      return path;
    }

    const queryString = Object.entries(query)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${path}${queryString ? `?${queryString}` : ''}`;
  };

  /**
   * 导航到指定路径
   */
  const navigateTo = (path: string, options?: NavigationParams) => {
    const url = buildUrl(path, options?.query);
    navigate(url, { state: options?.state });
  };

  /**
   * 替换当前路径
   */
  const replaceTo = (path: string, options?: NavigationParams) => {
    const url = buildUrl(path, options?.query);
    navigate(url, { replace: true, state: options?.state });
  };

  /**
   * 返回上一页
   */
  const goBack = () => {
    navigate(-1);
  };

  /**
   * 前进到下一页
   */
  const goForward = () => {
    navigate(1);
  };

  /**
   * 刷新当前页面
   */
  const refresh = () => {
    navigate(0);
  };

  /**
   * 获取查询参数
   */
  const getQueryParams = (): Record<string, string> => {
    const params = new URLSearchParams(location.search);
    const result: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
      result[key] = value;
    }

    return result;
  };

  /**
   * 获取指定查询参数
   */
  const getQueryParam = (key: string): string | null => {
    const params = new URLSearchParams(location.search);
    return params.get(key);
  };

  /**
   * 设置查询参数
   */
  const setQueryParams = (params: Record<string, any>, replace = true) => {
    const currentParams = getQueryParams();
    const newParams = { ...currentParams, ...params };

    const queryString = Object.entries(newParams)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const url = `${location.pathname}${queryString ? `?${queryString}` : ''}`;

    if (replace) {
      navigate(url, { replace: true });
    } else {
      navigate(url);
    }
  };

  /**
   * 清除查询参数
   */
  const clearQueryParams = (keys?: string[]) => {
    const currentParams = getQueryParams();

    if (keys) {
      keys.forEach(key => {
        delete currentParams[key];
      });
    } else {
      Object.keys(currentParams).forEach(key => {
        delete currentParams[key];
      });
    }

    setQueryParams(currentParams);
  };

  /**
   * 检查当前路径是否匹配
   */
  const isPathMatch = (path: string): boolean => {
    if (path === location.pathname) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  /**
   * 导航到模块页面
   */
  const navigateToModule = (moduleName: string, action: 'list' | 'create' | 'edit' | 'detail' = 'list', id?: string) => {
    const moduleRoutes: Record<string, string> = {
      material: '/basic-data/material',
      unit: '/basic-data/unit',
      bom: '/basic-data/bom',
      operation: '/basic-data/operation',
      equipment: '/basic-data/equipment',
      workcenter: '/basic-data/workcenter',
      team: '/basic-data/team',
      employee: '/basic-data/employee',
      'qc-item': '/basic-data/qc-item',
      'qc-scheme': '/basic-data/qc-scheme',
      workshop: '/basic-data/workshop',
      'production-order': '/production/production-order',
      'work-order': '/production/work-order',
      'task-order': '/production/task-order',
      'workshop-dashboard': '/execution/workshop',
      'float-ticket': '/execution/float-ticket',
      pad: '/execution/pad',
      inspection: '/quality/inspection',
      mrb: '/quality/mrb',
      release: '/quality/release',
      ebr: '/ebr/list',
      'material-issuance': '/issuance/material',
      'routing-master': '/routing/master',
      permission: '/system/permission',
    };

    const basePath = moduleRoutes[moduleName];
    if (!basePath) {
      message.error(`未找到模块: ${moduleName}`);
      return;
    }

    let targetPath = basePath;
    if (action === 'create') {
      targetPath = `${basePath}/create`;
    } else if (action === 'edit' && id) {
      targetPath = `${basePath}/edit/${id}`;
    } else if (action === 'detail' && id) {
      targetPath = `${basePath}/detail/${id}`;
    }

    navigateTo(targetPath);
  };

  /**
   * 导航到详情页
   */
  const navigateToDetail = (basePath: string, id: string) => {
    navigateTo(`${basePath}/detail/${id}`);
  };

  /**
   * 导航到编辑页
   */
  const navigateToEdit = (basePath: string, id: string) => {
    navigateTo(`${basePath}/edit/${id}`);
  };

  /**
   * 导航到创建页
   */
  const navigateToCreate = (basePath: string) => {
    navigateTo(`${basePath}/create`);
  };

  return {
    // 基础导航
    navigateTo,
    replaceTo,
    goBack,
    goForward,
    refresh,

    // 查询参数
    getQueryParams,
    getQueryParam,
    setQueryParams,
    clearQueryParams,

    // 路径匹配
    isPathMatch,

    // 模块导航
    navigateToModule,
    navigateToDetail,
    navigateToEdit,
    navigateToCreate,

    // 当前状态
    currentPath: location.pathname,
    currentSearch: location.search,
    currentHash: location.hash,
    currentState: location.state,
  };
};

/**
 * 导航常量
 */
export const NavigationConstants = {
  // 模块路径
  MODULES: {
    MATERIAL: '/basic-data/material',
    UNIT: '/basic-data/unit',
    BOM: '/basic-data/bom',
    OPERATION: '/basic-data/operation',
    EQUIPMENT: '/basic-data/equipment',
    WORKCENTER: '/basic-data/workcenter',
    TEAM: '/basic-data/team',
    EMPLOYEE: '/basic-data/employee',
    QC_ITEM: '/basic-data/qc-item',
    QC_SCHEME: '/basic-data/qc-scheme',
    WORKSHOP: '/basic-data/workshop',
    PRODUCTION_ORDER: '/production/production-order',
    WORK_ORDER: '/production/work-order',
    TASK_ORDER: '/production/task-order',
    WORKSHOP_DASHBOARD: '/execution/workshop',
    FLOAT_TICKET: '/execution/float-ticket',
    PAD: '/execution/pad',
    INSPECTION: '/quality/inspection',
    MRB: '/quality/mrb',
    RELEASE: '/quality/release',
    EBR: '/ebr/list',
    MATERIAL_ISSUANCE: '/issuance/material',
    ROUTING_MASTER: '/routing/master',
    PERMISSION: '/system/permission',
  },

  // 操作类型
  ACTIONS: {
    LIST: 'list',
    CREATE: 'create',
    EDIT: 'edit',
    DETAIL: 'detail',
  },

  // 公共页面
  PAGES: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    SELECT_FACTORY: '/select-factory',
    DASHBOARD: '/',
    NOT_FOUND: '/404',
    FORBIDDEN: '/403',
    SERVER_ERROR: '/500',
  },
};

export default useNavigation;