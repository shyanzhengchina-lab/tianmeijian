/**
 * 工厂切换组件
 * 提供多工厂环境下的快速切换功能
 */

import React, { useEffect, useState } from 'react';
import {
  Button,
  Dropdown,
  Menu,
  Modal,
  Space,
  Tag,
  Typography,
  Avatar,
  Divider,
  List,
  Card,
  Statistic,
  Row,
  Col,
  Tooltip,
  message,
} from 'antd';
import {
  SwapOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useFactoryStore, hasMultiFactoryAccess, formatFactoryInfo } from '@/stores/factoryStore';
import { useFactoryInfo } from '../../../../shared/hooks/useFactoryData';
import './styles.css';

const { Text, Paragraph } = Typography;

/**
 * 工厂切换组件Props
 */
export interface FactorySwitcherProps {
  /**
   * 是否显示工厂统计信息
   */
  showStats?: boolean;

  /**
   * 自定义样式
   */
  className?: string;

  /**
   * 切换前回调
   */
  onBeforeSwitch?: (factoryId: string) => boolean | Promise<boolean>;

  /**
   * 切换后回调
   */
  onAfterSwitch?: (factoryId: string) => void;
}

/**
 * 工厂切换组件
 */
const FactorySwitcher: React.FC<FactorySwitcherProps> = ({
  showStats = false,
  className,
  onBeforeSwitch,
  onAfterSwitch,
}) => {
  const {
    currentFactoryId,
    currentFactory,
    factories,
    switchFactory,
    switchPending,
  } = useFactoryStore();

  const {
    factoryName,
    factoryCode,
    timeZone,
    currency,
    hasMultiple,
  } = useFactoryInfo();

  const [switchModalVisible, setSwitchModalVisible] = useState(false);

  /**
   * 处理工厂切换
   */
  const handleSwitchFactory = async (factoryId: string) => {
    try {
      // 切换前检查
      if (onBeforeSwitch) {
        const canSwitch = await onBeforeSwitch(factoryId);
        if (!canSwitch) {
          return;
        }
      }

      // 执行切换
      await switchFactory(factoryId);

      // 切换后回调
      if (onAfterSwitch) {
        onAfterSwitch(factoryId);
      }

      setSwitchModalVisible(false);
    } catch (error) {
      console.error('切换工厂失败:', error);
      message.error('切换工厂失败');
    }
  };

  /**
   * 工厂菜单内容
   */
  const factoryMenuContent = (
    <Menu
      style={{ minWidth: 300 }}
      selectedKeys={[currentFactoryId]}
    >
      <Menu.ItemGroup title="选择工厂">
        {factories.map((factory) => (
          <Menu.Item
            key={factory.id}
            onClick={() => handleSwitchFactory(factory.id)}
            disabled={factory.id === currentFactoryId || !factory.isActive}
          >
            <div className="factory-menu-item">
              <Space>
                {factory.id === currentFactoryId && (
                  <CheckOutlined style={{ color: '#52c41a' }} />
                )}
                <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                  {factory.name.charAt(0)}
                </Avatar>
                <div className="factory-info">
                  <div className="factory-name">{factory.name}</div>
                  <div className="factory-code">{factory.code}</div>
                </div>
                {!factory.isActive && (
                  <Tag color="default">停用</Tag>
                )}
              </Space>
            </div>
          </Menu.Item>
        ))}
      </Menu.ItemGroup>

      <Divider style={{ margin: '8px 0' }} />

      <Menu.Item
        key="manage"
        icon={<ThunderboltOutlined />}
        onClick={() => {
          // TODO: 跳转到工厂管理页面
          message.info('跳转到工厂管理页面');
        }}
      >
        工厂管理
      </Menu.Item>
    </Menu>
  );

  /**
   * 工厂统计信息卡片
   */
  const FactoryStatsCard: React.FC = () => {
    // TODO: 从API获取真实的统计数据
    const mockStats = {
      workshopCount: 12,
      workCenterCount: 45,
      employeeCount: 320,
      productionOrderCount: 8,
    };

    return (
      <Card
        title={
          <Space>
            <CheckOutlined style={{ color: '#52c41a' }} />
            当前工厂信息
          </Space>
        }
        size="small"
        className="factory-stats-card"
      >
        <div className="factory-header">
          <Space size="large">
            <div>
              <div className="factory-label">工厂名称</div>
              <Text strong style={{ fontSize: 16 }}>
                {currentFactory?.name}
              </Text>
            </div>
            <div>
              <div className="factory-label">工厂编码</div>
              <Text code style={{ fontSize: 14 }}>
                {currentFactory?.code}
              </Text>
            </div>
            <div>
              <div className="factory-label">状态</div>
              <Tag color={currentFactory?.isActive ? 'success' : 'default'}>
                {currentFactory?.isActive ? '正常' : '停用'}
              </Tag>
            </div>
          </Space>
        </div>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="车间数量"
              value={mockStats.workshopCount}
              prefix={<EnvironmentOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="工作中心"
              value={mockStats.workCenterCount}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="员工数量"
              value={mockStats.employeeCount}
              prefix={<GlobalOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="生产订单"
              value={mockStats.productionOrderCount}
              prefix={<DollarOutlined />}
            />
          </Col>
        </Row>

        <Divider />

        <div className="factory-config">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="config-item">
              <Text type="secondary">时区:</Text>
              <Text>{timeZone}</Text>
            </div>
            <div className="config-item">
              <Text type="secondary">货币:</Text>
              <Text>{currency}</Text>
            </div>
            {currentFactory?.description && (
              <div className="config-item">
                <Text type="secondary">描述:</Text>
                <Paragraph ellipsis={{ rows: 2 }}>
                  {currentFactory.description}
                </Paragraph>
              </div>
            )}
          </Space>
        </div>
      </Card>
    );
  };

  // 如果没有多工厂权限，不显示切换器
  if (!hasMultiple) {
    return (
      <div className={`factory-switcher ${className || ''}`}>
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
            {factoryName.charAt(0)}
          </Avatar>
          <Text strong>{factoryName}</Text>
          <Text type="secondary">({factoryCode})</Text>
        </Space>
      </div>
    );
  }

  return (
    <div className={`factory-switcher ${className || ''}`}>
      <Dropdown
        dropdownRender={() => factoryMenuContent}
        placement="bottomRight"
        trigger={['click']}
        disabled={switchPending}
      >
        <Button
          type="text"
          loading={switchPending}
          className="factory-switch-button"
        >
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
              {factoryName.charAt(0)}
            </Avatar>
            <Text strong>{factoryName}</Text>
            <Text type="secondary">({factoryCode})</Text>
            <SwapOutlined />
          </Space>
        </Button>
      </Dropdown>

      {/* 工厂详情弹窗 */}
      <Modal
        title={
          <Space>
            <EnvironmentOutlined />
            工厂详情
          </Space>
        }
        open={switchModalVisible}
        onCancel={() => setSwitchModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSwitchModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="switch"
            type="primary"
            icon={<SwapOutlined />}
            onClick={() => {
              setSwitchModalVisible(false);
              // 打开工厂选择器
            }}
          >
            切换工厂
          </Button>,
        ]}
        width={600}
      >
        <FactoryStatsCard />
      </Modal>
    </div>
  );
};

/**
 * 工厂信息栏组件
 */
export const FactoryInfoBar: React.FC<{
  showTime?: boolean;
  showStats?: boolean;
  onSwitch?: () => void;
}> = ({ showTime = true, showStats = false, onSwitch }) => {
  const { factoryName, factoryCode, timeZone } = useFactoryInfo();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="factory-info-bar">
      <Space split={<Divider type="vertical" />}>
        <Space>
          <EnvironmentOutlined style={{ color: '#1677ff' }} />
          <Text strong>{factoryName}</Text>
          <Text type="secondary">({factoryCode})</Text>
        </Space>

        {showTime && (
          <Space>
            <ClockCircleOutlined />
            <Text>{currentTime.toLocaleTimeString()}</Text>
            <Text type="secondary">({timeZone})</Text>
          </Space>
        )}

        {showStats && (
          <Button
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={onSwitch}
          >
            工厂统计
          </Button>
        )}
      </Space>
    </div>
  );
};

export default FactorySwitcher;
