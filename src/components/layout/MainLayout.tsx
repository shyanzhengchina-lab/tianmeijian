import React, { useState } from 'react';
import { Layout, Badge, Avatar, Dropdown, Button, Breadcrumb, Tag, Tooltip } from 'antd';
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  ToolOutlined,
  SettingOutlined,
  LogoutOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  CloseOutlined,
  AppstoreOutlined,
  ContainerOutlined,
  ExperimentOutlined,
  NodeIndexOutlined,
  ApartmentOutlined,
  MonitorOutlined,
  SolutionOutlined,
  OrderedListOutlined,
  FileDoneOutlined,
  ProfileOutlined,
  ScheduleOutlined,
  DeploymentUnitOutlined,
  HddOutlined,
  TagsOutlined,
  TabletOutlined,
  UsergroupAddOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  LockOutlined,
  SwapOutlined,
  GlobalOutlined,
  SendOutlined,
  InboxOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { FACTORIES, getFactoryById } from '../../store/rbacData';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  user: any;
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  breadcrumb?: string[];
  currentFactoryId?: string;
  onFactoryChange?: (factoryId: string) => void;
}

const menuItems = [
  {
    key: 'dashboard',
    icon: <HomeOutlined />,
    label: '生产看板',
    group: '生产执行',
  },
  {
    key: 'basic',
    icon: <DatabaseOutlined />,
    label: '基础资料',
    group: '基础资料',
    children: [
      { key: 'product-series',    label: '产品系列',   icon: <TagsOutlined /> },
      { key: 'material-category', label: '物料分类',   icon: <ApartmentOutlined /> },
      { key: 'material',          label: '物料档案',   icon: <ContainerOutlined /> },
      { key: 'unit',              label: '计量单位',   icon: <ExperimentOutlined /> },
      { key: 'bom',               label: '物料清单',   icon: <NodeIndexOutlined /> },
      { key: 'workshop-archive',  label: '车间档案',   icon: <BankOutlined /> },
      { key: 'equipment',         label: '设备档案',   icon: <HddOutlined /> },
      { key: 'workcenter',        label: '工作中心',   icon: <DeploymentUnitOutlined /> },
      { key: 'operation',         label: '工序主数据', icon: <ToolOutlined /> },
      { key: 'pro',               label: '工艺路径',   icon: <ApartmentOutlined /> },
      { key: 'team',              label: '班组档案',   icon: <UsergroupAddOutlined /> },
      { key: 'employee',          label: '员工档案',   icon: <UserOutlined /> },
      { key: 'qc-item',           label: '质检项目',   icon: <AuditOutlined /> },
      { key: 'qc-scheme',         label: '质检方案',   icon: <SafetyCertificateOutlined /> },
    ],
  },
  {
    key: 'production',
    icon: <ProfileOutlined />,
    label: '生产管理',
    group: '生产管理',
    children: [
      { key: 'production-order', label: '生产订单',  icon: <FileDoneOutlined /> },
      { key: 'work-order',       label: '生产工单',  icon: <OrderedListOutlined /> },
      { key: 'task-order',       label: '生产任务单', icon: <ScheduleOutlined /> },
      { key: 'floatticket',      label: '生产浮票',  icon: <FileTextOutlined /> },
    ],
  },
  {
    key: 'exec',
    icon: <AppstoreOutlined />,
    label: '车间执行',
    group: '车间执行',
    children: [
      { key: 'pad-execution', label: 'PAD工序执行', icon: <TabletOutlined /> },
      { key: 'pad-taskpool',  label: 'PAD任务池',   icon: <ThunderboltOutlined /> },
      { key: 'workshop',      label: '车间看板',   icon: <MonitorOutlined /> },
    ],
  },
  {
    key: 'issuance',
    icon: <SendOutlined />,
    label: '领料管理',
    group: '领料管理',
    children: [
      { key: 'material-issuance',  label: '领料单管理',   icon: <SendOutlined /> },
      { key: 'pad-issuance',       label: 'PDA拣货执行',    icon: <TabletOutlined /> },
      { key: 'backflush-monitor',  label: '倒扣监控',        icon: <InboxOutlined /> },
    ],
  },
  {
    key: 'quality',
    icon: <ToolOutlined />,
    label: '质量管理',
    group: '质量管理',
    children: [
      { key: 'inspection', label: '质检工作台', icon: <SolutionOutlined /> },
      { key: 'release',    label: '质量放行',   icon: <SettingOutlined /> },
    ],
  },
  {
    key: 'equipment-mgmt-group',
    icon: <ToolOutlined />,
    label: '设备管理',
    group: '设备管理',
    children: [
      { key: 'equipment-mgmt',  label: '设备管理总览', icon: <HddOutlined /> },
      { key: 'equip-conflict',  label: '设备冲突检测', icon: <WarningOutlined /> },
    ],
  },
  {
    key: 'ebr',
    icon: <FileDoneOutlined />,
    label: '电子批记录',
    group: '电子批记录',
    children: [
      { key: 'ebr-list',         label: '批记录管理',   icon: <FileTextOutlined /> },
      { key: 'equip-usage',      label: '设备使用批记录', icon: <HddOutlined /> },
      { key: 'material-balance', label: '物料平衡表',   icon: <FileTextOutlined /> },
    ],
  },
  {
    key: 'trace',
    icon: <NodeIndexOutlined />,
    label: '追溯管理',
    group: '追溯管理',
    children: [
      { key: 'trace-forward',  label: '正向追溯', icon: <NodeIndexOutlined /> },
      { key: 'trace-backward', label: '逆向追溯', icon: <ApartmentOutlined /> },
      { key: 'trace-barcode',  label: '追溯码查询', icon: <QrcodeOutlined /> },
    ],
  },
  {
    key: 'gmp',
    icon: <SafetyCertificateOutlined />,
    label: 'GMP合规',
    group: 'GMP合规',
    children: [
      { key: 'gmp-hygiene',    label: '卫生管理记录', icon: <ExperimentOutlined /> },
      { key: 'gmp-deviation',  label: '偏差处理',     icon: <WarningOutlined /> },
      { key: 'gmp-capa',       label: 'CAPA管理',     icon: <AuditOutlined /> },
    ],
  },
  {
    key: 'inventory',
    icon: <InboxOutlined />,
    label: '仓储管理',
    group: '仓储管理',
    children: [
      { key: 'fg-receipt',     label: '成品入库',  icon: <InboxOutlined /> },
      { key: 'sales-shipment', label: '成品出库',  icon: <SendOutlined /> },
    ],
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: '数据报表',
    group: '数据报表',
  },
  {
    key: 'system',
    icon: <LockOutlined />,
    label: '系统管理',
    group: '系统管理',
    children: [
      { key: 'system-org',  label: '组织机构',   icon: <GlobalOutlined /> },
      { key: 'permission',  label: '权限管理',   icon: <SafetyCertificateOutlined /> },
    ],
  },
];

