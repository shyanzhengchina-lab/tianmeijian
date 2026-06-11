/**
 * 核心功能演示页面
 * 展示RBAC权限、多工厂管理、导出导入、实时推送等功能
 */

import React, { useState } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Tabs,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Tag,
  Table,
  Form,
  Input,
  Select,
  message,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

// 演示数据类型
interface DemoDataItem {
  id: string;
  code: string;
  name: string;
  spec: string;
  unit: string;
  price: number;
  status: string;
}
import {
  SecurityScanOutlined,
  SwapOutlined,
  DownloadOutlined,
  UploadOutlined,
  BellOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';

import PermissionManagement from '@/modules/system/permission/components/PermissionManagement';
import FactorySwitcher, { FactoryInfoBar } from '@/modules/system/factory/components/FactorySwitcher';
import RealTimeNotifier, {
  OnlineStatusIndicator,
  RealTimeStatsCard,
} from '@/shared/components/RealTimeNotifier';
import DataTableWithExportImport from '@/shared/components/DataTable/withExportImport';
import { usePermission } from '@/shared/hooks/usePermission';
import { useFactoryData } from '@/shared/hooks/useFactoryData';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

/**
 * 核心功能演示页面
 */
const CoreFeaturesDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // 权限Hook
  const { canView, canCreate, canUpdate, canDelete, hasPermission } = usePermission();

  // 工厂数据Hook
  const { getData, setData, addData } = useFactoryData<any>({
    module: 'demo',
    maxSize: 100,
    ttl: 5 * 60 * 1000,
  });

  // 模拟数据
  const demoData: DemoDataItem[] = [
    {
      id: '1',
      code: 'M001',
      name: '物料A',
      spec: '规格A',
      unit: '个',
      price: 100.00,
      status: '启用',
    },
    {
      id: '2',
      code: 'M002',
      name: '物料B',
      spec: '规格B',
      unit: '套',
      price: 200.00,
      status: '启用',
    },
  ];

  const columns: ColumnsType<DemoDataItem> = [
    { title: '物料编码', dataIndex: 'code', key: 'code' },
    { title: '物料名称', dataIndex: 'name', key: 'name' },
    { title: '规格型号', dataIndex: 'spec', key: 'spec' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    { title: '单价', dataIndex: 'price', key: 'price' },
    { title: '状态', dataIndex: 'status', key: 'status' },
  ];

  /**
   * 导入校验器
   */
  const importValidator = (data: any[]) => {
    return data.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!row['物料编码']) {
        errors.push('物料编码不能为空');
      }
      if (!row['物料名称']) {
        errors.push('物料名称不能为空');
      }
      if (row['单价'] && isNaN(parseFloat(row['单价']))) {
        errors.push('单价格式不正确');
      }
      if (!row['规格型号']) {
        warnings.push('建议填写规格型号');
      }

      return {
        row: index + 1,
        errors,
        warnings,
        data: row,
      };
    });
  };

  /**
   * 导入处理器
   */
  const handleImport = async (data: any[]) => {
    console.log('导入数据:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success(`成功导入 ${data.length} 条数据`);
    setData(data);
  };

  /**
   * 导入模板
   */
  const importTemplate = {
    '物料编码': 'M001',
    '物料名称': '示例物料',
    '规格型号': '规格A',
    '单位': '个',
    '单价': '100.00',
    '状态': '启用',
  };

  return (
    <Layout style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* 头部 */}
        <Card className="mb-4">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>MES核心功能演示</Title>
              <Text type="secondary">
                展示RBAC权限、多工厂管理、导出导入、实时推送等核心功能
              </Text>
            </Col>
            <Col>
              <Space>
                <FactorySwitcher showStats={true} />
                <RealTimeNotifier
                  autoConnect={true}
                  onNotificationClick={(notif) => {
                    console.log('通知点击:', notif);
                  }}
                  onConnectionChange={(connected) => {
                    console.log('连接状态:', connected);
                  }}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 功能概览 */}
        <Card className="mb-4">
          <Row gutter={16}>
            <Col span={6}>
              <RealTimeStatsCard
                title="今日产量"
                value={1250}
                prefix={<ThunderboltOutlined />}
                suffix="件"
                trend={{ value: 15, isUp: true }}
                loading={false}
              />
            </Col>
            <Col span={6}>
              <RealTimeStatsCard
                title="完成工单"
                value={45}
                prefix={<CheckCircleOutlined />}
                suffix="个"
                trend={{ value: 8, isUp: true }}
                loading={false}
              />
            </Col>
            <Col span={6}>
              <RealTimeStatsCard
                title="设备运行"
                value={32}
                prefix={<ThunderboltOutlined />}
                suffix="台"
                trend={{ value: 3, isUp: false }}
                loading={false}
              />
            </Col>
            <Col span={6}>
              <RealTimeStatsCard
                title="在线人员"
                value={28}
                prefix={<UserOutlined />}
                suffix="人"
                trend={{ value: 5, isUp: true }}
                loading={false}
              />
            </Col>
          </Row>
        </Card>

        {/* 工厂信息栏 */}
        <Card className="mb-4">
          <FactoryInfoBar showTime={true} showStats={true} />
        </Card>

        {/* 功能演示 */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 概览 */}
            <TabPane
              tab={
                <span>
                  <ThunderboltOutlined />
                  功能概览
                </span>
              }
              key="overview"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card
                    title={
                      <Space>
                        <SecurityScanOutlined style={{ color: '#1677ff' }} />
                        RBAC权限系统
                      </Space>
                    }
                    bordered={false}
                  >
                    <Paragraph>
                      提供菜单权限、按钮权限、数据权限的统一管理
                    </Paragraph>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Tag color="blue">菜单权限控制</Tag>
                      <Tag color="green">按钮权限控制</Tag>
                      <Tag color="orange">数据权限控制</Tag>
                      <Tag color="purple">角色管理</Tag>
                      <Tag color="red">用户角色分配</Tag>
                    </Space>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card
                    title={
                      <Space>
                        <SwapOutlined style={{ color: '#52c41a' }} />
                        多工厂管理
                      </Space>
                    }
                    bordered={false}
                  >
                    <Paragraph>
                      支持多工厂环境下的数据隔离和快速切换
                    </Paragraph>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Tag color="blue">工厂快速切换</Tag>
                      <Tag color="green">工厂数据隔离</Tag>
                      <Tag color="orange">工厂上下文管理</Tag>
                      <Tag color="purple">工厂统计信息</Tag>
                      <Tag color="red">工厂配置管理</Tag>
                    </Space>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card
                    title={
                      <Space>
                        <DownloadOutlined style={{ color: '#faad14' }} />
                        导出导入功能
                      </Space>
                    }
                    bordered={false}
                  >
                    <Paragraph>
                      支持Excel、CSV、PDF格式的数据导出导入
                    </Paragraph>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Tag color="blue">Excel导出</Tag>
                      <Tag color="green">CSV导出</Tag>
                      <Tag color="orange">Excel导入</Tag>
                      <Tag color="purple">数据校验</Tag>
                      <Tag color="red">错误处理</Tag>
                    </Space>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card
                    title={
                      <Space>
                        <BellOutlined style={{ color: '#eb2f96' }} />
                        实时数据推送
                      </Space>
                    }
                    bordered={false}
                  >
                    <Paragraph>
                      基于WebSocket的实时消息推送和状态监控
                    </Paragraph>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Tag color="blue">实时通知</Tag>
                      <Tag color="green">在线状态</Tag>
                      <Tag color="orange">设备监控</Tag>
                      <Tag color="purple">生产进度</Tag>
                      <Tag color="red">系统消息</Tag>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            {/* 权限管理 */}
            <TabPane
              tab={
                <span>
                  <SecurityScanOutlined />
                  权限管理
                </span>
              }
              key="permission"
            >
              <Alert
                message="权限管理演示"
                description="展示RBAC权限系统的完整功能，包括权限、角色、用户角色的管理"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <PermissionManagement />
            </TabPane>

            {/* 多工厂管理 */}
            <TabPane
              tab={
                <span>
                  <SwapOutlined />
                  多工厂管理
                </span>
              }
              key="factory"
            >
              <Alert
                message="多工厂管理演示"
                description="展示多工厂环境下的数据隔离、工厂切换、统计信息等功能"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={16}>
                <Col span={24}>
                  <Card title="工厂切换组件" className="mb-4">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>工厂切换器:</Text>
                      <FactorySwitcher showStats={true} />
                      <Divider />
                      <Text>工厂信息栏:</Text>
                      <FactoryInfoBar showTime={true} showStats={true} />
                    </Space>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            {/* 导出导入 */}
            <TabPane
              tab={
                <span>
                  <DownloadOutlined />
                  导出导入
                </span>
              }
              key="export"
            >
              <Alert
                message="导出导入演示"
                description="展示数据导出导入功能，包括Excel、CSV格式，以及导入校验和错误处理"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <DataTableWithExportImport
                data={demoData}
                columns={columns as any}
                enableExport={true}
                enableImport={true}
                exportFormats={['excel', 'csv']}
                exportFileName="物料清单"
                importValidator={importValidator}
                onImport={handleImport}
                importTemplate={importTemplate}
                rowKey="id"
                loading={false}
              />
            </TabPane>

            {/* 实时推送 */}
            <TabPane
              tab={
                <span>
                  <BellOutlined />
                  实时推送
                </span>
              }
              key="realtime"
            >
              <Alert
                message="实时推送演示"
                description="展示WebSocket实时通信功能，包括实时通知、在线状态、数据更新推送等"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={16}>
                <Col span={24}>
                  <Card title="实时通知组件" className="mb-4">
                    <Space>
                      <Text>点击上方铃铛图标查看通知</Text>
                      <RealTimeNotifier
                        autoConnect={true}
                        onNotificationClick={(notif) => {
                          console.log('通知点击:', notif);
                        }}
                      />
                    </Space>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card title="在线状态指示器" className="mb-4">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <OnlineStatusIndicator
                        userId="1"
                        userName="张三"
                        status="online"
                      />
                      <OnlineStatusIndicator
                        userId="2"
                        userName="李四"
                        status="busy"
                      />
                      <OnlineStatusIndicator
                        userId="3"
                        userName="王五"
                        status="away"
                      />
                      <OnlineStatusIndicator
                        userId="4"
                        userName="赵六"
                        status="offline"
                        lastSeen={Date.now() - 3600000}
                      />
                    </Space>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default CoreFeaturesDemo;
