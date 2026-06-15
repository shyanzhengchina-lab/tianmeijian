/**
 * React MES 应用根组件 - 现代化版本
 * 集成新架构：React Router + Zustand + 模块化设计
 */

import React, { Suspense, useState } from 'react';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 导入新架构路由配置
import routes from './routing/routes';

// 导入新架构组件（逐步替换旧组件）
import { MaterialList } from './modules/basic-data/material/components';
import { UnitList } from './modules/basic-data/unit/components';

// 导入路由守卫和导航工具
import { useRouteGuard, AuthGuard, FactoryGuard } from './routing/route-guards';

// 导入主题和样式
import { antdTheme } from './styles/theme';

// 导入性能监控和全局状态
import PerformanceMonitor from './shared/components/PerformanceMonitor';
import { getCurrentFactoryId, setCurrentFactoryId, getFactoryById, loadUserFactories, FACTORIES } from './store/rbacData';

// 导入旧版组件（逐步迁移）
import LoginPage from './pages/login/LoginPage';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/dashboard/DashboardPage';

// 导入样式
import './App.css';

// 旧版页面组件懒加载（性能优化：代码分割）
import { lazy } from 'react';
const MaterialPage = lazy(() => import('./pages/material/MaterialPage'));
const UnitPage = lazy(() => import('./pages/unit/UnitPage'));
const BomIndex = lazy(() => import('./pages/bom/BomIndex'));
const ProIndex = lazy(() => import('./pages/pro/ProIndex'));
const SeriesProvider = lazy(() => import('./pages/pro/SeriesContext').then(m => ({ default: m.SeriesProvider })));

