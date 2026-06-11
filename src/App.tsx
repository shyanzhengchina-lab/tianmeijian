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
const OperationListPage = lazy(() => import('./pages/operation/OperationListPage'));
const WorkshopPage = lazy(() => import('./pages/workshop/WorkshopPage'));
const FloatTicketPage = lazy(() => import('./pages/floatticket/FloatTicketPage'));
const InspectionPage = lazy(() => import('./pages/inspection/InspectionPage'));
const MrbPage = lazy(() => import('./pages/inspection/MrbPage'));
const ReleasePage = lazy(() => import('./pages/inspection/ReleasePage'));
const MaterialCategoryPage = lazy(() => import('./pages/material/MaterialCategoryPage'));
const ProductSeriesPage = lazy(() => import('./pages/pro/ProductSeriesPage'));
const ProductionOrderPage = lazy(() => import('./pages/workorder/ProductionOrderPage'));
const WorkOrderListPage = lazy(() => import('./pages/workorder/WorkOrderListPage'));
const TaskOrderPage = lazy(() => import('./pages/workorder/TaskOrderPage'));
const EquipmentPage = lazy(() => import('./pages/equipment/EquipmentPage'));
const EquipmentManagementPage = lazy(() => import('./pages/equipment/EquipmentManagementPage'));
const WorkCenterPage = lazy(() => import('./pages/workcenter/WorkCenterPage'));
const PadIndex = lazy(() => import('./pages/pad/PadIndex'));
const TeamPage = lazy(() => import('./pages/basicdata/TeamPage'));
const EmployeePage = lazy(() => import('./pages/basicdata/EmployeePage'));
const QcItemPage = lazy(() => import('./pages/basicdata/QcItemPage'));
const QcSchemePage = lazy(() => import('./pages/basicdata/QcSchemePage'));
const WorkshopArchivePage = lazy(() => import('./pages/basicdata/WorkshopArchivePage'));
const EbrListPage = lazy(() => import('./pages/ebr/EbrListPage'));
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
      case 'operation':         return ['基础资料', '工序主数据'];
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
      case 'fg-receipt':       return ['仓储管理', '成品入库'];
      case 'sales-shipment':   return ['仓储管理', '成品出库'];
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
      case 'operation':         return <PageWrapper><OperationListPage /></PageWrapper>;
      case 'pro':               return <PageWrapper><ProIndex onNavigateToSeries={() => setCurrentPage('product-series')} initialHighlightCode={highlightRoutingCode} /></PageWrapper>;
      case 'equipment':         return <PageWrapper><EquipmentPage /></PageWrapper>;
      case 'equipment-mgmt':    return <PageWrapper><EquipmentManagementPage /></PageWrapper>;
      case 'workcenter':        return <PageWrapper><WorkCenterPage /></PageWrapper>;
      case 'workshop-archive':  return <PageWrapper><WorkshopArchivePage /></PageWrapper>;
      case 'team':              return <PageWrapper><TeamPage /></PageWrapper>;
      case 'employee':          return <PageWrapper><EmployeePage /></PageWrapper>;
      case 'qc-item':           return <PageWrapper><QcItemPage /></PageWrapper>;
      case 'qc-scheme':         return <PageWrapper><QcSchemePage /></PageWrapper>;
      case 'workshop':          return <PageWrapper><WorkshopPage /></PageWrapper>;
      case 'floatticket':       return <PageWrapper><FloatTicketPage /></PageWrapper>;
      case 'production-order':  return <PageWrapper><ProductionOrderPage onNavigateToWO={handleNavigateToWO} /></PageWrapper>;
      case 'work-order':        return <PageWrapper><WorkOrderListPage initialOpenWoId={openWoId} onNavigateToRouting={handleNavigateToRouting} /></PageWrapper>;
      case 'task-order':        return <PageWrapper><TaskOrderPage onNavigateToPad={() => setCurrentPage('pad-execution')} onNavigateToTaskPool={() => setCurrentPage('pad-taskpool')} /></PageWrapper>;
      case 'workorder':         return <PageWrapper><WorkOrderListPage initialOpenWoId={openWoId} onNavigateToRouting={handleNavigateToRouting} /></PageWrapper>;
      case 'inspection':        return <PageWrapper><InspectionPage /></PageWrapper>;
      // MRB已替换：保健品不使用MRB评审流程
      case 'release':           return <PageWrapper><ReleasePage /></PageWrapper>;
      case 'pad-execution':     return <PageWrapper><PadIndex /></PageWrapper>;
      case 'pad-taskpool':      return <PageWrapper><PadTaskPoolPage onNavigate={handlePageChange} /></PageWrapper>;
      case 'equip-conflict':    return <PageWrapper><EquipConflictPage /></PageWrapper>;
      case 'ebr-list':          return <PageWrapper><EbrListPage onNavigate={handlePageChange} initialBatchNo={ebrInitBatchNo} /></PageWrapper>;
      case 'equip-usage':        return <PageWrapper><EquipUsagePage /></PageWrapper>;
      case 'material-balance':    return <PageWrapper><MaterialBalancePage onNavigate={handlePageChange} initialBatchNo={balanceInitBatchNo} /></PageWrapper>;
      case 'permission':          return <PageWrapper><PermissionPage /></PageWrapper>;
      case 'system-org':          return <PageWrapper><SystemOrgPage /></PageWrapper>;
      case 'material-issuance':   return <PageWrapper><MaterialIssuancePage /></PageWrapper>;
      case 'pad-issuance':        return <PageWrapper><PadIssuancePage /></PageWrapper>;
      case 'backflush-monitor':   return <PageWrapper><BackflushMonitorPage /></PageWrapper>;
      case 'performance-test':     return <PageWrapper><PerformanceTestPage /></PageWrapper>;
      // UDI已替换为追溯管理（内容展示通用占位符）
      case 'trace-forward':
      case 'trace-backward':
      case 'trace-barcode':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, color: '#999' }}>追溯查询功能开发中...</div>
            <div style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>GMP保健品追溯管理模块</div>
          </div>
        );
      case 'gmp-hygiene':
      case 'gmp-deviation':
      case 'gmp-capa':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 16, color: '#999' }}>GMP合规管理开发中...</div>
            <div style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>保健品GMP合规管理模块</div>
          </div>
        );
      case 'fg-receipt':          return <PageWrapper><FinishedGoodsReceiptPage /></PageWrapper>;
      case 'sales-shipment':      return <PageWrapper><SalesShipmentPage /></PageWrapper>;
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
