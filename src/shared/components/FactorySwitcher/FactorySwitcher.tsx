/**
 * 工厂切换器组件
 * 支持用户在多个工厂之间快速切换
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Select, Modal, Card, Space, Tag, Button, Tooltip, Descriptions } from 'antd';
import { SwapOutlined, CheckCircleOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';

// 导入工厂相关
import { useFactoryStore, hasMultiFactoryAccess, getCurrentFactory, getCurrentFactoryId, formatFactoryInfo, getFactoryTimeZone, getFactoryCurrency } from '../../../stores/factoryStore';

/**
 * 工厂选择器组件Props
 */
export interface FactorySwitcherProps {
  showIcon?: boolean; // 是否显示图标
  showCurrency?: boolean; // 是否显示货币
  showTimeZone?: boolean; // 是否显示时区
  compact?: boolean; // 紧凑模式
  position?: 'top-right' | 'top-left' | 'bottom-right'; // 显示位置
}

/**
 * FactorySwitcher组件
 */
function FactorySwitcher({
  showIcon = true,
  showCurrency = false,
  showTimeZone = false,
  compact = false,
  position = 'top-right',
}: FactorySwitcherProps) {
  const {
    currentFactoryId,
    currentFactory,
    factories,
    setCurrentFactoryId,
    switchFactory,
  } = useFactoryStore();
  const switchPending = false;

  const [modalVisible, setModalVisible] = useState(false);

  // 检查是否有多工厂
  const hasMultipleFactories = factories.length > 1;

  // 打开切换弹窗
  const handleOpenSwitchModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  // 关闭切换弹窗
  const handleCloseSwitchModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // 切换工厂
  const handleSwitchFactory = useCallback(async (factoryId: string) => {
    await switchFactory(factoryId);
    handleCloseSwitchModal();
  }, [switchFactory]);

  // 打开设置弹窗
  const handleOpenSettings = useCallback(() => {
    setModalVisible(true);
  }, []);

  // 工厂选项
  const factoryOptions = factories.map(factory => ({
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
        <Space>
          {showIcon && <CheckCircleOutlined style={{ color: factory.id === currentFactoryId ? '#52c41a' : '#d9d9d9', fontSize: 16 }} />}
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: factory.id === currentFactoryId ? '#52c41a' : '#262626' }}>
              {factory.name}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              {factory.code}
            </div>
            <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>
              {factory.description || '无描述'}
            </div>
          </div>
        </Space>
        {currentFactoryId === factory.id && (
          <Tag color="green" style={{ marginLeft: 8 }}>
            当前
          </Tag>
        )}
      </div>
    ),
    value: factory.id,
    key: factory.id,
  }));

  return (
    <>
      {/* 紧凑模式 - 只显示选择器 */}
      {compact && hasMultipleFactories && (
        <Select
          value={currentFactoryId}
          onChange={setCurrentFactoryId}
          options={factoryOptions}
          style={{ minWidth: 200 }}
          suffixIcon={<SwapOutlined />}
          disabled={switchPending}
          loading={switchPending}
        />
      )}

      {/* 完整模式 - 显示工厂信息 */}
      {!compact && (
        <>
          {/* 工厂切换器 */}
          {hasMultipleFactories && (
            <div
              style={{
                [`${position}`]: {
                  position: 'absolute',
                  top: position.includes('top') ? 16 : undefined,
                  bottom: position.includes('bottom') ? 16 : undefined,
                  left: position.includes('left') ? 16 : undefined,
                  right: position.includes('right') ? 16 : undefined,
                  zIndex: 1000,
                },
              }}
            >
              {/* 当前工厂信息 */}
              <Card
                size="small"
                hoverable
                onClick={hasMultipleFactories ? handleOpenSwitchModal : undefined}
                style={{
                  minWidth: 300,
                  cursor: hasMultipleFactories ? 'pointer' : 'default',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                bodyStyle={{ padding: '12px 16px' }}
              >
                <Space direction="vertical" size="small">
                  <Space>
                    {showIcon && <SwapOutlined style={{ color: '#1890ff' }} />}
                    <span style={{ fontWeight: 500, fontSize: 16 }}>
                      {currentFactory?.name || '未选择工厂'}
                    </span>
                  </Space>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {currentFactory?.code || '---'}
                  </span>
                  {showCurrency && currentFactory && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {currentFactory.currency}
                    </Tag>
                  )}
                  {showTimeZone && currentFactory && (
                    <Tooltip title={currentFactory.timeZone}>
                      <Tag style={{ marginLeft: 8 }}>
                        {currentFactory.timeZone.split('/')[0]}
                      </Tag>
                    </Tooltip>
                  )}
                </Space>
              </Card>
            </div>
          )}

          {/* 工厂切换弹窗 */}
          {hasMultipleFactories && (
            <Modal
              title="选择工厂"
              open={modalVisible}
              onCancel={handleCloseSwitchModal}
              width={600}
              footer={null}
            >
              <div style={{ padding: '8px 0' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {factoryOptions.map(option => (
                    <Card
                      key={option.key}
                      hoverable
                      onClick={() => handleSwitchFactory(option.value)}
                      style={{
                        cursor: 'pointer',
                        marginBottom: 12,
                        border: option.value === currentFactoryId ? '2px solid #52c41a' : '1px solid #f0f0f0',
                      }}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            {showIcon && <SwapOutlined style={{ color: '#1890ff' }} />}
                            <span style={{ fontWeight: 500, fontSize: 16, color: '#262626' }}>
                              {option.label.props.children}
                            </span>
                          </Space>
                          {option.value === currentFactoryId && (
                            <Tag color="green">当前工厂</Tag>
                          )}
                        </Space>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleSwitchFactory(option.value)}
                          disabled={option.value === currentFactoryId || switchPending}
                          loading={switchPending && option.value === currentFactoryId}
                        >
                          切换
                        </Button>
                      </Space>
                      {option.value === currentFactoryId && currentFactory && (
                        <>
                          <Descriptions
                            column={2}
                            size="small"
                            style={{ marginTop: 12, fontSize: 12 }}
                          >
                            <Descriptions.Item label="工厂代码">
                              <Tag>{currentFactory.code}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="时区">
                              <Tooltip title={currentFactory.timeZone}>
                                {currentFactory.timeZone.split('/')[0]}
                              </Tooltip>
                            </Descriptions.Item>
                            {showCurrency && (
                              <Descriptions.Item label="货币">
                                <Tag color="blue">{currentFactory.currency}</Tag>
                              </Descriptions.Item>
                            )}
                            {currentFactory.description && (
                              <Descriptions.Item label="描述" span={2}>
                                {currentFactory.description}
                              </Descriptions.Item>
                            )}
                            {currentFactory.contact && (
                              <Descriptions.Item label="联系方式">
                                {currentFactory.contact}
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </>
                      )}
                  </Card>
                ))}
                </Space>
              </div>
            </Modal>
          )}
        </>
      )}

      {/* 单工厂模式 - 只显示信息 */}
      {!hasMultipleFactories && currentFactory && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Tooltip
            title={
              <Space direction="vertical" size="small">
                <div>工厂名称：{currentFactory.name}</div>
                <div>工厂代码：{currentFactory.code}</div>
                <div>时区：{currentFactory.timeZone}</div>
                {showCurrency && <div>货币：{currentFactory.currency}</div>}
              </Space>
            }
          >
            <Tag
              color="blue"
              icon={<InfoCircleOutlined />}
              style={{ cursor: 'help' }}
            >
              {currentFactory.name}
            </Tag>
          </Tooltip>
        </div>
      )}
    </>
  );
}

export default FactorySwitcher;