/**
 * OrgSelector.tsx — 全局多组织切换器（放在顶栏）
 * 支持：集团总部 / 南京工厂 / 溧水工厂 切换
 * 切换后菜单数据按工厂过滤
 */
import React from 'react';
import { Select, Tag, Space, Tooltip } from 'antd';
import { BankOutlined, SwapOutlined } from '@ant-design/icons';
import { useOrgStore, FACTORY_LIST } from '../../store/orgStore';

const { Option } = Select;

interface Props {
  style?: React.CSSProperties;
  size?: 'small' | 'middle';
}

const OrgSelector: React.FC<Props> = ({ style, size = 'small' }) => {
  const { currentFactory, setFactory } = useOrgStore();

  const current = FACTORY_LIST.find(f => f.code === currentFactory);

  return (
    <Tooltip title="切换工厂/组织范围，切换后数据按所选工厂过滤">
      <Select
        value={currentFactory}
        onChange={setFactory}
        size={size}
        style={{ width: 175, ...style }}
        dropdownStyle={{ minWidth: 280 }}
        suffixIcon={<SwapOutlined style={{ color: current?.color ?? '#1677FF' }} />}
      >
        {FACTORY_LIST.map(f => (
          <Option key={f.code} value={f.code}>
            <Space size={6}>
              <BankOutlined style={{ color: f.color, fontSize: 13 }} />
              <span style={{
                fontWeight: 600,
                color: f.code === currentFactory ? f.color : '#333',
                fontSize: 12,
              }}>
                {f.shortName || f.name}
              </span>
              {f.code !== 'ALL' && (
                <Tag
                  style={{
                    fontSize: 10,
                    padding: '0 4px',
                    lineHeight: '16px',
                    background: f.bgColor,
                    color: f.color,
                    border: `1px solid ${f.color}40`,
                    margin: 0,
                  }}
                >
                  {f.city}
                </Tag>
              )}
            </Space>
          </Option>
        ))}
      </Select>
    </Tooltip>
  );
};

export default OrgSelector;