// ... 其他页面组件懒加载
const WorkshopPage = lazy(() => import('./pages/workshop/WorkshopPage'));
const WorkshopPageNew = lazy(() => import('./pages/workshop/WorkshopPageNew'));
const FloatTicketPage = lazy(() => import('./pages/floatticket/FloatTicketPage'));
const InspectionPage = lazy(() => import('./pages/inspection/InspectionPage'));
const MrbPage = lazy(() => import('./pages/inspection/MrbPage'));
const ReleasePage = lazy(() => import('./pages/inspection/ReleasePage'));
const MaterialCategoryPage = lazy(() => import('./pages/material/MaterialCategoryPage'));
const ProductSeriesPage = lazy(() => import('./pages/pro/ProductSeriesPage'));
const ProductionOrderPage = lazy(() => import('./pages/workorder/ProductionOrderPage'));
const WorkOrderListPage = lazy(() => import('./pages/workorder/WorkOrderListPage'));
const WorkOrderListPageNew = lazy(() => import('./pages/workorder/WorkOrderListPageNew'));
const TaskOrderPage = lazy(() => import('./pages/workorder/TaskOrderPage'));
const TaskOrderPageNew = lazy(() => import('./pages/workorder/TaskOrderPageNew'));
const EquipmentPage = lazy(() => import('./pages/equipment/EquipmentPage'));
const EquipmentManagementPage = lazy(() => import('./pages/equipment/EquipmentManagementPage'));
const EquipmentManagementPageNew = lazy(() => import('./pages/equipment/EquipmentManagementPageNew'));
const WorkCenterPage = lazy(() => import('./pages/workcenter/WorkCenterPage'));
const PadIndex = lazy(() => import('./pages/pad/PadIndex'));
const TeamPage = lazy(() => import('./pages/basicdata/TeamPage'));
const EmployeePage = lazy(() => import('./pages/basicdata/EmployeePage'));
const QcItemPage = lazy(() => import('./pages/basicdata/QcItemPage'));
const QcSchemePage = lazy(() => import('./pages/basicdata/QcSchemePage'));
const WorkshopArchivePage = lazy(() => import('./pages/basicdata/WorkshopArchivePage'));
const EbrListPage = lazy(() => import('./pages/ebr/EbrListPage'));
const EbrListPageNew = lazy(() => import('./pages/ebr/EbrListPageNew'));
const EquipUsagePage = lazy(() => import('./pages/equipment/EquipUsagePage'));
const MaterialBalancePage = lazy(() => import('./pages/ebr/MaterialBalancePage'));
const PadTaskPoolPage = lazy(() => import('./pages/pad/PadTaskPoolPage'));
const EquipConflictPage = lazy(() => import('./pages/workorder/EquipConflictPage'));
const PermissionPage = lazy(() => import('./pages/system/PermissionPage'));
const SystemOrgPage = lazy(() => import('./pages/system/SystemOrgPage'));
const MaterialIssuancePage = lazy(() => import('./pages/issuance/MaterialIssuancePage'));
const PadIssuancePage = lazy(() => import('./pages/issuance/PadIssuancePage'));
const BackflushMonitorPage = lazy(() => import('./pages/issuance/BackflushMonitorPage'));
const PerformanceTestPage = lazy(() => import('./pages/performance-test/PerformanceTestPage'));
// UDI页面已移除，保健品行业使用追溯管理替代
const FinishedGoodsReceiptPage = lazy(() => import('./pages/udi/FinishedGoodsReceiptPage'));
const SalesShipmentPage = lazy(() => import('./pages/udi/SalesShipmentPage'));
// 保健品新增模块
const TracePage = lazy(() => import('./pages/trace/TracePage'));
const GmpPage = lazy(() => import('./pages/gmp/GmpPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const UrgentOrderPage = lazy(() => import('./pages/production/UrgentOrderPage'));
// 新增：GMP增强模块
const OperationArchivePage = lazy(() => import('./pages/operation/OperationArchivePage'));
// 清场管理页保留（供后续直接访问URL使用），质量门控/生产前确认/称量防错已嵌入PAD工序阶段
const EbrEnhancedPage = lazy(() => import('./pages/ebr/EbrEnhancedPage'));
// 新增：批包装记录EBR（1:1复刻）
const BatchPackagingEbrPage = lazy(() => import('./pages/ebr/BatchPackagingEbrPage'));
// PRD完善模块（EBR审批工作流/物料平衡计算引擎）
const EbrWorkflowPage = lazy(() => import('./pages/ebr/EbrWorkflowPage'));
const MaterialBalanceEnginePage = lazy(() => import('./pages/ebr/MaterialBalanceEnginePage'));
// 新增：批包装记录自动生成打印页（SOR-MF-PE-02-05格式）
const BatchRecordPrintPage = lazy(() => import('./pages/ebr/BatchRecordPrintPage'));
const AuditTrailPage        = lazy(() => import('./pages/gmp/AuditTrailPage'));
// PRD §13/§15 偏差增强/审计追踪
const DeviationEnhancedPage = lazy(() => import('./pages/gmp/DeviationEnhancedPage'));
// 演示数据注入工具
const DemoDataInjectorPage = lazy(() => import('./pages/demo/DemoDataInjectorPage'));
// 浮动排程模块
const SchedulingPage = lazy(() => import('./pages/scheduling/SchedulingPage'));
// 天美健PAD工序执行界面（保健品GMP）
const TMJPadExecutionPage = lazy(() => import('./modules/execution/pad/components/TMJPadExecutionPage').then(m => ({ default: m.TMJPadExecutionPage })));


// 配置dayjs中文
dayjs.locale('zh-cn');

/**
 * 路由守卫组件 - 使用新架构的路由守卫
 */
const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useRouteGuard();
  return <>{children}</>;
};

/**
 * 懒加载包装组件 - 提供加载状态（性能优化）
 */
const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f7fa',
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    }
  >
    {children}
  </Suspense>
);

/**
 * 页面级懒加载包装器（性能优化：预加载提示）
 */
const PageWrapper: React.FC<{ children: React.ReactNode; loadingText?: string }> = ({
  children,
  loadingText = '页面加载中...'
}) => (
  <Suspense
    fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        background: '#f5f7fa',
      }}>
        <Spin size="large" tip={loadingText} />
        <div style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
          首次加载可能需要几秒钟，请稍候...
        </div>
      </div>
    }
  >
    {children}
  </Suspense>
);

/**
 * 错误页面组件
 */
const Error404 = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'center',
    height: '100vh',
    background: '#f5f7fa',
  }}>
    <h1 style={{ fontSize: '120px', margin: 0 }}>404</h1>
    <p style={{ fontSize: '18px', color: '#666' }}>页面未找到</p>
  </div>
);

const Error403 = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'center',
    height: '100vh',
    background: '#f5f7fa',
  }}>
    <h1 style={{ fontSize: '120px', margin: 0 }}>403</h1>
    <p style={{ fontSize: '18px', color: '#666' }}>访问被拒绝</p>
  </div>
);

