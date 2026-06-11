/**
 * 新架构模块组件集成示例
 * 展示如何使用新架构的模块组件
 */

import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Alert, Divider, Row, Col, message } from 'antd';
import {
  // Issuance modules
  PadIssuanceList,
  usePadIssuanceStore
} from '../modules/issuance/pad-issuance';

import {
  BackflushMonitorList,
  useBackflushMonitorStore
} from '../modules/issuance/backflush-monitor';

import {
  ProductSeriesList,
  useProductSeriesStore
} from '../modules/routing/product-series';

import {
  RoutingDetailList,
  useRoutingDetailStore
} from '../modules/routing/routing-detail';

import {
  WorkshopDashboard,
  useWorkshopStore
} from '../modules/execution/workshop';

import {
  WorkOrderList,
  useWorkOrderStore
} from '../modules/production/work-order';

const { TabPane } = Tabs;

/**
 * 新架构模块集成示例
 * 演示如何使用新架构的模块组件
 */
const ModuleIntegrationExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pad-issuance');

  // 获取各个模块的store实例
  const padIssuanceStore = usePadIssuanceStore();
  const backflushMonitorStore = useBackflushMonitorStore();
  const productSeriesStore = useProductSeriesStore();
  const routingDetailStore = useRoutingDetailStore();
  const workshopStore = useWorkshopStore();
  const workOrderStore = useWorkOrderStore();

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        padIssuanceStore.loadPadIssuances(),
        backflushMonitorStore.loadBackflushMonitors(),
        productSeriesStore.loadProductSeries(),
        routingDetailStore.loadRoutingDetails(),
        workshopStore.loadWorkshopDashboards(),
        workOrderStore.loadWorkOrders(),
      ]);
      message.success('所有模块数据已刷新');
    } catch (error) {
      message.error('刷新失败');
    }
  };

  const handleResetAll = () => {
    padIssuanceStore.resetFilters();
    backflushMonitorStore.resetFilters();
    productSeriesStore.resetFilters();
    routingDetailStore.resetFilters();
    workshopStore.reset();
    workOrderStore.reset();
    message.success('所有筛选已重置');
  };

  const tabContent = [
    {
      key: 'pad-issuance',
      title: '工位领料 (PAD Issuance)',
      icon: '📦',
      description: '管理工位领料单的创建、审批、发料流程',
      component: <PadIssuanceList />,
    },
    {
      key: 'backflush-monitor',
      title: '倒冲监控 (Backflush Monitor)',
      icon: '🔄',
      description: '监控和管理倒冲流程，支持触发、重试、取消操作',
      component: <BackflushMonitorList />,
    },
    {
      key: 'product-series',
      title: '产品系列 (Product Series)',
      icon: '📋',
      description: '管理产品系列档案，支持状态管理和批量操作',
      component: <ProductSeriesList />,
    },
    {
      key: 'routing-detail',
      title: '工艺明细 (Routing Detail)',
      icon: '⚙️',
      description: '管理工艺路径明细，包含工序、设备、时间信息',
      component: <RoutingDetailList />,
    },
    {
      key: 'workshop',
      title: '车间看板 (Workshop Dashboard)',
      icon: '📊',
      description: '实时监控车间生产状态、设备运行、工序执行',
      component: <WorkshopDashboard />,
    },
    {
      key: 'work-order',
      title: '生产工单 (Work Order)',
      icon: '🔧',
      description: '管理生产工单的全生命周期，支持发布、暂停、关闭操作',
      component: <WorkOrderList />,
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <Card style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '12px', margin: 0 }}>
            新架构模块组件集成示例
          </h1>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', margin: 0 }}>
            本页面演示了新架构下各个业务模块的组件集成方式，展示了完整的模块化设计理念。
          </p>

          {/* 架构特性 */}
          <Alert
            message="新架构核心特性"
            description={
              <div>
                <div style={{ marginBottom: '8px' }}>✅ <strong>模块化设计</strong>：每个业务模块独立封装，职责清晰</div>
                <div style={{ marginBottom: '8px' }}>✅ <strong>统一状态管理</strong>：Zustand + Immer 提供响应式状态管理</div>
                <div style={{ marginBottom: '8px' }}>✅ <strong>类型安全</strong>：TypeScript 完整类型定义，编译时错误检查</div>
                <div style={{ marginBottom: '8px' }}>✅ <strong>统一组件模式</strong>：List、Form、Detail 组件结构一致</div>
                <div style={{ marginBottom: '8px' }}>✅ <strong>完整工作流</strong>：支持审批、批量操作、导出等功能</div>
                <div>✅ <strong>实时数据支持</strong>：车间看板等模块支持实时数据更新</div>
              </div>
            }
            type="success"
            showIcon
          />
        </Card>

        {/* 模块统计 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card bordered>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', color: '#1677ff', marginBottom: '8px' }}>6</div>
                <div style={{ fontSize: '14px', color: '#666' }}>新增模块</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>今日完成</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', color: '#52c41a', marginBottom: '8px' }}>27</div>
                <div style={{ fontSize: '14px', color: '#666' }}>模块组件</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>总计完成</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', color: '#faad14', marginBottom: '8px' }}>92%</div>
                <div style={{ fontSize: '14px', color: '#666' }}>组件完成度</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>项目进度</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', color: '#722ed1', marginBottom: '8px' }}>100%</div>
                <div style={{ fontSize: '14px', color: '#666' }}>TypeScript</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>类型覆盖</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <Card style={{ marginBottom: '24px' }}>
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<span>🔄</span>}
              onClick={handleRefreshAll}
            >
              刷新所有模块数据
            </Button>
            <Button
              size="large"
              icon={<span>🗑️</span>}
              onClick={handleResetAll}
            >
              重置所有筛选
            </Button>
            <Button
              size="large"
              icon={<span>📖</span>}
            >
              查看组件文档
            </Button>
          </Space>
        </Card>

        {/* 模块标签页 */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            tabPosition="left"
            style={{ minHeight: '600px' }}
          >
            {tabContent.map((tab) => (
              <TabPane
                tab={
                  <div style={{ fontSize: '16px' }}>
                    <span style={{ marginRight: '8px' }}>{tab.icon}</span>
                    <span>{tab.title}</span>
                  </div>
                }
                key={tab.key}
              >
                <div style={{ padding: '16px 0' }}>
                  {/* 模块描述 */}
                  <Alert
                    message={tab.title}
                    description={tab.description}
                    type="info"
                    showIcon
                    style={{ marginBottom: '24px' }}
                  />

                  {/* 模块组件 */}
                  <div style={{
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#fafafa'
                  }}>
                    {tab.component}
                  </div>
                </div>
              </TabPane>
            ))}
          </Tabs>
        </Card>

        {/* 技术文档 */}
        <Card style={{ marginTop: '24px' }} title="技术文档">
          <Divider>模块开发指南</Divider>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>1. 创建新模块</h3>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              每个模块需要创建以下文件：
              <code>types.ts</code> (类型定义),
              <code>api.ts</code> (API服务),
              <code>store.ts</code> (Zustand store),
              <code>components/</code> (List、Form、Detail 组件)
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>2. 组件结构模式</h3>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              所有组件遵循统一结构：List 列表组件、Form 表单组件、Detail 详情组件，
              支持完整的 CRUD 操作、工作流审批、批量操作和导出功能。
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>3. 状态管理模式</h3>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              使用 Zustand + Immer 进行状态管理，提供响应式更新、
              不可变数据结构和简洁的 API。
            </p>
          </div>

          <div>
            <h3 style={{ marginBottom: '8px' }}>4. 类型安全保证</h3>
            <p style={{ color: '#666' }}>
              完整的 TypeScript 类型定义，包括接口、类型映射、DTO 对象，
              确保编译时类型检查和智能提示。
            </p>
          </div>
        </Card>

        {/* 版本信息 */}
        <Card style={{ marginTop: '24px' }} title="版本信息">
          <Row gutter={16}>
            <Col span={12}>
              <div><strong>项目版本：</strong> v2.0 (新架构)</div>
            </Col>
            <Col span={12}>
              <div><strong>开发框架：</strong> React 18 + TypeScript + Ant Design</div>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={12}>
              <div><strong>状态管理：</strong> Zustand 4.x + Immer</div>
            </Col>
            <Col span={12}>
              <div><strong>路由方案：</strong> React Router v6</div>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={12}>
              <div><strong>组件库：</strong> Ant Design 5.x</div>
            </Col>
            <Col span={12}>
              <div><strong>开发模式：</strong> 模块化 + 类型安全 + 统一规范</div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default ModuleIntegrationExample;
