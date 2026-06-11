import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Avatar, Dropdown, Space, Typography, Tag, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  DashboardOutlined, AppstoreOutlined, ScheduleOutlined, PlayCircleOutlined,
  SafetyOutlined, FileTextOutlined, InboxOutlined, ToolOutlined, ApartmentOutlined,
  SettingOutlined, UserOutlined, LogoutOutlined, BankOutlined, TeamOutlined,
  FileSearchOutlined, ProductOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import WorkOrderPage from './pages/plan/WorkOrderPage';
import TaskOrderPage from './pages/execution/TaskOrderPage';
import DeviationPage from './pages/execution/DeviationPage';
import InspectionPage from './pages/quality/InspectionPage';
import NcPage from './pages/quality/NcPage';
import QcSchemePage from './pages/quality/QcSchemePage';
import EbrListPage from './pages/ebr/EbrListPage';
import LotPage from './pages/warehouse/LotPage';
import IssuancePage from './pages/warehouse/IssuancePage';
import EquipmentPage from './pages/equipment/EquipmentPage';
import MaintPlanPage from './pages/equipment/MaintPlanPage';
import FaultPage from './pages/equipment/FaultPage';
import TracePage from './pages/trace/TracePage';
import MaterialPage from './pages/base/MaterialPage';
import BomPage from './pages/base/BomPage';
import RoutingPage from './pages/base/RoutingPage';
import EmployeePage from './pages/base/EmployeePage';
import WorkshopPage from './pages/base/WorkshopPage';
import UserPage from './pages/system/UserPage';

dayjs.locale('zh-cn');
const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '综合看板' },
  {
    key: 'plan', icon: <ScheduleOutlined />, label: 'M01-计划管理',
    children: [{ key: '/plan/work-orders', label: '生产工单' }]
  },
  {
    key: 'execution', icon: <PlayCircleOutlined />, label: 'M02-生产执行',
    children: [
      { key: '/execution/tasks', label: '任务单管理' },
      { key: '/execution/deviations', label: '偏差管理' },
    ]
  },
  {
    key: 'quality', icon: <SafetyOutlined />, label: 'M03-质量管理',
    children: [
      { key: '/quality/inspections', label: '检验任务' },
      { key: '/quality/nc', label: '不合格品' },
      { key: '/quality/schemes', label: '质检方案' },
    ]
  },
  { key: '/ebr', icon: <FileTextOutlined />, label: 'M04-电子批记录' },
  {
    key: 'warehouse', icon: <InboxOutlined />, label: 'M05-物料仓储',
    children: [
      { key: '/warehouse/lots', label: '物料批次' },
      { key: '/warehouse/issuances', label: '发料管理' },
    ]
  },
  {
    key: 'equipment', icon: <ToolOutlined />, label: 'M06-设备管理',
    children: [
      { key: '/equipment/list', label: '设备档案' },
      { key: '/equipment/maint', label: '维护计划' },
      { key: '/equipment/faults', label: '故障记录' },
    ]
  },
  { key: '/trace', icon: <ApartmentOutlined />, label: 'M07-追溯查询' },
  {
    key: 'base', icon: <AppstoreOutlined />, label: '基础档案',
    children: [
      { key: '/base/materials', label: '物料档案' },
      { key: '/base/boms', label: 'BOM管理' },
      { key: '/base/routings', label: '工艺路线' },
      { key: '/base/employees', label: '员工档案' },
      { key: '/base/workshops', label: '车间管理' },
    ]
  },
  {
    key: 'system', icon: <SettingOutlined />, label: 'M09-系统管理',
    children: [{ key: '/system/users', label: '用户管理' }]
  },
];

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const userStr = localStorage.getItem('tmj_mes_user');
  const user = userStr ? JSON.parse(userStr) : {};

  const selectedKey = location.pathname;
  const openKeys = menuItems
    .filter(m => m.children?.some(c => c.key === selectedKey))
    .map(m => m.key);

  const handleLogout = () => {
    localStorage.removeItem('tmj_mes_token');
    localStorage.removeItem('tmj_mes_user');
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'info', icon: <UserOutlined />, label: `${user.realName || user.username} (${user.roleCode || ''})` },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }) => { if (key === 'logout') handleLogout(); }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}
        style={{ background: '#001529' }} width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#002142' }}>
          {collapsed
            ? <BankOutlined style={{ fontSize: 24, color: '#fff' }} />
            : <Typography.Text strong style={{ color: '#fff', fontSize: 14 }}>天美健MES系统</Typography.Text>
          }
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <Space>
            <Tag color="blue" style={{ fontSize: 12 }}>
              <BankOutlined /> {user.factoryCode === 'NJ' ? '南京工厂' : user.factoryCode === 'LS' ? '溧水工厂' : user.factoryCode || '全厂'}
            </Tag>
          </Space>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ background: '#1677ff' }} icon={<UserOutlined />} />
              <span style={{ color: '#333' }}>{user.realName || user.username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', background: '#f5f5f5', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('tmj_mes_token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <PrivateRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/plan/work-orders" element={<WorkOrderPage />} />
                  <Route path="/execution/tasks" element={<TaskOrderPage />} />
                  <Route path="/execution/deviations" element={<DeviationPage />} />
                  <Route path="/quality/inspections" element={<InspectionPage />} />
                  <Route path="/quality/nc" element={<NcPage />} />
                  <Route path="/quality/schemes" element={<QcSchemePage />} />
                  <Route path="/ebr" element={<EbrListPage />} />
                  <Route path="/warehouse/lots" element={<LotPage />} />
                  <Route path="/warehouse/issuances" element={<IssuancePage />} />
                  <Route path="/equipment/list" element={<EquipmentPage />} />
                  <Route path="/equipment/maint" element={<MaintPlanPage />} />
                  <Route path="/equipment/faults" element={<FaultPage />} />
                  <Route path="/trace" element={<TracePage />} />
                  <Route path="/base/materials" element={<MaterialPage />} />
                  <Route path="/base/boms" element={<BomPage />} />
                  <Route path="/base/routings" element={<RoutingPage />} />
                  <Route path="/base/employees" element={<EmployeePage />} />
                  <Route path="/base/workshops" element={<WorkshopPage />} />
                  <Route path="/system/users" element={<UserPage />} />
                </Routes>
              </MainLayout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
