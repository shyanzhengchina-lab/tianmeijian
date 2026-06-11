/**
 * 工厂选择器组件 - 用于主布局中快速切换工厂
 */

import React, { useEffect, useState } from 'react';
import { Select, Badge, Tooltip, Space } from 'antd';
import {
  BankOutlined,
  SwapOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';
import { useFactoryStore } from '../store';
import type { FactoryConfig } from '../types';
import { FACTORY_STATUS_MAP } from '../types';

const { Option } = Select;

interface FactorySelectorProps {
  compact?: boolean; // 紧凑模式
  showStats?: boolean; // 是否显示统计信息
}

const FactorySelector: React.FC<FactorySelectorProps> = ({
  compact = false,
  showStats = false,
}) => {
  const {
    currentFactoryId,
    availableFactories,
    switchFactory,
    loadFactories,
  } = useFactoryStore();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadFactories();
  }, [loadFactories]);

  const handleChange = async (factoryId: string) => {
    if (factoryId !== currentFactoryId) {
      await switchFactory(factoryId);
      // 刷新页面以重新加载数据
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  const currentFactory = availableFactories.find(f => f.id === currentFactoryId);

  const renderFactoryOption = (factory: FactoryConfig) => {
    const isActive = factory.id === currentFactoryId;
    const statusInfo = FACTORY_STATUS_MAP[factory.status] ?? { bg: 'default', color: '#aaa', border: '#d9d9d9', label: String(factory.status ?? '-') };

    return (
      <Option key={factory.id} value={factory.id}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <BankOutlined />
            <span>
              <strong>{factory.name}</strong>
              {factory.nameEn && (
                <span style={{ color: '#999', marginLeft: 8 }}>
                  ({factory.nameEn})
                </span>
              )}
            </span>
            {isActive && (
              <Badge status="success" text="当前" style={{ marginLeft: 8 }} />
            )}
          </Space>
          <Space size="small">
            <Tooltip title={`时区：${factory.timezone}`}>
              <ClockCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
            <Tooltip title={`货币：${factory.currency}`}>
              <DollarCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
            {factory.status === 'INACTIVE' && (
              <span style={{ color: statusInfo.color }}>
                ({statusInfo.label})
              </span>
            )}
          </Space>
        </div>
      </Option>
    );
  };

  if (compact) {
    // 紧凑模式：只显示下拉框
    return (
      <Select
        value={currentFactoryId}
        onChange={handleChange}
        style={{ width: 200 }}
        placeholder="选择工厂"
        loading={!availableFactories.length}
        suffixIcon={<SwapOutlined />}
      >
        {availableFactories.map(renderFactoryOption)}
      </Select>
    );
  }

  // 完整模式：显示当前工厂信息和下拉切换
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* 当前工厂信息 */}
      {currentFactory && (
        <Tooltip title={
          <div>
            <div>国家：{currentFactory.country}</div>
            <div>时区：{currentFactory.timezone}</div>
            <div>货币：{currentFactory.currency}</div>
            <div>语言：{currentFactory.language}</div>
          </div>
        }>
          <Space
            style={{
              padding: '6px 12px',
              background: '#f0f5ff',
              border: '1px solid #d6e4ff',
              borderRadius: 6,
              cursor: 'pointer',
            }}
            onClick={() => setOpen(!open)}
          >
            <BankOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                {currentFactory.name}
              </span>
              {currentFactory.nameEn && (
                <span style={{ fontSize: 12, color: '#999' }}>
                  {currentFactory.nameEn}
                </span>
              )}
            </div>
          </Space>
        </Tooltip>
      )}

      {/* 工厂下拉选择器 */}
      <Select
        value={currentFactoryId}
        onChange={handleChange}
        style={{ width: 180 }}
        placeholder="切换工厂"
        loading={!availableFactories.length}
        open={open}
        onDropdownVisibleChange={setOpen}
        suffixIcon={<SwapOutlined />}
        dropdownRender={(menu) => (
          <div>
            {menu}
            {showStats && availableFactories.length > 1 && (
              <div
                style={{
                  padding: '8px 12px',
                  borderTop: '1px solid #f0f0f0',
                  color: '#999',
                  fontSize: 12,
                }}
              >
                共 {availableFactories.length} 个可用工厂
              </div>
            )}
          </div>
        )}
      >
        {availableFactories.map(renderFactoryOption)}
      </Select>
    </div>
  );
};

export default FactorySelector;