const MainLayout: React.FC<MainLayoutProps> = ({
  user, children, currentPage, onPageChange, onLogout, breadcrumb = [],
  currentFactoryId = 'F001', onFactoryChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentFactory = getFactoryById(currentFactoryId);

  // 工厂切换菜单（仅显示用户有权限的工厂）
  const availableFactoryIds: string[] = user?.availableFactoryIds ?? [currentFactoryId];
  const factoryMenuItems = FACTORIES
    .filter(f => availableFactoryIds.includes(f.id))
    .map(f => ({
      key: f.id,
      icon: <BankOutlined />,
      label: (
        <span>
          {f.name}
          {f.id === currentFactoryId && (
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>当前</Tag>
          )}
        </span>
      ),
    }));

  const handleFactoryMenuClick = ({ key }: { key: string }) => {
    if (key !== currentFactoryId && onFactoryChange) {
      onFactoryChange(key);
    }
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'logout',  icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') onLogout();
  };

  const handleMenuClick = (key: string) => {
    onPageChange(key);
    setSidebarOpen(false);
  };

  // Group menu items by group key
  const menuGroups: { [key: string]: typeof menuItems } = {};
  menuItems.forEach(item => {
    if (!menuGroups[item.group]) menuGroups[item.group] = [];
    menuGroups[item.group].push(item);
  });

  // 页面 key → 菜单名称（全覆盖）
  const PAGE_TITLE_MAP: Record<string, string> = {
    dashboard:          '生产看板',
    'material-category':'物料分类',
    material:           '物料档案',
    unit:               '计量单位',
    bom:                '物料清单',
    equipment:          '设备档案',
    'equipment-mgmt':   '设备管理',
    workcenter:         '工作中心',
    'workshop-archive': '车间档案',
    team:               '班组档案',
    employee:           '员工档案',
    'qc-item':          '质检项目档案',
    'qc-scheme':        '质检方案档案',
    operation:          '工序主数据',
    'product-series':   '产品系列档案',
    pro:                '工艺路径',
    'production-order': '生产订单',
    'work-order':       '生产工单',
    workorder:          '生产工单',
    'task-order':       '生产任务单',
    'pad-execution':    'PAD工序执行',
    'pad-taskpool':     'PAD任务池',
    'equip-conflict':   '设备冲突检测',
    floatticket:        '生产浮票',
    workshop:           '车间看板',
    inspection:         '质检工作台',
    release:            '质量放行',
    'ebr-list':         '批记录管理',
    'equip-usage':        '设备使用批记录',
    'material-balance':   '物料平衡表',
    reports:            '数据报表',
    'system-org':         '组织机构管理',
    permission:           '权限管理',
    'material-issuance':  '领料单管理',
    'pad-issuance':       'PDA拣货执行',
    'backflush-monitor':  '倒扣监控',
    'trace-forward':      '正向追溯',
    'trace-backward':     '逆向追溯',
    'trace-barcode':      '追溯码查询',
    'gmp-hygiene':        '卫生管理记录',
    'gmp-deviation':      '偏差处理',
    'gmp-capa':           'CAPA管理',
    'fg-receipt':         '成品入库',
    'sales-shipment':     '成品出库',
  };

  const getHeaderTitle = () => PAGE_TITLE_MAP[currentPage] ?? '天美健 保健品MES';

  return (
    <Layout className="main-layout">
      {/* ── Top Header ── */}
      <Header className="main-header">
        <div className="header-left">
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="menu-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        <div className="header-center">
          <div className="header-title-block">
            <span className="header-sys-name">天美健 保健品MES</span>
            <span className="header-page-name">{getHeaderTitle()}</span>
          </div>
        </div>

        <div className="header-right">
          {/* 工厂切换器 */}
          {factoryMenuItems.length > 1 ? (
            <Dropdown
              menu={{ items: factoryMenuItems, onClick: handleFactoryMenuClick }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="text"
                className="header-factory-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: '#1677ff', fontSize: 12, height: 32,
                  border: '1px solid #d6e4ff', borderRadius: 6,
                  padding: '0 10px', background: '#f0f5ff',
                }}
              >
                <BankOutlined style={{ fontSize: 13 }} />
                <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentFactory?.name ?? '南京工厂'}
                </span>
                <SwapOutlined style={{ fontSize: 10, color: '#999' }} />
              </Button>
            </Dropdown>
          ) : (
            <Tooltip title={`${currentFactory?.country ?? ''} · ${currentFactory?.timezone ?? ''}`}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                color: '#1677ff', background: '#f0f5ff', border: '1px solid #d6e4ff',
                borderRadius: 6, padding: '3px 10px', cursor: 'default',
              }}>
                <BankOutlined style={{ fontSize: 13 }} />
                {currentFactory?.name ?? '南京工厂'}
              </span>
            </Tooltip>
          )}

          <Badge count={3} size="small">
            <Button type="text" icon={<BellOutlined />} className="header-icon-btn" />
          </Badge>
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Avatar className="user-avatar" size={34}>
              {user?.name?.[0] || 'U'}
            </Avatar>
          </Dropdown>
        </div>
      </Header>

      <Layout className="main-body">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <Sider
          className={`main-sider ${sidebarOpen ? 'sider-open' : 'sider-closed'}`}
          width={220}
          theme="light"
        >
          <div className="sider-user-header">
            <Button
              type="text"
              icon={<CloseOutlined />}
              className="sider-close-btn"
              onClick={() => setSidebarOpen(false)}
            />
            <Avatar className="sider-avatar" size={36}>
              {user?.name?.[0] || 'U'}
            </Avatar>
            <div className="sider-user-info">
              <div className="sider-username">{user?.name || '用户'}</div>
              <div className="sider-role">{user?.role || '操作员'}</div>
              {currentFactory && (
                <div style={{ fontSize: 11, color: '#1677ff', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BankOutlined style={{ fontSize: 10 }} />
                  {currentFactory.name}
                </div>
              )}
            </div>
          </div>

          <div className="sider-menu-scroll">
            {Object.entries(menuGroups).map(([group, items]) => (
              <div key={group} className="menu-group">
                <div className="menu-group-title">{group}</div>
                {items.map(item => (
                  <div key={item.key}>
                    {item.children ? (
                      <div className="menu-parent">
                        <div className="menu-parent-label">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {item.children.map(child => (
                          <div
                            key={child.key}
                            className={`menu-child-item ${currentPage === child.key ? 'active' : ''}`}
                            onClick={() => handleMenuClick(child.key)}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`menu-item ${currentPage === item.key ? 'active' : ''}`}
                        onClick={() => handleMenuClick(item.key)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        {currentPage === item.key && <span className="menu-tag">活跃</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Sider>

        {/* Main Content */}
        <Content className="main-content">
          {breadcrumb.length > 0 && (
            <div className="breadcrumb-bar">
              <Breadcrumb
                items={[
                  { title: <HomeOutlined />, onClick: () => onPageChange('dashboard') },
                  ...breadcrumb.map(b => ({ title: b }))
                ]}
              />
            </div>
          )}
          <div className="content-body">
            {children}
          </div>
        </Content>
      </Layout>

      {/* Bottom Tab Bar */}
      <div className="bottom-tabbar">
        {[
          { key: 'dashboard',        icon: <HomeOutlined />,        label: '首页' },
          { key: 'production-order', icon: <FileDoneOutlined />,    label: '订单' },
          { key: 'work-order',       icon: <OrderedListOutlined />, label: '工单' },
          { key: 'ebr-list',         icon: <FileDoneOutlined />,    label: '批记录' },
          { key: 'inspection',       icon: <SolutionOutlined />,    label: '质检' },
          { key: 'trace-forward',    icon: <NodeIndexOutlined />,   label: '追溯' },
          { key: 'pad-execution',    icon: <TabletOutlined />,      label: '生产执行' },
        ].map(tab => (
          <div
            key={tab.key}
            className={`tab-item ${currentPage === tab.key ? 'tab-active' : ''}`}
            onClick={() => onPageChange(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default MainLayout;
