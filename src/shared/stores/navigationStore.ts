/**
 * 导航状态管理 - Zustand实现
 * 替换当前基于状态导航的方式，提供统一的导航管理
 * 保持与现有App.tsx中的导航逻辑完全兼容
 */
import { create } from 'zustand';
export type { BreadcrumbItem } from '../types/common';
import { BreadcrumbItem } from '../types/common';

export interface NavigationState {
  // 当前页面标识
  currentPage: string;

  // 导航参数
  navigationParams: Record<string, any>;

  // 面包屑
  breadcrumb: BreadcrumbItem[];

  // 页面历史（用于返回）
  history: string[];

  // Actions
  setCurrentPage: (page: string) => void;
  navigate: (page: string, params?: Record<string, any>) => void;
  setNavigationParams: (params: Record<string, any>) => void;
  clearNavigationParams: () => void;
  setBreadcrumb: (breadcrumb: BreadcrumbItem[]) => void;
  addHistory: (page: string) => void;
  back: () => void;
}

// 默认页面列表（与App.tsx中的页面定义完全兼容）
export const PAGES = {
  dashboard: 'dashboard',
  material: 'material',
  materialCategory: 'material-category',
  unit: 'unit',
  bom: 'bom',
  operation: 'operation',
  equipment: 'equipment',
  workcenter: 'workcenter',
  team: 'team',
  employee: 'employee',
  qcItem: 'qc-item',
  qcScheme: 'qc-scheme',
  workshop: 'workshop',
  workshopArchive: 'workshop-archive',
  productSeries: 'product-series',
  productionOrder: 'production-order',
  workOrder: 'work-order',
  taskOrder: 'task-order',
  padExecution: 'pad-execution',
  padTaskPool: 'pad-taskpool',
  floatTicket: 'floatticket',
  inspection: 'inspection',
  mrb: 'mrb',
  release: 'release',
  equipmentMgmt: 'equipment-mgmt',
  equipConflict: 'equip-conflict',
  ebrList: 'ebr-list',
  equipUsage: 'equip-usage',
  materialBalance: 'material-balance',
  materialIssuance: 'material-issuance',
  padIssuance: 'pad-issuance',
  backflushMonitor: 'backflush-monitor',
  routing: 'routing',
  permission: 'permission',
  systemOrg: 'system-org',
} as const;

export type PageKey = typeof PAGES[keyof typeof PAGES];

// 页面显示名称映射（与MainLayout保持一致）
export const PAGE_NAMES: Record<PageKey, string> = {
  dashboard: '生产看板',
  material: '物料档案',
  'material-category': '物料分类',
  unit: '计量单位',
  bom: '物料清单(BOM)',
  operation: '工序主数据',
  equipment: '设备档案',
  workcenter: '工作中心',
  team: '班组档案',
  employee: '员工档案',
  'qc-item': '质检项目',
  'qc-scheme': '质检方案',
  workshop: '车间看板',
  'workshop-archive': '车间档案',
  'product-series': '产品系列',
  'production-order': '生产订单',
  'work-order': '生产工单',
  'task-order': '生产任务单',
  'pad-execution': 'PAD工序执行',
  'pad-taskpool': 'PAD任务池',
  floatticket: '批生产浮票',
  inspection: '质检工作台',
  mrb: 'MRB评审',
  release: '质量放行',
  'equipment-mgmt': '设备管理总览',
  'equip-conflict': '设备冲突检测',
  'ebr-list': '批记录管理',
  'equip-usage': '设备使用批记录',
  'material-balance': '物料平衡表',
  'material-issuance': '领料管理',
  'pad-issuance': 'PAD领料',
  'backflush-monitor': '倒冲监控',
  routing: '工艺路径',
  permission: '权限管理',
  'system-org': '组织架构',
};

// 创建Zustand Store
export const useNavigationStore = create<NavigationState>()(
  (set, get) => ({
    // 初始状态
    currentPage: PAGES.dashboard,
    navigationParams: {},
    breadcrumb: [],
    history: [],

    // Actions
    setCurrentPage: (page: string) => {
      set({ currentPage: page });
    },

    navigate: (page: string, params?: Record<string, any>) => {
      const { addHistory, setCurrentPage, setNavigationParams } = get();

      // 添加到历史记录
      addHistory(page);

      // 设置当前页面
      setCurrentPage(page);

      // 设置导航参数
      if (params) {
        setNavigationParams(params);
      }

      // 更新面包屑
      updateBreadcrumb(page);
    },

    setNavigationParams: (params: Record<string, any>) => {
      set({ navigationParams: params });
    },

    clearNavigationParams: () => {
      set({ navigationParams: {} });
    },

    setBreadcrumb: (breadcrumb: BreadcrumbItem[]) => {
      set({ breadcrumb });
    },

    addHistory: (page: string) => {
      set((state) => {
        // 避免重复页面
        if (state.history[state.history.length - 1] !== page) {
          return { history: [...state.history, page] };
        }
        return {};
      });
    },

    back: () => {
      const { history, currentPage } = get();
      if (history.length > 1) {
        // 移除当前页面
        const newHistory = history.slice(0, -1);
        const previousPage = newHistory[newHistory.length - 1];

        set({
          history: newHistory,
          currentPage: previousPage,
          navigationParams: {},
        });

        return previousPage;
      }
      return currentPage;
    },
  })
);

// 辅助函数：更新面包屑
function updateBreadcrumb(page: string) {
  const store = useNavigationStore.getState();
  const breadcrumb = generateBreadcrumb(page);
  store.setBreadcrumb(breadcrumb);
}

// 生成面包屑（基于页面层级）
function generateBreadcrumb(page: string): BreadcrumbItem[] {
  const breadcrumb: BreadcrumbItem[] = [
    { title: '首页', path: '/' },
  ];

  // 根据页面添加相应的面包屑层级
  if (page.startsWith('material')) {
    breadcrumb.push({ title: '基础资料' });
    breadcrumb.push({ title: PAGE_NAMES[page as PageKey] });
  } else if (page.startsWith('production') || page.startsWith('work')) {
    breadcrumb.push({ title: '生产管理' });
    breadcrumb.push({ title: PAGE_NAMES[page as PageKey] });
  } else if (page.startsWith('pad') || page === 'floatticket' || page === 'workshop') {
    breadcrumb.push({ title: '车间执行' });
    breadcrumb.push({ title: PAGE_NAMES[page as PageKey] });
  } else if (page === 'inspection' || page === 'mrb' || page === 'release') {
    breadcrumb.push({ title: '质量管理' });
    breadcrumb.push({ title: PAGE_NAMES[page as PageKey] });
  } else if (page.startsWith('ebr') || page === 'equip-usage' || page === 'material-balance') {
    breadcrumb.push({ title: '电子批记录' });
    breadcrumb.push({ title: PAGE_NAMES[page as PageKey] });
  } else {
    breadcrumb.push({ title: PAGE_NAMES[page as PageKey] || page });
  }

  return breadcrumb;
}

// 导出兼容原App.tsx的函数（方便渐进式迁移）
export const setCurrentPage = (page: string) => useNavigationStore.getState().setCurrentPage(page);
export const navigate = (page: string, params?: Record<string, any>) => useNavigationStore.getState().navigate(page, params);