const Error500 = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'center',
    height: '100vh',
    background: '#f5f7fa',
  }}>
    <h1 style={{ fontSize: '120px', margin: 0 }}>500</h1>
    <p style={{ fontSize: '18px', color: '#666' }}>服务器错误</p>
  </div>
);

// ── 版本缓存清除：当APP_VERSION变更时清空旧mock数据（保留登录态和演示数据）─────────
const APP_VERSION = 'tmj-mes-v2.3';
if (localStorage.getItem('app_version') !== APP_VERSION) {
  // 只清除旧mock数据，不清除登录token和演示数据
  // 注意：如果有演示数据标记，保护所有基础资料 key 不被清除
  const hasDemoInjected = !!localStorage.getItem('bip_demo_injected');
  const mockKeysToRemove = hasDemoInjected
    ? [
        // 演示数据已注入：只清除无关的旧key，保留基础资料
        'bip_units', 'bip_boms',
        'bip_task_orders', 'bip_equipments',
        // 注意：bip_work_orders、bip_production_orders、bip_ebr_records、
        //       bip_materials、bip_material_categories、bip_routings、bip_product_series
        //       均由演示数据注入，不清除
      ]
    : [
        // 无演示数据：清除所有旧mock数据（下次注入时会重写）
        'bip_material_categories', 'bip_materials', 'bip_units', 'bip_boms',
        'bip_task_orders', 'bip_equipments',
        // 注意：bip_work_orders、bip_production_orders、bip_ebr_records 由演示数据注入，不清除
      ];
  mockKeysToRemove.forEach(k => localStorage.removeItem(k));
  localStorage.setItem('app_version', APP_VERSION);
}

/**
 * 主应用组件 - 支持新旧两种架构模式
 */
const App: React.FC = () => {
  // 临时保持向后兼容的状态管理
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentFactoryId, setCurrentFactoryIdState] = useState<string>(getCurrentFactoryId());
  const [openWoId, setOpenWoId] = useState<string | undefined>(undefined);
  const [highlightRoutingCode, setHighlightRoutingCode] = useState<string | undefined>(undefined);
  const [ebrInitBatchNo, setEbrInitBatchNo] = useState<string | undefined>(undefined);
  const [balanceInitBatchNo, setBalanceInitBatchNo] = useState<string | undefined>(undefined);

  const handleLogin = (userData: any) => {
    // 登录时同步工厂状态
    const factoryId = userData.factoryId ?? getCurrentFactoryId();
    setCurrentFactoryIdState(factoryId);
    setCurrentFactoryId(factoryId);
    // 补全用户的 availableFactoryIds
    const ufList = loadUserFactories();
    const uf = ufList.find(u => u.userId === userData.userId || u.userId === userData.employeeId);
    const availableFactoryIds = uf?.factoryIds ?? [factoryId];
    const fullUser = { ...userData, factoryId, availableFactoryIds };
    setUser(fullUser);
    // 同步写入 localStorage，让 AuthGuard / authStore 识别已登录状态
    localStorage.setItem('mes_user', JSON.stringify(fullUser));
    // 使用 authStore 中真实的 token（不覆盖）
    if (!localStorage.getItem('mes_token')) {
      localStorage.setItem('mes_token', 'session-' + Date.now());
    }
    // 确保 FactoryGuard 使用的 bip_cur_factory key 也有值
    if (!localStorage.getItem('bip_cur_factory')) {
      localStorage.setItem('bip_cur_factory', factoryId);
    }
  };
  const handleLogout  = () => {
    setUser(null);
    setCurrentPage('dashboard');
    // 清除登录态
    localStorage.removeItem('mes_user');
    localStorage.removeItem('mes_token');
  };

  // 工厂切换（顶部下拉）
  const handleFactoryChange = (factoryId: string) => {
    setCurrentFactoryId(factoryId);
    setCurrentFactoryIdState(factoryId);
    const factory = getFactoryById(factoryId);
    setUser((prev: any) => ({ ...prev, factoryId, factoryName: factory?.name }));
  };

  const handleNavigateToWO = (woId: string) => {
    setOpenWoId(woId);
    setCurrentPage('work-order');
  };

  const handleNavigateToRouting = (routingCode: string) => {
    setHighlightRoutingCode(routingCode);
    setCurrentPage('pro');
  };

  // 切页时清除跨页携带参数（支持可选 params 对象传递跨页数据）
  const handlePageChange = (page: string, params?: Record<string, unknown>) => {
    if (page !== 'work-order' && page !== 'workorder') setOpenWoId(undefined);
    if (page !== 'pro') setHighlightRoutingCode(undefined);
    if (page !== 'ebr-list') setEbrInitBatchNo(undefined);
    if (page !== 'material-balance') setBalanceInitBatchNo(undefined);
    // 处理携带参数
    if (params?.batchNo && page === 'ebr-list') setEbrInitBatchNo(params.batchNo as string);
    if (params?.batchNo && page === 'material-balance') setBalanceInitBatchNo(params.batchNo as string);
    setCurrentPage(page);
  };

  const getBreadcrumb = (): string[] => {
    switch (currentPage) {
      case 'product-series':    return ['基础资料', '产品系列'];
      case 'material-category': return ['基础资料', '物料分类'];
      case 'material':          return ['基础资料', '物料档案'];
      case 'unit':              return ['基础资料', '计量单位'];
      case 'bom':               return ['基础资料', '物料清单'];
      case 'pro':               return ['基础资料', '工艺路径'];
      case 'equipment':         return ['基础资料', '设备档案'];
      case 'equipment-mgmt':    return ['设备管理'];
      case 'workcenter':        return ['基础资料', '工作中心'];
      case 'workshop-archive':  return ['基础资料', '车间档案'];
      case 'team':              return ['基础资料', '班组档案'];
      case 'employee':          return ['基础资料', '员工档案'];
      case 'qc-item':           return ['基础资料', '质检项目档案'];
      case 'qc-scheme':         return ['基础资料', '质检方案档案'];
      case 'dashboard':         return ['生产看板'];
      case 'workshop':          return ['车间执行', '车间看板'];
      case 'floatticket':       return ['生产管理', '生产浮票'];
      case 'production-order':  return ['生产管理', '生产订单'];
      case 'work-order':        return ['生产管理', '生产工单'];
      case 'task-order':        return ['生产管理', '生产任务单'];
      case 'workorder':         return ['生产管理', '生产工单'];
      case 'inspection':        return ['质量管理', '质检工作台'];
      case 'mrb':               return ['质量管理', 'MRB不合格品评审'];
      case 'release':           return ['质量管理', '质量放行'];
      case 'pad-execution':     return ['车间执行', 'PAD工序执行'];
      case 'tmj-pad-execution':  return ['车间执行', '工序执行（天美健GMP）'];
      case 'pad-taskpool':      return ['车间执行', 'PAD任务池'];
      case 'equip-conflict':    return ['生产管理', '设备冲突检测'];
      case 'ebr-list':          return ['电子批记录', '批记录管理'];
      case 'equip-usage':        return ['电子批记录', '设备使用批记录'];
      case 'material-balance':    return ['电子批记录', '物料平衡表'];
      case 'permission':          return ['系统管理', '权限管理'];
      case 'system-org':          return ['系统管理', '组织机构管理'];
      case 'material-issuance':   return ['领料管理', '领料单管理'];
      case 'pad-issuance':        return ['领料管理', 'PDA拣货执行'];
      case 'backflush-monitor':   return ['领料管理', '倒扣监控'];
      case 'performance-test':     return ['系统管理', '性能测试'];
      case 'trace-forward':    return ['追溯管理', '正向追溯'];
      case 'trace-backward':   return ['追溯管理', '逆向追溯'];
      case 'trace-barcode':    return ['追溯管理', '追溯码查询'];
      case 'gmp-hygiene':      return ['GMP合规', '卫生管理记录'];
      case 'gmp-deviation':    return ['GMP合规', '偏差处理'];
      case 'gmp-capa':         return ['GMP合规', 'CAPA管理'];
      case 'operation-archive': return ['基础资料', '工序档案(GMP)'];
      case 'ebr-enhanced':      return ['电子批记录', 'EBR增强版'];
      case 'batch-pkg-ebr':     return ['电子批记录', '批包装记录（SOR-MF-PE-02-05）'];
      case 'batch-record-print': return ['电子批记录', '批记录自动生成打印'];
      case 'ebr-workflow':      return ['电子批记录', 'EBR审批工作流（PRD §5）'];
      case 'mat-balance-engine': return ['电子批记录', '物料平衡计算引擎（PRD §6）'];
      case 'dev-enhanced':      return ['GMP合规', '偏差管理（PRD §13）'];
      case 'audit-trail':       return ['GMP合规', '审计追踪ALCOA+（PRD §15）'];
      case 'fg-receipt':       return ['仓储管理', '成品入库'];
      case 'sales-shipment':   return ['仓储管理', '成品出库'];
      case 'reports':          return ['数据报表'];
      case 'urgent-order':     return ['生产管理', '插单管理'];
      case 'mrb':              return ['质量管理', 'MRB不合格品评审'];
      case 'demo-injector':     return ['演示工具', '完整演示数据注入'];
      case 'scheduling':          return ['生产管理', '浮动排程（FSE）'];
      default:                  return [];
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'product-series':    return <PageWrapper><ProductSeriesPage /></PageWrapper>;
      case 'material-category': return <PageWrapper><MaterialCategoryPage /></PageWrapper>;
      case 'dashboard':         return <DashboardPage onNavigate={handlePageChange} />;
      case 'material':          return <PageWrapper><MaterialPage /></PageWrapper>;
      case 'unit':              return <PageWrapper><UnitPage /></PageWrapper>;
      case 'bom':               return <PageWrapper><BomIndex /></PageWrapper>;
      case 'pro':               return <PageWrapper><ProIndex onNavigateToSeries={() => setCurrentPage('product-series')} initialHighlightCode={highlightRoutingCode} /></PageWrapper>;
      case 'equipment':         return <PageWrapper><EquipmentPage /></PageWrapper>;
      case 'equipment-mgmt':    return <PageWrapper><EquipmentManagementPageNew /></PageWrapper>;
      case 'workcenter':        return <PageWrapper><WorkCenterPage /></PageWrapper>;
      case 'workshop-archive':  return <PageWrapper><WorkshopArchivePage /></PageWrapper>;
      case 'team':              return <PageWrapper><TeamPage /></PageWrapper>;
      case 'employee':          return <PageWrapper><EmployeePage /></PageWrapper>;
      case 'qc-item':           return <PageWrapper><QcItemPage /></PageWrapper>;
      case 'qc-scheme':         return <PageWrapper><QcSchemePage /></PageWrapper>;
      case 'workshop':          return <PageWrapper><WorkshopPageNew /></PageWrapper>;
      case 'floatticket':       return <PageWrapper><FloatTicketPage /></PageWrapper>;
      case 'production-order':  return <PageWrapper><ProductionOrderPage onNavigateToWO={handleNavigateToWO} /></PageWrapper>;
      case 'work-order':        return <PageWrapper><WorkOrderListPageNew /></PageWrapper>;
      case 'task-order':        return <PageWrapper><TaskOrderPageNew /></PageWrapper>;
      case 'workorder':         return <PageWrapper><WorkOrderListPageNew /></PageWrapper>;
      case 'inspection':        return <PageWrapper><InspectionPage /></PageWrapper>;
      case 'mrb':               return <PageWrapper><MrbPage /></PageWrapper>;
      case 'release':           return <PageWrapper><ReleasePage /></PageWrapper>;
      case 'pad-execution':     return <PageWrapper><PadIndex /></PageWrapper>;
      case 'tmj-pad-execution':  return <PageWrapper><TMJPadExecutionPage /></PageWrapper>;
      case 'pad-taskpool':      return <PageWrapper><PadTaskPoolPage onNavigate={handlePageChange} /></PageWrapper>;
      case 'equip-conflict':    return <PageWrapper><EquipConflictPage /></PageWrapper>;
      case 'ebr-list':          return <PageWrapper><EbrListPageNew /></PageWrapper>;
      case 'equip-usage':        return <PageWrapper><EquipUsagePage /></PageWrapper>;
      case 'material-balance':    return <PageWrapper><MaterialBalancePage onNavigate={handlePageChange} initialBatchNo={balanceInitBatchNo} /></PageWrapper>;
      case 'permission':          return <PageWrapper><PermissionPage /></PageWrapper>;
      case 'system-org':          return <PageWrapper><SystemOrgPage /></PageWrapper>;
      case 'material-issuance':   return <PageWrapper><MaterialIssuancePage /></PageWrapper>;
      case 'pad-issuance':        return <PageWrapper><PadIssuancePage /></PageWrapper>;
      case 'backflush-monitor':   return <PageWrapper><BackflushMonitorPage /></PageWrapper>;
      case 'performance-test':     return <PageWrapper><PerformanceTestPage /></PageWrapper>;
      // 追溯管理（保健品GMP追溯）
      case 'trace-forward':
      case 'trace-backward':
      case 'trace-barcode':
        return <PageWrapper><TracePage subPage={currentPage} /></PageWrapper>;
      // GMP合规管理
      case 'gmp-hygiene':
      case 'gmp-deviation':
      case 'gmp-capa':
        return <PageWrapper><GmpPage subPage={currentPage} /></PageWrapper>;
      // GMP增强模块
      case 'operation-archive': return <PageWrapper><OperationArchivePage /></PageWrapper>;
      case 'ebr-enhanced':      return <PageWrapper><EbrEnhancedPage /></PageWrapper>;
      case 'batch-pkg-ebr':     return <PageWrapper><BatchPackagingEbrPage /></PageWrapper>;
      case 'batch-record-print': return <PageWrapper><BatchRecordPrintPage /></PageWrapper>;
      // PRD完善模块
      case 'ebr-workflow':      return <PageWrapper><EbrWorkflowPage /></PageWrapper>;
      case 'mat-balance-engine': return <PageWrapper><MaterialBalanceEnginePage /></PageWrapper>;
      // §13偏差管理/§15审计追踪（§11质量门控/§7生产前确认/§8称量防错/§10清场管理已嵌入PAD工序阶段）
      case 'dev-enhanced':      return <PageWrapper><DeviationEnhancedPage /></PageWrapper>;
      case 'audit-trail':       return <PageWrapper><AuditTrailPage /></PageWrapper>;
      case 'fg-receipt':          return <PageWrapper><FinishedGoodsReceiptPage /></PageWrapper>;
      case 'sales-shipment':      return <PageWrapper><SalesShipmentPage /></PageWrapper>;
      // 数据报表
      case 'reports':             return <PageWrapper><ReportsPage /></PageWrapper>;
      // 插单管理
      case 'urgent-order':        return <PageWrapper><UrgentOrderPage /></PageWrapper>;
      // 演示工具
      case 'demo-injector':        return <PageWrapper><DemoDataInjectorPage /></PageWrapper>;
      // 浮动排程
      case 'scheduling':             return <PageWrapper><SchedulingPage /></PageWrapper>;
      default:
        return (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '60vh', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
            <div style={{ fontSize: 16, color: '#999' }}>功能建设中...</div>
            <div style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>敬请期待</div>
          </div>
        );
    }
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={antdTheme}
    >
      <AntApp>
        {/* 性能监控组件 */}
        <PerformanceMonitor />

        {/* 新架构路由系统 - React Router */}
        <BrowserRouter>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/forgot-password" element={<LoginPage onLogin={handleLogin} />} />

            {/* 错误页面 */}
            <Route path="/404" element={<Error404 />} />
            <Route path="/403" element={<Error403 />} />
            <Route path="/500" element={<Error500 />} />

            {/* 新架构模块路由 */}
            <Route
              path="/basic-data/material/*"
              element={
                <LazyWrapper>
                  <MaterialList />
                </LazyWrapper>
              }
            />
            <Route
              path="/basic-data/unit/*"
              element={
                <LazyWrapper>
                  <UnitList />
                </LazyWrapper>
              }
            />

            {/* 受保护的路由 - 旧架构（向后兼容） */}
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <FactoryGuard>
                    <RouteGuard>
                      <SeriesProvider>
                        <MainLayout
                          user={user}
                          currentPage={currentPage}
                          onPageChange={handlePageChange}
                          onLogout={handleLogout}
                          breadcrumb={getBreadcrumb()}
                          currentFactoryId={currentFactoryId}
                          onFactoryChange={handleFactoryChange}
                        >
                          {renderPage()}
                        </MainLayout>
                      </SeriesProvider>
                    </RouteGuard>
                  </FactoryGuard>
                </AuthGuard>
              }
            />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
